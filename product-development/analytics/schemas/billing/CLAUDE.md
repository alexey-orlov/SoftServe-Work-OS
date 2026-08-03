# Schemas — Billing

Column-level schema docs for billing & credits warehouse tables. Registry-level facts live in `../../data-catalog.yaml`.

**Read this when:** You need columns, event types, or gotchas for a billing table.

## Contents

### Files

- [billing_events.md](billing_events.md) — EXAMPLE (synthetic) — Stripe-fed streaming event log; grain: one row per billing event; carries the `event_id` dedupe gotcha
- [promo_offers.md](promo_offers.md) — EXAMPLE (synthetic) — tier-discount-promo offer lifecycle events; internal-beta data only, no backfill
