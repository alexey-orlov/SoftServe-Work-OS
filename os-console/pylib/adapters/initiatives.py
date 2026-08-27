# Initiatives adapter — joins the living initiative pages with feature-index.yaml.
# The pages and the index stay canonical; this module only reads and does
# surgical line edits (status, attach, create) that a person would make by hand.
import posixpath
import re

from .. import gitlib
from .. import mdparse as md
from .. import miniyaml
from .. import repo

DIR = 'product-development/product/initiatives'
PD = 'product-development'
TEMPLATE = 'product-development/product/handbook/templates/initiative-page-template.md'
STATUS_ORDER = {'active': 0, 'exploring': 1, 'paused': 2, 'shipped': 3, 'killed': 4}


def normalize_artifact_path(p):
    if not p or re.match(r'^https?:', p, re.I):
        return None
    clean = re.sub(r'^\./', '', p)
    if repo.exists(clean):
        return clean
    in_pd = '%s/%s' % (PD, clean)
    return in_pd if repo.exists(in_pd) else clean  # keep best guess; exists flag tells the truth


def parse_artifact_bullets(page_rel, body):
    out = []
    for b in md.bullets(body):
        label = b.split(':')[0].replace('**', '').strip()
        idx = b.find(':')
        rest = b[idx + 1:].strip()
        links = md.md_links(b)
        pendings = md.pending_markers(b)
        if not links and not pendings:
            if rest and rest not in ('-', '—'):
                out.append({'label': label, 'kind': 'note', 'text': rest})
            continue
        for l in links:
            if re.match(r'^https?:', l['href'], re.I):
                out.append({'label': label, 'kind': 'url', 'text': l['label'] or l['href'], 'url': l['href']})
                continue
            target = md.resolve_href(page_rel, l['href'])
            if target:
                out.append({'label': label, 'kind': 'file', 'path': target, 'exists': repo.exists(target)})
        for p in pendings:
            norm = normalize_artifact_path(p)
            out.append({'label': label, 'kind': 'pending', 'path': norm or p,
                        'exists': repo.exists(norm) if norm else False})
    return out


def _is_template_placeholder(b):
    """A template's bracketed guidance bullet, not real content: [Optional, ...]"""
    return b.startswith('[') and '](' not in b


def parse_instructions(body):
    """The ## Instructions section as plain text ('' when empty or still template)."""
    text = (body or '').strip()
    if not text or text == '-':
        return ''
    bullets_ = md.bullets(body)
    if bullets_ and all(_is_template_placeholder(b) or b == '-' for b in bullets_):
        return ''
    return text[:600]


def parse_sources(rel, body):
    """Ordered source-of-truth entries — order IS priority (first wins on conflict)."""
    out = []
    for b in md.bullets(body):
        if b in ('-', '—') or _is_template_placeholder(b):
            continue
        note = ''
        links = md.md_links(b)
        if links:
            l = links[0]
            after = b.split(')', 1)[1] if ')' in b else ''
            m = re.search(r'—\s*(.+)$', after)
            note = m.group(1).strip() if m else ''
            if re.match(r'^https?:', l['href'], re.I):
                out.append({'kind': 'url', 'label': l['label'] or l['href'], 'href': l['href'], 'note': note})
            else:
                target = md.resolve_href(rel, l['href'])
                out.append({'kind': 'path', 'label': l['label'] or posixpath.basename(target or l['href']),
                            'href': target or l['href'], 'note': note,
                            'exists': repo.exists(target) if target else False})
        else:
            m = re.match(r'^(.*?)(?:\s+—\s*(.+))?$', b)
            token = (m.group(1) if m else b).strip()
            note = (m.group(2) or '').strip() if m else ''
            if re.match(r'^https?:', token, re.I):
                out.append({'kind': 'url', 'label': token, 'href': token, 'note': note})
            elif repo.exists(token):
                out.append({'kind': 'path', 'label': posixpath.basename(token), 'href': token,
                            'note': note, 'exists': True})
            else:
                out.append({'kind': 'text', 'label': token, 'href': '', 'note': note})
    return out


