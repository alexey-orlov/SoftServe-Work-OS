# Playbook — target: `demo-readiness`

Judge whether the instance holds enough real data to demonstrate the OS end-to-end, and
either name the best demo path or delegate gap-filling to `/demo-data`. This target
assesses and recommends — it never generates content itself. Prerequisite (hard):
`context-core` installed — synthetic material generated before the real context exists
would contradict it later. Shared lifecycle, state, readout, and write rules: SKILL.md.

## Step 1 — Assess from the repo, not from memory

Read the actual state: initiative pages and what each links, `governance/processed.txt`
(what has really been ingested), `user-insights/` and interview records,
the coverage lines in the customization status file. Sufficient for a demo means roughly:

- ≥1 initiative with at least one substantive linked artifact (PRD/brief, breakdown, or
  a folded source doc), and
- ≥2 processed meeting/call records attached to initiatives, and
- ≥3 user-insights items (interviews or synthesis) if research workflows are part of the
  demo.

Thresholds are guidance, not gates — state what's there and judge honestly.

## Step 2 — Verdict

- **Ready:** name which initiative(s) demo best and why (richest artifact trail,
  clearest story from meeting → decision → spec), plus the one or two skills that show
  each off. Phase → `complete`.
- **Gaps:** name exactly what's missing per the list above, then offer two closes:
  provide real material now (routes back through `initiatives` / `research-source`
  loading), or generate synthetic demo data — `/demo-data`, scoped to precisely the
  missing classes (and the steering GAPs, if the user wants those demo-filled too).
  Delegate on a yes; record the choice either way. Declined → `complete` with the gap
  list as Open — Other.

`/demo-data` owns everything about generation, marking, and removal — this target only
hands over the gap list.

## What this target does NOT cover

Sufficiency is not deliverability. This target asks whether enough **data** exists; it
never checks that the links between that data resolve, that artifacts are reachable from
their initiative pages, that `.claude/` survives the way the repo will actually be
delivered, or that the slash commands the repo tells a reader to type exist at all. Those
are `targets/instance-handoff.md`, and they are a **gate** — an instance can be richly
populated and still be undemoable. Run `instance-handoff` before any handover, and
whenever this target returns **Ready**.
