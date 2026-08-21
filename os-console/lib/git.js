'use strict';
// Git layer — read history/status, and commit console saves so concurrent Claude
// sessions never sweep console edits into their own turn-end commits.
const { execFileSync } = require('child_process');
const repo = require('./repo');

function git(args) {
  try {
    const out = execFileSync('git', args, { cwd: repo.ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: String(e.stdout || ''), err: String(e.stderr || e.message || '') };
  }
}

function statusInfo() {
  const r = git(['status', '--porcelain=v1', '-b']);
  if (!r.ok) return { ok: false, branch: null, ahead: 0, behind: 0, entries: [] };
  const lines = r.out.split('\n').filter(Boolean);
  let branch = null, ahead = 0, behind = 0;
  const entries = [];
  for (const line of lines) {
    if (line.startsWith('## ')) {
      const m = line.match(/^## ([^. ]+)(?:\.\.\.\S+)?(?: \[(?:ahead (\d+))?(?:, )?(?:behind (\d+))?\])?/);
      if (m) { branch = m[1]; ahead = Number(m[2] || 0); behind = Number(m[3] || 0); }
      continue;
    }
    const xy = line.slice(0, 2);
    let p = line.slice(3);
    if (xy.startsWith('R') && p.includes(' -> ')) p = p.split(' -> ')[1];
    entries.push({ xy: xy.trim() || '??', path: p.replace(/^"|"$/g, '') });
  }
  return { ok: true, branch, ahead, behind, entries };
}

// Parsed history: [{sha, date, author, subject, files: [{status, path}]}]
function log(n, forPath) {
  const args = ['log', `-n`, String(n || 60), '--date=iso-strict',
    '--pretty=format:%x1e%h%x1f%cI%x1f%an%x1f%s', '--name-status'];
  if (forPath) args.push('--', forPath);
  const r = git(args);
  if (!r.ok) return [];
  return r.out.split('\x1e').filter((s) => s.trim()).map((rec) => {
    const lines = rec.split('\n').filter((l) => l.trim() !== '');
    const [sha, date, author, subject] = lines[0].split('\x1f');
    const files = [];
    for (const l of lines.slice(1)) {
      const parts = l.split('\t');
      if (parts.length >= 2) files.push({ status: parts[0][0], path: parts[parts.length - 1] });
    }
    return { sha, date, author, subject, files };
  });
}

function lastChangeIso(rel) {
  const r = git(['log', '-1', '--pretty=%cI', '--', rel]);
  return r.ok && r.out.trim() ? r.out.trim() : null;
}

// Commit exactly these paths (pathspec-limited so a concurrent session's staged
// work is never swept in). Returns {committed, sha, note}.
function commitPaths(paths, message) {
  const add = git(['add', '--', ...paths]);
  if (!add.ok) return { committed: false, sha: null, note: `git add failed: ${add.err}` };
  const c = git(['commit', '-m', message, '--', ...paths]);
  if (!c.ok) {
    const benign = /nothing to commit|no changes added/i.test(c.out + c.err);
    return { committed: false, sha: null, note: benign ? 'no content change' : `git commit failed: ${c.err || c.out}` };
  }
  const sha = git(['rev-parse', '--short', 'HEAD']);
  return { committed: true, sha: sha.ok ? sha.out.trim() : null, note: null };
}

// Push only when the policy's auto-sync switchboard says pushes are on, the
// strategy is direct, and we are actually on the target branch. In the pr
// strategy (or with push off) console commits stay local — existing hooks and
// /propose own the landing.
function maybePush(settings) {
  const am = (settings && settings['auto-merge']) || {};
  if (!am.enabled || !am.push) return { pushed: false, note: 'auto-sync push is off — commit is local' };
  if ((am.strategy || 'ff-only') === 'pr') return { pushed: false, note: 'pr strategy — landing stays with the sync hooks' };
  const st = statusInfo();
  const target = am['target-branch'] || 'main';
  if (st.branch !== target) return { pushed: false, note: `on ${st.branch}, target is ${target} — not pushing` };
  const r = git(['push', 'origin', target]);
  return r.ok ? { pushed: true, note: `pushed to origin/${target}` } : { pushed: false, note: `push failed: ${r.err}` };
}

function grep(q) {
  if (!q || q.trim().length < 2) return [];
  const r = git(['grep', '-I', '-n', '-i', '--no-color', '--untracked', '-e', q, '--',
    '*.md', '*.yaml', '*.yml', '*.txt', '*.sql']);
  if (!r.ok) return [];
  return r.out.split('\n').filter(Boolean).slice(0, 120).map((line) => {
    const m = line.match(/^([^:]+):(\d+):(.*)$/);
    return m ? { path: m[1], line: Number(m[2]), text: m[3].trim().slice(0, 200) } : null;
  }).filter(Boolean);
}

module.exports = { git, statusInfo, log, lastChangeIso, commitPaths, maybePush, grep };