def feature_index_join():
    index = {}  # slug -> [{area, feature, artifacts: []}]
    try:
        fi = miniyaml.load(repo.read_text('%s/feature-index.yaml' % PD)) or {}
    except Exception:
        return index
    if not isinstance(fi, dict):
        return index
    for area, feats in fi.items():
        if not isinstance(feats, dict):
            continue
        for feature, spec in feats.items():
            if not isinstance(spec, dict):
                continue
            inits = spec.get('initiatives') if isinstance(spec.get('initiatives'), list) else []
            if not inits:
                continue
            artifacts = []

            def push(v, key, subkey=None):
                if not isinstance(v, str):
                    return
                if re.match(r'^https?:', v, re.I):
                    artifacts.append({'key': subkey or key, 'kind': 'url', 'url': v})
                elif '/' in v:
                    norm = normalize_artifact_path(v)
                    artifacts.append({'key': subkey or key, 'kind': 'file', 'path': norm, 'exists': repo.exists(norm)})
                else:
                    artifacts.append({'key': subkey or key, 'kind': 'ref', 'text': v})

            for key, val in spec.items():
                if key == 'initiatives':
                    continue
                if isinstance(val, list):
                    for v in val:
                        push(v, key)
                elif isinstance(val, dict):
                    for k, v in val.items():
                        push(v, key, '%s · %s' % (key, k))
                else:
                    push(val, key)
            for slug in inits:
                index.setdefault(slug, []).append({'area': area, 'feature': feature, 'artifacts': artifacts})
    return index


def parse_page(rel):
    text = repo.read_text(rel)
    slug = posixpath.basename(rel)[:-3] if rel.endswith('.md') else posixpath.basename(rel)
    meta = md.meta_lines(text)
    title = md.first_heading(text) or slug
    status_text = meta.get('status', '')
    parts = re.split(r'[\s—-]', status_text)
    status_word = (parts[0] if parts and parts[0] else 'active').lower()
    targets = [{'area': m.group(1), 'feature': m.group(2)}
               for m in re.finditer(r'feature-index\.yaml#([a-z0-9_-]+)\.([a-z0-9_-]+)', text[:1500], re.I)]
    artifacts = parse_artifact_bullets(rel, md.section(text, 'Artifacts'))
    decisions = []
    for b in md.bullets(md.section(text, 'Decisions')):
        links = []
        for l in md.md_links(b):
            path = md.resolve_href(rel, l['href'])
            if path:
                links.append({'label': l['label'], 'path': path})
        decisions.append({'text': b, 'links': links})
    return {
        'slug': slug, 'rel': rel, 'title': title,
        'isExample': bool(re.match(r'^EXAMPLE', title, re.I)) or 'Synthetic worked example' in text,
        'status': status_word if status_word in STATUS_ORDER else 'active',
        'statusText': status_text,
        'updated': meta.get('updated', ''),
        'owner': meta.get('owner', ''),
        'targets': targets,
        'snapshot': md.section(text, 'Snapshot').strip(),
        'scope': md.section(text, 'Scope & goal').strip(),
        'instructions': parse_instructions(md.section(text, 'Instructions')),
        'sources': parse_sources(rel, md.section(text, 'Sources')),
        'artifacts': artifacts,
        'decisions': decisions,
        'openLoops': [b for b in md.bullets(md.section(text, 'Open loops')) if b != '-'],
        'activity': md.bullets(md.section(text, 'Activity'))[:12],
        'artifactStats': {
            'present': len([a for a in artifacts if a['kind'] in ('file', 'pending') and a.get('exists')]),
            'missing': len([a for a in artifacts if a['kind'] in ('file', 'pending') and not a.get('exists')]),
        },
    }


def list_pages():
    join = feature_index_join()
    items = []
    for e in repo.list_dir(DIR):
        if e['type'] != 'file' or not e['name'].endswith('.md') or e['name'] == 'CLAUDE.md':
            continue
        try:
            page = parse_page(e['rel'])
            page['features'] = join.get(page['slug'], [])
            items.append(page)
        except Exception:
            pass  # unreadable page — skip rather than break the view
    items.sort(key=lambda p: str(p['updated']), reverse=True)
    items.sort(key=lambda p: STATUS_ORDER[p['status']])
    return items


