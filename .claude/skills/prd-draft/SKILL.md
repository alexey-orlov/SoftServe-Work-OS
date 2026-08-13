---
name: prd-draft
description: Draft and iterate a PRD as the living spine of feature definition. Every run re-reads the initiative's attached evidence, updates the draft, marks unbacked sections with [GAP:] markers instead of stopping, auto-runs the research that closes agent-closable gaps (bounded — up to three closers per run, only where the source exists), and ends with a readiness readout — what closed this run, what's backed, what's still assumed, what only humans can do, what's waiting on someone else. First run creates the initiative page and proposes the feature-index entry. Use on /prd-draft, "write the PRD", "update the PRD", "where does this feature stand?". NOT for challenging a finished draft (/prd-challenge — deliberately never auto-run), cutting the agreed PRD into buildable jobs (/jobs-breakdown → /job-spec-draft), or turning it into tickets (/create-tickets).
argument-hint: "[idea or slug] [--draft-only] [--ai]"
group: definition
---

## Quick Start

**What to provide:** A feature idea, problem statement, rough brief — or just the slug of an existing initiative to run another iteration.

```
/prd-draft                              → Start from scratch with guided questions
/prd-draft [paste your feature idea]    → First run: I skip questions you already answered
/prd-draft [slug]                       → Later run: re-read the evidence, update, close closable gaps, report what moved
/prd-draft [slug] --draft-only          → Fast pass: update the text only, skip the auto-research
/prd-draft --ai                         → Include the AI behavior contract (see reference/ai-prd.md)
```

**What you get, every run:** an updated PRD at `product-development/product/PRDs/{area}/{slug}-prd.md` (template: `product-development/product/handbook/templates/prd-template.md`), thin sections marked `[GAP: what's missing — how to close it]`, the agent-closable gaps **closed in the same run** (bounded auto-research — you confirm results, not permission), and a closing **readiness readout** — where the bet stands and who owns each remaining gap.

**Filename convention:** `{slug}-prd.md` — one file per feature, forever. The stage lives in the Meta table inside the document, never in the filename (a stage-suffixed filename would break the feature-index `prd:` key every time the stage advances).

---

# /prd-draft — The PRD Loop

A PRD here is not a one-shot document; it is the running state of a bet. Each `/prd-draft` run reads everything attached to the initiative, folds it in, and says what changed and what is still assumed. Draft early, draft thin, mark the gaps — the gap list *is* the research plan.

## The Loop

**First run** (no initiative page exists for this work):
1. Read context (Step 1) and ask only the questions the PM hasn't answered (Step 2).
2. Draft the PRD with `[GAP:]` markers in every unbacked section (Step 3).
3. Register the work: initiative page + feature-index proposal (Step 4).
4. Run the auto-research pass on the closable gaps (Step 5).
5. Close with the readiness readout (Step 6).

**Every later run** (initiative page exists):
1. Re-read the initiative page, the PRD, and every artifact linked since the last run (new call summaries, research syntheses, investigations, competitive updates, code answers).
2. Fold new evidence into the PRD: close `[GAP:]` markers the evidence resolves, update numbers, bump the stage when the content supports it.
3. Run the auto-research pass on the gaps that remain (Step 5).
4. Update the initiative page (`_updated:`, Activity line, new artifact links).
5. Close with the readout — leading with **what moved this run**.

Never refuse to draft because evidence is missing. The old "map first, or draft anyway?" prompt is gone: always draft, always mark — then close what you can yourself (Step 5). A `[GAP:]` in the right section beats a blocked PM; a gap closed in the same run beats both.

## Gap markers

`[GAP: what's missing — how to close it]`, placed inside the section it weakens, e.g.:

- `[GAP: no churn baseline for this segment — run /retention-analysis]`
- `[GAP: no evidence anyone would leave the current workaround — 3 admin interviews]`

Rules: name the missing evidence AND the concrete way to get it; never invent a number to avoid a marker. `/wiki-lint` ages `[GAP:]` markers after 14 days; `/feature-launch-gate` blocks a launch while any remain.

---

## Step 1: Read the State

