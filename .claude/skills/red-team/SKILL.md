---
name: red-team
description: Attack the load-bearing claims of a PRD, strategy, or decision doc before reality does. Steelmans each claim then attacks the steelman, returning 3-5 ranked kill-assumptions with the evidence to get this week, a kill criterion, and the cheapest test — grounded in repo decisions, business context, and real analytics tables. Not an assumption inventory (/assumption-map) and not a failure rehearsal (/pre-mortem). Runs standalone on strategy and decision docs; for a PRD it also runs as the attack lens inside /prd-challenge.
group: definition
---

## Quick Start

**What to provide:** A PRD, strategy doc, decision doc, roadmap — pasted, by path, or "the current doc".

```
/red-team product-development/product/PRDs/billing/credit-usage-dashboard-prd.md
/red-team the current doc
/red-team Prioritize AI onboarding — activation is our bottleneck
```

**What you get:** The 3–5 assumptions that would make the plan fail, each steelmanned before it was attacked, ranked, and returned as an operator contract: what breaks it, the evidence to get this week, the kill criterion, and the cheapest test.

**Time:** 10–15 minutes. Run it before committing resources, not after.

---

# Red-Team

Most plans only survived polite feedback. This skill is a **sharp, fair adversary**: it finds the load-bearing assumptions that would make the plan fail, attacks them honestly, and returns — for each — the evidence to get this week, the kill criterion, and the cheapest test.

The goal is a sharper decision, not a longer risk list. **Five real kill-assumptions with tests beat twenty generic risks.**

This is a **procedure, not a persona** — no humor, no character, kill criteria instead of edit suggestions.

---

## When to Use

- Before committing resources to a bet (build starts, budget allocated, team assigned)
- Before executive review — attack it privately before someone attacks it publicly
- When a plan feels too clean, or the team agreed too quickly
- On PRDs, strategy docs, decision docs, and roadmaps — anything that asserts claims

**When NOT to use:**

- No document yet — mapping a bare idea's assumptions → `/assumption-map`
- Rehearsing how a launch fails → `/pre-mortem`
- The full multi-lens critique of a PRD (this attack included) → `/prd-challenge`

---

## Scope Boundaries

### This Skill vs /pre-mortem

A pre-mortem imagines the plan **already failed** and narrates why. A red-team attacks the load-bearing assumptions and logic **now**, while there's still time to test the cheapest one.

**Use /pre-mortem when:** a ship moment exists and you want the failure rehearsed into owned, dated mitigations.
**Use /red-team when:** you're deciding whether to commit at all, and want the riskiest claim tested this week.

**Handoff:** "The attack survived — if you're proceeding to launch, `/pre-mortem` rehearses what could still go wrong operationally."

### This Skill vs /prd-challenge and /assumption-map

- `/prd-challenge` = **the full parallel critique of a PRD** — this attack plus the assumption inventory, the 7 personas, and the failure rehearsal, synthesised into one report. On a PRD, prefer it; run `/red-team` alone for depth on demand between challenges, or on any non-PRD doc.
- `/assumption-map` = the **exhaustive inventory** of everything a plan assumes. `/red-team` = the **selective attack** on the claims a doc rests on. Map first, attack later — the challenge runs both in parallel, blind to each other.

---

## What It Does

### Step 1: Identify the Document

1. **Pasted content** — use it directly
2. **File path** — read it fully
3. **"the current doc"** — use the document already in context
4. **Nothing specified** — check `product-development/product/PRDs/{area}/` for the most recently modified PRD and confirm before proceeding

### Step 2: Ground in Repo Context (before attacking)

Silently check what the repo already knows — attacks grounded in the team's own evidence beat generic skepticism:

| Source | What to Extract |
|--------|-----------------|
| `product-development/product/decisions/` | Have we been here before? Was this bet already tried, rejected, or reversed? |
| `product-development/product/strategy/business-context/business-info.md` | Real ICP, pricing, business model — so attacks target the actual claims, not generic ones |
| `product-development/product/strategy/current-quarter.md` | Does the plan contradict the objectives or the Explicitly Not Doing list? |
| `product-development/product/customers/` + `product-development/product/competitive-research/` | Are the user and market claims supported by anything on file? |
| `product-development/analytics/data-catalog.yaml`, `analytics/metrics/{area}/`, `analytics/queries/{area}/` | What evidence is actually gettable this week — name real tables and queries in the contracts |
| `product-development/engineering/code-repos.yaml` → `/code-qa` | What the implementation actually does — attack "the system already handles X" claims with repo@sha citations, not memory |

**Degradation rule:** unfilled context is logged under **What I Couldn't Assess** — never invented, never silently skipped.

### Step 3: Extract Every Claim

List what the plan asserts as true — about the **user, the market, the constraint, the mechanism, the timeline**. Separate **load-bearing** claims (if false, the plan dies) from cosmetic ones. Only load-bearing claims are worth attacking.

### Step 4: Steelman, Then Attack

For each load-bearing claim, first state the strongest version of why it might be true. Then attack *that* — not a strawman. An attack on a weak version of the claim is worthless.

### Step 5: Write Each Failure Mode as "Fails if ___"

