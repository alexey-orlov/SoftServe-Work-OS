# Markdown parsing helpers for the wiki's house conventions:
# fenced YAML frontmatter (Link Architecture v2), legacy _key: value_ metadata
# lines, ## sections, CLAUDE.md navigation bullets.
#
# DUAL-READ IS PERMANENT: deployed instances converge to frontmatter gradually
# (via /wiki-lint auto-fixes), so the legacy italic-meta fallback must never be
# removed — page_meta() reads both, frontmatter winning per key.
import posixpath
import re
from datetime import datetime, timezone

from . import miniyaml
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


_FENCE_SCAN = 60  # frontmatter is small; the closing --- must appear this early


def frontmatter(text):
    """Fenced YAML frontmatter at the very top ('---' ... '---') -> dict.
    {} when absent or unparseable. Keys per governance/link-schema.yaml."""
    t = text or ''
    lines = t.split('\n')
    if not lines or lines[0].strip() != '---':
        return {}
    for i in range(1, min(len(lines), _FENCE_SCAN)):
        if lines[i].strip() == '---':
            try:
                doc = miniyaml.load('\n'.join(lines[1:i]))
            except Exception:
                return {}
            return doc if isinstance(doc, dict) else {}
    return {}


def strip_frontmatter(text):
    """Text with the leading fenced frontmatter removed (unchanged when absent)."""
    t = text or ''
    lines = t.split('\n')
    if not lines or lines[0].strip() != '---':
        return t
    for i in range(1, min(len(lines), _FENCE_SCAN)):
        if lines[i].strip() == '---':
            return '\n'.join(lines[i + 1:])
    return t


def page_meta(text):
    """Unified page metadata: legacy italic `_key: value_` lines overlaid by fenced
    YAML frontmatter (frontmatter wins per key). Keys lowercased. Values may be
    lists (link keys: areas, features, initiatives, customers, competitors)."""
    out = meta_lines(text)
    for k, v in frontmatter(text).items():
        out[str(k).lower()] = v
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
    [GAP: ...] — the shared population signal (setup page, steering page).
    Frontmatter is excluded — YAML inline lists ([billing]) are data, not gaps."""
    if not text:
        return 0
    return len(re.findall(r'\[[^\][\n]+\](?!\()', strip_frontmatter(text)))


def today():
    return datetime.now(timezone.utc).strftime('%Y-%m-%d')
