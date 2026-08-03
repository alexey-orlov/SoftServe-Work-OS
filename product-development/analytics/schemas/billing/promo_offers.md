# EXAMPLE — Schema: promo_offers

> Synthetic worked example for the fictional product Beacon. Invented columns and volumes.

| Field | Value |
|-------|-------|
| **Table** | `ANALYTICS.PROD.PROMO_OFFERS` |
| **Owner** | data-engineering |
| **Refresh** | streaming (Snowpipe) |
| **Lag** | < 10 min p95 (Snowpipe ingest) |
| **Volume** | ~2K/day from internal beta (since 2026-06-15); ~50K/day projected at GA. No backfill |
| **Partition_key** | `offer_shown_at` |
| **PII** | false — org-level surrogate keys only |
| **Grain** | one row per promo offer event |
| **Upstream** | Billing service → Snowpipe |
| **Last validated** | 2026-07-28 |

## Columns

| Column | Type | Notes |
|--------|------|-------|
| `event_id` | STRING | Unique per event |
| `offer_id` | STRING | Stable across the shown → redeemed/expired/dismissed lifecycle |
| `org_id` | STRING | FK to `organizations` |
| `event_type` | STRING | `shown` · `redeemed` · `dismissed` · `expired` |
| `from_tier` | STRING | Org tier when offered: `starter` · `growth` |
| `to_tier` | STRING | Offered upgrade target: `growth` · `scale` |
| `discount_pct` | NUMBER | 20 for the v1 promo (20% off for 3 months) |
| `trigger_reason` | STRING | `overage_2_consecutive_months` (only trigger in v1) |
| `offer_shown_at` | TIMESTAMP_NTZ | First-impression time; repeated on every lifecycle row for partitioning |
| `event_at` | TIMESTAMP_NTZ | Time of this lifecycle event (UTC) |

## Gotchas

- Offers expire 14 days after `offer_shown_at`; a `redeemed` after `expired` is impossible by contract — treat any such pair as a pipeline bug.
- One org can hold at most one live offer; historical orgs may have several `offer_id`s over time.
- Beta data (before GA) covers internal and design-partner orgs only — do not blend it into GA readouts.

## Used By

- Query: [promo_conversion_rate.sql](../../queries/billing/promo_conversion_rate.sql)
- Metrics: [tier-discount-promo-metrics.md](../../metrics/billing/tier-discount-promo-metrics.md)
- Catalog entry: `analytics/data-catalog.yaml#promo_offers`
