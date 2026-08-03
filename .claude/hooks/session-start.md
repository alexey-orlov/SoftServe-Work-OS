# Session Hooks — how the wiki stays in every session's head

Two hooks ship installed and wired via `.claude/settings.json` (this is the working
configuration — no setup needed beyond `chmod +x .claude/hooks/*.sh` after cloning).

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

(Older docs showed a `"session_start": {"command": …}` shape — that schema is wrong and
never fires; the matcher-array form above is the working one.)

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
