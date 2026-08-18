// build.js — renders content.js (the single source) to the documentation site and one Word edition per platform.
//   node build.js            → writes ../work-os-docs.html, ../Work-OS-Team-Setup-GitHub.docx, ../Work-OS-Team-Setup-Azure-Repos.docx
//   node build.js <outDir>   → same, into <outDir>
// Needs: node (docx, image-size — `npm install` in this folder) and python3 (post-processes the .docx borders for strict validators).
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const doc = require("./content.js");
const OUT = process.argv[2] || path.join(__dirname, "..");
const PF = { github: "GitHub", azure: "Azure Repos" };
const CO_LABEL = { expected: "Expected", check: "Check in {gh:GitHub|az:Azure Repos}", note: "Note", why: "Why this matters", dont: "Don't", pass: "You're done when", tip: "Tip" };
const LOGO_PATHS = fs.readFileSync(path.join(__dirname, "logo-inner.svg.txt"), "utf8");
const LOGO_PNG = fs.readFileSync(path.join(__dirname, "softserve-logo.png"));

// ---------------------------------------------------------------- inline parser (shared)
// tokens: {gh:..|az:..}, [text](url), **bold**, `code`, *italic*
function tokens(text) {
  const out = []; let last = 0, m;
  const re = /(\{gh:[^{}]*?\|az:[^{}]*?\}|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ k: "t", v: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith("{gh:")) { const mm = /^\{gh:([^{}]*?)\|az:([^{}]*?)\}$/.exec(tok); out.push({ k: "pf", gh: mm[1], az: mm[2] }); }
    else if (tok.startsWith("[")) { const mm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok); out.push({ k: "a", v: mm[1], href: mm[2] }); }
    else if (tok.startsWith("**")) out.push({ k: "b", v: tok.slice(2, -2) });
    else if (tok.startsWith("`")) out.push({ k: "c", v: tok.slice(1, -1) });
    else out.push({ k: "i", v: tok.slice(1, -1) });
    last = m.index + tok.length;
  }
  if (last < text.length) out.push({ k: "t", v: text.slice(last) });
  return out;
}
const plain = (text) => tokens(text).map((t) => t.k === "pf" ? plain(t.gh) : t.k === "t" ? t.v : t.k === "a" || t.k === "b" || t.k === "i" ? plain(t.v) : t.v).join("");
const plainFor = (text, pf) => tokens(text).map((t) => t.k === "pf" ? plainFor(pf === "azure" ? t.az : t.gh, pf) : t.k === "t" ? t.v : t.k === "a" || t.k === "b" || t.k === "i" ? plainFor(t.v, pf) : t.v).join("");

// article index for internal links: "#/section/article[/heading]" → { s, a, h }
const ARTICLES = []; doc.sections.forEach((s) => s.articles.forEach((a) => ARTICLES.push({ s, a })));
function findHeading(a, id) { let found = null; (function walk(bs) { for (const b of bs) { if (found) return; if ((b.t === "h2" || b.t === "h3") && b.id === id) { found = b; return; } if (b.t === "platform") walk(b.blocks); if (b.t === "steps") b.items.forEach((it) => walk(it.sub)); if (b.t === "details") walk(b.blocks); } })(a.blocks); return found; }
function resolveInternal(href) {
  const m = /^#\/([\w-]+)\/([\w-]+)(?:\/([\w-]+))?$/.exec(href); if (!m) return null;
  const s = doc.sections.find((x) => x.id === m[1]); const a = s && s.articles.find((x) => x.id === m[2]); if (!a) return null;
  const h = m[3] ? findHeading(a, m[3]) : null; return { s, a, h };
}

