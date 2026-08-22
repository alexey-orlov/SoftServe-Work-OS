'use strict';
// Pull requests adapter — open PRs waiting for review and merged-PR leaderboards.
// Shells the platform CLI read-only (gh for GitHub origins, az for Azure Repos),
// detected from the git origin like the pr-flow hook does. Results are cached
// (TTL below); missing/unauthenticated CLIs degrade to an honest note, never an error.
const { execFileSync } = require('child_process');
const repo = require('../repo');

const TTL = 5 * 60 * 1000;
let cache = { t: 0, data: null };

function sh(cmd, args) {
  try {
    return { ok: true, out: execFileSync(cmd, args, { cwd: repo.ROOT, encoding: 'utf8', timeout: 12000, maxBuffer: 8 * 1024 * 1024 }) };
  } catch (e) {
    return { ok: false, err: String(e.stderr || e.message || '').slice(0, 300) };
  }
}

function provider() {
  const r = sh('git', ['remote', 'get-url', 'origin']);
  if (!r.ok) return 'none';
  if (/github\./i.test(r.out)) return 'github';
  if (/dev\.azure\.com|visualstudio\.com/i.test(r.out)) return 'azure';
  return 'other';
}

function isBotLogin(login) { return /\[bot\]$|-bot$|^bot-/i.test(login || ''); }

function fetchGithub() {
  const open = sh('gh', ['pr', 'list', '--state', 'open', '--limit', '50',
    '--json', 'number,title,author,createdAt,url,isDraft']);
  if (!open.ok) {
    return { available: false, provider: 'github', open: [], merged: [], note: 'gh CLI unavailable or not authenticated — run `gh auth login` to see pull requests here' };
  }
  const merged = sh('gh', ['pr', 'list', '--state', 'merged', '--limit', '100', '--json', 'author,mergedAt']);
  return {
    available: true, provider: 'github', note: null,
    open: JSON.parse(open.out).map((p) => ({
      number: p.number, title: p.title, url: p.url, createdAt: p.createdAt, draft: !!p.isDraft,
      author: (p.author && p.author.login) || '?',
      isBot: !!(p.author && (p.author.is_bot || isBotLogin(p.author.login))),
    })),
    merged: merged.ok ? JSON.parse(merged.out).map((p) => ({
      author: (p.author && p.author.login) || null, mergedAt: p.mergedAt,
      isBot: !!(p.author && (p.author.is_bot || isBotLogin(p.author.login))),
    })) : [],
  };
}

function fetchAzure() {
  const open = sh('az', ['repos', 'pr', 'list', '--status', 'active', '-o', 'json']);
  if (!open.ok) {
    return { available: false, provider: 'azure', open: [], merged: [], note: 'az CLI unavailable — `az login` + `az extension add --name azure-devops` to see pull requests here' };
  }
  const merged = sh('az', ['repos', 'pr', 'list', '--status', 'completed', '--top', '100', '-o', 'json']);
  const map = (p) => ({
    number: p.pullRequestId, title: p.title, url: '', draft: !!p.isDraft,
    createdAt: p.creationDate, mergedAt: p.closedDate,
    author: (p.createdBy && (p.createdBy.uniqueName || p.createdBy.displayName)) || '?',
    isBot: isBotLogin(p.createdBy && p.createdBy.uniqueName),
  });
  return {
    available: true, provider: 'azure', note: null,
    open: JSON.parse(open.out).map(map),
    merged: merged.ok ? JSON.parse(merged.out).map(map) : [],
  };
}

function data(force) {
  if (!force && cache.data && Date.now() - cache.t < TTL) return cache.data;
  const kind = provider();
  const d = kind === 'github' ? fetchGithub()
    : kind === 'azure' ? fetchAzure()
      : { available: false, provider: kind, open: [], merged: [], note: kind === 'none' ? 'no git origin configured' : 'PR listing supports GitHub and Azure Repos origins' };
  cache = { t: Date.now(), data: d };
  return d;
}

// Open PRs waiting for a human (bots filtered out).
function openPrs(force) {
  const d = data(force);
  return { available: d.available, provider: d.provider, note: d.note, items: d.open.filter((p) => !p.isBot) };
}

// Merged-PR leaderboards over the last 7 / 30 days — humans only.
function leaders(force) {
  const d = data(force);
  const out = { available: d.available, provider: d.provider, note: d.note, week: [], month: [] };
  if (!d.available) return out;
  const now = Date.now();
  for (const [key, span] of [['week', 7 * 864e5], ['month', 30 * 864e5]]) {
    const counts = {};
    for (const m of d.merged) {
      if (!m.author || m.isBot || !m.mergedAt) continue;
      if (now - Date.parse(m.mergedAt) > span) continue;
      counts[m.author] = (counts[m.author] || 0) + 1;
    }
    out[key] = Object.entries(counts)
      .map(([login, count]) => ({ login, count }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
  }
  return out;
}

module.exports = { openPrs, leaders };