Check, in this priority order:

| Priority | Source | What to extract |
|----------|--------|-----------------|
| 1 | `product-development/product/initiatives/{slug}.md` (if it exists) | Current status, attached artifacts, open loops — the diff base for this run |
| 2 | `product-development/product/strategy/*.md`, `strategy/current-quarter.md` | Strategic pillar this supports; quarter fit |
| 3 | Related PRDs in `product-development/product/PRDs/{area}/` | Dependencies, prior art, cross-functional impact |
| 4 | `product-development/product/customers/` (research-synthesis, call summaries, feature-requests) | Problem validation: quotes, frequency, severity, current workaround |
| 5 | `strategy/business-context/business-info.md` | Business model, pricing, North Star |
| 6 | `strategy/business-context/segmentation-matrix.md` | Account count and ARR of the target segment — customer-value denominators |
| 7 | `product-development/analytics/investigations/{area}/` | Impact sizing, retention/activation baselines already computed |
| 8 | `product-development/product/competitive-research/competitive-landscape.md`, `competitive-matrix.md` | Competitive position on this capability |
| 9 | `product-development/engineering/code-repos.yaml` → `/code-qa` | What the product does today in the touched area — code-grounded, not remembered |
| 10 | `strategy/business-context/stakeholders.md` | Who must be involved, how they communicate |

**Context health:** if `business-info.md` still has unfilled `[Your ...]` placeholders, say so and offer to fill it first (5 min) or proceed with the missing context marked as `[GAP:]`s. If strategy docs are empty, flag it and suggest `/write-prod-strategy` or `/strategy-sprint` — then proceed anyway.

## Step 2: Ask Only What's Missing

**Adaptive rule:** check what the PM already provided and what Step 1 found. Skip answered questions. Open with: "Based on what you shared and what the repo holds, I have [X, Y]. Remaining questions: [only the gaps]."

**Required (any unanswered becomes a `[GAP:]`, not a blocker):**

1. **Problem & segment** — what user pain, and who exactly feels it (vertical / size band / use case)?
2. **Frequency & criticality** — how often does it bite, and what does it cost when it does?
3. **Today's alternative** — what do they do about it now (workaround, competitor, nothing)? This is what the solution must beat.
4. **Hypothesis** — if we build X, then Y metric moves by Z, because [behavior assumption].
5. **Strategy fit & lever** — which strategic bet does this support, and which **one or two** business levers is it for (acquisition / activation / retention / expansion-LTV / cost to serve)?
6. **Stage** — Team Kickoff / Planning Review / XFN Kickoff / Solution Review / Launch Readiness / Impact Review?

**Important:**

7. A/B test or full launch?
8. Non-goals — what are we explicitly NOT doing?
9. Success metrics — primary + guardrails?
10. Key stakeholders?
11. Any header fields the installed template's meta table requires that the repo can't answer (e.g. availability model, eligible users, pricing).

**AI features** (`--ai` or auto-detected): the three behavior questions in `reference/ai-prd.md` (example inputs, edge-case handling, never-do).

**What NOT to ask:** technical implementation details (engineers own the how), exhaustive edge-case lists, final copy or UI details.

## Step 3: Draft or Update

**The template owns the format.** Read `product-development/product/handbook/templates/prd-template.md` fresh each run — it is this deployment's document contract: section order and names, the meta table's fields, per-section `>` guidance blocks, table shapes, stage/length rules, and voice notes. Follow it exactly; `>` blockquotes are guidance to the drafting agent, never emitted into the draft. When a team installs its own house format there (e.g. a customer's Product Brief template), drafting picks it up with no change to this skill. Include only sections relevant to the current stage (or the template's own status ladder).

Whatever the section names, route the core evidence slots to wherever the template's guidance places them — every slot lands somewhere or gets a `[GAP:]`:

