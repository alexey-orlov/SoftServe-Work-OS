---
name: competitor-analysis
description: Deep competitive analysis + ongoing monitoring. Checks user research for competitor mentions, sales notes, existing analysis. Integrates with retention-analysis and user-research-synthesis.
argument-hint: "[competitor]"
group: discovery-market
---

# /competitor-analysis - Strategic Competitive Intelligence

Two modes: **Deep Analysis** (comprehensive one-time research) + **Ongoing Monitoring** (weekly/monthly tracking)

## Quick Start

1. Name the competitor(s) you want to analyze
2. Choose mode: **Deep Analysis** (full research) or **Ongoing Monitoring** (monthly check-in) — deep runs also get a suggested **analysis path** from the stated goal (baseline, pricing, capability gap, positioning, win/loss)
3. The skill plays back the learning goal, the scope, and what it will change — one "go" starts the run (Ongoing Monitoring and delegated runs skip it)
4. The skill checks your workspace first -- user research, meeting notes, churn data, past analysis
5. The skill shows what we already know, identifies gaps, then fills gaps with web research
6. The skill delivers a strategic report with defensive, offensive, and innovative plays

**Example:** "Analyze Competitor X -- we're losing enterprise deals to them"

**Output:** `product-development/product/competitive-research/competitors/{slug}/teardown.md` (living profile, refreshed in place) + updates to `competitive-matrix.md` and `competitive-landscape.md`

**Time:** Deep Analysis: 45 min–4 hours by path | Monitoring: 30 min/month

## Context Routing Logic (Internal - for Claude)

