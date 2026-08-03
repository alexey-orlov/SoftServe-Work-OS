# Hook → Retain → Expand Model

**Purpose:** Three-phase framework for thinking about user lifecycle and revenue growth. Context for building sustainable product-led businesses.

**Source:** SoftServe Team OS product strategy frameworks

---

## The Three Phases

**Phase 1: HOOK** (Get users in the door)
**Phase 2: RETAIN** (Keep them coming back)
**Phase 3: EXPAND** (Grow revenue per user)

**Key insight:** Most companies optimize Phase 1 (acquisition) but ignore Phases 2-3, leading to leaky buckets and unsustainable growth.

---

## Phase 1: HOOK (Acquisition + Activation)

### Goal
Get users to experience core value quickly

### Key Metrics
- Signups
- Time-to-value (TTV)
- Activation rate (% reaching "Aha")
- Day 1 retention

### Tactics
**Reduce friction:**
- Minimal signup fields
- No credit card required
- Social auth (Google/Microsoft SSO)

**Accelerate time-to-value:**
- Sample data/templates
- Interactive tutorials
- Empty state guidance

**Show value immediately:**
- Free tier with real utility
- "Magic moment" within 5 minutes
- Social proof (testimonials, logos)

### Examples
- **Notion:** Templates get you to first doc in <1 min
- **Figma:** Open shared file, instant collaboration
- **Loom:** Record and share video in <2 minutes

---

## Phase 2: RETAIN (Build the Habit)

### Goal
Turn one-time users into habitual users

### Key Metrics
- D7, D30 retention curves
- Weekly/Monthly Active Users (WAU/MAU)
- Frequency of core action
- Churn rate

### Tactics
**Build habits:**
- Email/push notifications (bring users back)
- Progress indicators (streaks, milestones)
- Social accountability (teams, sharing)

**Increase depth:**
- Multi-feature adoption
- Integrations that lock in
- Data accumulation (harder to leave)

**Retention loops:**
- Team collaboration (Slack)
- Content accumulation (Notion, Evernote)
- Network effects (LinkedIn)

### The Retention Curve Test
**Good retention curve:**
- Initial drop, then flattens (stable base)
- 40%+ D7 retention
- 25%+ D30 retention

**Bad retention curve:**
- Keeps declining (no product-market fit)
- Below 20% D30 retention

### Examples
- **Slack:** 2,000 messages → teams get "hooked"
- **Spotify:** Personalized playlists → daily listening habit
- **Notion:** Accumulate docs → too much effort to migrate

---

## Phase 3: EXPAND (Monetization + Upsells)

### Goal
Grow revenue from retained users

### Key Metrics
- Free → Paid conversion rate
- Net Revenue Retention (NRR)
- Average Revenue Per User (ARPU)
- Time to first upgrade

### Tactics
**Upsells:**
- Usage limits (storage, seats, API calls)
- Feature gating (advanced features locked)
- Service tiers (premium support, SLAs)

**Cross-sells:**
- Additional products/modules
- Bundled offerings
- Complementary tools

**Account expansion:**
- Team seat growth
- Department rollout
- Enterprise upsell

### Timing Matters
**When to show upgrade prompts:**
- ✅ After success moments (task completed!)
- ✅ At usage limits (90% of quota)
- ✅ When requesting gated features
- ❌ Right after signup (before value shown)
- ❌ After errors/frustration

### Examples
- **Dropbox:** Hit storage limit → upgrade for more space
- **Zoom:** 40-minute limit on free calls → upgrade for unlimited
- **Notion:** Team features → upgrade to paid plan

---

## The Sequential Model

**Critical: Phases must be executed in order**

```
HOOK → RETAIN → EXPAND
  ↓        ↓        ↓
If skipped:
```

**If you skip RETAIN and jump to EXPAND:**
- Users churn before upgrading
- Poor conversion rates
- Negative reviews ("cash grab")

**Example failure:** Charge too early, before users see value
**Result:** High acquisition cost, low lifetime value

**If you skip HOOK and focus on RETAIN:**
- Can't grow user base
- Stagnant top-of-funnel
- Limited expansion pool

---

## How Phases Relate to Metrics

### Hook Phase Metrics
- **Leading:** Signups, activation rate, D1 retention
- **Lagging:** User growth rate

