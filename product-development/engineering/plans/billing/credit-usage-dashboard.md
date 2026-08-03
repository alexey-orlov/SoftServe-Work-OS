# EXAMPLE — Engineering Plan: Credit Usage Dashboard

> Synthetic worked example for the fictional product Beacon. Invented numbers throughout.

**Owner:** Engineer (see team roster) · **Status:** Done — shipped 2026-03-20 · **PRD:** [credit-usage-dashboard-prd.md](../../../product/PRDs/billing/credit-usage-dashboard-prd.md) · **RFC:** [credit-usage-dashboard-rfc.md](../../rfcs/billing/credit-usage-dashboard-rfc.md)

## Milestones

| # | Milestone | Scope | Exit criteria | Landed |
|---|-----------|-------|---------------|--------|
| M1 | Rollup pipeline | Billing worker consumes Stripe webhooks + burn events; `org_balances` and `org_credit_rollups_hourly` in app Postgres; 90-day backfill from `BILLING_EVENTS` | Reconciliation diff vs warehouse < 0.1% for 7 straight days | 2026-03-02 |
| M2 | Dashboard UI | Balance header, 30-day burn trend, burn by workspace / API key, projected depletion date, purchase shortcuts | p95 page load < 800 ms at 10x current billing-page traffic | 2026-03-09 |
| M3 | Low-balance warning | Banner + email at 20% remaining, behind `low_balance_warning` flag with experiment assignment hooks | A/B assignment verified (SRM check passes); email deliverability > 99% | 2026-03-05 |
| M4 | GA hardening | Rebuild-from-warehouse script, dashboards for pipeline lag, runbook | Gate passed ([verdict](../../../product/processes/launches/credit-usage-dashboard-v1-gate-2026-03-18.md)) | 2026-03-18 |

## Feature Flags

- `credit_usage_dashboard` — page visibility; ramped 5% → 25% → 100% between 2026-03-10 and 2026-03-20.
- `low_balance_warning` — experiment arm assignment 2026-03-05 → 2026-03-18, then 100% at GA per the [experiment results](../../../analytics/experiments/billing/low-balance-warning-2026-03-05-experiment-results.md).

## Test Plan

- Unit: balance folding is idempotent on duplicate `event_id` (regression for the [double-charge bug](../../bug-investigations/billing/bug-03-12-2026-credit-double-charge/investigation-plan.md)).
- Integration: replay of 30 days of production events into a scratch schema, diffed against warehouse truth.
- Load: k6 spike at 10x billing-page traffic; p95 budget 800 ms.

## Known Limitations

- Webhook outage longer than 15 minutes requires a manual rebuild (runbook step 4); balances freeze rather than drift.
- Projected depletion date is undefined for orgs with < 14 days of history — UI shows an empty state, not an estimate.
- API-key burn split is only accurate from 2026-01-01 forward; earlier events lack `api_key_id`.

## Related

- Metrics: [billing-metrics.md](../../../analytics/metrics/billing/billing-metrics.md) · Schema: [billing_events.md](../../../analytics/schemas/billing/billing_events.md)
- Feature index: `feature-index.yaml#billing.credit-usage-dashboard`
