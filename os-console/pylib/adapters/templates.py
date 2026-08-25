# Templates adapter — the governed scaffold registry. Copy, don't edit in place:
# "Use" stamps a copy at the right destination; editing the template itself is a
# gated steering change (the save is the approval).
import posixpath
import re

from .. import gitlib
from .. import mdparse as md
from .. import policy
from .. import repo

DIR = 'product-development/product/handbook/templates'

# Destination suggestions with {tokens} the person fills in before creating.
SUGGEST = {
    'prd-template.md': 'product-development/product/PRDs/{area}/{slug}-prd.md',
    'initiative-page-template.md': 'product-development/product/initiatives/{slug}.md',
    'launch-checklist-template.md': 'product-development/product/launches/{slug}-launch-checklist.md',
    'retrospective-template.md': 'product-development/product/meetings/retros/{YYYY-MM-DD}-{slug}-retro.md',
    'interview-template.md': 'product-development/product/customers/accounts/{account}/calls/{YYYY-MM-DD}-interview.md',
    'competitor-teardown-template.md': 'product-development/product/competitive-research/competitors/{slug}/teardown.md',
    'competitive-area-matrix-template.md': 'product-development/product/competitive-research/competitive-matrix-{area}.md',
    'jobs-breakdown-template.md': 'product-development/product/PRDs/{area}/{initiative}-jobs-breakdown.md',
    'job-spec-template.md': 'product-development/product/PRDs/{area}/{initiative}-{job}-job-spec.md',
}


def build():
    pol = policy.load()
    descs = md.nav_descriptions(DIR)
    items = []
    for e in repo.list_dir(DIR):
        if e['type'] != 'file' or not e['name'].endswith('.md') or e['name'] == 'CLAUDE.md':
            continue
        text = repo.read_text_or_null(e['rel']) or ''
        items.append({
            'path': e['rel'],
            'name': e['name'],
            'title': md.first_heading(text) or re.sub(r'-template\.md$', '', e['name']),
            'desc': descs.get(e['rel'], ''),
            'tier': policy.tier_for(e['rel'], pol)['tier'],
            'suggest': SUGGEST.get(e['name'], 'product-development/{where-it-belongs}.md'),
            'lines': len(text.split('\n')),
        })
    return {'dir': DIR, 'items': items}


def use(template_rel, dest_rel, settings):
    template = repo.resolve_safe(template_rel)['rel']
    if not template.startswith(DIR + '/'):
        raise repo.http_err(400, 'not a template path')
    if not repo.exists(template):
        raise repo.http_err(404, 'template not found')
    if re.search(r'[{}]', dest_rel or ''):
        raise repo.http_err(400, 'fill in the {placeholders} in the destination path first')
    dest = repo.resolve_safe(dest_rel)['rel']
    if repo.exists(dest):
        raise repo.http_err(409, '%s already exists' % dest)
    if not dest.endswith('.md'):
        raise repo.http_err(400, 'destination must be a .md file')
    repo.write_text(dest, repo.read_text(template))
    commit = gitlib.commit_paths([dest], 'console: new doc from %s' % posixpath.basename(template))
    push = gitlib.maybe_push(settings)
    return {'dest': dest, 'commit': commit, 'push': push}
