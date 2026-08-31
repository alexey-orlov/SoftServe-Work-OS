// Pull requests adapter — open PRs waiting for review, plus the Home most-active
// leaderboard. PR lists shell the platform CLI read-only (gh for GitHub origins,
// az for Azure Repos), detected from the git origin like the pr-flow hook does;
// results are cached (TTL below); missing/unauthenticated CLIs degrade to an honest
// note, never an error. The leaderboard reads local git history instead — it must
// work the same whether work lands as direct pushes or through pull requests.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as gitlib from '../gitlib.js';
import * as repo from '../repo.js';
import { run, which } from '../sh.js';

const TTL_MS = 5 * 60 * 1000;
let cache = { t: 0, data: null };

export function sh(cmd, args) {
  if (!which(cmd)) return { ok: false, err: `${cmd}: command not found` };
  const r = run(cmd, args, { cwd: repo.ROOT, timeout: 12000 });
  if (!r.ok) return { ok: false, err: (r.err || '').slice(0, 300) };
  return { ok: true, out: r.out };
}

export const provider = gitlib.provider;

export function isBotLogin(login) {
  return /\[bot\]$|-bot$|^bot-/i.test(login || '');
}

/** CI and agent identities — the leaderboard is people-only. A change a person
 *  makes through an agent session still carries the person as commit author and
 *  counts; only commits authored AS the agent/CI identity itself are filtered. */
export function isBotAuthor(name, email) {
  const e = (email || '').toLowerCase();
  return isBotLogin(name) || e === 'noreply@anthropic.com'
    || e.startsWith('actions@') || e.includes('[bot]@');
}

