# Proposal — Branch-per-checkout git flow with admin-approved gated PRs (Azure Repos + GitHub)

**Date:** 2026-08-18 · **Proposer:** PM session (design discussion, 2026-08-17/18) · **Status:** approved and implemented 2026-08-18 ("implement this") — kept as the design record; the steward may delete it once read. Where things landed: `.claude/hooks/auto-commit.sh` (pr strategy), `write-guard.sh`, `session-start.sh`, `governance/write-policy.yaml` (settings), `.claude/skills/propose/`, `.github/scripts/gated-paths.sh` + `.github/CODEOWNERS`, `os-installation/admin-setup-github.md`, `admin-setup-azure-devops.md`, `gated-policy-sync.azure-pipelines.yml` (optional), docs. Deviation from the text below: the everyday drain branch is named `<prefix><user>--drain-<sha>` (a git ref cannot be both a branch and a folder), and consecutive turns stack onto the one open drain instead of opening a second one.
**Target paths (all gated):** `governance/write-policy.yaml` (settings block + header prose), `.claude/hooks/auto-commit.sh`, `.claude/hooks/write-guard.sh`, `.claude/hooks/session-start.sh`, new skill `.claude/skills/propose/`, `.github/CODEOWNERS` (+ generator under `.github/scripts/`), `os-installation/claude-code/scheduled-governance.md` (auto-tier — docs), `governance/CLAUDE.md`, `governance/proposals/CLAUDE.md`

## TL;DR

`main` becomes pull-request-only on the server (both platforms), with **one path-scoped rule**: PRs that touch gated files need an admin's approval; everything else has no reviewer requirement. Claude Code absorbs the ceremony:

- Every checkout works on its **own branch** (desktop worktree sessions already have one; in a plain checkout the hook creates `sync/<user>`).
- Each turn the hook makes **two commits** on that branch — everyday files, then gated files — so the working tree is always clean.
- The **everyday commit is drained to `main` in the background** (cherry-picked onto `origin/main` → PR → auto-merge), then the branch is rebased onto the new `main`, which drops the drained commit. What remains on the branch is exactly the gated work.
- **Gated work accumulates on the branch across turns**, pushed every turn, **no PR until the user says so** — "propose the gated changes" (any platform) or the desktop **Create PR** button (GitHub only). One PR, one description, all iterations.
- The gated list has **one source of truth** (`write-policy.yaml`); CODEOWNERS (GitHub) and the required-reviewer path filter (Azure) are generated from it.

Neither platform can do "direct push everywhere except these paths" (see *Why not the literal ask*), so this is the closest faithful design — and it is the same design on both platforms; only the PR command differs (`gh` vs `az repos`).

## Decisions taken (and why)

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| Where gated edits live between turns | **Committed on the session branch** (tree always clean) | Uncommitted in the working tree, snapshot to a background branch | Clean tree = the desktop Create PR button works (its handler refuses on a dirty tree), no risk of a reset wiping uncommitted gated edits, per-turn backup on origin, and one branch per session matches desktop worktrees |
| How everyday work reaches `main` | **Background drain**: cherry-pick the everyday commit onto `origin/main` → PR → auto-merge (async) | Merge the whole session branch | The session branch also carries gated commits; merging it would need admin approval every turn |
| Gated PR timing | **User-triggered** ("propose" / Create PR button), optionally a **draft PR** early for visibility | PR opened automatically per turn | Multi-shot iterations → one coherent proposal for the admin, not a drip |
| Local write-guard | Steward (`write-policy.yaml#steward`) → **ask**; everyone else → **warn** ("this lands on your branch and needs admin approval") | Ask for everyone | Server enforces landing; the ask only prevents wasted iteration for non-stewards, and stewards' changes *can* land directly |
| Path rule sync | Generated from `write-policy.yaml`: CODEOWNERS (in-repo, same commit) · Azure path filter (pipeline / admin script + weekly drift audit) | Manual mirror | Point 4 of the brief: the list changes once, in one place |
| Proposals folder | Becomes the **fallback** (headless runs without a PR token) | Primary channel | The PR *is* the proposal now |

## Why not the literal ask

