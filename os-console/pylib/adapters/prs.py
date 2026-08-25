# Pull requests adapter — open PRs waiting for review and merged-PR leaderboards.
# Shells the platform CLI read-only (gh for GitHub origins, az for Azure Repos),
# detected from the git origin like the pr-flow hook does. Results are cached
# (TTL below); missing/unauthenticated CLIs degrade to an honest note, never an error.
# Port of lib/adapters/prs.js — keep the two in lockstep.
import json
import re
import shutil
import subprocess
import time
from datetime import datetime

from .. import repo

TTL_MS = 5 * 60 * 1000
_cache = {'t': 0, 'data': None}


def sh(cmd, args):
    path = shutil.which(cmd)
    if not path:
        return {'ok': False, 'err': '%s: command not found' % cmd}
    try:
        p = subprocess.run([path] + args, cwd=repo.ROOT, capture_output=True, timeout=12)
    except subprocess.TimeoutExpired:
        return {'ok': False, 'err': '%s timed out' % cmd}
    except Exception as e:
        return {'ok': False, 'err': str(e)[:300]}
    if p.returncode != 0:
        return {'ok': False, 'err': p.stderr.decode('utf-8', 'replace')[:300]}
    return {'ok': True, 'out': p.stdout.decode('utf-8', 'replace')}


def provider():
    r = sh('git', ['remote', 'get-url', 'origin'])
    if not r['ok']:
        return 'none'
    if re.search(r'github\.', r['out'], re.I):
        return 'github'
    if re.search(r'dev\.azure\.com|visualstudio\.com', r['out'], re.I):
        return 'azure'
    return 'other'


def is_bot_login(login):
    return bool(re.search(r'\[bot\]$|-bot$|^bot-', login or '', re.I))


def fetch_github():
    open_r = sh('gh', ['pr', 'list', '--state', 'open', '--limit', '50',
                       '--json', 'number,title,author,createdAt,url,isDraft'])
    if not open_r['ok']:
        return {'available': False, 'provider': 'github', 'open': [], 'merged': [],
                'note': 'gh CLI unavailable or not authenticated — run `gh auth login` to see pull requests here'}
    merged_r = sh('gh', ['pr', 'list', '--state', 'merged', '--limit', '100', '--json', 'author,mergedAt'])
    open_prs = []
    for p in json.loads(open_r['out']):
        author = p.get('author') or {}
        open_prs.append({
            'number': p.get('number'), 'title': p.get('title'), 'url': p.get('url'),
            'createdAt': p.get('createdAt'), 'draft': bool(p.get('isDraft')),
            'author': author.get('login') or '?',
            'isBot': bool(author and (author.get('is_bot') or is_bot_login(author.get('login')))),
        })
    merged = []
    if merged_r['ok']:
        for p in json.loads(merged_r['out']):
            author = p.get('author') or {}
            merged.append({
                'author': author.get('login') or None, 'mergedAt': p.get('mergedAt'),
                'isBot': bool(author and (author.get('is_bot') or is_bot_login(author.get('login')))),
            })
    return {'available': True, 'provider': 'github', 'note': None, 'open': open_prs, 'merged': merged}


def fetch_azure():
    open_r = sh('az', ['repos', 'pr', 'list', '--status', 'active', '-o', 'json'])
    if not open_r['ok']:
        return {'available': False, 'provider': 'azure', 'open': [], 'merged': [],
                'note': 'az CLI unavailable — `az login` + `az extension add --name azure-devops` to see pull requests here'}
    merged_r = sh('az', ['repos', 'pr', 'list', '--status', 'completed', '--top', '100', '-o', 'json'])

    def map_pr(p):
        created_by = p.get('createdBy') or {}
        return {
            'number': p.get('pullRequestId'), 'title': p.get('title'), 'url': '',
            'draft': bool(p.get('isDraft')),
            'createdAt': p.get('creationDate'), 'mergedAt': p.get('closedDate'),
            'author': created_by.get('uniqueName') or created_by.get('displayName') or '?',
            'isBot': is_bot_login(created_by.get('uniqueName')),
        }

    return {
        'available': True, 'provider': 'azure', 'note': None,
        'open': [map_pr(p) for p in json.loads(open_r['out'])],
        'merged': [map_pr(p) for p in json.loads(merged_r['out'])] if merged_r['ok'] else [],
    }


def data(force):
    now_ms = time.time() * 1000
    if not force and _cache['data'] is not None and now_ms - _cache['t'] < TTL_MS:
        return _cache['data']
    kind = provider()
    if kind == 'github':
        d = fetch_github()
    elif kind == 'azure':
        d = fetch_azure()
    else:
        d = {'available': False, 'provider': kind, 'open': [], 'merged': [],
             'note': 'no git origin configured' if kind == 'none' else 'PR listing supports GitHub and Azure Repos origins'}
    _cache['t'] = now_ms
    _cache['data'] = d
    return d


def _parse_iso_ms(s):
    if not s:
        return None
    try:
        cleaned = re.sub(r'\.(\d{6})\d+', r'.\1', s.replace('Z', '+00:00'))
        return datetime.fromisoformat(cleaned).timestamp() * 1000
    except Exception:
        return None


def open_prs(force):
    """Open PRs waiting for a human (bots filtered out)."""
    d = data(force)
    return {'available': d['available'], 'provider': d['provider'], 'note': d['note'],
            'items': [p for p in d['open'] if not p['isBot']]}


def leaders(force):
    """Merged-PR leaderboards over the last 7 / 30 days — humans only."""
    d = data(force)
    out = {'available': d['available'], 'provider': d['provider'], 'note': d['note'], 'week': [], 'month': []}
    if not d['available']:
        return out
    now_ms = time.time() * 1000
    for key, span in (('week', 7 * 864e5), ('month', 30 * 864e5)):
        counts = {}
        for m in d['merged']:
            if not m['author'] or m['isBot'] or not m['mergedAt']:
                continue
            merged_ms = _parse_iso_ms(m['mergedAt'])
            if merged_ms is None or now_ms - merged_ms > span:
                continue
            counts[m['author']] = counts.get(m['author'], 0) + 1
        rows = [{'login': login, 'count': count} for login, count in counts.items()]
        rows.sort(key=lambda r: r['count'], reverse=True)
        out[key] = rows[:5]
    return out
