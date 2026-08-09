# Governance Slim-Down: Code-Grounding → engineering/; Tier Mechanics Single-Sourced

**Date:** 2026-08-09
**Decided by:** [Steward] (roster placeholder)
**Initiative:** -
**Status:** Active

## Options Considered

1. **Keep `governance/code-grounding.md`** (the same-day dissolve decision's destination) —
   one shelf for all cross-skill contracts; but the shelf mixes two species — rules of the
   wiki itself (write policy, write-back) vs evidence rules for one domain (product code).
2. **Move the contract to `product-development/engineering/`** — everything code-grounding
   (registry, contract, maps) in one folder; governance keeps a crisp charter: repo-write
   machinery plus machine state. Tier protection is unaffected — it follows the path listed
   in `write-policy.yaml`, not the folder (precedent: `handbook/templates/**`).
3. **Leave tier mechanics restated across four files** — locally convenient, but
   `governance/CLAUDE.md`, the write-back contract, and `proposals/CLAUDE.md` had already
   drifted (a gate-file carve-out present in two of the four; a confirm-tier example that
   was actually an admin path).

## Decision

Option 2 for location, plus single-sourcing for mechanics: the `write-policy.yaml` header
comment is now THE canonical statement of tier semantics — `governance/CLAUDE.md`,
write-back-contract rule 3, and `proposals/CLAUDE.md` compress to pointers. The drift was
resolved by dropping the gate-file carve-out: the admin tier is uniform — applied on the
steward's in-session yes at the write-guard prompt, or via reviewed PR; agents always
propose otherwise. Also reconciled in the same change: the living-pages registry gains
`competitors/*/teardown.md` (the contract's class row now points at the registry instead
of enumerating), and the contract's budget rule gains the `segmentation-matrix.md` ≤200
exception to match `/wiki-lint` check 6.

## Reasoning

Concern-cohesion beats species-cohesion: nobody doing governance work reads the
code-grounding contract, and everybody doing code work reaches it from
`code-repos.yaml` (Tier 0), which now sits beside it. And restated mechanics had produced
real drift within a day — the registry pattern already used for path lists ("one
authoritative home, pointers elsewhere") now covers the mechanics prose too.

## Tradeoff Accepted

Reverses the same-day destination choice (~16 reference updates; the dissolve entry is
marked partially superseded). The push-ruleset and weekly-audit path lists now reach into
`product-development/` for one more file — hand-synced in three places, as before.

## Related

- Contract: `product-development/engineering/code-grounding.md`
- Superseded in part: [2026-08-09-dissolve-claude-references.md](2026-08-09-dissolve-claude-references.md)
- Canonical tier mechanics: `governance/write-policy.yaml` (header comment)
