---
name: auto-sync
description: The one switch for hands-off git flow, in two modes. `direct` (main accepts pushes) — every turn's non-gated work is committed on main and pushed to origin automatically; gated files (the tiers list in governance/write-policy.yaml) are written behind the write prompt and HELD — they also go to main, but only when you say "commit and push the gated changes". `pr` (main is pull-request-only on the server) — you work on your own branch, non-gated work drains to main through self-merging pull requests, gated files are committed on your branch and reach main only through /propose + an admin's approval. /auto-sync on [direct|pr] turns it on (mode given = switch to it; omitted = keep the configured one), /auto-sync off turns it off, /auto-sync status reports; direct|pr alone = switch mode and turn on. Flips the settings block of write-policy.yaml (a gated edit you approve at the prompt), lands the flip itself, then reports the live gated list, how to change it, and the exact flow a gated file follows in that mode. Use on /auto-sync, "turn on autocommit / auto-push", "switch auto-sync to pr mode / direct mode", "stop auto-pushing", "is auto-sync on?". NOT for changing WHICH files are gated (edit the tiers list — the report tells you how), not a bypass for gated files, not for opening the gated PR (/propose), and not the server-side setup (os-installation/admin-setup-github.md / admin-setup-azure-devops.md).
argument-hint: "[on [direct|pr] | off | status | direct | pr]"
group: os-admin
---

# auto-sync — one switch, two modes

Flips the `settings:` block of `governance/write-policy.yaml`, which
`.claude/hooks/auto-commit.sh` (the Stop hook, already wired) re-reads at every turn
end — so the flip takes effect immediately, no session restart. The write-time gate
(`write-guard.sh`) is independent of this switch and stays on either way.

## The two modes