- **Azure Repos** has no path-level permissions and no server-side pre-receive hooks. Any *required* branch policy makes `main` PR-only for everyone without bypass (docs: "You can't push changes directly to branches with required branch policies unless you have permissions to bypass").
- **GitHub** has push rulesets ("Restrict file paths") — a true path hard-stop, but it applies to **every push on every branch and the fork network**, so a non-admin cannot even push the branch a PR would come from. Branch rulesets cannot be conditioned on file paths.
- Therefore on both: `main` = PR-only, admins bypass, and the *only* path-scoped mechanism is "who must approve".

## Desktop "Create PR" button — verified behaviour

Read from the desktop app's own handler (`createLocalPr`, Claude.app 2.1.229 bundle), not guessed:

| Check / step | Behaviour |
|---|---|
| Current branch is the base branch (`main`) | Refuses: *"Cannot create a pull request from the base branch."* |
| Uncommitted changes present | Refuses: *"There are uncommitted changes. Commit them, or ask Claude to, then create the pull request."* |
| Creates a branch / commits for you | **No** |
| What it does | Pushes the current branch, then creates the PR through the GitHub API (needs `gh` auth; GitHub.com or GHES). Draft flag supported. |
| Title / description | Written by a model from the session transcript + `git log base..HEAD` + `git diff --stat --merge-base base`; fallback title "Update from Claude Code" |
| Azure Repos | **Not supported** — GitHub only |

Consequence: with the session branch clean and holding only gated commits, the button is exactly the "propose" step on GitHub. On Azure the propose step is Claude (`az repos pr create`) or the "Create a pull request" banner in the Azure web UI.

## Trigger → destination (per turn, Stop hook)

