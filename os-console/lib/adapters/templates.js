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
  'account-context-template.md': 'product-development/product/customers/accounts/{account}/account-context.md',
  'jobs-breakdown-template.md': 'product-development/product/PRDs/{area}/{initiative}-jobs-breakdown.md',
  'job-spec-template.md': 'product-development/product/PRDs/{area}/{initiative}-{job}-job-spec.md',
};

// Display names. A template's own H1 is the one the filled document will carry, so
// it is written with {placeholder} tokens ("[Initiative] — J[N]: [job code-name]")
// and reads as noise in a card. Every surface that lists templates shows `label`;
// `title` stays the raw H1. Add a row here when you add a template.
const LABELS = {
  'prd-template.md': 'PRD',
  'jobs-breakdown-template.md': 'Jobs breakdown',
  'job-spec-template.md': 'Job spec',
  'interview-template.md': 'Customer interview',
  'retrospective-template.md': 'Retrospective',
  'initiative-page-template.md': 'Initiative page',
  'launch-checklist-template.md': 'Launch checklist',
  'account-context-template.md': 'Account context',
  'competitor-teardown-template.md': 'Competitor teardown',
  'competitive-area-matrix-template.md': 'Competitive area matrix',
};

/** Fallback label for a template no LABELS row covers: the filename, de-slugged. */
function labelFor(name) {
  if (LABELS[name]) return LABELS[name];
  const base = name.replace(/-template\.md$/, '').replace(/\.md$/, '').replace(/-/g, ' ');
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// Which of the Templates page's four groups a scaffold belongs to, and the order it
// reads in — `prds` is the definition chain, so it is deliberately not alphabetical.
// The Templates page's tabs and the Setup tab's sections both read this, which is what
// stops them drifting apart. Anything unlisted falls to `other` rather than vanishing.
// (The fourth group, `writing`, is the writing guides — read, not copied, so no row.)
const GROUPS = {
  'prd-template.md': 'prds',
  'jobs-breakdown-template.md': 'prds',
  'job-spec-template.md': 'prds',
  'interview-template.md': 'meetings',
  'retrospective-template.md': 'meetings',
};
const ORDER = ['prd-template.md', 'jobs-breakdown-template.md', 'job-spec-template.md',
  'interview-template.md', 'retrospective-template.md'];

function rank(name) {
  const i = ORDER.indexOf(name);
  return i === -1 ? ORDER.length : i;
}

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
      label: labelFor(e.name),
      group: GROUPS[e.name] || 'other',
      desc: descs[e.rel] || '',
      tier: policy.tierFor(e.rel, pol).tier,
      suggest: SUGGEST[e.name] || 'product-development/{where-it-belongs}.md',
      lines: text.split('\n').length,
    });
  }
  items.sort((a, b) => rank(a.name) - rank(b.name) || a.label.localeCompare(b.label));
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
