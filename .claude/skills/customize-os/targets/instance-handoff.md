# Playbook — target: `instance-handoff`

The last gate before an instance leaves your hands — a customer clone, a demo repo, a
handover to the client's own admin. `demo-readiness` asks whether there is **enough data**
to demo; this target asks whether the instance is **complete, runnable, and internally
honest** at the moment it is handed over. Those are different questions and a repo can
pass one while failing the other badly.

Unlike every other target in the sequence, **this one is a gate**. It has pass/fail
conditions, not guidance thresholds. A failing condition blocks the "ready to hand over"
verdict; it does not become a note in the readout. Shared lifecycle, state, readout, and
write rules: SKILL.md.

**Why it exists.** An instance was handed over whose delivery dropped every dotfile —
all 59 skills, the hooks and the CI — leaving a repo that could not run a single slash
command. Nothing noticed, because nothing had ever been asked to look. The repo also
carried 42 broken links, 8 artifacts missing from their initiative pages, and a status
file that contradicted the tree. Every one of those was mechanically detectable.

## Gate 1 — the mechanical lint passes

Run `.github/scripts/wiki-lint.sh` from the repo root. **Zero ❌ is the bar**; warnings are
reported but do not block. If the script is absent, that is itself a Gate 2 failure — say
so and run `/wiki-lint` in-session instead, treating its "Needs your decision" list as the
blocking set.

Do not summarize the lint's output — the readout carries the counts per class, because
"3 broken links" and "42 broken links" are different conversations.

## Gate 2 — the instance is complete

Check what a fresh clone would actually contain. Files a delivery can silently drop are
exactly the ones the OS runs on:

- `.claude/skills/` — count the folders and compare against the master's count. A
  mismatch is either a deliberate rename (Gate 4) or a loss.
- `.claude/hooks/` — `session-start.sh`, `write-guard.sh`, `auto-commit.sh` present and
  executable; `.claude/settings.json` wiring all three.
- `.claude/agents/`, `.claude/team-learnings.md`, `.claude/CLAUDE.md`.
- `.github/workflows/` and `.github/scripts/` — the scheduled lint and its engine.
- `.gitignore`.

Then check they are actually **tracked**: `git ls-files '.claude/*' | wc -l`. A file
present on disk but untracked will not survive a clone, and a `.gitignore` that excludes
`.claude/` silently defeats the whole handover.

**Name the delivery method and its known failure.** A GitHub web-UI upload and most
drag-and-drop flows omit dotfolders entirely; a zip built without `-r` on hidden entries
does the same. If the instance will be delivered by anything other than `git push` /
`git clone`, say so plainly and require a post-delivery re-check of this gate against the
delivered artifact — not the working tree it was built from.

## Gate 3 — the state file tells the truth

`os-installation/customization-status.md` is the resume point and the audit trail; a wrong
one sends the next run to redo finished work or skip unfinished work. Reconcile every
target row against the tree, not against memory:

- A target marked `not started` whose effects are visibly present in the repo → the work
  happened outside the skill. Correct the row, and record in the log **who did it and
  how**, so the next run knows the state was not skill-produced.
- A target marked `complete`/`installed` whose artifacts are absent → correct it down.
- `naming:` header vs the repo's actual terms and skill-folder names (Gate 4).

Contradictions found here are fixed in the same run, never left as an Open item — the
whole value of the file is that it can be trusted without re-deriving it.

## Gate 4 — every command the repo names actually exists

Collect every slash command referenced anywhere in repo prose — `CLAUDE.md`s, the
handbook (`de-risk-a-bet.md` especially, it is the canonical chain), templates,
`feature-index.yaml` comments, `Documentation/` — and resolve each against
`.claude/skills/{name}/SKILL.md`.

**Every referenced command must resolve.** A repo that tells a reader to run
`/product-brief-draft` while only `/prd-draft` is installed is broken for its primary
audience, and the failure is invisible until someone types it on stage.

Two legitimate resolutions, both recorded:

- The prose is wrong → fix the prose (this is the usual case: `naming-conventions` keeps
  slash commands canonical by design, so house command names in prose are drift).
- The instance deliberately renamed commands → that is a **fork of master-maintained
  skills**. It must be recorded as such in the status file with its cost stated: master
  skill updates no longer apply cleanly to the renamed folders. Prefer the alias route in
  `targets/naming-conventions.md` over a folder rename.

## Gate 5 — the demo can be performed, not just described

For each scenario the instance is meant to show, name the exact artifact the presenter
opens and confirm it exists and says what the scenario needs. This is a spot check, not a
rehearsal — but it catches the class where the corpus is right and the joins are missing:
the transcript tagged to three initiatives that appears on none of their pages, the
customer page that links no interviews, the artifact marked `[PENDING:]` while it sits on
disk. Gate 1 catches these mechanically; this gate catches the ones that are *present but
wrong for the story*.

## Verdict

- **Ready to hand over:** all five gates pass. Say what was checked, and state the
  delivery method the verdict assumes. Phase → `complete`.
- **Blocked:** list every failing gate with its counts and the concrete fix. Do not soften
  this into a recommendation — the point of the gate is that "mostly ready" is the state
  that ships broken instances. Offer to fix what is mechanical (`/wiki-lint` applies most
  of Gate 1), then re-run this target.

Re-run this target after any bulk change and immediately before delivery — the gates are
cheap and the failure they prevent is not recoverable once the customer has the repo.
