# Write-policy layer — the console derives tier decisions from the SAME registry the
# write-guard hook enforces on agents: governance/write-policy.yaml. Nothing is hardcoded.
# Port of lib/policy.js — keep the two in lockstep.
import re

from . import miniyaml
from . import repo

POLICY_PATH = 'governance/write-policy.yaml'


def glob_to_regex(glob):
    """fnmatch-style glob -> regex: * stays inside a path segment, ** crosses segments."""
    out = ''
    i = 0
    while i < len(glob):
        c = glob[i]
        if c == '*':
            if i + 1 < len(glob) and glob[i + 1] == '*':
                out += '.*'
                i += 1
            else:
                out += '[^/]*'
        elif c == '?':
            out += '[^/]'
        else:
            out += re.escape(c)
        i += 1
    return re.compile('^%s$' % out)


def parse_gated_annotations(raw):
    """Pull the human-facing comments out of the tiers block (YAML loaders drop them):
    group headings (full-line comments) and per-entry trailing comments."""
    out = []
    in_tiers = False
    in_gated = False
    heading = ''
    for line in raw.split('\n'):
        if re.match(r'^tiers:\s*$', line):
            in_tiers = True
            continue
        if in_tiers and re.match(r'^\S', line) and not re.match(r'^tiers:', line):
            in_tiers = False
            in_gated = False
        if in_tiers and re.match(r'^\s+gated:\s*$', line):
            in_gated = True
            continue
        if not in_gated:
            continue
        comment = re.match(r'^\s+#\s?(.*)$', line)
        if comment:
            heading = comment.group(1).strip()
            continue
        entry = re.match(r'^\s+-\s+(\S+)\s*(?:#\s?(.*))?$', line)
        if entry:
            out.append({'pattern': entry.group(1), 'heading': heading, 'note': (entry.group(2) or '').strip()})
    return out


def load():
    raw = repo.read_text(POLICY_PATH)
    doc = miniyaml.load(raw) or {}
    tiers = doc.get('tiers') if isinstance(doc.get('tiers'), dict) else {}
    gated = tiers.get('gated') or []
    annotations = parse_gated_annotations(raw)
    by_pattern = {a['pattern']: a for a in annotations}
    return {
        'path': POLICY_PATH,
        'steward': doc.get('steward') or '',
        'reviewers': doc.get('reviewers') or {},
        'gated': [{
            'pattern': pattern,
            'regex': glob_to_regex(pattern),
            'heading': by_pattern.get(pattern, {}).get('heading', ''),
            'note': by_pattern.get(pattern, {}).get('note', ''),
        } for pattern in gated],
        'livingPages': doc.get('living-pages') or [],
        'settings': doc.get('settings') or {},
    }


def tier_for(rel, policy=None):
    """Tier for a repo-relative path, with the matched rule (shown to the person in the UI)."""
    p = policy or load()
    for g in p['gated']:
        if g['regex'].match(rel):
            return {'tier': 'gated', 'pattern': g['pattern'], 'heading': g['heading'], 'note': g['note']}
    return {'tier': 'auto'}


def auto_sync_summary(settings):
    """Friendly one-line description of the current auto-sync state."""
    ac = settings.get('auto-commit') or {}
    am = settings.get('auto-merge') or {}
    on = bool(ac.get('enabled'))
    strategy = am.get('strategy') or 'ff-only'
    mode = 'pr' if strategy == 'pr' else 'direct'
    if not on:
        label = 'Off — nothing is committed or pushed automatically'
    elif mode == 'pr':
        label = 'On (pr) — work drains to %s via self-merging PRs; gated files wait for /propose' % (am.get('target-branch') or 'main')
    else:
        label = 'On (direct, %s) — each turn commits%s; gated files are held for the steward' % (
            strategy, ' and pushes' if am.get('push') else '')
    return {
        'on': on,
        'mode': mode if on else None,
        'strategy': strategy,
        'push': bool(am.get('push')),
        'targetBranch': am.get('target-branch') or 'main',
        'scope': ac.get('scope') or 'auto-tier',
        'messagePrefix': ac.get('message-prefix') or 'context:',
        'label': label,
    }