- **Problem-side** — segment (with account count + ARR from `segmentation-matrix.md`), problem, frequency, criticality, today's alternative/workaround, evidence: real quotes and numbers, sourced.
- **Value-side** — strategy fit, hypothesis, impact by lever: **at most two primary levers**, others marked "not what this bet is for". Numbers come from `/impact-sizing` (reach × baseline × expected change); a lever named without a baseline gets a `[GAP:]`.
- **Solution-side** — key elements / feature set, **why/when it beats today's alternative** (the alternative named problem-side — options *we* rejected stay separate as "Alternatives Considered"), scope boundary and non-goals.
- **Proof-side** — success metrics with baselines and targets, guardrails, kill criteria (deep-dive: `/feature-metrics`; experiment metrics: `/experiment-metrics`), rollout, risks with mitigations, dependencies with owners.

**Stage-length guide** — the default when the template doesn't define its own (exceed it → move detail to the Appendix):

| Stage | Words | Focus |
|-------|-------|-------|
| Team Kickoff | 300–500 | Problem, hypothesis, open questions |
| Planning Review | 500–800 | Strategic fit, impact sizing, alternatives |
| XFN Kickoff | 800–1200 | Aligned solution, initial data, mockups |
| Solution Review | 1000–1500 | Full spec: edge cases, behavior, rollout |
| Launch Readiness | 1500–2000 | Rollback, kill criteria, go/no-go |
| Impact Review | 500–800 | Results vs targets, learnings |

**Writing:** the template's own voice notes first, then the PM's voice per `product-development/product/handbook/writing-guides/` — real quotes, actual numbers, named stakeholders, no corporate filler. Quality bar: the Quality Checklist at the bottom of the template — the single checklist; check the items for the current stage before presenting.

## Step 4: Register the Work (first run — prd-draft is the index producer)

A PRD is the anchor artifact — creating one registers the work:

1. **Feature index**: read `product-development/feature-index.yaml`; draft the entry (`{area}: {slug}: prd: ...`) or add the PRD path to an existing key. Tier 2 (`governance/write-policy.yaml`): show the exact addition, apply only after the PM confirms.
2. **Initiative page**: check `product-development/product/initiatives/` for an existing page first. None → create `{initiative-slug}.md` from `handbook/templates/initiative-page-template.md` (status `active`, PRD linked under Artifacts, the other artifact rows left `-` until they land), append its row to `initiatives/CLAUDE.md`, include the feature's `initiatives:` list addition in the same confirmed index change. Exists → link the PRD, bump `_updated:`.

On later runs: keep the page current — every artifact this run folded in gets its Artifacts row filled, and one dated Activity line summarises the run.

## Step 5: Close What You Can — the auto-research pass

Don't stop at naming the gaps — close the closable ones in the same run. A gap is closable when its closer is a repo-grounded skill AND the source that closer needs actually exists:

| Gap | Closer | Source that must exist |
|-----|--------|------------------------|
| Feasibility — "how does it work today?" | `/code-qa` | `engineering/code-repos.yaml` with a reachable repo |
| Viability — missing baseline (churn, activation, NRR) | `/retention-analysis` · `/activation-analysis` · `/expansion-strategy` | warehouse MCP connected, or baselines in `analytics/metrics/{area}/` |
| Viability — a named lever with no money number | `/impact-sizing` | the baseline above + `segmentation-matrix.md` filled |
| Market — competitor claim unverified | `/competitor-analysis` | `competitive-research/` scaffold (web access for deep mode) |

Rules for the pass:

