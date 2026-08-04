---
name: prd-review-panel
description: Multi-agent PRD review (7 perspectives)
group: definition
---

## Purpose

Get comprehensive feedback on your PRD from 7 different perspectives in parallel: Engineering, Design, Executive, Legal, UX Research, Skeptic, and Customer Voice.

Catches gaps, challenges assumptions, and surfaces conflicts before stakeholder review.

## Usage

- `/prd-review-panel` - Review a PRD with all 7 sub-agents
- `/prd-review-panel [prd-name]` - Review specific PRD
- `/prd-review-panel --perspectives "eng,design,exec"` - Review with subset of agents

**Scope:** the panel is **breadth at stage milestones** — 7 perspectives, one synthesis. For a single adversarial pass on the bet itself, use `/red-team`; for doc-quality skepticism with personality, `/ralph-wiggum`; to rehearse the launch failing, `/pre-mortem`.

---

## Context Routing

**Check these files first:**
1. `product-development/product/strategy/business-context/business-info.md` - Company, product, ICP, business model. No need to paste it into sub-agent prompts — each persona file's "Context to Load First" block tells its sub-agent which parts to load itself
2. `product-development/product/PRDs/{area}/` - Active PRDs to review
3. `product-development/product/PRDs/examples/` - Reference PRDs and past reviews
4. `.claude/agents/reviewers/` - The 7 reviewer personas
5. `product-development/product/strategy/` - Strategic context for executive review, including `current-quarter.md`
6. `product-development/product/customers/` - User research for UXR validation

**Sub-agents available:**
1. **engineer-reviewer.md** - Technical feasibility, complexity, dependencies
2. **designer-reviewer.md** - UX/UI feedback, user experience
3. **executive-reviewer.md** - Strategic alignment, business impact
4. **legal-advisor.md** - Compliance, risk, regulatory concerns
5. **uxr-analyst.md** - User research synthesis, validation
6. **skeptic.md** - Devil's advocate, challenge assumptions
7. **customer-voice.md** - Simulate user perspective

---

## Workflow

### Step 1: PRD Selection

1. **If user specified PRD name:**
   - Look for it in `product-development/product/PRDs/{area}/` and `product-development/product/PRDs/examples/`
   - If found: Proceed
   - If not found: List available PRDs, ask user to choose

2. **If no PRD specified:**
   - Scan `product-development/product/PRDs/{area}/` for recent PRDs (modified in last 30 days)
   - List them with:
     - File name
     - Title (from content)
     - Last modified date
     - Current stage (if indicated)
   - Prompt: "Which PRD do you want to review?"

3. **Read the full PRD:**
   - Load complete content
   - Note the current stage (Team Kickoff / Planning Review / XFN Kickoff / Solution Review / Launch Readiness)
   - Identify sections present (some PRDs may be incomplete)

---

### Step 2: Review Preparation

**Extract key elements from PRD:**
- **Problem statement** - What user pain are we solving?
- **Hypothesis** - If we build X, then Y will happen because Z
- **Strategic fit** - Why this vs other things?
- **Non-goals** - What's explicitly out of scope?
- **Success metrics** - How we measure success
- **Rollout plan** - A/B test or full launch?
- **Technical approach** - How we'll build it (if specified)
- **UX design** - Mockups, flows, behavior examples
- **Stakeholders** - Who needs to approve/support
- **Risks** - Known concerns or open questions

**Determine review focus based on stage:**

- **Team Kickoff stage:** Focus on problem definition, strategic fit
- **Planning Review stage:** Focus on scope, estimates, prioritization
- **XFN Kickoff stage:** Focus on cross-functional alignment, dependencies
- **Solution Review stage:** Focus on technical approach, UX design, edge cases
- **Launch Readiness stage:** Focus on rollout plan, metrics, compliance

---

### Step 3: Spawn 7 Sub-Agents in Parallel

**CRITICAL: Use single message with multiple Task tool calls for parallel execution.**

**The persona files in `.claude/agents/reviewers/` are the source of truth for each lens.** The prompts below deliberately contain no review frameworks — each sub-agent reads its persona file (role, "Context to Load First", review framework, tone) and applies it. To change how a perspective reviews, edit the persona file; the panel picks it up automatically. The prompts keep inline only what is panel-specific: the PRD, the stage focus, and the output buckets that Step 4 synthesizes.

