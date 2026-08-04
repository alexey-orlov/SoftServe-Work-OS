---
name: impact-sizing
description: Quantify feature value with driver trees, confidence levels, and the 4-step sizing framework.
disable-model-invocation: false
user-invocable: true
group: definition
---

# /impact-sizing - Quantify Feature Value

Systematically estimate the impact of a feature using the 4-step framework.

## Context Routing Logic (Internal - for Claude)

**Automatic Context Checks:**
When this skill is invoked, immediately check:

| Source | Files/Folders | Search Terms | What to Extract |
|--------|---------------|--------------|-----------------|
| Current PRD | `product-development/product/PRDs/{area}/*.md` | feature name from chat | User impact, problem severity |
| User Research | `product-development/product/customers/*.md` | feature problem, user quotes | Addressable users, pain severity |
| Business Model | `product-development/product/strategy/business-context/business-info.md` | pricing, revenue model, TAM | Revenue impact drivers |
| Segment Mix | `product-development/product/strategy/business-context/segmentation-matrix.md` | vertical, size band, use case | Account counts and ARR per segment — the denominators for eligible-accounts and revenue math |
| Historical Data | `product-development/analytics/metrics/{area}/*.md` | similar features, baseline conversion | Reference adoption rates |
| Strategy | `product-development/product/strategy/*.md` | feature strategic fit | Resource availability, priority context |

**Context Priority:**
1. Feature definition and user impact FIRST
2. Business model and pricing SECOND
3. User base size and addressable segment THIRD
4. Historical precedent for similar features FOURTH

**Cross-Skill Links:**
- If sizing is unclear → Link to `/impact-sizing` (this skill)
- If comparing options → Use this to inform `/experiment-decision`
- If building business case → Reference in PRD and `/write-prod-strategy`
- If identifying leading metrics → Connect to `/feature-metrics` and `/metrics-framework`

---

## Step 0: Understanding What We're Sizing

Before we estimate impact, the skill checks what context exists...

**Checking:**
- `product-development/product/PRDs/{area}/` for the feature definition
- `product-development/product/customers/` for user research on this problem
- `product-development/product/strategy/business-context/business-info.md` for business model context
- `product-development/product/strategy/business-context/segmentation-matrix.md` for account counts and ARR by segment (sizing denominators)
- `product-development/analytics/metrics/{area}/` for comparable feature data

**Based on what found, This skill surfaces:**

### What We Know About This Feature

**Feature Definition:**
- [What problem does it solve?]
- [Who does it affect? Total addressable users: X]
- [User segment: SMB / Enterprise / Consumer / etc.]

**User Impact:**
- [Problem severity: from user research]
- [Expected behavior change: what users do differently]
- [Current workaround cost: time/money users waste today]

**Business Context:**
- [Revenue model: how does this make money?]
- [Existing similar features: what was their adoption?]
- [Resource constraints: time/team availability]

### PM-Specific Diagnosis Questions

1. **Addressability:** Can you reach the entire user population, or only a segment?
2. **Adoption Curve:** Will this be immediate adoption or gradual ramp?
3. **Monetization:** Is this a direct revenue play or indirect (retention/expansion)?
4. **Confidence:** What data do you have vs what are you assuming?
5. **Execution Risk:** What could go wrong with adoption or implementation?

---

## When to Use

- Prioritizing features in planning
- Justifying resource allocation
- Building business cases for executives
- Comparing multiple feature options

---

## The 4-Step Framework

### Step 1: Estimate Usage (Funnel)

Create a funnel from exposure to usage:

```
Total users who see feature: [number]
    ↓ (Drop-off: [reason])
Users eligible for feature: [number]
    ↓ (Drop-off: [reason])
Users who engage: [number]
    ↓ (Drop-off: [reason])
Users who complete action: [number]
```

**Gotchas to consider:**
- How many users are actually eligible?
- How often will users be exposed?
- What's the expected adoption curve?

### Step 2: Calculate Impact

Progress through three levels:

**Engagement Impact:**
- DAU/MAU change
- Retention rate change
- Session frequency/duration

**Top-Line Impact:**
- Revenue change
- GMV change
- Conversion rate change

**Bottom-Line Impact:**
- Contribution margin
- Customer acquisition cost
- Lifetime value change

### Step 3: Identify & De-Risk Assumptions

For each assumption, assess risk and plan mitigation:

| Assumption | Confidence | Risk | De-risking Action |
|------------|------------|------|-------------------|
| [Assumption] | High/Med/Low | [Risk if wrong] | [Action] |

**Common de-risking actions:**
- Old data → Work with analytics for fresh numbers
- Driver-tree input assumes existing instrumentation → confirm the events exist in code (`/code-qa`, when `engineering/code-repos.yaml` is set up); otherwise record it as an assumption, not a given
- Usability question → Test with prototype
- Similar to competitors → Benchmark research
- Industry standard → Collect benchmarks

### Step 4: Define Takeaways

Three buckets:

1. **Planning:** Use for prioritization decisions
2. **Experiment Execution:** Determine experiment duration for stat sig
3. **Feature Design:** Identify levers to increase impact

---

## Quick Start Prompt

When PM types `/impact-sizing`, respond:

