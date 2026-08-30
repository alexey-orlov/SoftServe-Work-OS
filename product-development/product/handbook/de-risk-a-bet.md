# De-Risk a Bet

The canonical sequence for stress-testing a bet from first idea to shipped feature. Each stage answers a different question at a different moment; skipping a stage is fine (see below), reordering them usually isn't — attack a plan before rehearsing its launch, map assumptions before attacking them.

**Rule for this file:** one line per stage, links only. Skill internals and scope boundaries live in the skills themselves — if this table and a SKILL.md ever disagree, the SKILL.md wins.

## The Chain

| Stage | Skill | Moment | Question | Artifact |
|-------|-------|--------|----------|----------|
| 1. Map | `/assumption-map` | Idea stage, pre-PRD | What are we betting on; what to test first? | `PRDs/{area}/reviews/{initiative-slug}-assumption-map.md` |
| 2. Draft | `/prd-draft` | Assumptions mapped | What exactly are we building? | `PRDs/{area}/{initiative-slug}-prd.md` |
| 3. Attack | `/red-team` | Draft ~80% done, before committing resources | Would this survive a fair adversary? | `PRDs/{area}/reviews/{initiative-slug}-red-team.md` |
| 4. Challenge | `/prd-challenge` | Stage milestones, or when the PRD's gap count drops materially | What do all lenses see that I don't? (runs stages 1 and 3 as parallel lenses, plus the 7 personas and — once a solution exists — stage 6) | `PRDs/{area}/reviews/{initiative-slug}-challenge-{YYYY-MM-DD}.md` |
| 5. Break down | `/jobs-breakdown` → `/job-spec-draft` (each spec challenged via `/job-spec-challenge` before it's agreed) | PRD agreed or challenged, before tickets | What exactly do we build, in what order? | `PRDs/{area}/{initiative-slug}-jobs-breakdown.md` + `PRDs/{area}/{initiative-slug}-{job-slug}-job-spec.md` (+ per-job challenge reports in `reviews/`) |
| 6. Rehearse | `/pre-mortem` | Committed, ship moment in sight | If the launch fails, why? | `PRDs/{area}/reviews/{initiative-slug}-premortem.md` |
| 7. Plan | `/launch-checklist` | 4–6 weeks out | Who does what, when? | `launches/{initiative-slug}-launch-checklist.md` |
| 8. Gate | `/feature-launch-gate` | Ship moment | Is the repo updated? (the only verdict) | Gate report, posted to the launch channel |

Paths are relative to `product-development/product/`.

## Feedback Loops

- **Experiment results → Stage 1:** re-run `/assumption-map` in update mode; re-rate Confidence and Evidence, move assumptions between quadrants.
- **Red-team kill criteria → the PRD:** fold them into section 7 (Risks and Recovery); the cheapest test goes to `/experiment-decision`.
- **Pre-mortem tables → Stage 7:** Launch-Blocking and Fast-Follow Tigers feed the checklist's Risk Mitigation section; Track trigger conditions feed the rollback criteria.
- **Job-spec eng-confirmations → tech constraints:** answers Engineering returns for a job spec's §14 fold into `engineering/tech-constraints.md`'s do-not-re-implement registry — the next brief starts warmer.
- **Post-launch → next bet:** `/feature-results` compares reality against the pre-mortem; recurring misses become next quarter's first assumption map.

## When to Skip Stages

- **Small change** (bug fix, copy update): skip 1–7, run `/feature-launch-gate --lightweight`.
- **Internal tool, no stakeholder circulation:** skip stage 4.
- **Single-feature initiative** (the PRD already describes one buildable feature): stage 5 collapses — skip `/jobs-breakdown`, write the one `/job-spec-draft`.
- **No ship moment** (strategy or direction doc): stop after stage 3 — `/red-team` is the last stop; `/pre-mortem` needs a ship moment to rehearse.
- **Stages 1, 3, and 6 also run inside stage 4** — `/prd-challenge` invokes them as parallel lenses; run them standalone for a bare idea (1), a non-PRD doc (3), or near ship (6).
