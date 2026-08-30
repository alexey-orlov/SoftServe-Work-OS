# Playbook — target: `research-source`

Record where user-insights material and meeting records come from — the `user-insights:` key in
`product-development/toolchain.yaml` (gated) — align the meeting folders to the org's real
cadences, and optionally load the first batch. Re-running re-asks the full question; that
IS how the choice is changed later. Shared lifecycle, state, readout, and write rules:
SKILL.md.

## Step 1 — The source choice

Evidence before questions: a connected transcripts/notes MCP (Fireflies, Gong, Notion,
Drive, …) is evidence of the answer — quote it and confirm rather than asking cold. Then
one question, recommendation first:

- `inbox-manual` — people drop transcripts/notes into `product-development/inbox/`
  (conventions in its CLAUDE.md); `/context-update` sweeps them. No tooling needed.
- `mcp` — records are pulled from a connected tool. Params: `mcp-name` (as registered).
  Not yet connected → offer to run `/connect-mcps connect to {tool}` in this run
  (connection is that skill's job).
- `undecided` — skip; drops still work, the key just records no standing choice. Phase →
  `complete` with Open — Other: "research source undecided". Never nag afterwards.

Install: write source + params + `decided:` date + one-line notes behind the gated
prompt. Master repo: the key ships `undecided`; a real choice stages outside the repo.

## Step 2 — Meeting cadences

The OS ships `product/meetings/` with generic recurring-series folders (standup, sprint
planning, bi-weekly) meant to be renamed to the org's real cadences. Ask for the org's
actual recurring meetings once, propose the folder renames (a structural change — applied
only on the in-session yes per `governance/write-back-contract.md`), and update the
folder's CLAUDE.md navigation in the same change. Already renamed, or the org matches the
defaults → confirm and move on.

## Step 3 — Initial load (optional)

Offer once: load a first batch now?

- **Manual:** invite the user to drop files into `product-development/inbox/` (name
  format from its CLAUDE.md), then run the `/context-update` sweep — it gates junk,
  delegates transcripts to `/process-meeting`, and ledgers everything.
- **MCP:** agree a bound first (how many records, or since when — never "everything"),
  pull that batch into `product-development/inbox/`, then the same sweep. The sweep
  engines own routing and the ledger; this target only orchestrates and reports counts.

Declined → `complete` with a note that loading works the same way anytime.
