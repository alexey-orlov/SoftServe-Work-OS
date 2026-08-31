// Team learnings adapter — .claude/team-learnings.md (gated: a save is the approval).
import * as gitlib from '../gitlib.js';
import * as md from '../mdparse.js';
import * as repo from '../repo.js';

export const FILE = '.claude/team-learnings.md';
const CAP_LINES = 30; // the file's own stated budget: "hard cap ~30 lines of entries"

export function build() {
  const text = repo.readTextOrNull(FILE);
  if (text === null) return { path: FILE, exists: false, entries: [], capLines: CAP_LINES };
  const body = md.section(text, 'Entries');
  const entries = [];
  for (const b of md.bullets(body)) {
    const m = b.match(/^(\d{4}-\d{2}-\d{2})\s*[—-]+\s*([\s\S]*)$/);
    entries.push(m ? { date: m[1], text: m[2] } : { date: null, text: b });
  }
  return {
    path: FILE,
    exists: true,
    entries,
    seedNote: body.includes('seed examples'),
    entryLines: entries.length,
    capLines: CAP_LINES,
  };
}

export function add(text, settings) {
  const clean = (text || '').trim().replace(/\s+/g, ' ');
  if (clean.length < 8) throw repo.httpErr(400, 'a learning needs at least a sentence');
  if (clean.length > 400) throw repo.httpErr(400, 'keep it to one line (≤400 chars) — that is the format');
  let raw = repo.readText(FILE);
  if (!raw.endsWith('\n')) raw += '\n';
  raw += `- ${md.today()} — ${clean}\n`;
  repo.writeText(FILE, raw);
  const commit = gitlib.commitPaths([FILE], 'console: team learning added');
  const push = gitlib.maybePush(settings);
  return { ...build(), commit, push };
}
