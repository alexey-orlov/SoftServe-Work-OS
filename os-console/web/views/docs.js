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
  if (sId && sec.id !== sId) history.replaceState(null, '', `#/docs?s=${encodeURIComponent(sec.id)}`);
  setCrumbs([{ label: 'Documentation' }, { label: sec.title }]);

  // No bar of our own either — the crumb slot carries the few actions, the
  // page belongs to the docs. Embedded mode hides the site's header (the
  // console sidebar does section navigation); "Open in tab" gets the
  // untouched standalone site.
  const actions = [
    el('a', {
      class: 'btn small quiet', style: 'margin-left:12px',
      href: `/docs-site${sec.href}`, target: '_blank', rel: 'noopener',
      title: 'Open the standalone site (with its own header) in a browser tab',
    }, icon('external'), 'Open in tab'),
    d.stale ? el('span', {
      class: 'pill warn', style: 'margin-left:8px',
      title: 'Documentation/src is newer than the built site — the pages shown may be behind the source',
    }, 'Source newer than site') : null,
    d.stale ? el('span', { style: 'margin-left:6px' }, cmdChip('/docs-update sync')) : null,
  ].filter(Boolean);
  document.getElementById('crumb-slot').append(...actions);

  view.append(el('div', { class: 'editor-page' },
    el('iframe', { class: 'docs-frame', src: `/docs-site?embed=1${sec.href}`, title: `${d.title} — ${sec.title}` })));
}
