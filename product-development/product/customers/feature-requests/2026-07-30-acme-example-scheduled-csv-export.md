---
account: acme-example
requested: 2026-07-30
area: data-export
type: feature
priority_signal: must-have
tracker_ref: "-"
source: ../../user-research/2026-07-30-interview-insights.md
_updated: 2026-08-05
---

# [Data Export] Scheduled CSV export with saved column presets

> EXAMPLE — synthetic worked example for the fictional product Beacon.

Their Monday pipeline review runs on a fixed-shape enriched-leads report (segment,
enrichment coverage, source, owner) that their Head of Ops rebuilds by hand every week —
about half a day weekly, with copy-paste errors that have reached their VP. The export
exists today but forgets column configuration between runs.

*"Every Monday I rebuild the same spreadsheet by hand; if Beacon just exported it on a
schedule I'd get half a day back." — Their Head of Ops*

## Draft ticket

**Objective:** let a user save an export configuration (columns, grouping, filters) as a
named preset and schedule it to run on a recurring cadence (e.g. Mondays 08:00), producing
the CSV without manual steps.

**Acceptance criteria (seed):**
- Presets persist per workspace; re-export uses the saved shape with zero re-configuration.
- Schedule supports a weekly cadence with day/time; delivery at minimum via download link.
- A scheduled run's output is identical to the same preset run manually.

**Provenance:** [interview insights](../../user-research/2026-07-30-interview-insights.md) · [transcript](../accounts/acme-example/calls/transcripts/2026-07-30.md)
