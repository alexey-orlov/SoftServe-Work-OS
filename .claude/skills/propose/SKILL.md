---
name: propose
description: Open (or update, or mark ready) the pull request that carries your gated changes to the admins — the "propose" step of the pr landing strategy (settings → auto-merge → strategy: pr in governance/write-policy.yaml). Auto-sync has already committed the gated files on your branch and pushed it; this skill writes a plain-language description of everything accumulated across the turns (what changed, why, files, the Azure path-filter reminder when the gated list itself changed) and opens the PR into the target branch with the platform CLI — gh for GitHub, az repos for Azure Repos — as a draft if you say so; --ready flips a draft to ready for review. On GitHub the desktop app's Create PR button does the same thing (it needs a clean tree and a non-target branch — both true here). Use on /propose, "propose the gated changes", "open the PR for the gated files", "mark the gated PR ready", "update the gated PR description". NOT for everyday (auto-tier) work — that drains to the target by itself every turn — and not for turning the flow on (/auto-sync) or changing what is gated (edit governance/write-policy.yaml).
argument-hint: "[--draft | --ready | --update]"
group: os-admin
---

# propose — hand the gated changes on your branch to the admins

The pr landing strategy keeps two kinds of commits on your session branch: everyday
commits (drained to the target branch automatically, gone from the branch after they
land) and gated commits (`gated:` prefix — kept on the branch, pushed every turn, never
merged by automation). This skill turns the gated commits into ONE pull request with a
description a reviewer can read cold. Run it when you are done iterating — a multi-turn
change becomes a single proposal, not a drip.

## Preconditions (check, then say what is missing)

1. `governance/write-policy.yaml` → `settings → auto-merge → strategy` is `pr`. Otherwise
   stop: this flow is not on; a gated change in the direct strategies is landed with
   "commit and push the gated changes" (steward) — see the write-policy header.
2. Current branch is not the target (`target-branch`, default `main`) and not detached.
3. Nothing uncommitted (`git status --porcelain` empty). Uncommitted gated edits are the
   turn-end hook's job — tell the user to let the turn end (or run
   `.claude/hooks/auto-commit.sh` once) and re-run.
4. `git fetch origin <target>`; the gated commits = `git log --oneline origin/<target>..HEAD`
   whose files match the gated list (`.github/scripts/gated-paths.sh` prints it). If there
   are ALSO everyday commits still above origin/<target>, say so: they are mid-drain — the
   PR diff will show them until their drain merges (usually a minute; wait, or proceed
   and note it in the description). No gated commits → nothing to propose; say so.
5. Platform + tool: origin URL → GitHub (`gh auth status`) or Azure DevOps (`az account
   show`, azure-devops extension). Missing/unauthenticated → do not stop: push the branch
   (`git push -u origin HEAD`) and print the manual path — GitHub: "Compare & pull
   request" banner or `gh auth login`; Azure: Repos → Pull requests → New, or the "Create
   a pull request" banner for the branch — plus the description text below, ready to paste.

## Compose the description (before any CLI call)

Plain language, for an admin who was not in the session:

```
## What changes and why
{2–5 sentences: the intent, in the user's words from this session where possible}

## Gated files
- {path} — {one line: what changed}
…

## Commits
- {short sha} {subject}   (from git log origin/<target>..HEAD, gated commits only)

## Checks for the reviewer
- {anything the reviewer must verify — a renamed rule, a settings flip, a template change}
{if governance/write-policy.yaml is among the files:}
- ⚠️ This changes the gated list / reviewers. After merging: GitHub — CODEOWNERS was regenerated in this PR (verify .github/CODEOWNERS); Azure Repos — refresh the required-reviewer path filter on <target> to:
  `{output of .github/scripts/gated-paths.sh --format ado}`
  (Project settings → Repositories → <repo> → Policies → Branch policies → <target> → Automatically included reviewers → Path filter). Skip if the policy-sync pipeline is installed (os-installation/admin-setup-azure-devops.md, optional).

_Opened by /propose from branch `<branch>` (Team OS pr flow). Everyday work from this branch merges separately by auto-sync._
```

Title: `gated: <what, ≤ 70 chars>` — from the commit subjects, or the user's words.

## Open / update / ready

Pick by argument (default: open; if a PR for this branch already exists → update):

| Platform | Open | Update description | Ready (draft → review) |
|---|---|---|---|
| GitHub | `gh pr create --base <target> --head <branch> --title "<t>" --body-file <f> [--draft]` | `gh pr edit <n> --title "<t>" --body-file <f>` | `gh pr ready <n>` |
| Azure Repos | `az repos pr create --source-branch <branch> --target-branch <target> --title "<t>" --description "$(cat <f>)" [--draft true]` | `az repos pr update --id <n> --title "<t>" --description "$(cat <f>)"` | `az repos pr update --id <n> --draft false` |

Existing PR lookup: `gh pr list --head <branch> --base <target> --state open --json number,url,isDraft` /
`az repos pr list --source-branch <branch> --target-branch <target> --status active`.
Never merge, never approve, never `--admin` / `--bypass-policy`: the admins do that.
Push first if the branch is behind origin (`git push --force-with-lease -u origin HEAD` —
auto-sync rebases, so lease-protected force is the correct push).

## Report (always)

```
Gated PR {opened|updated|marked ready}: {ref} · {url or "Azure PR <id>"}  [draft]
Branch {branch} → {target} · {N} gated file(s) in {K} commit(s)
Reviewers: {GitHub: code owners from .github/CODEOWNERS | Azure: the required-reviewer group on <target>}
Next: the admins approve and merge; keep working — every turn's push updates this PR. After the merge your branch resets to a clean slate at the next turn end.
{if the gated list changed: the Azure path-filter reminder, verbatim}
{if no tool: the manual path + the description to paste}
```

## Self-check

- Description names every gated file and says why, in plain language — no hook jargon.
- The Azure path-filter reminder is present iff `governance/write-policy.yaml` is in the diff.
- No merge/approve/bypass command was run.
- Failures (auth, push rejected, PR already merged) are stated in the reply — no success line over a failed step.
