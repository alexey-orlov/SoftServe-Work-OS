# Prioritization — grounded scope decisions for §12

Scores what's **in this feature vs deferred** (the boundary), never the build order — that lives in the breakdown. Score each variation (§5), each major candidate capability, and each contested exception. Skip scoring what's obviously core: the walking skeleton's own path is in by definition.

## The four factors

| Factor | Question | Source (named, or it doesn't count) |
|--------|----------|--------------------------------------|
| **Reach** | How many accounts / users / how much ARR hits this? | `segmentation-matrix.md` cells · `portfolio.yaml` accounts · analytics usage counts. Write the number and the source: "Ent band — 12 accounts, $1.1M ARR (segmentation-matrix, General)" |
| **Frequency** | How often does it bite those it reaches? | Analytics event counts, call-summary patterns, research synthesis. Per-cycle language beats adjectives: "every pay period" not "often" |
| **Severity** | What does it cost when it bites? | Blocked core loop > workaround exists > cosmetic. Name the cost: support load, churn signal, compliance exposure, data damage |
| **Evidence** | How solid is the above? | `[Evidenced]` · `[Partial]` · `[Hypothesis — needs validation]` — the label travels into §12's Evidence column |

## Tiers

**Must** (the feature is wrong without it) · **Should** (in unless effort-evidence from §14 pushes back) · **Could** (in if cheap; first to cut) · **Won't-now** (deferred — §16 names where it goes and why later beats now).

## Hard rules

1. **Auto-Must escalation:** anything touching **compliance, money correctness, privacy/data exposure, or irreversibility** is Must regardless of reach — one affected account is enough when the failure is unrecoverable or illegal. Severity floors can't be averaged away by low reach.
2. **Effort is never scored here.** Effort is Engineering's number — §14 asks for ranges per Must item; a Should/Could boundary can move when those come back. Scoring effort yourself both gets it wrong and pre-empts the people who own it.
3. **Provisional tiers:** Reach or Frequency without a source → the tier is marked *provisional* in §12 and auto-generates a §13 research row (method per the routing table). A provisional Must still blocks scope commitment — that's the point.
4. **Variations are scoped like scope:** a nuance with 2-account reach can defer; a branch covering a whole compliance regime escalates. The §5 table's Priority column uses this same rubric.
5. **Sanity check against the riskiest assumption:** if the Must set no longer tests §4's riskiest assumption — the boundary drifted from de-risking to feature-completeness — re-cut or flag to the breakdown.
6. **Deferrals are named, not dropped:** every Won't-now points to a future feature or says "deliberately never, because …" (§16). The coverage rule from the breakdown applies at brief grain too.

## Worked micro-example (shape, not content)

| Item | Reach (sourced) | Frequency | Severity | Evidence | Tier | In / deferred |
|------|-----------------|-----------|----------|----------|------|---------------|
| Withdraw after submit | All bands — 47 accts (matrix, General) | Weekly (support tickets, Jul) | Medium — workaround is admin delete | `[Evidenced]` | Must | In |
| Bulk approve | Ent — 12 accts, $1.1M (matrix) | Cycle-end spikes (analytics) | Medium — one-by-one workaround | `[Partial]` | Should | In |
| Auto-escalate on absent approver | Unknown | Unknown | High — blocked loop | `[Hypothesis — needs validation]` | Must *(provisional)* | Research → §13 |
| Retro-dated entry vs closed period | Any | Rare | **Compliance** | `[Evidenced]` | **Must (auto)** | In |
