// Shared UI toolkit — DOM builder, pills, markdown, modals, toasts, file picker.
import { api } from '/api.js';

// ---- DOM builder ---------------------------------------------------------

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  append(node, children);
  return node;
}

function append(node, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---- icons (inline, stroke) ----------------------------------------------

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 5-4.8 2 2.2-5z"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M8.5 14.5a6 6 0 1 1 7 0c-.8.6-1.5 1.5-1.5 2.5h-4c0-1-.7-1.9-1.5-2.5z"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2.2 2.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  pin: '<path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 8.7l5.4-.8z"/>',
  edit: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M13.5 6.5l3 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 13l4 4L19 7"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  external: '<path d="M14 5h5v5"/><path d="M19 5l-9 9"/><path d="M19 13v6H5V5h6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 3v4.5h-4.5"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h4"/>',
  pr: '<circle cx="6" cy="5.5" r="2.3"/><circle cx="6" cy="18.5" r="2.3"/><circle cx="18" cy="18.5" r="2.3"/><path d="M6 8v8"/><path d="M12.5 5.5H16a2 2 0 0 1 2 2v8.5"/><path d="M14.5 3.5l-2 2 2 2"/>',
  sliders: '<path d="M4 8h9M17.5 8H20M4 16h2.5M11 16h9"/><circle cx="15.2" cy="8" r="2.2"/><circle cx="8.2" cy="16" r="2.2"/>',
};

export function icon(name) {
  const span = document.createElement('span');
  span.innerHTML = `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.file}</svg>`;
  return span.firstChild;
}

// ---- small components ----------------------------------------------------

const STATUS_PILL = {
  active: ['ok', 'Active'], exploring: ['info', 'Exploring'], paused: ['warn', 'Paused'],
  shipped: ['plain', 'Shipped'], killed: ['todo', 'Killed'],
  done: ['ok', 'Done'], partial: ['warn', 'In progress'], todo: ['todo', 'To do'],
};

export function pill(kind, label) {
  const [cls, text] = STATUS_PILL[kind] || ['plain', label || kind];
  return el('span', { class: `pill ${cls}` }, label !== undefined && !(kind in STATUS_PILL) ? label : (label ?? text));
}

export function statusPill(status) {
  const [cls, text] = STATUS_PILL[status] || ['plain', status];
  return el('span', { class: `pill ${cls}` }, text);
}

export function tierPill(tier) {
  return tier === 'gated'
    ? el('span', { class: 'pill gate', title: 'Gated steering file (write-policy) — saving from the console is your approval' }, icon('lock'), 'Gated')
    : el('span', { class: 'pill plain', title: 'Auto tier — agents write this freely' }, 'Auto');
}

// Small badge for file listings: present only on gated paths (absence = auto tier).
export function gatedTag(tier) {
  if (tier !== 'gated') return null;
  return el('span', {
    class: 'pill gate xs',
    title: 'Gated (write-policy) — needs a human\'s approval to change; never lands by automation',
  }, icon('lock'), 'Gated');
}

export function cmdChip(cmd) {
  return el('span', { class: 'cmd' },
    cmd,
    el('button', {
      onclick: async (e) => {
        e.stopPropagation();
        try { await navigator.clipboard.writeText(cmd); toast(`Copied ${cmd} — paste it into Claude Code`); }
        catch { toast('Copy failed — select it manually', 'err'); }
      },
      title: 'Copy — this step runs as a guided program in Claude Code',
    }, 'Copy'),
  );
}

export function meter(done, total, labelText) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return el('div', { class: 'meter' },
    el('div', { class: 'track' }, el('div', { class: 'fill', style: `width:${pct}%` })),
    el('span', { class: 'label' }, labelText || `${done} of ${total}`),
  );
}

export function timeAgo(input) {
  if (!input) return '—';
  const t = typeof input === 'number' ? input : Date.parse(input);
  if (Number.isNaN(t)) return String(input);
  const s = (Date.now() - t) / 1000;
  if (s < 90) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400 * 2) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d ago`;
  return new Date(t).toISOString().slice(0, 10);
}

export function toast(msg, kind) {
  const t = el('div', { class: `toast ${kind || ''}` }, msg);
  document.getElementById('toasts').append(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 350); }, kind === 'err' ? 5200 : 3200);
}

// ---- markdown ------------------------------------------------------------

let markedReady = false;
function initMarked() {
  if (markedReady || !window.marked) return;
  window.marked.use({
    renderer: { html: (h) => esc(typeof h === 'string' ? h : (h && h.text) || '') },
    mangle: false, headerIds: false,
  });
  markedReady = true;
}

function joinRel(fromDir, href) {
  const stack = [];
  for (const part of `${fromDir}/${href}`.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}

// Render markdown with repo-aware links: relative hrefs open in the console.
export function mdRender(text, fromRel) {
  initMarked();
  const div = el('div', { class: 'md' });
  div.innerHTML = window.marked ? window.marked.parse(text || '') : `<pre>${esc(text)}</pre>`;
  const fromDir = fromRel ? fromRel.split('/').slice(0, -1).join('/') : '';
  for (const a of div.querySelectorAll('a')) {
    const href = a.getAttribute('href') || '';
    if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener'; continue; }
    if (href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) { a.removeAttribute('href'); continue; }
    const target = joinRel(fromDir, href.split('#')[0]);
    a.setAttribute('href', `#/file?path=${encodeURIComponent(target)}`);
  }
  for (const img of div.querySelectorAll('img')) {
    const src = img.getAttribute('src') || '';
    if (!/^https?:/i.test(src) && !src.startsWith('data:')) {
      img.src = `/api/raw?path=${encodeURIComponent(joinRel(fromDir, src))}`;
    }
  }
  return div;
}

