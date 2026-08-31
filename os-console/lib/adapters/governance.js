// Governance adapter — auto-sync state, the gated list with its human comments,
// pending proposals, and server-side enforcement signals. pageData() adds the
// reconciled "rule → what it covers → freshness" structure for the view.
import * as gitlib from '../gitlib.js';
import * as md from '../mdparse.js';
import * as policy from '../policy.js';
import * as repo from '../repo.js';
import * as steering from './steering.js';

export function proposals() {
  const out = [];
  try {
    for (const e of repo.listDir('governance/proposals')) {
      if (e.type !== 'file' || !e.name.endsWith('.md') || e.name === 'CLAUDE.md') continue;
      const text = repo.readTextOrNull(e.rel) || '';
      out.push({
        path: e.rel,
        title: md.firstHeading(text) || e.name,
        intro: md.intro(text),
        mtimeMs: e.mtimeMs,
      });
    }
  } catch { /* folder may not exist */ }
  out.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return out;
}

export function healthReports() {
  const out = [];
  try {
    for (const e of repo.listDir('governance/health')) {
      if (e.type === 'file' && e.name !== 'CLAUDE.md') {
        out.push({ path: e.rel, name: e.name, mtimeMs: e.mtimeMs });
      }
    }
  } catch { /* folder may not exist */ }
  out.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return out;
}

export function build() {
  const pol = policy.load();
  return {
    policyPath: policy.POLICY_PATH,
    autoSync: policy.autoSyncSummary(pol.settings),
    settings: pol.settings,
    steward: pol.steward,
    stewardPlaceholder: pol.steward.includes('['),
    reviewers: pol.reviewers,
    gated: pol.gated.map((g) => ({ pattern: g.pattern, heading: g.heading, note: g.note })),
    livingPages: pol.livingPages,
    proposals: proposals(),
    health: healthReports(),
    enforcement: {
      codeowners: repo.exists('.github/CODEOWNERS'),
      wikiLintWorkflow: repo.exists('.github/workflows/wiki-lint.yml'),
    },
  };
}

/** One entry per gated rule, joined with the steering files it currently covers:
 *  single-file rules become file rows; tree rules carry a live file count plus
 *  their notable steering files (title, _updated, last change). */
export function protectedList(steerRows) {
  const pol = policy.load();
  const notable = steerRows.filter((r) => r.group === 'core' || r.group === 'business');
  const out = [];
  for (const g of pol.gated) {
    const single = !/[*?]/.test(g.pattern);
    const files = notable.filter((r) => g.regex.test(r.path)).map((r) => ({
      path: r.path,
      title: r.title,
      role: r.role,
      updatedHeader: r.updatedHeader,
      lastChange: r.lastChange,
    }));
    let count = null;
    if (!single) {
      try {
        count = repo.globFiles(g.pattern).length;
      } catch { /* unglobbable pattern — leave the count unknown */ }
    }
    out.push({ pattern: g.pattern, heading: g.heading, note: g.note, single, files, count });
  }
  return out;
}

/** Everything the Gated files view needs in one payload. */
export function pageData() {
  const steerRows = steering.build().rows;
  const out = build();
  out.protected = protectedList(steerRows);
  out.provider = gitlib.provider();
  out.groups = [
    { id: 'steering', label: 'Steering files' },
    { id: 'system', label: 'System rules' },
  ];
  return out;
}