def reverse_index():
    """path -> [initiative slugs] — lets the file viewer say "linked from initiative X"."""
    out = {}
    for it in list_pages():
        paths = set()
        for a in it['artifacts']:
            if a.get('path'):
                paths.add(a['path'])
        for d in it['decisions']:
            for l in d['links']:
                paths.add(l['path'])
        for f in it.get('features') or []:
            for a in f['artifacts']:
                if a.get('path'):
                    paths.add(a['path'])
        for p in paths:
            out.setdefault(p, []).append(it['slug'])
    return out


def replace_meta_line(text, key, new_line):
    pattern = re.compile(r'^_%s:.*$' % re.escape(key), re.M)
    if pattern.search(text):
        return pattern.sub(lambda m: new_line, text, count=1)
    return text


def set_status(slug, status, note, settings):
    rel = '%s/%s.md' % (DIR, slug)
    if not repo.exists(rel):
        raise repo.http_err(404, 'no initiative page %s' % slug)
    allowed = ['exploring', 'active', 'paused', 'shipped', 'killed']
    if status not in allowed:
        raise repo.http_err(400, 'status must be one of %s' % ', '.join(allowed))
    text = repo.read_text(rel)
    text = replace_meta_line(text, 'status', '_status: %s%s_' % (status, ' — %s' % note if note else ''))
    text = replace_meta_line(text, 'updated', '_updated: %s_' % md.today())
    repo.write_text(rel, text)
    commit = gitlib.commit_paths([rel], 'console: %s status → %s' % (slug, status))
    push = gitlib.maybe_push(settings)
    return {'page': parse_page(rel), 'commit': commit, 'push': push}


def attach(slug, target_rel, label, settings):
    rel = '%s/%s.md' % (DIR, slug)
    if not repo.exists(rel):
        raise repo.http_err(404, 'no initiative page %s' % slug)
    target = repo.resolve_safe(target_rel)['rel']
    if not repo.exists(target):
        raise repo.http_err(404, '%s does not exist' % target)
    rel_link = posixpath.relpath(target, DIR)
    bullet = '- %s: [%s](%s)' % (label or 'Artifact', posixpath.basename(target), rel_link)
    lines = repo.read_text(rel).split('\n')
    start = next((i for i, l in enumerate(lines) if re.match(r'^##\s+Artifacts\s*$', l)), -1)
    if start == -1:
        raise repo.http_err(400, 'page has no ## Artifacts section')
    end = len(lines)
    for i in range(start + 1, len(lines)):
        if re.match(r'^##\s+', lines[i]):
            end = i
            break
    insert_at = end
    while insert_at > start + 1 and lines[insert_at - 1].strip() == '':
        insert_at -= 1
    lines.insert(insert_at, bullet)
    text = '\n'.join(lines)
    text = replace_meta_line(text, 'updated', '_updated: %s_' % md.today())
    repo.write_text(rel, text)
    commit = gitlib.commit_paths([rel], 'console: attach %s to %s' % (posixpath.basename(target), slug))
    push = gitlib.maybe_push(settings)
    return {'page': parse_page(rel), 'commit': commit, 'push': push}


def _replace_section(text, name, body_lines):
    """Replace a ## section's body (creating the section before ## Artifacts, or at
    the end, when the page predates it). Returns the new text."""
    lines = text.split('\n')
    start = next((i for i, l in enumerate(lines) if re.match(r'^##\s+%s\s*$' % re.escape(name), l)), -1)
    if start == -1:
        anchor = next((i for i, l in enumerate(lines) if re.match(r'^##\s+Artifacts\s*$', l)), len(lines))
        block = ['## %s' % name, ''] + body_lines + ['']
        return '\n'.join(lines[:anchor] + block + lines[anchor:])
    end = len(lines)
    for i in range(start + 1, len(lines)):
        if re.match(r'^##\s+', lines[i]):
            end = i
            break
    return '\n'.join(lines[:start + 1] + [''] + body_lines + [''] + lines[end:])


INSTRUCTIONS_MAX = 400  # hard cap — steering, not documentation (template rule)


