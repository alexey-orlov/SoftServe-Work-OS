'use strict';
// Library adapter — the friendly repo browser. Folder CLAUDE.md navigation files
// (written for agents) double as the human-readable annotations here. Every
// entry carries its write-policy tier so listings can badge gated paths.
const repo = require('../repo');
const md = require('../mdparse');
const policy = require('../policy');

// A directory is gated iff files under it are (probe a synthetic child —
// dir globs like `governance/**` match children, not the bare dir path).
function tierOf(rel, isDir, pol) {
  return policy.tierFor(isDir ? `${rel}/_` : rel, pol).tier;
}

function dirInfo(rel) {
  const clean = rel && rel !== '.' ? repo.resolveSafe(rel).rel : '';
  const pol = policy.load();
  const entries = repo.listDir(clean || '.');
  const descs = md.navDescriptions(clean);
  const ownNav = repo.readTextOrNull(clean ? `${clean}/CLAUDE.md` : 'CLAUDE.md');
  const decorated = entries.map((e) => ({
    ...e,
    tier: tierOf(e.rel, e.type === 'dir', pol),
    desc: descs[e.rel] !== undefined ? descs[e.rel]
      : e.name === 'CLAUDE.md' ? 'Folder navigation file'
        : '',
  }));
  return {
    path: clean,
    tier: clean ? tierOf(clean, true, pol) : 'auto',
    blurb: ownNav ? md.intro(ownNav) : '',
    readWhen: ownNav ? (ownNav.match(/\*\*Read this when:\*\*\s*(.+)/) || [])[1] || '' : '',
    hasNav: !!ownNav,
    entries: decorated,
  };
}

// Bulk tier lookup for arbitrary paths (used by the quick-access tiles).
function tiers(paths) {
  const pol = policy.load();
  const out = {};
  for (const p of paths.slice(0, 120)) {
    try {
      const { rel } = repo.resolveSafe(p);
      const st = repo.statOrNull(rel);
      out[p] = tierOf(rel, !!(st && st.isDirectory()), pol);
    } catch { out[p] = 'auto'; }
  }
  return out;
}

module.exports = { dirInfo, tiers };
