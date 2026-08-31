// Repo filesystem layer — every path the console touches goes through resolveSafe().
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.dirname(path.dirname(HERE));

export const TEXT_EXT = new Set(['.md', '.yaml', '.yml', '.txt', '.sql', '.json', '.csv', '.html', '.js', '.mjs', '.cjs', '.css', '.sh']);
// The console only ever writes wiki-content file types — never scripts or hooks.
export const WRITE_EXT = new Set(['.md', '.yaml', '.yml', '.txt', '.json', '.sql', '.csv']);
const IMG_MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
};

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function httpErr(status, message) {
  return new HttpError(status, message);
}

/** Escape a literal string for use inside a RegExp (Python's re.escape). */
export function reEscape(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ext(rel) {
  return path.posix.extname(rel).toLowerCase();
}

/** Resolve a repo-root-relative path; refuse escapes and .git. */
export function resolveSafe(rel) {
  if (typeof rel !== 'string' || rel.trim() === '') throw httpErr(400, 'path required');
  const cleaned = rel.replace(/\\/g, '/').replace(/^\/+/, '').trim();
  const absPath = path.resolve(ROOT, cleaned);
  if (absPath !== ROOT && !absPath.startsWith(ROOT + path.sep)) {
    throw httpErr(400, 'path escapes the repo');
  }
  let out = path.relative(ROOT, absPath).split(path.sep).join('/');
  if (out === '.') out = '';
  if (out === '.git' || out.startsWith('.git/')) throw httpErr(403, '.git is off limits');
  return { abs: absPath, rel: out };
}

export function exists(rel) {
  try {
    return fs.existsSync(resolveSafe(rel).abs);
  } catch {
    return false;
  }
}

export function statOrNull(rel) {
  try {
    return fs.statSync(resolveSafe(rel).abs);
  } catch {
    return null;
  }
}

/** Milliseconds with sub-ms precision — the mtimeMs the frontend expects. */
export function mtimeMs(st) {
  return st ? st.mtimeMs : null;
}

export function readText(rel) {
  return fs.readFileSync(resolveSafe(rel).abs, 'utf8');
}

export function readTextOrNull(rel) {
  try {
    return readText(rel);
  } catch {
    return null;
  }
}

export function writeText(rel, content) {
  const r = resolveSafe(rel);
  const e = ext(r.rel);
  if (!WRITE_EXT.has(e)) {
    throw httpErr(400, `the console does not write ${e || 'extension-less'} files`);
  }
  const dir = path.dirname(r.abs);
  if (dir) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(r.abs, content, 'utf8');
  return r.rel;
}

// Directory listing with junk filtered out. os-console/console.html is the
// generated snapshot artifact — machine output, not wiki content, and listing
// it would make each snapshot bake the previous one.
export const SKIP_NAMES = new Set(['.git', '.DS_Store', 'node_modules', '_extracted-personal', '__pycache__']);
export const SKIP_RELS = new Set(['os-console/console.html']);

function swapCase(s) {
  let out = '';
  for (const ch of s) {
    const lower = ch.toLowerCase();
    const upper = ch.toUpperCase();
    out += ch === lower && ch !== upper ? upper : (ch === upper && ch !== lower ? lower : ch);
  }
  return out;
}

// Locale-style ordering: case-insensitive first, lowercase before uppercase on ties.
function nameKey(name) {
  return [name.toLowerCase(), swapCase(name)];
}

function cmpStr(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function listDir(rel) {
  const r = resolveSafe(rel || '.');
  const st = fs.statSync(r.abs); // nonexistent path throws here
  if (!st.isDirectory()) throw httpErr(400, `${r.rel} is not a directory`);
  const out = r.rel;
  const entries = [];
  for (const name of fs.readdirSync(r.abs)) {
    if (SKIP_NAMES.has(name)) continue;
    const childRel = out === '' || out === '.' ? name : `${out}/${name}`;
    if (SKIP_RELS.has(childRel)) continue;
    const p = path.join(r.abs, name);
    let s;
    try {
      s = fs.statSync(p);
    } catch {
      continue;
    }
    const isDir = s.isDirectory();
    entries.push({
      name,
      rel: childRel,
      type: isDir ? 'dir' : 'file',
      size: isDir ? null : s.size,
      mtimeMs: mtimeMs(s),
    });
  }
  entries.sort((a, b) => {
    const ta = a.type === 'dir' ? 0 : 1;
    const tb = b.type === 'dir' ? 0 : 1;
    if (ta !== tb) return ta - tb;
    const ka = nameKey(a.name);
    const kb = nameKey(b.name);
    return cmpStr(ka[0], kb[0]) || cmpStr(ka[1], kb[1]);
  });
  return entries;
}

export function segGlobToRegex(seg) {
  let out = '';
  for (const ch of seg) {
    if (ch === '*') out += '[^/]*';
    else if (ch === '?') out += '[^/]';
    else out += reEscape(ch);
  }
  return new RegExp(`^${out}$`);
}

/** Expand a shell-style glob (repo-relative, * ? and ** segments) to existing files. */
export function globFiles(pattern) {
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
          let children;
          try {
            children = listDir(d || '.');
          } catch {
            continue;
          }
          for (const c of children) if (c.type === 'dir') stack.push(c.rel);
        }
        if (last) {
          for (const d of dirs) {
            let children;
            try {
              children = listDir(d || '.');
            } catch {
              continue;
            }
            for (const c of children) if (c.type === 'file') next.push(c.rel);
          }
        } else {
          next.push(...dirs);
        }
        continue;
      }
      const rx = segGlobToRegex(seg);
      let children;
      try {
        children = listDir(base || '.');
      } catch {
        continue;
      }
      for (const c of children) {
        if (!rx.test(c.name)) continue;
        if (last && c.type === 'file') next.push(c.rel);
        if (!last && c.type === 'dir') next.push(c.rel);
      }
    }
    frontier = next;
  }
  return [...new Set(frontier)].sort(cmpStr);
}

export function mimeFor(rel) {
  return IMG_MIME[ext(rel)] || null;
}

export function isTextPath(rel) {
  const base = path.posix.basename(rel);
  if (base === '.gitignore' || base === 'CODEOWNERS' || base === 'LICENSE') return true;
  return TEXT_EXT.has(ext(rel));
}
