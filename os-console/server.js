#!/usr/bin/env node
'use strict';
// Work OS Console — local web UI over this repo. Zero install:
//
//   node os-console/server.js        →  http://127.0.0.1:4820
//
// Reads the same registries the OS's hooks and skills read (write-policy.yaml,
// feature-index.yaml, toolchain.yaml, initiative pages, folder CLAUDE.md files).
// Writes go through ONE endpoint that resolves the write-policy tier for every
// path; each save is committed immediately (`console:` prefix) so concurrent
// Claude sessions never sweep console edits into their own commits. Gated files
// are badged in the UI — saving one IS the human approval. Binds localhost only.

const http = require('http');
const fsp = require('fs');
const path = require('path');

const repo = require('./lib/repo');
const policy = require('./lib/policy');
const gitlib = require('./lib/git');
const home = require('./lib/adapters/home');
const initiatives = require('./lib/adapters/initiatives');
const library = require('./lib/adapters/library');
const steering = require('./lib/adapters/steering');
const templates = require('./lib/adapters/templates');
const governance = require('./lib/adapters/governance');
const activity = require('./lib/adapters/activity');
const learnings = require('./lib/adapters/learnings');
const docs = require('./lib/adapters/docs');

const PORT = Number(process.env.OS_CONSOLE_PORT || 4820);
const HOST = '127.0.0.1';
const WEB = path.join(__dirname, 'web');
const VENDOR = path.join(__dirname, 'vendor');
const STATE_FILE = path.join(__dirname, 'state.json');

