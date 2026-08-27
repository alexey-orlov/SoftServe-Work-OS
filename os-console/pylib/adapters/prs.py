# Pull requests adapter — open PRs waiting for review, plus the Home most-active
# leaderboard. PR lists shell the platform CLI read-only (gh for GitHub origins,
# az for Azure Repos), detected from the git origin like the pr-flow hook does;
# results are cached (TTL below); missing/unauthenticated CLIs degrade to an honest
# note, never an error. The leaderboard reads local git history instead — it must
# work the same whether work lands as direct pushes or through pull requests.
import json
import re
import shutil
import subprocess
import time

from .. import gitlib, repo

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


def is_bot_author(name, email):
    """CI and agent identities — the leaderboard is people-only. A change a person
    makes through an agent session still carries the person as commit author and
    counts; only commits authored AS the agent/CI identity itself are filtered."""
    e = (email or '').lower()
    return (is_bot_login(name) or e == 'noreply@anthropic.com'
            or e.startswith('actions@') or '[bot]@' in e)


def fetch_github():
    open_r = sh('gh', ['pr', 'list', '--state', 'open', '--limit', '50',
                       '--json', 'number,title,author,createdAt,url,isDraft'])
    if not open_r['ok']:
        return {'available': False, 'provider': 'github', 'open': [],
                'note': 'gh CLI unavailable or not authenticated — run `gh auth login` to see pull requests here'}
    open_prs = []
    for p in json.loads(open_r['out']):
        author = p.get('author') or {}
        open_prs.append({
            'number': p.get('number'), 'title': p.get('title'), 'url': p.get('url'),
            'createdAt': p.get('createdAt'), 'draft': bool(p.get('isDraft')),
            'author': author.get('login') or '?',
            'isBot': bool(author and (author.get('is_bot') or is_bot_login(author.get('login')))),
        })
    return {'available': True, 'provider': 'github', 'note': None, 'open': open_prs}


def fetch_azure():
    open_r = sh('az', ['repos', 'pr', 'list', '--status', 'active', '-o', 'json'])
    if not open_r['ok']:
        return {'available': False, 'provider': 'azure', 'open': [],
                'note': 'az CLI unavailable — `az login` + `az extension add --name azure-devops` to see pull requests here'}

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
        d = {'available': False, 'provider': kind, 'open': [],
             'note': 'no git origin configured' if kind == 'none' else 'PR listing supports GitHub and Azure Repos origins'}
    _cache['t'] = now_ms
    _cache['data'] = d
    return d


def open_prs(force):
    """Open PRs waiting for a human (bots filtered out)."""
    d = data(force)
    return {'available': d['available'], 'provider': d['provider'], 'note': d['note'],
            'items': [p for p in d['open'] if not p['isBot']]}


def all_open(force):
    """Every open PR, humans and bots — the Proposed-changes tabs split them."""
    d = data(force)
    return {'available': d['available'], 'provider': d['provider'], 'note': d['note'],
            'items': d['open']}


# ------------------------------------------------- permissions + PR actions
# Where the host lets us check cheaply (GitHub repo permissions), buttons can be
# disabled upfront; where it does not (Azure, CODEOWNERS satisfaction), the
# console attempts the action and the git host stays the enforcer — its
# rejection is surfaced verbatim.

_perm_cache = {'t': 0, 'data': None}


def origin_slug():
    r = sh('git', ['remote', 'get-url', 'origin'])
    if not r['ok']:
        return None
    m = re.search(r'github\.[^/:]+[/:]([^/\s]+)/([^/\s]+?)(?:\.git)?\s*$', r['out'])
    return '%s/%s' % (m.group(1), m.group(2)) if m else None


def permissions(force=False):
    """canMerge: True/False when the host answers cheaply (GitHub push/admin),
    None when unknowable (Azure, no CLI) — None means optimistic buttons."""
    now_ms = time.time() * 1000
    if not force and _perm_cache['data'] is not None and now_ms - _perm_cache['t'] < TTL_MS:
        return _perm_cache['data']
    kind = provider()
    out = {'provider': kind, 'canMerge': None, 'login': None, 'note': None}
    if kind == 'github':
        slug = origin_slug()
        r = sh('gh', ['api', 'repos/%s' % slug, '--jq', '.permissions']) if slug else {'ok': False, 'err': 'no origin slug'}
        if r['ok']:
            try:
                p = json.loads(r['out'] or '{}') or {}
                out['canMerge'] = bool(p.get('admin') or p.get('maintain') or p.get('push'))
            except Exception:
                pass
        else:
            out['note'] = 'permission check unavailable (%s) — actions will be attempted and the host decides' % (r.get('err') or '')[:120]
        who = sh('gh', ['api', 'user', '--jq', '.login'])
        if who['ok']:
            out['login'] = who['out'].strip()
    elif kind == 'azure':
        out['note'] = 'Azure does not expose a cheap merge-permission check — actions are attempted and the host decides'
    _perm_cache['t'] = now_ms
    _perm_cache['data'] = out
    return out


def _step(steps, name, r, ok_note=None):
    steps.append({'step': name, 'ok': r['ok'],
                  'note': (ok_note if r['ok'] else (r.get('err') or 'failed'))})
    return r['ok']


