// Governance — auto-sync switchboard state, the gated list with its "why"
// comments, proposals inbox, and server-side enforcement signals.
import { api } from '/api.js';
import { el, icon, pill, cmdChip, timeAgo, setCrumbs, spinner } from '/ui.js';

export async function render(view) {
  view.append(spinner());
  const d = await api.get('/api/governance');
  view.replaceChildren();
  setCrumbs([{ label: 'Governance' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Governance'),
    el('div', { class: 'sub' },
      'How changes land, and which paths need a human first. Everything below reads live from governance/write-policy.yaml — the same registry the hooks enforce.'),
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

  // proposals
  right.append(el('div', { class: 'card' },
    el('h3', {}, `Proposals inbox (${d.proposals.length})`),
    el('div', { class: 'hint' }, 'Gated changes filed by runs that could not ask (headless, scheduled). Apply or reject, then delete.'),
    d.proposals.length
      ? el('div', {}, d.proposals.map((p) => el('div', { class: 'art-row' },
        el('a', { class: 'val grow', href: `#/file?path=${encodeURIComponent(p.path)}` }, p.title),
        el('span', { class: 'tag' }, timeAgo(p.mtimeMs)))))
      : el('div', { class: 'empty' }, 'Nothing waiting.'),
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

  // living pages + health
  right.append(el('div', { class: 'card' },
    el('h3', {}, 'Health reports'),
    d.health.length
      ? el('div', {}, d.health.slice(0, 5).map((h) => el('div', { class: 'art-row' },
        el('a', { class: 'val grow', href: `#/file?path=${encodeURIComponent(h.path)}` }, h.name),
        el('span', { class: 'tag' }, timeAgo(h.mtimeMs)))))
      : el('div', { class: 'hint', style: 'margin:0' }, 'No /wiki-lint report yet — ', cmdChip('/wiki-lint')),
  ));
}
