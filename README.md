# Team OS

A shared knowledge base for a product team — structured so both humans and AI agents can find things without searching.

Authored and maintained by [SoftServe](https://www.softserveinc.com). Personal context, career material, and machine-local credentials are deliberately kept out — everything here is team-safe.

## Start Here

| You are… | Read |
|---|---|
| New to the team | [os-installation/first-session-checklist.md](os-installation/first-session-checklist.md) |
| Setting up your machine | [os-installation/installation-guide.md](os-installation/installation-guide.md) |
| Looking for a feature's artifacts | [product-development/feature-index.yaml](product-development/feature-index.yaml) |
| Wondering how the repo is organized | [CLAUDE.md](CLAUDE.md) |

## What's In Here

- **50 skills** in `.claude/skills/` — invoke with `/{skill-name}`, grouped into 8 use-case groups in [.claude/skills/CLAUDE.md](.claude/skills/CLAUDE.md). Six are canonical Team OS skills (`/feature-launch-gate`, `/freshness-check`, `/weekly-synthesis`, `/customer-call-summary`, `/decision-log-entry`, `/portfolio-pulse`); the rest cover the wider PM workflow.
- **7 reviewer personas** in `.claude/agents/reviewers/` — powering `/prd-review-panel`.
- **7 strategy frameworks** in `product-development/product/strategy/frameworks/` — 7 Powers, JTBD, growth loops, PLG iceberg, counter-positioning, hook-retain-expand, AI product strategy.
- **6 templates** in `product-development/product/processes/templates/` — PRD, roadmap, OKR, retro, launch checklist, interview.
- **4 writing guides** in `product-development/product/processes/writing-guides/` — by audience.

## Conventions

1. Summaries first, raw transcripts in subfolders.
2. Every folder has a `CLAUDE.md`. Update it when you add files.
3. Run `/feature-launch-gate` before anything ships.

See [CLAUDE.md](CLAUDE.md) for the full doc index and the privacy contract.

## First-Run Setup

1. Fill [product-development/product/strategy/business-context/business-info.md](product-development/product/strategy/business-context/business-info.md) — company, product, ICP, pricing, market.
2. Mirror its highlights into the **Company & Product Fundamentals** block in [CLAUDE.md](CLAUDE.md). That block loads every session and is what stops Claude giving generic answers.
3. Fill the team roster and Slack channel tables in [CLAUDE.md](CLAUDE.md), and this quarter's goals in [product-development/product/strategy/current-quarter.md](product-development/product/strategy/current-quarter.md).
4. Replace `[Your Product]` throughout.
5. `git init && git add . && git commit -m "Initialize Team OS"`

## License

SoftServe intellectual property — use as-is, not for resale, no guarantees. See [LICENSE](LICENSE).
