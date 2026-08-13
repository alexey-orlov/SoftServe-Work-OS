---
name: feature-brief
description: Write the buildable contract for ONE feature — the level between the PRD (/prd-draft) and tickets (/create-tickets). Template-driven and proportionate (an Integration-type job is 2–3 pages; a risky net-new stateful one earns full depth), every load-bearing claim evidence-labeled. Runs a mandatory variation scan (company / user / situation dimensions — nuance vs branch vs different-feature), then four parallel sweep subagents (capabilities+states, actors+permissions, situations+exceptions, cross-cutting; --market adds competitor capability evidence, never UI), a source-gated /code-qa feasibility pass with an explicit TODO when code access is missing, grounded prioritization (sourced Reach/Frequency/Severity; compliance/money/privacy/irreversibility auto-Must; effort stays Engineering's number), research routing with ≤3 bounded auto-closers, and a readout led by "decisions only you can make" plus the engineering-confirmations list. challenge mode pressure-tests an existing draft into a relocation table + gaps report in PRDs/{area}/reviews/. Use on /feature-brief, "brief F-2", "spec this feature", "write the feature contract", "challenge this brief". NOT for the initiative-level PRD (/prd-draft), cutting the initiative into features (/feature-breakdown — runs first), dev tickets (/create-tickets — runs after the brief is agreed), or making the solution visible (/prototype — a brief is its natural input).
argument-hint: "[feature | breakdown row] [challenge <path>] [--market]"
group: definition
---

## Quick Start

**What to provide:** A feature from a breakdown (`F-2`, or the initiative slug + feature name), or an ad-hoc feature description when no breakdown exists yet (offered: run `/feature-breakdown` first — a brief without a cut risks briefing a component).

```
/feature-brief [initiative] F-2            → Draft or update the contract for that feature
/feature-brief [feature description]       → Ad-hoc: classify, scan, sweep, draft — flags the missing breakdown
/feature-brief [...] --market              → Adds the competitor-capability sweep (evidence, never UI)
/feature-brief challenge [path]            → Pressure-test an existing draft (yours or prototype-derived)
```

**What you get:** the living contract at `product-development/product/PRDs/{area}/{initiative-slug}-{feature-slug}-brief.md` (template: `product-development/product/handbook/templates/feature-brief-template.md`) — variations dispositioned, capabilities swept complete with state maps, rules with testable ACs, grounded scope priorities — and a closing readout: decisions only you can make, research routed by method, what Engineering must confirm before scope commits.

**Time:** minutes for an Integration-type job; a full net-new stateful contract is a working session.

---

# /feature-brief — the buildable contract

A brief here describes **what a user must be able to do and why** — clear enough that the build can't get it wrong, open enough that design and engineering find the best way. It carries the need; the prototype carries one answer to it. UI nouns appear only for existing platform surfaces or as `[code-names]`.

**The template owns the format.** Read `product-development/product/handbook/templates/feature-brief-template.md` fresh each run — section order, table shapes, register rules, the proportionality rule, and the Quality gate (the single checklist) come from it. `>` blockquotes are guidance to you, never emitted.

**Evidence labels, throughout:** `[Evidenced]` (source named) · `[Partial]` (signal, not proof) · `[Hypothesis — needs validation]`. Undecided capabilities are **flagged, never invented** — they land in "Capabilities this feature does not answer" plus an open-question row.

**The constraint line (run on every specific-looking detail):** *if the build changed this detail, where would the problem show up?* Caught in design review as look-and-feel → it's a solution: relocate to the capability it serves, or free it up. Surfaces after launch as a legal / money / data failure the build couldn't have known → it's a **constraint**: keep as rule + reason. Third outcome, rare: a **Commit** — the team has genuinely agreed there's only one viable path; keep by name, stamped (serves capability · why the only path · agreed by · date). Domains in `platform-model.md` §7 are presumed constraints until their owner says otherwise.

## Step 1: Assemble context

| Priority | Source | What to extract |
|----------|--------|-----------------|
| 1 | The breakdown (`PRDs/{area}/{initiative-slug}-breakdown.md`) | This feature's row: type, riskiest assumption, dependencies, deferred items pointed at it |
| 2 | The PRD + initiative page | The goal this feature serves; open loops |
| 3 | Sibling briefs in the area | Shared objects and states — consistency, not reinvention |
| 4 | `strategy/business-context/platform-model.md` | Permission carriers, fixed enums, localization obligations, presumed-constraint domains, self-access rules |
| 5 | `product-development/engineering/tech-constraints.md` | Limits, conventions, do-not-re-implement registry |
| 6 | `product-development/product/customers/` (research-synthesis, feature-requests, call summaries) | The job in users' own words; variation signals; per-claim evidence |
| 7 | `strategy/business-context/segmentation-matrix.md`, `customers/accounts/portfolio.yaml` | Reach denominators for §5 and §12 |
| 8 | `product-development/analytics/` (metrics, investigations) | Baselines for §15 |
| 9 | A prototype, if one exists (`PRDs/prototypes/`) | **A hypothesis, not a requirement** — reconstruct the need underneath; never copy its UI into the brief |
| 10 | `PRDs/{area}/reviews/` | Assumptions already ranked; challenges already answered |

Ask only questions that block the feature's definition (its object, its actors, its loop). Everything else drafts with `[GAP: what's missing — how to close it]`. `platform-model.md` / `tech-constraints.md` still `[TBD]` → carry `[GAP: platform model unfilled — constraints unverified]` / `[GAP: tech constraints unfilled — feasibility unverified]` in §9.

## Step 2: Classify the job

**Type** (from the breakdown row, verified against Step 6): Integration · Net new · Enhancement. **Risk level:** does it touch money, privacy, compliance, or an irreversible action? Type and risk modulate everything downstream: Integration → naming *existing* platform surfaces is fact, not solutioning, and feasibility verification (Step 6) is the critical path; net-new stateful → full-depth §6 with state map; high-risk → the Risks & break points conditional section, extra-QA flag, atomic-transaction question in §14.

## Step 3: Walk the spine

Draft top-down per the template: root cause (why this exists, with current-state facts) → outcome (behavior change) → job story (intent only) → the slice (riskiest assumption · backbone · covers · preconditions) → object/fields draft → capabilities and flow per actor. This is the first pass — Steps 4–8 harden it.

## Step 4: Variation scan (mandatory — before any output)

Self-interrogate along the three dimension families in [references/variation-scan.md](references/variation-scan.md) — company, user, situation. For each dimension: does execution of THIS job differ? Classify every hit: **not material** (say so in the §5 verdict line) · **nuance** (variation-tagged rules + exception rows) · **branch** (delta sub-flow, the delta only) · **different job** (backbone differs end-to-end → flag to `/feature-breakdown` as its own feature; never absorb it). Reach per variation is sourced (Step 1 row 7) or `[Hypothesis — needs validation]`. The scan's verdict fills §5 — silence is not an option.

## Step 5: The sweep battery — parallel subagents

**One message, multiple Task calls, blind to each other** — findings return to you; only you write. Four always, the fifth on `--market`. One call per sweep — where §4 found branches, each sweep covers all branches inside its one call (never multiply subagents per branch). The `[draft]` you pass is the Step-3 spine plus the §4 verdicts. Cross-sweep handoffs a lens proposes ("hand to S1") are yours to resolve at fold time — sweeps run blind.

| Sweep | Lens file | Hunts |
|-------|-----------|-------|
| S1 Capabilities & states | [references/sweep-s1-capabilities.md](references/sweep-s1-capabilities.md) | Missing lifecycle verbs, the inverse of every action, unreachable/no-exit states, multiplicity, Zero-One-Many |
| S2 Actors & permissions | [references/sweep-s2-actors.md](references/sweep-s2-actors.md) | Persona × action holes, out-of-scope personas, self-access, delegation & absence, permission carriers |
| S3 Situations & exceptions | [references/sweep-s3-situations.md](references/sweep-s3-situations.md) | Per-step "worst realistic thing instead": actors, timing, data, interruptions |
| S4 Cross-cutting | [references/sweep-s4-crosscutting.md](references/sweep-s4-crosscutting.md) | The nine dimensions of §10 — every row answered or deferred-with-risk |
| S5 Market (`--market` only) | [references/sweep-s5-market.md](references/sweep-s5-market.md) | Competitor capability sets for THIS job — evidence, never UI |

Sub-agent prompt template (per sweep):

```
You are one sweep of a parallel feature-brief pass. Read the lens at
.claude/skills/feature-brief/references/[file] and apply it end to end to this draft:
[draft]. Context: [PRD path · platform-model.md · tech-constraints.md · §5 verdicts].
Work alone — do not look for other sweeps' output. Return findings only: for each,
what's missing or wrong, the evidence, and a proposed disposition — in-feature (as
capability / rule / AC / exception row) · deferred (risk + where it goes) · open
question (owner) · constraint (rule + why) · commit-candidate. If the lens file is
missing, say so and continue with best judgment.
```

Fold findings by disposition into §§6–11 and 16. A sweep with nothing to report says so — "nothing to assess" beats invented critique.

## Step 6: Feasibility & tech constraints

When `engineering/code-repos.yaml` lists a reachable repo covering the area (reachable = a machine-local grant per `engineering/code-grounding.md`'s access-tier chain — verify; never trust `access_tier:` alone, it records the team's best tier, not this machine's) → `/code-qa` (per its own SKILL.md): do the assumed components / endpoints / data exist, what limits and states does the platform enforce today, is the integration seam real (the "already live in [system] — do not re-implement" class of finding). Match the draft against `tech-constraints.md`. **No code access → §9 carries `[TODO: feasibility unverified — needs /connect-code or eng consult]`** — an explicit TODO, never a silent skip. Everything Engineering must confirm before scope commits goes to §14: endpoint/component existence, atomic-transaction and migration questions, effort ranges per Must item.

## Step 7: Prioritize & scope

Score each variation and each major candidate requirement/exception per [references/prioritization.md](references/prioritization.md): sourced Reach · Frequency · Severity (compliance / money / privacy / irreversibility auto-Must) · Evidence label → Must / Should / Could / Won't-now. Effort is deliberately not scored — it's Engineering's number (§14). Unevidenced Reach or Frequency → tier marked *provisional* + a §13 research row. This sets the feature boundary; build order stays in the breakdown.

## Step 8: Route the research — and close what you can

Every open question, provisional priority, and unverified assumption gets a §13 row: best method → route.

| Need | Route |
|------|-------|
| How users actually do this / would they switch | `/interview-guide` — **suggested, never auto-run** (interviews are the PM's); `/process-meeting` files what comes back |
| Signal already in the corpus | `/user-research-synthesis`, or direct read of summaries |
| Reach, baselines | `segmentation-matrix.md` · `portfolio.yaml` · `analytics/` |
| Competitor capability claim | `/competitor-analysis` |
| Feasibility, current behavior | `/code-qa`, or the §14 `[TODO: eng consult]` |

**Bounded auto-closers — at most 3 per run, riskiest first, source-gated:** a closer runs only when it's a repo-grounded skill AND its source exists (`code-repos.yaml` reachable, matrix filled, corpus present). Parallel subagents, each following its own SKILL.md end to end; results folded and cited; the PM confirms results, not permission. Gaps beyond the budget stay named in the readout. Never auto-run anything human-facing or outbound.

## Step 9: Synthesize and gate

Write per the template — proportionate (Integration ≈ 2–3 pages; conditional sections only when triggered), state diagrams only for stateful objects (one simple `stateDiagram-v2` each, linear flows as arrow chains, tables everywhere else). Then check the template's **Quality gate — the single checklist** — before presenting; fix fails, don't present them.

## Step 10: The readout (every run ends here)

```
Where this contract stands — {initiative} F-{N}

