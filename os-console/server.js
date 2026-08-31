#!/usr/bin/env node
// Work OS Console — local web UI over this repo. Zero install on any machine
// with Node 18+ (standard library only, no packages, no npm install):
//
//   node os-console/server.js        →  http://127.0.0.1:4820
//
// Reads the same registries the OS's hooks and skills read (write-policy.yaml,
// feature-index.yaml, toolchain.yaml, initiative pages, folder CLAUDE.md files).
// Writes go through ONE endpoint that resolves the write-policy tier for every
// path; each save is committed immediately (`console:` prefix) so concurrent
// Claude sessions never sweep console edits into their own commits. Gated files
// are badged in the UI — saving one IS the human approval. Binds localhost only.
// Live refresh uses a polling watcher, so change events arrive within ~2s.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as actions from './lib/actions.js';
import * as gitlib from './lib/gitlib.js';
import * as policy from './lib/policy.js';
import * as repo from './lib/repo.js';
import * as activity from './lib/adapters/activity.js';
import * as docs from './lib/adapters/docs.js';
import * as governance from './lib/adapters/governance.js';
import * as home from './lib/adapters/home.js';
import * as initiatives from './lib/adapters/initiatives.js';
import * as learnings from './lib/adapters/learnings.js';
import * as library from './lib/adapters/library.js';
import * as proposed from './lib/adapters/proposed.js';
import * as prs from './lib/adapters/prs.js';
import * as skills from './lib/adapters/skills.js';
import * as steering from './lib/adapters/steering.js';
import * as templates from './lib/adapters/templates.js';

const PORT = Number(process.env.OS_CONSOLE_PORT) || 4820;
const HOST = '127.0.0.1';
const BASE = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.join(BASE, 'web');
const VENDOR = path.join(BASE, 'vendor');
const STATE_FILE = path.join(BASE, 'state.json');

// ---------------------------------------------------------------- state.json

function loadState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
    return parsed;
  } catch {
    return { pins: [], collections: [], recents: [] };
  }
}

