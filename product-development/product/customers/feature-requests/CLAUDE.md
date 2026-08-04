# Feature Requests — per-request demand records

One dated record per customer feature request: the evidence (who asked, the underlying
need, the verbatim quote), a draft ticket body, and the tracker push state. Created by
`/process-meeting` whenever a call or interview surfaces a request; pushed to the team's
tracker (Linear, Jira, Asana — whichever MCP is connected) by `/create-tickets push`,
which writes the ticket reference back into the record. Records are never deleted — the
record is the durable evidence on both sides of the push.

**Read this when:** You want what customers asked for verbatim, or which requests haven't
reached the tracker yet.

## Format

`{YYYY-MM-DD}-{account}-{request-slug}.md` with front-matter: `account`, `requested`
(call date), `area` (feature-index area, existing or proposed), `type`
(feature | improvement | bug), `priority_signal`, `tracker_ref` (`"-"` until pushed, then
the ticket id or URL), `source` (relative link to the summary or report), `_updated`.
Body: `# [{Area}] {Request}` → the underlying need → the role-attributed quote →
`## Draft ticket` (objective + acceptance-criteria seed — a tracker push uses it verbatim).

**Not the triage board:** cross-account clustering and act/decline verdicts live in
`product-development/product/strategy/feature-requests.md` (written only by
`/prioritize-requests`). This folder is per-request evidence + push state; that file is
the routed judgment across them.

## Contents

### Files

_Empty. Add a one-line entry here for every file you add._
