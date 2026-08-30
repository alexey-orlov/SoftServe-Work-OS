---
name: process-meeting
description: Process any meeting record into the wiki — customer calls, user interviews, internal meetings (recurring series like standup / sprint-planning / team-bi-weekly, plus kickoffs, stakeholder reviews, workshops), retros, or a whole day's batch — from a transcript, notes, or dictation. Files customer-facing raw transcripts to the central tagged archive (user-insights/transcripts/{date}-{account}-{type}.md — frontmatter tags for customers/areas/features/initiatives proposed from content; internal-meeting and retro transcripts stay under meetings/), writes the summary to the right home (accounts/{c}/calls/summaries/, meetings/{type}/, or user-insights/ — cross-linked from each participant's account), routes decisions to /decision-log-entry and lessons to lessons-learned.md, updates account-context.md and portfolio.yaml, declares initiative joins, appends the ledger. PII-safe — customer-side speakers by role only; refuses 1:1s per the privacy contract. Use on /process-meeting, "process this transcript/call", "summarize my sprint planning", "here are today's meetings", "process these 3 interviews". NOT for creating agendas (/meeting-agenda), rating meeting effectiveness (/meeting-feedback), synthesizing 4+ interviews (/user-research-synthesis), folding non-meeting artifacts (/context-update), or weekly/exec rollups (/weekly-review, /portfolio-pulse).
argument-hint: "[transcript path or paste]"
group: communication-ops
---

# process-meeting — one entry point for every meeting record

Any meeting artifact — customer call, user interview, internal meeting, retro, or a whole
day's batch — comes through here. The skill detects the category, loads exactly **one**
reference file for the output format, and runs the same pipeline every time: transcript
filed, summary written, records routed, navigation and ledger updated, run summary printed.

> `{curly-braces}` = placeholder — `{customer}` → the account slug (`acme-corp`), `{date}` → `YYYY-MM-DD`.

## Quick Start

```
/process-meeting                      → asks what you have
/process-meeting [paste transcript]   → detects category, processes immediately
/process-meeting [file path(s)]       → processes the file(s)
"process today's meetings" [+ pastes] → batch mode
```

**Accepted inputs:** transcripts (Zoom, Otter, Grain, Granola, Fireflies, Meet, Teams),
bullet notes, voice-memo dictation, Slack threads, email chains, or "let me tell you what
happened." With a meeting-transcription MCP connected (see `/connect-mcps`), pull the
transcript directly. Files dropped by an integration land in `product-development/inbox/`
(arrival contract in its CLAUDE.md) — `/context-update` sweeps hand them here.
`product-development/toolchain.yaml → meeting-transcripts:` records the team's route:
`approach: files` means paste/inbox IS the chosen way — don't suggest connecting an MCP.

**Nothing written down at all?** Ask 5 questions and generate from the answers:
1. Who was in the meeting? (customer side: roles only)
2. What's the one thing to remember from it?
3. Overall mood — happy, frustrated, neutral?
4. Any specific asks or commitments made?
5. Any competitors or deadlines mentioned?

**Long transcripts:** up to ~60 min, one pass; 90+ min, chunk by agenda item or ask which
segment matters most. A paste over ~30KB → save the transcript file via chunked appends.

## Step 1 — Detect the category (ordered gates; first match wins)

| # | Gate | Category → format |
|---|------|-------------------|
| 1 | 1:1 content — manager/report pairing, performance, career, comp, coaching | **REFUSE to file** — see Privacy gates below |
| 2 | Multiple meetings in one input / "process today's meetings" | **batch-day** → [references/batch-day.md](references/batch-day.md) |
| 3 | Customer-side participant + discovery intent (recruited participant, interview-guide questions, learning not account-managing) | **customer-interview** → [references/customer-interview.md](references/customer-interview.md) |
| 4 | Customer-side participant + account thread (check-in, escalation, renewal, QBR, demo) | **customer-call** → [references/customer-call.md](references/customer-call.md) |
| 5 | Retro ceremony — went-well / didn't-go-well, sprint retro | **retro** → [references/retro.md](references/retro.md) |
| 6 | Internal meeting | **internal** → [references/internal-meeting.md](references/internal-meeting.md), `{type}` from the enum below |

