#!/usr/bin/env python3
# Build the console's LIGHT MODE: one self-contained, read-only HTML snapshot
# of everything the full console shows, openable with zero setup — from a
# static host, a file share, or straight out of the clone. Python 3.8+ stdlib.
#
#   python3 os-console/build-lite.py        →  os-console/console-lite.html
#
# The snapshot embeds the UNCHANGED web/ frontend (modules inlined via an
# import map, absolute-path imports rewritten to bare "console/…" specifiers)
# plus a boot shim that answers every read API route from baked data, stores
# per-user prefs in localStorage, refuses writes with a friendly note, and —
# the upgrade path — probes http://127.0.0.1:4820/api/ping every few seconds
# and hands off to the full console (keeping the current view) the moment one
# is running on the machine. CI rebuilds this file on every push to main
# (.github/workflows/console-lite.yml); Azure instances run this script from
# their pipeline or by hand instead.
import base64
import json
import os
import subprocess
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)

from pylib import gitlib, mdparse, policy, repo  # noqa: E402
from pylib.adapters import (  # noqa: E402
    activity, docs, governance, home, initiatives, learnings, library,
    proposed, prs, steering, templates,
)

OUT = os.path.join(BASE, 'console-lite.html')
MAX_TEXT = 300 * 1024   # per-file content cap in the snapshot
MAX_IMAGE = 300 * 1024  # images above this stay a placeholder


def _iso_to_ms(iso):
    if not iso:
        return None
    from datetime import datetime
    try:
        return datetime.fromisoformat(iso).timestamp() * 1000
    except ValueError:
        return None

MODULES = ['api.js', 'ui.js', 'app.js',
           'views/home.js', 'views/initiatives.js', 'views/library.js', 'views/file.js',
           'views/editor.js', 'views/templates.js', 'views/governance.js', 'views/activity.js',
           'views/learnings.js', 'views/docs.js', 'views/setup.js', 'views/proposed.js']


def walk_repo():
    """Every dir and file rel path the console can browse (same skip rules)."""
    dirs, files = [''], []
    stack = ['']
    while stack:
        d = stack.pop()
        for e in repo.list_dir(d or '.'):
            if e['type'] == 'dir':
                dirs.append(e['rel'])
                stack.append(e['rel'])
            else:
                files.append(e['rel'])
    return dirs, sorted(files)


def collect():
    pol = policy.load()
    dirs, files = walk_repo()
    linked = initiatives.reverse_index()

    file_meta, file_text, raw_images = {}, {}, {}
    for rel in files:
        st = repo.stat_or_null(rel)
        if not st:
            continue
        is_text = repo.is_text_path(rel) and st.st_size < 1.5 * 1024 * 1024
        tier = policy.tier_for(rel, pol)
        last_change = gitlib.last_change_iso(rel)
        file_meta[rel] = {
            'path': rel,
            'isText': bool(is_text and st.st_size <= MAX_TEXT),
            'isImage': bool(repo.mime_for(rel)),
            'size': st.st_size,
            # Committed files take their commit date, so the same commit always
            # builds the same snapshot (CI checkouts reset filesystem mtimes).
            'mtimeMs': _iso_to_ms(last_change) or repo.mtime_ms(st),
            'tier': tier['tier'],
            'tierRule': tier.get('pattern') or None,
            'tierNote': tier.get('note') or tier.get('heading') or None,
            'lastChange': last_change,
            'linkedInitiatives': linked.get(rel, []),
        }
        if file_meta[rel]['isText']:
            file_text[rel] = repo.read_text(rel)
        mime = repo.mime_for(rel)
        if mime and st.st_size <= MAX_IMAGE:
            with open(repo.resolve_safe(rel)['abs'], 'rb') as f:
                raw_images[rel] = 'data:%s;base64,%s' % (mime, base64.b64encode(f.read()).decode('ascii'))

    tiers = {}
    for rel in files:
        tiers[rel] = file_meta[rel]['tier']
    for rel in dirs:
        if rel:
            tiers[rel] = library.tier_of(rel, True, pol)

    lib_payloads = {}
    for rel in dirs:
        try:
            lib_payloads[rel] = library.dir_info(rel)
        except Exception:
            pass

    head = gitlib.git(['rev-parse', '--short', 'HEAD'])
    built = gitlib.git(['log', '-1', '--pretty=%cI'])  # source commit date — deterministic per commit
    st = gitlib.status_info()
    branch = os.environ.get('GITHUB_REF_NAME') or st['branch']

    d = docs.build()
    docs_html = repo.read_text(docs.SITE) if d.get('exists') else None

    overview = home.build()
    activity_payload = activity.build(400)
    # Detached CI checkouts report "HEAD" as the branch — show the ref name.
    if os.environ.get('GITHUB_REF_NAME'):
        overview['git']['branch'] = branch
        activity_payload['status']['branch'] = branch

    return {
        'meta': {
            'sha': head['out'].strip() if head['ok'] else '?',
            # CI checkouts are detached HEADs — the ref name env is the truth there.
            'branch': os.environ.get('GITHUB_REF_NAME') or st['branch'],
            'builtAt': built['out'].strip() if built['ok'] else '',
        },
        'routes': {
            '/api/overview': overview,
            '/api/initiatives': {'items': initiatives.list_pages()},
            '/api/steering': steering.build(),
            '/api/templates': templates.build(),
            '/api/governance': governance.page_data(),
            '/api/learnings': learnings.build(),
            '/api/docs': d,
            '/api/proposed': proposed.build(False),
            '/api/leaders': prs.leaders(False),
            '/api/activity': activity_payload,
        },
        'library': lib_payloads,
        'fileMeta': file_meta,
        'fileText': file_text,
        'rawImages': raw_images,
        'tiers': tiers,
        'areaMap': [[p, l] for p, l in activity.AREA_MAP],
        'docsHtml': docs_html,
    }


