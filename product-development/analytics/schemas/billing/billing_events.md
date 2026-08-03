# EXAMPLE — Schema: billing_events

> Synthetic worked example for the fictional product Beacon. Invented columns and volumes.

| Field | Value |
|-------|-------|
| **Table** | `ANALYTICS.PROD.BILLING_EVENTS` |
| **Owner** | data-engineering |
| **Refresh** | streaming (Snowpipe) |
| **Lag** | < 5 min p95 (Snowpipe ingest) |
| **Volume** | ~30M rows total, ~800K/day |
| **Partition_key** | `created_at` (clustered) |
| **PII** | false — org-level surrogate keys only, no cardholder or contact data |
| **Grain** | one row per billing event |
| **Upstream** | Stripe → Snowpipe (webhook relay) |
| **Last validated** | 2026-07-28 |

## Columns

| Column | Type | Notes |
|--------|------|-------|
| `event_id` | STRING | Unique per event; **dedupe on this** (see gotchas) |
| `org_id` | STRING | FK to `organizations` |
| `event_type` | STRING | `credit_purchase` · `credit_burn` · `overage_charge` · `refund` · `subscription_created` · `subscription_updated` · `subscription_cancelled` · `balance_adjustment` |
| `credits_delta` | NUMBER | Signed credit change; negative for burn |
| `amount_usd` | NUMBER(12,2) | Cash component; 0 for pure burn events |
| `balance_after` | NUMBER | Org credit balance after this event applied |
| `workspace_id` | STRING | NULL for org-level events (purchases, refunds) |
| `api_key_id` | STRING | Stamped on burn events; NULL before 2026-01-01 |
| `tier` | STRING | Org tier at event time: `starter` · `growth` · `scale` |
| `source` | STRING | `stripe` · `burn_service` · `admin_tool` |
| `created_at` | TIMESTAMP_NTZ | Event time (UTC), partition/cluster key |

## Gotchas

- Duplicate `credit_burn` rows exist for 2026-03-08 → 2026-03-12 (retry path lacked an idempotency key — [bug investigation](../../../engineering/bug-investigations/billing/bug-03-12-2026-credit-double-charge/investigation-plan.md)). Always `QUALIFY ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY created_at) = 1`.
- `balance_after` is authoritative only within a single org's event ordering; never sum it across orgs.
- Refunds carry positive `credits_delta` and negative `amount_usd`.

## Used By

- Query: [churn_by_segment.sql](../../queries/billing/churn_by_segment.sql)
- Metrics: [billing-metrics.md](../../metrics/billing/billing-metrics.md)
- Dashboard registry: [credit-usage-dashboards.md](../../dashboards/billing/credit-usage-dashboards.md)
- Catalog entry: `analytics/data-catalog.yaml#billing_events`
