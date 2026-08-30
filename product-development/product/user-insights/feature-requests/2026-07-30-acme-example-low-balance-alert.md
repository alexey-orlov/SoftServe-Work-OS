---
account: acme-example
requested: 2026-07-30
area: billing
type: feature
priority_signal: must-have
tracker_ref: "-"
source: ../2026-07-30-interview-insights.md
_updated: 2026-08-05
---

# [Billing] Configurable low-balance credit alert

> EXAMPLE — synthetic worked example for the fictional product Beacon.

In June their enrichment jobs failed mid-run because credits silently ran out — the team
discovered it from the failures, not from Beacon. The credit-usage dashboard shows the
burn but requires remembering to look; they want a proactive warning at a self-set
threshold (~20%), delivered where the team lives (their messenger), especially around
spiky campaign weeks.

*"We only found out we were out of credits when the enrichment jobs started failing." —
Their Data Analyst*

## Draft ticket

**Objective:** proactive low-balance notification when remaining credits cross a
user-configured threshold, deliverable to an external messenger channel.

**Acceptance criteria (seed):**
- Threshold configurable per workspace (percentage and/or absolute credits).
- Fires once per crossing (no repeat spam); re-arms when the balance recovers.
- Extends the shipped credit-usage dashboard (`billing.credit-usage-dashboard`) rather
  than replacing it.

**Provenance:** [interview insights](../2026-07-30-interview-insights.md) · [transcript](../interviews/2026-07-30-acme-example.md)
