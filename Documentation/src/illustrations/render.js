// render.js — renders every schematic in this folder (*.html) to ../<name>.jpg, the JPEG that content.js embeds.
//   node render.js              → all schematics
//   node render.js <name>       → one of them (with or without .html)
// A schematic declares its canvas on <body data-canvas="WIDTHxHEIGHT">; it is captured at 2× for crisp text.
// Needs node 22+ and a Chromium-based browser — see ../chrome.js.
const fs = require("fs"), path = require("path");
const chrome = require("../chrome.js");

(async () => {
  const only = process.argv[2];
  const files = fs.readdirSync(__dirname).filter((f) => f.endsWith(".html") && (!only || f === only || f === `${only}.html`));
  if (!files.length) { console.error(`no schematic matches "${only}"`); process.exit(1); }
  await chrome.withBrowser(async (cdp) => {
    for (const f of files) {
      const html = fs.readFileSync(path.join(__dirname, f), "utf8");
      const m = /data-canvas="(\d+)x(\d+)"/.exec(html);
      const width = m ? +m[1] : 1200, height = m ? +m[2] : 800;
      const page = await chrome.openPage(cdp, chrome.fileUrl(path.join(__dirname, f)), { width, height, scale: 2 });
      const jpg = await chrome.screenshot(cdp, page, { width, height, quality: 90 });
      const out = path.join(__dirname, "..", f.replace(/\.html$/, ".jpg"));
      fs.writeFileSync(out, jpg);
      console.log("jpg →", path.relative(process.cwd(), out), jpg.length, "bytes,", `${width}×${height} @2×`);
      await chrome.closePage(cdp, page);
    }
  });
})().catch((e) => { console.error(e.message || e); process.exit(1); });
