// build.js — renders content.js (the single source) to the self-contained documentation site.
//   node build.js            → writes ../work-os-docs.html
//   node build.js <outDir>   → same, into <outDir>
// Needs: node only — no npm dependencies.
const fs = require("fs"), path = require("path");
const doc = require("./content.js");
const OUT = process.argv[2] || path.join(__dirname, "..");
const CO_LABEL = { expected: "Expected", check: "Check in {gh:GitHub|az:Azure Repos}", note: "Note", why: "Why this matters", dont: "Don't", pass: "You're done when", tip: "Tip" };
const LOGO_PATHS = fs.readFileSync(path.join(__dirname, "logo-inner.svg.txt"), "utf8");

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

// article index for internal links: "#/section/article[/heading]" → { s, a, h }
const ARTICLES = []; doc.sections.forEach((s) => s.articles.forEach((a) => ARTICLES.push({ s, a })));
function findHeading(a, id) { let found = null; (function walk(bs) { for (const b of bs) { if (found) return; if ((b.t === "h2" || b.t === "h3") && b.id === id) { found = b; return; } if (b.t === "platform" || b.t === "method") walk(b.blocks); if (b.t === "steps") b.items.forEach((it) => walk(it.sub)); if (b.t === "details") walk(b.blocks); } })(a.blocks); return found; }
function resolveInternal(href) {
  const m = /^#\/([\w-]+)\/([\w-]+)(?:\/([\w-]+))?$/.exec(href); if (!m) return null;
  const s = doc.sections.find((x) => x.id === m[1]); const a = s && s.articles.find((x) => x.id === m[2]); if (!a) return null;
  const h = m[3] ? findHeading(a, m[3]) : null; return { s, a, h };
}

