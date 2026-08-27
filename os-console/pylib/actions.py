# Console write actions beyond plain file saves — each one a surgical, comment-
# preserving text edit on a canonical registry, committed immediately with the
# `console:` prefix. A console action is the person's approval (same philosophy
# as saves), but landing still follows the auto-sync switchboard: in the pr
# strategy nothing here reaches the target branch by automation.
#
# The auto-sync flip mirrors the /auto-sync skill: the SAME three switches plus
# strategy, nothing else. If that skill's guards or switch set change, change
# this module in the same commit (drift between them is a bug).
import json
import os
import re
import shutil
import subprocess

from . import gitlib
from . import policy
from . import repo

POLICY = policy.POLICY_PATH
TOOLCHAIN = 'product-development/toolchain.yaml'
PROPOSALS_DIR = 'governance/proposals'
GATED_PATHS_SH = '.github/scripts/gated-paths.sh'

# ------------------------------------------------------------------ toolchain

# Only these two fields are console-writable; everything else in toolchain.yaml
# belongs to /customize-os (params, rich decisions) or /connect-mcps (connection:).
_SURFACE_RX = re.compile(r'^[a-z][a-z0-9-]*$')


def _surface_block(lines, surface):
    """(start, end) of a top-level `surface:` block — end is exclusive."""
    start = None
    for i, l in enumerate(lines):
        if re.match(r'^%s:\s*(#.*)?$' % re.escape(surface), l):
            start = i
            break
    if start is None:
        raise repo.http_err(404, 'no surface %s in toolchain.yaml' % surface)
    end = len(lines)
    for i in range(start + 1, len(lines)):
        # A surface block ends at the next top-level key or a column-0 comment
        # (the file separates surfaces with full-line comment blocks).
        if re.match(r'^[a-z]', lines[i]) or re.match(r'^#', lines[i]):
            end = i
            break
    return start, end


def _set_block_field(lines, start, end, key, value, quote=False):
    """Replace `  {key}: ...` inside a block, keeping any trailing comment."""
    # Quoted values also drop '#' — the field regex has no quote awareness, so a
    # '#' inside the value would read as a trailing comment on the NEXT edit.
    val = '"%s"' % value.replace('"', '').replace('#', '') if quote else value
    for i in range(start + 1, end):
        m = re.match(r'^(\s+%s:)\s*[^#\n]*(#.*)?$' % re.escape(key), lines[i])
        if m:
            comment = m.group(2) or ''
            pad = ''
            if comment:
                cur = lines[i]
                cpos = cur.find('#')
                base = '%s %s' % (m.group(1), val)
                pad = ' ' * max(1, cpos - len(base)) if cpos > len(base) else '   '
            lines[i] = '%s %s%s' % (m.group(1), val, (pad + comment) if comment else '')
            return True
    return False


def _has_connection(lines, start, end):
    return any(re.match(r'^\s+connection:', lines[i]) for i in range(start + 1, end))


def toolchain_surfaces():
    """Raw per-surface state incl. connection blocks, for the integrations table."""
    from . import miniyaml
    out = []
    text = repo.read_text_or_null(TOOLCHAIN)
    if text is None:
        return out
    doc = miniyaml.load(text) or {}
    if not isinstance(doc, dict):
        return out
    for key, val in doc.items():
        if not isinstance(val, dict):
            continue
        conn = val.get('connection') if isinstance(val.get('connection'), dict) else None
        out.append({
            'surface': key,
            'choice': val.get('approach') or val.get('source') or 'undecided',
            'choiceKey': 'approach' if 'approach' in val else 'source',
            'system': (val.get('system') or '').strip(),
            'decided': val.get('decided') or None,
            'notes': val.get('notes') or '',
            'connection': {
                'system': (conn.get('system') or '').strip(),
                'status': conn.get('status') or '',
                'date': conn.get('date') or '',
                'log': conn.get('log') or '',
            } if conn else None,
        })
    return out


