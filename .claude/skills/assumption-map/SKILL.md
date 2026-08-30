---
name: assumption-map
description: Surface every assumption a plan rests on, then rank them by impact-if-wrong and uncertainty to decide what to test first. Dual mode — feature in an existing product (Value/Usability/Viability/Feasibility) or new product / major initiative (adds Ethics, Go-to-Market, Strategy & Objectives, Team & Org). Grounds each assumption in repo evidence and hands the riskiest to /experiment-decision.
argument-hint: "[idea, PRD path, or draft]"
group: definition
---

## Quick Start

**What to provide:** A feature idea, an early draft, or a PRD path. A bare one-sentence idea is enough.

```
/assumption-map We want to add usage-based alerts to the billing dashboard
/assumption-map product-development/product/PRDs/billing/credit-usage-dashboard-prd.md
/assumption-map [paste an early draft]
```

**What you get:** A categorized inventory of every assumption the plan rests on (typically 10–25), each rated for confidence and checked against repo evidence, ranked into four verdicts — and a Test First backlog of the 1–3 assumptions to validate before building.

**Time:** 5–10 minutes. Works before a PRD exists.

---

# Assumption Map

Surface what a plan takes for granted — before you write the PRD, not after the launch review. Every idea rests on beliefs about users, the market, the business, and the build. This skill makes those beliefs explicit, checks each one against what the repo already knows, and ranks them so the team tests the riskiest belief first instead of the easiest.

**Framework credit:** The four product risks (Value, Usability, Viability, Feasibility) — Teresa Torres, *Continuous Discovery Habits*. Extended categories adapted from the assumption-mapping tradition in continuous discovery practice.

This is a **mapping** skill, not an attack. It never argues an assumption is wrong — it surfaces, rates, and ranks. Attacking is `/red-team`'s job.

---

## When to Use

- Before drafting a PRD — map the idea's assumptions so the PRD is written with open eyes
- When a PRD's Confidence Assessment table has more than 3–4 rows, or the ratings feel like guesses
- When the team agreed too quickly (fast consensus usually means unexamined assumptions)
- After experiment results land — re-run in update mode to re-rate the map
- When choosing between two directions and you want to compare what each one bets on

**When NOT to use:**

- You want a finished plan attacked, steelman-first → `/red-team`
- You want to rehearse a launch failure → `/pre-mortem`
- You need numeric sizing inputs de-risked → `/impact-sizing` (its Confidence Assessment covers model inputs)

---

## Scope Boundaries

### This Skill vs /red-team

**Use /assumption-map when:**
- Working from an idea or early draft — no finished document required
- You want the exhaustive inventory: every assumption, categorized, no cap
- The mood is constructive: deciding what to validate before building
- Output: Full categorized inventory + four-quadrant ranking + Test First backlog (top 1–3)

**Use /red-team when:**
- A written doc asserts claims and you're about to commit resources
- You want the strongest 3–5 claims attacked, steelman-first, with kill criteria
- The mood is adversarial: a fair opponent trying to break the plan
- Output: 3–5 kill-assumption contracts (Fails if / Evidence to get this week / Kill criterion / Cheapest test)

Both skills rank risky beliefs — deliberately. This skill ranks the *full inventory*; `/red-team` ranks *failure modes of load-bearing claims* in a doc. Map first, attack later.

**Handoff:** "Your map's Test First quadrant has [N] items and a PRD now exists — want `/red-team` to attack the claims the PRD builds on them?"

### This Skill vs the confidence tables in /impact-sizing and /prd-draft

`/impact-sizing` Step 3 and `/prd-draft` Step 3 each carry an `| Assumption | Confidence | ... |` table. Those tables are **summaries** — sizing-model inputs and PRD headlines. This skill is the **method** behind them: run it when the table is getting long or the ratings are guesses, then import the Test First rows back into those tables.

---

## What It Does

### Step 1: Identify the Input and Mode

Accept any of: a one-line idea, a pasted draft, or a PRD path (read it fully).

Pick the mode:
- **Feature mode** (default) — a feature or change in the existing product. Uses the 4 core risk categories.
- **Initiative mode** — a new product, a new market, or the PM says "0→1" / "new bet" / "major initiative". Adds the 4 extended categories (8 total).

If ambiguous, ask one question: "Feature in the existing product, or a new bet? (Determines whether I map 4 or 8 risk categories.)"

### Step 2: Gather Repo Evidence

