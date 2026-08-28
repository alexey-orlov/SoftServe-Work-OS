// Gated files — manage WHAT is protected, not edit the protected files.
// Each rule comes live from governance/write-policy.yaml; add/remove edits the
// tiers list surgically, regenerates CODEOWNERS in the same commit, and reminds
// about the Azure path filter when that mirror applies. The review queue lives
// in Proposed changes; the files themselves are edited from Library, Features,
// or their own views. Group names here (Steering files / System rules) are the
// same ones the Library uses.
import { api } from '/api.js';
import { el, icon, pill, timeAgo, setCrumbs, spinner, toast, modal, field, filePicker, cmdChip, LITE, liteLock } from '/ui.js';

// Where a tree rule is best browsed inside the console.
function manageLink(pattern) {
  if (pattern.startsWith('product-development/product/handbook/templates')) return { href: '#/templates', label: 'Open' };
  if (pattern.startsWith('Documentation')) return { href: '#/docs', label: 'Open' };
  const dir = pattern.replace(/\/\*\*$/, '');
  return { href: `#/library?path=${encodeURIComponent(dir)}`, label: 'Open' };
}

function shortName(p) {
  if (p.single) return p.pattern.split('/').pop();
  const dir = p.pattern.replace(/\/\*\*$/, '');
  return `${dir.split('/').pop() || dir}/`;
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
      'Files on this list change only with a person\'s yes — agents ask first, and nothing here reaches the team without one. This page manages the list itself; the files are edited from their own views.'),
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
      el('h3', { class: 'grow' }, `Gated today — ${d.protected.length} rules`),
      LITE ? liteLock(addBtn) : addBtn),
  );
  let lastHeading = null;
  for (const p of d.protected) {
    if (p.heading && p.heading !== lastHeading) {
      lastHeading = p.heading;
      card.append(el('div', { class: 'subgroup' }, p.heading.replace(/\s*—.*$/, '')));
    }
    const removeBtn = el('button', {
      class: 'btn small quiet danger-hover', title: `Remove this rule — ${p.pattern} goes back to changing freely`,
      'aria-label': `Remove rule ${p.pattern}`,
      onclick: () => removeModal(p),
    }, icon('x'));
    const f = p.single ? (p.files[0] || { path: p.pattern }) : null;
    const open = p.single
      ? el('a', { class: 'btn small quiet', href: `#/file?path=${encodeURIComponent(f.path)}` }, 'Open')
      : el('a', { class: 'btn small quiet', href: manageLink(p.pattern).href }, 'Open');
    card.append(el('div', { class: 'art-row' },
      icon(p.single ? 'file' : 'folder'),
      el('span', { class: 'val grow' },
        el('span', { style: 'font-weight:600' }, shortName(p)),
        el('span', { class: 'mini' }, p.note || (f && f.role) || ''),
        el('span', { class: 'mini path trunc', title: p.pattern }, p.pattern)),
      p.single
        ? el('span', { class: 'when' }, f.updatedHeader ? `_updated ${f.updatedHeader}` : timeAgo(f.lastChange))
        : (p.count !== null ? el('span', { class: 'tag' }, `${p.count} files`) : null),
      open,
      LITE ? liteLock(removeBtn) : removeBtn,
    ));
  }
  card.append(el('div', { class: 'hint', style: 'margin-top:10px' },
    'Fine print lives in the raw registry: ',
    el('a', { href: `#/edit?path=${encodeURIComponent(d.policyPath)}` }, 'governance/write-policy.yaml'), '.'));
  left.append(card);

  // ---- how it is enforced ----
  right.append(el('div', { class: 'card' },
    el('h3', {}, 'How the list is enforced'),
    el('div', { class: 'art-row' },
      el('span', { class: 'lbl' }, 'Write-time'),
      el('span', { class: 'val grow' }, 'agents hit an approval prompt on these paths'),
      pill('done', 'On')),
    el('div', { class: 'art-row' },
      el('span', { class: 'lbl' }, 'Server-side'),
      el('span', { class: 'val grow' }, 'the shared workspace requires an admin\'s approval'),
      d.enforcement.codeowners ? pill('done', 'Present') : pill('todo', 'Missing')),
    el('div', { class: 'art-row' },
      el('span', { class: 'lbl' }, 'Steward'),
      el('span', { class: 'val grow' }, d.steward || '—'),
      d.stewardPlaceholder ? pill('todo', 'Placeholder') : pill('done', 'Set')),
    d.provider === 'azure' ? el('div', { class: 'hint', style: 'margin-top:8px' },
      'Azure DevOps keeps its own copy of this list in its approval settings — an admin refreshes it there after changing it here.') : null,
  ));

  // ---- audit — the weekly health check on the same rules ----
  right.append(el('div', { class: 'card' },
    el('h3', {}, 'Health checks'),
    el('div', { class: 'hint' }, 'The weekly audit that flags drift — including anything that slipped past this list.'),
    d.health.length
      ? el('div', {}, d.health.slice(0, 5).map((h) => el('div', { class: 'art-row' },
        el('a', { class: 'val grow', href: `#/file?path=${encodeURIComponent(h.path)}` }, h.name),
        el('span', { class: 'tag' }, timeAgo(h.mtimeMs)))))
      : el('div', { class: 'hint', style: 'margin:0' }, 'No report yet — ', cmdChip('/wiki-lint')),
  ));
}

// ---- add / remove -----------------------------------------------------------

function addModal(d) {
  const patternIn = el('input', { class: 'mono', placeholder: 'path/to/file.md — or a folder to protect everything in it' });
  const noteIn = el('input', { placeholder: 'why this is protected, in your team\'s words' });
  const groupSel = el('select', {}, (d.groups || []).map((g, i) =>
    el('option', { value: g.id, selected: i === 0 }, g.label)));
  modal({
    title: 'Add a gated rule',
    body: el('div', {},
      field('Path or folder', el('div', { class: 'row' },
        el('div', { class: 'grow' }, patternIn),
        el('button', {
          class: 'btn small quiet',
          onclick: () => filePicker({ title: 'Pick the file to protect', onPick: (p) => { patternIn.value = p; } }),
        }, 'Pick a file')),
      'A folder path gates the whole folder.'),
      field('Why', noteIn, 'One line — people see it every time the approval prompt fires.'),
      field('Group', groupSel, 'Steering files = team context; System rules = the OS itself.'),
    ),
    actions: [{
      label: 'Add rule', kind: 'primary',
      onclick: async (close) => {
        const r = await api.post('/api/policy/gated', {
          op: 'add', pattern: patternIn.value.trim(), note: noteIn.value.trim(), group: groupSel.value,
        });
        toast(`Gated ${r.pattern} ✓${r.codeowners && !r.codeowners.ok ? ` · ${r.codeowners.note}` : ''}`);
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
    title: 'Remove the gate',
    body: el('div', {},
      el('div', { class: 'path', style: 'margin-bottom:8px' }, p.pattern),
      el('div', { class: 'hint' },
        'From now on this path changes freely — agents stop asking, and changes reach the team without review.'),
    ),
    actions: [{
      label: 'Remove the gate', kind: '',
      onclick: async (close) => {
        const r = await api.post('/api/policy/gated', { op: 'remove', pattern: p.pattern });
        toast(`No longer gated — ${r.pattern} ✓`);
        if (r.azureReminder) toast(r.azureReminder);
        window.dispatchEvent(new Event('console:saved'));
        close();
        location.reload();
      },
    }],
  });
}
