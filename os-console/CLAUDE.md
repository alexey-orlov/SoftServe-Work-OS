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
underlying folder structure. Library
tile groups and the Gated-files group headings share one vocabulary (Steering files /
System rules), with a quiet color code per Library group: the group speaks through the
tile frame and icon tint while titles stay neutral ink. Second-level group pages
(Templates, Competition, Skills) share one skeleton — crumbs back to Library, title +
one-line purpose, tile grid. Zero install: it runs on the Node 18+ standard library —
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
no runtime, no install, nothing to approve. Built by `build-console.js` (same Node stdlib);
on GitHub the `build-console` workflow rebuilds and commits it on every push to main, so
the file in the repo is always the latest state of main. Azure instances run
`node os-console/build-console.js` from a pipeline (or by hand) instead.

**Two modes, one behavior:** the light page probes `http://127.0.0.1:4820/api/ping`
(the server's one CORS-open endpoint — a static "I am the console" flag, no data) on
load and every 5 seconds, and the moment a full console is running on the machine it
hands off to it, keeping the current view. Until then the banner says what you have:
a read-only snapshot as of its source commit.

What light mode cannot do: edit or act on anything — every write affordance (saves,
initiative status/sources/instructions, templates, learnings, gated-list edits, the
auto-sync switch, PR and proposal actions) renders **locked with an explanatory
tooltip** (`LITE`/`liteLock` in `web/ui.js`), so nothing dead-ends in a 403. It also
cannot reflect changes newer than its build or show live pull requests. Copy-prompt
hand-offs to Claude Code still work. Per-user pins/recents work via the browser's
localStorage. Files over 300 KB are listed but their text is not embedded.

## How it relates to the OS

- **Everything displayed is derived** from the canonical registries — `governance/write-policy.yaml`,
  `product-development/feature-index.yaml`, `toolchain.yaml`, initiative pages, and folder
  CLAUDE.md navigation files. The console adds no second source of truth.
- **The few hardcoded maps are the drift surface — update them in the same commit as the
  structure they describe.** Four small tables name repo paths the registries do not:
  `lib/adapters/activity.js AREA_MAP` (path → friendly area), `lib/adapters/templates.js
  SUGGEST` (template → destination), `lib/adapters/home.js STEERING_FILES` + `SURFACES`, and
  `lib/adapters/steering.js CORE`. A folder move, a new template, a new steering file or a new
  toolchain surface silently invalidates one of them. Checking that the paths still EXIST is
  not enough — the destination a template row suggests can point at a folder that is still
  there but no longer holds that kind of file. Read the row's meaning against the folder's own
  CLAUDE.md, which is where destinations are stated.
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
- [build-console.js](build-console.js) — Bakes the zero-setup snapshot; run by the build-console workflow on every push to main
- [console.html](console.html) — Light mode: the console as one read-only file, no runtime needed; auto-switches to a running full console

### Subfolders

- [lib/](lib/) — Server core (repo safety, policy, git, subprocess, markdown + YAML parsing) + one adapter per surface
- [web/](web/) — No-build ES-module frontend: shell, shared UI toolkit, one module per view
- [vendor/](vendor/) — Vendored marked 12.0.2 (MIT, header retained)