// ================================================================ HTML SITE
const WARN = new Set();
const LEAK = /\b(GitHub\s*(\/|or|and)\s*Azure|Azure(\s+Repos| DevOps)?\s*(\/|or|and)\s*GitHub)\b/;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// nolink renders link tokens as their inner formatted text instead of an <a> — for contexts that
// are themselves a link (the "On this page" rail). A nested <a> is invalid: browsers split it, so a
// heading containing a Markdown link would grow a second rail entry that navigates off the page.
const hinl = (text, nolink) => tokens(text).map((t) => {
  switch (t.k) {
    case "t": if (LEAK.test(t.v)) WARN.add(`both platforms in one sentence: "${t.v.trim().slice(0, 90)}"`); return esc(t.v);
    case "b": return `<strong>${hinl(t.v, nolink)}</strong>`;
    case "i": return `<em>${hinl(t.v, nolink)}</em>`;
    case "c": return `<code>${esc(t.v).replace(/([^\s])\/(?=.)/g, "$1/<wbr>")}</code>`;
    case "a": if (t.href.startsWith("#/") && !resolveInternal(t.href)) WARN.add(`unresolved link ${t.href} ("${plain(t.v)}")`); return nolink ? hinl(t.v, nolink) : t.href.startsWith("#/") ? `<a href="${esc(t.href)}">${hinl(t.v)}</a>` : `<a href="${esc(t.href)}" target="_blank" rel="noopener">${hinl(t.v)}</a>`;
    case "pf": return `<span data-platform="github">${hinl(t.gh, nolink)}</span><span data-platform="azure">${hinl(t.az, nolink)}</span>`;
  }
}).join("");
const hnav = (text) => hinl(text, true);
// A callout / say / code that follows a step list (or sits inside a step) is part of that
// procedure, so it aligns with the step BODY column rather than the base content column —
// otherwise it hangs out to the left of the step text above it. This walks a block list and
// reports whether it leaves the reader "in step flow" (last content was a step list, or an
// outcome callout attached to one), so a trailing sibling can inherit that alignment.
function endsInStepFlow(blocks, flow = false) {
  for (const b of blocks) {
    if (b.t === "steps") flow = true;
    else if (b.t === "platform") flow = endsInStepFlow(b.blocks, flow);
    else if (b.t === "method") flow = false; // method runs render as a bordered card — its edge closes the procedure
    else if (b.t === "callout" || b.t === "say" || b.t === "code") { /* keep flow */ }
    else flow = false;
  }
  return flow;
}
let copyId = 0;
function html(blocks, ctx = { inStep: false, route: "", flow: false }) {
  const o = [];
  let flow = ctx.flow || false; // did the previous sibling leave us in a step procedure?
  // Consecutive method() blocks merge into one tabbed card: the switch renders as the card's tab
  // bar, so the control is physically attached to the instructions it swaps (SDK-docs code-tab
  // pattern) instead of floating above them.
  const merged = [];
  for (const b of blocks) {
    const last = merged[merged.length - 1];
    if (b.t === "method" && last && last.t === "methodgroup") last.methods.push(b);
    else merged.push(b.t === "method" ? { t: "methodgroup", methods: [b] } : b);
  }
  for (const b of merged) {
    const stepAligned = flow && !ctx.inStep; // indent outcome callouts to the step-body column
    switch (b.t) {
      case "h2": o.push(`<h2 id="${b.id}">${hinl(b.text)}</h2>`); break;
      case "h3": o.push(`<h3 id="${b.id}">${hinl(b.text)}</h3>`); break;
      case "p": o.push(`<p>${hinl(b.text)}</p>`); break;
      case "lead": o.push(`<p class="lead">${hinl(b.text)}</p>`); break;
      case "terms": o.push(`<dl class="terms">${b.items.map((i) => `<div><dt>${hinl(i.term)}</dt><dd>${hinl(i.def)}</dd></div>`).join("")}</dl>`); break;
      case "bullets": o.push(`<ul>${b.items.map((i) => `<li>${hinl(i)}</li>`).join("")}</ul>`); break;
      case "checklist": o.push(`<ul class="checks">${b.items.map((i, n) => `<li><label><input type="checkbox" data-check="${ctx.route}-${n}"><span>${hinl(i)}</span></label></li>`).join("")}</ul>`); break;
      case "code": { const id = `c${++copyId}`; o.push(`<figure class="code${stepAligned ? " flow-in" : ""}"><figcaption><span>${b.label ? esc(b.label) : "Terminal"}</span><button type="button" class="copy" data-for="${id}">Copy</button></figcaption><pre id="${id}"><code>${esc(b.lines.join("\n"))}</code></pre></figure>`); break; }
      case "say": { const id = `c${++copyId}`; o.push(`<figure class="say${stepAligned ? " flow-in" : ""}"><figcaption><span>Say to Claude</span><button type="button" class="copy" data-for="${id}">Copy</button></figcaption><pre id="${id}">${esc(b.text)}</pre></figure>`); break; }
      case "callout": o.push(`<aside class="co co-${b.kind}${stepAligned ? " flow-in" : ""}"><span class="co-label">${hinl(CO_LABEL[b.kind])}</span><p>${hinl(b.text)}</p></aside>`); break;
      case "table": { const cg = b.widths ? `<colgroup>${(() => { const t = b.widths.reduce((x, y) => x + y, 0); return b.widths.map((w) => `<col style="width:${Math.round(w / t * 100)}%">`).join(""); })()}</colgroup>` : ""; o.push(`<div class="tbl"><table>${cg}<thead><tr>${b.header.map((h) => `<th>${hinl(h)}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c, i) => i === 0 && !b.header[0] ? `<th scope="row">${hinl(c)}</th>` : `<td>${hinl(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`); break; }
      case "steps": o.push(`<ol class="steps">${b.items.map((it) => `<li><div class="step-body"><p>${hinl(it.text)}</p>${html(it.sub, { ...ctx, inStep: true, flow: false })}</div></li>`).join("")}</ol>`); break;
      case "platform": o.push(`<div class="pf" data-platform="${b.name}">${html(b.blocks, { ...ctx, flow })}</div>`); break;
      case "methodgroup": o.push(`<section class="mth-card">${MTHTABS}${b.methods.map((m) => `<div class="mth" data-method="${m.name}">${html(m.blocks, { ...ctx, flow })}</div>`).join("")}</section>`); break;
      case "details": o.push(`<details class="more"><summary>${esc(b.summary)}</summary>${html(b.blocks, { ...ctx, flow: false })}</details>`); break;
      case "image": { const data = fs.readFileSync(path.join(__dirname, b.file)).toString("base64"); o.push(`<figure class="ill"><img src="data:image/jpeg;base64,${data}" alt="${esc(b.alt)}" loading="lazy">${b.caption ? `<figcaption>${hinl(b.caption)}</figcaption>` : ""}</figure>`); break; }
      case "seq": o.push(`<ol class="seq">${b.items.map((i, n) => `<li><div class="seq-n">${n + 1}</div><div class="seq-body"><div class="seq-who">${esc(i.who)}</div><p>${hinl(i.what)}</p><div class="seq-foot"><span class="seq-time">${esc(i.time)}</span><a href="${esc(i.link)}">${esc(i.label)} →</a></div></div></li>`).join("")}</ol>`); break;
    }
    // Carry step-flow to the next sibling: steps open it; callout/say/code keep it; platform
    // continues it only if its own tail is still in flow; a method card's border closes the
    // procedure visually, so it (and anything else) closes it.
    if (b.t === "steps") flow = true;
    else if (b.t === "platform") flow = endsInStepFlow(b.blocks, flow);
    else if (b.t === "callout" || b.t === "say" || b.t === "code") { /* keep flow */ }
    else flow = false;
  }
  return o.join("\n");
}
function navTree(blocks, pf = null, mth = null, acc = []) {
  for (const b of blocks) {
    if (b.t === "h2" || b.t === "h3") acc.push({ id: b.id, text: b.text, pf, mth, level: b.t === "h2" ? 2 : 3 });
    else if (b.t === "platform") navTree(b.blocks, b.name, mth, acc);
    else if (b.t === "method") navTree(b.blocks, pf, b.name, acc);
  }
  return acc;
}
const flat = ARTICLES.map(({ s, a }) => ({ s, a, route: `${s.id}/${a.id}` }));
// The platform switch sits under every article title (not in the header, where readers miss it). One instance per
// article; all instances mirror <html data-platform>, so the choice — kept in localStorage — is the same on every page.
const PFBAR = `<div class="pfbar"><span class="pfbar-label">Your platform</span><div class="seg pf-seg" role="group" aria-label="Your platform"><button type="button" data-set="github" aria-pressed="true">GitHub</button><button type="button" data-set="azure" aria-pressed="false">Azure Repos</button></div></div>`;
// The setup-method switch is NOT in the bar and never floats free: it renders as the tab bar of
// the card built around each run of method() blocks (see html()), so the toggle sits on the exact
// instructions it swaps — like the language tabs on an SDK code sample. All instances mirror
// <html data-method> (kept in localStorage), so flipping any one flips them all.
const MTHTABS = `<div class="mth-tabs" role="group" aria-label="Setup method"><button type="button" data-set="app" aria-pressed="true">Connectors screen</button><button type="button" data-set="chat" aria-pressed="false">Chat commands</button></div>`;
const articlesHtml = flat.map(({ s, a, route }, idx) => {
  const rail = navTree(a.blocks);
  const prev = flat[idx - 1], next = flat[idx + 1];
  return `<article data-route="${route}" hidden>
  <div class="art-main">
    <p class="crumb"><a href="#/${s.id}/${s.articles[0].id}">${esc(s.title)}</a> <span>›</span> ${esc(a.title)}</p>
    <h1>${esc(a.title)}</h1>
    <p class="meta"><span class="meta-k">For</span> ${esc(a.audience)}${a.time ? ` <span class="meta-dot">·</span> <span class="meta-k">Time</span> ${esc(a.time)}` : ""}</p>
    ${PFBAR}
    ${html(a.blocks, { route })}
    <nav class="pager">${prev ? `<a class="pager-prev" href="#/${prev.route}"><span>Previous</span><b>${esc(prev.a.title)}</b></a>` : "<span></span>"}${next ? `<a class="pager-next" href="#/${next.route}"><span>Next</span><b>${esc(next.a.title)}</b></a>` : ""}</nav>
  </div>
  <nav class="rail" aria-label="On this page"><p class="rail-title">On this page</p><ol>${rail.map((h) => `<li class="l${h.level}"${h.pf ? ` data-platform="${h.pf}"` : ""}${h.mth ? ` data-method="${h.mth}"` : ""}><a href="#/${route}/${h.id}" data-target="${h.id}">${hnav(h.text)}</a></li>`).join("")}</ol></nav>
</article>`;
}).join("\n");
const placeholders = doc.sections.filter((s) => !s.articles.length).map((s) => `<article data-route="${s.id}/index" hidden><div class="art-main"><p class="crumb">${esc(s.title)}</p><h1>${esc(s.title)}</h1><div class="empty"><p>${hinl(s.placeholder || "Nothing here yet.")}</p></div></div><nav class="rail" aria-label="On this page"></nav></article>`).join("");
const sideNav = doc.sections.map((s) => `<div class="side-sec" data-section="${s.id}" hidden><p class="side-title">${esc(s.title)}</p>${s.articles.length ? `<ol>${s.articles.map((a) => `<li><a href="#/${s.id}/${a.id}" data-route="${s.id}/${a.id}">${esc(a.title)}</a></li>`).join("")}</ol>` : `<p class="side-empty">No articles yet</p>`}</div>`).join("");
const firstRoute = (s) => s.articles.length ? `${s.id}/${s.articles[0].id}` : `${s.id}/index`;
const tabs = doc.sections.map((s) => `<a class="tab" data-section="${s.id}" href="#/${firstRoute(s)}">${esc(s.title)}</a>`).join("");
const mobileNav = `<details class="side-mobile"><summary>In this section</summary><div class="side-mobile-in"></div></details>`;

