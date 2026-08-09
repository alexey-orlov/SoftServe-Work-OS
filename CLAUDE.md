# [Your Product] — Team OS

Your team's shared knowledge base. Every document, decision, metric definition, and customer insight lives in a structure that AI agents and humans can query.

> Replace `[Your Product]` and the bracketed placeholders below with your actual values during initial setup. Keep this file under ~150 lines — it loads every session.

## Company & Product Fundamentals

> Placeholder values — fill these during setup and keep them current. This block loads every session, so every task starts knowing who we are.

- **Company / product:** [Your Company] — [Your Product], [one sentence: what it does and for whom]
- **Stage & size:** [Seed / Series A / Growth] · [N] employees · [ARR]
- **Primary customer (ICP):** [role] at [company size, industry, geography]
- **Core problem we solve:** [one sentence]
- **Business model:** [subscription / usage-based / marketplace] · [pricing shape — e.g. free tier + 2 paid tiers at $X/user/month]
- **North Star metric:** [metric and its definition]
- **Main competitors:** [A], [B], [C] — teardowns in `product/competitive-research/`
- **This quarter's focus:** [theme] — detail in `product/strategy/current-quarter.md`

**Read `product-development/product/strategy/business-context/business-info.md` in full before any PRD, pricing, positioning, metric-definition, competitive, or strategy work.** The block above is the summary. That file is the source of truth for personas, value proposition, GTM motion, market sizing, and product principles. When the work sizes, weights, or targets customer segments — counts or ARR by vertical, size band, or use case — also read `segmentation-matrix.md` in the same folder; it is the only source for those numbers.

## Team

> Placeholder rows — fill these in from your workspace, and add rows (Designer, Analytics) as the team grows. With a Slack or GitHub MCP connected, `/connect-mcps` can pull most of this for you.

| Function | Team Member | GitHub | Slack ID | After-Hours Escalation |
|----------|-------------|--------|----------|------------------------|
| PM | [Your Name] | `[github]` | `[slack-id]` | [phone or page link] |
| Engineer | [Name] | `[github]` | `[slack-id]` | [phone or page link] |
| Designer | [Name] | `[github]` | `[slack-id]` | — |

## Slack Channels

> Placeholder rows — fill in from your workspace.

| Channel | ID | Visibility | Purpose |
|---------|----|--------|---------|
| `#[team]-general` | `[id]` | Private | Team-wide announcements |
| `#[team]-product` | `[id]` | Private | PRD reviews, roadmap, customer feedback |
| `#[team]-eng` | `[id]` | Private | Engineering discussion, deploys, incidents |

## Doc Index

**When looking up artifacts for a specific feature (PRDs, RFCs, plans, schemas, dashboards, experiments, tickets), check `product-development/feature-index.yaml` first.** It maps every feature to all related artifacts in one place.

### Read Order for Common Queries

Don't load every CLAUDE.md eagerly. Follow these read orders:

| Query | Read order |
|-------|-----------|
| *"What does the company / product actually do?"* | Fundamentals block above → `product/strategy/business-context/business-info.md` for the full picture |
| *"Who are our customers, and what do they pay?"* | `product/strategy/business-context/business-info.md` (ICP, personas, pricing) → `product/customers/accounts/{Y}/` for a named account |
| *"How many accounts / how much ARR sits in segment X (vertical, size band, use case)?"* | `product/strategy/business-context/segmentation-matrix.md` → `product/customers/accounts/portfolio.yaml` for the accounts behind a cell |
| *"Who do we compete with / how do we compare on X?"* | `product/competitive-research/competitive-landscape.md` → `competitive-matrix.md` for capability detail → `competitors/{slug}/teardown.md` for one competitor |
| *"What are this quarter's OKRs / priorities?"* | `product/strategy/current-quarter.md` → `product/strategy/okr-guide.md` only when writing new ones |
| *"Who is stakeholder X, what do they care about, how do I get buy-in?"* | `product/strategy/business-context/stakeholders.md` → Team table above for handles |
| *"What's the state of feature X?"* | `feature-index.yaml#X` → linked PRD, plan, latest experiment / investigation |
| *"What's the state of initiative Y (current work)?"* | `product/initiatives/{slug}.md` → its linked artifacts and decisions |
| *"Starting or stress-testing a new bet / feature?"* | `product/handbook/de-risk-a-bet.md` → the stage skill for your moment |
| *"Process this meeting / call transcript?"* | run `/process-meeting` — files transcript + summary, routes records, updates the ledger |
| *"Something new worth keeping (thread, doc, fact)?"* | run `/context-update` — routes it by type, updates pages, navigation, and the ledger |
| *"Is the repo healthy / what's stale?"* | run `/wiki-lint` → latest report in `governance/health/` |
| *"What did customer Y say last call?"* | `product/customers/accounts/{Y}/calls/summaries/{latest}.md` → transcript only if the summary falls short |
| *"Why did we choose Z?"* | `product/decisions/` → the dated decision file |
| *"How do we calculate metric M?"* | `analytics/metrics/{area}/` → linked query → schema only if column-level detail needed |
| *"Where's the data for X?"* | `analytics/data-catalog.yaml` → schema doc only if needed |
| *"What does the code actually do for feature X (behavior, limits, is it live)?"* | `engineering/code-repos.yaml` → run `/code-qa` — concise PM-language answer, evidence on request |
| *"What framework should I use for this strategy call?"* | `product/strategy/frameworks/` → the named framework |
| *"How should I write this?"* | `product/handbook/writing-guides/{audience}.md` |
| *"I'm new here"* | `os-installation/` → `first-session-checklist.md` |
| *"A transcript / recording arrived — process it"* | paste or path → `/process-meeting`; integration drops land in `product-development/inbox/` → swept by `/context-update` |

