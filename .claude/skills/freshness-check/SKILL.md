---
name: freshness-check
description: "Superseded by /wiki-lint — staleness scanning is check #1 there, with the same age tiers, stable-file exceptions, and .freshness-ignore support. Kept for one release so habits and references don't break; use /wiki-lint."
group: os-admin
---

# freshness-check → moved to /wiki-lint

This skill's whole scope now lives in `/wiki-lint` as check #1 (staleness), plus nine more
checks (navigation coverage, broken references, index drift, mirror consistency, …).

Flag mapping:
- `/freshness-check` → `/wiki-lint` (staleness section of the report)
- `/freshness-check --schema-drift` → `/wiki-lint --schema-drift`
- `[PENDING:]` marker aging → `/wiki-lint` check #1 (still 14 days)

`.freshness-ignore` in the repo root works unchanged. Reports land in
`governance/health/` instead of chat-only.

**If invoked: run `/wiki-lint` and say so.** This stub is removed once nothing references
it — `/wiki-lint`'s broken-reference check will show when that day comes.
