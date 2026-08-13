# Added the Feature Level Between PRD and Tickets — /feature-breakdown + /feature-brief

**Date:** 2026-08-13
**Decided by:** [Steward] (roster placeholder)
**Initiative:** -
**Status:** Active

## Decision

Two new definition skills close the gap between `/prd-draft` (initiative-level) and `/create-tickets` (dev backlog): `/feature-breakdown` cuts an agreed initiative into independently shippable features (walking-skeleton-first, gated by four pressure tests + INVEST, sequenced riskiest-assumption-first with dependency rationale); `/feature-brief` writes the per-feature buildable contract (mandatory variation scan, four parallel sweep subagents + flag-gated market sweep, source-gated `/code-qa` feasibility, grounded prioritization with compliance/money/privacy/irreversibility auto-Must, research routing with ≤3 bounded closers, engineering-confirmations list; `challenge` mode for existing drafts). Both are template-driven per the same-day format-universal decision — structure lives in `handbook/templates/feature-breakdown-template.md` and `feature-brief-template.md`; the skills carry method only.

Consequences landed together: the de-risk chain gained stage 5 "Break down" (later stages renumbered 5→6, 6→7, 7→8 across the chain doc and five skill footers); `feature-index.yaml` gained two recognized keys (`breakdown:`, `briefs:`); `reviews/` gained the `*-brief-review-{YYYY-MM-DD}` suffix; two new gated living masters ground the skills — `business-context/platform-model.md` (PM-owned platform facts) and `engineering/tech-constraints.md` (Engineer-owned build realities + do-not-re-implement registry); `/create-tickets`, `/prototype`, and `/code-first-draft` prefer briefs as source when they exist. Worked example: the Beacon time-off & coverage chain in `PRDs/workforce/`.

## Context

The suite jumped from "why this bet" (PRD) straight to tickets; the buildable per-feature requirements contract a PM hands to BA/dev did not exist as a level. The design was calibrated on a client engagement's compact per-feature contract + JTBD companion document pair (confidential — no client content lands in this repo), fused into one recognizable contract and upgraded with systematic sweeps, structured variations, and evidence-grounded priorities.

## Options considered

- **One monolithic skill** (cut + brief in one run) — rejected: the cut happens once per initiative, the contract per feature and re-runnable; different cadences, different inputs.
- **Depth machinery as chained sub-skills** — rejected: no consumer exists for the intermediate artifacts; parallel sweep subagents inside `/feature-brief` instead, each lens a tunable `references/` file.
- **A separate `/feature-challenge` skill** (mirroring prd-draft/prd-challenge) — rejected for now: the sweeps ARE the challenge machinery, so challenge is a mode of `/feature-brief`; revisit if discoverability suffers.

## Tradeoff accepted

The chain renumber touched five skill footers in one landing — a one-time cost for clean stage numbers. "Feature" now names both the index unit and the sub-initiative unit; accepted because it matches how PMs actually speak (initiative → features → tickets), with F-N ids in doc titles carrying the disambiguation.
