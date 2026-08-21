'use strict';
// Steering adapter — the files that steer every agent session, in one flat list.
// Derived from the write policy (gated tier + living-pages), never hardcoded lists.
const path = require('path');
const repo = require('../repo');
const gitlib = require('../git');
const policy = require('../policy');
const md = require('../mdparse');

const BC_DIR = 'product-development/product/strategy/business-context';

const CORE = [
  { path: 'CLAUDE.md', role: 'Root steering — loads every session: fundamentals, doc index, the four rules' },
  { path: 'product-development/feature-index.yaml', role: 'The product map — every feature → its artifacts' },
  { path: 'product-development/toolchain.yaml', role: 'Standing tool/approach choices, one key per surface' },
  { path: '.claude/team-learnings.md', role: 'Cross-cutting agent rules — injected at every session start' },
  { path: 'governance/write-policy.yaml', role: 'The write policy itself — tiers list + auto-sync switchboard' },
];

function row(rel, role, group, pol) {
  const text = repo.isTextPath(rel) ? repo.readTextOrNull(rel) : null;
  const meta = text ? md.metaLines(text) : {};
  return {
    path: rel,
    exists: repo.exists(rel),
    title: text ? (md.firstHeading(text) || path.posix.basename(rel)) : path.posix.basename(rel),
    role: role || '',
    group,
    tier: policy.tierFor(rel, pol).tier,
    updatedHeader: meta.updated || null,
    lastChange: repo.exists(rel) ? gitlib.lastChangeIso(rel) : null,
    lines: text ? text.split('\n').length : null,
  };
}

function build() {
  const pol = policy.load();
  const rows = [];

  for (const c of CORE) rows.push(row(c.path, c.role, 'core', pol));

  let bcDescs = {};
  try { bcDescs = md.navDescriptions(BC_DIR); } catch { /* fine */ }
  try {
    for (const e of repo.listDir(BC_DIR)) {
      if (e.type !== 'file' || e.name === 'CLAUDE.md') continue;
      rows.push(row(e.rel, bcDescs[e.rel] || 'Business context', 'business', pol));
    }
  } catch { /* folder missing on a stripped install */ }

  const seen = new Set(rows.map((r) => r.path));
  for (const pattern of pol.livingPages) {
    for (const rel of repo.globFiles(pattern)) {
      if (seen.has(rel) || rel.endsWith('/CLAUDE.md')) continue;
      seen.add(rel);
      const isInitiative = rel.startsWith('product-development/product/initiatives/');
      rows.push(row(rel, isInitiative ? 'Initiative page (see Initiatives view)' : 'Living page — edit in place, keep current', 'living', pol));
    }
  }

  return { rows, steward: pol.steward, policyPath: policy.POLICY_PATH };
}

module.exports = { build };
