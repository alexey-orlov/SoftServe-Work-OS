# Git layer — read history/status, and commit console saves so concurrent Claude
# sessions never sweep console edits into their own turn-end commits.
# Port of lib/git.js — keep the two in lockstep.
import re
import shutil
import subprocess

from . import repo

_GIT = None


def _git_bin():
    global _GIT
    if _GIT is None:
        _GIT = shutil.which('git') or 'git'
    return _GIT


def git(args):
    try:
        p = subprocess.run([_git_bin()] + list(args), cwd=repo.ROOT, capture_output=True, timeout=60)
    except Exception as e:
        return {'ok': False, 'out': '', 'err': str(e)}
    out = p.stdout.decode('utf-8', 'replace')
    err = p.stderr.decode('utf-8', 'replace')
    if p.returncode != 0:
        return {'ok': False, 'out': out, 'err': err or ('git exited %d' % p.returncode)}
    return {'ok': True, 'out': out}


def status_info():
    r = git(['status', '--porcelain=v1', '-b'])
    if not r['ok']:
        return {'ok': False, 'branch': None, 'ahead': 0, 'behind': 0, 'entries': []}
    branch = None
    ahead = 0
    behind = 0
    entries = []
    for line in [l for l in r['out'].split('\n') if l]:
        if line.startswith('## '):
            m = re.match(r'^## ([^. ]+)(?:\.\.\.\S+)?(?: \[(?:ahead (\d+))?(?:, )?(?:behind (\d+))?\])?', line)
            if m:
                branch = m.group(1)
                ahead = int(m.group(2) or 0)
                behind = int(m.group(3) or 0)
            continue
        xy = line[:2]
        p = line[3:]
        if xy.startswith('R') and ' -> ' in p:
            p = p.split(' -> ')[1]
        entries.append({'xy': xy.strip() or '??', 'path': re.sub(r'^"|"$', '', p)})
    return {'ok': True, 'branch': branch, 'ahead': ahead, 'behind': behind, 'entries': entries}


def log(n, for_path=None):
    """Parsed history: [{sha, date, author, subject, files: [{status, path}]}]"""
    args = ['log', '-n', str(n or 60), '--date=iso-strict',
            '--pretty=format:%x1e%h%x1f%cI%x1f%an%x1f%s', '--name-status']
    if for_path:
        args += ['--', for_path]
    r = git(args)
    if not r['ok']:
        return []
    out = []
    for rec in r['out'].split('\x1e'):
        if not rec.strip():
            continue
        lines = [l for l in rec.split('\n') if l.strip() != '']
        head = lines[0].split('\x1f')
        sha, date, author, subject = (head + ['', '', '', ''])[:4]
        files = []
        for l in lines[1:]:
            parts = l.split('\t')
            if len(parts) >= 2:
                files.append({'status': parts[0][:1], 'path': parts[-1]})
        out.append({'sha': sha, 'date': date, 'author': author, 'subject': subject, 'files': files})
    return out


def last_change_iso(rel):
    r = git(['log', '-1', '--pretty=%cI', '--', rel])
    return r['out'].strip() if r['ok'] and r['out'].strip() else None


def commit_paths(paths, message):
    """Commit exactly these paths (pathspec-limited so a concurrent session's staged
    work is never swept in). Returns {committed, sha, note}."""
    add = git(['add', '--'] + list(paths))
    if not add['ok']:
        return {'committed': False, 'sha': None, 'note': 'git add failed: %s' % add.get('err', '')}
    c = git(['commit', '-m', message, '--'] + list(paths))
    if not c['ok']:
        benign = re.search(r'nothing to commit|no changes added', (c.get('out', '') + c.get('err', '')), re.I)
        return {'committed': False, 'sha': None,
                'note': 'no content change' if benign else 'git commit failed: %s' % (c.get('err') or c.get('out', ''))}
    sha = git(['rev-parse', '--short', 'HEAD'])
    return {'committed': True, 'sha': sha['out'].strip() if sha['ok'] else None, 'note': None}


def maybe_push(settings):
    """Push only when the policy's auto-sync switchboard says pushes are on, the
    strategy is direct, and we are actually on the target branch. In the pr
    strategy (or with push off) console commits stay local — existing hooks and
    /propose own the landing."""
    am = (settings or {}).get('auto-merge') or {}
    if not am.get('enabled') or not am.get('push'):
        return {'pushed': False, 'note': 'auto-sync push is off — commit is local'}
    if (am.get('strategy') or 'ff-only') == 'pr':
        return {'pushed': False, 'note': 'pr strategy — landing stays with the sync hooks'}
    st = status_info()
    target = am.get('target-branch') or 'main'
    if st['branch'] != target:
        return {'pushed': False, 'note': 'on %s, target is %s — not pushing' % (st['branch'], target)}
    r = git(['push', 'origin', target])
    if r['ok']:
        return {'pushed': True, 'note': 'pushed to origin/%s' % target}
    return {'pushed': False, 'note': 'push failed: %s' % r.get('err', '')}


def grep(q):
    if not q or len(q.strip()) < 2:
        return []
    r = git(['grep', '-I', '-n', '-i', '--no-color', '--untracked', '-e', q, '--',
             '*.md', '*.yaml', '*.yml', '*.txt', '*.sql'])
    if not r['ok']:
        return []
    hits = []
    for line in [l for l in r['out'].split('\n') if l][:120]:
        m = re.match(r'^([^:]+):(\d+):(.*)$', line)
        if m:
            hits.append({'path': m.group(1), 'line': int(m.group(2)), 'text': m.group(3).strip()[:200]})
    return hits
