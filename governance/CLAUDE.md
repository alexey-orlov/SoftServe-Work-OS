# Governance — the admin surface of the Team OS

Everything that runs the repo, in one folder: the write rules, the write-back contract,
and the machine state (ingestion ledger, health reports, pending proposals). Content
lives in `product-development/`; the machinery that keeps it trustworthy lives here.
(The code-grounding contract — evidence rules for claims about product code — lives with
its registry in `product-development/engineering/`.)

**Read this when:** You are the steward, the write-guard just prompted you, or you need to
know what is protected, what has been ingested, or how healthy the repo is.

## The three tiers

Defined in [write-policy.yaml](write-policy.yaml) — the only authoritative registry for
BOTH the path lists and the tier mechanics (its header comment). Do not copy either into
other docs; point there. Orientation only: **auto** (default — agents write and commit
directly) · **confirm** (steering files — exact before/after + in-session yes; headless
runs file a proposal in [proposals/](proposals/)) · **admin** (the system's own rules —
steward only; agents file proposals).

## The enforcement chain

1. **In-session** — `.claude/hooks/write-guard.sh` (PreToolUse hook) re-reads
   write-policy.yaml on every agent file-write and raises a native approval prompt on
   confirm- and admin-tier paths.
2. **Server-side (optional)** — a GitHub push ruleset hard-stops non-steward pushes to
   protected paths. Setup: `os-installation/claude-code/scheduled-governance.md`.
3. **Audit** — `.github/workflows/wiki-lint.yml` runs the mechanical lint on every PR and
   posts a weekly health issue listing every commit that touched a protected path.

## Changing the rules

Steward only. The protected-path list is hand-maintained in THREE places that must move
together in one change: [write-policy.yaml](write-policy.yaml), the ruleset block in
`os-installation/claude-code/scheduled-governance.md`, and the audit list in
`.github/workflows/wiki-lint.yml`. No generator exists — keep them in sync by hand.

## Contents

### Files

- [write-policy.yaml](write-policy.yaml) — Which paths agents change freely (auto), which need an in-session yes (confirm), which are steward-only (admin). Its `settings:` block also holds the auto-commit / auto-merge switches (both ship off), so the automation and the tiers it respects live in one file.
- [write-back-contract.md](write-back-contract.md) — The rules every repo-writing skill follows when it saves work: the four content classes, the mandatory closing steps, the one-writer-per-surface table, and the ledger rules.
- [processed.txt](processed.txt) — The ingestion ledger: one repo-root-relative path per line, kept sorted. A path here = already folded by `/context-update` (junk and duplicates are ledgered too). Merge conflicts: keep both sides, then `sort -u`. Written only by ingest skills.

### Subfolders

- [health/](health/) — Dated `/wiki-lint` reports. Written only by wiki-lint.
- [proposals/](proposals/) — Pending protected-tier change proposals: confirm-tier changes from headless runs, and admin-tier changes (capture-loop takeaways, skill/template diffs) from any run without the steward's in-session yes. Surfaced by the session-start hook; apply/reject then delete — admin-tier ones land via steward PR.
