# Sweep S4 — Cross-cutting concerns

The build-time tax every job carries, invisible in a happy-path, single-language, on-screen demo. **Every dimension ends in one of two states: in this job (budgeted scope) or deferred (named risk + which later job picks it up). Silence is the only wrong answer** — a deferral is a decision; an omission is a hidden core issue. This sweep produces §10's table, one row per dimension.

The stakes: a thin slice earns its name by being **releasable**. A job no keyboard user can operate, that renders the wrong language, or that never tells the next actor their turn has come has core issues — it isn't end-to-end no matter how complete the happy path looks.

| # | Dimension | The question | Invisible because / risk if deferred |
|---|-----------|--------------|--------------------------------------|
| 1 | **Accessibility** | Operable keyboard-only and by screen reader? Anything carried by color alone? The design system gives a floor — any *new* pattern is uncovered ground | A mouse-driven demo never exercises it / excludes assistive-tech users; often a legal exposure, not a nit |
| 2 | **Localization — UI + system text** | Every label, message, empty state, and error this job renders, in every obligated locale (platform-model §6)? Distinct from S1's user-entered-content check | Prototypes are built in one language / a locale user lands on untranslated UI — a core issue where the obligation is legal |
| 3 | **Notifications at every handoff** | When the workflow changes hands, what tells the next actor — and the originator? Which channel, what content, which locale? | The demo slides states on one screen; in production nobody is watching it / the loop closes in the demo but not in reality — the most common way "end-to-end" isn't |
| 4 | **Audit & history** | Which actions need who/what/when/from-what-to-what logged? Disputable actions (denials, adjustments, removals) need a defensible record | Only surfaces after the dispute / a compliance gap that's expensive to backfill once real data exists |
| 5 | **Day-one & existing data** | The job turns on for orgs with existing records: sensible defaults, backfill, or an empty state that reads as broken? What does the first visit look like? | Prototypes start from clean mock data / works for new data, looks broken for everyone's existing data |
| 6 | **Permission-denied & out-of-scope personas** | S2 defines who's out; this row confirms each gets a defined experience (nothing / read-only / explanation) | The demo runs as the one intended role / dead ends, or data leaks to the wrong eyes |
| 7 | **Plan / packaging eligibility** | Which plans/packages include this? Lower plan: absent, locked, or limited? What happens on upgrade/downgrade with objects in flight? | Demos run on the full-featured tier / entitlement bugs and mid-flow orphans at plan boundaries |
| 8 | **Limits, quota & idempotency** | Which platform limits apply (tech-constraints §5)? What happens at the cap? Is every mutating action safe to retry (double-click, network retry, webhook redelivery)? | Demos never hit caps or resend / duplicate side effects and silent truncation in production |
| 9 | **Timezone & calendar** | Every date/time the job touches: whose timezone defines "today"? Date-only vs timestamp? Cycle boundaries, DST, cross-zone actors? | Single-zone demos hide it / off-by-one-day around deadlines and periods — money- and compliance-adjacent |

## Return format

One verdict per row: **in-job** (what that budgets — the concrete scope it implies) or **deferred** (the named risk + the job that picks it up) — plus any row whose answer is really a rule (§8), a constraint (§9), or an engineering question (§14). No row skipped; "clean — nothing new for this dimension" is a legitimate verdict when the draft already answers it.
