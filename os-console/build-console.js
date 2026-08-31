#!/usr/bin/env node
// Build the console's LIGHT MODE: one self-contained, read-only HTML snapshot
// of everything the full console shows, openable with zero setup — from a
// static host, a file share, or straight out of the clone. Node 18+ standard
// library, no packages.
//
//   node os-console/build-console.js        →  os-console/console.html
//
// The snapshot embeds the UNCHANGED web/ frontend (modules inlined via an
// import map, absolute-path imports rewritten to bare "console/…" specifiers)
// plus a boot shim that answers every read API route from baked data, stores
// per-user prefs in localStorage, refuses writes with a friendly note, and —
// the upgrade path — probes http://127.0.0.1:4820/api/ping every few seconds
// and hands off to the full console (keeping the current view) the moment one
// is running on the machine. CI rebuilds this file on every push to main
// (.github/workflows/build-console.yml); Azure instances run this script from
// their pipeline or by hand instead.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as gitlib from './lib/gitlib.js';
import * as policy from './lib/policy.js';
import * as repo from './lib/repo.js';
import * as activity from './lib/adapters/activity.js';
import * as docs from './lib/adapters/docs.js';
import * as governance from './lib/adapters/governance.js';
import * as home from './lib/adapters/home.js';
import * as initiatives from './lib/adapters/initiatives.js';
import * as learnings from './lib/adapters/learnings.js';
import * as library from './lib/adapters/library.js';
import * as proposed from './lib/adapters/proposed.js';
import * as prs from './lib/adapters/prs.js';
import * as skills from './lib/adapters/skills.js';
import * as steering from './lib/adapters/steering.js';
import * as templates from './lib/adapters/templates.js';

const BASE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(BASE, 'console.html');
const MAX_TEXT = 300 * 1024; // per-file content cap in the snapshot
const MAX_IMAGE = 300 * 1024; // images above this stay a placeholder

