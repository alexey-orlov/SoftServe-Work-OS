# Competitive Matrix

_updated: [YYYY-MM-DD] · owner: [Name]_

Capability-level comparison against the tracked competitors — whole-product first, then one table per product area. When a task needs "do they have X / how do we compare on X", this file is the answer; no other file carries the comparison grid.

**What belongs here:** the General (whole-product) table, the per-area capability tables, and the legend that keeps cells honest.

**What does not:** the positioning narrative and win/lose patterns live in [competitive-landscape.md](competitive-landscape.md). SWOT, pricing detail, and recent moves live in `competitors/{slug}/teardown.md`. Who we track is registered in [business-info.md](../strategy/business-context/business-info.md)'s Competitive Landscape.

## Legend & rules

- ✅ full · ⚠️ partial/beta · ❌ absent. Every ⚠️/❌ cell carries a ≤6-word note.
- Columns: Us first, then competitors in business-info roster order — same names everywhere.
- Rows are capabilities buyers compare on, not your feature list verbatim.
- Dated facts (prices, launch dates) live in teardowns; cells hold status only.
- Every cell flip cites its source — an intel record or teardown line — in the change that flips it.

## General

Whole-product view — the rows every deal touches.

| | Us | [Competitor 1] | [Competitor 2] |
|---|-----|----------------|----------------|
| Target segment | [ICP shorthand] | [theirs] | [theirs] |
| Pricing shape | [e.g. free tier + 2 paid] | [theirs] | [theirs] |
| GTM motion | [self-serve / sales-led / hybrid] | [theirs] | [theirs] |
| Standout strength | [yours] | [theirs] | [theirs] |
| Standout weakness | [be honest] | [theirs] | [theirs] |

## [Product area]

One table per folder under `../PRDs/` — same area names. Add a section as each area comes under competitive scrutiny; replace this placeholder with the first real area.

| Capability | Us | [Competitor 1] | [Competitor 2] |
|-----------|-----|----------------|----------------|
| [Capability buyers ask about] | ✅ | ⚠️ [note] | ❌ [note] |
| [Capability] | ⚠️ [note] | ✅ | ✅ |

## Maintenance

- **Auto tier** — living page, edit in place, bump `_updated:` on every change; ≤120 lines. If an area outgrows the budget, copy [competitive-area-matrix-template.md](../processes/templates/competitive-area-matrix-template.md) to `competitive-matrix-{area}.md` beside this file and link it from the area's section — the prefix keeps splits discoverable by the `competitive-*.md` pattern skills read.
- **Refresh:** `/competitor-analysis` (deep analysis fills columns; monthly monitoring flips cells); `/context-update` and `/process-meeting` refresh rows when call-borne intel warrants.
- **Sources:** `competitors/{slug}/teardown.md` · [intel/](intel/) monthly records.
- **Read by:** the same roster as [competitive-landscape.md](competitive-landscape.md) — PRD, strategy, launch, review, and battlecard skills.
