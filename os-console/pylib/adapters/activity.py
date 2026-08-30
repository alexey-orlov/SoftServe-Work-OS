# Activity adapter — recent repo history with friendly area labels.
import re

from .. import gitlib
from .. import repo

# Ordered longest-prefix map: repo path -> friendly area name.
AREA_MAP = [
    ('product-development/product/PRDs', 'PRDs'),
    ('product-development/product/initiatives', 'Initiatives'),
    ('product-development/product/customers', 'Customers'),
    ('product-development/product/user-insights/transcripts', 'Transcripts'),
    ('product-development/product/user-insights', 'User insights'),
    ('product-development/product/decisions', 'Decisions'),
    ('product-development/product/strategy', 'Strategy'),
    ('product-development/product/competitive-research', 'Competitive'),
    ('product-development/product/meetings', 'Meetings'),
    ('product-development/product/handbook', 'Handbook'),
    ('product-development/product/launches', 'Launches'),
    ('product-development/product/planning', 'Planning'),
    ('product-development/product/reports', 'Reports'),
    ('product-development/product/prototypes', 'Prototypes'),
    ('product-development/product', 'Product'),
    ('product-development/analytics', 'Analytics'),
    ('product-development/engineering', 'Engineering'),
    ('product-development/inbox', 'Inbox'),
    ('product-development', 'Product dev'),
    ('governance', 'Governance'),
    ('os-installation', 'OS install'),
    ('Documentation', 'Docs site'),
    ('.claude', 'Automation'),
    ('.github', 'CI'),
    ('os-console', 'Console'),
]


def area_for(p):
    for prefix, label in AREA_MAP:
        if p == prefix or p.startswith(prefix + '/'):
            return label
    return 'Root'


def prefix_of(subject):
    m = re.match(r'^([a-z]+)(?:\([^)]*\))?!?:', subject or '', re.I)
    return m.group(1).lower() if m else None


def build(limit):
    try:
        n = int(limit)
    except (TypeError, ValueError):
        n = 0
    commits = []
    for c in gitlib.log(min(n or 120, 400)):
        commits.append({
            'sha': c['sha'],
            'date': c['date'],
            'author': c['author'],
            'subject': c['subject'],
            'prefix': prefix_of(c['subject']),
            'files': [dict(f, area=area_for(f['path'])) for f in c['files']],
        })
    st = gitlib.status_info()
    ledger_text = repo.read_text_or_null('governance/processed.txt') or ''
    return {
        'commits': commits,
        'status': {
            'branch': st['branch'], 'ahead': st['ahead'], 'behind': st['behind'],
            'uncommitted': [dict(e, area=area_for(e['path'])) for e in st['entries']],
        },
        'ledger': {
            'path': 'governance/processed.txt',
            'count': len([l for l in ledger_text.split('\n') if l.strip()]),
        },
    }
