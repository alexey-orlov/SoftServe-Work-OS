# Category: batch-day

The digest layer for "process all of today's meetings." The members are NOT processed here —
each one runs the full shared pipeline under its own category (SKILL.md gates 1, 3–6): own
transcript file, own summary in the right home, own ledger line. 1:1 members are skipped
with a one-line refusal note. This file defines what comes *after* the loop.

## Per-meeting quality checks (during the loop)

1. Every decision has an owner — else flag "Decision made but no owner assigned — who drives this?"
2. Every action item has a deadline — else assign a reasonable default and flag "confirm?"
3. Duplicate action items across meetings → consolidate into one entry, note which meetings referenced it
4. Conflicting decisions across meetings → flag explicitly (see conflict taxonomy below)
5. Strategic alignment — tie major decisions to pillars/OKRs from `product-development/product/strategy/` when relevant

## The daily digest

Save to `product-development/product/meetings/digests/{YYYY-MM-DD}-daily-batch.md`
(+ nav line in `digests/CLAUDE.md`):

```markdown
# Daily Batch — {YYYY-MM-DD}

## Quick Stats
- Meetings processed: [X] ([list with links to each summary]) · Skipped: [N 1:1s refused]
- Action items generated: [Z]

## My Action Items (consolidated)
1. [ ] [Action] — from [meeting] — due [date]

## Waiting On Others
1. [Name] to [action] by [date] — from [meeting]

## Parking Lot
- [Question raised but not resolved] · [Idea for later]

## Cross-Meeting Intelligence

### Recurring topics
- **[HIGH] [Topic]** — came up in [meeting 1] and [meeting 3] — consider a dedicated session
  (HIGH = exec escalation, revenue-impacting deadline, at-risk OKR, or multi-team blocker;
  NORMAL = routine tracking; LOW = future planning, no urgency)

### Stakeholder load
| Person | Action items | Meetings involved |
|--------|-------------|-------------------|
5+ items on one person → "Can [Name] realistically deliver all of these by their deadlines?"

### Timeline conflicts
- [Name] has items due [date] from two meetings — both achievable?
- [Deliverable] has conflicting timelines across meetings

### Missing follow-ups
- From [prior date]: "[open action]" assigned to [Name] — not mentioned today. Still open?
  (check the type folders' recent summaries)

### Decisions summary
| Decision | Made in | Owner | Strategic alignment |
|----------|---------|-------|---------------------|
```

## Cross-meeting conflict taxonomy

Compare every topic/deliverable that appears in more than one meeting:

- **Timeline:** A says "2 weeks", B says "3 weeks" for the same deliverable
- **Scope:** A scoped X, B expanded to X+Y without noting the change
- **Owner:** A assigned Person X, B assigned Person Y to the same task
- **Priority:** A called it P0, B called it P1

Surface every hit as:
`WARNING — CONFLICT DETECTED: [description] — requires resolution by [suggested owner]`

## Close the batch

- Decisions across all members already went through `/decision-log-entry` in their own runs
  — the digest's Decisions summary table links them, never restates.
- Ledger check: every member transcript appended (junk members too).
- Offer: `/create-tickets` for the consolidated list, `/slack-message` for a team recap.
