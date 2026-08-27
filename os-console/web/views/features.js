// Features — the product map: feature-index.yaml as a navigable structure.
// The durable twin of Initiatives: features are the product's lasting shape,
// initiatives the work in flight against it. Area → feature → artifacts with
// live existence status and linked initiatives.
import { api } from '/api.js';
import { el, icon, pill, setCrumbs, spinner, cmdChip, staleServerCard } from '/ui.js';

export async function render(view) {
  view.append(spinner());
  const fi = await api.get('/api/features');
  view.replaceChildren();
  setCrumbs([{ label: 'Features' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('div', { class: 'row wrap', style: 'margin-bottom:4px' },
      el('h1', { class: 'grow', style: 'margin:0' }, 'Features'),
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

  for (const area of fi.areas) {
    page.append(el('h2', { class: 'group-head' }, areaTitle(area.area)));
    const card = el('div', { class: 'card' });
    for (const f of area.features) {
      const det = el('details', { class: 'fi-feature' });
      det.append(el('summary', { style: 'cursor:pointer; padding:7px 0; display:flex; gap:9px; align-items:center; flex-wrap:wrap' },
        el('span', { style: 'font-weight:600' }, featureTitle(f.feature)),
        el('span', { class: 'tag' }, `${f.present}/${f.total} artifacts in place`),
        ...f.initiatives.map((s) => el('a', {
          class: 'tag', href: `#/initiative?slug=${encodeURIComponent(s)}`,
          onclick: (e) => e.stopPropagation(), title: 'linked initiative',
        }, icon('flag'), ' ', s)),
      ));
      if (!f.artifacts.length) {
        det.append(el('div', { class: 'hint', style: 'padding-left:16px' }, 'No artifacts registered yet.'));
      }
      for (const a of f.artifacts) {
        det.append(el('div', { class: 'art-row', style: 'padding-left:16px; border-bottom:0; padding-top:2px; padding-bottom:3px; font-size:12.5px' },
          el('span', { class: 'lbl' }, a.key),
          el('span', { class: 'val grow' },
            a.kind === 'file' ? el('a', { href: `#/file?path=${encodeURIComponent(a.path)}` }, a.path.split('/').pop())
              : a.kind === 'url' ? el('a', { href: a.url, target: '_blank', rel: 'noopener' }, 'open ', icon('external'))
                : el('span', {}, a.text || '')),
          a.kind === 'file' ? (a.exists ? pill('ok', 'In place') : pill('err', 'Missing')) : null,
        ));
      }
      card.append(det);
    }
    page.append(card);
  }
}

function areaTitle(s) {
  return s.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
function featureTitle(s) {
  return s.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
