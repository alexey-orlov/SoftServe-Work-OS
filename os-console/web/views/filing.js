// Filing & linking rules — second-level group page (same skeleton as Competition:
// crumbs back to its parent, h1 + sub, tile grid). One goal in two halves: the
// rules that say where an artifact lands and what it must link to, and the check
// that sweeps the repo for work that drifted out of line with them.
import { api } from '/api.js';
import { el, icon, timeAgo, setCrumbs, spinner, gatedTag, cmdChip } from '/ui.js';

const G = 'governance';
const SCRIPTS = '.github/scripts';
const FLOWS = '.github/workflows';

const GROUPS = [
  {
    title: 'The rules',
    items: [
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
    ],
  },
  {
    title: 'The check that enforces them',
    items: [
      {
        name: 'Mechanical lint',
        path: `${SCRIPTS}/wiki-lint.sh`,
        desc: 'The scriptable half of /wiki-lint — nav coverage, cross-references, the link contract, ledger integrity; reports, never fixes',
        ico: 'check',
      },
      {
        name: 'When it runs',
        path: `${FLOWS}/wiki-lint.yml`,
        desc: 'On every pull request, and every Monday with a weekly repo-health issue',
        ico: 'clock',
      },
    ],
  },
];

export async function render(view) {
  view.append(spinner());
  const dirs = [G, SCRIPTS, FLOWS];
  const listings = await Promise.all(dirs.map((d) =>
    api.get(`/api/library?path=${encodeURIComponent(d)}`).catch(() => null)));
  view.replaceChildren();
  setCrumbs([{ label: 'OS harness', href: '#/harness' }, { label: 'Filing & linking rules' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Filing & linking rules'),
    el('div', { class: 'sub' },
      'How work stays findable after it is written. A document nobody can reach is the same as a document nobody wrote — these files are what stops the repo drifting into that.'),
  );

  const byRel = new Map(listings.flatMap((d) => (d ? d.entries.map((e) => [e.rel, e]) : [])));

  for (const group of GROUPS) {
    page.append(el('h2', { class: 'group-head g-gov' }, el('span', { class: 'group-dot' }), group.title));
    page.append(el('div', { class: 'tiles', style: 'grid-template-columns:repeat(auto-fit, minmax(260px, 1fr))' },
      group.items.map((t) => {
        const entry = byRel.get(t.path);
        return el('a', { class: 'tile g-gov', href: `#/file?path=${encodeURIComponent(t.path)}`, title: t.path },
          el('div', { class: 'row-t' }, icon(t.ico), el('span', { class: 'grow' }, t.name), gatedTag(entry && entry.tier, true)),
          el('div', { class: 'd' }, t.desc),
          entry ? el('div', { class: 'd', style: 'margin-top:6px; font-size:11px; opacity:.75' }, `Changed ${timeAgo(entry.mtimeMs)}`) : null,
        );
      }),
    ));
  }

  page.append(el('div', { class: 'card subpage-foot' },
    el('h3', {}, 'Keeping this current'),
    el('div', { class: 'hint', style: 'margin-bottom:8px' },
      'The lint pair above is the mechanical half — what a script can check, reported and never repaired. The other half is judgment, and it takes a session: the same sweep, with the mechanical drift fixed in place and everything else listed as plain-language suggestions for a person to approve:'),
    el('div', { class: 'chips' }, cmdChip('/wiki-lint')),
  ));
}
