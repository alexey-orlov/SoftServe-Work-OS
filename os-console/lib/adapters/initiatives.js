'use strict';
// Initiatives adapter — joins the living initiative pages with feature-index.yaml.
// The pages and the index stay canonical; this module only reads and does
// surgical line edits (status, attach, create) that a person would make by hand.
const path = require('path');
const yaml = require('../../vendor/js-yaml.min.js');
const repo = require('../repo');
const git = require('../git');
const md = require('../mdparse');

const DIR = 'product-development/product/initiatives';
const PD = 'product-development';
const TEMPLATE = 'product-development/product/handbook/templates/initiative-page-template.md';
const STATUS_ORDER = { active: 0, exploring: 1, paused: 2, shipped: 3, killed: 4 };

function normalizeArtifactPath(p) {
  if (!p || /^https?:/i.test(p)) return null;
  const clean = p.replace(/^\.\//, '');
  if (repo.exists(clean)) return clean;
  const inPd = `${PD}/${clean}`;
  return repo.exists(inPd) ? inPd : clean; // keep best guess; exists flag tells the truth
}

function parseArtifactBullets(pageRel, body) {
  const out = [];
  for (const b of md.bullets(body)) {
    const label = (b.split(':')[0] || '').replace(/\*\*/g, '').trim();
    const rest = b.slice(b.indexOf(':') + 1).trim();
    const links = md.mdLinks(b);
    const pendings = md.pendingMarkers(b);
    if (links.length === 0 && pendings.length === 0) {
      if (rest && rest !== '-' && rest !== '—') out.push({ label, kind: 'note', text: rest });
      continue;
    }
    for (const l of links) {
      if (/^https?:/i.test(l.href)) { out.push({ label, kind: 'url', text: l.label || l.href, url: l.href }); continue; }
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

function featureIndexJoin() {
  const map = {}; // slug -> [{area, feature, artifacts:[]}]
  let fi;
  try { fi = yaml.load(repo.readText(`${PD}/feature-index.yaml`)) || {}; } catch { return map; }
  for (const [area, feats] of Object.entries(fi)) {
    if (!feats || typeof feats !== 'object') continue;
    for (const [feature, spec] of Object.entries(feats)) {
      if (!spec || typeof spec !== 'object') continue;
      const inits = Array.isArray(spec.initiatives) ? spec.initiatives : [];
      if (!inits.length) continue;
      const artifacts = [];
      for (const [key, val] of Object.entries(spec)) {
        if (key === 'initiatives') continue;
        const push = (v, subkey) => {
          if (typeof v !== 'string') return;
          if (/^https?:/i.test(v)) artifacts.push({ key: subkey || key, kind: 'url', url: v });
          else if (v.includes('/')) {
            const norm = normalizeArtifactPath(v);
            artifacts.push({ key: subkey || key, kind: 'file', path: norm, exists: repo.exists(norm) });
          } else artifacts.push({ key: subkey || key, kind: 'ref', text: v });
        };
        if (Array.isArray(val)) val.forEach((v) => push(v));
        else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => push(v, `${key} · ${k}`));
        else push(val);
      }
      for (const slug of inits) {
        (map[slug] = map[slug] || []).push({ area, feature, artifacts });
      }
    }
  }
  return map;
}

function parsePage(rel) {
  const text = repo.readText(rel);
  const slug = path.basename(rel, '.md');
  const meta = md.metaLines(text);
  const title = md.firstHeading(text) || slug;
  const statusText = meta.status || '';
  const statusWord = (statusText.split(/[\s—-]/)[0] || 'active').toLowerCase();
  const targets = [];
  const reTarget = /feature-index\.yaml#([a-z0-9_-]+)\.([a-z0-9_-]+)/gi;
  let m;
  while ((m = reTarget.exec(text.slice(0, 1500)))) targets.push({ area: m[1], feature: m[2] });
  const artifacts = parseArtifactBullets(rel, md.section(text, 'Artifacts'));
  const decisions = md.bullets(md.section(text, 'Decisions')).map((b) => ({
    text: b,
    links: md.mdLinks(b).map((l) => ({ label: l.label, path: md.resolveHref(rel, l.href) })).filter((l) => l.path),
  }));
  return {
    slug, rel, title,
    isExample: /^EXAMPLE/i.test(title) || text.includes('Synthetic worked example'),
    status: STATUS_ORDER[statusWord] !== undefined ? statusWord : 'active',
    statusText,
    updated: meta.updated || '',
    owner: meta.owner || '',
    targets,
    snapshot: md.section(text, 'Snapshot').trim(),
    scope: md.section(text, 'Scope & goal').trim(),
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

function list() {
  const join = featureIndexJoin();
  const items = [];
  for (const e of repo.listDir(DIR)) {
    if (e.type !== 'file' || !e.name.endsWith('.md') || e.name === 'CLAUDE.md') continue;
    try {
      const page = parsePage(e.rel);
      page.features = join[page.slug] || [];
      items.push(page);
    } catch { /* unreadable page — skip rather than break the view */ }
  }
  items.sort((a, b) =>
    (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || String(b.updated).localeCompare(String(a.updated)));
  return items;
}

// path → [initiative slugs] — lets the file viewer say "linked from initiative X".
function reverseIndex() {
  const out = {};
  for (const it of list()) {
    const paths = new Set();
    it.artifacts.forEach((a) => a.path && paths.add(a.path));
    it.decisions.forEach((d) => d.links.forEach((l) => paths.add(l.path)));
    (it.features || []).forEach((f) => f.artifacts.forEach((a) => a.path && paths.add(a.path)));
    for (const p of paths) (out[p] = out[p] || []).push(it.slug);
  }
  return out;
}

function replaceMetaLine(text, key, newLine) {
  const re = new RegExp(`^_${key}:.*$`, 'm');
  return re.test(text) ? text.replace(re, newLine) : text;
}

function setStatus(slug, status, note, settings) {
  const rel = `${DIR}/${slug}.md`;
  if (!repo.exists(rel)) throw repo.httpErr(404, `no initiative page ${slug}`);
  const allowed = ['exploring', 'active', 'paused', 'shipped', 'killed'];
  if (!allowed.includes(status)) throw repo.httpErr(400, `status must be one of ${allowed.join(', ')}`);
  let text = repo.readText(rel);
  text = replaceMetaLine(text, 'status', `_status: ${status}${note ? ` — ${note}` : ''}_`);
  text = replaceMetaLine(text, 'updated', `_updated: ${md.today()}_`);
  repo.writeText(rel, text);
  const commit = git.commitPaths([rel], `console: ${slug} status → ${status}`);
  const push = git.maybePush(settings);
  return { page: parsePage(rel), commit, push };
}

function attach(slug, targetRel, label, settings) {
  const rel = `${DIR}/${slug}.md`;
  if (!repo.exists(rel)) throw repo.httpErr(404, `no initiative page ${slug}`);
  const { rel: target } = repo.resolveSafe(targetRel);
  if (!repo.exists(target)) throw repo.httpErr(404, `${target} does not exist`);
  const relLink = path.posix.relative(DIR, target);
  const bullet = `- ${label || 'Artifact'}: [${path.posix.basename(target)}](${relLink})`;
  const lines = repo.readText(rel).split('\n');
  const start = lines.findIndex((l) => /^##\s+Artifacts\s*$/.test(l));
  if (start === -1) throw repo.httpErr(400, 'page has no ## Artifacts section');
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) if (/^##\s+/.test(lines[i])) { end = i; break; }
  let insertAt = end;
  while (insertAt > start + 1 && lines[insertAt - 1].trim() === '') insertAt--;
  lines.splice(insertAt, 0, bullet);
  let text = lines.join('\n');
  text = replaceMetaLine(text, 'updated', `_updated: ${md.today()}_`);
  repo.writeText(rel, text);
  const commit = git.commitPaths([rel], `console: attach ${path.posix.basename(target)} to ${slug}`);
  const push = git.maybePush(settings);
  return { page: parsePage(rel), commit, push };
}

function create(slug, title, settings) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug || '')) throw repo.httpErr(400, 'slug must be kebab-case (a-z, 0-9, dashes)');
  if (!title || !title.trim()) throw repo.httpErr(400, 'title required');
  const rel = `${DIR}/${slug}.md`;
  if (repo.exists(rel)) throw repo.httpErr(409, `${slug} already exists`);
  let text = repo.readText(TEMPLATE);
  text = text.replace(/^#\s+\[Initiative Name\]\s*$/m, `# ${title.trim()}`);
  text = replaceMetaLine(text, 'status', '_status: exploring — page created from the console; fill the snapshot next_');
  text = replaceMetaLine(text, 'updated', `_updated: ${md.today()}_`);
  text = text.replace(/\n<!--[\s\S]*?-->\s*$/m, '\n'); // template-rules comment: "delete when filling"
  repo.writeText(rel, text);

  // Navigation rule: append a one-line entry to the END of the folder's CLAUDE.md list.
  const navRel = `${DIR}/CLAUDE.md`;
  const navLines = repo.readText(navRel).split('\n');
  let lastEntry = -1;
  navLines.forEach((l, i) => { if (/^-\s+\[/.test(l)) lastEntry = i; });
  const entry = `- [${slug}.md](${slug}.md) — ${title.trim()} (created from the console)`;
  if (lastEntry >= 0) navLines.splice(lastEntry + 1, 0, entry);
  else navLines.push(entry);
  repo.writeText(navRel, navLines.join('\n'));

  const commit = git.commitPaths([rel, navRel], `console: new initiative ${slug}`);
  const push = git.maybePush(settings);
  return { page: parsePage(rel), commit, push };
}

module.exports = { DIR, list, parsePage, reverseIndex, setStatus, attach, create };
