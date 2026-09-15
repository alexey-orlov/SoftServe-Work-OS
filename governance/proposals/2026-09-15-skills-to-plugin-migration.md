# Skills-to-plugin migration — handoff for Vlad

_proposal · 2026-09-15 · proposer: Alex's Claude Code session · scope: gated paths (`.claude/**`, `governance/**`, `os-installation/**`, `Documentation/**`, `.github/**`, `os-console/`) · status: awaiting Alex's go on the W0 decisions_

**What.** Move the Work OS skills out of `.claude/skills/` into a Claude Code **plugin** named `work-os`, published through a plugin **marketplace** (Payworks' internal one first; the master repo doubles as SoftServe's own marketplace). The repo keeps everything that steers a session: `CLAUDE.md`, the write policy and contract, hooks, templates, team learnings, and any instance-specific skill.

**Why.** Payworks asked for it (their governed marketplace, ~2 BA plugins so far), and it closes a real gap: today a skill fix reaches a customer instance only by "pull the template update, however your instance tracks the master" (`os-installation/link-migration-runbook.md`, step 2). A plugin gives one versioned release for every instance. Cost: commands gain a prefix (`/work-os:prd-draft`), installed copies are read-only snapshots on each laptop, and the self-improvement loop, which today writes corrections into skills, needs a repo-side home.

**Companion page** (executive comparison + the 40-check test plan): https://claude.ai/artifact/JkoiJJDgpwhmWxTjcgEYut

---

## 1. How to run this: the prompt style decision

**Decision: a higher-autonomy prompt with hard invariants and a precision appendix, not a line-by-line instruction list.** Reasons:

| Consideration | Consequence |
|---|---|
| The repo it runs on is customized (the Payworks instance runs 21 skills incl. `/microjob-brief-draft`; the master has 59; both drift weekly). | Line numbers and counts in this report are from the master at `7cb6c84` and will be stale on arrival. The agent must re-scan, not follow transcribed lines. |
| The work is a move-and-rename refactor whose targets are discoverable by grep (bare `/name` mentions, `.claude/skills` paths). | An agent's own scan is cheaper and more reliable than a human-maintained list. |
| Judgement calls exist: which mentions are instructions (rewrite) vs. history (leave); which skills are local; what a customized skill's delta is. | These need inspection of the actual repo, so they are stated as rules, not as answers. |
| Acceptance is mechanically checkable (validation passes, zero bare mentions in agent-read files, a scripted dry run of the heaviest skills). | The prompt ends with gates the agent must prove, and a report format Vlad and Alex can review. |

What stays prescriptive inside the prompt: the names (`work-os`, the prefix, folder layout), what moves and what never moves, the rewrite regex and its guard, the manifest / marketplace / settings snippets, the "never" list, and the report format.

Operational note for Vlad: the write-guard hook prompts on every `Edit`/`Write` to a gated path. A migration touches a few hundred gated files, so the prompt tells the agent to do bulk rewrites through shell scripts (the hook only intercepts the Edit/Write tools) on a dedicated branch with `/auto-sync off`. The pull request is the review gate for this change; that is deliberate, not a bypass.

---

## 2. Decisions needed before the agent starts (W0)

| # | Decision | Recommendation | Owner |
|---|---|---|---|
| D1 | Plugin name = command prefix | `work-os` → `/work-os:prd-draft`. Kebab-case required. Every rewrite hard-codes it, so it cannot change later without redoing W3 and W5. | Alex |
| D2 | Where Payworks' marketplace gets the plugin | A vendored copy inside their marketplace repo (source `./plugins/work-os`), delivered by SoftServe as a pull request per release. A marketplace entry that clones a SoftServe-hosted repo needs network + git credentials from Payworks laptops, which their file-sharing constraints suggest are locked down. | Alex + Payworks |
| D3 | Version policy | `version` in the manifest, bumped every release, with a CI guard (a plugin change without a bump fails). When a version is set, users receive updates only when it changes; a forgotten bump ships nothing, silently. | Alex |
| D4 | Skills that stay repo-local in the Payworks instance | At least `/microjob-brief-draft`; anything else Payworks edited since August (diff their `.claude/skills/` against the master). | Vlad proposes, Alex confirms |
| D5 | Central push or self-install | Ask Payworks IT to add their marketplace to managed settings with auto-update on. Otherwise each PM runs one install command and gets updates only on manual refresh (auto-update is off by default for private marketplaces). | Payworks IT |
| D6 | Is the "plugins only" lock (`strictPluginOnlyCustomization`) on or planned? | If on, repo-local skills, agents and hooks stop loading; the write-guard and auto-commit hooks would have to ship as a second, instance-specific plugin. | Payworks IT |

