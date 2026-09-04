// build-pdf.js — renders ONE article of content.js (the single source) to a standalone, print-styled PDF.
//   node build-pdf.js                                  → Setup › Require approval for every Claude Code write → ../claude-code-team-setup.pdf
//   node build-pdf.js setup/claude-code                → the same article, by route (section/article, as in the site's links)
//   node build-pdf.js <route> --out <file.pdf> [--platform github|azure] [--html <keep the intermediate HTML here>]
// Needs node 22+ and a Chromium-based browser (chrome.js finds it; set CHROME_PATH otherwise). No npm dependencies.
// Never edit a PDF by hand — change content.js, then run build.js (the site) and this script (the PDF).
const fs = require("fs"), os = require("os"), path = require("path");
const doc = require("./content.js");
const chrome = require("./chrome.js");

// ---------------------------------------------------------------- arguments
let route = "setup/claude-code", out = null, platform = "github", keepHtml = null;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--out") out = argv[++i];
  else if (a === "--platform") platform = argv[++i];
  else if (a === "--html") keepHtml = argv[++i];
  else if (!a.startsWith("--")) route = a;
}
if (!["github", "azure"].includes(platform)) { console.error("--platform must be github or azure"); process.exit(1); }
const [sid, aid] = route.split("/");
const section = doc.sections.find((s) => s.id === sid);
const article = section && section.articles.find((a) => a.id === aid);
if (!article) {
  console.error(`no article at route "${route}". Routes: ${doc.sections.flatMap((s) => s.articles.map((a) => `${s.id}/${a.id}`)).join(", ")}`);
  process.exit(1);
}
const DEFAULT_OUT = { "setup/claude-code": "claude-code-team-setup.pdf" }; // the PDFs the repository ships, by route
out = path.resolve(out || path.join(__dirname, "..", DEFAULT_OUT[route] || `${sid}-${aid}.pdf`));

// ---------------------------------------------------------------- inline markup (same grammar as build.js — keep the two in sync)
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function tokens(text) {
  const outT = []; let last = 0, m;
  const re = /(\{gh:[^{}]*?\|az:[^{}]*?\}|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) outT.push({ k: "t", v: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith("{gh:")) { const mm = /^\{gh:([^{}]*?)\|az:([^{}]*?)\}$/.exec(tok); outT.push({ k: "pf", gh: mm[1], az: mm[2] }); }
    else if (tok.startsWith("[")) { const mm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok); outT.push({ k: "a", v: mm[1], href: mm[2] }); }
    else if (tok.startsWith("**")) outT.push({ k: "b", v: tok.slice(2, -2) });
    else if (tok.startsWith("`")) outT.push({ k: "c", v: tok.slice(1, -1) });
    else outT.push({ k: "i", v: tok.slice(1, -1) });
    last = m.index + tok.length;
  }
  if (last < text.length) outT.push({ k: "t", v: text.slice(last) });
  return outT;
}
// Internal links (#/section/article/heading) become italic cross-references: the PDF stands alone, and the
// cover says where the named articles live. External links stay clickable.
const inl = (text) => tokens(text).map((t) => {
  switch (t.k) {
    case "t": return esc(t.v);
    case "b": return `<strong>${inl(t.v)}</strong>`;
    case "i": return `<em>${inl(t.v)}</em>`;
    case "c": return `<code>${esc(t.v)}</code>`;
    case "pf": return inl(platform === "azure" ? t.az : t.gh);
    case "a": return t.href.startsWith("#/") ? `<em class="xref">${inl(t.v)}</em>` : `<a href="${esc(t.href)}">${inl(t.v)}</a>`;
  }
}).join("");

