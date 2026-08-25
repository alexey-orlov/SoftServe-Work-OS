# Repo filesystem layer — every path the console touches goes through resolve_safe().
# Port of lib/repo.js — keep the two in lockstep (see os-console/CLAUDE.md).
import os
import re
import stat as statmod

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

TEXT_EXT = {'.md', '.yaml', '.yml', '.txt', '.sql', '.json', '.csv', '.html', '.js', '.mjs', '.cjs', '.css', '.sh'}
# The console only ever writes wiki-content file types — never scripts or hooks.
WRITE_EXT = {'.md', '.yaml', '.yml', '.txt', '.json', '.sql', '.csv'}
IMG_MIME = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
}


class HttpError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def http_err(status, message):
    return HttpError(status, message)


def _ext(rel):
    return os.path.splitext(rel)[1].lower()


def resolve_safe(rel):
    """Resolve a repo-root-relative path; refuse escapes and .git."""
    if not isinstance(rel, str) or rel.strip() == '':
        raise http_err(400, 'path required')
    cleaned = re.sub(r'^/+', '', rel.replace('\\', '/')).strip()
    abs_path = os.path.abspath(os.path.join(ROOT, cleaned))
    if abs_path != ROOT and not abs_path.startswith(ROOT + os.sep):
        raise http_err(400, 'path escapes the repo')
    out = os.path.relpath(abs_path, ROOT).replace(os.sep, '/')
    if out == '.':
        out = ''
    if out == '.git' or out.startswith('.git/'):
        raise http_err(403, '.git is off limits')
    return {'abs': abs_path, 'rel': out}


def exists(rel):
    try:
        return os.path.exists(resolve_safe(rel)['abs'])
    except Exception:
        return False


def stat_or_null(rel):
    try:
        return os.stat(resolve_safe(rel)['abs'])
    except Exception:
        return None


def mtime_ms(st):
    # ns/1e6, matching Node's stat.mtimeMs derivation bit-for-bit.
    return st.st_mtime_ns / 1e6 if st else None


def read_text(rel):
    abs_path = resolve_safe(rel)['abs']
    with open(abs_path, 'r', encoding='utf-8', errors='replace', newline='') as f:
        return f.read()


def read_text_or_null(rel):
    try:
        return read_text(rel)
    except Exception:
        return None


def write_text(rel, content):
    r = resolve_safe(rel)
    ext = _ext(r['rel'])
    if ext not in WRITE_EXT:
        raise http_err(400, 'the console does not write %s files' % (ext or 'extension-less'))
    os.makedirs(os.path.dirname(r['abs']), exist_ok=True)
    with open(r['abs'], 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    return r['rel']


# Directory listing with junk filtered out.
SKIP_NAMES = {'.git', '.DS_Store', 'node_modules', '_extracted-personal'}


def _name_key(name):
    # Approximates Node's localeCompare ordering: case-insensitive first,
    # lowercase before uppercase on ties.
    return (name.casefold(), name.swapcase())


def list_dir(rel):
    r = resolve_safe(rel or '.')
    st = os.stat(r['abs'])  # nonexistent path raises here, like Node's statSync
    if not statmod.S_ISDIR(st.st_mode):
        raise http_err(400, '%s is not a directory' % r['rel'])
    out = r['rel']
    entries = []
    for name in os.listdir(r['abs']):
        if name in SKIP_NAMES:
            continue
        p = os.path.join(r['abs'], name)
        try:
            s = os.stat(p)
        except Exception:
            continue
        is_dir = os.path.isdir(p)
        entries.append({
            'name': name,
            'rel': name if out in ('', '.') else '%s/%s' % (out, name),
            'type': 'dir' if is_dir else 'file',
            'size': None if is_dir else s.st_size,
            'mtimeMs': mtime_ms(s),
        })
    entries.sort(key=lambda e: (0 if e['type'] == 'dir' else 1,) + _name_key(e['name']))
    return entries


def glob_files(pattern):
    """Expand a shell-style glob (repo-relative, * ? and ** segments) to existing files."""
    segs = re.sub(r'^/+', '', pattern).split('/')
    frontier = ['']
    for i, seg in enumerate(segs):
        last = i == len(segs) - 1
        nxt = []
        for base in frontier:
            if seg == '**':
                # ** — match this dir and every descendant dir; files only collected at the end.
                stack = [base]
                dirs = []
                while stack:
                    d = stack.pop()
                    dirs.append(d)
                    try:
                        children = list_dir(d or '.')
                    except Exception:
                        continue
                    for c in children:
                        if c['type'] == 'dir':
                            stack.append(c['rel'])
                if last:
                    for d in dirs:
                        try:
                            children = list_dir(d or '.')
                        except Exception:
                            continue
                        for c in children:
                            if c['type'] == 'file':
                                nxt.append(c['rel'])
                else:
                    nxt.extend(dirs)
                continue
            rx = seg_glob_to_regex(seg)
            try:
                children = list_dir(base or '.')
            except Exception:
                continue
            for c in children:
                if not rx.match(c['name']):
                    continue
                if last and c['type'] == 'file':
                    nxt.append(c['rel'])
                if not last and c['type'] == 'dir':
                    nxt.append(c['rel'])
        frontier = nxt
    return sorted(set(frontier))


def seg_glob_to_regex(seg):
    out = ''
    for ch in seg:
        if ch == '*':
            out += '[^/]*'
        elif ch == '?':
            out += '[^/]'
        else:
            out += re.escape(ch)
    return re.compile('^%s$' % out)


def mime_for(rel):
    return IMG_MIME.get(_ext(rel))


def is_text_path(rel):
    base = os.path.basename(rel)
    if base in ('.gitignore', 'CODEOWNERS', 'LICENSE'):
        return True
    return _ext(rel) in TEXT_EXT