def pr_action(number, action, comment=''):
    """approve = approve + merge/complete; reject = close/abandon with the comment.
    Every stage reported honestly — a partial result says exactly what happened."""
    from .. import repo as _repo
    try:
        n = str(int(number))
    except (TypeError, ValueError):
        raise _repo.http_err(400, 'PR number required')
    if action not in ('approve', 'reject'):
        raise _repo.http_err(400, 'action must be approve or reject')
    if action == 'reject' and not (comment or '').strip():
        raise _repo.http_err(400, 'a rejection needs a comment — it is posted to the pull request')
    kind = provider()
    steps = []
    if kind == 'github':
        if action == 'approve':
            rev = sh('gh', ['pr', 'review', n, '--approve'])
            if not rev['ok'] and re.search(r'your own pull request', rev.get('err', ''), re.I):
                steps.append({'step': 'approve review', 'ok': True,
                              'note': 'own PR — review not needed, going straight to merge'})
            else:
                _step(steps, 'approve review', rev, 'approving review posted')
            merge = sh('gh', ['pr', 'merge', n, '--merge'])
            _step(steps, 'merge', merge, 'merged')
        else:
            close = sh('gh', ['pr', 'close', n, '--comment', comment.strip()])
            _step(steps, 'close with comment', close, 'closed — comment posted on the PR')
    elif kind == 'azure':
        if action == 'approve':
            vote = sh('az', ['repos', 'pr', 'set-vote', '--id', n, '--vote', 'approve'])
            _step(steps, 'approve vote', vote, 'vote recorded')
            done = sh('az', ['repos', 'pr', 'update', '--id', n, '--status', 'completed'])
            _step(steps, 'complete', done, 'completed')
        else:
            posted = _azure_comment(n, comment.strip())
            steps.append({'step': 'comment', 'ok': posted['ok'],
                          'note': posted['note']})
            ab = sh('az', ['repos', 'pr', 'update', '--id', n, '--status', 'abandoned'])
            _step(steps, 'abandon', ab, 'abandoned')
    else:
        raise _repo.http_err(400, 'PR actions support GitHub and Azure Repos origins')
    _cache['t'] = 0  # drop the PR-list cache so the next load reflects this
    return {'ok': all(s['ok'] for s in steps), 'provider': kind, 'steps': steps}


def _azure_comment(n, comment):
    """Best-effort: post the rejection comment as a PR thread via the REST invoke.
    Failure degrades to an honest note, never blocks the abandon."""
    import os
    import tempfile
    show = sh('az', ['repos', 'pr', 'show', '--id', n, '-o', 'json'])
    if not show['ok']:
        return {'ok': False, 'note': 'comment not posted (cannot read the PR) — add it on the PR page'}
    try:
        pr = json.loads(show['out'])
        repo_id = pr['repository']['id']
        project = pr['repository']['project']['name']
    except Exception:
        return {'ok': False, 'note': 'comment not posted (unexpected PR shape) — add it on the PR page'}
    body = {'comments': [{'parentCommentId': 0, 'content': comment, 'commentType': 1}], 'status': 1}
    tmp = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8')
    try:
        json.dump(body, tmp)
        tmp.close()
        r = sh('az', ['devops', 'invoke', '--area', 'git', '--resource', 'pullRequestThreads',
                      '--route-parameters', 'project=%s' % project, 'repositoryId=%s' % repo_id,
                      'pullRequestId=%s' % n, '--http-method', 'POST',
                      '--api-version', '6.0', '--in-file', tmp.name])
        if r['ok']:
            return {'ok': True, 'note': 'comment posted on the PR'}
        return {'ok': False, 'note': 'comment not posted (%s) — add it on the PR page' % (r.get('err') or '')[:120]}
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


def leaders(force):
    """Most-active leaderboards over the last 7 / 30 days — humans only, counted
    from the commits in local history. Credit goes to the commit AUTHOR (whoever
    produced the change); merge commits are skipped so approving or landing someone
    else's work never counts. Author-based counting works the same whether the team
    lands work as direct pushes or through pull requests, and needs no platform CLI.
    `force` is kept for route compatibility — history is read fresh on every call."""
    r = gitlib.git(['log', '--since=30 days ago', '--no-merges',
                    '--pretty=format:%ct%x1f%an%x1f%ae'])
    if not r['ok']:
        return {'available': False, 'provider': 'git', 'week': [], 'month': [],
                'note': 'git history unavailable (%s)' % (r.get('err') or '')[:120]}
    now_s = time.time()
    week = {}
    month = {}
    for line in r['out'].split('\n'):
        parts = line.split('\x1f')
        if len(parts) != 3:
            continue
        ts, name, email = parts
        try:
            age_s = now_s - int(ts)
        except ValueError:
            continue
        if is_bot_author(name, email) or age_s > 30 * 86400:
            continue
        month[name] = month.get(name, 0) + 1
        if age_s <= 7 * 86400:
            week[name] = week.get(name, 0) + 1

    def top(counts):
        rows = [{'login': login, 'count': count} for login, count in counts.items()]
        rows.sort(key=lambda row: row['count'], reverse=True)
        return rows[:5]

    return {'available': True, 'provider': 'git', 'note': None,
            'week': top(week), 'month': top(month)}
