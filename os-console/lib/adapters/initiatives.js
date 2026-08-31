// Initiatives adapter — joins the living initiative pages with the product
// catalog (feature-index.yaml). The pages and the catalog stay canonical; this
// module only reads and does surgical line edits (status, attach, create) that
// a person would make by hand.
//
// Link Architecture v2: pages declare their targets in fenced YAML frontmatter
// (areas:/features: — link contract in governance/link-schema.yaml); the legacy
// `_target-feature(s): feature-index.yaml#a.b` anchor stays readable forever
// (dual-read — deployed instances converge gradually).
import path from 'node:path';
import * as gitlib from '../gitlib.js';
import * as md from '../mdparse.js';
import * as miniyaml from '../miniyaml.js';
import * as repo from '../repo.js';

export const DIR = 'product-development/product/initiatives';
const PD = 'product-development';
const TEMPLATE = 'product-development/product/handbook/templates/initiative-page-template.md';
const STATUS_ORDER = { active: 0, exploring: 1, paused: 2, shipped: 3, killed: 4 };
const UNKNOWN_RANK = 5; // unrecognized status: sorted last and flagged, never silently coerced

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const rank = (status) => (Object.prototype.hasOwnProperty.call(STATUS_ORDER, status)
  ? STATUS_ORDER[status] : UNKNOWN_RANK);
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** feature-index.yaml in either shape.
 *  New (v2 catalog): {areas: {a: {name, description, features: {f: {status, shipped, ...}}}}}
 *  Legacy: {a: {f: {artifact rows..., initiatives: [...]}}}
 *  Returns {shape: 'catalog'|'legacy'|'missing', areas: {...}, features: {slug: {area, ...facts}}}. */
export function catalog() {
  let fi;
  try {
    fi = miniyaml.load(repo.readText(`${PD}/feature-index.yaml`)) || {};
  } catch {
    return { shape: 'missing', areas: {}, features: {} };
  }
  if (!isObj(fi)) return { shape: 'missing', areas: {}, features: {} };
  const feats = {};
  if (isObj(fi.areas)) {
    for (const [a, aspec] of Object.entries(fi.areas)) {
      if (!isObj(aspec)) continue;
      const fdict = isObj(aspec.features) ? aspec.features : {};
      for (const [f, fspec] of Object.entries(fdict)) {
        feats[f] = isObj(fspec) ? { area: a, ...fspec } : { area: a };
      }
    }
    return { shape: 'catalog', areas: fi.areas, features: feats };
  }
  for (const [a, fdict] of Object.entries(fi)) {
    if (!isObj(fdict)) continue;
    for (const [f, spec] of Object.entries(fdict)) {
      if (isObj(spec)) feats[f] = { area: a };
    }
  }
  return { shape: 'legacy', areas: fi, features: feats };
}

