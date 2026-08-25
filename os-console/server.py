#!/usr/bin/env python3
# Work OS Console — local web UI over this repo. Zero install on any machine
# with Python 3.8+ (standard library only, no packages):
#
#   python3 os-console/server.py        →  http://127.0.0.1:4820
#   (Windows: py -3 os-console\server.py)
#
# Reads the same registries the OS's hooks and skills read (write-policy.yaml,
# feature-index.yaml, toolchain.yaml, initiative pages, folder CLAUDE.md files).
# Writes go through ONE endpoint that resolves the write-policy tier for every
# path; each save is committed immediately (`console:` prefix) so concurrent
# Claude sessions never sweep console edits into their own commits. Gated files
# are badged in the UI — saving one IS the human approval. Binds localhost only.
# Live refresh uses a polling watcher, so change events arrive within ~2s.
import errno
import json
import os
import posixpath
import queue
import stat as statmod
import sys
import threading
import time
import traceback
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pylib import gitlib, policy, repo  # noqa: E402
from pylib.adapters import (  # noqa: E402
    activity, docs, governance, home, initiatives, learnings, library,
    proposed, prs, steering, templates,
)

PORT = int(os.environ.get('OS_CONSOLE_PORT') or 4820)
HOST = '127.0.0.1'
BASE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(BASE, 'web')
VENDOR = os.path.join(BASE, 'vendor')
STATE_FILE = os.path.join(BASE, 'state.json')

# ---------------------------------------------------------------- state.json


def load_state():
    try:
        with open(STATE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {'pins': [], 'collections': [], 'recents': []}


def save_state(state):
    clean = {
        'pins': state.get('pins')[:200] if isinstance(state.get('pins'), list) else [],
        'collections': state.get('collections')[:50] if isinstance(state.get('collections'), list) else [],
        'recents': state.get('recents')[:30] if isinstance(state.get('recents'), list) else [],
    }
    with open(STATE_FILE, 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(clean, indent=2) + '\n')
    return clean


# ---------------------------------------------------------------- API routes


def _file_info(q, body):
    rel = repo.resolve_safe(q.get('path'))['rel']
    st = repo.stat_or_null(rel)
    if not st or not statmod.S_ISREG(st.st_mode):
        raise repo.http_err(404, '%s not found' % rel)
    is_text = repo.is_text_path(rel) and st.st_size < 1.5 * 1024 * 1024
    tier = policy.tier_for(rel)
    return {
        'path': rel,
        'isText': is_text,
        'isImage': bool(repo.mime_for(rel)),
        'size': st.st_size,
        'mtimeMs': repo.mtime_ms(st),
        'tier': tier['tier'],
        'tierRule': tier.get('pattern') or None,
        'tierNote': tier.get('note') or tier.get('heading') or None,
        'lastChange': gitlib.last_change_iso(rel),
        'linkedInitiatives': initiatives.reverse_index().get(rel, []),
        'content': repo.read_text(rel) if is_text else None,
    }


def _file_save(q, body):
    rel = repo.resolve_safe(body.get('path'))['rel']
    existed = repo.exists(rel)
    if existed and body.get('baseMtimeMs'):
        st = repo.stat_or_null(rel)
        if st and abs(repo.mtime_ms(st) - body['baseMtimeMs']) > 1:
            raise repo.http_err(409, 'file changed on disk since you opened it (another session?) — reopen to get the latest')
    if not isinstance(body.get('content'), str):
        raise repo.http_err(400, 'content required')
    tier = policy.tier_for(rel)
    repo.write_text(rel, body['content'])
    commit = gitlib.commit_paths([rel], 'console: %s %s' % ('edit' if existed else 'new', rel))
    push = gitlib.maybe_push(policy.load()['settings'])
    st = repo.stat_or_null(rel)
    return {'ok': True, 'path': rel, 'tier': tier['tier'], 'commit': commit, 'push': push,
            'mtimeMs': repo.mtime_ms(st)}


def _search(q, body):
    hits = gitlib.grep(q.get('q') or '')
    return {'hits': [dict(h, area=activity.area_for(h['path'])) for h in hits]}


ROUTES = {
    'GET /api/overview': lambda q, body: home.build(),
    'GET /api/initiatives': lambda q, body: {'items': initiatives.list_pages()},
    'POST /api/initiatives/status': lambda q, body: initiatives.set_status(
        body.get('slug'), body.get('status'), body.get('note') or '', policy.load()['settings']),
    'POST /api/initiatives/attach': lambda q, body: initiatives.attach(
        body.get('slug'), body.get('path'), body.get('label') or '', policy.load()['settings']),
    'POST /api/initiatives/create': lambda q, body: initiatives.create(
        body.get('slug'), body.get('title'), policy.load()['settings']),
    'GET /api/library': lambda q, body: library.dir_info(q.get('path') or ''),
    'GET /api/file': _file_info,
    'PUT /api/file': _file_save,
    'GET /api/steering': lambda q, body: steering.build(),
    'GET /api/templates': lambda q, body: templates.build(),
    'POST /api/templates/use': lambda q, body: templates.use(
        body.get('template'), body.get('dest'), policy.load()['settings']),
    'GET /api/governance': lambda q, body: governance.page_data(),
    'GET /api/activity': lambda q, body: activity.build(q.get('limit')),
    'GET /api/learnings': lambda q, body: learnings.build(),
    'POST /api/learnings': lambda q, body: learnings.add(body.get('text'), policy.load()['settings']),
    'GET /api/search': _search,
    'GET /api/proposed': lambda q, body: proposed.build(q.get('refresh') == '1'),
    'GET /api/leaders': lambda q, body: prs.leaders(q.get('refresh') == '1'),
    'GET /api/tiers': lambda q, body: library.tiers([p for p in (q.get('paths') or '').split('|') if p]),
    'GET /api/state': lambda q, body: load_state(),
    'PUT /api/state': lambda q, body: save_state(body),
    'GET /api/docs': lambda q, body: docs.build(),
}

# ---------------------------------------------------------------- live events
# Polling watcher + Server-Sent Events: connected consoles re-render when the
# repo changes — a Claude session committing, a hand edit, another console.

_sse_lock = threading.Lock()
_sse_clients = set()

POLL_SECONDS = 1.5
_WATCH_SKIP_DIRS = {'.git', 'node_modules', '_extracted-personal'}


def _register_client():
    q = queue.Queue()
    with _sse_lock:
        _sse_clients.add(q)
    return q


def _unregister_client(q):
    with _sse_lock:
        _sse_clients.discard(q)


def broadcast(payload):
    msg = 'data: %s\n\n' % json.dumps(payload, separators=(',', ':'), ensure_ascii=False)
    with _sse_lock:
        clients = list(_sse_clients)
    for q in clients:
        q.put(msg)


def _scan_repo():
    """Snapshot of file mtimes under the repo (junk pruned), plus a .git
    ref/HEAD signature (= commits, branch switches — the only .git noise worth
    a refresh)."""
    files = {}
    root = repo.ROOT
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in _WATCH_SKIP_DIRS]
        rel_dir = os.path.relpath(dirpath, root).replace(os.sep, '/')
        if rel_dir == '.':
            rel_dir = ''
        for name in filenames:
            if name == '.DS_Store':
                continue
            rel = '%s/%s' % (rel_dir, name) if rel_dir else name
            if rel == 'os-console/state.json':  # prefs writes must not loop refreshes
                continue
            try:
                files[rel] = os.stat(os.path.join(dirpath, name)).st_mtime_ns
            except OSError:
                pass
    git_sig = []
    head = os.path.join(root, '.git', 'HEAD')
    try:
        git_sig.append(os.stat(head).st_mtime_ns)
    except OSError:
        pass
    refs = os.path.join(root, '.git', 'refs')
    for dirpath, _dirnames, filenames in os.walk(refs):
        for name in filenames:
            try:
                git_sig.append(os.stat(os.path.join(dirpath, name)).st_mtime_ns)
            except OSError:
                pass
    return files, tuple(sorted(git_sig))


