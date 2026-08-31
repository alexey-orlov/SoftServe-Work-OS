# User Insights

Everything learned from users, in one tree — cross-interview synthesis reports at this level, the central raw-transcript archive (interviews and customer calls, tagged by customer/area/feature/initiative), customer feature requests, and the instruments (guides, journey maps) underneath. Call *summaries* stay with their account in `customers/accounts/{slug}/calls/summaries/`; every transcript is also cross-linked from the participant's account page, so account timelines stay complete.

**Read this when:** You want themes across many interviews, the raw interviews behind them, the feature-request pile, or the guides used to run research.

## Contents

### Files

- [2026-07-30-interview-insights.md](2026-07-30-interview-insights.md) — EXAMPLE (synthetic) — Acme discovery: Monday export rebuild + silent credit depletion; 2 feature-request records filed

### Subfolders

- [transcripts/](transcripts/) — The central raw archive: interviews + customer calls, `{YYYY-MM-DD}-{account}-{type}.md`, tag frontmatter per the link contract — the per-session insight report above / the account's call summary is their summary layer
- [feature-requests/](feature-requests/) — One dated record per customer feature request: evidence, draft ticket body, tracker push state (`tracker_ref`)

### Created on demand

- `interview-guides/` — JTBD interview guides — created on first use by `/interview-guide`
- `journey-maps/` — Journey map documents — created on first use by `/journey-map`

## Writers

| Skill | Writes here | Never |
|---|---|---|
| `/process-meeting` | Per-conversation folding — files each interview / customer-call transcript to `transcripts/` with proposed tags, writes the session report here (`{date}-interview-insights.md`) or the account's call summary, creates feature-request records, and adds a dated History cross-link line to each participating customer's `account-context.md` — resolving every participant to an existing account, confirming before creating a new one, asking where to file anonymous panelists | Never synthesizes beyond the session — 4+ interviews across sessions are `/user-research-synthesis`'s job |
| `/user-research-synthesis` | Cross-interview syntheses here (`{topic}-{date}.md`), once 4+ interviews are filed, querying `transcripts/` by tag | Never files transcripts (hands raw ones to `/process-meeting`), never edits raw material, never creates feature-request records |
| `/context-update` | Non-meeting folding and the sweep — facts from threads, docs and pasted material onto the pages that own them; feature-request records when the request arrives outside a transcript | Never writes summaries or syntheses; delegates every unprocessed transcript to `/process-meeting` |

`/retag-transcript` corrects transcript tags; `/interview-guide` and `/journey-map` write their on-demand subfolders; `/create-tickets` push mode sets `tracker_ref` on feature-request records.
