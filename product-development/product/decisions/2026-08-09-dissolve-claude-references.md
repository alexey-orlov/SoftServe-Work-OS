# Dissolved .claude/references/ into governance/

**Date:** 2026-08-09
**Decided by:** [Steward] (roster placeholder)
**Initiative:** -
**Status:** Active

## Options Considered

1. **Keep `.claude/references/` as-is** — near-zero carrying cost, but a category folder with one file, split from the sibling contract in `governance/`; every contributor asks why contracts have two homes.
2. **Move the contract to `governance/`, slim it, delete the folder** — one admin surface for all cross-skill contracts, next to `write-back-contract.md`.
3. **Delete the contract entirely and inline it into consumers** — one file fewer, but 4+ unanchored copies of the rules (engineer reviewer, red-team/assumption-map grounding tables, launch-gate checks) drift independently, and light consumers would load `/code-qa`'s full pipeline text just to cite a rule.

## Decision

Option 2. `.claude/references/code-grounding.md` → `governance/code-grounding.md`, slimmed 105 → 84 lines: the rationale preamble cut (the 2026-08-05 decision owns it), repo-resolution and deployed-vs-HEAD mechanics reduced to pointers at `/code-qa`, their operative home. The redundant "Code grounding" short block was removed from `/code-qa` itself — the engines (`/code-qa`, `/connect-code`) cite the contract from their steps; the short block is only for skills that make code claims in passing. `.claude/references/` deleted. The folder had already lost its founding tenant when 2026-08-08 moved the write-back contract to `governance/` — this finishes that consolidation.

## Reasoning

The contract's real audience is the light consumers (reviewer personas, grounding tables, gates) that need ~25 lines of shared rules without a pipeline attached; the engines restate the rules operationally in their own steps anyway. A shared contracts shelf therefore earns its place — but two shelves don't. Write-back and code-grounding are the same species of file, and the 2026-08-08 "one admin surface" rationale applies with equal force.

## Tradeoff Accepted

The push-ruleset and weekly-audit path lists now enumerate three governance files instead of two (hand-synced, as before). Path references in the 2026-08-05 decision record were updated in place so links keep resolving.

## Related

- Contract: `governance/code-grounding.md` (was `.claude/references/code-grounding.md`)
- Prior consolidation: commit `5e46276` (write-back contract → `governance/`, 2026-08-08)
- Consumers: `/code-qa`, `/connect-code`, `/connect-mcps`, `.claude/agents/reviewers/engineer-reviewer.md`
