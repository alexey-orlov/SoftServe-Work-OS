---
name: pre-mortem
description: Rehearse the failed launch before it happens. Imagines the launch failed, generates risks across five categories, classifies them as Tigers (real — act), Paper Tigers (overblown — document with triggers), and Elephants (known but undiscussed — surface), then turns launch-blocking Tigers into owned, dated action plans that feed /launch-checklist and /feature-launch-gate.
group: definition
---

## Quick Start

**What to provide:** The feature or launch to rehearse — a PRD path, a feature name from `feature-index.yaml`, or a description.

```
/pre-mortem credit-usage-dashboard
/pre-mortem product-development/product/PRDs/billing/credit-usage-dashboard-prd.md
/pre-mortem We're launching the self-serve billing portal next month
```

**What you get:** The launch, rehearsed as a failure: risks generated across five categories, sorted into Tigers / Paper Tigers / Elephants, launch-blocking Tigers turned into a mitigation table with owners and dates — and the unspoken risks put on the table with a conversation starter each.

**Time:** 15–20 minutes. Best run when the plan is ~80% done; re-run 2–3 weeks before launch.

---

# Pre-Mortem

Imagine the launch happened — and it failed. Customers didn't adopt it, the metrics missed, the team is doing a painful retro. Now work backward: what went wrong? A pre-mortem surfaces the risks a forward-looking plan review misses, because narrating a failure that "already happened" gives everyone permission to say what they actually worry about.

**Framework credit:** Pre-mortem method — Gary Klein. Tigers / Paper Tigers / Elephants classification popularized by Shreyas Doshi.

This skill generates and triages risks. It renders **no launch verdict** — that belongs to `/feature-launch-gate`.

---

## When to Use

- When the plan is ~80% done — early enough to change course, late enough to have substance
- 2–6 weeks before a launch date
- Re-run 2–3 weeks before launch to verify mitigations are on track (updates the same file)
- After a scope change big enough to invalidate the previous rehearsal

**When NOT to use:**

- No ship moment exists (a strategy bet, a direction choice) → `/red-team` the doc instead
- You want the artifact-completeness check → `/feature-launch-gate`
- You want launch tasks planned and sequenced → `/launch-checklist`

---

## Scope Boundaries

### This Skill vs /red-team

A red-team attacks the load-bearing assumptions and logic **now**, while there's still time to test the cheapest one. A pre-mortem imagines the plan **already failed** and narrates why — it catches operational, adoption, and dependency failures that claim-level attack doesn't reach.

**Use /red-team when:**
- You're deciding whether to commit to the bet at all
- The risk is in the plan's claims — user, market, mechanism, timeline
- Output: 3–5 kill-assumption contracts with kill criteria and this-week tests

**Use /pre-mortem when:**
- The bet is committed, a ship moment exists, and you want failure rehearsed before it's real
- The risk is in the execution — technical, operational, adoption, dependencies
- Output: Tigers / Paper Tigers / Elephants with owned, dated mitigations for the launch-blockers

**Handoff:** "Several Tigers trace back to one untested claim — want `/red-team` on the PRD before you mitigate downstream symptoms?"

### This Skill vs /launch-checklist and /feature-launch-gate

The pre-mortem **generates the risks**. `/launch-checklist` operationalizes the launch and imports these risks into its Risk Mitigation section. `/feature-launch-gate` verifies the repo artifacts exist before ship. This skill renders no go/no-go — if the rehearsal looks fatal, recommend delaying or phasing, and let the PM decide.

---

## What It Does

### Step 1: Gather Launch Context

Read what exists before imagining what fails:

| Source | What to Extract |
|--------|-----------------|
| The PRD (`product-development/product/PRDs/{area}/`) | Scope, success metrics, kill criteria, §7 Risks and Recovery, rollout plan |
| `product-development/product/launches/{feature-name}-launch-checklist.md` (if it exists) | Planned tasks, owners, timeline |
| `product-development/feature-index.yaml` | What artifacts exist; what's conspicuously missing |
| Past pre-mortems in `product-development/product/PRDs/*/reviews/` | Risks that recur across this team's launches |
| `product-development/product/decisions/` | Post-launch learnings from earlier features — what actually went wrong last time |

### Step 2: Imagine the Failure

It's launch day plus 30 days. The launch failed: adoption missed the target, the primary metric didn't move, support is overloaded, and the team is in a painful retro. Narrate:

- What went wrong?
- What did we miss or not execute well?
- What were we overconfident about?

### Step 3: Generate Risks Across Five Categories

- **Technical** — performance, scalability, integration failures, data issues
- **User** — adoption barriers, usability problems, unmet expectations
- **Business** — revenue impact, competitive response, market timing
- **Operational** — support load, documentation gaps, training needs
- **Dependencies** — third-party services, cross-team handoffs, regulatory

At least one hard look per applicable category — the most dangerous risks are the ones nobody mentions.

### Step 4: Classify — Tigers, Paper Tigers, Elephants

- **Tigers** — real, substantive risks that could cause failure. Based on evidence, past experience, or clear logic. Require action.
- **Paper Tigers** — risks that feel scary but are overblown. Document *why* the concern is manageable, plus the **trigger condition**: what would need to change for this to become a real Tiger.
- **Elephants** — risks the team knows about but avoids discussing. Surface them constructively, each with a **suggested conversation starter**.

