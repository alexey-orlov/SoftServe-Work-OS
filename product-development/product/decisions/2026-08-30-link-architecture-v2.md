---
date: 2026-08-30
status: Active
initiatives: []
areas: []
docs: [governance/link-schema.yaml, governance/write-back-contract.md]
---

# Link Architecture v2 — Areas → Features Catalog, Initiatives as the Work Container

**Decided by:** OS steward (with an independent architecture review, a Payworks-feedback
analysis, and a red-team pass behind it)

**Decision:** The repo's information model becomes an explicit graph. `feature-index.yaml`
is a pure areas → features catalog (durable facts only: `status: planned | live | retired`,
`shipped:` dates — no artifact rows). Initiatives are the ONLY container for work: every
PRD, jobs breakdown, job spec, prototype artifact, and launch keys by initiative slug and
names its initiative in fenced YAML frontmatter; every initiative names ≥1 target
feature/area — an unmapped initiative cannot exist. One PRD per initiative replaces "one
PRD per feature, forever". Records (decisions, summaries, transcripts) declare their links
(`initiatives:`, `areas:`, `features:`, `customers:`, `competitors:`) in frontmatter;
customer-facing transcripts centralize in `user-insights/transcripts/` with tag
frontmatter. The registry is `governance/link-schema.yaml`; `/feature-launch-gate` is the
catalog's sole status writer; parsers dual-read the legacy formats permanently so deployed
instances migrate by convergence.

**Why:** An independent review found ~40 inconsistencies proving the old conventions
outran the mechanisms — the slug-identity assumption was breaking in the shipped examples,
joins were validated one-way, artifact rows in the index drifted from disk, and the index
could not answer "is X live?" (which mis-trained `/prioritize-requests` to discard demand
for in-flight features). Payworks' module-primary proposal was answered with this instead:
keep the functional tree, make the graph explicit, render module views from it.

**Options considered:** Payworks-style module-primary folders (rejected — fragments
single-writer surfaces, forces "which module owns this?" on every artifact, very large
migration); folder-per-initiative (rejected — dead-weight archives, functional browsing
lost); keeping the index as artifact map with lint-maintained rows (rejected — a derived
layer that can lag; one source of truth per edge instead).

**Tradeoff accepted:** feature-to-artifact lookup is two hops (catalog → targeting
initiatives → artifact rows) instead of one; the Console's feature pages and greps make
it one screen in practice.

**Revisit conditions:** an instance outgrows flat `initiatives/` (~100+ pages), or
tag-based transcript queries prove slower than folder browsing in real use.

**Related:** the full contract in `governance/write-back-contract.md` ·
`governance/link-schema.yaml` · migration runbook `os-installation/link-migration-runbook.md`
