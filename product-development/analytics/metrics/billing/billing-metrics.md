---
areas: [billing]
---

# EXAMPLE — Billing Metrics

> Synthetic worked example for the fictional product Beacon — and **the convention reference** for every metric doc in `analytics/metrics/`. A metric is not defined until it has an explicit numerator, denominator, window, owner, and a canonical query link that resolves to a real file.

## Convention (applies to all metric docs)

Every metric entry MUST carry, in this order: **Definition** (one sentence), **Numerator**, **Denominator**, **Window**, **Owner**, **Canonical query** (relative link to a file in `analytics/queries/` — `/feature-launch-gate` verifies the path resolves), **Caveats**. Dashboards and PRDs cite the metric name; only this doc defines it.

---

## monthly_logo_churn_rate

- **Definition:** Share of paid organizations active at the start of a month that no longer have an active subscription at the start of the next month.
- **Numerator:** Orgs with an active paid subscription on day 1 of month M and none on day 1 of month M+1.
- **Denominator:** Orgs with an active paid subscription on day 1 of month M.
- **Window:** Calendar month; reported monthly, 3 business days after month close.
- **Owner:** analytics
- **Canonical query:** [churn_by_segment.sql](../../queries/billing/churn_by_segment.sql)
- **Caveats:** Logo churn, not revenue churn — a Scale org and a Starter org count equally. Pauses count as churn only if still paused at M+1 start.

## credit_depletion_rate

- **Definition:** Share of paid organizations whose credit balance hits zero at any point during the month.
- **Numerator:** Paid orgs with ≥ 1 `credit_burn` event where `balance_after <= 0` in month M.
- **Denominator:** Paid orgs active on day 1 of month M.
- **Window:** Calendar month.
- **Owner:** analytics
- **Canonical query:** [churn_by_segment.sql](../../queries/billing/churn_by_segment.sql)
- **Caveats:** Dedupe `billing_events` on `event_id` first — the 2026-03-08 → 03-12 duplicate-burn window otherwise inflates this by ~0.6 pp ([schema gotchas](../../schemas/billing/billing_events.md)).

## low_balance_topup_rate

- **Definition:** Share of organizations crossing below 20% of remaining balance that purchase credits (top-up or overage) within 7 days of crossing.
- **Numerator:** Orgs with a `credit_purchase` or `overage_charge` event within 7 days after first crossing the 20% line in the period.
- **Denominator:** Orgs that first cross the 20% line in the period.
- **Window:** 7-day attribution per crossing; reported weekly by crossing week.
- **Owner:** analytics
- **Canonical query:** [churn_by_segment.sql](../../queries/billing/churn_by_segment.sql)
- **Caveats:** Primary metric of the [low-balance warning experiment](../../experiments/billing/low-balance-warning-2026-03-05-experiment-design.md); baseline 22.1% pre-warning. An org crossing twice in one month counts once, on the first crossing.

---

## Related

- Schema: [billing_events.md](../../schemas/billing/billing_events.md) · Catalog: `analytics/data-catalog.yaml`
- Consumers: [credit-usage-dashboards.md](../../dashboards/billing/credit-usage-dashboards.md), [credit-usage-dashboard-v1-prd.md](../../../product/PRDs/billing/credit-usage-dashboard-v1-prd.md)
- Sibling doc following this convention: [tier-discount-promo-metrics.md](tier-discount-promo-metrics.md)
