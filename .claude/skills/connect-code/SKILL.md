---
name: connect-code
description: Set up grounded code access for the team — run once by the OS admin to register a repo in engineering/code-repos.yaml (committed), then once per teammate to clone and grant access on their own machine (never committed, clone location free). Registers product repos in engineering/code-repos.yaml (purpose and covers keywords in the team's own words, entry points, optional deployed ref), guides the blob-filtered clone (sparse for monorepos), grants machine-local read access via permissions.additionalDirectories in the gitignored .claude/settings.local.json with read-only deny rules, and optionally generates a SHA-stamped codebase map for large repos. --refresh re-pulls clones, regenerates drifted maps, and bumps last_validated. Machine-local paths and tokens never land in the shared repo. Use on /connect-code, "connect our codebase / product code", "set up code access", "refresh the code maps", or when /code-qa reports no grounded access. NOT for connecting MCP tool servers (/connect-mcps) or answering code questions (/code-qa).
modifies-workspace: true
group: os-admin
---

# connect-code — register product repos and grant grounded access

`/code-qa` can only cite code it can reach. This skill does the reaching: one shared
registry entry per repo (committed), one machine-local access grant per teammate (never
committed), and — only for large repos — a SHA-stamped map. Access rules and the tier
chain live in `governance/code-grounding.md`; this skill implements them.

## Quick Start

```
/connect-code                → guided setup; picks admin or teammate run automatically
/connect-code --refresh      → re-pull clones; admin run also refreshes maps + last_validated
/connect-code <repo-url>     → same, remote pre-filled
```

## Two kinds of run — decide this first

Read `product-development/engineering/code-repos.yaml` BEFORE anything else. Whether the
repo already has an entry decides which run this is:

| | **Admin run** — repo not registered yet | **Teammate run** — entry already there |
|---|---|---|
| Who | the OS admin, once per repo | everyone else, once per machine |
| Steps | 1 → 6 | 2, 3, 6 only |
| Writes (committed) | the registry entry, + a map for large repos | **nothing** |
| Writes (machine-local) | clone + access grant | clone + access grant |

The admin run ends by **committing** the registry entry — that is the only way teammates
receive it. A teammate run never touches the registry: it reads the entry someone else
committed, then clones and grants on this machine alone. Same repo, and each teammate's
own clone location.

Say which run it is in the first line of your reply, so the user knows whether this
session will change the shared repo.

## When to Use / When NOT

**Use when:** first-time setup, adding a repo, a new teammate needs local access, maps or
`last_validated` have gone stale (wiki-lint check 11 flags this).

**NOT for:** connecting MCP servers (`/connect-mcps`) · asking code questions (`/code-qa`).

## Prerequisites

- `git` installed; your existing git credentials are the clone auth — this skill never
  stores a token anywhere.
- The repo's https or ssh URL and read permission on it.

## Step 1 — Inventory the repo *(admin run only)*

Read `product-development/engineering/code-repos.yaml` (create from its header conventions
if missing). For the new repo, elicit in the team's own words:

- `purpose:` — one sentence.
- `covers:` — the product-area keywords the team actually uses. This is `/code-qa`'s main
  routing signal; it does NOT need to match feature-index granularity.
- `feature_keys:` — ONLY if feature-index keys map cleanly to this repo; otherwise omit
  (never force the mapping).
- Monorepo? (>12 top-level dirs, multiple apps/services) → note it for Steps 2 and 5.
- **No access possible** (code sits in another org, agency setup)? Record the entry anyway
  with `access_tier: none` or `map-only` — the routing knowledge still helps `/code-qa`
  refuse honestly and route questions to the right engineers.

## Step 2 — Clone

Default, for any persistent clone:

```bash
git clone --filter=blob:none <remote>
```

- Never `--depth=1` — a shallow clone breaks the git-history playbooks (`why does it work
  this way`, `is it live in production`).
- Monorepo: add `--sparse`, then `git sparse-checkout set <dirs the team asks about>`.
- **Where it goes is each teammate's own choice** — `~/code/`, `~/dev/`, an external
  drive. No shared file ever records it, so teammates never need to agree on a path.
- **The one rule: the directory's NAME must equal the registry key** (`beacon-app` →
  `<anywhere>/beacon-app`). Sessions match an access grant to its registry entry by
  directory basename, never by full path — that is what lets the same committed entry
  serve every machine. A renamed folder silently stops matching.

## Step 3 — Grant machine-local access (per teammate, never committed)

Merge into `.claude/settings.local.json` (gitignored — verify with `git check-ignore`;
create the file if missing, merge keys if present, never drop existing entries):

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

