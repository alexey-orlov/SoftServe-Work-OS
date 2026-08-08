# EXAMPLE — Experiment Results: Low-Balance Warning (2026-03-05)

> Synthetic worked example for the fictional product Beacon. Readout of the pre-registered [design](low-balance-warning-2026-03-05-experiment-design.md); invented numbers throughout.

**Ran:** 2026-03-05 → 2026-03-18 (14 days, fixed horizon) · **Readout:** 2026-03-19 · **Analyst:** analytics · **Decision:** SHIP

## Sample

- Control: 2,714 orgs · Treatment: 2,689 orgs (threshold-crossers, org-level assignment).
- SRM check: chi-square p = 0.73 — assignment healthy. Day-3 interim look: guardrails only, no issues.
- Both arms exceeded the pre-registered ≈ 2,600/arm requirement.

## Primary Metric

`low_balance_topup_rate` ([definition](../../metrics/billing/billing-metrics.md) · [canonical SQL](../../queries/billing/churn_by_segment.sql)):

| Arm | Crossers | Topped up ≤ 7d | Rate |
|-----|----------|----------------|------|
| Control | 2,714 | 600 | 22.1% |
| Treatment | 2,689 | 742 | 27.6% |

- **Lift:** +5.5 pp absolute (+24.9% relative), 95% CI [+3.2, +7.8] pp, p = 0.0004.
- Pre-registered ship bar was ≥ +3.3 pp at p < 0.05 — cleared.

## Guardrails & Secondary

- Billing-email unsubscribe: 0.4% (bar: < 1%) — pass.
- `billing`-tagged tickets: −7% week-over-week (warning appears to *pre-empt* tickets) — pass.
- Next-month churn of crossers (directional, underpowered as pre-registered): 8.9% treatment vs 9.7% control — right sign, not significant.

## Decision & Rollout

Ship criteria met with no guardrail breach → `low_balance_warning` flag to 100% at dashboard GA on 2026-03-20 (see [engineering plan](../../../engineering/plans/billing/credit-usage-dashboard.md), flag table). Recorded in the launch gate [verdict](../../../product/launches/credit-usage-dashboard-v1-gate-2026-03-18.md) as "results due after readout".

## Caveats & Follow-ups

- Effect is measured on beta orgs (earlier adopters); GA effect may be smaller — re-read `low_balance_topup_rate` from [churn_by_segment.sql](../../queries/billing/churn_by_segment.sql) one month post-GA.
- Duplicate-burn events from the [double-charge bug](../../../engineering/bug-investigations/billing/bug-03-12-2026-credit-double-charge/investigation-plan.md) overlapped days 3–7; readout used `event_id` dedupe, and a sensitivity pass excluding affected orgs moved the lift by < 0.3 pp.
- Iterate candidate for Q2: test a 30% threshold for Scale-tier orgs whose burn is spikier.
