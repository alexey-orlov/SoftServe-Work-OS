// Light-mode snapshot — os-console/console.html is DERIVED output: one self-contained,
// read-only console for people without Node.js. It is regenerated, never edited, by
// three writers that all run the same builder: the turn-end auto-sync hook (with the
// work it describes, on every machine that has Node), the console's Rebuild action,
// and a person running `node os-console/build-console.js`. This module reads the
// stamp the builder leaves in the file's <head> and measures it against HEAD.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as gitlib from './gitlib.js';
import * as policy from './policy.js';
import * as repo from './repo.js';
import { run } from './sh.js';

export const FILE = gitlib.SNAPSHOT_PATH;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILDER = path.join(path.dirname(HERE), 'build-console.js');
const STAMP_RX = /<meta name="os-console-snapshot" content="([^"]*)">/;

/** The builder's stamp {sha, shaFull, branch, builtAt}; null when there is no file.
 *  Reads the head of the file only — the stamp sits in <head>, the 5 MB follow it. */
export function stamp() {
  const abs = repo.resolveSafe(FILE).abs;
  let fd;
  try {
    fd = fs.openSync(abs, 'r');
  } catch {
    return null;
  }
  try {
    const buf = Buffer.alloc(16384);
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    const m = buf.toString('utf8', 0, n).match(STAMP_RX);
    if (!m) return legacyStamp(abs);
    const out = {};
    for (const kv of m[1].split(';')) {
      const i = kv.indexOf('=');
      if (i > 0) out[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
    }
    return out;
  } finally {
    fs.closeSync(fd);
  }
}

// Snapshots built before the stamp existed carry the same facts inside the baked
// JSON; one regex over the file finds them.
function legacyStamp(abs) {
  try {
    const m = fs.readFileSync(abs, 'utf8').match(/"meta":\{"sha":"([0-9a-f]+)","branch":"([^"]*)","builtAt":"([^"]*)"/);
    return m ? { sha: m[1], branch: m[2], builtAt: m[3] } : {};
  } catch {
    return {};
  }
}

/** Where the snapshot stands against HEAD: `behind` = commits since its source that
 *  touched anything but the snapshot itself (0 = current); null = not measurable. */
export function info() {
  const st = repo.statOrNull(FILE);
  if (!st) {
    return { exists: false, path: FILE, behind: null, current: false,
      note: 'no snapshot file yet — Rebuild creates it' };
  }
  const s = stamp() || {};
  const sha = s.shaFull || s.sha || null;
  let behind = null;
  if (sha && gitlib.git(['rev-parse', '--verify', '--quiet', `${sha}^{commit}`]).ok) {
    const c = gitlib.git(['rev-list', '--count', `${sha}..HEAD`, '--', '.', `:(exclude)${FILE}`]);
    if (c.ok) behind = parseInt(c.out.trim(), 10) || 0;
  }
  return {
    exists: true,
    path: FILE,
    sizeBytes: st.size,
    sha: s.sha || null,
    shaFull: s.shaFull || null,
    branch: s.branch || null,
    builtAt: s.builtAt || null,
    behind,
    current: behind === 0,
    note: behind !== null ? null
      : (sha ? 'built from a commit this clone does not have — pull, or rebuild' : 'no build stamp — rebuild to get one'),
  };
}

/** Rebuild from HEAD's tree (never the working tree — held gated edits must not leak
 *  into a file that lands on the shared branch), commit it, push per auto-sync. */
export function rebuild(settings) {
  const out = repo.resolveSafe(FILE).abs;
  const branch = gitlib.statusInfo().branch || 'HEAD';
  const r = run(process.execPath, [BUILDER, '--ref', 'HEAD', '--out', out, '--branch', branch],
    { cwd: repo.ROOT, timeout: 180000 });
  if (!r.ok) {
    const why = String(r.err || r.out || '').trim().split('\n').pop();
    throw repo.httpErr(500, `snapshot build failed: ${why || 'unknown error'}`);
  }
  const src = gitlib.git(['rev-parse', '--short', 'HEAD']);
  const commit = gitlib.commitPaths([FILE], `console: rebuild snapshot (source ${src.ok ? src.out.trim() : 'HEAD'})`);
  const push = gitlib.maybePush(settings || policy.load().settings);
  return { ok: true, path: FILE, commit, push, snapshot: info() };
}
