# Scheduled Governance — enforcement once the repo is on a server

The wiki keeps itself honest through three stacked layers. Each alone is bypassable; a
violation has to slip past all three. Everything below is inert until the repo is pushed
to a remote (GitHub or Azure Repos).

**Start here if you are the admin:** `../admin-setup-github.md` or
`../admin-setup-azure-devops.md` — the short step-by-step (two roles, permissions, the one
rule on `main`) that puts the recommended Layer 2 in place. This page is the background:
what each layer does, why it is shaped that way, and the optional variants.

## Layer 1 — In-session (ships working, no setup)

- **Session-start briefing** injects recent decisions, quarter priorities, active
  initiatives, team learnings, the latest health report, and the fold backlog.
- **Write-guard** (`.claude/hooks/write-guard.sh`) forces an in-session confirmation
  whenever an agent tries to write a gated path from
  `governance/write-policy.yaml`.
- **Auto-sync** (`.claude/hooks/auto-commit.sh`, off until `/auto-sync on`) commits each
  turn's work and pushes to origin — scoped by the same gated list the write-guard
  enforces. Two landing strategies (`settings → auto-merge → strategy` in
  `write-policy.yaml`): the *direct* ones commit on `main` and hold gated paths back,
  uncommitted, for the steward; the *pr* strategy (for a pull-request-only `main` — the
  recommended server setup below) works on a branch per checkout, drains everyday commits
  to `main` through self-merging pull requests, and keeps gated commits on the branch
  until the person says "propose the gated changes" (`/propose`; on GitHub the desktop
  Create PR button is equivalent). Flip with `/auto-sync on direct|pr` / `off`
  (`/customize-os` asks which mode once per instance). Leave it off to keep a human
  shaping every commit.

Limit: hooks bind agent sessions only — not a human in a text editor, not bash
redirection. That's what layers 2–3 are for. Details: `.claude/hooks/session-start.md`.

## Layer 2 — Server-side rule on `main` (recommended, both platforms)

`main` is pull-request-only; the one path-scoped rule is "a pull request that touches a
gated path needs an OS-admin's approval"; admins bypass. Everyday work still lands by itself
because Claude Code opens and merges those pull requests. Concretely — GitHub: a branch
ruleset (require pull request, 0 approvals, *require review from Code Owners*) with
`.github/CODEOWNERS` generated from the write policy; Azure Repos: one *Automatically
included reviewers* policy (Required, path filter generated from the write policy). Both
mirrors come from `.github/scripts/gated-paths.sh`; the weekly lint flags CODEOWNERS drift;
`/propose` reminds the Azure admin to refresh the path filter when the gated list changes
(or the optional pipeline `../gated-policy-sync.azure-pipelines.yml` does it). Steps:
`../admin-setup-github.md` · `../admin-setup-azure-devops.md`.

Why not "push anywhere except these folders": neither platform has path-level push
permissions that leave the pull-request branch open. Azure Repos has no path permissions
at all and any required policy makes the branch PR-only; GitHub's push ruleset (below)
blocks the gated paths on *every* branch and the fork network, so a non-admin cannot even
push the branch a proposal would come from. The Claude Code desktop **Create PR** button
(GitHub only) refuses on `main` and on a dirty tree — the pr strategy keeps the session
branch clean and off `main`, which is exactly what makes the button usable as the propose
step.

## Layer 2b — GitHub-only alternative: push ruleset (hard stop, no pull requests for gated paths)

GitHub **push rulesets with file-path restrictions** block ANY push — direct-to-main
included — that touches listed paths, unless the pusher is on the bypass list.
Availability: private/internal repos on GitHub Team plan or above (GA since Sept 2024).

Setup: repo → Settings → Rules → Rulesets → *New push ruleset*:

1. **Bypass list**: the repo steward (see `write-policy.yaml#steward`) and any trusted bot.
2. **Restrict file paths** — paste the output of `.github/scripts/gated-paths.sh
   --format ruleset` (the gated list from `governance/write-policy.yaml` in the ruleset's
   fnmatch dialect).
3. Enforcement: Active.

The ruleset is a manual mirror of the gated list — when you change the registry, refresh
the ruleset (the weekly audit needs no sync, it derives its list from the policy at run
time). It blocks matching pushes on EVERY branch (and across the fork network), so a
non-bypass teammate cannot even stage a PR touching these paths — their channel is a
proposal file in `governance/proposals/`, which the steward applies (their bypass lets
them push) and then deletes. Auto-tier work pushes straight to `main` with no ceremony
(direct auto-sync strategies). Choose this over Layer 2 only when "no pull requests for
gated paths at all" is what you want; it does not combine with the pr strategy.

**No Team plan?** Rulesets (Layer 2 and 2b) need GitHub Team or Enterprise for private
repos. On Free, fall back to layers 1 + 3, or classic branch protection (below).

## Layer 3 — Audit: the wiki-lint Action (ships in the repo)

`.github/workflows/wiki-lint.yml` runs `.github/scripts/wiki-lint.sh`:

- **On every PR** — mechanical checks fail the PR before review: nav coverage both
  directions, broken links, feature-index ↔ disk (incl. initiative slugs), ledger
  integrity, truncation scan, YAML parse.
- **Weekly (Mon 06:00 UTC) + manual dispatch** — same checks plus the **gated-path
  audit**: every commit from the last 8 days that touched a gated path (list derived
  from `write-policy.yaml` at run time), posted into a rolling "Weekly wiki-lint
  report" issue for the steward to review.

The script implements the mechanical subset of `.claude/skills/wiki-lint/SKILL.md` — the
skill is the spec of record; change a check there and the script in the same PR. The
judgment checks (staleness triage with owners, contradiction sweep, initiative health)
run via `/wiki-lint` in a session, which writes dated reports to
`governance/health/`.

## Classic branch protection (GitHub Free, or pre-ruleset setups)

Settings → Branches → rule for `main`: *Require a pull request before merging* + *Require
review from Code Owners* (approvals 0), with `os-admins` allowed to bypass — the same shape
as the Layer 2 ruleset, on the older mechanism. Pair it with the pr strategy exactly as in
`../admin-setup-github.md`; only the ruleset screen differs.

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

The task's prompt: run `/weekly-review --digest` for the current ISO week per
`.claude/skills/weekly-review/SKILL.md` (the skill owns what the digest contains);
write/update the week's digest file in place; post Part A via the team
messenger MCP when one is connected (Slack, Teams), otherwise note "not posted — repo
record only"; never edit gated files headlessly (file a proposal in
`governance/proposals/` instead — the inbox itself sits under gated `governance/`, so
read the headless note in `write-policy.yaml`'s header before enabling any runner); end
with the run summary listing every path written.

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
