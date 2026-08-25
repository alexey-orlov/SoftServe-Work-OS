# OS Console

A local web UI over this repo — friendly navigation, initiative grouping, steering-file
management, setup status, governance state, and the activity log, without touching the
underlying folder structure. Zero install: it runs on the Python 3.8+ standard library —
no packages, no package manager, nothing beyond the interpreter — with the frontend's one
MIT-licensed library vendored in `vendor/`.

**Read this when:** You want the human-facing window onto the OS, or you are extending it.

## Run

```bash
python3 os-console/server.py     # Windows: py -3 os-console\server.py
```

Then open http://127.0.0.1:4820 (set `OS_CONSOLE_PORT` to change the port). The server
binds localhost only.

No Python on the machine? Open [console-lite.html](console-lite.html) instead — the
zero-setup light mode below.

## Light mode — the zero-setup snapshot

`console-lite.html` is the whole console as ONE self-contained read-only file: the same
frontend with every view's data, all wiki file contents, a client-side search index, and
the built docs site baked in. Open it from the clone, a file share, or any static host —
no runtime, no install, nothing to approve. Built by `build-lite.py` (same Python stdlib);
on GitHub the `console-lite` workflow rebuilds and commits it on every push to main, so
the file in the repo is always the latest state of main. Azure instances run
`python3 os-console/build-lite.py` from a pipeline (or by hand) instead.

**Two modes, one behavior:** the light page probes `http://127.0.0.1:4820/api/ping`
(the server's one CORS-open endpoint — a static "I am the console" flag, no data) on
load and every 5 seconds, and the moment a full console is running on the machine it
hands off to it, keeping the current view. Until then the banner says what you have:
a read-only snapshot as of its source commit.

What light mode cannot do: edit anything (saves, initiative status, templates,
learnings all answer with a pointer to the full console), reflect changes newer than
its build, or show live pull requests. Per-user pins/recents work via the browser's
localStorage. Files over 300 KB are listed but their text is not embedded.

## How it relates to the OS

- **Everything displayed is derived** from the canonical registries — `governance/write-policy.yaml`,
  `product-development/feature-index.yaml`, `toolchain.yaml`, initiative pages, and folder
  CLAUDE.md navigation files. The console adds no second source of truth.
- **Writes respect the write policy.** One endpoint resolves every path against the policy's
  gated globs; gated files are badged in the UI and a save there is the person's approval
  (the human is the approver the gate exists for). The console never writes scripts, `.git/`,
  or anything outside the repo.
- **Every save commits immediately** (`console:` prefix, pathspec-limited) so concurrent
  Claude sessions never sweep console edits into their own turn-end commits. Pushing follows
  the auto-sync switchboard; in the `pr` strategy landing stays with the hooks and `/propose`.
- **Guided programs stay in Claude Code.** Setup steps, `/auto-sync` flips, and drafting
  skills are handed off as copyable commands, not reimplemented.
- **Pull requests & leaderboards** (Proposed changes, Home) shell the platform CLI
  read-only — `gh` for GitHub origins, `az` for Azure Repos, detected from the git
  origin — cached for 5 minutes. A missing or unauthenticated CLI degrades to an
  honest note, never an error.
- **Live refresh.** The server watches the repo (a polling scanner, `.git` noise
  filtered to ref/HEAD moves) and streams change events over SSE (`/api/events`);
  open views re-render automatically, within ~2s of a change. Auto-refresh holds back while the person is typing or has a
  modal open — the ⟳ button shows a dot and catches up on blur. Where `fs.watch` is
  unavailable the button alone still works.
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

- [server.py](server.py) — HTTP server: API routes, static files, SSE live refresh, localhost-only
- [state.json] — created on demand; per-user prefs overlay (gitignored)
- [build-lite.py](build-lite.py) — Bakes the zero-setup snapshot; run by the console-lite workflow on every push to main
- [console-lite.html](console-lite.html) — Light mode: the console as one read-only file, no runtime needed; auto-switches to a running full console

### Subfolders

- [pylib/](pylib/) — Server core (repo safety, policy, git, markdown + YAML parsing) + one adapter per surface
- [web/](web/) — No-build ES-module frontend: shell, shared UI toolkit, one module per view
- [vendor/](vendor/) — Vendored marked 12.0.2 (MIT, header retained)
