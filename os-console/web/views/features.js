// Product map — the two-level shape of the product: AREAS fold FEATURES.
// The durable twin of Initiatives: the map is the product's lasting shape,
// initiatives the work in flight against it. Every area renders as ONE container
// card — its own header (name, description, mix) above the features nested inside
// it — so the fold is visible, not just implied by indentation.
// v2 catalog: each feature carries durable facts only (status / shipped / design
// pointer) and rolls its artifacts up THROUGH the initiatives that target it; the
// "in progress" state is DERIVED here, never stored. Legacy index shape still
// renders the same way (dual-read, permanent).
import { api } from '/api.js';
import { el, icon, pill, setCrumbs, spinner, cmdChip, staleServerCard } from '/ui.js';

export async function render(view) {
  view.append(spinner());
  const [fi, inits] = await Promise.all([
    api.get('/api/features'),
    api.get('/api/initiatives').then((r) => r.items || []).catch(() => []),
  ]);
  view.replaceChildren();
  setCrumbs([{ label: 'Product map' }]);

  const page = el('div', { class: 'page' });
  view.append(page);

  const catalogMode = fi.shape === 'catalog';
  // rollup: feature slug -> initiatives targeting it; area slug -> initiatives
  // targeting the area itself. A page declares BOTH `areas:` and `features:`, so
  // a feature-targeting initiative also carries an area-only entry — that is the
  // parent of a named feature, not whole-area work. An initiative counts as
  // whole-area only where it names no feature inside that area.
  const byFeature = {};
  const byArea = {};
  for (const it of inits) {
    const named = new Set((it.features || []).filter((f) => f.feature).map((f) => f.area).filter(Boolean));
    const seenArea = new Set();
    for (const f of it.features || []) {
      if (f.feature) (byFeature[f.feature] = byFeature[f.feature] || []).push(it);
      else if (f.area && !named.has(f.area) && !seenArea.has(f.area)) {
        seenArea.add(f.area);
        (byArea[f.area] = byArea[f.area] || []).push(it);
      }
    }
  }
  // "In progress" is derived, not a catalog fact: an ACTIVE initiative targets it.
  const inProgress = (slug) => (byFeature[slug] || []).some((it) => it.status === 'active');
  const areaBusy = (slug) => (byArea[slug] || []).some((it) => it.status === 'active');

  const allFeatures = (fi.areas || []).flatMap((a) => a.features);
  const liveCount = allFeatures.filter((f) => f.catalog && f.catalog.status === 'live').length;
  const wipCount = allFeatures.filter((f) => inProgress(f.feature)).length;
  const arts = (it) => (it.artifacts || []).filter((a) => a.kind === 'file' || a.kind === 'pending');
  // Every initiative ON the map contributes its artifacts — including whole-area
  // ones. An instance whose initiatives all target areas (no feature named yet) is
  // normal, and its artifact count must not read 0/0. Dedupe: one initiative can
  // target a feature here and a whole area there.
  const onMap = {};
  for (const list of [...Object.values(byFeature), ...Object.values(byArea)]) {
    for (const it of list) onMap[it.slug] = it;
  }
  const mapped = Object.values(onMap);
  const artTotal = catalogMode
    ? mapped.reduce((n, it) => n + arts(it).length, 0)
    : allFeatures.reduce((n, f) => n + f.total, 0);
  const artPresent = catalogMode
    ? mapped.reduce((n, it) => n + arts(it).filter((a) => a.exists).length, 0)
    : allFeatures.reduce((n, f) => n + f.present, 0);

  const expandBtn = el('button', { class: 'btn small quiet' }, 'Expand all');
  let expanded = false;
  expandBtn.addEventListener('click', () => {
    expanded = !expanded;
    page.querySelectorAll('details.fi-feature').forEach((d) => { d.open = expanded; });
    expandBtn.textContent = expanded ? 'Collapse all' : 'Expand all';
  });

  page.append(
    el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
      el('h1', { class: 'grow', style: 'margin:0' }, 'Product map'),
      allFeatures.length ? expandBtn : null,
      fi.exists ? el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(fi.path)}`, title: 'The registry behind this page (gated)' }, icon('edit'), 'Edit raw') : null),
    el('div', { class: 'sub', style: 'margin-bottom:14px' },
      'The lasting shape of the product, in two levels. ',
      el('b', {}, 'Product areas'), ' are the big pieces — a product in a multi-product business, or a major section of one. Each area ',
      el('b', {}, 'folds the features'), ' that belong to it, and a feature sits in exactly one area.',
      catalogMode
        ? el('span', {}, ' The map itself holds durable facts only — is a feature planned, live or retired. The work and its documents arrive through the ',
          el('a', { href: '#/initiatives' }, 'initiatives'), ' targeting each feature.')
        : el('span', {}, ' It grows as work starts: ', cmdChip('/prd-draft'), ' and ', cmdChip('/context-update'), ' register features; ', cmdChip('/customize-os'), ' seeds your areas during setup.')),
  );

  if (fi.areas === undefined) {
    page.append(staleServerCard());
    return;
  }
  if (!fi.exists) {
    page.append(el('div', { class: 'card' },
      el('div', { class: 'empty' }, 'The product map has not been created in this instance yet.')));
    return;
  }
  if (!fi.areas.length) {
    page.append(el('div', { class: 'card' },
      el('div', { class: 'empty' }, 'No areas on the map yet — the first ', cmdChip('/prd-draft'), ' run registers one.')));
    return;
  }

  // the map at a glance — outer level first, mirroring the page's own hierarchy
  page.append(el('div', { class: 'tiles', style: 'grid-template-columns:repeat(auto-fit, minmax(140px, 200px)); margin-bottom:8px' },
    el('div', { class: 'tile', style: 'cursor:default' },
      el('div', { class: 'n' }, String(fi.areas.length)), el('div', { class: 't' }, fi.areas.length === 1 ? 'product area' : 'product areas')),
    el('div', { class: 'tile', style: 'cursor:default' },
      el('div', { class: 'n' }, String(allFeatures.length)), el('div', { class: 't' }, allFeatures.length === 1 ? 'feature inside them' : 'features inside them')),
    catalogMode ? el('div', { class: 'tile', style: 'cursor:default' },
      el('div', { class: 'n' }, String(liveCount)), el('div', { class: 't' }, 'live')) : null,
    catalogMode ? el('div', { class: 'tile', style: 'cursor:default', title: 'Derived — an active initiative names the feature. Work aimed at a whole area shows on the area itself.' },
      el('div', { class: 'n' }, String(wipCount)), el('div', { class: 't' }, 'features in progress')) : null,
    el('div', { class: 'tile', style: 'cursor:default' },
      el('div', { class: 'n' }, `${artPresent}/${artTotal}`), el('div', { class: 't' }, 'artifacts in place')),
  ));

  for (const area of fi.areas) {
    page.append(areaCard(area, { catalogMode, byFeature, byArea, inProgress, areaBusy }));
  }
}

// ---- the area container ----------------------------------------------------
// One card per area: a header band that names the area and describes it, then the
// features nested inside the same box. The card IS the fold.

function areaCard(area, ctx) {
  const { catalogMode, byArea, inProgress, areaBusy } = ctx;
  const n = area.features.length;
  const card = el('div', { class: 'card area-card' });

  const live = area.features.filter((f) => f.catalog && f.catalog.status === 'live').length;
  const wip = area.features.filter((f) => inProgress(f.feature)).length;
  const areaInits = byArea[area.area] || [];
  const busy = areaBusy(area.area);

  const head = el('div', { class: 'area-head' },
    el('div', { class: 'area-eyebrow' }, icon('folder'), 'Product area'),
    el('div', { class: 'row wrap area-title-row' },
      el('h2', { class: 'area-name grow' }, area.name || areaTitle(area.area)),
      el('span', { class: 'area-mix' },
        el('b', {}, String(n)), n === 1 ? ' feature' : ' features',
        catalogMode && live ? el('span', {}, ' · ', el('b', {}, String(live)), ' live') : null,
        catalogMode && wip ? el('span', {}, ' · ', el('b', {}, String(wip)), ' in progress') : null,
        // an area worked as a whole has no feature-level count to show — say so here,
        // or the area reads as idle while an active initiative is running on it
        catalogMode && !wip && busy ? el('span', {}, ' · ', el('b', {}, 'work in flight')) : null)),
    el('div', { class: 'area-slug mono' }, area.area),
    area.description ? el('div', { class: 'hint area-desc' }, area.description) : null,
    // Initiatives aimed at the WHOLE area (not one feature) belong to the area,
    // so they show here whether or not the area already has features.
    areaInits.length ? el('div', { class: 'area-inits' },
      el('span', { class: 'lbl' }, 'Whole-area work: '),
      ...areaInits.map((it) => initTag(it))) : null,
  );
  card.append(head);

  const body = el('div', { class: 'area-body' });
  body.append(el('div', { class: 'subgroup area-sub' }, n ? 'Features in this area' : 'Features'));
  if (!n) {
    body.append(el('div', { class: 'empty' },
      areaInits.length
        ? 'No features registered in this area yet — the whole-area work above has not named one.'
        : 'No features registered in this area yet — demand may sit in feature requests; an initiative registers the first entry.'));
  }
  for (const f of area.features) body.append(featureRow(f, ctx));
  card.append(body);
  return card;
}

// ---- one feature, nested inside its area ------------------------------------

function featureRow(f, { catalogMode, byFeature, inProgress }) {
  const det = el('details', { class: 'fi-feature' });
  const targeting = byFeature[f.feature] || [];
  det.append(el('summary', {},
    el('span', { class: 'feat-name' }, (f.catalog && f.catalog.name) || featureTitle(f.feature)),
    catalogMode ? statusPill(f.catalog) : healthPill(f),
    catalogMode && inProgress(f.feature)
      ? el('span', { class: 'pill derived', title: 'Derived, not stored in the map — an active initiative targets this feature' }, 'in progress')
      : null,
    ...(catalogMode ? targeting.map((it) => initTag(it)) : (f.initiatives || []).map((s) => el('a', {
      class: 'tag', href: `#/initiative?slug=${encodeURIComponent(s)}`,
      onclick: (e) => e.stopPropagation(), title: 'linked initiative',
    }, icon('flag'), ' ', s))),
  ));

  const rows = el('div', { class: 'art-rows' });
  if (catalogMode && f.catalog && f.catalog.description) {
    rows.append(el('div', { class: 'hint feat-desc' }, f.catalog.description));
  }
  if (catalogMode && f.catalog && f.catalog.figma) {
    const v = f.catalog.figma;
    rows.append(el('div', { class: 'art-row feat-art' },
      el('span', { class: 'lbl' }, 'Design'),
      el('span', { class: 'val grow' },
        /^https?:/i.test(v)
          ? el('a', { href: v, target: '_blank', rel: 'noopener' }, 'open in Figma ', icon('external'))
          : el('span', { class: 'mono' }, v)),
    ));
  }
  if (catalogMode) {
    if (!targeting.length) {
      rows.append(el('div', { class: 'hint feat-desc' },
        'No initiative targets this feature yet — documents appear here through initiative pages (', cmdChip('/prd-draft'), ' starts one).'));
    }
    for (const it of targeting) {
      rows.append(el('div', { class: 'art-row feat-init' },
        el('span', { class: 'lbl' }, icon('flag'), ' '),
        el('a', { class: 'val grow', href: `#/initiative?slug=${encodeURIComponent(it.slug)}`, style: 'font-weight:600' }, it.slug),
        el('span', { class: `pill ${it.status === 'active' ? 'ok' : 'plain'}` }, it.statusKnown === false ? `⚠ ${it.statusRaw || 'unknown'}` : it.status),
      ));
      for (const a of (it.artifacts || [])) {
        if (a.kind !== 'file' && a.kind !== 'pending' && a.kind !== 'url') continue;
        rows.append(el('div', { class: 'art-row feat-art deep' },
          el('span', { class: 'lbl' }, a.label || ''),
          el('span', { class: 'val grow' },
            a.kind === 'url' ? el('a', { href: a.url, target: '_blank', rel: 'noopener' }, 'open ', icon('external'))
              : el('a', { href: `#/file?path=${encodeURIComponent(a.path)}`, title: a.path }, (a.path || '').split('/').pop())),
          a.kind === 'url' ? null : (a.exists ? pill('ok', 'In place') : (a.kind === 'pending' ? pill('warn', 'Pending') : pill('err', 'Missing'))),
        ));
      }
    }
  } else {
    if (!f.artifacts.length) {
      rows.append(el('div', { class: 'hint feat-desc' },
        'No artifacts registered yet — they attach as ', cmdChip('/prd-draft'), ' and the other programs run.'));
    }
    for (const a of f.artifacts) {
      rows.append(el('div', { class: 'art-row feat-art' },
        el('span', { class: 'lbl' }, a.key),
        el('span', { class: 'val grow' },
          a.kind === 'file' ? el('a', { href: `#/file?path=${encodeURIComponent(a.path)}`, title: a.path }, a.path.split('/').pop())
            : a.kind === 'url' ? el('a', { href: a.url, target: '_blank', rel: 'noopener' }, 'open ', icon('external'))
              : el('span', {}, a.text || '')),
        a.kind === 'file' ? (a.exists ? pill('ok', 'In place') : pill('err', 'Missing')) : null,
      ));
    }
  }
  det.append(rows);
  return det;
}

