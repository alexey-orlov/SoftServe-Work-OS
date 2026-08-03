# EXAMPLE — Credit Usage Dashboards

> Synthetic worked example for the fictional product Beacon. Registry of the billing-area dashboards; URLs are placeholders in the template.

## Registry

| Dashboard | URL | Owner | Refresh | Audience |
|-----------|-----|-------|---------|----------|
| Credit Usage — Exec Weekly | https://dashboards.example.com/billing/credit-usage-exec | analytics | daily 06:00 UTC | Leadership — churn, depletion, top-up trends |
| Credit Usage — Ops Live | https://dashboards.example.com/billing/credit-usage-ops | analytics | hourly | PM + support — depletion queue, warning-email health |
| Low-Balance Experiment Readout | https://dashboards.example.com/billing/low-balance-experiment | analytics | frozen (experiment ended 2026-03-18) | Archive of the [experiment results](../../experiments/billing/low-balance-warning-2026-03-05-experiment-results.md) |

## Panels & Sources

- **Exec Weekly** — `monthly_logo_churn_rate`, `credit_depletion_rate`, `low_balance_topup_rate` by tier × segment. All three defined in [billing-metrics.md](../../metrics/billing/billing-metrics.md); backing SQL is [churn_by_segment.sql](../../queries/billing/churn_by_segment.sql).
- **Ops Live** — orgs currently under 20% balance, projected depletion dates, warning-email delivery rate. Reads `ANALYTICS.PROD.BILLING_EVENTS` ([schema](../../schemas/billing/billing_events.md)) with the `event_id` dedupe applied.
- **Experiment Readout** — arm sizes, SRM check, top-up lift with CIs. Frozen; kept for audit.

## Conventions

- Every panel's metric name must match a definition in `analytics/metrics/billing/` — no dashboard-local metric math.
- The in-product customer-facing dashboard is **not** listed here; it is a product surface (see the [PRD](../../../product/PRDs/billing/credit-usage-dashboard-prd.md)), not an analytics dashboard.
- Register new billing dashboards by appending a row to the table above and a line to this folder's CLAUDE.md.
- Swap the placeholder `dashboards.example.com` URLs for your BI tool's real links during setup; keep one row per dashboard.
- When a dashboard is retired, mark its row "frozen" with the end date rather than deleting it — readout archives get cited in decisions.

## Related

- Feature index: `feature-index.yaml#billing.credit-usage-dashboard`
- Catalog: `analytics/data-catalog.yaml#billing_events` (used-by lists this file)
