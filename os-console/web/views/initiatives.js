// Initiatives — the current-work lens. Cards grouped by status; detail joins the
// living page with feature-index artifacts. Grouping is derived; pins are prefs.
import { api, isPinned, togglePin } from '/api.js';
import { el, icon, statusPill, pill, mdRender, timeAgo, toast, modal, field, filePicker, setCrumbs, spinner, cmdChip } from '/ui.js';

const STATUSES = ['active', 'exploring', 'paused', 'shipped', 'killed'];

export async function render(view, params, routeName) {
  view.append(spinner());
  const { items } = await api.get('/api/initiatives');
  view.replaceChildren();
  if (routeName === 'initiative') return detail(view, items, params.get('slug'));
  return list(view, items);
}

// ---------------------------------------------------------------- list

function list(view, items) {
  setCrumbs([{ label: 'Initiatives' }]);
  const page = el('div', { class: 'page' });
  view.append(page);

  let statusFilter = null;
  const grid = el('div', {});

  page.append(el('div', { class: 'row wrap', style: 'margin-bottom:16px' },
    el('div', { class: 'grow' },
      el('h1', {}, 'Initiatives'),
      el('div', { class: 'sub', style: 'margin:0' },
        'One living page per work effort — artifacts stay in their functional folders; this view joins them.')),
    el('button', { class: 'btn primary', onclick: () => createModal() }, icon('plus'), 'New initiative'),
  ));

  const chipsRow = el('div', { class: 'chips', style: 'margin-bottom:16px' });
  const counts = {};
  items.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1; });
  const allChip = el('button', { class: 'chip on', onclick: () => setFilter(null, allChip) }, `All ${items.length}`);
  chipsRow.append(allChip);
  for (const s of STATUSES) {
    if (!counts[s]) continue;
    const c = el('button', { class: 'chip', onclick: () => setFilter(s, c) }, `${s[0].toUpperCase()}${s.slice(1)} ${counts[s]}`);
    chipsRow.append(c);
  }
  page.append(chipsRow, grid);

  function setFilter(s, chipEl) {
    statusFilter = s;
    chipsRow.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
    chipEl.classList.add('on');
    draw();
  }

  function draw() {
    const filtered = items.filter((i) => !statusFilter || i.status === statusFilter);
    const pinned = filtered.filter((i) => isPinned(`initiative:${i.slug}`));
    const rest = filtered.filter((i) => !isPinned(`initiative:${i.slug}`));
    grid.replaceChildren();
    if (pinned.length) {
      grid.append(el('h2', { class: 'section', style: 'margin-top:4px' }, 'Pinned'));
      grid.append(el('div', { class: 'init-grid' }, pinned.map(card)));
    }
    for (const s of STATUSES) {
      const group = rest.filter((i) => i.status === s);
      if (!group.length) continue;
      grid.append(el('h2', { class: 'section' }, s === 'active' ? 'Active' : s[0].toUpperCase() + s.slice(1)));
      grid.append(el('div', { class: 'init-grid' }, group.map(card)));
    }
    if (!filtered.length) grid.append(el('div', { class: 'empty' }, 'Nothing here yet — create the first initiative.'));
  }

  function card(i) {
    const total = i.artifactStats.present + i.artifactStats.missing;
    const pinKey = `initiative:${i.slug}`;
    const pinBtn = el('button', {
      class: `pin-btn ${isPinned(pinKey) ? 'on' : ''}`,
      title: 'Pin',
      onclick: (e) => { e.preventDefault(); e.stopPropagation(); togglePin(pinKey); draw(); },
    }, icon('pin'));
    return el('a', { class: 'init-card', href: `#/initiative?slug=${encodeURIComponent(i.slug)}` },
      pinBtn,
      el('div', { class: 'name' }, cleanTitle(i)),
      el('div', { class: 'row' }, statusPill(i.status), i.isExample ? el('span', { class: 'tag' }, 'example') : null),
      el('div', { class: 'status-line' }, i.statusText.replace(/^\w+\s*[—-]?\s*/, '') || '—'),
      el('div', { class: 'foot' },
        total ? el('span', {}, `${i.artifactStats.present}/${total} artifacts in place`) : null,
        i.openLoops.length ? el('span', {}, `${i.openLoops.length} open loop${i.openLoops.length > 1 ? 's' : ''}`) : null,
        el('span', { class: 'right' }, `updated ${i.updated || '—'}`),
      ),
    );
  }

  function createModal() {
    const titleIn = el('input', { placeholder: 'e.g. Tier Discount Promo v2' });
    const slugIn = el('input', { placeholder: 'tier-discount-promo-v2', class: 'mono' });
    titleIn.addEventListener('input', () => {
      slugIn.value = titleIn.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    });
    modal({
      title: 'New initiative',
      body: el('div', {},
        field('Title', titleIn),
        field('Slug (immutable — becomes the page name and the id everywhere)', slugIn),
        el('div', { class: 'hint' }, 'Creates the living page from the house template and registers it in the folder navigation — one commit. Link it to a feature in feature-index.yaml when the feature exists (gated edit).'),
      ),
      actions: [{
        label: 'Create', kind: 'primary',
        onclick: async (close) => {
          const r = await api.post('/api/initiatives/create', { slug: slugIn.value.trim(), title: titleIn.value.trim() });
          toast(`Created ${r.page.slug}${r.commit.committed ? ` · committed ${r.commit.sha}` : ''}`);
          window.dispatchEvent(new Event('console:saved'));
          close();
          location.hash = `#/initiative?slug=${encodeURIComponent(r.page.slug)}`;
        },
      }],
    });
  }

  draw();
}