For each sub-agent, create a Task with the prompt below, substituting:
- `[Full PRD text]` — the complete PRD from Step 1
- `[Stage + review focus from Step 2]` — the current stage and its stage-specific focus

**Agent 1: Engineering Reviewer**
```
Prompt:
You are the engineering seat on a multi-perspective PRD review panel.

Read `.claude/agents/reviewers/engineer-reviewer.md` first — it defines your role, the context files to load before reviewing, your review framework, and your tone. Follow its "Context to Load First" section, then apply the persona to the PRD below. If the persona file is missing or unreadable, say so at the top of your review and continue with your best judgment for this lens. Where the persona file suggests an output format, use the panel format below instead.

PRD stage and review focus: [Stage + review focus from Step 2]

PRD Content:
[Full PRD text]

Provide exactly these four sections:
- ✅ What looks good technically
- ⚠️ Concerns or gaps
- ❌ Blockers or red flags
- 💡 Suggestions for improvement

Be specific. Reference line numbers or sections of the PRD.
```

**Agent 2: Design Reviewer**
```
Prompt:
You are the design seat on a multi-perspective PRD review panel.

Read `.claude/agents/reviewers/designer-reviewer.md` first — it defines your role, the context files to load before reviewing, your review framework, and your tone. Follow its "Context to Load First" section, then apply the persona to the PRD below. If the persona file is missing or unreadable, say so at the top of your review and continue with your best judgment for this lens. Where the persona file suggests an output format, use the panel format below instead.

PRD stage and review focus: [Stage + review focus from Step 2]

PRD Content:
[Full PRD text]

Provide exactly these four sections:
- ✅ Strong UX decisions
- ⚠️ Usability concerns
- ❌ UX blockers
- 💡 Design improvements

Be specific about which flows or screens have issues.
```

**Agent 3: Executive Reviewer**
```
Prompt:
You are the executive seat on a multi-perspective PRD review panel.

Read `.claude/agents/reviewers/executive-reviewer.md` first — it defines your role, the strategy context to load before reviewing, your review framework, and your tone. Follow its "Context to Load First" section, then apply the persona to the PRD below. If the persona file is missing or unreadable, say so at the top of your review and continue with your best judgment for this lens. Where the persona file suggests an output format, use the panel format below instead.

PRD stage and review focus: [Stage + review focus from Step 2]

PRD Content:
[Full PRD text]

Provide exactly these four sections:
- ✅ Strategic strengths
- ⚠️ Strategic concerns
- ❌ Misalignment with strategy
- 💡 Strategic recommendations

Tie each point to a specific OKR, strategy doc, or metric wherever possible.
```

**Agent 4: Legal Advisor**
```
Prompt:
You are the legal seat on a multi-perspective PRD review panel.

Read `.claude/agents/reviewers/legal-advisor.md` first — it defines your role, the business context to load before reviewing, your key review areas, and your checklist. Follow its "Context to Load First" section, then apply the persona to the PRD below. If the persona file is missing or unreadable, say so at the top of your review and continue with your best judgment for this lens. Where the persona file suggests an output format, use the panel format below instead.

PRD stage and review focus: [Stage + review focus from Step 2]

PRD Content:
[Full PRD text]

Provide exactly these four sections:
- ✅ Legal considerations addressed
- ⚠️ Legal/compliance gaps
- ❌ Legal blockers or high-risk items
- 💡 Risk mitigation recommendations

Flag anything that needs legal team review before proceeding.
```

**Agent 5: UX Research Analyst**
```
Prompt:
You are the UX research seat on a multi-perspective PRD review panel.

Read `.claude/agents/reviewers/uxr-analyst.md` first — it defines your role, the context files to load before reviewing, your review framework, and your tone. Follow its "Context to Load First" section, then apply the persona to the PRD below. Also check `product-development/product/customers/` (account folders, `calls/summaries/`) for recent research relevant to this PRD's problem space. If the persona file is missing or unreadable, say so at the top of your review and continue with your best judgment for this lens. Where the persona file suggests an output format, use the panel format below instead.

PRD stage and review focus: [Stage + review focus from Step 2]

PRD Content:
[Full PRD text]

Provide exactly these four sections:
- ✅ Well-researched decisions
- ⚠️ Unvalidated assumptions
- ❌ Contradicts user research
- 💡 Research recommendations

Reference specific research findings or recommend studies needed.
```

