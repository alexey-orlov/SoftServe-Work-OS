# Skills

49 skills, invoked as `/{skill-name}`. Grouped below by use-case block; each skill carries its group in the `group:` frontmatter key.

**Read this when:** You want to know what `/`-commands this repo provides, or you are adding one.

## Layout is deliberately flat

Every skill sits **directly** under `.claude/skills/{skill-name}/SKILL.md`. Do not move skills into group subfolders — Claude Code scans exactly one level deep and takes the `/`-command from the directory name, so a skill at `.claude/skills/{group}/{skill}/SKILL.md` is **not discovered at all** (it silently disappears from autocomplete rather than degrading). Grouping therefore lives in this index and in the `group:` frontmatter key, not in the directory tree.

When you add a skill: create `.claude/skills/{name}/SKILL.md`, set `group:` to one of the eight groups below, and add a line to that group here.

## Groups

| Group | Covers | Skills |
|-------|--------|--------|
| [`communication-ops`](#communication--ops) | Meeting processing, decision logging, status updates and digests, personal planning. | 11 |
| [`definition`](#definition) | Strategy, PRDs, metric definitions, impact sizing, experiment design, and the critique passes that stress-test them. | 15 |
| [`delivery`](#delivery) | Turning a spec into tickets, code and a shipped launch — plus what the shipped code actually does, and triaging what comes back in. | 6 |
| [`discovery-market`](#discovery-market-analysis) | Competitor teardowns, market environment scans, sizing. | 1 |
| [`discovery-customers`](#discovery-customers) | Interview prep and cross-interview synthesis. | 2 |
| [`discovery-analytics`](#discovery-product-analytics) | Retention, activation and funnel reads against the warehouse. | 2 |
| [`prototyping`](#prototyping) | Sketches, clickable prototypes, handoff specs, journey maps. | 5 |
| [`os-admin`](#os-admin--governance) | Setting the OS up, and keeping the repo honest before and after a feature ships. | 7 |

### Communication & ops

`group: communication-ops` — Meeting processing, decision logging, status updates and digests, personal planning.

- [daily-plan/](daily-plan/) — Generate PM daily plan with context
- [decision-doc/](decision-doc/) — Document important product decisions. Creates decision logs with rationale, alternatives, and trade-offs
- [decision-log-entry/](decision-log-entry/) — Record a team decision with reasoning, options, and tradeoffs. Two variants — full entry for debated decisions, quick entry for fast ones
- [meeting-agenda/](meeting-agenda/) — Create structured meeting agendas for effective collaboration
- [meeting-feedback/](meeting-feedback/) — Post-meeting effectiveness feedback and continuous improvement
- [portfolio-pulse/](portfolio-pulse/) — Exec-grade daily / weekly synthesis across all managed accounts and active features. Rolls up account health, risks, expansion signals, top 3 priorities, and drafted Slack messages
- [slack-message/](slack-message/) — Draft team communications for Slack. Creates clear, actionable messages for different contexts
- [status-update/](status-update/) — Generate stakeholder status updates. Creates clear, concise progress reports for different audiences
- [weekly-plan/](weekly-plan/) — Set next week's priorities
- [weekly-review/](weekly-review/) — Close out the week: the initiative-spine team digest (absorbs weekly-synthesis; `--digest` = cron-safe Part A) + your execution review
- [process-meeting/](process-meeting/) — One entry point for every meeting record: customer calls, interviews, internal meetings, retros, batch days — transcript filed, summary written, records routed, ledger updated

### Definition

`group: definition` — Strategy, PRDs, metric definitions, impact sizing, experiment design, and the critique passes that stress-test them.

- [assumption-map/](assumption-map/) — Surface every assumption a plan rests on, then rank them by impact-if-wrong and uncertainty to decide what to test first
- [define-north-star/](define-north-star/) — Identify and validate your North Star Metric. Aligns product strategy with key business metric
- [expansion-strategy/](expansion-strategy/) — Upsell, cross-sell, and account growth tactics. Framework for revenue expansion
- [experiment-decision/](experiment-decision/) — Decide when to A/B test vs just ship. Framework for experiment planning and prioritization
- [experiment-metrics/](experiment-metrics/) — STEDII framework for selecting trustworthy experiment metrics. Ensures metric validity and reliability
- [feature-metrics/](feature-metrics/) — Define success metrics using the STEDII framework for trustworthy experiment metrics
- [impact-sizing/](impact-sizing/) — Quantify feature value with driver trees, confidence levels, and the 4-step sizing framework
- [metrics-framework/](metrics-framework/) — Set up leading vs lagging indicators for product decisions. Framework for metric selection and tracking
- [prd-draft/](prd-draft/) — Create a modern, AI-era PRD for features and initiatives. Guides through clarifying questions, generates draft, and offers multi-agent review
- [prd-review-panel/](prd-review-panel/) — Multi-agent PRD review (7 perspectives)
- [pre-mortem/](pre-mortem/) — Rehearse the failed launch before it happens. Imagines the launch failed, generates risks across five categories, classifies them as Tigers (real — act), Paper Tigers…
- [ralph-wiggum/](ralph-wiggum/) — Devil's advocate PRD/document reviewer with humor and sharp critique
- [red-team/](red-team/) — Attack the load-bearing claims of a PRD, strategy, or decision doc before reality does
- [strategy-sprint/](strategy-sprint/) — Create product strategy in 1 day, 1 week, or 1 month timeframes. Progressive strategy development framework
- [write-prod-strategy/](write-prod-strategy/) — Product strategy docs using 7-component framework

### Delivery

`group: delivery` — Turning a spec into tickets, code and a shipped launch — plus what the shipped code actually does, and triaging what comes back in.

- [code-first-draft/](code-first-draft/) — Initial feature implementation
- [create-tickets/](create-tickets/) — Create tickets via Linear/Jira MCP or generate formatted ticket text
- [feature-results/](feature-results/) — Post-launch analysis and results documentation. Document what shipped and what we learned
- [launch-checklist/](launch-checklist/) — Comprehensive product launch planning
- [prioritize-requests/](prioritize-requests/) — Cluster inbound customer feature requests by the job behind them, size demand by distinct accounts, and route every theme to act now, collect signal, decline, or park
- [code-qa/](code-qa/) — Answer product questions from the code itself, PM-language and concise; evidence with repo@sha citations kept internal, shown on request

### Discovery: market analysis

`group: discovery-market` — Competitor teardowns, market environment scans, sizing.

- [competitor-analysis/](competitor-analysis/) — Deep competitive analysis + ongoing monitoring. Checks user research for competitor mentions, sales notes, existing analysis. Integrates with retention-analysis and user-research-synthesis

### Discovery: customers

`group: discovery-customers` — Interview prep and cross-interview synthesis. (Per-interview and call processing live in `/process-meeting`, communication-ops.)

- [interview-guide/](interview-guide/) — Create JTBD-based interview guides for user research. Structured questions for discovery interviews
- [user-research-synthesis/](user-research-synthesis/) — Turn user interviews into actionable insights. Advanced synthesis techniques and frameworks

### Discovery: product analytics

`group: discovery-analytics` — Retention, activation and funnel reads against the warehouse.

- [activation-analysis/](activation-analysis/) — Analyze user activation using Setup → Aha → Habit framework. Identifies activation bottlenecks
- [retention-analysis/](retention-analysis/) — Cohort analysis and retention optimization framework. Identifies retention drivers and churn factors

### Prototyping

`group: prototyping` — Sketches, clickable prototypes, handoff specs, journey maps.

- [generate-ai-prototype/](generate-ai-prototype/) — Generate v0.dev, Lovable, or Bolt.new prompts for AI-powered prototyping
- [journey-map/](journey-map/) — Create user journey maps and customer journey maps (dual mode)
- [napkin-sketch/](napkin-sketch/) — ASCII wireframes + browser capture for design matching
- [prototype/](prototype/) — Advanced prototyping (Artifacts/Figma/Lovable/v0/Bolt)
- [prototype-feedback/](prototype-feedback/) — Build → review → iterate prototype workflow. Structured feedback collection and iteration

### OS admin & governance

`group: os-admin` — Setting the OS up, and keeping the repo honest before and after a feature ships.

- [connect-mcps/](connect-mcps/) — Connect MCPs for real-time tool integration
- [feature-launch-gate/](feature-launch-gate/) — Pre-launch repo completeness check. Verifies PRD, RFCs, metrics, queries, schemas, decisions, and feature-index entry exist before a feature ships
- [freshness-check/](freshness-check/) — Deprecation stub — superseded by /wiki-lint (staleness is check #1 there); kept one release for muscle memory
- [upgrade-to-team-os/](upgrade-to-team-os/) — Upgrade any personal OS (PM, engineering, design, analytics, ops, exec, multi-role) into a Team OS
- [context-update/](context-update/) — The ingest engine: fold transcripts, pasted threads, documents, and session facts into the wiki — routed by type, navigation and indexes updated, everything ledgered
- [wiki-lint/](wiki-lint/) — The health engine: eleven checks (staleness, nav coverage, broken refs, index drift, mirror consistency, code-grounding registry drift, …); dated reports to `_meta/health/`; `--fix` repairs mechanical drift only
- [connect-code/](connect-code/) — Register product repos, set up local clone access (machine-local, read-only), and generate SHA-stamped codebase maps; --refresh keeps them current

## Gaps

Work the eight groups above don't cover yet — candidates if you are adding skills:
go-to-market (positioning & messaging, monetization & pricing, GTM & growth planning), and
within Definition: opportunity/solution discovery, backlog prioritization, business model design.
