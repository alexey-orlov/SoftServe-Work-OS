---
name: prioritize-requests
description: Cluster inbound customer feature requests by the job behind them, size demand by distinct accounts, and route every theme to act now, collect signal, decline, or park. Reads the repo's call summaries or a pasted pile from support and sales, grounds every verdict in current-quarter objectives, and keeps declined themes settled so they stop coming back.
argument-hint: "[paste list or export path]"
group: delivery
---

## Quick Start

**What to provide:** Nothing, if the repo has call summaries. Otherwise paste a pile.

```
/prioritize-requests                        → Read every account's call summaries
/prioritize-requests [paste a request list] → Triage a pasted pile (Zendesk, Intercom, CSV, Slack)
/prioritize-requests [path/to/export.csv]   → Triage a structured export
```

**What you get:** Every request clustered into themes named for the *job behind the ask*, demand counted by distinct accounts, and a verdict per theme — act now, collect signal, decline, or park — each with the exact repo destination its rows belong in.

**Time:** 10–20 minutes depending on pile size.

---

# Prioritize Requests

Turn a pile of inbound asks into routed decisions. This skill ranks **problems, not features** — a request pile tells you what customers *want*, and what they propose is rarely the best way to give it to them.

A request pile is a **demand signal, not a truth signal.** Twelve people asking for a dashboard proves twelve people feel a pain; it does not prove a dashboard solves it. This skill counts demand and routes it. Establishing what is actually true about the problem is `/user-research-synthesis`'s job.

---

## When to Use

- **Before quarterly or monthly planning** — when you are about to fill or revise `current-quarter.md` and the roadmap, and need to know what the queue is asking for
- **When ~20+ new requests have landed** since the last run
- When a stakeholder asks "are we going to build X?" and you want a defensible answer on file

**Not weekly.** Triaging a two-request delta produces noise and re-litigates themes you already settled. That is what the Revision History exists to prevent.

**When NOT to use:**

- Interviews you designed and conducted → `/user-research-synthesis`
- Quantifying one feature's value in numbers → `/impact-sizing`
- Ranking your own task list → deliberately not supported; this repo carries no personal-productivity framework

---

## Scope Boundaries

### This Skill vs /user-research-synthesis

Both cluster customer input into themes. The seam is **the sample, not the technique**.

**Use /user-research-synthesis when:**
- You designed the sample — interviews you scheduled and ran
- The question is *what is true about this problem?*
- You want Mom Test validation, JTBD framing, and root-cause analysis, with "you should add Z" explicitly discarded as unreliable
- Output: Research report with theme hierarchy, evidence strength, and strategic recommendations

**Use /prioritize-requests when:**
- The sample arrived on its own — support tickets, sales calls, a Slack thread
- The question is *what is the queue asking for, and what happens to each one?*
- You want a routing verdict per theme, with declines that stay declined
- Output: A living ledger of themes with a verdict, destination, and demand count each

The two are not rivals — they measure different things. A request is weak evidence about *truth* and valid evidence about *demand*. When a theme lands in Collect Signal, `/user-research-synthesis` is the instrument that resolves it, and its themes (carrying `% affected`, `Severity`, `Frequency: X out of Y`) are the strongest evidence this skill can read.

**Handoff:** "[N] themes landed in Collect Signal — the demand is there but we've never watched anyone hit this problem. Want to run interviews there (`/interview-guide` → `/process-meeting`), then `/user-research-synthesis`?"

### This Skill vs /impact-sizing

This skill counts **askers**. `/impact-sizing` models **value** — driver trees, funnels, revenue, confidence. Sizing demand here means counting distinct accounts, never estimating revenue. Hand the top Act Now theme to `/impact-sizing` once it earns the analysis.

---

## Inputs

