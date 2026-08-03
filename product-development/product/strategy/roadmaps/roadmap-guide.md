# Roadmap Guide

How we build and communicate roadmaps. The roadmaps themselves live in this folder as dated files (`2026-q3.md`, `2026-h2.md`) — read this when creating or overhauling one.

## Why Format Matters

The format matters as much as the content. A poorly communicated roadmap leads to misaligned teams, confused stakeholders, and missed opportunities.

**Choose format based on audience:**
- Executive: High-level themes, business outcomes
- Engineering: Timeline, dependencies
- Sales/Marketing: Features, launch dates
- Design: User value, experience improvements

---

## Every Roadmap Starts With

**Product:** [Product name]
**Time Period:** [Q1 2026 / 2026 / Next 12 months]
**Owner:** [PM name]
**Last Updated:** [Date]
**Next Review:** [Date]

**Strategic Context:**
- North Star Metric: [e.g., Monthly Active Users]
- Current Value: [e.g., 50K MAU]
- Target: [e.g., 100K MAU by Q4]

**Company OKRs this roadmap supports:** link the objectives in [../current-quarter.md](../current-quarter.md) rather than restating them.

---

## Format 1: Now / Next / Later

### NOW (This Quarter)

**Theme 1: [Strategic Theme]**
*Why: [Business rationale]*
*OKR: [Which OKR this supports]*

**Initiatives:**
| Initiative | Description | Impact | Status | Owner |
|------------|-------------|--------|--------|-------|
| [Feature 1] | [What it does] | [Expected impact] | In Progress | [Name] |
| [Feature 2] | [What it does] | [Expected impact] | Planning | [Name] |

**NOW Success Criteria:**
- [Metric 1 target]
- [Metric 2 target]

### NEXT (Next Quarter)

**Theme 1: [Strategic Theme]**
*Why: [Business rationale]*

**Top Priorities:**
1. [Initiative]: [Description and expected impact]
2. [Initiative]: [Description and expected impact]

**Dependencies:**
- [What needs to happen first]

### LATER (Future / Backlog)

**Under Consideration:**
- [Initiative]: [Why it's interesting but not prioritized yet]

**Explicitly NOT Doing:**
- [Initiative]: [Why we decided against it]

---

## Format 2: Timeline

### Q1 2026

**Jan-Feb: [Theme]**
- Week 1-2: [Initiative/Milestone]
- Week 3-4: [Initiative/Milestone]

**March: [Theme]**
- [Initiative/Milestone]

### Q2 2026
[Same structure]

### Q3 2026
[High-level themes only — never week-level detail two quarters out]

---

## Format 3: Goal-Oriented

### Goal 1: [Increase activation rate from 40% to 60%]

**Why:** New users struggle with onboarding (65% drop at step 3)

**How:**
| Initiative | Expected Impact | Timeline | Status |
|------------|----------------|----------|--------|
| Personalized onboarding | +15% activation | Q1 | In progress |
| Smart defaults | +10% activation | Q2 | Not started |

**Success Metrics:**
- Activation rate: 40% → 60%
- Time to first value: 10 min → 5 min

---

## Features vs Outcomes

### ❌ Feature-Focused (Bad)
- Dark mode
- API v2
- Mobile redesign

### ✅ Outcome-Focused (Good)
- **Reduce churn by 15%** via: Dark mode (accessibility), improved performance
- **Enable enterprise** via: API v2 (integrations), SSO, audit logs
- **Increase mobile engagement** via: Mobile redesign, push notifications

---

## Risk Management

### High-Risk Items
| Initiative | Risk | Likelihood | Impact | Mitigation |
|------------|------|------------|--------|------------|
| [Feature] | [What could go wrong] | High/Med/Low | High/Med/Low | [Plan] |

### Dependencies
| Initiative | Depends On | Owner | Status | Risk |
|------------|------------|-------|--------|------|
| [Feature A] | [Feature B] | [Team] | On track | 🟢 |

---

## Confidence Levels

**High Confidence (committed):** shipping this quarter; customer contracts may depend on it
**Medium Confidence (likely):** likely but subject to prioritization; dependencies could shift timeline
**Low Confidence (exploring):** early exploration, may not happen

---

## Quick Reference by Audience

### For Executives
**Show:** Themes, business outcomes, OKR alignment
**Hide:** Technical details, specific dates
**Format:** Now/Next/Later or Goal-Oriented

### For Engineering
**Show:** Features, dependencies, timeline
**Hide:** Marketing fluff
**Format:** Timeline with dependencies

### For Sales/Marketing
**Show:** Customer-facing features, launch dates
**Hide:** Technical debt, infrastructure
**Format:** Timeline with feature descriptions

### For Customers
**Show:** Value delivery, problem solving
**Hide:** Internal initiatives, specifics
**Format:** High-level themes only

---

## Best Practices

### Do:
✅ Lead with "why" not just "what"
✅ Show trade-offs made
✅ Update regularly (monthly minimum)
✅ Link to OKRs in `current-quarter.md` rather than copying them
✅ Make it visual and scannable

### Don't:
❌ Promise specific dates far out
❌ Include every small feature
❌ Make it static (keep it living)
❌ Use jargon for external audiences
❌ Ignore dependencies

---

## Maintenance Schedule

**Weekly:** Review progress, update status
**Monthly:** Update "Now" section, refine "Next"
**Quarterly:** Major review, update all sections — and start a new dated file rather than overwriting history
**As needed:** Adjust for strategic changes

---

## Worked Example

### Q1 2026 Product Roadmap - [Product Name]

**Strategic Focus:** Enable enterprise adoption

**NOW (Jan-Mar 2026)**

**🔒 Enterprise-Ready**
Why: 60% of pipeline requires these features

- SSO/SAML integration (8 weeks) → Unblocks $2M pipeline
- Advanced permissions (6 weeks) → Required by 70% of enterprise trials
- Audit logs (3 weeks) → Compliance requirement
- Status: On track for March launch

**📊 Data & Insights**
Why: Users can't prove ROI to leadership

- Advanced analytics dashboard (4 weeks) → Requested by 50% of customers
- Custom reports (3 weeks) → Enable customer success conversations
- Status: In progress, launching February

**NEXT (Apr-Jun 2026)**

**🔗 Integrations**
- Salesforce integration → 40% of prospects requested
- Slack notifications → Improve engagement

**LATER (Exploring)**

- Mobile app redesign → High user demand but not enterprise blocker
- AI-powered insights → Interesting but unproven ROI

**NOT DOING:**
- Bulk operations → Enterprise doesn't need this
- Social features → Not strategic focus
