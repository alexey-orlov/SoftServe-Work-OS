---
name: overview
description: Compose a one-screen orientation for any slug — area, feature, or initiative — read-only and chat-only; it never writes, edits, or files anything. One bare argument; the registries resolve the scope in order (area, feature, initiative), naming which one matched. Fixed read order per scope, capped ~15 files headers-first with an explicit skipped list — initiative: the living page + headers of its linked artifacts; feature: catalog entry + every initiative targeting it + tagged metric/decision docs + matching feature requests; area: catalog block, ALL targeting initiatives by status, area metrics + dashboards, area-tagged and initiative-linked decisions, area feature requests, the competitive-matrix area table. Answers in fixed sections: What it is · Status now · Active work + open loops · Customer signal · The numbers that matter · Key decisions (dated) · Read next (5-item path) · staleness line. `/overview onboarding {area}` adds the new-PM extras — ICP, pricing and Key Metrics from business-info.md, stakeholders, the team table, the orientation tail. Use on /overview, "give me an overview of X", "catch me up on billing", "what's the state of the workforce area?", "I'm the new PM on X". NOT for the week's delta (/weekly-review), exec account rollups (/portfolio-pulse), what the code actually does (/code-qa), iterating the PRD (/prd-draft), or clickable browsing of the same rollups (the OS Console derives them live).
argument-hint: "[slug] | onboarding [area-slug]"
group: communication-ops
---

# Overview — one slug, the whole picture, zero writes

The functional folders separate what a person orienting needs joined. This skill does the
join in chat: resolve the slug, walk a fixed read order, answer in one screen. It writes
NOTHING — no files, no ledger, no Activity lines — and is exempt from the write-back
contract for the same reason `/code-qa` is: the answer's home is the conversation.

## Quick Start

```
/overview billing                    → area orientation
/overview tier-discount-promo        → feature orientation
/overview tier-discount-promo-v1     → initiative orientation
/overview onboarding billing         → area orientation + the new-PM extras
```

## Scope resolution

One bare kebab slug. Resolve in order against the registries (`governance/link-schema.yaml`):

1. **Area** — top-level key under `areas:` in `product-development/feature-index.yaml`.
2. **Feature** — nested feature key in the same catalog.
3. **Initiative** — filename in `product-development/product/initiatives/*.md`.

Uniqueness is enforced on NEW slugs, and lint downgrades an existing area/feature↔initiative
collision to a warning — so a mid-migration repo can match twice. Take the first hit in the
order above, say which registry it came from, and offer the other. No match → list the
nearest slugs from all three registries and stop; never guess, never create anything.

`onboarding` is a slug first: `/overview onboarding` resolves it against the registries like
any other argument, and only when it resolves to nothing does it mean the variant below —
then ask which area.

## Read order (fixed per scope)

Headers first — frontmatter plus the opening summary section — full bodies only where the
section demands a number or a date. Cap ~15 files; when the cap bites, initiative pages >
metric docs > decisions > feature requests > matrix, and the skipped files are named in the
output's Skipped line. A surface that is empty or missing is REPORTED ("no {area} table in
the competitive matrix"), never silently omitted.

**Initiative** — the living page in full → headers of every artifact its rows link →
the decisions its Decisions section lists.

**Feature** — catalog entry → ALL initiatives whose frontmatter `features:` names the slug
(grep `initiatives/*.md`; every status — shipped pages carry the history and surviving open
loops) → metric/dashboard docs tagged with the feature → decisions tagged with the feature
UNION decisions listed on the targeting initiative pages → feature requests with
`features: [slug]`.

**Area** — catalog block (every feature one-liner + status) → ALL initiatives whose
frontmatter maps to the area or its features, grouped by status (active first; shipped /
killed as one-liners plus any open loops that survived closing) →
`analytics/metrics/{area}/` + `analytics/dashboards/{area}/` → decisions: area-tagged grep
UNION the targeting initiatives' Decisions sections → feature requests with `area: {area}`
→ the area's table in `competitive-matrix.md` (or `competitive-matrix-{area}.md`).

## Output (fixed sections, ≤ ~40 lines)

- **What it is** — 2 lines: catalog description + why the area/feature/initiative exists.
- **Status now** — live vs planned vs in-build, with shipped dates; initiative scope: the
  frontmatter status + note.
- **Active work + open loops** — per initiative: state, blocker, open loops with owners and
  due dates; a due date before today is flagged **overdue**.
- **Customer signal** — matching feature requests: account, priority signal, one-line ask,
  tracker state. Omit the section only when the scope has none (say so in Skipped).
- **The numbers that matter** — metrics with baseline → target and where each is defined;
  canonical dashboards. Every number carries its source doc; nothing computed, nothing invented.
- **Key decisions (dated)** — date, choice, the tradeoff accepted.
- **Read next** — exactly 5 paths, ordered, each with a why-this clause.
- **Skipped + staleness** — what the cap or an empty surface excluded; then the oldest
  `updated:` among the living sources read (name living pages missing the field).

## Onboarding variant

`/overview onboarding {area}` = the area overview plus the new-PM frame, as pointers —
never restated content:

- **Before the overview**: ICP, personas one-liner, pricing shape, and Key Metrics from
  `product/strategy/business-context/business-info.md`; stakeholder names + what each cares
  about from `stakeholders.md`; the Team table in root `CLAUDE.md` for handles.
- **After it**: `product/handbook/writing-guides/` (how we write), `de-risk-a-bet.md` (how
  bets move), and `os-installation/first-session-checklist.md` for the rest of day one.

## Self-check

- Wrote nothing: no file created or edited, no ledger line, no Activity line.
- Every claim traces to a file actually read this run; every number names its source doc.
- Shipped/killed initiatives included in area and feature scopes, not just active ones.
- Overdue open loops flagged against today's date.
- Skipped line and staleness line present; empty surfaces reported, not dropped.
- Unresolvable slug ended in nearest-match suggestions, not a guess.
