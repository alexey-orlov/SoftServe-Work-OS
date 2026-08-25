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
    return {
        'prs': prs.open_prs(force),
        'proposals': governance.proposals(),
        'health': governance.health_reports(),
        'weeklyReports': weekly_reports(),
    }
