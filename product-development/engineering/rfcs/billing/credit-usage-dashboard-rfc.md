# EXAMPLE — RFC: Credit Usage Dashboard Serving Architecture

> Synthetic worked example for the fictional product Beacon. Invented numbers throughout.

**Status:** Accepted 2026-02-24 · **Author:** Engineer (see team roster) · **Reviewers:** PM, Analyst

## Context

The [credit usage dashboard](../../../product/PRDs/billing/credit-usage-dashboard-prd.md) must show near-real-time balance, burn by workspace/API key, and a projected depletion date for ~80K organizations. The analytical source of truth is `ANALYTICS.PROD.BILLING_EVENTS` ([schema](../../../analytics/schemas/billing/billing_events.md)), a streaming Snowpipe table with up to 5 minutes of ingest lag. Serving a customer-facing page from the warehouse directly would put untrusted, spiky read load on Snowflake and couple page latency to warehouse health.

## Options Considered

1. **Query the warehouse on page load** — simplest; rejected: p95 measured at 2.1–6.4 s in a spike test, cost scales with traffic, and a warehouse incident becomes a customer-facing outage.
2. **Hourly rollups materialized into app Postgres** (chosen) — a worker folds burn/purchase events into `org_credit_rollups_hourly` plus a live `org_balances` row per org, both in the existing app database. Page reads are single-digit-ms lookups.
3. **Embedded BI vendor widget** — fastest to demo; rejected: per-viewer pricing, no control over the projection logic, and it still needs option 2's rollups for the low-balance warning emails.

## Decision

Option 2. The billing worker consumes the same Stripe webhooks and burn-service events that feed Snowpipe, maintains `org_balances` transactionally, and folds hourly rollups with a 90-day retention window. The warehouse remains the source of analytical truth; the app store is a disposable read model that can be rebuilt from `BILLING_EVENTS` at any time (rebuild script ships with the feature).

## Consequences

- Dashboard freshness is bounded by webhook delivery (seconds), not Snowpipe lag (minutes); the projection recomputes hourly.
- Dual-write divergence is possible. Mitigation: a nightly reconciliation job diffs `org_balances` against a warehouse sum and alerts at >0.1% drift — this check is what caught the [credit double-charge bug](../../bug-investigations/billing/bug-03-12-2026-credit-double-charge/investigation-plan.md).
- Burn attribution by API key requires the burn service to stamp `api_key_id` on every event; backfilled from request logs for January–February 2026 only.
- Known limitation: orgs with more than 200 workspaces paginate the burn-split panel; the rollup itself is unaffected.

## Related

- Engineering plan: [credit-usage-dashboard.md](../../plans/billing/credit-usage-dashboard.md)
- Metric definitions: [billing-metrics.md](../../../analytics/metrics/billing/billing-metrics.md)
- Feature index: `feature-index.yaml#billing.credit-usage-dashboard`
