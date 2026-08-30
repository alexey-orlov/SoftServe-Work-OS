# Home adapter — setup & health at a glance. Every signal is DERIVED from
# observable repo state (placeholders, undecided keys, absent on-demand files),
# so the dashboard can never disagree with reality.
import re

from .. import actions
from .. import gitlib
from .. import mdparse as md
from .. import repo
from . import governance
from . import initiatives
from . import learnings
from . import steering

BI = 'product-development/product/strategy/business-context/business-info.md'
DEMO_MANIFEST = 'os-installation/demo-data-manifest.md'
LOGS_DIR = 'os-installation/mcp-integration-logs'

placeholder_count = md.placeholder_count  # shared signal — one definition (mdparse)


def product_info(root_md):
    fund = md.section(root_md, 'Company & Product Fundamentals')
    m = re.search(r'\*\*Company / product:\*\*\s*(.+)', fund)
    line = m.group(1) if m else ''
    name = line.split('—')[0].strip()
    return {
        'line': line.strip(),
        'name': name if name and not name.startswith('[') else None,
        'placeholders': placeholder_count(fund),
    }


def parse_frontmatter(text):
    """YAML frontmatter of a /connect-mcps log: system, category, status, date."""
    if not text or not text.startswith('---'):
        return {}
    end = text.find('\n---', 3)
    if end == -1:
        return {}
    out = {}
    for line in text[3:end].split('\n'):
        m = re.match(r'^([a-z-]+):\s*([^#]*?)\s*(?:#.*)?$', line.strip())
        if m:
            out[m.group(1)] = m.group(2).strip().strip('"\'')
    return out


def mcp_connections():
    """Connection records from the integration logs — frontmatter first (the
    /connect-mcps contract), filename keywords as the legacy fallback."""
    out = []
    try:
        entries = repo.list_dir(LOGS_DIR)
    except Exception:
        return out
    for e in entries:
        if e['type'] != 'file' or e['name'] == 'CLAUDE.md' or not e['name'].endswith('.md'):
            continue
        fm = parse_frontmatter(repo.read_text_or_null(e['rel']) or '')
        out.append({
            'name': re.sub(r'\.md$', '', e['name']),
            'path': e['rel'],
            'mtimeMs': e['mtimeMs'],
            'system': fm.get('system') or '',
            'category': fm.get('category') or '',
            'status': fm.get('status') or '',
            'date': fm.get('date') or '',
        })
    return out


def code_repos_configured():
    text = repo.read_text_or_null('product-development/engineering/code-repos.yaml')
    if text is None:
        return {'present': False, 'configured': False}
    remotes = [m.group(1) for m in re.finditer(r'^\s*remote:\s*(\S+)', text, re.M)]
    real = [r for r in remotes if re.match(r'^https?://', r) and not re.search(r'your-org|example|acme', r, re.I)]
    return {'present': True, 'configured': len(real) > 0, 'remotes': len(remotes)}


BC = 'product-development/product/strategy/business-context'
CR = 'product-development/product/competitive-research'

STEERING_FILES = [
    ('claude-md', 'Root CLAUDE.md', 'CLAUDE.md'),
    ('business-info', 'Business info', BC + '/business-info.md'),
    ('stakeholders', 'Stakeholders', BC + '/stakeholders.md'),
    ('segmentation', 'Segmentation matrix', BC + '/segmentation-matrix.md'),
    ('landscape', 'Competitive landscape', CR + '/competitive-landscape.md'),
    ('matrix', 'Competitive matrix', CR + '/competitive-matrix.md'),
]


def steering_status():
    """Population status per steering file — same completion lens as the Steering
    page (steering.completion), over the setup page's curated population set."""
    out = []
    for key, label, path in STEERING_FILES:
        text = repo.read_text_or_null(path)
        comp = steering.completion(path, text)
        state = comp['state'] or ('todo' if text is None else 'done')
        out.append({'key': key, 'label': label, 'path': path, 'exists': text is not None,
                    'gaps': comp['gaps'], 'state': state,
                    'detail': comp['detail'] or ('File is missing.' if text is None else '')})
    return out


def templates_status(customization):
    """Each template + the customization program's phase for the templates target."""
    from . import templates as templates_adapter
    phase = None
    if customization:
        m = re.search(r'^\|\s*\d+\s*\|\s*templates\s*\|\s*([^|]+)\|', customization, re.M | re.I)
        phase = m.group(1).strip() if m else None
    done = bool(phase and re.search(r'installed|complete', phase, re.I))
    try:
        items = templates_adapter.build()['items']
    except Exception:
        items = []
    return {'phase': phase, 'customized': done, 'items': [
        {'name': t['name'], 'title': t['title'], 'path': t['path'], 'desc': t['desc']}
        for t in items]}


# ------------------------------------------------------------ integrations table
# One row per integration surface. Purpose and the "without it" text mirror the
# documentation's "Which tools are worth connecting" table — same promises, same
# fallbacks. `fileAction` marks the surfaces where file storage is a first-class
# choice (recorded in toolchain.yaml as the approach).