## 3. What moves, what stays

| Moves into the plugin | Stays in the repo |
|---|---|
| All universal skills (59 in the master) under `work-os-plugin/skills/<name>/` | `CLAUDE.md` (a plugin cannot carry one), `.claude/CLAUDE.md`, `.claude/team-learnings.md` |
| The 9 reviewer personas + `code-explorer` + `context-extractor` under `work-os-plugin/agents/` | The 3 hooks and `.claude/settings.json` (they read `governance/write-policy.yaml` via the project dir) |
| Reference files and scripts inside skill folders (job-spec-draft references, prototype `audit_tokens.py`, customize-os targets) | `governance/**`, templates, `Documentation/`, `os-console/`, `.github/` |
| The skills index content → `work-os-plugin/README.md` | Instance-specific skills (D4) in `.claude/skills/`; a new `governance/skill-rules/` folder for local corrections |

---

## 4. Change table

Counts and line numbers are from the master at `7cb6c84` (scan of 2026-09-15). Re-scan on the branch before relying on them.

| # | WS | Change | Where | Done when |
|---|---|---|---|---|
| 1 | W1 | Create the plugin manifest (name `work-os`, description, `version 1.0.0`, author SoftServe R&D, homepage, keywords) | `work-os-plugin/.claude-plugin/plugin.json` (new) | `claude plugin validate ./work-os-plugin --strict` passes |
| 2 | W1 | `git mv` every universal skill folder, names unchanged (folder name = command name) | `.claude/skills/<name>/` → `work-os-plugin/skills/<name>/` | `.claude/skills/` holds only local skills + a stub index |
| 3 | W1 | Move the 11 agent files into the plugin's flat `agents/`; leave a stub `.claude/agents/CLAUDE.md` (local files override same-named plugin agents) | `.claude/agents/**` → `work-os-plugin/agents/` | agents listed by `claude plugin details` |
| 4 | W1 | Skills index → plugin README (8-group table, frontmatter convention, 1,536-char description budget); 10-line stub left behind | `.claude/skills/CLAUDE.md` → `work-os-plugin/README.md` | README renders; stub explains local-only policy |
| 5 | W1 | Changelog with a first entry (the move, the prefix) | `work-os-plugin/CHANGELOG.md` (new) | — |
| 6 | W1 | Master repo becomes a marketplace (`softserve-work-os`, one entry, source `./work-os-plugin`), same pattern as the `ao-personal-os` marketplace in Alex's repo | `.claude-plugin/marketplace.json` (new, repo root) | `claude plugin marketplace add .` works from a clone |
| 7 | W1 | Dev launcher: `claude --plugin-dir ./work-os-plugin`; document `/reload-plugins` | `scripts/dev.sh` (new), README | — |
| 8 | W2 | Sibling skills run by path (`.claude/skills/{assumption-map\|red-team\|pre-mortem}/SKILL.md`) and personas (`.claude/agents/reviewers/`) → `${CLAUDE_PLUGIN_ROOT}/skills/…`, `${CLAUDE_PLUGIN_ROOT}/agents/…` | `prd-challenge/SKILL.md` l.30, 58, 71 | test C1 |
| 9 | W2 | Same rewrites: S1 sweep + variation-scan reference files, six reviewer seats | `job-spec-challenge/SKILL.md` l.37, 42–47, 100, 109, 122 | test C2 |
| 10 | W2 | Own reference files → plugin root | `job-spec-draft/SKILL.md` l.86; `jobs-breakdown/SKILL.md` l.54 | — |
| 11 | W2 | `python .claude/skills/prototype/scripts/audit_tokens.py` → `python "${CLAUDE_PLUGIN_ROOT}/skills/prototype/scripts/audit_tokens.py"` (project files stay project paths) | `prototype/SKILL.md` l.122; `prototype-challenge` l.37; `prototype-feedback` l.74 | test C3 |
| 12 | W2 | `@.claude/agents/reviewers/…` file mentions → name the agents (scoped-name format confirmed in test C4) | `strategy-sprint/SKILL.md` l.279 | — |
| 13 | W2 | Docs-sync sources: skills index → plugin README; per-skill files and agents → plugin paths; add `.claude/skills/` as the local-skills source | `docs-update/SKILL.md` l.42–47 | `/work-os:docs-update sync` finds no stale facts |
| 14 | W2 | Instance-handoff gates: Gate 2 counts skill folders vs master (l.35) → check plugin installed + enabled and local skills; Gate 4 resolves commands against `.claude/skills/{name}` (l.73) → plugin skills (prefixed) + local; context-core l.57; naming-conventions l.39 | `customize-os/targets/instance-handoff.md`, `context-core.md`, `naming-conventions.md` | test H5 |
| 15 | W2 | Hook references stay (`auto-sync` l.11, `propose` l.25): hooks remain in the repo | — | no change |
| 16 | W3 | Scripted rewrite `/<name>` → `/work-os:<name>` for the 59 names inside plugin skills and their reference files; guard: slash not preceded by a path character, name not followed by a name character | `work-os-plugin/**` (1,268 occurrences, 58 skills) | zero bare mentions inside the plugin |
| 17 | W3 | Hand review of the diff (heaviest: prd-draft 27 other skills, job-spec-draft 15, prd-challenge 14, process-meeting 12, job-spec-challenge 12); keep `argument-hint` and `name:` values as they are; longest description (job-spec-draft, ~1,530 chars) still under the cap | diff | — |
| 18 | W4 | New folder: one `<skill>.md` per skill, dated one-line rules; a CLAUDE.md explaining the format and precedence (local rules win) | `governance/skill-rules/` (new) | — |
| 19 | W4 | One standard step inserted after the frontmatter of every plugin skill: read `${CLAUDE_PROJECT_DIR}/governance/skill-rules/<name>.md` if it exists and apply it | all `work-os-plugin/skills/*/SKILL.md` | test E1 |
| 20 | W4 | Contract row "skill-specific rule → that skill's SKILL.md self-check" → skill-rules file (instance) + upstream change request (universal); add `work-os-plugin/**` as the master's gated writer surface | `governance/write-back-contract.md` l.34 + one-writer table | — |
| 21 | W4 | Capture-loop header: gated targets list names skill-rules files instead of skills; keep the "skills stay universal" seed rule | `.claude/team-learnings.md` | — |
| 22 | W4 | Routing text points at skill-rules, not skill bodies | `session-retro/SKILL.md` l.31–47; `governance/proposals/CLAUDE.md` | test E2, E3 |
| 23 | W4 | New lint check: every skill-rules file names an installed plugin skill or a local skill (skill check list + script `IMPLEMENTED` list together; the parity guard requires both) | `wiki-lint/SKILL.md`; `.github/scripts/wiki-lint.sh` | test E4 |
| 24 | W5 | Root steering file: prefix the 29 mentions; add one Doc Index line naming the plugin, the local-skills folder and the skill-rules folder | `CLAUDE.md` | — |
| 25 | W5 | Rewrite "Repo skills take precedence over plugin skills": the work-os plugin's skills are the Work OS; prefer them over overlapping third-party plugins; skills folder = local only | `.claude/CLAUDE.md` | — |
| 26 | W5 | Governance surface: prefix mentions; add `work-os-plugin/**` and `.claude-plugin/**` to the master's gated tier; fix the `.claude/**` comment | `write-back-contract.md` (95), `governance/CLAUDE.md` (10), `write-policy.yaml` (7), `link-schema.yaml` (6), `proposals/CLAUDE.md` (2), `health/CLAUDE.md` (2) | test G1 |
| 27 | W5 | Product-tree navigation and registries: folder CLAUDE.md files (~35), `toolchain.yaml` (22), `feature-index.yaml` (5), `code-repos.yaml` (5), `code-grounding.md` (9), `de-risk-a-bet.md` (19), blank templates (28 across 6 files), strategy frameworks (~17), business-context masters (15), competitive landscape + matrix (19), `portfolio.yaml` (3), `data-catalog.yaml` (1), design-system CLAUDE.md | `product-development/**` (~260 of 326 mentions) | test B5 |
| 28 | W5 | Leave historical records untouched: PRDs, reviews, weekly reviews, initiative pages, transcripts, decisions, launch gates (~60 mentions) | — | no change |
| 29 | W5 | Hook messages and docs: "run /wiki-lint", "run /context-update" (session-start), "/auto-sync on", "/propose" (auto-commit), hooks briefing, agent indexes | `.claude/hooks/session-start.sh` (2), `auto-commit.sh` (3), `session-start.md` (5), `.claude/agents/CLAUDE.md` (5), `reviewers/CLAUDE.md` (3) | — |
| 30 | W6 | Console adapter: replace `SKILLS_DIR = '.claude/skills'` with a resolver (master: `work-os-plugin/skills`; instance: `WORK_OS_PLUGIN_DIR` env, else the plugin cache under `~/.claude/plugins/cache`, subpath confirmed in test H1); always merge `.claude/skills` as local; emit `origin` and the prefixed command | `os-console/lib/adapters/skills.js` | test H1 |
| 31 | W6 | Console views and strings: prefixed command + origin badge; empty-state text (`skills.js` l.228); harness policy path (l.32); "run /…" strings across home, actions, setup, autosync, features, initiatives, templates, filing, docs, activity, governance, competition, policy, mdparse, gitlib, docs adapter | `os-console/web/views/*.js`, `os-console/lib/*.js`, `os-console/CLAUDE.md` (74) | — |
| 32 | W6 | Rebuild the snapshot | `node os-console/build-console.js` → `console.html` | test H2 |
| 33 | W6 | Mechanical lint: parity guard path (l.33) → `${WORK_OS_PLUGIN_DIR:-work-os-plugin}/skills/wiki-lint/SKILL.md`; absent file → visible "parity check skipped" warning, never a silent pass; prefix 18 messages | `.github/scripts/wiki-lint.sh` | test H4 |
| 34 | W6 | New workflow on PRs touching the plugin: install the CLI, `claude plugin validate --strict`, fail when plugin files changed without a manifest version bump; optional nightly `claude plugin eval` (needs an API key secret) | `.github/workflows/plugin-validate.yml` (new) | test F4 |
| 35 | W6 | Comment-only mentions | `.github/workflows/wiki-lint.yml`, `.github/scripts/gated-paths.sh`, `os-installation/gated-policy-sync.azure-pipelines.yml` | — |
| 36 | W7 | Docs site source: prefix 252 mentions; rewrite the two skill definitions (l.284, l.330); new article "Install the Work OS plugin" (marketplace add incl. the Azure `/_git/` no-`.git` rule, install, auto-update on or manual refresh, `/reload-plugins`, "not installed" notice); rebuild via `/work-os:docs-update sync` after W5–W6 | `Documentation/src/content.js` → `work-os-docs.html` | test H3 |
| 37 | W7 | Front page: "52 skills in .claude/skills/" (real count 59) → "59 skills in the work-os plugin"; 12 mentions | `README.md` | — |
| 38 | W7 | Install guide tree (l.171 says 45 skills); first-session checklist (28 mentions; step 4 → local rules or upstream request; tests 2/3/9 prefixed); definition-chain guide (107, source line 7) | `os-installation/installation-guide.md`, `first-session-checklist.md`, `skill-guide-definition-chain.md` | — |
| 39 | W7 | Scheduled governance: cron prompt cites `.claude/skills/weekly-review/SKILL.md` (l.145, 175); runner installs the plugin non-interactively and sets `DISABLE_AUTOUPDATER` | `os-installation/claude-code/scheduled-governance.md` | test I2 |
| 40 | W7 | Runbook step 2 → "refresh the marketplace and restart; repo side updates by git pull"; admin guides protect `work-os-plugin/**` in the master and describe the marketplace-repo approval as Payworks' gate | `link-migration-runbook.md`, `admin-setup-github.md`, `admin-setup-azure-devops.md` | — |
| 41 | W7 | Remaining guides: code-access (5), ralph-wiggum (2 paths), parallel-agents (3), folder index (5) | `os-installation/claude-code/*.md`, `os-installation/CLAUDE.md` | — |
| 42 | W7 | Outside the repo: S3 governance slides + OS-admins deck say "adjust skills" → "maintain local rules, approve plugin releases" | Payworks decks (OneDrive) | Alex |
| 43 | W8 | Instance settings: `extraKnownMarketplaces` entry for the marketplace + `enabledPlugins: {"work-os@<marketplace>": true}`; hooks block untouched (verify the exact `source` shape for a git-URL marketplace in the settings reference before writing) | `.claude/settings.json` (instance) | test A3 |
| 44 | W8 | Delete moved skill folders and agents from the instance (originals would show twice); keep D4 local skills and deliberate agent overrides | `.claude/skills/`, `.claude/agents/` (instance) | test B3 |
| 45 | W8 | Extract instance-specific edits from customized skill copies into skill-rules files before deleting the copies | `governance/skill-rules/*.md` (instance) | test E1 |
| 46 | W8 | Per user once, until IT pushes centrally: `claude plugin install work-os@<marketplace>`; command in the first-session checklist | each PM machine | test A5 |
| 47 | W9 | Release script: bump version, changelog entry, validate `--strict`, tag `work-os-vX.Y.Z`, copy `work-os-plugin/` into a checkout of Payworks' marketplace repo at `plugins/work-os/`, update its entry, open the Azure PR | `scripts/release-plugin.sh` (new) | test F1 |
| 48 | W9 | First Payworks marketplace entry: name `work-os`, source `./plugins/work-os`, version `1.0.0`, category, one-line description | Payworks marketplace `.claude-plugin/marketplace.json` | test A2 |
| 49 | W9 | Asks to Payworks IT: managed-settings entry with auto-update on; allowlist includes the marketplace; answer D6 | managed settings | test A6, A7 |
| 50 | W9 | Re-wire the demo repos (Payworks-Work-OS-Demo, the mock-data instance) the W8 way so demos run on the released version | demo repos | test I3 |

