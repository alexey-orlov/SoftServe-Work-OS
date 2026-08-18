# Governance — the admin surface of the Team OS

Everything that runs the repo, in one folder: the write rules, the write-back contract,
and the machine state (ingestion ledger, health reports, pending proposals). Content
lives in `product-development/`; the machinery that keeps it trustworthy lives here.
(The code-grounding contract — evidence rules for claims about product code — lives with
its registry in `product-development/engineering/`.)

**Read this when:** You are the steward, the write-guard just prompted you, or you need to
know what is protected, what has been ingested, or how healthy the repo is.

## The two tiers

Defined in [write-policy.yaml](write-policy.yaml) — the only authoritative registry for
BOTH the path list and the tier mechanics (its header comment). Do not copy either into
other docs; point there. Orientation only: **auto** (default — agents write and commit
directly; with auto-sync on, pushed too) · **gated** (steering files + system rules —
your yes at the native write prompt, and never auto-committed or pushed; headless runs
file a proposal in [proposals/](proposals/)). `/auto-sync on direct|pr` / `off` flips the
automation — `direct` for an open `main` (gated files held for the steward), `pr` for a
pull-request-only `main` (gated files travel via `/propose`); `/customize-os` asks which.

## The enforcement chain

1. **Write time** — `.claude/hooks/write-guard.sh` (PreToolUse hook) re-reads
   write-policy.yaml on every agent file-write and raises a native approval prompt on
   gated paths — tagged `🔒 GATED FILE — Team OS write policy` with the path, the
   matched rule and what approve/reject mean, so it is never confused with an ordinary
   permission ask.
2. **Land time** — `.claude/hooks/auto-commit.sh` (Stop hook, the auto-sync engine —
   flipped by `/auto-sync`) auto-commits and pushes auto-tier work each turn. Gated paths
   never reach the target branch by automation: direct strategies hold them back,
   uncommitted, for the steward; the pr strategy (pull-request-only `main`) commits them
   on the person's own branch, where they wait for `/propose` — the pull request an admin
   approves.
3. **Server-side (recommended)** — the rule on `main` that makes step 2's approval real:
   GitHub ruleset + generated `.github/CODEOWNERS`, or the Azure Repos required-reviewer
   policy with the generated path filter. Steps: `os-installation/admin-setup-github.md`
   / `admin-setup-azure-devops.md`; background: `os-installation/claude-code/scheduled-governance.md`.
4. **Audit** — `.github/workflows/wiki-lint.yml` runs the mechanical lint on every PR and
   posts a weekly health issue listing every commit that touched a gated path (and warns
   when CODEOWNERS drifts from the policy).

## Changing the rules

Steward only. The gated path list lives in ONE place — [write-policy.yaml](write-policy.yaml).
The weekly audit derives its list from it at run time; `.github/CODEOWNERS` is regenerated
from it by the turn-end hook (`.github/scripts/gated-paths.sh`); the Azure Repos path
filter is the one mirror a person refreshes (`gated-paths.sh --format ado` — `/propose`
reminds the approving admin; an optional pipeline can automate it), as is the optional
GitHub push ruleset (`--format ruleset`).

## Contents

### Files

- [write-policy.yaml](write-policy.yaml) — Which paths agents change freely (auto) and which are gated (write prompt + held from auto-sync). Its `settings:` block also holds the auto-commit / auto-push switches (off on a fresh install; flipped by `/auto-sync`), so the automation and the tier it respects live in one file.
- [write-back-contract.md](write-back-contract.md) — The rules every repo-writing skill follows when it saves work: the four content classes, the mandatory closing steps, the one-writer-per-surface table, and the ledger rules.
- [processed.txt](processed.txt) — The ingestion ledger: one repo-root-relative path per line, kept sorted. A path here = already folded by `/context-update` (junk and duplicates are ledgered too). Merge conflicts: keep both sides, then `sort -u`. Written only by ingest skills.

### Subfolders

- [health/](health/) — Dated `/wiki-lint` reports. Written only by wiki-lint.
- [proposals/](proposals/) — Pending gated-change proposals: from headless runs (which cannot ask), and from any run without the user's in-session yes (capture-loop takeaways, skill/template diffs). Surfaced by the session-start hook; apply/reject then delete — applying is the write prompt's yes, and the applied file still lands deliberately (gated files never reach `main` by automation). In the pr landing strategy the pull request opened by `/propose` is the primary channel; this folder is the fallback for runs that cannot open one.
