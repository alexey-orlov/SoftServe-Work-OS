// File viewer — rendered markdown / code, with tier badge and initiative back-links.
import { api, pushRecent, isPinned, togglePin } from '/api.js';
import { el, icon, tierPill, mdRender, timeAgo, setCrumbs, spinner, esc, toast } from '/ui.js';

const EDITABLE = ['.md', '.yaml', '.yml', '.txt', '.json', '.sql', '.csv'];

export async function render(view, params) {
  const path = params.get('path') || '';
  view.append(spinner());
  let f;
  try { f = await api.get(`/api/file?path=${encodeURIComponent(path)}`); }
  catch (e) {
    view.replaceChildren(el('div', { class: 'page' },
      el('div', { class: 'card' }, el('h3', {}, 'Not found'), el('div', { class: 'hint' }, e.message))));
    return;
  }
  view.replaceChildren();

  const parts = f.path.split('/');
  setCrumbs([
    { label: 'Library', href: '#/library' },
    ...parts.slice(0, -1).map((seg, idx) => ({
      label: seg, href: `#/library?path=${encodeURIComponent(parts.slice(0, idx + 1).join('/'))}`,
    })),
    { label: parts[parts.length - 1] },
  ]);

  const title = parts[parts.length - 1];
  pushRecent({ path: f.path, title });

  const page = el('div', { class: 'page' });
  view.append(page);

  const canEdit = f.isText && EDITABLE.some((ext) => f.path.endsWith(ext));
  page.append(el('div', { class: 'row wrap', style: 'margin-bottom:14px' },
    el('h1', { class: 'grow', style: 'margin:0; font-size:18px' }, title),
    tierPill(f.tier),
    el('span', { class: 'tag', title: 'last committed change' }, timeAgo(f.lastChange || f.mtimeMs)),
    el('button', {
      class: 'btn small quiet', onclick: (e) => {
        const on = togglePin(f.path);
        toast(on ? 'Pinned' : 'Unpinned');
        e.currentTarget.firstChild.style.color = on ? 'var(--warm)' : '';
      },
    }, icon('pin'), isPinned(f.path) ? 'Pinned' : 'Pin'),
    canEdit ? el('a', { class: 'btn small primary', href: `#/edit?path=${encodeURIComponent(f.path)}` }, icon('edit'), 'Edit') : null,
  ));

  if (f.tier === 'gated' && f.tierNote) {
    page.append(el('div', { class: 'hint', style: 'margin:-8px 0 14px' },
      icon('lock'), ` Gated by write-policy rule "${f.tierRule}" — ${f.tierNote}`));
  }
  if (f.linkedInitiatives.length) {
    page.append(el('div', { class: 'row wrap', style: 'margin:-4px 0 14px' },
      el('span', { class: 'hint', style: 'margin:0' }, 'Linked from:'),
      ...f.linkedInitiatives.map((s) => el('a', { class: 'tag', href: `#/initiative?slug=${encodeURIComponent(s)}` }, icon('flag'), ` ${s}`))));
  }

  if (f.isImage) {
    page.append(el('div', { class: 'card' }, el('img', { src: `/api/raw?path=${encodeURIComponent(f.path)}`, style: 'max-width:100%' })));
  } else if (!f.isText) {
    page.append(el('div', { class: 'card' }, el('div', { class: 'empty' }, `Binary or oversized file (${(f.size / 1024).toFixed(0)} KB) — open it in your editor.`)));
  } else if (f.path.endsWith('.md')) {
    page.append(el('div', { class: 'card', style: 'padding:22px 28px' }, mdRender(f.content, f.path)));
  } else {
    page.append(el('pre', { class: 'raw', html: esc(f.content) }));
  }
}
