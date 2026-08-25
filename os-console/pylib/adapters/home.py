# Home adapter — setup & health at a glance. Every signal is DERIVED from
# observable repo state (placeholders, undecided keys, absent on-demand files),
# so the dashboard can never disagree with reality.
# Port of lib/adapters/home.js — keep the two in lockstep.
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