function saveState(state) {
  const s = state && typeof state === 'object' ? state : {};
  const clean = {
    pins: Array.isArray(s.pins) ? s.pins.slice(0, 200) : [],
    collections: Array.isArray(s.collections) ? s.collections.slice(0, 50) : [],
    recents: Array.isArray(s.recents) ? s.recents.slice(0, 30) : [],
  };
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(clean, null, 2)}\n`, 'utf8');
  return clean;
}

// ---------------------------------------------------------------- API routes

function fileInfo(q) {
  const rel = repo.resolveSafe(q.get('path')).rel;
  const st = repo.statOrNull(rel);
  if (!st || !st.isFile()) throw repo.httpErr(404, `${rel} not found`);
  const isText = repo.isTextPath(rel) && st.size < 1.5 * 1024 * 1024;
  const tier = policy.tierFor(rel);
  return {
    path: rel,
    isText,
    isImage: Boolean(repo.mimeFor(rel)),
    size: st.size,
    mtimeMs: repo.mtimeMs(st),
    tier: tier.tier,
    tierRule: tier.pattern || null,
    tierNote: tier.note || tier.heading || null,
    lastChange: gitlib.lastChangeIso(rel),
    linkedInitiatives: initiatives.reverseIndex()[rel] || [],
    content: isText ? repo.readText(rel) : null,
  };
}

function fileSave(q, body) {
  const rel = repo.resolveSafe(body.path).rel;
  const existed = repo.exists(rel);
  if (existed && body.baseMtimeMs) {
    const prev = repo.statOrNull(rel);
    if (prev && Math.abs(repo.mtimeMs(prev) - body.baseMtimeMs) > 1) {
      throw repo.httpErr(409, 'file changed on disk since you opened it (another session?) — reopen to get the latest');
    }
  }
  if (typeof body.content !== 'string') throw repo.httpErr(400, 'content required');
  const tier = policy.tierFor(rel);
  repo.writeText(rel, body.content);
  const commit = gitlib.commitPaths([rel], `console: ${existed ? 'edit' : 'new'} ${rel}`);
  const push = gitlib.maybePush(policy.load().settings);
  const st = repo.statOrNull(rel);
  return { ok: true, path: rel, tier: tier.tier, commit, push, mtimeMs: repo.mtimeMs(st) };
}

function search(q) {
  return { hits: gitlib.grep(q.get('q') || '').map((h) => ({ ...h, area: activity.areaFor(h.path) })) };
}

function gatedEdit(q, body) {
  const op = body.op;
  const settings = policy.load().settings;
  if (op === 'add') {
    return actions.gatedAdd(body.pattern, body.note || '', body.group || 'steering', settings);
  }
  if (op === 'remove') return actions.gatedRemove(body.pattern, settings);
  throw repo.httpErr(400, 'op must be add or remove');
}

const ROUTES = {
  'GET /api/overview': () => home.build(),
  'GET /api/initiatives': () => ({ items: initiatives.listPages() }),
  'POST /api/initiatives/status': (q, body) => initiatives.setStatus(
    body.slug, body.status, body.note || '', policy.load().settings, Boolean(body.force)),
  'POST /api/initiatives/attach': (q, body) => initiatives.attach(
    body.slug, body.path, body.label || '', policy.load().settings),
  'POST /api/initiatives/create': (q, body) => initiatives.create(
    body.slug, body.title, policy.load().settings, body.areas || [], body.features || []),
  'GET /api/library': (q) => library.dirInfo(q.get('path') || ''),
  'GET /api/file': fileInfo,
  'PUT /api/file': fileSave,
  'GET /api/features': () => steering.featureIndex(),
  'POST /api/toolchain': (q, body) => actions.toolchainSet(
    body.surface, body.approach, body.system, policy.load().settings),
  'POST /api/policy/gated': gatedEdit,
  'POST /api/autosync': (q, body) => actions.autosyncSet(body.mode),
  'POST /api/pr/action': (q, body) => prs.prAction(body.number, body.action, body.comment || ''),
  'POST /api/proposals/reject': (q, body) => actions.proposalReject(
    body.path, body.comment || '', policy.load().settings),
  'POST /api/initiatives/instructions': (q, body) => initiatives.setInstructions(
    body.slug, body.text || '', policy.load().settings),
  'POST /api/initiatives/sources': (q, body) => initiatives.setSources(
    body.slug, body.items, policy.load().settings),
  'GET /api/templates': () => templates.build(),
  'POST /api/templates/use': (q, body) => templates.use(
    body.template, body.dest, policy.load().settings),
  'GET /api/governance': () => governance.pageData(),
  'GET /api/activity': (q) => activity.build(q.get('limit')),
  'GET /api/learnings': () => learnings.build(),
  'POST /api/learnings': (q, body) => learnings.add(body.text, policy.load().settings),
  'GET /api/search': search,
  'GET /api/proposed': (q) => proposed.build(q.get('refresh') === '1'),
  'GET /api/leaders': (q) => prs.leaders(q.get('refresh') === '1'),
  'GET /api/tiers': (q) => library.tiers((q.get('paths') || '').split('|').filter(Boolean)),
  'GET /api/state': () => loadState(),
  'PUT /api/state': (q, body) => saveState(body),
  'GET /api/docs': () => docs.build(),
  'GET /api/skills': () => skills.build(),
};

// ---------------------------------------------------------------- live events
// Polling watcher + Server-Sent Events: connected consoles re-render when the
// repo changes — a Claude session committing, a hand edit, another console.

const sseClients = new Set();

const POLL_SECONDS = 1.5;
const WATCH_SKIP_DIRS = new Set(['.git', 'node_modules', '_extracted-personal']);

function broadcast(payload) {
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of [...sseClients]) {
    try {
      res.write(msg);
    } catch {
      sseClients.delete(res);
    }
  }
}

/** Snapshot of file mtimes under the repo (junk pruned), plus a .git
 *  ref/HEAD signature (= commits, branch switches — the only .git noise worth
 *  a refresh). */
function scanRepo() {
  const files = new Map();
  const root = repo.ROOT;
  const stack = [''];
  while (stack.length) {
    const relDir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(path.join(root, relDir), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const rel = relDir ? `${relDir}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        if (!WATCH_SKIP_DIRS.has(ent.name)) stack.push(rel);
        continue;
      }
      if (ent.name === '.DS_Store') continue;
      if (rel === 'os-console/state.json') continue; // prefs writes must not loop refreshes
      try {
        files.set(rel, fs.statSync(path.join(root, rel), { bigint: true }).mtimeNs);
      } catch { /* vanished between readdir and stat */ }
    }
  }
  const gitSig = [];
  try {
    gitSig.push(fs.statSync(path.join(root, '.git', 'HEAD'), { bigint: true }).mtimeNs);
  } catch { /* no .git — a plain unpacked copy */ }
  const refStack = [path.join(root, '.git', 'refs')];
  while (refStack.length) {
    const dir = refStack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        refStack.push(p);
        continue;
      }
      try {
        gitSig.push(fs.statSync(p, { bigint: true }).mtimeNs);
      } catch { /* raced with a ref update */ }
    }
  }
  gitSig.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return { files, gitSig: gitSig.join(',') };
}

