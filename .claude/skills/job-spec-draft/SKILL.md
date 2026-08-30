---
name: job-spec-draft
description: Write the buildable contract for ONE job — the level between the PRD (/prd-draft) and tickets (/create-tickets). First creation stops at an intake checkpoint — blocking questions + write plan; one yes covers the run; a missing breakdown becomes its first choice (spec anyway or /jobs-breakdown first). Template-driven and proportionate (Integration job 2–3 pages; risky net-new earns full depth), every load-bearing claim evidence-labeled. Mandatory variation scan (company/user/situation — nuance vs branch vs different-job), four parallel sweep subagents (capabilities+states, actors+permissions, situations+exceptions, cross-cutting; --market adds competitor evidence, never UI), a source-gated /code-qa feasibility pass with an explicit TODO when code access is missing, grounded prioritization (sourced Reach/Frequency/Severity; compliance/money/privacy/irreversibility auto-Must; effort stays Engineering's number), research routing with ≤3 bounded auto-closers, and a readout led by "decisions only you can make" plus engineering confirmations and every file touched. Use on /job-spec-draft, "job spec J-2", "spec this job", "write the job contract". NOT for the initiative-level PRD (/prd-draft), cutting the initiative into jobs (/jobs-breakdown — runs first), challenging a drafted spec (/job-spec-challenge — accepted verdicts fold back through this skill, its one writer), dev tickets (/create-tickets — after the spec is agreed), or making the solution visible (/prototype — a job spec is its natural input).
argument-hint: "[job | breakdown row] [--market]"
group: definition
---

## Quick Start

**What to provide:** A job from a breakdown (`J-2`, or the initiative slug + job name), or an ad-hoc job description when no breakdown exists yet (offered: run `/jobs-breakdown` first — a job spec without a cut risks speccing a component).

```
/job-spec-draft [initiative] J-2            → Draft or update the contract for that job
/job-spec-draft [job description]       → Ad-hoc: the checkpoint leads with the missing breakdown — spec anyway, or cut first
/job-spec-draft [...] --market              → Adds the competitor-capability sweep (evidence, never UI)
```

**What you get:** the living contract at `product-development/product/PRDs/{area}/{initiative-slug}-{job-slug}-job-spec.md` (template: `product-development/product/handbook/templates/job-spec-template.md`) — variations dispositioned, capabilities swept complete with state maps, rules with testable ACs, grounded scope priorities — and a closing readout: decisions only you can make, research routed by method, what Engineering must confirm before scope commits, and every file the run touched.

**Time:** minutes for an Integration-type job; a full net-new stateful contract is a working session.

---

# /job-spec-draft — the buildable contract

A job spec here describes **what a user must be able to do and why** — clear enough that the build can't get it wrong, open enough that design and engineering find the best way. It carries the need; the prototype carries one answer to it. UI nouns appear only for existing platform surfaces or as `[code-names]`.

**The template owns the format.** Read `product-development/product/handbook/templates/job-spec-template.md` fresh each run — section order, table shapes, register rules, the proportionality rule, and the Quality gate (the single checklist) come from it. `>` blockquotes are guidance to you, never emitted. When a team installs its own house format there (`/customize-os job-spec-template`, derived from their real per-job requirement documents), this skill picks it up with no change.

**Evidence labels, throughout:** `[Evidenced]` (source named) · `[Partial]` (signal, not proof) · `[Hypothesis — needs validation]`. Undecided capabilities are **flagged, never invented** — they land in "Capabilities this job does not answer" plus an open-question row.

**The constraint line (run on every specific-looking detail):** *if the build changed this detail, where would the problem show up?* Caught in design review as look-and-feel → it's a solution: relocate to the capability it serves, or free it up. Surfaces after launch as a legal / money / data failure the build couldn't have known → it's a **constraint**: keep as rule + reason. Third outcome, rare: a **Commit** — the team has genuinely agreed there's only one viable path; keep by name, stamped (serves capability · why the only path · agreed by · date). Domains in `platform-model.md` §7 are presumed constraints until their owner says otherwise.

## Step 1: Assemble context

| Priority | Source | What to extract |
|----------|--------|-----------------|
| 1 | The breakdown (`PRDs/{area}/{initiative-slug}-jobs-breakdown.md`) | This job's row: type, riskiest assumption, dependencies, deferred items pointed at it |
| 2 | The PRD + initiative page | The goal this job serves; open loops |
| 3 | Sibling job specs in the area | Shared objects and states — consistency, not reinvention; a sibling that lands mid-run gets re-read: inherit its shared rules, import its handed-off questions |
| 4 | `strategy/business-context/platform-model.md` | Permission carriers, fixed enums, localization obligations, presumed-constraint domains, self-access rules |
| 5 | `product-development/engineering/tech-constraints.md` | Limits, conventions, do-not-re-implement registry |
| 6 | `product-development/product/user-insights/` (syntheses, interviews, feature-requests) + `product-development/product/customers/` (call summaries) | The job in users' own words; variation signals; per-claim evidence |
| 7 | `strategy/business-context/segmentation-matrix.md`, `customers/accounts/portfolio.yaml` | Reach denominators for §5 and §12 |
| 8 | `product-development/analytics/` (metrics, investigations) | Baselines for §15 |
| 9 | A prototype, if one exists (`product/prototypes/`) | **A hypothesis, not a requirement** — reconstruct the need underneath; never copy its UI into the job spec |
| 10 | `PRDs/{area}/reviews/` | Assumptions already ranked; challenges already answered |

**First creation of a spec stops at an intake checkpoint — the turn ends, nothing is written until the PM replies.** Three parts, each as short as the input allows: the open questions that block the job's definition (its object, its actors, its loop — plus the riskiest assumption when no breakdown row supplies one); played-back answers, one line each, taken from the breakdown row, PRD, and initiative page — generic repo context never silently answers, it gets played back too; and the write plan — spec file, breakdown-row bump, initiative-page rows, the gated `job-specs:` index addition, the closers Step 8 will run. One "go" covers the run; no per-file prompts follow. Only the PM's own words skip the stop ("just spec it"), never a judgment that the input looks complete — a worked breakdown row empties the questions, not the plan. Ad-hoc job with no breakdown → the checkpoint leads with that choice: spec anyway (flagged) or `/jobs-breakdown` first. Later runs on an existing spec don't stop. Everything beyond the blocking set drafts with `[GAP: what's missing — how to close it]`. `platform-model.md` / `tech-constraints.md` still `[TBD]` → carry `[GAP: platform model unfilled — constraints unverified]` / `[GAP: tech constraints unfilled — feasibility unverified]` in §9.

## Step 2: Classify the job

**Type** (from the breakdown row, verified against Step 6): Integration · Net new · Enhancement. **Risk level:** does it touch money, privacy, compliance, or an irreversible action? Type and risk modulate everything downstream: Integration → naming *existing* platform surfaces is fact, not solutioning, and feasibility verification (Step 6) is the critical path; net-new stateful → full-depth §6 with state map; high-risk → the Risks & break points conditional section, extra-QA flag, atomic-transaction question in §14.

## Step 3: Walk the spine

Draft top-down per the template: root cause (why this exists, with current-state facts) → outcome (behavior change) → job story (intent only) → the slice (riskiest assumption · backbone · covers · preconditions) → object/fields draft → capabilities and flow per actor. This is the first pass — Steps 4–8 harden it.

## Step 4: Variation scan (mandatory — before any output)

Self-interrogate along the three dimension families in [references/variation-scan.md](references/variation-scan.md) — company, user, situation. For each dimension: does execution of THIS job differ? Classify every hit: **not material** (say so in the §5 verdict line) · **nuance** (variation-tagged rules + exception rows) · **branch** (delta sub-flow, the delta only) · **different job** (backbone differs end-to-end → flag to `/jobs-breakdown` as its own job; never absorb it). Reach per variation is sourced (Step 1 row 7) or `[Hypothesis — needs validation]`. The scan's verdict fills §5 — silence is not an option.

## Step 5: The sweep battery — parallel subagents

**One message, multiple Task calls, blind to each other** — findings return to you; only you write. Four always, the fifth on `--market`. Proportionality applies to the mechanism too: for an Integration-type job the four lenses may run as one combined subagent pass (say so in the readout); the full parallel battery is for net-new / stateful depth. One call per sweep — where §4 found branches, each sweep covers all branches inside its one call (never multiply subagents per branch). The `[draft]` you pass is the Step-3 spine plus the §4 verdicts. Cross-sweep handoffs a lens proposes ("hand to S1") are yours to resolve at fold time — sweeps run blind.

| Sweep | Lens file | Hunts |
|-------|-----------|-------|
| S1 Capabilities & states | [references/sweep-s1-capabilities.md](references/sweep-s1-capabilities.md) | Missing lifecycle verbs, the inverse of every action, unreachable/no-exit states, multiplicity, Zero-One-Many |
| S2 Actors & permissions | [references/sweep-s2-actors.md](references/sweep-s2-actors.md) | Persona × action holes, out-of-scope personas, self-access, delegation & absence, permission carriers |
| S3 Situations & exceptions | [references/sweep-s3-situations.md](references/sweep-s3-situations.md) | Per-step "worst realistic thing instead": actors, timing, data, interruptions |
| S4 Cross-cutting | [references/sweep-s4-crosscutting.md](references/sweep-s4-crosscutting.md) | The nine dimensions of §10 — every row answered or deferred-with-risk |
| S5 Market (`--market` only) | [references/sweep-s5-market.md](references/sweep-s5-market.md) | Competitor capability sets for THIS job — evidence, never UI |

Sub-agent prompt template (per sweep):

```
You are one sweep of a parallel job-spec-draft pass. Read the lens at
.claude/skills/job-spec-draft/references/[file] and apply it end to end to this draft:
[draft]. Context: [PRD path · platform-model.md · tech-constraints.md · §5 verdicts].
Work alone — do not look for other sweeps' output. Return findings only: for each,
what's missing or wrong, the evidence, and a proposed disposition — in-job (as
capability / rule / AC / exception row) · deferred (risk + where it goes) · open
question (owner) · constraint (rule + why) · commit-candidate. If the lens file is
missing, say so and continue with best judgment.
```

Fold findings by disposition into §§6–11 and 16. A sweep with nothing to report says so — "nothing to assess" beats invented critique. The lens files above are shared: `/job-spec-challenge` reads them for its challenge-time sweeps — an edit to a lens changes both.

## Step 6: Feasibility & tech constraints

When `engineering/code-repos.yaml` lists a reachable repo covering the area (reachable = a machine-local grant per `engineering/code-grounding.md`'s access-tier chain — verify; never trust `access_tier:` alone, it records the team's best tier, not this machine's) → `/code-qa` (per its own SKILL.md): do the assumed components / endpoints / data exist, what limits and states does the platform enforce today, is the integration seam real (the "already live in [system] — do not re-implement" class of finding). Match the draft against `tech-constraints.md`. **No code access → §9 carries `[TODO: feasibility unverified — needs /connect-code or eng consult]`** — an explicit TODO, never a silent skip. Everything Engineering must confirm before scope commits goes to §14: endpoint/component existence, atomic-transaction and migration questions, effort ranges per Must item.

## Step 7: Prioritize & scope

Score each variation and each major candidate requirement/exception per [references/prioritization.md](references/prioritization.md): sourced Reach · Frequency · Severity (compliance / money / privacy / irreversibility auto-Must) · Evidence label → Must / Should / Could / Won't-now. Effort is deliberately not scored — it's Engineering's number (§14). Unevidenced Reach or Frequency → tier marked *provisional* + a §13 research row. This sets the job boundary; build order stays in the breakdown.

## Step 8: Route the research — and close what you can

Every open question, provisional priority, and unverified assumption gets a §13 row: best method → route.

| Need | Route |
|------|-------|
| How users actually do this / would they switch | `/interview-guide` — **suggested, never auto-run** (interviews are the PM's); `/process-meeting` files what comes back |
| Signal already in the corpus | `/user-research-synthesis`, or direct read of summaries |
| Reach, baselines | `segmentation-matrix.md` · `portfolio.yaml` · `analytics/` |
| Competitor capability claim | `/competitor-analysis` |
| Feasibility, current behavior | `/code-qa`, or the §14 `[TODO: eng consult]` |

**Bounded auto-closers — at most 3 per run, riskiest first, source-gated:** a closer runs only when it's a repo-grounded skill AND its source exists (`code-repos.yaml` reachable, matrix filled, corpus present). Parallel subagents, each following its own SKILL.md end to end; results folded and cited; the PM confirms results, not permission (on a first creation the closers were already named in the checkpoint's write plan). Gaps beyond the budget stay named in the readout. Never auto-run anything human-facing or outbound.

## Step 9: Synthesize and gate

Write per the template — proportionate (Integration ≈ 2–3 pages; conditional sections only when triggered), state diagrams only for stateful objects (one simple `stateDiagram-v2` each, linear flows as arrow chains, tables everywhere else). Then check the template's **Quality gate — the single checklist** — before presenting; fix fails, don't present them.

## Step 10: The readout (every run ends here)

```
Where this contract stands — {initiative} J-{N}

