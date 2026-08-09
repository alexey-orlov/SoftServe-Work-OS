---
name: session-retro
description: End-of-session sweep of the CURRENT conversation for durable takeaways the capture loop may have missed, plus the curation pass that keeps the learning surfaces healthy. Extracts candidates (corrections received, standing preferences stated, wrong assumptions, repeated friction, skill misfires), demands a cited moment for each, dedupes against existing rules, routes per the canonical routing table in governance/write-back-contract.md, and applies per write-policy tier — admin targets only via the steward's in-session yes, otherwise an exact-diff proposal in governance/proposals/. Also enforces the team-learnings ~30-line cap (propose the weakest prune) and flags entries older than ~180 days. "Nothing durable this session" is a first-class verdict. Use on /session-retro, "what should we remember from this session?", "any takeaways worth keeping?", or when the wrap-up sweep offer (capture-loop step in .claude/team-learnings.md) is accepted. NOT for meeting/team retrospectives (/process-meeting handles those), folding external artifacts (/context-update), or rating meeting effectiveness (/meeting-feedback).
group: os-admin
---

# session-retro — the reflection backstop + curator

The capture loop (`.claude/team-learnings.md` header) fires at correction time; this
skill is the batch backstop for corrections that flew by, and the curation pass the loop
itself doesn't do. It reads the LIVE conversation — no transcript mining, run it while
the session's context is still loaded.

## Procedure

**1. Sweep the conversation** against this checklist — nothing else is in scope:

- Corrections: where did the user push back on, reject, or redirect output?
- Standing preferences: "always/never/going forward" statements, even without a correction.
- Wrong assumptions: what did the agent believe that proved false the hard way?
- Repeated friction: what took multiple attempts, or had to be re-derived from scratch?
- Skill misfires: did a skill fire wrongly, miss its trigger, or produce off-spec output?

**2. Candidate discipline.** Each candidate must cite the concrete moment in this session
(evidence-gated — no vibes). Generalize to the root cause: fix the class of mistake, not
the phrase. Then apply the persistence bar: likely to recur AND not already covered.
Skip one-offs, task-specific details, and anything already handled in the moment by the
capture loop.

**3. Dedupe before adding.** Read the existing entries in `.claude/team-learnings.md`
and the target skill's self-check section. Sharpening an existing rule beats adding a
near-duplicate.

**4. Route** per the canonical "Routing by content type" table in
`governance/write-back-contract.md`. Narrowest scope wins: a skill/agent-specific rule
goes to that skill's self-check — team-learnings.md is the last resort, for cross-cutting
rules only. Personal preferences and private content route to the user's personal OS,
never this repo (privacy contract).

**5. Apply per write-policy tier** — never invent your own permission model:

- auto → write directly, report it.
- confirm → exact before/after, in-session yes.
- admin (skills, agents, team-learnings, templates, structural changes) → show the exact
  diff; the steward's in-session yes at the write-guard prompt applies it. No steward /
  headless → write the proposal to `governance/proposals/{YYYY-MM-DD}-{slug}.md` (target
  path, tier, exact before/after, evidence, proposer). Large skill reworks: flag
  "eval-first" in the proposal rather than proposing a blind rewrite.

**6. Curation pass** (every run, even when step 1 finds nothing):

- Entry cap: if `.claude/team-learnings.md` holds more than ~30 entry lines, propose
  which weakest entries to prune (with the reason each is weakest).
- Staleness: flag entries older than ~180 days for re-validation — still true, or prune?
- Stale proposals: anything in `governance/proposals/` older than 14 days → remind the
  steward to apply or reject.

**7. Run report** (the contract's run-visibility rule): candidates found / filed /
proposed / skipped-with-reason, plus every repo path written. When step 1 yields nothing
and curation is clean, say exactly that: **"Nothing durable this session."** — a
zero-yield run is a correct outcome, not a failure. Never pad the learnings file to look
productive.

## Write-back (mandatory)

Proposals in `governance/proposals/` need no navigation entry (queue folder — exempt per
wiki-lint check 2). Everything else this skill writes follows the routed destination's
own rules (`governance/write-back-contract.md`). End the reply by listing every repo
path written or proposed against.

## Self-check before output

- Every kept candidate cites a concrete moment from THIS session.
- Every write matched the target's tier mechanics — no admin path edited without the
  steward's in-session yes.
- Nothing personal/private routed into the team repo.
- The report names every path touched; a zero-yield run says so plainly.
