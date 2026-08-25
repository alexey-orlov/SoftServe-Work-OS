# Team learnings adapter — .claude/team-learnings.md (gated: a save is the approval).
# Port of lib/adapters/learnings.js — keep the two in lockstep.
import re

from .. import gitlib
from .. import mdparse as md
from .. import repo

FILE = '.claude/team-learnings.md'
CAP_LINES = 30  # the file's own stated budget: "hard cap ~30 lines of entries"


def build():
    text = repo.read_text_or_null(FILE)
    if text is None:
        return {'path': FILE, 'exists': False, 'entries': [], 'capLines': CAP_LINES}
    body = md.section(text, 'Entries')
    entries = []
    for b in md.bullets(body):
        m = re.match(r'^(\d{4}-\d{2}-\d{2})\s*[—-]+\s*(.*)$', b)
        entries.append({'date': m.group(1), 'text': m.group(2)} if m else {'date': None, 'text': b})
    return {
        'path': FILE,
        'exists': True,
        'entries': entries,
        'seedNote': 'seed examples' in body,
        'entryLines': len(entries),
        'capLines': CAP_LINES,
    }


def add(text, settings):
    clean = re.sub(r'\s+', ' ', (text or '').strip())
    if len(clean) < 8:
        raise repo.http_err(400, 'a learning needs at least a sentence')
    if len(clean) > 400:
        raise repo.http_err(400, 'keep it to one line (≤400 chars) — that is the format')
    raw = repo.read_text(FILE)
    if not raw.endswith('\n'):
        raw += '\n'
    raw += '- %s — %s\n' % (md.today(), clean)
    repo.write_text(FILE, raw)
    commit = gitlib.commit_paths([FILE], 'console: team learning added')
    push = gitlib.maybe_push(settings)
    out = build()
    out.update({'commit': commit, 'push': push})
    return out
