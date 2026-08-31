# Skills

59 skills, invoked as `/{skill-name}`. Grouped below by use-case block; each skill carries its group in the `group:` frontmatter key.

**Read this when:** You want to know what `/`-commands this repo provides, or you are adding one.

## Layout is deliberately flat

Every skill sits **directly** under `.claude/skills/{skill-name}/SKILL.md`. Do not move skills into group subfolders — Claude Code scans exactly one level deep and takes the `/`-command from the directory name, so a skill at `.claude/skills/{group}/{skill}/SKILL.md` is **not discovered at all** (it silently disappears from autocomplete rather than degrading). Grouping therefore lives in this index and in the `group:` frontmatter key, not in the directory tree.

When you add a skill: create `.claude/skills/{name}/SKILL.md`, follow the frontmatter convention below, set `group:` to one of the eight groups below, and add a line to that group here.

## Frontmatter convention

Uniform across all skills — exactly these keys, in this order:

```yaml
---
name: <folder-name>      # display label; the /-command always comes from the folder name
description: <...>       # the routing contract — what it does, when to use it, NOT-for boundaries
argument-hint: "[...]"   # only when the skill takes arguments or flags; always double-quoted
group: <one-of-eight>    # repo convention consumed by this index; Claude Code ignores unknown keys
---
```

- **No restated defaults.** `disable-model-invocation` and `user-invocable` are omitted: every skill here is deliberately both user- and model-invocable — descriptions are the natural-language router, cron runs (`/weekly-review --digest`, `/wiki-lint`) and skill-to-skill orchestration (`/prd-challenge`, `/context-update` → `/process-meeting`) require model invocation, and `disable-model-invocation: true` would also drop the description from context and block scheduled/subagent use. Set a non-default flag only when a new skill genuinely needs it (external side effects on explicit user timing → `disable-model-invocation: true`; background knowledge with no meaningful command → `user-invocable: false`) and record the reason here.
- **Description budget:** Claude Code truncates skill listings at 1,536 characters — keep the NOT-for tail inside the cap (largest today: job-spec-draft at ~1,530).
- **`argument-hint` is always double-quoted** — unquoted `[...]` parses as a YAML list.
- **No other keys.** `group` is the only custom key; if tooling ever needs machine-readable extras, use the Agent Skills spec's `metadata:` map instead of new top-level keys.

## Groups

