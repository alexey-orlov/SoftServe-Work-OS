# Home adapter — setup & health at a glance. Every signal is DERIVED from
# observable repo state (placeholders, undecided keys, absent on-demand files),
# so the dashboard can never disagree with reality.
import re

from .. import gitlib
from .. import mdparse as md
from .. import miniyaml
from .. import repo
from . import governance
from . import initiatives
from . import learnings

BI = 'product-development/product/strategy/business-context/business-info.md'


def placeholder_count(text):
    """Bracketed placeholders that are not markdown links: [Your Company], [N], [GAP: ...]"""
    if not text:
        return 0
    return len(re.findall(r'\[[^\][\n]+\](?!\()', text))


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


def toolchain_state():
    out = []
    try:
        doc = miniyaml.load(repo.read_text('product-development/toolchain.yaml')) or {}
        if not isinstance(doc, dict):
            return out
        for key, val in doc.items():
            if not isinstance(val, dict):
                continue
            choice = val.get('approach') or val.get('source') or 'undecided'
            params = val.get('params')
            command = ('/customize-os design-system' if key == 'prototyping'
                       else '/customize-os research-source' if key == 'user-research'
                       else '/customize-os')
            out.append({
                'surface': key,
                'choice': choice,
                'decided': choice != 'undecided',
                'decidedDate': val.get('decided') or None,
                'notes': val.get('notes') or '',
                'params': params if isinstance(params, dict) and params else None,
                'command': command,
            })
    except Exception:
        pass  # fine
    return out


def mcp_connections():
    try:
        return [{'name': re.sub(r'\.md$', '', e['name']), 'path': e['rel'], 'mtimeMs': e['mtimeMs']}
                for e in repo.list_dir('os-installation/mcp-integration-logs')
                if e['type'] == 'file' and e['name'] != 'CLAUDE.md']
    except Exception:
        return []


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
    """Population status per steering file — placeholders + GAP markers left."""
    out = []
    for key, label, path in STEERING_FILES:
        text = repo.read_text_or_null(path)
        if text is None:
            out.append({'key': key, 'label': label, 'path': path, 'exists': False,
                        'gaps': None, 'state': 'todo', 'detail': 'File is missing.'})
            continue
        if key == 'claude-md':
            scope = (md.section(text, 'Company & Product Fundamentals')
                     + md.section(text, 'Team') + md.section(text, 'Slack Channels'))
            gaps = placeholder_count(scope)
            what = 'fundamentals block, team roster and channels'
        else:
            gaps = placeholder_count(text) + len(re.findall(r'\[GAP:', text))
            what = 'placeholders / GAP markers'
        state = 'done' if gaps == 0 else 'partial' if gaps <= 10 else 'todo'
        out.append({'key': key, 'label': label, 'path': path, 'exists': True, 'gaps': gaps,
                    'state': state,
                    'detail': 'Populated — no placeholders left.' if gaps == 0
                    else '%d %s left.' % (gaps, what)})
    return out


def templates_status(customization):
    """Each template + the customization program's phase for the templates target."""
    from . import templates as templates_adapter
    phase = None
    if customization:
        m = re.search(r'^\|\s*\d+\s*\|\s*templates\s*\|\s*([^|]+)\|', customization, re.M | re.I)
        phase = m.group(1).strip() if m else None
    try:
        items = templates_adapter.build()['items']
    except Exception:
        items = []
    return {'phase': phase, 'items': [
        {'name': t['name'], 'title': t['title'], 'path': t['path'], 'desc': t['desc']}
        for t in items]}


def integrations_status(tc, mcps, code):
    """The six named integration surfaces, resolved from toolchain, MCP logs and code registry."""
    def logs(pattern):
        return [m['name'] for m in mcps if re.search(pattern, m['name'], re.I)]

    tc_by = {t['surface']: t for t in tc}
    out = []

    proto = tc_by.get('prototyping')
    out.append({'key': 'design-system', 'label': 'Design system MCP',
                'state': 'done' if (proto and proto['decided']) else 'todo',
                'detail': ('Prototyping grounding: %s.' % proto['choice']) if (proto and proto['decided'])
                else 'No standing design-system choice — /prototype will ask every time.',
                'command': '/customize-os design-system'})
    out.append({'key': 'codebase', 'label': 'Code base access',
                'state': 'done' if code['configured'] else 'todo',
                'detail': 'Real repos registered in code-repos.yaml.' if code['configured']
                else 'code-repos.yaml still carries example entries — /code-qa has nothing real to ground on.',
                'command': '/connect-code'})
    kb = logs(r'notion|confluence|drive|sharepoint|coda|guru|document')
    out.append({'key': 'knowledge-base', 'label': 'Knowledge base MCP',
                'state': 'done' if kb else 'todo',
                'detail': 'Connected: %s.' % ', '.join(kb) if kb else 'No knowledge-base connection logged.',
                'command': '/connect-mcps'})
    mt = logs(r'firefl|otter|zoom|teams|granola|fathom|recording|transcript|meet')
    ur = tc_by.get('user-research')
    out.append({'key': 'meeting-transcripts', 'label': 'Meeting transcripts MCP',
                'state': 'done' if mt else 'partial' if (ur and ur['decided']) else 'todo',
                'detail': 'Connected: %s.' % ', '.join(mt) if mt
                else ('Research source decided (%s) but no transcript tool connected.' % ur['choice'])
                if (ur and ur['decided']) else 'No transcript-tool connection logged.',
                'command': '/connect-mcps'})
    cal = logs(r'calendar|outlook|gcal')
    out.append({'key': 'calendar', 'label': 'Calendar MCP',
                'state': 'done' if cal else 'todo',
                'detail': 'Connected: %s.' % ', '.join(cal) if cal else 'No calendar connection logged.',
                'command': '/connect-mcps'})
    tt = logs(r'linear|jira|asana|monday|clickup|boards|ado|tracker')
    out.append({'key': 'task-tracker', 'label': 'Task tracker MCP',
                'state': 'done' if tt else 'todo',
                'detail': 'Connected: %s.' % ', '.join(tt) if tt else 'No task-tracker connection logged.',
                'command': '/connect-mcps'})
    known = set(kb + mt + cal + tt)
    other = [m['name'] for m in mcps if m['name'] not in known]
    return {'items': out, 'other': other}


