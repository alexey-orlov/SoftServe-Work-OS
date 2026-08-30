// Features — the product map: the areas → features catalog as a navigable structure.
// The durable twin of Initiatives: features are the product's lasting shape,
// initiatives the work in flight against it. v2 catalog: each feature shows its
// status (planned / live / retired + shipped date) and rolls its artifacts up
// THROUGH the initiatives that target it (the catalog itself holds no artifact
// rows — the initiative pages are the artifact manifests). Legacy index shape
// still renders the old way (dual-read, permanent).
import { api } from '/api.js';
import { el, icon, pill, setCrumbs, spinner, cmdChip, staleServerCard } from '/ui.js';

export async function render(view) {
  view.append(spinner());
  const [fi, inits] = await Promise.all([
    api.get('/api/features'),
    api.get('/api/initiatives').then((r) => r.items || []).catch(() => []),
  ]);
  view.replaceChildren();
  setCrumbs([{ label: 'Features' }]);

  const page = el('div', { class: 'page' });
  view.append(page);

  const catalogMode = fi.shape === 'catalog';
  // rollup: feature slug -> [{slug, status, artifacts, note}] from initiative targets
  const byFeature = {};
  const byArea = {};
  for (const it of inits) {
    for (const f of it.features || []) {
      if (f.feature) (byFeature[f.feature] = byFeature[f.feature] || []).push(it);
      else if (f.area) (byArea[f.area] = byArea[f.area] || []).push(it);
    }
  }

  const allFeatures = (fi.areas || []).flatMap((a) => a.features);
  const liveCount = allFeatures.filter((f) => f.catalog && f.catalog.status === 'live').length;
  const rollArt = (slug) => (byFeature[slug] || []).flatMap((it) =>
    (it.artifacts || []).filter((a) => a.kind === 'file' || a.kind === 'pending'));
  const artTotal = catalogMode
    ? allFeatures.reduce((n, f) => n + rollArt(f.feature).length, 0)
    : allFeatures.reduce((n, f) => n + f.total, 0);
  const artPresent = catalogMode
    ? allFeatures.reduce((n, f) => n + rollArt(f.feature).filter((a) => a.exists).length, 0)
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
      el('h1', { class: 'grow', style: 'margin:0' }, 'Features'),
      allFeatures.length ? expandBtn : null,
      fi.exists ? el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(fi.path)}`, title: 'The registry behind this page (gated)' }, icon('edit'), 'Edit raw') : null),
    el('div', { class: 'sub' },
      catalogMode
        ? 'The product map — areas → features with their catalog status; each feature’s artifacts roll up through the initiatives targeting it. New features register as planned when an initiative picks them up (/prd-draft); the launch gate flips them live.'
        : 'The product map — every feature and the artifacts behind it, by product area. It grows as work starts: /prd-draft and /context-update register features; /customize-os seeds your areas during setup.'),
  );

  if (fi.areas === undefined) {
    page.append(staleServerCard());
    return;
  }
  if (!fi.exists) {
    page.append(el('div', { class: 'card' },
      el('div', { class: 'empty' }, 'The feature index has not been created in this instance yet.')));
    return;
  }
  if (!fi.areas.length) {
    page.append(el('div', { class: 'card' },
      el('div', { class: 'empty' }, 'No features registered yet — the first ', cmdChip('/prd-draft'), ' run registers one.')));
    return;
  }

  // the map at a glance
  page.append(el('div', { class: 'tiles', style: 'grid-template-columns:repeat(auto-fit, minmax(140px, 200px)); margin-bottom:6px' },
    el('div', { class: 'tile', style: 'cursor:default' },
      el('div', { class: 'n' }, String(allFeatures.length)), el('div', { class: 't' }, allFeatures.length === 1 ? 'feature' : 'features')),
    el('div', { class: 'tile', style: 'cursor:default' },
      el('div', { class: 'n' }, String(fi.areas.length)), el('div', { class: 't' }, fi.areas.length === 1 ? 'product area' : 'product areas')),
    catalogMode ? el('div', { class: 'tile', style: 'cursor:default' },
      el('div', { class: 'n' }, String(liveCount)), el('div', { class: 't' }, 'live')) : null,
    el('div', { class: 'tile', style: 'cursor:default' },
      el('div', { class: 'n' }, `${artPresent}/${artTotal}`), el('div', { class: 't' }, 'artifacts in place')),
  ));

  for (const area of fi.areas) {
    const head = el('h2', { class: 'group-head' }, area.name || areaTitle(area.area),
      el('span', { class: 'area-count' }, `${area.features.length} ${area.features.length === 1 ? 'feature' : 'features'}`));
    page.append(head);
    if (area.description) page.append(el('div', { class: 'hint', style: 'margin:-4px 0 6px' }, area.description));
    const card = el('div', { class: 'card' });
    if (!area.features.length) {
      const areaInits = byArea[area.area] || [];
      card.append(el('div', { class: 'empty' },
        areaInits.length
          ? el('span', {}, 'No features yet — worked by ',
              ...areaInits.map((it) => el('a', { class: 'tag', href: `#/initiative?slug=${encodeURIComponent(it.slug)}` }, icon('flag'), ' ', it.slug)))
          : 'No features yet — demand may sit in feature requests; an initiative registers the first entry.'));
    }
    for (const f of area.features) {
      const det = el('details', { class: 'fi-feature' });
      const targeting = byFeature[f.feature] || [];
      det.append(el('summary', {},
        el('span', { style: 'font-weight:600' }, (f.catalog && f.catalog.name) || featureTitle(f.feature)),
        catalogMode ? statusPill(f.catalog) : healthPill(f),
        ...(catalogMode ? targeting.map((it) => initTag(it)) : (f.initiatives || []).map((s) => el('a', {
          class: 'tag', href: `#/initiative?slug=${encodeURIComponent(s)}`,
          onclick: (e) => e.stopPropagation(), title: 'linked initiative',
        }, icon('flag'), ' ', s))),
      ));
      const rows = el('div', { class: 'art-rows' });
      if (catalogMode && f.catalog && f.catalog.description) {
        rows.append(el('div', { class: 'hint', style: 'padding-left:16px' }, f.catalog.description));
      }
      if (catalogMode) {
        if (!targeting.length) {
          rows.append(el('div', { class: 'hint', style: 'padding-left:16px' },
            'No initiative targets this feature yet — artifacts appear here through initiative pages (', cmdChip('/prd-draft'), ' starts one).'));
        }
        for (const it of targeting) {
          rows.append(el('div', { class: 'art-row', style: 'padding-left:16px; border-bottom:0; padding-top:4px; font-size:12.5px' },
            el('span', { class: 'lbl' }, icon('flag'), ' '),
            el('a', { class: 'val grow', href: `#/initiative?slug=${encodeURIComponent(it.slug)}`, style: 'font-weight:600' }, it.slug),
            el('span', { class: `pill ${it.status === 'active' ? 'ok' : 'plain'}` }, it.statusKnown === false ? `⚠ ${it.statusRaw || 'unknown'}` : it.status),
          ));
          for (const a of (it.artifacts || [])) {
            if (a.kind !== 'file' && a.kind !== 'pending' && a.kind !== 'url') continue;
            rows.append(el('div', { class: 'art-row', style: 'padding-left:34px; border-bottom:0; padding-top:2px; padding-bottom:3px; font-size:12.5px' },
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
          rows.append(el('div', { class: 'hint', style: 'padding-left:16px' },
            'No artifacts registered yet — they attach as ', cmdChip('/prd-draft'), ' and the other programs run.'));
        }
        for (const a of f.artifacts) {
          rows.append(el('div', { class: 'art-row', style: 'padding-left:16px; border-bottom:0; padding-top:2px; padding-bottom:3px; font-size:12.5px' },
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
      card.append(det);
    }
    if (area.features.length || catalogMode) page.append(card);
  }
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