**Agent 6: Skeptic**
```
Prompt:
You are the devil's-advocate seat on a multi-perspective PRD review panel.

Read `.claude/agents/reviewers/skeptic.md` first — it defines your role, the business context to load before reviewing, your key questions, and your tone. Follow its "Context to Load First" section, then apply the persona to the PRD below. If the persona file is missing or unreadable, say so at the top of your review and continue with your best judgment for this lens. Where the persona file suggests an output format, use the panel format below instead.

PRD stage and review focus: [Stage + review focus from Step 2]

PRD Content:
[Full PRD text]

Provide exactly these four sections:
- 🤔 Questions that need answers
- ⚠️ Risky assumptions
- ❌ Flawed logic or reasoning
- 💡 Alternative approaches to consider

Be direct. The goal is to strengthen the PRD by challenging it.
```

**Agent 7: Customer Voice**
```
Prompt:
You are the customer-voice seat on a multi-perspective PRD review panel — you review as the target customer, not as a team member.

Read `.claude/agents/reviewers/customer-voice.md` first — it defines the customer you play, the context files to load before reviewing, your mindset, and your review framework. Follow its "Context to Load First" section, then apply the persona to the PRD below. If the persona file is missing or unreadable, say so at the top of your review and continue with your best judgment for this lens. Where the persona file suggests an output format, use the panel format below instead.

PRD stage and review focus: [Stage + review focus from Step 2]

PRD Content:
[Full PRD text]

Provide exactly these four sections:
- ✅ User value delivered
- ⚠️ User confusion or friction
- ❌ User would reject or avoid
- 💡 Ways to increase user love

Write from first person ("I") as the user. Be honest about whether you'd use this.
```

---

### Step 4: Collect & Synthesize Reviews

Once all 7 agents complete (wait for all Task outputs):

