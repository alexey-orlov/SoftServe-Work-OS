// Features — the product map: feature-index.yaml as a navigable structure.
// The durable twin of Initiatives: features are the product's lasting shape,
// initiatives the work in flight against it. Area → feature → artifacts with
// live existence status and linked initiatives. Health is readable at every
// level: the stat row up top, a state pill per feature, Missing per artifact.
import { api } from '/api.js';
import { el, icon, pill, setCrumbs, spinner, cmdChip, staleServerCard } from '/ui.js';

export async function render(view) {
  view.append(spinner());
  const fi = await api.get('/api/features');
  view.replaceChildren();
  setCrumbs([{ label: 'Features' }]);

  const page = el('div', { class: 'page' });
  view.append(page);

  const allFeatures = (fi.areas || []).flatMap((a) => a.features);
  const artTotal = allFeatures.reduce((n, f) => n + f.total, 0);
  const artPresent = allFeatures.reduce((n, f) => n + f.present, 0);

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
      'The product map — every feature and the artifacts behind it, by product area. It grows as work starts: /prd-draft and /context-update register features; /customize-os seeds your areas during setup.'),
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
    el('div', { class: 'tile', style: 'cursor:default' },
      el('div', { class: 'n' }, `${artPresent}/${artTotal}`), el('div', { class: 't' }, 'artifacts in place')),
  ));

  for (const area of fi.areas) {
    page.append(el('h2', { class: 'group-head' }, areaTitle(area.area),
      el('span', { class: 'area-count' }, `${area.features.length} ${area.features.length === 1 ? 'feature' : 'features'}`)));
    const card = el('div', { class: 'card' });
    for (const f of area.features) {
      const det = el('details', { class: 'fi-feature' });
      det.append(el('summary', {},
        el('span', { style: 'font-weight:600' }, featureTitle(f.feature)),
        healthPill(f),
        ...f.initiatives.map((s) => el('a', {
          class: 'tag', href: `#/initiative?slug=${encodeURIComponent(s)}`,
          onclick: (e) => e.stopPropagation(), title: 'linked initiative',
        }, icon('flag'), ' ', s)),
      ));
      const rows = el('div', { class: 'art-rows' });
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
      det.append(rows);
      card.append(det);
    }
    page.append(card);
  }
}

// One state pill per feature — color carries completeness, the label carries the numbers.
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
