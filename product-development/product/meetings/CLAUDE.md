# Meetings

Meeting records — recurring series, event meetings, and retros.

**Read this when:** You missed a meeting, need to trace when something was decided, or are
filing a meeting record. Periodic rollups (weekly reviews, portfolio pulses, status
updates, batch digests) are outputs, not meetings — they live in [../reports/](../reports/);
daily and weekly plans in [../planning/](../planning/).

## Meeting types — a closed enum, two kinds

Summaries and transcripts file under exactly these type folders, each a
`{docs,transcripts,summaries}` triad. `/process-meeting` routes into them; no skill ever
invents a new folder from a meeting title.

**The transcript boundary.** Internal-meeting and retro transcripts stay here, under
`meetings/{type}/transcripts/` and `retros/transcripts/` — they never move. Customer-facing
raw material (interviews, customer calls) files to the central tagged archive instead,
`user-insights/transcripts/{date}-{account}-{type}.md` — a call's summary goes to the
account's `calls/summaries/`, an interview's session report to
`user-insights/{date}-interview-insights.md` — never under `meetings/`. `/process-meeting`
makes the call at filing time.

**Recurring series** — one folder per series your team actually runs. The template ships
three examples from a sprint-based setup — `standup` · `sprint-planning` · `team-bi-weekly`
— rename or replace them to match your own cadences: a PM org that sits outside the dev
process might run `pm-weekly-sync`, `portfolio-steering`, `design-review` instead. A series
folder is a routing convention, not a framework commitment.

**Event meetings** — a fixed, style-agnostic set, routed by *function* (what the meeting
was for), never by its calendar title. A meeting that belongs to an existing series always
files with its series — a sprint review inside the sprint cadence goes to
`sprint-planning`, not `stakeholder-review`.

| Type | Files here when |
|---|---|
| `kickoff/` | Something starts — an initiative, project, phase, or engagement |
| `stakeholder-review/` | Work was presented for feedback, approval, or sign-off — steering presentations, gate reviews, demo-and-feedback, exec reviews |
| `workshop/` | The group produced something together — discovery, requirements, mapping, design working sessions |
| `other/` | Nothing fits — all-hands, vendor calls, trainings, one-off cross-team syncs |

Initiative-scoped meetings (most kickoffs, reviews, workshops) carry the slug in the
filename (`{date}-{initiative}-kickoff.md`) and declare it in the summary's frontmatter
(`initiatives:` — legacy `Initiatives touched:` headers stay readable) — the initiative
page links back with a dated Activity line (write-back contract rule 8).

**Adding a genuinely new recurring series:** confirm with the team, create
`meetings/{series}/{docs,transcripts,summaries}/` with a 5-line CLAUDE.md stub in each, and
append the row to the list below. The same meeting landing in `other/` for the second time
is the promotion signal. Existing records stay where they were filed — the ledger keeps
their paths stable.

One special flat folder: `retros/` — writeups plus rolling `lessons-learned.md`, raw
recordings in `retros/transcripts/`. Retros produce a writeup and lessons, not a
transcript/summary pair.

## Contents

### Subfolders

- [retros/](retros/) — Retrospective writeups and rolling lessons learned
- [sprint-planning/](sprint-planning/) — Sprint planning artifacts (example series)
- [standup/](standup/) — Daily standup artifacts (example series)
- [team-bi-weekly/](team-bi-weekly/) — Bi-weekly team meeting and review artifacts (example series)
- [kickoff/](kickoff/) — Kick-offs: an initiative, project, phase, or engagement starting
- [stakeholder-review/](stakeholder-review/) — Approvals, gate reviews, steering presentations, demo-and-feedback
- [workshop/](workshop/) — Working sessions that produce something: discovery, requirements, mapping, design
- [other/](other/) — The catch-all that keeps filing unblocked when no type fits
