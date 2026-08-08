# Business Information

The durable answer to: who are we, what do we sell, to whom, at what price, and how do we win.

**What belongs here:** identity, product, market, ICP and personas, value proposition, business model, GTM motion, and product principles. Things that change a few times a year at most.

**What does not:** quarterly OKRs (`../current-quarter.md`), competitor teardowns (`product/competitive-research/`), metric definitions (`analytics/metrics/`), segment counts and ARR mix ([segmentation-matrix.md](segmentation-matrix.md)), team roster and Slack channels (root `CLAUDE.md`). Every section below that overlaps one of those links out instead of copying it.

A summary of this file lives in the root `CLAUDE.md` and loads every session. When you change something here that also appears there, update both.

## Company Overview

### Basic Information

**Company Name:** [Your Company Name]

**Industry:** [Your Industry - e.g., SaaS, Fintech, Healthcare]

**Stage:** [Company Stage - e.g., Seed, Series A, Series B, Growth, Public]

**Founded:** [Year]

**Size:**
- Employees: [Number]
- Revenue: [ARR/Revenue figure]
- Funding: [Funding stage and total raised]

**Website:** [URL]

---

## Product Information

### Core Product

**Product Name:** [Your Product Name]

**One-Line Description:**
[One sentence describing what your product does and for whom]

**Detailed Description:**
[2-3 paragraphs describing your product, what makes it different, and who it serves]

### Product Categories

**Primary Category:** [e.g., Project Management, Analytics, CRM]

**Secondary Categories:** [Related categories]

**Key Features:**
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]
4. [Feature 4]
5. [Feature 5]

**Technology Stack:**
- Frontend: [Technologies]
- Backend: [Technologies]
- Database: [Technologies]
- Infrastructure: [Cloud provider and services]
- Mobile: [Technologies, if applicable]

---

## Target Market

### Customer Segments

Qualitative target definitions only. The quantitative mix of the actual base — account counts and ARR by vertical × size band, overall and per use-case category — lives in [segmentation-matrix.md](segmentation-matrix.md). Describe company size and industry below using that file's canonical band and vertical names, so the two files never talk past each other.

**Primary Customer:**
- **Who:** [Title/Role]
- **Company size:** [Range]
- **Industry:** [Target industries]
- **Geography:** [Target regions]
- **Budget:** [Typical spend range]

**Secondary Customer:**
- **Who:** [Title/Role]
- **Company size:** [Range]
- **Industry:** [Target industries]
- **Geography:** [Target regions]
- **Budget:** [Typical spend range]

### Ideal Customer Profile (ICP)

**Firmographics:**
- Company size: [Range]
- Industry: [Target industries]
- Geography: [Regions]
- Tech stack: [Requirements]
- Growth stage: [Stages]

**Behavioral:**
- Current solution: [What they use today]
- Pain points: [Key problems]
- Buying triggers: [What causes them to look for a solution]
- Decision makers: [Roles involved in purchase]
- Buying process: [How they buy]

### Buyer Personas

**Persona 1: "[Nickname]" - [Title]**
- **Role:** [What they do day-to-day]
- **Goals:** [What they want to achieve]
- **Challenges:** [What frustrates them]
- **Motivations:** [What drives them]
- **Decision criteria:** [What matters most when evaluating tools]
- **Quote:** "[A representative quote from this persona]"

**Persona 2: "[Nickname]" - [Title]**
- **Role:** [What they do day-to-day]
- **Goals:** [What they want to achieve]
- **Challenges:** [What frustrates them]
- **Motivations:** [What drives them]
- **Decision criteria:** [What matters most when evaluating tools]
- **Quote:** "[A representative quote from this persona]"

**Persona 3: "[Nickname]" - [Title]**
- **Role:** [What they do day-to-day]
- **Goals:** [What they want to achieve]
- **Challenges:** [What frustrates them]
- **Motivations:** [What drives them]
- **Decision criteria:** [What matters most when evaluating tools]
- **Quote:** "[A representative quote from this persona]"

---

## Value Proposition

### Problem Statement

**The Problem:**
[Describe the core problem your product solves. Be specific about who experiences it and why it matters.]

### Solution Statement

**Our Solution:**
[Describe how your product solves the problem. Focus on the approach and key differentiators.]

### Unique Value Proposition

**What makes us different:**
1. [Differentiator 1]
2. [Differentiator 2]
3. [Differentiator 3]

**Why customers choose us over alternatives:**
- vs. [Competitor 1]: [Your advantage vs. their strength]
- vs. [Competitor 2]: [Your advantage vs. their strength]
- vs. [Competitor 3]: [Your advantage vs. their strength]
- vs. [Status quo/DIY]: [Your advantage vs. doing nothing]

---

## Strategy & Goals

### Company Mission

