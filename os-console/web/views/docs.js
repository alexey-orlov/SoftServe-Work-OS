// Documentation — the customer-facing docs site embedded as-is, deep-linked via
// its own public hash routes. Read-only: /docs-update owns every change.
import { api } from '/api.js';
import { el, icon, cmdChip, setCrumbs, spinner } from '/ui.js';

export async function render(view, params) {
  view.append(spinner());
  const d = await api.get('/api/docs');
  view.replaceChildren();

  if (!d.exists) {
    setCrumbs([{ label: 'Documentation' }]);
    view.append(el('div', { class: 'page' },
      el('div', { class: 'card' },
        el('h3', {}, 'Documentation not present'),
        el('div', { class: 'hint', style: 'margin:0' },
          `This instance has no ${d.path} — the docs site was not included when the OS was installed.`))));
    return;
  }

  const sId = params.get('s');
  const sec = d.sections.find((x) => x.id === sId) || d.sections[0];
  setCrumbs([{ label: 'Documentation' }, { label: sec.title }]);

  const bar = el('div', { class: 'editor-bar' },
    el('span', { style: 'font-weight:650; font-size:13.5px' }, d.title),
    el('span', { class: 'tag' }, sec.title),
    d.stale ? el('span', {
      class: 'pill warn',
      title: 'Documentation/src is newer than the built site — the page below may be behind the source',
    }, 'Source newer than site') : null,
    d.stale ? cmdChip('/docs-update sync') : null,
    el('span', { class: 'grow' }),
    el('span', { class: 'hint', style: 'margin:0' }, 'Read-only — change it with'),
    cmdChip('/docs-update'),
    el('a', { class: 'btn small quiet', href: `/docs-site${sec.href}`, target: '_blank', rel: 'noopener' },
      icon('external'), 'Open in tab'),
  );

  view.append(el('div', { class: 'editor-page' }, bar,
    el('iframe', { class: 'docs-frame', src: `/docs-site${sec.href}`, title: `${d.title} — ${sec.title}` })));
}