function cleanTitle(i) {
  return i.title.replace(/^EXAMPLE\s*[—-]\s*/i, '');
}

// ---------------------------------------------------------------- detail

function detail(view, items, slug) {
  const i = items.find((x) => x.slug === slug);
  const page = el('div', { class: 'page' });
  view.append(page);
  if (!i) {
    setCrumbs([{ label: 'Initiatives', href: '#/initiatives' }, { label: slug || '?' }]);
    page.append(el('div', { class: 'card' }, el('h3', {}, 'Not found'), el('div', { class: 'hint' }, `No initiative page for "${slug}".`)));
    return;
  }
  setCrumbs([{ label: 'Initiatives', href: '#/initiatives' }, { label: i.slug }]);

  const pinKey = `initiative:${i.slug}`;

  page.append(el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
    el('h1', { class: 'grow', style: 'margin:0' }, cleanTitle(i)),
    el('button', {
      class: `btn small ${isPinned(pinKey) ? '' : 'quiet'}`,
      onclick: (e) => { const on = togglePin(pinKey); e.currentTarget.classList.toggle('quiet', !on); toast(on ? 'Pinned' : 'Unpinned'); },
    }, icon('pin'), isPinned(pinKey) ? 'Pinned' : 'Pin'),
    el('button', { class: 'btn small', onclick: () => statusModal(i) }, 'Change status'),
    el('a', { class: 'btn small', href: `#/edit?path=${encodeURIComponent(i.rel)}` }, icon('edit'), 'Edit page'),
  ));

  page.append(el('div', { class: 'row wrap', style: 'margin-bottom:18px; color:var(--muted); font-size:12.5px' },
    statusPill(i.status),
    i.isExample ? el('span', { class: 'tag' }, 'example') : null,
    el('span', {}, i.statusText.replace(/^\w+\s*[—-]?\s*/, '')),
    el('span', {}, `· updated ${i.updated || '—'}`),
    i.owner ? el('span', {}, `· ${i.owner}`) : null,
    ...i.targets.map((t) => el('a', { class: 'tag', href: `#/file?path=${encodeURIComponent('product-development/feature-index.yaml')}` }, `${t.area}.${t.feature}`)),
  ));

  const split = el('div', { class: 'split' });
  page.append(split);
  const left = el('div', {});
  const right = el('div', {});
  split.append(left, right);

  if (i.snapshot) left.append(el('div', { class: 'card' }, el('h3', {}, 'Snapshot'), mdRender(i.snapshot, i.rel)));
  if (i.scope) left.append(el('div', { class: 'card' }, el('h3', {}, 'Scope & goal'), mdRender(i.scope, i.rel)));
  if (i.decisions.length) {
    left.append(el('div', { class: 'card' }, el('h3', {}, 'Decisions'),
      ...i.decisions.map((d) => el('div', { style: 'padding:5px 0' }, mdRender(`- ${d.text}`, i.rel)))));
  }
  if (i.activity.length) {
    left.append(el('div', { class: 'card' }, el('h3', {}, 'Activity'),
      el('div', {}, i.activity.map((a) => el('div', { style: 'padding:4px 0; font-size:13px; border-bottom:1px solid var(--line-soft)' }, mdRender(a, i.rel))))));
  }

  // artifacts
  const artCard = el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, 'Artifacts'),
      el('button', {
        class: 'btn small',
        onclick: () => filePicker({
          title: 'Attach an existing file to this initiative',
          onPick: (path) => attachModal(i, path),
        }),
      }, icon('plus'), 'Attach')),
    el('div', { class: 'hint' }, 'Linked from the living page — files stay in their functional folders.'),
  );
  if (!i.artifacts.length) artCard.append(el('div', { class: 'empty' }, 'Nothing linked yet.'));
  for (const a of i.artifacts) {
    const val =
      a.kind === 'file' ? el('a', { href: `#/file?path=${encodeURIComponent(a.path)}` }, a.path.split('/').pop())
        : a.kind === 'pending' ? el('span', { class: 'path' }, a.path)
          : a.kind === 'url' ? el('a', { href: a.url, target: '_blank', rel: 'noopener' }, a.text, ' ', icon('external'))
            : el('span', {}, a.text);
    const state =
      a.kind === 'pending' && !a.exists ? pill('todo', 'Pending')
        : a.kind === 'file' && !a.exists ? pill('err', 'Missing')
          : a.kind === 'file' || (a.kind === 'pending' && a.exists) ? pill('ok', 'In place') : null;
    artCard.append(el('div', { class: 'art-row' },
      el('span', { class: 'lbl' }, a.label || '—'),
      el('span', { class: 'val grow' }, val),
      state));
  }
  right.append(artCard);

  // feature-index join
  for (const f of i.features || []) {
    const c = el('div', { class: 'card' },
      el('h3', {}, `From feature-index — ${f.area}.${f.feature}`),
      el('div', { class: 'hint' }, 'What the product map registers for this feature.'));
    if (!f.artifacts.length) c.append(el('div', { class: 'empty' }, 'No artifacts registered yet.'));
    for (const a of f.artifacts) {
      c.append(el('div', { class: 'art-row' },
        el('span', { class: 'lbl' }, a.key),
        el('span', { class: 'val grow' },
          a.kind === 'file' ? el('a', { href: `#/file?path=${encodeURIComponent(a.path)}` }, a.path.split('/').pop())
            : a.kind === 'url' ? el('a', { href: a.url, target: '_blank', rel: 'noopener' }, 'open ', icon('external'))
              : el('span', {}, a.text || '')),
        a.kind === 'file' ? (a.exists ? pill('ok', 'In place') : pill('err', 'Missing')) : null));
    }
    right.append(c);
  }

  if (i.openLoops.length) {
    right.append(el('div', { class: 'card' }, el('h3', {}, 'Open loops'),
      ...i.openLoops.map((l) => el('div', { style: 'padding:4px 0; font-size:13px' }, mdRender(`- ${l}`, i.rel)))));
  }

  right.append(el('div', { class: 'card' },
    el('h3', {}, 'Work on this in Claude Code'),
    el('div', { class: 'hint' }, 'The console manages context; the thinking runs as guided programs.'),
    el('div', { class: 'chips' },
      cmdChip('/prd-draft'), cmdChip('/assumption-map'), cmdChip('/jobs-breakdown'), cmdChip('/feature-launch-gate')),
  ));
}

