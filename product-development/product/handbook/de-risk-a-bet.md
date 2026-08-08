# De-Risk a Bet

The canonical sequence for stress-testing a bet from first idea to shipped feature. Each stage answers a different question at a different moment; skipping a stage is fine (see below), reordering them usually isn't — attack a plan before rehearsing its launch, map assumptions before attacking them.

**Rule for this file:** one line per stage, links only. Skill internals and scope boundaries live in the skills themselves — if this table and a SKILL.md ever disagree, the SKILL.md wins.

## The Chain

| Stage | Skill | Moment | Question | Artifact |
|-------|-------|--------|----------|----------|
| 1. Map | `/assumption-map` | Idea stage, pre-PRD | What are we betting on; what to test first? | `PRDs/{area}/reviews/{slug}-assumption-map.md` |
| 2. Draft | `/prd-draft` | Assumptions mapped | What exactly are we building? | `PRDs/{area}/{slug}-prd.md` |
| 3. Attack | `/red-team` | Draft ~80% done, before committing resources | Would this survive a fair adversary? | `PRDs/{area}/reviews/{slug}-red-team.md` |
| 4. Review | `/prd-review-panel` | Stage milestones (kickoff, solution, launch-readiness) | What do 7 perspectives see that I don't? | `PRDs/{area}/reviews/{slug}-review-synthesis.md` |
| 5. Rehearse | `/pre-mortem` | Committed, launch date in sight | If the launch fails, why? | `PRDs/{area}/reviews/{slug}-premortem.md` |
| 6. Plan | `/launch-checklist` | 4–6 weeks out | Who does what, when? | `launches/{slug}-launch-checklist.md` |
| 7. Gate | `/feature-launch-gate` | Ship moment | Is the repo updated? (the only verdict) | Gate report, posted to the launch channel |

Paths are relative to `product-development/product/`.

## Feedback Loops

- **Experiment results → Stage 1:** re-run `/assumption-map` in update mode; re-rate Confidence and Evidence, move assumptions between quadrants.
- **Red-team kill criteria → the PRD:** fold them into section 7 (Risks and Recovery); the cheapest test goes to `/experiment-decision`.
- **Pre-mortem tables → Stage 6:** Launch-Blocking and Fast-Follow Tigers feed the checklist's Risk Mitigation section; Track trigger conditions feed the rollback criteria.
- **Post-launch → next bet:** `/feature-results` compares reality against the pre-mortem; recurring misses become next quarter's first assumption map.

## When to Skip Stages

- **Small change** (bug fix, copy update): skip 1–6, run `/feature-launch-gate --lightweight`.
- **Internal tool, no stakeholder circulation:** skip stage 4.
- **No ship moment** (strategy or direction doc): stop after stage 3 — `/red-team` is the last stop; `/pre-mortem` needs a launch to rehearse.
- **Doc quality worry, not bet risk:** `/ralph-wiggum` at any point between stages 2 and 4.