const page = `<meta charset="utf-8">
<title>${esc(doc.name)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>(function(){var p=null,m=null;try{var q=new URLSearchParams(location.search);p=q.get("platform")||localStorage.getItem("wos-platform");m=q.get("method")||localStorage.getItem("wos-method")}catch(e){}var r=document.documentElement;r.setAttribute("data-platform",p==="azure"?"azure":"github");r.setAttribute("data-method",m==="chat"?"chat":"app")})()</script>
<style>
:root{
  --accent:#1485C4; --accent-deep:#0E5E8B; --accent-soft:#D6EAF7; --accent-tint:#EEF6FC;
  --orange:#F46A4A;
  --bg:#FFFFFF; --surface:#FFFFFF; --panel:#F6F9FC; --line:#E3E8EE; --line-soft:#EDF1F5;
  --ink:#0A2540; --text:#425466; --muted:#697386; --faint:#8898AA;
  --code-bg:#F1F5F9; --code-fg:#0A2540; --say-bg:#F3F9FD; --say-line:#BFDDF1;
  --ok:#0F8A5F; --danger:#CD3D64;
  --seg-on:#0E5E8B; --seg-on-fg:#FFFFFF;
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
  --seg-on:#4FA9F1; --seg-on-fg:#0A1B28;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 6px 20px -12px rgba(0,0,0,.6);
}}
:root[data-theme="dark"]{
  --accent:#4FA9F1; --accent-deep:#8CC8F5; --accent-soft:#1F3B52; --accent-tint:#152736;
  --orange:#FE8D6B; --bg:#0F1519; --surface:#151B21; --panel:#1A2229; --line:#28323B; --line-soft:#212A32;
  --ink:#F1F5F9; --text:#CBD5DF; --muted:#94A3B3; --faint:#6E7C8B;
  --code-bg:#1C252E; --code-fg:#9CD0F5; --say-bg:#152331; --say-line:#2C4E69; --danger:#F27C9B;
  --seg-on:#4FA9F1; --seg-on-fg:#0A1B28;
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
html[data-method="app"] [data-method="chat"]{display:none!important}
html[data-method="chat"] [data-method="app"]{display:none!important}

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
@media (max-width:760px){.logo .doc,.logo .sep{display:none} .top-in{gap:12px; padding:0 14px} .tabs{margin-left:0; gap:2px} .tab{padding:0 7px; font-size:13px}}

/* ---------- platform toggle — under every article title; the choice lives on <html data-platform> (set before first paint) and in localStorage */
.pfbar{display:flex; align-items:center; flex-wrap:wrap; gap:10px 18px; margin:0 0 30px; padding:10px 14px 10px 16px; border:1px solid var(--line); border-radius:var(--radius); background:var(--panel)}
.pfbar-label{font-size:11px; letter-spacing:.08em; text-transform:uppercase; font-weight:700; color:var(--ink)}
.seg{position:relative; display:inline-grid; grid-template-columns:1fr 1fr; flex:0 0 auto; padding:3px; border:1px solid var(--line); border-radius:999px; background:var(--surface); box-shadow:inset 0 1px 2px rgba(10,37,64,.06)}
.seg::before{content:""; position:absolute; top:3px; bottom:3px; left:3px; width:calc(50% - 3px); border-radius:999px; background:var(--seg-on); box-shadow:0 1px 2px rgba(10,37,64,.25); transition:transform .18s ease}
html[data-platform="azure"] .pf-seg::before{transform:translateX(100%)}
.seg button{position:relative; appearance:none; border:0; background:transparent; color:var(--muted); font:600 13.5px/1 var(--font); padding:8px 18px; border-radius:999px; cursor:pointer; white-space:nowrap; transition:color .18s}
.seg button:hover{color:var(--ink)}
html[data-platform="github"] .pf-seg button[data-set="github"], html[data-platform="azure"] .pf-seg button[data-set="azure"]{color:var(--seg-on-fg); cursor:default}
.seg button:focus-visible{outline:none; border-radius:999px; box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--accent)}
@media (max-width:560px){.pfbar{padding:10px 12px} .pfbar-label{flex-basis:100%} .seg{width:100%}}

/* ---------- setup-method tabs — the tab bar of the card wrapping each run of method() blocks, styled like the top-nav tabs / an SDK code sample's language tabs */
.mth-card{border:1px solid var(--line); border-radius:var(--radius); background:var(--surface); margin:2px 0 22px; overflow:hidden}
.mth-tabs{display:flex; gap:18px; padding:0 16px; background:var(--panel); border-bottom:1px solid var(--line); overflow-x:auto}
.mth-tabs button{appearance:none; border:0; background:transparent; color:var(--muted); font:500 13px/1 var(--font); padding:10px 2px; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; white-space:nowrap; transition:color .15s}
.mth-tabs button:hover{color:var(--ink)}
html[data-method="app"] .mth-tabs button[data-set="app"], html[data-method="chat"] .mth-tabs button[data-set="chat"]{color:var(--accent-deep); border-bottom-color:var(--accent); cursor:default}
.mth-card .mth{padding:16px 18px}
.mth-card .mth > :last-child{margin-bottom:0}

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
.meta{font-size:13px; color:var(--muted); margin:0 0 16px}
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
/* Callouts / say / code that belong to a step procedure align their box with the step-body
   column (number gutter = 30px grid col + 14px gap) instead of hanging left of the step text. */
aside.co.flow-in, figure.say.flow-in, figure.code.flow-in{margin-left:44px}
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
@media print{.top,.side,.rail,.pager,.pfbar,.mth-tabs,button.copy{display:none!important} .wrap{display:block} article[hidden]{display:none!important} article{display:block} body{background:#fff}}
</style>

<header class="top"><div class="top-in">
  <a class="logo" href="#/${doc.home.join("/")}" aria-label="SoftServe — Work OS documentation"><svg viewBox="0 0 1010 173" role="img" aria-label="SoftServe">${LOGO_PATHS}</svg><span class="sep"></span><span class="doc">${esc(doc.siteTitle)}</span></a>
  <nav class="tabs" aria-label="Sections">${tabs}</nav>
</div></header>

<div class="wrap">
  <nav class="side" aria-label="Articles in this section">${sideNav}</nav>
  <main>${mobileNav}${articlesHtml}${placeholders}</main>
</div>
<div class="foot"><span>SoftServe · Work OS team setup · ${esc(doc.version)}</span><span>Lives in the repository under <code>${esc(doc.repoPath)}</code></span></div>

<script>
(function(){
  var root=document.documentElement, KEY="wos-platform", MKEY="wos-method";
  // Both resolved before first paint by the <script> in <head> (?platform=/?method= → localStorage → default); every article's switch mirrors them.
  var pf=root.getAttribute("data-platform")==="azure"?"azure":"github";
  var mth=root.getAttribute("data-method")==="chat"?"chat":"app";
  function setPf(p){root.setAttribute("data-platform",p); try{localStorage.setItem(KEY,p)}catch(e){}
    document.querySelectorAll(".pf-seg button").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.set===p))}); spy();}
  function setMth(m){root.setAttribute("data-method",m); try{localStorage.setItem(MKEY,m)}catch(e){}
    document.querySelectorAll(".mth-tabs button").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.set===m))}); spy();}
  document.querySelectorAll(".pf-seg button").forEach(function(b){b.addEventListener("click",function(){setPf(b.dataset.set)})});
  document.querySelectorAll(".mth-tabs button").forEach(function(b){b.addEventListener("click",function(){setMth(b.dataset.set)})});

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

  setPf(pf); setMth(mth); route();
})();
</script>`;
fs.writeFileSync(path.join(OUT, "work-os-docs.html"), page);
console.log("html →", "work-os-docs.html", page.length, "bytes,", flat.length, "articles");
if (WARN.size) { for (const w of WARN) console.log("⚠", w); } else console.log("links ok · no both-platform leaks");
