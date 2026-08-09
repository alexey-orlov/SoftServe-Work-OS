# Governance — the admin surface of the Team OS

Everything that runs the repo, in one folder: the write rules, the writing and
code-grounding contracts, and the machine state (ingestion ledger, health reports,
pending proposals). Content lives in
`product-development/`; the machinery that keeps it trustworthy lives here.

**Read this when:** You are the steward, the write-guard just prompted you, or you need to
know what is protected, what has been ingested, or how healthy the repo is.

## The three tiers

Defined in [write-policy.yaml](write-policy.yaml) — the only authoritative path list. Do
not copy path lists into other docs; point here.

- **auto** — the default for any path not listed. Agents write and commit directly:
  transcripts, summaries, decisions, PRDs, analyses, navigation files, the ledger, health reports.
- **confirm** — the distilled steering files (root CLAUDE.md, feature-index, business
  context, current quarter). An agent shows the exact before/after and gets an in-session
  yes BEFORE writing. Headless runs cannot confirm — they file a proposal in
  [proposals/](proposals/) instead. Older skill prose calls this tier "Tier 2" — same thing.
- **admin** — the system's own rules: this folder's three rule files, `.claude/` machinery,
  `.github/`. Steward only, via reviewed PR.

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
- [code-grounding.md](code-grounding.md) — The rules every claim about product code follows: the access-tier chain, `repo@sha` citation format, honesty rules, secrets masking, and the short block code-claiming skills paste. Implemented by `/code-qa` and `/connect-code`.

### Subfolders

- [health/](health/) — Dated `/wiki-lint` reports. Written only by wiki-lint.
- [proposals/](proposals/) — Pending confirm-tier change proposals from headless runs (a scheduled job may not edit confirm-tier files; it files the proposed diff here instead). Surfaced by the session-start hook; delete a proposal after applying or rejecting it.
