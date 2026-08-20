---
name: prototype
description: Build a clickable prototype grounded in the job spec or PRD — routed by the team's recorded design approach in product-development/toolchain.yaml (set or changed via /customize-os design-system: Figma MCP, another design MCP, Claude Design, a screenshots folder, external-tool prompts, or plain HTML), Figma-first when nothing is recorded. With the Figma MCP connected or a cached token extraction, it pulls the design system and builds a token-faithful, self-contained HTML preview, audited for compliance; with no recorded approach and no Figma it stops early and asks — connect Figma (/connect-mcps), generate an external-tool prompt (v0 / Lovable / Bolt), or build plain HTML without the design system. Reads the job spec (preferred) or PRD first, mines its rules and states, and ends with a requirements-coverage checklist; UI choices never become new requirements. Saves to product-development/product/prototypes/. Use on /prototype, "prototype this", a Figma frame/file/node URL to preview or click through, "make this screenshot match our design system", "can I see this before we build it". NOT for requirements (/prd-draft first), ASCII wireframes (/napkin-sketch), critiquing a built prototype (/prototype-challenge), applying review feedback (/prototype-feedback), or production component code (/code-first-draft).
argument-hint: "[figma-url | v0 | lovable | bolt | html]"
group: prototyping
---

# Prototype

Turn a job spec or PRD plus the product's design system into a clickable, self-contained HTML file the user can open, click through, and share — in minutes, with no build step. When the design system isn't reachable, fall back to whichever artifact the user picks: an external-tool prompt or plain HTML.

## Why this exists

The $1-$10-$100 rule: a PM-made prototype catches issues at $1, a designer rework costs $10, engineering building the wrong thing costs $100. But a preview that quietly invents its own colors, type scale, and spacing is worse than none — it sends reviewers arguing about the wrong pixels and teaches everyone the design system is optional. So when a design system exists, the whole job is *fidelity to the token set*, not visual flair. Tokens come from Figma. Behavior comes from the spec. Nothing is invented silently.

A prototype is a throwaway hypothesis, not the component library — it does not go in `src/`, and its UI choices never become requirements.

## Step 0 — Route by what's available (before any deep work)

Resolve the path FIRST, so a blocked run stops in seconds, not after minutes of reading:

1. **An explicit argument wins — no routing question.** A Figma URL → Figma path against that file. `v0` / `lovable` / `bolt` → external-prompt path. `html` → plain-HTML path. An argument that contradicts the recorded team choice (below) is a one-run override — say so in the reply.
2. **The team's recorded choice** — `product-development/toolchain.yaml` → `prototyping.approach`, set by `/customize-os design-system`. Follow it without asking; when its tool is unreachable, stop and name the recorded approach — offer the fix (`/connect-mcps`) or an explicit one-off fallback, never a silent downgrade.
   - `figma-mcp` → Figma path (cache first, then MCP, as below). No cache and MCP unreachable → stop as above.
   - `design-mcp` → the same shape against the named MCP: probe its tools, extract what it offers into the same `design-system/tokens.css` cache format with the source recorded. Unreachable → stop as above.
   - `claude-design` → the recorded `design-url` is the visual target: read/screenshot it when Claude Design tools are reachable; tokens follow the screenshots recipe (derive once, cache, mark approximate). Unreachable → ask for an exported screenshot of the relevant frames, and say why.
   - `screenshots` → the folder at `params.screenshots-dir` is the visual reference: derive an approximate token block from the screenshots once, cache it in `design-system/tokens.css` with `source: screenshots` and mark it approximate in `design-system.md`. Empty folder → stop and ask for screenshots.
   - `external-prompts` → external-prompt path with `params.preferred-tool`, no routing question.
   - `plain-html` → plain-HTML path; the file header notes it is not design-system-grounded, by team choice.
   - `undecided`, key or file missing → continue below.
3. **Cached extraction exists** (`product-development/product/prototypes/design-system/tokens.css`) → Figma path, using the cache. Works even when the MCP is offline; only a refresh needs it.
4. **Figma MCP reachable?** Probe for Figma MCP tools (ToolSearch; an unauthenticated server counts as NOT set up). Reachable → Figma path.
5. **None of the above → stop and ask, immediately.** Resolve only which feature is being prototyped (so the question is concrete), then ask ONE question:
   - **Connect Figma first** — `/connect-mcps connect to figma`, then rerun; the prototype will follow the real design system.
   - **External-tool prompt** — a paste-ready prompt for v0.dev, Lovable, or Bolt.new (which tool → see Step 4b).
   - **Plain HTML** — build here, without the design system; honest but not brand-faithful.

   Mention once that `/customize-os design-system` records a standing choice so this question stops appearing. When Figma IS available (cache or MCP) or an approach is recorded, never ask this question.

