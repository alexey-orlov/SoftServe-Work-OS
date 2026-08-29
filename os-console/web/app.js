// Work OS Console — shell: router, sidebar, search, git chip.
import { api, loadState } from '/api.js';
import { el, icon, toast, setCrumbs } from '/ui.js';

import * as home from '/views/home.js';
import * as initiatives from '/views/initiatives.js';
import * as library from '/views/library.js';
import * as fileView from '/views/file.js';
import * as editor from '/views/editor.js';
import * as templates from '/views/templates.js';
import * as governance from '/views/governance.js';
import * as activity from '/views/activity.js';
import * as learnings from '/views/learnings.js';
import * as docsView from '/views/docs.js';
import * as setup from '/views/setup.js';
import * as proposedView from '/views/proposed.js';
import * as featuresView from '/views/features.js';
import * as autosyncView from '/views/autosync.js';
import * as skillsView from '/views/skills.js';
import * as competitionView from '/views/competition.js';
import { currentModeLabel } from '/views/autosync.js';

const ROUTES = {
  home, initiatives, initiative: initiatives, library, file: fileView,
  edit: editor, templates, governance, activity, learnings,
  docs: docsView, setup, proposed: proposedView,
  features: featuresView, autosync: autosyncView,
  skills: skillsView, competition: competitionView,
  steering: { render: () => location.replace('#/features') }, // old links self-correct
};

const NAV = {
  primary: [
    ['home', 'Home', 'home'],
    ['initiatives', 'Initiatives', 'flag'],
    ['features', 'Features', 'compass'],
    ['library', 'Library', 'book'],
    ['activity', 'Activity', 'clock'],
  ],
  manage: [
    ['setup', 'Set up this OS', 'sliders'],
    ['governance', 'Gated files', 'shield'],
    ['proposed', 'Proposed changes', 'pr'],
    ['learnings', 'Learnings', 'bulb'],
  ],
};

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '') || 'home';
  const [pathPart, query] = h.split('?');
  return { name: pathPart.split('/')[0] || 'home', params: new URLSearchParams(query || '') };
}

async function render(preserveScroll = false) {
  const { name, params } = parseHash();
  const mod = ROUTES[name] || home;
  document.querySelectorAll('.nav-item').forEach((n) => {
    let active = n.dataset.route === name
      || (name === 'initiative' && n.dataset.route === 'initiatives')
      || ((name === 'file' || name === 'edit' || name === 'templates'
        || name === 'skills' || name === 'competition') && n.dataset.route === 'library');
    if (n.dataset.section) {
      active = name === 'docs'
        && (n.dataset.section === params.get('s') || (!params.get('s') && n.dataset.first !== undefined));
    }
    n.classList.toggle('active', active);
  });
  const view = document.getElementById('view');
  const prevScroll = view.scrollTop;
  view.replaceChildren();
  setCrumbs(null);
  try {
    await mod.render(view, params, name);
  } catch (e) {
    console.error(e);
    view.replaceChildren(el('div', { class: 'page' },
      el('div', { class: 'card' }, el('h3', {}, 'This view failed to load'), el('div', { class: 'hint' }, e.message))));
  }
  view.scrollTop = preserveScroll ? prevScroll : 0;
}

function buildNav() {
  for (const [slot, items] of Object.entries(NAV)) {
    const box = document.getElementById(`nav-${slot}`);
    for (const [route, label, ico] of items) {
      box.append(el('a', { class: 'nav-item', href: `#/${route}`, dataset: { route } }, icon(ico), label));
    }
  }
}

// Documentation nav is derived from the built site's own section tabs — the
// group only appears when Documentation/work-os-docs.html exists.
async function mountDocsNav() {
  try {
    const d = await api.get('/api/docs');
    if (!d.exists || !d.sections.length) return;
    const slot = document.getElementById('nav-docs');
    const group = el('nav', { class: 'nav-group', 'aria-label': 'Documentation' });
    d.sections.forEach((s, i) => {
      const ds = { route: 'docs', section: s.id };
      if (i === 0) ds.first = '';
      group.append(el('a', {
        class: 'nav-item', href: `#/docs?s=${encodeURIComponent(s.id)}`, dataset: ds,
      }, icon('doc'), s.title));
    });
    slot.append(el('div', { class: 'nav-label' }, 'Documentation'), group);
    if (parseHash().name === 'docs') render(true); // booted straight into docs — fix active state
  } catch { /* docs absent — no group */ }
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
      el('div', {}, `auto-sync: ${currentModeLabel(o.autoSync).toLowerCase()}`),
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
            : el('div', { class: 'search-empty' }, 'No matches.'),
        );
        box.hidden = false;
      } catch (e) { toast(e.message, 'err'); }
    }, 260);
  });
}

// ---- live refresh -----------------------------------------------------------
// The server watches the repo (fs.watch) and streams change events; open views
// re-render so the console always mirrors disk. Auto-refresh holds back while
// you are typing (editor, any focused field, open modal) — the ⟳ button gets an
// orange dot instead, and catches up as soon as you are done.

const refreshBtn = document.getElementById('refresh-btn');
let pendingRefresh = false;

function canAutoRefresh() {
  if (parseHash().name === 'edit') return false;
  if (document.getElementById('modal-root').childElementCount > 0) return false;
  const a = document.activeElement;
  if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.id !== 'search') return false;
  return true;
}

function markPending() {
  pendingRefresh = true;
  refreshBtn.classList.add('attention');
}

function doRefresh() {
  pendingRefresh = false;
  refreshBtn.classList.remove('attention');
  render(true);
  refreshChrome();
}

function catchUpIfPending() {
  if (pendingRefresh && canAutoRefresh()) doRefresh();
}

function wireLive() {
  refreshBtn.append(icon('refresh'));
  refreshBtn.addEventListener('click', doRefresh);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey
      && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) doRefresh();
  });
  // catch up once typing/modals finish
  document.addEventListener('focusout', () => setTimeout(catchUpIfPending, 60));
  new MutationObserver(() => setTimeout(catchUpIfPending, 60))
    .observe(document.getElementById('modal-root'), { childList: true });

  const es = new EventSource('/api/events');
  es.onmessage = (m) => {
    let detail;
    try { detail = JSON.parse(m.data); } catch { return; }
    if (detail.type !== 'repo-changed') return;
    const { name, params } = parseHash();
    if (name === 'edit') {
      const open = params.get('path');
      if (open && (detail.paths || []).includes(open)) {
        toast('This file just changed on disk — reopen before saving, or your save will be rejected.', 'err');
      }
      markPending();
      return;
    }
    if (name === 'docs') {
      // Don't reload the reader's page for unrelated repo changes — only when
      // the built site itself was rebuilt.
      refreshChrome();
      if ((detail.paths || []).some((p) => p.startsWith('Documentation/'))) doRefresh();
      return;
    }
    if (canAutoRefresh()) doRefresh(); else markPending();
  };
}

// ---- boot ------------------------------------------------------------------

buildNav();
mountDocsNav();
wireSearch();
wireLive();
window.addEventListener('hashchange', () => render(false));
window.addEventListener('console:saved', refreshChrome);
await loadState();
refreshChrome();
render(false);
