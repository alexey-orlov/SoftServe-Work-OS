# Claude Configuration

Skills, agents, and hooks for this repo.

**Read this when:** You are adding or debugging automation.

## Contents

### Subfolders

- [agents/](agents/) — Subagent definitions
- [hooks/](hooks/) — Session lifecycle hooks: session-start briefing + write-guard (write-policy enforcement)
- [skills/](skills/) — One folder per skill, each with a SKILL.md. Layout is **flat by requirement** — Claude Code scans only one level deep, so a skill nested in a group subfolder is not discovered at all. Grouping lives in [skills/CLAUDE.md](skills/CLAUDE.md) and the `group:` frontmatter key.

## Repo skills take precedence over plugin skills

Installed plugins (e.g. `product-management`) ship skills that overlap this repo's: `write-spec` ≈ `/prd-draft`, `synthesize-research` ≈ `/user-research-synthesis`, `competitive-brief` ≈ `/competitor-analysis`, `stakeholder-update` ≈ `/status-update`, `sprint-planning`/`roadmap-update`/`metrics-review` ≈ parts of planning and metrics skills. **Always prefer the repo skill when both match**: only repo skills read this wiki's context and write back into it (write-back contract, feature index, initiative pages, ledger) — plugin output lands nowhere and the loop breaks. Reach for a plugin skill only when no repo skill covers the task.
