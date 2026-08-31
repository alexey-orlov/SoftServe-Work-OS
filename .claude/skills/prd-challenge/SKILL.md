---
name: prd-challenge
description: The one challenge command for a PRD — orchestrates every critique lens in parallel and blind to each other (assumption mapping via /assumption-map, steelmanned attack via /red-team, Cagan's four risks via the 7 reviewer personas, failure rehearsal via /pre-mortem when a solution and rollout exist), then synthesises one deduplicated report that leads with the ranked unverified assumptions and the next research step for each. Invokes the real skills — never reimplements them; each writes its own artifact as always. Use on /prd-challenge, "challenge this PRD", "review the PRD from all sides". NOT for a bare idea with no document (/assumption-map), a strategy or decision doc (/red-team directly), a job spec (/job-spec-challenge) or breakdown (re-run /jobs-breakdown — it re-gates), or the launch-readiness completeness verdict (/feature-launch-gate).
argument-hint: "[PRD slug or path] [--lenses ...]"
group: definition
---

## Purpose

One command, every critique lens, one coherent result. The PM should never have to know which of four review skills to run — this skill runs them all, independently, and merges what comes back.

Grounding (why this shape): independent parallel judgments prevent the first reviewer's framing from anchoring the rest (decision hygiene); a whole panel critiquing beats one appointed contrarian (structured self-critique vs devil's advocacy); and most failures trace to assumptions nobody labelled as assumptions — so the ranked assumption inventory leads the report at every maturity, early or late.

## Usage

- `/prd-challenge` — challenge the most recent PRD (confirm before running)
- `/prd-challenge [slug or path]` — challenge a specific PRD
- `/prd-challenge --lenses "map,attack,personas,premortem"` — subset when the PM asks for less

**Scope:** the full critique of one PRD. The lens skills stay directly invokable for their standalone uses — `/assumption-map` on a bare idea, `/red-team` on a strategy or decision doc, `/pre-mortem` standalone closer to ship. This skill renders no launch verdict — that stays `/feature-launch-gate`'s.

---

## The Lenses

| Lens | Runs via | Runs when | Contributes |
|------|----------|-----------|-------------|
| **Assumptions** | `/assumption-map` (its SKILL.md, end to end) | Always — feature mode by default, initiative mode for a new-product bet (adds Ethics / GTM / Team & Org) | The falsifiable, confidence-rated, 2×2-ranked assumption inventory |
| **Attack** | `/red-team` (its SKILL.md, end to end) | Always — returns less on a thin doc, and says so | Steelmanned kill-assumption contracts: fails-if / evidence this week / kill criterion / cheapest test |
| **Four risks** | The 7 PRD-panel personas in `.claude/agents/reviewers/` (seat table below) | Always | Value (customer-voice, uxr-analyst) · Usability (designer) · Feasibility (engineer) · Viability (executive, legal) · plus skeptic |
| **Failure rehearsal** | `/pre-mortem` (its SKILL.md, end to end) | Only when the PRD's Solution and Rollout sections exist and are not `[GAP:]`-only — no ship-shaped content, nothing to rehearse. No dates involved. | Prospective hindsight: Tigers / Paper Tigers / Elephants |

**Independence rule:** all lenses run **in parallel, blind to each other** — single message, multiple Task calls; no lens sees another's output before synthesis. Never run them sequentially.

**Thin-doc rule:** a lens with nothing to assess reports *"nothing to assess — this section is a `[GAP:]`"* rather than inventing critique. A thin PRD legitimately produces a short report dominated by the assumption inventory. There are no staging rules to remember; the PRD's own content gates the depth.

---

## Workflow

### Step 1: Pick and read the PRD

Named → find it in `product-development/product/PRDs/{area}/`. Unnamed → list PRDs modified in the last 30 days, ask — excluding `*-jobs-breakdown.md` and `*-job-spec.md` files, which are not PRDs (challenge a job spec via `/job-spec-challenge`). Read fully; note the stage, the sections present, and which sections are `[GAP:]`-only. Read the initiative page (`product-development/product/initiatives/{slug}.md`) for what evidence is already attached.

### Step 2: Decide the lens set

- All four lens groups by default.
- Drop `/pre-mortem` (with a stated reason in the report) when Solution and Rollout are absent or `[GAP:]`-only.
- Initiative mode for `/assumption-map` when this is a new product / 0→1 / major-initiative bet.
- `--lenses` subsets, but the report must name what was skipped and why.

### Step 3: Spawn every lens in parallel — one message, multiple Task calls

**Skill lenses** — the skill files are the source of truth; the sub-agent prompt is only a pointer plus the target:

```
You are one lens of a parallel PRD challenge. Execute the skill at
.claude/skills/{assumption-map|red-team|pre-mortem}/SKILL.md end to end against
this PRD: [path]. Follow that skill's own context loading, method, and output
format; write its artifact exactly where it specifies (PRDs/{area}/reviews/).
Work alone — do not look for other reviews of this document. When done, return:
the artifact path you wrote, plus your findings compressed to bullets — for each:
the claim/assumption/risk, why it matters, your confidence, and the concrete next
step that would verify or kill it.
```

**Persona lenses** — one Task per persona:

```
You are the [role] seat on a parallel PRD challenge panel. Read
.claude/agents/reviewers/[file] first — it defines your role, the context to load,
your framework, and your tone. Follow its "Context to Load First" section, then
apply the persona to the PRD below. Work alone. If the persona file is missing,
say so and continue with best judgment.

PRD stage and focus: [stage + stage focus]
PRD content: [full text]

Return exactly four sections:
✅ what holds up · ⚠️ concerns / unvalidated assumptions · ❌ blockers · 💡 suggestions
For every ⚠️ and ❌: name the PRD section, what breaks if you're right, and the
concrete next step (research act, query, test) that would settle it.
```

