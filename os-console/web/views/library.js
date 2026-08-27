// Library — two ways to find things, clearly separated: curated quick access
// (business-language tiles onto the OS's stable skeleton) and the raw folder
// tree. The underlying structure is never touched; descriptions in folder
// views come from the CLAUDE.md navigation files agents maintain.
import { api } from '/api.js';
import { el, icon, timeAgo, setCrumbs, spinner, gatedTag } from '/ui.js';

const BC = 'product-development/product/strategy/business-context';
const P = 'product-development/product';
const CR = `${P}/competitive-research`;

// kind: 'dir' | 'file' → the target is a repo path; 'view' → the target is a console
// route (href used as-is) and policyPath is the repo path behind it for the gated badge.
function it(name, target, desc, kind = 'dir', policyPath = null) { return { name, target, desc, kind, policyPath }; }

const QUICK = [
  {
    title: 'Steering files',
    key: 'steering',
    groups: [{
      name: null,
      items: [
        it('CLAUDE.md', 'CLAUDE.md', 'The root steering file every session loads first', 'file'),
        it('Feature index', '#/features', 'The product map — every feature and its artifacts, browsable', 'view', 'product-development/feature-index.yaml'),
        it('Toolchain', 'product-development/toolchain.yaml', 'Tool choices and live connections, one per surface', 'file'),
        it('Business info', `${BC}/business-info.md`, 'Who we are — company, product, customers, pricing', 'file'),
        it('Stakeholders', `${BC}/stakeholders.md`, 'Who decides, what they care about, how to win them', 'file'),
        it('Segmentation matrix', `${BC}/segmentation-matrix.md`, 'Accounts and revenue by vertical, size and use case', 'file'),
        it('Competitive landscape', `${CR}/competitive-landscape.md`, 'The tiered competitor list and how we position against each', 'file'),
        it('Competitive matrix', `${CR}/competitive-matrix.md`, 'Capability-by-capability comparison across competitors', 'file'),
        it('Templates', '#/templates', 'The governed document scaffolds — PRD, job spec, interview, retro, …', 'view', `${P}/handbook/templates`),
      ],
    }],
  },
  {
    title: 'Artifacts',
    key: 'artifacts',
    groups: [{
      name: null,
      items: [
        it('PRDs', `${P}/PRDs`, 'Feature definitions — what we build and why'),
        it('JTBD & job specs', `${P}/PRDs`, 'Jobs breakdowns and buildable job specs, filed beside their PRDs'),
        it('Prototypes', `${P}/prototypes`, 'Clickable prototypes and the feedback on them'),
      ],
    }],
  },
  {
    title: 'Source data',
    key: 'source',
    groups: [{
      name: null,
      items: [
        it('Competitors', CR, 'Competitor teardowns and dated monitoring intel'),
        it('Customers and user research', `${P}/customers`, 'Accounts, calls, interviews and feature requests'),
        it('Meetings', `${P}/meetings`, 'Meeting records — transcripts, summaries, retros'),
        it('Decisions', `${P}/decisions`, 'Why we chose what we chose, dated'),
        it('Launches', `${P}/launches`, 'Launch checklists and ship / no-ship verdicts'),
        it('Inbox (drop zone)', 'product-development/inbox', 'Where new transcripts and documents land before filing'),
      ],
    }],
  },
  {
    title: 'Data, tech and the codebase',
    key: 'data',
    groups: [{
      name: null,
      items: [
        it('Analytics', 'product-development/analytics', 'Metrics, queries, schemas, dashboards, experiments'),
        it('Engineering', 'product-development/engineering', 'Tech constraints, the code-repo registry, implementation plans'),
      ],
    }],
  },
  {
    // Same name as the Gated files page's group — one vocabulary everywhere.
    title: 'System rules',
    key: 'system',
    groups: [{
      name: null,
      items: [
        it('Skills', '.claude/skills', 'The team\'s guided programs — /prd-draft, /process-meeting, …'),
        it('Agents', '.claude/agents', 'Reviewer personas and subagent definitions'),
        it('Hooks', '.claude/hooks', 'Session automation — write guard, auto-sync, session briefing'),
      ],
    }],
  },
];

