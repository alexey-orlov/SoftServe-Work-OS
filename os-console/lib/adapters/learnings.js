'use strict';
// Team learnings adapter — .claude/team-learnings.md (gated: a save is the approval).
const repo = require('../repo');
const git = require('../git');
const md = require('../mdparse');

const FILE = '.claude/team-learnings.md';
const CAP_LINES = 30; // the file's own stated budget: "hard cap ~30 lines of entries"

function build() {
  const text = repo.readTextOrNull(FILE);
  if (text === null) return { path: FILE, exists: false, entries: [], capLines: CAP_LINES };
  const body = md.section(text, 'Entries');
  const entries = md.bullets(body).map((b) => {
    const m = b.match(/^(\d{4}-\d{2}-\d{2})\s*[—-]+\s*(.*)$/);
    return m ? { date: m[1], text: m[2] } : { date: null, text: b };
  });
  return {
    path: FILE,
    exists: true,
    entries,
    seedNote: body.includes('seed examples'),
    entryLines: entries.length,
    capLines: CAP_LINES,
  };
}

function add(text, settings) {
  const clean = (text || '').trim().replace(/\s+/g, ' ');
  if (clean.length < 8) throw repo.httpErr(400, 'a learning needs at least a sentence');
  if (clean.length > 400) throw repo.httpErr(400, 'keep it to one line (≤400 chars) — that is the format');
  let raw = repo.readText(FILE);
  if (!raw.endsWith('\n')) raw += '\n';
  raw += `- ${md.today()} — ${clean}\n`;
  repo.writeText(FILE, raw);
  const commit = git.commitPaths([FILE], 'console: team learning added');
  const push = git.maybePush(settings);
  return { ...build(), commit, push };
}

module.exports = { build, add, FILE };
