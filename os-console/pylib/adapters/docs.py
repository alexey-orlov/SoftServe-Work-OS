# Docs adapter — the customer-facing documentation as a black box. The ONLY
# contract with Documentation/ is the built site file and its public hash
# routes (#/section/article); nothing here reads content.js internals, and the
# console never writes docs (/docs-update is the one writer).
# Port of lib/adapters/docs.js — keep the two in lockstep.
import re

from .. import repo

SITE = 'Documentation/work-os-docs.html'
SRC = ['Documentation/src/content.js', 'Documentation/src/build.js']


def build():
    st = repo.stat_or_null(SITE)
    if st is None:
        return {'exists': False, 'path': SITE}
    html = repo.read_text(SITE)

    # Section tabs are static markup in the built site — derive the nav from them;
    # fall back to the two known sections if the markup ever changes shape.
    sections = []
    seen = set()
    for m in re.finditer(r'<a class="tab" data-section="([a-z0-9_-]+)" href="(#/[^"]*)"[^>]*>([^<]+)</a>', html):
        if m.group(1) in seen:
            continue
        seen.add(m.group(1))
        sections.append({'id': m.group(1), 'href': m.group(2), 'title': m.group(3).strip()})
    if not sections:
        sections = [{'id': 'overview', 'href': '#/overview', 'title': 'Overview'},
                    {'id': 'setup', 'href': '#/setup', 'title': 'Setup'}]

    src_stats = [repo.stat_or_null(p) for p in SRC]
    src_mtime_ms = max([0] + [repo.mtime_ms(s) for s in src_stats if s])
    title = re.search(r'<title>([^<]*)</title>', html)
    return {
        'exists': True,
        'path': SITE,
        'title': title.group(1) if title else 'Documentation',
        'sections': sections,
        # 1s slack: the build writes the site moments after reading the source.
        'stale': src_mtime_ms > repo.mtime_ms(st) + 1000,
        'builtMtimeMs': repo.mtime_ms(st),
        'srcMtimeMs': src_mtime_ms,
    }