1. **Bounded: at most 3 closers per run, riskiest gaps first.** Keeps an iteration minutes, not an afternoon. Gaps beyond the budget stay named in the readout for the next run.
2. **Source-gated, never run-and-degraded.** A closer whose source is missing is not run — the gap stays open and the readout names the enabling step (`/connect-code`, connect the warehouse MCP, fill `segmentation-matrix.md`).
3. **Parallel subagents, each following its own SKILL.md end to end** — writing its own artifact in its own home with its own write-back. This skill never inlines a shortcut version of another skill's method.
4. **Fold and cite.** Each result closes its `[GAP:]` in the PRD, fills the initiative page's matching Artifacts row, and appears in the readout with its path. **The PM confirms results, not permission** — a wrong baseline is corrected by re-running, not pre-approved.
5. **Tier-2 batched:** feature-index additions from sub-runs are proposed once, together, at the end of the run.
6. **`--draft-only` skips this pass** — for fast text-only iterations.
7. **Never auto-run:** `/prd-challenge` — a judged checkpoint, not a data fetch: it rewrites the PRD's Open Questions and the initiative's Open loops, so firing it on a half-edited draft thrashes both, and it costs 10+ parallel lenses. Also never auto-run anything human-facing (`/interview-guide` is offered; interviews are the PM's) or outbound (`/slack-message`, `/create-tickets`).

## Step 6: The Readiness Readout (every run ends here)

Read the four lenses — **Desirability, Viability, Feasibility, Usability** — against the evidence actually attached, and close with this readout:

```
Where this stands

What moved this run
  ✓ Feasibility   /code-qa ran — billing emits the event at write time; folded into Solution
  ✓ Viability     /retention-analysis → churn baseline 11.4% · /impact-sizing → $310k ARR retained
                  → analytics/investigations/billing/impact-sizing-low-balance-2026-08-09.md

Backed
  ✓ Problem       4 interviews · customers/research-synthesis/2026-07-30-…md
  ✓ Segment       mid-market + enterprise · 47 accounts · $2.1M ARR

Still assumed — I couldn't close these
  ⚠ Desirability  no evidence anyone would leave the current workaround — needs interviews (yours)
  ⚠ Usability     no design input yet — Designer

Only you can do these
  → 3 interviews with enterprise admins on the current workaround
      /interview-guide writes the guide · /process-meeting files what comes back
  → a pricing conversation with 2 accounts

Waiting on someone else
  → Eng plan + RFC — Engineer (blocks the launch gate, not this PRD)

2 gaps closed · 2 open · ready for the full critique? /prd-challenge
```

Rules for the readout:

- **What moved this run** leads: every auto-closed gap cites the skill that ran and the artifact it wrote. `--draft-only` runs say so here.
- **Backed** lines cite the artifact (path), not a feeling. **Still assumed** lines say *why* the agent couldn't close them — human evidence needed, source missing, or research budget spent.
- **Human-only** work is named concretely (N interviews with whom, about what) with the supporting skills for before and after.
- **Waiting on someone else** names artifacts owned by other roles per the root `CLAUDE.md` role table — engineering plans and RFCs belong to the Engineer; name them as pending, never write them.

With the auto-research pass, the loop drives itself on evidence. The one step deliberately left on the PM's trigger is `/prd-challenge` (Step 5, rule 7) — offer it explicitly when the gap count drops materially or a stage milestone approaches.

---

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   `CLAUDE.md` (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Feature-scoped artifact → propose the `product-development/feature-index.yaml` addition
   and apply it only after the user confirms (Tier 2 in `governance/write-policy.yaml`).
   Initiative-scoped → link the artifact from `product-development/product/initiatives/{slug}.md`.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.

---

## Downstream

- `/prd-challenge` — the full critique: every lens in parallel, one report, ranked unverified assumptions flowing back into this PRD's Open Questions

After the challenge passes and the PRD is agreed:

- `/jobs-breakdown` → `/job-spec-draft` — cut the agreed PRD into jobs and write each buildable contract (the definition→delivery bridge)
- `/pre-mortem` — rehearse the launch failing, once a solution and rollout exist
- `/create-tickets` — turn agreed job specs (or the PRD directly, for small changes) into the dev backlog
- `/prototype` / `/napkin-sketch` — make the solution visible before engineering commits
- `/launch-checklist` → `/feature-launch-gate` — plan the launch, then gate the ship
- `/slack-message` / `/status-update` — circulate
- `/feature-results` — after launch, reality vs this PRD's hypothesis

## Chain Position

Stage 2 of the de-risk-a-bet chain (`product-development/product/handbook/de-risk-a-bet.md`) — upstream: `/assumption-map` (standalone mapping for a bare idea; the loop marks gaps either way) · downstream: `/prd-challenge` (the full critique — suggested when gaps drop or a milestone nears, never auto-run). Skip rules live in the chain doc.
