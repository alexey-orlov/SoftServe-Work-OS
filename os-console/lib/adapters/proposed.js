'use strict';
// Proposed changes adapter — everything waiting for a human in one place:
// open pull requests, the gated-change proposals inbox, health reports, and
// the weekly review reports.
const repo = require('../repo');
const prs = require('./prs');
const governance = require('./governance');

const REPORTS_DIR = 'product-development/product/reports';

function weeklyReports() {
  try {
    return repo.listDir(REPORTS_DIR)
      .filter((e) => e.type === 'file' && e.name !== 'CLAUDE.md' && /weekly/i.test(e.name))
      .map((e) => ({ path: e.rel, name: e.name, mtimeMs: e.mtimeMs }))
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, 10);
  } catch { return []; }
}

function build(force) {
  return {
    prs: prs.openPrs(force),
    proposals: governance.proposals(),
    health: governance.healthReports(),
    weeklyReports: weeklyReports(),
  };
}

module.exports = { build };
