// Console write actions beyond plain file saves — each one a surgical, comment-
// preserving text edit on a canonical registry, committed immediately with the
// `console:` prefix. A console action is the person's approval (same philosophy
// as saves), but landing still follows the auto-sync switchboard: in the pr
// strategy nothing here reaches the target branch by automation.
//
// The auto-sync flip mirrors the /auto-sync skill: the SAME three switches plus
// strategy, nothing else. If that skill's guards or switch set change, change
// this module in the same commit (drift between them is a bug).
import fs from 'node:fs';
import path from 'node:path';
import * as gitlib from './gitlib.js';
import * as mdparse from './mdparse.js';
import * as miniyaml from './miniyaml.js';
import * as policy from './policy.js';
import * as repo from './repo.js';
import { run, which } from './sh.js';

export const POLICY = policy.POLICY_PATH;
export const TOOLCHAIN = 'product-development/toolchain.yaml';
export const PROPOSALS_DIR = 'governance/proposals';
export const GATED_PATHS_SH = '.github/scripts/gated-paths.sh';

// ------------------------------------------------------------------ toolchain

// Only these two fields are console-writable; everything else in toolchain.yaml
// belongs to /customize-os (params, rich decisions) or /connect-mcps (connection:).
const SURFACE_RX = /^[a-z][a-z0-9-]*$/;

