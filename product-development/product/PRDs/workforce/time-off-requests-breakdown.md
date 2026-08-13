# EXAMPLE — Team Time-Off & Coverage — Feature Breakdown

> Synthetic worked example for the fictional product **Beacon**, a B2B data-enrichment SaaS billed in usage credits (one credit per enriched record, pooled per organization). This is the cut derived from [the time-off PRD](time-off-requests-prd.md) — one initiative broken into independently shippable features, sequenced by risk and dependency, the level between the PRD (why this bet) and the per-feature briefs. Every number below is invented. Use this as a shape reference next to [the blank template](../../handbook/templates/feature-breakdown-template.md).

**Initiative:** [Team Time-Off & Coverage](../../initiatives/time-off-requests.md) · **PRD:** [time-off-requests-prd.md](time-off-requests-prd.md) · **Owner:** PM (see team roster in root CLAUDE.md) · **Updated:** 2026-08-13

## 1) The backbone

Rebuilt from the PRD's problem statement and hypothesis (PRD — invented universe). No challenge report, assumption map, or customer research exists for this initiative yet (`reviews/` absent; research-synthesis holds no time-off material — checked 2026-08-13), so the risk ranking below derives from the PRD's own hypothesis.

**Actors:** Analyst (requests time off; often personally holds one of the two duties) · Workspace manager (decides requests; confirms the cover) · Covering teammate (receives job-approval duty + burn-alert watch) · Workspace team (consumes who's-out visibility) · Head of Ops (accountable for coverage incidents; the buyer) · Notification service (system actor — owns today's approval/alert routing). Out of scope: HR/payroll admin (non-goal), enterprise security reviewer (evaluates absence handling, never operates it).
**Core objects:** time-off request (dates + status) · absence (approved request in effect) · coverage assignment (named teammate + the two duties) · org time-off policy + per-person balance · the duties themselves (enrichment-job approval; burn-alert watch) · team absence/conflict view (absences × job schedules × billing-cycle deadlines).
**Flow:** analyst requests dates and proposes a cover → manager approves or declines → team sees who's out and who covers → absence starts: both duties route to the cover → cover approves jobs and watches burn → absence ends: duties revert → the loop closes: no stalled jobs, no unwatched balances.

## 2) The features

