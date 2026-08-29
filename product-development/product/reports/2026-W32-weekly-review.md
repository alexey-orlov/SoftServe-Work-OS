---
week: 2026-W32
week_start: 2026-08-03
week_end: 2026-08-09
quarter: "-"
---

# EXAMPLE — Weekly Review — Week of Aug 3–9, 2026

> Digest over synthetic EXAMPLE data (fictional product Beacon) — produced by
> `/weekly-review --digest` as the end-to-end demo of the weekly workflow.
> Headless run: **not posted — repo record only** (no team-messenger MCP connected).

## 📋 Team Digest

### Initiatives

- **[tier-discount-promo](../initiatives/tier-discount-promo.md)** (active) — launch
  target reset to **2026-09-15** and the email-nudge variant cut from v1
  ([decision](../decisions/2026-07-28-tier-discount-promo-scope-and-target.md), made at
  the 2026-07-28 bi-weekly, folded into the repo this week). Gate still blocked on PRD +
  eng plan.

### Also this week (no initiative)

- **Decisions:** Reset Tier-Discount Promo v1 Target and Scope — carried above; no other
  entries this week.
- **Customer calls:** Acme (discovery interview, 2026-07-30): Monday reporting ritual is
  rebuilt by hand weekly — *"if Beacon just exported it on a schedule I'd get half a day
  back." — Their Head of Ops*; June credit depletion was discovered only from job
  failures. Expansion signal: EU ops team wants a regional workspace next quarter.
  ([interview insights](../user-research/2026-07-30-interview-insights.md))
- **Feature requests:** Scheduled CSV export with saved presets — acme-example
  (data-export) — pending push
  ([record](../customers/feature-requests/2026-07-30-acme-example-scheduled-csv-export.md))
- **Feature requests:** Configurable low-balance credit alert — acme-example (billing) —
  pending push
  ([record](../customers/feature-requests/2026-07-30-acme-example-low-balance-alert.md))
- ⏳ 2 request(s) awaiting tracker push — `/create-tickets push` (no tracker MCP connected
  yet)
- **Analytics:** -
- **Competitive:** -
- **Retros / lessons:** 1 lesson filed — sequence the PRD before analyst artifacts on
  promo-shaped efforts ([lessons-learned](../meetings/retros/lessons-learned.md))

### Next week

- Draft tier-discount-promo PRD — [PM] — due 2026-08-15 — tier-discount-promo
- In-app offer placement explorations — [Designer] — due 2026-08-15 — tier-discount-promo
- **Quarter checkpoint:** `current-quarter.md` is still the unfilled template — no
  objective to check movement against.

### ⚡ Top 3 Things to Know

1. Tier-discount promo slipped to **Sept 15** and narrowed to in-app only — the PRD is now
   the critical path (due Aug 15).
2. Acme's strongest demand signal yet: automated fixed-shape exports (must-have, ~half a
   day/week of manual work today) — plus a low-balance alert ask tied to the shipped
   dashboard.
3. Two customer feature requests are queued for the tracker — connect a tracker MCP
   (Linear/Jira/Asana) and run `/create-tickets push` to file them.

### 📊 Repo Health

- Files added this week: 229 (includes the process-meeting refactor + workflow-wiring
  machinery) · Contributors: 1 of [team size]
- Stale files: no `/wiki-lint` report yet — run `/wiki-lint`
- Fold backlog: 0 — inbox empty, nothing waiting
