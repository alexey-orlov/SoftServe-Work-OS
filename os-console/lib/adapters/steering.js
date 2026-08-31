// Steering adapter — the files that steer every agent session, in one flat list,
// with per-file population status, plus the feature index rendered as a readable
// structure. Derived from the write policy (gated tier + living-pages) and the
// canonical registries — this module is the ONE steering-file list the console
// uses (the Setup page's population set and the Library tiles derive from it).
import path from 'node:path';
import * as gitlib from '../gitlib.js';
import * as md from '../mdparse.js';
import * as miniyaml from '../miniyaml.js';
import * as policy from '../policy.js';
import * as repo from '../repo.js';
import { normalizeArtifactPath } from './initiatives.js';

const BC_DIR = 'product-development/product/strategy/business-context';
export const FEATURE_INDEX = 'product-development/feature-index.yaml';

const CORE = [
  { path: 'CLAUDE.md', role: 'Root steering — loads every session: fundamentals, doc index, the four rules' },
  { path: FEATURE_INDEX, role: 'The Product map — product areas, each folding its features (status, shipped)' },
  { path: 'product-development/toolchain.yaml', role: 'Tool/approach choices + live connections, one key per surface' },
  { path: '.claude/team-learnings.md', role: 'Cross-cutting agent rules — injected at every session start' },
  { path: 'governance/write-policy.yaml', role: 'The write policy itself — tiers list + auto-sync switchboard' },
];

// Population status is meaningful for prose steering files; registries (yaml)
// and the learnings file are complete by construction.
const NO_COMPLETION = new Set([FEATURE_INDEX, 'product-development/toolchain.yaml',
  'governance/write-policy.yaml', '.claude/team-learnings.md']);

/** done / partial / todo from placeholders + [GAP:] markers, or null where
 *  population is not the right lens. */
