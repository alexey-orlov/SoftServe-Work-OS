'use strict';
// Library adapter — the friendly repo browser. Folder CLAUDE.md navigation files
// (written for agents) double as the human-readable annotations here.
const repo = require('../repo');
const md = require('../mdparse');

function dirInfo(rel) {
  const clean = rel && rel !== '.' ? repo.resolveSafe(rel).rel : '';
  const entries = repo.listDir(clean || '.');
  const descs = md.navDescriptions(clean);
  const ownNav = repo.readTextOrNull(clean ? `${clean}/CLAUDE.md` : 'CLAUDE.md');
  const decorated = entries.map((e) => ({
    ...e,
    desc: descs[e.rel] !== undefined ? descs[e.rel]
      : e.name === 'CLAUDE.md' ? 'Folder navigation file'
        : '',
  }));
  return {
    path: clean,
    blurb: ownNav ? md.intro(ownNav) : '',
    readWhen: ownNav ? (ownNav.match(/\*\*Read this when:\*\*\s*(.+)/) || [])[1] || '' : '',
    hasNav: !!ownNav,
    entries: decorated,
  };
}

module.exports = { dirInfo };
