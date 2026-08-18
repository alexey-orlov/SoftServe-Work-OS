# Session Hooks — how the wiki stays in every session's head

Three hooks ship installed and wired via `.claude/settings.json` — no setup needed beyond
`chmod +x .claude/hooks/*.sh` after cloning. The first two run on every session; the third
(auto-commit) is the auto-sync engine — off until `/auto-sync on`.

## 1. `session-start.sh` — the briefing (SessionStart)

Fires on `startup|resume|clear` (deliberately NOT on `compact` — a compacted session
already carries its context). Its stdout is added to the session's context. It injects
**deltas only** — root CLAUDE.md is loaded by Claude Code anyway, so the hook never
re-cats it:

1. **Recent decisions** — the 3 newest files in `product-development/product/decisions/`
2. **Current priorities** — head of `strategy/current-quarter.md`
3. **Active initiatives** — every `initiatives/*.md` with `_status: active`
4. **Team learnings** — `.claude/team-learnings.md` (the agent-behavior rules; capped ~30 lines)
5. **Latest health report** — head of the newest `governance/health/*-wiki-lint.md`
6. **Fold backlog** — count of transcripts not yet in the ledger ("run /context-update")
   and pending proposals in `governance/proposals/`
7. **Last session's unfinished work** — surfaced from `.claude/.last-session-state` if the
   optional session-end hook is enabled (below), then cleared

Total injection is capped around ~150 lines. If it feels heavy, trim the `head` counts in
the script.

## 2. `write-guard.sh` — write-policy enforcement (PreToolUse)

Fires on every `Edit|Write|MultiEdit|NotebookEdit` call. Looks the target path up in
`governance/write-policy.yaml`:

- **auto** (not listed) → no output; the write proceeds normally.
- **gated** → returns `permissionDecision: "ask"` — Claude Code shows its native
  confirmation with the hook's reason on it; the user approves after seeing the
  change. (The same paths are also held back from auto-sync — hook 3.)

The reason is written so a gated ask cannot be mistaken for an ordinary permission
prompt (Bash, an auto-tier edit, an MCP call). It always reads:

```
🔒 GATED FILE — Team OS write policy · product-development/feature-index.yaml
Why: steering files · the product map (rule: product-development/feature-index.yaml). Protected context — every change needs your explicit yes.
Approve → written now, but NOT auto-committed or pushed (land it afterwards: "commit and push the gated changes", or git). Reject → nothing is written. Unsure → reject and ask for the exact before/after.
```

Line 1 is a fixed badge + the repo-relative path. Line 2 is the policy's own words:
the comment heading above the matched entry ("Steering files" / "System rules"), the
entry's trailing `# comment`, and the exact pattern — so **write those comments for a
person**, they are what the approver reads. In the terminal the text appears inside the
dialog after `Hook PreToolUse:<Tool> requires confirmation for this edit:` with the line
breaks kept; in the desktop app it is the reason block on the approval card (one
paragraph, ~6 lines visible). Test the text without triggering a real write:

```bash
printf '{"tool_input":{"file_path":"%s/CLAUDE.md"}}' "$PWD" | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/write-guard.sh
```

This is what makes the write policy enforcement rather than prose: it binds every agent
session in the repo, regardless of which skill is running. It does NOT bind humans in a
text editor or bash redirections — that's what the GitHub push ruleset and the weekly
audit are for (see `os-installation/claude-code/scheduled-governance.md`).

## 3. `auto-commit.sh` — the auto-sync engine (Stop) — **off until `/auto-sync on`**

Fires when Claude finishes responding. Reads the `settings:` block of
`governance/write-policy.yaml`; with both switches `false` (the shipped
state) it exits immediately and does nothing.

- **`auto-commit`** — stages and commits the turn's changes. Anything matching a gated
  pattern is left in your working tree and named in the report — always, whatever
  `scope` says. `scope: auto-tier` (the default) commits every other changed path, i.e.
  exactly what the write-guard would have let through unprompted; `product-development`
  narrows that to paths under `product-development/` (the rest is named in the report as
  outside scope); `all` is a legacy alias of `auto-tier`.
- **`auto-merge`** — lands the commit on `target-branch`, then pushes. Already on the
  target (the normal case — sessions run on main): skips straight to the push. On a side
  branch: `strategy: ff-only` (the default) moves the target ref straight from HEAD, so
  there is **no checkout and nothing to leave half-done**; `merge-commit` checks the
  target out and back, restoring your branch on any failure. `block-protected-tiers: true`
  refuses to merge a branch whose history touched a gated path — land those deliberately.
  `push: true` pushes the target to origin after each commit — the auto-push half of
  auto-sync.
- **`strategy: pr`** — for a pull-request-only target (the recommended server setup,
  `os-installation/admin-setup-github.md` / `admin-setup-azure-devops.md`). The hook then
  (1) moves a checkout that sits on the target onto its own branch (`pr-flow.branch-prefix`
  + git user name; desktop worktree sessions keep theirs); (2) commits everyday files
  (commit A) and gated files (commit B, `pr-flow.gated-prefix`) — the tree is always clean;
  (3) fetches and rebases the branch onto the target (drops what already landed; a
  branch whose whole content is already on the target is reset to it — e.g. after the
  gated PR was squash-merged); (4) drains the everyday commits: cherry-pick onto
  `origin/<target>` in a throwaway worktree → push `<prefix><user>--drain-<sha>` → pull
  request + auto-merge/auto-complete via `pr-flow.pr-tool` (`gh` / `az`, auto-detected
  from the origin URL) — asynchronous, tracked by patch-id in `.git/team-os/drains`, so
  nothing drains twice and consecutive turns stack onto the one open drain; (5) pushes
  the branch with `--force-with-lease`; (6) reports gated files waiting on the branch
  and the open gated PR if any (`.git/team-os/gated-pr`, read by session-start).
  Gated commits are never merged by the hook — `/propose` opens their pull request.
  No PR tool / not logged in / `pr-tool: none`: drains are still pushed and the report
  names the branch to merge by hand; everything else works. Two hooks in one checkout
  serialise on `.git/team-os/lock`.

Why the tier list and the switches share one file: the hook resolves scope against the
same `gated:` list the write-guard enforces, so the rule and the automation
cannot drift apart. The write-guard also reads `strategy` (its prompt says where an
approved gated write goes) and `write-guard.non-steward` (in the pr strategy a
non-steward can be *warned* instead of asked — safe only once the server-side rule
exists; the steward, matched via `steward:` against `git config user.name/email`, is
always asked).

**Reporting.** Silent on a clean run with nothing held back. Anything else — files left
uncommitted, a merge it refused, a push that failed — comes back as a non-blocking note in
the session, per the repo's failure-visibility rule. It never returns `decision: block` and
never exits 2: a blocking Stop hook can trap the session in a loop.

Turn it on with `/auto-sync on` (or edit the `settings:` block by hand — gated either
way). The Stop hook is already wired and re-reads the policy at every turn end, so flips
apply immediately — no new session needed.

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
`decisions/` (routing table: `governance/write-back-contract.md`).

## Troubleshooting

- **Hook doesn't fire:** check `chmod +x .claude/hooks/*.sh`; hooks load at session start,
  so settings changes need a new session.
- **Hook errors:** run `bash .claude/hooks/session-start.sh` standalone — it must exit 0
  even on a fresh clone with empty folders.
- **Guard too eager / too quiet:** edit the patterns in
  `governance/write-policy.yaml` — the guard re-reads it on every call.
