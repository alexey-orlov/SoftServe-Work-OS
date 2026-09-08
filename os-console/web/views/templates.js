// Templates — the handbook's governed scaffolds and writing guides, in four tabs
// that carry the same names and order as the Library's Templates section, so the
// section reads as this page's index. "Use" copies a template to its canonical
// home; editing a template itself is a gated steering change (the save is the
// approval), which is why every card offers Preview and Edit separately.
import { api } from '/api.js';
import { el, icon, toast, modal, field, setCrumbs, spinner, cmdChip, gatedTag, tabBar, activeTab, LITE, liteLock } from '/ui.js';

const TABS = [
  ['prds', 'PRDs and specs'],
  ['meetings', 'Meetings & interviews'],
  ['other', 'Other templates'],
  ['writing', 'Writing styles'],
];

// Which templates each tab holds, in the order they should read — the PRDs tab is
// the definition chain, so it is deliberately not alphabetical. Anything not named
// here falls to "Other templates", so a new scaffold in the handbook shows up
// rather than disappearing — give it a row in the same change that adds it.
const TAB_TEMPLATES = {
  prds: ['prd-template.md', 'jobs-breakdown-template.md', 'job-spec-template.md'],
  meetings: ['interview-template.md', 'retrospective-template.md'],
};
const CLAIMED = new Set(Object.values(TAB_TEMPLATES).flat());

/** The tab's templates, in declared order; "other" keeps the adapter's own order. */
function templatesFor(tab, items) {
  if (tab === 'other') return items.filter((t) => !CLAIMED.has(t.name));
  return (TAB_TEMPLATES[tab] || [])
    .map((name) => items.find((t) => t.name === name))
    .filter(Boolean);
}

// Business-language descriptions per template (fallback: the repo's own nav line).
// Display names come from the adapter's `label`, so this page and the Setup tab
// name the same template the same way.
const TEMPLATE_DESCS = {
  'prd-template.md': 'Define a feature before building it — the problem, who it serves, what is in and out, and how success is measured.',
  'initiative-page-template.md': 'One living page for a piece of work — where it stands, what exists, what is still open.',
  'launch-checklist-template.md': 'Everything that must be true before a feature ships, prioritized and owned.',
  'retrospective-template.md': 'Capture what went well and what didn\'t while it is fresh — and what the team changes next time.',
  'interview-template.md': 'Run a customer conversation that yields evidence, not opinions — questions, checklist, debrief.',
  'competitor-teardown-template.md': 'A competitor profile the team keeps current — offer, pricing, strengths, where we win.',
  'competitive-area-matrix-template.md': 'Capability-by-capability comparison against competitors for one product area.',
  'jobs-breakdown-template.md': 'Cut an agreed feature into sequenced, independently buildable jobs.',
  'job-spec-template.md': 'The buildable contract for one job — rules, acceptance criteria, edge cases — ready to become tickets.',
  'account-context-template.md': 'The living page for one account — who they are, what they use, what they are asking for.',
};

const TAB_HINTS = {
  prds: 'The definition chain, in order: a PRD frames the bet, a jobs breakdown cuts it into shippable jobs, a job spec makes one job buildable.',
  meetings: 'Scaffolds for talking to people and writing down what came of it. /process-meeting files the result for you.',
  other: 'The remaining scaffolds — living pages, launch gates, and the competitive record.',
  writing: 'How we write for each audience. Loaded by the drafting skills, and worth skimming yourself — these are read, not copied.',
};

const GUIDES_DIR = 'product-development/product/handbook/writing-guides';