export function completion(rel, text) {
  if (NO_COMPLETION.has(rel) || !rel.endsWith('.md')) return { state: null, gaps: null, detail: '' };
  if (text === null || text === undefined) return { state: 'todo', gaps: null, detail: 'File is missing.' };
  let gaps;
  let detail;
  if (rel === 'CLAUDE.md') {
    const scope = md.section(text, 'Company & Product Fundamentals')
      + md.section(text, 'Team') + md.section(text, 'Slack Channels');
    gaps = md.placeholderCount(scope);
    detail = `${gaps} placeholders left in the fundamentals block, team roster and channels.`;
  } else {
    gaps = md.placeholderCount(text) + (text.match(/\[GAP:/g) || []).length;
    detail = `${gaps} placeholders / GAP markers left.`;
  }
  const state = gaps === 0 ? 'done' : gaps <= 10 ? 'partial' : 'todo';
  return { state, gaps, detail: gaps === 0 ? 'Populated — no placeholders left.' : detail };
}

export function row(rel, role, group, pol) {
  const text = repo.isTextPath(rel) ? repo.readTextOrNull(rel) : null;
  const meta = text ? md.metaLines(text) : {};
  // Some pages pack several _key:_ fields on one line — keep only the updated
  // value itself, capped, so displays can rely on it being short.
  let updated = null;
  if (meta.updated) {
    updated = meta.updated.split('·')[0].replace(/_+\s*$/, '').trim().slice(0, 26);
  }
  const comp = completion(rel, text);
  return {
    path: rel,
    exists: repo.exists(rel),
    title: text ? (md.firstHeading(text) || path.posix.basename(rel)) : path.posix.basename(rel),
    role: role || '',
    group,
    tier: policy.tierFor(rel, pol).tier,
    state: comp.state,
    gaps: comp.gaps,
    stateDetail: comp.detail,
    updatedHeader: updated,
    lastChange: repo.exists(rel) ? gitlib.lastChangeIso(rel) : null,
    lines: text ? text.split('\n').length : null,
  };
}

export function build() {
  const pol = policy.load();
  const rows = [];

  for (const c of CORE) rows.push(row(c.path, c.role, 'core', pol));

  let bcDescs;
  try {
    bcDescs = md.navDescriptions(BC_DIR);
  } catch {
    bcDescs = {};
  }
  try {
    for (const e of repo.listDir(BC_DIR)) {
      if (e.type !== 'file' || e.name === 'CLAUDE.md') continue;
      rows.push(row(e.rel, bcDescs[e.rel] || 'Business context', 'business', pol));
    }
  } catch { /* folder missing on a stripped install */ }

  const seen = new Set(rows.map((r) => r.path));
  for (const pattern of pol.livingPages) {
    for (const rel of repo.globFiles(pattern)) {
      if (seen.has(rel) || rel.endsWith('/CLAUDE.md')) continue;
      seen.add(rel);
      const isInitiative = rel.startsWith('product-development/product/initiatives/');
      rows.push(row(rel, isInitiative ? 'Initiative page (see Initiatives view)'
        : 'Living page — edit in place, keep current', 'living', pol));
    }
  }

  return { rows, steward: pol.steward, policyPath: policy.POLICY_PATH };
}

// ---------------------------------------------------------------- feature index

function indexArtifact(key, val, out) {
  if (Array.isArray(val)) {
    for (const v of val) indexArtifact(key, v, out);
    return;
  }
  if (val && typeof val === 'object') {
    for (const [k, v] of Object.entries(val)) indexArtifact(`${key} · ${k}`, v, out);
    return;
  }
  if (typeof val !== 'string' || !val.trim()) return;
  const v = val.trim();
  if (/^https?:/i.test(v)) {
    out.push({ key, kind: 'url', url: v });
  } else if (v.includes('/')) {
    const norm = normalizeArtifactPath(v) || v;
    out.push({ key, kind: 'file', path: norm, exists: repo.exists(norm) });
  } else {
    out.push({ key, kind: 'ref', text: v });
  }
}

/** feature-index.yaml as a readable structure, either shape.
 *  v2 catalog ({areas: {a: {features: {f: {status, shipped, …}}}}}): durable facts
 *  only — artifact rollups come from initiative pages (initiatives adapter).
 *  Legacy (area → feature → artifact rows): resolved rows + linked initiatives,
 *  kept readable forever for mid-migration instances (dual-read). */
export function featureIndex() {
  const text = repo.readTextOrNull(FEATURE_INDEX);
  if (text === null) return { exists: false, areas: [], path: FEATURE_INDEX };
  let doc;
  try {
    doc = miniyaml.load(text) || {};
  } catch {
    return { exists: true, areas: [], path: FEATURE_INDEX, parseError: true };
  }
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const areas = [];
  if (isObj(doc) && isObj(doc.areas)) {
    for (const [area, aspec] of Object.entries(doc.areas)) {
      if (!isObj(aspec)) continue;
      const features = [];
      const fdict = isObj(aspec.features) ? aspec.features : {};
      for (const [feature, rawSpec] of Object.entries(fdict)) {
        const spec = isObj(rawSpec) ? rawSpec : {};
        features.push({
          feature,
          catalog: {
            status: String(spec.status || ''),
            shipped: String(spec.shipped || '').slice(0, 10),
            name: String(spec.name || ''),
            description: String(spec.description || ''),
            figma: String(spec.figma || ''),
          },
          artifacts: [], initiatives: [], present: 0, total: 0,
        });
      }
      areas.push({
        area,
        name: String(aspec.name || ''),
        description: String(aspec.description || ''),
        features,
      });
    }
    return {
      exists: true, shape: 'catalog', areas, path: FEATURE_INDEX,
      lastChange: gitlib.lastChangeIso(FEATURE_INDEX),
    };
  }
  if (isObj(doc)) {
    for (const [area, feats] of Object.entries(doc)) {
      if (!isObj(feats)) continue;
      const features = [];
      for (const [feature, spec] of Object.entries(feats)) {
        if (!isObj(spec)) continue;
        const artifacts = [];
        const inits = Array.isArray(spec.initiatives) ? spec.initiatives : [];
        for (const [key, val] of Object.entries(spec)) {
          if (key === 'initiatives') continue;
          indexArtifact(key, val, artifacts);
        }
        features.push({
          feature,
          artifacts,
          initiatives: inits,
          present: artifacts.filter((a) => a.kind !== 'file' || a.exists).length,
          total: artifacts.length,
        });
      }
      if (features.length) areas.push({ area, features });
    }
  }
  return {
    exists: true, shape: 'legacy', areas, path: FEATURE_INDEX,
    lastChange: gitlib.lastChangeIso(FEATURE_INDEX),
  };
}

/** Everything the Steering view needs: the rows + the feature index block. */
export function pageData() {
  const out = build();
  out.featureIndex = featureIndex();
  return out;
}
