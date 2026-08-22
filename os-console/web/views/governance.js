// Gated files — which paths need a human first, the auto-sync switchboard, the
// enforcement chain, and the steering files themselves with their freshness.
// Reads live from governance/write-policy.yaml (+ the steering adapter).
import { api } from '/api.js';
import { el, icon, pill, cmdChip, setCrumbs, spinner, tierPill, timeAgo } from '/ui.js';

export async function render(view) {
  view.append(spinner());
  const [d, steer] = await Promise.all([
    api.get('/api/governance'),
    api.get('/api/steering').catch(() => null),
  ]);
  view.replaceChildren();
  setCrumbs([{ label: 'Gated files' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Gated files'),
    el('div', { class: 'sub' },
      'The paths that need a human before they change, and how everything else lands automatically. Everything below reads live from governance/write-policy.yaml — the same registry the hooks enforce. What is currently waiting for review sits in Proposed changes.'),
  );

  const split = el('div', { class: 'split' });
  page.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  // auto-sync
  const a = d.autoSync;
  left.append(el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, 'Auto-sync'),
      el('span', { class: `pill ${a.on ? 'ok' : 'todo'}` }, a.on ? `On — ${a.mode}` : 'Off')),
    el('div', { class: 'hint' }, a.label),
    el('dl', { class: 'kv' },
      el('dt', {}, 'Strategy'), el('dd', {}, a.strategy),
      el('dt', {}, 'Push to origin'), el('dd', {}, a.push ? 'yes' : 'no'),
      el('dt', {}, 'Target branch'), el('dd', {}, a.targetBranch),
      el('dt', {}, 'Commit scope'), el('dd', {}, a.scope),
      el('dt', {}, 'Message prefix'), el('dd', {}, a.messagePrefix),
    ),
    el('div', { class: 'hint', style: 'margin:14px 0 6px' },
      'Changing the mode is itself a gated change with git side effects — run it as the guided program:'),
    el('div', { class: 'chips' },
      cmdChip('/auto-sync on direct'), cmdChip('/auto-sync on pr'), cmdChip('/auto-sync off'), cmdChip('/auto-sync status')),
  ));

  // gated list
  const gatedCard = el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, `Gated paths (${d.gated.length})`),
      el('a', { class: 'btn small', href: `#/edit?path=${encodeURIComponent(d.policyPath)}` }, icon('lock'), 'Edit policy')),
    el('div', { class: 'hint' },
      'Agents need your in-session yes to write these; automation never lands them on the target branch. In the console they carry the Gated badge — your save is the approval.'),
  );
  let lastHeading = null;
  for (const g of d.gated) {
    if (g.heading && g.heading !== lastHeading) {
      lastHeading = g.heading;
      gatedCard.append(el('div', { style: 'font-size:11.5px; font-weight:650; color:var(--muted); margin:12px 0 2px' }, g.heading));
    }
    gatedCard.append(el('div', { style: 'padding:6px 0; border-bottom:1px solid var(--line-soft)' },
      el('div', { class: 'path', style: 'color:var(--ink-2)' }, g.pattern),
      g.note ? el('div', { style: 'color:var(--muted); font-size:12px; margin-top:1px' }, g.note) : null,
    ));
  }
  left.append(gatedCard);

  // what's waiting lives in Proposed changes now
  right.append(el('div', { class: 'card' },
    el('h3', {}, 'Waiting for review?'),
    el('div', { class: 'hint', style: 'margin-bottom:8px' },
      `Open pull requests and the proposals inbox (${d.proposals.length} filed) moved to their own queue.`),
    el('a', { class: 'btn small', href: '#/proposed' }, icon('pr'), 'Open Proposed changes'),
  ));

  // enforcement
  right.append(el('div', { class: 'card' },
    el('h3', {}, 'Enforcement chain'),
    el('div', { class: 'art-row' },
      el('span', { class: 'lbl' }, 'Write-time'),
      el('span', { class: 'val grow' }, 'write-guard hook prompts on gated paths'),
      pill('done', 'Hook')),
    el('div', { class: 'art-row' },
      el('span', { class: 'lbl' }, 'Server-side'),
      el('span', { class: 'val grow' }, '.github/CODEOWNERS generated from the policy'),
      d.enforcement.codeowners ? pill('done', 'Present') : pill('todo', 'Missing')),
    el('div', { class: 'art-row' },
      el('span', { class: 'lbl' }, 'Audit'),
      el('span', { class: 'val grow' }, 'weekly wiki-lint workflow'),
      d.enforcement.wikiLintWorkflow ? pill('done', 'Present') : pill('todo', 'Missing')),
    el('div', { class: 'art-row' },
      el('span', { class: 'lbl' }, 'Steward'),
      el('span', { class: 'val grow' }, d.steward || '—'),
      d.stewardPlaceholder ? pill('todo', 'Placeholder') : pill('done', 'Set')),
  ));

  // steering files & freshness — the content behind the gates, one audit table
  if (steer && steer.rows && steer.rows.length) {
    const GROUPS = [
      ['core', 'Core steering'],
      ['business', 'Business context'],
      ['living', 'Living pages (auto tier — edit in place)'],
    ];
    page.append(el('h2', { class: 'group-head' }, 'Steering files — freshness'),
      el('div', { class: 'hint', style: 'margin:2px 0 12px' },
        'The files these gates protect, and how current each one is. Reading them is easier in the Library — this table is the audit.'));
    const tbody = el('tbody', {});
    for (const [key, label] of GROUPS) {
      const rows = steer.rows.filter((r) => r.group === key);
      if (!rows.length) continue;
      tbody.append(el('tr', {}, el('td', { colspan: '5', style: 'padding-top:14px' },
        el('div', { class: 'subgroup', style: 'margin:0' }, label))));
      for (const r of rows) {
        tbody.append(el('tr', { class: 'click', onclick: () => { location.hash = `#/file?path=${encodeURIComponent(r.path)}`; } },
          el('td', { style: 'width:32%' },
            el('a', { href: `#/file?path=${encodeURIComponent(r.path)}`, onclick: (ev) => ev.stopPropagation() }, r.title),
            el('span', { class: 'mini' }, r.role)),
          el('td', {}, el('span', { class: 'path' }, r.path)),
          el('td', { style: 'width:70px' }, tierPill(r.tier)),
          el('td', { style: 'white-space:nowrap; color:var(--muted); font-size:12px' },
            r.updatedHeader ? `_updated ${r.updatedHeader}` : timeAgo(r.lastChange)),
          el('td', { style: 'width:50px; text-align:right' },
            el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(r.path)}`, onclick: (ev) => ev.stopPropagation() }, icon('edit'))),
        ));
      }
    }
    page.append(el('div', { class: 'card scroll-x', style: 'padding:6px 10px' },
      el('table', { class: 'data' },
        el('thead', {}, el('tr', {}, el('th', {}, 'File'), el('th', {}, 'Path'), el('th', {}, 'Tier'), el('th', {}, 'Updated'), el('th', {}, ''))),
        tbody)));
  }
}
