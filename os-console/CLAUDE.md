# OS Console

A local web UI over this repo — friendly navigation, initiative grouping, steering-file
management, setup status, governance state, and the activity log, without touching the
underlying folder structure. Zero install: it runs on the Node.js already required by
the docs build, with its two MIT-licensed libraries vendored in `vendor/`.

**Read this when:** You want the human-facing window onto the OS, or you are extending it.

## Run

```bash
node os-console/server.js
```

Then open http://127.0.0.1:4820 (set `OS_CONSOLE_PORT` to change the port). The server
binds localhost only.

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
- **Live refresh.** The server watches the repo (`fs.watch`, `.git` noise filtered to
  ref/HEAD moves) and streams change events over SSE (`/api/events`); open views
  re-render automatically. Auto-refresh holds back while the person is typing or has a
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

- [server.js](server.js) — HTTP server: API routes, static files, localhost-only
- [state.json] — created on demand; per-user prefs overlay (gitignored)

### Subfolders

- [lib/](lib/) — Server core (repo safety, policy, git, markdown parsing) + one adapter per surface
- [web/](web/) — No-build ES-module frontend: shell, shared UI toolkit, one module per view
- [vendor/](vendor/) — Vendored js-yaml 4.1.0 + marked 12.0.2 (MIT, headers retained)
