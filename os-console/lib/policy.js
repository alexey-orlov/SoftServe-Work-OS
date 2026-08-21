'use strict';
// Write-policy layer — the console derives tier decisions from the SAME registry the
// write-guard hook enforces on agents: governance/write-policy.yaml. Nothing is hardcoded.
const yaml = require('../vendor/js-yaml.min.js');
const repo = require('./repo');

const POLICY_PATH = 'governance/write-policy.yaml';

// fnmatch-style glob → regex: * stays inside a path segment, ** crosses segments.
function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { re += '.*'; i++; }
      else re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[\\^$.|+()[\]{}]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`);
}

// Pull the human-facing comments out of the tiers block (js-yaml drops them):
// group headings (full-line comments) and per-entry trailing comments.
function parseGatedAnnotations(raw) {
  const lines = raw.split('\n');
  const out = [];
  let inTiers = false, inGated = false, heading = '';
  for (const line of lines) {
    if (/^tiers:\s*$/.test(line)) { inTiers = true; continue; }
    if (inTiers && /^\S/.test(line) && !/^tiers:/.test(line)) { inTiers = false; inGated = false; }
    if (inTiers && /^\s+gated:\s*$/.test(line)) { inGated = true; continue; }
    if (!inGated) continue;
    const comment = line.match(/^\s+#\s?(.*)$/);
    if (comment) { heading = comment[1].trim(); continue; }
    const entry = line.match(/^\s+-\s+(\S+)\s*(?:#\s?(.*))?$/);
    if (entry) out.push({ pattern: entry[1], heading, note: (entry[2] || '').trim() });
  }
  return out;
}

function load() {
  const raw = repo.readText(POLICY_PATH);
  const doc = yaml.load(raw) || {};
  const gated = (doc.tiers && doc.tiers.gated) || [];
  const annotations = parseGatedAnnotations(raw);
  const byPattern = new Map(annotations.map((a) => [a.pattern, a]));
  return {
    path: POLICY_PATH,
    steward: doc.steward || '',
    reviewers: doc.reviewers || {},
    gated: gated.map((pattern) => ({
      pattern,
      regex: globToRegex(pattern),
      heading: (byPattern.get(pattern) || {}).heading || '',
      note: (byPattern.get(pattern) || {}).note || '',
    })),
    livingPages: doc['living-pages'] || [],
    settings: doc.settings || {},
  };
}

// Tier for a repo-relative path, with the matched rule (shown to the person in the UI).
function tierFor(rel, policy) {
  const p = policy || load();
  for (const g of p.gated) {
    if (g.regex.test(rel)) return { tier: 'gated', pattern: g.pattern, heading: g.heading, note: g.note };
  }
  return { tier: 'auto' };
}

// Friendly one-line description of the current auto-sync state.
function autoSyncSummary(settings) {
  const ac = settings['auto-commit'] || {};
  const am = settings['auto-merge'] || {};
  const on = !!ac.enabled;
  const strategy = am.strategy || 'ff-only';
  const mode = strategy === 'pr' ? 'pr' : 'direct';
  return {
    on,
    mode: on ? mode : null,
    strategy,
    push: !!am.push,
    targetBranch: am['target-branch'] || 'main',
    scope: ac.scope || 'auto-tier',
    messagePrefix: ac['message-prefix'] || 'context:',
    label: !on
      ? 'Off — nothing is committed or pushed automatically'
      : mode === 'pr'
        ? `On (pr) — work drains to ${am['target-branch'] || 'main'} via self-merging PRs; gated files wait for /propose`
        : `On (direct, ${strategy}) — each turn commits${am.push ? ' and pushes' : ''}; gated files are held for the steward`,
  };
}

module.exports = { load, tierFor, globToRegex, autoSyncSummary, POLICY_PATH };