## Step 1 — Ground in the spec (all paths)

- Resolve the requirements source: explicit path if given, else `product-development/feature-index.yaml` by feature name. Priority: **job spec** (`PRDs/{area}/*-job-spec.md` — the buildable contract) → **PRD** → previous prototypes, napkin sketches, and feedback logs in `product/prototypes/` → user research for the pain being solved.
- No spec at all → offer `/prd-draft` first ("prototype without requirements = guessing"), or take a verbal brief and say the prototype is brief-grounded only.
- Mine the spec for: capabilities, rules/ACs, variations, **states** (the spec's states, not just the generic UI set), and out-of-scope lines. These decide what the prototype must demonstrate.
- **Guardrail:** the prototype is one hypothesis against the spec. Never edit spec files from this skill, and never present a UI choice as if it were a requirement.

## Step 2 — Establish the design system (Figma path)

Check the cache: `design-system/tokens.css` + `design-system.md`. If present and no refresh was asked for, use it — re-extracting burns rate limits and produces previews that drift from each other. Never refresh silently; the user may have hand-corrected it.

No cache → extract (tool details: `references/figma-mcp.md`):

- `get_variable_defs` on the library file or a representative frame — colors, spacing, typography, radii.
- Thin result (file uses raw styles)? `get_libraries` to see what's subscribed, then `search_design_system` for core components — button, input, card, nav — and read their values.
- `get_screenshot` of a component sheet as the visual reference for "correct".

Write the cache: `tokens.css` is a plain `:root` block with a source header (file, node URL, date, tool); `design-system.md` records where each group came from. **Keep Figma's own variable names** (`color/bg/subtle` → `--color-bg-subtle`) — renaming breaks a designer's ability to grep a value back to the variable they own. A value that doesn't exist in the design system is a **gap**: record it under `## Gaps` in `design-system.md`, use the nearest existing token, surface it in the reply. Gaps are useful signal for the design-system owner — suppressing them wastes the finding.

## Step 3 — Read the visual target (Figma path)

**From a Figma frame URL:** `get_metadata` first — a sparse outline to find the frames worth building. Calling `get_design_context` on a whole page is the most common way these runs die: it floods the context window. Then per chosen frame: `get_design_context` asking explicitly for **plain HTML and CSS** (it defaults to React + Tailwind, which neither runs standalone nor matches the token set), paired with `get_screenshot` for layout ground truth. `download_assets` for real logos, illustrations, icons (SVG where possible, inlined) — approximated icons undermine trust in everything else.

**From a screenshot:** write an explicit read *before* any HTML — structure, regions, repeated components, visible states, data density — then map each element to a design-system component by name. Where screenshot and design system disagree, **the system wins**; name the conflict in the reply.

**From the spec alone:** compose the screens from real design-system components. Same rules.

Where the visual target and the **spec** disagree on behavior, the spec wins — flag it, don't silently pick.

## Step 4 — Build (both HTML paths)

One file: `product-development/product/prototypes/{slug}.html`. All CSS and JS inline; no npm, no build step, no CDN framework. A `<link>` to Google Fonts is fine when the design system names a webfont; if unavailable, fall back to the nearest stack and note the substitution.

**Every value in the body references a token.** On the plain-HTML path there is no Figma, but the rule stands: define your own `:root` token block once and reference it everywhere — the audit then still enforces self-consistency — and note in the file header comment that it is not design-system-grounded.

Scaffold — hidden `.screen` sections, a sticky flow nav, and `data-goto` links so the happy path is genuinely clickable:

```html
<style>
  :root { /* tokens — pasted verbatim from design-system/tokens.css */ }
  body { margin:0; font-family:var(--font-body); color:var(--color-text-primary);
         background:var(--color-bg-default); }
  .screen { display:none; }  .screen.active { display:block; }
  .flownav { position:sticky; top:0; display:flex; gap:var(--space-2);
             padding:var(--space-2); background:var(--color-bg-subtle); }
</style>
<nav class="flownav" id="flownav"></nav>
<section class="screen active" id="dashboard" data-label="Dashboard">…</section>
<script>
  const screens=[...document.querySelectorAll('.screen')],nav=document.getElementById('flownav');
  const show=id=>screens.forEach(s=>s.classList.toggle('active',s.id===id));
  screens.forEach(s=>{const b=document.createElement('button');b.textContent=s.dataset.label;
    b.onclick=()=>show(s.id);nav.append(b);});
  document.querySelectorAll('[data-goto]').forEach(el=>el.onclick=()=>show(el.dataset.goto));
</script>
```

State lives in plain JS variables — **never localStorage or sessionStorage**; preview sandboxes block them and the file breaks silently.

What makes it read as real:

- Plausible domain data — real-sounding names, amounts, dates, statuses. No lorem ipsum, no "Item 1".
- Honest density — a table gets 8–12 rows, a dashboard looks populated.
- **The spec's states plus the UI set**: default, hover, focus, disabled, error, empty, loading — simulate ~600ms on submit so loading is visible.
- Accessibility is fidelity: real `<label>`s, visible focus rings, body text ≥14px, contrast ≥4.5:1, semantic landmarks.
- About six screens per file max — beyond that, split into a second file. Prototype the risky flow, not the parts everyone already agrees on.

## Step 4b — External-tool prompt path

No stored templates — compose the prompt fresh from the spec; consistency comes from this checklist, and per-tool scope from this table:

| Tool | Scope the prompt to | The prompt must additionally give it |
|---|---|---|
| **v0.dev** | one component or page | precise layout regions + component behaviors |
| **Lovable** | a multi-page app | pages with routes, the data model, an auth choice (usually "none") |
| **Bolt.new** | a quick interactive flow | "keep it simple — prototype, not production" |

Every prompt covers: the user goal, the spec's flows step by step, **every spec state** plus empty/loading/error, realistic inline sample data, style pointers (brand block in `business-info.md` if filled), an explicit **out-of-scope** list, and the sentence "this is a throwaway prototype, not production code". Save as `product/prototypes/{slug}-{tool}-prompt.md`.

## Step 5 — Audit before handing over (HTML paths)

```bash
python .claude/skills/prototype/scripts/audit_tokens.py product-development/product/prototypes/{slug}.html --tokens product-development/product/prototypes/design-system/tokens.css
```

(Plain-HTML path: omit `--tokens` — the script still enforces the file's own token block, self-containment, storage-API bans, and filler-content checks.) Fix the errors rather than explaining them away. If a browser tool is available, screenshot the rendered file next to the Figma `get_screenshot` — layout errors are easier to see than to reason about.

## Step 6 — Coverage checklist (all paths)

Map every spec requirement to the artifact: `[x]` covered (how) / `[ ]` not covered (why — out of scope for this prototype, deferred, not prototypable). No spec → state "brief-grounded; no spec to verify against". This is what keeps the prototype traceable instead of vibes.

For HTML builds, open the companion record `product/prototypes/{slug}-feedback-log.md` with a `## Build — {date}` section: source spec link, token source (cache reused / refreshed / own block), the coverage checklist, gaps, conflicts and what was chosen. (`/prototype-feedback` appends review rounds to this same file.) For prompt builds, the checklist goes at the end of the prompt file.

## Step 7 — Deliver

Present the file (render inline if a tool for that is available), then keep the reply short: where tokens came from and whether the cache was reused; screens built and the flow path; gaps and substitutions; conflicts (target vs system, target vs spec) and what was chosen; the coverage summary; anything assumed the user should check. Suggest `/prototype-challenge` before sharing widely, `/prototype-feedback` once comments come back.

## Write-back (mandatory)

Full contract: `governance/write-back-contract.md`:

1. Append one line per new file at the END of the list in `product/prototypes/CLAUDE.md` (append-only; history snapshots are exempt by that folder's convention).
2. Propose the `feature-index.yaml` addition — a `prototype:` key pointing at the artifact — and apply only after the user confirms (gated). Initiative-scoped → link from the initiative page.
3. Source links live in the feedback log's build record (HTML) or the prompt file's header.
4. End the reply listing every repo path written or updated.

## Traps

- **Asking the routing question when Figma is set up or an approach is recorded in toolchain.yaml** — or not asking it, and silently inventing a design system, when neither holds.
- **Silently downgrading a recorded approach** — the recorded tool being unreachable is a stop-and-say moment, not a license to build plain HTML; and an explicit argument that overrides the record is named as a one-run override in the reply.
- **Shipping `get_design_context` output verbatim** — it's React + Tailwind by default; translate or ask for plain HTML up front.
- **Calling `get_design_context` on a page or huge frame** — outline with `get_metadata` first, then drill.
- **Refreshing the token cache without being asked** — the user may have hand-corrected it.
- **Treating a screenshot as the spec when it contradicts the design system** — name the conflict, follow the system; and the *spec* outranks both on behavior.
- **Writing UI choices back into the spec** — the prototype is a hypothesis; the spec's writer is `/job-spec-draft` / `/prd-draft`.
- **Inventing logos, client names, or metrics** that will be screenshotted into a deck — mark illustrative data as illustrative.
- **Drifting into production code** — if the user wants real components in the app, switch to `/code-first-draft` and say so.
