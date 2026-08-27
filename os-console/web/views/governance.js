// Gated files — manage WHAT is protected, not edit the protected files.
// Each rule comes live from governance/write-policy.yaml; add/remove edits the
// tiers list surgically, regenerates CODEOWNERS in the same commit, and reminds
// about the Azure path filter when that mirror applies. Living pages and
// per-file freshness live on the Steering page; the review queue in Proposed
// changes — this page is only the list of rules.
import { api } from '/api.js';
import { el, icon, pill, timeAgo, setCrumbs, spinner, toast, modal, field, filePicker, LITE, liteLock } from '/ui.js';

// Where a tree rule is best browsed inside the console.
function manageLink(pattern) {
  if (pattern.startsWith('product-development/product/handbook/templates')) return { href: '#/templates', label: 'Templates view' };
  if (pattern.startsWith('Documentation')) return { href: '#/docs', label: 'Docs view' };
  const dir = pattern.replace(/\/\*\*$/, '');
  return { href: `#/library?path=${encodeURIComponent(dir)}`, label: 'Browse' };
}

function friendlyName(p) {
  if (p.single) {
    const f = p.files[0];
    return (f && f.title) || p.pattern.split('/').pop();
  }
  const dir = p.pattern.replace(/\/\*\*$/, '');
  return `${dir.split('/').pop() || dir}/ (whole folder)`;
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
      'Files on this list change only with a person\'s yes: agents hit an approval prompt, and auto-sync never lands them on the shared branch alone. This page manages the list itself — the files are edited from Steering, Library, or their own views.'),
  );

  const split = el('div', { class: 'split' });
  page.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  // ---- the rules, grouped, with add/remove ----
  const addBtn = el('button', { class: 'btn small primary', onclick: () => addModal(d) }, icon('plus'), 'Add rule');
  const card = el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, `What is protected (${d.protected.length} rules)`),
      LITE ? liteLock(addBtn) : addBtn,
      el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(d.policyPath)}`, title: 'The raw registry, for edits beyond add/remove' }, icon('lock'), 'Raw policy')),
  );
  let lastHeading = null;
  for (const p of d.protected) {
    if (p.heading && p.heading !== lastHeading) {
      lastHeading = p.heading;
      card.append(el('div', { class: 'subgroup' }, p.heading.replace(/\s*—.*$/, '')));
    }
    const removeBtn = el('button', {
      class: 'btn small quiet', title: 'Remove this rule — the path goes back to the auto tier',
      onclick: () => removeModal(p),
    }, icon('x'));
    if (p.single) {
      const f = p.files[0] || { path: p.pattern, title: p.pattern.split('/').pop() };
      card.append(el('div', { class: 'art-row' },
        icon('file'),
        el('span', { class: 'val grow' },
          el('a', { href: `#/file?path=${encodeURIComponent(f.path)}`, style: 'font-weight:600' }, friendlyName(p)),
          el('span', { class: 'mini' }, p.note || f.role || ''),
          el('span', { class: 'mini path' }, p.pattern)),
        el('span', { class: 'when' },
          f.updatedHeader ? `_updated ${f.updatedHeader}` : timeAgo(f.lastChange)),
        el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(f.path)}`, title: 'Edit the file' }, icon('edit')),
        LITE ? liteLock(removeBtn) : removeBtn,
      ));
    } else {
      const link = manageLink(p.pattern);
      card.append(el('div', { class: 'art-row' },
        icon('folder'),
        el('span', { class: 'val grow' },
          el('span', { style: 'font-weight:600' }, friendlyName(p)),
          el('span', { class: 'mini' }, p.note || ''),
          el('span', { class: 'mini path' }, p.pattern)),
        p.count !== null ? el('span', { class: 'tag' }, `${p.count} files`) : null,
        el('a', { class: 'btn small quiet', href: link.href }, link.label),
        LITE ? liteLock(removeBtn) : removeBtn,
      ));
    }
  }
  left.append(card);

  // ---- enforcement chain ----
  right.append(el('div', { class: 'card' },
    el('h3', {}, 'How the list is enforced'),
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
    d.provider === 'azure' ? el('div', { class: 'hint', style: 'margin-top:8px' },
      'Azure DevOps note: the required-reviewer policy keeps its own path filter — refresh it after changing this list (gated-paths.sh --format ado prints the value).') : null,
  ));
}

// ---- add / remove -----------------------------------------------------------

function addModal(d) {
  const patternIn = el('input', { class: 'mono', placeholder: 'path/to/file.md — or a folder to gate everything in it' });
  const noteIn = el('input', { placeholder: 'why this is protected, in your team\'s words (shown at the approval prompt)' });
  const groupSel = el('select', {}, (d.groups || []).map((g, i) =>
    el('option', { value: g.id, selected: i === 0 }, g.label)));
  modal({
    title: 'Add a gated rule',
    body: el('div', {},
      field('Path or folder', el('div', { class: 'row' },
        el('div', { class: 'grow' }, patternIn),
        el('button', {
          class: 'btn small quiet',
          onclick: () => filePicker({ title: 'Pick the file to gate', onPick: (p) => { patternIn.value = p; } }),
        }, 'Pick a file')),
      'A folder path protects the whole folder (it is recorded as folder/**). Globs are accepted as-is.'),
      field('Why', noteIn, 'One line — people see it every time the approval prompt fires.'),
      field('Group', groupSel, 'Steering files = team context; System rules = the OS itself.'),
      el('div', { class: 'hint' },
        'Adding a rule edits governance/write-policy.yaml (this click is your approval), regenerates .github/CODEOWNERS in the same commit'
        + (d.provider === 'azure' ? ', and you will need to refresh the Azure path filter.' : '.')),
    ),
    actions: [{
      label: 'Add rule', kind: 'primary',
      onclick: async (close) => {
        const r = await api.post('/api/policy/gated', {
          op: 'add', pattern: patternIn.value.trim(), note: noteIn.value.trim(), group: groupSel.value,
        });
        toast(`Gated ${r.pattern}${r.commit.committed ? ` · committed ${r.commit.sha}` : ''}${r.codeowners && !r.codeowners.ok ? ` · ${r.codeowners.note}` : ''}`);
        if (r.azureReminder) toast(r.azureReminder);
        window.dispatchEvent(new Event('console:saved'));
        close();
        location.reload();
      },
    }],
  });
}

function removeModal(p) {
  modal({
    title: 'Remove gated rule',
    body: el('div', {},
      el('div', { class: 'path', style: 'margin-bottom:8px' }, p.pattern),
      el('div', { class: 'hint' },
        'The path goes back to the auto tier: agents change and land it without asking anyone. '
        + 'CODEOWNERS is regenerated in the same commit.'),
    ),
    actions: [{
      label: 'Remove — back to auto tier', kind: '',
      onclick: async (close) => {
        const r = await api.post('/api/policy/gated', { op: 'remove', pattern: p.pattern });
        toast(`Un-gated ${r.pattern}${r.commit.committed ? ` · committed ${r.commit.sha}` : ''}`);
        if (r.azureReminder) toast(r.azureReminder);
        window.dispatchEvent(new Event('console:saved'));
        close();
        location.reload();
      },
    }],
  });
}
