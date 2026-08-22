// Library — two ways to find things, clearly separated: curated quick access
// (business-language tiles onto the OS's stable skeleton) and the raw folder
// tree. The underlying structure is never touched; descriptions in folder
// views come from the CLAUDE.md navigation files agents maintain.
import { api } from '/api.js';
import { el, icon, timeAgo, setCrumbs, spinner, gatedTag } from '/ui.js';

const BC = 'product-development/product/strategy/business-context';
const P = 'product-development/product';

function it(name, target, desc, kind = 'dir') { return { name, target, desc, kind }; }

const QUICK = [
  {
    title: 'Product',
    groups: [
      {
        name: 'General context',
        items: [
          it('Business info', `${BC}/business-info.md`, 'Who we are — company, product, customers, pricing', 'file'),
          it('Stakeholders', `${BC}/stakeholders.md`, 'Who decides, what they care about, how to win them', 'file'),
          it('Segmentation matrix', `${BC}/segmentation-matrix.md`, 'Accounts and revenue by vertical, size and use case', 'file'),
          it('Competitors', `${P}/competitive-research`, 'The landscape, comparison matrix, competitor teardowns'),
          it('User research & customers', `${P}/customers`, 'Accounts, calls, interviews and feature requests'),
        ],
      },
      {
        name: 'Artifacts',
        items: [
          it('PRDs', `${P}/PRDs`, 'Feature definitions — what we build and why'),
          it('JTBD & job specs', `${P}/PRDs`, 'Jobs breakdowns and buildable job specs, filed beside their PRDs'),
          it('Prototypes', `${P}/prototypes`, 'Clickable prototypes and the feedback on them'),
        ],
      },
      {
        name: 'Raw data',
        items: [
          it('Meetings', `${P}/meetings`, 'Meeting records — transcripts, summaries, retros'),
          it('Launches', `${P}/launches`, 'Launch checklists and ship / no-ship verdicts'),
          it('Decisions', `${P}/decisions`, 'Why we chose what we chose, dated'),
          it('Inbox (drop zone)', 'product-development/inbox', 'Where new transcripts and documents land before filing'),
        ],
      },
    ],
  },
  {
    title: 'Data & build',
    groups: [{
      name: null,
      items: [
        it('Analytics', 'product-development/analytics', 'Metrics, queries, schemas, dashboards, experiments'),
        it('Engineering', 'product-development/engineering', 'Tech constraints, the code-repo registry, implementation plans'),
      ],
    }],
  },
  {
    title: 'System',
    groups: [{
      name: null,
      items: [
        it('CLAUDE.md', 'CLAUDE.md', 'The root steering file every session loads first', 'file'),
        it('Skills', '.claude/skills', 'The team\'s guided programs — /prd-draft, /process-meeting, …'),
        it('Agents', '.claude/agents', 'Reviewer personas and subagent definitions'),
        it('Hooks', '.claude/hooks', 'Session automation — write guard, auto-sync, session briefing'),
      ],
    }],
  },
];

export async function render(view, params) {
  const path = params.get('path') || '';
  view.append(spinner());
  const d = await api.get(`/api/library?path=${encodeURIComponent(path)}`);
  view.replaceChildren();

  const parts = d.path ? d.path.split('/') : [];
  setCrumbs([
    { label: 'Library', href: '#/library' },
    ...parts.map((seg, idx) => ({
      label: seg,
      href: `#/library?path=${encodeURIComponent(parts.slice(0, idx + 1).join('/'))}`,
    })),
  ]);

  const page = el('div', { class: 'page' });
  view.append(page);

  if (!d.path) {
    page.append(
      el('h1', {}, 'Library'),
      el('div', { class: 'sub' },
        'Two ways to the same files: quick access by what things mean, or the raw folder tree by where they live.'),
    );
    const tileRefs = [];
    for (const section of QUICK) {
      page.append(el('h2', { class: 'group-head' }, section.title));
      for (const group of section.groups) {
        if (group.name) page.append(el('div', { class: 'subgroup' }, group.name));
        else page.append(el('div', { style: 'height:10px' }));
        page.append(el('div', { class: 'tiles' }, group.items.map((q) => {
          const href = q.kind === 'file'
            ? `#/file?path=${encodeURIComponent(q.target)}`
            : `#/library?path=${encodeURIComponent(q.target)}`;
          const nameRow = el('div', { class: 'row-t' },
            icon(q.kind === 'file' ? 'file' : 'folder'),
            el('span', { class: 'grow' }, q.name));
          tileRefs.push({ target: q.target, nameRow });
          return el('a', { class: 'tile', href, title: q.target },
            nameRow,
            el('div', { class: 'd' }, q.desc));
        })));
      }
    }
    // gated badges on the tiles, one bulk lookup
    const targets = [...new Set(tileRefs.map((t) => t.target))];
    api.get(`/api/tiers?paths=${encodeURIComponent(targets.join('|'))}`).then((tiers) => {
      for (const { target, nameRow } of tileRefs) {
        if (tiers[target] === 'gated') nameRow.append(gatedTag('gated'));
      }
    }).catch(() => { /* badges are decoration */ });

    // the hard split before the raw tree
    page.append(el('div', { class: 'zone-split' },
      el('h2', { class: 'group-head', style: 'margin:0 0 2px' }, 'Raw folder tree'),
      el('div', { class: 'hint', style: 'margin:0 0 12px' },
        'The same files by actual location — for when you know where things live. 🔒 Gated = needs a human\'s approval to change.'),
    ));
  } else {
    page.append(el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
      el('h1', { style: 'margin:0' }, parts[parts.length - 1]),
      gatedTag(d.tier)));
    if (d.blurb) page.append(el('div', { class: 'sub' }, d.blurb));
    if (d.readWhen) page.append(el('div', { class: 'hint', style: 'margin:-12px 0 16px' }, `Read this when: ${d.readWhen}`));
  }

  const table = el('table', { class: 'data' },
    el('thead', {}, el('tr', {}, el('th', {}, ''), el('th', {}, 'Name'), el('th', {}, 'What it is'), el('th', {}, 'Changed'))));
  const tbody = el('tbody', {});
  table.append(tbody);
  for (const e of d.entries) {
    const href = e.type === 'dir' ? `#/library?path=${encodeURIComponent(e.rel)}` : `#/file?path=${encodeURIComponent(e.rel)}`;
    tbody.append(el('tr', { class: 'click', onclick: () => { location.hash = href; } },
      el('td', { style: 'width:26px' }, icon(e.type === 'dir' ? 'folder' : 'file')),
      el('td', { style: 'white-space:nowrap' },
        el('a', { href, onclick: (ev) => ev.stopPropagation() }, e.name),
        ' ', gatedTag(e.tier)),
      el('td', { style: 'color:var(--muted)' }, e.desc || ''),
      el('td', { style: 'white-space:nowrap; color:var(--muted); font-size:12px' }, timeAgo(e.mtimeMs)),
    ));
  }
  if (!d.entries.length) tbody.append(el('tr', {}, el('td', { colspan: 4 }, el('div', { class: 'empty' }, 'Empty folder'))));
  page.append(el('div', { class: 'card scroll-x', style: 'padding:6px 10px' }, table));
}
