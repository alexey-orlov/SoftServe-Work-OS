---
name: jobs-breakdown
description: Cut an agreed initiative into independently shippable jobs — the sequenced plan between the PRD (why this bet) and the per-job job specs (/job-spec-draft). Rebuilds the initiative's backbone from evidence, cuts walking-skeleton-first and widens by actor/capability/depth, gates every candidate against the four pressure tests + INVEST (a variation whose backbone differs end-to-end becomes its own job), sequences riskiest-assumption-first with dependency rationale, and writes the living breakdown to PRDs/{area}/{initiative-slug}-jobs-breakdown.md (template-driven, re-runnable — the job table is the live status board). Appends the jobs-breakdown: key to the feature-index entry (gated confirm; a missing entry gets the minimal registration proposed in the same gated change). Use on /jobs-breakdown, "break down the PRD/initiative", "cut this into jobs", "slice this initiative", "what do we build first?". NOT for writing the per-job contract (/job-spec-draft — runs next, one job at a time), drafting or updating the PRD itself (/prd-draft), or cutting dev-backlog tickets (/create-tickets — runs later, from an agreed job spec or PRD).
argument-hint: "[initiative-slug | PRD path]"
group: definition
---

## Quick Start

**What to provide:** An initiative slug or a PRD path — ideally after the PRD has survived `/prd-challenge`. A rough idea with no PRD yet → run `/prd-draft` first; this skill cuts an agreed bet, it doesn't define one.

```
/jobs-breakdown [slug]        → First run: rebuild the backbone, cut + gate the jobs, sequence them
/jobs-breakdown [slug]        → Later run: fold new evidence and job spec statuses, re-gate what changed
/jobs-breakdown [PRD path]    → Same, pointed straight at a PRD file
```

**What you get:** the living breakdown at `product-development/product/PRDs/{area}/{initiative-slug}-jobs-breakdown.md` (template: `product-development/product/handbook/templates/jobs-breakdown-template.md`) — backbone, a gated and sequenced job table with per-row rationale, cross-job open decisions with owners, a clean coverage check — and a closing readout naming the next job to job spec.

---

# /jobs-breakdown — the cut

`/prd-draft` answers *why this bet*; `/create-tickets` needs a buildable contract. This skill produces the level in between, part one: the initiative cut into jobs — each one independently valuable, end-to-end, and small enough to build and test on its own. The cut decides what gets de-risked first; `/job-spec-draft` then writes the contract for one job at a time.

**The template owns the format.** Read `product-development/product/handbook/templates/jobs-breakdown-template.md` fresh each run — section order, table shapes, and the status vocabulary (not-drafted → drafted → agreed → handed-off) come from it. `>` blockquotes in the template are guidance to you, never emitted. When a team installs its own house format there (`/customize-os jobs-breakdown-template`, derived from their real breakdown documents), this skill picks it up with no change.

## Step 1: Read the state

| Priority | Source | What to extract |
|----------|--------|-----------------|
| 1 | The PRD (`PRDs/{area}/{slug}-prd.md`) | The proto-job list — its solution/feature-set section is the seam; scope boundary and non-goals feed the coverage check |
| 2 | `product-development/product/initiatives/{slug}.md` | Status, attached artifacts, open loops |
| 3 | `PRDs/{area}/reviews/` (challenge report, assumption map, red-team) | Ranked unverified assumptions — the input to riskiest-first sequencing |
| 4 | `product-development/product/customers/` (research-synthesis, feature-requests, call summaries) | The actors and variations that exist in reality, not in the org chart |
| 5 | `strategy/business-context/platform-model.md` | Permission model, fixed enums, compliance domains the cut must respect |
| 6 | `product-development/engineering/tech-constraints.md` | Do-not-re-implement registry + platform limits that shape cut lines and job Type |
| 7 | `product-development/engineering/code-repos.yaml` → `/code-qa` | What exists today in the touched area — decides Integration vs Net new typing |
| 8 | `strategy/business-context/segmentation-matrix.md`, `customers/accounts/portfolio.yaml` | Reach input for sequencing priorities |
| 9 | Sibling breakdowns and job specs in the area | Shared objects and states — consistency, not reinvention |

**Context health:** `platform-model.md` or `tech-constraints.md` still `[TBD]` → proceed, and carry `[GAP: platform model unfilled — constraints unverified]` (or the tech-constraints twin) as owned rows in the breakdown's §4 table. No reviews yet (first-run bet, `reviews/` empty) → derive risk from the PRD's own hypothesis and say so. Never silently skip a check.

## Step 2: Rebuild the backbone

