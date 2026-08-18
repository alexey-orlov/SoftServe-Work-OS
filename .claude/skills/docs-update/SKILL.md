---
name: docs-update
description: Change or refresh the customer-facing documentation in Documentation/ — the site (work-os-docs.html) and its single source (src/content.js). Two modes. EDIT (default) — the user asks for a specific change ("add a step to Set up your computer", "reword the roles table", "the Azure policy step is wrong", "add an article on X"): edit content.js in the docs' own vocabulary and conventions, rebuild, verify, report article › section. SYNC ("bring the docs up to date", "/docs-update sync", "check the docs against the repo") — compare every fact the docs state against its source of truth in the repository (write policy and gated list, skills index and descriptions, agents, folder tree, hooks and skill behaviour, admin guides, tool and code connection skills) and correct what became obsolete or wrong; rows, steps and sentences inside existing articles may change, but no new article or section is added unprompted — gaps are listed as suggestions. Always rebuilds and reports. Use on /docs-update and whenever the user works on anything under Documentation/, mentions the docs site or "the setup guide", or says the documentation is stale. NOT for the terse admin guides in os-installation/ (edit those directly), the wiki's own health (/wiki-lint), the repo README, or publishing outside the repo (offer, don't assume).
argument-hint: "[sync | <what to change>]"
group: os-admin
---

# docs-update — keep the customer-facing documentation right

`Documentation/` is what a team is *told* about the Work OS: a self-contained site
(`work-os-docs.html`) and the single source it is built
from — `Documentation/src/content.js`. This skill is the one way changes go in: edit the
source, rebuild, verify, report. The folder is gated (`governance/write-policy.yaml`), so
every write shows the 🔒 prompt and lands through the normal review flow — the skill never
commits, merges or publishes anywhere by itself.

**Never edit the built file.** `work-os-docs.html` is an output of
`node build.js`; a hand edit is lost at the next build. If someone did edit them, say so and
re-express the change in `content.js`.

## Two modes — decide first, say which

| | **Edit** (default) | **Sync** (`sync`, "bring up to date", "check the docs") |
|---|---|---|
| Trigger | A specific change is asked for — wording, a step, a table row, a whole new article | The repo moved; the docs may lag |
| Scope | Exactly what was asked, expressed in the docs' conventions (below); a new article or section only when the user asks for one | Every existing statement that has a source of truth (map below); fix what is obsolete or wrong; add/remove rows, steps and sentences as needed to keep an existing table or list true |
| Never | Silently widen the ask | Add an article or a section — list the gap as a **suggestion** instead |
| Ends with | Rebuild + verify + report | Rebuild + verify + report: *updated* / *left as is, needs a human* / *suggested additions* |

Both modes end with a version bump in `content.js` (`version: "vX.Y · Month YYYY"` — minor
for content changes, patch-level wording changes may share a version within a day).

## Where the truth lives (sync map)

Read the source, then the doc statement; change the doc, never the source, from here.

| Doc statement (article › part) | Source of truth in the repository |
|---|---|
| Gated files list (the Reference / commands article, the Context system tables, the folder tree in Work OS 101 — wherever they currently sit; sections move, article ids stay) | `governance/write-policy.yaml` → `tiers → gated` (+ the entries' comments) |
| Azure path-filter line (Set up the repository, the branch-policy step) — the `ADO_FILTER` const | `.github/scripts/gated-paths.sh --format ado` — paste the printed line verbatim |
| Roles, team/group names, ruleset and policy settings (Set up the repository; the Setup overview) | `os-installation/admin-setup-github.md`, `os-installation/admin-setup-azure-devops.md` (team `os-admins` / group `OS-Admins`, Write for everyone, bypass by team/group, self-approval on, Contributors left *Not set*) |
| Auto-sync, propose, gated/everyday behaviour, turn-end note wording quoted in Troubleshooting (e.g. *"NO pull request opened"*, *"REBASE CONFLICT"*, *"left OPEN"*), branch naming `sync/<name>`, PR titles *"context: sync from …"* / *"gated: …"* | `.claude/hooks/auto-commit.sh` (header + `add "…"` strings), `.claude/skills/auto-sync/SKILL.md`, `.claude/skills/propose/SKILL.md`, `governance/write-policy.yaml` header |
| Customize the Work OS (what `/customize-os` asks, the auto-sync question, the status file) | `.claude/skills/customize-os/SKILL.md` |
| Connect your tools (which system types, which skills use them, log location, per-user step) | `.claude/skills/connect-mcps/SKILL.md`; `grep -il` for tool names across `.claude/skills/*/SKILL.md` |
| Connect your product's code (registry, local access, refresh, what `/code-qa` does without access) | `.claude/skills/connect-code/SKILL.md`, `.claude/skills/code-qa/SKILL.md`, `product-development/engineering/code-repos.yaml` header, `code-grounding.md` |
| Skills tables (Skills and agents) — groups, order, membership, one-liners | `.claude/skills/CLAUDE.md` (groups + order + count) and each `SKILL.md` frontmatter `description` (first sentence) and `argument-hint`; a skill added / removed / renamed / regrouped in the repo → the table follows |
| Agents table | `.claude/agents/CLAUDE.md`, `.claude/agents/reviewers/CLAUDE.md`, the skills that name them |
| Context system tables and the folder tree | The tree itself (`ls`), each folder's `CLAUDE.md`, the root `CLAUDE.md` doc index; registries `feature-index.yaml`, `data-catalog.yaml`, `code-repos.yaml`, `portfolio.yaml` |
| The "Things you say to Claude" table, wherever it lives | The skills exist and their `argument-hint` still matches |
| Work OS 101 concepts (six capabilities, three terms, four levels) | The AI PM Jumpstart deck — stable; change only when the user says the framing changed |
| Internal links `#/section/article/heading` | `build.js` prints `⚠ unresolved link` — every one must be fixed |

## Conventions the docs follow (apply them in every edit)

- **Vocabulary:** three roles — *repository admin*, *Work OS admin*, *Work OS user*; *gated files* vs *everyday files*; *auto-sync*; the setup flow is **Stage 1 / 2 / 3** and cross-references use article names verbatim ("continue with Stage 2: Set up your computer"). Say to Claude, not run in a terminal.
- **Audience rules:** the repository admin works only in the {gh:GitHub|az:Azure DevOps} web interface (no CLI); Work OS admins and users work in the Claude Code desktop app and every technical step is a `say("…")` prompt Claude executes for them — never a terminal command for a user. Admins publish their own gated changes with the one-line *"Publish the gated changes for everyone — I'm a Work OS admin: open the pull request, approve it and merge/complete it"*; users *"propose the gated changes"*.
- **Platform switch:** nothing may show both platforms at once. Use `{gh:…|az:…}` inline or `platform("github", …)` / `platform("azure", …)` blocks; the `check` callout label is already switched.
- **Blocks:** `lead`, `h2`/`h3` (every heading has an id — links depend on it), `p`, `steps([...])` with `step(text, ...sub)`, `say(text)` for prompts, `code(lines, label)`, `callout(kind, text)` with kinds `expected | check | note | why | dont | pass | tip`, `table(header, rows, widths)`, `terms`, `bullets`, `checklist`, `details`, `seq` (the stage sequence), `image(file, alt, caption)` (JPEG in `src/`). Inline: `**bold**`, `*italic*`, `` `code` ``, `[text](#/section/article/heading)`.
- **Tone and shape:** Stripe-style — outcome first, one action per step, UI paths as **Settings › Rules**, an *Expected* or *Check in …* callout after any step with a visible result, "You're done when" at the end of a walkthrough, plain words over jargon (no "hook", "turn end", "steward", "tier"). Headings sentence case; steps "Step N — verb …". Keep the existing spelling.
- **Illustrations:** slide screenshots are cropped to remove customer names; the SoftServe wordmark comes from `logo-inner.svg.txt` — never a text substitute.

## Procedure

1. **Read the ask, name the mode.** Sync = the map above, top to bottom; Edit = locate the article and blocks in `content.js` (`grep -n '{ id: "'` lists sections and articles — the tree changes over time, so trust the file, not this page; heading ids are the second argument of `h2`/`h3`). Before editing, `git status Documentation/` — if someone else's uncommitted edits are there, work on top of them and say so.
2. **Make the change in `content.js` only.** Keep block structure; add ids to new headings; keep tables' `widths` summing sensibly; platform-scope anything platform-specific.
3. **Rebuild:** `cd Documentation/src && node build.js`. The build prints the output, `⚠ unresolved link …` for internal links that don't resolve and `⚠ both platforms …` where a sentence names GitHub and Azure together outside a token — fix both before reporting.
4. **Verify what can be verified:** `node -e "require('./content.js')"` parses; the article count printed by the build is what you expect; if headless Chrome is available (`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --enable-logging=stderr --v=0 --dump-dom file://…/work-os-docs.html`), no console errors. Open nothing in the user's browser unasked.
5. **Report** in the user's language, not the file's: mode; per article — what changed and why (Sync: quote the source that proves it); *left as is — needs a human* items; *suggested additions* (Sync only, never applied); the version now in the footer; the reminder that `Documentation/` is gated, so the change lands through the usual flow (auto-sync + *propose* / *publish*, or a commit when the user asks). If a published copy exists outside the repo, offer to refresh it — don't do it unasked.

## Self-check (before finishing)

- Every change is in `content.js`; the three built files are fresh (build ran after the last edit) and no hand edit was made to them.
- No text shows both platforms; every new heading has an id; every internal link resolves; the version was bumped.
- Sync mode added no article or section; everything applied has a named source; everything not applied is listed with a reason.
- Nothing was committed, merged or published by this skill; the report says how the change lands.
