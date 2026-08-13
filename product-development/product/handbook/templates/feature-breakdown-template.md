# [Initiative] — Feature Breakdown

> **How to use:** Copy for your initiative as `PRDs/{area}/{initiative-slug}-breakdown.md`. For guided creation run `/feature-breakdown` — it reads this file fresh each run as the document contract: section order, table shapes, and status vocabulary come from here. `>` blockquotes are guidance to the drafting agent — never emitted into the document.
>
> **What this document is:** the cut — one initiative broken into independently shippable features, sequenced by risk and dependency. It sits between the PRD (why this bet) and the per-feature briefs (`/feature-brief` — the buildable contract). One breakdown per initiative, edited in place as features get drafted, agreed, and handed off.

**Initiative:** [name] · **PRD:** [link] · **Owner:** [PM] · **Updated:** [YYYY-MM-DD]

## 1) The backbone

> The initiative's end-to-end story as users live it — activities left to right, all actors named, core objects listed. Rebuilt from the PRD and its evidence, not invented. This is the seam the features are cut from; every feature below traverses part of it.

**Actors:** [everyone who touches this flow, including out-of-scope personas]
**Core objects:** [the nouns — each will need its lifecycle verbs in a brief]
**Flow:** [activity] → [activity] → [activity] → [the loop closes: outcome lands]

## 2) The features

> One row per feature. **Type:** Integration (existing components surfaced or connected — feasibility verification is the critical path) · Net new (new objects or flows — earns a full-depth brief) · Enhancement (existing behavior changed). **Priority** carries its reason in dependency or risk language ("Must ship first — F-2 and F-3 depend on [X] being live"), never a bare label. **Status:** not-drafted → drafted → agreed → handed-off; a Won't-now feature rests at `deferred`.

| ID | Feature (code-name) | Type | Riskiest assumption it tests | Depends on | Priority — why | Status |
|----|---------------------|------|------------------------------|-----------|----------------|--------|
| F-1 | [code-name] | [type] | [assumption] | — | Must — [reason] | not-drafted |

## 3) Sequencing rationale

> Riskiest-assumption-first: why this order and not another. Name the walking skeleton — the first feature must traverse the backbone end-to-end with the minimum at every station, not perfect one station. Note which features can run in parallel once their dependency is live.

## 4) Cross-feature decisions & open questions

> Decisions that span features (shared objects, shared states, who owns a boundary) and questions no single brief can settle. Each has an owner. Settled ones move to `product/decisions/` and stay linked from here.

| # | Decision / question | Affects | Owner | Status |
|---|---------------------|---------|-------|--------|
| 1 | [question] | F-[N], F-[M] | [name/role] | Open |

## 5) Coverage check

> Every scope item in the PRD lands in exactly one feature above, or is named here as explicitly out — with why, and where it goes instead (a future feature, or "deliberately never"). Nothing silently dropped.

- Covered: [PRD scope item] → F-[N]
- Explicitly out: [item] — [why · future feature or never]

---

**Quality gate** (checked by `/feature-breakdown` before presenting; recheck on manual edits):

- [ ] Every feature passes the four pressure tests — outcome-changing · standalone-shippable · vertical (end-to-end, not one station) · scope-sane (checklists: `.claude/skills/feature-breakdown/references/gates-and-cuts.md`)
- [ ] No false thin slice: the first feature traverses the backbone end-to-end and reaches an outcome
- [ ] Every priority states its reason in dependency or risk language
- [ ] Coverage check is clean — every PRD scope item covered or explicitly out
- [ ] A variation whose backbone differs end-to-end became its own feature, not a footnote in someone else's
- [ ] Statuses reflect reality (briefs that exist are linked from their rows)

<!--
Template rules (keep this comment):
- One breakdown per initiative, edited in place; the feature table is the live status board.
- Feature IDs (F-1…) are stable once assigned — briefs and the feature-index reference them.
- Link each drafted brief from its row: `[F-2 brief]({initiative-slug}-{feature-slug}-brief.md)`.
-->
