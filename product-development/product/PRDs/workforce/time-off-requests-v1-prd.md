---
initiatives: [time-off-requests-v1]
features: [time-off-requests]
---

# EXAMPLE — Team Time-Off & Coverage PRD

> Synthetic worked example for the fictional product **Beacon**, a B2B data-enrichment SaaS billed in usage credits (one credit per enriched record, pooled per organization). Beacon's mid-market and enterprise orgs run standing data-operations teams around enrichment jobs; when the person who approves jobs or watches the credit budget is away with no handoff, runs stall and balances drain unseen — so Beacon is adding team time-off management where that duty lives: the workspace. Every number below is invented. Use this next to [the blank template](../../handbook/templates/prd-template.md); the job cut derived from it lives in [time-off-requests-v1-jobs-breakdown.md](time-off-requests-v1-jobs-breakdown.md).

**DRI:** PM (see team roster in root CLAUDE.md) · **Stage:** Planning Review · **Status:** Draft · **Last updated:** 2026-08-13

## Hypothesis

If workspace teams can request, decide, and see time off inside Beacon — with approval duty and burn alerts handed to a covering teammate automatically — then coverage-gap incidents (stalled enrichment jobs, unwatched balances during absences) fall toward zero, because the handoff happens where the work lives instead of in a wall calendar nobody checks. We believe coverage, not the calendar, is the job.

## Problem

Enrichment jobs above an org's auto-approve threshold wait for a workspace approver; credit-burn alerts route to one named watcher per workspace. Both duties are personal, and neither survives an absence. In Q2, 9 of Beacon's 52 Growth- and Scale-tier orgs filed "job stuck — approver on vacation" or "balance ran dry while the watcher was away" tickets (support tag `coverage-gap`), and 3 enterprise prospects named team-absence handling in security reviews. Workarounds today: shared logins (a security exposure Beacon explicitly prohibits) or standing weekly check-ins that exist only to ask "who's out next week?". The people who feel this are Heads of Ops on Growth and Scale — on every absence, planned or not.

## Strategic Fit

Coverage continuity is the retention half of the Q3 "own the ops workflow" bet: orgs that route approvals and alerts through Beacon are the stickiest segment, and every coverage incident is a churn conversation with a Head of Ops. Alternatives considered: calendar-sync integration only (shows the absence, hands nothing off), Slack-workflow templates (live outside Beacon's permission model — exactly the shared-login problem again), and doing nothing (the 3 enterprise deals stall on the security-review answer).

## Solution sketch — the feature set

One workspace surface where analysts request time off, workspace managers decide, and the two coverage duties — enrichment-job approval and burn-alert watching — follow the absence automatically.

| # | Job | One line |
|---|---------|----------|
| 1 | Request & decide time off | Analyst requests dates → workspace manager approves or declines → the team sees who's out |
| 2 | Coverage handoff | During an approved absence, job-approval duty and burn alerts route to a chosen covering teammate — the routing rails already exist in the notification service |
| 3 | Allowances & balances | Per-org time-off policy, accrual, remaining-days visibility for requester and manager |
| 4 | Team calendar & conflict view | Absence overlaps checked against job schedules and billing-cycle deadlines |
| 5 | External calendar sync | Push approved absences to Google / Outlook calendars |

## Success Metrics

- **Primary:** `coverage_gap_incidents` — coverage-gap tickets per 100 Growth+Scale orgs per month; baseline 5.8, target ≤ 1.0 within two months of GA.
- **Secondary:** share of approved absences with a covering teammate assigned; target ≥ 80%.
- **Guardrails:** enrichment-job approval median latency flat or better; no rise in permission-escalation security events.

## Non-Goals

- **HRIS integration or payroll export** — Beacon manages coverage, not compensation; revisit only on repeated customer pull.
- **Company-wide (cross-workspace) leave policies** — v1 policy is per-org, applied per workspace.
- **Absence types beyond time off** — sick-day evidence flows and statutory leave workflows have a real compliance surface (14 of the 52 eligible orgs are EU-based) and are deliberately later.