**Order.** W0 → W1 → W2 → W3 → W6 (tooling, so the console and lint can verify) → W4 → W5 → W7 → validate + tests A–D → W8 on a scratch instance → W9. One branch, one cut; a partial split leaves two naming conventions and breaks cross-skill calls halfway.

**Effort** (inference, agent-assisted): best 3 / likely 5 / worst 10 working days. Rewrites are scripted in half a day; the diff review across 129 non-skill files and 59 skills is manual (1–2 days); console resolver, docs article and CI (1–2 days); local-rules channel (1 day); the test plan on a scratch instance (1–2 days). Payworks approvals add elapsed time, not effort.

---

## 5. Acceptance (the gates the agent must prove; full plan of 40 checks on the companion page)

1. `claude plugin validate ./work-os-plugin --strict` passes with zero warnings.
2. A scan of agent-read files finds zero bare mentions of the 59 names outside historical records; zero `.claude/skills` / `.claude/agents` paths inside the plugin.
3. Dry runs with `claude --plugin-dir ./work-os-plugin`: `/work-os:prd-challenge` on the example PRD runs its three lenses and the personas from the plugin root; `/work-os:prototype-challenge` finds the audit script; `/work-os:process-meeting` files into the repo.
4. A `governance/skill-rules/prd-draft.md` rule visibly changes `/work-os:prd-draft` output.
5. The write-guard still prompts on a gated path; the console lists plugin + local skills; `wiki-lint.sh` prints either the parity line or a visible skip.
6. The agent's closing report (format in the prompt) lists every file class touched with counts, every judgement call it made, and every item it could not finish.