// ================================================================ HTML SITE
const WARN = new Set();
const LEAK = /\b(GitHub\s*(\/|or|and)\s*Azure|Azure(\s+Repos| DevOps)?\s*(\/|or|and)\s*GitHub)\b/;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const hinl = (text) => tokens(text).map((t) => {
  switch (t.k) {
    case "t": if (LEAK.test(t.v)) WARN.add(`both platforms in one sentence: "${t.v.trim().slice(0, 90)}"`); return esc(t.v);
    case "b": return `<strong>${hinl(t.v)}</strong>`;
    case "i": return `<em>${hinl(t.v)}</em>`;
    case "c": return `<code>${esc(t.v).replace(/([^\s])\/(?=.)/g, "$1/<wbr>")}</code>`;
    case "a": if (t.href.startsWith("#/") && !resolveInternal(t.href)) WARN.add(`unresolved link ${t.href} ("${plain(t.v)}")`); return t.href.startsWith("#/") ? `<a href="${esc(t.href)}">${hinl(t.v)}</a>` : `<a href="${esc(t.href)}" target="_blank" rel="noopener">${hinl(t.v)}</a>`;
    case "pf": return `<span data-platform="github">${hinl(t.gh)}</span><span data-platform="azure">${hinl(t.az)}</span>`;
  }
}).join("");
let copyId = 0;
function html(blocks, ctx = { inStep: false, route: "" }) {
  const o = [];
  for (const b of blocks) {
    switch (b.t) {
      case "h2": o.push(`<h2 id="${b.id}">${hinl(b.text)}</h2>`); break;
      case "h3": o.push(`<h3 id="${b.id}">${hinl(b.text)}</h3>`); break;
      case "p": o.push(`<p>${hinl(b.text)}</p>`); break;
      case "lead": o.push(`<p class="lead">${hinl(b.text)}</p>`); break;
      case "terms": o.push(`<dl class="terms">${b.items.map((i) => `<div><dt>${hinl(i.term)}</dt><dd>${hinl(i.def)}</dd></div>`).join("")}</dl>`); break;
      case "bullets": o.push(`<ul>${b.items.map((i) => `<li>${hinl(i)}</li>`).join("")}</ul>`); break;
      case "checklist": o.push(`<ul class="checks">${b.items.map((i, n) => `<li><label><input type="checkbox" data-check="${ctx.route}-${n}"><span>${hinl(i)}</span></label></li>`).join("")}</ul>`); break;
      case "code": { const id = `c${++copyId}`; o.push(`<figure class="code"><figcaption><span>${b.label ? esc(b.label) : "Terminal"}</span><button type="button" class="copy" data-for="${id}">Copy</button></figcaption><pre id="${id}"><code>${esc(b.lines.join("\n"))}</code></pre></figure>`); break; }
      case "say": { const id = `c${++copyId}`; o.push(`<figure class="say"><figcaption><span>Say to Claude</span><button type="button" class="copy" data-for="${id}">Copy</button></figcaption><pre id="${id}">${esc(b.text)}</pre></figure>`); break; }
      case "callout": o.push(`<aside class="co co-${b.kind}"><span class="co-label">${hinl(CO_LABEL[b.kind])}</span><p>${hinl(b.text)}</p></aside>`); break;
      case "table": { const cg = b.widths ? `<colgroup>${(() => { const t = b.widths.reduce((x, y) => x + y, 0); return b.widths.map((w) => `<col style="width:${Math.round(w / t * 100)}%">`).join(""); })()}</colgroup>` : ""; o.push(`<div class="tbl"><table>${cg}<thead><tr>${b.header.map((h) => `<th>${hinl(h)}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c, i) => i === 0 && !b.header[0] ? `<th scope="row">${hinl(c)}</th>` : `<td>${hinl(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`); break; }
      case "steps": o.push(`<ol class="steps">${b.items.map((it) => `<li><div class="step-body"><p>${hinl(it.text)}</p>${html(it.sub, { ...ctx, inStep: true })}</div></li>`).join("")}</ol>`); break;
      case "platform": o.push(`<div class="pf" data-platform="${b.name}">${html(b.blocks, ctx)}</div>`); break;
      case "details": o.push(`<details class="more"><summary>${esc(b.summary)}</summary>${html(b.blocks, ctx)}</details>`); break;
      case "image": { const data = fs.readFileSync(path.join(__dirname, b.file)).toString("base64"); o.push(`<figure class="ill"><img src="data:image/jpeg;base64,${data}" alt="${esc(b.alt)}" loading="lazy">${b.caption ? `<figcaption>${hinl(b.caption)}</figcaption>` : ""}</figure>`); break; }
      case "seq": o.push(`<ol class="seq">${b.items.map((i, n) => `<li><div class="seq-n">${n + 1}</div><div class="seq-body"><div class="seq-who">${esc(i.who)}</div><p>${hinl(i.what)}</p><div class="seq-foot"><span class="seq-time">${esc(i.time)}</span><a href="${esc(i.link)}">${esc(i.label)} →</a></div></div></li>`).join("")}</ol>`); break;
    }
  }
  return o.join("\n");
}
function navTree(blocks, pf = null, acc = []) {
  for (const b of blocks) {
    if (b.t === "h2" || b.t === "h3") acc.push({ id: b.id, text: b.text, pf, level: b.t === "h2" ? 2 : 3 });
    else if (b.t === "platform") navTree(b.blocks, b.name, acc);
  }
  return acc;
}
const flat = ARTICLES.map(({ s, a }) => ({ s, a, route: `${s.id}/${a.id}` }));
const articlesHtml = flat.map(({ s, a, route }, idx) => {
  const rail = navTree(a.blocks);
  const prev = flat[idx - 1], next = flat[idx + 1];
  return `<article data-route="${route}" hidden>
  <div class="art-main">
    <p class="crumb"><a href="#/${s.id}/${s.articles[0].id}">${esc(s.title)}</a> <span>›</span> ${esc(a.title)}</p>
    <h1>${esc(a.title)}</h1>
    <p class="meta"><span class="meta-k">For</span> ${esc(a.audience)}${a.time ? ` <span class="meta-dot">·</span> <span class="meta-k">Time</span> ${esc(a.time)}` : ""}</p>
    ${html(a.blocks, { route })}
    <nav class="pager">${prev ? `<a class="pager-prev" href="#/${prev.route}"><span>Previous</span><b>${esc(prev.a.title)}</b></a>` : "<span></span>"}${next ? `<a class="pager-next" href="#/${next.route}"><span>Next</span><b>${esc(next.a.title)}</b></a>` : ""}</nav>
  </div>
  <nav class="rail" aria-label="On this page"><p class="rail-title">On this page</p><ol>${rail.map((h) => `<li class="l${h.level}"${h.pf ? ` data-platform="${h.pf}"` : ""}><a href="#/${route}/${h.id}" data-target="${h.id}">${hinl(h.text)}</a></li>`).join("")}</ol></nav>
</article>`;
}).join("\n");
const placeholders = doc.sections.filter((s) => !s.articles.length).map((s) => `<article data-route="${s.id}/index" hidden><div class="art-main"><p class="crumb">${esc(s.title)}</p><h1>${esc(s.title)}</h1><div class="empty"><p>${hinl(s.placeholder || "Nothing here yet.")}</p></div></div><nav class="rail" aria-label="On this page"></nav></article>`).join("");
const sideNav = doc.sections.map((s) => `<div class="side-sec" data-section="${s.id}" hidden><p class="side-title">${esc(s.title)}</p>${s.articles.length ? `<ol>${s.articles.map((a) => `<li><a href="#/${s.id}/${a.id}" data-route="${s.id}/${a.id}">${esc(a.title)}</a></li>`).join("")}</ol>` : `<p class="side-empty">No articles yet</p>`}</div>`).join("");
const firstRoute = (s) => s.articles.length ? `${s.id}/${s.articles[0].id}` : `${s.id}/index`;
const tabs = doc.sections.map((s) => `<a class="tab" data-section="${s.id}" href="#/${firstRoute(s)}">${esc(s.title)}</a>`).join("");
const mobileNav = `<details class="side-mobile"><summary>In this section</summary><div class="side-mobile-in"></div></details>`;