Concrete and falsifiable. "Fails if activation isn't actually the constraint" beats "execution risk."

### Step 6: Rank

Rank by **(impact if wrong) × (likelihood wrong) × (cheapness to test)** — each rated High/Med/Low. The top of the list is what to test *this week*: high-impact, plausibly wrong, cheap to check. Surface the ranking; don't bury the lede.

### Step 7: Write the Contracts

For each surviving kill-assumption (3–5 max), give the operator something to do:

- **Fails if:** the precise condition that breaks the plan
- **Evidence to get this week:** the specific data, query, or conversation that would confirm or kill it cheaply — name a real repo artifact, warehouse table, or person-by-role wherever possible
- **Kill criterion:** the threshold at which you'd stop or change course
- **Cheapest test:** the smallest experiment that moves the belief

### Step 8: Credit What Holds

Default to "this risk is real" unless the plan already cites evidence against it. But if a claim is genuinely well-reasoned, say so plainly — a red-team that manufactures doubt is as useless as one that rubber-stamps. **Never invent a weakness the plan doesn't have.**

---

## Output Format

Save to: `product-development/product/PRDs/{area}/reviews/{doc-slug}-red-team.md`
For docs living outside `PRDs/` (strategy, decisions), save to a `reviews/` subfolder beside the doc.

```markdown
# Red-Team: [plan in one line]

**Reviewed:** [YYYY-MM-DD]
**Document:** [path or "pasted content"]
**Context sources read:** [repo paths checked, or "business context unfilled"]

## Top Kill-Assumptions (ranked)

### 1. [Claim — the load-bearing assertion]
- **Steelman:** [strongest version of why it might be true]
- **Fails if:** [concrete, falsifiable condition]
- **Evidence to get this week:** [specific — a named table/query, repo doc, or conversation]
- **Kill criterion:** [threshold]
- **Cheapest test:** [smallest experiment]

[3–5 max]

## What's Well-Reasoned

[State explicitly what holds up — and why. Don't manufacture doubt.]

## What I Couldn't Assess

[Gaps where the plan or the repo didn't give enough to judge — including unfilled business context.]

## Do Next

- Kill criteria → PRD section 7 (Risks and Recovery)
- Top test → `/experiment-decision` (test-vs-ship) + `/experiment-metrics` (metric selection)
- Changed the call? → `/decision-log-entry`
```

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   `CLAUDE.md` (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Feature-scoped artifact → propose the `product-development/feature-index.yaml` addition
   and apply it only after the user confirms (Tier 2 in `governance/write-policy.yaml`).
   Initiative-scoped → link the artifact from `product-development/product/initiatives/{slug}.md`.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.

---

## Rules

1. **No strawmanning.** Attack the steelman or don't attack.
2. **No generic risk lists.** Every item must be specific to *this* plan — if the sentence would fit any PRD, cut it.
3. **Self-refute, never fabricate.** If it's sound, say so. A manufactured weakness costs the skill its credibility.
4. **3–5 kill-assumptions MAX.** If you want the full inventory, that is `/assumption-map`.
5. **Evidence points at real artifacts.** Prefer a backticked repo path, a named warehouse table from `product-development/analytics/data-catalog.yaml`, or a conversation named by role.
6. **Attack claims, not people.** Never read `product-development/product/strategy/business-context/stakeholders.md` for ammunition. Conflicts are phrased against artifacts ("the estimate conflicts with `product-development/analytics/metrics/{area}/` definitions"), never against their authors.
7. **End with what to *do*, not what to fear.** The emotional job is relief from the fear of confidently shipping the wrong bet.
8. **Unfilled context goes to What I Couldn't Assess.** Never invent the evidence the repo doesn't have.

---

## Related Skills

**Before this:**
- `/assumption-map` - Build the full inventory before attacking the load-bearing subset
- `/prd-draft` - Write the PRD to attack

**After this:**
- `/experiment-decision` - Turn the top kill-assumption's cheapest test into a test-vs-ship call
- `/decision-log-entry` - Record it if the attack changed the decision
- `/pre-mortem` - Rehearse the launch failure once you commit
- `/prd-draft` - Rewrite the riskiest section to address what survived

**Complements:**
- `/prd-challenge` - The full parallel critique; this skill is its attack lens

---

## Output Quality Self-Check

Before presenting output to the PM, verify:

- [ ] **Every kill-assumption was steelmanned first:** the strong version of the claim appears before the attack
- [ ] **Every "Fails if" is falsifiable:** a specific observation could settle it — no "execution risk" entries
- [ ] **Evidence fields are executable this week:** a named table, query, doc, or role-level conversation — not "do more research"
- [ ] **What's Well-Reasoned is non-empty, or the doc is truly hollow:** balance is what makes the attack credible
- [ ] **Count is 3–5 and ranked:** no ties dodged, the lede is not buried
- [ ] **No people-attacks:** every conflict cites an artifact, not an author

---

## Chain Position

Stage 3 of the de-risk-a-bet chain (`product-development/product/handbook/de-risk-a-bet.md`) — upstream: `/prd-draft` · downstream: `/prd-challenge` (which also invokes this skill as its attack lens). Skip rules live in the chain doc.
