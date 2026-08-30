---
name: job-spec-challenge
description: The one challenge command for a job spec — independent judgment on the drafted contract before it is agreed and cut into tickets. Runs every lens in parallel and blind to each other — the S1–S4 mechanical sweeps (lens files shared with /job-spec-draft), the three-amigos judgment panel (PO/BA seat for rules, ACs, and ticket-cuttability; QA Lead seat for testability; Eng Lead seat for feasibility and the engineering confirmations), legal on money/privacy/compliance/irreversibility, designer on net-new user-facing surface, market on --market — plus a source-gated /code-qa feasibility verdict and the orchestrator's own constraint line (relocation table), variation verdicts, and cut-fidelity check (does the spec test the assumption its job was cut to test). Synthesises one deduplicated report — readiness verdict for /create-tickets, decisions only you can make, ranked blocking findings, relocation table, gaps, harvested unverified claims — dated in PRDs/{area}/reviews/. Never edits the job spec — the rewrite happens on your yes via /job-spec-draft. Use on /job-spec-challenge, "challenge this job spec", "review the job spec from all sides", "is this spec ready for tickets?". NOT for a PRD (/prd-challenge), re-gating the cut (/jobs-breakdown), drafting or fixing the spec itself (/job-spec-draft), or the launch-readiness verdict (/feature-launch-gate).
argument-hint: "[job spec path | initiative J-N] [--lenses ...] [--market]"
group: definition
---

## Quick Start

**What to provide:** A job spec path, or the initiative + job (`J-2`). Nothing → I list recent job specs and ask.

```
/job-spec-challenge                                   → Challenge the most recent job spec (confirm first)
/job-spec-challenge [path | initiative J-N]           → Challenge a specific job spec
/job-spec-challenge [...] --lenses "sweeps,po-ba"     → Subset; add "skeptic" here to seat general doubt
/job-spec-challenge [...] --market                    → Adds the S5 competitor-capability sweep (evidence, never UI)
```

**What you get:** one deduplicated challenge report at `product-development/product/PRDs/{area}/reviews/{initiative-slug}-{job-slug}-job-spec-challenge-{YYYY-MM-DD}.md` — readiness verdict, decisions only you can make, ranked blocking findings, relocation table, gaps, unverified claims — with the job spec itself untouched.

---

# /job-spec-challenge — independent judgment on the contract

`/job-spec-draft` writes and self-corrects mechanically — sweeps at author time, bounded auto-closers. This skill is the judged checkpoint: reviewers who did not write the draft, run in parallel and blind, then merged into one report. The PM should never have to know which sweeps and seats to run — this skill runs them all and merges what comes back.

Grounding (why this shape): independent parallel judgments prevent the first reviewer's framing from anchoring the rest (decision hygiene, same rule as `/prd-challenge`); the judgment panel is the **three amigos** — PO/BA (product intent), Eng Lead (buildability), QA Lead (testability) — the standard panel for requirement-level review; and the machine sweeps cover the mechanical completeness dimensions role-holders skim past (inverse actions, state exits, permission holes, cross-cutting rows).

**Scope:** the full critique of ONE drafted job spec. This skill renders no launch verdict (`/feature-launch-gate`'s) and **never edits the spec** — the report is the deliverable; the rewrite happens on the PM's yes via `/job-spec-draft`, which owns the spec file.

---

## The Lenses

| Lens | Source | Runs |
|------|--------|------|
| S1 Capabilities & states | `.claude/skills/job-spec-draft/references/sweep-s1-capabilities.md` | Always |
| S2 Actors & permissions | `…/references/sweep-s2-actors.md` | Always |
| S3 Situations & exceptions — the job-level pre-mortem | `…/references/sweep-s3-situations.md` | Always |
| S4 Cross-cutting | `…/references/sweep-s4-crosscutting.md` | Always |
| S5 Market | `…/references/sweep-s5-market.md` | `--market` only |
| **PO/BA seat** | `.claude/agents/reviewers/po-ba-reviewer.md` | Always |
| **QA Lead seat** | `.claude/agents/reviewers/qa-lead-reviewer.md` | Always |
| **Eng Lead seat** | `.claude/agents/reviewers/engineer-reviewer.md` + seat focus below | Always |
| Legal seat | `.claude/agents/reviewers/legal-advisor.md` | Conditional — the job touches money, privacy, compliance, or an irreversible action (the auto-Must domains; `platform-model.md` §7) |
| Designer seat | `.claude/agents/reviewers/designer-reviewer.md` | Conditional — net-new user-facing surface: is the contract open enough for design, are flows and states complete? Never asks the spec to add UI |
| Skeptic seat | `.claude/agents/reviewers/skeptic.md` | Opt-in via `--lenses` — general doubt framed to job altitude (see Level discipline) |
| Feasibility data | `/code-qa`, source-gated exactly as `/job-spec-draft` Step 6 — verify machine-local access per `engineering/code-grounding.md`'s chain; never trust `access_tier:` alone | When `engineering/code-repos.yaml` lists a reachable repo covering the area; otherwise the report header carries `[TODO: feasibility unverified — needs /connect-code or eng consult]` — never a silent skip |

The sweep lens files live in `/job-spec-draft`'s `references/` and are shared — one source of truth for both author-time and challenge-time sweeps. Feasibility is a **data lens, not a judgment seat**: its verdict lands in the report header and is reconciled with the Eng Lead's flags at synthesis.

**Independence rule:** all lenses run **in parallel, blind to each other** — single message, multiple Task calls; no lens sees another's output before synthesis. Personas get the spec + context paths only (blind to the orchestrator's pre-pass); sweeps additionally get the variation verdicts, which stand in for a thin §5. Cross-lens handoffs a sweep proposes ("hand to S1") are resolved at fold time.