```
Let's size the impact of your feature. I'll walk you through the 4-step framework.

**Step 1: Estimate Usage**
- What feature are we sizing?
- Who sees this feature? (total addressable users)
- What are the steps from seeing → using?

Once you share this, I'll help build the funnel and calculate impact.
```

---

## Output Template

```markdown
# Impact Sizing: [Feature Name]

## Usage Funnel
| Stage | Users | Drop-off Rate | Reason |
|-------|-------|---------------|--------|
| See feature | [X] | - | - |
| Eligible | [X] | [Y%] | [reason] |
| Engage | [X] | [Y%] | [reason] |
| Complete | [X] | [Y%] | [reason] |

## Impact Estimates

**Engagement Impact:**
- Metric: [metric]
- Current: [baseline]
- Expected change: [+/- X%]
- Confidence: [High/Med/Low]

**Top-Line Impact:**
- Metric: [revenue/GMV]
- Expected change: [$X / +Y%]
- Confidence: [High/Med/Low]

**Bottom-Line Impact:**
- Metric: [margin/LTV]
- Expected change: [$X / +Y%]
- Confidence: [High/Med/Low]

## Confidence Assessment
| Assumption | Confidence | De-risking Action |
|------------|------------|-------------------|
| [assumption] | [level] | [action] |

## Recommendation
[Proceed / De-risk first / Deprioritize]
Rationale: [why]
```

---

## Driver Tree Example

Connect feature to business metrics:

```
Feature: [Name]
    ↓
[Engagement metric] +X%
    ↓
[Conversion metric] +Y%
    ↓
[Revenue metric] +$Z
    ↓
[Profit metric] +$W
```

---

## Output Integration

### Where Files Go

**Impact sizing analysis:**
- Active work: `product-development/analytics/investigations/{area}/impact-sizing-[feature-name]-[date].md`
- When finalized: Reference in PRD in `Strategic Fit` section
- Archive: Move to `product-development/product/PRDs/{area}/` as historical reference when feature ships

### Link to Other Work

After sizing impact:
- **Reference in PRD** - "Users affected: X, revenue impact: $Y, confidence: [High/Med/Low]"
- **Use in prioritization** - Helps decide if this should be in Q# roadmap
- **Support pitches** - Share with executives when requesting resources
- **Inform metrics** - Use impact estimates to set success metric targets

### Cross-Skill Integration

**Feeds into:**
- `/prd-draft` - Impact sizing goes into "Strategic Fit" section
- `/write-prod-strategy` - Feature impact informs strategic pillar priorities
- `/feature-metrics` - Usage estimates inform what metrics can detect changes
- `/experiment-decision` - Impact size determines experiment duration/sample size

**Pulls from:**
- `product-development/product/customers/` - User pain and adoption patterns
- `/user-research-synthesis` - Qualitative insights about addressable users
- `product-development/product/strategy/business-context/business-info.md` - Business model and growth drivers
- `product-development/product/strategy/business-context/segmentation-matrix.md` - Account counts and ARR per segment for eligible-population math
- `product-development/analytics/metrics/{area}/` - Historical data on similar features

---

## Write-back (mandatory)

After saving, close the loop — full contract: `.claude/references/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   `CLAUDE.md` (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Feature-scoped artifact → propose the `product-development/feature-index.yaml` addition
   and apply it only after the user confirms (Tier 2 in `_meta/write-policy.yaml`).
   Initiative-scoped → link the artifact from `product-development/product/initiatives/{slug}.md`.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.

---

## Tips

- **Do the amount that fits your world** - Few weeks? Address top assumption. More time? Go deeper.
- **Never done** - You can always upgrade the model as you learn more
- **Connect to what matters** - Executives care about revenue/profit, not engagement metrics alone
- **Validate assumptions** - The biggest unknowns are usually adoption rate and addressable market
- **De-risking matters** - Knowing what you don't know is worth more than precise wrong estimates

---

## Output Quality Self-Check

Before presenting output to the PM, verify:

- [ ] **File saved to correct location:** Output saved to `product-development/analytics/investigations/{area}/impact-sizing-[feature-name]-[date].md`
- [ ] **Context routing table was checked:** Reviewed `product-development/product/strategy/business-context/business-info.md`, `product-development/product/strategy/business-context/segmentation-matrix.md`, `product-development/product/strategy/`, and `product-development/analytics/metrics/{area}/` for relevant context
- [ ] **Driver tree has specific numbers:** Every node in the driver tree contains actual estimates (not placeholders like "[X]" or "[number]")
- [ ] **Confidence levels assigned:** Each assumption in the confidence assessment table has a High/Med/Low rating with justification
- [ ] **Revenue/user impact calculated with clear methodology:** Impact estimates show the math (e.g., "10,000 eligible users x 30% adoption x $5 ARPU = $15,000/month"), not just final numbers
- [ ] **De-risking actions identified:** Every Low-confidence assumption has a specific, actionable de-risking step (not generic "do more research")
- [ ] **Impact tied to strategic goal:** The recommendation section explicitly references a strategic goal or OKR from `product-development/product/strategy/`
- [ ] **Sensitivity analysis included:** Output shows best-case, worst-case, and expected-case scenarios with the key variable that drives the range
