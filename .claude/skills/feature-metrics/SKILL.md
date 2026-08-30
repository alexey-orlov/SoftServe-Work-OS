---
name: feature-metrics
description: Define a feature's success metrics — primary metric, guardrails, kill criteria — each vetted against six checks (sensitive, timely, easy to understand, directional, implementable, independent). Writes the definitions to analytics/metrics/{area}/. NOT for validating experiment metrics — that is /experiment-metrics (the STEDII framework); this skill defines what success means for a feature.
argument-hint: "[feature]"
group: definition
---

# /feature-metrics - Define Success Metrics

Define what success means for a feature, and vet every metric against six checks.

**Boundary:** this skill defines a feature's success metrics; `/experiment-metrics` (STEDII) validates metrics for experiment trustworthiness. Both write to `analytics/metrics/{area}/` under different filename prefixes.

## Context Routing Logic (Internal - for Claude)

**Automatic Context Checks:**
When this skill is invoked, immediately check:

| Source | Files/Folders | Search Terms | What to Extract |
|--------|---------------|--------------|-----------------|
| Current PRD | `product-development/product/PRDs/{area}/*.md` | feature name from chat | Hypothesis, problem statement, user impact |
| Business Info | `product-development/product/strategy/business-context/business-info.md` | business model, growth stage, metrics, reporting conventions | Product strategy, current North Star, metric reporting conventions (level names, required fields, artifact name) |
| Metrics Context | `product-development/analytics/metrics/{area}/*.md` | baseline numbers, historical data | Current metric baselines, ranges |
| Strategy | `product-development/product/strategy/*.md` | feature related to strategic pillar | Strategic fit and expected outcomes |
| Meetings | `product-development/product/meetings/*/summaries/*.md` | feature name, "success metrics" | Stakeholder expectations, past decisions |

**Context Priority:**
1. Current PRD and feature context FIRST
2. Business model and strategy SECOND
3. Historical metrics and baselines THIRD
4. Stakeholder expectations FOURTH

**Cross-Skill Links:**
- If feature is part of larger product strategy → Link to `/write-prod-strategy`
- If testing this feature → Link to `/experiment-decision` and `/experiment-metrics`
- If metric is North Star related → Link to `/define-north-star`
- If sizing impact → Link to `/impact-sizing` for usage estimates
- If tracking retention → Link to `/retention-analysis` for cohort analysis

---

## When to Use

- Defining success criteria for a new feature
- Setting up an A/B test
- Creating a PRD metrics section
- Validating existing metrics

---

## Step 0: Understanding Current State

Before we define metrics, the skill checks what context already exists...

**Checking:**
- `product-development/product/PRDs/{area}/` for any existing PRD for this feature
- `product-development/product/strategy/business-context/business-info.md` for your product model
- `product-development/analytics/metrics/{area}/` for historical baseline data
- `product-development/product/strategy/` for strategic context
- `product-development/product/meetings/` for stakeholder expectations

**[If feature PRD exists]:** "I found your [Feature Name] PRD from [date]. It mentions [hypothesis/goal]. Let me use that as context."

**[If metrics exist]:** "I found historical data: [Metric] baselines are currently [values]. I'll use this as reference."

**Based on what found, This skill surfaces:**

### What We Know About This Feature

