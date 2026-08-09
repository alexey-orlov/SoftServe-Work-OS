# Competitive Landscape

_updated: [YYYY-MM-DD] · owner: [Name]_

The whole-portfolio competitive picture: who we compete with, how the field is positioned, and the differentiation thesis we act on. When a task needs "where do we win, where do we lose, and why us" — this file is the answer; no other file carries the positioning thesis.

**What belongs here:** the tiered competitor list with one line each, the positioning map, the differentiation thesis, and the win/lose patterns with evidence.

**What does not:** who we compete with is *registered* in [business-info.md](../strategy/business-context/business-info.md)'s Competitive Landscape section (confirm tier — names change there first, this page follows in the same session). Capability-by-capability comparison lives in [competitive-matrix.md](competitive-matrix.md). Per-competitor depth lives in `competitors/{slug}/teardown.md`. Account-level loss detail lives in the account's call summaries.

## Competitors at a glance

Canonical names and tiers, in business-info order. One line per competitor — why they matter, not the full story.

### Direct

- [Competitor 1] — [one line: their angle and where you collide] → [teardown](competitors/[slug-1]/teardown.md)
- [Competitor 2] — [one line] → [teardown](competitors/[slug-2]/teardown.md)

### Indirect

- [Adjacent category or approach 1] — [one line: the job it steals from you]

### Status quo

- [What customers do today instead of buying anything — spreadsheets, in-house tooling, nothing] — [why it persists]

## Positioning map

Pick the two axes buyers actually decide on — not the two you look best on — place everyone, and name the white space.

```
              [Axis Y — high]
                    │
     [Competitor A] │  [Us]
                    │
────────────────────┼────────────────────
                    │
     [Competitor B] │  [white space —
                    │   name it]
              [Axis Y — low]
  [Axis X — low]          [Axis X — high]
```

## Differentiation thesis

The sentences the team reuses in PRDs, launches, and battlecards. Every claim evidence-linked.

- **We win when:** [buying situation / segment / job where you reliably win — evidence link]
- **We lose when:** [situation where you reliably lose — evidence link]
- **Unlike [competitor], we** [the one-liner — reused by `/launch-checklist` and `/slack-message`]

## Where we win / where we lose

Patterns, not anecdotes — add a row when ≥2 pieces of evidence agree; retire it when the pattern breaks.

| Pattern | Vs | Evidence |
|---------|----|----------|
| [Win or loss pattern — one line] | [competitor or tier] | [call summary / intel record links] |

## Maintenance

- **Auto tier** — living page, edit in place, bump `_updated:` on every change; ≤120 lines.
- **Roster canon:** [business-info.md](../strategy/business-context/business-info.md) Competitive Landscape (confirm tier). Add or remove competitors there first; this page and the root `CLAUDE.md` fundamentals line follow in the same session.
- **Refresh:** `/competitor-analysis` (deep analysis and monthly monitoring both fold through here); `/context-update` and `/process-meeting` update win/lose patterns and at-a-glance lines when call-borne intel warrants.
- **Sources:** `competitors/{slug}/teardown.md` · [intel/](intel/) monthly records · account call summaries.
- **Read by:** `/prd-draft`, `/write-prod-strategy`, `/strategy-sprint`, `/launch-checklist`, `/slack-message`, `/decision-doc`, `/expansion-strategy`, `/prototype`, `/red-team`, `/assumption-map`, and the executive reviewer in `/prd-challenge`.