function statusModal(i) {
  const sel = el('select', {}, STATUSES.map((s) => el('option', { value: s, selected: s === i.status }, s)));
  const note = el('input', { placeholder: 'one line: where this stands now' });
  modal({
    title: `Status — ${i.slug}`,
    body: el('div', {},
      field('New status', sel),
      field('Status note', note, 'Written into the page\'s _status line; _updated is set to today.')),
    actions: [{
      label: 'Update', kind: 'primary',
      onclick: async (close) => {
        const r = await api.post('/api/initiatives/status', { slug: i.slug, status: sel.value, note: note.value.trim() });
        toast(`Status → ${sel.value}${r.commit.committed ? ` · committed ${r.commit.sha}` : ''}`);
        window.dispatchEvent(new Event('console:saved'));
        close();
        location.reload();
      },
    }],
  });
}

function attachModal(i, path) {
  const label = el('input', { placeholder: 'e.g. PRD, Metrics, Eng plan', value: guessLabel(path) });
  modal({
    title: 'Attach artifact',
    body: el('div', {},
      el('div', { class: 'path', style: 'margin-bottom:6px' }, path),
      field('Label', label, 'Appears as the bullet label in the page\'s Artifacts section.')),
    actions: [{
      label: 'Attach', kind: 'primary',
      onclick: async (close) => {
        const r = await api.post('/api/initiatives/attach', { slug: i.slug, path, label: label.value.trim() });
        toast(`Attached${r.commit.committed ? ` · committed ${r.commit.sha}` : ''}`);
        window.dispatchEvent(new Event('console:saved'));
        close();
        location.reload();
      },
    }],
  });
}

function guessLabel(path) {
  const n = path.toLowerCase();
  if (n.includes('prd')) return 'PRD';
  if (n.includes('metric')) return 'Metrics';
  if (n.includes('experiment')) return 'Experiment';
  if (n.includes('schema')) return 'Table schema';
  if (n.includes('quer') || n.endsWith('.sql')) return 'Query';
  if (n.includes('decision')) return 'Decision';
  if (n.includes('plan')) return 'Eng plan';
  if (n.includes('research') || n.includes('interview')) return 'User research';
  return 'Artifact';
}