Lay the initiative out as its end-to-end story before cutting anything: activities left to right as users live them, every actor named (including out-of-scope personas), core objects listed. Build it from the PRD and its evidence — interview quotes, current-state facts, `/code-qa` answers — not from imagination. The backbone is the seam; a cut that doesn't traverse it isn't a job, it's a component.

## Step 3: Cut candidates

Walking-skeleton-first: the first job is the thinnest path across the *whole* backbone — minimum at every station, loop closed. Then widen: by actor (the next persona's version), by capability (the verbs the skeleton deferred), by depth (the richer treatment of a station). When a candidate resists cutting, use the cut-line menu in [references/gates-and-cuts.md](references/gates-and-cuts.md).

**Variation-aware cutting:** for each candidate, ask which company / user / situation differences change how the job executes (dimension families: `.claude/skills/job-spec-draft/references/variation-scan.md`). A variation whose backbone differs **end-to-end is its own job** — cut it, don't bury it as a footnote in another job's spec. Nuances and branches stay inside a job; `/job-spec-draft`'s variation scan handles them.

**Type each candidate** — Integration (existing components surfaced or connected; feasibility verification is the critical path) · Net new (new objects or flows; earns a full-depth job spec) · Enhancement (existing behavior changed). Type comes from Step 1's code answers, not from hope.

## Step 4: Gate every candidate

Run each candidate through the gates in [references/gates-and-cuts.md](references/gates-and-cuts.md): the four pressure tests (outcome-changing · standalone-shippable · vertical · scope-sane), the false-thin-slice trap, and INVEST. A candidate that fails gets re-cut using the same file's menu — never shipped into the table as "we'll fix it in the job spec". If the reference file is missing, say so and gate with best judgment.

## Step 5: Sequence with reasons

Riskiest-assumption-first: the job that tests the bet's most dangerous unknown ships first — usually the walking skeleton. When the riskiest capability mechanically depends on a prior loop being live, the skeleton ships first as the smallest cut that unblocks it, and the risky job scopes to the seam (the new-object-conversion note in the references file) — "riskiest-first" means the risk is *reached fastest*, not that its job jumps its dependency. Every priority states its reason in dependency or risk language ("Must ship first — J-2 and J-3 depend on the [surface] being live"; "Could — no dependency, lowest reach"), never a bare Must/Should. Reach input comes from the segmentation sources in Step 1; a sequencing claim with no evidence is marked `[Hypothesis — needs validation]`. Note which jobs can run in parallel once their dependency is live.

## Step 6: Write, register, read out

1. **Write** the breakdown per the template — including the coverage check (every PRD scope item lands in a job or is explicitly out) and the template's Quality gate, emitted as document content with its boxes checked before presenting. The single checklist lives in the template.
2. **Register:** propose the `jobs-breakdown:` key on the feature's **existing** `feature-index.yaml` entry (gated — show the exact addition, apply on confirm, batched once per run). New feature keys belong to `/prd-draft` and `/context-update` (one-writer table); entry missing entirely (the PRD was never registered) → propose the minimal entry (prd + breakdown + initiatives) in the same gated change, marked as the registration `/prd-draft` would have made. Fill the initiative page's "Jobs breakdown:" Artifacts row and add a dated Activity line.
3. **Read out**, compact:

```
The cut — {initiative}

J-1 [name]   Net new       Must — walking skeleton; tests [riskiest assumption]
J-2 [name]   Integration   Should — depends on J-1's [surface] being live; can run parallel to J-3
J-3 [name]   Enhancement   Could — no dependency; lowest reach [source]
J-4 [name]   Net new       Won't-now — deferred to [when/why]

Coverage: [N] PRD scope items → [N] covered · [M] explicitly out
Cross-job decisions open: [n] — owners in §4
Next: /job-spec-draft J-1
```

On later runs, lead with what moved: statuses that advanced, jobs re-gated, cuts that changed and why.

---

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   `CLAUDE.md` (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Feature-scoped artifact → propose the `product-development/feature-index.yaml` addition
   and apply it only after the user confirms (gated in `governance/write-policy.yaml`).
   Initiative-scoped → link the artifact from `product-development/product/initiatives/{slug}.md`.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.

---

## Downstream

- `/job-spec-draft` — the per-job contract, riskiest job first; its variation scan can flag a different-backbone variation back here as a new job
- `/create-tickets` — after a job spec is agreed, never straight from the breakdown
- `/prototype` — a job spec is its natural input; the breakdown only says what to prototype first

## Chain Position

Stage 5 of the de-risk-a-bet chain (`product-development/product/handbook/de-risk-a-bet.md`) — upstream: `/prd-challenge` (cut an agreed bet, not a contested one) · downstream: `/job-spec-draft` per job, then `/create-tickets` from agreed job specs. Skip rules live in the chain doc.