def toolchain_set(surface, approach=None, system=None, settings=None):
    """Set a surface's choice and/or planned system. The console's only toolchain
    writes; connection: blocks stay /connect-mcps territory. Locked once live."""
    if not surface or not _SURFACE_RX.match(surface):
        raise repo.http_err(400, 'surface required')
    text = repo.read_text(TOOLCHAIN)
    lines = text.split('\n')
    start, end = _surface_block(lines, surface)
    if system is not None and _has_connection(lines, start, end):
        raise repo.http_err(409, '%s has a live connection — its system name is locked to the connected tool' % surface)
    changed = []
    if approach is not None:
        if not re.match(r'^[a-z][a-z0-9-]*$', approach):
            raise repo.http_err(400, 'invalid approach value')
        key = 'approach'
        if not any(re.match(r'^\s+approach:', lines[i]) for i in range(start + 1, end)):
            key = 'source'  # user-research names its choice key `source`
        if not _set_block_field(lines, start, end, key, approach):
            raise repo.http_err(500, 'could not set %s on %s' % (key, surface))
        from . import mdparse as md
        _set_block_field(lines, start, end, 'decided', md.today() if approach != 'undecided' else '')
        changed.append('%s=%s' % (key, approach))
    if system is not None:
        if len(system) > 80:
            raise repo.http_err(400, 'system name too long')
        if not _set_block_field(lines, start, end, 'system', system, quote=True):
            raise repo.http_err(500, 'could not set system on %s' % surface)
        changed.append('system=%s' % (system or '""'))
    if not changed:
        raise repo.http_err(400, 'nothing to change')
    repo.write_text(TOOLCHAIN, '\n'.join(lines))
    commit = gitlib.commit_paths([TOOLCHAIN], 'console: toolchain %s — %s' % (surface, ', '.join(changed)))
    push = gitlib.maybe_push(settings or policy.load()['settings'])
    return {'ok': True, 'surface': surface, 'changed': changed, 'commit': commit, 'push': push}


# ------------------------------------------------------------- gated list edit

_GROUPS = {'steering': 'Steering files', 'system': 'System rules'}


def _gated_block(lines):
    """(first_entry_idx, end_idx) of the tiers.gated list — end exclusive."""
    in_tiers = False
    start = None
    for i, l in enumerate(lines):
        if re.match(r'^tiers:\s*$', l):
            in_tiers = True
            continue
        if in_tiers and re.match(r'^\S', l):
            in_tiers = False
        if in_tiers and re.match(r'^\s+gated:\s*$', l):
            start = i + 1
            break
    if start is None:
        raise repo.http_err(500, 'no tiers.gated block found in the write policy')
    end = start
    for i in range(start, len(lines)):
        if re.match(r'^\s+(#|-)', lines[i]) or lines[i].strip() == '':
            end = i + 1
        else:
            break
    while end > start and lines[end - 1].strip() == '':
        end -= 1
    return start, end


def _validate_pattern(pattern):
    p = (pattern or '').strip().replace('\\', '/')
    p = re.sub(r'^/+', '', p)
    # ANY whitespace (incl. embedded newlines/tabs) would splice raw text into
    # the YAML registry — the enforcement root. Reject, never sanitize.
    if not p or re.search(r'\s', p) or p.startswith('#'):
        raise repo.http_err(400, 'pattern must be a repo-relative path or glob without whitespace')
    repo.resolve_safe(p.replace('*', 'x').replace('?', 'x'))  # escape check on a literalized copy
    return p


def gated_add(pattern, note, group, settings=None):
    p = _validate_pattern(pattern)
    # A directory rule is written dir/** by convention (the hooks also accept dir/).
    if '*' not in p and repo.exists(p) and os.path.isdir(repo.resolve_safe(p)['abs']):
        p = p.rstrip('/') + '/**'
    lines = repo.read_text(POLICY).split('\n')
    start, end = _gated_block(lines)
    existing = [re.match(r'^\s+-\s+(\S+)', lines[i]).group(1)
                for i in range(start, end) if re.match(r'^\s+-\s+\S+', lines[i])]
    if p in existing:
        raise repo.http_err(409, '%s is already gated' % p)
    # Match the list's own formatting exactly — a mixed-indent entry would end
    # the YAML sequence early and silently truncate the parsed policy.
    indent = '    '
    comment_col = 63
    for i in range(start, end):
        m = re.match(r'^(\s+)-\s+\S+', lines[i])
        if m:
            indent = m.group(1)
            cpos = lines[i].find('#')
            if cpos > 0:
                comment_col = cpos
            break
    group_label = _GROUPS.get(group or 'steering', _GROUPS['steering'])
    insert_at = None
    current = ''
    for i in range(start, end):
        c = re.match(r'^\s+#\s?(.*)$', lines[i])
        if c:
            current = c.group(1)
            continue
        if re.match(r'^\s+-\s+\S+', lines[i]) and current.startswith(group_label):
            insert_at = i + 1
    if insert_at is None:
        insert_at = end
    entry = '%s- %s' % (indent, p)
    if note:
        clean_note = ' '.join(note.split())  # collapse ALL whitespace — no newline splices
        entry = '%s%s# %s' % (entry, ' ' * max(1, comment_col - len(entry)), clean_note)
    lines.insert(insert_at, entry)
    repo.write_text(POLICY, '\n'.join(lines))
    mirrors = _regen_codeowners()
    commit = gitlib.commit_paths(_policy_pathspec(), 'console: gate %s' % p)
    push = gitlib.maybe_push(settings or policy.load()['settings'])
    return {'ok': True, 'pattern': p, 'commit': commit, 'push': push,
            'codeowners': mirrors, 'azureReminder': _azure_reminder()}