function watchRepo() {
  let prev = scanRepo();
  setInterval(() => {
    let now;
    try {
      now = scanRepo();
    } catch {
      return;
    }
    const changed = [];
    for (const [rel, m] of now.files) if (prev.files.get(rel) !== m) changed.push(rel);
    for (const rel of prev.files.keys()) if (!now.files.has(rel)) changed.push(rel);
    if (now.gitSig !== prev.gitSig) changed.push('(git)');
    prev = now;
    if (changed.length) broadcast({ type: 'repo-changed', paths: changed.slice(0, 20) });
  }, POLL_SECONDS * 1000).unref();
  console.log(`  watching the repo (polling every ${POLL_SECONDS}s) — open consoles refresh live`);
}

// ---------------------------------------------------------------- static files

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': String(body.length),
  });
  res.end(body);
}

function sendBytes(res, status, contentType, body) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'Content-Length': String(body.length),
  });
  res.end(body);
}

function serveStatic(res, base, relPath) {
  const norm = path.posix.normalize(`/${relPath}`);
  const absPath = path.resolve(base, norm.replace(/^\/+/, ''));
  if (absPath !== base && !absPath.startsWith(base + path.sep)) {
    return sendJson(res, 404, { error: 'not found' });
  }
  let st;
  try {
    st = fs.statSync(absPath);
  } catch {
    return sendJson(res, 404, { error: 'not found' });
  }
  if (!st.isFile()) return sendJson(res, 404, { error: 'not found' });
  const body = fs.readFileSync(absPath);
  const ext = path.extname(absPath).toLowerCase();
  return sendBytes(res, 200, MIME[ext] || 'text/plain; charset=utf-8', body);
}

// The one CORS-open endpoint: lets the read-only snapshot page (any origin)
// detect a running full console and hand off to it. It exposes a static
// "I am the console" flag only — every data route stays same-origin.
// Private-Network-Access headers keep the probe working as browsers tighten
// public→local requests.
function servePing(req, res, method) {
  if (method === 'OPTIONS') {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Length': '0',
    };
    if (req.headers['access-control-request-private-network'] === 'true') {
      headers['Access-Control-Allow-Private-Network'] = 'true';
    }
    res.writeHead(204, headers);
    return res.end();
  }
  const body = Buffer.from(JSON.stringify({ console: true, app: 'work-os-console' }), 'utf8');
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Private-Network': 'true',
    'Content-Length': String(body.length),
  });
  return res.end(body);
}

function serveSse(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
  });
  if (res.socket) {
    res.socket.setNoDelay(true);
    res.socket.setTimeout(0);
  }
  res.write(': connected\n\n');
  sseClients.add(res);
  const hb = setInterval(() => {
    try {
      res.write(': hb\n\n');
    } catch {
      clearInterval(hb);
    }
  }, 30000);
  hb.unref();
  const drop = () => {
    clearInterval(hb);
    sseClients.delete(res);
  };
  req.on('close', drop);
  res.on('close', drop);
  res.on('error', drop);
}

