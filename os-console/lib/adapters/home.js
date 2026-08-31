// Home adapter — setup & health at a glance. Every signal is DERIVED from
// observable repo state (placeholders, undecided keys, absent on-demand files),
// so the dashboard can never disagree with reality.
import * as actions from '../actions.js';
import * as gitlib from '../gitlib.js';
import * as md from '../mdparse.js';
import * as repo from '../repo.js';
import * as governance from './governance.js';
import * as initiatives from './initiatives.js';
import * as learnings from './learnings.js';
import * as steering from './steering.js';
import * as templatesAdapter from './templates.js';

const DEMO_MANIFEST = 'os-installation/demo-data-manifest.md';
const LOGS_DIR = 'os-installation/mcp-integration-logs';

export const placeholderCount = md.placeholderCount; // shared signal — one definition (mdparse)

export function productInfo(rootMd) {
  const fund = md.section(rootMd, 'Company & Product Fundamentals');
  const m = fund.match(/\*\*Company \/ product:\*\*\s*(.+)/);
  const line = m ? m[1] : '';
  const name = line.split('—')[0].trim();
  return {
    line: line.trim(),
    name: name && !name.startsWith('[') ? name : null,
    placeholders: placeholderCount(fund),
  };
}

/** YAML frontmatter of a /connect-mcps log: system, category, status, date. */
export function parseFrontmatter(text) {
  if (!text || !text.startsWith('---')) return {};
  const end = text.indexOf('\n---', 3);
  if (end === -1) return {};
  const out = {};
  for (const line of text.slice(3, end).split('\n')) {
    const m = line.trim().match(/^([a-z-]+):\s*([^#]*?)\s*(?:#.*)?$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']+|["']+$/g, '');
  }
  return out;
}

/** Connection records from the integration logs — frontmatter first (the
 *  /connect-mcps contract), filename keywords as the legacy fallback. */
export function mcpConnections() {
  const out = [];
  let entries;
  try {
    entries = repo.listDir(LOGS_DIR);
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.type !== 'file' || e.name === 'CLAUDE.md' || !e.name.endsWith('.md')) continue;
    const fm = parseFrontmatter(repo.readTextOrNull(e.rel) || '');
    out.push({
      name: e.name.replace(/\.md$/, ''),
      path: e.rel,
      mtimeMs: e.mtimeMs,
      system: fm.system || '',
      category: fm.category || '',
      status: fm.status || '',
      date: fm.date || '',
    });
  }
  return out;
}

export function codeReposConfigured() {
  const text = repo.readTextOrNull('product-development/engineering/code-repos.yaml');
  if (text === null) return { present: false, configured: false };
  const remotes = [...text.matchAll(/^\s*remote:\s*(\S+)/gm)].map((m) => m[1]);
  const real = remotes.filter((r) => /^https?:\/\//.test(r) && !/your-org|example|acme/i.test(r));
  return { present: true, configured: real.length > 0, remotes: remotes.length };
}

const BC = 'product-development/product/strategy/business-context';
const CR = 'product-development/product/competitive-research';

const STEERING_FILES = [
  ['claude-md', 'Root CLAUDE.md', 'CLAUDE.md'],
  ['business-info', 'Business info', `${BC}/business-info.md`],
  ['stakeholders', 'Stakeholders', `${BC}/stakeholders.md`],
  ['segmentation', 'Segmentation matrix', `${BC}/segmentation-matrix.md`],
  ['landscape', 'Competitive landscape', `${CR}/competitive-landscape.md`],
  ['matrix', 'Competitive matrix', `${CR}/competitive-matrix.md`],
];

/** Population status per steering file — same completion lens as the Steering
 *  page (steering.completion), over the setup page's curated population set. */
export function steeringStatus() {
  const out = [];
  for (const [key, label, p] of STEERING_FILES) {
    const text = repo.readTextOrNull(p);
    const comp = steering.completion(p, text);
    const state = comp.state || (text === null ? 'todo' : 'done');
    out.push({
      key, label, path: p, exists: text !== null,
      gaps: comp.gaps, state,
      detail: comp.detail || (text === null ? 'File is missing.' : ''),
    });
  }
  return out;
}

/** Each template + the customization program's phase for the templates target. */
export function templatesStatus(customization) {
  let phase = null;
  if (customization) {
    const m = customization.match(/^\|\s*\d+\s*\|\s*templates\s*\|\s*([^|]+)\|/im);
    phase = m ? m[1].trim() : null;
  }
  const done = Boolean(phase && /installed|complete/i.test(phase));
  let items;
  try {
    items = templatesAdapter.build().items;
  } catch {
    items = [];
  }
  return {
    phase,
    customized: done,
    items: items.map((t) => ({ name: t.name, title: t.title, path: t.path, desc: t.desc })),
  };
}

// ------------------------------------------------------------ integrations table
// One row per integration surface. Purpose and the "without it" text mirror the
// documentation's "Which tools are worth connecting" table — same promises, same
// fallbacks. `fileAction` marks the surfaces where file storage is a first-class
// choice (recorded in toolchain.yaml as the approach).

export const SURFACES = [
  { key: 'prototyping', type: 'Design system',
    example: 'e.g. Figma',
    purpose: 'Prototypes follow your design system automatically',
    without: "Describe or link the design; prototypes can't follow the design system automatically.",
    fileAction: { approach: 'screenshots', label: 'Use file storage (screenshots)' },
    legacy: 'figma|zeplin|sketch|storybook' },
  { key: 'codebase', type: 'Code base',
    purpose: 'Product questions answered from the code itself (/code-qa), first drafts built in it',
    without: 'Claude gives you the exact question to ask an engineer instead.',
    fileAction: null, legacy: null },
  { key: 'ticketing', type: 'Task tracker',
    example: 'e.g. Jira, Linear',
    purpose: 'Tickets created directly in your tracker',
    without: 'Ready-to-paste tickets; you tell Claude the status.',
    fileAction: null,
    legacy: 'linear|jira|asana|monday|clickup|boards|ado|tracker' },
  { key: 'meeting-transcripts', type: 'Meeting transcripts',
    example: 'e.g. Fireflies, Otter',
    purpose: 'Transcripts pulled directly after each call',
    without: 'Paste the transcript, or drop the file into product-development/inbox/.',
    fileAction: { approach: 'files', label: 'Use file storage' },
    legacy: 'firefl|otter|zoom|granola|fathom|recording|transcript|grain' },
  { key: 'user-insights', type: 'User insights source',
    example: 'e.g. Dovetail',
    purpose: 'Research interviews and notes read from where they live',
    without: 'Drop research files into product-development/inbox/ or paste them; /customize-os research-source records the choice.',
    fileAction: null,
    legacy: 'dovetail|usertesting|userzoom|maze' },
  { key: 'knowledge-base', type: 'Knowledge base',
    example: 'e.g. Notion, Confluence',
    purpose: 'Claude reads your team documents where they live',
    without: 'Paste or attach the document.',
    fileAction: { approach: 'files', label: 'Use file storage' },
    legacy: 'notion|confluence|drive|sharepoint|coda|guru|document' },
  { key: 'analytics', type: 'Product analytics',
    example: 'e.g. Amplitude',
    purpose: 'Metrics queried on demand',
    without: "Export the numbers or paste a chart's data into analytics/metrics/.",
    fileAction: null,
    legacy: 'amplitude|mixpanel|posthog|pendo|heap' },
  { key: 'feature-requests', type: 'Feature requests & customer insights',
    example: 'e.g. Intercom',
    purpose: 'The request pile read straight from your support / feedback tool',
    without: 'Paste the pile of requests; dated records live in user-insights/feature-requests/.',
    fileAction: { approach: 'files', label: 'Use file storage' },
    legacy: 'intercom|zendesk|productboard|canny|uservoice' },
  { key: 'team-chat', type: 'Team chat',
    example: 'e.g. Slack',
    purpose: 'Drafts and updates posted to your chat',
    without: 'Claude drafts, you paste.',
    fileAction: null, legacy: 'slack|discord' },
  { key: 'calendar', type: 'Calendar',
    example: 'e.g. Google Calendar',
    purpose: 'Daily and weekly plans read your real calendar',
    without: 'You tell Claude your day.',
    fileAction: null, legacy: 'calendar|outlook|gcal' },
];

const FILE_APPROACHES = new Set(['files', 'screenshots', 'inbox-manual', 'manual',
  'plain-html', 'external-prompts', 'claude-design']);

const LIVE_COMMENT = 'All set — every user who connects can use it.';

export function integrationsTable(tcSurfaces, mcps, code) {
  const tcBy = {};
  for (const t of tcSurfaces) tcBy[t.surface] = t;
  const used = new Set();
  const rows = [];
  for (const s of SURFACES) {
    const key = s.key;
    if (key === 'codebase') {
      const live = code.configured;
      rows.push({
        key, type: s.type, purpose: s.purpose,
        system: live ? 'registered repos' : '',
        systemEditable: false,
        status: live ? 'live' : 'todo',
        comment: live ? LIVE_COMMENT : s.without,
        actions: live ? [] : [{ kind: 'prompt', label: 'Connect code base', prompt: '/connect-code' }],
      });
      continue;
    }
    const tc = tcBy[key];
    const conn = tc ? tc.connection : null;
    const connLive = Boolean(conn && (conn.status || 'connected') === 'connected');
    const legacyHits = mcps.filter((m) => (m.category === key && (m.status || 'connected') === 'connected')
      || (!m.category && s.legacy && new RegExp(s.legacy, 'i').test(m.name)));
    for (const m of legacyHits) used.add(m.name);
    const live = connLive || legacyHits.length > 0;
    const plannedSystem = (tc ? tc.system : '') || '';
    const liveSystem = ((connLive && conn) ? conn.system : '')
      || (legacyHits.length ? (legacyHits[0].system || legacyHits[0].name) : '');
    const approach = tc ? tc.choice : 'undecided';
    const fileBased = FILE_APPROACHES.has(approach) && !live;
    let status;
    let comment;
    if (live) {
      status = 'live';
      comment = LIVE_COMMENT;
    } else if (fileBased) {
      status = 'files';
      comment = `Working file-based by choice — ${s.without}`;
    } else if (plannedSystem || approach === 'mcp') {
      status = 'planned';
      comment = `${plannedSystem || 'An MCP connection'} is the plan, but nothing is connected yet — ${s.without}`;
    } else {
      status = 'todo';
      comment = s.without;
    }
    const target = liveSystem || plannedSystem || s.type;
    const acts = [];
    if (live) {
      acts.push({ kind: 'prompt', label: 'Set up new MCP connection', prompt: `/connect-mcps connect to ${target}` });
    } else {
      acts.push({ kind: 'prompt', label: 'Set up MCP connection', prompt: `/connect-mcps connect to ${target}` });
      if (s.fileAction) {
        acts.push({ kind: 'files', label: s.fileAction.label, approach: s.fileAction.approach });
      }
    }
    rows.push({
      key, type: s.type, purpose: s.purpose,
      system: live ? liveSystem : plannedSystem,
      systemEditable: !live,
      example: s.example || '',
      approach,
      status,
      comment,
      connectionDate: ((connLive && conn) ? conn.date : '') || '',
      actions: acts,
    });
  }
  const surfaceKeys = new Set(SURFACES.map((s) => s.key));
  const other = mcps.filter((m) => !used.has(m.name) && !surfaceKeys.has(m.category)).map((m) => m.name);
  return { rows, other };
}

export function demoStatus() {
  const text = repo.readTextOrNull(DEMO_MANIFEST);
  if (text === null) {
    return { present: false, path: DEMO_MANIFEST, detail: 'No synthetic demo data in this instance.' };
  }
  const files = (text.match(/^\s*-\s+/gm) || []).length;
  return {
    present: true,
    path: DEMO_MANIFEST,
    detail: `Demo data present — the manifest records ~${files} entries; /demo-data remove reverses it exactly.`,
  };
}

export function accountsCount() {
  try {
    return repo.listDir('product-development/product/customers/accounts')
      .filter((e) => e.type === 'dir').length;
  } catch {
    return 0;
  }
}

export function build() {
  const rootMd = repo.readText('CLAUDE.md');
  const product = productInfo(rootMd);
  const gov = governance.build();
  const tc = actions.toolchainSurfaces();
  const mcps = mcpConnections();
  const code = codeReposConfigured();
  const customization = repo.readTextOrNull('os-installation/customization-status.md');
  const inits = initiatives.listPages();
  const learn = learnings.build();

  const steer = steeringStatus();
  const tmpl = templatesStatus(customization);
  const integ = integrationsTable(tc, mcps, code);
  const demo = demoStatus();
  const autoOn = gov.autoSync.on;

  // Per-tab progress; demo data is deliberately outside the meter (synthetic
  // data is not a goal state for a real instance).
  const tabs = {
    business: { items: steer, done: steer.filter((s) => s.state === 'done').length, total: steer.length },
    templates: { phase: tmpl.phase, customized: tmpl.customized, items: tmpl.items,
      done: tmpl.customized ? 1 : 0, total: 1 },
    integrations: { rows: integ.rows, other: integ.other,
      done: integ.rows.filter((r) => r.status === 'live' || r.status === 'files').length,
      total: integ.rows.length },
    autosync: { on: autoOn, summary: gov.autoSync, done: autoOn ? 1 : 0, total: 1 },
    demo,
  };
  const meterTabs = ['business', 'templates', 'integrations', 'autosync'];
  const progDone = meterTabs.reduce((n, k) => n + tabs[k].done, 0);
  const progTotal = meterTabs.reduce((n, k) => n + tabs[k].total, 0);

  const st = gitlib.statusInfo();
  const log = gitlib.log(1);
  const last = log.length ? log[0] : null;

  return {
    product,
    setup: {
      tabs,
      steward: { placeholder: gov.stewardPlaceholder, name: gov.steward },
      health: gov.health.length ? gov.health[0].name : null,
    },
    toolchain: tc,
    progress: { done: progDone, total: progTotal },
    customization: customization
      ? { path: 'os-installation/customization-status.md', text: customization.slice(0, 4000) }
      : null,
    counts: {
      initiatives: inits.filter((i) => i.status === 'active').length,
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
