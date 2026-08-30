---
name: prototype-challenge
description: Challenge a built prototype before reviewers or engineering see it — one structured pass, no edits. Token audit first (mechanical drift never spends review attention), then spec alignment (every job-spec / PRD requirement → implemented / partial / missing), usability heuristics, and engineering / design / user lenses, ending in prioritized must-fix / should-fix / nice-to-have recommendations saved as a dated challenge round next to the prototype — a ready input for /prototype-feedback to apply. Adjusts its lens to the artifact: repo HTML, external v0 / Lovable / Bolt builds, or a napkin sketch. Use on /prototype-challenge, "challenge this prototype", "review the prototype before I share it", "is this prototype ready to show?". NOT for applying reviewer feedback (/prototype-feedback), building or rebuilding it (/prototype), critiquing the PRD itself (/prd-challenge), or the handoff-readiness verdict (/pm-handoff).
argument-hint: "[prototype path or slug]"
group: prototyping
---

# Prototype Challenge

Independent critique of a prototype before it goes in front of stakeholders or engineering. Read-only: this skill never edits the prototype — accepted findings are applied by `/prototype-feedback` (the challenge report is a ready-made feedback input).

## Why this exists

A prototype review by people costs a meeting; a flawed prototype in that meeting costs the feature — reviewers argue about the wrong pixels, or the missing state nobody built, instead of the idea. One structured pass beforehand catches what's mechanical (drift, missing states, fake data) and what's judgment (does this actually satisfy the spec, would a user get through it), so human review time goes to the parts only humans can decide. Kept deliberately single-pass and cheap — prototypes iterate in rounds, and a review heavier than the build discourages running it.

## Context to load first

| Source | Where | What to extract |
|---|---|---|
| Job spec (preferred) / PRD | build record link in `product/prototypes/{slug}-feedback-log.md`, else the initiative page's Artifacts rows → `PRDs/{area}/` | requirements, rules/ACs, states, out-of-scope — the alignment baseline |
| Build record + prior rounds | `product/prototypes/{slug}-feedback-log.md` | declared coverage gaps, declined items — don't re-raise what round 1 already settled |
| Design system + gaps | `product/prototypes/design-system/design-system.md` | recorded gaps aren't findings; unrecorded drift is |
| Prior challenge rounds | `product/prototypes/{slug}-challenge-round-*.md` | verify earlier must-fixes landed |
| User research | `product/user-insights/` | pain points and workflows the user lens judges against |

Resolve the slug via the initiative pages when only a feature or initiative name is given ({slug} = the initiative slug throughout). No spec at all → run the pass anyway, mark the alignment section "no spec to verify against — brief-grounded" and say the sharpest findings need `/prd-draft` first.

## Step 0 — Fit the lens to the artifact

- **Repo HTML** (`{slug}.html`) — full pass, audit included. Open it in a browser tool when one is available; several findings (cramped, unbalanced, dead ends) only show up rendered.
- **External build** (v0 / Lovable / Bolt URL) — no audit; judge flow completeness, states, and spec alignment from the deployed link plus its `{slug}-{tool}-prompt.md`. De-emphasize pixel styling: these tools prioritize function.
- **Napkin sketch** (`{slug}-napkin-sketch.md`) — structure only: layout logic, information hierarchy, missing screens or states. Skip heuristics rows that need visuals.

## Step 1 — Token audit (repo HTML only)

```bash
python .claude/skills/prototype/scripts/audit_tokens.py product-development/product/prototypes/{slug}.html --tokens product-development/product/prototypes/design-system/tokens.css
```

Report its findings in a separate "Mechanical" section — hardcoded values, token drift, storage-API use, filler content. These are facts, not judgment; keeping them apart stops them from crowding the findings a human must weigh.

## Step 2 — Spec alignment

| Spec requirement | Prototype status | Gap |
|---|---|---|
| [rule / AC / state from the job spec or PRD] | Implemented / Partial / Missing | [what's absent or different] |

Every requirement gets a row — including the spec's states and variations, the usual casualties. Cross-check against the build record's own coverage checklist: a gap the build already declared (with a reason) is context, not a finding; an undeclared one is.

## Step 3 — Usability heuristics

| Heuristic | Rating (1–5) | Issues | Recommendation |
|---|---|---|---|
| Visibility of system status | | | |
| Match between system and real world | | | |
| User control and freedom | | | |
| Consistency and standards | | | |
| Error prevention | | | |
| Recognition over recall | | | |
| Flexibility and efficiency | | | |
| Aesthetic and minimal design | | | |

Score honestly and skip what the artifact can't show (a napkin sketch has no system-status feedback). An empty Issues cell with a 5 is a finding of health, not a skipped row.

## Step 4 — Three lenses

- **Engineering:** feasibility of what the prototype implies — hidden complexity, states that need backend the spec doesn't cover, performance traps in the imagined implementation. Flag questions for the Engineering-confirmations list; don't answer them yourself.
- **Design:** visual consistency, interaction patterns, accessibility (focus, contrast, labels), design-system alignment beyond what the audit measures mechanically.
- **User:** would the persona from the research get through the flow? Value clarity, friction, learning curve, "would they actually use this?" — grounded in recorded pain points, not taste.

## Step 5 — Prioritized recommendations

| # | Finding | Severity | Fix | When |
|---|---|---|---|---|
| 1 | [must-fix before anyone sees it] | Critical | [specific change] | Before sharing |
| 2 | [should-fix before handoff] | Medium | [specific change] | Next round |
| 3 | [nice-to-have polish] | Low | [specific change] | Later / never |

Every finding names its location (screen id / selector / prompt section) so `/prototype-feedback` can act on it without re-deriving.

## Deliver

Save to `product-development/product/prototypes/{slug}-challenge-round-{N}.md` (N follows the highest existing round). Reply with the verdict first — ready to share / fix the criticals first — then the must-fixes, then a one-line pointer to the full report. Offer: "run `/prototype-feedback` with this report to apply the accepted items."

## Self-check before delivering

- [ ] Audit ran (repo HTML) and its findings sit in the Mechanical section, not mixed into judgment
- [ ] Every spec requirement has an alignment row; declared-in-build gaps marked as such
- [ ] Prior rounds read — nothing re-raised that was already declined with a reason, earlier must-fixes verified
- [ ] All three lenses present; user lens cites research, not taste
- [ ] Every finding has a location and a concrete fix
- [ ] Nothing was edited — this skill reports only

## Write-back (mandatory)

Full contract: `governance/write-back-contract.md`: append the report's line at the END of the list in `product/prototypes/CLAUDE.md`; link the report from the initiative page when one exists; end the reply listing every repo path written or updated.
