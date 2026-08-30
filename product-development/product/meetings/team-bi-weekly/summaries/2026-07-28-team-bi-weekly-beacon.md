---
date: 2026-07-28
initiatives: [tier-discount-promo-v1]
areas: [billing]
---

# EXAMPLE — Meeting Notes: Team Bi-Weekly — Dashboard Follow-up, Promo Re-scope, Q3 Preview

> Synthetic worked example (fictional product Beacon), generated from the paired transcript.

**Attendees:** [PM], [Engineer], [Designer] (roster placeholders)
**Meeting Type:** Bi-weekly

## Summary

The credit-usage dashboard remains stable four months post-ship — support tickets down, no
regressions — and usability sessions show it has become a Monday-morning ritual surface.
The tier-discount promo was re-scoped: launch target moved to 2026-09-15 and the
email-nudge variant was cut, so v1 is the in-app offer surface only. Q3 planning was
previewed only; real planning happens next bi-weekly.

## Decisions Made

1. **Launch target 2026-09-15; v1 is in-app only, email-nudge variant cut** — **Why:**
   August eng capacity is committed to enrichment-latency work and the PRD hasn't started;
   in-app placement on the dashboard carries the intent (Monday ritual), and cutting email
   drops the notification-service dependency — **Who decided:** [PM], [Engineer],
   [Designer] — **Impact:** tier-discount-promo timeline + scope; revenue impact lands ~a
   month later; no launch reach to users who don't open the dashboard. Filed:
   [decision entry](../../../decisions/2026-07-28-tier-discount-promo-scope-and-target.md)

## Action Items

| Task | Owner | Due Date | Priority | Status |
|------|-------|----------|----------|--------|
| Draft tier-discount-promo PRD | @[PM] | 2026-08-15 | High | 🔴 Not Started |
| Eng plan after PRD review | @[Engineer] | 2026-08-29 | High | 🔴 Not Started |
| In-app offer placement explorations for PRD review | @[Designer] | 2026-08-15 | Medium | 🔴 Not Started |

## Key Insights

- The credit-usage dashboard is a Monday-morning ritual surface (usability sessions) —
  directly informs promo offer placement.
- Process lesson filed to [lessons-learned](../../retros/lessons-learned.md): sequence the
  PRD before analyst artifacts on promo-shaped efforts — this gate sat blocked a quarter.

## Open Questions

-

## Blockers

-

## Next Steps

**Immediate (this week):** PRD drafting starts ([PM]).
**Short-term (2 weeks):** placement explorations + PRD review, 2026-08-15.
**Follow-up meeting:** next bi-weekly — Q3 planning proper.

## Related

- Transcript: [2026-07-28-team-bi-weekly-beacon.md](../transcripts/2026-07-28-team-bi-weekly-beacon.md)