function fetchGithub() {
  const openR = sh('gh', ['pr', 'list', '--state', 'open', '--limit', '50',
    '--json', 'number,title,author,createdAt,url,isDraft']);
  if (!openR.ok) {
    return {
      available: false,
      provider: 'github',
      open: [],
      note: 'gh CLI unavailable or not authenticated — run `gh auth login` to see pull requests here',
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(openR.out);
  } catch {
    return { available: false, provider: 'github', open: [], note: 'gh returned unreadable JSON' };
  }
  const openPrs = parsed.map((p) => {
    const author = p.author || {};
    return {
      number: p.number,
      title: p.title,
      url: p.url,
      createdAt: p.createdAt,
      draft: Boolean(p.isDraft),
      author: author.login || '?',
      isBot: Boolean(author && (author.is_bot || isBotLogin(author.login))),
    };
  });
  return { available: true, provider: 'github', note: null, open: openPrs };
}

function fetchAzure() {
  const openR = sh('az', ['repos', 'pr', 'list', '--status', 'active', '-o', 'json']);
  if (!openR.ok) {
    return {
      available: false,
      provider: 'azure',
      open: [],
      note: 'az CLI unavailable — `az login` + `az extension add --name azure-devops` to see pull requests here',
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(openR.out);
  } catch {
    return { available: false, provider: 'azure', open: [], note: 'az returned unreadable JSON' };
  }
  const mapPr = (p) => {
    const createdBy = p.createdBy || {};
    return {
      number: p.pullRequestId,
      title: p.title,
      url: '',
      draft: Boolean(p.isDraft),
      createdAt: p.creationDate,
      mergedAt: p.closedDate,
      author: createdBy.uniqueName || createdBy.displayName || '?',
      isBot: isBotLogin(createdBy.uniqueName),
    };
  };
  return { available: true, provider: 'azure', note: null, open: parsed.map(mapPr) };
}

export function data(force) {
  const nowMs = Date.now();
  if (!force && cache.data !== null && nowMs - cache.t < TTL_MS) return cache.data;
  const kind = provider();
  let d;
  if (kind === 'github') d = fetchGithub();
  else if (kind === 'azure') d = fetchAzure();
  else {
    d = {
      available: false,
      provider: kind,
      open: [],
      note: kind === 'none' ? 'no git origin configured' : 'PR listing supports GitHub and Azure Repos origins',
    };
  }
  cache = { t: nowMs, data: d };
  return d;
}

/** Open PRs waiting for a human (bots filtered out). */
export function openPrs(force) {
  const d = data(force);
  return {
    available: d.available,
    provider: d.provider,
    note: d.note,
    items: d.open.filter((p) => !p.isBot),
  };
}

/** Every open PR, humans and bots — the Proposed-changes tabs split them. */
export function allOpen(force) {
  const d = data(force);
  return { available: d.available, provider: d.provider, note: d.note, items: d.open };
}

// ------------------------------------------------- permissions + PR actions
// Where the host lets us check cheaply (GitHub repo permissions), buttons can be
// disabled upfront; where it does not (Azure, CODEOWNERS satisfaction), the
// console attempts the action and the git host stays the enforcer — its
// rejection is surfaced verbatim.

let permCache = { t: 0, data: null };

export function originSlug() {
  const r = sh('git', ['remote', 'get-url', 'origin']);
  if (!r.ok) return null;
  const m = r.out.trim().match(/github\.[^/:]+[/:]([^/\s]+)\/([^/\s]+?)(?:\.git)?$/);
  return m ? `${m[1]}/${m[2]}` : null;
}

/** canMerge: true/false when the host answers cheaply (GitHub push/admin),
 *  null when unknowable (Azure, no CLI) — null means optimistic buttons. */
export function permissions(force = false) {
  const nowMs = Date.now();
  if (!force && permCache.data !== null && nowMs - permCache.t < TTL_MS) return permCache.data;
  const kind = provider();
  const out = { provider: kind, canMerge: null, login: null, note: null };
  if (kind === 'github') {
    const slug = originSlug();
    const r = slug
      ? sh('gh', ['api', `repos/${slug}`, '--jq', '.permissions'])
      : { ok: false, err: 'no origin slug' };
    if (r.ok) {
      try {
        const p = JSON.parse(r.out || '{}') || {};
        out.canMerge = Boolean(p.admin || p.maintain || p.push);
      } catch { /* leave canMerge null — optimistic buttons */ }
    } else {
      out.note = `permission check unavailable (${(r.err || '').slice(0, 120)}) — actions will be attempted and the host decides`;
    }
    const who = sh('gh', ['api', 'user', '--jq', '.login']);
    if (who.ok) out.login = who.out.trim();
  } else if (kind === 'azure') {
    out.note = 'Azure does not expose a cheap merge-permission check — actions are attempted and the host decides';
  }
  permCache = { t: nowMs, data: out };
  return out;
}

function step(steps, name, r, okNote) {
  steps.push({ step: name, ok: r.ok, note: r.ok ? okNote : (r.err || 'failed') });
  return r.ok;
}

/** approve = approve + merge/complete; reject = close/abandon with the comment.
 *  Every stage reported honestly — a partial result says exactly what happened. */
export function prAction(number, action, comment = '') {
  const parsed = parseInt(number, 10);
  if (!Number.isFinite(parsed)) throw repo.httpErr(400, 'PR number required');
  const n = String(parsed);
  if (action !== 'approve' && action !== 'reject') {
    throw repo.httpErr(400, 'action must be approve or reject');
  }
  if (action === 'reject' && !(comment || '').trim()) {
    throw repo.httpErr(400, 'a rejection needs a comment — it is posted to the pull request');
  }
  const kind = provider();
  const steps = [];
  if (kind === 'github') {
    if (action === 'approve') {
      const rev = sh('gh', ['pr', 'review', n, '--approve']);
      if (!rev.ok && /your own pull request/i.test(rev.err || '')) {
        steps.push({ step: 'approve review', ok: true, note: 'own PR — review not needed, going straight to merge' });
      } else {
        step(steps, 'approve review', rev, 'approving review posted');
      }
      step(steps, 'merge', sh('gh', ['pr', 'merge', n, '--merge']), 'merged');
    } else {
      const close = sh('gh', ['pr', 'close', n, '--comment', comment.trim()]);
      step(steps, 'close with comment', close, 'closed — comment posted on the PR');
    }
  } else if (kind === 'azure') {
    if (action === 'approve') {
      step(steps, 'approve vote', sh('az', ['repos', 'pr', 'set-vote', '--id', n, '--vote', 'approve']), 'vote recorded');
      step(steps, 'complete', sh('az', ['repos', 'pr', 'update', '--id', n, '--status', 'completed']), 'completed');
    } else {
      const posted = azureComment(n, comment.trim());
      steps.push({ step: 'comment', ok: posted.ok, note: posted.note });
      step(steps, 'abandon', sh('az', ['repos', 'pr', 'update', '--id', n, '--status', 'abandoned']), 'abandoned');
    }
  } else {
    throw repo.httpErr(400, 'PR actions support GitHub and Azure Repos origins');
  }
  cache = { t: 0, data: cache.data }; // drop the PR-list cache so the next load reflects this
  return { ok: steps.every((s) => s.ok), provider: kind, steps };
}

/** Best-effort: post the rejection comment as a PR thread via the REST invoke.
 *  Failure degrades to an honest note, never blocks the abandon. */
function azureComment(n, comment) {
  const show = sh('az', ['repos', 'pr', 'show', '--id', n, '-o', 'json']);
  if (!show.ok) {
    return { ok: false, note: 'comment not posted (cannot read the PR) — add it on the PR page' };
  }
  let repoId;
  let project;
  try {
    const pr = JSON.parse(show.out);
    repoId = pr.repository.id;
    project = pr.repository.project.name;
  } catch {
    return { ok: false, note: 'comment not posted (unexpected PR shape) — add it on the PR page' };
  }
  const body = { comments: [{ parentCommentId: 0, content: comment, commentType: 1 }], status: 1 };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'os-console-'));
  const tmp = path.join(dir, 'thread.json');
  try {
    fs.writeFileSync(tmp, JSON.stringify(body), 'utf8');
    const r = sh('az', ['devops', 'invoke', '--area', 'git', '--resource', 'pullRequestThreads',
      '--route-parameters', `project=${project}`, `repositoryId=${repoId}`,
      `pullRequestId=${n}`, '--http-method', 'POST',
      '--api-version', '6.0', '--in-file', tmp]);
    if (r.ok) return { ok: true, note: 'comment posted on the PR' };
    return { ok: false, note: `comment not posted (${(r.err || '').slice(0, 120)}) — add it on the PR page` };
  } finally {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch { /* temp dir already gone */ }
  }
}

