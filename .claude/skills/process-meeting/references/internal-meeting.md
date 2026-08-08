# Category: internal meeting

Format for internal meetings — recurring series (standup, sprint planning, team bi-weekly,
…) and event meetings (kickoffs, stakeholder reviews, workshops, `other`). `{type}` comes
from the closed enum in SKILL.md Step 1 — the emphasis sections below shape *content*,
never the folder.

## Standard format (default)

```markdown
# Meeting Notes: [Topic]

**Date:** [YYYY-MM-DD]
**Attendees:** [Names]
**Meeting Type:** [Standup / Sprint Planning / Bi-weekly / Kickoff / Stakeholder Review / Workshop / …]
**Initiatives touched:** [slug(s) from product/initiatives/, or "-"]

## Summary
[2-3 sentence overview: what was discussed, the main outcome]

## Decisions Made
1. **[Decision]** — **Why:** [rationale] — **Who decided:** [name] — **Impact:** [what this affects]

## Action Items
| Task | Owner | Due Date | Priority | Status |
|------|-------|----------|----------|--------|
| [Specific action] | @[Name] | [Date] | High | 🔴 Not Started |

## Key Insights
[Important context, constraints, or quotes — sub-head by kind when useful:
technical constraints, strategic considerations, concerns raised]

## Open Questions
- [ ] [Question] — **Owner:** @[Name] — **By:** [Date]

## Blockers
1. **[Blocker]** — blocked by: […] — impact: […] — resolution: […]

## Next Steps
**Immediate (this week):** […]  **Short-term (2 weeks):** […]
**Follow-up meeting:** [date — purpose — attendees, or "-"]
```

Skip empty sections with `-` rather than inventing content.

## Other formats

**Minimal** (`--minimal` — standups, informal check-ins): main outcome (one sentence),
action-item checkboxes with owner + date, one key quote, next step.

**Slack-friendly** (`--slack` — broadcasting outcomes):

```markdown
**Meeting Recap: [Topic]** 📝
*Main outcome:* [one sentence]
*Decisions:* • […]
*Action items:* ✅ [Task] — @Owner — Due [date]
*Open questions:* ❓ [Question] — @Owner to resolve
*Next meeting:* [date] to discuss [topic]
Full notes: [repo link]
```

Match tone to `product-development/product/processes/writing-guides/` when the audience is
named (internal vs executive).

## Per-type emphasis

| Type | Emphasize |
|---|---|
| **Standup** | Minimal format; blockers first; carry-over items from yesterday's plan |
| **Sprint planning** | Action items + ownership, estimated effort, dependencies between tasks, commitments made |
| **Team bi-weekly** | Decisions + cross-team asks; link the customer-call-synthesis section when calls were reviewed |
| **Kickoff** | Scope and goals as agreed; roles and ownership; milestones with dates; success criteria; known risks; the communication cadence agreed |
| **Stakeholder review** | Lead with the verdict — approved / approved-with-changes / revise; feedback items with who raised them; commitments made back to stakeholders; "Concerns Raised" section; note objections and political dynamics |
| **Workshop** | What was produced (link the artifacts — maps, drafts, boards); options kept alive vs discarded; parking lot; next-step owners |
| **Design review** | "Design Decisions" + alternatives considered; open design questions; link Figma/prototypes |
| **Engineering sync** | Technical decisions and tradeoffs; "Technical Debt" section; architectural implications; spikes needed |

## Smart owner suggestion

Unowned action item → check `strategy/business-context/stakeholders.md` and who has context
on similar work; suggest an owner with reasoning and flag for confirmation:
`Suggested owner: @Maria (Design) — owns the marketing-site redesign. Confirm?`

## Timeline conflict detection

After extracting action items and decisions, compare every estimate and deadline against
known dates from PRDs (`product-development/product/PRDs/{area}/*.md`), previous meeting
summaries (`product-development/product/meetings/*/summaries/*.md`), and strategy docs
(`product-development/product/strategy/*.md`). Conflicts get their own section:

```markdown
## Timeline Risks
- **TIMELINE RISK:** [Person] said "[X] will take 3 weeks" but [PRD] has beta launch in 5
  days. These dates conflict — clarify with engineering before committing.
```

No conflicts found → skip the section silently.

## Experiment design prompt

When the meeting decides "let's test both" / "A/B test it" but leaves the specifics
undefined, append after that decision:

```markdown
**Experiment Design Needed:** you agreed to test [A vs B] but didn't define the comparison
metric, sample size, success threshold, or duration. Run /experiment-metrics for the STEDII
framework, or /experiment-decision to check an A/B test is even the right approach.
```

Metric, sample size, and threshold already defined → skip.

## Sensitive content

Confidential strategy, unannounced plans, performance feedback detected → apply the
sensitive-content gate in SKILL.md (flag internal-only, or refuse when it hits the Privacy
Contract list).