const page = `<title>${esc(doc.name)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{
  --accent:#1485C4; --accent-deep:#0E5E8B; --accent-soft:#D6EAF7; --accent-tint:#EEF6FC;
  --orange:#F46A4A;
  --bg:#FFFFFF; --surface:#FFFFFF; --panel:#F6F9FC; --line:#E3E8EE; --line-soft:#EDF1F5;
  --ink:#0A2540; --text:#425466; --muted:#697386; --faint:#8898AA;
  --code-bg:#F1F5F9; --code-fg:#0A2540; --say-bg:#F3F9FD; --say-line:#BFDDF1;
  --ok:#0F8A5F; --danger:#CD3D64;
  --shadow:0 1px 2px rgba(10,37,64,.05),0 6px 20px -12px rgba(10,37,64,.15);
  --radius:8px;
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --accent:#4FA9F1; --accent-deep:#8CC8F5; --accent-soft:#1F3B52; --accent-tint:#152736;
  --orange:#FE8D6B; --bg:#0F1519; --surface:#151B21; --panel:#1A2229; --line:#28323B; --line-soft:#212A32;
  --ink:#F1F5F9; --text:#CBD5DF; --muted:#94A3B3; --faint:#6E7C8B;
  --code-bg:#1C252E; --code-fg:#9CD0F5; --say-bg:#152331; --say-line:#2C4E69; --danger:#F27C9B;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 6px 20px -12px rgba(0,0,0,.6);
}}
:root[data-theme="dark"]{
  --accent:#4FA9F1; --accent-deep:#8CC8F5; --accent-soft:#1F3B52; --accent-tint:#152736;
  --orange:#FE8D6B; --bg:#0F1519; --surface:#151B21; --panel:#1A2229; --line:#28323B; --line-soft:#212A32;
  --ink:#F1F5F9; --text:#CBD5DF; --muted:#94A3B3; --faint:#6E7C8B;
  --code-bg:#1C252E; --code-fg:#9CD0F5; --say-bg:#152331; --say-line:#2C4E69; --danger:#F27C9B;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 6px 20px -12px rgba(0,0,0,.6);
}
*{box-sizing:border-box}
html{scroll-padding-top:88px}
@media (prefers-reduced-motion: reduce){*{transition:none!important;scroll-behavior:auto!important}}
body{margin:0; background:var(--bg); color:var(--text); font:15px/1.65 var(--font); -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility}
a{color:var(--accent-deep); text-decoration:none}
a:hover{text-decoration:underline; text-underline-offset:3px}
:focus-visible{outline:2px solid var(--accent); outline-offset:2px; border-radius:4px}
code{font-family:var(--mono); font-size:.86em; background:var(--code-bg); color:var(--code-fg); padding:.1em .32em; border-radius:4px; border:1px solid var(--line-soft); word-break:break-word}
strong{color:var(--ink); font-weight:600}
html[data-platform="github"] [data-platform="azure"]{display:none!important}
html[data-platform="azure"] [data-platform="github"]{display:none!important}

/* ---------- top bar */
.top{position:sticky; top:0; z-index:30; background:var(--bg); border-bottom:1px solid var(--line)}
.top-in{max-width:1400px; margin:0 auto; padding:0 28px; height:60px; display:flex; align-items:center; gap:28px}
.logo{display:flex; align-items:center; gap:14px; color:var(--ink); text-decoration:none!important}
.logo svg{height:15px; width:auto; fill:currentColor; display:block}
.logo .sep{width:1px; height:22px; background:var(--line)}
.logo .doc{font-size:14px; font-weight:600; color:var(--ink); letter-spacing:-.005em}
.tabs{display:flex; gap:6px; margin-left:8px; height:100%}
.tab{display:flex; align-items:center; padding:0 12px; font-size:14px; font-weight:500; color:var(--muted); border-bottom:2px solid transparent; margin-bottom:-1px; text-decoration:none!important}
.tab:hover{color:var(--ink)}
.tab.on{color:var(--accent-deep); border-bottom-color:var(--accent)}
.spacer{flex:1}
.pfsw{display:flex; align-items:center; gap:10px}
.pfsw-label{font-size:12px; color:var(--faint); letter-spacing:.06em; text-transform:uppercase; font-weight:600}
.seg{display:inline-flex; background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:3px; gap:2px}
.seg button{appearance:none; border:0; background:transparent; color:var(--muted); font:600 13px/1 var(--font); padding:7px 12px; border-radius:6px; cursor:pointer; white-space:nowrap; transition:background .15s,color .15s}
.seg button[aria-pressed="true"]{background:var(--surface); color:var(--accent-deep); box-shadow:0 1px 3px rgba(10,37,64,.15)}
.seg button:hover:not([aria-pressed="true"]){color:var(--ink)}
@media (max-width:760px){.logo .doc,.logo .sep,.pfsw-label{display:none} .top-in{gap:12px; padding:0 14px} .tabs{margin-left:0; gap:2px} .tab{padding:0 7px; font-size:13px} .seg button{padding:6px 8px; font-size:12px}}

/* ---------- layout */
.wrap{max-width:1400px; margin:0 auto; padding:0 28px; display:grid; grid-template-columns:240px minmax(0,1fr); gap:48px}
.side{position:sticky; top:60px; align-self:start; height:calc(100vh - 60px); overflow:auto; padding:32px 0 32px; border-right:1px solid var(--line-soft)}
.side-title{font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--faint); font-weight:700; margin:0 0 10px}
.side ol{list-style:none; margin:0; padding:0 16px 0 0}
.side li{margin:0 0 2px}
.side a{display:block; padding:7px 10px; border-radius:6px; color:var(--text); font-size:14px; line-height:1.35; text-decoration:none!important}
.side a:hover{background:var(--panel); color:var(--ink)}
.side a.on{background:var(--accent-tint); color:var(--accent-deep); font-weight:600}
.side-mobile{display:none}
article{display:grid; grid-template-columns:minmax(0,1fr) 220px; gap:56px; padding:36px 0 96px}
article[hidden]{display:none}
.art-main{min-width:0; max-width:720px}
.rail{position:sticky; top:84px; align-self:start; max-height:calc(100vh - 84px); overflow:auto; font-size:13px; padding-top:6px}
.rail-title{font-size:11px; letter-spacing:.09em; text-transform:uppercase; color:var(--faint); font-weight:700; margin:0 0 8px}
.rail ol{list-style:none; margin:0; padding:0; border-left:1px solid var(--line)}
.rail li a{display:block; padding:4px 0 4px 12px; margin-left:-1px; border-left:2px solid transparent; color:var(--muted); line-height:1.35; text-decoration:none!important}
.rail li.l3 a{padding-left:24px; font-size:12.5px}
.rail li a:hover{color:var(--ink)}
.rail li a.on{color:var(--accent-deep); border-left-color:var(--accent); font-weight:600}
@media (max-width:1180px){article{grid-template-columns:minmax(0,1fr)} .rail{display:none}}
@media (max-width:900px){.wrap{grid-template-columns:minmax(0,1fr); gap:0} .side{display:none} .side-mobile{display:block; margin:20px 0 0; border:1px solid var(--line); border-radius:var(--radius); background:var(--panel)} .side-mobile summary{padding:10px 14px; font-weight:600; color:var(--ink); cursor:pointer} .side-mobile ol{list-style:none; margin:0; padding:4px 14px 12px} .side-mobile li{margin:2px 0} .side-mobile a{display:block; padding:6px 8px; border-radius:6px} .side-mobile a.on{background:var(--accent-tint); color:var(--accent-deep); font-weight:600}}

/* ---------- article typography */
.crumb{font-size:13px; color:var(--muted); margin:0 0 10px}
.crumb span{margin:0 6px; color:var(--faint)}
h1{font-size:32px; line-height:1.2; letter-spacing:-.015em; color:var(--ink); margin:0 0 10px; font-weight:600; text-wrap:balance}
.meta{font-size:13px; color:var(--muted); margin:0 0 26px; padding-bottom:18px; border-bottom:1px solid var(--line)}
.meta-k{font-weight:600; color:var(--faint); letter-spacing:.04em; text-transform:uppercase; font-size:11px; margin-right:2px}
.meta-dot{margin:0 8px; color:var(--faint)}
h2{font-size:22px; line-height:1.3; letter-spacing:-.01em; color:var(--ink); margin:40px 0 12px; font-weight:600; padding-top:4px}
h3{font-size:16.5px; color:var(--ink); margin:26px 0 8px; font-weight:600}
p{margin:0 0 14px}
.lead{font-size:16.5px; line-height:1.6; color:var(--text)}
.art-main > ul, .art-main .pf > ul, .step-body ul{margin:0 0 14px; padding-left:22px}
.art-main li{margin:0 0 6px}
.art-main li::marker{color:var(--accent)}
dl.terms{margin:0 0 18px; display:grid; gap:10px}
dl.terms > div{padding:12px 14px; border:1px solid var(--line); border-radius:var(--radius); background:var(--panel)}
dl.terms dt{font-weight:600; color:var(--ink); margin:0 0 3px}
dl.terms dd{margin:0}
ul.checks{list-style:none; padding:0; margin:0 0 14px; border:1px solid var(--line); border-radius:var(--radius); overflow:hidden}
ul.checks li{margin:0; border-top:1px solid var(--line-soft)} ul.checks li:first-child{border-top:0}
ul.checks label{display:grid; grid-template-columns:18px 1fr; gap:12px; align-items:start; cursor:pointer; padding:11px 14px}
ul.checks label:hover{background:var(--panel)}
ul.checks input{width:16px; height:16px; margin:4px 0 0; accent-color:var(--accent)}
ul.checks input:checked + span{color:var(--muted)}
ol.steps{list-style:none; counter-reset:step; margin:0 0 18px; padding:0}
ol.steps > li{counter-increment:step; display:grid; grid-template-columns:30px 1fr; gap:14px; margin:0 0 16px; align-items:start}
ol.steps > li::before{content:counter(step); display:grid; place-items:center; width:26px; height:26px; border-radius:50%; background:var(--accent-tint); color:var(--accent-deep); border:1px solid var(--accent-soft); font:600 13px/1 var(--font); margin-top:2px; font-variant-numeric:tabular-nums}
.step-body{min-width:0; padding-top:3px}
.step-body > p:first-child{margin-bottom:8px}
.step-body > :last-child{margin-bottom:0}
figure.code, figure.say{margin:8px 0 14px; border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; background:var(--surface)}
figure figcaption{display:flex; align-items:center; justify-content:space-between; padding:5px 6px 5px 12px; font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--faint); font-weight:700; border-bottom:1px solid var(--line-soft); background:var(--panel)}
figure pre{margin:0; padding:11px 14px; overflow-x:auto; font:13px/1.55 var(--mono); color:var(--code-fg); white-space:pre-wrap; overflow-wrap:anywhere; background:var(--panel)}
figure pre code{background:none; border:0; color:inherit; padding:0; font-size:inherit}
figure.say{border-color:var(--say-line)}
figure.say figcaption{background:var(--say-bg); color:var(--accent-deep)}
figure.say pre{background:var(--say-bg); white-space:pre-wrap; font-family:var(--font); font-size:14.5px; color:var(--ink)}
figure.say pre::before{content:"“"; color:var(--accent); font-weight:700} figure.say pre::after{content:"”"; color:var(--accent); font-weight:700}
button.copy{appearance:none; border:1px solid var(--line); background:var(--surface); color:var(--muted); font:600 12px/1 var(--font); letter-spacing:0; text-transform:none; padding:4px 9px; border-radius:6px; cursor:pointer}
button.copy:hover{color:var(--ink); border-color:var(--accent)}
button.copy.done{color:var(--ok); border-color:var(--ok)}
aside.co{margin:10px 0 16px; padding:11px 14px; border:1px solid var(--line); border-left:3px solid var(--accent); border-radius:var(--radius); background:var(--panel)}
aside.co p{margin:0}
aside.co .co-label{display:block; margin:0 0 5px; font-size:11px; letter-spacing:.08em; text-transform:uppercase; font-weight:700; color:var(--accent-deep)}
aside.co-expected, aside.co-check, aside.co-pass{border-left-color:var(--orange); background:var(--accent-tint); border-color:var(--accent-soft)}
aside.co-expected .co-label, aside.co-check .co-label, aside.co-pass .co-label{color:var(--orange)}
aside.co-dont{border-left-color:var(--danger)} aside.co-dont .co-label{color:var(--danger)}
aside.co-why{border-left-color:var(--accent-soft)}
.tbl{overflow-x:auto; margin:6px 0 18px; border:1px solid var(--line); border-radius:var(--radius)}
table{border-collapse:collapse; width:100%; font-size:14px}
th,td{padding:10px 12px; text-align:left; vertical-align:top; border-bottom:1px solid var(--line-soft)}
td code{white-space:nowrap}
thead th{background:var(--panel); color:var(--ink); font-weight:600; font-size:12.5px; letter-spacing:.02em; border-bottom:1px solid var(--line)}
tbody tr:last-child td, tbody tr:last-child th{border-bottom:0}
tbody th[scope=row]{font-weight:600; color:var(--ink); background:var(--panel); width:22%}
details.more{margin:6px 0 18px; border:1px solid var(--line); border-radius:var(--radius); padding:0 16px; background:var(--surface)}
details.more summary{padding:12px 0; cursor:pointer; font-weight:600; color:var(--ink); list-style:none; display:flex; align-items:center; gap:10px}
details.more summary::before{content:""; width:7px; height:7px; border-right:2px solid var(--accent); border-bottom:2px solid var(--accent); transform:rotate(-45deg); margin-left:2px; transition:transform .15s}
details.more[open] summary::before{transform:rotate(45deg)}
details.more[open] summary{border-bottom:1px solid var(--line-soft); margin-bottom:12px}
ol.seq{list-style:none; margin:0 0 18px; padding:0; display:grid; gap:12px}
ol.seq li{display:grid; grid-template-columns:40px 1fr; gap:14px; padding:14px 16px; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface); box-shadow:var(--shadow)}
.seq-n{width:34px; height:34px; border-radius:50%; background:var(--accent); color:#fff; display:grid; place-items:center; font-weight:700; font-size:15px}
.seq-who{font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:var(--accent-deep); font-weight:700; margin-bottom:4px}
.seq-body p{margin:0 0 8px; color:var(--text)}
.seq-foot{display:flex; justify-content:space-between; gap:12px; font-size:13px; flex-wrap:wrap}
.seq-time{color:var(--muted)}
.empty{margin:8px 0 0; padding:28px 24px; border:1px dashed var(--line); border-radius:var(--radius); background:var(--panel); color:var(--muted); font-size:15px}
.empty p{margin:0}
.side-empty{font-size:13px; color:var(--faint); padding:6px 10px; margin:0}
figure.ill{margin:14px 0 22px; padding:10px; border:1px solid var(--line); border-radius:var(--radius); background:#fff}
figure.ill img{display:block; width:100%; height:auto; border-radius:4px}
figure.ill figcaption{display:block; font-size:12.5px; color:var(--muted); margin:8px 4px 0; padding:0; border:0; background:none; text-transform:none; letter-spacing:0; font-weight:400}
.pager{display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:56px; padding-top:22px; border-top:1px solid var(--line)}
.pager a{display:block; padding:12px 14px; border:1px solid var(--line); border-radius:var(--radius); text-decoration:none!important; color:var(--ink)}
.pager a:hover{border-color:var(--accent); background:var(--panel)}
.pager a span{display:block; font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--faint); font-weight:700; margin-bottom:2px}
.pager a b{font-weight:600}
.pager-next{text-align:right; grid-column:2}
.foot{max-width:1400px; margin:0 auto; padding:18px 28px 40px; border-top:1px solid var(--line); font-size:12.5px; color:var(--faint); display:flex; flex-wrap:wrap; gap:8px 24px}
@media print{.top,.side,.rail,.pager,button.copy{display:none!important} .wrap{display:block} article[hidden]{display:none!important} article{display:block} body{background:#fff}}
</style>

<header class="top"><div class="top-in">
  <a class="logo" href="#/${doc.home.join("/")}" aria-label="SoftServe — Work OS documentation"><svg viewBox="0 0 1010 173" role="img" aria-label="SoftServe">${LOGO_PATHS}</svg><span class="sep"></span><span class="doc">${esc(doc.siteTitle)}</span></a>
  <nav class="tabs" aria-label="Sections">${tabs}</nav>
  <span class="spacer"></span>
  <div class="pfsw"><span class="pfsw-label">Your platform</span><div class="seg" role="group" aria-label="Choose your git platform"><button type="button" data-set="github" aria-pressed="true">GitHub</button><button type="button" data-set="azure" aria-pressed="false">Azure Repos</button></div></div>
</div></header>

<div class="wrap">
  <nav class="side" aria-label="Articles in this section">${sideNav}</nav>
  <main>${mobileNav}${articlesHtml}${placeholders}</main>
</div>
<div class="foot"><span>SoftServe · Work OS team setup · ${esc(doc.version)}</span><span>Lives in the repository under <code>${esc(doc.repoPath)}</code></span></div>

<script>
(function(){
  var root=document.documentElement, KEY="wos-platform";
  var stored=null; try{stored=localStorage.getItem(KEY)}catch(e){}
  var q=new URLSearchParams(location.search); var pf=q.get("platform")||stored||"github"; if(pf!=="github"&&pf!=="azure")pf="github";
  function setPf(p){root.setAttribute("data-platform",p); try{localStorage.setItem(KEY,p)}catch(e){}
    document.querySelectorAll(".seg button").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.set===p))}); spy();}
  document.querySelectorAll(".seg button").forEach(function(b){b.addEventListener("click",function(){setPf(b.dataset.set)})});

  var articles=[].slice.call(document.querySelectorAll("article[data-route]"));
  var home="${doc.home.join("/")}", current=null;
  function parse(){var h=location.hash.replace(/^#\\/?/,""); var parts=h.split("/").filter(Boolean); return {section:parts[0],article:parts[1],heading:parts[2]}}
  function route(){
    var r=parse(); var key=r.section&&r.article?r.section+"/"+r.article:home;
    var art=articles.find(function(a){return a.dataset.route===key});
    if(!art){key=home; art=articles.find(function(a){return a.dataset.route===key}); r={}}
    var changed=current!==key; current=key;
    articles.forEach(function(a){a.hidden=a.dataset.route!==key});
    var sec=key.split("/")[0];
    document.querySelectorAll(".tab").forEach(function(t){t.classList.toggle("on",t.dataset.section===sec)});
    document.querySelectorAll(".side-sec").forEach(function(s){s.hidden=s.dataset.section!==sec});
    document.querySelectorAll(".side a").forEach(function(a){a.classList.toggle("on",a.dataset.route===key)});
    var mob=document.querySelector(".side-mobile-in"), src=document.querySelector('.side-sec[data-section="'+sec+'"] ol');
    if(mob){mob.innerHTML=src?src.outerHTML:'<p class="side-empty">No articles yet</p>'; mob.querySelectorAll("a").forEach(function(a){a.classList.toggle("on",a.dataset.route===key)});}
    document.title=art.querySelector("h1").textContent+" · ${esc(doc.name)}";
    if(r.heading){var el=art.querySelector("#"+CSS.escape(r.heading)); if(el)el.scrollIntoView({block:"start"});}
    else if(changed){window.scrollTo(0,0)}
    spy();
  }
  window.addEventListener("hashchange",route);
  document.addEventListener("click",function(e){var a=e.target.closest("a[href^='#/']"); if(!a)return; var parts=a.getAttribute("href").slice(2).split("/"); if(parts.length===3&&parts[0]+"/"+parts[1]===current){e.preventDefault(); history.replaceState(null,"",a.getAttribute("href")); var el=document.querySelector('article[data-route="'+current+'"] #'+CSS.escape(parts[2])); if(el)el.scrollIntoView({block:"start",behavior:"smooth"});}});

  function spy(){
    var art=articles.find(function(a){return !a.hidden}); if(!art)return;
    var links=[].slice.call(art.querySelectorAll(".rail a[data-target]")), y=window.scrollY+110, cur=null;
    links.forEach(function(a){var t=art.querySelector("#"+CSS.escape(a.dataset.target)); if(!t||t.offsetParent===null)return; if(t.getBoundingClientRect().top+window.scrollY<=y)cur=a;});
    links.forEach(function(a){a.classList.toggle("on",a===cur)});
  }
  window.addEventListener("scroll",spy,{passive:true}); window.addEventListener("resize",spy);

  document.querySelectorAll("button.copy").forEach(function(b){b.addEventListener("click",function(){
    var pre=document.getElementById(b.dataset.for), text=pre.textContent;
    function done(){b.textContent="Copied";b.classList.add("done");setTimeout(function(){b.textContent="Copy";b.classList.remove("done")},1600)}
    function fb(){var r=document.createRange();r.selectNodeContents(pre);var s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand("copy");done()}catch(e){}s.removeAllRanges()}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,fb)}else{fb()}
  })});
  document.querySelectorAll("ul.checks input").forEach(function(c){var k="wos-check-"+c.dataset.check; try{c.checked=localStorage.getItem(k)==="1"}catch(e){} c.addEventListener("change",function(){try{localStorage.setItem(k,c.checked?"1":"0")}catch(e){}})});

  setPf(pf); route();
})();
</script>`;
fs.writeFileSync(path.join(OUT, "work-os-docs.html"), page);
console.log("html →", "work-os-docs.html", page.length, "bytes,", flat.length, "articles");
if (WARN.size) { for (const w of WARN) console.log("⚠", w); } else console.log("links ok · no both-platform leaks");