Decisions only you can make
  → [the judgment calls the sweeps surfaced — as many as genuinely exist]

What moved this run
  ✓ [sweep/closer that ran — what it changed, with the artifact path]

Backed / Still assumed
  ✓ [claim — source]        ⚠ [claim — why it couldn't be closed]

Research needed            → §13 rows: method + suggested skill per row
Engineering must confirm   → §14 list — blocks scope commitment, not drafting
Variations                 → [n dispositioned: X in, Y deferred, Z flagged to the breakdown]
Files this run touched     → created / updated / proposed (gated) — every path; with auto-sync on, the turn's one commit reverts the run

Next: [/job-spec-challenge when the draft has stabilised · the next job to job spec · /create-tickets when this one is agreed]
```

Suggest `/job-spec-challenge` explicitly when the contract stabilises — sweeps folded, gap count low, before the breakdown status moves to *agreed*. Never auto-run it: a judged checkpoint, not a data fetch. When the PM accepts a challenge report's verdicts, this skill folds them into the spec — the spec file has exactly one writer.

---

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   `CLAUDE.md` (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Declare the artifact's links in its frontmatter per `governance/link-schema.yaml` —
   resolve them YOURSELF from context before filing (initiative-scoped work names its
   one initiative; the initiative page gets the artifact row filled + a dated Activity
   line in the same change). A brand-new feature/area → propose the catalog entry
   (`feature-index.yaml`, gated) in the same confirmed change that registers the work.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.

Specifics for this skill: the job spec lands in the feature's `job-specs:` list (gated, batched once per run); the breakdown's J-row gets its status bumped and the job spec linked; the initiative page's "Job specs:" row and a dated Activity line are updated. New feature keys belong to `/prd-draft` and `/context-update`; entry missing entirely → propose the minimal entry (prd + job-specs + initiatives) in the same gated change, marked as the registration `/prd-draft` would have made.

---

## Downstream

- `/job-spec-challenge` — the independent challenge panel on this contract before it's agreed; its accepted verdicts fold back through this skill
- `/create-tickets` — from an **agreed** job spec; §14's confirmations and the DoD seam map onto ticket structure
- `/prototype` — the job spec is the need; the prototype is one hypothesis against it
- `/code-first-draft` — same: the job spec is its source contract when one exists
- `/feature-metrics` — deepens §15 into full metric definitions
- `/jobs-breakdown` — receives different-job variation flags as new job candidates

## Chain Position

Stage 5 of the de-risk-a-bet chain (`product-development/product/handbook/de-risk-a-bet.md`), with `/jobs-breakdown` — upstream: the cut · downstream: `/job-spec-challenge` (the judged checkpoint before the spec is agreed), then `/create-tickets`, `/prototype`. Skip rules live in the chain doc.
