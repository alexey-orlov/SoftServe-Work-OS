// Work OS Console — shell: router, sidebar, search, git chip.
import { api, loadState } from '/api.js';
import { el, icon, toast, setCrumbs } from '/ui.js';

import * as home from '/views/home.js';
import * as initiatives from '/views/initiatives.js';
import * as library from '/views/library.js';
import * as fileView from '/views/file.js';
import * as editor from '/views/editor.js';
import * as steering from '/views/steering.js';
import * as templates from '/views/templates.js';
import * as governance from '/views/governance.js';
import * as activity from '/views/activity.js';
import * as learnings from '/views/learnings.js';

const ROUTES = {
  home, initiatives, initiative: initiatives, library, file: fileView,
  edit: editor, steering, templates, governance, activity, learnings,
};

const NAV = {
  primary: [
    ['home', 'Home', 'home'],
    ['initiatives', 'Initiatives', 'flag'],
    ['library', 'Library', 'book'],
    ['activity', 'Activity', 'clock'],
  ],
  manage: [
    ['steering', 'Steering', 'compass'],
    ['templates', 'Templates', 'copy'],
    ['governance', 'Governance', 'shield'],
    ['learnings', 'Learnings', 'bulb'],
  ],
};

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '') || 'home';
  const [pathPart, query] = h.split('?');
  return { name: pathPart.split('/')[0] || 'home', params: new URLSearchParams(query || '') };
}

async function render() {
  const { name, params } = parseHash();
  const mod = ROUTES[name] || home;
  document.querySelectorAll('.nav-item').forEach((n) => {
    n.classList.toggle('active', n.dataset.route === name
      || (name === 'initiative' && n.dataset.route === 'initiatives')
      || ((name === 'file' || name === 'edit') && n.dataset.route === 'library'));
  });
  const view = document.getElementById('view');
  view.replaceChildren();
  setCrumbs(null);
  try {
    await mod.render(view, params, name);
  } catch (e) {
    console.error(e);
    view.replaceChildren(el('div', { class: 'page' },
      el('div', { class: 'card' }, el('h3', {}, 'This view failed to load'), el('div', { class: 'hint' }, e.message))));
  }
  view.scrollTop = 0;
}

function buildNav() {
  for (const [slot, items] of Object.entries(NAV)) {
    const box = document.getElementById(`nav-${slot}`);
    for (const [route, label, ico] of items) {
      box.append(el('a', { class: 'nav-item', href: `#/${route}`, dataset: { route } }, icon(ico), label));
    }
  }
}

async function refreshChrome() {
  try {
    const o = await api.get('/api/overview');
    if (o.product.name) document.getElementById('brand-name').textContent = o.product.name;
    const g = o.git;
    const chip = document.getElementById('git-chip');
    chip.replaceChildren(
      el('div', {}, el('b', {}, g.branch || 'no branch'),
        g.ahead ? ` ↑${g.ahead}` : '', g.behind ? ` ↓${g.behind}` : '',
        g.dirty ? ` · ${g.dirty} uncommitted` : ' · clean'),
      g.lastCommit ? el('div', { title: g.lastCommit.subject }, `${g.lastCommit.sha} ${g.lastCommit.subject.slice(0, 26)}…`) : null,
      el('div', {}, o.autoSync.on ? `auto-sync: ${o.autoSync.mode}` : 'auto-sync: off'),
    );
  } catch { /* chrome is decorative */ }
}

// ---- global search ---------------------------------------------------------

function wireSearch() {
  const input = document.getElementById('search');
  const box = document.getElementById('search-results');
  let timer = null;

  const hide = () => { box.hidden = true; };
  document.addEventListener('click', (e) => { if (!box.contains(e.target) && e.target !== input) hide(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      e.preventDefault(); input.focus(); input.select();
    }
    if (e.key === 'Escape') { hide(); input.blur(); }
  });

  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { hide(); return; }
    timer = setTimeout(async () => {
      try {
        const { hits } = await api.get(`/api/search?q=${encodeURIComponent(q)}`);
        box.replaceChildren(
          hits.length
            ? el('div', {}, hits.slice(0, 40).map((h) =>
              el('a', { class: 'search-hit', href: `#/file?path=${encodeURIComponent(h.path)}`, onclick: hide },
                el('div', { class: 'p' }, `${h.area} · ${h.path}:${h.line}`),
                el('div', { class: 't' }, h.text))))
            : el('div', { class: 'search-empty' }, 'No matches in the wiki.'),
        );
        box.hidden = false;
      } catch (e) { toast(e.message, 'err'); }
    }, 260);
  });
}

// ---- boot ------------------------------------------------------------------

buildNav();
wireSearch();
window.addEventListener('hashchange', render);
window.addEventListener('console:saved', refreshChrome);
await loadState();
refreshChrome();
render();
