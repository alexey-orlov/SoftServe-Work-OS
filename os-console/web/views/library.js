// Library — the friendly repo browser. Folder CLAUDE.md files provide the
// human-readable descriptions; the raw hierarchy stays untouched underneath.
import { api } from '/api.js';
import { el, icon, timeAgo, setCrumbs, spinner } from '/ui.js';

// Curated shortcuts into the OS's stable skeleton (falls back to raw browsing).
const SECTIONS = [
  ['Product', [
    ['Initiatives', 'product-development/product/initiatives'],
    ['PRDs & specs', 'product-development/product/PRDs'],
    ['Customers', 'product-development/product/customers'],
    ['Decisions', 'product-development/product/decisions'],
    ['Strategy', 'product-development/product/strategy'],
    ['Competitive research', 'product-development/product/competitive-research'],
    ['Meetings', 'product-development/product/meetings'],
    ['Launches', 'product-development/product/launches'],
    ['Reports & planning', 'product-development/product/reports'],
    ['Prototypes', 'product-development/product/prototypes'],
    ['Handbook', 'product-development/product/handbook'],
  ]],
  ['Data & build', [
    ['Analytics', 'product-development/analytics'],
    ['Engineering', 'product-development/engineering'],
    ['Inbox (drop zone)', 'product-development/inbox'],
  ]],
  ['System', [
    ['Governance', 'governance'],
    ['OS installation', 'os-installation'],
    ['Docs site', 'Documentation'],
    ['Automation (.claude)', '.claude'],
  ]],
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
    page.append(el('h1', {}, 'Library'),
      el('div', { class: 'sub' }, 'The whole wiki, organized by what things are. Folder descriptions come from the navigation files agents maintain.'));
    for (const [label, links] of SECTIONS) {
      page.append(el('h2', { class: 'section' }, label));
      page.append(el('div', { class: 'tiles' }, links.map(([name, p]) =>
        el('a', { class: 'tile', href: `#/library?path=${encodeURIComponent(p)}` },
          el('div', { style: 'font-weight:640; font-size:13.5px' }, name),
          el('div', { class: 't', style: 'margin-top:3px' }, p)))));
    }
    page.append(el('h2', { class: 'section' }, 'Raw root'));
  } else {
    page.append(el('h1', {}, parts[parts.length - 1]));
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
      el('td', { style: 'white-space:nowrap' }, el('a', { href, onclick: (ev) => ev.stopPropagation() }, e.name)),
      el('td', { style: 'color:var(--muted)' }, e.desc || ''),
      el('td', { style: 'white-space:nowrap; color:var(--muted); font-size:12px' }, timeAgo(e.mtimeMs)),
    ));
  }
  if (!d.entries.length) tbody.append(el('tr', {}, el('td', { colspan: 4 }, el('div', { class: 'empty' }, 'Empty folder'))));
  page.append(el('div', { class: 'card scroll-x', style: 'padding:6px 10px' }, table));
}
