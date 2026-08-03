# EXAMPLE — Bug Investigation: Credit Double-Charge (2026-03-12)

> Synthetic worked example for the fictional product Beacon. Invented numbers throughout.

**Severity:** P1 (customer-visible balance errors, no data loss) · **Owner:** Engineer (see team roster) · **Opened:** 2026-03-12 · **Resolved:** 2026-03-14

## Symptom

Between 2026-03-08 and 2026-03-12, some orgs were charged credits twice for a single enrichment job. Detected by the nightly reconciliation job from the [serving RFC](../../../rfcs/billing/credit-usage-dashboard-rfc.md) (app `org_balances` vs warehouse sum drifted 0.4%, alert threshold 0.1%), then confirmed by two support tickets about balances "dropping too fast".

## Impact

- 214 orgs (~0.7% of paid) over-charged a total of ~312K credits.
- `credit_depletion_rate` for March inflated ~0.6 pp if read without dedupe; 9 orgs crossed the 20% warning line who should not have (relevant to the [running experiment](../../../../analytics/experiments/billing/low-balance-warning-2026-03-05-experiment-design.md) — readout applied dedupe + sensitivity pass).

## Hypotheses

| # | Hypothesis | Check | Result |
|---|-----------|-------|--------|
| H1 | Burn-service retry path emits a second `credit_burn` with a fresh `event_id` | Diff retried jobs (request log) vs burn events | **CONFIRMED** — retries after 5xx re-posted without the idempotency key |
| H2 | Snowpipe ingested duplicate rows | Count duplicate `event_id`s in `BILLING_EVENTS` | Ruled out — duplicates have *distinct* `event_id`s, so origin is upstream |
| H3 | Rollup worker double-folds on redelivery | Replay staged webhooks against scratch rollups | Ruled out — folding idempotent on `event_id` |

## Plan & Resolution

1. 2026-03-12 — reproduce in staging by forcing a 503 on the burn endpoint. Reproduced in 20 min.
2. 2026-03-13 — fix: retry path now reuses the job-scoped idempotency key; deploy behind `burn_idempotency_fix`.
3. 2026-03-13 — remediation: credit-back script for the 214 orgs (`balance_adjustment` events, `source = 'admin_tool'`); customer email to the 9 wrongly-warned orgs.
4. 2026-03-14 — analytics guidance: dedupe window documented in the [billing_events schema](../../../../analytics/schemas/billing/billing_events.md) gotchas; affected date range annotated in metric caveats ([billing-metrics.md](../../../../analytics/metrics/billing/billing-metrics.md)).

## Follow-ups

- Monitor: alert on > 3 duplicate `(org_id, workspace_id, job_id)` burn triples per hour — shipped 2026-03-16.
- Regression test added in the [engineering plan](../../../plans/billing/credit-usage-dashboard.md) test plan (idempotent folding).
- Post-incident review noted the reconciliation job caught this before any customer churned — keep the 0.1% threshold.
