// Filing & linking rules — second-level group page (same skeleton as Competition:
// crumbs back to its parent, h1 + sub, tile grid). Two files, one goal: every
// artifact lands somewhere known and stays reachable from the things it belongs
// to. One states the rule for the skills that write; the other is the registry a
// machine can check that rule against.
import { api } from '/api.js';
import { el, icon, timeAgo, setCrumbs, spinner, gatedTag, cmdChip } from '/ui.js';

const G = 'governance';

const TILES = [
  {
    name: 'Write-back contract',
    path: `${G}/write-back-contract.md`,
    desc: 'The closing steps every writing skill must follow — where the file lands, which index it joins, and who owns each surface',
    ico: 'edit',
  },
  {
    name: 'Link schema',
    path: `${G}/link-schema.yaml`,
    desc: 'The registry of what each artifact type must link to, so no PRD, decision or metric ends up orphaned',
    ico: 'pr',
  },
];

export async function render(view) {
  view.append(spinner());
  const dir = await api.get(`/api/library?path=${encodeURIComponent(G)}`).catch(() => null);
  view.replaceChildren();
  setCrumbs([{ label: 'System files', href: '#/system' }, { label: 'Filing & linking rules' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Filing & linking rules'),
    el('div', { class: 'sub' },
      'How work stays findable after it is written. A document nobody can reach is the same as a document nobody wrote — these two files are what stops the repo drifting into that.'),
  );

  const byRel = new Map(dir ? dir.entries.map((e) => [e.rel, e]) : []);

  page.append(el('div', { class: 'tiles', style: 'grid-template-columns:repeat(auto-fit, minmax(260px, 1fr))' },
    TILES.map((t) => {
      const entry = byRel.get(t.path);
      return el('a', { class: 'tile g-gov', href: `#/file?path=${encodeURIComponent(t.path)}`, title: t.path },
        el('div', { class: 'row-t' }, icon(t.ico), el('span', { class: 'grow' }, t.name), gatedTag(entry && entry.tier, true)),
        el('div', { class: 'd' }, t.desc),
        entry ? el('div', { class: 'd', style: 'margin-top:6px; font-size:11px; opacity:.75' }, `Changed ${timeAgo(entry.mtimeMs)}`) : null,
      );
    }),
  ));

  page.append(el('div', { class: 'card subpage-foot' },
    el('h3', {}, 'Keeping this current'),
    el('div', { class: 'hint', style: 'margin-bottom:8px' },
      'Both files are gated — changing either one changes how every future document is filed, so it needs a person\'s approval. The weekly repo health check is what catches work that drifted out of line with them:'),
    el('div', { class: 'chips' }, cmdChip('/wiki-lint')),
  ));
}
