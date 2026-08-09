# Removed engineering/rfcs/ and bug-investigations/; kept plans/

**Date:** 2026-08-09
**Decided by:** [Steward] (roster placeholder)
**Initiative:** -
**Status:** Active

## Decision

Dissolved two of the four engineering wiki surfaces. `engineering/rfcs/` and `engineering/bug-investigations/` are deleted, and their routing moved into product space: architectural decisions land in `product/decisions/` with every other decision (`/decision-log-entry`), and defects surfaced during request triage go to engineering as tracker tickets (`/prioritize-requests`). `engineering/plans/` stays — it is the text-fallback output home for `/create-tickets` and is referenced by `/code-first-draft`. `/feature-launch-gate` no longer checks for an eng plan or RFC.

## Why

The team keeps engineering design records in the tracker and the codebase, not the wiki. One decision surface (`decisions/`) beats two (`decisions/` + `rfcs/`) for "why did we choose X?" lookups, and a bug folder no skill wrote into would only drift.

## What changed

- Deleted: `rfcs/`, `bug-investigations/` (with their billing worked examples), and the `plans/billing/` demo content
- Rerouted: architectural calls → `product/decisions/`; defects → tracker tickets
- Kept: `plans/` (empty scaffold), `code-repos.yaml`, `codebases/` — the `/code-qa` grounding chain is untouched
- All demo cross-references repaired the same day (initiative pages, gate record, PRD, feature-index, `.freshness-ignore`)
