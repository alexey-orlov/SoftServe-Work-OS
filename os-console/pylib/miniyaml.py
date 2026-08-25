# YAML loading for the Python console runtime. The Node runtime uses vendored
# js-yaml; this is a small dependency-free parser covering the subset the OS
# registries actually use: block mappings/sequences, nested blocks, quoted +
# plain scalars, flow [] / {}, comments, booleans/ints/floats/null, and bare
# dates (coerced to the same ISO string JSON.stringify makes of js-yaml's Date
# objects). Anchors, tags, and multi-doc streams are out of scope — the
# registries never use them. Deliberately NOT PyYAML: PyYAML's YAML-1.1
# semantics (datetime.date objects, on/off booleans) diverge from js-yaml and
# datetime objects would break JSON serialization. Parity-checked against
# js-yaml over the repo's YAML corpus.
import re
from datetime import datetime, timezone


def load(text):
    return parse(text)

_BOOL = {'true': True, 'True': True, 'TRUE': True, 'false': False, 'False': False, 'FALSE': False}
_NULL = {'null', 'Null', 'NULL', '~'}
_INT_RE = re.compile(r'^[+-]?\d+$')
_FLOAT_RE = re.compile(r'^[+-]?(\d+\.\d*|\.\d+|\d+)([eE][+-]?\d+)$|^[+-]?(\d+\.\d*|\.\d+)$')
_DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
_TS_RE = re.compile(r'^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$')


