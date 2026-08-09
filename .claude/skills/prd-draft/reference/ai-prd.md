# AI Feature PRDs — reference for /prd-draft

Loaded when the feature is AI-powered (`--ai` or auto-detected: LLM integration, ML behavior, generation/classification/routing). Extends the PRD's Solution section with a behavior contract; everything else in the PRD stays the same.

## Why AI PRDs are different

- **Non-deterministic:** same input → different outputs
- **Probabilistic:** 100% accuracy is not on the table; the PRD must say what accuracy is
- **Context-dependent:** quality depends on prompt, data, and user intent
- **Edge cases everywhere:** infinite ways to break it — specify the pattern, not every case

## The three AI questions (Step 2 additions)

9. **Example inputs** — 3 minimum: one that should work great, one borderline, one that must be rejected.
10. **Edge-case handling** — what should happen on ambiguous, out-of-scope, or low-confidence inputs?
11. **Never-do** — what must it refuse outright (safety, policy, PII)?

## Behavior Specification (required)

The PRD template's AI Behavior Contract table (Section 4) plus a Good/Bad/Reject example set:

| User Input | Expected Behavior | Category |
|------------|-------------------|----------|
| [Example] | [What AI should do] | ✅ Good |
| [Example] | [Graceful handling] | ❌ Bad |
| [Example] | [Must refuse] | 🚫 Reject |

**Good** = performs correctly · **Bad** = degraded input handled gracefully (don't break) · **Reject** = must refuse (safety, policy). Write 10–20 examples covering the known failure modes; a thin set is a `[GAP: behavior examples below 10 — collect real inputs from support/sales]`.

## AI Constraints

**Model:** [e.g. Claude Opus 5 / Claude Sonnet 5 — record the exact model ID and revisit at launch; model choices go stale]
**Latency:** P50 / P95 budgets in ms
**Cost:** $ per 1M tokens × expected volume
**Quality targets:** accuracy ≥ __%, hallucination ≤ __%, refusal rate __%
**Safety:** content filtering, PII handling, audit logging — each a named policy, not "TBD"

## Edge-case handling patterns

1. **Ambiguous input** → ask a clarifying question
2. **Out-of-scope request** → say what it can help with instead
3. **Harmful/unsafe request** → refuse with explanation
4. **Insufficient context** → ask for more
5. **Low confidence** → admit uncertainty rather than guess

## Graceful degradation (fallback hierarchy)

1. Retry with modified prompt
2. Offer an alternative action
3. Escalate to human
4. Fail clearly — never silently

## Evaluation plan

**Pre-launch:** golden set of 100–500 hand-labeled examples; human review of ≥50 outputs (target ≥4/5); every known failure mode in the test set.
**Post-launch:** thumbs up/down, correction rate (% of edited outputs), abandonment rate, escalation rate.
**Graduate when:** the thresholds in the PRD's Evaluation Plan table are met. **Fail action:** the PRD's kill criteria.

## AI-specific kill criteria (add to Success Metrics)

- Accuracy < __% after 2 weeks of real traffic
- User satisfaction < __%
- Escalation rate > __%

## Ten principles worth holding

1. Users care about outcomes, not the model
2. Anticipate mistakes — show confidence, allow corrections
3. Start with one use case, nail it, expand
4. Be transparent about what it can/can't do
5. Feedback loops from day 1
6. Design for beginners and experts
7. Control the context (system instructions, history, RAG)
8. Optimize perceived latency (streaming)
9. Safety is non-negotiable — input and output filtering
10. Measure satisfaction and corrections, not just usage
