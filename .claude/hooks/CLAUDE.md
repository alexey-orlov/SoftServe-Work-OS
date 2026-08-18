# Hooks

Session lifecycle hooks — installed and wired via `.claude/settings.json`. Two run on every
session; the third (auto-commit) is the auto-sync engine — off until `/auto-sync on`.

**Read this when:** You want to know what runs automatically each session, or the write-guard just asked you to confirm something.

## Contents

### Files

- [session-start.md](session-start.md) — Documentation for all hooks: the session-start briefing, the write-guard, the working settings.json schema, and the optional session-end handoff
- [session-start.sh](session-start.sh) — SessionStart hook: injects recent decisions, quarter priorities, active initiatives, team learnings, latest health report, and the fold backlog (deltas only — never re-cats root CLAUDE.md)
- [write-guard.sh](write-guard.sh) — PreToolUse hook: enforces `governance/write-policy.yaml` — gated paths trigger a native approval prompt before any agent write, tagged `🔒 GATED FILE — Team OS write policy` with the path, the matched rule and what approve/reject mean, so it stands out from ordinary permission asks
- [auto-commit.sh](auto-commit.sh) — Stop hook, the auto-sync engine: auto-commits the turn's work and pushes, per the `settings:` block of `governance/write-policy.yaml`. Direct strategies merge side branches into the target and hold gated paths back; the `pr` strategy (pull-request-only target) works on a branch per checkout, drains everyday commits to the target through self-merging pull requests (gh / az), and keeps gated commits on the branch for `/propose`. Off until `/auto-sync on`
