# AI Product Strategy Framework

**Purpose:** Strategic considerations for building AI-powered products. Context for AI product decisions and positioning.

**Source:** OpenAI's AI Product Sense Framework. Adapted for the SoftServe Work OS.

---

## Why AI Products are Different

**Traditional software:** Deterministic, predictable, testable
**AI products:** Probabilistic, emergent, require new approaches

**Key differences:**
1. **Non-deterministic:** Same input can produce different outputs
2. **Probabilistic:** Can't guarantee 100% accuracy
3. **Data-dependent:** Quality requires quality data
4. **Rapidly evolving:** Model capabilities improve monthly
5. **Black box:** Hard to explain why AI made a decision

**Implication:** Need different product strategies, metrics, and expectations

---

## OpenAI's 10 Principles for AI Products

### 1. Understand User Value, Not AI Capability

**Anti-pattern:** "We have GPT-4, what should we build?"
**Better:** "Users struggle with [X], could AI help?"

**Example:**
- ❌ "Let's add AI to everything"
- ✅ "Customer support is slow, can AI triage tickets faster?"

---

### 2. Start with a Clear Job-to-be-Done

**AI should solve a specific job:**
- When [situation], I want to [motivation], so I can [outcome]

**Examples:**
- GitHub Copilot: "When writing code, I want to auto-complete boilerplate, so I can focus on logic"
- Grammarly: "When writing, I want real-time suggestions, so my writing is clear"

---

### 3. Design for Mistakes

**AI will make errors. Plan for it:**
- Show confidence scores
- Allow easy corrections
- Provide citations/sources
- Admit uncertainty

**Example: Perplexity**
- Shows sources for claims
- Admits when unsure
- Allows follow-up questions

---

### 4. Transparency Over Magic

**Users need to understand:**
- What AI can/can't do
- How it makes decisions
- When to trust it
- How to correct it

**Anti-pattern:** "AI magic box" with no explanation
**Better:** "Here's what I found and why I think it's relevant"

---

### 5. Start Small, Build Trust

**Launch strategy:**
1. One narrow use case
2. Nail the core experience
3. Expand to adjacent use cases

**Example: GitHub Copilot evolution**
- V1: Code completion only
- V2: Add chat interface
- V3: Add PR descriptions
- V4: Add documentation generation

**Don't:** Launch 50 AI features at once

---

### 6. Human-in-the-Loop by Default

**AI should augment, not replace (initially):**
- AI suggests, human decides
- AI drafts, human reviews
- AI surfaces options, human chooses

**When to automate fully:**
- Low-stakes decisions
- Easy reversal
- User opts in

---

### 7. Build Feedback Loops from Day 1

**AI improves through feedback:**
- Thumbs up/down
- User corrections
- Implicit signals (accepts/rejects)

**Design for continuous improvement:**
- Log all interactions
- A/B test prompts
- Retrain models with user data

---

### 8. Optimize for Latency

**AI feels slow. Design around it:**
- Streaming responses (ChatGPT style)
- Perceived performance (show "thinking")
- Async patterns (email results later)
- Caching (pre-compute common queries)

**User patience threshold:**
- <1s: Feels instant
- 1-3s: Acceptable
- 3-5s: Noticeable lag
- >5s: Frustrating (need loading state)

---

### 9. Safety is a Feature, Not an Afterthought

**Required safety layers:**
1. Input filtering (block harmful prompts)
2. Output filtering (block harmful responses)
3. Rate limiting (prevent abuse)
4. Audit logging (track all interactions)
5. Human review (sample outputs)

**Example: ChatGPT**
- Refuses harmful requests
- Rate limits power users
- Logs conversations (with opt-out)

---

### 10. Measure What Matters

**Traditional metrics fail for AI:**
- Don't just track "AI feature usage"
- Track user satisfaction, task completion

**AI-specific metrics:**
- Quality scores (human-rated)
- Hallucination rate (% false claims)
- Refusal rate (good vs bad refusals)
- Correction rate (% of outputs edited)
- Task completion rate

---

## AI Product Strategy Patterns

### Pattern 1: Copilot (Augmentation)

**What:** AI assists humans in existing workflow

**Examples:** GitHub Copilot, Notion AI, Microsoft Copilot

**When to use:**
- Complex, creative tasks
- High stakes (errors costly)
- Users are experts

**Metrics:**
- Time saved per task
- Acceptance rate of suggestions
- User productivity increase

---

### Pattern 2: Agent (Automation)

**What:** AI performs tasks autonomously

**Examples:** Customer support chatbots, AI SDRs

