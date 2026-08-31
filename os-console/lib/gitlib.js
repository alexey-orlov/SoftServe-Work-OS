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
 *  /propose own the landing. */
export function maybePush(settings) {
  const am = (settings || {})['auto-merge'] || {};
  if (!am.enabled || !am.push) {
    return { pushed: false, note: 'auto-sync push is off — commit is local' };
  }
  if ((am.strategy || 'ff-only') === 'pr') {
    return { pushed: false, note: 'pr strategy — landing stays with the sync hooks' };
  }
  const st = statusInfo();
  const target = am['target-branch'] || 'main';
  if (st.branch !== target) {
    return { pushed: false, note: `on ${st.branch}, target is ${target} — not pushing` };
  }
  const r = git(['push', 'origin', target]);
  if (r.ok) return { pushed: true, note: `pushed to origin/${target}` };
  return { pushed: false, note: `push failed: ${r.err || ''}` };
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
