# EXAMPLE — Customer Interview Insights — 2026-07-30

> Synthetic worked example (fictional product Beacon). Source transcript:
> [Acme 2026-07-30](interviews/2026-07-30-acme-example.md).
> PII rule applied: customer-side speakers by role only.

**Initiatives touched:** -

## Existing Research Context

No prior syntheses in `user-insights/` — this is the first interview in the corpus;
every theme below is labeled NEW.

## Executive Summary

- Weekly reporting is the sharpest recurring pain: Their Head of Ops rebuilds the same
  enriched-leads spreadsheet every Monday (~half a day per week).
- The export exists but forgets configuration — saved column presets plus scheduling would
  remove the entire ritual.
- June's credit depletion was discovered only when enrichment jobs failed; they want a
  proactive, threshold-based low-balance alert delivered to their messenger.
- Expansion signal: their EU ops team wants the same setup next quarter (separate
  workspace) — routed to `portfolio.yaml` expansion signals.

## Interviews Conducted

- Number: 1 · Date: 2026-07-30 · Segments: E-commerce, corp

## Top Pain Points (ranked)

1. **Manual Monday export rebuild** — 1 of 1 interviews — *"Every Monday I rebuild the
   same spreadsheet by hand; if Beacon just exported it on a schedule I'd get half a day
   back." — Their Head of Ops* — impact: ~half a day weekly plus copy-paste errors (a
   stale sheet reached their VP) — workaround: hand-built spreadsheet before the 11am
   pipeline review.
2. **Silent credit depletion** — 1 of 1 — *"We only found out we were out of credits when
   the enrichment jobs started failing." — Their Data Analyst* — impact: half-empty Monday
   report and a morning lost diagnosing — workaround: ad-hoc dashboard checks ("seeing it
   requires remembering to look").

## Top Feature Requests

1. **Scheduled CSV export with saved column presets** — priority: must-have — requested by
   Their Head of Ops and Their Data Analyst — underlying need: the Monday pipeline review
   runs on a fixed-shape report; the export should produce it unattended →
   [record](feature-requests/2026-07-30-acme-example-scheduled-csv-export.md)
2. **Configurable low-balance alert** — priority: must-have (ranked second of the two) —
   requested by both — underlying need: proactive warning at a self-set threshold,
   delivered where the team lives (their messenger), before jobs fail →
   [record](feature-requests/2026-07-30-acme-example-low-balance-alert.md)

## Theme Labels vs Prior Research

- VALIDATED: - · CHALLENGED: - · NEW: recurring-report automation; proactive credit
  governance

## Recommended Actions

1. Route both requests through triage (`/prioritize-requests`) once more accounts weigh
   in — Owner: [PM] — Due: 2026-08-14
2. Connect Acme's Head of Ops with the expansion contact for the EU workspace — Owner:
   [PM] — Due: 2026-08-08
3. Probe export-shape needs in the next two discovery interviews (are preset columns a
   pattern?) — Owner: [PM] — Due: 2026-08-21

## Interviews

### Interview — Head of Ops + Data Analyst, E-commerce corp (2026-07-30)

**Research goal:** understand how enrichment data flows into Acme's weekly operating rhythm
**Hypotheses tested:** reporting/export friction is a retention-relevant pain

**Jobs-to-be-Done:**
When my Monday pipeline review comes up, I want the enriched-leads report produced
automatically in its fixed shape, so I can start at the review instead of two hours before
it.

**Pain points:**
- **Manual Monday export rebuild** — severity: high — workaround: hand-built spreadsheet<br>
  *"Every Monday I rebuild the same spreadsheet by hand…" — Their Head of Ops*
- **Silent credit depletion** — severity: high — workaround: remembering to check the
  dashboard<br>
  *"We only found out we were out of credits when the enrichment jobs started failing." — Their Data Analyst*

**Feature requests:**
- **Scheduled CSV export with saved presets** — underlying need: unattended fixed-shape
  Monday report — priority signal: must-have
- **Configurable low-balance alert** — underlying need: threshold warning in their
  messenger before jobs fail — priority signal: must-have

**Pain Points Validated:**
- ✅ Reporting/export friction is real, recurring, and quantified (~half a day per week)

**Theme labels:** NEW: recurring-report automation · NEW: proactive credit governance

**Quotes to remember:**
*"The usage dashboard is good… but seeing it requires remembering to look." — Their Head
of Ops* → use in: alerting PRD, stakeholder update

**Surprises:** the dashboard created a Monday ritual — a placement asset (echoes the
2026-07-28 bi-weekly's placement insight); the expansion interest (EU ops) arrived
unprompted.