// ---- modal ----------------------------------------------------------------

export function modal({ title, body, actions = [], wide }) {
  const root = document.getElementById('modal-root');
  const close = () => back.remove();
  const back = el('div', { class: 'modal-back', onclick: (e) => { if (e.target === back) close(); } },
    el('div', { class: 'modal', style: wide ? 'width:min(860px,94vw)' : '' },
      el('header', {}, title, el('button', { class: 'btn quiet x', onclick: close }, icon('x'))),
      el('div', { class: 'm-body' }, body),
      actions.length ? el('footer', {},
        actions.map((a) => el('button', {
          class: `btn ${a.kind || ''}`,
          onclick: async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            try { if ((await a.onclick(close)) !== false) { /* action decides */ } }
            catch (err) { toast(err.message, 'err'); }
            finally { btn.disabled = false; }
          },
        }, a.label)),
      ) : null,
    ),
  );
  root.append(back);
  const focusable = back.querySelector('input, textarea, select');
  if (focusable) setTimeout(() => focusable.focus(), 40);
  back.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  return { close };
}

export function field(labelText, inputEl, note) {
  return el('div', { class: 'field' },
    el('label', {}, labelText), inputEl,
    note ? el('div', { class: 'note' }, note) : null);
}

// ---- file picker (browses /api/library) ------------------------------------

export function filePicker({ title = 'Pick a file', onPick, startPath = 'product-development' }) {
  let current = startPath;
  const listBox = el('div', { class: 'picker-list' });
  const crumbBox = el('div', { class: 'row wrap', style: 'margin-bottom:8px; font-size:12px;' });

  async function load(p) {
    current = p;
    listBox.textContent = 'Loading…';
    crumbBox.replaceChildren();
    const parts = p ? p.split('/') : [];
    crumbBox.append(el('a', { href: '#', onclick: (e) => { e.preventDefault(); load(''); } }, 'repo'));
    parts.forEach((seg, i) => {
      crumbBox.append(el('span', { class: 'sep' }, ' / '));
      crumbBox.append(el('a', { href: '#', onclick: (e) => { e.preventDefault(); load(parts.slice(0, i + 1).join('/')); } }, seg));
    });
    try {
      const d = await api.get(`/api/library?path=${encodeURIComponent(p)}`);
      listBox.replaceChildren(...d.entries.map((entry) =>
        el('div', {
          class: 'picker-row',
          onclick: () => entry.type === 'dir' ? load(entry.rel) : (onPick(entry.rel), m.close()),
        },
        icon(entry.type === 'dir' ? 'folder' : 'file'),
        el('span', {}, entry.name),
        gatedTag(entry.tier),
        el('span', { class: 'd grow' }, entry.desc || ''),
        ),
      ));
      if (!d.entries.length) listBox.replaceChildren(el('div', { class: 'empty' }, 'Empty folder'));
    } catch (e) { listBox.replaceChildren(el('div', { class: 'empty' }, e.message)); }
  }

  const m = modal({ title, body: el('div', {}, crumbBox, listBox), wide: true });
  load(current);
  return m;
}

export function crumbs(parts) {
  const box = el('span', {});
  parts.forEach((p, i) => {
    if (i) box.append(el('span', { class: 'sep' }, '›'));
    box.append(p.href && i < parts.length - 1
      ? el('a', { href: p.href }, p.label)
      : el('span', { class: i === parts.length - 1 ? 'here' : '' }, p.label));
  });
  return box;
}

export function setCrumbs(parts) {
  document.getElementById('crumb-slot').replaceChildren(parts ? crumbs(parts) : '');
}

export function spinner(msg) { return el('div', { class: 'spin' }, msg || 'Loading…'); }
export function errorBox(e) { return el('div', { class: 'card' }, el('h3', {}, 'Something broke'), el('div', { class: 'hint' }, e.message)); }