**Mission Statement:**
[Your company's mission - what you exist to do]

**Vision (3-5 years):**
[Where you want to be in 3-5 years]

### Current OKRs and Product Strategy

OKRs, strategic themes, key initiatives, and the explicit "not doing" list are time-boxed, so they live where they actually get updated:

- **This quarter:** [../current-quarter.md](../current-quarter.md)
- **Longer range:** [../roadmaps/](../roadmaps/)

Keep this file to the durable fundamentals. If you find OKRs copied here, delete them and link instead.

---

## Market & Competition

### Market Size

**TAM (Total Addressable Market):** [Amount]
**SAM (Serviceable Addressable Market):** [Amount]
**SOM (Serviceable Obtainable Market):** [Amount]

**Market Growth:** [CAGR or growth rate]

**Market Trends:**
- [Trend 1]
- [Trend 2]
- [Trend 3]

### Competitive Landscape

Per-competitor teardowns — positioning, strengths, weaknesses, pricing, market share — live in [product/competitive-research/](../../competitive-research/), one folder per competitor plus the comparison matrix. This section names who we compete with; that folder explains them.

**Direct:** [Competitor 1], [Competitor 2], [Competitor 3]

**Indirect:** [Adjacent category or approach 1], [Adjacent category or approach 2]

**Status quo:** [What customers do today instead of buying anything — spreadsheets, in-house tooling, nothing]

**Our Positioning:**
[How you position your product in the market - your unique angle]

---

## Business Model

### Revenue Model

**Primary Revenue Stream:** [e.g., Subscription, Usage-based, Marketplace]

**Pricing Tiers:**

**Free Tier:**
- Price: $0
- Features: [What's included]
- Limits: [What's restricted]
- Target: [Who this is for]

**Tier 1: [Name]**
- Price: [Amount]/user/month
- Features: [What's included]
- Target: [Who this is for]

**Tier 2: [Name]**
- Price: [Amount]/user/month
- Features: [What's included]
- Target: [Who this is for]

**Enterprise:**
- Price: Custom
- Features: [What's included]
- Target: [Who this is for]

### Key Metrics

Headline numbers only. Metric **definitions**, the SQL behind them, and dashboards live in [analytics/metrics/](../../../analytics/metrics/) — that is the source of truth whenever a number has to be reproduced or defended.

**North Star Metric:** [Metric name] — definition in `analytics/metrics/{area}/`

**Business:** ARR/MRR [figure] · Growth [YoY, MoM] · Paying accounts [number] · ARPU [amount] — segment breakdown in [segmentation-matrix.md](segmentation-matrix.md); its totals must equal the ARR and account figures here

**Product:** DAU/MAU [ratio] · Activation [%] · Retention D7/D30 [%] · NPS [score]

**Efficiency:** CAC [amount] · LTV [amount] · LTV:CAC [ratio] · Payback [months] · Burn multiple [ratio]

---

## Go-to-Market

### Sales Motion

**Sales Model:** [e.g., Self-serve, Sales-led, PLG with sales-assist]

**Sales Cycle:**
- [Tier 1]: [Duration]
- [Tier 2]: [Duration]
- Enterprise: [Duration]

**Deal Size:**
- Avg: [ACV]
- Range: [Min - Max]

### Marketing Strategy

**Acquisition Channels:**
1. [Channel 1] - [% of pipeline]
2. [Channel 2] - [% of pipeline]
3. [Channel 3] - [% of pipeline]
4. [Channel 4] - [% of pipeline]

---

## Product Development

### Development Process

**Methodology:** [e.g., Scrum, Shape Up, Kanban]

**Sprint Length:** [Duration]

**Release Cadence:** [How often you release]

**Tools:**
- Project management: [Tool]
- Design: [Tool]
- Documentation: [Tool]
- Communication: [Tool]
- Analytics: [Tool]
- Research: [Tool]

### Team Structure

The roster — names, GitHub handles, Slack IDs, after-hours escalation — lives in the root `CLAUDE.md`, which loads every session. Don't copy it here.

**Shape of the product org:** [e.g. 3 PMs, 2 designers, 12 engineers, 1 analyst, across 3 squads]

**Reporting structure:** [Org structure relevant to product work]

---

## Culture & Values

### Company Values

**Value 1: [Name]**
[Description of what this value means in practice]

**Value 2: [Name]**
[Description of what this value means in practice]

**Value 3: [Name]**
[Description of what this value means in practice]

**Value 4: [Name]**
[Description of what this value means in practice]

**Value 5: [Name]**
[Description of what this value means in practice]

### Product Principles

1. **[Principle 1]** - [Brief description]
2. **[Principle 2]** - [Brief description]
3. **[Principle 3]** - [Brief description]
4. **[Principle 4]** - [Brief description]
5. **[Principle 5]** - [Brief description]

---

## Key Resources

### Communication

**Slack channels:** listed in the root `CLAUDE.md` with IDs, visibility, and purpose. Don't duplicate them here.

**Meeting cadence:** agendas, transcripts, and summaries live in [product/meetings/](../../meetings/) — one folder per recurring series (`standup/`, `sprint-planning/`, `team-bi-weekly/` — template examples, renamed to the team's real cadences), event-meeting folders (`kickoff/`, `stakeholder-review/`, `workshop/`, `other/`), plus `retros/`. Periodic rollups live in [product/reports/](../../reports/).

---

**Owner:** Product Team
**Last Updated:** [Date]
