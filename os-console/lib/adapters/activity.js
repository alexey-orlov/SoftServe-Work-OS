'use strict';
// Activity adapter — recent repo history with friendly area labels.
const repo = require('../repo');
const git = require('../git');

// Ordered longest-prefix map: repo path → friendly area name.
const AREA_MAP = [
  ['product-development/product/PRDs', 'PRDs'],
  ['product-development/product/initiatives', 'Initiatives'],
  ['product-development/product/customers', 'Customers'],
  ['product-development/product/decisions', 'Decisions'],
  ['product-development/product/strategy', 'Strategy'],
  ['product-development/product/competitive-research', 'Competitive'],
  ['product-development/product/meetings', 'Meetings'],
  ['product-development/product/handbook', 'Handbook'],
  ['product-development/product/launches', 'Launches'],
  ['product-development/product/planning', 'Planning'],
  ['product-development/product/reports', 'Reports'],
  ['product-development/product/prototypes', 'Prototypes'],
  ['product-development/product', 'Product'],
  ['product-development/analytics', 'Analytics'],
  ['product-development/engineering', 'Engineering'],
  ['product-development/inbox', 'Inbox'],
  ['product-development', 'Product dev'],
  ['governance', 'Governance'],
  ['os-installation', 'OS install'],
  ['Documentation', 'Docs site'],
  ['.claude', 'Automation'],
  ['.github', 'CI'],
  ['os-console', 'Console'],
];

function areaFor(p) {
  for (const [prefix, label] of AREA_MAP) {
    if (p === prefix || p.startsWith(prefix + '/')) return label;
  }
  return 'Root';
}

function prefixOf(subject) {
  const m = (subject || '').match(/^([a-z]+)(?:\([^)]*\))?!?:/i);
  return m ? m[1].toLowerCase() : null;
}

function build(limit) {
  const commits = git.log(Math.min(Number(limit) || 120, 400)).map((c) => ({
    sha: c.sha,
    date: c.date,
    author: c.author,
    subject: c.subject,
    prefix: prefixOf(c.subject),
    files: c.files.map((f) => ({ ...f, area: areaFor(f.path) })),
  }));
  const st = git.statusInfo();
  const ledgerText = repo.readTextOrNull('governance/processed.txt') || '';
  return {
    commits,
    status: {
      branch: st.branch, ahead: st.ahead, behind: st.behind,
      uncommitted: st.entries.map((e) => ({ ...e, area: areaFor(e.path) })),
    },
    ledger: {
      path: 'governance/processed.txt',
      count: ledgerText.split('\n').filter((l) => l.trim()).length,
    },
  };
}

module.exports = { build, areaFor };
