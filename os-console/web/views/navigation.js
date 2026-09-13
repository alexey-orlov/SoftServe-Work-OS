// Agent navigation — second-level page under OS harness. Every folder that
// carries a CLAUDE.md, in one table. A folder's CLAUDE.md is what an agent reads
// when it works inside that folder: what lives there, what to read first, where
// new files go. The folder tree answers that one folder at a time; this answers
// it for the whole repo, and the folders missing from the list are the ones an
// agent walks into with no briefing at all.
import { api } from '/api.js';
import { el, icon, setCrumbs, spinner, gatedTag, staleServerCard } from '/ui.js';

/** Nesting shown by indent rather than a third column — same table, real shape. */
function indent(depth) {
  return depth ? `padding-left:${Math.min(depth, 6) * 14}px` : '';
}

export async function render(view) {
  view.append(spinner());
  // /api/navmap arrived with this page, so a server started before it 404s here.
  // Swallowing that would print "0 folders" over a repo full of them — the same
  // success-shaped exit the OS forbids its own automations.
  let d;
  try {
    d = await api.get('/api/navmap');
  } catch {
    view.replaceChildren();
    setCrumbs([{ label: 'OS harness', href: '#/harness' }, { label: 'Agent navigation' }]);
    view.append(el('div', { class: 'page' }, el('h1', {}, 'Agent navigation'), staleServerCard()));
    return;
  }
  view.replaceChildren();
  setCrumbs([{ label: 'OS harness', href: '#/harness' }, { label: 'Agent navigation' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Agent navigation'),
    el('div', { class: 'sub' },
      `The ${d.items.length} folders that brief an agent working inside them. Each one's CLAUDE.md says what the folder holds, what to read first, and where a new file belongs — so nobody, person or agent, has to guess from the folder name.`),
  );

  const table = el('table', { class: 'data' },
    el('thead', {}, el('tr', {},
      el('th', {}, 'Folder'),
      el('th', {}, 'Navigation file'))));
  const tbody = el('tbody', {});
  table.append(tbody);

  for (const r of d.items) {
    const href = `#/file?path=${encodeURIComponent(r.file)}`;
    // The repo root has no folder name of its own — name it for what it is.
    const label = r.dir || 'Repository root';
    tbody.append(el('tr', { class: 'click', onclick: () => { location.hash = href; } },
      el('td', { style: `white-space:nowrap; ${indent(r.depth)}` },
        icon('folder'), ' ',
        el('a', {
          href: r.dir ? `#/library?path=${encodeURIComponent(r.dir)}` : '#/library?view=tree',
          onclick: (ev) => ev.stopPropagation(),
        }, label)),
      el('td', { style: 'white-space:nowrap' },
        el('a', { href, onclick: (ev) => ev.stopPropagation() }, 'CLAUDE.md'),
        ' ', gatedTag(r.tier)),
    ));
  }
  if (!d.items.length) {
    tbody.append(el('tr', {}, el('td', { colspan: 2 },
      el('div', { class: 'empty' }, 'No folder in this repository carries a CLAUDE.md.'))));
  }

  page.append(el('div', { class: 'card scroll-x', style: 'padding:6px 10px' }, table));
}
