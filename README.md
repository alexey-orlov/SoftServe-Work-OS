# Team OS

A shared knowledge base for a product team — structured so both humans and AI agents can find things without searching.

Authored and maintained by [SoftServe](https://www.softserveinc.com).

## Start Here

| You are… | Read |
|---|---|
| New to the team | [os-installation/first-session-checklist.md](os-installation/first-session-checklist.md) |
| Setting up your machine | [os-installation/installation-guide.md](os-installation/installation-guide.md) |
| Looking for a feature's artifacts | [product-development/product/initiatives/](product-development/product/initiatives/) — the initiatives whose `features:` frontmatter targets it |
| Checking which features exist, and their status | [product-development/feature-index.yaml](product-development/feature-index.yaml) |
| Wondering how the repo is organized | [CLAUDE.md](CLAUDE.md) |

## What's In Here

- **52 skills** in `.claude/skills/` — invoke with `/{skill-name}`, grouped into 8 use-case groups in [.claude/skills/CLAUDE.md](.claude/skills/CLAUDE.md). Seven are canonical Team OS skills (`/context-update` — the ingest engine, `/wiki-lint` — the health engine, `/feature-launch-gate`, `/weekly-review`, `/process-meeting`, `/decision-log-entry`, `/portfolio-pulse`); the rest cover the wider PM workflow.
- **The self-updating loop**: every writing skill closes with the same write-back steps ([governance/write-back-contract.md](governance/write-back-contract.md)); a write policy ([governance/write-policy.yaml](governance/write-policy.yaml)) marks the few steering files that need human confirmation; session hooks brief every session and guard protected paths; a GitHub Action lints on every PR and weekly.
- **9 reviewer personas** in `.claude/agents/reviewers/` — powering `/prd-challenge` and `/job-spec-challenge`.
- **7 strategy frameworks** in `product-development/product/strategy/frameworks/` — 7 Powers, JTBD, growth loops, PLG iceberg, counter-positioning, hook-retain-expand, AI product strategy.
- **9 templates** in `product-development/product/handbook/templates/` — PRD, retro, launch checklist, interview, initiative page, competitor teardown, competitive area matrix, jobs breakdown, job spec.
- **4 writing guides** in `product-development/product/handbook/writing-guides/` — by audience.

## Conventions

1. Summaries first, raw transcripts in subfolders.
2. Every folder has a `CLAUDE.md`. Append new entries to the end of its list when you add files — never re-sort.
3. Run `/feature-launch-gate` before anything ships; `/wiki-lint` catches drift between launches.
4. New knowledge goes through `/context-update` — it routes by type, updates pages and indexes, and ledgers what it processed.

See [CLAUDE.md](CLAUDE.md) for the full doc index, governance rules, and the privacy contract.

## First-Run Setup

1. Fill [product-development/product/strategy/business-context/business-info.md](product-development/product/strategy/business-context/business-info.md) — company, product, ICP, pricing, market.
2. Mirror its highlights into the **Company & Product Fundamentals** block in [CLAUDE.md](CLAUDE.md). That block loads every session and is what stops Claude giving generic answers.
3. Fill the team roster and Slack channel tables in [CLAUDE.md](CLAUDE.md), this quarter's goals in [product-development/product/strategy/current-quarter.md](product-development/product/strategy/current-quarter.md), and the steward name in [governance/write-policy.yaml](governance/write-policy.yaml).
4. Replace `[Your Product]` throughout. Keep or replace the worked example (`billing` area + the three example initiatives) — it demos a PASS and a BLOCKED launch gate.
5. `git init && git add . && git commit -m "Initialize Team OS"` (skip if cloned), then `chmod +x .claude/hooks/*.sh` — the next session opens with the team briefing.
6. Once pushed to GitHub: enable enforcement per [os-installation/claude-code/scheduled-governance.md](os-installation/claude-code/scheduled-governance.md).

## License

SoftServe intellectual property — use as-is, not for resale, no guarantees. See [LICENSE](LICENSE).
