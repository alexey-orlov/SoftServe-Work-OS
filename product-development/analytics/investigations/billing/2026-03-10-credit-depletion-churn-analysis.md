---
initiatives: [credit-usage-dashboard-v1]
areas: [billing]
features: [credit-usage-dashboard, tier-discount-promo]
---

# EXAMPLE — Investigation: Credit Depletion → Churn (2026-03-10)

> Synthetic worked example for the fictional product Beacon. Invented numbers throughout.

**Question:** Do orgs that run out of credits churn more, and is the effect big enough to justify the credit-usage dashboard and low-balance warning investment? · **Analyst:** analytics · **Requested by:** PM

## TL;DR

Yes, strongly. Orgs that hit a zero balance twice or more in a quarter churn the following month at **9.8% vs the 2.6% all-org baseline (3.8x)**. 41% of all Q4-2025 churned orgs hit zero in their final 60 days. Depletion is concentrated in the Starter tier (62% of depletion events) — exactly where the dashboard, warning, and a tier-upgrade promo should aim.

## Method

- Cohorts: all paid orgs active in Q3–Q4 2025, from `ANALYTICS.PROD.SUBSCRIPTIONS`.
- Depletion events from `ANALYTICS.PROD.BILLING_EVENTS` (`credit_burn` with `balance_after <= 0`), deduped on `event_id` per the [schema gotchas](../../schemas/billing/billing_events.md).
- Churn defined exactly as `monthly_logo_churn_rate` in [billing-metrics.md](../../metrics/billing/billing-metrics.md); the production rollup lives in [churn_by_segment.sql](../../queries/billing/churn_by_segment.sql) — this analysis added a one-off depletion-count cohort split on top.

## Findings

1. Next-month churn by depletion count (Q4 2025): 0 depletions → 2.6% · 1 → 5.1% · ≥ 2 → 9.8%.
2. 41% of churned orgs depleted in their final 60 days; median gap from first zero-balance to cancellation was 23 days — a real intervention window.
3. Starter tier accounts for 62% of depletion events but only 44% of paid orgs; 71% of repeat-depleters bought overage at least once — they *want* more credits, priced badly.
4. Support tickets tagged "billing surprise" cluster within 48h of a zero-balance event (78% of that tag's volume).

## Caveats

- Observational — depletion correlates with low engagement fit; the 3.8x is an upper bound on the causal effect. The [low-balance warning experiment](../../experiments/billing/low-balance-warning-2026-03-05-experiment-design.md) tests the intervention causally.
- Q4 includes seasonal enrichment spikes (holiday list-cleaning); Q3 shows the same ordering at smaller magnitude (3.1x).

## Recommendations

1. Ship the [credit usage dashboard](../../../product/PRDs/billing/credit-usage-dashboard-v1-prd.md) with the low-balance warning — done, GA 2026-03-20.
2. Offer repeat overage buyers a discounted upgrade to the next tier — became the `tier-discount-promo` feature ([metrics](../../metrics/billing/tier-discount-promo-metrics.md)).
3. Add depletion-count to the account-health signals reviewed in portfolio reviews.
