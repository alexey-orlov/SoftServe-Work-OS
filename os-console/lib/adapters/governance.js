'use strict';
// Governance adapter — auto-sync state, the gated list with its human comments,
// pending proposals, and server-side enforcement signals. pageData() adds the
// reconciled "rule → what it covers → freshness" structure for the view.
const repo = require('../repo');
const policy = require('../policy');
const md = require('../mdparse');
const steering = require('./steering');

function proposals() {
  const out = [];
  try {
    for (const e of repo.listDir('governance/proposals')) {
      if (e.type !== 'file' || !e.name.endsWith('.md') || e.name === 'CLAUDE.md') continue;
      const text = repo.readTextOrNull(e.rel) || '';
      out.push({ path: e.rel, title: md.firstHeading(text) || e.name, mtimeMs: e.mtimeMs });
    }
  } catch { /* folder may not exist */ }
  out.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return out;
}

function healthReports() {
  const out = [];
  try {
    for (const e of repo.listDir('governance/health')) {
      if (e.type === 'file' && e.name !== 'CLAUDE.md') out.push({ path: e.rel, name: e.name, mtimeMs: e.mtimeMs });
    }
  } catch { /* fine */ }
  out.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return out;
}

function build() {
  const pol = policy.load();
  return {
    policyPath: policy.POLICY_PATH,
    autoSync: policy.autoSyncSummary(pol.settings),
    settings: pol.settings,
    steward: pol.steward,
    stewardPlaceholder: pol.steward.includes('['),
    reviewers: pol.reviewers,
    gated: pol.gated.map(({ pattern, heading, note }) => ({ pattern, heading, note })),
    livingPages: pol.livingPages,
    proposals: proposals(),
    health: healthReports(),
    enforcement: {
      codeowners: repo.exists('.github/CODEOWNERS'),
      wikiLintWorkflow: repo.exists('.github/workflows/wiki-lint.yml'),
    },
  };
}

// One entry per gated rule, joined with the steering files it currently covers:
// single-file rules become file rows; tree rules carry a live file count plus
// their notable steering files (title, _updated, last change).
function protectedList(steerRows) {
  const pol = policy.load();
  const notable = steerRows.filter((r) => r.group === 'core' || r.group === 'business');
  return pol.gated.map((g) => {
    const single = !/[*?]/.test(g.pattern);
    const files = notable
      .filter((r) => g.regex.test(r.path))
      .map(({ path, title, role, updatedHeader, lastChange }) => ({ path, title, role, updatedHeader, lastChange }));
    let count = null;
    if (!single) { try { count = repo.globFiles(g.pattern).length; } catch { /* fine */ } }
    return { pattern: g.pattern, heading: g.heading, note: g.note, single, files, count };
  });
}

// Everything the Gated files view needs in one payload.
function pageData() {
  const steerRows = steering.build().rows;
  return {
    ...build(),
    protected: protectedList(steerRows),
    living: steerRows
      .filter((r) => r.group === 'living')
      .map(({ path, title, role, updatedHeader, lastChange }) => ({ path, title, role, updatedHeader, lastChange })),
  };
}

module.exports = { build, pageData, proposals, healthReports };