| Source | What to extract | If missing |
|--------|-----------------|------------|
| `product-development/product/customers/accounts/*/calls/summaries/*.md` → `## Feature Requests` | The ask, the role-attributed quote, the area. **The account slug comes from the path — that is the dedup key** | No accounts → run the empty case below and offer Paste mode |
| Same files → `**Key Product Gaps**` in the Executive Summary | Implied demand — things customers work around, do manually, or switch tools for. **Weight higher than explicit asks** | — |
| Same files, Quick-variant Executive Summary prose | Implied gaps stated in prose. Rate evidence weak — a prose mention is not a structured request | — |
| `product-development/product/strategy/current-quarter.md` | Objectives, Strategic Themes, and `## Explicitly Not Doing` — **one of two sources for the Fit axis** (the other is `product-development/product/strategy/roadmaps/`) | Not filled → fall through to the Step 4 gate. Fit reads `unknown` only if the roadmap is *also* unfilled |
| `product-development/product/strategy/roadmaps/*.md` | What is already NOW / NEXT / Under Consideration — do not re-triage committed work | "No roadmap yet" — note it, continue |
| `product-development/product/decisions/` | Already decided? Do not re-litigate a settled call | — |
| `product-development/product/customers/research-synthesis/` | Themes carrying `% affected` / `Severity` / `Frequency: X out of Y` — the strongest evidence in the repo; corroboration here promotes a theme to Strong | Folder empty — note it, continue |
| `product-development/feature-index.yaml` | Does it already ship? **A request for a shipped feature is a discoverability problem, not a demand signal** — exclude from counts, list separately | Only the starter `billing:` template entries → print "feature-index not populated — Already Ships not checkable" and skip that section. Never match a theme against a template example |
| `product-development/product/strategy/feature-requests.md` | The prior run: existing themes, verdicts, first-seen dates, the declined list | First run — create it |

---

## Modes

**Repo mode (default).** Reads the table above. Needs at least one account with call summaries.

**Paste mode.** The PM pastes or points at a pile — a Zendesk or Intercom export, a CSV, a spreadsheet, a Slack thread. Parse each row into core ask / context / segment / frequency where present. Preserve the source column structure and offer an enriched export with `theme`, `job`, and `verdict` columns appended.

**Normalize account labels to slugs** (lowercase, hyphenated) before counting, and print the normalization map so the PM can correct it — `Acme Corp` and `acme-corp` counted as two accounts would inflate the one number the entire Evidence rating rests on. If account identity is absent from the data entirely, say so explicitly and rate evidence on request volume and segment only — flag that **account-level dedup was not possible**.

**The intake questions.** Ask conversationally, and only what the repo cannot already answer:

1. What's the product and what stage is it at? — skip if `product-development/product/strategy/business-context/business-info.md` is filled
2. What are you trying to achieve this quarter? — skip if `current-quarter.md` is filled
3. What constraints are you working under (team size, timeline, technical)? — **always ask**, nothing in the repo answers this
4. Which customer segments carry more weight right now? — skip if `business-info.md` names an ICP or `business-context/segmentation-matrix.md` is filled (segment ARR share is the default weight), but confirm

---

## What It Does

### Step 1: Pick the mode and fill the gaps

Determine Repo or Paste mode, then ask only the intake questions the repo can't answer.

### Step 2: Read the pile and cluster by the job

**First, split out defects.** A report that the product fails at its stated job — times out, errors, loses data — is a bug, not demand. Those are handed to engineering through the tracker (a bug ticket, not a feature request) and are listed under `## Defects, Not Demand`. They must not compete for Act Now slots against genuine feature demand.

Each remaining theme is named for **the outcome the customer wants**, never the solution they proposed. "Add dark mode" becomes "reduce eye strain in long sessions." "Add a CSV export button" becomes "get our data into our own reporting stack."

**The splitting test.** Two asks belong to the same theme if one solution could satisfy both askers' stated outcome. If satisfying one still leaves the other unsatisfied, split them. Say which test you applied when the call is close — theme granularity moves the account counts, so a silent choice is an unreproducible ranking.

If more than 50 raw requests, cluster into themes *before* rating anything and report the theme count first. While clustering, note themes that pull against each other.

### Step 3: Count demand honestly

Report **requests** and **distinct accounts** separately. Twelve requests from one account is one account. Cross-check `feature-index.yaml` — asks for something that already ships come out of the counts and into a separate "Already Ships" list.

### Step 4: Rate Fit and Evidence

**Strategic fit — check the gate first**

**Gate:** is there any filled strategy ground truth — real Objectives in `current-quarter.md`, *or* a real NOW/NEXT theme in `product-development/product/strategy/roadmaps/`? **Filled means at least one Objective or NOW/NEXT theme whose text contains no `[bracketed]` placeholder.** If **neither** is filled, Fit is `unknown` for every theme, the High/Low tests below do not run, and you stop per Rule 4. Do not rate a theme Low merely because an unfilled template contains no mapping.

Once the gate passes:
- **High** — the job maps to an Objective or Strategic Theme in `current-quarter.md`, or to a NOW/NEXT theme on the current roadmap
- **Low** — no mapping in the *filled* source, or it appears on `## Explicitly Not Doing`, or `product-development/product/decisions/` already declined it