// ---------------------------------------------------------------- helpers

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 5 * 1024 * 1024) { reject(repo.httpErr(413, 'body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(repo.httpErr(400, 'invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function loadState() {
  try { return JSON.parse(fsp.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { pins: [], collections: [], recents: [] }; }
}

function saveState(state) {
  const clean = {
    pins: Array.isArray(state.pins) ? state.pins.slice(0, 200) : [],
    collections: Array.isArray(state.collections) ? state.collections.slice(0, 50) : [],
    recents: Array.isArray(state.recents) ? state.recents.slice(0, 30) : [],
  };
  fsp.writeFileSync(STATE_FILE, JSON.stringify(clean, null, 2) + '\n', 'utf8');
  return clean;
}

// ---------------------------------------------------------------- API routes

const routes = {

  'GET /api/overview': () => home.build(),

  'GET /api/initiatives': () => ({ items: initiatives.list() }),

  'POST /api/initiatives/status': async (q, body) =>
    initiatives.setStatus(body.slug, body.status, body.note || '', policy.load().settings),

  'POST /api/initiatives/attach': async (q, body) =>
    initiatives.attach(body.slug, body.path, body.label || '', policy.load().settings),

  'POST /api/initiatives/create': async (q, body) =>
    initiatives.create(body.slug, body.title, policy.load().settings),

  'GET /api/library': (q) => library.dirInfo(q.get('path') || ''),

  'GET /api/file': (q) => {
    const { rel } = repo.resolveSafe(q.get('path'));
    const st = repo.statOrNull(rel);
    if (!st || !st.isFile()) throw repo.httpErr(404, `${rel} not found`);
    const isText = repo.isTextPath(rel) && st.size < 1.5 * 1024 * 1024;
    const tier = policy.tierFor(rel);
    return {
      path: rel,
      isText,
      isImage: !!repo.mimeFor(rel),
      size: st.size,
      mtimeMs: st.mtimeMs,
      tier: tier.tier,
      tierRule: tier.pattern || null,
      tierNote: tier.note || tier.heading || null,
      lastChange: gitlib.lastChangeIso(rel),
      linkedInitiatives: initiatives.reverseIndex()[rel] || [],
      content: isText ? repo.readText(rel) : null,
    };
  },

  'PUT /api/file': async (q, body) => {
    const { rel } = repo.resolveSafe(body.path);
    const existed = repo.exists(rel);
    if (existed && body.baseMtimeMs) {
      const st = repo.statOrNull(rel);
      if (st && Math.abs(st.mtimeMs - body.baseMtimeMs) > 1) {
        throw repo.httpErr(409, 'file changed on disk since you opened it (another session?) — reopen to get the latest');
      }
    }
    if (typeof body.content !== 'string') throw repo.httpErr(400, 'content required');
    const tier = policy.tierFor(rel);
    repo.writeText(rel, body.content);
    const commit = gitlib.commitPaths([rel], `console: ${existed ? 'edit' : 'new'} ${rel}`);
    const push = gitlib.maybePush(policy.load().settings);
    const st = repo.statOrNull(rel);
    return { ok: true, path: rel, tier: tier.tier, commit, push, mtimeMs: st ? st.mtimeMs : null };
  },

  'GET /api/steering': () => steering.build(),

  'GET /api/templates': () => templates.build(),

  'POST /api/templates/use': async (q, body) =>
    templates.use(body.template, body.dest, policy.load().settings),

  'GET /api/governance': () => governance.build(),

  'GET /api/activity': (q) => activity.build(q.get('limit')),

  'GET /api/learnings': () => learnings.build(),

  'POST /api/learnings': async (q, body) => learnings.add(body.text, policy.load().settings),

  'GET /api/search': (q) => {
    const hits = gitlib.grep(q.get('q') || '');
    return { hits: hits.map((h) => ({ ...h, area: activity.areaFor(h.path) })) };
  },

  'GET /api/state': () => loadState(),
  'PUT /api/state': async (q, body) => saveState(body),

  'GET /api/docs': () => docs.build(),
};

// ---------------------------------------------------------------- live events
// fs.watch (recursive) + Server-Sent Events: connected consoles re-render when
// the repo changes — a Claude session committing, a hand edit, another console.

const sseClients = new Set();

function broadcast(payload) {
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  for (const c of sseClients) { try { c.write(msg); } catch { sseClients.delete(c); } }
}

let pendingChanges = new Set();
let flushTimer = null;
function noteChange(rel) {
  pendingChanges.add(rel);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    const paths = [...pendingChanges].slice(0, 20);
    pendingChanges = new Set();
    broadcast({ type: 'repo-changed', paths });
  }, 350);
}

function watchRepo() {
  try {
    fsp.watch(repo.ROOT, { recursive: true }, (eventType, fname) => {
      if (!fname) return noteChange('(repo)');
      const rel = String(fname).split(path.sep).join('/');
      // .git fires constantly during operations — only ref/HEAD moves (= commits,
      // branch switches) are worth a refresh.
      if (rel === '.git' || rel.startsWith('.git/')) {
        if (rel === '.git/HEAD' || rel.startsWith('.git/refs/')) noteChange('(git)');
        return;
      }
      if (rel === 'os-console/state.json') return; // prefs writes must not loop refreshes
      if (rel.endsWith('.DS_Store') || rel.startsWith('node_modules/') || rel.startsWith('_extracted-personal/')) return;
      noteChange(rel);
    });
    console.log('  watching the repo — open consoles refresh live');
  } catch (e) {
    console.log(`  fs.watch unavailable here (${e.message}) — live refresh off, the ⟳ button still works`);
  }
}

setInterval(() => { for (const c of sseClients) { try { c.write(': hb\n\n'); } catch { sseClients.delete(c); } } }, 30000).unref();

// ---------------------------------------------------------------- static files

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

function serveStatic(res, base, relPath) {
  const abs = path.resolve(base, '.' + path.posix.normalize('/' + relPath));
  if (!abs.startsWith(base + path.sep) && abs !== base) { json(res, 404, { error: 'not found' }); return; }
  let st;
  try { st = fsp.statSync(abs); } catch { json(res, 404, { error: 'not found' }); return; }
  if (!st.isFile()) { json(res, 404, { error: 'not found' }); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  fsp.createReadStream(abs).pipe(res);
}

// ---------------------------------------------------------------- server

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const key = `${req.method} ${url.pathname}`;

  try {
    if (routes[key]) {
      const body = (req.method === 'PUT' || req.method === 'POST') ? await readBody(req) : null;
      const out = await routes[key](url.searchParams, body);
      return json(res, 200, out);
    }
    if (key === 'GET /docs-site') {
      const st = repo.statOrNull(docs.SITE);
      if (!st) return json(res, 404, { error: 'Documentation/work-os-docs.html is not present in this instance' });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return fsp.createReadStream(repo.resolveSafe(docs.SITE).abs).pipe(res);
    }
    if (key === 'GET /api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'Connection': 'keep-alive' });
      res.write(': connected\n\n');
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }
    if (key === 'GET /api/raw') {
      const { rel, abs } = repo.resolveSafe(url.searchParams.get('path'));
      const mime = repo.mimeFor(rel);
      const st = repo.statOrNull(rel);
      if (!st || !st.isFile()) return json(res, 404, { error: `${rel} not found` });
      res.writeHead(200, { 'Content-Type': mime || 'application/octet-stream', 'Cache-Control': 'no-store' });
      return fsp.createReadStream(abs).pipe(res);
    }
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: `no route ${key}` });
    if (url.pathname.startsWith('/vendor/')) return serveStatic(res, VENDOR, url.pathname.slice('/vendor/'.length));
    if (url.pathname === '/' || url.pathname === '/index.html') return serveStatic(res, WEB, 'index.html');
    return serveStatic(res, WEB, url.pathname.slice(1));
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error(`[console] ${key} →`, e);
    return json(res, status, { error: e.message || 'internal error' });
  }
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

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use — is the console already running? (OS_CONSOLE_PORT=<port> to change)`);
    process.exit(1);
  }
  throw e;
});
