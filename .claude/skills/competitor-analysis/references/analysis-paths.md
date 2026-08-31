# Analysis paths — which slice of the deep-analysis machinery this goal needs

Loaded by `/competitor-analysis` Step 1, deep runs only — Ongoing Monitoring carries a standing goal and no path. Suggest one path from the stated goal (never an open "which would you like?"); the go-gate's part 2 plays it back and the one "go" confirms it. If this file is missing, say so and run the full baseline.

Rules that hold across paths:

- **One path per run.** A goal that genuinely needs two is a full baseline — or two runs.
- **Step 0 always runs.** Every path starts from internal intel; the path decides what happens after.
- **Ask only open questions.** A path's PM questions are skipped wherever Step 0 already holds the answer — a question answered on file is not re-asked.
- **Phases are the SKILL.md's Deep Analysis Framework phases** — same machinery, subsetted, always in numeric order.
- **Writes are a ceiling, not a quota.** The path's surface list is what the run MAY touch; the Write-back block applies to whatever it does touch. Recording stays as the gate defines it — `analysis-goal:` carries the question (the path is legible from it), `analysis-scope:` the area slugs; there is no separate path key.
- **Delegated runs infer the path** from the `[GAP:]` line's shape — an area or capability gap → Capability gap; a pricing gap → Pricing & packaging; anything else → Full baseline. Inherited and recorded like the goal itself, never stopped for.

## Full baseline / new entrant

**Question:** who is this competitor, where do we collide, and what do we do about it?

**Suggest when:** no `competitors/{slug}/` folder exists (first analysis — the default for a new entrant) · `last-deep-analysis:` is 6+ months old · the goal spans several paths · a board/funding read needs the whole picture. When no narrower path fits, this is the default.

**Inputs:** `business-info.md` ICP, value proposition, positioning, and pricing sections · the full Context Routing table (Step 0) · first analysis: `competitor-teardown-template.md`.

**PM questions** (the classic five):

1. Which competitors appear most frequently in your user research or churn interviews?
2. Where do competitors win with your target customer segment?
3. What do churned customers say about why they picked competitors?
4. Where does this competitor have stronger distribution or presence?
5. What customer segments are you losing to specific competitors? Be specific — "enterprise healthcare", not "big companies".

**Phases:** 1 → 2 → 3 → 4 → 5 — the whole pipeline, nothing subsetted.

**Writes:** the full teardown, every section, `last-deep-analysis:` stamped · the competitor's column in the General table and every in-scope area table of `competitive-matrix.md` · `competitive-landscape.md` at-a-glance line, Positioning map, Differentiation thesis, Where we win / where we lose · first analysis: the new `competitors/{slug}/` folder + the roster lines (`competitors/CLAUDE.md`, matrix column, landscape line, `business-info.md` roster — confirm tier, in-session yes).

**Self-check:** all nine.

## Pricing & packaging

**Question:** how do they price and package — and where does that leave our pricing room?

**Suggest when:** a pricing or packaging call on our side (raise, new tier, repackage, match) · a competitor changed pricing · deals or renewals stall on price.

**Inputs:** `business-info.md` pricing shape · `segmentation-matrix.md` when the call weights segments (the only source for those numbers) · existing teardowns' Positioning & pricing sections · price mentions in call summaries and `feature-requests/`.

**PM questions:**

1. What pricing call does this feed — raise, new tier, repackage, or match?
2. Which segments actually hear the comparison — where do deals stall on the price vs on what's included?
3. Do lost or churned accounts cite the price or the packaging? Name the calls.

**Phases:** 1 → 2 (Public Data Collection: pricing page breakdown, website positioning analysis · Customer Intelligence: review sentiment on price and tiers) → 5 (Pricing Recommendations; Value Proposition Framework only if the price move shifts positioning).

**Writes:** the teardown's Positioning & pricing section (+ a Recent moves line when their pricing changed, + Sources) · the General table's Pricing shape row in `competitive-matrix.md` · `competitive-landscape.md` Differentiation thesis only when the thesis shifts. No SWOT rewrite, no area tables.

**Self-check:** Internal intel checked first · Gaps identified explicitly · Sources documented with dates · Confidence levels assigned · Recommendations are actionable.

## Capability gap (area-scoped)

**Question:** on this area, what do they have that we don't — and does the gap cost us anything?

**Suggest when:** the goal names area slugs · a delegated `[GAP:]` names an area or capability · deals lost to a named capability · an area's roadmap cut needs the competitive read.