/** Most-active leaderboards over the last 7 / 30 days — humans only, counted
 *  from the commits in local history. Credit goes to the commit AUTHOR (whoever
 *  produced the change); merge commits are skipped so approving or landing someone
 *  else's work never counts. Author-based counting works the same whether the team
 *  lands work as direct pushes or through pull requests, and needs no platform CLI.
 *  `force` is kept for route compatibility — history is read fresh on every call. */
export function leaders() {
  const r = gitlib.git(['log', '--since=30 days ago', '--no-merges', '--pretty=format:%ct%x1f%an%x1f%ae']);
  if (!r.ok) {
    return {
      available: false,
      provider: 'git',
      week: [],
      month: [],
      note: `git history unavailable (${(r.err || '').slice(0, 120)})`,
    };
  }
  const nowS = Date.now() / 1000;
  const week = new Map();
  const month = new Map();
  for (const line of r.out.split('\n')) {
    const parts = line.split('\x1f');
    if (parts.length !== 3) continue;
    const [ts, name, email] = parts;
    const seconds = parseInt(ts, 10);
    if (Number.isNaN(seconds)) continue;
    const ageS = nowS - seconds;
    if (isBotAuthor(name, email) || ageS > 30 * 86400) continue;
    month.set(name, (month.get(name) || 0) + 1);
    if (ageS <= 7 * 86400) week.set(name, (week.get(name) || 0) + 1);
  }
  const top = (counts) => [...counts.entries()]
    .map(([login, count]) => ({ login, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return { available: true, provider: 'git', note: null, week: top(week), month: top(month) };
}
