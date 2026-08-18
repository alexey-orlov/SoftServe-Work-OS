# Admin setup — GitHub (once, before the team starts using this OS)

**Who:** a repository admin. **Time:** ~15 minutes. **Result:** two roles; `main` is
pull-request-only; changes to gated paths need an OS-admin's approval; everyone's everyday
work still lands on `main` by itself (Claude Code opens and merges the small pull requests).

Why it looks like this: GitHub cannot say "push anywhere except these folders" without also
blocking the branch a pull request would come from, so the rule is on `main` and the
approval is path-scoped through CODEOWNERS. Background: `claude-code/scheduled-governance.md`.

## 1. Two roles

1. **Team `os-admins`** — org → Teams → New team. Add the stewards (the people who may
   approve changes to gated paths). It must have write access to the repo (CODEOWNERS
   requirement).
2. **Repository access** — Settings → Collaborators and teams: `os-admins` → *Admin* (or
   *Maintain*); everyone else → *Write*.

## 2. Tell the OS who the admins are

1. `governance/write-policy.yaml`: set `steward:` to `"Name <email>"` and
   `reviewers.github-team:` to `"@<org>/os-admins"`. Set `settings → auto-merge →
   strategy: pr` (this is what tells Claude Code that `main` is pull-request-only).
2. Regenerate the reviewer map and commit both files:

```bash
.github/scripts/gated-paths.sh --format codeowners --write
```

## 3. Protect `main` (one ruleset)

Settings → Rules → Rulesets → *New branch ruleset*:

- Name `main-pr-only` · Enforcement **Active** · Target: the default branch.
- **Bypass list:** team `os-admins`, mode *Always* (admins may push directly and complete
  their own gated pull requests).
- Rules: ☑ **Require a pull request before merging** → Required approvals **0** ·
  ☑ **Require review from Code Owners** · leave the other sub-options off. Keep ☑ *Block
  force pushes*. Optional: ☑ *Require status checks* → `wiki-lint` (the Action in
  `.github/workflows/`), which makes every pull request pass the mechanical lint first.
- Save. Do **not** create a push ruleset for the gated paths — it would also block the
  branches the pull requests come from.

## 4. Repository settings the automation relies on

Settings → General → Pull Requests: ☑ **Allow auto-merge** · ☑ **Automatically delete
head branches** · keep *Allow rebase merging* on (squash and merge commit may stay on too).

## 5. Every teammate, once

```bash
gh auth login
```

Then, in the repo, `/auto-sync on pr` (the mode for a pull-request-only `main`; `direct` is
the other mode, for an open `main` — `/customize-os` asks which). From now on each turn end commits everyday work on the
person's own branch and merges it to `main` through a self-merging pull request; gated
files stay on the branch until they say "propose the gated changes" (or press **Create PR**
in the Claude Code desktop app — GitHub only). Full mechanics: the header of
`governance/write-policy.yaml`.

## 6. Two-minute test

- As a non-admin: change any normal file → at the turn end a pull request opens and merges
  by itself. Change `CLAUDE.md` → it is committed on your branch, not merged; say "propose
  the gated changes" → the pull request asks `os-admins` for review and cannot merge
  without it.
- As an admin: approve and merge; the teammate's branch resets at their next turn end.

## Changing the gated list later

Edit `governance/write-policy.yaml` (`tiers → gated`). The turn-end hook regenerates
`.github/CODEOWNERS` in the same change, and that change is itself gated — nothing else to
touch. The weekly lint warns if the two ever drift.
