// Library — two ways to find things, clearly separated: curated quick access
// (business-language tiles onto the OS's stable skeleton) and the raw folder
// tree. The underlying structure is never touched; descriptions in folder
// views come from the CLAUDE.md navigation files agents maintain.
import { api } from '/api.js';
import { el, icon, timeAgo, setCrumbs, spinner, gatedTag, tabBar, activeTab } from '/ui.js';

const BC = 'product-development/product/strategy/business-context';
const P = 'product-development/product';
const CR = `${P}/competitive-research`;

// kind: 'dir' | 'file' → the target is a repo path; 'view' → the target is a console
// route (href used as-is) and policyPath is the repo path behind it for the gated badge.
// ico overrides the kind-derived tile icon.
function it(name, target, desc, kind = 'dir', policyPath = null, ico = null) { return { name, target, desc, kind, policyPath, ico }; }

const TPL = `${P}/handbook/templates`;

const QUICK = [
  {
    // Two rows of three: who we are (root steering → business → segments), then
    // the market, the product's own mechanics, and the people who decide.
    // Feature index lives in the Product map nav entry; Toolchain in Setup → Integrations.
    title: 'Strategic context',
    key: 'strategic',
    cols: 3,
    groups: [{
      name: null,
      items: [
        it('CLAUDE.md', 'CLAUDE.md', 'The root steering file every session loads first', 'file'),
        it('Business info', `${BC}/business-info.md`, 'Who we are — company, product, customers, pricing', 'file'),
        it('Segmentation matrix', `${BC}/segmentation-matrix.md`, 'Accounts and revenue by vertical, size and use case', 'file'),
        it('Competition', '#/competition', 'How we position and compare — the landscape and the capability matrix', 'view', CR, 'target'),
        it('Platform model', `${BC}/platform-model.md`, 'How the product works underneath — access, states, obligations', 'file'),
        it('Stakeholders', `${BC}/stakeholders.md`, 'Who decides, what they care about, how to win them', 'file'),
      ],
    }],
  },
  {
    // One tile per tab of the Templates page — the four keep the same names and
    // the same order in both places, so the section reads as that page's index.
    title: 'Templates',
    key: 'templates',
    groups: [{
      name: null,
      items: [
        it('PRDs and specs', '#/templates?tab=prds', 'PRD, jobs breakdown and job spec scaffolds', 'view', TPL, 'doc'),
        it('Meetings & interviews', '#/templates?tab=meetings', 'Customer interview and retrospective scaffolds', 'view', TPL, 'book'),
        it('Other templates', '#/templates?tab=other', 'Initiative page, launch checklist, account and competitor scaffolds', 'view', TPL, 'copy'),
        it('Writing styles', '#/templates?tab=writing', 'The house voice per audience — customer, executive, internal, technical', 'view', `${P}/handbook/writing-guides`, 'edit'),
      ],
    }],
  },
  {
    // Two rows of four: the market and where we said we are going first, then
    // the running record of what happened and what is still coming in.
    title: 'Ongoing business context',
    key: 'ongoing',
    groups: [{
      name: null,
      items: [
        it('Competitors', CR, 'Competitor teardowns and dated monitoring intel'),
        it('Customers', `${P}/customers`, 'The tracked accounts — context and call records'),
        it('Roadmap & OKRs', `${P}/strategy`, 'This quarter\'s objectives and key results, and the roadmaps ahead'),
        it('User insights', `${P}/user-insights`, 'Syntheses, interviews, feature requests, guides, journey maps'),
        it('Meetings', `${P}/meetings`, 'Meeting records — transcripts, summaries, retros'),
        it('Decisions', `${P}/decisions`, 'Why we chose what we chose, dated'),
        it('Launches', `${P}/launches`, 'Launch checklists and ship / no-ship verdicts'),
        it('Inbox (drop zone)', 'product-development/inbox', 'Where new transcripts and documents land before filing'),
      ],
    }],
  },
  {
    title: 'Artifacts',
    key: 'artifacts',
    groups: [{
      name: null,
      items: [
        // One tile, because it is one folder: a PRD, its jobs breakdown and its job
        // specs are filed side by side under PRDs/{area}/ and told apart by filename
        // suffix. Two tiles here pointed at the same listing.
        it('PRDs, JTBD & job specs', `${P}/PRDs`, 'Feature definitions, jobs breakdowns and buildable job specs — filed together by area, with each area\'s reviews/ alongside'),
        it('Prototypes', `${P}/prototypes`, 'Clickable prototypes and the feedback on them'),
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
        it('Skills', '#/skills', 'The team\'s guided programs, mapped to the product workflow', 'view', '.claude/skills', 'zap'),
        it('Agents', '.claude/agents', 'Reviewer personas and subagent definitions'),
        it('Hooks', '.claude/hooks', 'Session automation — write guard, auto-sync, session briefing'),
      ],
    }],
  },
];

