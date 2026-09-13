// Proposed changes adapter — everything waiting for a human in one place:
// open pull requests, the gated-change proposals inbox, health reports, and
// the weekly review reports.
import * as gitlib from '../gitlib.js';
import * as repo from '../repo.js';
import * as governance from './governance.js';
import * as prs from './prs.js';

const REPORTS_DIR = 'product-development/product/reports';

export function weeklyReports() {
  let entries;
  try {
    entries = repo.listDir(REPORTS_DIR);
  } catch {
    return [];
  }
  const out = entries
    .filter((e) => e.type === 'file' && e.name !== 'CLAUDE.md' && /weekly/i.test(e.name))
    .map((e) => ({ path: e.rel, name: e.name, mtimeMs: e.mtimeMs }));
  out.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return out.slice(0, 10);
}

/** Two symmetric queues: changes proposed by team members (human PRs) and
 *  automatically proposed changes (the proposals inbox + bot PRs).
 *  opts.noPrs — leave the platform CLI alone (the snapshot builder, run at turn
 *  end by the hook: no network, and a deterministic file per source commit). */
export function build(force, opts = {}) {
  const openAll = opts.noPrs
    ? { available: false, provider: gitlib.provider(), items: [],
      note: 'Pull requests are not baked into this snapshot — open the full console for the live list' }
    : prs.allOpen(force);
  const human = openAll.items.filter((p) => !p.isBot);
  const bots = openAll.items.filter((p) => p.isBot);
  return {
    prs: {
      available: openAll.available,
      provider: openAll.provider,
      note: openAll.note,
      items: human,
    },
    auto: { proposals: governance.proposals(), botPrs: bots },
    permissions: opts.noPrs
      ? { provider: openAll.provider, canMerge: null, login: null, note: null }
      : prs.permissions(),
    health: governance.healthReports(),
    weeklyReports: weeklyReports(),
  };
}
