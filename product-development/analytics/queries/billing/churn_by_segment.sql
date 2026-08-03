-- EXAMPLE — Churn, depletion, and top-up rollup by month × tier (synthetic worked example)
-- Canonical query for: monthly_logo_churn_rate, credit_depletion_rate, low_balance_topup_rate
--   Definitions: analytics/metrics/billing/billing-metrics.md
-- Owner: analytics
-- Last verified: 2026-07-28
-- Warehouse: Snowflake (ANALYTICS.PROD). This block runs as-is; Snowflake is the
-- only maintained dialect for this query.

WITH months AS (
    SELECT DATE_TRUNC('month', DATEADD(month, -seq4(), CURRENT_DATE())) AS month_start
    FROM TABLE(GENERATOR(ROWCOUNT => 12))
),
active_orgs AS (  -- orgs with an active paid subscription on day 1 of the month
    SELECT m.month_start, s.org_id, s.tier, s.segment
    FROM months m
    JOIN ANALYTICS.PROD.SUBSCRIPTIONS s
      ON s.status = 'active'
     AND s.start_date < m.month_start
     AND COALESCE(s.end_date, '9999-12-31') >= m.month_start
),
churned AS (      -- active on day 1 of M, no active subscription on day 1 of M+1
    SELECT a.month_start, a.org_id
    FROM active_orgs a
    LEFT JOIN active_orgs nxt
      ON nxt.org_id = a.org_id
     AND nxt.month_start = DATEADD(month, 1, a.month_start)
    WHERE nxt.org_id IS NULL
      AND a.month_start < DATE_TRUNC('month', CURRENT_DATE())
),
events_dedup AS ( -- billing_events with the 2026-03 duplicate-burn window deduped
    SELECT * FROM ANALYTICS.PROD.BILLING_EVENTS
    QUALIFY ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY created_at) = 1
),
depleted AS (     -- orgs whose balance hit zero at any point in the month
    SELECT DATE_TRUNC('month', created_at) AS month_start, org_id
    FROM events_dedup
    WHERE event_type = 'credit_burn' AND balance_after <= 0
    GROUP BY 1, 2
),
crossers AS (     -- first time an org crosses below 20% of its opening balance in the month
    SELECT DATE_TRUNC('month', created_at) AS month_start, org_id,
           MIN(created_at) AS crossed_at
    FROM events_dedup
    WHERE event_type = 'credit_burn'
      AND balance_after < 0.20 * (balance_after - credits_delta)  -- crossed the 20% line on this event
    GROUP BY 1, 2
),
topups AS (       -- crossers who purchased within 7 days of crossing
    SELECT c.month_start, c.org_id
    FROM crossers c
    JOIN events_dedup p
      ON p.org_id = c.org_id
     AND p.event_type IN ('credit_purchase', 'overage_charge')
     AND p.created_at BETWEEN c.crossed_at AND DATEADD(day, 7, c.crossed_at)
    GROUP BY 1, 2
)
SELECT
    a.month_start,
    a.tier,
    a.segment,
    COUNT(DISTINCT a.org_id)                                        AS active_orgs,
    COUNT(DISTINCT ch.org_id)                                       AS churned_orgs,
    ROUND(COUNT(DISTINCT ch.org_id) / COUNT(DISTINCT a.org_id), 4)  AS monthly_logo_churn_rate,
    COUNT(DISTINCT d.org_id)                                        AS depleted_orgs,
    ROUND(COUNT(DISTINCT d.org_id) / COUNT(DISTINCT a.org_id), 4)   AS credit_depletion_rate,
    COUNT(DISTINCT cr.org_id)                                       AS threshold_crossers,
    ROUND(COUNT(DISTINCT t.org_id) / NULLIF(COUNT(DISTINCT cr.org_id), 0), 4) AS low_balance_topup_rate
FROM active_orgs a
LEFT JOIN churned  ch ON ch.org_id = a.org_id AND ch.month_start = a.month_start
LEFT JOIN depleted d  ON d.org_id  = a.org_id AND d.month_start  = a.month_start
LEFT JOIN crossers cr ON cr.org_id = a.org_id AND cr.month_start = a.month_start
LEFT JOIN topups   t  ON t.org_id  = a.org_id AND t.month_start  = a.month_start
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2, 3;
