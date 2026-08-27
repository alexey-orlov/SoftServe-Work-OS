# Markdown parsing helpers for the wiki's house conventions:
# _key: value_ metadata lines, ## sections, CLAUDE.md navigation bullets.
import posixpath
import re
from datetime import datetime, timezone

from . import repo


def first_heading(text):
    m = re.search(r'^#\s+(.+?)\s*$', text or '', re.M)
    return m.group(1) if m else None


def meta_lines(text):
    """Leading `_status: ..._` style metadata lines (searched in the first 20 lines)."""
    out = {}
    for line in (text or '').split('\n')[:20]:
        m = re.match(r'^_([a-z-]+(?:\(s\))?):\s*(.*?)_?\s*$', line, re.I)
        if m:
            out[m.group(1).lower()] = m.group(2).strip()
    return out


def sections(text):
    """Split into ## sections: [{name, body}] (text before the first ## lands in name '')."""
    out = []
    name = ''
    buf = []
    for line in (text or '').split('\n'):
        m = re.match(r'^##\s+(.+?)\s*$', line)
        if m:
            out.append({'name': name, 'body': '\n'.join(buf)})
            name = m.group(1)
            buf = []
        else:
            buf.append(line)
    out.append({'name': name, 'body': '\n'.join(buf)})
    return out


def section(text, wanted):
    for s in sections(text):
        if s['name'].lower() == wanted.lower():
            return s['body']
    return ''


def bullets(body):
    out = []
    for l in (body or '').split('\n'):
        m = re.match(r'^\s*-\s+(.*)$', l)
        if m:
            out.append(m.group(1).strip())
    return out


def md_links(s):
    return [{'label': m.group(1), 'href': m.group(2)}
            for m in re.finditer(r'\[([^\]]*)\]\(([^)\s]+)\)', s or '')]


def pending_markers(s):
    return [m.group(1).strip() for m in re.finditer(r'\[PENDING:\s*([^\]]+)\]', s or '')]


def resolve_href(from_rel, href):
    """Resolve a relative markdown href against the file it appears in -> repo-relative path."""
    if re.match(r'^[a-z][a-z0-9+.-]*:', href, re.I) or href.startswith('#'):
        return None  # external / anchor
    clean = href.split('#')[0]
    if not clean:
        return None
    return posixpath.normpath(posixpath.join(posixpath.dirname(from_rel), clean))


def nav_descriptions(dir_rel):
    """A folder's CLAUDE.md nav bullets -> map of child rel path -> one-line description."""
    nav_path = '%s/CLAUDE.md' % dir_rel if dir_rel else 'CLAUDE.md'
    text = repo.read_text_or_null(nav_path)
    if text is None:
        return {}
    out = {}
    for b in bullets(text):
        links = md_links(b)
        if not links:
            continue
        target = resolve_href(nav_path, links[0]['href'])
        if not target:
            continue
        desc = '—'.join(b.split('—')[1:]).strip()
        out[target.rstrip('/')] = desc or ''
    return out


def intro(text):
    """First real paragraph after the H1 — used as a folder/file blurb."""
    lines = (text or '').split('\n')
    i = 0
    while i < len(lines) and not re.match(r'^#\s', lines[i]):
        i += 1
    i += 1
    buf = []
    while i < len(lines):
        l = lines[i].strip()
        if not l:
            if buf:
                break
            i += 1
            continue
        if re.match(r'^[#>_\-|]', l) or l.startswith('**Read'):
            if buf:
                break
            i += 1
            continue
        buf.append(l)
        i += 1
    joined = ' '.join(buf)
    joined = re.sub(r'\[([^\]]*)\]\(([^)]+)\)', r'\1', joined)  # markdown links -> their label
    joined = re.sub(r'[*_`]', '', joined)
    return joined[:300]


def placeholder_count(text):
    """Bracketed placeholders that are not markdown links: [Your Company], [N],
    [GAP: ...] — the shared population signal (setup page, steering page)."""
    if not text:
        return 0
    return len(re.findall(r'\[[^\][\n]+\](?!\()', text))


def today():
    return datetime.now(timezone.utc).strftime('%Y-%m-%d')
