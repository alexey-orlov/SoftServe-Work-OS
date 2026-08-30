---
initiatives: [credit-usage-dashboard-v1]
features: [credit-usage-dashboard]
---

# EXAMPLE — Feature Launch Gate Verdict: Credit Usage Dashboard v1

> Synthetic worked example for the fictional product Beacon — a filled `/feature-launch-gate` output showing what a PASS looks like. Run 2026-03-18 by the PM, two days before GA. Paths are relative to `product-development/`.

## Feature Launch Gate: Credit Usage Dashboard
## Mode: Full

### PASSED (11/11)

- ✅ PRD exists and passes content checks (6 sections, no placeholder tokens, ≥ 400 words): `product/PRDs/billing/credit-usage-dashboard-v1-prd.md`
- ✅ Decision logged: `product/decisions/2026-02-14-usage-based-pricing.md`
- ✅ Feature registered in the catalog: `credit-usage-dashboard` (billing) — artifacts on the [initiative page](../initiatives/credit-usage-dashboard-v1.md)
- ✅ Figma flow / prototype / components referenced in the feature-index entry
- ✅ Metric definitions with numerator + denominator + window: `analytics/metrics/billing/billing-metrics.md`
- ✅ Each metric's "Canonical query" link resolves on disk: → `analytics/queries/billing/churn_by_segment.sql`
- ✅ SQL verified by analyst within 90 days, Snowflake block runs as-is: `analytics/queries/billing/churn_by_segment.sql`
- ✅ Table schema documented with refresh / lag / volume / partition_key / pii / grain / owner: `analytics/schemas/billing/billing_events.md`
- ✅ Table registered in `analytics/data-catalog.yaml` (`billing_events`, all required fields)
- ✅ Dashboard registry updated: `analytics/dashboards/billing/credit-usage-dashboards.md`
- ✅ Experiment keywords detected in PRD → pre-registered design exists: `analytics/experiments/billing/low-balance-warning-2026-03-05-experiment-design.md` (results file due after readout, expected 2026-03-19)

### FAILED (0/11)

- none

### NOT APPLICABLE (4)

- ➖ Pre-mortem check — no launch checklist exists for this feature (predates the checklist convention)
- ➖ Sales enablement — dashboard does not change the pitch; pricing collateral already updated with the 2026-02-14 decision
- ➖ Schema drift — no columns added to pre-existing tables this cycle
- ➖ UX research check-in — no net-new research conducted; design rationale lives in the PRD Solution section

### VERDICT: PASS

Navigation rows confirmed for every new file (folder CLAUDE.md files under `product/PRDs/billing/` and `analytics/*/billing/`). One-line confirmation posted to the team launch channel. Bug found mid-cycle (double-charge) was resolved 2026-03-14 and did not block.

## Related

- Initiative page: [credit-usage-dashboard-v1.md](../initiatives/credit-usage-dashboard-v1.md)
- Experiment results (filed post-readout as predicted): [low-balance-warning-2026-03-05-experiment-results.md](../../analytics/experiments/billing/low-balance-warning-2026-03-05-experiment-results.md)