// ---------------------------------------------------------------- blocks
const CO_LABEL = { expected: "Expected", check: platform === "azure" ? "Check in Azure Repos" : "Check in GitHub", note: "Note", why: "Why this matters", dont: "Don't", pass: "You're done when", tip: "Tip" };
const KIND_NAME = { steering: "Steering file", registry: "Registry", living: "Living page", raw: "Raw material", deliverable: "Deliverable", template: "Template & guide" };
function render(blocks) {
  const o = [], merged = [];
  for (const b of blocks) { const last = merged[merged.length - 1]; if (b.t === "method" && last && last.t === "methodgroup") last.methods.push(b); else merged.push(b.t === "method" ? { t: "methodgroup", methods: [b] } : b); }
  for (const b of merged) {
    switch (b.t) {
      case "h2": o.push(`<h2 id="${b.id}">${inl(b.text)}</h2>`); break;
      case "h3": o.push(`<h3 id="${b.id}">${inl(b.text)}</h3>`); break;
      case "p": o.push(`<p>${inl(b.text)}</p>`); break;
      case "lead": o.push(`<p class="lead">${inl(b.text)}</p>`); break;
      case "terms": o.push(`<dl class="terms">${b.items.map((i) => `<div><dt>${inl(i.term)}</dt><dd>${inl(i.def)}</dd></div>`).join("")}</dl>`); break;
      case "bullets": o.push(`<ul>${b.items.map((i) => `<li>${inl(i)}</li>`).join("")}</ul>`); break;
      case "checklist": o.push(`<ul class="checks">${b.items.map((i) => `<li>${inl(i)}</li>`).join("")}</ul>`); break;
      case "code": o.push(`<figure class="code"><figcaption>${esc(b.label || "Terminal")}</figcaption><pre>${esc(b.lines.join("\n"))}</pre></figure>`); break;
      case "say": o.push(`<figure class="say"><figcaption>Say to Claude</figcaption><pre>${esc(b.text)}</pre></figure>`); break;
      case "callout": o.push(`<aside class="co co-${b.kind}"><span class="co-label">${esc(CO_LABEL[b.kind] || b.kind)}</span><p>${inl(b.text)}</p></aside>`); break;
      case "table": { const total = b.widths ? b.widths.reduce((x, y) => x + y, 0) : 0; const cg = b.widths ? `<colgroup>${b.widths.map((w) => `<col style="width:${Math.round(w / total * 100)}%">`).join("")}</colgroup>` : ""; o.push(`<table>${cg}<thead><tr>${b.header.map((h) => `<th>${inl(h)}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c, i) => i === 0 && !b.header[0] ? `<th scope="row">${inl(c)}</th>` : `<td>${inl(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`); break; }
      case "steps": o.push(`<ol class="steps">${b.items.map((it) => `<li><div class="step-body"><p>${inl(it.text)}</p>${render(it.sub)}</div></li>`).join("")}</ol>`); break;
      case "platform": if (b.name === platform) o.push(render(b.blocks)); break;
      case "methodgroup": o.push(b.methods.map((m) => `<section class="method"><p class="method-name">${m.name === "app" ? "Connectors screen" : "Chat commands"}</p>${render(m.blocks)}</section>`).join("")); break;
      case "details": o.push(`<section class="more"><p class="more-sum">${esc(b.summary)}</p>${render(b.blocks)}</section>`); break;
      case "image": { const file = path.join(__dirname, b.file), ext = path.extname(file).slice(1).toLowerCase(); const mime = ext === "png" ? "image/png" : ext === "svg" ? "image/svg+xml" : "image/jpeg"; o.push(`<figure class="ill"><img src="data:${mime};base64,${fs.readFileSync(file).toString("base64")}" alt="${esc(b.alt)}">${b.caption ? `<figcaption>${inl(b.caption)}</figcaption>` : ""}</figure>`); break; }
      case "seq": o.push(`<ol class="seq">${b.items.map((i) => `<li><p class="seq-who">${esc(i.who)}</p><p>${inl(i.what)}</p><p class="seq-time">${esc(i.time)} · <em class="xref">${esc(i.label)}</em></p></li>`).join("")}</ol>`); break;
      case "cards": o.push(`<ul>${b.items.map((c) => `<li><strong>${inl(c.title)}</strong> — ${inl(c.text)}</li>`).join("")}</ul>`); break;
      case "legend": o.push(`<table><thead><tr><th>Kind</th><th>What it is</th><th>How to treat it</th></tr></thead><tbody>${b.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${inl(i.what)}</td><td>${inl(i.treat)}</td></tr>`).join("")}</tbody></table>`); break;
      case "catalog": o.push(`<table><thead><tr><th>Item</th><th>Kind</th><th>What's in it</th><th>How it's used</th></tr></thead><tbody>${b.rows.map((r) => `<tr><td>${inl(r.name)}</td><td>${esc(KIND_NAME[r.kind] || r.kind)}</td><td>${inl(r.what)}</td><td>${inl(r.use)}</td></tr>`).join("")}</tbody></table>`); break;
      case "flowmap": o.push(`<table><thead><tr>${b.stages.map((s) => `<th>${esc(s.name)}</th>`).join("")}</tr></thead><tbody><tr>${b.stages.map((s) => `<td><p>${inl(s.desc)}</p>${s.skills.map((k) => `<code>${esc(k.s)}</code>`).join(" ")}</td>`).join("")}</tr></tbody></table>`); break;
      case "loop": o.push(`<p>${b.nodes.map((n) => `<strong>${inl(n.title)}</strong> (${inl(n.sub)})`).join(" ⇄ ")}</p>`); break;
      default: o.push(`<!-- unknown block ${b.t} -->`);
    }
  }
  return o.join("\n");
}

// ---------------------------------------------------------------- page
const LOGO = fs.readFileSync(path.join(__dirname, "logo-inner.svg.txt"), "utf8");
const built = new Date().toISOString().slice(0, 10);
const toc = article.blocks.filter((b) => b.t === "h2").map((b) => `<li>${inl(b.text)}</li>`).join("");
const platformName = platform === "azure" ? "Azure Repos" : "GitHub";
const page = `<!doctype html>
<meta charset="utf-8">
<title>${esc(article.title)} · ${esc(doc.name)}</title>
<style>
@page{size:A4; margin:18mm 16mm 20mm 16mm}
:root{--accent:#1485C4; --deep:#0E5E8B; --soft:#D6EAF7; --tint:#EEF6FC; --orange:#F46A4A; --ink:#0A2540; --text:#425466; --muted:#697386; --faint:#8898AA; --line:#E3E8EE; --line-soft:#EDF1F5; --panel:#F6F9FC; --code-bg:#F1F5F9; --say-bg:#F3F9FD; --say-line:#BFDDF1; --danger:#CD3D64;
  --font:-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Liberation Sans",sans-serif; --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace}
html{-webkit-print-color-adjust:exact; print-color-adjust:exact}
body{margin:0; font:10.5pt/1.55 var(--font); color:var(--text)}
a{color:var(--deep); text-decoration:none}
code{font-family:var(--mono); font-size:.88em; background:var(--code-bg); color:var(--ink); padding:.05em .3em; border-radius:3px; border:1px solid var(--line-soft)}
strong{color:var(--ink); font-weight:600}
em.xref{color:var(--deep)}
.cover{border-bottom:2px solid var(--accent); padding:0 0 12pt; margin:0 0 14pt}
.brand{display:flex; align-items:center; gap:9pt; color:var(--ink); margin:0 0 16pt}
.brand svg{height:10pt; width:auto; fill:currentColor; display:block}
.brand .sep{width:1px; height:13pt; background:var(--line)}
.brand .doc{font-size:9.5pt; font-weight:600}
.crumb{font-size:8pt; color:var(--muted); margin:0 0 5pt; letter-spacing:.06em; text-transform:uppercase; font-weight:700}
h1{font-size:24pt; line-height:1.15; letter-spacing:-.015em; color:var(--ink); margin:0 0 10pt; font-weight:600}
.lead{font-size:11.5pt; line-height:1.55; margin:0 0 12pt}
.meta{display:grid; grid-template-columns:1fr 1fr; gap:5pt 16pt; font-size:9.5pt; margin:0 0 12pt}
.meta div{display:flex; gap:6pt; align-items:baseline} .meta b{color:var(--faint); font-weight:700; letter-spacing:.05em; text-transform:uppercase; font-size:7.5pt; min-width:54pt}
.toc{background:var(--panel); border:1px solid var(--line); border-radius:6pt; padding:8pt 12pt}
.toc p{margin:0 0 4pt; font-size:7.5pt; letter-spacing:.08em; text-transform:uppercase; font-weight:700; color:var(--faint)}
.toc ol{margin:0; padding:0 0 0 16pt; columns:2; column-gap:18pt; font-size:9.5pt; color:var(--ink)} .toc li{break-inside:avoid; margin:0 0 2pt}
h2{font-size:15pt; line-height:1.25; color:var(--ink); margin:18pt 0 8pt; font-weight:600; break-after:avoid; padding-top:5pt; border-top:1px solid var(--line)}
h3{font-size:12pt; color:var(--ink); margin:13pt 0 6pt; font-weight:600; break-after:avoid}
p{margin:0 0 8pt}
ul{margin:0 0 8pt; padding-left:16pt} li{margin:0 0 4pt} li::marker{color:var(--accent)}
ul.checks{list-style:none; padding:0; border:1px solid var(--line); border-radius:6pt; overflow:hidden}
ul.checks li{margin:0; padding:6pt 10pt 6pt 26pt; border-top:1px solid var(--line-soft); position:relative; break-inside:avoid} ul.checks li:first-child{border-top:0}
ul.checks li::before{content:""; position:absolute; left:9pt; top:8pt; width:9pt; height:9pt; border:1.2pt solid var(--accent); border-radius:2pt}
ol.steps{list-style:none; counter-reset:step; margin:0 0 10pt; padding:0}
ol.steps > li{counter-increment:step; display:grid; grid-template-columns:20pt 1fr; gap:8pt; margin:0 0 8pt; break-inside:avoid}
ol.steps > li::before{content:counter(step); display:grid; place-items:center; width:17pt; height:17pt; border-radius:50%; background:var(--tint); color:var(--deep); border:1px solid var(--soft); font:600 9pt/1 var(--font); margin-top:1.5pt}
.step-body > p:first-child{margin-bottom:5pt} .step-body > :last-child{margin-bottom:0}
figure.code, figure.say{margin:6pt 0 9pt; border:1px solid var(--line); border-radius:6pt; overflow:hidden; break-inside:avoid}
figure figcaption{padding:3pt 9pt; font-size:7.5pt; letter-spacing:.06em; text-transform:uppercase; color:var(--faint); font-weight:700; border-bottom:1px solid var(--line-soft); background:var(--panel)}
figure pre{margin:0; padding:7pt 9pt; font:8.8pt/1.5 var(--mono); color:var(--ink); white-space:pre-wrap; overflow-wrap:anywhere; background:var(--panel)}
figure.say{border-color:var(--say-line)} figure.say figcaption{background:var(--say-bg); color:var(--deep)}
figure.say pre{background:var(--say-bg); font-family:var(--font); font-size:10pt} figure.say pre::before{content:"“"; color:var(--accent); font-weight:700} figure.say pre::after{content:"”"; color:var(--accent); font-weight:700}
aside.co{margin:6pt 0 9pt; padding:7pt 10pt; border:1px solid var(--line); border-left:3pt solid var(--accent); border-radius:5pt; background:var(--panel); break-inside:avoid}
aside.co p{margin:0} aside.co .co-label{display:block; margin:0 0 2pt; font-size:7.5pt; letter-spacing:.08em; text-transform:uppercase; font-weight:700; color:var(--deep)}
aside.co-expected, aside.co-check, aside.co-pass{border-left-color:var(--orange); background:var(--tint); border-color:var(--soft)} aside.co-expected .co-label, aside.co-check .co-label, aside.co-pass .co-label{color:var(--orange)}
aside.co-dont{border-left-color:var(--danger)} aside.co-dont .co-label{color:var(--danger)}
aside.co-why{border-left-color:var(--soft)}
table{border-collapse:collapse; width:100%; font-size:9.3pt; margin:4pt 0 10pt; border:1px solid var(--line)}
th,td{padding:5pt 7pt; text-align:left; vertical-align:top; border-bottom:1px solid var(--line-soft)}
thead th{background:var(--panel); color:var(--ink); font-weight:600; font-size:8.5pt; border-bottom:1px solid var(--line)}
tbody th[scope=row]{font-weight:600; color:var(--ink); background:var(--panel)}
tr{break-inside:avoid} thead{display:table-header-group}
dl.terms{margin:0 0 10pt} dl.terms > div{padding:6pt 9pt; border:1px solid var(--line); border-radius:5pt; background:var(--panel); margin:0 0 5pt; break-inside:avoid} dl.terms dt{font-weight:600; color:var(--ink)} dl.terms dd{margin:0}
figure.ill{margin:8pt 0 12pt; padding:6pt; border:1px solid var(--line); border-radius:6pt; break-inside:avoid}
figure.ill img{display:block; width:100%; height:auto; border-radius:3pt}
figure.ill figcaption{font-size:8.5pt; color:var(--muted); margin:5pt 2pt 0; padding:0; border:0; background:none; text-transform:none; letter-spacing:0; font-weight:400}
section.method, section.more{border:1px solid var(--line); border-radius:6pt; padding:6pt 10pt; margin:0 0 8pt}
.method-name{font-size:8pt; letter-spacing:.08em; text-transform:uppercase; font-weight:700; color:var(--deep); margin:0 0 6pt}
.more-sum{font-weight:600; color:var(--ink); margin:0 0 6pt}
ol.seq{padding-left:16pt} .seq-who{font-size:8pt; letter-spacing:.06em; text-transform:uppercase; color:var(--deep); font-weight:700; margin:0} .seq-time{font-size:9pt; color:var(--muted)}
.endnote{margin-top:16pt; padding-top:8pt; border-top:1px solid var(--line); font-size:8.5pt; color:var(--faint)}
</style>
<header class="cover">
  <div class="brand"><svg viewBox="0 0 1010 173" role="img" aria-label="SoftServe">${LOGO}</svg><span class="sep"></span><span class="doc">${esc(doc.siteTitle)}</span></div>
  <p class="crumb">${esc(section.title)} · ${esc(article.title)}</p>
  <h1>${esc(article.title)}</h1>
  ${article.blocks.filter((b) => b.t === "lead").map((b) => `<p class="lead">${inl(b.text)}</p>`).join("")}
  <div class="meta">
    <div><b>For</b><span>${esc(article.audience)}</span></div>
    ${article.time ? `<div><b>Time</b><span>${esc(article.time)}</span></div>` : ""}
    <div><b>Version</b><span>${esc(doc.version)} · built ${built}</span></div>
    <div><b>Also online</b><span>${esc(doc.name)} site › ${esc(section.title)} › ${esc(article.title)}. Italic names are other articles of that site${platform === "azure" || /\{gh:/.test(JSON.stringify(article.blocks)) ? `; this copy shows the ${platformName} wording` : ""}.</span></div>
  </div>
  ${toc ? `<div class="toc"><p>In this document</p><ol>${toc}</ol></div>` : ""}
</header>
<main>
${render(article.blocks.filter((b) => b.t !== "lead"))}
</main>
<p class="endnote">SoftServe · ${esc(doc.name)} · ${esc(doc.version)} · Built from the single source <code>${esc(doc.repoPath)}src/content.js</code> — change it there and rebuild; this file is an output.</p>
`;

const footer = `<div style="font-family:-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:7.5pt;color:#8898AA;width:100%;padding:0 16mm;display:flex;justify-content:space-between;align-items:center"><span>SoftServe · ${esc(doc.name)} · ${esc(article.title)} · ${esc(doc.version)}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`;

// ---------------------------------------------------------------- print
(async () => {
  const htmlPath = keepHtml ? path.resolve(keepHtml) : path.join(fs.mkdtempSync(path.join(os.tmpdir(), "wos-pdf-")), "article.html");
  fs.writeFileSync(htmlPath, page);
  const pdf = await chrome.withBrowser(async (cdp) => {
    const p = await chrome.openPage(cdp, chrome.fileUrl(htmlPath), { width: 900, height: 1200 });
    const buf = await chrome.printToPdf(cdp, p, { footer });
    await chrome.closePage(cdp, p);
    return buf;
  });
  fs.writeFileSync(out, pdf);
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log("pdf →", path.relative(process.cwd(), out) || out, pdf.length, "bytes,", pages, "pages,", `${platformName} wording`);
  if (keepHtml) console.log("html →", htmlPath); else fs.rmSync(path.dirname(htmlPath), { recursive: true, force: true });
})().catch((e) => { console.error(e.message || e); process.exit(1); });