| | **direct** — `strategy: ff-only` (or `merge-commit`) | **pr** — `strategy: pr` |
|---|---|---|
| Fits when | `main` accepts direct pushes: solo / small trusted team, no server rule yet | `main` is pull-request-only on the server (the admin guides' setup) |
| Non-gated files | committed on `main` and pushed — every turn, no ceremony | committed on your branch and drained to `main` through a small pull request that merges itself — every turn |
| Gated files | written behind the write prompt, then **held** (uncommitted, listed in the turn-end note); they go to `main` too, but only when you say "commit and push the gated changes" | committed on your branch and pushed; reach `main` only through the pull request `/propose` opens and an admin approves (GitHub: the desktop Create PR button is equivalent) |
| Where you work | `main` (or a worktree branch the hook fast-forwards into `main`) | your own branch (`sync/<you>`, or the desktop worktree branch) |
| Needs | nothing extra | `gh` (GitHub) or `az` + azure-devops extension (Azure Repos) logged in — without them the hook still pushes and names what to merge by hand |

Choosing: pick **pr** whenever the server rule from `os-installation/admin-setup-github.md`
/ `admin-setup-azure-devops.md` is (or will be) in place — it is the only mode that
enforces admin approval; pick **direct** for a repo where `main` is open and one person
is the steward. `/customize-os` asks this once per instance and records the choice.

## Mode: on [direct|pr]   (also: `/auto-sync direct`, `/auto-sync pr`)

1. **Preconditions** — all checked before touching anything:
   - Inside a git repo, not mid-merge/rebase (`git status`). If mid-operation: stop and say so.
   - Read the current `settings:` values and the current branch. Decide the target mode:
     the argument if given; else the configured strategy (`pr` → pr, anything else →
     direct). Say which mode you are turning on.
   - **Switching pr → direct** while the checkout sits on a session branch: if
     `git log origin/<target>..HEAD` has commits, stop — those must first land (everyday
     ones drain at the next turn end; gated ones via `/propose`) or be discarded on
     purpose. If the branch is clean and level with the target: `git checkout <target>`
     and `git pull --ff-only`, then flip. Warn: direct mode pushes `main` straight —
     if the server rejects that (`GH006` protected branch / `TF402455`), `main` is
     pull-request-only and pr mode is the one that works.
   - **Switching direct → pr**: fine from `main`; held (uncommitted) gated edits become
     gated commits on your branch at the next turn end. Check the PR tool for the
     platform (`gh auth status` / `az account show` + azure-devops extension) — missing
     is not a blocker, but the report must say so.
   - `git remote get-url origin`. Missing: proceed, but the report must say pushes will
     be skipped until a remote exists (the hook notes this too).
2. **Idempotence** — already fully on in the same mode → skip to step 5, say "already on".
3. **Flip** (one Edit to `governance/write-policy.yaml` — gated, so the user approves
   the write prompt): `auto-commit.enabled: true`, `auto-merge.enabled: true`,
   `push: true`, and — only when a mode was requested — `strategy: ff-only` (direct) or
   `strategy: pr`. Never touch `scope`, `message-prefix`, `target-branch`,
   `block-protected-tiers`, or the `pr-flow` / `write-guard` blocks in the flip — those
   are configuration, not the switch.
4. **Land the flip yourself** — the policy file is gated, so the Stop hook will NOT land
   it. Direct mode (on `main`): `git add governance/write-policy.yaml`, commit
   (`context: auto-sync on (direct)`), `git push origin main`; push rejected → `git pull
   --rebase origin main && git push origin main`; still failing → report the exact
   state, do not print the success banner. Pr mode: commit the flip; if you are on
   `main`, the hook moves it to your branch at the turn end and it travels like any
   gated change (`/propose` when done) — say so; if `main` still accepts pushes (server
   rule not yet in place), push it directly and say that too.
5. **Report** — the banner for the mode, gated list read LIVE from the `tiers:` block
   (never a hardcoded copy).

## Mode: off

Same flow: set `auto-commit.enabled: false`, `auto-merge.enabled: false`,
`push: false` (strategy untouched); commit `context: auto-sync off`; land it as in step 4
(best-effort push; note a failure, don't block on it). Report must state: automation
off, **write-time gate for gated files still active** (that's the write-guard, not this
switch), which mode stays configured, and that uncommitted work now stays local until
committed by hand.

## Mode: status

Read-only. Print the three switch values, the mode (`strategy`), current branch, whether
`origin` exists, anything currently uncommitted (`git status --short`), and in pr mode
the commits waiting on the branch (`git log --oneline origin/<target>..HEAD`) plus the
open gated PR if the hook recorded one (`.git/team-os/gated-pr`). Then the "Gated files"
and "How a gated file flows" sections of the matching banner.

## Success banner — direct mode

```
✅ Auto-sync is ON — direct mode (main accepts pushes)

From now on, at the end of every turn:
• All changed non-gated files are auto-committed on main (prefix "context:").
• main is pushed to origin automatically.
• Gated files are excluded from both — they stay in your working tree, listed in the
  turn-end note, until you land them (they go to main too, on your say-so).

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

Other mode: /auto-sync pr (main pull-request-only, admin-approved gated PRs)
Turn off: /auto-sync off · Check: /auto-sync status
```

## Success banner — pr mode

```
✅ Auto-sync is ON — pr mode (main is pull-request-only)

From now on, at the end of every turn:
• You work on your own branch ({branch-prefix}{you}; created from main when needed).
• Non-gated files are committed there and drained to main through a small pull
  request that merges itself (no review needed).
• Gated files are committed on your branch too — pushed, never merged by automation.
  They reach main only through a pull request an admin approves.
• When you are done iterating: say "propose the gated changes" (/propose){, or press
  Create PR in the desktop app — GitHub only}.

Gated files & directories (live from governance/write-policy.yaml):
  {one line per entry in tiers → gated}

To change the gated list: same as above — edit governance/write-policy.yaml (the change
is itself gated, so it travels through /propose); CODEOWNERS regenerates by itself,
Azure admins get the path-filter reminder in the PR.

Server side (admin, once): os-installation/admin-setup-github.md or
admin-setup-azure-devops.md — until that is done the flow works but nothing enforces
the approval. {PR tool status: gh/az logged in | missing → drains are pushed, merged by hand}

Other mode: /auto-sync direct (main accepts pushes; gated files held for you)
Turn off: /auto-sync off · Check: /auto-sync status
```

## Self-check (before finishing)

- The `settings:` block shows exactly the intended values — the three switches, plus
  `strategy` only when a mode was requested; no other line changed.
- Mode on/off: the flip is committed AND on origin (direct: `git log origin/main..main`
  empty; pr: pushed on the branch or `main`, as reported) — or the failure is reported
  in place of the banner.
- A pr → direct switch never left commits stranded on a session branch without saying so.
- The gated list in the report came from the live file, not from this skill's text.
- Every failure surfaced in the reply — no success banner over a failed step
  (failure-visibility rule, root CLAUDE.md).
