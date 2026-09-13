// Gated files — second-level group page under OS harness (same skeleton as Filing
// & linking rules: crumbs back to the parent, h1 + sub, tile grid). Two files,
// one rule: the policy names the paths a person must approve, and the script
// restates that same list in whatever dialect the server enforces it in.
import { api } from '/api.js';
import { el, icon, timeAgo, setCrumbs, spinner, gatedTag } from '/ui.js';

const POLICY = 'governance/write-policy.yaml';
const MIRROR = '.github/scripts/gated-paths.sh';

const TILES = [
  {
    name: 'Manage gated files',
    path: POLICY,
    dir: 'governance',
    href: '#/governance',
    desc: 'Add or remove a protected path point-and-click — the save is the approval, and the server mirror is regenerated in the same change',
    ico: 'shield',
  },
  {
    name: 'Server mirror',
    path: MIRROR,
    dir: '.github/scripts',
    href: `#/file?path=${encodeURIComponent(MIRROR)}`,
    desc: 'Prints the gated list in whatever dialect the server needs — GitHub CODEOWNERS or the Azure path filter — so the list is kept in one place',
    ico: 'refresh',
  },
];

export async function render(view) {
  view.append(spinner());
  const dirs = [...new Set(TILES.map((t) => t.dir))];
  const listings = await Promise.all(dirs.map((d) =>
    api.get(`/api/library?path=${encodeURIComponent(d)}`).catch(() => null)));
  view.replaceChildren();
  setCrumbs([{ label: 'OS harness', href: '#/harness' }, { label: 'Gated files' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Gated files'),
    el('div', { class: 'sub' },
      'The write policy — which paths need a person\'s approval before they change — and the script that mirrors that list to the server so the rule holds there too.'),
  );

  const byRel = new Map(listings.flatMap((d) => (d ? d.entries.map((e) => [e.rel, e]) : [])));

  page.append(el('div', { class: 'tiles', style: 'grid-template-columns:repeat(auto-fit, minmax(260px, 1fr))' },
    TILES.map((t) => {
      const entry = byRel.get(t.path);
      return el('a', { class: 'tile g-gov', href: t.href, title: t.path },
        el('div', { class: 'row-t' }, icon(t.ico), el('span', { class: 'grow' }, t.name), gatedTag(entry && entry.tier, true)),
        el('div', { class: 'd' }, t.desc),
        entry ? el('div', { class: 'd', style: 'margin-top:6px; font-size:11px; opacity:.75' }, `Changed ${timeAgo(entry.mtimeMs)}`) : null,
      );
    }),
  ));
}
