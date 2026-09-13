// Git layer — read history/status, and commit console saves so concurrent Claude
// sessions never sweep console edits into their own turn-end commits.
import * as repo from './repo.js';
import { run } from './sh.js';

export function git(args) {
  const r = run('git', args, { cwd: repo.ROOT, timeout: 60000 });
  return r.ok ? { ok: true, out: r.out } : { ok: false, out: r.out, err: r.err };
}

/** Which git host the origin points at — decides PR listing, PR actions and the
 *  Azure gated-path reminder. Lives here (not in the prs adapter) so the actions
 *  module can ask without importing an adapter it would otherwise not need. */
export function provider() {
  const r = git(['remote', 'get-url', 'origin']);
  if (!r.ok) return 'none';
  if (/github\./i.test(r.out)) return 'github';
  if (/dev\.azure\.com|visualstudio\.com/i.test(r.out)) return 'azure';
  return 'other';
}

export function statusInfo() {
  const r = git(['status', '--porcelain=v1', '-b']);
  if (!r.ok) return { ok: false, branch: null, ahead: 0, behind: 0, entries: [] };
  let branch = null;
  let ahead = 0;
  let behind = 0;
  const entries = [];
  for (const line of r.out.split('\n').filter(Boolean)) {
    if (line.startsWith('## ')) {
      const m = line.match(/^## ([^. ]+)(?:\.\.\.\S+)?(?: \[(?:ahead (\d+))?(?:, )?(?:behind (\d+))?\])?/);
      if (m) {
        branch = m[1];
        ahead = parseInt(m[2] || '0', 10);
        behind = parseInt(m[3] || '0', 10);
      }
      continue;
    }
    const xy = line.slice(0, 2);
    let p = line.slice(3);
    if (xy.startsWith('R') && p.includes(' -> ')) p = p.split(' -> ')[1];
    entries.push({ xy: xy.trim() || '??', path: p.replace(/^"|"$/g, '') });
  }
  return { ok: true, branch, ahead, behind, entries };
}

/** Parsed history: [{sha, date, author, subject, files: [{status, path}]}] */
export function log(n, forPath) {
  const args = ['log', '-n', String(n || 60), '--date=iso-strict',
    '--pretty=format:%x1e%h%x1f%cI%x1f%an%x1f%s', '--name-status'];
  if (forPath) args.push('--', forPath);
  const r = git(args);
  if (!r.ok) return [];
  const out = [];
  for (const rec of r.out.split('\x1e')) {
    if (!rec.trim()) continue;
    const lines = rec.split('\n').filter((l) => l.trim() !== '');
    const head = lines[0].split('\x1f');
    const [sha = '', date = '', author = '', subject = ''] = head;
    const files = [];
    for (const l of lines.slice(1)) {
      const parts = l.split('\t');
      if (parts.length >= 2) {
        files.push({ status: parts[0].slice(0, 1), path: parts[parts.length - 1] });
      }
    }
    out.push({ sha, date, author, subject, files });
  }
  return out;
}

export function lastChangeIso(rel) {
  const r = git(['log', '-1', '--pretty=%cI', '--', rel]);
  return r.ok && r.out.trim() ? r.out.trim() : null;
}

/** Commit exactly these paths (pathspec-limited so a concurrent session's staged
 *  work is never swept in). Returns {committed, sha, note}. */
export function commitPaths(paths, message) {
  const add = git(['add', '--', ...paths]);
  if (!add.ok) return { committed: false, sha: null, note: `git add failed: ${add.err || ''}` };
  const c = git(['commit', '-m', message, '--', ...paths]);
  if (!c.ok) {
    const benign = /nothing to commit|no changes added/i.test((c.out || '') + (c.err || ''));
    return {
      committed: false,
      sha: null,
      note: benign ? 'no content change' : `git commit failed: ${c.err || c.out || ''}`,
    };
  }
  const sha = git(['rev-parse', '--short', 'HEAD']);
  return { committed: true, sha: sha.ok ? sha.out.trim() : null, note: null };
}

/** Push only when the policy's auto-sync switchboard says pushes are on, the
 *  strategy is direct, and we are actually on the target branch. In the pr
 *  strategy (or with push off) console commits stay local — existing hooks and
 *  /propose own the landing.
 *  Before pushing, the target is fetched and our commits rebased onto it: a
 *  teammate's push (or a snapshot rebuild) that moved origin must not turn every
 *  following save into a rejected push. `warn` marks a push that was due but did
 *  not land, so the UI can say so instead of showing a plain "Saved ✓". */
export function maybePush(settings) {
  const am = (settings || {})['auto-merge'] || {};
  if (!am.enabled || !am.push) {
    return { pushed: false, warn: false, note: 'auto-sync push is off — commit is local' };
  }
  if ((am.strategy || 'ff-only') === 'pr') {
    return { pushed: false, warn: false, note: 'pr strategy — landing stays with the sync hooks' };
  }
  const st = statusInfo();
  const target = am['target-branch'] || 'main';
  if (st.branch !== target) {
    return { pushed: false, warn: true, note: `on ${st.branch}, target is ${target} — not pushing` };
  }
  const sync = syncWithOrigin(target);
  if (!sync.ok) return { pushed: false, warn: true, note: sync.note };
  const r = git(['push', 'origin', target]);
  if (r.ok) return { pushed: true, warn: false, note: `pushed to origin/${target}${sync.rebased ? ' (after rebase)' : ''}` };
  return { pushed: false, warn: true, note: `push failed: ${lastLine(r.err)}` };
}

function lastLine(s) {
  return String(s || '').trim().split('\n').pop();
}

/** Fetch origin/<branch> and rebase HEAD onto it when it moved. A conflict aborts
 *  the rebase and is reported — nothing is lost. The snapshot file resolves by the
 *  `snapshot` merge driver (.gitattributes): derived output is regenerated by the
 *  next rebuild, never merged by hand. */
export function syncWithOrigin(branch) {
  ensureSnapshotMergeDriver();
  const f = git(['fetch', '-q', 'origin', branch]);
  if (!f.ok) return { ok: false, rebased: false, note: `fetch of origin/${branch} failed: ${lastLine(f.err)}` };
  const upstream = `origin/${branch}`;
  if (git(['merge-base', '--is-ancestor', upstream, 'HEAD']).ok) return { ok: true, rebased: false };
  const rb = git(['rebase', '-q', '--autostash', upstream]);
  if (rb.ok) return { ok: true, rebased: true };
  git(['rebase', '--abort']);
  return { ok: false, rebased: false,
    note: `origin/${branch} has changes that conflict with yours — committed locally, not pushed. Fix: git pull --rebase origin ${branch}` };
}

// The `snapshot` merge driver named in .gitattributes is a no-op command (keeps the
// current side); it is per-clone config, so register it wherever we may rebase.
let driverEnsured = false;
export function ensureSnapshotMergeDriver() {
  if (driverEnsured) return;
  driverEnsured = true;
  git(['config', 'merge.snapshot.driver', 'true']);
}

export const SNAPSHOT_PATH = 'os-console/console.html';

/** A commit that only regenerates the light-mode snapshot — by the turn-end hook,
 *  the console's Rebuild, or the retired CI job. Derived output, not work: the
 *  leaderboard and the activity timeline leave these out. */
export function isSnapshotCommit(c) {
  if (!c) return false;
  if (/^console: rebuild (snapshot|console\.html)/.test(c.subject || '')) return true;
  const files = c.files || [];
  return files.length === 1 && files[0].path === SNAPSHOT_PATH;
}

/** Last-change date of every path in history, from ONE git call — the per-file
 *  form (lastChangeIso) spawns git once per file, ~9 s over 360 files. Newest
 *  commit wins per path. */
export function lastChangeMap() {
  const r = git(['log', '--pretty=format:%x1e%cI', '--name-only', '--no-renames']);
  const map = new Map();
  if (!r.ok) return map;
  for (const rec of r.out.split('\x1e')) {
    if (!rec.trim()) continue;
    const lines = rec.split('\n');
    const date = lines[0].trim();
    for (const l of lines.slice(1)) {
      const p = l.trim();
      if (p && !map.has(p)) map.set(p, date);
    }
  }
  return map;
}

export function grep(q) {
  if (!q || q.trim().length < 2) return [];
  const r = git(['grep', '-I', '-n', '-i', '--no-color', '--untracked', '-e', q, '--',
    '*.md', '*.yaml', '*.yml', '*.txt', '*.sql']);
  if (!r.ok) return [];
  const hits = [];
  for (const line of r.out.split('\n').filter(Boolean).slice(0, 120)) {
    const m = line.match(/^([^:]+):(\d+):([\s\S]*)$/);
    if (m) hits.push({ path: m[1], line: parseInt(m[2], 10), text: m[3].trim().slice(0, 200) });
  }
  return hits;
}
