# Proposed changes adapter — everything waiting for a human in one place:
# open pull requests, the gated-change proposals inbox, health reports, and
# the weekly review reports.
import re

from .. import repo
from . import governance
from . import prs

REPORTS_DIR = 'product-development/product/reports'


def weekly_reports():
    try:
        entries = repo.list_dir(REPORTS_DIR)
    except Exception:
        return []
    out = [{'path': e['rel'], 'name': e['name'], 'mtimeMs': e['mtimeMs']}
           for e in entries
           if e['type'] == 'file' and e['name'] != 'CLAUDE.md' and re.search(r'weekly', e['name'], re.I)]
    out.sort(key=lambda r: r['mtimeMs'], reverse=True)
    return out[:10]


def build(force):
    """Two symmetric queues: changes proposed by team members (human PRs) and
    automatically proposed changes (the proposals inbox + bot PRs)."""
    open_all = prs.all_open(force)
    human = [p for p in open_all['items'] if not p.get('isBot')]
    bots = [p for p in open_all['items'] if p.get('isBot')]
    return {
        'prs': {'available': open_all['available'], 'provider': open_all['provider'],
                'note': open_all['note'], 'items': human},
        'auto': {'proposals': governance.proposals(), 'botPrs': bots},
        'permissions': prs.permissions(),
        'health': governance.health_reports(),
        'weeklyReports': weekly_reports(),
    }
