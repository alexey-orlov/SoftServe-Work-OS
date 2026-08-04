# Chose Tiered Local-First Code Grounding

**Date:** 2026-08-05
**Decided by:** [Steward] (roster placeholder)
**Initiative:** -
**Status:** Active

## Options Considered

1. **GitHub MCP only** — no per-machine setup, works from any device; but its code search allows ~10 requests/minute on the default branch only, no git history, and every read crosses the network — a fetch tier, not a search tier.
2. **Tiered local-first with a read-only explorer subagent** — local clones as the default ground, investigated by a tool-restricted `code-explorer` agent in its own context; GitHub MCP and SHA-stamped maps as labeled fallbacks; refusal when nothing grounded exists.
3. **Pre-generated map/wiki only** — cheap to query, but answers drift from the code silently, with no indication anything is out of date.

## Decision

Option 2 — the access-tier chain in `.claude/references/code-grounding.md`: registry (`engineering/code-repos.yaml`) as Tier 0, local clone + `code-explorer` as the default, remote fetch and maps as labeled degradations, refusal over invention. PM sessions are read-only toward product repos (Edit/Write deny rules). Repo resolution uses `purpose:`/`covers:` keywords plus scout searches — no feature→repo mapping is required or maintained. "Is it live?" resolves against an optional `deployed_ref:` the team's release process already maintains — never a hand-copied SHA.

## Reasoning

Citations from lines actually read are the only standard that keeps a PM answer safe to repeat — everything weaker (default-branch fetch, generated map, PRD memory) must say so on its face. Agentic search over live files also matches how Claude Code actually performs best in large codebases; maintained indexes and mappings rot fastest exactly where they're trusted most.

## Tradeoff Accepted

Per-machine setup (clone + `additionalDirectories` grant, per teammate) and registry upkeep (`last_validated`) — policed by `/wiki-lint` check 11. Headless runs lose code access unless `--add-dir` is passed explicitly.

## Revisit Conditions

- Registry validation lapses (>90 days) across most repos two lint runs straight → governance too loose; escalate `code-repos.yaml` to confirm tier (add it to `write-policy.yaml` tiers.confirm + the root `CLAUDE.md` Governance line + the scheduled-governance ruleset path list, all in one change).
- Claude Code ships first-class remote-repo search with acceptable fidelity → revisit whether Tier 3 can become a default rather than a fallback.

## Related

- Contract: `.claude/references/code-grounding.md`
- Registry: [code-repos.yaml](../../engineering/code-repos.yaml) · maps: [codebases/](../../engineering/codebases/)
- Skills: `/code-qa`, `/connect-code` · agent: `.claude/agents/code-explorer.md`
- Setup mechanics: [code-access.md](../../../os-installation/claude-code/code-access.md)
