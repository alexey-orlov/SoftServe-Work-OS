# The variation scan — who executes this job differently

Loaded by `/job-spec-draft` Step 4 (mandatory, before any output) and by `/jobs-breakdown` Step 3 (variation-aware cutting). The question, per dimension: **does execution of THIS job differ — not the user's context in general, this job.**

## The three dimension families

**Company** — differences in the buying org:
- Size band (the segmentation matrix's bands — team of 5 vs 500 changes approval depth, volume, admin capacity)
- Vertical / industry (workflow norms, seasonal rhythms, regulated verticals)
- Org complexity (single vs multi-entity, one location vs many, flat vs hierarchical approval chains)
- Plan / package (is this job available, limited, or richer per tier — check platform-model §5 and packaging reality)
- Region & compliance regime (jurisdiction changes rules, statutory fields, retention, language obligations)
- Data & integration maturity (API-connected orgs vs manual-entry orgs hit different steps)

**User** — differences in the person executing:
- Persona / role (and what actually carries the difference — platform-model §1–2; no carrier → the mechanism becomes a rule)
- Permission scope (full vs scoped access executing the same job)
- Tenure & expertise (first-week user vs power user — where does guidance vs speed matter)
- Language (which locale executes this, and what content they see — platform-model §6)
- Accessibility needs (keyboard-only and screen-reader execution is a variation of every flow, not an afterthought)

**Situation** — differences in the moment:
- First-run vs steady-state (empty states, defaults, onboarding vs routine)
- Volume (1 item vs 500 — batch, pagination, timeout realities)
- Timing & seasonality (deadline periods, cycle boundaries, retroactive actions)
- Migration state (org mid-migration, historical data present, job turned on mid-cycle)

## Classify every hit — four dispositions, nothing unclassified

| Verdict | Meaning | Renders as |
|---------|---------|------------|
| **Not material** | Execution identical | Named in §5's verdict line ("checked: …") — proof of the scan, not silence |
| **Nuance** | Same flow, different rule or edge | Variation-tagged rule in §8 and/or exception row in §11 |
| **Branch** | A step materially differs | Delta sub-flow under §5 — the delta only, never a full parallel spec |
| **Different job** | The backbone differs end-to-end | Flagged back to the breakdown as its own job candidate — never absorbed into this job spec |

## Rules

- **Reach per variation is sourced** — segment counts / ARR from `segmentation-matrix.md`, accounts from `portfolio.yaml`, usage from analytics. No source → `[Hypothesis — needs validation]` and the priority goes provisional (see prioritization.md).
- **Variations are prioritized like scope** (Reach × Frequency × Severity) — a 2-account nuance can be deferred; a compliance-regime branch auto-escalates.
- **Per-variation job stories** only where motivation materially differs — not one per persona by habit.
- **The scan is cheap; skipping it isn't.** The one-line "no material variations (checked: …)" verdict is a legitimate, common outcome — what's illegitimate is silence.
