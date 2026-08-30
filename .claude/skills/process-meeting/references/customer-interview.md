# Category: customer-interview

Per-interview processing for discovery/research conversations — 1 to 3 interviews from a
single session. PII rules live in SKILL.md and apply here.

**Scope boundary:** this category extracts quotes, themes, and insight cards from
*individual* conversations, same-day. Synthesizing **4+ interviews** into a unified research
report — cross-interview patterns, personas, Mom Test validation, affinity mapping — is
`/user-research-synthesis`. After processing 3+ interviews, offer the handoff: "You now have
[N] processed interviews. Run /user-research-synthesis to find cross-interview patterns?"

## Step 0 — Connect to existing research (before processing)

Search `product-development/product/user-insights/` for previous syntheses;
note validated themes and which PRDs or initiatives these interviews relate to. Then label
every theme that emerges:

- Matches a previous finding → "This **VALIDATES** theme X from [file]. Now supported by [N total] interviews."
- Contradicts one → "This **CHALLENGES** theme X from [file]. Previous research said [Y]; this interview suggests [Z]. Needs further investigation."
- Entirely new → "**NEW theme**, first surfaced in this batch. Recommend probing in future interviews."

Show the user a short "Existing Research Context" block (prior syntheses found, validated
themes, related PRDs) before the cards.

## Per-interview insight card

One card per interview:

```markdown
## Interview — {role, segment} ({date})

**Research goal:** {what we were trying to learn}
**Hypotheses tested:** {list or "-"}

**Jobs-to-be-Done:**
When [situation], I want to [motivation], so I can [outcome].

**Pain points:** (severity + current workaround for each)
- **[Pain point]** — severity: {high/med/low} — workaround: {what they do today}<br>
  *"[Verbatim quote]" — [Their role]*

**Feature requests:** (underlying need, not just the ask)
- **[Request]** — underlying need: {…} — priority signal: {must-have / nice-to-have}

**Pain Points Validated:**
- ✅ [Hypothesis confirmed]
- ❌ [Hypothesis disproved]
- ❓ [Hypothesis still unclear]

**Theme labels:** {VALIDATED: …} {CHALLENGES: …} {NEW: …}

**Quotes to remember:**
*"[Powerful verbatim quote]" — [Their role]* → use in: {PRD / presentation / stakeholder update}

**Surprises:** {what was unexpected; assumptions challenged}
```

## Session report

Cards roll up into one report at
`product-development/product/user-insights/{date}-interview-insights.md`:

```markdown
# Customer Interview Insights — {date}

(links live in the report's frontmatter: `date:`, `customers:`, `initiatives:`, optional `areas:`/`features:`)

## Executive Summary
[3-4 bullets: biggest insights]

## Interviews Conducted
- Number: [X] · Date range: [start]–[end] · Segments: [list]

## Top Pain Points (ranked)
1. **[Pain point]** — [X] of [N] interviews — *"[quote]" — [role]* — impact: […] — workaround: […]

## Top Feature Requests
1. **[Feature]** — priority: [high/med/low] — requested by [X] — underlying need: […]

## Theme Labels vs Prior Research
- VALIDATED: […] · CHALLENGED: […] · NEW: […]

## Recommended Actions
1. [Action] — Owner: [name] — Due: [YYYY-MM-DD]

## Interviews
[One insight card per interview, as above]
```

## Save + write-backs (this category's Step 4)

- **Report** → `user-insights/{date}-interview-insights.md` (+ nav line in
  that folder's CLAUDE.md). The report is the summary layer for the transcripts below.
- **Transcripts** → `user-insights/transcripts/{date}-{account}-interview.md` with tag frontmatter, one file
  per interview (+ nav line in that folder's CLAUDE.md).
- **Account mapping + cross-link** — every interview is also logged on the customer it
  belongs to: resolve each participant against the account list
  (`customers/accounts/` folders + `portfolio.yaml`, matching on company). Existing
  account → add a dated History line to its `account-context.md` linking the transcript
  and the report (`- {date} — {kind} interview → [transcript](…) · [interview insights](…)`).
  No matching account but a real customer/prospect → confirm with the user, then scaffold
  the account per [customer-call.md](customer-call.md) write-back 1 and add the History
  line (headless runs: file the account question as an open item in the run summary
  instead of guessing). A participant that genuinely maps to no account (anonymous
  panel) → ask the user where to file before writing.
- **Feature requests** from the insight cards → one dated record each in
  `user-insights/feature-requests/` (per SKILL.md Step 3); the session report's Top
  Feature Requests entries link their records.
- **Ledger** every transcript filed.
- Insights that clearly feed an active PRD → one line in that PRD's open questions
  (gated → confirm), per SKILL.md Step 3.

## Quality check

- [ ] Existing research cross-referenced; every theme labeled VALIDATED / CHALLENGED / NEW
- [ ] Every quote is verbatim from a transcript — never paraphrased or invented
- [ ] Pain points show count + severity + workaround
- [ ] At least 3 recommended actions with owners and dates
- [ ] Insights linked to relevant active PRDs
- [ ] At least 1 surprise or challenged assumption captured
- [ ] 3+ interviews → `/user-research-synthesis` handoff offered