**Tie-break rule:** Unsure whether a risk is real? Uncertainty makes it a **Tiger** to investigate before launch. Elephants are about *avoidance*, not uncertainty — if no one will say it out loud, it's an Elephant.

### Step 5: Triage Tigers by Urgency

- **Launch-Blocking** — must be solved before launch (core flow broken, regulatory blocker, key dependency unmet)
- **Fast-Follow** — must be solved within 30 days post-launch (performance issues, secondary gaps)
- **Track** — monitor post-launch; each gets a trigger condition that would escalate it

### Step 6: Action Plans for Every Launch-Blocking Tiger

Each launch-blocking Tiger gets: the risk stated clearly, a concrete mitigation, an owner (by role, from the root `CLAUDE.md` Team table), and a due date. A mitigation that says "be careful" is not a mitigation.

---

## Output Format

Save to: `product-development/product/PRDs/{area}/reviews/{feature-slug}-premortem.md`

```markdown
# Pre-Mortem: [Feature / Launch]

**Date:** [YYYY-MM-DD]
**PRD:** [path]
**Launch target:** [date or "TBD"]
**Status:** [Draft / Reviewed with team]

## Risk Summary

- **Tigers:** [N] ([X] launch-blocking, [Y] fast-follow, [Z] track)
- **Paper Tigers:** [N]
- **Elephants:** [N]

## Launch-Blocking Tigers

| # | Risk | Category | Likelihood | Impact | Mitigation | Owner | Due |
|---|------|----------|------------|--------|------------|-------|-----|
| 1 | [risk] | Technical | High/Med/Low | High/Med/Low | [concrete action] | [role] | [date] |

## Fast-Follow Tigers (within 30 days post-launch)

| # | Risk | Likelihood | Impact | Planned Response | Owner |
|---|------|------------|--------|------------------|-------|

## Track

- [Risk] — escalate if: [trigger condition]

## Paper Tigers

- **[Risk]** — manageable because [reasoning]. Becomes a real Tiger if: [trigger condition]

## Elephants in the Room

- **[Risk the team avoids discussing]** — conversation starter: "[topic-level opener for the next team meeting]"

## Launch Gate Handoff

This pre-mortem renders no launch verdict. Next:
- Fold Launch-Blocking and Fast-Follow rows into `/launch-checklist`'s Risk Mitigation section
- Track trigger conditions feed the rollback criteria
- Run `/feature-launch-gate` for the repo completeness check

## Revision History

- [YYYY-MM-DD] Initial rehearsal
```

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

## Rules

1. **Honest and constructive.** The goal is launch readiness, never blame — narrate what failed, not who failed.
2. **Apply the tie-break rule.** Uncertain risk → Tiger to investigate. Avoided risk → Elephant. Overblown risk → Paper Tiger with a trigger.
3. **Every Launch-Blocking mitigation is specific and assignable.** "Be careful with the migration" fails this rule; "dry-run the migration on a prod snapshot by [date]" passes.
4. **Elephants stay at topic level.** Product, market, execution, or org-shape topics only. The risk statement never names an individual as the risk; conversation starters address topics, not people (Privacy Contract).
5. **Owners are accountability, not assessment.** Assign by role from the root `CLAUDE.md` Team table. No capability or performance commentary about individuals anywhere in the file.
6. **No go/no-go language.** The verdict belongs to `/feature-launch-gate`. Too many Launch-Blocking Tigers? Recommend delaying or phasing the launch — recommendation, not verdict.
7. **Re-runs update the same file.** Re-rate, move resolved risks to a ✅ state, log the change under Revision History. The diff between rehearsals is the readiness signal.
8. **Push past the obvious.** If every risk was already in the PRD's §7 table, the rehearsal added nothing — the Elephants section is the highest-value output.

---

## Related Skills

**Before this:**
- `/prd-draft` - The PRD to rehearse against
- `/red-team` - Attack the plan's claims before rehearsing its execution
- `/launch-checklist` - If it already exists, the pre-mortem reads it

**After this:**
- `/launch-checklist` - Import Tigers into Risk Mitigation; Track triggers into rollback criteria
- `/feature-launch-gate` - The completeness check and the launch verdict
- `/decision-log-entry` - Record a delay or descope the rehearsal triggered

**Complements:**
- `/experiment-decision` - If a Tiger is really an untested assumption, test it
- `/feature-results` - Post-launch, compare what actually happened against the rehearsal

---

## Output Quality Self-Check

Before presenting output to the PM, verify:

- [ ] **Every Launch-Blocking Tiger row is complete:** Mitigation, Owner, and Due all filled — `/feature-launch-gate` checks this table
- [ ] **Every Paper Tiger has a becomes-real trigger:** documented reassurance without a trigger is just dismissal
- [ ] **Every Elephant has a conversation starter and names no individuals:** topic-level, meeting-ready
- [ ] **At least one risk per applicable category:** an empty category means the sweep was lazy, not that the category is safe
- [ ] **No go/no-go language anywhere:** recommendations yes, verdicts no
- [ ] **Mitigations are actions, not adverbs:** "carefully" and "closely monitor" are not mitigations without a what, who, and when
- [ ] **Re-runs preserved history:** existing file updated in place with a Revision History entry

---

## Chain Position

Stage 5 of the de-risk-a-bet chain (`product-development/product/handbook/de-risk-a-bet.md`) — upstream: `/prd-review-panel` · downstream: `/launch-checklist` (4–6 weeks out). Skip rules live in the chain doc.