function initTag(it) {
  return el('a', {
    class: 'tag', href: `#/initiative?slug=${encodeURIComponent(it.slug)}`,
    onclick: (e) => e.stopPropagation(), title: `initiative · ${it.statusText || it.status}`,
  }, icon('flag'), ' ', it.slug);
}

// Catalog status pill: planned (quiet) / live (green, with date) / retired (plain).
function statusPill(cat) {
  const s = (cat && cat.status) || '';
  if (s === 'live') return el('span', { class: 'pill ok', title: cat.shipped ? `shipped ${cat.shipped}` : '' }, cat.shipped ? `live · ${cat.shipped}` : 'live');
  if (s === 'planned') return el('span', { class: 'pill warn' }, 'planned');
  if (s === 'retired') return el('span', { class: 'pill plain' }, 'retired');
  return el('span', { class: 'pill err' }, s ? `⚠ ${s}` : '⚠ no status');
}

// Legacy shape: one state pill per feature — color carries completeness.
function healthPill(f) {
  if (!f.total) return el('span', { class: 'pill plain' }, 'No artifacts yet');
  if (f.present === f.total) return el('span', { class: 'pill ok' }, `${f.present}/${f.total} in place`);
  return el('span', { class: 'pill warn' }, `${f.present}/${f.total} in place`);
}

function areaTitle(s) {
  return s.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
function featureTitle(s) {
  return s.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