**When to use:**
- Repetitive tasks
- Low stakes (errors acceptable)
- Clear success criteria

**Metrics:**
- Task completion rate
- Escalation rate (to humans)
- Cost savings vs humans

---

### Pattern 3: Advisor (Decision Support)

**What:** AI provides insights, humans decide

**Examples:** Medical diagnosis AI, fraud detection

**When to use:**
- High-stakes decisions
- Requires human judgment
- Compliance/regulation

**Metrics:**
- Decision quality improvement
- False positive/negative rates
- Time to decision

---

### Pattern 4: Creator (Content Generation)

**What:** AI generates content from prompts

**Examples:** Midjourney, DALL-E, ChatGPT writing

**When to use:**
- Creative tasks
- Rapid iteration needed
- Personalization at scale

**Metrics:**
- Quality ratings
- Usage rate (prompts per user)
- Content published (not just generated)

---

## Building AI Defensibility

**Problem:** AI models commoditize quickly

**How to build moats:**

### 1. Data Network Effects
- User data improves model
- Better model attracts more users
- **Example:** Spotify recommendations, Waze traffic

### 2. Workflow Integration
- Deeply embedded in daily tools
- High switching costs
- **Example:** GitHub Copilot in VS Code

### 3. Domain Expertise
- Specialized models for vertical
- Hard to replicate training data
- **Example:** Healthcare AI, legal AI

### 4. User Trust
- Brand reputation for accuracy
- Track record of safety
- **Example:** OpenAI, Anthropic

### 5. Proprietary Data
- Exclusive access to training data
- Competitive advantage
- **Example:** Google (search data), Meta (social graph)

---

## AI Product Roadmap Stages

### Stage 1: Wrapper (0-6 months)
**What:** Use existing LLM API with custom UI/UX
**Focus:** Find product-market fit
**Risk:** Easy to copy
**Example:** Early AI chatbots on GPT-3

### Stage 2: Integrated (6-18 months)
**What:** Embed AI into existing workflow
**Focus:** Distribution and retention
**Risk:** Still using commodity models
**Example:** Notion AI, Microsoft Copilot

### Stage 3: Differentiated (18+ months)
**What:** Custom models, proprietary data, unique capabilities
**Focus:** Defensibility and margin
**Risk:** High investment required
**Example:** GitHub Copilot (trained on code), Harvey (legal AI)

---

## Strategic Questions for AI Products

**Before building:**
1. Could we solve this without AI? (Simpler is often better)
2. What's our defensibility? (Network effects, data, integration)
3. How will we handle mistakes? (Safety, transparency, fallbacks)
4. What metrics define success? (Beyond "usage")
5. How will we improve over time? (Feedback loops)

**During development:**
1. Are we optimizing for the right metrics?
2. Is latency acceptable?
3. Are we learning from user corrections?
4. Is our safety layer working?

**After launch:**
1. What % of outputs are users accepting?
2. Are users returning?
3. Is quality improving over time?
4. Are we building a moat?

---

## Common AI Product Mistakes

### Mistake 1: AI for AI's Sake
**Problem:** Add AI without clear user value
**Fix:** Start with user job, then consider if AI helps

### Mistake 2: Over-Promising
**Problem:** Claim 100% accuracy or AGI capabilities
**Fix:** Set realistic expectations, show limitations

### Mistake 3: Ignoring Safety
**Problem:** Launch without content filtering or monitoring
**Fix:** Safety layers from Day 1

### Mistake 4: No Feedback Mechanism
**Problem:** Can't improve after launch
**Fix:** Thumbs up/down, corrections, implicit signals

### Mistake 5: Optimizing for Cool, Not Useful
**Problem:** Impressive demos, but no real use case
**Fix:** Focus on task completion, not novelty

---

## Quick Reference

**AI product checklist:**
- [ ] Clear user job-to-be-done
- [ ] Behavior examples (Good/Bad/Reject)
- [ ] Safety filters (input + output)
- [ ] Latency optimization (<3s)
- [ ] Feedback loops (thumbs up/down)
- [ ] Transparency (show reasoning)
- [ ] Graceful degradation (fallback plans)
- [ ] Quality metrics (beyond usage)
- [ ] Human-in-the-loop (where appropriate)
- [ ] Defensibility strategy (moat)

---

**Related Skills:**
- `/prd-draft` - How to write PRDs (includes AI-specific guidance)
- `/experiment-metrics` - Choose AI metrics
- `/define-north-star` - Align AI features to North Star

**Source:** OpenAI's AI Product Sense Framework. Adapted for the SoftServe Work OS.