**The `{type}` enum is closed** (canonical list and the add-a-series procedure live in
`product-development/product/meetings/CLAUDE.md`), two kinds:

- **Recurring series** — the meeting belongs to a cadence this team runs: `standup` |
  `sprint-planning` | `team-bi-weekly` in the template. These are example folders — teams
  rename them to their real cadences, so match against the series folders that exist on
  disk. A meeting that belongs to an existing series always files with its series — a
  sprint review inside the sprint cadence goes to `sprint-planning`, not
  `stakeholder-review`.
- **Event meetings** — routed by *function*, never by calendar title: `kickoff` (something
  is starting — an initiative, project, phase, engagement) · `stakeholder-review` (work
  presented for feedback, approval, or sign-off — steering, gate review, demo-and-feedback,
  exec review) · `workshop` (the group produced something together — discovery,
  requirements, mapping, design sessions) · `other` (nothing fits — all-hands, vendor
  calls, trainings, one-off cross-team syncs).

**Never invent a new folder from a meeting title.** Nothing matches → file under `other`
and say so in the run summary. The same meeting landing in `other` twice is the signal to
propose its series folder via the documented procedure (the user confirms first).

**Gate 3 vs 4 tiebreak:** interview = we're learning from them (discovery goal, no account
thread); call = we're running the account (status, asks, renewal). When one call does both,
use customer-call and give the discovery findings their own summary section.

## Step 2 — Shared pipeline (identical for every category)

0. **Orient + gates.** Read the target account page / prior summaries / `stakeholders.md`
   as relevant, before writing. A summary already existing for the same account+date or
   type+date → append to it (review its Open Action Items table first; ask about unclear
   statuses), don't create a duplicate. Input path already in
   `governance/processed.txt` → no-op; say so.
1. **File the raw transcript** (when one exists) verbatim at the category's transcript home
   (table below), with a header linking where the summary will live. Raw material is
   immutable from then on — corrections happen in the summary, never the transcript. An
   input path inside `product-development/inbox/` is **moved** — write the canonical copy,
   delete the inbox original: the inbox is staging; the file becomes immutable raw
   material at its destination, and the ledger gets the destination path. When the
   filename carries no date: ISO or `GMT{YYYYMMDD}` filename prefix → a date line in the
   content → file mtime, flagged "date inferred" in the run summary.
2. **Load the one reference file** for the category and write the summary in its format.
   Every summary declares its links in frontmatter — `initiatives:`, plus `areas:`/`features:`/`customers:` when relevant (legacy `**Initiatives touched:**` headers stay readable) — check
   `product-development/product/initiatives/` for active slugs.
3. **Route records by type** — table in Step 3. Decisions and lessons never live
   inline-only; the summary links the filed record.
4. **Category write-backs** — each reference file ends with its own list (account context
   and portfolio for calls, research report for interviews, lessons append for retros, …).
5. **Initiative join** (contract rule 8): for every slug in the summary's `initiatives:`,
   append one dated Activity line to that initiative's page linking this summary —
   **in the same change**: `YYYY-MM-DD — [one-line outcome] ([summary](relative/path.md))`.
6. **Navigation:** one line for each new file at the END of its folder's `CLAUDE.md` list.
7. **Ledger:** append every transcript path filed this run (batch mode: every member) to
   `governance/processed.txt`, one repo-root-relative path per line, kept
   sorted — `/context-update` sweeps skip ledgered paths.
8. **Run summary:** list every path written, records filed, refusals, and Tier-2
   confirmations asked. Nothing is handled silently.
