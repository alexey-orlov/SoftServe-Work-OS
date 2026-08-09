# Scheduled Governance — enforcement once the repo is on GitHub

The wiki keeps itself honest through three stacked layers. Each alone is bypassable; a
violation has to slip past all three. Everything below is inert until the repo is pushed
to a GitHub remote.

## Layer 1 — In-session (ships working, no setup)

- **Session-start briefing** injects recent decisions, quarter priorities, active
  initiatives, team learnings, the latest health report, and the fold backlog.
- **Write-guard** (`.claude/hooks/write-guard.sh`) forces an in-session confirmation
  whenever an agent tries to write a confirm- or admin-tier path from
  `governance/write-policy.yaml`.
- **Auto-commit / auto-merge** (`.claude/hooks/auto-commit.sh`, **ships disabled**) commits
  each turn's work and can merge it into `main`, scoped by the same tiers the write-guard
  enforces — protected paths are held back and reported, never swept in. Switches live in
  the `settings:` block of `write-policy.yaml`. Turn it on when the team wants the
  "agents write and commit directly" default to be literally true; leave it off to keep a
  human shaping every commit.

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
   product-development/product/handbook/templates/**
   governance/write-policy.yaml
   governance/write-back-contract.md
   governance/code-grounding.md
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
`governance/health/`.

## Branch protection (admin tier only)

Settings → Branches → rule for `main` — needed only if you want PR review enforced for
admin-tier changes when push rulesets aren't available. With a push ruleset in place,
day-to-day auto-tier commits go straight to `main` and nothing here is required.

## Capture integrations (optional, later)

The ingest engine (`/context-update`) is source-agnostic: anything pasted in chat folds
immediately via `/process-meeting`, and any tool that can drop a file can deliver
transcripts by writing them into **`product-development/inbox/`** (arrival contract in
that folder's CLAUDE.md) — the next sweep gates them and `/process-meeting` files them to
their canonical `transcripts/` home. An integration that already knows the destination
(account slug, meeting type) may write straight into that `transcripts/` folder instead;
the sweep treats both the same. Schedulers stay thin, the skill stays the engine.

Concrete bridge, works with any transcription tool (Zoom, Fireflies, Otter, Granola,
Meet, Teams): a small n8n / Make / Zapier flow on the tool's "recording completed"
webhook that fetches the transcript, converts it to `.md`/`.txt` (e.g. from `.vtt`), and
commits it into `product-development/inbox/` via the GitHub API. A Slack emoji-trigger
that files a thread the same way is the same pattern.

## Weekly digest — one runner, idempotent

`/weekly-review --digest` is the weekly team report (decisions, customer insights,
feature-request status, initiative movement). It is safe to automate because it is
**idempotent by design**: the output is one file per ISO week
(`product/reports/{YYYY}-W{XX}-weekly-review.md`), updated in place within the week —
duplicate or concurrent runs converge on the same file, and past weeks are never
rewritten.

**Single-runner rule:** exactly ONE scheduled run per team, owned by the steward
(`write-policy.yaml#steward`) — never one cron per teammate, never a job tied to a
personal laptop. The steward's task is registered here so nobody duplicates it; everyone
else runs `/weekly-review` manually whenever they like.

| Registered runner | Kind | Owner | Cadence |
|---|---|---|---|
| `team-os-weekly-digest` | Claude Code scheduled task on the steward's machine — runs while the app is open; a missed Friday fires on next launch (harmless: the digest is week-idempotent) | steward | Fridays 16:00 |

A missed-run catch-up is fine, but if the team wants a runner tied to no machine at all,
switch to the GitHub Action below and delete the scheduled task — never run both.

The task's prompt: run `/weekly-review --digest` for the current ISO week; write/update
the week's digest file in place; include the feature-request lines from
`product-development/product/customers/feature-requests/`; post Part A via the team
messenger MCP when one is connected (Slack, Teams), otherwise note "not posted — repo
record only"; never edit confirm-tier files headlessly (file a proposal in
`governance/proposals/` instead); end with the run summary listing every
path written.

**Team-neutral alternative — GitHub Action** (runs server-side under the repo, tied to no
personal account). Add an `ANTHROPIC_API_KEY` repo secret, then:

```yaml
# .github/workflows/weekly-digest.yml
name: weekly-digest
on:
  schedule:
    - cron: "0 14 * * 5" # Fridays 14:00 UTC — adjust to your timezone
  workflow_dispatch:
permissions:
  contents: write
jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: >
            Run /weekly-review --digest for the current ISO week per
            .claude/skills/weekly-review/SKILL.md, headless rules. Commit only the
            files you wrote, prefix "context:".
```

**Pick exactly one** — the scheduled task OR the Action, never both: two runners means
two writers racing on the same weekly file.
