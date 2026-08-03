# EXAMPLE — Chose Usage-Based Pricing

> Synthetic worked example for the fictional product Beacon (B2B data-enrichment SaaS).

**Date:** 2026-02-14
**Decided by:** [PM], [Engineer] (roster placeholders)
**Status:** Active

## Options Considered

1. **Per-seat pricing** — predictable and familiar, but seats are a poor value proxy: heavy API users run 3 seats, light UI users run 40.
2. **Usage-based credits (tiered allotments + overage)** — aligns price with enriched records; matches how the top two competitors package.
3. **Hybrid (seats + usage cap)** — hedges both, but doubles billing complexity and muddies the pitch.

## Decision

Usage-based credits: Starter $99/5K, Growth $499/30K, Scale $1,999/150K monthly, plus per-credit overage that gets cheaper at higher tiers.

## Reasoning

Value delivered tracks records enriched, not people logged in — 68% of Q4-2025 volume came via API keys with no seat attached. Win/loss notes showed per-seat quotes losing to usage-priced competitors on exactly those accounts. Credits also create a natural upgrade path (overage → next tier).

## Tradeoff Accepted

Revenue becomes less predictable, and silent credit depletion becomes a churn risk we now own — visibility work is mandatory, not optional.

## Revisit Conditions

- Monthly logo churn exceeds 4% for two consecutive months post-migration, or
- Billing-related support volume stays above 15% of tickets two quarters after the credit-usage dashboard ships.

## Related

- Tradeoff PRD: [credit-usage-dashboard-prd.md](../PRDs/billing/credit-usage-dashboard-prd.md)
- Revisit-condition metrics: [billing-metrics.md](../../analytics/metrics/billing/billing-metrics.md)
- Feature index: `feature-index.yaml#billing.credit-usage-dashboard`