def set_instructions(slug, instr, settings):
    rel = '%s/%s.md' % (DIR, slug)
    if not repo.exists(rel):
        raise repo.http_err(404, 'no initiative page %s' % slug)
    instr = (instr or '').strip()
    if len(instr) > INSTRUCTIONS_MAX:
        raise repo.http_err(400, 'instructions are capped at %d characters (%d given) — this is steering, not documentation'
                            % (INSTRUCTIONS_MAX, len(instr)))
    body = instr.split('\n') if instr else ['-']
    text = _replace_section(repo.read_text(rel), 'Instructions', body)
    text = replace_meta_line(text, 'updated', '_updated: %s_' % md.today())
    repo.write_text(rel, text)
    commit = gitlib.commit_paths([rel], 'console: %s instructions %s' % (slug, 'updated' if instr else 'cleared'))
    push = gitlib.maybe_push(settings)
    return {'page': parse_page(rel), 'commit': commit, 'push': push}


def set_sources(slug, items, settings):
    """Rewrite ## Sources from an ordered list — order IS priority, so the same
    endpoint covers add, remove, and drag-reorder."""
    rel = '%s/%s.md' % (DIR, slug)
    if not repo.exists(rel):
        raise repo.http_err(404, 'no initiative page %s' % slug)
    if not isinstance(items, list) or len(items) > 30:
        raise repo.http_err(400, 'items must be a list (max 30)')
    bullets_ = []
    for it in items:
        if not isinstance(it, dict):
            raise repo.http_err(400, 'each source is {href, label?, note?} or {text}')
        href = (it.get('href') or '').strip()
        label = (it.get('label') or '').strip()
        note = (it.get('note') or '').strip()
        text_only = (it.get('text') or '').strip()
        if not href and text_only:
            bullet = '- %s' % text_only
            if note:
                bullet += ' — %s' % note
            bullets_.append(bullet)
            continue
        if not href:
            raise repo.http_err(400, 'a source needs a link or path')
        if re.match(r'^https?://', href, re.I):
            bullet = '- [%s](%s)' % (label or href, href)
        else:
            target = repo.resolve_safe(href)['rel']
            rel_link = posixpath.relpath(target, DIR)
            bullet = '- [%s](%s)' % (label or posixpath.basename(target), rel_link)
        if note:
            bullet += ' — %s' % note
        bullets_.append(bullet)
    text = _replace_section(repo.read_text(rel), 'Sources', bullets_ or ['-'])
    text = replace_meta_line(text, 'updated', '_updated: %s_' % md.today())
    repo.write_text(rel, text)
    commit = gitlib.commit_paths([rel], 'console: %s sources — %d entr%s' % (slug, len(bullets_), 'y' if len(bullets_) == 1 else 'ies'))
    push = gitlib.maybe_push(settings)
    return {'page': parse_page(rel), 'commit': commit, 'push': push}


def create(slug, title, settings):
    if not re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', slug or ''):
        raise repo.http_err(400, 'slug must be kebab-case (a-z, 0-9, dashes)')
    if not title or not title.strip():
        raise repo.http_err(400, 'title required')
    rel = '%s/%s.md' % (DIR, slug)
    if repo.exists(rel):
        raise repo.http_err(409, '%s already exists' % slug)
    text = repo.read_text(TEMPLATE)
    text = re.sub(r'^#\s+\[Initiative Name\]\s*$', lambda m: '# %s' % title.strip(), text, count=1, flags=re.M)
    text = replace_meta_line(text, 'status', '_status: exploring — page created from the console; fill the snapshot next_')
    text = replace_meta_line(text, 'updated', '_updated: %s_' % md.today())
    text = re.sub(r'\n<!--[\s\S]*?-->\s*$', '\n', text, count=1, flags=re.M)  # template-rules comment: "delete when filling"
    repo.write_text(rel, text)

    # Navigation rule: append a one-line entry to the END of the folder's CLAUDE.md list.
    nav_rel = '%s/CLAUDE.md' % DIR
    nav_lines = repo.read_text(nav_rel).split('\n')
    last_entry = -1
    for i, l in enumerate(nav_lines):
        if re.match(r'^-\s+\[', l):
            last_entry = i
    entry = '- [%s.md](%s.md) — %s (created from the console)' % (slug, slug, title.strip())
    if last_entry >= 0:
        nav_lines.insert(last_entry + 1, entry)
    else:
        nav_lines.append(entry)
    repo.write_text(nav_rel, '\n'.join(nav_lines))

    commit = gitlib.commit_paths([rel, nav_rel], 'console: new initiative %s' % slug)
    push = gitlib.maybe_push(settings)
    return {'page': parse_page(rel), 'commit': commit, 'push': push}