export function normalizeArtifactPath(p) {
  if (!p || /^https?:/i.test(p)) return null;
  const clean = p.replace(/^\.\//, '');
  if (repo.exists(clean)) return clean;
  const inPd = `${PD}/${clean}`;
  return repo.exists(inPd) ? inPd : clean; // keep best guess; exists flag tells the truth
}

export function parseArtifactBullets(pageRel, body) {
  const out = [];
  for (const b of md.bullets(body)) {
    const label = b.split(':')[0].replace(/\*\*/g, '').trim();
    const idx = b.indexOf(':');
    const rest = b.slice(idx + 1).trim();
    const links = md.mdLinks(b);
    const pendings = md.pendingMarkers(b);
    if (!links.length && !pendings.length) {
      if (rest && rest !== '-' && rest !== '—') out.push({ label, kind: 'note', text: rest });
      continue;
    }
    for (const l of links) {
      if (/^https?:/i.test(l.href)) {
        out.push({ label, kind: 'url', text: l.label || l.href, url: l.href });
        continue;
      }
      const target = md.resolveHref(pageRel, l.href);
      if (target) out.push({ label, kind: 'file', path: target, exists: repo.exists(target) });
    }
    for (const p of pendings) {
      const norm = normalizeArtifactPath(p);
      out.push({ label, kind: 'pending', path: norm || p, exists: norm ? repo.exists(norm) : false });
    }
  }
  return out;
}

/** A template's bracketed guidance bullet, not real content: [Optional, ...] */
function isTemplatePlaceholder(b) {
  return b.startsWith('[') && !b.includes('](');
}

/** The ## Instructions section as plain text ('' when empty or still template). */
export function parseInstructions(body) {
  const text = (body || '').trim();
  if (!text || text === '-') return '';
  const bl = md.bullets(body);
  if (bl.length && bl.every((b) => isTemplatePlaceholder(b) || b === '-')) return '';
  return text.slice(0, 600);
}

/** Ordered source-of-truth entries — order IS priority (first wins on conflict). */
export function parseSources(rel, body) {
  const out = [];
  for (const b of md.bullets(body)) {
    if (b === '-' || b === '—' || isTemplatePlaceholder(b)) continue;
    let note = '';
    const links = md.mdLinks(b);
    if (links.length) {
      const l = links[0];
      const close = b.indexOf(')');
      const after = close >= 0 ? b.slice(close + 1) : '';
      const m = after.match(/—\s*(.+)$/);
      note = m ? m[1].trim() : '';
      if (/^https?:/i.test(l.href)) {
        out.push({ kind: 'url', label: l.label || l.href, href: l.href, note });
      } else {
        const target = md.resolveHref(rel, l.href);
        out.push({
          kind: 'path',
          label: l.label || path.posix.basename(target || l.href),
          href: target || l.href,
          note,
          exists: target ? repo.exists(target) : false,
        });
      }
    } else {
      const m = b.match(/^(.*?)(?:\s+—\s*(.+))?$/);
      const token = (m ? m[1] : b).trim();
      note = m ? (m[2] || '').trim() : '';
      if (/^https?:/i.test(token)) {
        out.push({ kind: 'url', label: token, href: token, note });
      } else if (repo.exists(token)) {
        out.push({ kind: 'path', label: path.posix.basename(token), href: token, note, exists: true });
      } else {
        out.push({ kind: 'text', label: token, href: '', note });
      }
    }
  }
  return out;
}

export function featureIndexJoin() {
  const index = {}; // slug -> [{area, feature, artifacts: []}]
  let fi;
  try {
    fi = miniyaml.load(repo.readText(`${PD}/feature-index.yaml`)) || {};
  } catch {
    return index;
  }
  if (!isObj(fi)) return index;
  for (const [area, feats] of Object.entries(fi)) {
    if (!isObj(feats)) continue;
    for (const [feature, spec] of Object.entries(feats)) {
      if (!isObj(spec)) continue;
      const inits = Array.isArray(spec.initiatives) ? spec.initiatives : [];
      if (!inits.length) continue;
      const artifacts = [];

      const push = (v, key, subkey) => {
        if (typeof v !== 'string') return;
        if (/^https?:/i.test(v)) {
          artifacts.push({ key: subkey || key, kind: 'url', url: v });
        } else if (v.includes('/')) {
          const norm = normalizeArtifactPath(v);
          artifacts.push({ key: subkey || key, kind: 'file', path: norm, exists: repo.exists(norm) });
        } else {
          artifacts.push({ key: subkey || key, kind: 'ref', text: v });
        }
      };

      for (const [key, val] of Object.entries(spec)) {
        if (key === 'initiatives') continue;
        if (Array.isArray(val)) {
          for (const v of val) push(v, key);
        } else if (isObj(val)) {
          for (const [k, v] of Object.entries(val)) push(v, key, `${key} · ${k}`);
        } else {
          push(val, key);
        }
      }
      for (const slug of inits) {
        if (!index[slug]) index[slug] = [];
        index[slug].push({ area, feature, artifacts });
      }
    }
  }
  return index;
}

export function parsePage(rel) {
  const text = repo.readText(rel);
  const base = path.posix.basename(rel);
  const slug = rel.endsWith('.md') ? base.slice(0, -3) : base;
  const meta = md.pageMeta(text);
  const fm = md.frontmatter(text);
  const title = md.firstHeading(text) || slug;
  let statusWord;
  let statusText;
  if (Object.keys(fm).length) {
    statusWord = String(meta.status || '').trim().toLowerCase();
    const note = String(meta.note || '').trim();
    statusText = statusWord + (note ? ` — ${note}` : '');
  } else {
    statusText = String(meta.status || '');
    const parts = statusText.split(/[\s—-]/);
    statusWord = (parts.length && parts[0] ? parts[0] : '').toLowerCase();
  }
  const statusKnown = Object.prototype.hasOwnProperty.call(STATUS_ORDER, statusWord);
  let targets = [];
  for (const f of (Array.isArray(fm.features) ? fm.features : [])) {
    targets.push({ kind: 'feature', area: '', feature: String(f) });
  }
  for (const a of (Array.isArray(fm.areas) ? fm.areas : [])) {
    targets.push({ kind: 'area', area: String(a), feature: '' });
  }
  if (!targets.length) { // legacy anchor form — readable forever (dual-read)
    targets = [...text.slice(0, 1500).matchAll(/feature-index\.yaml#([a-z0-9_-]+)\.([a-z0-9_-]+)/gi)]
      .map((m) => ({ kind: 'feature', area: m[1], feature: m[2] }));
  }
  const artifacts = parseArtifactBullets(rel, md.section(text, 'Artifacts'));
  const decisions = [];
  for (const b of md.bullets(md.section(text, 'Decisions'))) {
    const links = [];
    for (const l of md.mdLinks(b)) {
      const p = md.resolveHref(rel, l.href);
      if (p) links.push({ label: l.label, path: p });
    }
    decisions.push({ text: b, links });
  }
  return {
    slug,
    rel,
    title,
    isExample: /^EXAMPLE/i.test(title) || text.includes('Synthetic worked example'),
    // status coercion kept ONLY for grouping back-compat; statusKnown/statusRaw
    // carry the truth — the view flags unknown statuses instead of hiding them.
    status: statusKnown ? statusWord : 'active',
    statusKnown,
    statusRaw: statusWord,
    statusText,
    // An empty `updated:` in the frontmatter reads as absent, not as a value —
    // the date display and the sort below both want '' rather than a stand-in.
    updated: String(meta.updated || '').slice(0, 10),
    owner: String(meta.owner || ''),
    targets,
    snapshot: md.section(text, 'Snapshot').trim(),
    scope: md.section(text, 'Scope & goal').trim(),
    instructions: parseInstructions(md.section(text, 'Instructions')),
    sources: parseSources(rel, md.section(text, 'Sources')),
    artifacts,
    decisions,
    openLoops: md.bullets(md.section(text, 'Open loops')).filter((b) => b !== '-'),
    activity: md.bullets(md.section(text, 'Activity')).slice(0, 12),
    artifactStats: {
      present: artifacts.filter((a) => (a.kind === 'file' || a.kind === 'pending') && a.exists).length,
      missing: artifacts.filter((a) => (a.kind === 'file' || a.kind === 'pending') && !a.exists).length,
    },
  };
}

function stubPage(rel, error) {
  const slug = path.posix.basename(rel).slice(0, -3);
  return {
    slug, rel, title: slug, isExample: false,
    status: 'unknown', statusKnown: false, statusRaw: 'unknown',
    statusText: '', updated: '', owner: '', targets: [],
    snapshot: '', scope: '', instructions: '', sources: [],
    artifacts: [], decisions: [], openLoops: [], activity: [],
    artifactStats: { present: 0, missing: 0 }, features: [],
    parseError: String(error && error.message ? error.message : error).slice(0, 200),
  };
}

export function listPages() {
  const cat = catalog();
  const legacyJoin = cat.shape === 'legacy' ? featureIndexJoin() : {};
  const items = [];
  for (const e of repo.listDir(DIR)) {
    if (e.type !== 'file' || !e.name.endsWith('.md') || e.name === 'CLAUDE.md') continue;
    let page;
    try {
      page = parsePage(e.rel);
    } catch (ex) {
      // a broken page stays VISIBLE — silent drops hid real damage
      items.push(stubPage(e.rel, ex));
      continue;
    }
    if (cat.shape === 'catalog') {
      const feats = [];
      for (const t of page.targets) {
        if (t.feature && Object.prototype.hasOwnProperty.call(cat.features, t.feature)) {
          const cf = cat.features[t.feature];
          const catalogFacts = {};
          for (const [k, v] of Object.entries(cf)) {
            if (k === 'area') continue;
            catalogFacts[k] = k === 'shipped' ? String(v || '').slice(0, 10) : v;
          }
          feats.push({ area: cf.area || '', feature: t.feature, catalog: catalogFacts, artifacts: [] });
        } else if (t.feature) {
          feats.push({ area: t.area || '', feature: t.feature, catalog: {}, unknownSlug: true, artifacts: [] });
        } else if (t.area) {
          feats.push({
            area: t.area, feature: '', catalog: {}, artifacts: [],
            unknownSlug: !Object.prototype.hasOwnProperty.call(cat.areas || {}, t.area),
          });
        }
      }
      page.features = feats;
    } else {
      page.features = legacyJoin[page.slug] || [];
    }
    items.push(page);
  }
  items.sort((a, b) => cmp(String(b.updated || ''), String(a.updated || '')));
  items.sort((a, b) => rank(a.status) - rank(b.status));
  return items;
}

/** path -> [initiative slugs] — lets the file viewer say "linked from initiative X". */
export function reverseIndex() {
  const out = {};
  for (const it of listPages()) {
    const paths = new Set();
    for (const a of it.artifacts) if (a.path) paths.add(a.path);
    for (const d of it.decisions) for (const l of d.links) paths.add(l.path);
    for (const f of it.features || []) {
      for (const a of f.artifacts) if (a.path) paths.add(a.path);
    }
    for (const p of paths) {
      if (!out[p]) out[p] = [];
      out[p].push(it.slug);
    }
  }
  return out;
}

export function replaceMetaLine(text, key, newLine) {
  const pattern = new RegExp(`^_${repo.reEscape(key)}:.*$`, 'm');
  if (pattern.test(text)) return text.replace(pattern, () => newLine);
  return text;
}

/** Set/replace/remove one key inside the frontmatter fence. value null/'' removes;
 *  a value starting with '[' is written raw (a YAML list); strings with spaces are quoted. */
function fmSet(text, key, value) {
  const lines = text.split('\n');
  if (!lines.length || lines[0].trim() !== '---') return text;
  let end = -1;
  for (let i = 1; i < Math.min(lines.length, 60); i++) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) return text;
  let newLine;
  if (value === null || value === undefined || value === '') {
    newLine = null;
  } else if (typeof value === 'string' && value.startsWith('[')) {
    newLine = `${key}: ${value}`;
  } else if (typeof value === 'string' && /[\s:#"—]/.test(value)) {
    newLine = `${key}: "${value.replace(/"/g, "'")}"`;
  } else {
    newLine = `${key}: ${value}`;
  }
  const keyRx = new RegExp(`^${repo.reEscape(key)}\\s*:`);
  for (let i = 1; i < end; i++) {
    if (keyRx.test(lines[i])) {
      if (newLine === null) lines.splice(i, 1);
      else lines[i] = newLine;
      return lines.join('\n');
    }
  }
  if (newLine !== null) lines.splice(end, 0, newLine);
  return lines.join('\n');
}

/** Write a meta field in the page's own format — frontmatter when it has a
 *  fence, the legacy italic line otherwise (dual-WRITE mirrors dual-read). */
function touchMeta(text, key, value) {
  if (Object.keys(md.frontmatter(text)).length || text.startsWith('---')) {
    return fmSet(text, key, value);
  }
  if (key === 'status') return replaceMetaLine(text, 'status', `_status: ${value}_`);
  return replaceMetaLine(text, key, `_${key}: ${value}_`);
}

/** Insert a dated line at the TOP of ## Activity (newest first, per template). */
function appendActivity(text, line) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^##\s+Activity\s*$/.test(l));
  if (start === -1) return `${text.replace(/\n+$/, '')}\n\n## Activity\n\n- ${line}\n`;
  let at = start + 1;
  while (at < lines.length && lines[at].trim() === '') at += 1;
  lines.splice(at, 0, `- ${line}`);
  if (at === start + 1) lines.splice(at, 0, '');
  return lines.join('\n');
}

export function setStatus(slug, status, note, settings, force = false) {
  const rel = `${DIR}/${slug}.md`;
  if (!repo.exists(rel)) throw repo.httpErr(404, `no initiative page ${slug}`);
  const allowed = ['exploring', 'active', 'paused', 'shipped', 'killed'];
  if (!allowed.includes(status)) {
    throw repo.httpErr(400, `status must be one of ${allowed.join(', ')}`);
  }
  let text = repo.readText(rel);
  if (status === 'shipped' && !force && !text.includes('launches/')) {
    throw repo.httpErr(400, 'closing as shipped needs the gate verdict linked '
      + '(product/launches/{slug}-gate-{date}.md) — attach it first, '
      + 'or send force: true to override deliberately');
  }
  const today = md.today();
  if (Object.keys(md.frontmatter(text)).length || text.startsWith('---')) {
    text = fmSet(text, 'status', status);
    text = fmSet(text, 'note', note || '');
    text = fmSet(text, 'updated', today);
  } else {
    text = replaceMetaLine(text, 'status', `_status: ${status}${note ? ` — ${note}` : ''}_`);
    text = replaceMetaLine(text, 'updated', `_updated: ${today}_`);
  }
  // a status change is an event — it leaves a dated Activity line, always
  text = appendActivity(text, `${today} — status → ${status}${note ? ` — ${note}` : ''} (console)`);
  repo.writeText(rel, text);
  const commit = gitlib.commitPaths([rel], `console: ${slug} status → ${status}`);
  const push = gitlib.maybePush(settings);
  return { page: parsePage(rel), commit, push };
}

export function attach(slug, targetRel, label, settings) {
  const rel = `${DIR}/${slug}.md`;
  if (!repo.exists(rel)) throw repo.httpErr(404, `no initiative page ${slug}`);
  const target = repo.resolveSafe(targetRel).rel;
  if (!repo.exists(target)) throw repo.httpErr(404, `${target} does not exist`);
  const relLink = path.posix.relative(DIR, target);
  const bullet = `- ${label || 'Artifact'}: [${path.posix.basename(target)}](${relLink})`;
  const lines = repo.readText(rel).split('\n');
  const start = lines.findIndex((l) => /^##\s+Artifacts\s*$/.test(l));
  if (start === -1) throw repo.httpErr(400, 'page has no ## Artifacts section');
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }
  // an empty template row with the same label ('- PRD: -' / '- PRD: [PENDING: …]')
  // is FILLED in place — appending would leave a duplicate label
  let filled = false;
  if (label) {
    const emptyRow = new RegExp(`^-\\s+\\**${repo.reEscape(label)}\\**\\s*:\\s*(-|—|\\[PENDING:[^\\]]*\\])\\s*$`, 'i');
    for (let i = start + 1; i < end; i++) {
      if (emptyRow.test(lines[i].trim())) {
        lines[i] = bullet;
        filled = true;
        break;
      }
    }
  }
  if (!filled) {
    let insertAt = end;
    while (insertAt > start + 1 && lines[insertAt - 1].trim() === '') insertAt -= 1;
    lines.splice(insertAt, 0, bullet);
  }
  let text = lines.join('\n');
  text = touchMeta(text, 'updated', md.today());
  repo.writeText(rel, text);
  const commit = gitlib.commitPaths([rel], `console: attach ${path.posix.basename(target)} to ${slug}`);
  const push = gitlib.maybePush(settings);
  return { page: parsePage(rel), commit, push };
}

/** Replace a ## section's body (creating the section before ## Artifacts, or at
 *  the end, when the page predates it). Returns the new text. */
function replaceSection(text, name, bodyLines) {
  const lines = text.split('\n');
  const nameRx = new RegExp(`^##\\s+${repo.reEscape(name)}\\s*$`);
  const start = lines.findIndex((l) => nameRx.test(l));
  if (start === -1) {
    let anchor = lines.findIndex((l) => /^##\s+Artifacts\s*$/.test(l));
    if (anchor === -1) anchor = lines.length;
    const block = [`## ${name}`, '', ...bodyLines, ''];
    return [...lines.slice(0, anchor), ...block, ...lines.slice(anchor)].join('\n');
  }
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return [...lines.slice(0, start + 1), '', ...bodyLines, '', ...lines.slice(end)].join('\n');
}

const INSTRUCTIONS_MAX = 400; // hard cap — steering, not documentation (template rule)

export function setInstructions(slug, instr, settings) {
  const rel = `${DIR}/${slug}.md`;
  if (!repo.exists(rel)) throw repo.httpErr(404, `no initiative page ${slug}`);
  const clean = (instr || '').trim();
  if (clean.length > INSTRUCTIONS_MAX) {
    throw repo.httpErr(400, `instructions are capped at ${INSTRUCTIONS_MAX} characters `
      + `(${clean.length} given) — this is steering, not documentation`);
  }
  const body = clean ? clean.split('\n') : ['-'];
  let text = replaceSection(repo.readText(rel), 'Instructions', body);
  text = touchMeta(text, 'updated', md.today());
  repo.writeText(rel, text);
  const commit = gitlib.commitPaths([rel], `console: ${slug} instructions ${clean ? 'updated' : 'cleared'}`);
  const push = gitlib.maybePush(settings);
  return { page: parsePage(rel), commit, push };
}

/** Rewrite ## Sources from an ordered list — order IS priority, so the same
 *  endpoint covers add, remove, and drag-reorder. */
export function setSources(slug, items, settings) {
  const rel = `${DIR}/${slug}.md`;
  if (!repo.exists(rel)) throw repo.httpErr(404, `no initiative page ${slug}`);
  if (!Array.isArray(items) || items.length > 30) {
    throw repo.httpErr(400, 'items must be a list (max 30)');
  }
  const bulletLines = [];
  for (const it of items) {
    if (!isObj(it)) throw repo.httpErr(400, 'each source is {href, label?, note?} or {text}');
    const href = (it.href || '').trim();
    const label = (it.label || '').trim();
    const note = (it.note || '').trim();
    const textOnly = (it.text || '').trim();
    if (!href && textOnly) {
      let bullet = `- ${textOnly}`;
      if (note) bullet += ` — ${note}`;
      bulletLines.push(bullet);
      continue;
    }
    if (!href) throw repo.httpErr(400, 'a source needs a link or path');
    let bullet;
    if (/^https?:\/\//i.test(href)) {
      bullet = `- [${label || href}](${href})`;
    } else {
      const target = repo.resolveSafe(href).rel;
      const relLink = path.posix.relative(DIR, target);
      bullet = `- [${label || path.posix.basename(target)}](${relLink})`;
    }
    if (note) bullet += ` — ${note}`;
    bulletLines.push(bullet);
  }
  let text = replaceSection(repo.readText(rel), 'Sources', bulletLines.length ? bulletLines : ['-']);
  text = touchMeta(text, 'updated', md.today());
  repo.writeText(rel, text);
  const commit = gitlib.commitPaths([rel],
    `console: ${slug} sources — ${bulletLines.length} entr${bulletLines.length === 1 ? 'y' : 'ies'}`);
  const push = gitlib.maybePush(settings);
  return { page: parsePage(rel), commit, push };
}

export function create(slug, title, settings, areasIn = null, featuresIn = null) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug || '')) {
    throw repo.httpErr(400, 'slug must be kebab-case (a-z, 0-9, dashes)');
  }
  if (!title || !title.trim()) throw repo.httpErr(400, 'title required');
  const areas = (areasIn || []).map((a) => String(a).trim()).filter(Boolean);
  const features = (featuresIn || []).map((f) => String(f).trim()).filter(Boolean);
  if (!areas.length && !features.length) {
    throw repo.httpErr(400, 'an initiative needs at least one target — the feature(s) '
      + 'and/or area(s) it changes (an unmapped initiative cannot '
      + 'exist; link contract: governance/link-schema.yaml)');
  }
  const cat = catalog();
  const inCatalog = (name) => Object.prototype.hasOwnProperty.call(cat.features, name)
    || Object.prototype.hasOwnProperty.call(cat.areas || {}, name);
  if (inCatalog(slug)) {
    throw repo.httpErr(409, `'${slug}' already names a catalog feature/area — slugs are unique `
      + `across areas + features + initiatives (try '${slug}-v2')`);
  }
  const unknown = [
    ...features.filter((f) => !Object.prototype.hasOwnProperty.call(cat.features, f)),
    ...areas.filter((a) => !Object.prototype.hasOwnProperty.call(cat.areas || {}, a)),
  ];
  if (unknown.length && cat.shape !== 'missing') {
    throw repo.httpErr(400, `unknown slug(s): ${unknown.join(', ')} — not in feature-index.yaml. Add the `
      + 'catalog entry first (gated), or pick existing slugs.');
  }
  const rel = `${DIR}/${slug}.md`;
  if (repo.exists(rel)) throw repo.httpErr(409, `${slug} already exists`);
  let text = repo.readText(TEMPLATE);
  text = text.replace(/^#\s+\[Initiative Name\]\s*$/m, () => `# ${title.trim()}`);
  const note = 'page created from the console; fill the snapshot next';
  if (text.startsWith('---')) {
    // frontmattered template (v2): fill its fields
    text = fmSet(text, 'status', 'exploring');
    text = fmSet(text, 'note', note);
    text = fmSet(text, 'updated', md.today());
    text = fmSet(text, 'areas', areas.length ? `[${areas.join(', ')}]` : '');
    text = fmSet(text, 'features', features.length ? `[${features.join(', ')}]` : '');
  } else {
    // legacy template: drop its italic meta lines, prepend the v2 frontmatter
    const body = text.split('\n').filter((l) => !/^_[a-z-]+(\(s\))?:.*_\s*$/i.test(l));
    const fmt = ['---', 'status: exploring', `note: "${note}"`,
      `updated: ${md.today()}`, 'owner: ""'];
    if (areas.length) fmt.push(`areas: [${areas.join(', ')}]`);
    if (features.length) fmt.push(`features: [${features.join(', ')}]`);
    fmt.push('---');
    text = `${fmt.join('\n')}\n${body.join('\n').replace(/^\n+/, '')}`;
  }
  text = text.replace(/\n<!--[\s\S]*?-->\s*$/m, '\n'); // template-rules comment: "delete when filling"
  repo.writeText(rel, text);

  // Navigation rule: append a one-line entry to the END of the folder's CLAUDE.md list.
  const navRel = `${DIR}/CLAUDE.md`;
  const navLines = repo.readText(navRel).split('\n');
  let lastEntry = -1;
  navLines.forEach((l, i) => {
    if (/^-\s+\[/.test(l)) lastEntry = i;
  });
  const entry = `- [${slug}.md](${slug}.md) — ${title.trim()} (created from the console)`;
  if (lastEntry >= 0) navLines.splice(lastEntry + 1, 0, entry);
  else navLines.push(entry);
  repo.writeText(navRel, navLines.join('\n'));

  const commit = gitlib.commitPaths([rel, navRel], `console: new initiative ${slug}`);
  const push = gitlib.maybePush(settings);
  return { page: parsePage(rel), commit, push };
}
