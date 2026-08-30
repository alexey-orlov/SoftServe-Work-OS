# User Insights

Everything learned from users, in one tree — cross-interview synthesis reports at this level, raw interview transcripts, customer feature requests, and the instruments (guides, journey maps) underneath. What one customer said on one commercial/CS call stays in `customers/accounts/{slug}/calls/`; every interview is also cross-linked from the participant's account page, so account timelines stay complete.

**Read this when:** You want themes across many interviews, the raw interviews behind them, the feature-request pile, or the guides used to run research.

## Contents

### Files

- [2026-07-30-interview-insights.md](2026-07-30-interview-insights.md) — EXAMPLE (synthetic) — Acme discovery: Monday export rebuild + silent credit depletion; 2 feature-request records filed

### Subfolders

- [interviews/](interviews/) — Raw interview transcripts, `{YYYY-MM-DD}-{participant-slug}.md` — the per-session insight report above is their summary layer
- [feature-requests/](feature-requests/) — One dated record per customer feature request: evidence, draft ticket body, tracker push state (`tracker_ref`)

### Created on demand

- `interview-guides/` — JTBD interview guides — created on first use by `/interview-guide`
- `journey-maps/` — Journey map documents — created on first use by `/journey-map`

## Writers

`/process-meeting` (interview category) files transcripts to `interviews/`, writes the session report here (`{date}-interview-insights.md`), creates feature-request records, and adds a dated History cross-link line to each participating customer's `account-context.md` — resolving every participant to an existing account, confirming before creating a new one, asking where to file anonymous panelists. `/user-research-synthesis` writes cross-interview syntheses here (`{topic}-{date}.md`); `/interview-guide` and `/journey-map` write their on-demand subfolders; `/create-tickets` push mode sets `tracker_ref` on feature-request records.
