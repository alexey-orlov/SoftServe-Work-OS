---
initiatives: [[initiative-slug]]
features: []
---

# PRD Template

> **How to use:** Copy this template for your initiative as `PRDs/{area}/{initiative-slug}-prd.md` — one PRD per initiative (a feature's history is its initiatives' PRDs); the area folder is the initiative's primary area. Fill the frontmatter above (link contract: `governance/link-schema.yaml`). Delete sections that don't apply. Expand sections as the PRD matures through stages. For guided creation, run `/prd-draft` in Claude Code — it drafts, marks gaps, and tracks readiness run over run.
>
> **Stage guidance:** Start short. A Team Kickoff PRD is 300-500 words. A Launch Readiness PRD is 1500-2000 words. Expand as you learn, not before.
>
> **Gap convention:** Never leave a section silently thin. A claim with no evidence behind it gets an explicit marker: `[GAP: what's missing — how to close it]` (e.g. `[GAP: no churn baseline — run /retention-analysis]`). `/wiki-lint` ages these markers and `/feature-launch-gate` blocks a launch while any remain.

---

## 0) Meta

| Field | Value |
|-------|-------|
| **Feature / Experiment** | [Name] |
| **DRI (PM)** | [Your name] |
| **Initiative** | [link to `product/initiatives/{slug}.md`] |
| **Stage** | Draft / Team Kickoff / Planning Review / XFN Kickoff / Solution Review / Launch Readiness / Impact Review |
| **Last Updated** | [Date] |
| **Status** | Draft / In Review / Approved / Shipped |
| **Links** | [Figma]() | [Prototype]() | [Tracking]() | [Dashboard]() | [Runbook]() |

---

## 1) Customer Value

**Segments** (who exactly — from `strategy/business-context/segmentation-matrix.md`):
[Vertical / size band / use case, with the account count and ARR behind it. "Everyone" is not a segment.]

**Problem** (2 sentences max):
[What user pain exists? Be specific about who feels it.]

**Frequency** (how often it bites):
[Per user or per account, per day/week/month — with the source. "Often" is not a frequency.]

**Criticality** (how badly it hurts):
[What it costs them when it hits — lost money, lost time, risk, workflow dead-end. Severity from research, not adjectives.]

**Today's alternative** (what they do about it now):
[Workaround, spreadsheet, competitor, or nothing-and-suffer. This is what the solution must beat — see section 4.]

**Supporting Evidence:**
- [User quote or data point]
- [User quote or data point]

---

## 2) Business Value

**Strategy Fit:**
This supports [specific strategic bet/pillar] because [why now, not later].

**Hypothesis:**
If we [build X], then [Y metric] will [change by Z], because [assumption about user behavior].

**Key hypotheses** — at most 5, ranked; the beliefs this bet rests on. Full inventory: [`reviews/{initiative-slug}-assumption-map.md`](reviews/{initiative-slug}-assumption-map.md).

| Hypothesis | Risk lens | Confidence | Validation route | Priority |
|------------|-----------|------------|------------------|----------|
| [Falsifiable statement — one observation could break it] | Desirability / Viability / Feasibility / Usability | High / Med / Low | [the cheapest probe that moves the belief, and who runs it] | 1 |

> Rows come FROM `/assumption-map` — it owns surfacing, rating, and ranking; this table is the headline, never the method. Import its **Test First** rows first (they take the top priorities), then its *kill criterion + monitor* rows (validation route = the threshold you would watch) until you reach five — past five, the map is where they belong. Priority is the validate-first rank (1 = first), not a scope tier. `/prd-draft` refreshes the table whenever the map is the newer file. No map yet → one row per hypothesis you can state, each carrying `[GAP: unranked — run /assumption-map]`. Lens vocabulary: the map's **Value** category is **Desirability** here — same lens, PRD-side name; a map run in initiative mode adds Ethics, Go-to-Market, Strategy & Objectives and Team & Org — those keep their own names in this column.

**Impact by lever** — name **at most two primary levers**; mark the rest "not what this bet is for." Each named lever needs a number built as *reach × baseline × expected change* (method: `/impact-sizing`); a lever with no baseline gets a `[GAP:]`, not a guess.

| Lever | Primary? | Estimate | Basis |
|-------|----------|----------|-------|
| Acquisition | yes / no / not this bet | [new accounts / conversion Δ] | [source or `[GAP:]`] |
| Activation | yes / no / not this bet | [Δ in reaching value] | [source or `[GAP:]`] |
| Retention | yes / no / not this bet | [ARR retained] | [source or `[GAP:]`] |
| Expansion / LTV | yes / no / not this bet | [ARR added] | [source or `[GAP:]`] |
| Cost to serve | yes / no / not this bet | [cost avoided] | [source or `[GAP:]`] |