| ID | Feature (code-name) | Type | Riskiest assumption it tests | Depends on | Priority — why | Status |
|----|---------------------|------|------------------------------|-----------|----------------|--------|
| F-1 | request-approval | Net new | Teams move requests + decisions into the workspace, and name covers unprompted — first read on the ≥ 80% cover-assignment target (PRD — invented universe) | — | Must ship first — walking skeleton; F-2, F-3, F-4 all consume its absence object and decision flow | drafted — [F-1 brief](time-off-requests-request-approval-brief.md) |
| F-2 | coverage-handoff | Integration *(per PRD: routing rails already exist in the notification service — unverified in code, §4 #3)* | Automatic duty routing is what removes coverage-gap incidents — "coverage, not the calendar, is the job": the bet itself | F-1 — approved absence + named cover | Must — tests the bet's most dangerous unknown; the primary metric (5.8 → ≤ 1.0 incidents per 100 orgs, PRD — invented universe) is unmeasurable against target until this is live | not-drafted |
| F-3 | allowances-balances | Net new | Orgs maintain policy + balances in Beacon without HRIS import, enough for managers to trust the decide step | F-1 — decision flow to count against | Should — nothing depends on it; needed before broad GA (managers otherwise decide blind), but the coverage bet doesn't wait for it; can run parallel to F-4 | not-drafted |
| F-4 | calendar-conflict-view | Integration *(reads existing job-schedule + billing-cycle data against F-1 absences — data availability unverified, §4 #3)* | Overlap conflicts are computable from existing data and actually change approve/decline calls | F-1 — absence data | Could — no feature depends on it; depth on the decide/see stations; can run parallel to F-3 | not-drafted |
| F-5 | external-calendar-sync | Net new | Teams also need absences pushed to Google/Outlook — zero sourced demand on file [Hypothesis — needs validation] | F-1 | Won't-now — tests nothing about the coverage bet (it is the calendar the hypothesis argues against) and adds Beacon's first outbound calendar OAuth surface; revisit after F-2's metric read or on evidenced customer pull | not-drafted |

## 3) Sequencing rationale

- **Walking skeleton = F-1, after one re-cut.** The first candidate was the PRD's feature-set row 1 verbatim (request → decide → team sees). Gated against the backbone it failed the vertical pressure test: it never touches the duties station — the station the bet lives on — and alone it ships exactly the wall-calendar the hypothesis argues against. Folding full duty-routing in would weld a net-new flow to an integration seam with a different risk profile, so the re-cut used the Operations cut line (create + see first): F-1 carries the whole absence object *including the named cover* — every backbone station's data exists and is visible ("who's out and who covers") — while the routing verb is F-2, scoped per the new-object-conversion rule to the seam between the new absence object and the existing notification rails.
- **F-2 immediately after F-1** — the initiative is only tested when F-2 lands. F-1 alone still gives an early kill signal: if approved absences don't get covers named (below the 80% target), the handoff premise is in trouble before any routing ships.
- **F-3 ∥ F-4** once F-1's absence object and decision flow are live; neither blocks F-2.
- **Reach:** every reach number here comes from the PRD's invented universe — 52 Growth+Scale orgs · 9 coverage-gap orgs in Q2 · 3 enterprise deals naming absence handling · 14 EU orgs. `segmentation-matrix.md` is an unfilled scaffold on this install, so no independent segment denominators exist; any sizing claim beyond the PRD's numbers is [Hypothesis — needs validation].

## 4) Cross-feature decisions & open questions

| # | Decision / question | Affects | Owner | Status |
|---|---------------------|---------|-------|--------|
| 1 | [GAP: platform model unfilled — constraints unverified] — approver/manager permission carrier, self-access rule (may a manager approve their own absence?), and absence-status enums are all unstated in `platform-model.md` | All | PM | Open |
| 2 | [GAP: tech constraints unfilled — feasibility unverified] — notification-service rails and job-schedule/billing-cycle data sources are absent from the do-not-re-implement registry | F-2, F-4 | Engineer | Open |
| 3 | No grounded code access on this machine: beacon-app is registered (`access_tier: local`) but no clone grant exists here and the remote is a placeholder; best available tier is the SHA-stamped map, which routes but never proves — and it maps only billing flows. Type labels and integration seams above stay unverified until `/connect-code` runs | F-2, F-4 typing | Engineer | Open |
| 4 | Shared absence state machine — one object consumed by routing (F-2), balance math (F-3), and conflict view (F-4): who owns the status set and the cancel/edit transitions? | F-1–F-4 | PM + Eng lead | Open |
| 5 | Unplanned absences — the PRD problem says "planned or not"; the solution sketch shows only request → approve. Does F-1 include an immediate "mark out today" path so F-2 can route on unplanned absences too? | F-1, F-2 | PM | Open |
| 6 | Multi-workspace membership — policy is per-org applied per workspace; does one person's absence surface (and route duties) in every workspace they belong to? | F-1, F-2, F-4 | PM + Eng | Open |
| 7 | EU stance — 14 of 52 eligible orgs are EU-based (PRD — invented universe); v1 balances are coverage-planning records, not statutory-leave records (PRD non-goal). Confirm that stance survives the 3 enterprise security reviews that named absence handling | F-3, GTM | PM | Open |

## 5) Coverage check

- Covered: request & decide time off → F-1 · coverage handoff → F-2 · allowances & balances → F-3 · team calendar & conflict view → F-4
- Deferred, in-table: external calendar sync → F-5 (Won't-now — reasons in its row; revisit trigger: F-2's metric read or evidenced customer pull)
- Explicitly out (PRD non-goals, unchanged): HRIS integration / payroll export — revisit only on repeated customer pull · company-wide cross-workspace policies — future, after per-workspace v1 · absence types beyond time off (sick-day evidence, statutory leave) — future initiative with a real compliance surface
- Named so it can't drop silently: unplanned-absence handling sits in the PRD's problem statement but in no feature-set row — it lands inside F-1/F-2 pending §4 #5

---

**Quality gate** (checked by `/feature-breakdown` before presenting; recheck on manual edits):

- [x] Every feature passes the four pressure tests — outcome-changing · standalone-shippable · vertical (end-to-end, not one station) · scope-sane (checklists: `.claude/skills/feature-breakdown/references/gates-and-cuts.md`)
- [x] No false thin slice: the first feature traverses the backbone end-to-end and reaches an outcome
- [x] Every priority states its reason in dependency or risk language
- [x] Coverage check is clean — every PRD scope item covered or explicitly out
- [x] A variation whose backbone differs end-to-end became its own feature, not a footnote in someone else's
- [x] Statuses reflect reality (briefs that exist are linked from their rows)

<!--
Template rules (keep this comment):
- One breakdown per initiative, edited in place; the feature table is the live status board.
- Feature IDs (F-1…) are stable once assigned — briefs and the feature-index reference them.
- Link each drafted brief from its row: `[F-2 brief]({initiative-slug}-{feature-slug}-brief.md)`.
-->