| Group | Covers | Skills |
|-------|--------|--------|
| [`communication-ops`](#communication--ops) | Meeting processing, decision logging, status updates and digests, personal planning. | 13 |
| [`definition`](#definition) | Strategy, PRDs, metric definitions, impact sizing, experiment design, and the critique passes that stress-test them. | 17 |
| [`delivery`](#delivery) | Turning a spec into tickets, code and a shipped launch — plus what the shipped code actually does, and triaging what comes back in. | 7 |
| [`discovery-market`](#discovery-market-analysis) | Competitor teardowns, market environment scans, sizing. | 1 |
| [`discovery-customers`](#discovery-customers) | Interview prep and cross-interview synthesis. | 2 |
| [`discovery-analytics`](#discovery-product-analytics) | Retention, activation and funnel reads against the warehouse. | 2 |
| [`prototyping`](#prototyping) | Sketches, clickable prototypes, prototype critique and feedback rounds, journey maps. | 5 |
| [`os-admin`](#os-admin--governance) | Setting the OS up, and keeping the repo honest before and after a feature ships. | 12 |

### Communication & ops

`group: communication-ops` — Meeting processing, decision logging, status updates and digests, personal planning.

- [daily-plan/](daily-plan/) — Generate PM daily plan with context
- [decision-doc/](decision-doc/) — Deliberate a decision BEFORE it's made: options, tradeoffs, recommendation, sign-off routing; files the record via decision-log-entry once decided
- [decision-log-entry/](decision-log-entry/) — Record a decision AFTER it's made: reasoning, options, tradeoff, who was in the room. Full and quick variants
- [meeting-agenda/](meeting-agenda/) — Create structured meeting agendas for effective collaboration
- [meeting-feedback/](meeting-feedback/) — Post-meeting effectiveness feedback and continuous improvement
- [portfolio-pulse/](portfolio-pulse/) — Exec-grade daily / weekly synthesis across all managed accounts and active features. Rolls up account health, risks, expansion signals, top 3 priorities, and drafted Slack messages
- [slack-message/](slack-message/) — Draft team communications for Slack. Creates clear, actionable messages for different contexts
- [status-update/](status-update/) — Generate stakeholder status updates. Creates clear, concise progress reports for different audiences
- [weekly-plan/](weekly-plan/) — Set next week's priorities
- [weekly-review/](weekly-review/) — Close out the week: the initiative-spine team digest (absorbs weekly-synthesis; `--digest` = cron-safe Part A) + your execution review
- [process-meeting/](process-meeting/) — One entry point for every meeting record: customer calls, interviews, internal meetings, retros, batch days — transcript filed, summary written, records routed, ledger updated
- [retag-transcript/](retag-transcript/) — Correct a filed transcript's tag frontmatter (customers, areas, features, initiatives, themes) — the only sanctioned edit path for raw-material filing metadata; every change logged in tag-amendments, body untouched
- [overview/](overview/) — One-screen orientation for any slug (area / feature / initiative), read-only in chat: status, active work + open loops, customer signal, the numbers, dated decisions, a 5-item read-next path; `onboarding {area}` adds the new-PM extras

### Definition

`group: definition` — Strategy, PRDs, metric definitions, impact sizing, experiment design, and the critique passes that stress-test them.

- [assumption-map/](assumption-map/) — Surface every assumption a plan rests on, then rank them by impact-if-wrong and uncertainty to decide what to test first
- [define-north-star/](define-north-star/) — Identify and validate your North Star Metric. Aligns product strategy with key business metric
- [expansion-strategy/](expansion-strategy/) — Upsell, cross-sell, and account growth tactics. Framework for revenue expansion
- [experiment-decision/](experiment-decision/) — Decide when to A/B test vs just ship. Framework for experiment planning and prioritization
- [experiment-metrics/](experiment-metrics/) — STEDII framework for validating experiment metrics (trustworthiness before an A/B test) — not for defining feature success
- [feature-metrics/](feature-metrics/) — Define a feature's success metrics (primary, guardrails, kill criteria), vetted against six checks — not for experiment validity
- [impact-sizing/](impact-sizing/) — Quantify feature value by business lever (acquisition / activation / retention / expansion-LTV / cost to serve): reach × baseline × expected change, every factor sourced or [GAP:]-marked. The one forecasting skill
- [metrics-framework/](metrics-framework/) — Set up leading vs lagging indicators for product decisions. Framework for metric selection and tracking
- [prd-draft/](prd-draft/) — The PRD loop: exploratory asks stay conversational (nothing filed until told to); first runs stop at one intake checkpoint (open questions + write plan), then draft and iterate the PRD as the living spine of a bet — [GAP:] markers, up to 3 auto-closers where sources exist, a readiness readout ending with every file touched
- [prd-challenge/](prd-challenge/) — The one challenge command: every critique lens (/assumption-map, /red-team, 7 personas, /pre-mortem when a solution exists) in parallel, one deduplicated report led by the ranked unverified assumptions
- [pre-mortem/](pre-mortem/) — Rehearse the failed launch before it happens. Imagines the launch failed, generates risks across five categories, classifies them as Tigers (real — act), Paper Tigers…
- [red-team/](red-team/) — Attack the load-bearing claims of a PRD, strategy, or decision doc before reality does
- [strategy-sprint/](strategy-sprint/) — Create product strategy in 1 day, 1 week, or 1 month timeframes. Progressive strategy development framework
- [write-prod-strategy/](write-prod-strategy/) — Product strategy docs using 7-component framework
- [jobs-breakdown/](jobs-breakdown/) — Cut an agreed initiative into shippable jobs: backbone, gated + sequenced job table with dependency rationale; the definition→delivery bridge, part one
- [job-spec-draft/](job-spec-draft/) — The per-job buildable contract between PRD and tickets: variation scan, four sweep subagents, grounded priorities, research routing, eng-confirmation list; the spec file's one writer — accepted challenge verdicts fold back through it
- [job-spec-challenge/](job-spec-challenge/) — The one challenge command for a job spec: S1–S4 sweeps + the three-amigos panel (PO/BA, QA Lead, Eng Lead) + conditional legal/designer seats, parallel and blind, one deduplicated report with a readiness-for-tickets verdict; never edits the spec

### Delivery

`group: delivery` — Turning a spec into tickets, code and a shipped launch — plus what the shipped code actually does, and triaging what comes back in.

- [code-first-draft/](code-first-draft/) — First-pass implementation of a PRD in the product codebase (or a standalone reference impl when none is connected)
- [create-tickets/](create-tickets/) — Turn an agreed PRD or job spec into dev-backlog tickets (job specs preferred when they exist), or push feature-request records as intake tickets — tracker MCP or text fallback
- [feature-results/](feature-results/) — Post-launch analysis and results documentation. Document what shipped and what we learned
- [launch-checklist/](launch-checklist/) — Prioritized, dependency-mapped launch plan (small / major / regulatory), importing the pre-mortem's launch-blocking risks
- [prioritize-requests/](prioritize-requests/) — Cluster inbound customer feature requests by the job behind them, size demand by distinct accounts, and route every theme to act now, collect signal, decline, or park
- [code-qa/](code-qa/) — Answer product questions from the code itself, PM-language and concise; evidence with repo@sha citations kept internal, shown on request
- [pm-handoff/](pm-handoff/) — Readiness gate for the PM → BA/TPM/PO requirements handoff: four checks (open/unvalidated items, prototype links, approval status, template completeness) over a whole feature or one job; ✅/❌ checklist + READY/NOT READY verdict, reports only, saves a dated record on request

### Discovery: market analysis

`group: discovery-market` — Competitor teardowns, market environment scans, sizing.

- [competitor-analysis/](competitor-analysis/) — Deep competitive analysis + ongoing monitoring. Checks user research for competitor mentions, sales notes, existing analysis. Integrates with retention-analysis and user-research-synthesis

### Discovery: customers

`group: discovery-customers` — Interview prep and cross-interview synthesis. (Per-interview and call processing live in `/process-meeting`, communication-ops.)

- [interview-guide/](interview-guide/) — Create JTBD-based interview guides for user research. Structured questions for discovery interviews
- [user-research-synthesis/](user-research-synthesis/) — Cross-interview synthesis over the tagged transcript archive: scope by topic, slug (--initiative/--area/--feature/--customer), or --hypothesis (evidence for/against + verdict); mandatory coverage readout with near-miss retag offers; Mom-Test-weighted themes saved to user-insights/{topic}-{date}.md

### Discovery: product analytics

`group: discovery-analytics` — Retention, activation and funnel reads against the warehouse.

- [activation-analysis/](activation-analysis/) — Analyze user activation using Setup → Aha → Habit framework. Identifies activation bottlenecks
- [retention-analysis/](retention-analysis/) — Cohort analysis and retention optimization framework. Identifies retention drivers and churn factors

### Prototyping

`group: prototyping` — Sketches, clickable prototypes, prototype critique and feedback rounds, journey maps.

- [journey-map/](journey-map/) — Create user journey maps and customer journey maps (dual mode)
- [napkin-sketch/](napkin-sketch/) — ASCII wireframes + browser capture for design matching
- [prototype/](prototype/) — Build a clickable prototype grounded in the job spec/PRD — routed by the recorded approach in `product-development/toolchain.yaml` (Figma / design MCP / Claude Design / screenshots / external prompts / plain HTML), Figma-first when unrecorded; token-faithful HTML audited by scripts/audit_tokens.py
- [prototype-feedback/](prototype-feedback/) — Apply review feedback to an existing prototype: triage → batched decisions → surgical edits → audit → disposition log; spec changes route to the spec's writer
- [prototype-challenge/](prototype-challenge/) — Single-pass critique of a built prototype, read-only: token audit, spec-alignment table, usability heuristics, eng/design/user lenses, prioritized must/should/nice report

### OS admin & governance

`group: os-admin` — Setting the OS up, and keeping the repo honest before and after a feature ships.

- [connect-mcps/](connect-mcps/) — Connect MCP tool servers (analytics, PM, research, docs, design) one at a time or in batch; detects already-live connections (Settings › Connectors counts) and skips to wiring, else suggests the app's connector directory, then `claude mcp add`, local server, manual auth; wires the benefiting skills + CLAUDE.md routing registry
- [feature-launch-gate/](feature-launch-gate/) — Pre-launch repo completeness check, run per initiative — derives its checklist from the initiative page's rows; on PASS it is the catalog's sole status writer (planned → live + shipped date)
- [context-update/](context-update/) — The ingest engine: fold transcripts, pasted threads, documents, and session facts into the wiki — routed by type, navigation and indexes updated, everything ledgered
- [wiki-lint/](wiki-lint/) — The health engine: eleven checks (untouched pages, folder contents lists, links that lead nowhere, feature-index gaps, facts that disagree in two places, code-registry freshness, …); fixes mechanical drift by default and lists everything else as plain-language suggestions with an owner and a suggested change — nothing else changes without a yes; dated reports to `governance/health/`; `--report-only` looks without touching
- [connect-code/](connect-code/) — Register product repos, set up local clone access (machine-local, read-only), and generate SHA-stamped codebase maps; --refresh keeps them current
- [session-retro/](session-retro/) — End-of-session sweep of the live conversation for durable takeaways + the curation pass (team-learnings cap, entry staleness, stale proposals); routes per the contract table, admin targets by steward yes or proposal
- [auto-sync/](auto-sync/) — One switch for hands-off git, two modes: `direct` (open main — non-gated committed + pushed every turn, gated held for the steward) and `pr` (pull-request-only main — branch per person, non-gated drained via self-merging PRs, gated via /propose); on [direct|pr] | off | status
- [customize-os/](customize-os/) — The guided setup program, interactive and resumable: populate the steering context from the org's real documents (manifest-driven — every item ends filled, GAP, or N/A; optional web enrichment), create initiative pages and fold their material, set the design-system and user-insights choices in `toolchain.yaml`, assess demo readiness (delegating `/demo-data`), resolve artifact naming repo-wide, derive house PRD / jobs-breakdown / job-spec templates from examples, and close with the auto-sync mode + a plain-language gated-list walkthrough; installs gated in customer instances only, state persists in os-installation/customization-status.md, every run ends with a changed-what-where + Critical/Other readout
- [propose/](propose/) — The "propose" step of the pr landing strategy: turns the gated commits auto-sync kept on your branch into ONE pull request with a plain-language description (files, why, commits, the Azure path-filter reminder when the gated list changed) via gh or az repos; --draft / --ready / --update; on GitHub the desktop Create PR button is the equivalent
- [docs-update/](docs-update/) — The one way into the customer-facing documentation in `Documentation/`: edit mode applies a requested change to the single source (`src/content.js`) in the docs' own vocabulary and conventions, sync mode checks every stated fact against its source of truth in the repo (write policy, skills index, agents, hooks, admin guides, connection skills) and corrects what went stale — never adding articles unasked; both rebuild the site, verify, and report article › section
- [demo-data/](demo-data/) — Small, internally consistent synthetic demo data for a customer instance: scenario approved before anything is written, raw artifacts run through the real pipeline (`/process-meeting`, `/context-update`) so records stay consistent by construction, everything `[DEMO]`-marked and manifest-recorded; `remove` reverses the manifest exactly
- [demo-showcase/](demo-showcase/) — The spec-driven demo builder for a whole demo instance: reads a scenario spec (invocation + expected outcome per scenario), plans and generates the data each scenario needs through the real pipeline, then **evals** — runs every scenario exactly as the presenter will and writes a pass/fail run log with evidence, bucketing failures into data gap / skill behaviour / wrong expectation; sandbox mode leaves no visible `[DEMO]` marking while the manifest keeps removal exact; optional presenter deck, one slide per passing scenario

## Gaps

Work the eight groups above don't cover yet — candidates if you are adding skills:
go-to-market (positioning & messaging, monetization & pricing, GTM & growth planning), and
within Definition: opportunity/solution discovery, backlog prioritization, business model design.