---

## 3) Scope and Non-Goals

**In Scope:**
- [What we're building in v1]
- [And this]

**Non-Goals** (max 3):
- [What we're NOT doing] -- [why]
- [What we're NOT doing] -- [why]

**Tradeoffs Accepted:**
- [e.g., +200-300ms latency for improved precision]
- [e.g., Manual config for v1, self-serve later]

---

## 4) Solution

**Key Elements:**
- [The 2-4 elements that make this solution work — what it is, not how it's coded]

**Why this beats today's alternative** (the alternative named in section 1):
- [When and for whom our solution wins over the current workaround/competitor — and when it doesn't]

**User Flow:**
1. [Step 1: User does X]
2. [Step 2: System responds with Y]
3. [Step 3: User completes Z]

**Edge Cases:**
- [Edge case]: [How we handle it]

**Mockup/Prototype:** [Link or embed]

### AI Behavior Contract

> **Include this sub-section for AI/ML features only** (and drop User Flow above if the contract covers it). Full guidance: `.claude/skills/prd-draft/reference/ai-prd.md`.

| Dimension | Specification |
|-----------|--------------|
| **Primary Task(s)** | summarize / extract / classify / generate / route |
| **Inputs Available** | [fields, context, tools, RAG sources] |
| **Constraints and Guardrails** | [brand voice, privacy rules, compliance] |
| **Disallowed** | [PII echo, policy violations, jailbreak classes] |
| **Params (if fixed)** | temperature, max tokens, tool call policy |
| **Latency Budget** | P50: [X]ms / P95: [Y]ms |

**Behavior Examples:**

| Scenario | User Input | Expected Output | Rejection Criteria |
|----------|------------|-----------------|-------------------|
| Happy path | [Example] | [What should happen] | N/A |
| Edge case | [Example] | [Graceful handling] | N/A |
| Should reject | [Example] | [Error/refusal message] | [Why rejected] |

---

## 5) Success Metrics and Evaluation

**Primary Metric:**
- Metric: [name]
- Baseline: [current value]
- Target: [goal]
- Timeline: [when we expect impact]

**Guardrail Metrics** (must not harm):
- [Metric]: [acceptable range]
- [Metric]: [acceptable range]

**Kill Criteria:**
If [specific condition], we will [rollback/pause/iterate].

**Metrics Summary by Level** (leadership / handoff view — full vetted definitions live in `analytics/metrics/{area}/` via `/feature-metrics`; link, don't restate. Level names are the OS default — use your org's own from `business-info.md` → Metric Reporting Conventions when defined):

| Level | Metric | Baseline (source) | Target | Frequency |
|-------|--------|-------------------|--------|-----------|
| Outcome — business result | [e.g., logo retention, revenue impact] | [value (source)] | [goal] | [e.g., monthly] |
| Product — adoption & engagement | [primary metric] ★ | [value (source)] | [goal] | [e.g., weekly] |
| Quality — stability & performance | [e.g., error rate, load time] | [value (source)] | [acceptable range] | [e.g., daily] |

Every level carries at least one metric — an empty level gets a `[GAP:]`, not a blank row. ★ = the primary metric defined above.

### Evaluation Plan (for AI features or experiments)

| Type | Detail |
|------|--------|
| **Offline eval** | [metric(s), golden set size, target (e.g., F1 >= 0.85)] |
| **Human review** | [sample size, quality target (e.g., >= 4/5)] |
| **Online eval** | [primary metric(s), guardrails, MDE, duration] |
| **Graduate when** | [thresholds] |
| **Fail action** | [rollback criteria or iterate plan] |

---

## 6) Rollout Plan

**Approach:** A/B Test / Phased Rollout / Full Launch

| Phase | Audience | Duration | Pass Criteria |
|-------|----------|----------|---------------|
| Phase 1 | [who, % traffic, segments] | [duration] | [metrics to hit] |
| Phase 2 | [expand to] | [duration] | [metrics to hit] |
| GA | [everyone] | Ongoing | [steady-state monitoring] |

**Eligibility Rules:** [who qualifies, randomization unit]

**Ramp Gates:** [what must be true to advance each phase]

**Comms:** [release notes, in-product messaging, support docs]

---

## 7) Risks and Recovery

| Risk | Detection | Fallback | Kill Switch |
|------|-----------|----------|-------------|
| [e.g., Hallucination] | [signal, threshold, alert] | [deterministic path or previous model] | [where, who owns] |
| [e.g., PII leakage] | [signal, threshold, alert] | [human handoff] | [where, who owns] |
| [e.g., Performance degradation] | [latency spike > Xms] | [disable feature flag] | [where, who owns] |

---

## 8) Owners and Next Steps

**DRI:** [PM name]
**Reviewers:** [Eng], [DS], [Design], [Legal/Sec], [Support]

**Open Questions:**
- [ ] [Question] -- @[owner]
- [ ] [Question] -- @[owner]

> `/prd-challenge` writes its ranked unverified assumptions here — each with the next research step and its owner. Questions, not beliefs: the standing hypothesis list lives in section 2's Key hypotheses table.

**Next Milestones:**

| Target Date | Milestone | Exit Criteria |
|-------------|-----------|---------------|
| [date] | [milestone] | [what must be true] |
| [date] | [milestone] | [what must be true] |

---

## 9) Appendix

**Changelog:**

| Date | Change | Who |
|------|--------|-----|
| [date] | [what changed] | [name] |

**Impact Sizing Detail** (funnel feeding section 2's reach numbers):

| Funnel Stage | Users | Drop-off Reason |
|-------------|-------|-----------------|
| See feature | [number] | -- |
| Eligible | [number] | [reason] |
| Engage | [number] | [friction] |
| Complete | [number] | [friction] |

**Alternatives Considered** (options *we* evaluated and rejected — not the customer's current alternative, which lives in section 1):
- [Alternative A]: Not doing because [reason]
- [Alternative B]: Not doing because [reason]

**Meeting Notes:** [Link to relevant meeting notes or paste key excerpts]

---

## PRD Quality Checklist

> The single quality checklist — `/prd-draft` checks against it before presenting a draft; use it yourself before sharing. Check items relevant to your current stage.

### Every stage (hygiene)
- [ ] Filename is `{slug}-prd.md`, saved under `product-development/product/PRDs/{area}/` (not `examples/`)
- [ ] Registered: folder CLAUDE.md row appended; feature-index entry proposed; initiative page created or updated
- [ ] Word count matches the stage (see Stage guidance at top)
- [ ] Every thin section carries an explicit `[GAP:]` marker, not silence
- [ ] Sounds human — read it aloud; specific numbers and quotes, no corporate filler

### Planning Stage
- [ ] Problem clearly defined in 1-2 sentences
- [ ] Segment named with account count / ARR behind it
- [ ] Frequency and criticality stated with a source
- [ ] Today's alternative described (what the solution must beat)
- [ ] Hypothesis is testable ("If we... then... because...")
- [ ] Key hypotheses table filled — each row lensed, rated, routed, and ranked (imported from the assumption map, or `[GAP:]`-marked)
- [ ] At most two primary impact levers named, others marked "not this bet"
- [ ] Qualitative evidence included (user quotes, research)
- [ ] Competitive landscape surveyed
- [ ] Gaps in understanding identified with owners and deadlines

### Kickoff Stage
- [ ] Solution mock or description added
- [ ] Why-we-beat-the-alternative stated (when we win, when we don't)
- [ ] North-star, secondary, and guardrail metrics defined
- [ ] Metrics summary covers every level (default: outcome / product / quality), each metric with a baseline source and measurement frequency — thin levels marked `[GAP:]`
- [ ] Impact sizing modeled (reach × baseline × change, per named lever)

### Solution Review Stage
- [ ] Edge cases documented
- [ ] Rollout plan specified (experiment vs. full launch)
- [ ] XFN requirements outlined
- [ ] Tracking and analytics requirements specified
- [ ] Go-to-market strategy addressed
- [ ] Risks and mitigation identified
- [ ] Non-goals are specific, each with a why
- [ ] `/prd-challenge` run; its ranked assumptions sit in Open Questions with owners

### Launch Readiness Stage
- [ ] All eng concerns addressed
- [ ] Design files complete
- [ ] Tickets created and estimated
- [ ] GTM teams enabled (sales, marketing, CS)
- [ ] User adoption plan ready (not just build it)
- [ ] Financial costs reviewed
- [ ] Kill criteria and rollback plan documented — would the team actually pull the plug at this threshold?
- [ ] QA/test plan ready
- [ ] No `[GAP:]` markers remain (the launch gate blocks on them)

### Impact Review Stage
- [ ] No blind spots that would make you regret shipping
- [ ] Statistical analysis passes sniff test
- [ ] Continuous monitoring plan in place
- [ ] Improvement ideas captured for future iteration

---

> **Tip:** You don't need every section at every stage. A Team Kickoff PRD might only have sections 0, 1, 2, and 8. Expand as the feature matures. The checklist tells you what to add at each stage.
