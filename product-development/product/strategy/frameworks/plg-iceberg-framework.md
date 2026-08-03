# Product-Led Growth (PLG) Iceberg Framework

**Purpose:** The 8 layers of PLG that drive self-serve product adoption. Context for understanding what's visible vs hidden in successful PLG companies.

**Source:** SoftServe Team OS product strategy frameworks

---

## The Iceberg Metaphor

**What users see (above water):** Beautiful product, seamless onboarding
**What drives success (below water):** 8 foundational layers

**Key insight:** Great PLG isn't just good UX—it's strategy, pricing, data, and operations working together.

---

## Layer 1: Product (Above Water) 🌊

**What it is:** The visible experience—UI, features, onboarding

**What users see:**
- Clean design
- Fast time-to-value
- Self-serve signup

**Examples:**
- Notion's beautiful interface
- Figma's instant collaboration
- Slack's simple setup

**Common mistake:** Thinking this is all that matters

---

## Layer 2: Pricing Model

**What it is:** How you charge and when

**PLG pricing principles:**
1. **Free tier that delivers value** (not just a trial)
2. **Usage-based expansion** (pay as you grow)
3. **Transparent pricing** (no "Contact Sales")

**Examples:**
- Slack: Free until 10K messages, then pay per active user
- Notion: Free for individuals, paid for teams
- Stripe: % of transaction volume

**Anti-pattern:** Gating all valuable features behind paywall

---

## Layer 3: Viral Loops

**What it is:** Built-in mechanisms that drive user-to-user growth

**Types of viral loops:**
1. **Inherent virality:** Product requires others (Zoom, Slack)
2. **Social sharing:** Users share outputs (Canva, Loom)
3. **Network effects:** More users = more value (LinkedIn)

**Formula:**
```
Viral Coefficient (k) = (Invites sent per user) × (Conversion rate)
k > 1 = exponential growth
k < 1 = needs paid acquisition
```

**Example: Loom**
- User records video → Sends link to colleague → Colleague sees "Made with Loom" → Signs up

---

## Layer 4: Activation Metrics

**What it is:** The specific milestones that predict retention

**Framework:** Setup → Aha → Habit (see `/activation-analysis`)

**Examples:**
- Slack: 2,000 messages sent by team
- Dropbox: 1 file in 1 folder on 1 device
- Facebook: 7 friends in 10 days

**Critical:** Know YOUR activation metric and obsess over improving it

---

## Layer 5: Data Infrastructure

**What it is:** The pipes that capture user behavior and enable optimization

**Required capabilities:**
1. **Event tracking:** Every user action logged
2. **Cohort analysis:** Compare behavior across segments
3. **Experimentation platform:** Run A/B tests
4. **Product analytics:** Amplitude, Mixpanel, PostHog

**Why it matters:** Can't optimize what you don't measure

**Example: Spotify**
- Tracks every play, skip, playlist add
- Uses data to personalize Discover Weekly
- Runs thousands of experiments per year

---

## Layer 6: Growth Team & Culture

**What it is:** Cross-functional team dedicated to driving growth

**Team composition:**
- PM (growth focus)
- Engineer (full-stack)
- Designer (conversion optimization)
- Data analyst (experimentation)
- Growth marketer (acquisition)

**Culture requirements:**
- Experiment velocity (ship tests weekly)
- Data-driven decisions
- Failure tolerance

**Anti-pattern:** Expecting organic growth without dedicated resources

---

## Layer 7: Product-Market Fit

**What it is:** Deep understanding of who you serve and what problem you solve

**PLG requires strong PMF because:**
- Users self-serve (no sales to push through objections)
- Word-of-mouth drives growth (needs genuine love)
- Retention fuels expansion (leaky bucket kills PLG)

**Measuring PMF:**
- 40%+ of users say they'd be "very disappointed" without product
- Net Revenue Retention >110%
- Organic inbound >50% of new signups