### Retain Phase Metrics
- **Leading:** D7 retention, WAU, feature adoption
- **Lagging:** LTV (lifetime value)

### Expand Phase Metrics
- **Leading:** Free→Paid conversion, upgrade triggers
- **Lagging:** NRR (Net Revenue Retention), ARPU

**Optimize in sequence:** Fix Hook, then Retain, then Expand

---

## Common Mistakes

### Mistake 1: Monetizing Too Early
**Problem:** Ask for payment before users experience value
**Example:** No free tier, immediate paywall
**Fix:** Generous free tier → habit formation → upsell

### Mistake 2: Ignoring Retention
**Problem:** Focus on acquisition, ignore churn
**Example:** Great onboarding, terrible D30 retention
**Fix:** Build habit loops, measure retention curves

### Mistake 3: No Clear Upgrade Path
**Problem:** Users love free tier, never upgrade
**Example:** Free tier has all features, no incentive to pay
**Fix:** Feature gating, usage limits, team features

### Mistake 4: Wrong Order
**Problem:** Optimize Expand before Retain is working
**Example:** Push upsells when churn rate is 70%
**Fix:** Fix retention first (plug the leaky bucket)

---

## Using This Framework

### For Product Roadmap

**Map features to phases:**
- **Hook features:** Onboarding improvements, signup flow, activation
- **Retain features:** Notifications, integrations, collaboration
- **Expand features:** Premium tiers, usage limits, enterprise features

**Prioritize by weakest phase:**
1. Audit metrics for each phase
2. Identify bottleneck
3. Roadmap focuses on that phase

**Example audit:**
- Hook: 80% activation rate ✅ (strong)
- Retain: 25% D30 retention ⚠️ (weak)
- Expand: 15% free→paid conversion ⚠️ (weak)

**Diagnosis:** Focus on Retain first (can't expand if they churn)

---

### For Metrics Dashboards

**Create three dashboard sections:**

**1. Hook Metrics**
- Signups (weekly)
- Activation rate
- Time-to-value (median)
- D1 retention

**2. Retain Metrics**
- D7, D14, D30 retention curves
- WAU / MAU ratio
- Churn rate
- Feature adoption

**3. Expand Metrics**
- Free→Paid conversion
- Net Revenue Retention (NRR)
- ARPU by cohort
- Expansion ARR

---

### For Team Structure

**Organize teams by phase:**
- **Growth team:** Owns Hook (acquisition + activation)
- **Engagement team:** Owns Retain (habit formation, retention)
- **Monetization team:** Owns Expand (pricing, upsells)

**OR: Full-stack teams owning all three for a surface area**

---

## Real-World Examples

### Slack: Masterclass in All Three Phases

**Hook:**
- Free forever plan
- Easy team setup
- Integrations available immediately

**Retain:**
- Daily team communication (high frequency)
- Searchable history (data lock-in)
- 2,000 messages = activation milestone

**Expand:**
- Free history limit (10K messages)
- Paid unlocks unlimited history
- Usage-based pricing (per active user)

**Result:** 150%+ NRR, multi-billion dollar business

---

### Notion: Sequential Execution

**Phase 1 (2016-2018): Hook**
- Focus: Nail onboarding, beautiful product
- Metric: Activation rate, D1 retention

**Phase 2 (2018-2020): Retain**
- Focus: Templates, community, integrations
- Metric: D30 retention, content depth

**Phase 3 (2020+): Expand**
- Focus: Team plans, enterprise features
- Metric: Free→Paid conversion, NRR

**Result:** Executed phases sequentially → $10B+ valuation

---

## Quick Reference

**When to focus on each phase:**

| Your Situation | Focus Phase | Why |
|----------------|-------------|-----|
| Low signups | Hook | Can't retain/expand if no one signs up |
| High churn (>70%) | Retain | Leaky bucket, fix before expanding |
| Strong retention, low revenue | Expand | Users love it, ready to pay |
| Balanced metrics | All three | Optimize across full funnel |

---

**Related Skills:**
- `/activation-analysis` - Hook phase (Setup → Aha → Habit)
- `/retention-analysis` - Retain phase deep-dive
- `/expansion-strategy` - Expand phase tactics

**Source:** SoftServe Team OS product strategy frameworks
