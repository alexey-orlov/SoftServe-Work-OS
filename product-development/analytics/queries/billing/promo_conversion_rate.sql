-- EXAMPLE — Tier-discount promo conversion and dismissal by week (synthetic worked example)
-- Canonical query for: promo_conversion_rate, offer_dismissal_rate
--   Definitions: analytics/metrics/billing/tier-discount-promo-metrics.md
-- Owner: analytics
-- Last verified: 2026-07-28
-- Warehouse: Snowflake (ANALYTICS.PROD). This block runs as-is; Snowflake is the
-- only maintained dialect for this query.
-- Data note: PROMO_OFFERS carries internal-beta events only until the feature
-- clears /feature-launch-gate — filter design-partner orgs out of GA readouts.

WITH shown AS (   -- first impression per offer
    SELECT offer_id, org_id, from_tier, to_tier,
           MIN(event_at) AS first_shown_at
    FROM ANALYTICS.PROD.PROMO_OFFERS
    WHERE event_type = 'shown'
    GROUP BY 1, 2, 3, 4
),
redeemed AS (     -- redemption within the 14-day offer window
    SELECT s.offer_id
    FROM shown s
    JOIN ANALYTICS.PROD.PROMO_OFFERS r
      ON r.offer_id = s.offer_id
     AND r.event_type = 'redeemed'
     AND r.event_at <= DATEADD(day, 14, s.first_shown_at)
    GROUP BY 1
),
dismissed AS (    -- explicit dismissal within the same window
    SELECT s.offer_id
    FROM shown s
    JOIN ANALYTICS.PROD.PROMO_OFFERS d
      ON d.offer_id = s.offer_id
     AND d.event_type = 'dismissed'
     AND d.event_at <= DATEADD(day, 14, s.first_shown_at)
    GROUP BY 1
)
SELECT
    DATE_TRUNC('week', s.first_shown_at)                          AS week_start,
    s.from_tier,
    s.to_tier,
    COUNT(DISTINCT s.offer_id)                                    AS offers_shown,
    COUNT(DISTINCT r.offer_id)                                    AS offers_redeemed,
    ROUND(COUNT(DISTINCT r.offer_id) / NULLIF(COUNT(DISTINCT s.offer_id), 0), 4) AS promo_conversion_rate,
    COUNT(DISTINCT d.offer_id)                                    AS offers_dismissed,
    ROUND(COUNT(DISTINCT d.offer_id) / NULLIF(COUNT(DISTINCT s.offer_id), 0), 4) AS offer_dismissal_rate
FROM shown s
LEFT JOIN redeemed  r ON r.offer_id = s.offer_id
LEFT JOIN dismissed d ON d.offer_id = s.offer_id
WHERE s.first_shown_at < DATEADD(day, -14, CURRENT_TIMESTAMP())  -- only fully-matured cohorts
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2, 3;