**Proportionality:** for an Integration-type job, S1–S4 may run as one combined subagent pass (say so in the report); the persona seats always run separately — independent judgment is the point of this skill — but a thin spec legitimately earns short reviews. **Thin-doc rule:** a lens with nothing to assess reports *"nothing to assess — this section is a `[GAP:]`"* rather than inventing critique.

---

## Level discipline — what this skill deliberately does not re-run

The breakdown cuts *an agreed bet, not a contested one* — bet-level lenses stay at stage 4. Their functions live here at job altitude:

| Stage-4 lens | Where its function lives here | Why the skill itself doesn't run |
|---|---|---|
| `/assumption-map` | The spec is its own inventory — evidence labels, §4's riskiest assumption, sourced reach, provisional tiers. Synthesis **harvests** every `[Hypothesis]`/`[Partial]` and provisional tier into the ranked Unverified-claims section | Bet-level assumptions were ranked at stage 4; a second 2×2 per job re-litigates the bet at the wrong level |
| `/red-team` | The job-level attack surface has named checks: the constraint line (→ relocation table), the false-thin-slice test, tier grounding (§12), and the cut-fidelity check. `--lenses` can seat the skeptic for general doubt | Its claim extraction targets user/market/mechanism/timeline — PRD altitude; kill criteria for the bet have no per-job meaning |
| `/pre-mortem` | S3 is the micro-pre-mortem at job granularity — per-step "worst realistic thing instead", feeding §11 and the Risks & break points section | Launch failure is rehearsed once per initiative at stage 6 — per-job runs would rehearse the same launch N times |

**Escalation rule:** a finding above job altitude ("this whole job rests on an unvalidated bet claim") goes to the report's *Escalate to the bet level* section, routed to `/prd-challenge` or `/red-team` on the PRD — never silently dropped, never re-litigated here.

---

## Workflow

### Step 1: Pick and read the job spec

Named (path, or initiative + `J-N` resolved via the breakdown) → read it. Unnamed → list `*-job-spec.md` files modified in the last 30 days, ask. Pointed at a `*-jobs-breakdown.md` → that is the cut, not a contract — re-gating belongs to `/jobs-breakdown`.

Then assemble context:

| Source | What to extract |
|--------|-----------------|
| The breakdown (`PRDs/{area}/{initiative-slug}-jobs-breakdown.md`) | This job's row: type, riskiest assumption, dependencies — the cut-fidelity baseline |
| The PRD + initiative page | The goal this job serves; open loops; what stage 4 already challenged |
| `strategy/business-context/platform-model.md` | Permission carriers, fixed enums, presumed-constraint domains — gates the Legal seat |
| `product-development/engineering/tech-constraints.md` | Limits, conventions, do-not-re-implement registry |
| Sibling job specs in the area | Shared objects and states — consistency findings, not reinvention |
| `PRDs/{area}/reviews/` | Prior challenges of this spec — what was already found and what moved |

Note the job's **type and risk flags** from its header (or classify from content when absent) — they gate the conditional seats and the sweep economy. An ad-hoc spec with no breakdown or PRD → proceed; cut-fidelity lands in *What couldn't be assessed* and the report suggests `/jobs-breakdown`.

### Step 2: Decide the lens set

