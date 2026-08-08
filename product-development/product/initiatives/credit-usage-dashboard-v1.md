# EXAMPLE — Credit Usage Dashboard v1

_status: shipped 2026-03-20 — v1 live for all tiers_
_updated: 2026-03-20_
_target-feature(s): `feature-index.yaml#billing.credit-usage-dashboard`_
_owner: [PM] (roster placeholder)_

> Synthetic worked example for the fictional product Beacon. This page shows what a **closed, shipped** initiative looks like with a complete artifact trail — the companion [tier-discount-promo](tier-discount-promo.md) page shows the blocked-gate state.

## Snapshot

- In-app dashboard: credit balance, burn by workspace/API key, projected depletion date, low-balance warning at 20%.
- Why: the 2026-02-14 usage-pricing decision made silent depletion our #1 controllable churn driver (3.8x multiplier).
- Done meant: GA for all tiers with the warning validated by experiment, and `credit_depletion_rate` trending toward ≤ 8.0%.

## Scope & goal

- **Goal:** cut `credit_depletion_rate` from 11.4% to ≤ 8.0% of paid orgs/month within a quarter of GA; hold churn guardrails.
- **In scope:** dashboard page, hourly rollup pipeline, low-balance banner + email, purchase shortcuts.
- **Out of scope:** auto-top-up, per-seat attribution, >30-day forecasts (PRD non-goals).

## Artifacts

- PRD: [credit-usage-dashboard-prd.md](../PRDs/billing/credit-usage-dashboard-prd.md)
- Eng RFC: [credit-usage-dashboard-rfc.md](../../engineering/rfcs/billing/credit-usage-dashboard-rfc.md)
- Eng plan: [credit-usage-dashboard.md](../../engineering/plans/billing/credit-usage-dashboard.md)
- Metrics: [billing-metrics.md](../../analytics/metrics/billing/billing-metrics.md)
- Experiments: [design](../../analytics/experiments/billing/low-balance-warning-2026-03-05-experiment-design.md) · [results](../../analytics/experiments/billing/low-balance-warning-2026-03-05-experiment-results.md)
- Investigation: [2026-03-10-credit-depletion-churn-analysis.md](../../analytics/investigations/billing/2026-03-10-credit-depletion-churn-analysis.md)
- Launch checklist / gate verdict: [credit-usage-dashboard-v1-gate-2026-03-18.md](../launches/credit-usage-dashboard-v1-gate-2026-03-18.md) — **PASS**

## Decisions

- 2026-02-14 — [Chose Usage-Based Pricing](../decisions/2026-02-14-usage-based-pricing.md)

## Open loops

- Mine: one-quarter post-GA read of `credit_depletion_rate` vs the ≤ 8.0% target — due 2026-06-20.
- Theirs: auto-top-up scoping (deferred non-goal) — Engineer, Q2 planning.

## Activity

- 2026-03-20 — GA for all tiers; page closed as shipped.
- 2026-03-19 — experiment readout: +5.5 pp top-up lift, SHIP.
- 2026-03-18 — launch gate run: PASS.
- 2026-03-14 — double-charge bug resolved ([investigation](../../engineering/bug-investigations/billing/bug-03-12-2026-credit-double-charge/investigation-plan.md)); credits restored.
- 2026-03-10 — depletion-churn analysis quantified the 3.8x multiplier.
- 2026-03-05 — low-balance warning A/B started on beta cohort.
- 2026-02-24 — serving RFC accepted (hourly rollups over live warehouse reads).
- 2026-02-14 — usage-based pricing decision created the mandate.
