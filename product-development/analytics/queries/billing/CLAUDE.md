# Queries — Billing

Reusable SQL for the billing & credits area. Snowflake is the maintained dialect.

**Read this when:** You need the canonical SQL behind a billing metric.

## Contents

### Files

- [churn_by_segment.sql](churn_by_segment.sql) — EXAMPLE (synthetic) — canonical rollup for monthly_logo_churn_rate, credit_depletion_rate, low_balance_topup_rate by month × tier × segment
- [promo_conversion_rate.sql](promo_conversion_rate.sql) — EXAMPLE (synthetic) — canonical weekly rollup for promo_conversion_rate and offer_dismissal_rate (matured 14-day cohorts)
