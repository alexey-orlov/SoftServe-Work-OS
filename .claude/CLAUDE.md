# Claude Configuration

Skills, agents, and hooks for this repo.

**Read this when:** You are adding or debugging automation.

## Contents

### Subfolders

- [agents/](agents/) — Subagent definitions
- [hooks/](hooks/) — Session lifecycle hooks: session-start briefing + write-guard (write-policy enforcement)
- [skills/](skills/) — One folder per skill, each with a SKILL.md. Layout is **flat by requirement** — Claude Code scans only one level deep, so a skill nested in a group subfolder is not discovered at all. Grouping lives in [skills/CLAUDE.md](skills/CLAUDE.md) and the `group:` frontmatter key.