**Read each review and extract:**
1. ✅ Strengths (what's working well)
2. ⚠️ Concerns or gaps (important but not blocking)
3. ❌ Blockers (must fix before proceeding)
4. 💡 Suggestions (improvements to consider)

**Identify patterns:**
- **Convergent feedback:** Multiple agents flagging same issue (high priority)
- **Conflicting perspectives:** Agents disagree (requires PM judgment)
- **Blind spots:** Issue only one agent caught (could be critical)

**Categorize all feedback:**

**Critical Blockers** (Must fix before next stage):
- [Issue from Agent X]
- [Issue from Agent Y]
- **Why critical:** [Impact if not addressed]

**Important Gaps** (Address before launch):
- [Gap from Agent X]
- [Gap from Agent Y]
- **Why important:** [Risk or limitation]

**Enhancements** (Consider for v1 or v2):
- [Suggestion from Agent X]
- [Suggestion from Agent Y]
- **Value if added:** [Benefit]

**Conflicting Perspectives** (Requires decision):
- **Agent X says:** [Position]
- **Agent Y says:** [Opposite position]
- **PM decision needed:** [What to prioritize]

---

### Step 5: Generate Review Synthesis

Create file: `product-development/product/PRDs/{area}/reviews/[prd-name]-review-synthesis.md`

**Template:**

```markdown
---
prd: [PRD filename]
review_date: YYYY-MM-DD
stage: [Current PRD stage]
agents: [engineer, designer, executive, legal, uxr, skeptic, customer]
---

# PRD Review Synthesis: [PRD Title]

**Reviewed:** [Date]
**Current Stage:** [Stage]
**Reviewers:** Engineering, Design, Executive, Legal, UXR, Skeptic, Customer Voice

---

## TL;DR

**Overall Assessment:** [Ready to proceed / Needs minor fixes / Requires significant work / Not ready]

**Critical Blockers:** [X]
**Important Gaps:** [Y]
**Conflicting Perspectives:** [Z]

**Recommended Next Step:** [Specific action]

---

## Critical Blockers

[Must be addressed before moving to next stage]

### 1. [Blocker Title]

**Flagged by:** [Agent(s)]
**Issue:** [Description of the problem]
**Impact if not fixed:** [Consequence]
**Recommendation:** [Specific fix]
**Owner:** [Who should address this]

---

### 2. [Blocker Title]

[Same structure]

---

## Important Gaps

[Should be addressed before launch, may not block next stage]

### [Gap Category - e.g., "Missing Technical Specs"]

**Flagged by:** [Agent(s)]
**Gap:** [What's missing]
**Risk:** [What could go wrong]
**Recommendation:** [How to fill the gap]

---

## Enhancements to Consider

[Nice-to-haves that would strengthen the PRD or feature]

**From Engineering:**
- [Suggestion]
- [Suggestion]

**From Design:**
- [Suggestion]

**From Executive:**
- [Suggestion]

**From Legal:**
- [Suggestion]

**From UXR:**
- [Suggestion]

**From Skeptic:**
- [Challenging question or alternative]

**From Customer:**
- [User perspective suggestion]

---

## Conflicting Perspectives

[Where agents disagreed - requires PM judgment]

### Conflict 1: [Topic]

**Perspective A** ([Agent]):
- [Position]
- [Rationale]

**Perspective B** ([Agent]):
- [Opposite position]
- [Rationale]

**Decision needed:**
- [What the PM needs to decide]
- [Trade-offs to consider]
- [Recommendation if any]

---

## Detailed Feedback by Perspective

### Engineering Review

**✅ Strengths:**
- [What looks good technically]

**⚠️ Concerns:**
- [Technical concerns or gaps]

**❌ Blockers:**
- [Technical blockers]

**💡 Suggestions:**
- [Engineering improvements]

**Estimated Complexity:** [S/M/L/XL based on feedback]

---

### Design Review

**✅ Strengths:**
- [UX decisions that work well]

**⚠️ Concerns:**
- [Usability issues]

**❌ Blockers:**
- [UX blockers]

**💡 Suggestions:**
- [Design improvements]

**Usability Risk:** [Low/Medium/High]

---

### Executive Review

**✅ Strengths:**
- [Strategic alignment]

**⚠️ Concerns:**
- [Strategic questions]

**❌ Blockers:**
- [Strategic misalignment]

**💡 Suggestions:**
- [Strategic recommendations]

**Business Impact:** [High/Medium/Low]
**Strategic Fit:** [Strong/Moderate/Weak]

---

### Legal Review

**✅ Strengths:**
- [Legal considerations addressed]

**⚠️ Concerns:**
- [Legal/compliance gaps]

**❌ Blockers:**
- [Legal red flags]

**💡 Suggestions:**
- [Risk mitigation]

**Legal Risk:** [Low/Medium/High]
**Requires Legal Team Review:** [Yes/No]

---

### UX Research Review

**✅ Strengths:**
- [Research-backed decisions]

**⚠️ Concerns:**
- [Unvalidated assumptions]

**❌ Blockers:**
- [Contradicts research]

**💡 Suggestions:**
- [Research needed]

**Research Validation:** [Strong/Moderate/Weak]

---

### Skeptic Review

**🤔 Questions to Answer:**
- [Challenging questions]

**⚠️ Risky Assumptions:**
- [Assumptions that need validation]

**❌ Flawed Logic:**
- [Issues with reasoning]

**💡 Alternatives:**
- [Different approaches to consider]

---

### Customer Voice Review

**✅ User Value:**
- [What users will love]

**⚠️ User Friction:**
- [What might confuse or frustrate]

**❌ User Rejection:**
- [What users might hate]

**💡 Delight Opportunities:**
- [Ways to exceed expectations]

**User Sentiment:** [Would love it / Would use it / Might use it / Would avoid it]

---

## Action Items

**Before Next Review:**
- [ ] [Critical blocker 1] - Owner: [Name]
- [ ] [Critical blocker 2] - Owner: [Name]

**Before Launch:**
- [ ] [Important gap 1] - Owner: [Name]
- [ ] [Important gap 2] - Owner: [Name]

**Decisions Needed:**
- [ ] [Decision on conflict 1] - Owner: PM
- [ ] [Decision on conflict 2] - Owner: PM

---

## Next Steps

1. **Immediate:** [What to do right now]
2. **This week:** [What to tackle soon]
3. **Before next stage:** [What must be done]

**Recommended:**
- Run `/decision-doc` for conflicting perspectives
- Update PRD to address blockers
- Schedule follow-up review after fixes (if needed)

---

*Generated: [Timestamp]*
*Agents used: 7 (Engineering, Design, Executive, Legal, UXR, Skeptic, Customer)*
*Next: Update PRD → Re-review or proceed to next stage*
```

---

### Step 6: Output & Next Actions

1. **Save review synthesis file**

2. **Display summary:**
   ```
   7-agent review complete for [PRD]!

   ✅ Strong areas: [X]
   ⚠️ Critical blockers: [Y]
   💡 Key recommendations: [Z]

   Overall: [Ready to proceed / Needs work]
   ```

3. **Offer next steps:**
   - If blockers exist: "Want me to help update the PRD to address blockers?"
   - If conflicts exist: "Run `/decision-doc` to document the [Conflict] decision?"
   - If ready: "PRD looks solid! Ready for stakeholder review."
   - Always: "Review synthesis saved to [file path]"

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

## Integration with Other Skills

**Before `/prd-review-panel`:**
- `/prd-draft` - Create the initial PRD
- `/user-interview` - Gather research to validate PRD
- `/impact-sizing` - Quantify expected value

**After `/prd-review-panel`:**
- `/decision-doc` - Document decisions on conflicting perspectives
- `/prd-draft` - Update PRD based on feedback
- `/prototype` - Build prototype for validation
- `/launch-checklist` - Plan the launch

**Iterative use:**
- Run review at each PRD stage (Team Kickoff, Planning, Solution, Launch)
- Each review focuses on stage-appropriate concerns

---

## Tips for Best Results

**When to run:**
- After completing first draft (Team Kickoff stage)
- Before stakeholder review (catch gaps privately first)
- After major changes (validate new approach)
- Before committing to build (final gate)

**How to use the output:**
- Address blockers immediately (don't proceed without fixing)
- Discuss conflicts in next stakeholder meeting
- Park enhancements for v2 (don't let perfect kill good)
- Use as peer review before formal review

**Common patterns:**
- Engineering often conflicts with Design (speed vs polish)
- Executive often conflicts with Customer (business vs user needs)
- Legal often blocks what users want (compliance vs freedom)
- **Your job as PM:** Make the call, document the trade-off

---

## Related Skills

**Before this:**
- `/prd-draft` - Create the PRD
- `/user-research-synthesis` - Validate with research
- `/impact-sizing` - Quantify value

**After this:**
- `/decision-doc` - Document key decisions
- `/prototype` - Build based on feedback
- `/pre-mortem` - Rehearse the launch failure once the PRD passes review
- `/launch-checklist` - Prepare for launch

**Complements:**
- `/red-team` - Depth on demand between milestones: attack the 3-5 load-bearing claims
- `/competitor-analysis` - Inform strategic review
- `/stakeholder-update` - Share review results

---

## Output Quality Self-Check

Before presenting output to the PM, verify:

- [ ] **All requested reviewer perspectives included:** The synthesis contains feedback from all 7 sub-agents (or all specifically requested agents), each with their own dedicated section
- [ ] **Each reviewer has specific, actionable feedback:** Every reviewer section contains at least one concrete, actionable item (not generic praise like "looks good" or vague concerns like "needs more detail")
- [ ] **Conflicting perspectives between reviewers explicitly flagged:** Any disagreements between agents (e.g., Engineering wants simplicity while Design wants richness) are called out in the "Conflicting Perspectives" section with both positions stated
- [ ] **Synthesis section prioritizes feedback items:** The TL;DR and summary sections rank issues by severity (Critical Blockers > Important Gaps > Enhancements) with a clear recommended next step
- [ ] **Feedback references specific PRD sections:** Each piece of feedback points to the exact section, requirement, or design element it applies to (e.g., "the rollout plan in Section 5" not "the rollout approach")

---

## Chain Position

Stage 4 of the de-risk-a-bet chain (`product-development/product/processes/de-risk-a-bet.md`) — upstream: `/red-team` · downstream: `/pre-mortem` (once committed, launch in sight). Skip rules live in the chain doc.
