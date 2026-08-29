// Competition — second-level group page (same skeleton as Templates and Skills:
// crumbs back to Library, h1 + sub, tile grid). Groups the two competitive
// steering surfaces, with the raw research folder as the escape hatch.
import { api } from '/api.js';
import { el, icon, timeAgo, setCrumbs, spinner, gatedTag, cmdChip } from '/ui.js';

const CR = 'product-development/product/competitive-research';

const TILES = [
  {
    name: 'Competitive landscape',
    path: `${CR}/competitive-landscape.md`,
    desc: 'The tiered competitor list and how we position against each',
    ico: 'target',
  },
  {
    name: 'Competitive matrix',
    path: `${CR}/competitive-matrix.md`,
    desc: 'Capability-by-capability comparison across competitors',
    ico: 'target',
  },
];

export async function render(view) {
  view.append(spinner());
  const dir = await api.get(`/api/library?path=${encodeURIComponent(CR)}`).catch(() => null);
  view.replaceChildren();
  setCrumbs([{ label: 'Library', href: '#/library' }, { label: 'Competition' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Competition'),
    el('div', { class: 'sub' },
      'How we position and compare. Two living pages carry the picture — the landscape (who we compete with, tiered) and the matrix (capability by capability). Teardowns and dated intel sit underneath.'),
  );

  const teardowns = dir ? dir.entries.filter((e) => e.type === 'dir' && e.name === 'competitors') : [];
  const byRel = new Map(dir ? dir.entries.map((e) => [e.rel, e]) : []);

  page.append(el('div', { class: 'tiles', style: 'grid-template-columns:repeat(auto-fit, minmax(230px, 1fr))' },
    TILES.map((t) => {
      const entry = byRel.get(t.path);
      return el('a', { class: 'tile g-steering', href: `#/file?path=${encodeURIComponent(t.path)}`, title: t.path },
        el('div', { class: 'row-t' }, icon(t.ico), el('span', { class: 'grow' }, t.name), gatedTag(entry && entry.tier, true)),
        el('div', { class: 'd' }, t.desc),
        entry ? el('div', { class: 'd', style: 'margin-top:6px; font-size:11px; opacity:.75' }, `Changed ${timeAgo(entry.mtimeMs)}`) : null,
      );
    }),
    el('a', { class: 'tile g-steering', href: `#/library?path=${encodeURIComponent(CR)}`, title: CR },
      el('div', { class: 'row-t' }, icon('folder'), el('span', { class: 'grow' }, 'Teardowns & intel')),
      el('div', { class: 'd' }, 'Per-competitor teardown files and dated monitoring records — the raw research behind the two pages above'),
      teardowns.length ? el('div', { class: 'd', style: 'margin-top:6px; font-size:11px; opacity:.75' }, 'Browse the folder') : null,
    ),
  ));

  page.append(el('div', { class: 'card subpage-foot' },
    el('h3', {}, 'Keeping this current'),
    el('div', { class: 'hint', style: 'margin-bottom:8px' },
      'One guided program owns these pages — deep analysis on demand, monitoring on a cadence:'),
    el('div', { class: 'chips' }, cmdChip('/competitor-analysis')),
  ));
}
