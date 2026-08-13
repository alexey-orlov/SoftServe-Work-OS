# EXAMPLE — Team Time-Off & Coverage

_status: active — PRD in Planning Review; job cut + first job spec drafted (worked example)_
_updated: 2026-08-13_
_target-job(s): `feature-index.yaml#workforce.time-off-requests`_
_owner: PM (roster placeholder)_

> Synthetic worked example for the fictional product **Beacon** — this initiative demonstrates the definition→delivery bridge: PRD → `/jobs-breakdown` → `/job-spec-draft`. Every number is invented.

## Snapshot

- Beacon workspaces get team time-off with automatic coverage handoff — job-approval duty and burn alerts follow the absence
- Why now: 9 of 52 Growth+Scale orgs hit coverage-gap incidents in Q2; 3 enterprise deals raised absence handling in security reviews
- "Done" = the request → decide → handoff loop live for Growth+Scale, coverage-gap tickets ≤ 1.0 per 100 orgs/month

## Scope & goal

- **Goal:** coverage-gap incidents 5.8 → ≤ 1.0 per 100 Growth+Scale orgs/month within two months of GA
- **In scope:** request & decide, coverage handoff, allowances & balances, team calendar
- **Out of scope:** HRIS/payroll export, cross-workspace policies, statutory leave workflows (v1)

## Artifacts

- PRD: [Team Time-Off & Coverage PRD](../PRDs/workforce/time-off-requests-prd.md)
- Assumption map: -
- Challenge report: -
- Jobs breakdown: [time-off-requests-jobs-breakdown.md](../PRDs/workforce/time-off-requests-jobs-breakdown.md)
- Job specs: [J-1 — request & decide](../PRDs/workforce/time-off-requests-request-approval-job-spec.md)
- Impact sizing: -
- User research: -
- Competitive analysis: -
- Pre-mortem: -
- Eng plan: -
- Metrics: -
- Experiments: -
- Launch checklist / gate verdict: -

## Decisions

- -

## Open loops

- Mine: agree the J-1 job spec with Engineering (its §14 confirmations) — then `/create-tickets`.

## Activity

- 2026-08-13 — Initiative created as the worked example of the PRD → breakdown → job spec chain.
- 2026-08-13 — Jobs breakdown drafted (`/jobs-breakdown`): J-1 request-approval (walking skeleton) → J-2 coverage-handoff (the bet's risk test) → J-3 ∥ J-4; J-5 external-calendar-sync Won't-now; 7 cross-job questions opened in the breakdown's §4.
- 2026-08-13 — J-1 request-approval job spec drafted (`/job-spec-draft`): four sweeps folded (S1–S4); 13 rules + 10-exception floor incl. the recursive decider-absent case; zero auto-closers ran (all source-gated out); 9 open questions — the ≥ 80% cover-naming premise routed to `/interview-guide` (suggested, not run).