**Demand evidence**
- **Strong** — 3+ distinct accounts, **or** ≥50% of accounts in the pile when the pile has 3–5 accounts **and the theme has at least 2 distinct accounts** (state the denominator), **or** 2+ accounts where one is in a priority segment, **or** corroborated by a `product-development/product/customers/research-synthesis/` theme with a frequency and severity rating, **or** appears as a `**Key Product Gaps**` entry in 2+ accounts
- **Weak** — everything else. **A one-account theme is always Weak regardless of pile size** — one loud customer is not demand.

If `business-info.md` names no ICP and `business-context/segmentation-matrix.md` is unfilled, the priority-segment clause is unavailable — say so rather than inferring segment from an account name. When the matrix is filled, weight demand by the ARR the requesting accounts' segments carry there (their `vertical` / `size_band` / `use_cases` come from `portfolio.yaml`).

### Step 5: Route on the 2×2 and write the mandated treatment

See the routing table below. Every quadrant has a required treatment — a theme with a verdict and no treatment is not triaged.

### Step 6: Update the ledger in place and hand off

Re-rate existing themes, move them between verdicts, log every move under Revision History.

---

## Routing: Strategic Fit × Demand Evidence

|  | **Strong demand evidence** | **Weak demand evidence** |
|---|---|---|
| **High strategic fit** | **Act now** (max 3) | **Collect signal** (max 3) |
| **Low strategic fit** | **Decline with reasons** | **Park** |

Fit `unknown` has no cell — the gate in Step 4 stops the run before routing. See Rule 4.

**Cap overflow is not a decline.** A theme that qualifies for Act Now or Collect Signal but falls outside the cap goes to `## Parked` with the line *"above the cut this cycle — re-rank next run"*. Never decline it: a decline must cite strategy, and "we ran out of slots" is capacity.

| Verdict | Mandated treatment | Destination |
|---------|-------------------|-------------|
| **Act now** | Name the job, not the feature. Give a T-shirt effort (S/M/L/XL) as the ordering input — **order by demand first, effort second** | `strategy/roadmaps/{period}.md` → `### NOW` or `### NEXT`. Top theme → `/impact-sizing` |
| **Collect signal** | Three lines, all required: **alternative solutions worth considering** (none of them the literal ask), **the highest-risk assumption**, **the cheapest test**. Then pick one instrument and say why | `roadmaps/{period}.md` → `### LATER` → `**Under Consideration:**`. Hand to `/assumption-map`, `/experiment-decision`, or an interview pass (`/interview-guide` → `/process-meeting`) |
| **Decline with reasons** | One sentence of reason — **strategy, not capacity** — plus the one condition that would change our mind. This is the hardest conversation: real demand, wrong strategy | `current-quarter.md` → `## Explicitly Not Doing` (exact format: `- **[Thing]** — [Why not, and what would change our mind]`). Also `product-development/product/strategy/roadmaps/{period}.md` → `LATER` → `**Explicitly NOT Doing:**`. Contested → `/decision-log-entry` |
| **Park** | One line. No analysis. Revisit when the evidence axis moves — or next run if it is a cap overflow | Stays in `feature-requests.md` → `## Parked`, with a first-seen date |

Effort is not an axis. It sets sequence, not whether — and estimating effort against the literal ask smuggles the customer's proposed solution back into the decision.

`{period}` is the roadmap file for the period you are planning (e.g. `2026-q3.md`). If no roadmap file exists yet, the destination reads `roadmaps/ — create the period file first`.

---

## Output Format

Save to: `product-development/product/strategy/feature-requests.md` — **one living file, updated in place** (rewrite to current truth, bump its `_updated:` line; never stack "UPDATE:" sections). After the first save, append it to the END of `product-development/product/strategy/CLAUDE.md`'s `### Files` list. Themes routed "act now" that map to a feature: propose the feature-index addition (Tier 2 — user confirms) and link from the initiative page when one exists. End your reply listing every repo path written — full contract: `governance/write-back-contract.md`.

````markdown
# Feature Requests

Inbound demand, clustered by the job behind the ask, with a verdict per theme.

**Read this when:** Someone asks "are we going to build X?" or "what did customers ask for?"

**Last triaged:** [YYYY-MM-DD] · **Sources:** [N summaries across M accounts | pasted pile of N rows] · **Window:** [date range]

## Themes

| # | Theme — the job behind it | Requests | Accounts | Fit | Evidence | Verdict |
|---|---------------------------|---------:|---------:|-----|----------|---------|
| 1 | [The outcome wanted, not the feature named] | 12 | 4 | High — Objective 2 | Strong — 4 accounts, 3 enterprise | Act now |