---

## 6. Handoff prompt

Paste into a Claude Code session opened at the root of the target repo. Fill the five inputs first. The prompt is written for autonomy: it tells the agent what must be true at the end and what it must never do, and leaves the scanning and the judgement calls to it.

````text
You are executing the "skills-to-plugin" migration of this Work OS repository. Read
`governance/proposals/2026-09-15-skills-to-plugin-migration.md` first: it holds the
rationale, the change table (counts from the master at 7cb6c84, stale for this repo:
re-scan, never trust its line numbers) and the acceptance gates you must prove.

INPUTS (filled by the operator)
- PLUGIN_NAME: work-os                     # the command prefix; do not change
- MARKETPLACE_NAME: <e.g. payworks-plugins or softserve-work-os>
- MARKETPLACE_SOURCE: <git URL of the marketplace repo, or "self" when this repo is the marketplace>
- MASTER_PATH: <local path or git URL of the SoftServe master repo, or "none">
- LOCAL_SKILLS: <comma-separated skill names that must stay in .claude/skills/, or "none">

MISSION
Move every universal skill and agent into a plugin at `work-os-plugin/`, wire this repo to
consume the plugin, and leave the repo behaving exactly as before for a PM, except that
every command now reads `/work-os:<name>`. Nothing that steers a session moves: CLAUDE.md
files, hooks, settings, write policy, contract, templates, team learnings.