| Area | File | Description |
|------|------|-------------|
| Feature index | `product-development/feature-index.yaml` | Master lookup — every feature mapped to its PRDs, plans, experiments, tickets, and current initiatives |
| Initiatives | `product-development/product/initiatives/` | One living page per current work effort — status, artifacts, decisions, open loops in one place |
| Governance | `governance/` | The admin surface — `CLAUDE.md` (system map), `write-policy.yaml` (tier registry), `write-back-contract.md`, `processed.txt` (ingestion ledger), `health/` (lint reports), `proposals/` (pending confirm-tier changes) |
| Write-back contract | `governance/write-back-contract.md` | Mandatory closing steps for every repo-writing skill — how files stay findable |
| Data catalog | `product-development/analytics/data-catalog.yaml` | Warehouse table registry — owner, refresh, upstream, used-by |
| **Business context** | `product-development/product/strategy/business-context/` | `business-info.md` — company, product, ICP, personas, pricing, market, values; `stakeholders.md` — stakeholder profiles and communication preferences; `segmentation-matrix.md` — account counts + ARR by vertical × size band × use-case category. Living masters: edit in place, keep current |
| Product | `product-development/product/CLAUDE.md` | Product context, PRDs, customers, decisions |
| PRDs | `product-development/product/PRDs/` | PRDs by product area, plus worked examples in `examples/` |
| Customers | `product-development/product/customers/CLAUDE.md` | Account folders — context, calls, transcripts |
| Competitive research | `product-development/product/competitive-research/CLAUDE.md` | Competitor matrix and per-competitor teardowns |
| Strategy | `product-development/product/strategy/` | `current-quarter.md` (this quarter's OKRs), `roadmaps/`, `business-context/`, `frameworks/` |
| Decisions | `product-development/product/decisions/CLAUDE.md` | Non-architectural decisions with reasoning |
| Handbook | `product-development/product/handbook/` | How we work — `templates/` (blank scaffolds — copy, don't edit), `writing-guides/` (by audience), `de-risk-a-bet.md` (canonical bet chain) |
| Meetings | `product-development/product/meetings/` | Meeting records — recurring series (standup, sprint planning, bi-weekly — rename to your cadences) + event meetings (`kickoff/`, `stakeholder-review/`, `workshop/`, `other/`), each docs / transcripts / summaries; `retros/` for retrospective writeups |
| Engineering | `product-development/engineering/CLAUDE.md` | Plans, RFCs, bug investigations, code-repo registry + codebase maps (worked example only until real engineering work lands) |
| Analytics | `product-development/analytics/CLAUDE.md` | Metrics, queries, schemas, dashboards, experiments, investigations |
| OS installation | `os-installation/` | Install guide, first-session checklist, Claude Code guides |
| Reviewer personas | `.claude/agents/reviewers/` | Seven review lenses for `/prd-challenge` and `/strategy-sprint` |
| Inbox | `product-development/inbox/` | Integration drop zone — transcripts land here; sweeps gate them, `/process-meeting` files them to their canonical home |
| Feature requests | `product-development/product/customers/feature-requests/` | One dated record per customer request — evidence, draft ticket, tracker push state; pushed by `/create-tickets push` |
| Code repos | `product-development/engineering/code-repos.yaml` | Which repos implement the product — remote, coverage, entry points, deployed ref, access tier; optional SHA-stamped maps in `engineering/codebases/` |
| Reports | `product-development/product/reports/` | Periodic rollups — weekly reviews, portfolio pulses, status updates, batch-day digests; writers split by filename prefix |
| Planning | `product-development/product/planning/` | Daily plans + weekly priorities (`/daily-plan`, `/weekly-plan`); read back by `/weekly-review` for plan-vs-actual |
| Launches | `product-development/product/launches/` | Filled launch checklists and gate records, one per feature — `/launch-checklist` writes here |

## Four Rules

1. **Summaries first, raw data in subfolders.** A one-hour call becomes a 500-token summary in `summaries/`. Raw transcripts sit in `transcripts/` for when the summary isn't enough. Every level of nesting is a context-saving decision.
2. **Every folder has a CLAUDE.md navigation file.** Update it when you add files — append new entries to the END of the list, never re-sort (re-sorting causes merge conflicts; only `/wiki-lint --fix` re-orders).
3. **The repo gets updated before a feature ships.** Run `/feature-launch-gate`. No exceptions. *"The feature is not rolled out until the repository is updated."* Between launches, `/wiki-lint` (weekly + on every PR) catches what slipped.
4. **Corrections become rules.** When the user corrects agent behavior or a durable takeaway surfaces, run the capture loop in `.claude/team-learnings.md` — generalize to the root cause, route by narrowest scope, propose through the write policy.

## Governance

- **Write policy** — `governance/write-policy.yaml` is the single authoritative registry of protected context: **auto** (default — agents write and commit directly), **confirm** (steering files — show the exact before/after and get an in-session yes first; headless runs file a proposal in `governance/proposals/` instead), **admin** (the system's own rules — steward only). Enforced by the write-guard hook; optionally hard-stopped by a GitHub push ruleset; audited weekly. Full map: `governance/CLAUDE.md`.
- **One writer per surface** — table in `governance/write-back-contract.md`.
- **Mirror rule** — the Fundamentals block above summarizes `business-info.md`; whoever changes one updates the other in the same change.
- **Failure visibility** — an automation that can drop work must surface its own failure; a silent success-shaped exit is the bug.
- **Commit prefixes** — `context:` for wiki folds and lint fixes; normal conventions otherwise.

## Privacy Contract

The following content lives in personal OSes only and is **never** committed to this team repo:

- Personal context and working-preference files (`personal-context-*.md`, `working-preferences*.md`)
- Career material — job-interview prep and interview debriefs
- 1:1 notes with direct reports, coaching notes, performance feedback
- Comp, equity, cap-table, and M&A discussions
- Board memos and investor updates
- API keys, warehouse credentials, and machine-local environment setup

If you find any of these in this repo, treat it as an incident: revert the commit, rotate any leaked secrets, notify the owner.

## Where Different Roles Check In Work

| Role | Primary Folders | What to Check In |
|------|----------------|------------------|
| PM | `product/decisions/`, `product/customers/accounts/`, `product/PRDs/`, `product/strategy/` | Decision logs, call summaries, PRDs, strategy |
| Engineer | `engineering/plans/`, `engineering/rfcs/`, `engineering/bug-investigations/` | Plans, RFCs, bug investigations |
| Designer | `product/PRDs/` (rationale sections) | Design rationale, UX findings (design artifacts live in Figma, linked from feature-index) |
| Analyst | `analytics/metrics/`, `analytics/queries/`, `analytics/experiments/`, `analytics/investigations/` | Metric definitions, SQL, experiment results |
| Strategy / Ops | `product/competitive-research/`, `product/strategy/`, `product/handbook/` | Competitive intel, vision docs, conventions |

## Enforcement on GitHub

Once pushed to GitHub, see `os-installation/claude-code/scheduled-governance.md`: the weekly lint Action (PR check + health issue), the push ruleset that hard-stops non-steward changes to protected paths (path list hand-maintained in sync with the write policy), and branch protection for admin-tier changes. Day-to-day auto-tier work commits straight to `main` — no PR required.

## Credits

Authored and maintained by [SoftServe](https://www.softserveinc.com).

Everything in this repository — the structural patterns (`feature-index.yaml`, `data-catalog.yaml`, product-area subfoldering, the SKILL.md folder convention), the skills, strategy frameworks, templates, and reviewer personas — is SoftServe intellectual property. Use as-is, not for resale, no guarantees. See [LICENSE](LICENSE).