9. **Handoffs** (offer, don't auto-run): 3+ interviews processed →
   `/user-research-synthesis`; Slack recap → `/slack-message` (or post via MCP);
   engineering tasks → `/create-tickets`; pending feature-request records →
   `/create-tickets push` (when a tracker MCP is connected).

### Save locations

| Category | Transcript (immutable) | Summary |
|---|---|---|
| customer-call | `product-development/product/user-insights/transcripts/{date}-{account}-call.md` — tag frontmatter (`date`, `type: call`, `customers`, + areas/features/initiatives/themes proposed from content) | `…/accounts/{customer}/calls/summaries/{date}.md`, linking its transcript |
| customer-interview | transcript: `product-development/product/user-insights/transcripts/{date}-{account}-interview.md` — tag frontmatter (`type: interview`) | report: `product-development/product/user-insights/{date}-interview-insights.md` · dated History cross-link line in each participating account's `account-context.md` (resolve participant → account; new account only on the user's confirm; anonymous panel → ask where to file) |
| internal (`{type}` ∈ enum) | `product-development/product/meetings/{type}/transcripts/{date}-{topic}.md` | `…/meetings/{type}/summaries/{date}-{topic}.md` |
| retro | `product-development/product/meetings/retros/transcripts/{date}-retro.md` | writeup: `…/meetings/retros/{date}-retro.md` |
| batch-day | per member, as its category above | per member, plus digest: `…/reports/{date}-daily-batch.md` |

## Step 3 — Route records by type (type beats location)

A decision made on a customer call still becomes a `decisions/` entry; the summary carries
the link, never a restated copy. Same language as `/context-update`'s routing — this skill
handles the meeting-borne subset:

| Found in the meeting | Where it goes |
|---|---|
| **Decision** ("we decided / chose", tradeoffs weighed) | `/decision-log-entry` quick format → `decisions/{date}-{slug}.md` with its `Initiative:` header + END-append to Recent Decisions in `decisions/CLAUDE.md`; summary links the entry |
| **Lesson** ("next time…", process learning) | append `- YYYY-MM-DD — lesson (source link)` to `meetings/retros/lessons-learned.md` |
| **Feature request** | the summary's Feature Requests section **+ one dated record** in `user-insights/feature-requests/{date}-{account}-{slug}.md` (schema in that folder's CLAUDE.md; check for an existing record of the same request+account first — append evidence rather than duplicate), linked from the summary's table row; also one line in the matching feature's PRD open questions or its `feature-index.yaml` entry (gated → confirm). A record with `tracker_ref: "-"` awaits `/create-tickets push` once a tracker MCP is connected |
| **Competitor intel** | `competitive-research/competitors/{slug}/teardown.md` (first intel: scaffold the folder + stub, copy `handbook/templates/competitor-teardown-template.md`) + refresh the affected `competitive-matrix.md` cells |
| **Segment shift** (new use case adopted, size band / vertical corrected) | `portfolio.yaml#{customer}` segment fields (auto) + flag `segmentation-matrix.md` cells for `/context-update` (Tier 2) |
| **Business or stakeholder fact** | hand to `/context-update` — `business-info.md` / `stakeholders.md` are Tier-2 surfaces with a mirror rule; don't edit them from here |
| **Permissioned quote** (customer signed explicit external-use permission) | `customers/case-studies/quotes/{customer-slug}.md` + `permissions.yaml` entry |

## Privacy gates (they live here, not in references — they must always load)

### 1:1 refusal

The root `CLAUDE.md` Privacy Contract bans 1:1 notes, coaching notes, and performance
feedback from this team repo. When gate 1 matches: **write no file.** Tell the user the
content belongs in their personal OS, and offer exactly one alternative — if a
*team-relevant decision* came out of the 1:1, they can paste that fact alone and
`/context-update`'s pasted-content mode folds it with no raw file. In batch mode, skip the
1:1 member with a one-line refusal note and continue with the rest.

### PII rules (customer-facing categories; non-negotiable)

1. **No customer-side personal names in summaries.** Role titles only — "Their VP of
   Engineering," "Their Champion." Our team members' names are fine.
2. **Quotes attributed by role**, italicized: *"We are digging it." — Their VP of Eng*.
3. **The transcript file may contain raw names** — it's a faithful record. The summary
   (which gets shared and synthesized) must not.
4. **No revenue figures, salary info, or PII** beyond role and company — those live in the
   CRM, not here.
5. **Outgoing-email exception:** a customer-side first name is allowed in the follow-up
   email's salutation line only (`Hi Sam,`). Unknown → `Hi there,` — never a literal
   `[Name]` placeholder.
