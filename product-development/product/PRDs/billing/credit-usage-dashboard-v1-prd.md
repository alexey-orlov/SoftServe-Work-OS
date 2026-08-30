---
initiatives: [credit-usage-dashboard-v1]
features: [credit-usage-dashboard]
---

# EXAMPLE — Credit Usage Dashboard PRD

> Synthetic worked example for the fictional product **Beacon**, a B2B data-enrichment SaaS billed in usage credits (one credit per enriched record, pooled per organization). Every number below is invented. Use this as a shape reference next to [the blank template](../../handbook/templates/prd-template.md).

**DRI:** PM (see team roster in root CLAUDE.md) · **Stage:** Impact Review · **Status:** Shipped 2026-03-20 · **Last updated:** 2026-03-18

## Hypothesis

If we give every organization a real-time view of its credit balance, burn rate, and projected depletion date, then next-month churn among orgs that hit a zero balance will fall from 9.8% toward the 2.6% all-org baseline, because depletion surprise — not price — is what pushes those orgs to cancel. We believe visibility converts "my product stopped working" moments into planned top-ups or tier upgrades.

## Problem

Beacon moved to usage-based credit pricing on 2026-02-14 ([decision](../../decisions/2026-02-14-usage-based-pricing.md)). Today an org discovers a zero balance only when enrichment calls start returning 402 errors. Support's "billing surprise" tag is the top ticket category at 18% of volume. The [credit-depletion churn analysis](../../../analytics/investigations/billing/2026-03-10-credit-depletion-churn-analysis.md) found that 41% of orgs that churned in Q4 2025 hit a zero balance in their final 60 days, and orgs depleting twice in a quarter churn at 3.8x baseline. The people who feel this are Heads of Ops on Starter and Growth tiers, several times per billing cycle.

## Strategic Fit

Usage-based pricing only works commercially if usage is legible to the buyer — this dashboard is the visibility half of the pricing decision and the core of the Q1 "make usage legible" bet (see `product/strategy/current-quarter.md`). It also produces the burn rollups the upcoming `tier-discount-promo` feature needs. Alternatives considered: email digests only (no persistent surface; ignored after week one in past tests), CSV export (serves analysts, not the Head of Ops who owns the renewal), and waiting for auto-top-up (months out, and it treats the symptom rather than the visibility gap).

## Solution

A dashboard under Settings → Billing showing current balance, a 30-day burn trend, burn split by workspace and by API key, a projected depletion date, and purchase shortcuts. A low-balance warning — in-app banner plus email at 20% of balance remaining — shipped behind a flag and was validated in an A/B experiment against a no-warning control before GA ([design](../../../analytics/experiments/billing/low-balance-warning-2026-03-05-experiment-design.md) · [results](../../../analytics/experiments/billing/low-balance-warning-2026-03-05-experiment-results.md)). The page reads hourly pre-aggregated rollups — the app never queries the warehouse directly. The shipped dashboard is registered in the [dashboard registry](../../../analytics/dashboards/billing/credit-usage-dashboards.md). Edge cases: mid-cycle tier changes reset the projection, refunds render as negative burn, and orgs younger than 14 days see "not enough history yet" instead of a projection.

## Success Metrics

Numerators, denominators, windows, and canonical SQL live in [billing-metrics.md](../../../analytics/metrics/billing/billing-metrics.md).

- **Primary:** `credit_depletion_rate` — baseline 11.4% of paid orgs per month; target ≤ 8.0% within one quarter of GA.
- **Secondary:** `low_balance_topup_rate` — baseline 22.1%; target ≥ 27% (validated by the experiment above).
- **Guardrails:** `monthly_logo_churn_rate` flat or better; billing-surprise tickets down 25%; billing page p95 under 800 ms.
- **Kill criteria:** roll back the feature flag if dashboard error rate exceeds 0.5% or p95 stays above 800 ms for 48 hours.

## Non-Goals

- **Auto-top-up purchases** — Q2 candidate; requires payment-retry hardening first.
- **Per-seat spend attribution** — credits are pooled per org in v1; seat-level slicing waits for a demand signal.
- **Forecasts beyond 30 days** — projection quality degrades sharply; revisit after two months of GA data.