/** [start, end) of a top-level `surface:` block — end is exclusive. */
function surfaceBlock(lines, surface) {
  let start = null;
  const header = new RegExp(`^${repo.reEscape(surface)}:\\s*(#.*)?$`);
  for (let i = 0; i < lines.length; i++) {
    if (header.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start === null) throw repo.httpErr(404, `no surface ${surface} in toolchain.yaml`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    // A surface block ends at the next top-level key or a column-0 comment
    // (the file separates surfaces with full-line comment blocks).
    if (/^[a-z]/.test(lines[i]) || /^#/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return [start, end];
}

/** Replace `  {key}: ...` inside a block, keeping any trailing comment. */
function setBlockField(lines, start, end, key, value, quote = false) {
  // Quoted values also drop '#' — the field regex has no quote awareness, so a
  // '#' inside the value would read as a trailing comment on the NEXT edit.
  const val = quote ? `"${String(value).replace(/"/g, '').replace(/#/g, '')}"` : value;
  const rx = new RegExp(`^(\\s+${repo.reEscape(key)}:)\\s*[^#\\n]*(#.*)?$`);
  for (let i = start + 1; i < end; i++) {
    const m = lines[i].match(rx);
    if (m) {
      const comment = m[2] || '';
      let pad = '';
      if (comment) {
        const cur = lines[i];
        const cpos = cur.indexOf('#');
        const base = `${m[1]} ${val}`;
        pad = cpos > base.length ? ' '.repeat(Math.max(1, cpos - base.length)) : '   ';
      }
      lines[i] = `${m[1]} ${val}${comment ? pad + comment : ''}`;
      return true;
    }
  }
  return false;
}

function hasConnection(lines, start, end) {
  for (let i = start + 1; i < end; i++) {
    if (/^\s+connection:/.test(lines[i])) return true;
  }
  return false;
}

/** Raw per-surface state incl. connection blocks, for the integrations table. */
export function toolchainSurfaces() {
  const out = [];
  const text = repo.readTextOrNull(TOOLCHAIN);
  if (text === null) return out;
  const doc = miniyaml.load(text) || {};
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return out;
  for (const [key, val] of Object.entries(doc)) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue;
    const conn = val.connection && typeof val.connection === 'object' && !Array.isArray(val.connection)
      ? val.connection : null;
    out.push({
      surface: key,
      choice: val.approach || val.source || 'undecided',
      choiceKey: 'approach' in val ? 'approach' : 'source',
      system: (val.system || '').trim(),
      decided: val.decided || null,
      notes: val.notes || '',
      connection: conn ? {
        system: (conn.system || '').trim(),
        status: conn.status || '',
        date: conn.date || '',
        log: conn.log || '',
      } : null,
    });
  }
  return out;
}

/** Set a surface's choice and/or planned system. The console's only toolchain
 *  writes; connection: blocks stay /connect-mcps territory. Locked once live. */
export function toolchainSet(surface, approach, system, settings) {
  if (!surface || !SURFACE_RX.test(surface)) throw repo.httpErr(400, 'surface required');
  const text = repo.readText(TOOLCHAIN);
  const lines = text.split('\n');
  const [start, end] = surfaceBlock(lines, surface);
  if (system !== null && system !== undefined && hasConnection(lines, start, end)) {
    throw repo.httpErr(409, `${surface} has a live connection — its system name is locked to the connected tool`);
  }
  const changed = [];
  if (approach !== null && approach !== undefined) {
    if (!/^[a-z][a-z0-9-]*$/.test(approach)) throw repo.httpErr(400, 'invalid approach value');
    let key = 'approach';
    let hasApproach = false;
    for (let i = start + 1; i < end; i++) {
      if (/^\s+approach:/.test(lines[i])) hasApproach = true;
    }
    if (!hasApproach) key = 'source'; // user-insights names its choice key `source`
    if (!setBlockField(lines, start, end, key, approach)) {
      throw repo.httpErr(500, `could not set ${key} on ${surface}`);
    }
    setBlockField(lines, start, end, 'decided', approach !== 'undecided' ? mdparse.today() : '');
    changed.push(`${key}=${approach}`);
  }
  if (system !== null && system !== undefined) {
    if (system.length > 80) throw repo.httpErr(400, 'system name too long');
    if (!setBlockField(lines, start, end, 'system', system, true)) {
      throw repo.httpErr(500, `could not set system on ${surface}`);
    }
    changed.push(`system=${system || '""'}`);
  }
  if (!changed.length) throw repo.httpErr(400, 'nothing to change');
  repo.writeText(TOOLCHAIN, lines.join('\n'));
  const commit = gitlib.commitPaths([TOOLCHAIN], `console: toolchain ${surface} — ${changed.join(', ')}`);
  const push = gitlib.maybePush(settings || policy.load().settings);
  return { ok: true, surface, changed, commit, push };
}

// ------------------------------------------------------------- gated list edit

const GROUPS = { steering: 'Steering files', system: 'System rules' };

/** [firstEntryIdx, endIdx) of the tiers.gated list — end exclusive. */
function gatedBlock(lines) {
  let inTiers = false;
  let start = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^tiers:\s*$/.test(l)) {
      inTiers = true;
      continue;
    }
    if (inTiers && /^\S/.test(l)) inTiers = false;
    if (inTiers && /^\s+gated:\s*$/.test(l)) {
      start = i + 1;
      break;
    }
  }
  if (start === null) throw repo.httpErr(500, 'no tiers.gated block found in the write policy');
  let end = start;
  for (let i = start; i < lines.length; i++) {
    if (/^\s+(#|-)/.test(lines[i]) || lines[i].trim() === '') end = i + 1;
    else break;
  }
  while (end > start && lines[end - 1].trim() === '') end -= 1;
  return [start, end];
}

function validatePattern(pattern) {
  let p = (pattern || '').trim().replace(/\\/g, '/');
  p = p.replace(/^\/+/, '');
  // ANY whitespace (incl. embedded newlines/tabs) would splice raw text into
  // the YAML registry — the enforcement root. Reject, never sanitize.
  if (!p || /\s/.test(p) || p.startsWith('#')) {
    throw repo.httpErr(400, 'pattern must be a repo-relative path or glob without whitespace');
  }
  repo.resolveSafe(p.replace(/\*/g, 'x').replace(/\?/g, 'x')); // escape check on a literalized copy
  return p;
}

export function gatedAdd(pattern, note, group, settings) {
  let p = validatePattern(pattern);
  // A directory rule is written dir/** by convention (the hooks also accept dir/).
  if (!p.includes('*') && repo.exists(p)) {
    let isDir = false;
    try {
      isDir = fs.statSync(repo.resolveSafe(p).abs).isDirectory();
    } catch { /* not a dir */ }
    if (isDir) p = p.replace(/\/+$/, '') + '/**';
  }
  const lines = repo.readText(POLICY).split('\n');
  const [start, end] = gatedBlock(lines);
  const existing = [];
  for (let i = start; i < end; i++) {
    const m = lines[i].match(/^\s+-\s+(\S+)/);
    if (m) existing.push(m[1]);
  }
  if (existing.includes(p)) throw repo.httpErr(409, `${p} is already gated`);
  // Match the list's own formatting exactly — a mixed-indent entry would end
  // the YAML sequence early and silently truncate the parsed policy.
  let indent = '    ';
  let commentCol = 63;
  for (let i = start; i < end; i++) {
    const m = lines[i].match(/^(\s+)-\s+\S+/);
    if (m) {
      indent = m[1];
      const cpos = lines[i].indexOf('#');
      if (cpos > 0) commentCol = cpos;
      break;
    }
  }
  const groupLabel = GROUPS[group || 'steering'] || GROUPS.steering;
  let insertAt = null;
  let current = '';
  for (let i = start; i < end; i++) {
    const c = lines[i].match(/^\s+#\s?([\s\S]*)$/);
    if (c) {
      current = c[1];
      continue;
    }
    if (/^\s+-\s+\S+/.test(lines[i]) && current.startsWith(groupLabel)) insertAt = i + 1;
  }
  if (insertAt === null) insertAt = end;
  let entry = `${indent}- ${p}`;
  if (note) {
    const cleanNote = note.split(/\s+/).filter(Boolean).join(' '); // collapse ALL whitespace — no newline splices
    entry = `${entry}${' '.repeat(Math.max(1, commentCol - entry.length))}# ${cleanNote}`;
  }
  lines.splice(insertAt, 0, entry);
  repo.writeText(POLICY, lines.join('\n'));
  const mirrors = regenCodeowners();
  const commit = gitlib.commitPaths(policyPathspec(), `console: gate ${p}`);
  const push = gitlib.maybePush(settings || policy.load().settings);
  return { ok: true, pattern: p, commit, push, codeowners: mirrors, azureReminder: azureReminder() };
}

export function gatedRemove(pattern, settings) {
  const p = (pattern || '').trim();
  const lines = repo.readText(POLICY).split('\n');
  const [start, end] = gatedBlock(lines);
  const rx = new RegExp(`^\\s+-\\s+${repo.reEscape(p)}(\\s|#|$)`);
  let idx = null;
  for (let i = start; i < end; i++) {
    if (rx.test(lines[i])) {
      idx = i;
      break;
    }
  }
  if (idx === null) throw repo.httpErr(404, `${p} is not in the gated list`);
  lines.splice(idx, 1);
  repo.writeText(POLICY, lines.join('\n'));
  const mirrors = regenCodeowners();
  const commit = gitlib.commitPaths(policyPathspec(), `console: un-gate ${p}`);
  const push = gitlib.maybePush(settings || policy.load().settings);
  return { ok: true, pattern: p, commit, push, codeowners: mirrors, azureReminder: azureReminder() };
}

/** The policy always; CODEOWNERS only when it exists — a missing pathspec
 *  would fail the whole `git add` and leave the policy edit uncommitted. */
function policyPathspec() {
  const paths = [POLICY];
  if (repo.exists('.github/CODEOWNERS')) paths.push('.github/CODEOWNERS');
  return paths;
}

/** Regenerate .github/CODEOWNERS from the policy, same as the turn-end hook. */
function regenCodeowners() {
  const script = repo.resolveSafe(GATED_PATHS_SH).abs;
  if (!fs.existsSync(script) || !fs.statSync(script).isFile()) {
    return { ok: false, note: 'gated-paths.sh not found — CODEOWNERS not regenerated' };
  }
  if (!which('bash')) {
    return { ok: false, note: 'bash unavailable — regenerate CODEOWNERS with gated-paths.sh --format codeowners --write' };
  }
  const r = run('bash', [script, '--format', 'codeowners', '--write'], { cwd: repo.ROOT, timeout: 20000 });
  if (!r.ok) return { ok: false, note: (r.err || 'gated-paths.sh failed').slice(0, 200) };
  return { ok: true, note: 'CODEOWNERS regenerated' };
}

function azureReminder() {
  if (gitlib.provider() !== 'azure') return null;
  return 'Azure DevOps keeps its own gated-path filter: update the required-reviewer '
    + 'policy path filter (gated-paths.sh --format ado prints the new value).';
}

// ---------------------------------------------------------------- auto-sync

/** Set `settings: → {section}: → {key}:` keeping the trailing comment. */
function setSettingsField(lines, section, key, value) {
  let inSettings = false;
  let inSection = false;
  const sectionRx = new RegExp(`^\\s{2}${repo.reEscape(section)}:\\s*$`);
  const keyRx = new RegExp(`^(\\s+${repo.reEscape(key)}:)\\s*[^#\\n]*(#.*)?$`);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^settings:\s*$/.test(l)) {
      inSettings = true;
      continue;
    }
    if (inSettings && /^[a-zA-Z]/.test(l)) break; // next top-level key ends settings; col-0 comments do not
    if (inSettings && sectionRx.test(l)) {
      inSection = true;
      continue;
    }
    if (inSection && /^\s{2}[a-z]/.test(l)) inSection = false;
    if (inSection) {
      const m = l.match(keyRx);
      if (m) {
        const comment = m[2];
        const base = `${m[1]} ${value}`;
        if (comment) {
          const cpos = l.indexOf('#');
          lines[i] = base + ' '.repeat(Math.max(2, cpos - base.length)) + comment;
        } else {
          lines[i] = base;
        }
        return true;
      }
    }
  }
  return false;
}

/** Reasons this flip cannot proceed — empty list means go. Mirrors /auto-sync:
 *  a missing origin does NOT block (the skill proceeds and notes that pushes are
 *  skipped until a remote exists — pushWithRetry reports exactly that). */
export function autosyncGuards(mode) {
  const reasons = [];
  const st = gitlib.statusInfo();
  const settings = policy.load().settings;
  const am = settings['auto-merge'] || {};
  const target = am['target-branch'] || 'main';
  const currentStrategy = am.strategy || 'ff-only';
  if (mode === 'direct' && currentStrategy === 'pr' && st.branch && st.branch !== target) {
    const unlanded = gitlib.git(['log', '--oneline', `origin/${target}..HEAD`]);
    if (unlanded.ok && unlanded.out.trim()) {
      const n = unlanded.out.trim().split('\n').length;
      reasons.push(`You are on branch ${st.branch} with ${n} commit(s) not yet landed on ${target}. `
        + `Land them first (/propose for the gated ones), or switch to ${target}.`);
    }
  }
  return reasons;
}

/** Flip auto-sync exactly as /auto-sync does: three switches + strategy, commit,
 *  push with one rebase retry. Never a success banner over a failure. */
export function autosyncSet(mode) {
  if (!['direct', 'pr', 'off'].includes(mode)) throw repo.httpErr(400, 'mode must be direct, pr, or off');
  const reasons = autosyncGuards(mode);
  if (reasons.length) return { ok: false, blocked: true, reasons };
  const lines = repo.readText(POLICY).split('\n');
  const on = mode !== 'off';
  const edits = [
    ['auto-commit', 'enabled', on ? 'true' : 'false'],
    ['auto-merge', 'enabled', on ? 'true' : 'false'],
    ['auto-merge', 'push', on ? 'true' : 'false'],
  ];
  if (on) edits.push(['auto-merge', 'strategy', mode === 'direct' ? 'ff-only' : 'pr']);
  for (const [section, key, value] of edits) {
    if (!setSettingsField(lines, section, key, value)) {
      throw repo.httpErr(500, `could not set settings.${section}.${key} — the policy file shape changed`);
    }
  }
  repo.writeText(POLICY, lines.join('\n'));
  const msg = `context: auto-sync ${on ? `on (${mode})` : 'off'}`;
  const commit = gitlib.commitPaths([POLICY], msg);
  if (!commit.committed && commit.note !== 'no content change') {
    return { ok: false, blocked: false, reasons: [`Commit failed: ${commit.note}`] };
  }
  const push = pushWithRetry(mode);
  const fresh = policy.load();
  return { ok: true, blocked: false, commit, push, autoSync: policy.autoSyncSummary(fresh.settings) };
}

/** Push the flip itself. In pr mode the policy is gated + main is PR-only:
 *  the commit stays on the current branch, honestly reported. */
function pushWithRetry(mode) {
  const st = gitlib.statusInfo();
  const settings = policy.load().settings;
  const am = settings['auto-merge'] || {};
  const target = am['target-branch'] || 'main';
  const origin = gitlib.git(['remote', 'get-url', 'origin']);
  if (!origin.ok) return { pushed: false, note: 'no origin — the flip is committed locally' };
  if (mode === 'pr' && st.branch !== target) {
    return { pushed: false, note: `pr mode — the flip is committed on ${st.branch} and lands via /propose (gated)` };
  }
  const branch = st.branch || target;
  const r = gitlib.git(['push', 'origin', branch]);
  if (r.ok) return { pushed: true, note: `pushed to origin/${branch}` };
  const pull = gitlib.git(['pull', '--rebase', 'origin', branch]);
  if (pull.ok) {
    const r2 = gitlib.git(['push', 'origin', branch]);
    if (r2.ok) return { pushed: true, note: `pushed to origin/${branch} (after rebase)` };
    return { pushed: false, note: `push failed after rebase: ${(r2.err || '').slice(0, 160)} — finish it in Claude Code (/auto-sync ${mode})` };
  }
  gitlib.git(['rebase', '--abort']);
  if (mode === 'pr') {
    return { pushed: false, note: 'push rejected (main is likely PR-only) — the flip is committed locally and lands via /propose' };
  }
  return { pushed: false, note: `push failed: ${(r.err || '').slice(0, 160)} — finish it in Claude Code (/auto-sync ${mode})` };
}

// ---------------------------------------------------------------- proposals

/** Delete one proposal file (governance/proposals/ only), the rejection comment
 *  in the commit message. Approving is a Claude Code hand-off, not a console act. */
export function proposalReject(pathArg, comment, settings) {
  const r = repo.resolveSafe(pathArg);
  const rel = r.rel;
  if (!rel.startsWith(PROPOSALS_DIR + '/') || rel.endsWith('CLAUDE.md') || !rel.endsWith('.md')) {
    throw repo.httpErr(400, `only proposal files under ${PROPOSALS_DIR} can be rejected here`);
  }
  if (!repo.exists(rel)) throw repo.httpErr(404, `${rel} not found`);
  fs.unlinkSync(r.abs);
  let msg = `console: reject proposal ${path.posix.basename(rel)}`;
  if (comment && comment.trim()) msg += `\n\nRejected: ${comment.trim().slice(0, 500)}`;
  const commit = gitlib.commitPaths([rel], msg);
  const push = gitlib.maybePush(settings || policy.load().settings);
  return { ok: true, path: rel, commit, push };
}