6. **GDPR Article 9 categories stay out of BOTH files** — health, racial or ethnic origin,
   religion, political opinions, trade-union membership, biometric/genetic data, sexual
   orientation. If the conversation depended on such a fact, write a meta-note like
   *"Their team raised an accessibility consideration — see private CSM notes outside
   repo"* and keep the substance out.
7. **If you're tempted to write a name, write the role.** Unsure of the role → "Their
   attendee."

### Sensitive-content flag

If the meeting contains confidential strategy, unannounced plans, or competitive intel,
flag it in the summary header and recommend internal-only handling. Comp, board, investor,
and M&A content is on the Privacy Contract's never-commit list — treat it like a 1:1:
refuse to file, point to the personal OS.

## Batch mode in one paragraph

Batch = the shared pipeline in a loop. Classify each member through gates 1 and 3–6 (1:1s
skipped with a refusal note); each member gets its own transcript file, summary, and ledger
line. Then write the cross-meeting digest —consolidated action items, recurring topics,
conflicts — to `reports/{date}-daily-batch.md` per
[references/batch-day.md](references/batch-day.md).

## Reference files — load exactly one

| File | Loads when |
|---|---|
| [references/customer-call.md](references/customer-call.md) | Account calls — check-in, escalation, renewal, QBR, demo. Quick + Full variants, account write-backs |
| [references/example-customer-call.md](references/example-customer-call.md) | Linked from customer-call.md for the expected level of detail — don't load separately |
| [references/customer-interview.md](references/customer-interview.md) | Discovery/research interviews, 1–3 per session |
| [references/internal-meeting.md](references/internal-meeting.md) | Internal meetings — recurring series (standup, sprint planning, …) and event meetings (kickoff, stakeholder review, workshop, other) |
| [references/batch-day.md](references/batch-day.md) | The digest layer on top of a multi-meeting batch |
| [references/retro.md](references/retro.md) | Retro ceremonies — writeup + lessons |

## Quality self-check (before presenting)

- [ ] Category detected through the gates — not guessed; `{type}` from the enum or asked
- [ ] Transcript filed verbatim at the right home (when one exists), summary cross-links it
- [ ] Summary follows the loaded reference format; frontmatter links declared (`initiatives:` resolved or empty — the writer resolves, never the reader); transcript tags proposed and confirmed
- [ ] Every action item has an owner and a due date (flag "schedule within 48h" when missing)
- [ ] Every decision filed via `/decision-log-entry` and linked, with rationale — never inline-only
- [ ] PII pass done on customer-facing summaries (roles only, Art. 9 clean)
- [ ] Initiative Activity lines appended for every named slug (same change)
- [ ] Navigation rows appended at the END; new folders got a stub + parent entry
- [ ] Ledger updated for every transcript filed (batch: all members)
- [ ] Run summary printed — paths, records, refusals, Tier-2 asks

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   `CLAUDE.md` (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Declare the artifact's links in its frontmatter per `governance/link-schema.yaml` —
   resolve them YOURSELF from context before filing (initiative-scoped work names its
   one initiative; the initiative page gets the artifact row filled + a dated Activity
   line in the same change). A brand-new feature/area → propose the catalog entry
   (`feature-index.yaml`, gated) in the same confirmed change that registers the work.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.

**Ledger (this is an ingest skill):** append the repo path of every transcript filed this
run to `governance/processed.txt` — one repo-root-relative path per line,
keep the file sorted — so `/context-update` sweeps know the artifact is handled.

## Related

- `/meeting-agenda` — before the meeting: agenda + the notes stub this skill accepts afterward
- `/meeting-feedback` — was the meeting itself effective (scorecards, not summaries)
- `/user-research-synthesis` — cross-interview synthesis once 4+ interviews are processed
- `/context-update` — folds non-meeting artifacts; its sweeps delegate raw transcripts here
- `/prioritize-requests` — reads the Full-variant Feature Requests tables across accounts
- `/weekly-review`, `/portfolio-pulse` — periodic rollups that read what this skill files
- `/decision-log-entry`, `/create-tickets`, `/slack-message` — downstream record + share paths
