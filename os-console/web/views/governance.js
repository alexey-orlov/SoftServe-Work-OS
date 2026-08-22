// Gated files — one reconciled structure: each protection rule from
// write-policy.yaml with what it covers right now and how fresh that content
// is. Auto-sync, the review pointer, and the enforcement chain sit beside it;
// living pages (auto tier, watched for freshness) close the page.
import { api } from '/api.js';
import { el, icon, pill, cmdChip, timeAgo, setCrumbs, spinner } from '/ui.js';

// Where a tree rule is best managed inside the console.
function manageLink(pattern) {
  if (pattern.startsWith('product-development/product/handbook/templates')) return { href: '#/templates', label: 'Templates view' };
  if (pattern.startsWith('Documentation')) return { href: '#/docs', label: 'Docs view' };
  const dir = pattern.replace(/\/\*\*$/, '');
  return { href: `#/library?path=${encodeURIComponent(dir)}`, label: 'Browse' };
}

export async function render(view) {
  view.append(spinner());
  const d = await api.get('/api/governance');
  view.replaceChildren();
  setCrumbs([{ label: 'Gated files' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Gated files'),
    el('div', { class: 'sub' },
      'What needs a human before it changes. Each rule below comes live from governance/write-policy.yaml — shown with the files it covers today and how current they are. A save from the console on any of them is your approval; what is waiting for review sits in Proposed changes.'),
  );

  const split = el('div', { class: 'split' });
  page.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  // ---- the one protection structure: rule → coverage → freshness ----
  const card = el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, `What needs approval (${d.protected.length} rules)`),
      el('a', { class: 'btn small', href: `#/edit?path=${encodeURIComponent(d.policyPath)}` }, icon('lock'), 'Edit policy')),
  );
  let lastHeading = null;
  for (const p of d.protected) {
    if (p.heading && p.heading !== lastHeading) {
      lastHeading = p.heading;
      card.append(el('div', { class: 'subgroup' }, p.heading.replace(/\s*—.*$/, '')));
    }
    if (p.single) {
      // one rule = one file — show it as the file itself
      const f = p.files[0] || { path: p.pattern, title: p.pattern.split('/').pop() };
      card.append(el('div', { class: 'art-row' },
        icon('file'),
        el('span', { class: 'val grow' },
          el('a', { href: `#/file?path=${encodeURIComponent(f.path)}`, style: 'font-weight:600' }, f.title),
          el('span', { class: 'mini' }, p.note || f.role || '')),
        el('span', { class: 'when' },
          f.updatedHeader ? `_updated ${f.updatedHeader}` : timeAgo(f.lastChange)),
        el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(f.path)}` }, icon('edit')),
      ));
    } else {
      // one rule = a tree — the rule row, then its notable steering files
      const link = manageLink(p.pattern);
      card.append(el('div', { class: 'art-row' },
        icon('folder'),
        el('span', { class: 'val grow' },
          el('span', { class: 'path', style: 'color:var(--ink-2); font-weight:600' }, p.pattern),
          el('span', { class: 'mini' }, p.note || '')),
        p.count !== null ? el('span', { class: 'tag' }, `${p.count} files`) : null,
        el('a', { class: 'btn small quiet', href: link.href }, link.label),
      ));
      for (const f of p.files) {
        card.append(el('div', { class: 'art-row', style: 'padding-left:34px; border-bottom:0; padding-top:2px; padding-bottom:4px' },
          el('span', { class: 'val grow', style: 'font-size:12.5px' },
            el('a', { href: `#/file?path=${encodeURIComponent(f.path)}` }, f.title)),
          el('span', { class: 'when' },
            f.updatedHeader ? `_updated ${f.updatedHeader}` : timeAgo(f.lastChange)),
          el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(f.path)}` }, icon('edit')),
        ));
      }
    }
  }
  left.append(card);

  // ---- auto-sync ----
  const a = d.autoSync;
  right.append(el('div', { class: 'card' },
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

  // ---- review pointer ----
  right.append(el('div', { class: 'card' },
    el('h3', {}, 'Waiting for review?'),
    el('div', { class: 'hint', style: 'margin-bottom:8px' },
      `Open pull requests and the proposals inbox (${d.proposals.length} filed) live in their own queue.`),
    el('a', { class: 'btn small', href: '#/proposed' }, icon('pr'), 'Open Proposed changes'),
  ));

  // ---- enforcement chain ----
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

  // ---- living pages: watched, explicitly NOT gated ----
  if (d.living && d.living.length) {
    page.append(
      el('h2', { class: 'group-head' }, 'Living pages — watched, not gated'),
      el('div', { class: 'hint', style: 'margin:2px 0 12px' },
        'Current-truth pages agents edit freely (auto tier). They are listed here because stale steering misleads — /wiki-lint checks the same list.'),
    );
    const lp = el('div', { class: 'card' });
    for (const f of d.living) {
      lp.append(el('div', { class: 'art-row' },
        el('span', { class: 'val grow' },
          el('a', { href: `#/file?path=${encodeURIComponent(f.path)}` }, f.title),
          el('span', { class: 'mini' }, f.role || '')),
        el('span', { class: 'when' },
          f.updatedHeader ? `_updated ${f.updatedHeader}` : timeAgo(f.lastChange)),
        el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(f.path)}` }, icon('edit')),
      ));
    }
    page.append(lp);
  }
}
