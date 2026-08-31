// Skills adapter — the team's guided programs (.claude/skills/*/SKILL.md) as
// data: /-command, description, group, argument hint. The /-command comes from
// the folder name (the discovery rule); frontmatter carries the rest. Grouping
// vocabulary lives in .claude/skills/CLAUDE.md — the friendly labels here must
// match its table.
import * as repo from '../repo.js';

const SKILLS_DIR = '.claude/skills';

// group key -> [title, covers] — mirrors the table in .claude/skills/CLAUDE.md.
const GROUPS = {
  'communication-ops': ['Communication & ops', 'Meeting processing, decision logging, status updates and digests, personal planning'],
  definition: ['Definition', 'Strategy, PRDs, metric definitions, impact sizing, experiment design, and the critique passes that stress-test them'],
  delivery: ['Delivery', 'Turning a spec into tickets, code and a shipped launch — plus what the shipped code actually does'],
  'discovery-market': ['Discovery: market', 'Competitor teardowns, market environment scans, sizing'],
  'discovery-customers': ['Discovery: customers', 'Interview prep and cross-interview synthesis'],
  'discovery-analytics': ['Discovery: analytics', 'Retention, activation and funnel reads against the warehouse'],
  prototyping: ['Prototyping', 'Sketches, clickable prototypes, prototype critique and feedback rounds, journey maps'],
  'os-admin': ['OS admin & governance', 'Setting the OS up, and keeping the repo honest before and after a feature ships'],
};

/** The leading --- block as {key: value}. Light parser for the repo's own
 *  frontmatter convention (single-line values, continuations indented). */
function frontmatter(text) {
  const lines = (text || '').split('\n');
  if (!lines.length || lines[0].trim() !== '---') return {};
  const out = {};
  let key = null;
  for (const line of lines.slice(1)) {
    if (line.trim() === '---') break;
    const m = line.match(/^([A-Za-z][\w-]*):\s*([\s\S]*)$/);
    if (m) {
      key = m[1].toLowerCase();
      out[key] = m[2].trim();
    } else if (key && (line.startsWith(' ') || line.startsWith('\t'))) {
      out[key] = `${out[key]} ${line.trim()}`.trim();
    }
  }
  for (const [k, v] of Object.entries(out)) {
    if (v.length >= 2 && v[0] === v[v.length - 1] && (v[0] === '"' || v[0] === "'")) {
      out[k] = v.slice(1, -1);
    }
  }
  return out;
}

export function build() {
  const items = [];
  let entries;
  try {
    entries = repo.listDir(SKILLS_DIR);
  } catch {
    return { skills: [], groups: GROUPS };
  }
  for (const e of entries) {
    if (e.type !== 'dir') continue;
    const rel = `${e.rel}/SKILL.md`;
    const text = repo.readTextOrNull(rel);
    if (text === null) continue;
    const fm = frontmatter(text);
    const desc = fm.description || '';
    // The description's first sentence is the one-liner; the rest is the
    // routing contract (when to use / NOT for) shown in the detail panel.
    const first = desc ? desc.split(/(?<=[.!?])\s+/)[0] : '';
    items.push({
      name: e.name, // the /-command
      path: rel,
      group: fm.group || 'ungrouped',
      summary: first.slice(0, 220),
      description: desc,
      hint: fm['argument-hint'] || '',
    });
  }
  items.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return { skills: items, groups: GROUPS };
}