Decisions only you can make
  → [the judgment calls the sweeps surfaced — as many as genuinely exist]

What moved this run
  ✓ [sweep/closer that ran — what it changed, with the artifact path]

Backed / Still assumed
  ✓ [claim — source]        ⚠ [claim — why it couldn't be closed]

Research needed            → §13 rows: method + suggested skill per row
Engineering must confirm   → §14 list — blocks scope commitment, not drafting
Variations                 → [n dispositioned: X in, Y deferred, Z flagged to the breakdown]

Next: [the next feature to brief, or /create-tickets when this one is agreed]
```

## Challenge mode

`/feature-brief challenge [path]` — same machinery, pointed at an existing draft (hand-written or prototype-derived). Run the constraint line on every solution-shaped line, then the variation scan (its verdicts stand in for the draft's missing §5 as sweep context), then sweeps S1–S4 (S5 only with `--market`). Feasibility (Step 6) runs source-gated exactly as in author mode — its verdict or TODO lands in the report header; prioritization (Step 7) is skipped — the relocation table, not tiers, is the challenge deliverable. Then report:

1. **Decisions only you can make** — pinned first; as many as genuinely exist.
2. **The relocation table** — every flagged line: original → verdict (**Relocate** to the capability it serves · **Constraint (keep)** as rule + reason · **Commit** stamped · **Free up** with why leaving it open helps · **Gap flag**) → where it went. One table; no prose restatement. Nothing vanishes silently — even a freed-up line keeps its row recording the detail and why leaving it open helps.
3. **Gaps** — missing inverse actions and lifecycle verbs, unreachable states, the slice test (false-thin-slice), silent cross-cutting rows, exceptions floor, unstated rules.
4. **Offer the rewrite** — assemble the corrected brief only on the PM's yes; the report never edits the brief.

Report → `product-development/product/PRDs/{area}/reviews/{initiative-slug}-{feature-slug}-brief-review-{YYYY-MM-DD}.md` (dated, one per run). The brief itself is touched only on PM confirm. Write-back for the report: uniform-block step 1 applies (first use of `reviews/` creates its 5-line CLAUDE.md stub); propose the report on the feature's `reviews:` list (gated, batched); the brief's own registration is untouched by a challenge run.

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

Specifics for this skill: the brief lands in the feature's `briefs:` list (gated, batched once per run); the breakdown's F-row gets its status bumped and the brief linked; the initiative page's "Feature briefs:" row and a dated Activity line are updated. New feature keys belong to `/prd-draft` and `/context-update`; entry missing entirely → propose the minimal entry (prd + briefs + initiatives) in the same gated change, marked as the registration `/prd-draft` would have made.

---

## Downstream

- `/create-tickets` — from an **agreed** brief; §14's confirmations and the DoD seam map onto ticket structure
- `/prototype` — the brief is the need; the prototype is one hypothesis against it
- `/code-first-draft` — same: the brief is its source contract when one exists
- `/feature-metrics` — deepens §15 into full metric definitions
- `/feature-breakdown` — receives different-job variation flags as new feature candidates

## Chain Position

Stage 5 of the de-risk-a-bet chain (`product-development/product/handbook/de-risk-a-bet.md`), with `/feature-breakdown` — upstream: the cut · downstream: `/create-tickets`, `/prototype`. Skip rules live in the chain doc.