**Reality:** Can't PLG your way out of weak PMF

---

## Layer 8: Category Design

**What it is:** Defining a new category or redefining an existing one

**Why it matters for PLG:**
- Clear positioning = easier self-serve discovery
- Category leadership = organic search traffic
- Differentiation = less price sensitivity

**Examples:**
- Figma: "Collaborative design tool" (not just "Sketch alternative")
- Notion: "All-in-one workspace" (not just "note-taking")
- Slack: "Team messaging" (not just "IRC replacement")

---

## How the Layers Connect

**Bottom-up dependency:**
```
Layer 8: Category Design
    ↓ (enables)
Layer 7: Product-Market Fit
    ↓ (drives)
Layer 6: Growth Team
    ↓ (optimizes)
Layer 5: Data Infrastructure
    ↓ (measures)
Layer 4: Activation
    ↓ (fuels)
Layer 3: Viral Loops
    ↓ (supported by)
Layer 2: Pricing
    ↓ (expressed through)
Layer 1: Product
```

**Example: Slack's stack**
- Category: Team communication (not just chat)
- PMF: Solves email overload for teams
- Growth team: Dedicated squad from Day 1
- Data: Tracks every message, channel, integration
- Activation: 2,000 messages = retained team
- Viral: Requires team adoption (inherent virality)
- Pricing: Freemium, usage-based expansion
- Product: Fast, searchable, integrated

---

## Using This Framework

### For Strategy

**Audit your PLG stack:**
1. Rate each layer 1-10
2. Identify weakest layer
3. That's your bottleneck

**Example audit:**
- Product: 9/10 (great UX)
- Pricing: 6/10 (too aggressive paywall)
- Viral: 3/10 (no sharing mechanisms)
- Activation: 5/10 (don't know our Aha moment)
- Data: 8/10 (good tracking)
- Growth team: 2/10 (no dedicated team)
- PMF: 7/10 (solid but not exceptional)
- Category: 8/10 (clear positioning)

**Diagnosis:** Fix viral loops and create growth team

---

### For PRDs

**Connect features to PLG layers:**
```
**PLG Impact:**
This feature strengthens Layer 3 (Viral Loops) by:
- Adding social sharing to outputs
- Creating "powered by" branding
- Driving 0.3 invites per active user (target)

Expected impact: +15% organic signups in 90 days
```

---

### For Hiring

**Job description aligned to layers:**
- Growth PM: Owns Layers 3-6
- Product Analytics: Owns Layer 5
- Product Designer: Owns Layer 1 (user-facing)
- Pricing/Monetization: Owns Layer 2
- VP Product: Owns Layers 7-8

---

## PLG ≠ No Sales

**Common misconception:** "PLG means no sales team"

**Reality:** PLG + Sales hybrid is powerful

**Model:**
- **Bottoms-up:** Self-serve free/paid for SMB
- **Top-down:** Sales-assisted for enterprise

**Examples:**
- Slack: Self-serve for teams, sales for enterprise
- Atlassian: Marketplace + sales for large deployments
- Zoom: Free for individuals, sales for enterprise

**When to add sales:**
- Deal size >$50K ARR
- Complex deployment needs
- Multi-stakeholder buying process

---

## Quick Reference

**When to use PLG Iceberg:**
- ✅ Planning PLG strategy
- ✅ Diagnosing growth problems
- ✅ Prioritizing investments
- ✅ Evaluating PLG competitors

**When NOT to use:**
- ❌ Enterprise-first B2B (complex sales)
- ❌ Highly regulated industries (compliance barriers)
- ❌ Products requiring heavy implementation

---

**Related Skills:**
- `/activation-analysis` - Layer 4 (Activation) deep-dive
- `/expansion-strategy` - Layer 2 (Pricing/Monetization)
- `/define-north-star` - Align metrics to PLG

**Source:** SoftServe Team OS product strategy frameworks
