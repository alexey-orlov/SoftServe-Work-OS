# Skills adapter — the team's guided programs (.claude/skills/*/SKILL.md) as
# data: /-command, description, group, argument hint. The /-command comes from
# the folder name (the discovery rule); frontmatter carries the rest. Grouping
# vocabulary lives in .claude/skills/CLAUDE.md — the friendly labels here must
# match its table.
import re

from .. import repo

SKILLS_DIR = '.claude/skills'

# group key -> [title, covers] — mirrors the table in .claude/skills/CLAUDE.md.
GROUPS = {
    'communication-ops': ['Communication & ops', 'Meeting processing, decision logging, status updates and digests, personal planning'],
    'definition': ['Definition', 'Strategy, PRDs, metric definitions, impact sizing, experiment design, and the critique passes that stress-test them'],
    'delivery': ['Delivery', 'Turning a spec into tickets, code and a shipped launch — plus what the shipped code actually does'],
    'discovery-market': ['Discovery: market', 'Competitor teardowns, market environment scans, sizing'],
    'discovery-customers': ['Discovery: customers', 'Interview prep and cross-interview synthesis'],
    'discovery-analytics': ['Discovery: analytics', 'Retention, activation and funnel reads against the warehouse'],
    'prototyping': ['Prototyping', 'Sketches, clickable prototypes, prototype critique and feedback rounds, journey maps'],
    'os-admin': ['OS admin & governance', 'Setting the OS up, and keeping the repo honest before and after a feature ships'],
}


def _frontmatter(text):
    """The leading --- block as {key: value}. Light parser for the repo's own
    frontmatter convention (single-line values, continuations indented)."""
    lines = (text or '').split('\n')
    if not lines or lines[0].strip() != '---':
        return {}
    out, key = {}, None
    for line in lines[1:]:
        if line.strip() == '---':
            break
        m = re.match(r'^([A-Za-z][\w-]*):\s*(.*)$', line)
        if m:
            key = m.group(1).lower()
            out[key] = m.group(2).strip()
        elif key and line.startswith((' ', '\t')):
            out[key] = (out[key] + ' ' + line.strip()).strip()
    for k, v in out.items():
        if len(v) >= 2 and v[0] == v[-1] and v[0] in '"\'':
            out[k] = v[1:-1]
    return out


def build():
    items = []
    try:
        entries = repo.list_dir(SKILLS_DIR)
    except Exception:
        return {'skills': [], 'groups': GROUPS}
    for e in entries:
        if e['type'] != 'dir':
            continue
        rel = '%s/SKILL.md' % e['rel']
        text = repo.read_text_or_null(rel)
        if text is None:
            continue
        fm = _frontmatter(text)
        desc = fm.get('description', '')
        # The description's first sentence is the one-liner; the rest is the
        # routing contract (when to use / NOT for) shown in the detail panel.
        first = re.split(r'(?<=[.!?])\s+', desc, maxsplit=1)[0] if desc else ''
        items.append({
            'name': e['name'],                       # the /-command
            'path': rel,
            'group': fm.get('group', '') or 'ungrouped',
            'summary': first[:220],
            'description': desc,
            'hint': fm.get('argument-hint', ''),
        })
    items.sort(key=lambda s: s['name'])
    return {'skills': items, 'groups': GROUPS}