// Two views over the same files: the curated Library (default) and the raw
// Folder tree — switched at the top, never shown together.
function viewSwitch(mode) {
  return el('div', { class: 'view-switch', role: 'group', 'aria-label': 'Library view' },
    el('a', { class: mode === 'lib' ? 'on' : '', href: '#/library' }, 'Library'),
    el('a', { class: mode === 'tree' ? 'on' : '', href: '#/library?view=tree' }, 'Folder tree'));
}

export async function render(view, params) {
  const path = params.get('path') || '';
  const mode = (path || params.get('view') === 'tree') ? 'tree' : 'lib';
  view.append(spinner());
  const d = mode === 'tree' ? await api.get(`/api/library?path=${encodeURIComponent(path)}`) : null;
  view.replaceChildren();

  const parts = path ? path.split('/') : [];
  setCrumbs([
    { label: 'Library', href: '#/library' },
    ...parts.map((seg, idx) => ({
      label: seg,
      href: `#/library?path=${encodeURIComponent(parts.slice(0, idx + 1).join('/'))}`,
    })),
  ]);

  const page = el('div', { class: 'page' });
  view.append(page);

  if (mode === 'lib') {
    page.append(
      el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
        el('h1', { class: 'grow', style: 'margin:0' }, 'Library'),
        viewSwitch(mode)),
      el('div', { class: 'sub' },
        'Quick access by what things mean. The same files by location: Folder tree.'),
    );
    const tileRefs = [];
    for (const section of QUICK) {
      page.append(el('h2', { class: `group-head g-${section.key}` },
        el('span', { class: 'group-dot' }), section.title));
      for (const group of section.groups) {
        if (group.name) page.append(el('div', { class: 'subgroup' }, group.name));
        else page.append(el('div', { style: 'height:10px' }));
        page.append(el('div', { class: 'tiles' }, group.items.map((q) => {
          const href = q.kind === 'view' ? q.target
            : q.kind === 'file' ? `#/file?path=${encodeURIComponent(q.target)}`
              : `#/library?path=${encodeURIComponent(q.target)}`;
          const tile = el('a', { class: `tile g-${section.key}`, href, title: q.policyPath || (q.kind === 'view' ? q.name : q.target) },
            el('div', { class: 'row-t' },
              icon(q.kind === 'view' ? 'copy' : q.kind === 'file' ? 'file' : 'folder'),
              el('span', { class: 'grow' }, q.name)),
            el('div', { class: 'd' }, q.desc));
          tileRefs.push({ target: q.policyPath || (q.kind === 'view' ? null : q.target), tile });
          return tile;
        })));
      }
    }
    // gated badges pinned to the tile corner, one bulk lookup
    const targets = [...new Set(tileRefs.filter((t) => t.target).map((t) => t.target))];
    api.get(`/api/tiers?paths=${encodeURIComponent(targets.join('|'))}`).then((tiers) => {
      for (const { target, tile } of tileRefs) {
        if (tiers[target] === 'gated') {
          const tag = gatedTag('gated', true);
          tag.classList.add('gate-corner');
          tile.append(tag);
        }
      }
    }).catch(() => { /* badges are decoration */ });
    return;
  }

  // ---- folder tree ----------------------------------------------------------
  if (!path) {
    page.append(
      el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
        el('h1', { class: 'grow', style: 'margin:0' }, 'Library'),
        viewSwitch(mode)),
      el('div', { class: 'sub' },
        'The raw folder tree — the same files by actual location. 🔒 Gated = needs a human\'s approval to change.'),
    );
  } else {
    page.append(el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
      el('h1', { style: 'margin:0' }, parts[parts.length - 1]),
      gatedTag(d.tier),
      el('span', { class: 'grow' }),
      viewSwitch(mode)));
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
