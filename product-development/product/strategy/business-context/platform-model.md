# Platform Model — how the product actually works underneath

The platform facts every job spec has to line up with: how access is really decided, what names and states are fixed, which domains are compliance-bound, and where things live. `/job-spec-draft` and `/jobs-breakdown` read this file to ground capabilities, permission matrices, and constraints in reality instead of folklore. Unfilled sections make those skills mark their output `[GAP: platform model unfilled — constraints unverified]`.

_updated: [TBD — fill during setup]_ · _owner: PM (see Team table in root CLAUDE.md)_

## 1) Account & permission model — how the platform decides who can do what

[TBD — fill during setup. The mechanics, not the org chart: account types, how access is scoped (permission sets, groups, plans, hierarchies), and what a login actually knows about its user. The key question a brief needs answered: when one kind of user must be able to do something another can't, what setting or mechanism carries that difference?]

## 2) Personas vs. what the system knows

[TBD. List the informal personas the team talks about (e.g. admin, manager, end user) and, for each, what actually distinguishes them in the system — a role field, a permission set, a plan, or nothing at all. A persona difference with no system carrier is a requirements trap: the brief must state the mechanism as a rule, because the build can't guess it.]

## 3) Where things live

[TBD. The product's surface map in a few lines — main navigation areas per account type, and the convention for where new admin-facing vs end-user-facing capabilities land. Briefs don't pick exact placement (design's call) but must not contradict this structure; a brief that assumes a brand-new top-level surface flags that as an open question.]

## 4) Terminology to keep straight

| Use | Not | Why it matters |
|---|---|---|
| [TBD — canonical term] | [common wrong name] | [what breaks if confused] |

## 5) Fixed enums & statuses

[TBD. The value sets that exist today and must be treated as constraints — object statuses, types, lifecycle states. Briefs never invent new values for an existing enum without flagging it as a platform change.]

## 6) Localization obligations

[TBD. Languages the product must serve and the rule that follows: which content classes (user-entered content shown to other users · the product's own UI strings · outbound notifications) must exist in which languages, and whether the obligation is legal or commercial. If none: say "single-language product — checked YYYY-MM-DD" so the silence is deliberate.]

## 7) Compliance carve-out — presumed-constraint domains

Treat any specific-looking detail in these domains as a real constraint until the owner says otherwise — never simplified away as UI detail. Getting one wrong surfaces after launch as a legal, money, or data failure the build had no way to catch. While this section is unfilled, skills treat the example domains below as the presumed list.

- [TBD — list this product's domains, e.g.: tax handling · money movement and rounding · statutory records and retention · audit trails on disputable actions · privacy/PII handling · regulated communications · permission and security scoping]

## 8) Self-access rules

[TBD. What users may do to records about themselves: can an approver approve their own request, can an admin edit their own permissions, can a user see their own history? Name the standing rules and the known conflict-of-interest gates.]

## 9) Org patterns worth a gentle question

[TBD — optional. Recurring scope-risk patterns in how this team works (e.g. features added on internal opinion without customer signal, scope growth after agreement) that drafting and review skills should probe for.]

<!--
Living-master rules (keep this comment):
- One copy, edited in place — never copied per feature. Budget ≤120 lines.
- Owner: PM. Refresh when the access model, enums, or obligations change; bump _updated: on every edit.
- [TBD] markers mean "not filled yet" — deliberately silent in lint; the run-time nag is
  /job-spec-draft and /jobs-breakdown carrying [GAP: platform model unfilled].
- This file is gated in governance/write-policy.yaml — edits need an in-session yes.
-->
