# EXAMPLE — Tier Discount Promo Metrics

> Synthetic worked example for the fictional product Beacon. Follows the metric-definition convention in [billing-metrics.md](billing-metrics.md): numerator + denominator + window + owner + resolving canonical-query link, or it does not ship.

**Feature:** `feature-index.yaml#billing.tier-discount-promo` — orgs that buy overage credits two consecutive months are offered the next tier at 20% off for 3 months. Data is internal-beta only until the feature clears `/feature-launch-gate` (PRD and eng plan still pending — see the [initiative page](../../../product/initiatives/tier-discount-promo.md)).

---

## promo_conversion_rate

- **Definition:** Share of promo offers redeemed within their 14-day validity window.
- **Numerator:** Offers with a `redeemed` event ≤ 14 days after first `shown` event.
- **Denominator:** Offers with ≥ 1 `shown` event whose 14-day window has fully elapsed.
- **Window:** 14-day attribution per offer; reported weekly by first-impression week, matured cohorts only.
- **Owner:** analytics
- **Canonical query:** [promo_conversion_rate.sql](../../queries/billing/promo_conversion_rate.sql)
- **Caveats:** Offer-grained, not org-grained — an org re-offered next quarter counts again. Target at GA: ≥ 12%, against a 3.5%/month organic upgrade rate among overage buyers. Exclude design-partner orgs from GA readouts.

## offer_dismissal_rate

- **Definition:** Share of promo offers explicitly dismissed within the 14-day validity window.
- **Numerator:** Offers with a `dismissed` event ≤ 14 days after first `shown` event.
- **Denominator:** Offers with ≥ 1 `shown` event whose 14-day window has fully elapsed.
- **Window:** 14-day attribution per offer; reported weekly by first-impression week, matured cohorts only.
- **Owner:** analytics
- **Canonical query:** [promo_conversion_rate.sql](../../queries/billing/promo_conversion_rate.sql)
- **Caveats:** Guardrail — a dismissal rate above 40% at GA means the trigger (`overage_2_consecutive_months`) is firing on orgs that do not perceive the overage as a problem; pause the ramp and revisit targeting. Ignoring an offer until expiry is *not* a dismissal.

---

## Related

- Schema: [promo_offers.md](../../schemas/billing/promo_offers.md) · Catalog: `analytics/data-catalog.yaml#promo_offers`
- Origin of the promo idea: [credit-depletion churn analysis](../../investigations/billing/2026-03-10-credit-depletion-churn-analysis.md)