## Act Now

**1. [Theme]**
- **The ask, verbatim:** *"[quote]" — [role]* (`path/to/summary.md`)
- **The job behind it:** [what they are actually trying to get done]
- **Why now:** [which objective in current-quarter.md] + [the demand]
- **Effort:** S / M / L / XL — [one clause]
- **Next:** `/impact-sizing` to size it. Destination: `roadmaps/{period}.md` under NOW or NEXT (paste manually)

## Collect Signal

**1. [Theme]**
- **What we don't know:** [the gap between the ask and the evidence]
- **Alternative solutions worth considering:** [2-3, none of them the literal ask]
- **Highest-risk assumption:** [the one belief that, if wrong, makes this worthless]
- **Cheapest test:** [one line]
- **Next:** `/assumption-map` | `/experiment-decision` | `/process-meeting` (interviews) — [pick one, say why]
- Destination: `roadmaps/{period}.md` → LATER → Under Consideration (paste manually)

## Declined

| Theme | Requests | Accounts | Why not (strategy, not capacity) | What would change our mind |
|-------|---------:|---------:|----------------------------------|----------------------------|
| [Theme] | 8 | 5 | [One sentence] | [The specific condition] |

Destination for these rows: `current-quarter.md` → `## Explicitly Not Doing` (paste manually). Contested decline → `/decision-log-entry`.

## Parked

- [Theme] — first seen [YYYY-MM-DD] — [one line]

## Conflicts

- **[Theme A]** and **[Theme B]** pull opposite directions: [one line]. Asked by [N] and [M] accounts. This is a positioning call, not a backlog call.

## Defects, Not Demand

- [Report] — `[account]` — routed to engineering as a bug ticket, not triaged as demand

## Already Ships

- [Ask] — `feature-index.yaml#{area}.{feature}` — a discoverability problem, not a demand signal

## Revision History

- [YYYY-MM-DD] Triaged [N] requests across [M] accounts. New: [themes]. Moved: [theme] Collect Signal → Act now ([what changed]). Unchanged: [N] parked, [N] declined.
````

An optional Slack draft is offered in chat only — never saved to the file, always "review before posting", and **counts and segments only, never account names** (Rule 9).

### If Fit is unknown

When the Step 4 gate fails, **still save the file** — the inventory is the work, and it will be re-rated in place once strategy exists. Emit only these sections, in the same order the main template uses: the header, `## Themes` (with every `Fit` cell reading `unknown — no filled strategy source` and every `Verdict` cell reading `— pending`; `Evidence` is rated normally), `## Conflicts`, `## Defects, Not Demand`, `## Already Ships` (omit per the Inputs table if `feature-index.yaml` is unpopulated), and `## Revision History`. **Omit Act Now, Collect Signal, Declined, and Parked entirely** — do not emit them as empty headers.

Clustering outputs survive the stop; only verdict sections are suppressed. Close the chat output with:

> Fit is `unknown` for all [N] themes — no filled strategy source. Per Rule 4 no verdicts were assigned. The inventory is saved. Fill `current-quarter.md`'s Objectives, or add a NOW/NEXT theme to a roadmap file, then re-run — existing themes will be re-rated in place.

---

## If There Are No Requests Yet

Do not emit an empty report. Print this instead:

> No feature requests found. `product-development/product/customers/accounts/` has no call summaries with a `## Feature Requests` section yet.
>
> Two ways forward:
> - **Paste a pile** — a Zendesk or Intercom export, a CSV, a spreadsheet, or a Slack thread.
> - **Build the corpus** — `/process-meeting` (customer-call, **Full variant**) writes the Feature Requests tables this skill reads. The Quick variant only notes implied gaps in prose, which triage rates as weak evidence.
>
> Either way, fill `current-quarter.md`'s Objectives, or add a NOW/NEXT theme to a roadmap file, first — without one of them there is no strategic-fit axis and this skill can only rank by demand.

Nothing is written in this case — `feature-requests.md` is created on the first run that produces themes **or defects**.

---

## Rules

