# Work OS — Team Setup Guide

How to set up and customize the Work OS for your organization — who does what, how the repository is set up on GitHub / Azure Repos, how each person gets going, how the Work OS is customized and connected to your tools and code, and how changes flow. Also published as an interactive site with a GitHub / Azure Repos switch, and as a Word document per platform.

## Contents

- **Setup** — [Overview](#overview) · [Set up the repository](#set-up-the-repository) · [Set up your computer](#set-up-your-computer) · [Customize the Work OS](#customize-the-work-os) · [Connect your tools](#connect-your-tools) · [Connect your product's code](#connect-your-products-code)
- **FAQ** — [Troubleshooting](#troubleshooting) · [How changes flow](#how-changes-flow) · [Reference](#reference)

## Overview

*Setup · Everyone — read first · 5 min read*

This guide helps you set up and customize the Work OS for your organization: one shared repository that every teammate and Claude Code work in, adapted to your company, and — where useful — connected to your tools and your product's code. Three roles, three stages, about half a day in total.

### What you'll have at the end

- **One source of truth.** Every teammate's Claude reads the same repository — the same business context, decisions and skills, always current.
- **Everyone contributes, safely.** Everyday additions (a meeting summary, a decision, a customer insight) reach the shared repository by themselves. Changes to the core files that steer the Work OS — its rules, templates and business context — are *proposed* and approved by a Work OS admin. That is how the Work OS improves over time without anyone breaking it.
- **No git skills required.** Claude does the saving, syncing and proposing. People write, review and approve.

### Who does what

|  | Repository admin | Work OS admin | Work OS user |
|---|---|---|---|
| Who | Whoever administers your GitHub organization / Azure DevOps project — often IT or DevOps | One person from your company (permanent) + the SoftServe program lead (temporary). At least two at all times | Everyone on the team |
| Sets up | The repository, the admin group, access, the branch rule | The Work OS itself: their own computer, customization, tools and code connections | Their own computer |
| Day to day | Nothing — unless access or rules change | Approves proposed changes to gated files; keeps the Work OS healthy | Works in the Work OS; everyday changes save by themselves; proposes changes to gated files |
| Needs a Work OS account? | No — a GitHub / Azure DevOps account is enough | Yes, and membership of the admin group | Yes |

On GitHub: the repository admin is an *organization owner*; Work OS admins are members of the team **`os-admins`** (Write access, reviewer for gated files, may bypass the branch rule); Work OS users have *Write* access.

On Azure Repos: the repository admin is in *Project Administrators*; Work OS admins are members of the group **`OS-Admins`** (required reviewer for gated files, may bypass branch policies); Work OS users are in the project's *Contributors* group.

### The setup flow

Three stages, in this order. Each stage is one or more articles in this section — the names below are the article names.

1. **Stage 1 · Repository admin** — **Set up the repository** — import the Work OS from SoftServe, create the admin group, give people access, protect the main branch. Done in the GitHub / Azure DevOps web interface. *(about 30 minutes)* → [Set up the repository](#set-up-the-repository)
2. **Stage 2 · Work OS admin** — **Set up your computer**, then **Customize the Work OS** (which also switches auto-sync on and ends with the first access test). Optional, when you're ready: **Connect your tools** and **Connect your product's code**. *(2–3 hours, resumable)* → [Customize the Work OS](#customize-the-work-os)
3. **Stage 3 · All Work OS users** — **Set up your computer** and check that your work reaches the team. If the team uses connected tools or code, add your own part of those two articles. *(about 15 minutes each)* → [Set up your computer](#set-up-your-computer)

> **Note:** The order matters: Stage 3 can only start after the repository exists (Stage 1) and the Work OS admin has finished customization (Stage 2).

### Two terms you will see everywhere

- **Gated files** — The small set of files that steer the whole Work OS — its rules and settings, the document templates, and the business context (for example `business-info.md`). Changing one needs a Work OS admin's approval. Everything else is an *everyday file*. The full list is in the [Reference](#gated-files).
- **Auto-sync** — The Work OS feature that saves your work to the shared repository every time Claude finishes a response — you never run git commands. Everyday files land straight away; gated changes wait until you say *"propose the gated changes"*, which opens a request a Work OS admin approves in GitHub / Azure Repos. Details: [How changes flow](#how-changes-flow).

## Set up the repository

*Setup · Stage 1 · Repository admin · about 30 minutes, once*

You are the person who administers your GitHub organization / Azure DevOps project. In this article you import the Work OS from SoftServe, create the admin group, give people access, and protect the main branch — all in the GitHub / Azure DevOps web interface. Nothing to install.

### Before you start

- [ ] You can create repositories and change their settings in your GitHub organization (you are an organization owner) *(Azure Repos: Azure DevOps project (you are in Project Administrators))*.
- [ ] The SoftServe team has given you access to the source repository — the initial version of the Work OS — or a token to import it. See step 1.
- [ ] You have the names and e-mail addresses of the **initial Work OS admins**: one person from your company (permanent) and the SoftServe program lead (temporary). Both need an account in your GitHub organization *(Azure Repos: Azure DevOps organization)* — invite the SoftServe person as an outside collaborator or organization member *(Azure Repos: a project user (a Basic access level is enough))*.
- [ ] You have the list of **initial Work OS users** (names and e-mail addresses).

**GitHub**

> **Note:** Private repositories on the GitHub **Free** plan don't support *rulesets*. Step 4 shows the equivalent *branch protection rule* for that case.

### Step 1 — Get the Work OS from [SoftServe Work OS on GitHub](https://github.com/alexey-orlov/SoftServe-Work-OS)

The initial version of the repository comes from the SoftServe team. Ask them for access to the source repository (and, if it is private, for the token to import it). Then import it into your organization / project — no command line needed.

**GitHub**

1. In GitHub, open the **+** menu in the top-right corner and select **Import repository**.
2. **Your source repository details › The URL for your source repository:** paste the URL SoftServe gave you. If it asks for credentials, enter the username and token from SoftServe.
3. **Owner:** your organization. **Repository name:** `work-os` (or your own name). **Privacy:** **Private**.
4. Select **Begin import** and wait for the confirmation e-mail or the page to finish.
5. Open the new repository → **Settings › General › Default branch** — it must be **`main`**. If it isn't, switch it there.

**Azure Repos**

1. In your project, go to **Repos › Files**. Open the repository dropdown at the top of the page and select **Import repository**.
2. **Repository type:** Git. **Clone URL:** paste the URL SoftServe gave you. If the source is private, tick **Requires authentication** and enter the username and token from SoftServe.
3. **Name:** `work-os` (or your own name). Select **Import**.
4. When the import finishes, go to **Repos › Branches** and check that **`main`** is the default branch (⋯ menu → *Set as default branch* if not).

> **Expected:** The repository page shows `CLAUDE.md`, `governance/`, `product-development/`, `os-installation/` and the other folders on `main`.

> **Tip:** If your organization doesn't allow imports, give one SoftServe person temporary access to the empty repository and they will upload the content for you (about ten minutes). Remove the access afterwards.

### Step 2 — Create the Work OS admin group

**GitHub**

1. Go to your organization page → **Teams › New team**.
2. **Team name:** `os-admins`. Visibility: *Visible*. Select **Create team**.
3. On the team page, **Members › Add a member** — add the initial Work OS admins (your company's person and the SoftServe program lead).

**Azure Repos**

1. Go to **Project settings › Permissions** and select **New group**.
2. **Name:** `OS-Admins`. **Members:** add the initial Work OS admins (your company's person and the SoftServe program lead). Select **Create**.

> **Expected:** The group exists and lists at least two people. Keep it at two or more at all times, so an admin's own change can be approved by another admin.

### Step 3 — Give people access to the repository

**GitHub**

1. Open the repository → **Settings › Collaborators and teams**.
2. **Add teams** → `os-admins` → role **Write**.
3. **Add people** (or add the team everyone is already in) → every Work OS user → role **Write**.

> **Note:** Everyone — admins included — gets *Write*. What makes a Work OS admin special is membership of `os-admins`: step 4 makes that team the reviewer for gated files and lets it bypass the branch rule.

> **Expected:** The Collaborators page lists `os-admins` and every Work OS user, all with *Write*. Invited people receive an e-mail and must accept it.

**Azure Repos**

1. Go to **Project settings › Permissions › Contributors › Members** and make sure every Work OS user and admin is listed (add the missing ones with **Add**).
2. Go to **Project settings › Repositories**, select the Work OS repository, open the **Security** tab.
3. Select the **OS-Admins** group in the left list and set:

   | Permission | OS-Admins |
   |---|---|
   | Bypass policies when completing pull requests | **Allow** |
   | Bypass policies when pushing | **Allow** |
   | Force push (rewrite history, delete branches and tags) | **Allow** |
   | Contribute · Create branch · Contribute to pull requests | Allow |

4. Leave the **Contributors** group as it is. Its *Bypass* and *Force push* permissions show **Not set** — that already means "no".

> **Don't:** Set the Contributors permissions to **Deny**. In Azure DevOps a Deny wins over an Allow, and your Work OS admins are Contributors too — a Deny would block them as well.

> **Expected:** Under **Security**, `OS-Admins` shows *Allow* on the bypass permissions; Contributors show *Not set* there and *Allow* on Contribute.

### Step 4 — Protect the main branch

This is the rule that makes admin approval enforceable: everyone works through pull requests, everyday pull requests merge by themselves, and a pull request that touches a gated file needs the admin group.

**GitHub**

1. Open the repository → **Settings › Rules › Rulesets › New ruleset › New branch ruleset**.
2. **Ruleset name:** `main-pr-only`. **Enforcement status:** *Active*.
3. **Bypass list › Add bypass** → the team **`os-admins`** → mode **Always**. (Admins may skip the rule — that is how they merge approved gated changes.)
4. **Target branches › Add target › Include default branch**.
5. Under **Rules**, tick **Require a pull request before merging**. Set **Required approvals** to **0** and tick **Require review from Code Owners**. Leave the other sub-options off. Keep **Block force pushes** ticked.
6. Optional: tick **Require status checks to pass** and add `wiki-lint` — every pull request then passes the Work OS health check first.
7. Select **Create**.
8. Go to **Settings › General**, scroll to **Pull Requests**, tick **Allow auto-merge** and **Automatically delete head branches**. Keep **Allow rebase merging** on. Save.

> **Note:** **Who are the "Code Owners"?** A file in the repository, `.github/CODEOWNERS`, that names `os-admins` as the reviewer for every gated file. The Work OS admin fills in your organization's name there during [Customize the Work OS](#customize-the-work-os) — until then gated pull requests can merge without review, which is fine during setup.

> **Note:** **GitHub Free plan (private repository):** go to **Settings › Branches › Add branch protection rule**, branch name pattern `main`, tick *Require a pull request before merging* (approvals 0) and *Require review from Code Owners*, and under *Allow specified actors to bypass required pull requests* add `os-admins`. Same effect, older screen.

> **Don't:** Create a *push ruleset* for the gated folders. It would also block the branches that pull requests come from, and nobody could propose a change.

> **Expected:** **Settings › Rules** shows `main-pr-only` as *Active*. A pull request that changes a gated file will show *Review required — Code owner review*; one that doesn't will merge by itself. Members of `os-admins` can still push to `main` directly.

**Azure Repos**

1. Go to **Repos › Branches**, hover over `main`, open the **⋯** menu, select **Branch policies**.
2. Leave **Require a minimum number of reviewers** *off*. (Turning it on would make every everyday pull request wait for a person.)
3. Under **Automatically included reviewers**, select **+**. **Reviewers:** `OS-Admins`. **Policy requirement:** *Required*.
4. **For pull requests affecting these folders** (the path filter): paste this line exactly:

   *Path filter:*

   ```text
   /product-development/feature-index.yaml;/product-development/product/strategy/business-context/*;/product-development/product/handbook/templates/*;/product-development/engineering/*;/CLAUDE.md;/governance/*;/os-installation/*;/.claude/*;/.github/*
   ```

   > **Tip:** This is the list of gated files in the form Azure expects. If the Work OS admin later changes the list, they will send you the new line to paste here.

5. Tick **Allow requestors to approve their own changes** — so a Work OS admin can approve a change they proposed themselves.
6. **Activity feed message:** `Gated Work OS file — needs OS-Admins approval`. Select **Save**.
7. Optional: under **Limit merge types**, allow *Squash merge* and *Rebase and fast-forward*.

> **Note:** Any *required* policy on `main` makes it pull-request-only for everyone outside `OS-Admins`. That's intended — everyday pull requests still complete by themselves because they don't touch the folders in the path filter.

> **Expected:** **Branch policies** for `main` shows one required reviewer policy for `OS-Admins` with the path filter. A pull request that changes a gated file will list `OS-Admins` as required; one that doesn't will complete by itself.

### Step 5 — Hand over to the Work OS admin

1. Send the Work OS admins the repository link and confirm they are in the admin group.
2. Tell them the initial users have access, so they can invite the team as soon as customization is done.

> **You're done when:** A Work OS admin can open the repository page. A Work OS user can open it too. The rule on `main` is active. Stage 1 is complete — the Work OS admin continues with Stage 2: [Set up your computer](#set-up-your-computer), then [Customize the Work OS](#customize-the-work-os).

## Set up your computer

*Setup · Stage 2 (Work OS admin) and Stage 3 (everyone) · about 15 minutes, once*

Get your own copy of the Work OS on your computer, connect it to the shared repository, and check that your work reaches the team. You will do everything in the **Claude Code desktop app** — Claude runs the technical steps for you.

### Before you start

- [ ] The **repository admin** has given you access — you can open the repository page in your browser with the link they sent. If you received an invitation e-mail from GitHub, accept it first. *(Azure Repos: If the page asks you to sign in, use your Azure DevOps account.)*
- [ ] The **Work OS admin** has told you the Work OS is ready (Stage 2 done: customized, auto-sync on). *Skip this line if you are the Work OS admin doing Stage 2 yourself — you'll do that next.*
- [ ] You have the **Claude Code desktop app** installed and are signed in (see `os-installation/installation-guide.md`).

### Step 1 — Open a folder for the Work OS

1. Create an empty folder on your computer, for example `Documents/work-os`.
2. In the Claude Code desktop app, start a new session and choose that folder as the project folder.

### Step 2 — Ask Claude to bring in the Work OS

1. Copy the repository link from the repository page → **Code › HTTPS** *(Azure Repos: **Repos › Files › Clone**)* and ask Claude:

   > 💬 **Say to Claude:** `Clone <paste the repository link> into this folder, so that the repository's files are directly in it (git clone <link> .)`

   > **Expected:** Claude confirms the clone and you see `CLAUDE.md`, `governance/`, `product-development/` … in the folder.

2. Start a **new session** in the same folder — Claude now loads the Work OS.

   > **Expected:** Claude opens with a short briefing: recent decisions, the current quarter, active initiatives. That's the Work OS talking.

### Step 3 — Tell Claude who you are

1. Auto-sync signs your changes with your name and e-mail. Ask Claude:

   > 💬 **Say to Claude:** `Set my git name to <Your Name> and my git e-mail to <you@company.com> for this repository`

   > **Expected:** Claude confirms both values.

### Step 4 — Sign in to GitHub / Azure DevOps once

Auto-sync opens and merges pull requests on your behalf. For that it uses the GitHub / Azure command-line tool, signed in as you. Claude handles it; you only confirm in the browser.

**GitHub**

1. Ask Claude:

   > 💬 **Say to Claude:** `Sign me in to GitHub with the GitHub CLI (gh) using the browser flow. If gh is not installed, install it first.`

   > **Expected:** Claude shows a one-time code and a github.com link. Open the link, enter the code, and authorize. Claude then confirms you are signed in.

**Azure Repos**

1. Ask Claude:

   > 💬 **Say to Claude:** `Sign me in to Azure DevOps with the Azure CLI (az login with a device code) and add the azure-devops extension. If az is not installed, install it first.`

   > **Expected:** Claude shows a code and a microsoft.com link. Open the link, enter the code, sign in with your work account. Claude then confirms you are signed in.

> **Tip:** Installing a tool may ask for your computer password. That is normal — it happens once.

### Step 5 — Check that auto-sync is on

1. Ask Claude:

   > 💬 **Say to Claude:** `/auto-sync status`

   > **Expected:** **ON**, mode **pr**. If it says off and you are a Work OS user, ask the Work OS admin — the switch is shared and only admins turn it on. If you *are* the Work OS admin doing Stage 2, it will be off: skip step 6 for now and continue with [Customize the Work OS](#customize-the-work-os) — auto-sync is switched on there.

### Step 6 — Check that your work reaches the team

Two quick tests: an everyday change that lands by itself, and a gated change that waits for an admin.

1. Ask Claude to create an everyday file, then wait until Claude finishes the response — that's when auto-sync runs:

   > 💬 **Say to Claude:** `Create a short test meeting summary at product-development/product/meetings/other/summaries/<today's date>-access-test-<your name>.md and mark it clearly as TEST`

   > **Check in GitHub / Azure Repos:** Within about a minute the file is on `main` (repository page → the folder). Under **Pull requests › Closed / Completed** there is a pull request *"context: sync from sync/<your name>"* that merged by itself.

2. Ask Claude to change a gated file. A **🔒 GATED FILE** prompt appears — read it and approve. Wait until Claude finishes.

   > 💬 **Say to Claude:** `In business-info.md, correct or fill in one line`

   > **Expected:** Claude reports the change is saved on your branch, not on `main`, and that there is no pull request yet.

3. Send it for approval:

   > 💬 **Say to Claude:** `propose the gated changes`

   > **Check in GitHub / Azure Repos:** Claude reports the pull request link. Open it: it is titled *"gated: …"*, shows **Review required — Code owner review** *(Azure Repos: **OS-Admins** as a *Required* reviewer)*, and the Merge / Complete button is disabled for you.

4. Ask a Work OS admin to approve and merge it.

   > **Check in GitHub / Azure Repos:** Your change is on `main`. The next time Claude finishes a response, it notes that everything on your branch has landed and the branch is clean.

> **You're done when:** The everyday file landed by itself; the gated change could not be merged by you; it landed after an admin approved it. You're set — work as usual from here. If your team has connected tools or code, finish with your part of [Connect your tools](#connect-your-tools) and [Connect your product's code](#connect-your-products-code).

> **Tip:** **Clean-up:** ask Claude to delete the TEST summary — an everyday change, it lands by itself. Keep the `business-info.md` edit if it was a real correction.

## Customize the Work OS

*Setup · Stage 2 · Work OS admin · 1–2 hours, once — resumable*

You own the Work OS for your team. In this article you run the guided customization — which adapts the Work OS to your company and switches auto-sync on, name the approver team *(GitHub only)*, send the changes for approval, and do the first access test. After that you invite the users.

> **Note:** **Work in progress.** The detailed walkthrough of the `/customize-os` conversation (naming, business context, templates) is being written. The steps below are complete for the access and auto-sync part.

### Before you start

- [ ] You have finished [Set up your computer](#set-up-your-computer) steps 1–5 (folder, clone, name, sign-in; auto-sync will show *off* — expected).
- [ ] The repository admin has confirmed you are in the `os-admins` team / `OS-Admins` group.
- [ ] You have your company's basics at hand: product, customers, how you name your documents (PRD / brief / one-pager …), two to four example documents in your house format.

### Step 1 — Run the guided customization

`/customize-os` is a conversation. It reads what is already customized, asks only for what is missing, writes the customized context files behind the 🔒 prompt, and ends with a readout of what changed and what is still needed. You can stop any time and continue later with `/customize-os continue`.

1. Ask Claude:

   > 💬 **Say to Claude:** `/customize-os`

2. Answer the questions: how your company names its documents (keep the Work OS names or map them to yours), your business context, your document formats (from example documents). Approve each 🔒 prompt after reading the change.
3. Near the end Claude asks which **auto-sync mode** the team wants. Answer **pr** (the mode for a protected `main` — changes move through pull requests) and say **yes** to switch it on now.

   > **Expected:** Claude confirms **"Auto-sync is ON — pr mode (main is pull-request-only)"** and lists the gated files. From the next response on, your work is saved to your branch automatically; the customization changes are waiting there for approval.

4. Read the closing readout: what changed and where, and what is still open (Critical / Other). `os-installation/customization-status.md` keeps the state for the next session.

### Step 2 — Name the approvers

**GitHub**

> **Why this matters:** GitHub reads who must approve gated changes from the file `.github/CODEOWNERS`. The Work OS generates that file from one line in `governance/write-policy.yaml`. Until you fill in that line, GitHub ignores the file and gated pull requests could merge without approval.

1. Ask Claude — replace `<your-org>` with your GitHub organization name — and approve the 🔒 prompt:

   > 💬 **Say to Claude:** `Set reviewers.github-team in governance/write-policy.yaml to @<your-org>/os-admins and regenerate .github/CODEOWNERS`

   > **Expected:** Claude confirms both files changed. When it finishes the response, auto-sync saves them on your branch, next to the customization changes.

*Azure Repos:* Nothing to do on Azure Repos — the repository admin already chose `OS-Admins` as the required reviewer in the branch policy. Continue with step 3.

### Step 3 — Send the changes for approval and merge them

1. Ask Claude:

   > 💬 **Say to Claude:** `propose the gated changes`

   > **Expected:** Claude opens one pull request *"gated: …"* with everything from steps 1 and 2 *(GitHub only)* and reports the link.

2. Open the link in GitHub / Azure Repos. You are a Work OS admin, so you may approve and merge your own setup change: select **Merge** (GitHub may label it *Merge without waiting for requirements to be met* — that's your bypass right) *(Azure Repos: select **Approve**, then **Complete**)*.

   > **Check in GitHub / Azure Repos:** The pull request is merged. On `main`, `governance/write-policy.yaml` shows `auto-commit: enabled: true` and `.github/CODEOWNERS` shows `@<your-org>/os-admins` next to every gated path *(GitHub only)*. From now on auto-sync is on for everyone who pulls.

### Step 4 — Do the first access test

Same two tests every user will do in Stage 3 — you go first, so you know the loop works before inviting the team.

1. Everyday change:

   > 💬 **Say to Claude:** `Create a short test meeting summary at product-development/product/meetings/other/summaries/<today's date>-access-test.md and mark it clearly as TEST`

   > **Check in GitHub / Azure Repos:** Within about a minute the file is on `main`; a pull request *"context: sync from sync/<your name>"* merged by itself.

2. Gated change — approve the 🔒 prompt, wait for Claude to finish, then propose:

   > 💬 **Say to Claude:** `In business-info.md, fill in the company name line`

   > 💬 **Say to Claude:** `propose the gated changes`

   > **Check in GitHub / Azure Repos:** The pull request *"gated: …"* shows *Review required — Code owner review* from `os-admins` *(Azure Repos: `OS-Admins` as a required reviewer)*. Approve and merge it; the change appears on `main`.

> **You're done when:** Both tests landed on `main`, and the gated one needed an admin. Stage 2 is complete — tell the users they can start Stage 3: [Set up your computer](#set-up-your-computer). When you're ready, continue with the optional [Connect your tools](#connect-your-tools) and [Connect your product's code](#connect-your-products-code).

## Connect your tools

*Setup · Stage 2 · Work OS admin, then each user for their own account · 5–20 minutes per tool — optional*

Out of the box, the Work OS works with whatever you paste or drop into it — transcripts, exports, notes. Connecting a tool lets Claude read it live and write back to it, so the same skills run without the copy-and-paste. Optional; connect tools one at a time, whenever you're ready.

### Which tools are worth connecting

| System | What Claude can do with it | Skills that use it | Without it |
|---|---|---|---|
| **Meeting recordings** — Fireflies, Otter, Zoom, Teams, Granola | Pull transcripts by itself and turn them into summaries, decisions and action items | `/process-meeting`, `/portfolio-pulse` | You paste the transcript, or drop the file into `product-development/inbox/` |
| **Task tracker** — Linear, Jira, Asana, monday, ClickUp | Create tickets from an agreed spec; read status for updates and plans | `/create-tickets`, `/status-update`, `/weekly-review`, `/daily-plan` | Claude gives you ready-to-paste tickets; you tell it the status |
| **Team chat** — Slack, Microsoft Teams | Post digests and drafts; read a thread you point at | `/slack-message`, `/weekly-review`, `/portfolio-pulse`, `/status-update` | Claude drafts the message; you paste it |
| **Product analytics** — Amplitude, Mixpanel, PostHog, Pendo | Query retention, activation and funnels live | `/retention-analysis`, `/activation-analysis`, `/feature-metrics`, `/experiment-metrics` | You export the numbers or paste a chart's data |
| **Documents** — Notion, Confluence, Google Drive | Read source documents when folding context into the Work OS | `/context-update`, `/user-research-synthesis`, `/prd-draft` | You paste or attach the document |
| **Design** — Figma | Read designs and link prototypes | `/prototype`, `/prototype-feedback`, `/create-tickets` | You describe or link the design |
| **Customer feedback** — Intercom | Pull customer requests and conversations | `/prioritize-requests` | You paste the pile of requests |
| **Calendar** — Google Calendar, Outlook | Plan the day around meetings | `/daily-plan`, `/meeting-agenda` | You tell Claude your day |

> **Tip:** A good first set: **meeting recordings**, your **task tracker**, and **team chat**. They remove the most copy-and-paste.

### How connecting works

Each connection is a small standard connector (an *MCP server*) that lets Claude use the tool with your own login. Two parts: the **Work OS admin** connects a tool once and lets Claude record which skills use it — that record is shared with the team. Then **each person** connects the same tool on their own computer with their own account, so Claude acts as them, not as the admin.

> **Note:** Your passwords and tokens never go into the Work OS repository or into chat. Claude keeps them in Claude Code's own settings on your computer.

### Step 1 — Connect a tool for the team (Work OS admin)

1. Ask Claude — one tool at a time:

   > 💬 **Say to Claude:** `/connect-mcps connect to Linear`

2. Follow the conversation. Claude finds the official connector for the tool, sets it up, and asks you to sign in to the tool in your browser when needed. If Claude shows a command to run, ask it to run it for you.
3. Claude tests the connection and records which Work OS skills will use the tool. Approve the 🔒 prompt (the record lives in gated files).

   > **Expected:** Claude reports the connection works and lists the skills it wired — for example "`/create-tickets` will now create tickets in Linear". A log is saved in `os-installation/mcp-integration-logs/`.

4. Send the record for approval and merge it, like any gated change:

   > 💬 **Say to Claude:** `propose the gated changes`

### Step 2 — Connect the same tool for yourself (each user)

1. Ask Claude:

   > 💬 **Say to Claude:** `/connect-mcps connect to Linear`

   > **Expected:** Claude sees the tool is already registered for the team, sets up the connection on your computer, and asks you to sign in with your own account. Done in a minute or two.

> **You're done when:** Ask Claude something the tool answers — *"what did we decide in yesterday's product sync?"* (meeting recordings), *"what's open in this sprint?"* (task tracker) — and get a live answer instead of a request to paste something.

## Connect your product's code

*Setup · Stage 2 · Work OS admin, then each user on their own computer · 15 minutes per repository — optional*

With read access to your product's source code, Claude answers product questions from the code itself — how a feature actually works today, what limits apply, whether a change is live — in plain language, with the evidence available on request. Optional. Read-only: Claude never changes the product code from the Work OS.

### What it gives you

| You ask | Skill | Without the connection |
|---|---|---|
| "How does the export limit actually work today?" · "Is the new pricing live?" · "Do we support SSO?" | `/code-qa` — answers from the code, concise, no jargon | Claude says it has no grounded code access and gives you the exact question to ask an engineer |
| "Draft a first implementation of this job spec" | `/code-first-draft` — a first-pass implementation with tests, for engineers to take over | Claude writes a standalone reference implementation instead |
| "Is this spec feasible?" (inside PRD and job-spec work) | `/job-spec-draft`, `/job-spec-challenge` — a feasibility check grounded in the code | The check is marked as a to-do for engineering |

### How it works

Two parts, like tools. The Work OS keeps a small **registry** of your code repositories — what each one is for and which product areas it covers, in your own words. That is shared. Each person's **computer** holds a read-only copy of the code that Claude may read but never edit — that stays private and is never uploaded to the Work OS.

### Before you start

- [ ] You know which repositories matter to product questions and have their links (skip infrastructure and tooling repositories).
- [ ] The people who will use it have read access to those repositories — their normal developer access. The GitHub / Azure DevOps sign-in from [Set up your computer](#set-up-your-computer) usually covers it.

### Step 1 — Register a repository for the team (Work OS admin)

1. Ask Claude — one repository at a time:

   > 💬 **Say to Claude:** `/connect-code <paste the repository link>`

2. Answer in your own words: what the repository is for, and which product areas it covers (the words your team uses — that is how Claude routes a question to the right code). For a very large repository Claude asks which folders matter.
3. Approve the 🔒 prompt — the registry is a gated file. Claude then copies the code to your computer (read-only) and grants itself read access there. For a large repository it offers to build a map of the code — say yes.

   > **Expected:** `product-development/engineering/code-repos.yaml` lists the repository with its purpose and areas. Nothing about your computer or your credentials is written into it.

4. Send the registry entry for approval and merge it, like any gated change:

   > 💬 **Say to Claude:** `propose the gated changes`

### Step 2 — Get access on your own computer (each user)

1. Ask Claude:

   > 💬 **Say to Claude:** `/connect-code`

   > **Expected:** Claude finds the repositories the admin registered, copies them to your computer, and grants itself read-only access. It never changes the shared repository in this run.

### Keeping it fresh

Ask Claude *"refresh the code access"* (`/connect-code --refresh`) now and then — it pulls the latest code and updates the maps. The weekly health check reminds you when the registry goes stale.

> **You're done when:** Ask *"/code-qa how does <a feature you know> work today?"* and get an answer that cites the code — with *"show the evidence"* revealing file and line references.

## Troubleshooting

*FAQ · Everyone*

What you might see, what it means, and what to do. Everything here is reported by Claude at the end of a response — you can always ask *"what did auto-sync report?"*

#### Claude notes "NO pull request opened … gh is not logged in *(Azure Repos: az lacks the azure-devops extension)*"

Your GitHub / Azure sign-in on this computer is missing or expired. Redo [Set up your computer, step 4](#step-4--sign-in-to-github--azure-devops-once). The note names the branch that was pushed — a Work OS admin can merge it once by hand from the repository page.

**GitHub**

#### An everyday pull request stays "left OPEN — could not merge yet"

Either *Allow auto-merge* is off in the repository settings ([Set up the repository, step 4](#step-4--protect-the-main-branch)) or a required check is still running. Auto-sync retries after every response.

#### A gated pull request merged without admin approval

*GitHub:* One of: `.github/CODEOWNERS` still has the placeholder `@[org]/os-admins` ([Customize the Work OS, step 2](#step-2--name-the-approvers)); the `os-admins` team lacks Write access; *Require review from Code Owners* is not ticked in the ruleset.

*Azure Repos:* Either the reviewer policy is *Optional* instead of *Required*, or its path filter is outdated. The Work OS admin can ask Claude for the current line (*"print the Azure path filter for the gated files"*) and the repository admin pastes it into the policy.

#### "/auto-sync status" says OFF for a teammate

The switch hasn't reached `main` yet, or the teammate's copy is behind. The Work OS admin checks that the setup pull request was merged ([Customize the Work OS, step 3](#step-3--send-the-changes-for-approval-and-merge-them)); the teammate asks Claude *"pull the latest changes"* and checks again.

#### "REBASE CONFLICT: sync/<you> does not rebase onto origin/main"

Someone changed the same file. Ask Claude: *"resolve the rebase conflict on my branch, keeping both changes where possible"* — it walks you through it. Auto-sync resumes at the next response.

#### Claude says the push to main was rejected

Expected for Work OS users — `main` is protected; auto-sync uses pull requests instead. If a Work OS admin sees it, check they are in the `os-admins` team / `OS-Admins` group.

#### How do we change which files are gated?

The Work OS admin edits the list in `governance/write-policy.yaml` (it is gated itself, so the change goes through *"propose the gated changes"*). `.github/CODEOWNERS` regenerates by itself. *(Azure Repos: The repository admin pastes the new path filter into the branch policy — the pull request description contains the line.)*

#### Can I use the Work OS without auto-sync?

Yes, on your own — but your work stays on your computer until someone commits it by hand, and the team won't see it. Auto-sync is what makes it teamwork.

#### Can two people work at the same time?

Yes. Each person has their own branch; changes to different files never conflict. Changes to the same file are combined automatically when possible — see the rebase-conflict entry above for the rare case they aren't.

## How changes flow

*FAQ · Everyone · 3 min read*

What happens between "Claude finished a response" and "the team can see it" — in plain words, and what you will see in GitHub / Azure Repos.

### Everyday changes

1. You ask Claude for something — a meeting summary, a decision record, a customer note. Claude writes the file.
2. When Claude finishes the response, auto-sync saves the change to your personal branch in the shared repository (a branch is a private working line; yours is named `sync/<your git name>`).
3. Auto-sync opens a small pull request from that branch into `main` — the team's shared line — and it merges by itself. Nobody has to look at it.

> **Check in GitHub / Azure Repos:** On the repository page you'll see the file on `main` within about a minute, and under **Pull requests › Closed / Completed** a pull request called *"context: sync from sync/<name>"*.

### Changes to gated files

1. You ask Claude to change a gated file. Before writing, Claude shows a **🔒 GATED FILE** prompt — you read the change and approve it.
2. When Claude finishes, auto-sync saves the change to your personal branch — but not to `main`. It waits there while you keep iterating.
3. When you're done, you say **"propose the gated changes"**. Claude opens a pull request with a plain-language description of everything that changed.
4. A Work OS admin reviews it in GitHub / Azure Repos, approves, and merges. GitHub / Azure Repos won't let anyone else merge it.
5. Next time Claude finishes a response, your branch tidies itself — the approved change is now part of `main` for everyone.

> **Check in GitHub / Azure Repos:** The pull request is titled *"gated: …"* and shows **Review required — Code owner review** from `os-admins` *(Azure Repos: **OS-Admins** as a required reviewer)*.

### Two people, one file

If two people change the same file, auto-sync tries to combine the changes; when it can't, it tells the person whose save is waiting exactly what to do (see [Troubleshooting](#troubleshooting)). Nothing is lost — the change stays on their branch.

## Reference

*FAQ · Everyone*

### Gated files

The list lives in `governance/write-policy.yaml` (`tiers → gated`) — this is a copy for orientation. Everything else is an everyday file.

- `CLAUDE.md` · `governance/` · `os-installation/` · `.claude/` · `.github/`
- `product-development/feature-index.yaml`
- `product-development/product/strategy/business-context/` (business-info, stakeholders, segmentation)
- `product-development/product/handbook/templates/`
- `product-development/engineering/`

### Things you say to Claude

| Say | What happens |
|---|---|
| `/auto-sync status` | Shows whether auto-sync is on, in which mode, and what is waiting on your branch |
| `/auto-sync on pr` | Turns auto-sync on for a protected `main` — normally done inside `/customize-os` (Work OS admin, once) |
| `/connect-mcps connect to <tool>` | Connects a tool (Linear, Slack, Amplitude, …) so Claude can read it live — see [Connect your tools](#connect-your-tools) |
| `/connect-code <repository link>` | Registers a product code repository and gives Claude read access on this computer — see [Connect your product's code](#connect-your-products-code) |
| `propose the gated changes` (or `/propose`) | Opens the pull request that carries your gated changes to the Work OS admins |
| `/customize-os` · `/customize-os continue` | Runs or resumes the guided customization (Work OS admin) |
| `what did auto-sync report?` | Repeats the last auto-sync note |

### Behind the scenes

**For the curious — the mechanics.** Each person works on a personal branch `sync/<git name>`. When Claude finishes a response, a script commits the changed files there — everyday files in one commit, gated files in another. Everyday commits are copied onto `main` through a small pull request that auto-merges (rebase); gated commits stay on the branch until *"propose the gated changes"* opens their pull request. The gated list is read from `governance/write-policy.yaml` at every run; `.github/CODEOWNERS` *(Azure Repos: the branch policy's path filter)* is generated from the same list. Full technical guides in the repository: `os-installation/admin-setup-github.md`, `os-installation/admin-setup-azure-devops.md`, `os-installation/claude-code/scheduled-governance.md`, `governance/CLAUDE.md`.

### Where this documentation lives

- In the repository: `os-installation/team-setup-guide.md` (all articles, both platforms).
- The source of the Work OS: [SoftServe Work OS on GitHub](https://github.com/alexey-orlov/SoftServe-Work-OS) — maintained by SoftServe.