- S1–S4 + the three seats by default; S5 on `--market`.
- Legal joins on money / privacy / compliance / irreversibility. Designer joins on net-new user-facing surface. Skeptic on request.
- `--lenses` subsets — the report names every skipped lens and why.

### Step 3: The orchestrator's own pre-pass (main context, before spawning)

1. **Constraint line** on every solution-shaped line — *if the build changed this detail, where would the problem show up?* — producing relocation candidates (Relocate / Constraint / Commit / Free up / Gap flag).
2. **Variation verdicts** per `.claude/skills/job-spec-draft/references/variation-scan.md` when §5 is missing or thin — they stand in as sweep context; a filled §5 is taken as-is.
3. **Cut-fidelity check** — §4's riskiest assumption and covers vs the breakdown row: does what is actually in scope exercise the assumption this job was cut to test?

### Step 4: Spawn every lens in parallel — one message, multiple Task calls

**Sweep lenses** (one call per sweep; where variations branch, each sweep covers all branches inside its one call):

```
You are one sweep of a parallel job-spec challenge. Read the lens at
.claude/skills/job-spec-draft/references/[file] and apply it end to end to this job
spec: [full text]. Context: [PRD path · breakdown row · platform-model.md ·
tech-constraints.md · the variation verdicts]. Work alone — do not look for other
lenses' output. Return findings only: for each, what's missing or wrong, the evidence,
and a proposed disposition — in-job (capability / rule / AC / exception row) · deferred
(risk + where it goes) · open question (owner) · constraint (rule + why) ·
commit-candidate. If the lens file is missing, say so and continue with best judgment.
```

**Persona seats** — one Task per seat:

```
You are the [role] seat on a parallel job-spec challenge panel. Read
.claude/agents/reviewers/[file] first — it defines your role, the context to load,
your framework, and your tone. Follow its "Context to Load First" section, then apply
the persona to the job spec below. Work alone. If the persona file is missing, say so
and continue with best judgment.

Job type and risk: [type + risk flags]
Seat focus: [from the seat table]
Job spec content: [full text]
Context paths: [breakdown · PRD · platform-model.md · tech-constraints.md]

Return exactly four sections:
✅ what holds up · ⚠️ concerns / unverified claims · ❌ blockers · 💡 suggestions
For every ⚠️ and ❌: name the job-spec section, what breaks downstream — in build,
test, or tickets — if you're right, and the concrete next step that would settle it.
```

| Seat | Persona file | Owns | Seat focus |
|------|--------------|------|-----------|
| PO/BA | `po-ba-reviewer.md` | Ticket-readiness | Rules unambiguous · ACs testable and traceable · scope cuttable (INVEST) · §13 owners/routes and §14 asks actionable |
| QA Lead | `qa-lead-reviewer.md` | Testability | Falsifiable ACs · §11 rows assertable · states reachable in a test environment · NFRs measurable · test data and third-party seams |
| Eng Lead | `engineer-reviewer.md` | Feasibility | Seams real (do-not-re-implement class) · §14 complete and answerable · atomicity and migration questions present · hidden complexity · flag missing effort ranges, never produce the numbers — effort is Engineering's |
| Legal | `legal-advisor.md` | Compliance | The flagged risk domains only — money, privacy, compliance, irreversibility — against §9 and the Risks & break points section |
| Designer | `designer-reviewer.md` | Solution-openness | Contract open enough for design to work · flows and states complete from a UX standpoint · never asks the spec to add UI |
| Skeptic | `skeptic.md` | General doubt | Job altitude only: attack the slice, the tiers, the evidence labels — not the bet (that was stage 4) |

**Feasibility dispatch** — when source-gated access exists, run `/code-qa` (per its own SKILL.md) in the same batch: do the assumed components / endpoints / states exist, what limits does the platform enforce today, is the integration seam real.

### Step 5: Synthesise

Wait for all lenses. Then:

1. **Deduplicate with attribution** — the same finding from two lenses becomes one entry naming both sources; nothing is laundered.
2. **Rank the blocking findings** — merge lens ❌/⚠️, sweep findings, and pre-pass verdicts into one table ranked by *what breaks downstream* × *how little we know*. Cap at the ~10 that matter.
3. **Build the relocation table** — pre-pass candidates + lens solution-smuggling flags, one verdict each (Relocate to the capability it serves · Constraint (keep) as rule + reason · Commit stamped · Free up with why · Gap flag). Nothing vanishes silently — even a freed-up line keeps its row.
4. **Harvest unverified claims** — every `[Hypothesis — needs validation]`, `[Partial]`, and provisional tier in the spec, plus lens-flagged unevidenced claims, each with the next step that would settle it (the assumption-inventory analog at this level).
5. **Surface contradictions, never average them** — each states both positions and what the PM must decide.
6. **Credit what holds up** and **name what couldn't be assessed** (missing breakdown, no code access, skipped lenses).

