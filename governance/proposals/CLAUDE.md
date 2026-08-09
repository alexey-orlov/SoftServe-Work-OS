# proposals — pending protected-tier changes

The landing spot for changes agents may not apply themselves. Two cases:

- **Confirm-tier, headless** — a scheduled/headless run derived a change to a confirm-tier
  file (`governance/write-policy.yaml`) and cannot ask in-session.
- **Admin-tier, any run** — a capture-loop takeaway or discovery targets an admin path
  (skills, agents, `.claude/team-learnings.md`, templates, structural changes) and the
  steward's in-session yes wasn't available. Gate files (`write-policy.yaml`,
  `write-back-contract.md`, hooks) are ALWAYS proposed, never applied in-session.

One file per proposal: `{YYYY-MM-DD}-{slug}.md` containing the target path, its tier, the
exact proposed before/after, the evidence/source that motivated it, and the proposer
(skill or session). Surfaced by the session-start briefing; `/wiki-lint` flags proposals
older than 14 days.

**Read this when:** The session-start briefing says proposals are pending. Confirm-tier:
apply or reject in an interactive session. Admin-tier: the steward applies via reviewed
PR (or an in-session yes). Delete the proposal file after applying or rejecting it.

## Contents

### Files

_Empty. Agent runs append entries here; humans clear them._