function serveDocsSite(res, q) {
  const st = repo.statOrNull(docs.SITE);
  if (!st) {
    return sendJson(res, 404, { error: 'Documentation/work-os-docs.html is not present in this instance' });
  }
  if (q.get('embed') === '1') {
    // Embedded in the console: the console sidebar already does section
    // navigation, so hide the site's own header and re-anchor the two sticky
    // panels that assumed its 60px height. Injected at serve time — the file on
    // disk stays untouched; if the site's selectors ever change, this degrades
    // to simply showing the header again.
    const style = '<style id="console-embed">header.top{display:none}'
      + '.side{top:0; height:100vh}'
      + '.rail{top:24px; max-height:calc(100vh - 24px)}</style>';
    const html = repo.readText(docs.SITE);
    // The built site omits </head> (valid HTML5) — anchor after <title>, and if
    // even that changes, appending at the end still applies.
    const out = html.includes('</title>') ? html.replace('</title>', `</title>${style}`) : html + style;
    return sendBytes(res, 200, 'text/html; charset=utf-8', Buffer.from(out, 'utf8'));
  }
  const body = fs.readFileSync(repo.resolveSafe(docs.SITE).abs);
  return sendBytes(res, 200, 'text/html; charset=utf-8', body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const declared = parseInt(req.headers['content-length'] || '0', 10);
    const size = Number.isNaN(declared) ? 0 : declared;
    if (size > 5 * 1024 * 1024) {
      reject(repo.httpErr(413, 'body too large'));
      return;
    }
    if (size <= 0) {
      resolve({});
      return;
    }
    const chunks = [];
    let total = 0;
    req.on('data', (c) => {
      total += c.length;
      if (total > 5 * 1024 * 1024) {
        reject(repo.httpErr(413, 'body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('error', reject);
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(repo.httpErr(400, 'invalid JSON body'));
      }
    });
  });
}

async function handleRequest(req, res) {
  const method = req.method;
  const parsed = new URL(req.url, 'http://console.local');
  const pathname = parsed.pathname;
  const q = parsed.searchParams;
  const key = `${method} ${pathname}`;
  try {
    if (pathname === '/api/ping') return servePing(req, res, method);
    if (Object.prototype.hasOwnProperty.call(ROUTES, key)) {
      const body = method === 'PUT' || method === 'POST' ? await readBody(req) : null;
      return sendJson(res, 200, ROUTES[key](q, body));
    }
    if (key === 'GET /docs-site') return serveDocsSite(res, q);
    if (key === 'GET /api/events') return serveSse(req, res);
    if (key === 'GET /api/raw') {
      const r = repo.resolveSafe(q.get('path'));
      const mime = repo.mimeFor(r.rel);
      const st = repo.statOrNull(r.rel);
      if (!st || !st.isFile()) return sendJson(res, 404, { error: `${r.rel} not found` });
      return sendBytes(res, 200, mime || 'application/octet-stream', fs.readFileSync(r.abs));
    }
    if (pathname.startsWith('/api/')) return sendJson(res, 404, { error: `no route ${key}` });
    if (pathname.startsWith('/vendor/')) return serveStatic(res, VENDOR, pathname.slice('/vendor/'.length));
    if (pathname === '/' || pathname === '/index.html') return serveStatic(res, WEB, 'index.html');
    return serveStatic(res, WEB, pathname.slice(1));
  } catch (e) {
    const status = e instanceof repo.HttpError ? e.status : 500;
    if (status >= 500) {
      console.error(`[console] ${key} →`);
      console.error(e && e.stack ? e.stack : e);
    }
    if (res.headersSent) {
      res.destroy();
      return undefined;
    }
    try {
      return sendJson(res, status, { error: (e && e.message) || 'internal error' });
    } catch {
      return undefined; // client hung up mid-response
    }
  }
}

// ---------------------------------------------------------------- server

function main() {
  const server = http.createServer((req, res) => {
    res.on('error', () => { /* client hung up mid-response */ });
    handleRequest(req, res);
  });
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE' || e.code === 'EACCES') {
      console.error(`Port ${PORT} is already in use — is the console already running? `
        + '(OS_CONSOLE_PORT=<port> to change)');
      process.exit(1);
    }
    throw e;
  });
  server.listen(PORT, HOST, () => {
    console.log('');
    console.log('  Work OS Console');
    console.log(`  →  http://${HOST}:${PORT}`);
    console.log(`  repo: ${repo.ROOT}`);
    console.log('  write tiers come from governance/write-policy.yaml — gated files are badged; a save is your approval');
    watchRepo();
    console.log('');
  });
  process.on('SIGINT', () => process.exit(0));
}

main();