**Strategic Context:**
- [How this feature fits into your Q# strategy / roadmap]
- [Expected user impact: # of users affected]
- [Business outcome: revenue/retention/engagement impact]

**Current Baselines:**
- [Relevant historical metrics for comparison]
- [Product stage: early-stage feature / mature feature / existing metric improvement]

**Success Expectations:**
- [From stakeholder meetings: what they're expecting]
- [From user research: what users need]
- [From business model: what drives your North Star]

### Questions to Clarify Before Selecting Metrics

1. **Feature Scope:** Is this a small UX improvement, new capability, or major feature overhaul?
2. **User Segment:** Who is this feature for? All users, specific segment, or internal teams?
3. **Impact Type:** Are we trying to drive growth, engagement, retention, monetization, or efficiency?
4. **Experiment Timeline:** How long can we run the test? (This affects which metrics we can use)
5. **Business Context:** What's more important right now - speed or certainty?

---

## The Six Checks

Every good metric should pass all six:

### S - Sensitive
Can the metric detect changes from your feature?
- Will it move meaningfully with expected impact?
- Is the sample size sufficient?

### T - Timely
How quickly does the metric respond?
- Can you measure it within your experiment window?
- Leading indicators > lagging indicators

### E - Easy to Understand
Can stakeholders interpret it?
- Avoid complex calculations
- Clear cause and effect

### D - Directional
Is improvement clear?
- Up = good or Down = good? Be explicit
- Avoid metrics where direction is ambiguous

### I - Implementable
Can you actually track it?
- Data exists or can be collected
- Engineering effort is reasonable
- When `engineering/code-repos.yaml` lists a reachable repo covering the area, verify the event/property actually exists in code (`/code-qa`) — a metric on an uninstrumented event is a launch-week surprise

### I - Independent
Does it avoid external factors?
- Seasonality effects?
- Other experiments running?

---

## Quick Start Prompt

When PM types `/feature-metrics`, respond:

```
Let's define metrics for your feature. I'll vet each against the six checks.

Tell me:
1. What feature are we measuring?
2. What user behavior does it change?
3. What business outcome do we expect?

I'll help you select primary metrics, guardrails, and kill criteria.
```

---

## Metric Types

### Primary Metric
The one metric that defines success.
- Directly tied to feature goal
- Must pass all six checks
- Single source of truth for go/no-go

### Guardrail Metrics
Metrics that must NOT get worse.
- Protect against unintended harm
- Set acceptable ranges (not targets)
- Examples: page load time, error rate, support tickets

### Kill Criteria
When to stop the experiment early.
- Serious negative impact threshold
- Safety concerns
- Automatic rollback triggers

---

## The Leveled Reporting View

Primary / guardrails / kill criteria is the working discipline. Leadership reviews and
handoff docs read the same metrics a second way — as a leveled summary:

| Level (OS default) | What it holds | Fed by |
|--------------------|---------------|--------|
| **Outcome** — business result | Post-launch tracking of the PRD's Business Value hypothesis (retention, revenue impact, NPS) | PRD Business Value section, `/impact-sizing` baselines, North Star ladder |
| **Product** — adoption & engagement | The primary metric (★) plus supporting usage metrics | This skill's six-check selection |
| **Quality** — stability & performance | The guardrails (error rate, latency, support volume) | Guardrail table |

Rules:
- **Org naming wins.** The level names above are the OS default. If `business-info.md` → "Metric Reporting Conventions" defines the org's own tier names, extra required per-metric fields, or a house name for the summary artifact, use those — the structure stays, the labels follow the org.
- **Every level carries at least one metric.** An empty level is a `[GAP: no outcome metric — pull from PRD Business Value / run /impact-sizing]`, never a silent blank.
- **One primary, still.** The leveled view does not dilute the single-primary discipline — ★ marks the primary inside its level (usually Product).
- **Quality targets are ranges.** Guardrail rows carry their acceptable range, not an improvement goal.

---

## Output Template

```markdown
# Feature Metrics: [Feature Name]

## Primary Metric
**Metric:** [Name]
**Definition:** [Exactly how it's calculated]
**Current baseline:** [X]
**Target:** [Y] ([+/- Z%])
**Timeline:** [When we expect to see impact]

**Six checks:**
- [x] Sensitive - [why]
- [x] Timely - [why]
- [x] Easy to understand - [why]
- [x] Directional - [up/down = good]
- [x] Implementable - [data source]
- [x] Independent - [controls for]

## Guardrail Metrics
| Metric | Acceptable Range | Why It Matters |
|--------|------------------|----------------|
| [Metric 1] | [range] | [protects against] |
| [Metric 2] | [range] | [protects against] |

## Kill Criteria
If any of these occur, immediately rollback:
- [Metric] drops below [threshold]
- [Metric] increases above [threshold]
- [Qualitative signal] occurs

## Measurement Plan
- **Data source:** [where data comes from]
- **Tracking:** [how it's implemented]
- **Dashboard:** [where to monitor]
- **Review cadence:** [how often to check]

## KPI Summary — Leveled View
_Same metrics, arranged for leadership review and handoff. Levels are the OS default —
org tier names / extra fields come from `business-info.md` → Metric Reporting Conventions when defined._

| Level | Metric | Definition | Baseline | Baseline source | Target | Frequency |
|-------|--------|------------|----------|-----------------|--------|-----------|
| Outcome | [business-result metric] | [how calculated] | [X] | [system/table] | [Y] | [cadence] |
| Product | [primary metric] ★ | [how calculated] | [X] | [system/table] | [Y] | [cadence] |
| Quality | [guardrail metric] | [how calculated] | [X] | [system/table] | [acceptable range] | [cadence] |

★ = primary metric. Every level has ≥1 metric or an explicit `[GAP:]` row.
```

---

## Common Metric Pairs

| Feature Type | Primary Metric | Common Guardrails |
|--------------|----------------|-------------------|
| Growth | Signups, Activation | Retention, Quality |
| Engagement | DAU, Sessions | Load time, Errors |
| Revenue | Conversion, ARPU | Refunds, Churn |
| Retention | D7/D30 retention | NPS, Support tickets |
| Efficiency | Task completion | Time on task, Errors |

---

## Output Integration

### Where Files Go

**Feature metrics definitions:**
- Saved to: `product-development/analytics/metrics/{area}/feature-metrics-[feature-name]-[date].md` — the one canonical location (the launch gate checks this folder)
- Referenced from: the PRD's Success Metrics section (link, don't restate)
- Fed to: `/experiment-decision` for the A/B-test-vs-ship call

### Link to Other Work

After defining metrics:
- **Reference in PRDs** - "Success is defined as [primary metric] reaching [target]"
- **Use in experiments** - Feature metrics become primary metric in `/experiment-decision`
- **Track progress** - Monitor against baseline in weekly status updates
- **Feed retention analysis** - If tracking retention, pass metric definitions to `/retention-analysis`

### Cross-Skill Integration

**Feeds into:**
- `/experiment-decision` - Primary metric determines test design and duration
- `/feature-results` - Use these metrics to measure actual impact post-launch
- `/impact-sizing` - Use guardrails to validate usage estimates
- `/metrics-framework` - This metric may become a leading indicator for North Star

**Pulls from:**
- `/define-north-star` - Ensure primary metric ladders up to North Star
- `/impact-sizing` - Usage estimates inform what metrics can detect changes
- `product-development/product/strategy/business-context/business-info.md` - Company metrics and baselines

---

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   `CLAUDE.md` (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Declare the artifact's links in its frontmatter per `governance/link-schema.yaml` —
   resolve them YOURSELF from context before filing (initiative-scoped work names its
   one initiative; the initiative page gets the artifact row filled + a dated Activity
   line in the same change). A brand-new feature/area → propose the catalog entry
   (`feature-index.yaml`, gated) in the same confirmed change that registers the work.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.

---

## Tips

- **One primary metric** - Multiple "primary" metrics = no primary metric
- **Guardrails are not goals** - You're not trying to improve them, just protect them
- **Leading > Lagging** - Measure what you can act on quickly
- **Avoid vanity metrics** - Page views don't matter if nobody converts
- **Baseline matters** - Know your current numbers before running experiment
- **Time to signal** - Faster metrics (hours/days) beat slow metrics (months)

---

## Output Quality Self-Check

Before presenting output to the PM, verify:

- [ ] **File saved to correct location:** Output saved to `product-development/analytics/metrics/{area}/feature-metrics-[feature-name]-[date].md`
- [ ] **Context routing table was checked:** Reviewed `product-development/product/PRDs/{area}/` for feature context, `product-development/product/strategy/business-context/business-info.md` for North Star metric, and `product-development/analytics/metrics/{area}/` for existing dashboards and baselines
- [ ] **Metrics pass the six checks:** Each proposed metric is evaluated against all six (sensitive, timely, easy to understand, directional, implementable, independent) with pass/fail reasoning
- [ ] **Primary metric has baseline and target:** The primary metric includes a current baseline number and a specific target value with timeline (not "improve" or "increase")
- [ ] **Guardrail metrics defined:** At least 1 guardrail metric is specified with an acceptable range and explanation of what it protects against
- [ ] **Metrics ladder to North Star:** The output explicitly shows how the primary metric connects upward to the company's North Star metric from `product-development/product/strategy/business-context/business-info.md`
- [ ] **Data source identified for each metric:** Every metric names where the data comes from (e.g., "Amplitude event: task_created" or "database query on users table")
- [ ] **Metric sensitivity estimated:** The output addresses whether the expected feature impact is large enough for the metric to detect, given current variance and traffic
- [ ] **Leveled view complete:** the KPI Summary covers every reporting level (OS default Outcome / Product / Quality — org names from `business-info.md` when defined) with ≥1 metric each or an explicit `[GAP:]`, the primary flagged ★, and every row carrying a baseline source and measurement frequency
