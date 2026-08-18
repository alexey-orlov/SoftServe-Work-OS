# Admin setup — Azure DevOps / Azure Repos (once, before the team starts using this OS)

**Who:** a project administrator. **Time:** ~20 minutes. **Result:** two roles; `main` is
pull-request-only; changes to gated paths need an OS-admin's approval; everyone's everyday
work still lands on `main` by itself (Claude Code opens the small pull requests with
auto-complete).

Why it looks like this: Azure Repos has no folder-level permissions, and any *required*
branch policy makes the branch pull-request-only for everyone without bypass — so the
approval is scoped by the policy's **path filter**, generated from the OS's own gated list.
Background: `claude-code/scheduled-governance.md`.

## 1. Two roles

1. **Group `OS-Admins`** — Project settings → Permissions → New group. Add the stewards.
   Everyone else stays in the project's *Contributors* group.
2. **Repository security** — Project settings → Repositories → *your repo* → Security:

   | Permission | Contributors | OS-Admins |
   |---|---|---|
   | Contribute · Create branch · Contribute to pull requests | Allow | Allow |
   | Bypass policies when completing pull requests | **Deny** | Allow |
   | Bypass policies when pushing | **Deny** | Allow |
   | Force push (rewrite history, delete branches and tags) | **Deny** | Allow |
   | Edit policies · Manage permissions | **Deny** | Allow |

   Check the `main` branch inherits this (Repos → Branches → main → ⋯ → Branch security).

## 2. Tell the OS who the admins are

`governance/write-policy.yaml`: set `steward:` to `"Name <email>"`,
`reviewers.azure-group:` to the group's display name (informational), and
`settings → auto-merge → strategy: pr` (this is what tells Claude Code that `main` is
pull-request-only). Commit.

## 3. Protect `main` — one branch policy

Repos → Branches → `main` → ⋯ → **Branch policies**:

- Do **not** add *Require a minimum number of reviewers* (it would make every everyday
  pull request wait for a person).
- **Automatically included reviewers** → **+**: Reviewers = `OS-Admins` · **Required** ·
  **Path filter** = the one line printed by

  ```bash
  .github/scripts/gated-paths.sh --format ado
  ```

  · *Allow requestors to approve their own changes* — on only if `OS-Admins` has fewer than
  two people · Activity feed message: "Gated OS path — needs OS-Admins approval". Save.
- Optional: *Build validation* running `.github/scripts/wiki-lint.sh`; *Limit merge types*
  → allow *Squash* and *Rebase and fast-forward*.

This single required policy is what makes `main` pull-request-only for everyone outside
`OS-Admins` — intended.

## 4. Every teammate, once

```bash
az login
```

```bash
az extension add --name azure-devops
```

Then, in the repo, `/auto-sync on`. From now on each turn end commits everyday work on the
person's own branch and merges it to `main` through a self-completing pull request; gated
files stay on the branch until they say "propose the gated changes" (`/propose` opens the
pull request; the Azure "Create a pull request" banner for the branch works too). The
Claude Code desktop **Create PR** button is GitHub-only. Full mechanics: the header of
`governance/write-policy.yaml`.

## 5. Two-minute test

- As a non-admin: change any normal file → at the turn end a pull request opens and
  completes by itself. Change `CLAUDE.md` → committed on your branch, not merged; say
  "propose the gated changes" → the pull request shows `OS-Admins` as required reviewer
  and cannot complete without them.
- As an admin: approve and complete; the teammate's branch resets at their next turn end.

## Changing the gated list later

Edit `governance/write-policy.yaml` (`tiers → gated`) — the pull request carrying that
change is itself gated. After it merges, refresh the path filter of the policy in step 3
with the new output of `.github/scripts/gated-paths.sh --format ado`. `/propose` puts this
exact reminder (with the new line) into the pull request description, so the approving
admin sees it. **Optional automation:** install `gated-policy-sync.azure-pipelines.yml`
as a pipeline (Pipelines → New → Azure Repos Git → this repo → Existing YAML file) and
grant the build identity *Edit policies* on the repo — then the filter refreshes itself.
Not set up by default; the manual step above is the baseline.
