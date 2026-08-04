# Session Hooks — how the wiki stays in every session's head

Three hooks ship installed and wired via `.claude/settings.json` — no setup needed beyond
`chmod +x .claude/hooks/*.sh` after cloning. The first two run on every session; the third
(auto-commit) ships disabled.

## 1. `session-start.sh` — the briefing (SessionStart)

Fires on `startup|resume|clear` (deliberately NOT on `compact` — a compacted session
already carries its context). Its stdout is added to the session's context. It injects
**deltas only** — root CLAUDE.md is loaded by Claude Code anyway, so the hook never
re-cats it:

1. **Recent decisions** — the 3 newest files in `product-development/product/decisions/`
2. **Current priorities** — head of `strategy/current-quarter.md`
3. **Active initiatives** — every `initiatives/*.md` with `_status: active`
4. **Team learnings** — `.claude/team-learnings.md` (the agent-behavior rules; capped ~30 lines)
5. **Latest health report** — head of the newest `_meta/health/*-wiki-lint.md`
6. **Fold backlog** — count of transcripts not yet in the ledger ("run /context-update")
   and pending Tier-2 proposals in `_meta/proposals/`
7. **Last session's unfinished work** — surfaced from `.claude/.last-session-state` if the
   optional session-end hook is enabled (below), then cleared

Total injection is capped around ~150 lines. If it feels heavy, trim the `head` counts in
the script.

## 2. `write-guard.sh` — write-policy enforcement (PreToolUse)

Fires on every `Edit|Write|MultiEdit|NotebookEdit` call. Looks the target path up in
`product-development/_meta/write-policy.yaml`:

- **auto** (not listed) → no output; the write proceeds normally.
- **confirm** tier → returns `permissionDecision: "ask"` — Claude Code shows a native
  confirmation naming the file and the policy; the user approves after seeing the change.
- **admin** tier → same prompt, with a "route through the steward" reason.

This is what makes the write policy enforcement rather than prose: it binds every agent
session in the repo, regardless of which skill is running. It does NOT bind humans in a
text editor or bash redirections — that's what the GitHub push ruleset and the weekly
audit are for (see `os-installation/claude-code/scheduled-governance.md`).

## 3. `auto-commit.sh` — commit / merge the turn's work (Stop) — **ships disabled**

Fires when Claude finishes responding. Reads the `settings:` block of
`product-development/_meta/write-policy.yaml`; with both switches `false` (the shipped
state) it exits immediately and does nothing.

- **`auto-commit`** — stages and commits the turn's changes. `scope: auto-tier` (the
  default) commits only paths the write-guard would have let through unprompted; anything
  matching a confirm- or admin-tier pattern is left in your working tree and named in the
  report. `product-development` and `all` widen that if you want them.
- **`auto-merge`** — merges the working branch into `target-branch` afterwards. Does
  nothing when you are already on the target. `strategy: ff-only` (the default) moves the
  target ref straight from HEAD, so there is **no checkout and nothing to leave half-done**;
  `merge-commit` checks the target out and back, restoring your branch on any failure.
  `block-protected-tiers: true` refuses to merge a branch whose history touched a protected
  path — those land via a reviewed PR. `push` is off: pushing publishes.

Why the tiers and the switches share one file: the hook resolves scope against the same
`confirm:` / `admin:` patterns the write-guard enforces, so the rule and the automation
cannot drift apart.

**Reporting.** Silent on a clean run with nothing held back. Anything else — files left
uncommitted, a merge it refused, a push that failed — comes back as a non-blocking note in
the session, per the repo's failure-visibility rule. It never returns `decision: block` and
never exits 2: a blocking Stop hook can trap the session in a loop.

Turn it on by editing the `settings:` block (admin tier — steward change), then start a new
session; hooks load at session start.

## Configuration reference (`.claude/settings.json`)

```json
{
  "hooks": {
    "SessionStart": [
      { "matcher": "startup|resume|clear",
        "hooks": [ { "type": "command",
                     "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start.sh",
                     "timeout": 30 } ] }
    ],
    "PreToolUse": [
      { "matcher": "Edit|Write|MultiEdit|NotebookEdit",
        "hooks": [ { "type": "command",
                     "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/write-guard.sh",
                     "timeout": 10 } ] }
    ]
  }
}
```

Use the matcher-array form above. A `"session_start": {"command": …}` shape does not match
the hook schema and never fires.

## Optional: session-end note (`SessionEnd`)

SessionEnd output is invisible to the ending session by design, so an end-of-session
"reminder" can only help the NEXT session. If you want that handoff, add to the `hooks`
block:

```json
"SessionEnd": [
  { "hooks": [ { "type": "command",
                 "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-end.sh",
                 "timeout": 15 } ] }
]
```

and create `session-end.sh` writing whatever should be surfaced next time to
`.claude/.last-session-state` (gitignored), e.g.:

```bash
#!/bin/bash
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
CHANGES=$(git status --porcelain product-development/ 2>/dev/null | head -5)
[ -n "$CHANGES" ] && printf 'Uncommitted wiki changes at last session end:\n%s\n' "$CHANGES" \
  > .claude/.last-session-state
exit 0
```

`session-start.sh` already prints and clears that file. We ship this as documentation, not
wired — its value is modest, and every hook is a per-event process spawn.

## Team learnings file

`.claude/team-learnings.md` exists and is injected at every start. Add an entry when
Claude consistently gets something wrong here, when the team agrees on a pattern, or when
a working preference should persist. Keep it under ~30 lines — prune when adding. Process
lessons belong in `meetings/retros/lessons-learned.md` instead; product choices in
`decisions/` (routing table: `.claude/references/write-back-contract.md`).

## Troubleshooting

- **Hook doesn't fire:** check `chmod +x .claude/hooks/*.sh`; hooks load at session start,
  so settings changes need a new session.
- **Hook errors:** run `bash .claude/hooks/session-start.sh` standalone — it must exit 0
  even on a fresh clone with empty folders.
- **Guard too eager / too quiet:** edit the patterns in
  `product-development/_meta/write-policy.yaml` — the guard re-reads it on every call.
