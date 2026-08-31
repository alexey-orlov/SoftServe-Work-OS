// Write-policy layer — the console derives tier decisions from the SAME registry the
// write-guard hook enforces on agents: governance/write-policy.yaml. Nothing is hardcoded.
import * as miniyaml from './miniyaml.js';
import * as repo from './repo.js';

export const POLICY_PATH = 'governance/write-policy.yaml';

/** fnmatch-style glob -> regex: * stays inside a path segment, ** crosses segments. */
export function globToRegex(glob) {
  let out = '';
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === '*') {
      if (i + 1 < glob.length && glob[i + 1] === '*') {
        out += '.*';
        i += 1;
      } else {
        out += '[^/]*';
      }
    } else if (c === '?') {
      out += '[^/]';
    } else {
      out += repo.reEscape(c);
    }
    i += 1;
  }
  return new RegExp(`^${out}$`);
}

/** Pull the human-facing comments out of the tiers block (YAML loaders drop them):
 *  group headings (full-line comments) and per-entry trailing comments. */
export function parseGatedAnnotations(raw) {
  const out = [];
  let inTiers = false;
  let inGated = false;
  let heading = '';
  for (const line of raw.split('\n')) {
    if (/^tiers:\s*$/.test(line)) {
      inTiers = true;
      continue;
    }
    if (inTiers && /^\S/.test(line) && !/^tiers:/.test(line)) {
      inTiers = false;
      inGated = false;
    }
    if (inTiers && /^\s+gated:\s*$/.test(line)) {
      inGated = true;
      continue;
    }
    if (!inGated) continue;
    const comment = line.match(/^\s+#\s?(.*)$/);
    if (comment) {
      heading = comment[1].trim();
      continue;
    }
    const entry = line.match(/^\s+-\s+(\S+)\s*(?:#\s?(.*))?$/);
    if (entry) {
      out.push({ pattern: entry[1], heading, note: (entry[2] || '').trim() });
    }
  }
  return out;
}

export function load() {
  const raw = repo.readText(POLICY_PATH);
  const doc = miniyaml.load(raw) || {};
  const tiers = doc.tiers && typeof doc.tiers === 'object' && !Array.isArray(doc.tiers) ? doc.tiers : {};
  const gated = tiers.gated || [];
  const annotations = parseGatedAnnotations(raw);
  const byPattern = {};
  for (const a of annotations) byPattern[a.pattern] = a;
  return {
    path: POLICY_PATH,
    steward: doc.steward || '',
    reviewers: doc.reviewers || {},
    gated: gated.map((pattern) => ({
      pattern,
      regex: globToRegex(pattern),
      heading: (byPattern[pattern] || {}).heading || '',
      note: (byPattern[pattern] || {}).note || '',
    })),
    livingPages: doc['living-pages'] || [],
    settings: doc.settings || {},
  };
}

/** Tier for a repo-relative path, with the matched rule (shown to the person in the UI). */
export function tierFor(rel, policy) {
  const p = policy || load();
  for (const g of p.gated) {
    if (g.regex.test(rel)) {
      return { tier: 'gated', pattern: g.pattern, heading: g.heading, note: g.note };
    }
  }
  return { tier: 'auto' };
}

/** Friendly one-line description of the current auto-sync state. */
export function autoSyncSummary(settings) {
  const ac = (settings || {})['auto-commit'] || {};
  const am = (settings || {})['auto-merge'] || {};
  const on = Boolean(ac.enabled);
  const strategy = am.strategy || 'ff-only';
  const mode = strategy === 'pr' ? 'pr' : 'direct';
  let label;
  if (!on) {
    label = 'Off — nothing is committed or pushed automatically';
  } else if (mode === 'pr') {
    label = `On (pr) — work drains to ${am['target-branch'] || 'main'} via self-merging PRs; gated files wait for /propose`;
  } else {
    label = `On (direct, ${strategy}) — each turn commits${am.push ? ' and pushes' : ''}; gated files are held for the steward`;
  }
  return {
    on,
    mode: on ? mode : null,
    strategy,
    push: Boolean(am.push),
    targetBranch: am['target-branch'] || 'main',
    scope: ac.scope || 'auto-tier',
    messagePrefix: ac['message-prefix'] || 'context:',
    label,
  };
}
