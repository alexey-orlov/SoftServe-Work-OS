# Meetings

Standup, sprint planning, bi-weekly, and retrospective meeting artifacts.

**Read this when:** You missed a meeting or need to trace when something was decided.

## Meeting types — a closed enum

Summaries and transcripts file under exactly these type folders: `standup` ·
`sprint-planning` · `team-bi-weekly` (each a `{docs,transcripts,summaries}` triad). Two
special flat folders: `retros/` (writeups + `lessons-learned.md`, raw recordings in
`retros/transcripts/`) and `digests/` (periodic rollups). One-off meetings (a design
review, a stakeholder sync) file under the closest existing type — a skill never invents a
new type folder from a meeting title.

**Adding a genuinely new recurring series:** confirm with the team, create
`meetings/{new-type}/{docs,transcripts,summaries}/` with a 5-line CLAUDE.md stub in each,
and add the row to the list below. `/process-meeting` asks rather than guessing when no
type fits.

## Contents

### Subfolders

- [retros/](retros/) — Retrospective writeups and rolling lessons learned
- [sprint-planning/](sprint-planning/) — Sprint planning artifacts
- [standup/](standup/) — Daily standup artifacts
- [team-bi-weekly/](team-bi-weekly/) — Bi-weekly team meeting and review artifacts
- [digests/](digests/) — Periodic rollups (weekly review, portfolio pulse, status updates, batch-day digests)
