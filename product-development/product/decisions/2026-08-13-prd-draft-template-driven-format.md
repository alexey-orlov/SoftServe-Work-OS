# Made /prd-draft Format-Universal — the Installed Template Owns Document Structure

**Date:** 2026-08-13
**Decided by:** [Steward] (roster placeholder)
**Initiative:** -
**Status:** Active

## Decision

`/prd-draft`'s Step 3 no longer hardcodes the PRD section order in the skill body. The skill is format-universal: it reads `product-development/product/handbook/templates/prd-template.md` fresh each run and follows that file as the deployment's document contract (section order and names, meta-table fields, `>` guidance blocks, table shapes, stage/length rules, voice notes). The skill keeps only a format-neutral list of evidence slots (problem-side / value-side / solution-side / proof-side) that must land wherever the template routes them, or get a `[GAP:]`.

Customer deployments adopt a house PRD format by swapping that one template file in their own instance (gated, steward-approved once at install) — zero skill edits per customer. House-format templates live in the customer-specific repo, never in this master repo.

## Context

First case: a customer deployment with an established house Product Brief format — 8 fixed sections whose names and order differ substantially from the default template's. Matching it under the old skill meant forking the skill body. (Customer specifics live in the engagement's own project folder, outside this repo.)

## Options considered

- **Fork the skill per customer** — rejected: N customers → N drifting skill bodies; the loop, gap markers, auto-research, and readout are format-independent and should not multiply.
- **Ship multiple templates + a selector flag** — rejected for now: one canonical template per deployment is simpler; variants can come later if a team genuinely runs two formats.
- **Template owns format, skill owns method** (chosen) — validated 2026-08-13 by an Opus subagent test: universal contract + a house-format-shaped template (reference briefs withheld) produced a brief scoring 13/13 on a format-fidelity checklist derived from the customer's three reference briefs, with honest TBD+`[GAP:]` pairing and no invented numbers. Both surfaced nits were fixed template-side, confirming the adjustment lever sits in the template.

## Tradeoff accepted

The default template file gains responsibility: a badly written house template now degrades drafting quality directly (the skill will faithfully follow it). Mitigation: templates are gated paths, and the template carries its own authoring guidance and quality checklist.

## Deferred (revivable)

The companion enrichment of the *default* `prd-template.md` (adopting customer-format-inspired optional blocks: tagline, Overview section, trigger moment, user outcomes, Day-7/30/60/90 checkpoint schedule, dependencies register with owners, UX-principles block, decisions-inline digest) was proposed alongside but not applied — separate decision, not taken up on 2026-08-13. The full comparison lives in the engagement's brief-format gap analysis (2026-08-13, engagement-side, outside this repo).
