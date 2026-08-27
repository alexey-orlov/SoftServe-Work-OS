// Steering files — every file that steers agent sessions, with population
// status per file, plus the feature index rendered as a readable structure.
// Data: /api/steering (steering.page_data()) — derived from the write policy
// and the canonical registries, never a hardcoded list.
import { api } from '/api.js';
import { el, icon, pill, timeAgo, setCrumbs, spinner, cmdChip, gatedTag } from '/ui.js';

const GROUPS = [
  ['core', 'Core steering', 'The registries and rules every session leans on.'],
  ['business', 'Business context', 'Who we are — populated during setup, edited in place after.'],
  ['living', 'Living pages', 'Current-truth pages agents edit freely (auto tier) — watched for freshness, not gated.'],
];

export async function render(view) {
  view.append(spinner());
  const d = await api.get('/api/steering');
  view.replaceChildren();
  setCrumbs([{ label: 'Steering files' }]);

  const page = el('div', { class: 'page' });
  view.append(page);
  page.append(
    el('h1', {}, 'Steering files'),
    el('div', { class: 'sub' },
      'The distilled context every agent session reads before working. Status shows how populated each file is — placeholders and [GAP:] markers left. Open to read, ✎ to edit.'),
  );

  for (const [key, title, hint] of GROUPS) {
    const rows = d.rows.filter((r) => r.group === key);
    if (!rows.length) continue;
    const card = el('div', { class: 'card' },
      el('h3', {}, title),
      el('div', { class: 'hint' }, hint));
    for (const r of rows) {
      card.append(el('div', { class: 'art-row' },
        r.state ? pill(r.state) : el('span', { class: 'pill plain', title: 'Registry — complete by construction, no population status' }, '—'),
        el('span', { class: 'val grow' },
          el('a', { href: `#/file?path=${encodeURIComponent(r.path)}`, style: 'font-weight:600', title: r.stateDetail || r.path }, r.title),
          gatedTag(r.tier, true),
          el('span', { class: 'mini' }, r.role || '')),
        el('span', { class: 'when' },
          r.updatedHeader ? `_updated ${r.updatedHeader}` : timeAgo(r.lastChange)),
        el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(r.path)}`, title: 'Edit' }, icon('edit')),
      ));
    }
    page.append(card);
  }

  page.append(featureIndexBlock(d.featureIndex));
}

// ---- feature index — the product map, readable ------------------------------

function featureIndexBlock(fi) {
  const card = el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', { class: 'grow' }, 'Feature index — the product map'),
      fi.exists ? el('a', { class: 'btn small quiet', href: `#/edit?path=${encodeURIComponent(fi.path)}` }, icon('edit'), 'Edit raw') : null),
    el('div', { class: 'hint' },
      'Every feature mapped to its artifacts, by product area. It grows organically — /prd-draft and /context-update register features as work starts; /customize-os seeds your product areas during the initiatives step. Nothing else bulk-edits it.'),
  );
  if (!fi.exists) {
    card.append(el('div', { class: 'empty' }, 'No feature-index.yaml in this instance.'));
    return card;
  }
  if (!fi.areas.length) {
    card.append(el('div', { class: 'empty' }, 'No features registered yet — the first ', cmdChip('/prd-draft'), ' run registers one.'));
    return card;
  }
  for (const area of fi.areas) {
    card.append(el('div', { class: 'subgroup' }, area.area));
    for (const f of area.features) {
      const det = el('details', { class: 'fi-feature' });
      det.append(el('summary', { style: 'cursor:pointer; padding:6px 0; display:flex; gap:9px; align-items:center' },
        el('span', { style: 'font-weight:600' }, f.feature),
        el('span', { class: 'tag' }, `${f.present}/${f.total} artifacts in place`),
        ...f.initiatives.map((s) => el('a', {
          class: 'tag', href: `#/initiative?slug=${encodeURIComponent(s)}`,
          onclick: (e) => e.stopPropagation(), title: 'linked initiative',
        }, s)),
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
  }
  return card;
}