PHASE 0: ORIENT AND DECIDE MODE (report before changing anything)
1. Detect the mode. MASTER when `os-installation/customization-status.md` is absent and the
   root CLAUDE.md still carries `[Your Product]` placeholders; INSTANCE otherwise.
   - MASTER: build the plugin here (phases 1–7), skip phase 8, prepare phase 9.
   - INSTANCE with MASTER_PATH given: diff `.claude/skills/` against the master; every skill
     whose content differs is CUSTOMIZED. The plugin is built from the master's copies; each
     customized delta becomes a `governance/skill-rules/<name>.md` entry (dated one-line
     rules), and the customized copy is deleted. Skills in LOCAL_SKILLS stay untouched.
   - INSTANCE with MASTER_PATH "none": build the plugin from this repo's skills as they are,
     and state in the report that the plugin was cut from a customized instance and must be
     reconciled with the master before it is released to any other customer.
2. Scan and record the baseline: number of skills and agents; bare mentions of every skill
   name outside `.claude/skills/` (regex below) grouped by folder; files containing
   `.claude/skills` or `.claude/agents`; hooks present; whether `os-console/`,
   `Documentation/src/content.js` and `.github/scripts/wiki-lint.sh` exist.
3. Work on a new branch `plugin-migration`. Run `/auto-sync off`. Do bulk rewrites with
   shell scripts (perl/sed): the write-guard hook intercepts only the Edit/Write tools, and
   the pull request is the review gate for this change. Commit at the end of every phase
   with the prefix `migrate:` and a one-line summary.

