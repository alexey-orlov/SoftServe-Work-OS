# Link Architecture v2 — Migration Runbook for Deployed Instances

How a live instance of this OS (a customer's repo cloned from the master before
the Link Architecture v2 change) adopts the new model. The master's worked
examples already model the target state; this page is the delta for repos with
real content.

**Read this when:** Your instance predates the areas/features/initiatives link
contract (`governance/link-schema.yaml` is new to you after a template update).

## What changed, in one paragraph

Areas → features became an explicit catalog (`feature-index.yaml` now holds the
product map only — no artifact rows); initiatives are the single container for
work (every PRD, breakdown, job spec, prototype, launch names its initiative);
records and transcripts carry fenced YAML frontmatter tags instead of bold
headers; customer-facing transcripts live in one central home
(`product/user-insights/transcripts/`). Full contract:
`governance/write-back-contract.md` + `governance/link-schema.yaml`.

## Why nothing breaks on day one

Parsers and checks are **dual-read, permanently**: the old italic `_status:`
meta lines, bold `**Initiative:**` headers, and the old feature-index shape stay
readable. Migration is convergence, not a cliff.

## The migration, step by step

1. **Freeze**: `/auto-sync off` for the migration session; land or drop any held
   gated edits (the session-start briefing lists them); `git status` clean.
2. **Pull the template update** (however your instance tracks the master).
3. **Run `/wiki-lint`**. The mechanical pass converts legacy formats where the
   answer is derivable (frontmatter from filenames, status lines, date-key
   spellings) and lists everything needing judgment as numbered suggestions —
   chiefly: which initiative each unlinked artifact belongs to, and your real
   area/feature catalog (seeded from folder names; confirm or rename).
4. **Accept the suggestions** you agree with (one keystroke each). Unknowns can
   wait — they surface in the session-start link-health count until resolved.
5. **Move transcripts** when ready: `/context-update` proposes the central-home
   move with ledger + provenance rewrites batched as one change. This step is
   optional on day one — tags work in the old homes too.
6. **Re-enable auto-sync** (`/auto-sync on direct|pr`).

## Sequencing note for the OS admin

Steps 1–4 are one sitting (~an hour on a mid-size instance). Step 5 can trail by
days. Nothing in the new contract blocks writing while legacy content remains —
lint reports converge to zero rather than gating work.
