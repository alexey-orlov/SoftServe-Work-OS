# proposals — pending gated changes

The landing spot for changes agents may not apply themselves. Two cases:

- **Headless** — a scheduled/headless run derived a change to a gated file (the list in
  `governance/write-policy.yaml`) and cannot ask for the in-session yes.
- **No in-session yes** — a capture-loop takeaway or discovery targets a gated path
  (skills, agents, `.claude/team-learnings.md`, templates, structural changes) and the
  user's in-session yes wasn't available.

One file per proposal: `{YYYY-MM-DD}-{slug}.md` containing the target path, the exact
proposed before/after, the evidence/source that motivated it, and the proposer (skill or
session). Surfaced by the session-start briefing; `/wiki-lint` flags proposals older
than 14 days.

**Read this when:** The session-start briefing says proposals are pending. Apply or
reject in an interactive session — approving the write prompt IS the yes. Applied files
are still gated: auto-sync never commits or pushes them, so land them deliberately.
Delete the proposal file after applying or rejecting it.

## Contents

### Files

_Empty. Agent runs append entries here; humans clear them._