INVARIANTS (true at the end, checked by you)
- Plugin layout: `work-os-plugin/.claude-plugin/plugin.json`, `work-os-plugin/skills/<name>/`,
  `work-os-plugin/agents/*.md`, `work-os-plugin/README.md`, `work-os-plugin/CHANGELOG.md`.
  Nothing but `plugin.json` inside `.claude-plugin/`. Folder names unchanged.
- Every skill-to-skill mention inside the plugin uses the prefix `/work-os:<name>`.
- No `.claude/skills` or `.claude/agents` path inside the plugin; plugin-internal files are
  addressed as `${CLAUDE_PLUGIN_ROOT}/…`, repo files as project paths (or
  `${CLAUDE_PROJECT_DIR}/…` where a shell command needs an absolute path).
- Every plugin skill starts (after the frontmatter) with the local-rules step given in the
  appendix. `governance/skill-rules/CLAUDE.md` exists and explains the format.
- Agent-read repo files (root and folder CLAUDE.md files, governance, hooks and their docs,
  templates, registries, the bet chain, frameworks, business-context masters, console
  strings, docs source, install guides, CI scripts) use the prefixed form. Historical
  records (PRDs, reviews, reports, initiative pages, transcripts, decisions, launch gates)
  are left exactly as they are.
- `.claude/skills/` holds only LOCAL_SKILLS plus a stub CLAUDE.md; `.claude/agents/` holds
  only deliberate local overrides plus a stub CLAUDE.md. Hooks and `.claude/settings.json`
  hooks block are byte-for-byte unchanged.