# The boot shim — a classic script that runs before the module graph loads.
# Kept dependency-free and testable: __liteHandle(method, url) is pure.
BOOT_JS = r"""
(function () {
  'use strict';
  var FULL_PORT = 4820;
  try {
    var qp = new URL(location.href).searchParams.get('port');
    if (qp && /^\d+$/.test(qp)) FULL_PORT = Number(qp);
  } catch (e) { /* file:// quirks — keep default */ }

  var LITE = JSON.parse(document.getElementById('lite-data').textContent);
  window.__LITE__ = LITE;
  var STATE_KEY = 'os-console-lite-state';

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

  var READONLY = 'read-only snapshot — start the full console (python3 os-console/server.py) to make changes';

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

  // ---- snapshot banner + auto-upgrade to the full console
  function mountBanner() {
    var bar = document.createElement('div');
    bar.id = 'lite-banner';
    bar.style.cssText = 'position:sticky;top:0;z-index:1000;background:#1485C4;color:#fff;'
      + 'font:12px/1.6 system-ui,sans-serif;padding:5px 14px;display:flex;gap:14px;align-items:center;';
    bar.innerHTML = '<b>Read-only snapshot</b>'
      + '<span>' + (LITE.meta.branch || '') + '@' + LITE.meta.sha
      + (LITE.meta.builtAt ? ' · built ' + LITE.meta.builtAt.slice(0, 16).replace('T', ' ') : '') + '</span>'
      + '<span id="lite-probe" style="margin-left:auto;opacity:.85">switches to the full console automatically when one is running here</span>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function probeFull() {
    var url = 'http://127.0.0.1:' + FULL_PORT + '/api/ping';
    var opts = { mode: 'cors', cache: 'no-store' };
    if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) opts.signal = AbortSignal.timeout(1500);
    realFetch(url, opts).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.console === true) {
        var probe = document.getElementById('lite-probe');
        if (probe) probe.textContent = 'full console found — switching…';
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
"""


def transform_module(src):
    """Rewrite absolute-path import specifiers to bare 'console/…' names."""
    out = []
    for line in src.split('\n'):
        stripped = line.lstrip()
        if stripped.startswith('import ') and " from '/" in line:
            line = line.replace(" from '/", " from 'console/")
        out.append(line)
    return '\n'.join(out)


def js_escape(s):
    return s.replace('</script', '<\\/script')


def build_html(data):
    web = os.path.join(BASE, 'web')
    with open(os.path.join(web, 'index.html'), 'r', encoding='utf-8') as f:
        html = f.read()
    with open(os.path.join(web, 'styles.css'), 'r', encoding='utf-8') as f:
        styles = f.read()
    with open(os.path.join(BASE, 'vendor', 'marked.min.js'), 'r', encoding='utf-8') as f:
        marked = f.read()

    imports = {}
    for rel in MODULES:
        with open(os.path.join(web, rel), 'r', encoding='utf-8') as f:
            code = transform_module(f.read())
        imports['console/' + rel] = 'data:text/javascript;base64,' + base64.b64encode(code.encode('utf-8')).decode('ascii')

    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

    blocks = '\n'.join([
        '<script type="application/json" id="lite-data">%s</script>' % payload,
        '<script>%s</script>' % js_escape(BOOT_JS),
        '<script>%s</script>' % js_escape(marked),
        '<script type="importmap">%s</script>' % json.dumps({'imports': imports}),
        '<script type="module">import "console/app.js";</script>',
    ])

    html = html.replace('<link rel="stylesheet" href="/styles.css">',
                        '<style>%s</style>' % styles)
    html = html.replace('<title>Work OS Console</title>',
                        '<title>Work OS Console — snapshot</title>')
    html = html.replace('<script src="/vendor/marked.min.js"></script>\n'
                        '<script type="module" src="/app.js"></script>', blocks)
    return html


def main():
    os.chdir(repo.ROOT)
    data = collect()
    html = build_html(data)
    with open(OUT, 'w', encoding='utf-8', newline='') as f:
        f.write(html)
    print('console-lite.html: %.1f KB · %d files baked (%d with text, %d images) · %d dirs · source %s@%s' % (
        len(html.encode('utf-8')) / 1024.0,
        len(data['fileMeta']), len(data['fileText']), len(data['rawImages']),
        len(data['library']), data['meta']['branch'], data['meta']['sha']))


if __name__ == '__main__':
    main()
