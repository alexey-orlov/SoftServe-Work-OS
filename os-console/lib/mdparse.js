'use strict';
// Markdown parsing helpers for the wiki's house conventions:
// _key: value_ metadata lines, ## sections, CLAUDE.md navigation bullets.
const path = require('path');
const repo = require('./repo');

function firstHeading(text) {
  const m = (text || '').match(/^#\s+(.+?)\s*$/m);
  return m ? m[1] : null;
}

// Leading `_status: …_` style metadata lines (searched in the first 20 lines).
function metaLines(text) {
  const out = {};
  for (const line of (text || '').split('\n').slice(0, 20)) {
    const m = line.match(/^_([a-z-]+(?:\(s\))?):\s*(.*?)_?\s*$/i);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  }
  return out;
}

// Split into ## sections: [{name, body}] (text before the first ## lands in name '').
function sections(text) {
  const out = [];
  let name = '', buf = [];
  for (const line of (text || '').split('\n')) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) { out.push({ name, body: buf.join('\n') }); name = m[1]; buf = []; }
    else buf.push(line);
  }
  out.push({ name, body: buf.join('\n') });
  return out;
}

function section(text, wanted) {
  const hit = sections(text).find((s) => s.name.toLowerCase() === wanted.toLowerCase());
  return hit ? hit.body : '';
}

function bullets(body) {
  return (body || '').split('\n').map((l) => l.match(/^\s*-\s+(.*)$/)).filter(Boolean).map((m) => m[1].trim());
}

function mdLinks(str) {
  const out = [];
  const re = /\[([^\]]*)\]\(([^)\s]+)\)/g;
  let m;
  while ((m = re.exec(str || ''))) out.push({ label: m[1], href: m[2] });
  return out;
}

function pendingMarkers(str) {
  const out = [];
  const re = /\[PENDING:\s*([^\]]+)\]/g;
  let m;
  while ((m = re.exec(str || ''))) out.push(m[1].trim());
  return out;
}

// Resolve a relative markdown href against the file it appears in → repo-relative path.
function resolveHref(fromRel, href) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#')) return null; // external / anchor
  const clean = href.split('#')[0];
  if (!clean) return null;
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), clean));
}

// A folder's CLAUDE.md nav bullets → map of child rel path → one-line description.
function navDescriptions(dirRel) {
  const navPath = dirRel ? `${dirRel}/CLAUDE.md` : 'CLAUDE.md';
  const text = repo.readTextOrNull(navPath);
  if (!text) return {};
  const out = {};
  for (const b of bullets(text)) {
    const link = mdLinks(b)[0];
    if (!link) continue;
    const target = resolveHref(navPath, link.href);
    if (!target) continue;
    const desc = b.split('—').slice(1).join('—').trim();
    out[target.replace(/\/$/, '')] = desc || '';
  }
  return out;
}

// First real paragraph after the H1 — used as a folder/file blurb.
function intro(text) {
  const lines = (text || '').split('\n');
  let i = 0;
  while (i < lines.length && !/^#\s/.test(lines[i])) i++;
  i++;
  const buf = [];
  for (; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) { if (buf.length) break; continue; }
    if (/^[#>_\-|]/.test(l) || l.startsWith('**Read')) { if (buf.length) break; continue; }
    buf.push(l);
  }
  return buf.join(' ')
    .replace(/\[([^\]]*)\]\(([^)]+)\)/g, '$1')  // markdown links → their label
    .replace(/[*_`]/g, '')
    .slice(0, 300);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = {
  firstHeading, metaLines, sections, section, bullets, mdLinks, pendingMarkers,
  resolveHref, navDescriptions, intro, today,
};