- The write policy's gated tier gains `work-os-plugin/**` and `.claude-plugin/**` (MASTER).
- `claude plugin validate ./work-os-plugin --strict` passes with zero warnings.

PHASES (each ends with its commit and a two-line status in your running log)
1. Package: manifest, `git mv` of skills and agents, README from the old skills index, changelog,
   root `.claude-plugin/marketplace.json` (MASTER only; entry source `./work-os-plugin`),
   `scripts/dev.sh` launching `claude --plugin-dir ./work-os-plugin`.
2. Paths: rewrite every `.claude/skills` and `.claude/agents` reference inside the plugin
   (the table lists the twelve files known in the master; find the rest by grep). The
   docs-update sources table and the customize-os handoff gates change meaning, not just
   paths: read them and rewrite the logic (plugin installed + local skills, prefixed commands).
3. Prefix: run the regex rewrite over the plugin; review the diff file by file for false
   positives; confirm the longest description still fits the 1,536-character listing cap.
4. Local rules: create `governance/skill-rules/` + CLAUDE.md; insert the local-rules step
   into every plugin skill; re-route the write-back contract row for skill-specific rules,
   the team-learnings header, session-retro's routing and the proposals format; add the
   stale-rule check to the wiki-lint skill and the mechanical script together.
5. Steering files: prefix the agent-read files listed in the invariants; add the Doc Index
   line to the root CLAUDE.md; rewrite the ".claude/CLAUDE.md" plugin-precedence section.
6. Tooling: console skills adapter resolver (plugin dir → env → cache → local), views and
   strings, snapshot rebuild; wiki-lint parity path with a visible skip; the
   plugin-validate workflow with the version-bump guard.
7. Docs: docs-site source and the install article, README counts, install guides, the
   first-session checklist, scheduled-governance, the runbook, admin guides; then rebuild
   the docs site through the docs-update skill's sync mode.
