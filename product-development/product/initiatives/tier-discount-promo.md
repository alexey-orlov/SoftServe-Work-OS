# EXAMPLE — Tier Discount Promo

_status: active — analyst artifacts ready; PRD and eng plan not started; target 2026-09-15_
_updated: 2026-08-05_
_target-feature(s): `feature-index.yaml#billing.tier-discount-promo`_
_owner: [PM] (roster placeholder)_

> Synthetic worked example for the fictional product Beacon. This page deliberately shows the **blocked-gate** state: analytics is ready, product and engineering artifacts are not, so `/feature-launch-gate` returns BLOCKED. Compare with the shipped [credit-usage-dashboard-v1](credit-usage-dashboard-v1.md).

## Snapshot

- Offer: orgs that buy overage credits two consecutive months get the next tier at 20% off for 3 months.
- Why: the [depletion-churn analysis](../../analytics/investigations/billing/2026-03-10-credit-depletion-churn-analysis.md) found 71% of repeat-depleters already buy overage — they want more credits, priced badly.
- Launch target: 2026-09-15; v1 is the in-app offer surface only ([2026-07-28 decision](../decisions/2026-07-28-tier-discount-promo-scope-and-target.md)).
- Done means: GA behind the gate with `promo_conversion_rate` ≥ 12% on matured cohorts and dismissals under the 40% guardrail.

## Scope & goal

- **Goal:** convert ≥ 12% of shown offers within 14 days; lift Starter→Growth upgrades without spiking dismissals.
- **In scope:** in-app offer surface, `overage_2_consecutive_months` trigger, redemption via self-serve tier change.
- **Out of scope:** discounts on annual contracts; sales-assisted custom offers; email-nudge offer variant (cut from v1, 2026-07-28).

## Artifacts

- PRD: [PENDING: product/PRDs/billing/tier-discount-promo-prd.md] — not started, blocks the gate
- Eng plan: [PENDING: engineering/plans/billing/tier-discount-promo.md] — not started, blocks the gate
- Metrics: [tier-discount-promo-metrics.md](../../analytics/metrics/billing/tier-discount-promo-metrics.md)
- Table schema: [promo_offers.md](../../analytics/schemas/billing/promo_offers.md)
- Canonical query: [promo_conversion_rate.sql](../../analytics/queries/billing/promo_conversion_rate.sql)
- Launch checklist / gate verdict: — (gate currently **BLOCKED** on the two PENDING artifacts; no verdict filed)

## Decisions

- 2026-07-28 — [Reset Tier-Discount Promo v1 Target and Scope](../decisions/2026-07-28-tier-discount-promo-scope-and-target.md) — target 2026-09-15, in-app only; email nudge cut
- 2026-02-14 — [Chose Usage-Based Pricing](../decisions/2026-02-14-usage-based-pricing.md) — the credit/overage structure this promo monetizes

## Open loops

- Mine: draft the PRD — due 2026-08-15.
- Theirs: eng plan after PRD review — Engineer (roster placeholder), target 2026-08-29.

## Activity

- 2026-07-28 — bi-weekly reset the launch target to 2026-09-15 and cut the email-nudge variant from v1 ([summary](../meetings/team-bi-weekly/summaries/2026-07-28-team-bi-weekly-beacon.md)).
- 2026-08-03 — initiative page created; status confirmed active, gate still blocked on PRD + eng plan.
- 2026-06-15 — internal beta events flowing into `promo_offers` (design-partner orgs only).
- 2026-05-13 — original launch target slipped: `/feature-launch-gate` BLOCKED on missing PRD + eng plan.
- 2026-05-06 — analyst artifacts landed (schema, canonical query, metric definitions).
