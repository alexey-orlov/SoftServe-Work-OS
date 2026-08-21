// Steering — every file that steers agent sessions, with freshness. Derived from
// the write policy's gated tier + living-pages registry.
import { api } from '/api.js';
import { el, icon, tierPill, timeAgo, setCrumbs, spinner } from '/ui.js';

const GROUPS = [
  ['core', 'Core steering', 'The distilled context every session leans on — the map, the choices, the rules.'],
  ['business', 'Business context', 'Who we are: company, ICP, personas, pricing, stakeholders, segments.'],
  ['living', 'Living pages', 'Edit-in-place current-truth pages (auto tier) — keep them current, never append-only.'],
];

export async function render(view) {
  view.append(spinner());
  const d = await api.get('/api/steering');
  view.replaceChildren();
  setCrumbs([{ label: 'Steering' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Steering files'),
    el('div', { class: 'sub' },
      'These files set the context every agent session starts from. Gated ones are protected by the write policy — a save from the console is your approval, and it commits immediately.'),
  );

  for (const [key, title, blurb] of GROUPS) {
    const rows = d.rows.filter((r) => r.group === key);
    if (!rows.length) continue;
    page.append(el('h2', { class: 'section' }, title));
    const tbody = el('tbody', {});
    for (const r of rows) {
      tbody.append(el('tr', { class: 'click', onclick: () => { location.hash = `#/file?path=${encodeURIComponent(r.path)}`; } },
        el('td', { style: 'width:34%' },
          el('a', { href: `#/file?path=${encodeURIComponent(r.path)}`, onclick: (e) => e.stopPropagation() }, r.title),
          el('span', { class: 'mini' }, r.role)),
        el('td', {}, el('span', { class: 'path' }, r.path)),
        el('td', { style: 'width:70px' }, tierPill(r.tier)),
        el('td', { style: 'white-space:nowrap; color:var(--muted); font-size:12px' },
          r.updatedHeader ? `_updated ${r.updatedHeader}` : timeAgo(r.lastChange)),
        el('td', { style: 'width:60px; text-align:right' },
          el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(r.path)}`, onclick: (e) => e.stopPropagation() }, icon('edit'))),
      ));
    }
    page.append(el('div', { class: 'card scroll-x', style: 'padding:6px 10px' },
      el('div', { class: 'hint', style: 'margin:8px 6px 2px' }, blurb),
      el('table', { class: 'data' },
        el('thead', {}, el('tr', {}, el('th', {}, 'File'), el('th', {}, 'Path'), el('th', {}, 'Tier'), el('th', {}, 'Updated'), el('th', {}, ''))),
        tbody)));
  }

  page.append(el('div', { class: 'card', style: 'margin-top:16px' },
    el('h3', {}, 'Also steering, managed elsewhere'),
    el('div', { class: 'hint', style: 'margin:0' },
      'Templates (their own view), the write policy itself (Governance), and skills/agents/hooks under .claude/ (Library › System).'),
  ));
}
