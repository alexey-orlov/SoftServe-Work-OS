# Steering adapter — the files that steer every agent session, in one flat list.
# Derived from the write policy (gated tier + living-pages), never hardcoded lists.
import posixpath
import re

from .. import gitlib
from .. import mdparse as md
from .. import policy
from .. import repo

BC_DIR = 'product-development/product/strategy/business-context'

CORE = [
    {'path': 'CLAUDE.md', 'role': 'Root steering — loads every session: fundamentals, doc index, the four rules'},
    {'path': 'product-development/feature-index.yaml', 'role': 'The product map — every feature → its artifacts'},
    {'path': 'product-development/toolchain.yaml', 'role': 'Standing tool/approach choices, one key per surface'},
    {'path': '.claude/team-learnings.md', 'role': 'Cross-cutting agent rules — injected at every session start'},
    {'path': 'governance/write-policy.yaml', 'role': 'The write policy itself — tiers list + auto-sync switchboard'},
]


def row(rel, role, group, pol):
    text = repo.read_text_or_null(rel) if repo.is_text_path(rel) else None
    meta = md.meta_lines(text) if text else {}
    # Some pages pack several _key:_ fields on one line — keep only the updated
    # value itself, capped, so displays can rely on it being short.
    updated = None
    if meta.get('updated'):
        updated = re.sub(r'_+\s*$', '', meta['updated'].split('·')[0]).strip()[:26]
    return {
        'path': rel,
        'exists': repo.exists(rel),
        'title': (md.first_heading(text) or posixpath.basename(rel)) if text else posixpath.basename(rel),
        'role': role or '',
        'group': group,
        'tier': policy.tier_for(rel, pol)['tier'],
        'updatedHeader': updated,
        'lastChange': gitlib.last_change_iso(rel) if repo.exists(rel) else None,
        'lines': len(text.split('\n')) if text else None,
    }


def build():
    pol = policy.load()
    rows = []

    for c in CORE:
        rows.append(row(c['path'], c['role'], 'core', pol))

    try:
        bc_descs = md.nav_descriptions(BC_DIR)
    except Exception:
        bc_descs = {}
    try:
        for e in repo.list_dir(BC_DIR):
            if e['type'] != 'file' or e['name'] == 'CLAUDE.md':
                continue
            rows.append(row(e['rel'], bc_descs.get(e['rel']) or 'Business context', 'business', pol))
    except Exception:
        pass  # folder missing on a stripped install

    seen = {r['path'] for r in rows}
    for pattern in pol['livingPages']:
        for rel in repo.glob_files(pattern):
            if rel in seen or rel.endswith('/CLAUDE.md'):
                continue
            seen.add(rel)
            is_initiative = rel.startswith('product-development/product/initiatives/')
            rows.append(row(rel, 'Initiative page (see Initiatives view)' if is_initiative
                            else 'Living page — edit in place, keep current', 'living', pol))

    return {'rows': rows, 'steward': pol['steward'], 'policyPath': policy.POLICY_PATH}