**Inputs:** `analysis-scope:` area slugs resolved against the catalog (`product-development/feature-index.yaml`) — resolve before write; an area the catalog doesn't hold gets flagged, not invented · the area's PRDs · the area's table in `competitive-matrix.md` (or its `competitive-matrix-{area}.md` split) · user-research mentions of the capability.

**PM questions:**

1. Which capabilities in this area do buyers actually compare on — from calls, not our feature list?
2. Is the gap blocking deals today, or a hypothesis? Point at the evidence.
3. Whose version sets buyer expectations — this competitor's, or a category leader outside the roster?

**Phases:** 1 → 2 (Public Data Collection: product trial / changelog for the scoped capabilities · Customer Intelligence: reviews naming them) → 3 (Feature Comparison Matrix for the scoped area only — no SWOT, no Positioning Map) → 4 (Defensive Plays; Offensive Plays where the gap runs our way).

**Writes:** the scoped area's table in `competitive-matrix.md` — created when the area isn't tabled yet; split to `competitive-matrix-{area}.md` via `competitive-area-matrix-template.md` when the file outgrows its budget (mechanics: SKILL.md Output Integration) · the teardown's Strengths/Weaknesses rows for this area, derived from the feature comparison (no full SWOT pass — Phase 3 didn't run one) + Sources · `competes-areas:`/`competes-features:` kept current, bare catalog slugs. Landscape untouched unless a win/lose pattern flips. Delegated runs also answer the `[GAP:]` back to the caller.

**Self-check:** Internal intel checked first · Gaps identified explicitly · Sources documented with dates · Confidence levels assigned · Feature comparison is strategic · Recommendations are actionable.

## Positioning & differentiation

**Question:** what's our thesis against the field — where do we win, and what white space do we claim?

**Suggest when:** launch messaging or battlecards need the line · `/write-prod-strategy` prep · a new entrant muddies the category · the current thesis reads stale against recent wins and losses.

**Inputs:** `business-info.md` value proposition and positioning · `competitive-landscape.md` current thesis + map · teardowns' How we sell against them · won- and lost-deal evidence from call summaries.

**PM questions:**

1. What claim do we need to be able to make — and to whom?
2. Which competitor do buyers confuse us with, in their words?
3. What do recently WON deals say we were "unlike"? Evidence, not aspiration.

**Phases:** 1 → 2 (Public Data Collection: website positioning + marketing messaging audit · Customer Intelligence: review sentiment) → 3 (Positioning Map; SWOT only for the competitors the thesis leans on) → 4 (Offensive and Innovative Plays when the map exposes attackable space) → 5 (Value Proposition Framework; Pricing Recommendations only if the positioning implies a price move).

**Writes:** `competitive-landscape.md` Positioning map + Differentiation thesis + Where we win / where we lose · each touched teardown's How we sell against them and the pitch line under Positioning & pricing · the General table's Standout strength / Standout weakness rows when they shift.

**Self-check:** Internal intel checked first · Gaps identified explicitly · Sources documented with dates · Confidence levels assigned · Positioning map included · SWOT is specific, not generic (only when SWOT ran) · Recommendations are actionable · Cross-skill links included (`/write-prod-strategy`).

## Win/loss & churn

**Question:** why are we actually losing deals or accounts to them — the pattern, not the anecdote — and what closes it?

**Suggest when:** a churn spike or lost-deal streak names a competitor · `/retention-analysis` flags competitor-driven churn · sales asks "what do we say against X" · a renewal is at risk.

**Inputs:** call and meeting summaries tagged lost-deal or churn · `user-insights/` transcripts · churn metrics (analytics MCP when connected) · `competitive-landscape.md` current win/lose patterns.

**PM questions:**

1. Which deals or accounts — name them — and what did each say, verbatim?
2. Per loss: capability, price, trust/brand, or relationship? Evidence, not vibes.
3. What would have flipped the last two losses, and who confirmed that?

**Phases:** 1 (the heart of this path — synthesis of the internal loss evidence) → 2 (Customer Intelligence only: why THEIR customers stay or leave, from reviews · Strategic Signals only when a recent move explains the losses) → 4 (Defensive + Offensive Plays).

**Writes:** `competitive-landscape.md` Where we win / where we lose rows (a pattern needs ≥2 pieces of evidence) + the thesis's "We lose when" line · each named teardown's How we sell against them (win when / lose when / trap questions) · matrix cells only when a loss names a capability — the flip cites the call. Cross-link `/retention-analysis` when churn-driven.

**Self-check:** Internal intel checked first · Gaps identified explicitly · Sources documented with dates (call summaries count as sources) · Confidence levels assigned · Recommendations are actionable · Cross-skill links included.