// ================================================================ DOCX (one per platform)
const D = require("docx");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, AlignmentType, HeadingLevel, LevelFormat, Header, Footer, PageNumber, TabStopType, PageBreak, VerticalAlign, ImageRun, ExternalHyperlink } = D;
const BLUE = "1485C4", BLUE_75 = "459FDD", BLUE_50 = "C1DFF4", BLUE_DARK = "0E5E8B", ORANGE = "F46A4A", RED = "C74040";
const INK = "0A2540", TEXT = "425466", GREY_600 = "697386", GREY_300 = "D1DAE2", GREY_100 = "EDF0F2", GREY_50 = "F6F9FC";
const FONT = "Arial", MONO = "Consolas", PAGE_W = 11906, MARGIN = 1247, CONTENT_W = PAGE_W - 2 * MARGIN;
function dinl(text, pf, base = {}) {
  const out = [];
  for (const t of tokens(text)) {
    switch (t.k) {
      case "t": out.push(new TextRun({ text: t.v, ...base })); break;
      case "b": out.push(...dinl(t.v, pf, { ...base, bold: true })); break;
      case "i": out.push(...dinl(t.v, pf, { ...base, italics: true })); break;
      case "c": out.push(new TextRun({ text: t.v, font: MONO, size: (base.size || 20) - 1, color: base.color || BLUE_DARK, shading: { type: ShadingType.CLEAR, fill: GREY_100 } })); break;
      case "pf": out.push(...dinl(pf === "azure" ? t.az : t.gh, pf, base)); break;
      case "a": if (t.href.startsWith("#/")) { const r = resolveInternal(t.href); out.push(...dinl(t.v, pf, { ...base, color: BLUE_DARK })); if (r) out.push(new TextRun({ text: ` (see “${r.a.title}”${r.h ? " → " + plainFor(r.h.text, pf) : ""})`, ...base, color: GREY_600, size: (base.size || 20) - 2 })); }
        else out.push(new ExternalHyperlink({ link: t.href, children: dinl(t.v, pf, { ...base, color: BLUE_DARK, underline: {} }) })); break;
    }
  }
  return out;
}
let inst = 0;
function dx(blocks, pf, ctx = { list: null }) {
  const out = [];
  const P = (text, o = {}) => new Paragraph({ children: dinl(text, pf, o.run || {}), spacing: { after: 120, line: 276 }, ...(o.para || {}) });
  const newList = () => { const n = ++inst; return (text) => new Paragraph({ children: dinl(text, pf), numbering: { reference: "steps", level: 0, instance: n }, spacing: { after: 80, line: 276 } }); };
  const codeBlock = (lines, label) => { const r = []; if (label) r.push(new Paragraph({ children: [new TextRun({ text: label, size: 15, color: GREY_600, bold: true, allCaps: true, characterSpacing: 20 })], spacing: { before: 60, after: 20 }, indent: { left: 240 } })); lines.forEach((l, i) => r.push(new Paragraph({ children: [new TextRun({ text: l, font: MONO, size: 17, color: INK })], shading: { type: ShadingType.CLEAR, fill: GREY_50 }, border: { ...(i === 0 ? { top: { style: BorderStyle.SINGLE, size: 4, color: GREY_300, space: 4 } } : {}), left: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 8 }, ...(i === lines.length - 1 ? { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_300, space: 4 } } : {}) }, indent: { left: 240 }, spacing: { before: i === 0 && !label ? 60 : 0, after: i === lines.length - 1 ? 160 : 0, line: 260 } }))); return r; };
  // Label on its own line above the body, so every callout's text starts at the same left edge
  // (an inline label offsets the first line by its own width, which differs per kind).
  const callout = (kind, text) => { const lbl = plainFor(CO_LABEL[kind], pf); const strong = ["expected", "check", "pass"].includes(kind); const rule = kind === "dont" ? RED : strong ? ORANGE : BLUE_75; const shell = { shading: { type: ShadingType.CLEAR, fill: strong ? "EAF4FB" : GREY_50 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: rule, space: 8 } }, indent: { left: 240 } }; return [
    new Paragraph({ ...shell, keepNext: true, children: [new TextRun({ text: lbl.toUpperCase(), bold: true, color: kind === "dont" ? RED : strong ? ORANGE : BLUE_DARK, size: 15, characterSpacing: 15 })], spacing: { before: 40, after: 0, line: 240 } }),
    new Paragraph({ ...shell, children: dinl(text, pf, { size: 19, color: strong ? INK : TEXT }), spacing: { before: 0, after: 160, line: 264 } }),
  ]; };
  const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: GREY_300 }, borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
  const tbl = (header, rows, widths) => { widths = widths || header.map(() => Math.floor(CONTENT_W / header.length)); const scale = CONTENT_W / widths.reduce((a, b) => a + b, 0); widths = widths.map((w) => Math.round(w * scale)); const hasHead = header.some((h) => h); const mk = (cells, isHead, ri) => new TableRow({ tableHeader: isHead, cantSplit: true, children: cells.map((c, i) => new TableCell({ width: { size: widths[i], type: WidthType.DXA }, borders, verticalAlign: VerticalAlign.TOP, margins: { top: 70, bottom: 70, left: 100, right: 100 }, shading: isHead ? { type: ShadingType.CLEAR, fill: BLUE, color: "auto" } : (i === 0 && !header[0]) ? { type: ShadingType.CLEAR, fill: GREY_100, color: "auto" } : ri % 2 === 1 ? { type: ShadingType.CLEAR, fill: GREY_50, color: "auto" } : undefined, children: [new Paragraph({ children: dinl(c, pf, isHead ? { bold: true, color: "FFFFFF", size: 17 } : { size: 17, ...(i === 0 && !header[0] ? { bold: true } : {}) }), spacing: { after: 0, line: 252 } })] })) }); return [new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows: [...(hasHead ? [mk(header, true, 0)] : []), ...rows.map((r, i) => mk(r, false, i))] }), new Paragraph({ children: [], spacing: { after: 120 } })]; };
  for (const b of blocks) {
    switch (b.t) {
      case "h2": out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(plainFor(b.text, pf))] })); break;
      case "h3": out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(plainFor(b.text, pf))] })); break;
      case "p": out.push(P(b.text, ctx.list ? { para: { indent: { left: 540 } } } : {})); break;
      case "lead": out.push(P(b.text, { run: { size: 22, color: TEXT }, para: { spacing: { after: 200, line: 300 } } })); break;
      case "terms": b.items.forEach((i) => out.push(new Paragraph({ children: [new TextRun({ text: i.term, bold: true, color: INK }), new TextRun({ text: " — " }), ...dinl(i.def, pf)], spacing: { after: 100, line: 276 }, indent: { left: 240 }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: BLUE_50, space: 8 } } }))); break;
      case "bullets": b.items.forEach((i) => out.push(new Paragraph({ children: dinl(i, pf), numbering: { reference: "bullets", level: 0 }, spacing: { after: 60, line: 276 } }))); break;
      case "checklist": b.items.forEach((i) => out.push(new Paragraph({ children: dinl(i, pf), numbering: { reference: "checks", level: 0 }, spacing: { after: 60, line: 276 } }))); break;
      case "code": out.push(...codeBlock(b.lines, b.label)); break;
      case "say": out.push(new Paragraph({ children: [new TextRun({ text: "Say to Claude", size: 15, color: BLUE_DARK, bold: true, allCaps: true, characterSpacing: 20 })], spacing: { before: 60, after: 20 }, indent: { left: 240 } }), new Paragraph({ children: [new TextRun({ text: "“" + b.text + "”", size: 20, color: INK })], shading: { type: ShadingType.CLEAR, fill: "F0F7FC" }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: BLUE_75, space: 8 } }, indent: { left: 240 }, spacing: { after: 160, line: 264 } })); break;
      case "callout": out.push(...callout(b.kind, b.text)); break;
      case "table": out.push(...tbl(b.header, b.rows, b.widths)); break;
      case "steps": { const L = newList(); b.items.forEach((it) => { out.push(L(it.text)); out.push(...dx(it.sub, pf, { ...ctx, list: L })); }); break; }
      case "platform": if (b.name === pf) out.push(...dx(b.blocks, pf, ctx)); break;
      case "details": out.push(new Paragraph({ children: [new TextRun({ text: b.summary + ". ", bold: true, color: INK, size: 19 }), ...dinl(b.blocks.map((x) => x.text).join(" "), pf, { size: 19, color: TEXT })], shading: { type: ShadingType.CLEAR, fill: GREY_50 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: BLUE_75, space: 8 } }, indent: { left: 240 }, spacing: { before: 60, after: 200, line: 264 } })); break;
      case "image": { const buf = fs.readFileSync(path.join(__dirname, b.file)); const dim = require("image-size").imageSize ? require("image-size").imageSize(buf) : require("image-size")(buf); const wPt = 452, hPt = Math.round(wPt * dim.height / dim.width); out.push(new Paragraph({ children: [new ImageRun({ type: "jpg", data: buf, transformation: { width: wPt, height: hPt } })], spacing: { before: 120, after: 40 } })); if (b.caption) out.push(new Paragraph({ children: dinl(b.caption, pf, { size: 16, color: GREY_600, italics: true }), spacing: { after: 200 } })); break; }
      case "seq": b.items.forEach((i, n) => { const r = resolveInternal(i.link); out.push(new Paragraph({ children: [new TextRun({ text: `${n + 1}.  `, bold: true, color: BLUE, size: 22 }), new TextRun({ text: i.who + " — ", bold: true, color: INK }), ...dinl(i.what, pf), new TextRun({ text: `  (${i.time}; see “${r ? r.a.title : i.label}”)`, color: GREY_600, size: 18 })], spacing: { after: 120, line: 276 }, indent: { left: 240 }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: BLUE_50, space: 8 } } })); }); break;
    }
  }
  return out;
}
function buildDocx(pf) {
  const header = new Header({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }], border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 6 } }, spacing: { after: 240 }, children: [new ImageRun({ type: "png", data: LOGO_PNG, transformation: { width: 112, height: 20 } }), new TextRun({ text: `\tWork OS · Team setup · ${PF[pf]}`, color: GREY_600, size: 17 })] })] });
  const footer = new Footer({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }], border: { top: { style: BorderStyle.SINGLE, size: 4, color: GREY_300, space: 6 } }, children: [new TextRun({ text: `SoftServe · Work OS team setup · ${PF[pf]} edition · ${doc.version}`, color: GREY_600, size: 16 }), new TextRun({ text: "\tPage ", color: GREY_600, size: 16 }), new TextRun({ children: [PageNumber.CURRENT], color: GREY_600, size: 16 }), new TextRun({ text: " of ", color: GREY_600, size: 16 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], color: GREY_600, size: 16 })] })] });
  const body = [
    new Paragraph({ children: [new ImageRun({ type: "png", data: LOGO_PNG, transformation: { width: 190, height: 34 } })], spacing: { before: 400, after: 500 } }),
    new Paragraph({ children: [new TextRun({ text: `WORK OS  ·  TEAM SETUP  ·  ${PF[pf].toUpperCase()} EDITION`, color: ORANGE, bold: true, size: 18, characterSpacing: 40 })], spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: "Team Setup Guide", bold: true, size: 52, color: BLUE })], spacing: { after: 160, line: 240 } }),
    new Paragraph({ children: [new TextRun({ text: plainFor(doc.intro, pf), size: 23, color: TEXT })], spacing: { after: 400, line: 300 } }),
    new Paragraph({ children: [new TextRun({ text: "Contents", bold: true, size: 26, color: INK })], spacing: { after: 120 } }),
  ];
  for (const s of doc.sections) { body.push(new Paragraph({ children: [new TextRun({ text: s.title, bold: true, color: BLUE_DARK, size: 20 })], spacing: { before: 120, after: 40 } })); for (const a of s.articles) body.push(new Paragraph({ children: [new TextRun({ text: a.title, color: TEXT, size: 20 }), new TextRun({ text: `   ${a.audience}${a.time ? " · " + a.time : ""}`, color: GREY_600, size: 17 })], indent: { left: 360 }, spacing: { after: 30 } })); }
  for (const s of doc.sections) for (const a of s.articles) {
    body.push(new Paragraph({ children: [new PageBreak()] }));
    body.push(new Paragraph({ children: [new TextRun({ text: s.title.toUpperCase(), color: ORANGE, bold: true, size: 15, characterSpacing: 30 })], spacing: { after: 40 } }));
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(a.title)] }));
    body.push(new Paragraph({ children: [new TextRun({ text: `For: ${a.audience}${a.time ? "   ·   Time: " + a.time : ""}`, color: GREY_600, size: 18, italics: true })], spacing: { after: 200 } }));
    body.push(...dx(a.blocks, pf));
  }
  return new Document({
    creator: "SoftServe", title: `Work OS — Team Setup Guide (${PF[pf]})`, description: plainFor(doc.intro, pf),
    styles: { default: { document: { run: { font: FONT, size: 20, color: TEXT } } }, paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 36, bold: true, color: INK, font: FONT }, paragraph: { spacing: { before: 60, after: 120 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, color: INK, font: FONT }, paragraph: { spacing: { before: 320, after: 100 }, outlineLevel: 1, keepNext: true, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_300, space: 4 } } } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 21, bold: true, color: BLUE_DARK, font: FONT }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2, keepNext: true } },
    ] },
    numbering: { config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } }, run: { color: BLUE } } }] },
      { reference: "checks", levels: [{ level: 0, format: LevelFormat.BULLET, text: "☐", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } }, run: { color: BLUE } } }] },
      { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } }, run: { bold: true, color: BLUE } } }] },
    ] },
    sections: [{ properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: 1300, bottom: 1200, left: MARGIN, right: MARGIN, header: 560, footer: 520 } } }, headers: { default: header }, footers: { default: footer }, children: body }],
  });
}
(async () => {
  for (const pf of ["github", "azure"]) {
    const buf = await Packer.toBuffer(buildDocx(pf));
    const f = path.join(OUT, `Work-OS-Team-Setup-${pf === "github" ? "GitHub" : "Azure-Repos"}.docx`);
    fs.writeFileSync(f, buf);
    try { execFileSync("python3", [path.join(__dirname, "fix-pbdr.py"), f], { stdio: "ignore" }); } catch (e) { console.warn("  (python3 post-processing skipped — Word opens the file either way)"); }
    console.log("docx →", path.basename(f), buf.length, "bytes");
  }
})();
