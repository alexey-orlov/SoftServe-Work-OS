# Team Learnings

Rules for how agents must behave in THIS repo — corrections that should never recur.
Injected into every session start by `.claude/hooks/session-start.sh`, so this file is a
context tax: **hard cap ~30 lines of entries. When adding, prune the weakest.**

## The capture loop (how entries get here)

Run the loop in the moment, not only when asked. Triggers: the user corrects, rejects, or
redirects output or states a standing preference — OR you hit a collision yourself: an
assumption proven wrong, a rule you couldn't follow as written, contradictory
instructions, a skill misfire, repeated friction, a tool/environment failure that will
recur. Then: generalize to the root cause (the class of mistake, not the instance) → apply
to the work in hand → persist only if it will recur and isn't covered (sharpen an existing
rule before adding) → route by narrowest scope (canonical table:
`governance/write-back-contract.md` — skill/agent rules go to that skill's self-check, NOT
here; this file is the last resort, for cross-cutting rules only) → close the loop out
loud (one line in the reply: what was generalized, where it went). Auto-tier targets:
write now. Gated targets (this file, skills, agents, templates, structure): the
write-guard prompt IS the suggestion (exact diff; your in-session yes is one keystroke) —
don't stall the task on it: finish the turn's work, then make gated learning edits at the
end of the turn so the prompts arrive with the result. Headless runs file the exact change
in `governance/proposals/` instead. At a session's natural wrap-up, offer a one-line
sweep: "N takeaways from this session look durable — file them?"

Entry format, one line each: `- YYYY-MM-DD — rule (why, if not obvious)`. Adding at the
cap means naming the weakest entry to prune in the same proposal.

## Entries

_The four below are seed examples showing the format — replace them with your team's own
rules as they come up._

- 2026-08-03 — When asked about churn, always specify by-segment or by-tier; overall churn alone misleads.
- 2026-08-03 — Customer summaries never include customer-side PII: role titles, not personal names.
- 2026-08-03 — SQL queries always carry the `Last verified:` header with a real date — placeholder dates fail the launch gate.
- 2026-08-03 — Skills stay universal: org- or customer-specific behavior (naming, formats, required fields) is read from customized context files (e.g. business-info.md convention blocks), never hardcoded in a skill; prefer extending an existing context file over creating a new one.
- 2026-08-29 — Folder moves end with a semantic audit, not grep alone: skills cite content by role ("User Research | customers/*.md") with no old-path token on the line, so after updating path references, have fresh-eyed subagents read every consumer for meaning-level staleness.