Before surfacing assumptions, silently read what the repo already knows:

| Source | What to Extract |
|--------|-----------------|
| `product-development/product/strategy/business-context/business-info.md` | ICP, personas, pricing, business model — grounds Value and Viability |
| `product-development/product/strategy/current-quarter.md` | Objectives and the Explicitly Not Doing list — grounds Strategy & Objectives |
| `product-development/product/customers/` | Call summaries, research — evidence for or against Value/Usability beliefs |
| `product-development/product/competitive-research/` | Competitor moves — grounds differentiation and GTM beliefs |
| `product-development/product/decisions/` | Has this been tried or explicitly rejected before? |
| `product-development/feature-index.yaml` | Does a related feature already exist, at what status? |
| `product/initiatives/*.md` (`features:` frontmatter) | Which initiatives target it, and what artifacts they hold |
| `product-development/engineering/code-repos.yaml` → `/code-qa` | What the code does today — grounds Feasibility with repo@sha evidence instead of engineering folklore |

**Graceful degradation:** if a source is an unfilled template (bracketed placeholders), don't invent evidence — the Evidence column reads "none — business context unfilled" (for code claims: "none — no grounded code access (/connect-code)"). A map with honest "none" entries is still useful; a map with fabricated evidence is worse than no map.

### Step 3: Surface Assumptions

Think from three perspectives about why this could fail, then sweep the risk categories:

- **Product Manager:** business viability, market fit, strategic alignment, market demand, willingness to pay, competitive landscape
- **Designer:** usability, first-time experience, onboarding, adoption barriers, engagement
- **Engineer:** technical feasibility, performance, integration risks, build-vs-buy, scalability, technical debt

Write each assumption as a **falsifiable statement**. "Users will like it" is not an assumption — "SMB admins will connect billing within their first session" is.

### Step 4: Rate Each Assumption

For every assumption, record:
- **What breaks if wrong** — the concrete consequence, one clause
- **Confidence** — High / Med / Low (your belief it holds)
- **Evidence** — strong / weak / none, with a backticked repo path when strong or weak (e.g. `product-development/product/customers/accounts/{customer}/calls/summaries/{date}.md`)

### Step 5: Rank on the 2×2

Two axes: **Impact if wrong** (High/Low — from "what breaks") and **Uncertainty** (High/Low — High when Confidence is Low *or* Evidence is none/weak).

| | High uncertainty | Low uncertainty |
|---|---|---|
| **High impact** | **Test first** — validate before building | **State kill criterion + monitor** — write the threshold that would change the decision |
| **Low impact** | **Accept & track** — proceed, revisit if signals appear | **Ignore** — not worth tracking |

Tiebreaker inside Test First: **cheapness to test** — the cheapest high-impact check goes first.

Verdicts apply to **assumptions, never to the idea**. This skill never outputs "reject the idea" — if the map looks fatal, say so in one closing sentence and suggest `/red-team` or a decision log entry; the call belongs to the PM.

### Step 6: Build the Test First Backlog and Hand Off

For the top 1–3 (never more), give a one-line suggested probe — the cheapest observation that would move the belief. Do **not** design the experiment here:

- Test-vs-ship call → `/experiment-decision`
- Metric selection for the test → `/experiment-metrics`
- Designed experiments land in `product-development/analytics/experiments/{area}/` per that folder's naming convention

---

## Risk Categories

**Feature mode (always):**

- **Value** — Will it create value for customers? Does it solve a real problem? Will they keep using it?
- **Usability** — Will users figure out how to use it? Is the learning curve acceptable? Can we onboard them fast enough? Will it increase cognitive load?
- **Viability** — Can marketing, sales, finance, and legal support it? Can we monetize it? Is it worth the cost? Can we support customers who use it? Will it be compliant?
- **Feasibility** — Can we build it with current technology? Are there integration risks? Can it run efficiently and scale?

**Initiative mode (adds):**

- **Ethics** — Should we do it at all? Does it pose a risk to our customers?
- **Go-to-Market** — Can we reach the buyer? Do we have the channels? Is the messaging right for the channel? Is this the right time and launch approach?
- **Strategy & Objectives** — What does this bet assume about our strategy? Can others copy it? Do political, economic, legal, technological, or environmental factors cut against it? Does it conflict with `product-development/product/strategy/current-quarter.md`'s Explicitly Not Doing list?
- **Team & Org** — Do we have the skills, bandwidth, and tooling to build **and support** this? Answer at team level only — capability, capacity, tooling. Never assess named individuals (Privacy Contract).