def accounts_count():
    try:
        return len([e for e in repo.list_dir('product-development/product/customers/accounts')
                    if e['type'] == 'dir'])
    except Exception:
        return 0


def build():
    root_md = repo.read_text('CLAUDE.md')
    product = product_info(root_md)
    team_section = md.section(root_md, 'Team')
    bi_text = repo.read_text_or_null(BI)
    gov = governance.build()
    tc = toolchain_state()
    mcps = mcp_connections()
    code = code_repos_configured()
    customization = repo.read_text_or_null('os-installation/customization-status.md')
    inits = initiatives.list_pages()
    learn = learnings.build()

    bi_gaps = None if bi_text is None else placeholder_count(bi_text) + len(re.findall(r'\[GAP:', bi_text))

    steps = []

    def step(step_id, title, state, detail, command):
        steps.append({'id': step_id, 'title': title, 'state': state, 'detail': detail, 'command': command})

    step('customize', 'Guided customization',
         'partial' if customization else 'todo',
         'Program started — status file below tracks where it stands.' if customization
         else 'The one guided sequence: context, initiatives, naming, templates, sync mode.',
         '/customize-os')
    step('context', 'Business context populated',
         'todo' if bi_text is None else 'done' if bi_gaps == 0 else 'partial' if bi_gaps <= 10 else 'todo',
         'business-info.md is missing.' if bi_text is None
         else 'No placeholders left in business-info.md.' if bi_gaps == 0
         else '%d placeholders / GAP markers left in business-info.md.' % bi_gaps,
         '/customize-os')
    step('fundamentals', 'Root fundamentals block',
         'done' if product['placeholders'] == 0 else 'partial' if product['placeholders'] <= 3 else 'todo',
         'The block every session loads is filled.' if product['placeholders'] == 0
         else '%d placeholders in the root CLAUDE.md fundamentals block (mirror of business-info.md).' % product['placeholders'],
         None)
    step('roster', 'Team roster & channels',
         'todo' if re.search(r'\[(Your Name|Name|github|slack-id|id|team)\]',
                             team_section + md.section(root_md, 'Slack Channels')) else 'done',
         'The Team and Slack tables in the root CLAUDE.md.', '/connect-mcps')
    for t in tc:
        step('toolchain-%s' % t['surface'], 'Toolchain: %s' % t['surface'],
             'done' if t['decided'] else 'todo',
             'Decided: %s.' % t['choice'] if t['decided'] else 'Standing choice not made — consuming skills will ask every time.',
             None if t['decided'] else t['command'])
    step('mcps', 'Tools connected (MCPs)',
         'done' if mcps else 'todo',
         '%d connection%s logged: %s.' % (len(mcps), 's' if len(mcps) > 1 else '', ', '.join(m['name'] for m in mcps))
         if mcps else 'No MCP integrations logged yet.',
         '/connect-mcps')
    step('code', 'Product code connected',
         'done' if code['configured'] else 'todo',
         'Real repos registered in code-repos.yaml.' if code['configured']
         else 'code-repos.yaml still carries example entries — /code-qa has nothing real to ground on.',
         '/connect-code')
    step('autosync', 'Auto-sync',
         'done' if gov['autoSync']['on'] else 'todo',
         gov['autoSync']['label'],
         None if gov['autoSync']['on'] else '/auto-sync on direct')
    step('steward', 'Steward & reviewers set',
         'todo' if gov['stewardPlaceholder'] else 'done',
         'write-policy.yaml still names "[Your Name]" as steward.' if gov['stewardPlaceholder']
         else 'Steward: %s.' % gov['steward'],
         None)
    step('lint', 'First health check',
         'done' if gov['health'] else 'todo',
         'Latest report: %s.' % gov['health'][0]['name'] if gov['health'] else 'No /wiki-lint report yet.',
         '/wiki-lint')

    done = len([s for s in steps if s['state'] == 'done'])
    st = gitlib.status_info()
    log = gitlib.log(1)
    last = log[0] if log else None

    return {
        'product': product,
        'steps': steps,
        'setup': {
            'steering': steering_status(),
            'templates': templates_status(customization),
            'integrations': integrations_status(tc, mcps, code),
            'steward': {'placeholder': gov['stewardPlaceholder'], 'name': gov.get('steward')},
            'health': gov['health'][0]['name'] if gov['health'] else None,
        },
        'toolchain': tc,
        'progress': {'done': done, 'total': len(steps)},
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
