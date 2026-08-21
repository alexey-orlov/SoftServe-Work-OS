'use strict';
// Repo filesystem layer — every path the console touches goes through resolveSafe().
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const TEXT_EXT = new Set(['.md', '.yaml', '.yml', '.txt', '.sql', '.json', '.csv', '.html', '.js', '.mjs', '.cjs', '.css', '.sh']);
// The console only ever writes wiki-content file types — never scripts or hooks.
const WRITE_EXT = new Set(['.md', '.yaml', '.yml', '.txt', '.json', '.sql', '.csv']);
const IMG_MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
};

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Resolve a repo-root-relative path; refuse escapes and .git.
function resolveSafe(rel) {
  if (typeof rel !== 'string' || rel.trim() === '') throw httpErr(400, 'path required');
  const cleaned = rel.replace(/\\/g, '/').replace(/^\/+/, '').trim();
  const abs = path.resolve(ROOT, cleaned);
  if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) throw httpErr(400, 'path escapes the repo');
  const out = path.relative(ROOT, abs).split(path.sep).join('/');
  if (out === '.git' || out.startsWith('.git/')) throw httpErr(403, '.git is off limits');
  return { abs, rel: out };
}

function exists(rel) {
  try { return fs.existsSync(resolveSafe(rel).abs); } catch { return false; }
}

function statOrNull(rel) {
  try { return fs.statSync(resolveSafe(rel).abs); } catch { return null; }
}

function readText(rel) {
  const { abs } = resolveSafe(rel);
  return fs.readFileSync(abs, 'utf8');
}

function readTextOrNull(rel) {
  try { return readText(rel); } catch { return null; }
}

function writeText(rel, content) {
  const { abs, rel: out } = resolveSafe(rel);
  const ext = path.extname(out).toLowerCase();
  if (!WRITE_EXT.has(ext)) throw httpErr(400, `the console does not write ${ext || 'extension-less'} files`);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
  return out;
}

// Directory listing with junk filtered out.
const SKIP_NAMES = new Set(['.git', '.DS_Store', 'node_modules', '_extracted-personal']);
function listDir(rel) {
  const { abs, rel: out } = resolveSafe(rel || '.');
  const st = fs.statSync(abs);
  if (!st.isDirectory()) throw httpErr(400, `${out} is not a directory`);
  const entries = [];
  for (const name of fs.readdirSync(abs)) {
    if (SKIP_NAMES.has(name)) continue;
    const p = path.join(abs, name);
    let s;
    try { s = fs.statSync(p); } catch { continue; }
    entries.push({
      name,
      rel: out === '' || out === '.' ? name : `${out}/${name}`,
      type: s.isDirectory() ? 'dir' : 'file',
      size: s.isDirectory() ? null : s.size,
      mtimeMs: s.mtimeMs,
    });
  }
  entries.sort((a, b) => (a.type !== b.type ? (a.type === 'dir' ? -1 : 1) : a.name.localeCompare(b.name)));
  return entries;
}

// Expand a shell-style glob (repo-relative, * ? and ** segments) to existing files.
function globFiles(pattern) {
  const segs = pattern.replace(/^\/+/, '').split('/');
  let frontier = [''];
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const last = i === segs.length - 1;
    const next = [];
    for (const base of frontier) {
      if (seg === '**') {
        // ** — match this dir and every descendant dir; files only collected at the end.
        const stack = [base];
        const dirs = [];
        while (stack.length) {
          const d = stack.pop();
          dirs.push(d);
          let children = [];
          try { children = listDir(d || '.'); } catch { continue; }
          for (const c of children) if (c.type === 'dir') stack.push(c.rel);
        }
        if (last) {
          for (const d of dirs) {
            let children = [];
            try { children = listDir(d || '.'); } catch { continue; }
            for (const c of children) if (c.type === 'file') next.push(c.rel);
          }
        } else {
          next.push(...dirs);
        }
        continue;
      }
      const re = segGlobToRegex(seg);
      let children = [];
      try { children = listDir(base || '.'); } catch { continue; }
      for (const c of children) {
        if (!re.test(c.name)) continue;
        if (last && c.type === 'file') next.push(c.rel);
        if (!last && c.type === 'dir') next.push(c.rel);
      }
    }
    frontier = next;
  }
  return [...new Set(frontier)].sort();
}

function segGlobToRegex(seg) {
  let re = '';
  for (const ch of seg) {
    if (ch === '*') re += '[^/]*';
    else if (ch === '?') re += '[^/]';
    else re += ch.replace(/[\\^$.|+()[\]{}]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

function mimeFor(rel) {
  const ext = path.extname(rel).toLowerCase();
  return IMG_MIME[ext] || null;
}

function isTextPath(rel) {
  const base = path.basename(rel);
  if (base === '.gitignore' || base === 'CODEOWNERS' || base === 'LICENSE') return true;
  return TEXT_EXT.has(path.extname(rel).toLowerCase());
}

module.exports = {
  ROOT, resolveSafe, exists, statOrNull, readText, readTextOrNull, writeText,
  listDir, globFiles, mimeFor, isTextPath, httpErr,
};
