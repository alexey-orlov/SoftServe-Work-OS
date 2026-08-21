'use strict';
// Governance adapter — auto-sync state, the gated list with its human comments,
// pending proposals, and server-side enforcement signals.
const repo = require('../repo');
const policy = require('../policy');
const md = require('../mdparse');

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

module.exports = { build, proposals, healthReports };
