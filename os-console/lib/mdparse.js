// Markdown parsing helpers for the wiki's house conventions:
// fenced YAML frontmatter (Link Architecture v2), legacy _key: value_ metadata
// lines, ## sections, CLAUDE.md navigation bullets.
//
// DUAL-READ IS PERMANENT: deployed instances converge to frontmatter gradually
// (via /wiki-lint auto-fixes), so the legacy italic-meta fallback must never be
// removed — pageMeta() reads both, frontmatter winning per key.
import path from 'node:path';
import * as miniyaml from './miniyaml.js';
import * as repo from './repo.js';

export function firstHeading(text) {
  const m = (text || '').match(/^#\s+(.+?)\s*$/m);
  return m ? m[1] : null;
}

/** Leading `_status: ..._` style metadata lines (searched in the first 20 lines). */
export function metaLines(text) {
  const out = {};
  for (const line of (text || '').split('\n').slice(0, 20)) {
    const m = line.match(/^_([a-zA-Z-]+(?:\(s\))?):\s*([\s\S]*?)_?\s*$/);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  }
  return out;
}

const FENCE_SCAN = 60; // frontmatter is small; the closing --- must appear this early

/** Fenced YAML frontmatter at the very top ('---' ... '---') -> object.
 *  {} when absent or unparseable. Keys per governance/link-schema.yaml. */
export function frontmatter(text) {
  const t = text || '';
  const lines = t.split('\n');
  if (!lines.length || lines[0].trim() !== '---') return {};
  for (let i = 1; i < Math.min(lines.length, FENCE_SCAN); i++) {
    if (lines[i].trim() === '---') {
      let doc;
      try {
        doc = miniyaml.load(lines.slice(1, i).join('\n'));
      } catch {
        return {};
      }
      return doc && typeof doc === 'object' && !Array.isArray(doc) ? doc : {};
    }
  }
  return {};
}

/** Text with the leading fenced frontmatter removed (unchanged when absent). */
export function stripFrontmatter(text) {
  const t = text || '';
  const lines = t.split('\n');
  if (!lines.length || lines[0].trim() !== '---') return t;
  for (let i = 1; i < Math.min(lines.length, FENCE_SCAN); i++) {
    if (lines[i].trim() === '---') return lines.slice(i + 1).join('\n');
  }
  return t;
}

/** Unified page metadata: legacy italic `_key: value_` lines overlaid by fenced
 *  YAML frontmatter (frontmatter wins per key). Keys lowercased. Values may be
 *  lists (link keys: areas, features, initiatives, customers, competitors). */
export function pageMeta(text) {
  const out = metaLines(text);
  for (const [k, v] of Object.entries(frontmatter(text))) out[String(k).toLowerCase()] = v;
  return out;
}

/** Split into ## sections: [{name, body}] (text before the first ## lands in name ''). */
export function sections(text) {
  const out = [];
  let name = '';
  let buf = [];
  for (const line of (text || '').split('\n')) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      out.push({ name, body: buf.join('\n') });
      name = m[1];
      buf = [];
    } else {
      buf.push(line);
    }
  }
  out.push({ name, body: buf.join('\n') });
  return out;
}

export function section(text, wanted) {
  for (const s of sections(text)) {
    if (s.name.toLowerCase() === wanted.toLowerCase()) return s.body;
  }
  return '';
}

export function bullets(body) {
  const out = [];
  for (const l of (body || '').split('\n')) {
    const m = l.match(/^\s*-\s+([\s\S]*)$/);
    if (m) out.push(m[1].trim());
  }
  return out;
}

export function mdLinks(s) {
  return [...(s || '').matchAll(/\[([^\]]*)\]\(([^)\s]+)\)/g)]
    .map((m) => ({ label: m[1], href: m[2] }));
}

export function pendingMarkers(s) {
  return [...(s || '').matchAll(/\[PENDING:\s*([^\]]+)\]/g)].map((m) => m[1].trim());
}

/** Resolve a relative markdown href against the file it appears in -> repo-relative path. */
export function resolveHref(fromRel, href) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#')) return null; // external / anchor
  const clean = href.split('#')[0];
  if (!clean) return null;
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), clean));
}

/** A folder's CLAUDE.md nav bullets -> map of child rel path -> one-line description. */
export function navDescriptions(dirRel) {
  const navPath = dirRel ? `${dirRel}/CLAUDE.md` : 'CLAUDE.md';
  const text = repo.readTextOrNull(navPath);
  if (text === null) return {};
  const out = {};
  for (const b of bullets(text)) {
    const links = mdLinks(b);
    if (!links.length) continue;
    const target = resolveHref(navPath, links[0].href);
    if (!target) continue;
    const desc = b.split('—').slice(1).join('—').trim();
    out[target.replace(/\/+$/, '')] = desc || '';
  }
  return out;
}

/** First real paragraph after the H1 — used as a folder/file blurb. */
export function intro(text) {
  const lines = (text || '').split('\n');
  let i = 0;
  while (i < lines.length && !/^#\s/.test(lines[i])) i += 1;
  i += 1;
  const buf = [];
  while (i < lines.length) {
    const l = lines[i].trim();
    if (!l) {
      if (buf.length) break;
      i += 1;
      continue;
    }
    if (/^[#>_\-|]/.test(l) || l.startsWith('**Read')) {
      if (buf.length) break;
      i += 1;
      continue;
    }
    buf.push(l);
    i += 1;
  }
  let joined = buf.join(' ');
  joined = joined.replace(/\[([^\]]*)\]\(([^)]+)\)/g, '$1'); // markdown links -> their label
  joined = joined.replace(/[*_`]/g, '');
  return joined.slice(0, 300);
}

/** Bracketed placeholders that are not markdown links: [Your Company], [N],
 *  [GAP: ...] — the shared population signal (setup page, steering page).
 *  Frontmatter is excluded — YAML inline lists ([billing]) are data, not gaps. */
export function placeholderCount(text) {
  if (!text) return 0;
  return (stripFrontmatter(text).match(/\[[^\][\n]+\](?!\()/g) || []).length;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
