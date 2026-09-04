// chrome.js — drives a Chromium-based browser over the DevTools protocol, with no npm dependencies.
//   Used by build-pdf.js (print one article to PDF) and illustrations/render.js (render a schematic to JPEG).
//   Needs Node 22+ (built-in WebSocket) and any Chromium-based browser: Google Chrome, Chromium, Microsoft
//   Edge, or the Chromium that Playwright installs. Set CHROME_PATH when auto-detection doesn't find one.
const fs = require("fs"), os = require("os"), path = require("path"), { spawn } = require("child_process"), { pathToFileURL } = require("url");

function findChrome() {
  const c = [];
  if (process.env.CHROME_PATH) c.push(process.env.CHROME_PATH);
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), ".cache", "ms-playwright");
  try {
    for (const d of fs.readdirSync(pw).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse())
      c.push(path.join(pw, d, "chrome-linux", "chrome"), path.join(pw, d, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"),
        path.join(pw, d, "chrome-mac-arm64", "Chromium.app", "Contents", "MacOS", "Chromium"), path.join(pw, d, "chrome-win", "chrome.exe"));
  } catch {}
  c.push(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge", "/snap/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  );
  if (process.env.LOCALAPPDATA) c.push(path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"));
  return c.find((p) => { try { return fs.statSync(p).isFile(); } catch { return false; } }) || null;
}

// Minimal DevTools-protocol client over the built-in WebSocket: one browser connection, flat sessions.
class Cdp {
  constructor(ws) { this.ws = ws; this.n = 0; this.pending = new Map(); this.listeners = new Set(); ws.onmessage = (e) => this.receive(String(e.data)); }
  receive(text) {
    const m = JSON.parse(text);
    if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? reject(new Error(`${m.error.message} (${m.error.code})`)) : resolve(m.result || {}); }
    else if (m.method) for (const l of this.listeners) l(m);
  }
  send(method, params = {}, sessionId) {
    const id = ++this.n, msg = { id, method, params }; if (sessionId) msg.sessionId = sessionId;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify(msg)); });
  }
  waitFor(method, sessionId, timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.listeners.delete(l); reject(new Error(`timeout waiting for ${method}`)); }, timeoutMs);
      const l = (m) => { if (m.method === method && (!sessionId || m.sessionId === sessionId)) { clearTimeout(t); this.listeners.delete(l); resolve(m.params); } };
      this.listeners.add(l);
    });
  }
}

// Starts a headless browser, hands the connection to fn, and always shuts the browser down afterwards.
async function withBrowser(fn) {
  if (typeof WebSocket === "undefined") throw new Error("Node 22 or later is needed (built-in WebSocket)");
  const exe = findChrome();
  if (!exe) throw new Error("No Chromium-based browser found — install Google Chrome, Chromium or Edge, or set CHROME_PATH to its executable");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "wos-chrome-"));
  const args = ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"];
  if (process.platform === "linux" && typeof process.getuid === "function" && process.getuid() === 0) args.unshift("--no-sandbox"); // root can't use Chrome's sandbox
  const child = spawn(exe, args, { stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  const wsUrl = await new Promise((resolve, reject) => {
    const onData = (d) => { log += d; const m = /DevTools listening on (ws:\/\/\S+)/.exec(log); if (m) resolve(m[1]); };
    child.stderr.on("data", onData); child.stdout.on("data", onData);
    child.on("exit", (code) => reject(new Error(`browser exited with code ${code}\n${log}`)));
    setTimeout(() => reject(new Error(`browser did not start within 30 s\n${log}`)), 30000);
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error("could not connect to the browser")); });
  const cdp = new Cdp(ws);
  try { return await fn(cdp); }
  finally {
    try { await Promise.race([cdp.send("Browser.close"), new Promise((r) => setTimeout(r, 3000))]); } catch {}
    try { ws.close(); } catch {}
    try { child.kill(); } catch {}
    setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} }, 500);
  }
}

// Opens url in a new tab sized width×height at the given device scale, waits for load, fonts and images.
async function openPage(cdp, url, { width = 1200, height = 800, scale = 1 } = {}) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: false }, sessionId);
  const loaded = cdp.waitFor("Page.loadEventFired", sessionId);
  await cdp.send("Page.navigate", { url }, sessionId);
  await loaded;
  // Fonts and eagerly loaded images; lazy images in hidden parts of a page never load, so they are not waited for,
  // and the whole wait is capped so a stalled resource can't hang the caller.
  await cdp.send("Runtime.evaluate", {
    expression: "Promise.race([new Promise((r) => setTimeout(r, 10000)), Promise.all([document.fonts ? document.fonts.ready : null, ...Array.from(document.images).filter((i) => !i.complete && i.loading !== 'lazy').map((i) => new Promise((r) => { i.onload = i.onerror = r; }))])]).then(() => true)",
    awaitPromise: true, returnByValue: true,
  }, sessionId);
  return { sessionId, targetId };
}

async function closePage(cdp, page) { try { await cdp.send("Target.closeTarget", { targetId: page.targetId }); } catch {} }

// Prints the open page to PDF. Templates use Chrome's header/footer classes (pageNumber, totalPages).
async function printToPdf(cdp, page, { header = "", footer = "", landscape = false } = {}) {
  const { stream } = await cdp.send("Page.printToPDF", {
    printBackground: true, preferCSSPageSize: true, landscape,
    displayHeaderFooter: !!(header || footer), headerTemplate: header || "<span></span>", footerTemplate: footer || "<span></span>",
    transferMode: "ReturnAsStream",
  }, page.sessionId);
  const chunks = [];
  for (;;) {
    const r = await cdp.send("IO.read", { handle: stream, size: 1 << 20 }, page.sessionId);
    chunks.push(Buffer.from(r.data, r.base64Encoded ? "base64" : "utf8"));
    if (r.eof) break;
  }
  await cdp.send("IO.close", { handle: stream }, page.sessionId);
  return Buffer.concat(chunks);
}

// Captures the open page's viewport (width×height CSS px, at the scale given to openPage) as JPEG or PNG.
async function screenshot(cdp, page, { width, height, format = "jpeg", quality = 90 } = {}) {
  const params = { format, captureBeyondViewport: true };
  if (format === "jpeg") params.quality = quality;
  if (width && height) params.clip = { x: 0, y: 0, width, height, scale: 1 };
  const { data } = await cdp.send("Page.captureScreenshot", params, page.sessionId);
  return Buffer.from(data, "base64");
}

const fileUrl = (p) => pathToFileURL(path.resolve(p)).href;

module.exports = { findChrome, withBrowser, openPage, closePage, printToPdf, screenshot, fileUrl };