### Step 6: Write the report

`product-development/product/PRDs/{area}/reviews/{initiative-slug}-{job-slug}-job-spec-challenge-{YYYY-MM-DD}.md` — dated, one per run, never overwritten.

```markdown
---
initiatives: [[initiative-slug]]
job-spec: [path]
breakdown: [path#J-N | none — ad-hoc spec]
date: YYYY-MM-DD
job: [Integration | Net new | Enhancement] · risk: [flags or —]
lenses: [S1–S4, po-ba, qa-lead, engineer, … | skipped: … (reason)]
feasibility: [/code-qa verdict | TODO: feasibility unverified — needs /connect-code or eng consult]
---

# Challenge: [initiative] — [job] — [date]

## Verdict
[One line: ready to hand to /create-tickets · ready after the fixes below · not ready — and why.]

## Decisions only you can make
[Pinned first; as many as genuinely exist.]

## Blocking findings, ranked
| # | Finding | Lens(es) | What breaks downstream | Next step | Owner |
|---|---------|----------|------------------------|-----------|-------|

## Relocation table
| Original line | Verdict | Where it went / why |
|---------------|---------|---------------------|

## Gaps
[Missing inverse actions and lifecycle verbs · unreachable states · exceptions floor · silent §10 rows · false thin slice · cut fidelity.]

## Unverified claims
| Claim | Label / tier | Next step to settle it |
|-------|--------------|------------------------|

## Escalate to the bet level
[Only when a lens surfaced one — routed to /prd-challenge or /red-team on the PRD.]

## Contradictions between lenses
- **[Lens A]:** [position] · **[Lens B]:** [counter] → **PM decides:** [the call]

## What holds up
- [finding] — [lens(es)]

## What couldn't be assessed
- [lens or section] — [why]

## Detail by lens
[Compressed per-lens findings.]
```

### Step 7: Flow the results back

1. **Initiative page** — one dated Activity line.
2. **Frontmatter** — the report carries `initiatives: [{initiative-slug}]`; the initiative-page Activity line is the whole registration (the catalog holds no artifact rows).
3. **Different-job flags** from §5 verdicts → offer `/jobs-breakdown`.
4. **Bet-level escalations** → point at `/prd-challenge`.
5. **Offer the rewrite** — on the PM's yes, `/job-spec-draft` folds the accepted verdicts into the spec. One writer per surface: the spec file stays `/job-spec-draft`'s; this skill never edits it.

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

**Before:** `/job-spec-draft` (drafts the contract and suggests this at the right moment — it never auto-runs it: a judged checkpoint, not a data fetch), `/jobs-breakdown` (the cut whose row the cut-fidelity check validates against).

**After:** `/job-spec-draft` (folds the accepted verdicts on your yes), `/create-tickets` (once the spec is agreed), `/prototype` (the challenged spec is its natural input), `/decision-doc` (settle a surfaced contradiction).

**When to run:** when a drafted spec stabilises — sweeps folded, gap count low — and before its breakdown status moves to *agreed* or tickets are cut. A thin spec is a legitimate target; the report will simply be short and gap-heavy.

## Output Quality Self-Check

- [ ] Lenses ran in parallel and blind — no lens output fed another lens
- [ ] Skipped lenses named with reasons; the combined-sweep economy stated when used
- [ ] Feasibility verdict or explicit TODO in the header — never a silent skip
- [ ] Ranked table rows complete: what breaks downstream, next step, owner
- [ ] Relocation table: no flagged line vanished silently
- [ ] Contradictions stated as both positions + the decision needed — never averaged
- [ ] The job spec file untouched; the rewrite offered, not applied
- [ ] Report saved dated with its `initiatives:` frontmatter; initiative page updated in the same run

## Chain Position

Stage 5 of the de-risk-a-bet chain (`product-development/product/handbook/de-risk-a-bet.md`) — the checkpoint inside the definition→delivery bridge: upstream `/jobs-breakdown` → `/job-spec-draft` (which suggests this, never auto-runs it) · downstream `/create-tickets` from the agreed spec, `/prototype`. Bet-level challenge stays stage 4 (`/prd-challenge`). Skip rules live in the chain doc.
