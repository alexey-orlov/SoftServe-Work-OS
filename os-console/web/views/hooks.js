// Hooks — second-level group page (same skeleton as Filing & linking rules:
// crumbs back to OS harness, h1 + sub, eyebrow'd tile grids). Two halves: the
// three scripts that run on their own, and the files that decide whether they
// run at all. The folder tile used to stand for all of this, which showed the
// scripts and hid the switch that turns them on.
import { api } from '/api.js';
import { el, icon, timeAgo, setCrumbs, spinner, gatedTag } from '/ui.js';

const H = '.claude/hooks';
const C = '.claude';

const GROUPS = [
  {
    title: 'What runs on its own',
    items: [
      {
        name: 'Session briefing',
        path: `${H}/session-start.sh`,
        desc: 'Opens every session with the recent decisions, the quarter\'s priorities, the active initiatives, the team\'s rules and the latest repo health',
        ico: 'bulb',
      },
      {
        name: 'Write guard',
        path: `${H}/write-guard.sh`,
        desc: 'Stops an agent before it writes a protected path and asks a person to approve it first — the 🔒 prompt',
        ico: 'shield',
      },
      {
        name: 'Auto-sync engine',
        path: `${H}/auto-commit.sh`,
        desc: 'Commits the turn\'s work and lands it the way the auto-sync setting says, and keeps the console snapshot current where Node is installed',
        ico: 'refresh',
      },
    ],
  },
  {
    title: 'What switches them on',
    items: [
      {
        name: 'Hook wiring',
        path: `${C}/settings.json`,
        desc: 'Which script runs at which moment — session start, before a write, at the end of a turn. Nothing above runs unless it is named here',
        ico: 'sliders',
      },
      {
        name: 'How they work',
        path: `${H}/session-start.md`,
        desc: 'The reference behind all three — what each hook injects or blocks, and the settings schema it is wired through',
        ico: 'doc',
      },
    ],
  },
];

export async function render(view) {
  view.append(spinner());
  const listings = await Promise.all([H, C].map((d) =>
    api.get(`/api/library?path=${encodeURIComponent(d)}`).catch(() => null)));
  view.replaceChildren();
  setCrumbs([{ label: 'OS harness', href: '#/harness' }, { label: 'Hooks' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Hooks'),
    el('div', { class: 'sub' },
      'The three things that happen without anyone asking — at the start of a session, before a protected file changes, and when a turn ends. All of it is gated: these files decide what every future session does.'),
  );

  const byRel = new Map(listings.flatMap((d) => (d ? d.entries.map((e) => [e.rel, e]) : [])));

  for (const group of GROUPS) {
    page.append(
      el('h2', { class: 'group-head g-agents' }, el('span', { class: 'group-dot' }), group.title),
      el('div', { class: 'tiles', style: 'grid-template-columns:repeat(auto-fit, minmax(260px, 1fr))' },
        group.items.map((t) => {
          const entry = byRel.get(t.path);
          return el('a', { class: 'tile g-agents', href: `#/file?path=${encodeURIComponent(t.path)}`, title: t.path },
            el('div', { class: 'row-t' }, icon(t.ico), el('span', { class: 'grow' }, t.name), gatedTag(entry && entry.tier, true)),
            el('div', { class: 'd' }, t.desc),
            entry ? el('div', { class: 'd', style: 'margin-top:6px; font-size:11px; opacity:.75' }, `Changed ${timeAgo(entry.mtimeMs)}`) : null,
          );
        })),
    );
  }
}
