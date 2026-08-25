# Library adapter — the friendly repo browser. Folder CLAUDE.md navigation files
# (written for agents) double as the human-readable annotations here. Every
# entry carries its write-policy tier so listings can badge gated paths.
# Port of lib/adapters/library.js — keep the two in lockstep.
import re
import stat as statmod

from .. import mdparse as md
from .. import policy
from .. import repo


def tier_of(rel, is_dir, pol):
    # A directory is gated iff files under it are (probe a synthetic child —
    # dir globs like `governance/**` match children, not the bare dir path).
    return policy.tier_for('%s/_' % rel if is_dir else rel, pol)['tier']


def dir_info(rel):
    clean = repo.resolve_safe(rel)['rel'] if rel and rel != '.' else ''
    pol = policy.load()
    entries = repo.list_dir(clean or '.')
    descs = md.nav_descriptions(clean)
    own_nav = repo.read_text_or_null('%s/CLAUDE.md' % clean if clean else 'CLAUDE.md')
    decorated = []
    for e in entries:
        desc = descs[e['rel']] if e['rel'] in descs else ('Folder navigation file' if e['name'] == 'CLAUDE.md' else '')
        decorated.append(dict(e, tier=tier_of(e['rel'], e['type'] == 'dir', pol), desc=desc))
    read_when = ''
    if own_nav:
        m = re.search(r'\*\*Read this when:\*\*\s*(.+)', own_nav)
        read_when = m.group(1) if m else ''
    return {
        'path': clean,
        'tier': tier_of(clean, True, pol) if clean else 'auto',
        'blurb': md.intro(own_nav) if own_nav else '',
        'readWhen': read_when,
        'hasNav': bool(own_nav),
        'entries': decorated,
    }


def tiers(paths):
    """Bulk tier lookup for arbitrary paths (used by the quick-access tiles)."""
    pol = policy.load()
    out = {}
    for p in paths[:120]:
        try:
            rel = repo.resolve_safe(p)['rel']
            st = repo.stat_or_null(rel)
            out[p] = tier_of(rel, bool(st and statmod.S_ISDIR(st.st_mode)), pol)
        except Exception:
            out[p] = 'auto'
    return out