| Seat | Persona file | Risk owned |
|------|--------------|------------|
| Engineering | `engineer-reviewer.md` | Feasibility |
| Design | `designer-reviewer.md` | Usability |
| Executive | `executive-reviewer.md` | Viability (business) |
| Legal | `legal-advisor.md` | Viability (compliance) |
| UX Research | `uxr-analyst.md` | Value (evidence quality) |
| Customer Voice | `customer-voice.md` | Value (first person "I") |
| Skeptic | `skeptic.md` | General doubt |

Stage focus: Team Kickoff → problem + strategic fit · Planning Review → scope + estimates · XFN Kickoff → alignment + dependencies · Solution Review → approach + UX + edge cases · Launch Readiness → rollout + metrics + compliance.

### Step 4: Synthesise

Wait for all lenses. Then:

1. **Deduplicate across lenses** — the same finding from two lenses becomes one entry naming both sources. Nothing is laundered: every finding keeps its lens attribution.
2. **Rank the unverified assumptions** — merge the assumption inventory, the kill-assumptions, and every persona ⚠️/❌ into one table, ranked by *how much breaks if wrong* × *how little we actually know*. Cap at the ~10 that matter.
3. **Surface contradictions, never average them** — two lenses disagreeing is the signal (engineering vs design, executive vs customer). Each contradiction states both positions and what the PM must decide.
4. **Credit what holds up** — so the report is usable, not demoralising.
5. **State what couldn't be assessed** and why (gaps, missing context, skipped lenses).

### Step 5: Write the report

`product-development/product/PRDs/{area}/reviews/{initiative-slug}-challenge-{YYYY-MM-DD}.md` — dated, one per run, never overwritten: successive reports side by side show the bet getting stronger.

```markdown
---
initiatives: [initiative-slug]
prd: [path]
date: YYYY-MM-DD
stage: [stage]
lenses: [assumption-map, red-team, personas ×7, pre-mortem | skipped: … (reason)]
sub-artifacts: [paths written by the skill lenses this run]
---

# Challenge: [PRD title] — [date]

## Verdict
[One line: where this bet stands after all lenses.]

## Unverified assumptions, ranked
| # | Assumption | If wrong | Impact | Confidence | Next step to verify | Who |
|---|-----------|----------|--------|------------|--------------------|----|
| 1 | [worst first] | [what breaks] | High/Med | Low/Med | [concrete act — skill run, query, N interviews, spike] | Agent / You / [Role] |

## What holds up
- [finding] — [lens(es)]

## Contradictions between lenses
- **[Lens A]:** [position] · **[Lens B]:** [counter] → **PM decides:** [the call]

## What couldn't be assessed
- [lens or section] — [why]

## Detail by lens
[Compressed per-lens findings; skill lenses link their own artifacts instead of restating them.]
```

**Every "next step" is a concrete act** — a named skill run, a query, N interviews with a named audience, an engineering spike — tagged **Agent** (runnable now), **You** (the PM), or a role from the root CLAUDE.md team table. Never "do more research."

### Step 6: Flow the results back

1. **PRD Open Questions** — replace/update with the ranked table's rows, each with its owner. (The next `/prd-draft` run reads these and reports what moved.)
2. **Initiative page** — fill the Artifacts rows this run produced (Assumption map, Challenge report, Pre-mortem), add one dated Activity line, and put the top next-steps into Open loops with owners.
3. **Frontmatter** — the report and each sub-artifact carry `initiatives: [{initiative-slug}]`; the initiative-page update above is the whole registration (the catalog holds no artifact rows).

---

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

## Integration

**Before:** `/prd-draft` (the loop that suggests this at the right moments — it never auto-fires it), `/process-meeting` and `/user-research-synthesis` (the evidence being challenged), `/impact-sizing` (the numbers being attacked).

**After:** `/prd-draft` (fold the ranked assumptions back into the draft — the loop's next iteration), `/decision-doc` (settle a surfaced contradiction), `/experiment-decision` (the cheapest test for a top assumption), `/jobs-breakdown` → `/job-spec-draft` (once the PRD is agreed — cut it and write the buildable contracts), `/pre-mortem` standalone closer to ship, `/launch-checklist` → `/feature-launch-gate`.

**When to run:** whenever the PM wants a full critique; natural moments are when the gap count drops materially and before a stage milestone. A thin PRD is a legitimate target — the report will simply be short and assumption-heavy.

## Output Quality Self-Check

- [ ] Lenses ran in parallel and blind — no lens output fed another lens
- [ ] Skill lenses wrote their own artifacts (paths listed in the report frontmatter), not summaries in place of them
- [ ] The ranked table: every row has impact, confidence, a concrete next step, and an owner tag
- [ ] Skipped lenses named with reasons (e.g. pre-mortem: no solution/rollout yet)
- [ ] Contradictions stated as both positions + the decision needed — never averaged away
- [ ] Report saved dated (`{slug}-challenge-{YYYY-MM-DD}.md`); PRD Open Questions and initiative page updated in the same run

## Chain Position

Stage 4 of the de-risk-a-bet chain (`product-development/product/handbook/de-risk-a-bet.md`) — upstream: `/prd-draft` (the challenge folds stages 1 and 3 in when it runs; standalone `/assumption-map` and `/red-team` remain for pre-PRD ideas and non-PRD docs) · downstream: `/jobs-breakdown` → `/job-spec-draft` (stage 5, the definition→delivery bridge), then `/pre-mortem` standalone near ship and `/launch-checklist`. Skip rules live in the chain doc.
