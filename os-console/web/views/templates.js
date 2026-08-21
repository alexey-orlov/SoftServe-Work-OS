// Templates — the governed scaffold registry. "Use" copies to the right home;
// editing the template itself is a gated steering change.
import { api } from '/api.js';
import { el, icon, toast, modal, field, setCrumbs, spinner, cmdChip } from '/ui.js';

export async function render(view) {
  view.append(spinner());
  const d = await api.get('/api/templates');
  view.replaceChildren();
  setCrumbs([{ label: 'Templates' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Templates'),
    el('div', { class: 'sub' },
      'Blank scaffolds with bracketed placeholders — copy, don\'t edit in place. "Use" stamps a copy at its canonical destination and commits it. Editing a template changes every future document (gated — your save is the approval).'),
  );

  page.append(el('div', { class: 'init-grid' }, d.items.map((t) => {
    return el('div', { class: 'init-card', style: 'cursor:default' },
      el('div', { class: 'name' }, t.title),
      el('div', { class: 'status-line' }, t.desc || ''),
      el('div', { class: 'path' }, t.suggest),
      el('div', { class: 'row', style: 'margin-top:4px' },
        el('button', { class: 'btn small primary', onclick: () => useModal(t) }, icon('plus'), 'Use'),
        el('a', { class: 'btn small', href: `#/file?path=${encodeURIComponent(t.path)}` }, 'Preview'),
        el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(t.path)}`, title: 'Gated — changes every future doc' }, icon('lock'), 'Edit'),
        el('span', { class: 'right tag' }, `${t.lines} lines`),
      ),
    );
  })));

  page.append(el('div', { class: 'card', style: 'margin-top:18px' },
    el('h3', {}, 'Filling one out with help'),
    el('div', { class: 'hint', style: 'margin-bottom:8px' },
      'For substantial documents, the guided programs in Claude Code draft on top of these templates with the wiki\'s context loaded:'),
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
        toast(`Created ${r.dest}${r.commit.committed ? ` · committed ${r.commit.sha}` : ''}`);
        window.dispatchEvent(new Event('console:saved'));
        close();
        location.hash = `#/edit?path=${encodeURIComponent(r.dest)}`;
      },
    }],
  });
}
