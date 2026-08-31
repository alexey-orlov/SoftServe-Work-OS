// Library adapter — the friendly repo browser. Folder CLAUDE.md navigation files
// (written for agents) double as the human-readable annotations here. Every
// entry carries its write-policy tier so listings can badge gated paths.
import * as md from '../mdparse.js';
import * as policy from '../policy.js';
import * as repo from '../repo.js';

export function tierOf(rel, isDir, pol) {
  // A directory is gated iff files under it are (probe a synthetic child —
  // dir globs like `governance/**` match children, not the bare dir path).
  return policy.tierFor(isDir ? `${rel}/_` : rel, pol).tier;
}

export function dirInfo(rel) {
  const clean = rel && rel !== '.' ? repo.resolveSafe(rel).rel : '';
  const pol = policy.load();
  const entries = repo.listDir(clean || '.');
  const descs = md.navDescriptions(clean);
  const ownNav = repo.readTextOrNull(clean ? `${clean}/CLAUDE.md` : 'CLAUDE.md');
  const decorated = entries.map((e) => ({
    ...e,
    tier: tierOf(e.rel, e.type === 'dir', pol),
    desc: Object.prototype.hasOwnProperty.call(descs, e.rel)
      ? descs[e.rel]
      : (e.name === 'CLAUDE.md' ? 'Folder navigation file' : ''),
  }));
  let readWhen = '';
  if (ownNav) {
    const m = ownNav.match(/\*\*Read this when:\*\*\s*(.+)/);
    readWhen = m ? m[1] : '';
  }
  return {
    path: clean,
    tier: clean ? tierOf(clean, true, pol) : 'auto',
    blurb: ownNav ? md.intro(ownNav) : '',
    readWhen,
    hasNav: Boolean(ownNav),
    entries: decorated,
  };
}

/** Bulk tier lookup for arbitrary paths (used by the quick-access tiles). */
export function tiers(paths) {
  const pol = policy.load();
  const out = {};
  for (const p of paths.slice(0, 120)) {
    try {
      const rel = repo.resolveSafe(p).rel;
      const st = repo.statOrNull(rel);
      out[p] = tierOf(rel, Boolean(st && st.isDirectory()), pol);
    } catch {
      out[p] = 'auto';
    }
  }
  return out;
}