**Automatic Context Checks:**
Before any web research or write (a read-only glance — e.g. whether `competitors/{slug}/`
already exists — may precede the go-gate; it is what fills the gate's write plan), check:

| Source | Files/Folders | Search Terms | What to Extract |
|--------|---------------|--------------|-----------------|
| Business Context | `product-development/product/strategy/business-context/business-info.md` | — (read the ICP, value proposition, positioning, and pricing sections) | Who we are competing *for*, our differentiators, our price points. Competitive analysis without this produces a feature grid instead of a strategy |
| User Research | `product-development/product/user-insights/` | competitor name, "switched to", "chose", "vs [competitor]", "competitor" | Customer quotes, pain points, feature comparisons |
| Existing Analysis | `product-development/product/competitive-research/competitive-landscape.md`, `competitive-matrix.md`, `competitors/*/teardown.md` | competitor name | Current thesis, matrix cells, past findings — avoid duplication |
| Meeting Notes | `product-development/product/meetings/*/summaries/*.md` | competitor name, "lost deal", "churn", sales, CS | Sales losses, CS feedback, win/loss patterns |
| PRDs | `product-development/product/PRDs/{area}/*.md` | competitor name, "competitive", "positioning" | Feature decisions, positioning rationale |
| Strategy | `product-development/product/strategy/*.md` | competitor name, "positioning", "differentiation" | Strategic context, counter-positioning |
| Metrics | `product-development/analytics/metrics/{area}/*.md` | "churn", "retention", competitor name | Churn to competitors, competitive benchmarks |

**Context Priority:**
1. Internal context FIRST (user research, meetings, PRDs)
2. Analytics MCP SECOND (if connected - query churn cohorts)
3. Web search LAST (only for gaps not covered by internal intel)

**Cross-Skill Links:**
- If churn mentioned → Link to `retention-analysis`
- If user feedback → Link to `user-research-synthesis`
- If positioning mentioned → Link to `write-prod-strategy`

---

## The Go-Gate: Confirm the Learning Goal

One message before any research, and the turn ends on it — a teardown that answers no question still rewrites three living pages. Three parts, each as short as the ask allows:

1. **Question and decision** — what this analysis has to answer, and the call it feeds: "are we losing enterprise renewals to them on SSO? — feeds the Q4 roadmap cut".
2. **Scope and path** — the suggested analysis path (`references/analysis-paths.md`) and the product areas the run covers, by slug from `product-development/feature-index.yaml`, or whole-product. The path fixes which phases run and which surfaces change; scope fixes which `competitive-matrix.md` tables this run may touch.
3. **The write plan** — the surfaces this run changes: the competitor's `teardown.md`, the matrix tables in scope, the affected `competitive-landscape.md` sections, plus — first analysis of a competitor — the new `competitors/{slug}/` folder and its roster lines.

One "go" covers the whole run; no per-file prompts follow. Only the PM's own words skip it ("just run it", "no questions — go"), never a judgment that the ask looks clear enough. **Ongoing Monitoring is exempt** — a monthly check-in carries a standing goal. **Delegated runs never stop:** when another skill's auto-research pass dispatches this one (`/prd-draft`, `/job-spec-draft`), its `[GAP:]` line is the question and its initiative is the decision fed — inherited, recorded the same way, answered back to the caller.

Record what was approved in the teardown's frontmatter:

```yaml
last-deep-analysis: 2026-08-30
analysis-goal: are we losing enterprise renewals to them on SSO? — feeds the Q4 roadmap cut
analysis-scope: [billing, data-export]   # area slugs from the catalog, or: all
initiatives: [q4-enterprise-sso]         # append the goal's initiative when it isn't listed
```

The `last-deep-analysis:` / `analysis-goal:` / `analysis-scope:` keys are replaced each run — never stacked; history lives in the `intel/` records. `initiatives:` is different: a declared-link key (link contract: `governance/link-schema.yaml`) that accumulates — append, never remove entries other runs or skills declared. Bump `updated:` in the same edit. `analysis-scope:` is this run's coverage — leave `competes-areas:`/`competes-features:` for where we actually meet them.

---

## Step 0: Understanding What We Already Know

Before diving into research, the skill checks what competitive intelligence already exists in your workspace...

**Checking:**
- `product-development/product/customers/` for user interviews mentioning competitors
- `product-development/product/competitive-research/` — `competitive-landscape.md`, `competitive-matrix.md`, and `competitors/*/teardown.md` for past competitive analysis
- `product-development/product/meetings/` for sales/CS notes with competitive intel
- `product-development/product/PRDs/{area}/` for competitive positioning decisions
- `product-development/product/strategy/` for strategic context
- `product-development/analytics/metrics/{area}/` for churn data

**[If analytics MCP connected]:** "Let me also query [Amplitude/Mixpanel] for churn patterns and competitor-related data."

**Based on what found, This skill surfaces:**

### Internal Intelligence Summary

**From User Research:**
- [List interviews mentioning competitors with quotes]
- Example: "Found 4 interviews mentioning Competitor X: 'We switched because...'"

**From Sales/CS Meetings:**
- [List competitive losses and patterns]
- Example: "3 sales calls lost to Competitor Y in Enterprise segment"

**From Existing Analysis:**
- [Reference past competitive analysis]
- Example: "Last analyzed Competitor X on 2024-08-15 (6 months ago). Key finding: [summary]"

**From PRDs:**
- [Features built in response to competitors]
- Example: "PRD-2024-03 added Feature Z to match Competitor positioning"

**From Strategy Docs:**
- [Strategic positioning context]
- Example: "Your strategy positions you as [X] vs competitors who are [Y]"

**From Metrics/Analytics:**
- [Churn data, if available]
- Example: "20% of churned customers mentioned Competitor X as reason"

### Gaps in Knowledge

Based on internal context, we **don't yet know:**
- [Gap 1]: Recent product updates from Competitor X
- [Gap 2]: Current pricing model for Competitor Y
- [Gap 3]: Distribution channels for Competitor Z

**Filling these with web research is the default** — the go-gate's one "go" already covered it. Name a gap here only if you hold context that closes it faster than the web will.

---

## Step 1: Choose Your Analysis Mode

Two choices, made together and played back at the go-gate: **mode** — Deep Analysis or Ongoing Monitoring — and, for deep runs, **path** — which subset of the Phase 1-5 machinery the stated goal actually needs. Paths are defined in [references/analysis-paths.md](references/analysis-paths.md): suggest one from the goal with a one-line why; the gate's single "go" confirms mode, path, and write plan together. Delegated runs inherit the path from the caller's `[GAP:]` line (usually the capability-gap path) — chosen and recorded the same way, no stop.

### Deep Analysis Mode

**Use when:** the goal is a specific decision — a roadmap cut, a pricing call, a positioning refresh, a churn question — or no baseline for the competitor exists at all.

**The five paths** (full definitions — triggers, required inputs, PM questions, phase subsets, write surfaces, self-check subsets — in [references/analysis-paths.md](references/analysis-paths.md)):

| Path | Answers | Suggest when |
|------|---------|--------------|
| **(a) Full baseline / new entrant** | Who are they, where do they threaten us — the whole picture | No `competitors/{slug}/teardown.md` exists (the default), or it's 6+ months stale and the ask is broad |
| **(b) Pricing & packaging** | How they price and package, and what our next pricing call should do about it | The goal names pricing, tiers, discounts, packaging |
| **(c) Capability gap** (area-scoped) | What they can do in {area} that we can't — and which gaps block deals | The goal names a product area or capability; most delegated `[GAP:]` runs |
| **(d) Positioning & differentiation** | Where we sit in the field and the thesis we act on | The goal is messaging, strategy input, launch narrative |
| **(e) Win/loss & churn** | Who we're actually losing to, when, and why | The goal names lost deals, renewals, churn |

Paths (b)-(e) update a baseline — no teardown means (a) runs instead, with Phase 2 weighted toward the asked-about surface (one path per run; a goal needing two is a baseline, or two runs). Suggest, don't assign: the PM overrides at the gate with a word.

**Time:** path (a): 2-4 hours per competitor · paths (b)-(e): 45-90 minutes

**Output:** the surfaces the chosen path lists — always the teardown frontmatter stamps (`last-deep-analysis:`, `analysis-goal:`, `analysis-scope:`, `updated:` bumped; `competes-areas:`/`competes-features:` [+ `-except` carve-outs] kept current — bare catalog slugs or `all`, per `governance/link-schema.yaml`), then only the teardown sections, matrix tables, and `competitive-landscape.md` sections the path names

### Ongoing Monitoring Mode

**Use when:**
- You already have baseline competitive analysis
- Want to track competitor moves over time
- Need regular intel updates (monthly check-ins)

**What the skill does:**
1. **Monthly Check-in** - Search competitor mentions in user feedback
2. **Feature Tracking** - Monitor features appearing in customer requests
3. **Win/Loss Trends** - Track patterns via sales team
4. **Update Matrix** - Keep `competitive-matrix.md` current
5. **Alert on Major Moves** - Flag significant changes

**Time:** 30 minutes/month

**Output:** One cross-competitor record `product-development/product/competitive-research/intel/{YYYY-MM}.md`, then material deltas folded into teardowns / matrix / landscape

---

## Deep Analysis Mode: PM-Specific Questions

Instead of a generic "Who are your competitors?", each path opens with 3-5 tailored questions — the sets live with the path definitions in [references/analysis-paths.md](references/analysis-paths.md). Ask the chosen path's questions before Phase 1; skip any the go-gate exchange already answered. Path (a)'s five (competitive context, customer segment, churn reasons, distribution advantage, lost segments) are the fullest set; the scoped paths ask sharper, narrower ones.

---

## Deep Analysis Framework

Once the skill understands the competitive landscape from internal intel + your answers, run the phases the chosen path lists ([references/analysis-paths.md](references/analysis-paths.md)) — path (a) runs all five, the scoped paths subset them:

### Phase 1: Synthesize Internal Intelligence (15 min)

The skill creates a report showing:

**What We Already Know:**
- User quotes about competitors
- Sales losses and why
- Features we built to compete
- Strategic positioning decisions
- Churn patterns

**What We Don't Know:**
- [Gaps requiring web research]

### Phase 2: Gather Missing Intelligence (60-90 min)

For each gap, the skill will guide you through:

#### Public Data Collection
- Website positioning analysis
- Pricing page breakdown
- Product trial/demo walkthrough
- Marketing messaging audit

#### Customer Intelligence
- G2/Capterra review synthesis
- Reddit/Twitter sentiment analysis
- App store feedback patterns

#### Strategic Signals
- LinkedIn hiring patterns (what they're building)
- Funding announcements
- Partnership deals
- Executive changes

### Phase 3: Synthesize with Frameworks (30 min)

#### SWOT Analysis (Per Competitor)

```markdown
## Competitor: [Name]

### Strengths
- [What they do exceptionally well]
- [Their sustainable advantages]
- **Example from your data:** "User Interview 2024-08-15: 'Their onboarding is 10x faster'"

### Weaknesses
- [Where they consistently fall short]
- [Common customer complaints]
- **Example from your data:** "G2 reviews: 70% mention poor customer support"

### Opportunities (for us)
- [Gaps we can exploit]
- **Example:** "30% of their users want Feature X but they don't offer it"

### Threats (from them)
- [What they could do to hurt us]
- **Example:** "Partnership with Salesforce could lock us out of enterprise"
```

#### Positioning Map

The skill creates a 2x2 visualization:

```
Complexity (Simple → Enterprise)
        │
  You  │         Competitor A
        │
────────┼────────────  Price (Low → High)
        │
  Comp B│    Competitor C
        │

Your opportunity: [Identify white space]
```

#### Feature Comparison Matrix

```markdown
| Feature | Your Product | Comp A | Comp B | Analysis |
|---------|--------------|--------|--------|----------|
| [Core Feature 1] | ✅ | ✅ | ✅ | Table stakes |
| [Your Advantage] | ✅ | ⚠️ Limited | ❌ | Differentiator |
| [Gap] | ❌ | ✅ | ✅ | Consider building |

**Legend:**
- ✅ Full support
- ⚠️ Limited/beta
- ❌ Not available
```

### Phase 4: Strategic Recommendations (30 min)

The skill will categorize insights into 3 buckets:

#### 🛡️ Defensive Plays (Close Critical Gaps)

```markdown
**Feature:** [What to build]
**Why:** Competitor has it, customers expect it, blocking deals
**User Story:** "As a [user], I want [feature] so that [outcome]"
**Priority:** High
**Effort:** [Estimate]
**Link to PRD:** [If exists]
```

#### ⚔️ Offensive Plays (Attack Weaknesses)

```markdown
**Opportunity:** [Competitor weakness from customer complaints]
**Our Advantage:** [How we can do it better]
**Impact:** [Market share we can capture]
**Evidence:** [Quote from user research or reviews]
```

#### 🚀 Innovative Plays (Create New Market Space)

```markdown
**Gap:** [What no competitor is doing]
**Hypothesis:** [Why customers would care]
**Risk:** [Why no one else has done this]
**Validation Plan:** [How to test before building]
```

### Phase 5: Positioning & Pricing Guidance (15 min)

#### Value Proposition Framework

```markdown
**For:** [Target customer]
**Who:** [Their pain or need]
**Our product is a:** [Category]
**That:** [Key benefit]
**Unlike:** [Main competitor]
**We:** [Key differentiator]
```

#### Pricing Recommendations

Based on competitive benchmarks:
- Market pricing range
- Where you're positioned
- Opportunity for price increase or new tier

---

## Ongoing Monitoring Mode: Setup

Instead of complex Make.com automation, This skill helps you set up:

### Monthly Competitive Check-in (30 min/month)

**Week 1 of Month:**

1. **Search User Feedback**
   - Review latest interviews for competitor mentions
   - Check support tickets for "switching to" mentions
   - Scan feature requests citing competitors

2. **Sales Team Intel**
   - Ask: "Which competitors came up this month?"
   - Review win/loss log
   - Track deal-loss reasons

3. **Web Monitoring**
   - Check competitor blogs for product updates
   - Scan LinkedIn for major hires
   - Google Alerts for funding/partnership news

4. **Update Tracking**
   - Flip the affected cells in `competitive-matrix.md`
   - Fold pricing changes and significant moves into the competitor's `teardown.md`
   - Update `competitive-landscape.md` win/lose patterns when the picture shifts

**Output Format:**

```markdown
# Competitive Intel: [Month YYYY]

## Summary
- [1-2 sentence summary of significant changes]

## Competitor Updates

### Competitor A
- **Product:** [New features or changes]
- **Pricing:** [Any changes]
- **Strategic Moves:** [Partnerships, funding, hires]
- **Customer Mentions:** [Quotes from your research]

### Competitor B
[Same structure]

## Implications for Our Roadmap
- **Defensive:** [Gaps we need to close]
- **Offensive:** [Weaknesses we can exploit]
- **Monitoring:** [Things to watch]

## Action Items
- [ ] [Action 1 with owner]
- [ ] [Action 2 with owner]
```

Save to: `product-development/product/competitive-research/intel/{YYYY-MM}.md` (one cross-competitor record per monthly run) + END-append its line in `intel/CLAUDE.md`

### Optional: Google Alerts Setup

This skill can help you set up:
- Competitor name + "funding"
- Competitor name + "acquires"
- Competitor name + "announces"
- Competitor name + "launches"

---

## Output Integration

### Where Files Go

**Deep Analysis:**
- `product-development/product/competitive-research/competitors/{slug}/teardown.md` — the competitor's living profile, refreshed in place (first time: copy `product/handbook/templates/competitor-teardown-template.md`); stamp the frontmatter keys `last-deep-analysis:` and `updated:`
- Fold through: the competitor's column and cells in `competitive-matrix.md` + the affected `competitive-landscape.md` sections
- **Area write-through (scoped runs):** when `analysis-scope:` names areas, write or refresh each area's table in `competitive-matrix.md` — create the area's section when none exists (section name = the `PRDs/{area}/` folder name). When the area outgrows the file's ≤120-line budget, split: copy `product/handbook/templates/competitive-area-matrix-template.md` to `competitive-matrix-{area}.md` beside the main file, move the area's tables there, replace the area's section in `competitive-matrix.md` with a link, and END-append the new file in `competitive-research/CLAUDE.md` (the `competitive-matrix-` prefix keeps splits discoverable by the `competitive-*.md` pattern skills read)
- **Resolve before write:** `competes-areas:` / `competes-features:` values are bare slugs resolved from `product-development/feature-index.yaml` before filing — read the catalog, match the areas the evidence touches, never freehand a slug; a capability with no catalog home stays out of the keys and goes to the run report instead

**Ongoing Monitoring:**
- `product-development/product/competitive-research/intel/{YYYY-MM}.md` — one cross-competitor record per run, append-only
- Fold through: matrix cells, teardown facts, and landscape win/lose patterns that materially changed

### Link to Other Work

After completing analysis:
- **Reference in PRDs** - "Based on competitive analysis [link], we're positioning as..."
- **Update strategy docs** - "Competitive landscape has shifted: [insight]"
- **Create battlecards** - Use findings for sales team (via `/slack-message`)
- **Inform roadmap** - Link specific competitor threats to roadmap priorities

### Cross-Skill Integration

**Feeds into:**
- `/prd-draft` - Auto-populate "Market Context" and "Alternatives Considered"
- `/write-prod-strategy` - Inform competitive positioning and differentiation
- `/retention-analysis` - Understand churn to competitors
- `/user-research-synthesis` - Reference competitive mentions in interviews

**Pulls from:**
- `/user-research-synthesis` - Uses existing research themes
- `/retention-analysis` - Churn patterns and reasons
- `/feature-results` - Which features helped us compete

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

For this skill, step 1's "new folder" case is concrete: analyzing a competitor for the first
time creates `product-development/product/competitive-research/competitors/{slug}/` with a
5-line CLAUDE.md stub and `teardown.md` copied from
`product/handbook/templates/competitor-teardown-template.md`. Then close the loop:
END-append the folder in `competitors/CLAUDE.md`, add the competitor's column to
`competitive-matrix.md`, add its at-a-glance line to `competitive-landscape.md`, and add it
to the roster in `business-info.md`'s Competitive Landscape (confirm tier — in-session yes).

---

## Web Research Methodology

When performing competitive research to fill gaps not covered by internal intel, follow this systematic approach:

### Research Steps (in order)

1. **Check company website** for recent announcements, pricing changes, and feature updates. Look at their homepage messaging, pricing page, changelog/release notes, and blog.

2. **Search for recent product updates.** Query: "[competitor] product updates [current quarter]" and "[competitor] new features [current year]". Focus on the last 90 days for freshness.

3. **Check G2/Capterra for recent reviews** mentioning new features. Sort by "most recent" and look for patterns in what users praise or complain about. Extract specific quotes.

4. **Search LinkedIn for competitor PM/engineering job postings.** Job postings reveal strategic direction -- if they are hiring ML engineers, they are building AI features. If they are hiring enterprise sales reps, they are moving upmarket. Query: "[competitor] site:linkedin.com/jobs"

5. **Check their changelog/blog for release notes.** Most SaaS companies publish release notes. This gives you a timeline of what they shipped and how fast they are moving.

6. **Search for funding, partnerships, and acquisitions.** Query: "[competitor] funding [current year]" or "[competitor] partnership". These signals indicate where they are investing.

### Source Documentation

For every competitive claim, document the source with a date:

```markdown
**Claim:** Competitor X launched AI-powered search in Q4 2025
**Source:** Competitor X blog post (https://example.com/blog/ai-search)
**Date verified:** 2026-02-05
**Confidence:** High (primary source)
```

**Confidence levels:**
- **High** -- Primary source (company website, official announcement, direct product trial)
- **Medium** -- Secondary source (G2 review, news article, LinkedIn post)
- **Low** -- Third-party speculation (analyst report, Reddit thread, rumor)

Always prefer high-confidence sources. Flag low-confidence claims explicitly so the PM can decide how much weight to give them.

---

## Common Mistakes to Avoid

### Mistake 1: Jumping to Web Research First
**Bad:** Immediately Googling competitors without checking internal intel
**Good:** Starting with "What do our churned customers say?" from actual interviews

### ❌ Mistake 2: Feature List Without Strategy
**Bad:** "Competitor A has 47 features, we have 35"
**Good:** "Competitor A's complexity is their weakness—30% of reviews complain about onboarding. Our opportunity is simplicity."

### ❌ Mistake 3: Ignoring Indirect Competitors
**Bad:** Only tracking direct competitors
**Good:** Watching for adjacent players who could pivot (like Figma launching FigJam to compete with Miro)

### ❌ Mistake 4: Static Document
**Bad:** Beautiful analysis that lives in a deck, never updated
**Good:** Living document feeding into monthly roadmap discussions

### ❌ Mistake 5: Missing Internal Intel
**Bad:** Only using public data
**Good:** Creating feedback loops with sales/CS teams who hear competitor intel daily

---

## Pro Tips

### 1. Focus on "Why" Not Just "What"

Don't just list features. Understand:
- Why customers choose each competitor (pull from interviews)
- Why they churn from each competitor (pull from churn analysis)
- Why certain features matter more than others (pull from user research)

### 2. Track Signals, Not Just Facts

**Facts:** "Competitor raised $50M Series C"
**Signals:** "With $50M, they'll likely expand to enterprise (based on hiring pattern) and build mobile app (top feature request in their reviews)"

### 3. Use Jobs-to-be-Done Lens

**Bad:** "We need video calling because Competitor has it"
**Good:** "Users hire products to collaborate async across timezones. Video calling is one solution, but async video or threaded conversations might be better for our segment."

### 4. Make It Visual

Create positioning maps, feature matrices, and timelines. Visuals make patterns obvious and are easier to share with stakeholders.

### 5. Balance Your Competitive Response

- 60% Defensive (close critical gaps)
- 30% Offensive (attack their weaknesses)
- 10% Innovative (create new market space)

Don't spend all your time playing catch-up.

---

**Remember:** The best competitive analysis isn't the most comprehensive—it's the one that shows what you *already know internally*, identifies the real gaps, and drives clear decisions about what to build next.

## Output Quality Self-Check

Before delivering, run the checks the chosen path lists — its self-check subset in [references/analysis-paths.md](references/analysis-paths.md). The five process checks (internal intel first, gaps identified, sources dated, confidence levels, actionable recommendations) run on every path; the deliverable checks apply only where the path produces that deliverable — a deliverable the path does not produce is not a failure. Path (a) runs all nine. The full menu:

- [ ] **Internal intel checked first** -- User research, meetings, PRDs, strategy, and metrics were searched before web research
- [ ] **Gaps identified explicitly** -- Report clearly separates "what we know" from "what we researched externally"
- [ ] **Sources documented with dates** -- Every competitive claim has a source, URL (if applicable), and date verified
- [ ] **Confidence levels assigned** -- Claims marked as High, Medium, or Low confidence
- [ ] **SWOT is specific, not generic** -- Strengths/weaknesses reference actual data (user quotes, review excerpts, feature comparisons), not vague statements
- [ ] **Positioning map included** -- Visual 2x2 showing where competitors sit relative to your product
- [ ] **Feature comparison is strategic** -- Not just a checklist; includes analysis of what matters to your customers
- [ ] **Recommendations are actionable** -- Defensive, offensive, and innovative plays are specific enough to inform roadmap decisions
- [ ] **Cross-skill links included** -- References to relevant retention-analysis, user-research-synthesis, or strategy docs where appropriate

If a check the chosen path lists fails, fix it before delivering. The best competitive analysis drives clear decisions, not just awareness.

---

**This skill automatically checks your workspace first, references related skills, and only suggests web research for actual gaps. It works like a real PM connecting dots across research, meetings, and metrics.**
