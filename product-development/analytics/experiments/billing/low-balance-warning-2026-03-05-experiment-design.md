---
initiatives: [credit-usage-dashboard-v1]
features: [credit-usage-dashboard]
---

# EXAMPLE — Experiment Design: Low-Balance Warning (2026-03-05)

> Synthetic worked example for the fictional product Beacon. Pre-registered before launch; invented numbers throughout.

**Status:** Pre-registered 2026-03-04, started 2026-03-05 · **Owner:** PM, with analyst sign-off

## Hypothesis

Showing an in-app banner plus a same-day email when an org crosses below 20% of its credit balance will increase the share of crossing orgs that top up within 7 days, because depletion today is silent until API calls fail ([investigation](../../investigations/billing/2026-03-10-credit-depletion-churn-analysis.md) — filed mid-experiment, motivated by the same Q4 churn pattern).

## Design

- **Unit of randomization:** organization (`org_id`), hashed assignment at first threshold crossing.
- **Arms:** control — no warning (status quo) · treatment — banner + email at 20% remaining. 50/50 split.
- **Population:** all paid orgs on the dashboard beta that cross the 20% line during the run.
- **Primary metric:** `low_balance_topup_rate` — defined in [billing-metrics.md](../../metrics/billing/billing-metrics.md), canonical SQL [churn_by_segment.sql](../../queries/billing/churn_by_segment.sql). Baseline 22.1%.
- **Guardrails:** unsubscribe rate on billing emails < 1%; support tickets tagged `billing` not up > 10% week-over-week; no SRM (chi-square p ≥ 0.001).
- **Secondary (directional only):** next-month logo churn of crossing orgs — underpowered at this duration, tracked for sign.

## Power & Sample Size

- **MDE:** +3.3 pp absolute on the primary (22.1% → 25.4%, ~15% relative).
- **Power / alpha:** 0.80 / 0.05, two-sided.
- **Required n:** ≈ 2,600 orgs per arm. At ~1,300 threshold-crossings per week across the beta, that is a **14-day run** (2026-03-05 → 2026-03-18 readout window close).

## Stopping Rules

- Fixed horizon: no early stop for efficacy; readout only after the 14-day window closes and the last cohort's 7-day attribution matures.
- Early stop **only** for harm: SRM p < 0.001, unsubscribe > 1%, or a billing-ticket spike > 25% attributable to the warning.
- One interim look at day 3, guardrails and SRM only.

## Decision Criteria

- **Ship** (warning to 100% at GA): primary lift ≥ +3.3 pp, p < 0.05, no guardrail breach.
- **Iterate:** positive but below MDE — test 30% threshold or email-only variant.
- **Kill:** guardrail breach or lift ≤ 0.

## Related

- Results: [low-balance-warning-2026-03-05-experiment-results.md](low-balance-warning-2026-03-05-experiment-results.md) (filed after readout)
- PRD: [credit-usage-dashboard-v1-prd.md](../../../product/PRDs/billing/credit-usage-dashboard-v1-prd.md)
