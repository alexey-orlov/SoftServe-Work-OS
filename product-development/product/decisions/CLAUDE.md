# Decisions

Non-architectural decisions (pricing, GTM, scoping) with reasoning, options, and tradeoffs.

**Read this when:** Someone asks "why did we choose X?" — look here before asking a human.

## Contents

### Files

Decision entries (`YYYY-MM-DD-{topic-slug}.md`) are indexed in **Recent Decisions** below — `/decision-log-entry` appends one bullet per entry, at the end of the list.

## Recent Decisions

- 2026-02-14 — [Chose Usage-Based Pricing](2026-02-14-usage-based-pricing.md) — EXAMPLE (synthetic worked example): credits over per-seat; the tradeoff that forced the credit-usage dashboard
- 2026-07-28 — [Reset Tier-Discount Promo v1 Target and Scope](2026-07-28-tier-discount-promo-scope-and-target.md) — EXAMPLE (synthetic): target 2026-09-15, v1 in-app only, email nudge cut
- 2026-08-05 — [Chose Tiered Local-First Code Grounding](2026-08-05-code-grounding-architecture.md) — local clone + registry + labeled degradation over MCP-only or map-only; maps route, never prove
- 2026-08-08 — [Dissolved processes/ into handbook/ + top-level launches/](2026-08-08-handbook-restructure.md) — records out of the reference shelf; templates stay a central registry (path-prefix governance), domain guides stay with their domains
- 2026-08-09 — [Dissolved .claude/references/ into governance/](2026-08-09-dissolve-claude-references.md) — code-grounding contract moved next to write-back-contract.md and slimmed 105→84 lines; one admin surface, n=1 folder deleted
- 2026-08-09 — [Removed engineering/rfcs/ and bug-investigations/; kept plans/](2026-08-09-remove-eng-rfcs-bug-investigations.md) — routing moved into product space: architectural calls → decisions/, defects → tracker tickets; plans/ stays as the /create-tickets fallback home
- 2026-08-09 — [Governance slim-down: code-grounding → engineering/; tier mechanics single-sourced](2026-08-09-governance-slimdown.md) — concern-cohesion over one-shelf; write-policy header is now the canonical tier-mechanics statement; living-pages and budget drift reconciled
- 2026-08-11 — [Collapsed write tiers to one gated list; added /auto-sync](2026-08-11-single-gated-tier-auto-sync.md) — one gated list, two gates (write prompt + held from auto-commit/push); /auto-sync flips autocommit+autopush on main; audit list now derived from the policy at run time
- 2026-08-13 — [Made /prd-draft format-universal — the installed template owns document structure](2026-08-13-prd-draft-template-driven-format.md) — skill keeps method + evidence slots; house formats (first: a customer's 8-section house brief) land as the deployment's own prd-template.md, never in this repo; validated 13/13 by Opus format test