def gated_remove(pattern, settings=None):
    p = (pattern or '').strip()
    lines = repo.read_text(POLICY).split('\n')
    start, end = _gated_block(lines)
    idx = next((i for i in range(start, end)
                if re.match(r'^\s+-\s+%s(\s|#|$)' % re.escape(p), lines[i])), None)
    if idx is None:
        raise repo.http_err(404, '%s is not in the gated list' % p)
    del lines[idx]
    repo.write_text(POLICY, '\n'.join(lines))
    mirrors = _regen_codeowners()
    commit = gitlib.commit_paths(_policy_pathspec(), 'console: un-gate %s' % p)
    push = gitlib.maybe_push(settings or policy.load()['settings'])
    return {'ok': True, 'pattern': p, 'commit': commit, 'push': push,
            'codeowners': mirrors, 'azureReminder': _azure_reminder()}


def _policy_pathspec():
    """The policy always; CODEOWNERS only when it exists — a missing pathspec
    would fail the whole `git add` and leave the policy edit uncommitted."""
    paths = [POLICY]
    if repo.exists('.github/CODEOWNERS'):
        paths.append('.github/CODEOWNERS')
    return paths


def _regen_codeowners():
    """Regenerate .github/CODEOWNERS from the policy, same as the turn-end hook."""
    script = repo.resolve_safe(GATED_PATHS_SH)['abs']
    if not os.path.isfile(script):
        return {'ok': False, 'note': 'gated-paths.sh not found — CODEOWNERS not regenerated'}
    bash = shutil.which('bash')
    if not bash:
        return {'ok': False, 'note': 'bash unavailable — regenerate CODEOWNERS with gated-paths.sh --format codeowners --write'}
    try:
        r = subprocess.run([bash, script, '--format', 'codeowners', '--write'],
                           cwd=repo.ROOT, capture_output=True, timeout=20)
        if r.returncode != 0:
            return {'ok': False, 'note': (r.stderr.decode('utf-8', 'replace') or 'gated-paths.sh failed')[:200]}
        return {'ok': True, 'note': 'CODEOWNERS regenerated'}
    except Exception as e:
        return {'ok': False, 'note': str(e)[:200]}


def _azure_reminder():
    from .adapters import prs
    if prs.provider() != 'azure':
        return None
    return ('Azure DevOps keeps its own gated-path filter: update the required-reviewer '
            'policy path filter (gated-paths.sh --format ado prints the new value).')


# ---------------------------------------------------------------- auto-sync

def _set_settings_field(lines, section, key, value):
    """Set `settings: → {section}: → {key}:` keeping the trailing comment."""
    in_settings = False
    in_section = False
    for i, l in enumerate(lines):
        if re.match(r'^settings:\s*$', l):
            in_settings = True
            continue
        if in_settings and re.match(r'^[a-zA-Z]', l):
            break  # next top-level key ends settings; col-0 comments do not
        if in_settings and re.match(r'^\s{2}%s:\s*$' % re.escape(section), l):
            in_section = True
            continue
        if in_section and re.match(r'^\s{2}[a-z]', l):
            in_section = False
        if in_section:
            m = re.match(r'^(\s+%s:)\s*[^#\n]*(#.*)?$' % re.escape(key), l)
            if m:
                comment = m.group(2)
                base = '%s %s' % (m.group(1), value)
                if comment:
                    cpos = l.find('#')
                    pad = ' ' * max(2, cpos - len(base))
                    lines[i] = base + pad + comment
                else:
                    lines[i] = base
                return True
    return False


def autosync_guards(mode):
    """Reasons this flip cannot proceed — empty list means go. Mirrors /auto-sync:
    a missing origin does NOT block (the skill proceeds and notes that pushes are
    skipped until a remote exists — _push_with_retry reports exactly that)."""
    reasons = []
    st = gitlib.status_info()
    settings = policy.load()['settings']
    am = settings.get('auto-merge') or {}
    target = am.get('target-branch') or 'main'
    current_strategy = am.get('strategy') or 'ff-only'
    if mode == 'direct' and current_strategy == 'pr' and st['branch'] and st['branch'] != target:
        unlanded = gitlib.git(['log', '--oneline', 'origin/%s..HEAD' % target])
        if unlanded['ok'] and unlanded['out'].strip():
            n = len(unlanded['out'].strip().split('\n'))
            reasons.append('You are on branch %s with %d commit(s) not yet landed on %s. '
                           'Land them first (/propose for the gated ones), or switch to %s.'
                           % (st['branch'], n, target, target))
    return reasons


