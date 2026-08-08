---
name: wiki-lint
description: Health-check the team wiki — staleness by age tier, navigation coverage in both directions, broken cross-references, feature-index vs disk drift, initiative-page health, living-page registry checks, placeholder/truncation scan, ledger integrity, business-info mirror consistency, protected-path audit, and code-grounding registry drift. Absorbs the old /freshness-check (staleness is check #1 here). Writes a dated report to governance/health/. --fix repairs mechanical drift only (missing nav lines, missing CLAUDE.md stubs, ledger sort) — never content. Use on /wiki-lint, "is the repo healthy?", "check the wiki", weekly as automation, or before quarterly planning.
group: os-admin
---

# wiki-lint — the repo's health check

One engine, eleven checks. The GitHub Action (`.github/workflows/wiki-lint.yml`) runs the
mechanical subset on PRs and weekly via `.github/scripts/wiki-lint.sh`; this skill is the
full pass — run the script first, then do the judgment checks the script can't.

## Modes

- **Default** — report only. Write the dated report, change nothing else.
- **`--fix`** — additionally repair MECHANICAL drift: append missing nav lines (from the
  file's own first heading/description), generate missing 5-line CLAUDE.md stubs,
  `sort -u` the ledger, re-order a nav list only where duplicated entries collided. Never
  rewrite prose, never resolve contradictions, never archive — humans decide content.
- **`--schema-drift`** — compare `analytics/schemas/` docs against the warehouse
  `INFORMATION_SCHEMA` (skip with a note when no warehouse access is configured).

## The eleven checks

1. **Staleness** *(absorbed from /freshness-check)* — last-modified via
   `git log -1 --format=%ct -- <file>` over `product-development/`, `governance/`, and `os-installation/`.
   Tiers: Fresh <30d ✅ · Aging 30–90d 🟡 · Stale 90–180d 🟠 · Archive candidate 180+d 🔴.
   Skip paths in `.freshness-ignore` (wildcards ok) and stable references
   (`analytics/schemas/`, `os-installation/`, `.claude/`, `LICENSE`) — note those as
   "stable reference material". Cross-reference `feature-index.yaml`: a metrics/queries file
   untouched since its feature shipped is flagged "should-have-been-updated". Flag
   `[PENDING:]` markers older than 14 days.
2. **Navigation coverage, both directions** — every directory under `product-development/`
   and `governance/` has a `CLAUDE.md`; every content file appears in its folder's CLAUDE.md list; every nav
   line's target exists on disk. Queue folders with transient contents
   (`product-development/inbox/`, `governance/proposals/`) are exempt from the per-file nav
   requirement — their CLAUDE.md describes the queue, not its contents.
3. **Feature-index ↔ disk** — every path in `feature-index.yaml` resolves; every PRD /
   metric doc / experiment / investigation on disk appears in some feature entry (orphans);
   every slug in an `initiatives:` list has a page in `product/initiatives/`.
4. **Broken cross-references** — markdown links and backticked repo paths across
   `product-development/`, `governance/`, and `.claude/` that point at nothing.
5. **Initiative-page health** — every `initiatives/*.md` has `_status:` + `_updated:`;
   pages with `_status: active` but no artifact/activity change in 30+ days flagged; every
   artifact link on the page resolves. Join symmetry: every decision entry whose
   `Initiative:` header names a slug is linked from that page's Decisions section, and
   every meeting/call summary whose `Initiatives touched:` names a slug has a matching
   Activity line there (one-way — pages may link records that don't name them).
6. **Living-page registry** — every glob in `write-policy.yaml#living-pages` matches at
   least the expected files; each living page carries `_updated:`; each is within its
   ≤120-line budget (folder CLAUDE.mds ≤80; root CLAUDE.md ≤150; `segmentation-matrix.md`
   ≤200 — table-heavy by design).
7. **Mirror consistency** — the root CLAUDE.md fundamentals block vs `business-info.md`,
   field by field (company, ICP, model, north star, competitors, quarter focus);
   `segmentation-matrix.md` General-matrix totals vs the ARR / paying-accounts figures in
   both, and every `portfolio.yaml` segment label (`vertical`, `size_band`, `use_cases`)
   vs the matrix's canonical axes; `current-quarter.md`'s quarter label vs today's date;
   "Decided by" names in recent decisions vs the team roster.
8. **Ledger integrity** — every ledger path exists on disk; ledger is sorted and
   duplicate-free; unprocessed backlog count (the `/context-update` discovery `comm`);
   proposals in `governance/proposals/` older than 14 days flagged. Inbox arrivals are ledgered
   under their destination path after the move (junk under its inbox path).
9. **Placeholder / truncation scan** — `[Your `, `[FILL IN]`, `[NEED:` outside
   `handbook/templates/`, `PRDs/examples/`, and the root-CLAUDE.md setup blocks
   (report as "setup not finished" on a fresh clone, warning not failure); nav description
   lines that end mid-word (the truncation bug class).
10. **YAML parse** — `feature-index.yaml`, `data-catalog.yaml`, `write-policy.yaml`,
    `portfolio.yaml`, `engineering/code-repos.yaml` all parse.
11. **Code-grounding registry** *(judgment, skill only)* — when
    `engineering/code-repos.yaml` exists: every `last_validated` within 90 days; IF
    `feature_keys` are present they resolve in `feature-index.yaml` (the field is
    optional — absence is fine); every `map.path` resolves on disk AND every file in
    `engineering/codebases/` has a registry entry pointing at it (both directions); each
    map carries its `{repo}@{full-sha}` stamp. Best-effort when a local clone is
    reachable via `additionalDirectories`: report each map's commits-behind count vs the
    clone's HEAD (the GitHub Action can't — no clones on the runner). Placeholder remotes
    (`your-org`) → "code grounding: setup not finished" warning, not a failure.

## Output

1. Chat summary — counts per check, worst findings first.
2. Dated report `governance/health/{YYYY-MM-DD}-wiki-lint.md` (full findings,
   owners from the team roster for stale files) + append its line to `health/CLAUDE.md`.
3. If 30%+ of non-ignored files are stale: prepend the recovery-session block (1 hour,
   divide stale files among owners, update/archive/confirm each, re-run).

## Rules

1. Never auto-delete or auto-archive; never let `--fix` touch prose, contradictions, or
   staleness — mechanical repairs only, committed as `context: wiki-lint --fix`.
2. Assign findings to owners using the team roster in root CLAUDE.md.
3. This skill is the single writer for `governance/health/`.
4. Slack post of the summary is additive when the MCP is connected — the repo report is
   written regardless.
5. The Action and this skill must agree: `.github/scripts/wiki-lint.sh` implements checks
   2–4 and 8–10 mechanically; when you change a check here, change the script in the same
   PR (admin tier — steward).