| # | Trigger | Action | Destination | User sees |
|---|---|---|---|---|
| 1 | Checkout is on `main` | `git switch -c sync/<user>` (uncommitted work carried along) | local branch | — |
| 2 | Changed non-gated files | commit **A** (`context: …`, as today) | session branch | — |
| 3 | Changed gated files | commit **B** (`gated: …`) | session branch | write-guard already warned/asked at write time |
| 4 | Commit A exists and is not upstream (`git cherry origin/main`) | background worktree from `origin/main` → cherry-pick A → push `sync/<user>/<id>` → open PR → enable auto-merge / auto-complete; **do not wait** | `main` (async) | "Everyday: N files → PR #x, merging" |
| 5 | Fetch shows earlier drained commits now in `main` | `git rebase origin/main` (drops drained commits by patch-id) → `git push --force-with-lease` | session branch on origin | — |
| 6 | Rebase conflict | `git rebase --abort`; if the branch's gated PR is merged → `git reset --keep origin/main`; else report | — | "Conflict on <file> — resolve or ask me" |
| 7 | Everyday PR blocked (lint failed / conflict) | leave PR open, keep auto-merge armed | — | "PR #x waiting: <reason>" |
| 8 | Gated commits on branch, no PR | nothing | — | "Gated: M files across K commits, not proposed — say 'propose the gated changes' (GitHub: or press Create PR). Oldest: D days" |
| 9 | Gated PR open | push updates it | existing PR | "Gated PR #y updated" |
| 10 | Gated PR merged | rebase drops the commits (or reset per #6) | clean branch | "Gated PR #y merged — branch clean" |

Session start adds one line: gated files waiting / gated PR state / everyday PRs still merging. Two hooks in the same checkout serialise on a lock file.

## Propose step (`/propose`, or "propose the gated changes")

| Platform | Command | Description |
|---|---|---|
| GitHub | desktop **Create PR** button, or `gh pr create --base main --head <branch>` (`--draft` optional) | button: model-written from session; skill: from commit list + rationale captured at write time |
| Azure Repos | `az repos pr create --source-branch <branch> --target-branch main --title … --description …` (`--draft` optional) | skill-written |

Iterating after the PR is open needs nothing: every turn's push updates it. Marking a draft "ready" is the same command with `--ready` / UI.

## Server-side configuration

| | Azure Repos | GitHub |
|---|---|---|
| Rule on `main` | Branch policy → *Automatically included reviewers*: group `OS-Admins`, **Required**, path filter generated from `write-policy.yaml` (`;`-separated, `/dir/*`, `/file`); **no** minimum-reviewers policy | Ruleset on `main`: *Require a pull request* (approvals **0**) + *Require review from Code Owners*; `.github/CODEOWNERS` generated from `write-policy.yaml` (every gated path → `@org/os-admins`); repo setting *Allow auto-merge* on |
| Contributors | Contribute, Create branch; **deny** Bypass policies (pushing + completing PRs), Force push, Edit policies, Manage permissions | Write; not on the ruleset bypass list |
| Admins | + Bypass policies when pushing / completing PRs; *Allow requestors to approve their own changes* on if <2 admins | Team `os-admins` on the bypass list ("always"); team has write access (CODEOWNERS requirement) |
| Everyday PR merge | `--auto-complete`, merge type rebase-and-fast-forward or squash (single commit → identical patch) | `gh pr merge --auto --rebase` |
| Gated PR merge | admin completes; prefer rebase / merge commit (squash also fine — hook resets the branch after merge) | admin merges; same |
| Rule sync (brief §4) | pipeline on `main`, path trigger `governance/write-policy.yaml` → `az repos policy required-reviewer update --path-filter …` (identity needs *Edit policies*; pipeline YAML is a gated file); weekly audit compares list ↔ policy | CODEOWNERS regenerated in the same commit that changes `write-policy.yaml`; lint asserts equality; `.github/**` is gated |
| Lint gate on PRs | build-validation policy running `.github/scripts/wiki-lint.sh` (optional) | existing wiki-lint Action (already runs on every PR) |

## Self red-team

| Risk | Mitigation |
|---|---|
| Rebase logic in a Stop hook | Only three git primitives (`cherry`, `rebase`, `push --force-with-lease`); abort-and-report on any conflict; the drain is a *cherry-pick* of a commit that by construction touches only non-gated files, so it commutes with gated commits |
| Hook timeout (30 s today) | Never wait for merges inside the hook; raise timeout to 60 s; drain is async and tracked by patch-id (`git cherry`) so nothing is drained twice |
| Everyday change depends on a gated one (doc links a new skill) | Everyday PR fails lint → stays open, armed; reported each turn; lands once the gated PR merges |
| Two sessions, one checkout | Lock file; or use desktop worktree sessions (own branch each) |
| Squash-merged gated PR breaks the rebase | Hook checks PR state; merged → `git reset --keep origin/main` |
| Force-push on a branch with an open PR | `--force-with-lease` only; PR follows the branch on both platforms; ADO "reset votes on push" left off |
| Contributor edits CODEOWNERS / pipeline YAML around the rule | Both live under gated paths; GitHub evaluates CODEOWNERS from the **base** branch; ADO policy identity is admin-only |
| Someone still on the old flow (direct push to `main`) | Server rejects; hook reports the rejection and switches to branch mode |

## Implementation scope (all behind the gated write prompt)

1. `governance/write-policy.yaml` — settings: `landing: pr` (vs today's `ff-only` local merge), `branch-prefix`, `pr-tool: gh|az`, `write-guard.non-steward: warn`; header prose for "land time" (gated paths land on the session branch and reach `main` only via an approved PR).
2. `.claude/hooks/auto-commit.sh` — two-commit + drain + rebase + report; platform adapter; lock; async tracking.
3. `.claude/hooks/write-guard.sh` — steward → ask, others → warn; capture a one-line rationale for the PR body.
4. `.claude/hooks/session-start.sh` — waiting-gated line.
5. `.claude/skills/propose/SKILL.md` — open / update / ready the gated PR on either platform.
6. `.github/scripts/gated-paths.sh` (`--format codeowners|ado`) + generated `.github/CODEOWNERS`; Azure pipeline `azure-pipelines/gated-policy-sync.yml`.
7. Docs: `os-installation/claude-code/scheduled-governance.md` (Azure recipe, GitHub Model B, button facts), `governance/CLAUDE.md` enforcement chain, `governance/proposals/CLAUDE.md` (fallback role).

Estimated size: hook ≈ +150 lines, skill ≈ 80 lines, generator ≈ 40 lines, docs ≈ 120 lines. Rollout: master repo (GitHub) first with a throwaway gated edit end-to-end, then the customer's Azure instance.

## Open for the steward

- Group/team names (`OS-Admins`, `@org/os-admins`) and whether stewards are one person or a group.
- Draft PR by default on first gated commit (visibility) or PR only on "propose"? Proposal: only on "propose"; `/propose --draft` available.
- Keep `governance/proposals/` at all, or delete once every runner has a PR token? Proposal: keep as fallback for one quarter, then revisit.
