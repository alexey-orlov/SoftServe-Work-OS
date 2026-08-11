# Collapsed Write Tiers to One Gated List; Added /auto-sync (Autocommit + Autopush on main)

**Date:** 2026-08-11
**Decided by:** [Steward] (roster placeholder)
**Initiative:** -
**Status:** Active

## Decision

- The write policy's two protected tiers (confirm, admin) collapsed into ONE `gated` list in `governance/write-policy.yaml` (v2). Every gated file has the same two gates: the user's in-session yes at write time (write-guard), and exclusion from automation at land time (auto-commit hook holds it — never auto-committed or auto-pushed).
- New `/auto-sync on|off|status` skill is the single switch for hands-off git flow: autocommit every turn's work on `main` and push to origin, gated files excluded. Ships off — the default for fresh installs is unchanged.
- The gated path list is single-sourced: the weekly audit (`.github/workflows/wiki-lint.yml`) now derives its list from the policy at run time. The only manual mirror left is the optional GitHub push ruleset (not enabled on this repo), refreshed at setup.
- `auto-commit.sh` fixed to push when the session is already on the target branch — previously the push block was unreachable from `main`, which made "autopush on main" impossible.

## Options considered

- **Keep the confirm/admin split** — rejected: solo-steward repo; mechanically both tiers were the same prompt, so the split added process language, not protection.
- **Flip the settings by hand instead of a skill** — rejected: one command with a standard report (live gated list + the gated-file flow) is repeatable and self-documenting.

## Tradeoff accepted

Auto-push publishes every turn's auto-tier work with no review step; the after-the-fact review surface is the weekly gated-path audit plus the turn-end held-file notes. Explicitly deferred for later: proposals-flow rework, weekly-audit changes, PR-check changes, and the legacy "Tier 2 / confirm / admin" wording inside skill SKILL.md prose (the policy header maps old names to the gated tier).
