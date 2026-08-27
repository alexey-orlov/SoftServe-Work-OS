# Governance adapter — auto-sync state, the gated list with its human comments,
# pending proposals, and server-side enforcement signals. page_data() adds the
# reconciled "rule → what it covers → freshness" structure for the view.
import re

from .. import mdparse as md
from .. import policy
from .. import repo
from . import steering


def proposals():
    out = []
    try:
        for e in repo.list_dir('governance/proposals'):
            if e['type'] != 'file' or not e['name'].endswith('.md') or e['name'] == 'CLAUDE.md':
                continue
            text = repo.read_text_or_null(e['rel']) or ''
            out.append({'path': e['rel'], 'title': md.first_heading(text) or e['name'],
                        'intro': md.intro(text), 'mtimeMs': e['mtimeMs']})
    except Exception:
        pass  # folder may not exist
    out.sort(key=lambda p: p['mtimeMs'], reverse=True)
    return out


def health_reports():
    out = []
    try:
        for e in repo.list_dir('governance/health'):
            if e['type'] == 'file' and e['name'] != 'CLAUDE.md':
                out.append({'path': e['rel'], 'name': e['name'], 'mtimeMs': e['mtimeMs']})
    except Exception:
        pass
    out.sort(key=lambda p: p['mtimeMs'], reverse=True)
    return out


def build():
    pol = policy.load()
    return {
        'policyPath': policy.POLICY_PATH,
        'autoSync': policy.auto_sync_summary(pol['settings']),
        'settings': pol['settings'],
        'steward': pol['steward'],
        'stewardPlaceholder': '[' in pol['steward'],
        'reviewers': pol['reviewers'],
        'gated': [{'pattern': g['pattern'], 'heading': g['heading'], 'note': g['note']} for g in pol['gated']],
        'livingPages': pol['livingPages'],
        'proposals': proposals(),
        'health': health_reports(),
        'enforcement': {
            'codeowners': repo.exists('.github/CODEOWNERS'),
            'wikiLintWorkflow': repo.exists('.github/workflows/wiki-lint.yml'),
        },
    }


def protected_list(steer_rows):
    """One entry per gated rule, joined with the steering files it currently covers:
    single-file rules become file rows; tree rules carry a live file count plus
    their notable steering files (title, _updated, last change)."""
    pol = policy.load()
    notable = [r for r in steer_rows if r['group'] in ('core', 'business')]
    out = []
    for g in pol['gated']:
        single = not re.search(r'[*?]', g['pattern'])
        files = [{'path': r['path'], 'title': r['title'], 'role': r['role'],
                  'updatedHeader': r['updatedHeader'], 'lastChange': r['lastChange']}
                 for r in notable if g['regex'].match(r['path'])]
        count = None
        if not single:
            try:
                count = len(repo.glob_files(g['pattern']))
            except Exception:
                pass
        out.append({'pattern': g['pattern'], 'heading': g['heading'], 'note': g['note'],
                    'single': single, 'files': files, 'count': count})
    return out


def page_data():
    """Everything the Gated files view needs in one payload."""
    from . import prs
    steer_rows = steering.build()['rows']
    out = build()
    out['protected'] = protected_list(steer_rows)
    out['provider'] = prs.provider()
    out['groups'] = [{'id': 'steering', 'label': 'Steering files'},
                     {'id': 'system', 'label': 'System rules'}]
    return out
