# Scheduled Governance — enforcement once the repo is on GitHub

The wiki keeps itself honest through three stacked layers. Each alone is bypassable; a
violation has to slip past all three. Everything below is inert until the repo is pushed
to a GitHub remote.

## Layer 1 — In-session (ships working, no setup)

- **Session-start briefing** injects recent decisions, quarter priorities, active
  initiatives, team learnings, the latest health report, and the fold backlog.
- **Write-guard** (`.claude/hooks/write-guard.sh`) forces an in-session confirmation
  whenever an agent tries to write a confirm- or admin-tier path from
  `product-development/_meta/write-policy.yaml`.

Limit: hooks bind agent sessions only — not a human in a text editor, not bash
redirection. That's what layers 2–3 are for. Details: `.claude/hooks/session-start.md`.

## Layer 2 — Server-side hard stop: push ruleset (recommended)

GitHub **push rulesets with file-path restrictions** block ANY push — direct-to-main
included — that touches listed paths, unless the pusher is on the bypass list.
Availability: private/internal repos on GitHub Team plan or above (GA since Sept 2024).

Setup: repo → Settings → Rules → Rulesets → *New push ruleset*:

1. **Bypass list**: the repo steward (see `write-policy.yaml#steward`) and any trusted bot.
2. **Restrict file paths** — mirror the write policy's confirm + admin tiers:
   ```
   CLAUDE.md
   product-development/feature-index.yaml
   product-development/product/strategy/business-context/**
   product-development/product/strategy/current-quarter.md
   product-development/_meta/write-policy.yaml
   .claude/**
   .github/**
   ```
3. Enforcement: Active.

Keep this list in sync with `write-policy.yaml` — when you change the registry, change
the ruleset (both are one screen). Teammates then land protected changes via a PR that
the steward merges (their bypass applies), while all auto-tier work pushes straight to
`main` with no ceremony.

**No Team plan?** Fall back to layers 1 + 3, or classic branch protection (below) if you
accept PR-for-everything — we don't recommend that trade for day-to-day flow.

## Layer 3 — Audit: the wiki-lint Action (ships in the repo)

`.github/workflows/wiki-lint.yml` runs `.github/scripts/wiki-lint.sh`:

- **On every PR** — mechanical checks fail the PR before review: nav coverage both
  directions, broken links, feature-index ↔ disk (incl. initiative slugs), ledger
  integrity, truncation scan, YAML parse.
- **Weekly (Mon 06:00 UTC) + manual dispatch** — same checks plus the **protected-path
  audit**: every commit from the last 8 days that touched a confirm/admin-tier path,
  posted into a rolling "Weekly wiki-lint report" issue for the steward to review.

The script implements the mechanical subset of `.claude/skills/wiki-lint/SKILL.md` — the
skill is the spec of record; change a check there and the script in the same PR. The
judgment checks (staleness triage with owners, contradiction sweep, initiative health)
run via `/wiki-lint` in a session, which writes dated reports to
`product-development/_meta/health/`.

## Branch protection (admin tier only)

Settings → Branches → rule for `main` — needed only if you want PR review enforced for
admin-tier changes when push rulesets aren't available. With a push ruleset in place,
day-to-day auto-tier commits go straight to `main` and nothing here is required.

## Capture integrations (optional, later)

The ingest engine (`/context-update`) is source-agnostic: anything that lands a file in
a `transcripts/` folder gets folded on the next sweep, and anything pasted in chat folds
immediately. If the team later wants automated capture (e.g. a Slack emoji-trigger that
files a thread into the repo via the GitHub API, or a meeting-notes tool webhook), wire
it to write files into the appropriate `transcripts/` folder and let the sweep do the
rest — schedulers stay thin, the skill stays the engine.