def _iso_like_jsyaml(s):
    """js-yaml's default schema turns bare dates/timestamps into JS Date objects,
    which JSON.stringify renders as e.g. 2026-08-20T00:00:00.000Z — match that."""
    if _DATE_RE.match(s):
        return s + 'T00:00:00.000Z'
    try:
        cleaned = re.sub(r'\.(\d{6})\d+', r'.\1', s.replace(' ', 'T', 1).replace('Z', '+00:00'))
        dt = datetime.fromisoformat(cleaned)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt = dt.astimezone(timezone.utc)
        return dt.strftime('%Y-%m-%dT%H:%M:%S.') + '%03dZ' % (dt.microsecond // 1000)
    except ValueError:
        return s


def parse(text):
    lines = text.split('\n')
    value, _ = _parse_block(lines, 0, 0)
    return value


def _indent_of(line):
    stripped = line.lstrip(' ')
    return len(line) - len(stripped), stripped


def _skippable(line):
    s = line.strip()
    return s == '' or s.startswith('#')


def _strip_comment(s):
    quote = None
    i = 0
    while i < len(s):
        c = s[i]
        if quote:
            if quote == '"' and c == '\\':
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in ('"', "'"):
            quote = c
        elif c == '#' and (i == 0 or s[i - 1] in ' \t'):
            return s[:i].rstrip()
        i += 1
    return s.rstrip()


def _parse_block(lines, i, min_indent):
    while i < len(lines) and _skippable(lines[i]):
        i += 1
    if i >= len(lines):
        return None, i
    indent, content = _indent_of(lines[i])
    if indent < min_indent:
        return None, i
    if content == '-' or content.startswith('- '):
        return _parse_seq(lines, i, indent)
    return _parse_map(lines, i, indent)


def _parse_seq(lines, i, indent):
    out = []
    while i < len(lines):
        if _skippable(lines[i]):
            i += 1
            continue
        ind, content = _indent_of(lines[i])
        if ind != indent or not (content == '-' or content.startswith('- ')):
            break
        rest = _strip_comment(content[1:].lstrip())
        if rest == '':
            val, i = _parse_block(lines, i + 1, indent + 1)
            out.append(val)
            continue
        key_pos = _map_split(rest)
        if key_pos is not None:
            # "- key: value" — a mapping item; continuation keys sit at the
            # column where the inline key starts.
            key_col = ind + (len(content) - len(content[1:].lstrip()))
            item, i = _seq_map_item(lines, i, key_col, rest, key_pos)
            out.append(item)
            continue
        out.append(_scalar(rest))
        i += 1
    return out, i


def _seq_map_item(lines, i, key_col, first_line, key_pos):
    item = {}
    key = _unquote_key(first_line[:key_pos].strip())
    rest = _strip_comment(first_line[key_pos + 1:].strip())
    i += 1
    if rest == '':
        val, i = _parse_block(lines, i, key_col + 1)
        if val is None:
            val, i = _same_indent_seq(lines, i, key_col)
        item[key] = val
    elif rest in ('|', '|-', '|+', '>', '>-', '>+'):
        item[key], i = _block_scalar(lines, i, key_col, rest)
    else:
        item[key] = _scalar(rest)
    more, i = _parse_map_lines(lines, i, key_col)
    item.update(more)
    return item, i


def _same_indent_seq(lines, i, indent):
    """YAML allows a block sequence at its parent key's own indentation
    (`steps:` / `- checkout: ...`). Called when nothing deeper was found."""
    j = i
    while j < len(lines) and _skippable(lines[j]):
        j += 1
    if j < len(lines):
        ind, content = _indent_of(lines[j])
        if ind == indent and (content == '-' or content.startswith('- ')):
            return _parse_seq(lines, j, ind)
    return None, i


def _parse_map(lines, i, indent):
    return _parse_map_lines(lines, i, indent)


def _parse_map_lines(lines, i, indent):
    out = {}
    while i < len(lines):
        if _skippable(lines[i]):
            i += 1
            continue
        ind, content = _indent_of(lines[i])
        if ind != indent or content == '-' or content.startswith('- '):
            break
        content = _strip_comment(content)
        if content == '':
            i += 1
            continue
        key_pos = _map_split(content)
        if key_pos is None:
            break  # not a mapping line — stop rather than guess
        key = _unquote_key(content[:key_pos].strip())
        rest = content[key_pos + 1:].strip()
        if rest == '':
            val, i = _parse_block(lines, i + 1, ind + 1)
            if val is None:
                val, i = _same_indent_seq(lines, i, ind)
            out[key] = val
            continue
        if rest in ('|', '|-', '|+', '>', '>-', '>+'):
            val, i = _block_scalar(lines, i + 1, ind, rest)
            out[key] = val
            continue
        out[key] = _scalar(rest)
        i += 1
    return out, i


def _map_split(s):
    """Position of the ':' separating key from value, or None."""
    quote = None
    for idx, c in enumerate(s):
        if quote:
            if quote == '"' and c == '\\':
                continue
            if c == quote:
                quote = None
        elif c in ('"', "'") and idx == 0:
            quote = c
        elif c == ':' and (idx + 1 == len(s) or s[idx + 1] in ' \t'):
            return idx
    return None


def _unquote_key(k):
    if len(k) >= 2 and k[0] == k[-1] and k[0] in ('"', "'"):
        return k[1:-1]
    return k


def _block_scalar(lines, i, parent_indent, marker):
    folded = marker[0] == '>'
    chomp = marker[1] if len(marker) > 1 else ''
    body = []
    base = None
    while i < len(lines):
        line = lines[i]
        if line.strip() == '':
            body.append('')
            i += 1
            continue
        ind, _ = _indent_of(line)
        if ind <= parent_indent:
            break
        if base is None:
            base = ind
        body.append(line[base:])
        i += 1
    while body and body[-1] == '':
        body.pop()
    text = (' '.join(body) if folded else '\n'.join(body))
    if chomp != '-':
        text += '\n'
    return text, i


def _split_flow(s):
    parts = []
    depth = 0
    quote = None
    buf = ''
    for c in s:
        if quote:
            buf += c
            if quote == '"' and c == '\\':
                quote = '"\\'
                continue
            if quote == '"\\':
                quote = '"'
                continue
            if c == quote:
                quote = None
            continue
        if c in ('"', "'"):
            quote = c
            buf += c
        elif c in '[{':
            depth += 1
            buf += c
        elif c in ']}':
            depth -= 1
            buf += c
        elif c == ',' and depth == 0:
            parts.append(buf)
            buf = ''
        else:
            buf += c
    if buf.strip() != '':
        parts.append(buf)
    return [p.strip() for p in parts]


def _scalar(s):
    s = s.strip()
    if s == '':
        return None
    if s[0] == '"':
        return _double_quoted(s)
    if s[0] == "'":
        end = _single_end(s)
        return s[1:end].replace("''", "'")
    if s[0] == '[':
        inner = s[1:s.rindex(']')] if ']' in s else s[1:]
        if inner.strip() == '':
            return []
        return [_scalar(p) for p in _split_flow(inner)]
    if s[0] == '{':
        inner = s[1:s.rindex('}')] if '}' in s else s[1:]
        if inner.strip() == '':
            return {}
        out = {}
        for part in _split_flow(inner):
            pos = _map_split(part) if _map_split(part) is not None else part.find(':')
            if pos < 0:
                out[_unquote_key(part)] = None
            else:
                out[_unquote_key(part[:pos].strip())] = _scalar(part[pos + 1:].strip())
        return out
    if s in _BOOL:
        return _BOOL[s]
    if s in _NULL:
        return None
    if _INT_RE.match(s):
        return int(s)
    if _FLOAT_RE.match(s):
        return float(s)
    if _DATE_RE.match(s) or _TS_RE.match(s):
        return _iso_like_jsyaml(s)
    return s


def _double_quoted(s):
    out = []
    i = 1
    while i < len(s):
        c = s[i]
        if c == '\\' and i + 1 < len(s):
            n = s[i + 1]
            out.append({'n': '\n', 't': '\t', 'r': '\r', '"': '"', '\\': '\\'}.get(n, '\\' + n))
            i += 2
            continue
        if c == '"':
            break
        out.append(c)
        i += 1
    return ''.join(out)


def _single_end(s):
    i = 1
    while i < len(s):
        if s[i] == "'":
            if i + 1 < len(s) and s[i + 1] == "'":
                i += 2
                continue
            return i
        i += 1
    return len(s)
