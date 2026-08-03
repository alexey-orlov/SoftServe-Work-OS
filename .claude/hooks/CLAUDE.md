# Hooks

Session lifecycle hooks — installed and wired via `.claude/settings.json`.

**Read this when:** You want to know what runs automatically each session, or the write-guard just asked you to confirm something.

## Contents

### Files

- [session-start.md](session-start.md) — Documentation for all hooks: the session-start briefing, the write-guard, the working settings.json schema, and the optional session-end handoff
- [session-start.sh](session-start.sh) — SessionStart hook: injects recent decisions, quarter priorities, active initiatives, team learnings, latest health report, and the fold backlog (deltas only — never re-cats root CLAUDE.md)
- [write-guard.sh](write-guard.sh) — PreToolUse hook: enforces `product-development/_meta/write-policy.yaml` — confirm/admin-tier paths trigger a native approval prompt before any agent write
