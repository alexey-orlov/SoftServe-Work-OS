#!/usr/bin/env python3
# Maintainer tool: verify the console's two runtimes still agree.
# Needs BOTH runtimes on this machine (a SoftServe maintainer setup, not a
# customer one). Read-only — starts both servers on side ports against this
# repo, writes nothing.
#
#   python3 os-console/parity-check.py
#
# Phase 1 — every YAML file in the repo parses identically via pylib/miniyaml
# and the vendored js-yaml. Phase 2 — every read API route and static asset
# returns the same payload from server.js and server.py. Statuses must always
# match; for 5xx responses the error TEXT may differ (Node and Python word
# OS errors differently) — that is the one accepted difference.
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(BASE)
sys.path.insert(0, BASE)
from pylib import miniyaml  # noqa: E402

NODE_PORT = int(os.environ.get('PARITY_NODE_PORT') or 4881)
PY_PORT = int(os.environ.get('PARITY_PY_PORT') or 4882)

READ_URLS = [
    '/api/overview', '/api/initiatives', '/api/library',
    '/api/library?path=product-development', '/api/library?path=governance',
    '/api/file?path=CLAUDE.md', '/api/file?path=governance/write-policy.yaml',
    '/api/file?path=no-such-file.md',
    '/api/steering', '/api/templates', '/api/governance',
    '/api/activity?limit=8', '/api/learnings', '/api/search?q=churn',
    '/api/proposed', '/api/leaders',
    '/api/tiers?paths=CLAUDE.md%7Cgovernance%7Cos-console',
    '/api/state', '/api/docs', '/api/no-such-route',
]
RAW_URLS = [
    '/docs-site', '/docs-site?embed=1', '/', '/app.js', '/ui.js',
    '/styles.css', '/vendor/js-yaml.min.js', '/vendor/marked.min.js',
]


def yaml_parity():
    files = []
    for dirpath, dirnames, filenames in os.walk(REPO):
        dirnames[:] = [d for d in dirnames if d not in ('.git', 'node_modules', '__pycache__')]
        files += [os.path.join(dirpath, n) for n in filenames if n.endswith(('.yaml', '.yml'))]
    node_script = (
        "const yaml = require(process.argv[1] + '/os-console/vendor/js-yaml.min.js');"
        "const fs = require('fs');"
        "const out = {};"
        "for (const f of JSON.parse(fs.readFileSync(0, 'utf8'))) {"
        "  try { out[f] = { ok: true, doc: yaml.load(fs.readFileSync(f, 'utf8')) ?? null }; }"
        "  catch (e) { out[f] = { ok: false }; }"
        "}"
        "process.stdout.write(JSON.stringify(out));"
    )
    ref = json.loads(subprocess.run(['node', '-e', node_script, REPO], input=json.dumps(files).encode(),
                                    capture_output=True, check=True).stdout)
    fails = 0
    for f in sorted(files):
        rel = os.path.relpath(f, REPO)
        if not ref[f]['ok']:
            print('  skip  %s (js-yaml itself rejects it)' % rel)
            continue
        try:
            with open(f, 'r', encoding='utf-8') as fh:
                got = json.loads(json.dumps(miniyaml.parse(fh.read())))
        except Exception as e:
            print('  FAIL  %s — miniyaml raised: %s' % (rel, e))
            fails += 1
            continue
        if got != ref[f]['doc']:
            print('  FAIL  %s — parse differs from js-yaml' % rel)
            fails += 1
        else:
            print('  ok    %s' % rel)
    return fails


def fetch(port, path):
    try:
        with urllib.request.urlopen('http://127.0.0.1:%d%s' % (port, path), timeout=30) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def wait_up(port):
    deadline = time.time() + 15
    while time.time() < deadline:
        try:
            fetch(port, '/api/state')
            return True
        except Exception:
            time.sleep(0.15)
    return False


def equal_json(a, b):
    if isinstance(a, float) and isinstance(b, (int, float)):
        return abs(a - b) <= 0.01
    if isinstance(b, float) and isinstance(a, (int, float)):
        return abs(a - b) <= 0.01
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(equal_json(a[k], b[k]) for k in a)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(equal_json(x, y) for x, y in zip(a, b))
    return type(a) is type(b) and a == b


def endpoint_parity():
    fails = 0
    for path in READ_URLS:
        (st_a, body_a), (st_b, body_b) = fetch(NODE_PORT, path), fetch(PY_PORT, path)
        a, b = json.loads(body_a), json.loads(body_b)
        if st_a != st_b:
            print('  FAIL  %s — status %s <> %s' % (path, st_a, st_b))
            fails += 1
        elif st_a >= 500 and isinstance(a, dict) and isinstance(b, dict) and 'error' in a and 'error' in b:
            print('  ok    %s (both %s; error text may differ)' % (path, st_a))
        elif not equal_json(a, b):
            print('  FAIL  %s — payloads differ' % path)
            fails += 1
        else:
            print('  ok    %s (%s)' % (path, st_a))
    for path in RAW_URLS:
        (st_a, body_a), (st_b, body_b) = fetch(NODE_PORT, path), fetch(PY_PORT, path)
        if st_a != st_b or body_a != body_b:
            print('  FAIL  %s — status %s <> %s, %d <> %d bytes' % (path, st_a, st_b, len(body_a), len(body_b)))
            fails += 1
        else:
            print('  ok    %s (%d bytes, byte-identical)' % (path, len(body_a)))
    return fails


def main():
    if not shutil.which('node'):
        print('node not found — parity needs both runtimes; nothing checked.')
        return 2
    print('YAML corpus vs js-yaml:')
    fails = yaml_parity()
    print('API + static parity (server.js :%d vs server.py :%d):' % (NODE_PORT, PY_PORT))
    node = subprocess.Popen(['node', os.path.join(BASE, 'server.js')],
                            env=dict(os.environ, OS_CONSOLE_PORT=str(NODE_PORT)),
                            stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
    py = subprocess.Popen([sys.executable, os.path.join(BASE, 'server.py')],
                         env=dict(os.environ, OS_CONSOLE_PORT=str(PY_PORT)),
                         stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
    try:
        if not (wait_up(NODE_PORT) and wait_up(PY_PORT)):
            print('FAIL — a server did not come up')
            return 1
        fails += endpoint_parity()
    finally:
        for p in (node, py):
            p.terminate()
    print('PARITY %s — %d failure(s)' % ('OK' if fails == 0 else 'BROKEN', fails))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
