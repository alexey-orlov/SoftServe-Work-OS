# Category: customer-call

Format + write-backs for account calls — check-in, escalation, renewal, QBR, demo.
PII rules live in SKILL.md and apply to everything here. Worked example (level of detail):
[example-customer-call.md](example-customer-call.md).

## Pick a variant

**Quick** (default under ~10 active customers): three sections, two minutes.
**Full** (7 sections) when any of these hold:
- 10+ active customers and you're synthesizing across calls
- Cross-customer pattern detection is the payoff ("what are 5+ customers asking for that we don't ship?")
- You're producing the bi-weekly customer-call-synthesis section in `product-development/product/meetings/team-bi-weekly/`

The Full variant's Feature Requests tables are what `/prioritize-requests` reads to cluster
demand across accounts — Quick-variant summaries only surface implied gaps in Executive
Summary prose, which triage rates as weak evidence.

## Quick variant

```markdown
# {Customer} — Call Summary {YYYY-MM-DD}

**Attendees:** {Our names. Customer side: roles only}
**Call type:** {Discovery / Check-in / Escalation / Renewal / Demo}
**Initiatives touched:** {slug(s) from product/initiatives/, or "-"}

## Executive Summary

{2-3 paragraphs: status updates, what was discussed, key takeaways. Weave in 1-2 italicized
verbatim quotes (role-attributed): *"quote" — Their VP of Eng*. Note any implied product gaps.}

## Action Items

- [Action] — Owner: {Name from team roster} — Due: {YYYY-MM-DD}

## Relationship Signal

{One sentence: healthy / at risk / expanding, with evidence.}
```

## Renewal / QBR calls — add these fields (both variants)

They feed `portfolio.yaml` and the renewal-review workflow; update `portfolio.yaml#{customer}`
to match after saving:

```markdown
## Renewal / Expansion State

- **Renewal stage:** not-yet | forecast | commit | at-risk | won | lost
- **Champion status:** active | shifting | departed | unknown
- **Expansion stage (if any):** discovery | proposal | negotiation | closed
- **Last executive touch:** {YYYY-MM-DD or "needed within {days}"}
- **Renewal blockers:** {bulleted}
- **Forecast confidence:** low | medium | high (one-line reason)
```

## Full variant — 7 sections in order

### 1. Executive Summary

Detailed overview that orients the reader. **Quotes:** weave verbatim quotes into the
paragraphs as italicized inline quotes (*"We are digging it." — Their VP of Eng*) — the
exec summary is the most-read section.

- **Opening paragraph:** status updates and quick wins / progress since last meeting.
- **Second paragraph:** "This call focused on X areas: (1) …, (2) …" — orient the reader.
- **Topic sections:** bold inline header + detailed paragraph per major topic (context,
  decisions, blockers).
- **How {Customer} is Using {Feature/Workflow}:** scoped to features discussed on *this*
  call, not a full usage overview.
- **Opportunity Areas:** paragraph or numbered list, tied to their workflows.
- **Strategy / Hypothesis Validation** *(when applicable):* when the call validates or
  invalidates a product hypothesis, a dedicated section with quotes as evidence.
- **UX Findings** *(when applicable):* confusing flows, missing affordances, friction —
  designers filter on this when synthesizing across calls:

```markdown
**UX Findings**
- **[Surface / flow]:** [Specific friction observed]<br><br>*"[Quote if available]" — [Their role]*
```

- **Key Product Gaps:** bullet list. Actively identify *implied* gaps — things they work
  around, do manually, or switch tools for — not just explicit requests:

```markdown
**Key Product Gaps**
- **[Gap 1]:** [Specific description with context]
- **[Gap 2]:** [Specific description with context]
```

### 2. Insights / Learnings

Organize by topic; include enough context that someone who missed the call understands the
*why*, not just the *what*:

```markdown
### [Topic Name]

[1-2 sentence summary of what we learned in this topic area]

| Insight | Details |
|---------|---------|
| **[Insight headline]** | [Detailed description with specific examples]<br><br>*"[Verbatim quote]" — [Speaker role]* |
```

### 3. Feature Requests

Organize by area:

```markdown
### [Area Name] (e.g., "Data Export & Sharing")

[Description of this feature area and the underlying need]

**Blocker:** [If applicable — what's blocking progress and any dependencies]

| Feature | Details |
|---------|---------|
| **[Feature name]** | [Detailed description]<br><br>*"[Verbatim quote]" — [Speaker role]* |
```

### 4. Next Steps