def _watch_loop():
    prev_files, prev_git = _scan_repo()
    while True:
        time.sleep(POLL_SECONDS)
        try:
            files, git_sig = _scan_repo()
        except Exception:
            continue
        changed = [rel for rel, m in files.items() if prev_files.get(rel) != m]
        changed += [rel for rel in prev_files if rel not in files]
        if git_sig != prev_git:
            changed.append('(git)')
        prev_files, prev_git = files, git_sig
        if changed:
            broadcast({'type': 'repo-changed', 'paths': changed[:20]})


def watch_repo():
    t = threading.Thread(target=_watch_loop, daemon=True, name='repo-watch')
    t.start()
    print('  watching the repo (polling every %gs) — open consoles refresh live' % POLL_SECONDS)


# ---------------------------------------------------------------- static files

MIME = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
}


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    server_version = 'os-console'

    def log_message(self, fmt, *args):  # quiet — only errors are worth the console
        pass

    def send_json(self, status, data):
        # separators/ensure_ascii match JSON.stringify byte-for-byte
        body = json.dumps(data, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_bytes(self, status, content_type, body):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        try:
            size = int(self.headers.get('Content-Length') or 0)
        except ValueError:
            size = 0
        if size > 5 * 1024 * 1024:
            raise repo.http_err(413, 'body too large')
        if size <= 0:
            return {}
        raw = self.rfile.read(size)
        try:
            return json.loads(raw.decode('utf-8'))
        except Exception:
            raise repo.http_err(400, 'invalid JSON body')

    def serve_static(self, base, rel_path):
        norm = posixpath.normpath('/' + rel_path)
        abs_path = os.path.abspath(os.path.join(base, norm.lstrip('/')))
        if abs_path != base and not abs_path.startswith(base + os.sep):
            return self.send_json(404, {'error': 'not found'})
        if not os.path.isfile(abs_path):
            return self.send_json(404, {'error': 'not found'})
        with open(abs_path, 'rb') as f:
            body = f.read()
        ext = os.path.splitext(abs_path)[1].lower()
        self.send_bytes(200, MIME.get(ext, 'text/plain; charset=utf-8'), body)

    def serve_sse(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Connection', 'keep-alive')
        self.end_headers()
        q = _register_client()
        try:
            self.wfile.write(b': connected\n\n')
            self.wfile.flush()
            while True:
                try:
                    msg = q.get(timeout=30)
                except queue.Empty:
                    msg = ': hb\n\n'
                self.wfile.write(msg.encode('utf-8'))
                self.wfile.flush()
        except OSError:
            pass  # client went away
        finally:
            _unregister_client(q)
            self.close_connection = True

    def serve_docs_site(self, query):
        st = repo.stat_or_null(docs.SITE)
        if not st:
            return self.send_json(404, {'error': 'Documentation/work-os-docs.html is not present in this instance'})
        if query.get('embed') == '1':
            # Embedded in the console: the console sidebar already does section
            # navigation, so hide the site's own header and re-anchor the two
            # sticky panels that assumed its 60px height. Injected at serve time —
            # the file on disk stays untouched; if the site's selectors ever
            # change, this degrades to simply showing the header again.
            style = ('<style id="console-embed">header.top{display:none}'
                     '.side{top:0; height:100vh}'
                     '.rail{top:24px; max-height:calc(100vh - 24px)}</style>')
            html = repo.read_text(docs.SITE)
            # The built site omits </head> (valid HTML5) — anchor after <title>,
            # and if even that changes, appending at the end still applies.
            out = html.replace('</title>', '</title>%s' % style, 1) if '</title>' in html else html + style
            return self.send_bytes(200, 'text/html; charset=utf-8', out.encode('utf-8'))
        with open(repo.resolve_safe(docs.SITE)['abs'], 'rb') as f:
            body = f.read()
        self.send_bytes(200, 'text/html; charset=utf-8', body)

    def handle_request(self, method):
        parsed = urllib.parse.urlsplit(self.path)
        pathname = parsed.path
        query_dict = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)

        class Query:
            @staticmethod
            def get(k):
                v = query_dict.get(k)
                return v[0] if v else None

        key = '%s %s' % (method, pathname)
        try:
            if key in ROUTES:
                body = self.read_body() if method in ('PUT', 'POST') else None
                return self.send_json(200, ROUTES[key](Query, body))
            if key == 'GET /docs-site':
                return self.serve_docs_site(Query)
            if key == 'GET /api/events':
                return self.serve_sse()
            if key == 'GET /api/raw':
                r = repo.resolve_safe(Query.get('path'))
                mime = repo.mime_for(r['rel'])
                st = repo.stat_or_null(r['rel'])
                if not st or not statmod.S_ISREG(st.st_mode):
                    return self.send_json(404, {'error': '%s not found' % r['rel']})
                with open(r['abs'], 'rb') as f:
                    body = f.read()
                return self.send_bytes(200, mime or 'application/octet-stream', body)
            if pathname.startswith('/api/'):
                return self.send_json(404, {'error': 'no route %s' % key})
            if pathname.startswith('/vendor/'):
                return self.serve_static(VENDOR, pathname[len('/vendor/'):])
            if pathname in ('/', '/index.html'):
                return self.serve_static(WEB, 'index.html')
            return self.serve_static(WEB, pathname[1:])
        except repo.HttpError as e:
            if e.status >= 500:
                print('[console] %s →' % key, e, file=sys.stderr)
            try:
                return self.send_json(e.status, {'error': str(e) or 'internal error'})
            except OSError:
                pass
        except (BrokenPipeError, ConnectionResetError):
            pass  # client hung up mid-response
        except Exception as e:
            print('[console] %s →' % key, file=sys.stderr)
            traceback.print_exc()
            try:
                return self.send_json(500, {'error': str(e) or 'internal error'})
            except OSError:
                pass

    def do_GET(self):
        self.handle_request('GET')

    def do_POST(self):
        self.handle_request('POST')

    def do_PUT(self):
        self.handle_request('PUT')


# ---------------------------------------------------------------- server


def main():
    try:  # Windows consoles may not be UTF-8 — degrade instead of crashing
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
    ThreadingHTTPServer.daemon_threads = True
    try:
        server = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError as e:
        if e.errno in (errno.EADDRINUSE, 10048, 10013):
            print('Port %d is already in use — is the console already running? (OS_CONSOLE_PORT=<port> to change)' % PORT,
                  file=sys.stderr)
            sys.exit(1)
        raise
    print('')
    print('  Work OS Console')
    print('  →  http://%s:%d' % (HOST, PORT))
    print('  repo: %s' % repo.ROOT)
    print('  write tiers come from governance/write-policy.yaml — gated files are badged; a save is your approval')
    watch_repo()
    print('')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