8. INSTANCE only: settings (`extraKnownMarketplaces` + `enabledPlugins`; verify the exact
   `source` object shape for a git-URL marketplace against
   https://code.claude.com/docs/en/settings-reference#extraknownmarketplaces before writing),
   delete the moved originals, write the skill-rules files from the customized deltas, add
   the per-user install command to the first-session checklist.
9. Release prep (MASTER): `scripts/release-plugin.sh` as specified in the table; do not run
   a release.

GATES (prove each; paste the evidence into the report)
G1 validate --strict output.  G2 the bare-mention scan: zero in agent-read files; list the
historical files you deliberately left.  G3 with `claude --plugin-dir ./work-os-plugin`: run
`/work-os:prd-challenge` on an example PRD, `/work-os:prototype-challenge` on an example
prototype, `/work-os:process-meeting` on an example transcript; confirm plugin-root
resolution and repo writes.  G4 a `governance/skill-rules/prd-draft.md` rule changes
`/work-os:prd-draft` output.  G5 write-guard still prompts on a gated path; console lists
plugin + local skills; `wiki-lint.sh` prints the parity line or a visible skip.

NEVER
- Never rewrite historical records to the prefixed form.
- Never delete a skill in LOCAL_SKILLS, a hook, or a settings file.
- Never edit anything under `~/.claude/plugins/` (the cache is not a source).
- Never change the plugin name, the folder names, or a skill's `name:` / `argument-hint`.
- Never force-push, never rewrite history, never open the pull request or run a release.
- Never resolve an ambiguity silently: when the mode, a customized delta, or an
  instruction-vs-history call is unclear, choose the conservative option (keep the file
  as is) and list it under "Judgement calls" in the report.

REPORT (final message, in this order)
1. Mode detected and why; inputs used.
2. Table: file class → files touched → occurrences rewritten → notes.
3. Judgement calls (each: file, what you chose, why, what the alternative was).
4. Gates G1–G5 with evidence.
5. Not done / blocked (each with the reason and what is needed).
6. The exact commands the operator runs next (validate, dev launcher, install).

APPENDIX: PRECISION ITEMS
A. Bare-mention regex (perl, one skill name per alternation; build the list from the
   plugin's skills folder): match `(^|[^A-Za-z0-9_./:-])/(NAME1|NAME2|…)(?![A-Za-z0-9_-])`,
   replace with `$1/work-os:$2`. The guard keeps folder paths and URLs untouched; still
   review every file.
B. Local-rules step (insert as the first body line after the frontmatter of every plugin
   skill):
   "**Local rules first.** If `${CLAUDE_PROJECT_DIR}/governance/skill-rules/<name>.md`
   exists, read it and apply it; its rules override the defaults below."
C. Manifest `work-os-plugin/.claude-plugin/plugin.json`:
   ```json
   {
     "name": "work-os",
     "description": "SoftServe Work OS: the PM team's skills and reviewer agents, one versioned package",
     "version": "1.0.0",
     "author": { "name": "SoftServe R&D" },
     "keywords": ["product-management", "team-os", "work-os"]
   }
   ```
D. Root marketplace (MASTER) `.claude-plugin/marketplace.json`:
   ```json
   {
     "name": "softserve-work-os",
     "owner": { "name": "SoftServe R&D" },
     "plugins": [
       { "name": "work-os", "source": "./work-os-plugin", "category": "productivity",
         "description": "SoftServe Work OS: PM skills and reviewer agents" }
     ]
   }
   ```
E. Instance settings block (add next to the existing hooks; verify the `source` shape for
   a git-URL marketplace in the settings reference, the GitHub form is documented as
   `{ "source": "github", "repo": "org/repo" }`):
   ```json
   {
     "extraKnownMarketplaces": { "MARKETPLACE_NAME": { "source": { "...": "..." } } },
     "enabledPlugins": { "work-os@MARKETPLACE_NAME": true }
   }
   ```
F. Azure Repos marketplace URLs: the path must contain `/_git/` and must not end in `.git`.
G. Version rule: any change under `work-os-plugin/` without a bump of `version` ships
   nothing to installed users. The CI guard exists for this; do not weaken it.
````

---

## 7. Known unknowns

- Exact scoped-name format for plugin agents when a skill spawns them (test C4).
- The plugin cache subpath the console resolver should read (test H1).
- The `extraKnownMarketplaces` `source` shape for a generic git URL (the docs page truncates before it; the GitHub form is documented).
- Payworks' git auth for background auto-update over Azure Repos (SSH or a token URL rewrite per the docs).
- Whether Payworks IT plans the plugins-only lock (D6).

## Sources

Repo facts: SoftServe-Work-OS at commit `7cb6c84`, scanned 2026-09-15. Marketplace mechanics: code.claude.com/docs (plugins, discover-plugins, plugins-reference, plugin-marketplaces, managed-settings), fetched 2026-09-14; the four load-bearing claims (always-prefixed names, auto-update off by default for private marketplaces, version-pin semantics, no CLAUDE.md in a plugin) re-verified verbatim.