```markdown
## Next Steps

### [Category] (e.g., "Onboarding")
- [Action item] — Owner: [Name from team roster] — Due: [YYYY-MM-DD]
```

Every action item has an owner from the team roster and a due date.

### 5. Follow-up Email

```markdown
## Follow-up Email

**To:** [Customer contact role] (first name allowed in salutation only — PII rules in SKILL.md)
**Subject:** [Meeting Topic] Recap + Action Items

Hi [first-name-or-"there"],

Thanks for the great discussion today! Here's a quick recap:

**What we covered:**
- [Key topic 1]
- [Key topic 2]

**Action items for you:**
- [ ] [Item 1]

**From our side:**
- [Item 1]

Let me know if I missed anything!

Best,
[PM name]
```

### 6. Slack Summary

Ready-to-post message for internal stakeholders. Opening: "Great [frequency] sync with
[Customer] today! Full recap here: [link]" → bold topic headers per area → detailed
paragraphs with inline customer quotes → numbered lists for fixes/action items → end with
"Issues to come for all items raised above." when applicable. Hit ALL key takeaways with
specifics; include quotes capturing enthusiasm or frustration; note when the customer is
already taking action (e.g., assigning internal owners).

### 7. Relationship Signal

```markdown
## Relationship Signal

[One sentence: healthy, at risk, or expanding? What evidence supports this?]
```

Pair with the account's `account-context.md` so one query can surface every at-risk account.

## Action-item management (top of the summary file)

Open and Completed tables live at the **top of the file**. Each call: review existing Open
items against what was discussed → ask about unclear statuses ("Was [item] completed?") →
move completed items (add date) → add new items:

```markdown
## Open Action Items

| Action Item | Owner | From Meeting |
|-------------|-------|--------------|

## Completed Action Items

| Action Item | Owner | From Meeting | Completed |
|-------------|-------|--------------|-----------|
```

## Verbatim guidelines

1. Always italicize with role attribution: *"Quote text" — Their VP of Eng*
2. In tables, put quotes on separate lines with `<br><br>` before the quote
3. Choose quotes that are specific, revealing of needs, or evidence for key insights
4. Trim to the essential part; preserve exact wording — never paraphrase inside quotes
5. Multiple quotes when they add different perspectives

## Account write-backs (this category's Step 4)

1. **New account?** Scaffold first: `accounts/{customer}/CLAUDE.md`,
   `accounts/{customer}/account-context.md`, `calls/summaries/` + `calls/transcripts/`
   (see `accounts/CLAUDE.md` for the template) → add the customer's row to
   `accounts/CLAUDE.md` → add the `portfolio.yaml` entry (status, arr if known,
   vertical + size_band + use_cases using the canonical labels in
   `strategy/business-context/segmentation-matrix.md`, renewal_date, champion_role,
   last_updated).
2. **`account-context.md`:** rewrite in place to current truth when the call moved anything
   worth carrying forward (new champion, renewal date moved, new strategic risk); bump its
   `_updated:` line.
3. **`accounts/CLAUDE.md`:** refresh the account's last-call date.
4. **`portfolio.yaml#{customer}`:** `last_call`, plus `status` / `risks` /
   `expansion_signals` when the call moved them; bump `last_updated`. Segment change
   revealed (use case adopted, size band or vertical corrected) → update `vertical` /
   `size_band` / `use_cases` too and flag `segmentation-matrix.md` cells for
   `/context-update` (Tier 2 → confirm).
5. **Feature-request records:** one dated record per request in
   `user-insights/feature-requests/` (per SKILL.md Step 3), each linked from its Feature
   Requests table row (Full variant) or noted alongside the implied gap in the Executive
   Summary (Quick).

## Quality checklist (before finalizing)

- [ ] Executive Summary: opening status paragraph + topic-focus paragraph + inline quotes
- [ ] "Key Product Gaps" identifies *implied* gaps, not just explicit requests
- [ ] Hypothesis-validation section included when the call provides evidence
- [ ] Insights by topic, Feature Requests by area — summary paragraphs + table format
- [ ] Blockers noted where applicable
- [ ] Next Steps by category; every item has owner + due date
- [ ] Follow-up email + Slack summary drafted, hitting all takeaways with specifics
- [ ] Relationship Signal: one sentence, evidence-backed
- [ ] PII pass: no customer-side personal names anywhere in the summary
- [ ] Action-item tables at file top updated (completed moved, new added)
- [ ] Renewal/QBR fields captured when the call was one, `portfolio.yaml` matched
- [ ] Account write-backs 1–5 done (incl. feature-request records created + linked)
