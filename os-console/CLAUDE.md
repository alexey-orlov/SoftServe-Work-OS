# OS Console

A local web UI over this repo — friendly navigation, initiative grouping (with
drag-prioritized sources and per-initiative instructions), the Product map page (the
feature-index as a navigable two-level structure, primary nav next to Initiatives —
each product AREA is one container card whose header names it and whose body folds
the FEATURES inside it, plus stat tiles ordered outer-level-first, catalog status
pills, the derived "in progress" state and expand-all), the Skills page (every
`.claude/skills` program in three projections: mapped against the product workflow
with the definition chain as the solid spine, by use-case group, and A–Z — every
projection opens the same skill card with the command to copy), tabbed setup
with the integrations table and per-file population status, gated-list management, the
auto-sync switch (a Setup tab — PM language, no git jargon; the one home for it),
actionable proposed-changes queues, and the activity log, without touching the
underlying folder structure. The Context library sorts its six tile groups into four tabs —
**Business context** (Strategic context · Templates · Ongoing business context), **Tech
context** (one group of the same name — how the team's own systems are laid out and how
to use them: Analytics, which fronts the data catalog, and Engineering, which fronts the
code-repo registry; the registries get no tile of their own, because that would be the
same door twice), **Output artifacts** (Artifacts) and **Index pages** (Product map ·
Initiatives) — each
group keeping a quiet color code: the group speaks through the tile frame and icon
tint while titles stay neutral ink. Each tab carries a one-line hint that states its
scope in the order its groups appear. The split is by provenance, not by folder: the
warehouse and the code repos are context the team sets up before the OS runs and the OS
only reads, so they are context and not output — but how the systems are laid out is a
different question from who the team is, often answered by a different person, so they
get their own tab rather than trailing the business material. Only what the OS's own
programs produce lands under Output artifacts. Index pages closes the bar, named for what its two
tiles are rather than what they are about: the two halves of one graph — the product's
lasting shape, and the work in flight against it — through one of which every artifact is
reached. Both tiles also sit in the left rail, because a second door onto a main
road is not a duplicate, and the tab stays at two: the other registries front their own
folders and belong where they already are. Strategic context closes with Roadmap &
OKRs, the one strategic input replaced on a cadence rather than kept. A tab holding a
single group prints no group heading, because the tab already carries that name. The
tile grid is a fixed column count (four, or three where a group wants roomier cards),
so a group breaks into even rows instead of one packed row plus an orphan, and the
gated-badge lookup is one request for the whole page rather than one per tab. The
Curated ↔ Folder tree switch stays above the tabs and owns the mode; tabs subdivide the
curated view only, and never appear over the tree. It names the two MODES rather than
repeating the page title, which sits an inch below it.
The OS's own machinery is NOT in the Context library: it lives on **OS harness**, the last page in
the Manage nav block, because the Context library answers "what does the team know" and that is a
different question from "what makes the OS behave". It uses the Context library's tile language
and the Context library's own tab component, sorting three groups into two tabs. **Agents & rules**
holds the three that decide how a session behaves: *Skills and agents* (the two capability
surfaces, kept apart from what an agent is told), *Agent setup* (CLAUDE.md, Hooks, Team
memory, Integrations, Agent navigation — what steers the agents, what runs on its own, what
they remember, what they connect to, and where they are told they are; Hooks opens a
second-level page, because a folder tile showed the three scripts and hid `settings.json`,
the file that decides whether any of them runs) and *Governance* (Gated files, which
pairs the write policy with the script that mirrors it to the server, and Filing & linking
rules, which folds the write-back contract, the link schema and the lint that enforces them
into one second-level page because they serve one goal). **OS user interface** holds the
third (OS console, Documentation, Admin guides). Same rule as the Context library: the two-group
tab prints its group eyebrows, the single-group tab prints none — the tab already carries
that name — and takes that group's own line as its hint. Agent setup's five tiles break
3+2 (`rows-of-three`) rather than four-and-one, at the same tile width as every other
group. Team learnings is reached from here as **Team memory** and is no longer a sidebar
entry; Skills moved with it, so both pages crumb back to OS harness rather than Context library.
The gated-list management page (the Manage nav's Gated files) keeps its own "System rules"
group name; its "Steering files" is deliberately broader than the Context library's Strategic
context, because it groups by what the policy protects (business context, templates and
engineering together). The **Setup page follows the
Context library's structure inside its own tabs**: its first two tabs are the Context library's first
two. *Business context* sections into the same Context library groups (Strategic context — the
steering files in the Context library's tile order, the Roadmap & OKRs tile standing for the
quarter page whose fill state is measurable; Ongoing business context — content
readiness, reported as signal and deliberately OUTSIDE the progress counter, because
"12 meetings filed" is not a step anyone finishes). *Tech context* is one row per
Context library tile in the tile order — each folder's content count with the fill state of the
registry it fronts folded into the same row (done needs both, in progress is either) —
all signal, so the tab carries no counter and, holding a single group, prints no
eyebrow. The Templates tab groups by the Templates page's four
names; the Integrations table sections by which Context library group each tool feeds, using the
tab's name where a tab holds exactly one group (Tech context, Output artifacts). The
`?tab=business` and `?tab=tech` ids stay put so links keep working. Template group
membership, order and display names all come from `lib/adapters/templates.js`, so the
Templates page and the Setup tab cannot drift apart.
Second-level group pages (Templates, Competition, Skills, Gated files, Hooks, Agent
navigation, Filing & linking rules) share one skeleton — crumbs back to their parent, title + one-line purpose, tile
grid; Templates splits that grid across four tabs (PRDs and specs · Meetings & interviews ·
Other templates · Writing styles) whose names and order the Context library's Templates section
mirrors tile for tile. Filing & linking rules splits its across two eyebrows — the two rule
files, then the check that holds the repo to them: the lint script, the workflow that runs
it on every pull request and every Monday, and `.freshness-ignore`, the pages it skips and
the one file on that page a PM edits. Hooks splits its the same way — the three scripts
that run on their own, then `settings.json` and the hook reference that wire them. Agent
navigation is the one that is a table rather than tiles: every folder carrying a CLAUDE.md,
parents before children, served by `/api/navmap` (`lib/adapters/library.js navMap`) — which,
like every read route, must be baked into the light-mode snapshot or the page is blank there. The OS user interface
tiles are the one place in the tile language where the card is NOT a link: each has a page
to open AND a folder to browse, so all three use the Templates page's action-row card —
the card itself inert, `Open` and `Browse files` as real buttons with honest hrefs —
because a clickable card with a button inside it is two affordances in one component.
**Every tabbed page uses the one `tabBar` component in `web/ui.js`** (Context library, Setup,
Templates, Proposed changes, OS harness) — it owns the `?tab=` parameter, the active
state, the tablist semantics and arrow-key navigation, and takes an optional per-tab
count, so a new tabbed page never hand-rolls another copy. **Type steps down into the
page:** h1 21/680 → tab 15/600 → `.group-head` 12/700 uppercase eyebrow → tile or row
title 13.5. A heading inside a tab must never outweigh the tab that names it — the eyebrow
is smaller in px than the tile titles under it on purpose, because uppercase,
letter-spacing and the group's colour dot mark it as a label of a different class rather
than a competing title.
Zero install: it runs on the Node 18+ standard library —
no dependencies, no `npm install`, ever, nothing beyond the runtime — with the frontend's
one MIT-licensed library vendored in `vendor/`.

**Read this when:** You want the human-facing window onto the OS, or you are extending it.

## Run

```bash
node os-console/server.js
```

Then open http://127.0.0.1:4820 (set `OS_CONSOLE_PORT` to change the port). The server
binds localhost only. The same command works on macOS, Linux and Windows.

No Node on the machine? Open [console.html](console.html) instead — the
zero-setup light mode below.

## Light mode — the zero-setup snapshot

`console.html` is the whole console as ONE self-contained read-only file: the same
frontend with every view's data, all wiki file contents, a client-side search index, and
the built docs site baked in. Open it from the clone, a file share, or any static host —
no runtime, no install, nothing to approve. Built by `build-console.js` (same Node stdlib).

**How it stays current — three writers, one builder, no CI:**

- **The turn-end hook** (`.claude/hooks/auto-commit.sh`, once auto-sync is on) rebuilds it
  on every machine that has Node, in the same push as the work it describes. Direct
  mode: a `console: rebuild snapshot` commit right after the turn's commit. Pr mode: one
  more commit inside the drain, so the pull request lands content and snapshot together;
  a drain whose pull request reports a merge conflict (two people landed snapshots at
  once) is rebuilt from the current target next turn. No Node on that machine → skipped
  and said out loud; the next teammate with Node catches up, since every build bakes the
  whole repo.
- **The console's Rebuild** — the snapshot line in the sidebar's git chip reads `current`
  or `N behind`; one click rebuilds, commits, and pushes per auto-sync (`lib/snapshot.js`,
  `POST /api/snapshot/rebuild`).
- **By hand:** `node os-console/build-console.js --ref HEAD`.

Every writer bakes a COMMITTED tree, never the working tree — `--ref` checks the commit
out in a throwaway worktree, and the drain worktree already is one — so held gated edits
cannot leak into a file that lands on the shared branch. Builds are deterministic per
commit (dates come from git, the leaderboard anchors on the source commit, nothing reads
the clock): two people baking the same commit produce the same bytes, which git merges
without a conflict. Where two snapshots do differ, `.gitattributes` names a `snapshot`
merge driver — keep the current side, the next rebuild regenerates it — registered per
clone by the hook and the console. The file carries a stamp in its `<head>`
(`<meta name="os-console-snapshot" …>`: source sha, branch, build date) that the chip, the
hook, and a person with `head` can read; the page's own banner prints the build age and
turns amber past a week. Snapshot commits are derived output, not work: the leaderboard
and the Activity timeline leave them out. The GitHub workflow `build-console.yml` is a
manual fallback only (`workflow_dispatch`): on a pull-request-only `main` its push is
refused unless the Actions app sits on the ruleset bypass list, and it raced the hooks
for the tip of `main` — so it no longer runs on push, and Azure needs no pipeline.

**Two modes, one behavior:** the light page probes `http://127.0.0.1:4820/api/ping`
(the server's one CORS-open endpoint — a static "I am the console" flag, no data) on
load and every 5 seconds, and the moment a full console is running on the machine it
hands off to it, keeping the current view. Until then the banner says what you have:
a read-only snapshot as of its source commit, and how old it is.

What light mode cannot do: edit or act on anything — every write affordance (saves,
initiative status/sources/instructions, templates, learnings, gated-list edits, the
auto-sync switch, PR and proposal actions, the snapshot Rebuild) renders **locked with
an explanatory tooltip** (`LITE`/`liteLock` in `web/ui.js`), so nothing dead-ends in a
403. It cannot reflect changes newer than its build, and hook-built snapshots leave
pull requests out (the page says so and points at the full console). Copy-prompt
hand-offs to Claude Code still work. Per-user pins/recents work via the browser's
localStorage. Files over 300 KB are listed but their text is not embedded.

## How it relates to the OS

- **Everything displayed is derived** from the canonical registries — `governance/write-policy.yaml`,
  `product-development/feature-index.yaml`, `toolchain.yaml`, initiative pages, and folder
  CLAUDE.md navigation files. The console adds no second source of truth.
- **The few hardcoded maps are the drift surface — update them in the same commit as the
  structure they describe.** A handful of small tables name repo paths, names or groupings
  the registries do not: `lib/adapters/activity.js AREA_MAP` (path → friendly area),
  `lib/adapters/templates.js SUGGEST` (template → destination) + `LABELS` (template →
  display name, shown on every surface that lists templates), `lib/adapters/home.js
  STEERING_FILES` + `SURFACES`, `lib/adapters/steering.js CORE`, `web/views/library.js
  QUICK` (the tile groups and the paths behind them), `web/views/harness.js GROUPS` (the
  same, for OS harness), and `web/views/templates.js TAB_TEMPLATES` (which tab each
  template sits in) + `TEMPLATE_DESCS`. A folder move, a new
  template, a new steering file or a new toolchain surface silently invalidates one of them.
  Checking that the paths still EXIST is not enough — the destination a template row suggests
  can point at a folder that is still there but no longer holds that kind of file. Read the
  row's meaning against the folder's own CLAUDE.md, which is where destinations are stated.
  The two template tables fail softly by design (an unlisted template gets a de-slugged
  label and lands in "Other templates") — soft enough that a missing row shows up as a
  slightly-off card, not an error, so add the row with the template.
- **Writes respect the write policy.** One endpoint resolves every path against the policy's
  gated globs; gated files are badged in the UI and a save there is the person's approval
  (the human is the approver the gate exists for). The console never writes scripts, `.git/`,
  or anything outside the repo.
- **Every save commits immediately** (`console:` prefix, pathspec-limited) so concurrent
  Claude sessions never sweep console edits into their own turn-end commits. Pushing follows
  the auto-sync switchboard; in the `pr` strategy landing stays with the hooks and `/propose`.
- **Guided programs stay in Claude Code; switches live here.** Drafting skills and
  connection setup are handed off via the copy-prompt popup (`promptModal` — prompt text,
  short instruction, Copy button; no URL scheme, by decision). Three writes ARE
  reimplemented server-side because they are switches, not judgment: the **auto-sync
  flip** (`lib/actions.js autosyncSet` — the same three settings switches + strategy
  and the same guards as `/auto-sync`; **if that skill changes, change this module in the
  same commit**), **gated-list add/remove** (comment-preserving line surgery +
  CODEOWNERS regen via `gated-paths.sh`, Azure path-filter reminder surfaced), and
  **toolchain choice/system fields** (`approach:`/`system:` only — `connection:` blocks
  stay `/connect-mcps` territory, and a live connection locks the system field).
- **PR actions act as the person, honestly.** Approve/reject shell `gh`/`az` under the
  user's own CLI login on an explicit click. GitHub push/admin permission is probed
  cheaply to disable buttons upfront; where the host can't be asked cheaply (Azure,
  CODEOWNERS satisfaction) the console attempts the action and surfaces the host's
  verdict verbatim — the platform stays the enforcer. Proposal rejection deletes the
  file with the comment in the commit message; proposal approval hands the apply job to
  Claude Code (freeform prose is not machine-applied).
- **Pull requests** (Proposed changes) shell the platform CLI read-only — `gh` for
  GitHub origins, `az` for Azure Repos, detected from the git origin — cached for
  5 minutes. A missing or unauthenticated CLI degrades to an honest note, never an
  error. The Home **most-active leaderboard** reads local git history instead:
  changes are credited to the commit author (whoever produced the change — never
  who approved or merged it), merge commits are skipped, bot/CI/agent identities
  filtered — so it counts the same whether work lands as direct pushes or through
  pull requests, and needs no platform CLI.
- **Live refresh.** The server watches the repo (a polling scanner on a 1.5s tick —
  never `fs.watch`, whose per-platform recursion and rename semantics differ; `.git`
  noise is filtered to ref/HEAD moves) and streams change events over SSE
  (`/api/events`); open views re-render automatically, within ~2s of a change.
  Auto-refresh holds back while the person is typing or has a modal open — the ⟳
  button shows a dot and catches up on blur, and is the whole story for a snapshot
  opened without a server.
- **Documentation is embedded as a black box.** The sidebar's Documentation group is
  derived from the built site's own section tabs; each entry shows
  `Documentation/work-os-docs.html` in an in-app panel (`/docs-site`), deep-linked via
  the site's public `#/section/article` hash routes. The only contract is that file +
  those URLs + three selectors (`header.top`, `.side`, `.rail`) that the embed mode
  (`/docs-site?embed=1`) hides/re-anchors at serve time so the site's own header does
  not duplicate the console sidebar — the file on disk is never modified, and if the
  selectors change the header simply shows again. Nothing reads `content.js` internals,
  the group disappears when the file is absent, and the console never writes docs
  (`/docs-update` is the one writer; a staleness pill flags when `Documentation/src`
  is newer than the built site).
- `state.json` (gitignored) holds console-only prefs — pins, recents. Never canonical truth.

## Contents

### Files

- [server.js](server.js) — HTTP server: API routes, static files, SSE live refresh, localhost-only
- [package.json](package.json) — Name, `"type": "module"`, the Node 18+ engine floor, and the two scripts (`npm start`, `npm run build`); no `dependencies` key, by rule
- [state.json] — created on demand; per-user prefs overlay (gitignored)
- [build-console.js](build-console.js) — Bakes the zero-setup snapshot from a committed tree (`--ref`), deterministically; run by the turn-end hook, the console's Rebuild, or by hand
- [console.html](console.html) — Light mode: the console as one read-only file, no runtime needed, stamped with its source commit; auto-switches to a running full console

### Subfolders

- [lib/](lib/) — Server core (repo safety, policy, git, subprocess, markdown + YAML parsing) + one adapter per surface
- [web/](web/) — No-build ES-module frontend: shell, shared UI toolkit, one module per view
- [vendor/](vendor/) — Vendored marked 12.0.2 (MIT, header retained)
