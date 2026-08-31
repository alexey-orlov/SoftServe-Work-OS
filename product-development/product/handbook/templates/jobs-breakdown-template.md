---
initiatives: [initiative-slug]
---

# [Initiative] — Jobs Breakdown

> **How to use:** Copy for your initiative as `PRDs/{area}/{initiative-slug}-jobs-breakdown.md` (frontmatter names the initiative — link contract: `governance/link-schema.yaml`). For guided creation run `/jobs-breakdown` — it reads this file fresh each run as the document contract: section order, table shapes, and status vocabulary come from here. `>` blockquotes are guidance to the drafting agent — never emitted into the document.
>
> **What this document is:** the cut — one initiative broken into independently shippable jobs, sequenced by risk and dependency. It sits between the PRD (why this bet) and the per-job job specs (`/job-spec-draft` — the buildable contract). One breakdown per initiative, edited in place as jobs get drafted, agreed, and handed off.

**Initiative:** [name] · **PRD:** [link] · **Owner:** [PM] · **Updated:** [YYYY-MM-DD]

## 1) The backbone

> The initiative's end-to-end story as users live it — activities left to right, all actors named, core objects listed. Rebuilt from the PRD and its evidence, not invented. This is the seam the jobs are cut from; every job below traverses part of it.

**Actors:** [everyone who touches this flow, including out-of-scope personas]
**Core objects:** [the nouns — each will need its lifecycle verbs in a job spec]
**Flow:** [activity] → [activity] → [activity] → [the loop closes: outcome lands]

## 2) The jobs

> One row per job. **Type:** Integration (existing components surfaced or connected — feasibility verification is the critical path) · Net new (new objects or flows — earns a full-depth job spec) · Enhancement (existing behavior changed). **Priority** carries its reason in dependency or risk language ("Must ship first — J-2 and J-3 depend on [X] being live"), never a bare label. **Status:** not-drafted → drafted → agreed → handed-off; a Won't-now job rests at `deferred`.

| ID | Job (code-name) | Type | Riskiest assumption it tests | Depends on | Priority — why | Status |
|----|---------------------|------|------------------------------|-----------|----------------|--------|
| J-1 | [code-name] | [type] | [assumption] | — | Must — [reason] | not-drafted |

## 3) Sequencing rationale

> Riskiest-assumption-first: why this order and not another. Name the walking skeleton — the first job must traverse the backbone end-to-end with the minimum at every station, not perfect one station. Note which jobs can run in parallel once their dependency is live.

## 4) Cross-job decisions & open questions

> Decisions that span jobs (shared objects, shared states, who owns a boundary) and questions no single job spec can settle. Each has an owner. Settled ones move to `product/decisions/` and stay linked from here.

| # | Decision / question | Affects | Owner | Status |
|---|---------------------|---------|-------|--------|
| 1 | [question] | J-[N], F-[M] | [name/role] | Open |

## 5) Coverage check

> Every scope item in the PRD lands in exactly one job above, or is named here as explicitly out — with why, and where it goes instead (a future job, or "deliberately never"). Nothing silently dropped.

- Covered: [PRD scope item] → J-[N]
- Explicitly out: [item] — [why · future job or never]

---

**Quality gate** (checked by `/jobs-breakdown` before presenting; recheck on manual edits):

- [ ] Every job passes the four pressure tests — outcome-changing · standalone-shippable · vertical (end-to-end, not one station) · scope-sane (checklists: `.claude/skills/jobs-breakdown/references/gates-and-cuts.md`)
- [ ] No false thin slice: the first job traverses the backbone end-to-end and reaches an outcome
- [ ] Every priority states its reason in dependency or risk language
- [ ] Coverage check is clean — every PRD scope item covered or explicitly out
- [ ] A variation whose backbone differs end-to-end became its own job, not a footnote in someone else's
- [ ] Statuses reflect reality (job specs that exist are linked from their rows)

<!--
Template rules (template file only — delete this comment when filling a copy):
- One breakdown per initiative, edited in place; the job table is the live status board.
- Job IDs (J-1…) are stable once assigned — job specs and the feature-index reference them.
- Link each drafted job spec from its row: `[J-2 job spec]({initiative-slug}-{job-slug}-job-spec.md)`.
-->
