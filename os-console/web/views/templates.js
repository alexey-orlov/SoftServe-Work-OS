// Templates & writing guides — the two handbook registries. "Use" copies a
// template to its canonical home; editing a template is a gated steering change.
import { api } from '/api.js';
import { el, icon, toast, modal, field, setCrumbs, spinner, cmdChip, gatedTag, LITE, liteLock } from '/ui.js';

// Business-language descriptions per template (fallback: the repo's own nav line).
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
};

const GUIDES_DIR = 'product-development/product/handbook/writing-guides';

export async function render(view) {
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
    el('h1', {}, 'Templates & writing guides'),
    el('div', { class: 'sub' },
      'The team\'s agreed starting points. Templates are copied, never filled in place — "Use" stamps a copy at its destination. Writing guides set the house style per audience.'),
  );

  // templates
  page.append(el('h2', { class: 'group-head', style: 'margin-top:12px' }, 'Templates'),
    el('div', { style: 'height:10px' }));
  if (!d.items.length) page.append(el('div', { class: 'empty' }, 'No templates in the handbook yet.'));
  page.append(el('div', { class: 'init-grid' }, d.items.map((t) => {
    return el('div', { class: 'init-card', style: 'cursor:default' },
      el('div', { class: 'row', style: 'align-items:flex-start' },
        el('div', { class: 'name grow', style: 'padding-right:0' }, t.title),
        el('span', { style: 'margin-top:2px' }, gatedTag(t.tier))),
      el('div', { class: 'status-line', style: '-webkit-line-clamp:3' }, TEMPLATE_DESCS[t.name] || t.desc || ''),
      el('div', { class: 'path', style: 'font-size:10px; opacity:.55' }, t.suggest),
      el('div', { class: 'row', style: 'margin-top:4px' },
        (() => {
          const b = el('button', { class: 'btn small primary', onclick: () => useModal(t) }, icon('plus'), 'Use');
          return LITE ? liteLock(b) : b;
        })(),
        el('a', { class: 'btn small', href: `#/file?path=${encodeURIComponent(t.path)}` }, 'Preview'),
        el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(t.path)}`, title: 'Gated — changes every future document made from this template' }, icon('lock'), 'Edit'),
      ),
    );
  })));

  // writing guides
  if (guides && guides.entries) {
    const rows = guides.entries.filter((e) => e.type === 'file' && e.name !== 'CLAUDE.md');
    if (rows.length) {
      page.append(el('h2', { class: 'group-head' }, 'Writing guides'),
        el('div', { style: 'height:10px' }));
      const card = el('div', { class: 'card' },
        el('div', { class: 'hint' }, 'How we write for each audience — loaded by drafting skills, worth skimming yourself.'));
      for (const g of rows) {
        card.append(el('div', { class: 'art-row' },
          el('span', { class: 'val grow' },
            el('a', { href: `#/file?path=${encodeURIComponent(g.rel)}`, style: 'font-weight:600' },
              g.name.replace(/\.md$/, '').replace(/^./, (c) => c.toUpperCase())),
            ' ', gatedTag(g.tier),
            el('span', { class: 'mini' }, g.desc || '')),
          el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(g.rel)}`, title: 'Edit' }, icon('edit'), 'Edit'),
        ));
      }
      page.append(card);
    }
  }

  page.append(el('div', { class: 'card', style: 'margin-top:18px' },
    el('h3', {}, 'Filling one out with help'),
    el('div', { class: 'hint', style: 'margin-bottom:8px' },
      'For substantial documents, the guided programs in Claude Code draft on top of these templates with the Work OS\'s context loaded:'),
    el('div', { class: 'chips' }, cmdChip('/prd-draft'), cmdChip('/job-spec-draft'), cmdChip('/launch-checklist'), cmdChip('/interview-guide')),
  ));
}

function useModal(t) {
  const dest = el('input', { class: 'mono', value: t.suggest });
  modal({
    title: `Use ${t.title}`,
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