def autosync_set(mode):
    """Flip auto-sync exactly as /auto-sync does: three switches + strategy, commit,
    push with one rebase retry. Never a success banner over a failure."""
    if mode not in ('direct', 'pr', 'off'):
        raise repo.http_err(400, 'mode must be direct, pr, or off')
    reasons = autosync_guards(mode)
    if reasons:
        return {'ok': False, 'blocked': True, 'reasons': reasons}
    lines = repo.read_text(POLICY).split('\n')
    on = mode != 'off'
    edits = [('auto-commit', 'enabled', 'true' if on else 'false'),
             ('auto-merge', 'enabled', 'true' if on else 'false'),
             ('auto-merge', 'push', 'true' if on else 'false')]
    if on:
        edits.append(('auto-merge', 'strategy', 'ff-only' if mode == 'direct' else 'pr'))
    for section, key, value in edits:
        if not _set_settings_field(lines, section, key, value):
            raise repo.http_err(500, 'could not set settings.%s.%s — the policy file shape changed' % (section, key))
    repo.write_text(POLICY, '\n'.join(lines))
    msg = 'context: auto-sync %s' % ('off' if not on else 'on (%s)' % mode)
    commit = gitlib.commit_paths([POLICY], msg)
    if not commit['committed'] and commit['note'] != 'no content change':
        return {'ok': False, 'blocked': False, 'reasons': ['Commit failed: %s' % commit['note']]}
    push = _push_with_retry(mode)
    fresh = policy.load()
    return {'ok': True, 'blocked': False, 'commit': commit, 'push': push,
            'autoSync': policy.auto_sync_summary(fresh['settings'])}


def _push_with_retry(mode):
    """Push the flip itself. In pr mode the policy is gated + main is PR-only:
    the commit stays on the current branch, honestly reported."""
    st = gitlib.status_info()
    settings = policy.load()['settings']
    am = settings.get('auto-merge') or {}
    target = am.get('target-branch') or 'main'
    origin = gitlib.git(['remote', 'get-url', 'origin'])
    if not origin['ok']:
        return {'pushed': False, 'note': 'no origin — the flip is committed locally'}
    if mode == 'pr' and st['branch'] != target:
        return {'pushed': False, 'note': 'pr mode — the flip is committed on %s and lands via /propose (gated)' % st['branch']}
    r = gitlib.git(['push', 'origin', st['branch'] or target])
    if r['ok']:
        return {'pushed': True, 'note': 'pushed to origin/%s' % (st['branch'] or target)}
    pull = gitlib.git(['pull', '--rebase', 'origin', st['branch'] or target])
    if pull['ok']:
        r2 = gitlib.git(['push', 'origin', st['branch'] or target])
        if r2['ok']:
            return {'pushed': True, 'note': 'pushed to origin/%s (after rebase)' % (st['branch'] or target)}
        return {'pushed': False, 'note': 'push failed after rebase: %s — finish it in Claude Code (/auto-sync %s)' % (r2.get('err', '')[:160], mode)}
    gitlib.git(['rebase', '--abort'])
    if mode == 'pr':
        return {'pushed': False, 'note': 'push rejected (main is likely PR-only) — the flip is committed locally and lands via /propose'}
    return {'pushed': False, 'note': 'push failed: %s — finish it in Claude Code (/auto-sync %s)' % (r.get('err', '')[:160], mode)}


# ---------------------------------------------------------------- proposals

def proposal_reject(path, comment, settings=None):
    """Delete one proposal file (governance/proposals/ only), the rejection comment
    in the commit message. Approving is a Claude Code hand-off, not a console act."""
    r = repo.resolve_safe(path)
    rel = r['rel']
    if not rel.startswith(PROPOSALS_DIR + '/') or rel.endswith('CLAUDE.md') or not rel.endswith('.md'):
        raise repo.http_err(400, 'only proposal files under %s can be rejected here' % PROPOSALS_DIR)
    if not repo.exists(rel):
        raise repo.http_err(404, '%s not found' % rel)
    os.remove(r['abs'])
    msg = 'console: reject proposal %s' % os.path.basename(rel)
    if comment and comment.strip():
        msg += '\n\nRejected: %s' % comment.strip()[:500]
    commit = gitlib.commit_paths([rel], msg)
    push = gitlib.maybe_push(settings or policy.load()['settings'])
    return {'ok': True, 'path': rel, 'commit': commit, 'push': push}