SURFACES = [
    {'key': 'prototyping', 'type': 'Design system',
     'example': 'e.g. Figma',
     'purpose': 'Prototypes follow your design system automatically',
     'without': "Describe or link the design; prototypes can't follow the design system automatically.",
     'fileAction': {'approach': 'screenshots', 'label': 'Use file storage (screenshots)'},
     'legacy': r'figma|zeplin|sketch|storybook'},
    {'key': 'codebase', 'type': 'Code base',
     'purpose': 'Product questions answered from the code itself (/code-qa), first drafts built in it',
     'without': 'Claude gives you the exact question to ask an engineer instead.',
     'fileAction': None, 'legacy': None},
    {'key': 'ticketing', 'type': 'Task tracker',
     'example': 'e.g. Jira, Linear',
     'purpose': 'Tickets created directly in your tracker',
     'without': 'Ready-to-paste tickets; you tell Claude the status.',
     'fileAction': None,
     'legacy': r'linear|jira|asana|monday|clickup|boards|ado|tracker'},
    {'key': 'meeting-transcripts', 'type': 'Meeting transcripts',
     'example': 'e.g. Fireflies, Otter',
     'purpose': 'Transcripts pulled directly after each call',
     'without': 'Paste the transcript, or drop the file into product-development/inbox/.',
     'fileAction': {'approach': 'files', 'label': 'Use file storage'},
     'legacy': r'firefl|otter|zoom|granola|fathom|recording|transcript|grain'},
    {'key': 'user-insights', 'type': 'User insights source',
     'example': 'e.g. Dovetail',
     'purpose': 'Research interviews and notes read from where they live',
     'without': 'Drop research files into product-development/inbox/ or paste them; /customize-os research-source records the choice.',
     'fileAction': None,
     'legacy': r'dovetail|usertesting|userzoom|maze'},
    {'key': 'knowledge-base', 'type': 'Knowledge base',
     'example': 'e.g. Notion, Confluence',
     'purpose': 'Claude reads your team documents where they live',
     'without': 'Paste or attach the document.',
     'fileAction': {'approach': 'files', 'label': 'Use file storage'},
     'legacy': r'notion|confluence|drive|sharepoint|coda|guru|document'},
    {'key': 'analytics', 'type': 'Product analytics',
     'example': 'e.g. Amplitude',
     'purpose': 'Metrics queried on demand',
     'without': "Export the numbers or paste a chart's data into analytics/metrics/.",
     'fileAction': None,
     'legacy': r'amplitude|mixpanel|posthog|pendo|heap'},
    {'key': 'feature-requests', 'type': 'Feature requests & customer insights',
     'example': 'e.g. Intercom',
     'purpose': 'The request pile read straight from your support / feedback tool',
     'without': 'Paste the pile of requests; dated records live in user-insights/feature-requests/.',
     'fileAction': {'approach': 'files', 'label': 'Use file storage'},
     'legacy': r'intercom|zendesk|productboard|canny|uservoice'},
    {'key': 'team-chat', 'type': 'Team chat',
     'example': 'e.g. Slack',
     'purpose': 'Drafts and updates posted to your chat',
     'without': 'Claude drafts, you paste.',
     'fileAction': None, 'legacy': r'slack|discord'},
    {'key': 'calendar', 'type': 'Calendar',
     'example': 'e.g. Google Calendar',
     'purpose': 'Daily and weekly plans read your real calendar',
     'without': 'You tell Claude your day.',
     'fileAction': None, 'legacy': r'calendar|outlook|gcal'},
]

_FILE_APPROACHES = {'files', 'screenshots', 'inbox-manual', 'manual', 'plain-html', 'external-prompts', 'claude-design'}

LIVE_COMMENT = 'All set — every user who connects can use it.'


