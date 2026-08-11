---
name: auto-sync
description: The one switch for hands-off git flow — /auto-sync on turns on autocommit of every turn's work on main and auto-push to origin, except gated files (the tiers list in governance/write-policy.yaml), which keep both gates — your in-session yes at write time, and never auto-committed or auto-pushed. Flips the settings block of write-policy.yaml (a gated edit you approve at the prompt), lands the flip itself, then reports success with the live gated list, how to change it, and the exact flow a gated file follows. /auto-sync off turns the automation off; /auto-sync status reports the switches without changing anything. Use on /auto-sync, "turn on autocommit / auto-push", "make everything land on main automatically", "stop auto-pushing", "is auto-sync on?". NOT for changing WHICH files are gated (edit the tiers list in write-policy.yaml — the report tells you how), not a bypass for gated files (those always land deliberately), and not the GitHub-side enforcement setup (os-installation/claude-code/scheduled-governance.md).
argument-hint: "[on|off|status]"
group: os-admin
---

# auto-sync — one switch for hands-off git flow

Flips the `settings:` block of `governance/write-policy.yaml`, which
`.claude/hooks/auto-commit.sh` (the Stop hook, already wired) re-reads at every turn
end — so the flip takes effect immediately, no session restart. The write-time gate
(`write-guard.sh`) is independent of this switch and stays on either way.

Default mode is `on`. `off` and `status` below.

## Mode: on

1. **Preconditions** — all checked before touching anything:
   - Inside a git repo, not mid-merge/rebase (`git status`). If mid-operation: stop and say so.
   - Current branch (`git rev-parse --abbrev-ref HEAD`). On `main`: normal case. On a
     side branch: proceed — the hook will fast-forward `main` from it each turn — but
     name the branch in the report.
   - `git remote get-url origin`. Missing: proceed, but the report must say pushes will
     be skipped until a remote exists (the hook notes this too).
2. **Idempotence** — read the current `settings:` values first. Already fully on →
   skip to step 5 and say "already on".
3. **Flip** (one Edit to `governance/write-policy.yaml` — gated, so the user approves
   the write prompt): `auto-commit.enabled: true`, `auto-merge.enabled: true`,
   `push: true`. Never touch `scope`, `message-prefix`, `target-branch`, `strategy`,
   or `block-protected-tiers` in the same flip — those are configuration, not the switch.
4. **Land the flip yourself** — the policy file is gated, so the Stop hook will NOT
   commit it: `git add governance/write-policy.yaml`, commit
   (`context: auto-sync on`), `git push origin main`. Push rejected → `git pull
   --rebase origin main && git push origin main`; still failing → report the exact
   state, do not print the success banner.
5. **Report** — the template below, with the gated list read LIVE from the `tiers:`
   block of `governance/write-policy.yaml` (never a hardcoded copy).

## Mode: off

Same flow: set `auto-commit.enabled: false`, `auto-merge.enabled: false`,
`push: false`; commit `context: auto-sync off`; push best-effort (note a failure,
don't block on it). Report must state: automation off, **write-time gate for gated
files still active** (that's the write-guard, not this switch), and uncommitted work
now stays local until committed by hand.

## Mode: status

Read-only. Print the three switch values, current branch, whether `origin` exists,
and anything currently uncommitted (`git status --short`), then the "Gated files"
and "How a gated file flows" sections of the template.

## Success report (mode: on)

Fill and print exactly this shape — the gated list from the live policy file:

```
✅ Auto-sync is ON — main, autocommit + autopush

From now on, at the end of every turn:
• All changed files are auto-committed on main (prefix "context:").
• main is pushed to origin automatically.
• Gated files are excluded from both — they stay in your working tree,
  listed in a session note, until you land them.

Gated files & directories (live from governance/write-policy.yaml):
  {one line per entry in tiers → gated}

To change the gated list:
• Tell me "add <path> to the gated list" or "remove <path> from the gated list" —
  I edit governance/write-policy.yaml and you approve the write prompt. Or edit the
  file yourself in any editor. Either way it takes effect immediately — both hooks
  re-read the policy on every use.

How a gated file flows:
1. An agent needs to change a gated file → Claude Code shows a native permission
   prompt naming the file and the policy.
2. You review the diff and choose "Yes" to allow the write ("No" blocks it).
3. The file changes on disk, but auto-sync will NOT commit or push it — the turn-end
   note lists it as held.
4. To land it: say "commit and push the gated changes" and I'll do it in front of
   you — or run git add / commit / push yourself.

Turn off: /auto-sync off · Check: /auto-sync status
```

## Self-check (before finishing)

- The `settings:` block shows exactly the intended three values — no other line changed.
- Mode on/off: the flip is committed AND on origin (`git log origin/main..main` empty,
  or the failure is reported in place of the banner).
- The gated list in the report came from the live file, not from this skill's text.
- Every failure surfaced in the reply — no success banner over a failed step
  (failure-visibility rule, root CLAUDE.md).