- The **Edit/Write denies are the read-only stance**: PM sessions never modify product
  code. The Read denies keep junk paths out of context. Note the `//` prefix — that is how
  a deny rule anchors an absolute path.
- Absolute paths only (relative paths break when a session starts elsewhere).
- **Headless gotcha:** `claude -p` runs don't apply project-settings directories
  (workspace trust) — cron jobs must pass `--add-dir` explicitly. Details:
  `os-installation/claude-code/code-access.md`.

## Step 4 — Registry entry *(admin run only — committed)*

Fill the entry per the conventions header in `code-repos.yaml`: remote, default_branch,
language, purpose, covers, access_tier (the best tier now genuinely set up), entry_points
(verify against the clone — a quick `ls` beats a guess), exclude, optional
`deployed_ref:` — ONLY a ref the team's release process already maintains (release branch
or tag pattern); nothing to invent, nothing to hand-copy. `last_validated:` today.

## Step 5 — Map *(admin run only; optional, large repos only)*

Offer a map only when grep-first navigation will genuinely hurt: monorepo, >12 top-level
dirs, or a root file listing in the thousands. Otherwise skip — most repos need none.

When generating: dispatch a code-explorer ("medium" depth) for the top-level layout, entry
points, and 2–3 key flows; write `engineering/codebases/{slug}.md` in the format of the
existing example (header stamps `{repo}@{full-sha}` + date + "routing hint only"), ≤150
lines; record the `map:` block (engineering-relative path, full sha, date) in the registry.

## Step 6 — Verify

Dispatch one quick code-explorer smoke question against the clone. Pass = a real
`repo@sha path:L…` citation comes back and Edit attempts are denied. Then tell the user
what `/code-qa` can now answer.

## --refresh mode

Per registered repo with a local clone on this machine: `git pull` (or fetch + status
report if the working tree is dirty) → compare each map's `generated_at_sha` to the new
HEAD and regenerate drifted maps (Step 5 format) → re-resolve `deployed_ref` sanity →
bump `last_validated`. Report per-repo: pulled / map regenerated / skipped and why.

Run-aware, same split as above: **pulling clones is machine-local and anyone may do it.**
Regenerating maps and bumping `last_validated` writes the shared registry — admin run
only. A teammate `--refresh` pulls, reports any drift it spots, and leaves the registry to
the admin; otherwise every teammate generates competing commits on the same lines.

## Rules

1. **Privacy contract:** no machine-local absolute paths, no tokens, ever, in any
   committed file. Machine truth lives in `.claude/settings.local.json` only — and this
   skill verifies that file is gitignored before writing it.
2. **One writer:** this skill is the sole writer of `code-repos.yaml` and
   `engineering/codebases/*.md` (write-back contract, one-writer table). `/code-qa`
   writes nothing.
3. **Honest tiers:** if local access isn't achievable, record `github-mcp` / `map-only` /
   `none` — never leave a tier the team hasn't actually set up.
4. **Maps route, never prove** — and only large repos get one.

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   `CLAUDE.md` (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Feature-scoped artifact → propose the `product-development/feature-index.yaml` addition
   and apply it only after the user confirms (Tier 2 in `governance/write-policy.yaml`).
   Initiative-scoped → link the artifact from `product-development/product/initiatives/{slug}.md`.
3. In the artifact's header, link the source material it was derived from.
4. **Admin run — commit** the registry entry (and any map + nav lines) with a
   `context:` prefix. Uncommitted, no teammate ever receives it and every one of them is
   forced into a needless admin run. Teammate run: commit nothing, and confirm
   `git status` shows the shared repo clean.
5. End your reply by listing every repo path you wrote or updated — committed and
   machine-local under separate headings, so nobody mistakes a local path for shared state.

## Related

- `/code-qa` — after this: the questions this setup exists for
- `/connect-mcps` — MCP tool servers, including the GitHub MCP fallback tier
- `/wiki-lint` — check 11 polices registry freshness and map drift

## Quality self-check (before presenting)

- [ ] The run was named (admin or teammate) and the steps taken match that run
- [ ] Clone directory's basename == the registry key, whatever the parent path
- [ ] `.claude/settings.local.json` written, valid JSON, and NOT tracked by git
- [ ] Edit/Write denies present for every granted product repo (read-only stance)
- [ ] **Admin run:** registry entry parses (YAML), `last_validated` = today, tier is
      honest, and the entry is **committed**
- [ ] **Teammate run:** `git status` clean — the registry was read, never written
- [ ] Map (if generated) ≤150 lines, stamped `{repo}@{full-sha}` + date, registered in `map:`
- [ ] Navigation rows appended at the END of their lists
- [ ] Run summary lists every path written — committed and machine-local separately