def integrations_table(tc_surfaces, mcps, code):
    tc_by = {t['surface']: t for t in tc_surfaces}
    used = set()
    rows = []
    for s in SURFACES:
        key = s['key']
        if key == 'codebase':
            live = code['configured']
            rows.append({
                'key': key, 'type': s['type'], 'purpose': s['purpose'],
                'system': 'registered repos' if live else '',
                'systemEditable': False,
                'status': 'live' if live else 'todo',
                'comment': LIVE_COMMENT if live else s['without'],
                'actions': [] if live else [{'kind': 'prompt', 'label': 'Connect code base',
                                             'prompt': '/connect-code'}],
            })
            continue
        tc = tc_by.get(key)
        conn = tc.get('connection') if tc else None
        conn_live = bool(conn and (conn.get('status') or 'connected') == 'connected')
        legacy_hits = [m for m in mcps
                       if (m['category'] == key and (m['status'] or 'connected') == 'connected')
                       or (not m['category'] and s['legacy'] and re.search(s['legacy'], m['name'], re.I))]
        for m in legacy_hits:
            used.add(m['name'])
        live = conn_live or bool(legacy_hits)
        planned_system = (tc.get('system') if tc else '') or ''
        live_system = (conn.get('system') if conn_live and conn else '') \
            or (legacy_hits[0]['system'] or legacy_hits[0]['name'] if legacy_hits else '')
        approach = tc['choice'] if tc else 'undecided'
        file_based = approach in _FILE_APPROACHES and not live
        if live:
            status = 'live'
            comment = LIVE_COMMENT
        elif file_based:
            status = 'files'
            comment = 'Working file-based by choice — %s' % s['without']
        elif planned_system or approach == 'mcp':
            status = 'planned'
            comment = ('%s is the plan, but nothing is connected yet — %s'
                       % (planned_system or 'An MCP connection', s['without']))
        else:
            status = 'todo'
            comment = s['without']
        target = live_system or planned_system or s['type']
        acts = []
        if live:
            acts.append({'kind': 'prompt', 'label': 'Set up new MCP connection',
                         'prompt': '/connect-mcps connect to %s' % target})
        else:
            acts.append({'kind': 'prompt', 'label': 'Set up MCP connection',
                         'prompt': '/connect-mcps connect to %s' % target})
            if s['fileAction']:
                acts.append({'kind': 'files', 'label': s['fileAction']['label'],
                             'approach': s['fileAction']['approach']})
        rows.append({
            'key': key, 'type': s['type'], 'purpose': s['purpose'],
            'system': live_system if live else planned_system,
            'systemEditable': not live,
            'example': s.get('example') or '',
            'approach': approach,
            'status': status,
            'comment': comment,
            'connectionDate': (conn.get('date') if conn_live and conn else '') or '',
            'actions': acts,
        })
    other = [m['name'] for m in mcps if m['name'] not in used and m['category'] not in {s['key'] for s in SURFACES}]
    return {'rows': rows, 'other': other}


def demo_status():
    text = repo.read_text_or_null(DEMO_MANIFEST)
    if text is None:
        return {'present': False, 'path': DEMO_MANIFEST,
                'detail': 'No synthetic demo data in this instance.'}
    files = len(re.findall(r'^\s*-\s+', text, re.M))
    return {'present': True, 'path': DEMO_MANIFEST,
            'detail': 'Demo data present — the manifest records ~%d entries; /demo-data remove reverses it exactly.' % files}


def accounts_count():
    try:
        return len([e for e in repo.list_dir('product-development/product/customers/accounts')
                    if e['type'] == 'dir'])
    except Exception:
        return 0


def build():
    root_md = repo.read_text('CLAUDE.md')
    product = product_info(root_md)
    gov = governance.build()
    tc = actions.toolchain_surfaces()
    mcps = mcp_connections()
    code = code_repos_configured()
    customization = repo.read_text_or_null('os-installation/customization-status.md')
    inits = initiatives.list_pages()
    learn = learnings.build()

    steer = steering_status()
    tmpl = templates_status(customization)
    integ = integrations_table(tc, mcps, code)
    demo = demo_status()
    auto_on = gov['autoSync']['on']

    # Per-tab progress; demo data is deliberately outside the meter (synthetic
    # data is not a goal state for a real instance).
    tabs = {
        'business': {'items': steer,
                     'done': len([s for s in steer if s['state'] == 'done']), 'total': len(steer)},
        'templates': {'phase': tmpl['phase'], 'customized': tmpl['customized'], 'items': tmpl['items'],
                      'done': 1 if tmpl['customized'] else 0, 'total': 1},
        'integrations': {'rows': integ['rows'], 'other': integ['other'],
                         'done': len([r for r in integ['rows'] if r['status'] in ('live', 'files')]),
                         'total': len(integ['rows'])},
        'autosync': {'on': auto_on, 'summary': gov['autoSync'],
                     'done': 1 if auto_on else 0, 'total': 1},
        'demo': demo,
    }
    prog_done = sum(tabs[k]['done'] for k in ('business', 'templates', 'integrations', 'autosync'))
    prog_total = sum(tabs[k]['total'] for k in ('business', 'templates', 'integrations', 'autosync'))

    st = gitlib.status_info()
    log = gitlib.log(1)
    last = log[0] if log else None

    return {
        'product': product,
        'setup': {
            'tabs': tabs,
            'steward': {'placeholder': gov['stewardPlaceholder'], 'name': gov.get('steward')},
            'health': gov['health'][0]['name'] if gov['health'] else None,
        },
        'toolchain': tc,
        'progress': {'done': prog_done, 'total': prog_total},
        'customization': {'path': 'os-installation/customization-status.md', 'text': customization[:4000]}
        if customization else None,
        'counts': {
            'initiatives': len([i for i in inits if i['status'] in ('active', 'exploring')]),
            'initiativesTotal': len(inits),
            'accounts': accounts_count(),
            'proposals': len(gov['proposals']),
            'learnings': len(learn['entries']),
            'mcps': len(mcps),
        },
        'autoSync': gov['autoSync'],
        'git': {
            'branch': st['branch'], 'ahead': st['ahead'], 'behind': st['behind'],
            'dirty': len(st['entries']),
            'lastCommit': {'sha': last['sha'], 'subject': last['subject'], 'date': last['date']} if last else None,
        },
    }