function isoToMs(iso) {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

const MODULES = ['api.js', 'ui.js', 'app.js',
  'views/home.js', 'views/initiatives.js', 'views/library.js', 'views/file.js',
  'views/editor.js', 'views/templates.js', 'views/governance.js', 'views/activity.js',
  'views/learnings.js', 'views/docs.js', 'views/setup.js', 'views/proposed.js',
  'views/features.js', 'views/autosync.js', 'views/skills.js', 'views/competition.js'];

/** Every dir and file rel path the console can browse (same skip rules). */
function walkRepo() {
  const dirs = [''];
  const files = [];
  const stack = [''];
  while (stack.length) {
    const d = stack.pop();
    for (const e of repo.listDir(d || '.')) {
      if (e.type === 'dir') {
        dirs.push(e.rel);
        stack.push(e.rel);
      } else {
        files.push(e.rel);
      }
    }
  }
  files.sort();
  return { dirs, files };
}

function collect() {
  const pol = policy.load();
  const { dirs, files } = walkRepo();
  const linked = initiatives.reverseIndex();

  const fileMeta = {};
  const fileText = {};
  const rawImages = {};
  for (const rel of files) {
    const st = repo.statOrNull(rel);
    if (!st) continue;
    const isText = repo.isTextPath(rel) && st.size < 1.5 * 1024 * 1024;
    const tier = policy.tierFor(rel, pol);
    const lastChange = gitlib.lastChangeIso(rel);
    fileMeta[rel] = {
      path: rel,
      isText: Boolean(isText && st.size <= MAX_TEXT),
      isImage: Boolean(repo.mimeFor(rel)),
      size: st.size,
      // Committed files take their commit date, so the same commit always
      // builds the same snapshot (CI checkouts reset filesystem mtimes).
      mtimeMs: isoToMs(lastChange) || repo.mtimeMs(st),
      tier: tier.tier,
      tierRule: tier.pattern || null,
      tierNote: tier.note || tier.heading || null,
      lastChange,
      linkedInitiatives: linked[rel] || [],
    };
    if (fileMeta[rel].isText) fileText[rel] = repo.readText(rel);
    const mime = repo.mimeFor(rel);
    if (mime && st.size <= MAX_IMAGE) {
      const bytes = fs.readFileSync(repo.resolveSafe(rel).abs);
      rawImages[rel] = `data:${mime};base64,${bytes.toString('base64')}`;
    }
  }

  const tiers = {};
  for (const rel of files) tiers[rel] = fileMeta[rel].tier;
  for (const rel of dirs) {
    if (rel) tiers[rel] = library.tierOf(rel, true, pol);
  }

  const libPayloads = {};
  for (const rel of dirs) {
    try {
      libPayloads[rel] = library.dirInfo(rel);
    } catch { /* raced with a delete — skip the folder */ }
  }

  // Normalize listing timestamps to git-derived times: fresh CI checkouts and
  // the artifact write itself must not leak build-time filesystem noise into
  // the snapshot. Dirs take the newest committed file beneath them.
  const subtreeMax = {};
  for (const [rel, meta] of Object.entries(fileMeta)) {
    const t = meta.mtimeMs || 0;
    const parts = rel.split('/').slice(0, -1);
    for (let i = 0; i <= parts.length; i++) {
      const d = parts.slice(0, i).join('/');
      if (t > (subtreeMax[d] || 0)) subtreeMax[d] = t;
    }
  }
  for (const payload of Object.values(libPayloads)) {
    for (const e of payload.entries) {
      if (e.type === 'dir') e.mtimeMs = subtreeMax[e.rel] || 0;
      else if (Object.prototype.hasOwnProperty.call(fileMeta, e.rel)) e.mtimeMs = fileMeta[e.rel].mtimeMs;
    }
  }

  const head = gitlib.git(['rev-parse', '--short', 'HEAD']);
  const built = gitlib.git(['log', '-1', '--pretty=%cI']); // source commit date — deterministic per commit
  const st = gitlib.statusInfo();
  const branch = process.env.GITHUB_REF_NAME || st.branch;

  const d = docs.build();
  const docsHtml = d.exists ? repo.readText(docs.SITE) : null;

  const overview = home.build();
  const activityPayload = activity.build(400);
  // Detached CI checkouts report "HEAD" as the branch — show the ref name.
  if (process.env.GITHUB_REF_NAME) {
    overview.git.branch = branch;
    activityPayload.status.branch = branch;
  }
  // The artifact this script writes must not count as repo dirt in its own snapshot.
  const artifact = 'os-console/console.html';
  activityPayload.status.uncommitted = activityPayload.status.uncommitted.filter((e) => e.path !== artifact);
  overview.git.dirty = activityPayload.status.uncommitted.length;

  return {
    meta: {
      sha: head.ok ? head.out.trim() : '?',
      // CI checkouts are detached HEADs — the ref name env is the truth there.
      branch: process.env.GITHUB_REF_NAME || st.branch,
      builtAt: built.ok ? built.out.trim() : '',
    },
    routes: {
      '/api/overview': overview,
      '/api/initiatives': { items: initiatives.listPages() },
      '/api/features': steering.featureIndex(),
      '/api/templates': templates.build(),
      '/api/governance': governance.pageData(),
      '/api/learnings': learnings.build(),
      '/api/docs': d,
      '/api/proposed': proposed.build(false),
      '/api/leaders': prs.leaders(false),
      '/api/activity': activityPayload,
      '/api/skills': skills.build(),
    },
    library: libPayloads,
    fileMeta,
    fileText,
    rawImages,
    tiers,
    areaMap: activity.AREA_MAP.map(([p, l]) => [p, l]),
    docsHtml,
  };
}

// The boot shim — a classic script that runs before the module graph loads.
// Kept dependency-free and testable: __liteHandle(method, url) is pure.
// String.raw so the shim's own backslash escapes survive verbatim.
const BOOT_JS = String.raw`
(function () {
  'use strict';
  var FULL_PORT = 4820;
  try {
    var qp = new URL(location.href).searchParams.get('port');
    if (qp && /^\d+$/.test(qp)) FULL_PORT = Number(qp);
  } catch (e) { /* file:// quirks — keep default */ }

  var LITE = JSON.parse(document.getElementById('lite-data').textContent);
  window.__LITE__ = LITE;
  var STATE_KEY = 'os-console-snapshot-state';

  function areaFor(p) {
    for (var i = 0; i < LITE.areaMap.length; i++) {
      var prefix = LITE.areaMap[i][0];
      if (p === prefix || p.indexOf(prefix + '/') === 0) return LITE.areaMap[i][1];
    }
    return 'Root';
  }

  function loadPrefs() {
    try {
      var s = JSON.parse(localStorage.getItem(STATE_KEY));
      if (s && typeof s === 'object') {
        return { pins: s.pins || [], collections: s.collections || [], recents: s.recents || [] };
      }
    } catch (e) { /* fresh */ }
    return { pins: [], collections: [], recents: [] };
  }

  function savePrefs(body) {
    var clean = {
      pins: Array.isArray(body.pins) ? body.pins.slice(0, 200) : [],
      collections: Array.isArray(body.collections) ? body.collections.slice(0, 50) : [],
      recents: Array.isArray(body.recents) ? body.recents.slice(0, 30) : [],
    };
    try { localStorage.setItem(STATE_KEY, JSON.stringify(clean)); } catch (e) { /* private mode */ }
    return clean;
  }

  function searchWiki(q) {
    var hits = [];
    if (!q || q.trim().length < 2) return hits;
    var needle = q.toLowerCase();
    var exts = ['.md', '.yaml', '.yml', '.txt', '.sql'];
    var paths = Object.keys(LITE.fileText).sort();
    for (var i = 0; i < paths.length && hits.length < 120; i++) {
      var p = paths[i];
      var ok = false;
      for (var e = 0; e < exts.length; e++) if (p.slice(-exts[e].length) === exts[e]) ok = true;
      if (!ok) continue;
      var lines = LITE.fileText[p].split('\n');
      for (var n = 0; n < lines.length && hits.length < 120; n++) {
        if (lines[n].toLowerCase().indexOf(needle) >= 0) {
          hits.push({ path: p, line: n + 1, text: lines[n].trim().slice(0, 200), area: areaFor(p) });
        }
      }
    }
    return hits;
  }

  var READONLY = 'read-only snapshot — start the full console (node os-console/server.js) to make changes';

  function handle(method, url) {
    var u = new URL(url, 'http://lite.local');
    var path = u.pathname;
    var q = u.searchParams;
    if (method !== 'GET' && path !== '/api/state') return [403, { error: READONLY }];

    if (path === '/api/state') {
      if (method === 'GET') return [200, loadPrefs()];
      return [200, savePrefs(handle.__body || {})];
    }
    if (path === '/api/activity') {
      var full = LITE.routes['/api/activity'];
      var n = Math.min(Number(q.get('limit')) || 120, 400);
      return [200, { commits: full.commits.slice(0, n), status: full.status, ledger: full.ledger }];
    }
    if (path === '/api/library') {
      var rel = (q.get('path') || '').replace(/\/+$/, '');
      if (rel === '.') rel = '';
      if (Object.prototype.hasOwnProperty.call(LITE.library, rel)) return [200, LITE.library[rel]];
      return [404, { error: rel + ' not found in this snapshot' }];
    }
    if (path === '/api/file') {
      var fp = q.get('path') || '';
      var meta = LITE.fileMeta[fp];
      if (!meta) return [404, { error: fp + ' not found' }];
      var out = {};
      for (var k in meta) out[k] = meta[k];
      out.content = meta.isText ? (LITE.fileText[fp] != null ? LITE.fileText[fp] : null) : null;
      return [200, out];
    }
    if (path === '/api/search') return [200, { hits: searchWiki(q.get('q') || '') }];
    if (path === '/api/tiers') {
      var outT = {};
      (q.get('paths') || '').split('|').forEach(function (p) {
        if (!p) return;
        var clean = p.replace(/\/+$/, '');
        outT[p] = LITE.tiers[clean] || 'auto';
      });
      return [200, outT];
    }
    if (Object.prototype.hasOwnProperty.call(LITE.routes, path)) return [200, LITE.routes[path]];
    return [404, { error: 'no route ' + method + ' ' + path }];
  }
  window.__liteHandle = handle;

  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (url, opts) {
    var u = String(url);
    if (u.indexOf('/api/') !== 0) return realFetch(url, opts);
    opts = opts || {};
    var body = {};
    try { body = opts.body ? JSON.parse(opts.body) : {}; } catch (e) { /* empty */ }
    handle.__body = body;
    var res = handle((opts.method || 'GET').toUpperCase(), u);
    return Promise.resolve(new Response(JSON.stringify(res[1]), {
      status: res[0], headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }));
  };

  // No live events in a snapshot — a silent stand-in keeps the app's wiring inert.
  window.EventSource = function () { return { close: function () {}, addEventListener: function () {} }; };

  // ---- docs + images: rewrite URL-carrying attributes the fetch patch can't see
  var docsBlobUrl = null;
  function docsUrl() {
    if (!LITE.docsHtml) return null;
    if (!docsBlobUrl) {
      var style = '<style id="console-embed">header.top{display:none}'
        + '.side{top:0; height:100vh}'
        + '.rail{top:24px; max-height:calc(100vh - 24px)}</style>';
      var html = LITE.docsHtml.indexOf('</title>') >= 0
        ? LITE.docsHtml.replace('</title>', '</title>' + style)
        : LITE.docsHtml + style;
      docsBlobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    }
    return docsBlobUrl;
  }
  var IMG_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="80"%3E%3Crect width="320" height="80" fill="%23eee"/%3E%3Ctext x="12" y="45" font-family="sans-serif" font-size="13" fill="%23888"%3Eimage not included in this snapshot%3C/text%3E%3C/svg%3E';

  function rewriteEl(node) {
    if (!node.getAttribute) return;
    var tag = node.tagName;
    if ((tag === 'IMG' || tag === 'IFRAME' || tag === 'A')) {
      var attr = tag === 'A' ? 'href' : 'src';
      var v = node.getAttribute(attr) || '';
      if (v.indexOf('/api/raw?path=') === 0) {
        var p = decodeURIComponent(v.slice('/api/raw?path='.length));
        node.setAttribute(attr, LITE.rawImages[p] || IMG_FALLBACK);
      } else if (v.indexOf('/docs-site') === 0) {
        var hash = v.indexOf('#') >= 0 ? v.slice(v.indexOf('#')) : '';
        var d = docsUrl();
        if (d) node.setAttribute(attr, d + hash);
      }
    }
    if (node.querySelectorAll) {
      node.querySelectorAll('img[src^="/api/raw"],iframe[src^="/docs-site"],a[href^="/docs-site"]').forEach(rewriteEl);
    }
  }
  new MutationObserver(function (muts) {
    muts.forEach(function (m) { m.addedNodes.forEach(rewriteEl); });
  }).observe(document.documentElement, { childList: true, subtree: true });

  // ---- header hint + auto-upgrade to the full console. The hint IS the
  // upgrade path: it names the one command; the page does the rest itself.
  var CMD = 'node os-console/server.js';
  function mountBanner() {
    var bar = document.createElement('div');
    bar.id = 'lite-banner';
    bar.style.cssText = 'background:#f6f8fa;color:#48505a;border-bottom:1px solid #e1e4e8;'
      + 'font:12px/1.8 system-ui,sans-serif;padding:5px 14px;display:flex;gap:10px;'
      + 'align-items:center;flex-wrap:wrap;';
    var msg = document.createElement('span');
    msg.id = 'lite-probe';
    msg.innerHTML = 'Read-only view. To edit, run '
      + '<code id="lite-cmd" title="Click to copy" '
      + 'style="background:#fff;border:1px solid #d5dae0;border-radius:4px;padding:1px 7px;'
      + 'font:11px/1.6 ui-monospace,Consolas,monospace;cursor:pointer">' + CMD + '</code>'
      + ' in the repo folder — this page upgrades to the full console by itself.';
    var meta = document.createElement('span');
    meta.style.cssText = 'margin-left:auto;opacity:.55;white-space:nowrap';
    meta.textContent = 'snapshot ' + (LITE.meta.branch || '') + '@' + LITE.meta.sha
      + (LITE.meta.builtAt ? ' · ' + LITE.meta.builtAt.slice(0, 10) : '');
    bar.append(msg, meta);
    document.body.insertBefore(bar, document.body.firstChild);
    var cmd = document.getElementById('lite-cmd');
    if (cmd) cmd.addEventListener('click', function () {
      try {
        navigator.clipboard.writeText(CMD).then(function () {
          cmd.textContent = 'copied ✓';
          setTimeout(function () { cmd.textContent = CMD; }, 1400);
        });
      } catch (e) { /* clipboard unavailable — the text is still there to select */ }
    });
  }

  function probeFull() {
    var url = 'http://127.0.0.1:' + FULL_PORT + '/api/ping';
    var opts = { mode: 'cors', cache: 'no-store' };
    if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) opts.signal = AbortSignal.timeout(1500);
    realFetch(url, opts).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.console === true) {
        var probe = document.getElementById('lite-probe');
        if (probe) probe.textContent = 'Full console found — switching…';
        location.replace('http://127.0.0.1:' + FULL_PORT + '/' + (location.hash || ''));
      }
    }).catch(function () { /* not running — stay in light mode */ });
  }

  function boot() {
    mountBanner();
    rewriteEl(document.body);
    probeFull();
    setInterval(function () {
      if (document.visibilityState === 'visible') probeFull();
    }, 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
`;

/** Rewrite absolute-path import specifiers to bare 'console/…' names. */
function transformModule(src) {
  return src.split('\n').map((line) => {
    const stripped = line.replace(/^\s+/, '');
    if (stripped.startsWith('import ') && line.includes(" from '/")) {
      return line.split(" from '/").join(" from 'console/");
    }
    return line;
  }).join('\n');
}

function jsEscape(s) {
  return s.split('</script').join('<\\/script');
}

function buildHtml(data) {
  const web = path.join(BASE, 'web');
  let html = fs.readFileSync(path.join(web, 'index.html'), 'utf8');
  const styles = fs.readFileSync(path.join(web, 'styles.css'), 'utf8');
  const marked = fs.readFileSync(path.join(BASE, 'vendor', 'marked.min.js'), 'utf8');

  const imports = {};
  for (const rel of MODULES) {
    const code = transformModule(fs.readFileSync(path.join(web, rel), 'utf8'));
    imports[`console/${rel}`] = `data:text/javascript;base64,${Buffer.from(code, 'utf8').toString('base64')}`;
  }

  const payload = JSON.stringify(data).split('</').join('<\\/');

  const blocks = [
    `<script type="application/json" id="lite-data">${payload}</script>`,
    `<script>${jsEscape(BOOT_JS)}</script>`,
    `<script>${jsEscape(marked)}</script>`,
    `<script type="importmap">${JSON.stringify({ imports })}</script>`,
    '<script type="module">import "console/app.js";</script>',
  ].join('\n');

  html = html.split('<link rel="stylesheet" href="/styles.css">').join(`<style>${styles}</style>`);
  html = html.split('<title>Work OS Console</title>').join('<title>Work OS Console — snapshot</title>');
  html = html.split('<script src="/vendor/marked.min.js"></script>\n'
    + '<script type="module" src="/app.js"></script>').join(blocks);
  return html;
}

function main() {
  process.chdir(repo.ROOT);
  const data = collect();
  const html = buildHtml(data);
  fs.writeFileSync(OUT, html, 'utf8');
  const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(`console.html: ${kb} KB · ${Object.keys(data.fileMeta).length} files baked `
    + `(${Object.keys(data.fileText).length} with text, ${Object.keys(data.rawImages).length} images) `
    + `· ${Object.keys(data.library).length} dirs · source ${data.meta.branch}@${data.meta.sha}`);
}

main();
