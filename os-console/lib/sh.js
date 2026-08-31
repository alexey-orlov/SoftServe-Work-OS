// Subprocess helpers — the two things Node's standard library leaves to the
// caller that Python's shutil/subprocess gave us for free: PATH lookup
// (so a missing CLI is reported as "not found" rather than an opaque spawn
// error, and Windows .cmd/.exe shims resolve) and a decoded, size-safe,
// timeout-bounded run. Every external command in the console goes through here.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const MAX_BUFFER = 64 * 1024 * 1024; // git log --name-status over a long history
const whichCache = new Map();

/** Absolute path of an executable on PATH, or null. Honours PATHEXT on Windows,
 *  so `az` resolves to az.cmd and `gh` to gh.exe. */
export function which(cmd) {
  if (whichCache.has(cmd)) return whichCache.get(cmd);
  let found = null;
  if (cmd.includes('/') || cmd.includes('\\')) {
    found = fs.existsSync(cmd) ? cmd : null;
  } else {
    const isWin = process.platform === 'win32';
    const exts = isWin
      ? (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
      : [''];
    const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
    outer: for (const dir of dirs) {
      for (const ext of exts) {
        const candidate = path.join(dir, cmd + ext);
        try {
          const st = fs.statSync(candidate);
          if (st.isFile()) {
            found = candidate;
            break outer;
          }
        } catch { /* next candidate */ }
      }
    }
  }
  whichCache.set(cmd, found);
  return found;
}

/**
 * Run a command and return {ok, out, err}. Never throws — a missing binary, a
 * timeout, and a non-zero exit all come back as ok:false with a readable err,
 * which is what every caller here surfaces to the person.
 */
export function run(cmd, args, opts = {}) {
  const bin = which(cmd) || cmd;
  let p;
  try {
    p = spawnSync(bin, args, {
      cwd: opts.cwd,
      timeout: opts.timeout ?? 60000,
      maxBuffer: opts.maxBuffer ?? MAX_BUFFER,
      encoding: 'buffer',
      windowsHide: true,
    });
  } catch (e) {
    return { ok: false, out: '', err: String(e && e.message ? e.message : e) };
  }
  if (p.error) {
    const msg = p.error.code === 'ETIMEDOUT' ? `${cmd} timed out` : String(p.error.message || p.error);
    return { ok: false, out: '', err: msg };
  }
  const out = p.stdout ? p.stdout.toString('utf8') : '';
  const err = p.stderr ? p.stderr.toString('utf8') : '';
  if (p.status !== 0) {
    return { ok: false, out, err: err || `${cmd} exited ${p.status}` };
  }
  return { ok: true, out, err };
}
