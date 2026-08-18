# OS Installation

Everything needed to install this OS on your machine and confirm it works.

**Read this when:** You are setting up, or you want more out of Claude Code than the basics.

## Contents

### Subfolders

- [claude-code/](claude-code/) — Advanced Claude Code guides: context management, plan mode, parallel agents, custom agents, prompt testing, product-code access

### Files

- [installation-guide.md](installation-guide.md) — Get the OS running in 15 minutes
- [first-session-checklist.md](first-session-checklist.md) — Verify your setup works, 30-40 minutes
- [skill-guide-definition-chain.md](skill-guide-definition-chain.md) — One page per skill for `/customize-os` and the PRD → jobs → job-spec chain: purpose, when used, inputs, step-by-step process, outputs, options
- [admin-setup-github.md](admin-setup-github.md) — Admin, once, before the team starts: two roles (`os-admins` team + write for the rest), the `main` ruleset (pull request required, code-owner review, admins bypass), repo settings for auto-merge, teammate `gh auth login`, two-minute test — the server side of the pr landing strategy
- [admin-setup-azure-devops.md](admin-setup-azure-devops.md) — Same for Azure Repos: `OS-Admins` group + Contributors permissions table, the one required-reviewer branch policy with the generated path filter, teammate `az login`, test, and how the path filter is refreshed when the gated list changes (manual by default)
- [gated-policy-sync.azure-pipelines.yml](gated-policy-sync.azure-pipelines.yml) — OPTIONAL Azure pipeline that refreshes the required-reviewer path filter from `governance/write-policy.yaml` automatically; not installed by default — the manual step in the Azure guide is the baseline

### Created on demand

- `mcp-integration-logs/` — Written by `/connect-mcps` when a tool is connected