export async function render(view, params) {
  view.append(spinner());
  const [d, guides] = await Promise.all([
    api.get('/api/templates'),
    api.get(`/api/library?path=${encodeURIComponent(GUIDES_DIR)}`).catch(() => null),
  ]);
  view.replaceChildren();
  setCrumbs([{ label: 'Library', href: '#/library' }, { label: 'Templates' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Templates'),
    el('div', { class: 'sub' },
      'The team\'s agreed starting points. Templates are copied, never filled in place — "Use" stamps a copy at its destination. Writing guides set the house style per audience.'),
  );

  const content = el('div', {});
  let active = activeTab(params, TABS);
  page.append(
    tabBar({ route: 'templates', tabs: TABS, active, onSelect: (id) => { active = id; draw(); } }),
    content,
  );

  const guideRows = guides && guides.entries
    ? guides.entries.filter((e) => e.type === 'file' && e.name !== 'CLAUDE.md')
    : [];

  function draw() {
    content.replaceChildren();
    content.append(el('div', { class: 'hint', style: 'margin:-4px 0 14px' }, TAB_HINTS[active]));
    if (active === 'writing') drawGuides(content, guideRows);
    else drawTemplates(content, templatesFor(active, d.items));
    if (active === 'prds') {
      content.append(el('div', { class: 'card', style: 'margin-top:18px' },
        el('h3', {}, 'Filling one out with help'),
        el('div', { class: 'hint', style: 'margin-bottom:8px' },
          'For substantial documents, the guided programs in Claude Code draft on top of these templates with the Work OS\'s context loaded:'),
        el('div', { class: 'chips' }, cmdChip('/prd-draft'), cmdChip('/jobs-breakdown'), cmdChip('/job-spec-draft')),
      ));
    }
  }
  draw();
}

function drawTemplates(box, items) {
  if (!items.length) {
    box.append(el('div', { class: 'empty' }, 'No templates in the handbook for this group yet.'));
    return;
  }
  box.append(el('div', { class: 'tiles quick three-up' }, items.map((t) => {
    const card = el('div', { class: 'tile tpl', title: t.path },
      el('div', { class: 'row-t' }, icon('file'),
        el('span', { class: 'grow' }, t.label || t.title)),
      el('div', { class: 'd' }, TEMPLATE_DESCS[t.name] || t.desc || ''),
      el('div', { class: 'path tpl-dest' }, t.suggest),
      el('div', { class: 'row tpl-acts' },
        (() => {
          const b = el('button', { class: 'btn small primary', onclick: () => useModal(t) }, icon('plus'), 'Use');
          return LITE ? liteLock(b) : b;
        })(),
        el('a', { class: 'btn small', href: `#/file?path=${encodeURIComponent(t.path)}` }, 'Preview'),
        el('a', {
          class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(t.path)}`,
          title: 'Gated — changes every future document made from this template',
        }, icon('lock'), 'Edit'),
      ));
    const tag = gatedTag(t.tier, true);
    if (tag) { tag.classList.add('gate-corner'); card.append(tag); }
    return card;
  })));
}

function drawGuides(box, rows) {
  if (!rows.length) {
    box.append(el('div', { class: 'empty' }, 'No writing guides in the handbook yet.'));
    return;
  }
  box.append(el('div', { class: 'tiles quick three-up' }, rows.map((g) => {
    const card = el('div', { class: 'tile tpl', title: g.rel },
      el('div', { class: 'row-t' }, icon('edit'),
        el('span', { class: 'grow' }, g.name.replace(/\.md$/, '').replace(/^./, (c) => c.toUpperCase()))),
      el('div', { class: 'd' }, g.desc || ''),
      el('div', { class: 'row tpl-acts' },
        el('a', { class: 'btn small', href: `#/file?path=${encodeURIComponent(g.rel)}` }, 'Read'),
        el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(g.rel)}` }, icon('edit'), 'Edit'),
      ));
    const tag = gatedTag(g.tier, true);
    if (tag) { tag.classList.add('gate-corner'); card.append(tag); }
    return card;
  })));
}

function useModal(t) {
  const dest = el('input', { class: 'mono', value: t.suggest });
  modal({
    title: `Use ${t.label || t.title}`,
    body: el('div', {},
      field('Destination path', dest, 'Replace the {placeholders} — this becomes the new file, committed immediately.')),
    actions: [{
      label: 'Create', kind: 'primary',
      onclick: async (close) => {
        const r = await api.post('/api/templates/use', { template: t.path, dest: dest.value.trim() });
        toast(`Created ${r.dest} ✓`);
        window.dispatchEvent(new Event('console:saved'));
        close();
        location.hash = `#/edit?path=${encodeURIComponent(r.dest)}`;
      },
    }],
  });
}
