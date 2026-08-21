'use strict';
// Home adapter — setup & health at a glance. Every signal is DERIVED from
// observable repo state (placeholders, undecided keys, absent on-demand files),
// so the dashboard can never disagree with reality.
const yaml = require('../../vendor/js-yaml.min.js');
const repo = require('../repo');
const git = require('../git');
const policy = require('../policy');
const md = require('../mdparse');
const initiatives = require('./initiatives');
const governance = require('./governance');
const learnings = require('./learnings');

const BI = 'product-development/product/strategy/business-context/business-info.md';

// Bracketed placeholders that are not markdown links: [Your Company], [N], [GAP: …]
function placeholderCount(text) {
  if (!text) return 0;
  const m = text.match(/\[[^\][\n]+\](?!\()/g);
  return m ? m.length : 0;
}

function productInfo(rootMd) {
  const fund = md.section(rootMd, 'Company & Product Fundamentals');
  const line = (fund.match(/\*\*Company \/ product:\*\*\s*(.+)/) || [])[1] || '';
  const name = line.split('—')[0].trim();
  return {
    line: line.trim(),
    name: name && !name.startsWith('[') ? name : null,
    placeholders: placeholderCount(fund),
  };
}

function toolchainState() {
  const out = [];
  try {
    const doc = yaml.load(repo.readText('product-development/toolchain.yaml')) || {};
    for (const [key, val] of Object.entries(doc)) {
      if (!val || typeof val !== 'object') continue;
      const choice = val.approach || val.source || 'undecided';
      out.push({
        surface: key,
        choice,
        decided: choice !== 'undecided',
        command: key === 'prototyping' ? '/customize-os design-system' : key === 'user-research' ? '/customize-os research-source' : '/customize-os',
      });
    }
  } catch { /* fine */ }
  return out;
}

function mcpConnections() {
  try {
    return repo.listDir('os-installation/mcp-integration-logs')
      .filter((e) => e.type === 'file' && e.name !== 'CLAUDE.md')
      .map((e) => ({ name: e.name.replace(/\.md$/, ''), path: e.rel, mtimeMs: e.mtimeMs }));
  } catch { return []; }
}

function codeReposConfigured() {
  const text = repo.readTextOrNull('product-development/engineering/code-repos.yaml');
  if (!text) return { present: false, configured: false };
  const remotes = [...text.matchAll(/^\s*remote:\s*(\S+)/gm)].map((m) => m[1]);
  const real = remotes.filter((r) => /^https?:\/\//.test(r) && !/your-org|example|acme/i.test(r));
  return { present: true, configured: real.length > 0, remotes: remotes.length };
}

function accountsCount() {
  try {
    return repo.listDir('product-development/product/customers/accounts')
      .filter((e) => e.type === 'dir').length;
  } catch { return 0; }
}

function build() {
  const rootMd = repo.readText('CLAUDE.md');
  const product = productInfo(rootMd);
  const teamSection = md.section(rootMd, 'Team');
  const biText = repo.readTextOrNull(BI);
  const gov = governance.build();
  const tc = toolchainState();
  const mcps = mcpConnections();
  const code = codeReposConfigured();
  const customization = repo.readTextOrNull('os-installation/customization-status.md');
  const inits = initiatives.list();
  const learn = learnings.build();

  const biGaps = biText === null ? null : placeholderCount(biText) + (biText.match(/\[GAP:/g) || []).length;

  const steps = [];
  const step = (id, title, state, detail, command) => steps.push({ id, title, state, detail, command });

  step('customize', 'Guided customization',
    customization ? 'partial' : 'todo',
    customization ? 'Program started — status file below tracks where it stands.' : 'The one guided sequence: context, initiatives, naming, templates, sync mode.',
    '/customize-os');
  step('context', 'Business context populated',
    biText === null ? 'todo' : biGaps === 0 ? 'done' : biGaps <= 10 ? 'partial' : 'todo',
    biText === null ? 'business-info.md is missing.' : biGaps === 0 ? 'No placeholders left in business-info.md.' : `${biGaps} placeholders / GAP markers left in business-info.md.`,
    '/customize-os');
  step('fundamentals', 'Root fundamentals block',
    product.placeholders === 0 ? 'done' : product.placeholders <= 3 ? 'partial' : 'todo',
    product.placeholders === 0 ? 'The block every session loads is filled.' : `${product.placeholders} placeholders in the root CLAUDE.md fundamentals block (mirror of business-info.md).`,
    null);
  step('roster', 'Team roster & channels',
    /\[(Your Name|Name|github|slack-id|id|team)\]/.test(teamSection + md.section(rootMd, 'Slack Channels')) ? 'todo' : 'done',
    'The Team and Slack tables in the root CLAUDE.md.', '/connect-mcps');
  for (const t of tc) {
    step(`toolchain-${t.surface}`, `Toolchain: ${t.surface}`,
      t.decided ? 'done' : 'todo',
      t.decided ? `Decided: ${t.choice}.` : 'Standing choice not made — consuming skills will ask every time.',
      t.decided ? null : t.command);
  }
  step('mcps', 'Tools connected (MCPs)',
    mcps.length > 0 ? 'done' : 'todo',
    mcps.length > 0 ? `${mcps.length} connection${mcps.length > 1 ? 's' : ''} logged: ${mcps.map((m) => m.name).join(', ')}.` : 'No MCP integrations logged yet.',
    '/connect-mcps');
  step('code', 'Product code connected',
    code.configured ? 'done' : 'todo',
    code.configured ? 'Real repos registered in code-repos.yaml.' : 'code-repos.yaml still carries example entries — /code-qa has nothing real to ground on.',
    '/connect-code');
  step('autosync', 'Auto-sync',
    gov.autoSync.on ? 'done' : 'todo',
    gov.autoSync.label,
    gov.autoSync.on ? null : '/auto-sync on direct');
  step('steward', 'Steward & reviewers set',
    gov.stewardPlaceholder ? 'todo' : 'done',
    gov.stewardPlaceholder ? 'write-policy.yaml still names "[Your Name]" as steward.' : `Steward: ${gov.steward}.`,
    null);
  step('lint', 'First health check',
    gov.health.length > 0 ? 'done' : 'todo',
    gov.health.length > 0 ? `Latest report: ${gov.health[0].name}.` : 'No /wiki-lint report yet.',
    '/wiki-lint');

  const done = steps.filter((s) => s.state === 'done').length;
  const st = git.statusInfo();
  const last = git.log(1)[0] || null;

  return {
    product,
    steps,
    progress: { done, total: steps.length },
    customization: customization ? { path: 'os-installation/customization-status.md', text: customization.slice(0, 4000) } : null,
    counts: {
      initiatives: inits.filter((i) => i.status === 'active' || i.status === 'exploring').length,
      initiativesTotal: inits.length,
      accounts: accountsCount(),
      proposals: gov.proposals.length,
      learnings: learn.entries.length,
      mcps: mcps.length,
    },
    autoSync: gov.autoSync,
    git: {
      branch: st.branch, ahead: st.ahead, behind: st.behind,
      dirty: st.entries.length,
      lastCommit: last ? { sha: last.sha, subject: last.subject, date: last.date } : null,
    },
  };
}

module.exports = { build };
