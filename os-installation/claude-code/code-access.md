# Product-Code Access — Mechanics

How a session in this Team OS gets read access to your product repositories. This page is
the *mechanics*; the rules for what counts as a grounded answer (the access-tier chain,
citation format, honesty rules) live in `.claude/references/code-grounding.md` — one
source of truth, don't restate it. Guided setup: `/connect-code`. Registry of repos:
`product-development/engineering/code-repos.yaml`.

## Why local-first

Claude Code navigates code the way an engineer does — file listing, grep, targeted reads —
and that works best on a local clone: full-power search, any branch, and git history for
"why is it this way?" and "is it live?". Remote APIs can only fetch known files (GitHub's
code search is rate-limited to ~10 requests/minute and indexes the default branch only),
and pre-generated docs drift from the code silently. So: clone locally, grant read access,
let the agent search live files.

## Granting access: `additionalDirectories`

Per teammate, per machine — in the **gitignored** `.claude/settings.local.json` at the
Team OS repo root (create it if missing; merge keys if it exists):

```json
{
  "permissions": {
    "additionalDirectories": [
      "/Users/you/code/beacon-app"
    ],
    "deny": [
      "Edit(//Users/you/code/beacon-app/**)",
      "Write(//Users/you/code/beacon-app/**)",
      "Read(//Users/you/code/beacon-app/**/node_modules/**)",
      "Read(//Users/you/code/beacon-app/**/dist/**)",
      "Read(//Users/you/code/beacon-app/**/.env*)"
    ]
  }
}
```

- **Absolute paths only.** Relative entries resolve against wherever the session starts.
- **The `//` prefix is deliberate** — that is how a permission rule anchors an absolute
  filesystem path (a single leading `/` anchors at the settings file instead).
- **Edit/Write denies = the read-only stance.** Sessions in this workspace answer from
  product code; they never modify it. Code changes stay in engineering's own workflows.
- **Read denies keep junk out of context** — vendored deps, build output, env files.
- One-off alternative for a single session: `claude --add-dir ~/code/beacon-app`.
- This file is machine-local. It never gets committed (the Privacy Contract bans
  machine-local setup from the repo) — verify with `git check-ignore .claude/settings.local.json`.

## The headless gotcha

Workspace trust applies these settings only after an interactive session has accepted the
workspace — and **`claude -p` (headless/cron) runs do not apply project-settings
`additionalDirectories` at all.** A scheduled job that needs code access must pass the
directory explicitly:

```bash
claude -p --add-dir ~/code/beacon-app "…"
```

Skills degrade honestly when access is missing (they say "no grounded code access" rather
than answering from documents) — so a cron run without `--add-dir` loses code grounding
loudly, not silently.

## Cloning

Default for any persistent clone — full history, blobs fetched on demand:

```bash
git clone --filter=blob:none <remote>
```

- **Never `--depth=1`** for a clone you keep: shallow clones must not be fetched from, and
  they break the history-based answers ("why was this changed?", "is it deployed?").
- **Monorepo:** add `--sparse`, then `git sparse-checkout set <the dirs the team asks
  about>` — only those directories hit disk.
- **Clone under the repo's registry slug** (e.g. `~/code/beacon-app` for the `beacon-app`
  entry) — sessions match access grants to registry entries by directory basename.
- **Auth is your existing git setup** (ssh key or credential helper). Nothing new is
  stored, no tokens anywhere in this repo.

## Non-GitHub hosts

Local access (clone + grant) is host-agnostic — GitLab, Bitbucket, self-hosted all work
identically. The remote *fallback* tier is GitHub-only (the GitHub MCP); for other hosts,
a local clone is the only grounded path.

## Going further

- **GitHub MCP** — remote fetch of known paths when no machine has a clone (default
  branch only; label the date). Connect via `/connect-mcps`.
- **DeepWiki MCP** (`https://mcp.deepwiki.com/mcp`, no auth) — generated wikis + Q&A for
  *public* repos; useful for the OSS frameworks you build on, not for private code.
- **Language-server plugins** (e.g. `/plugin install typescript-lsp@claude-plugins-official`)
  — symbol-level navigation ("who calls this?") that beats grep for engineers.
- **Claude Code on the web** — cloud sessions clone the repo into a managed VM
  (GitHub-hosted repos only); `additionalDirectories` doesn't apply there.

## See also

- `/connect-code` — guided version of everything above, plus registry entry and maps
- `/code-qa` — the PM-facing questions this access exists for
- `.claude/references/code-grounding.md` — the rules every code claim follows
- `product-development/engineering/code-repos.yaml` — the shared repo registry
