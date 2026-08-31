// Templates adapter — the governed scaffold registry. Copy, don't edit in place:
// "Use" stamps a copy at the right destination; editing the template itself is a
// gated steering change (the save is the approval).
import path from 'node:path';
import * as gitlib from '../gitlib.js';
import * as md from '../mdparse.js';
import * as policy from '../policy.js';
import * as repo from '../repo.js';

export const DIR = 'product-development/product/handbook/templates';

// Destination suggestions with {tokens} the person fills in before creating.
const SUGGEST = {
  'prd-template.md': 'product-development/product/PRDs/{area}/{initiative}-prd.md',
  'initiative-page-template.md': 'product-development/product/initiatives/{slug}.md',
  'launch-checklist-template.md': 'product-development/product/launches/{slug}-launch-checklist.md',
  'retrospective-template.md': 'product-development/product/meetings/retros/{YYYY-MM-DD}-{slug}-retro.md',
  'interview-template.md': 'product-development/product/customers/accounts/{account}/calls/{YYYY-MM-DD}-interview.md',
  'competitor-teardown-template.md': 'product-development/product/competitive-research/competitors/{slug}/teardown.md',
  'competitive-area-matrix-template.md': 'product-development/product/competitive-research/competitive-matrix-{area}.md',
  'jobs-breakdown-template.md': 'product-development/product/PRDs/{area}/{initiative}-jobs-breakdown.md',
  'job-spec-template.md': 'product-development/product/PRDs/{area}/{initiative}-{job}-job-spec.md',
};

export function build() {
  const pol = policy.load();
  const descs = md.navDescriptions(DIR);
  const items = [];
  for (const e of repo.listDir(DIR)) {
    if (e.type !== 'file' || !e.name.endsWith('.md') || e.name === 'CLAUDE.md') continue;
    const text = repo.readTextOrNull(e.rel) || '';
    items.push({
      path: e.rel,
      name: e.name,
      title: md.firstHeading(text) || e.name.replace(/-template\.md$/, ''),
      desc: descs[e.rel] || '',
      tier: policy.tierFor(e.rel, pol).tier,
      suggest: SUGGEST[e.name] || 'product-development/{where-it-belongs}.md',
      lines: text.split('\n').length,
    });
  }
  return { dir: DIR, items };
}

export function use(templateRel, destRel, settings) {
  const template = repo.resolveSafe(templateRel).rel;
  if (!template.startsWith(DIR + '/')) throw repo.httpErr(400, 'not a template path');
  if (!repo.exists(template)) throw repo.httpErr(404, 'template not found');
  if (/[{}]/.test(destRel || '')) {
    throw repo.httpErr(400, 'fill in the {placeholders} in the destination path first');
  }
  const dest = repo.resolveSafe(destRel).rel;
  if (repo.exists(dest)) throw repo.httpErr(409, `${dest} already exists`);
  if (!dest.endsWith('.md')) throw repo.httpErr(400, 'destination must be a .md file');
  repo.writeText(dest, repo.readText(template));
  const commit = gitlib.commitPaths([dest], `console: new doc from ${path.posix.basename(template)}`);
  const push = gitlib.maybePush(settings);
  return { dest, commit, push };
}