---

## Output Format

Save to: `product-development/product/PRDs/{area}/reviews/{initiative-slug}-assumption-map.md`
No product area yet? Use `product-development/product/PRDs/general/reviews/{initiative-slug}-assumption-map.md` and retag when an area emerges.

```markdown
# Assumption Map: [Feature / Initiative Name]

**Date:** [YYYY-MM-DD]
**Mode:** [Feature (4 categories) / Initiative (8 categories)]
**Input:** [one-line idea / draft / PRD path]
**Sources read:** [list of repo paths, or "business context unfilled"]

## Inventory

| # | Assumption | Category | What breaks if wrong | Confidence | Evidence |
|---|-----------|----------|---------------------|------------|----------|
| 1 | [Falsifiable statement] | Value | [consequence] | High/Med/Low | strong — `path` / weak — `path` / none |

## Ranking

### Test First (high impact × high uncertainty)
- #[n] [assumption] — cheapest probe first

### State Kill Criterion + Monitor (high impact × low uncertainty)
- #[n] [assumption] — kill criterion: [threshold that would change the decision]

### Accept & Track (low impact × high uncertainty)
- #[n] [assumption] — revisit if: [signal]

### Ignore (low impact × low uncertainty)
- #[n], #[n]

## Test First Backlog

**1. [Assumption]**
- **Why it tops the list:** [impact + uncertainty + cheap to check]
- **Suggested probe:** [one line — the cheapest observation that moves the belief]
- **Next:** `/experiment-decision` to decide test-vs-ship

## Revision History

- [YYYY-MM-DD] Initial map
```

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

---

## Rules

1. **Surface and rank only — never argue.** If an assumption looks wrong, that's a Low confidence rating, not a rebuttal. Attacking is `/red-team`'s job.
2. **Every assumption must be falsifiable.** A specific observation could confirm or break it. Rewrite vague beliefs until they are testable.
3. **Evidence cites a repo path or says "none".** Never "research suggests" without a source. Unfilled business context → "none — business context unfilled".
4. **Verdicts are per-assumption, never idea-level.** The skill never recommends killing or approving the idea.
5. **Update in place.** If `{initiative-slug}-assumption-map.md` already exists, re-rate Confidence and Evidence, move assumptions between quadrants, and log the change under Revision History. Never regenerate from scratch — the history is the value.
6. **Team & Org stays at team level.** Capability, capacity, tooling. No named individuals, no performance commentary (Privacy Contract).
7. **Hand off test design.** Suggested probes are one line. Experiment design belongs to `/experiment-decision` and `/experiment-metrics`.
8. **Cap the inventory at ~25.** Beyond that, merge duplicates — an unreadable map ranks nothing.

---

## Related Skills

**Before this:**
- Nothing required — a bare idea is enough; the map works pre-PRD
- `/user-research-synthesis` or `/competitor-analysis` - Evidence sources that sharpen the map

**After this:**
- `/prd-draft` - Write the PRD with the map's Test First rows in its Confidence Assessment
- `/experiment-decision` - Decide test-vs-ship for the top assumption
- `/red-team` - Attack the load-bearing claims once a doc exists
- `/decision-log-entry` - Record a direction change the map triggered

**Complements:**
- `/impact-sizing` - Numeric sizing-model assumptions live there; import headline rows here if they're load-bearing

---

## Output Quality Self-Check

Before presenting output to the PM, verify:

- [ ] **Every row has a verdict:** no assumption left outside the four quadrants
- [ ] **Every assumption is falsifiable:** a specific observation could settle each one — no "users will like it" rows
- [ ] **The Evidence column is honest:** repo paths cited, or an explicit "none" — no vague "research suggests"
- [ ] **Test First has 1–3 items max:** a 10-item test list is an unranked list
- [ ] **No idea-level verdict appears anywhere:** the skill mapped the bet; it didn't judge it
- [ ] **Team & Org rows name no individuals:** team-level capability and capacity only
- [ ] **Update mode preserved history:** existing maps were re-rated in place with a Revision History entry, not regenerated

---

## Chain Position

Stage 1 of the de-risk-a-bet chain (`product-development/product/handbook/de-risk-a-bet.md`) — upstream: — (chain entry) · downstream: `/prd-draft`; riskiest assumptions → `/experiment-decision`. Skip rules live in the chain doc.