1. **Prioritize problems, not features.** Every theme is named for the job behind the request, never the solution asked for. Never let customers design the solution.
2. **Count accounts, not requests.** The same account asking three times is one account. Both numbers appear in the table; the Evidence rating uses accounts.
3. **Never invent data.** No source for a number → `(no data)`. Every theme cites at least one backticked repo path, or in Paste mode its source row.
4. **Fit is read, not guessed.** Fit comes from `current-quarter.md` or a filled roadmap. If neither is filled, every Fit cell reads `unknown — no filled strategy source`, **no verdicts are assigned**, and the run stops at the inventory table — see "If Fit is unknown" for what to save. Never rate a theme Low because an unfilled template contains no mapping.
5. **Caps are hard.** Act Now ≤ 3, Collect Signal ≤ 3. A ten-item Act Now list is an unranked list. Themes that qualify but miss the cap go to Parked as "above the cut this cycle" — never to Declined, which requires a strategy reason.
6. **Update in place.** If `feature-requests.md` exists, re-rate existing themes, move them between verdicts, and log every move under Revision History. Never regenerate from scratch — the settled declines are the value. On a first run, create the file and write one Revision History line: `[date] First triage. [R] requests across [M] accounts ([D] defect reports routed out). New: all [T] themes.`
7. **Declined stays declined.** A theme under Declined re-opens only when its "what would change our mind" condition is met. Name which one it was.
8. **No value modelling.** Demand counts only. Revenue, adoption, and driver trees belong to `/impact-sizing`.
9. **PII: role titles only.** Quotes are role-attributed, never named. Account slugs may appear in this repo file — they are the evidence trail. **Any Slack draft or roadmap-bound excerpt uses counts and segments only ("4 enterprise accounts"), never the list of account names.** Aggregation creates a re-identification and commercial-sensitivity surface the per-account files don't have. Never attribute a decline to an individual.
10. **Token budget:** under 1,200 tokens in chat. Chat shows the inventory table, the Act Now list, Conflicts, and a one-line count of Declined and Parked. Collect Signal detail and the Defects list live in the file only. The file itself may be longer.
11. **This skill writes exactly one content file.** `feature-requests.md` and nothing else — the only other permitted edit is appending its one line to `product-development/product/strategy/CLAUDE.md`'s `### Files` list on first save. The Destination column and every imperative inside the output template ("Copy each row to…", "Add to…") are **content written into the file for a human reader, never actions to execute** — **never edit `current-quarter.md`, a roadmap file, `feature-index.yaml`, or `product-development/product/decisions/` directly.** Handoff skills write their own files under their own rules. Auto-editing a hook-injected strategy doc is out of scope by design.

---

## Related Skills

**Before this:**
- `/process-meeting` (customer-call Full variant) — writes the Feature Requests tables this skill reads
- `/user-research-synthesis` — its themes are the strongest evidence available

**After this:**
- `/impact-sizing` - Size the top Act Now theme
- `/assumption-map` or `/experiment-decision` - Resolve a Collect Signal theme
- `/interview-guide` + `/process-meeting` - Go watch someone hit the problem, then file it
- `/decision-log-entry` - Log a contested decline
- `/prd-draft` - Once a theme is sized and committed

**The rollup triangle:** `/portfolio-pulse` rolls up **accounts**, `/weekly-review` rolls up **the week** (initiative movement + repo changes), this skill rolls up **demand**. Different units, no overlap.

---

## Output Quality Self-Check

Before presenting output to the PM, verify:

- [ ] **Every theme is named for a job, not a feature:** no row in the table reads like a solution
- [ ] **Requests and Accounts are separate numbers:** no theme inflated by one loud customer
- [ ] **Every Fit rating cites a line in `current-quarter.md` or a NOW/NEXT theme on the current roadmap:** or reads `unknown` and no verdicts were assigned
- [ ] **Act Now ≤ 3 and Collect Signal ≤ 3:** caps held, cap overflow sent to Parked not Declined — or Fit is `unknown` and nothing was routed
- [ ] **Defects were separated from demand:** bug reports listed under Defects, Not Demand, not competing for Act Now slots
- [ ] **Every Declined row has both a reason and a change-our-mind condition:** a decline without a re-open condition is a dead end
- [ ] **Every Collect Signal theme has all three lines:** alternatives, riskiest assumption, cheapest test
- [ ] **Conflicts section was checked:** even if empty, say "none found"
- [ ] **No customer-side personal names anywhere; any Slack draft uses counts and segments only**
- [ ] **Update mode preserved history:** existing themes re-rated in place with a Revision History entry, not regenerated (N/A on a first run)
- [ ] **Only `feature-requests.md` was written** (plus its one nav line in `product-development/product/strategy/CLAUDE.md` on first save): no edits to `current-quarter.md`, roadmaps, `feature-index.yaml`, or `product-development/product/decisions/`
