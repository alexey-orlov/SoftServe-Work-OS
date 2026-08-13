# Tech Constraints — the build realities every feature brief must respect

The engineering facts a requirements doc can't guess: stack and conventions, hard platform limits, and the registry of things that already exist and must not be re-implemented. `/feature-brief` matches every draft against this file (its Constraints and Engineering-confirmations sections cite it); `/feature-breakdown` reads it when sequencing. Unfilled sections make those skills mark output `[GAP: tech constraints unfilled — feasibility unverified]`.

_updated: [TBD — fill during setup]_ · _owner: Engineer (see Team table in root CLAUDE.md)_

## 1) Frontend

[TBD — fill during setup. Frameworks and versions, the design system / component library (and the accessibility + theming floor it gives for free), supported browsers and devices, mobile posture.]

## 2) Backend & data

[TBD. Services and languages, database(s) and schema-change posture (migrations policy, what's expensive to change), multi-tenancy model, background-job infrastructure.]

## 3) API conventions

[TBD. Style (REST / GraphQL / RPC), versioning and deprecation policy, auth mechanism, pagination and filtering conventions, idempotency expectations for mutating endpoints.]

## 4) Integration surfaces

[TBD. External systems the product talks to (payments, identity, messaging, calendars…), the event/webhook surface, and which integrations are fragile or rate-limited.]

## 5) Platform limits

[TBD. The hard numbers: rate limits, payload and file-size caps, list-size and pagination ceilings, concurrency limits, quota mechanics. A brief that implies exceeding one of these has found a platform change, not a feature.]

## 6) Non-negotiable NFR floors

[TBD. Performance budgets, availability targets, accessibility standard (e.g. WCAG level), security-review triggers, data-residency rules.]

## 7) Do-not-re-implement registry

Existing shared components, endpoints, and services that new work must consume, not rebuild. This feeds the brief idiom: "already live in [system] — Engineering to confirm the same [endpoint/component] is consumed here; do not re-implement."

| What exists | Where it lives | Covers | Confirm with |
|---|---|---|---|
| [TBD — e.g. notification service] | [service/module] | [what it does] | [team/person] |

<!--
Living-master rules (keep this comment):
- One copy, edited in place — never copied per feature. Budget ≤120 lines.
- Owner: Engineer — PMs and skills read it; only Engineering fills or corrects it.
  /feature-brief's "Engineering confirmations needed" section is the standing request
  queue that seeds this file: confirmed answers get folded in here.
- [TBD] markers mean "not filled yet"; the run-time nag is the skills' [GAP:] marker.
- This file is gated in governance/write-policy.yaml — edits need an in-session yes.
-->