// Three tabs over the six tile groups: what the team knows, what it produces,
// and the OS's own rules. Each row is [id, label, section keys, one-line hint].
// A tab holding a single section drops that section's heading — printing the
// tab's own name again right under it is noise, and the tiles keep the group's
// colour on their left edge either way.
// Data, tech and the codebase sits with the context, not the output: the warehouse
// and the repos are set up before the OS runs, and the OS reads them — it does not
// produce them. It comes last in the tab because it is the substrate a PM reaches for
// least often, under the material they touch daily.
const TABS = [
  ['context', 'Business context', ['strategic', 'templates', 'ongoing', 'data'],
    'Who we are, the scaffolds we write with, everything the team keeps learning, and the data and code underneath it all.'],
  ['output', 'Output artifacts', ['artifacts'],
    'What the team produces out of all that — feature definitions, job specs, and the prototypes that test them.'],
  ['system', 'System rules', ['system'],
    'The OS itself — the guided programs, reviewer personas and session automation.'],
];

// Every tile's policy path, looked up once per page rather than once per tab.
const ALL_TARGETS = [...new Set(QUICK.flatMap((s) => s.groups.flatMap((g) => g.items))
  .map((q) => q.policyPath || (q.kind === 'view' ? null : q.target))
  .filter(Boolean))];

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
    // Gated badges are one bulk lookup for the whole page, not one per tab, so
    // switching tabs never re-fetches and never flashes an unbadged tile.
    const tiers = api.get(`/api/tiers?paths=${encodeURIComponent(ALL_TARGETS.join('|'))}`)
      .catch(() => ({ /* badges are decoration */ }));

    const content = el('div', {});
    let active = activeTab(params, TABS);
    page.append(
      tabBar({
        route: 'library',
        tabs: TABS.map(([id, label]) => [id, label]),
        active,
        onSelect: (id) => { active = id; draw(); },
      }),
      content,
    );

    function draw() {
      content.replaceChildren();
      const [, , keys, hint] = TABS.find(([id]) => id === active);
      const sections = keys.map((k) => QUICK.find((s) => s.key === k)).filter(Boolean);
      content.append(el('div', { class: 'hint', style: 'margin:-4px 0 4px' }, hint));

      const tileRefs = [];
      for (const section of sections) {
        // A lone section is already named by the tab it sits in.
        if (sections.length > 1) {
          content.append(el('h2', { class: `group-head g-${section.key}` },
            el('span', { class: 'group-dot' }), section.title));
        }
        for (const group of section.groups) {
          if (group.name) content.append(el('div', { class: 'subgroup' }, group.name));
          else content.append(el('div', { style: 'height:10px' }));
          // `quick` = the fixed Library rhythm — 4 tiles a row, or 3 where the
          // section asks for roomier cards, so groups break into even rows.
          const grid = `tiles quick${section.cols === 3 ? ' three-up' : ''}`;
          content.append(el('div', { class: grid }, group.items.map((q) => {
            const href = q.kind === 'view' ? q.target
              : q.kind === 'file' ? `#/file?path=${encodeURIComponent(q.target)}`
                : `#/library?path=${encodeURIComponent(q.target)}`;
            const tile = el('a', { class: `tile g-${section.key}`, href, title: q.policyPath || (q.kind === 'view' ? q.name : q.target) },
              el('div', { class: 'row-t' },
                icon(q.ico || (q.kind === 'view' ? 'copy' : q.kind === 'file' ? 'file' : 'folder')),
                el('span', { class: 'grow' }, q.name)),
              el('div', { class: 'd' }, q.desc));
            tileRefs.push({ target: q.policyPath || (q.kind === 'view' ? null : q.target), tile });
            return tile;
          })));
        }
      }
      // gated badges pinned to the tile corner
      tiers.then((map) => {
        for (const { target, tile } of tileRefs) {
          if (map[target] !== 'gated' || !tile.isConnected) continue;
          const tag = gatedTag('gated', true);
          tag.classList.add('gate-corner');
          tile.append(tag);
        }
      });
    }
    draw();
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
  if (!d.entries.length) tbody.append(el('tr', {}, el('td', { colspan: 4 }, el('div', { class: 'empty' }, 'This folder is empty.'))));
  page.append(el('div', { class: 'card scroll-x', style: 'padding:6px 10px' }, table));
}
