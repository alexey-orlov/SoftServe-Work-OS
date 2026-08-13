# Team Learnings

Rules for how agents must behave in THIS repo — corrections that should never recur.
Injected into every session start by `.claude/hooks/session-start.sh`, so this file is a
context tax: **hard cap ~30 lines of entries. When adding, prune the weakest.**

## The capture loop (how entries get here)

When the user corrects/rejects/redirects output or states a standing preference, or a
durable gap surfaces mid-work — run the loop in the moment, not only when asked:
generalize to the root cause (fix the class of mistake, not the single instance) → apply
to the work in hand → persist only if it's likely to recur and isn't covered (sharpen an
existing rule before adding) → route by narrowest scope (canonical routing table:
`governance/write-back-contract.md` — skill/agent-specific rules go to that skill's
self-check, NOT here; this file is the last resort, for cross-cutting rules only) →
close the loop out loud (one line in the reply: what was generalized, where it went).
Gated targets (this file, skills, agents, templates, structural changes) are applied
only via your in-session yes at the write prompt — otherwise file the exact change in
`governance/proposals/`. At a session's natural wrap-up, offer a one-line sweep:
"N takeaways from this session look durable — file them?"

Entry format, one line each: `- YYYY-MM-DD — rule (why, if not obvious)`. Adding at the
cap means naming the weakest entry to prune in the same proposal.

## Entries

_The four below are seed examples showing the format — replace them with your team's own
rules as they come up._

- 2026-08-03 — When asked about churn, always specify by-segment or by-tier; overall churn alone misleads.
- 2026-08-03 — Customer summaries never include customer-side PII: role titles, not personal names.
- 2026-08-03 — SQL queries always carry the `Last verified:` header with a real date — placeholder dates fail the launch gate.
- 2026-08-03 — Skills stay universal: org- or customer-specific behavior (naming, formats, required fields) is read from customized context files (e.g. business-info.md convention blocks), never hardcoded in a skill; prefer extending an existing context file over creating a new one.
