# Team Learnings

Rules for how agents must behave in THIS repo — corrections that should never recur.
Injected into every session start by `.claude/hooks/session-start.sh`, so this file is a
context tax: **hard cap ~30 lines of entries. When adding, prune the weakest.**

Add an entry when: Claude consistently gets something wrong here · the team agrees on a
pattern · someone confirms a working preference that should persist. One line each:
`- YYYY-MM-DD — rule (why, if not obvious)`.

Not for process lessons (→ `product-development/product/meetings/retros/lessons-learned.md`)
or product choices (→ `product-development/product/decisions/`). See the routing table in
`.claude/references/write-back-contract.md`.

## Entries

- 2026-08-03 — When asked about churn, always specify by-segment or by-tier; overall churn alone misleads.
- 2026-08-03 — Customer summaries never include customer-side PII: role titles, not personal names.
- 2026-08-03 — SQL queries always carry the `Last verified:` header with a real date — placeholder dates fail the launch gate.
