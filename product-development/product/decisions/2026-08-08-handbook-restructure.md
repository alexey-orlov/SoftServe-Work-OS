# Dissolved processes/ into handbook/ + Top-Level launches/

**Date:** 2026-08-08
**Decided by:** [Steward] (roster placeholder)
**Initiative:** -
**Status:** Active

## Options Considered

1. **Distribute templates next to their artifacts** — every template is single-domain (PRD → `PRDs/`, retro → `meetings/retros/`, initiative page → `initiatives/`, …), so one rule ("reference lives with its domain") would hold everywhere. But the placeholder-scan exemption in `/wiki-lint` and the copy-don't-edit rule would have to ride on a filename convention (`*-template.md`) instead of one path prefix, `initiative-page-template.md` would collide with the living-pages glob (`initiatives/*.md` demands `_updated:` headers), and the "what scaffolds exist?" catalog dissolves into a glob.
2. **Central registry `handbook/` + evict `launches/`** (chosen) — rename `processes/` → `handbook/` keeping `templates/`, `writing-guides/`, `de-risk-a-bet.md`; move filled launch checklists to top-level `product/launches/`.
3. **Minimal** — keep the `processes/` name, move only `launches/` out. Rejected: "processes" containing mostly templates and guides is a category error; the rename costs the same reference sweep the eviction already forces.

## Decision

Option 2. `product/handbook/` = how-we-work reference (templates registry, writing guides by audience, the de-risk chain). `product/launches/` = filled launch checklists and gate records, sibling of `reports/` and `planning/`. Domain-bound guides (`okr-guide.md`, `roadmap-guide.md`, `strategy/frameworks/`) stay with their domains.

## Reasoning

The old folder mixed records of work (filled launch gates) into a reference shelf — that, not the templates, made it a dump. For the rest: guides are read in place while working in a domain, so they co-locate; templates are stamps consumed by skills via hardcoded paths, so residence buys nothing while class governance (copy-don't-edit, bracket-exemption, one catalog) keys on a single path prefix — matching how every other enforcement mechanism in this repo works (write-policy globs, push-ruleset path lists).

## Tradeoff Accepted

One documented exception to "reference lives with its domain" (stated in `handbook/CLAUDE.md`): domain folders hold a pointer to their template, not the template itself.

## Revisit Conditions

- Governance/lint machinery moves to filename-based conventions → the case for the central registry weakens; revisit distribution.
- A domain accumulates several templates of its own and the pointer hop becomes a real friction → revisit distribution for that domain.

## Related

- Exception note: `product/handbook/CLAUDE.md`
- Records home: [product/launches/](../launches/)
- Root `CLAUDE.md` Doc Index rows: Handbook, Launches
