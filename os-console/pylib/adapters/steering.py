# Steering adapter — the files that steer every agent session, in one flat list,
# with per-file population status, plus the feature index rendered as a readable
# structure. Derived from the write policy (gated tier + living-pages) and the
# canonical registries — this module is the ONE steering-file list the console
# uses (the Setup page's population set and the Library tiles derive from it).
import posixpath
import re

from .. import gitlib
from .. import mdparse as md
from .. import miniyaml
from .. import policy
from .. import repo

BC_DIR = 'product-development/product/strategy/business-context'
FEATURE_INDEX = 'product-development/feature-index.yaml'

CORE = [
    {'path': 'CLAUDE.md', 'role': 'Root steering — loads every session: fundamentals, doc index, the four rules'},
    {'path': FEATURE_INDEX, 'role': 'The product map — every feature → its artifacts'},
    {'path': 'product-development/toolchain.yaml', 'role': 'Tool/approach choices + live connections, one key per surface'},
    {'path': '.claude/team-learnings.md', 'role': 'Cross-cutting agent rules — injected at every session start'},
    {'path': 'governance/write-policy.yaml', 'role': 'The write policy itself — tiers list + auto-sync switchboard'},
]

# Population status is meaningful for prose steering files; registries (yaml)
# and the learnings file are complete by construction.
_NO_COMPLETION = {FEATURE_INDEX, 'product-development/toolchain.yaml',
                  'governance/write-policy.yaml', '.claude/team-learnings.md'}


def completion(rel, text):
    """done / partial / todo from placeholders + [GAP:] markers, or None where
    population is not the right lens."""
    if rel in _NO_COMPLETION or not rel.endswith('.md'):
        return {'state': None, 'gaps': None, 'detail': ''}
    if text is None:
        return {'state': 'todo', 'gaps': None, 'detail': 'File is missing.'}
    if rel == 'CLAUDE.md':
        scope = (md.section(text, 'Company & Product Fundamentals')
                 + md.section(text, 'Team') + md.section(text, 'Slack Channels'))
        gaps = md.placeholder_count(scope)
        detail = '%d placeholders left in the fundamentals block, team roster and channels.' % gaps
    else:
        gaps = md.placeholder_count(text) + len(re.findall(r'\[GAP:', text))
        detail = '%d placeholders / GAP markers left.' % gaps
    state = 'done' if gaps == 0 else 'partial' if gaps <= 10 else 'todo'
    return {'state': state, 'gaps': gaps,
            'detail': 'Populated — no placeholders left.' if gaps == 0 else detail}


def row(rel, role, group, pol):
    text = repo.read_text_or_null(rel) if repo.is_text_path(rel) else None
    meta = md.meta_lines(text) if text else {}
    # Some pages pack several _key:_ fields on one line — keep only the updated
    # value itself, capped, so displays can rely on it being short.
    updated = None
    if meta.get('updated'):
        updated = re.sub(r'_+\s*$', '', meta['updated'].split('·')[0]).strip()[:26]
    comp = completion(rel, text)
    return {
        'path': rel,
        'exists': repo.exists(rel),
        'title': (md.first_heading(text) or posixpath.basename(rel)) if text else posixpath.basename(rel),
        'role': role or '',
        'group': group,
        'tier': policy.tier_for(rel, pol)['tier'],
        'state': comp['state'],
        'gaps': comp['gaps'],
        'stateDetail': comp['detail'],
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


# ---------------------------------------------------------------- feature index

def _index_artifact(key, val, out):
    if isinstance(val, list):
        for v in val:
            _index_artifact(key, v, out)
        return
    if isinstance(val, dict):
        for k, v in val.items():
            _index_artifact('%s · %s' % (key, k), v, out)
        return
    if not isinstance(val, str) or not val.strip():
        return
    v = val.strip()
    if re.match(r'^https?:', v, re.I):
        out.append({'key': key, 'kind': 'url', 'url': v})
    elif '/' in v:
        from . import initiatives
        norm = initiatives.normalize_artifact_path(v) or v
        out.append({'key': key, 'kind': 'file', 'path': norm, 'exists': repo.exists(norm)})
    else:
        out.append({'key': key, 'kind': 'ref', 'text': v})


def feature_index():
    """feature-index.yaml as a readable structure: area → feature → artifact rows
    (each resolved to a real file, a URL, or a plain reference) + linked initiatives."""
    text = repo.read_text_or_null(FEATURE_INDEX)
    if text is None:
        return {'exists': False, 'areas': [], 'path': FEATURE_INDEX}
    try:
        doc = miniyaml.load(text) or {}
    except Exception:
        return {'exists': True, 'areas': [], 'path': FEATURE_INDEX, 'parseError': True}
    areas = []
    if isinstance(doc, dict):
        for area, feats in doc.items():
            if not isinstance(feats, dict):
                continue
            features = []
            for feature, spec in feats.items():
                if not isinstance(spec, dict):
                    continue
                artifacts = []
                inits = spec.get('initiatives') if isinstance(spec.get('initiatives'), list) else []
                for key, val in spec.items():
                    if key == 'initiatives':
                        continue
                    _index_artifact(key, val, artifacts)
                features.append({'feature': feature, 'artifacts': artifacts, 'initiatives': inits,
                                 'present': len([a for a in artifacts if a['kind'] != 'file' or a.get('exists')]),
                                 'total': len(artifacts)})
            if features:
                areas.append({'area': area, 'features': features})
    return {'exists': True, 'areas': areas, 'path': FEATURE_INDEX,
            'lastChange': gitlib.last_change_iso(FEATURE_INDEX)}


def page_data():
    """Everything the Steering view needs: the rows + the feature index block."""
    out = build()
    out['featureIndex'] = feature_index()
    return out
