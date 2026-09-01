---
name: wiki-lint
description: Health-check the team wiki and tidy it. Reads every page and index, fixes the small mechanical things on the spot (a file missing from its folder's contents list, a folder with no contents list, an out-of-order or duplicated processed-files list), and hands you a short plain-language readout of everything that needs a person — pages nobody has touched in months, links that lead nowhere, the same fact disagreeing in two places, feature-index gaps, unfinished setup text, [PENDING:]/[GAP:] markers and proposals past two weeks — each with a suggested change, an owner, and a number to say yes with; nothing beyond the mechanical is applied until you do. Writes a dated report to governance/health/. --report-only looks without touching anything; --schema-drift also compares table descriptions with the warehouse. Use on /wiki-lint, "is the repo healthy?", "check / tidy the wiki", "what's stale?", weekly as automation, or before quarterly planning. NOT for one feature's pre-launch completeness (/feature-launch-gate) or folding new material in (/context-update).
argument-hint: "[--report-only] [--schema-drift]"
group: os-admin
---

# wiki-lint — the repo's health check

Reads the whole wiki, fixes what has exactly one right answer, and tells you about the rest
in plain language — each item with a suggested change and a number to say yes with. Two
audiences: this file speaks to the agent in repo terms; **everything the agent shows the
user (chat readout, report, prompt text) follows the plain-language contract below.**

One engine, twelve checks. The GitHub Action (`.github/workflows/wiki-lint.yml`) runs the
mechanical subset on PRs and weekly via `.github/scripts/wiki-lint.sh` — it reports only,
never repairs. This skill is the full pass: run the script first, do the judgment checks the
script can't, then repair and suggest.

## Modes

- **Default — fix the mechanical, suggest the rest.** Runs all twelve checks; applies the
  MECHANICAL repairs (defined below) on the spot; every other finding goes to a "Needs your
  decision" list with a concrete suggested change per item — none applied until the user
  says yes. Writes the dated report.
- **`--report-only`** — look, don't touch: same checks, same suggestions, no repairs (the
  report itself is still written). For a first look at a new repo, before a review, or when
  someone wants to see everything before anything moves. (`--fix` from earlier versions is
  today's default — accept the flag silently.)
- **`--schema-drift`** — additionally compare `analytics/schemas/` docs against the warehouse
  `INFORMATION_SCHEMA` (skip with a note when no warehouse access is configured).

## Mechanical vs judgment — the line that decides what gets fixed

**Mechanical (repaired by default):** the finding fully determines the repair, there is one
correct answer, and no content is lost. Exactly these four:
- a content file missing from its folder's CLAUDE.md list → append a nav line, generated
  from the file's own first heading / description, at the END of the list;
- a directory with no CLAUDE.md → generate the 5-line stub;
- the ledger (`governance/processed.txt`) out of order or with duplicate lines → `sort -u`;
- a nav list where duplicated entries collided → re-order those entries only (the one
  sanctioned re-sort in the repo — see the write-back contract).

**Judgment (suggested, never applied without a yes):** everything a person could reasonably
decide differently — what to do with an untouched page (update / confirm / archive), a link
whose target vanished (repoint or drop), an artifact under no feature (which feature owns
it), two places that disagree (which is right), a placeholder, an aging marker or proposal,
a learning past its cap, a stale code registry. Each still gets a suggested change — the most
likely fix given context — so the yes is one word.

**The write policy applies to repairs too.** On auto-tier files (most of
`product-development/`) a mechanical repair is written directly. On gated paths
(`governance/`, `.claude/`, `os-installation/`, `engineering/`, `business-context/`,
templates, root `CLAUDE.md`, `.github/`) the write-guard raises its 🔒 prompt — that prompt
IS the approval: one per file, approve or reject each. Announce before the first one: *"N
repairs touch protected files — you'll get N approval prompts; approve or reject each."*
The report and its `health/CLAUDE.md` line live in a protected folder too — count those
two prompts in, every run. Headless / scheduled runs can't ask: auto-tier repairs are
applied, gated ones are filed as a proposal in `governance/proposals/`. Never bypass the
guard (no Bash writes to gated paths).

## The twelve checks

Each check keeps its number (other skills cite them) and reports under its plain name.
*Fix* = mechanical repair applied by default; *Suggest* = the default suggested change
carried into the readout.

1. **Staleness** — *"Pages nobody has touched in a while."* Last-modified via
   `git log -1 --format=%ct -- <file>` over `product-development/`, `governance/`, and
   `os-installation/`. Tiers: Fresh <30d ✅ · Aging 30–90d 🟡 · Stale 90–180d 🟠 · Archive
   candidate 180+d 🔴. Skip paths in `.freshness-ignore` (wildcards ok) and stable references
   (`analytics/schemas/`, `os-installation/`, `.claude/`, `LICENSE`) — note those as "stable
   reference material". Cross-reference `feature-index.yaml`: a metrics/queries file untouched
   since its feature shipped is flagged "should-have-been-updated". Flag `[PENDING:]` and
   `[GAP:]` markers older than 14 days (same aging rule — a gap named two weeks ago and never
   closed is drift, not intent). Suggest: per page — update (say what changed), confirm still
   current, or archive — pick the likeliest from context (active initiative → update; decision
   record → confirm; superseded doc → archive); per marker — the concrete way to close it,
   read from the marker text.
2. **Navigation coverage, both directions** — *"Folder contents lists (the CLAUDE.md files)."*
   Every directory under `product-development/` and `governance/` has a `CLAUDE.md`; every
   content file appears in its folder's CLAUDE.md list; every nav line's target exists on
   disk. Queue folders with transient contents (`product-development/inbox/`,
   `governance/proposals/`) are exempt from the per-file nav requirement — their CLAUDE.md
   describes the queue, not its contents. Fix: missing lines, missing stubs. Suggest: a nav
   line whose target is gone — repoint when exactly one file with that name exists elsewhere
   (name it), otherwise drop the line.
3. **Product catalog** — *"The product map (areas → features)."* v2 catalog shape: every
   feature carries `status: planned | live | retired`; `shipped:` dates are YYYY-MM-DD;
   feature slugs are globally unique (one feature, one area). Legacy artifact-map shape
   (mid-migration instances — readable forever): every path resolves; every slug in an
   `initiatives:` list has a page in `product/initiatives/`. Suggest: the exact catalog
   line to add or fix (gated — the guard prompts), or the legacy→catalog conversion.
4. **Broken cross-references** — *"Links that lead nowhere."* Markdown links and backticked
   repo paths across `product-development/`, `governance/`, and `.claude/` that point at
   nothing — **every content file, not only the folder contents lists** (those are check 2b;
   this is the whole repo). Blank scaffolds are exempt: `handbook/templates/` and
   `PRDs/examples/` link illustratively, and `{placeholder}` targets never resolve.
   **Staging provenance:** a durable page whose link points at a FILE inside
   `product-development/inbox/` is flagged — the inbox is transient, so that citation breaks
   the day filing drains it (folder-level references and nav files are fine). Suggest:
   repoint (unique same-name file found) or remove; for a staging citation, repoint at the
   filed home; group by source page.
5. **Initiative-page health** — *"Initiative pages."* Every `initiatives/*.md` has a status
   + updated date (frontmatter `status:`/`updated:`, or the legacy `_status:`/`_updated:`
   lines — both readable); ACTIVE pages with no artifact/activity change in 30+ days flagged
   — closed pages (`shipped` / `killed`) are exempt, they never move again by design; every
   artifact link on the page resolves. Join symmetry — **every artifact class, not only
   records**: whatever names an initiative slug must appear on that page (write-back-contract
   rule 8). Decision records are linked from the Decisions section; meeting/call summaries get
   a matching Activity line; and **PRDs, jobs breakdowns, job specs, `reviews/` artifacts,
   syntheses and launches get their Artifacts row plus a dated Activity line** — the class
   that used to go unchecked, and so the class that silently went missing. One-way: pages may
   link records that don't name them. **`[PENDING: path]` means "planned but not written yet"**
   (initiative-page template), so a PENDING marker whose file EXISTS is an error, not a gap —
   the page tells a reader the artifact does not exist while it sits on disk. The same
   symmetry governs the per-customer view: every call summary under
   `accounts/{slug}/calls/summaries/` is reachable from that account's `account-context.md`
   History. Suggest: the missing values; the missing Decisions / Activity / Artifacts line,
   quoted and ready to append; the PENDING marker replaced by the real link; "still
   active? — mark it paused, or close it (shipped / killed)" for the quiet ones.
6. **Living-page registry** — *"Always-current pages."* Every glob in
   `write-policy.yaml#living-pages` matches at least the expected files; each living page
   carries an updated date (`updated:` frontmatter or legacy `_updated:`); each is within
   its ≤120-line budget (folder CLAUDE.mds ≤80; root
   CLAUDE.md ≤150; `segmentation-matrix.md` ≤200 — table-heavy by design). Suggest: add the
   header; for an over-budget page, name the sections to trim or move to a subfolder.
7. **Mirror consistency** — *"The same fact in two places that disagree."* The root CLAUDE.md
   fundamentals block vs `business-info.md`, field by field (company, ICP, model, north star,
   competitors, quarter focus); `segmentation-matrix.md` General-matrix totals vs the ARR /
   paying-accounts figures in both, and every `portfolio.yaml` segment label (`vertical`,
   `size_band`, `use_cases`) vs the matrix's canonical axes; `current-quarter.md`'s quarter
   label vs today's date; "Decided by" names in recent decisions vs the team roster. Suggest:
   quote both values, name the side that looks current (newer commit, or the source of truth
   under the mirror rule) and offer to copy it to the other — the human picks.
8. **Ledger integrity + learning loop** — *"The processed-files list, and team learnings."*
   Every ledger path exists on disk; ledger is sorted and duplicate-free; unprocessed backlog
   count (the `/context-update` discovery `comm`); proposals in `governance/proposals/` older
   than 14 days flagged. Inbox arrivals are ledgered under their destination path after the
   move (junk under its inbox path). **Staging hygiene — filing MOVES:** an inbox file that a
   filed transcript or account page cites as its source was *copied*, not moved, and the
   conversation now exists twice. Report it as duplication ("the file is in two places"), not
   as an unprocessed backlog — the backlog count above will also see it, and the wrong
   diagnosis sends the user to re-process a record that is already filed. Learning loop:
   `.claude/team-learnings.md` entry lines
   over the ~30 cap flagged (capture-loop rule: prune the weakest), and entries older than
   180 days flagged for re-validation. Fix: sort + dedupe. Suggest: a ledger line whose file
   is gone — drop it (or repoint if the file moved); a backlog — "run `/context-update`"; each
   old proposal — apply or reject, with one line on what it asks; learnings — the weakest
   entry to prune, or "still true? keep / drop" per old entry.
9. **Placeholder / truncation scan** — *"Unfinished setup text."* `[Your `, `[FILL IN]`,
   `[NEED:` outside `handbook/templates/`, `PRDs/examples/`, and the root-CLAUDE.md setup
   blocks (report as "setup not finished" on a fresh clone, warning not failure); nav
   description lines that end mid-word (the truncation bug class). Suggest: the field to fill
   and where the value lives (`/customize-os` for the setup blocks); for a cut-off line, the
   full description taken from the file's own heading — one yes and it's written.
10. **YAML parse** — *"Index and registry files that can't be read."* `feature-index.yaml`,
    `data-catalog.yaml`, `write-policy.yaml`, `portfolio.yaml`, `engineering/code-repos.yaml`
    all parse. A parse failure is ⛔ blocking — every skill that reads the file is broken.
    Suggest: the line and the likely cause (indent, stray colon, unquoted bracket) in words.
11. **Code-grounding registry** *(judgment, skill only)* — *"The code registry."* When
    `engineering/code-repos.yaml` exists: every `last_validated` within 90 days; IF
    `feature_keys` are present they resolve in `feature-index.yaml` (the field is optional —
    absence is fine); every `map.path` resolves on disk AND every file in
    `engineering/codebases/` has a registry entry pointing at it (both directions); each map
    carries its `{repo}@{full-sha}` stamp. Best-effort when a local clone is reachable via
    `additionalDirectories`: report each map's commits-behind count vs the clone's HEAD (the
    GitHub Action can't — no clones on the runner). Placeholder remotes (`your-org`) → "code
    grounding: setup not finished" warning, not a failure. Suggest: "run `/connect-code
    --refresh`" for stale entries or drifted maps; the exact registry line for an
    unregistered map.
12. **Link contract** — *"How work is connected."* Per `governance/link-schema.yaml`:
    every initiative page names at least one target feature/area that resolves (an
    unmapped initiative cannot exist) and carries a valid status
    (exploring | active | paused | shipped | killed); every PRD / jobs-breakdown /
    job spec / launch names its initiative — frontmatter `initiatives:`, or a filename
    the lint can derive it from (Fix: write the derived frontmatter); slugs stay unique
    across areas + features + initiatives; a slug referenced but still pending in
    `governance/proposals/` is a warning, not an error. Legacy formats (italic meta
    lines, `**Initiative:**` headers, anchor targets) are readable forever — Fix:
    convert to frontmatter, content unchanged. Suggest, for an artifact whose
    initiative can't be derived: "attach to {likeliest initiative} / create a new one" —
    one keystroke each. Tier mechanics for fixes: auto-tier → applied silently;
    gated + in-session → ONE batched prompt covering all of the run's gated fixes;
    headless → a proposal file.

**The plain-language contract** (applies to the chat readout, the report body, and any prompt
text this skill composes). The reader is a PM or a teammate who has never opened a terminal.
- Three buckets, always in this order: **✅ Fixed for you** · **🟡 Needs your decision** ·
  **🟢 Fine**. ⛔ marks a blocking item (a file that can't be read, a broken index) at the
  top of "Needs your decision".
- Every "Needs your decision" item = **what** (in words) + **where** (the page's plain name,
  path in backticks) + **suggested change** (one sentence, concrete) + **owner** (from the
  team roster) + a number to say yes with. Same-kind items beyond three collapse to one line
  with a count; the full list lives in the report.
- How to accept, stated once at the bottom: *"apply 2", "apply all", "skip 4", "confirm 3"
  — I'll show the exact edit, then make it (protected files still ask at the write prompt).*
- Words: say "folder contents list" not nav / navigation coverage; "the processed-files
  list" not ledger; "link that leads nowhere" not broken cross-reference; "not listed under
  any feature" not orphan; "out of date" / "doesn't match" not drift; "the same fact in two
  places" not mirror; "untouched for N days / months" not staleness tier; "can't be read
  (formatting error)" not YAML parse; "table description" not schema; "the header lines" not
  frontmatter; "name" not slug; "sorted, duplicates removed" not sort -u; "protected file
  (needs your approval to change)" not gated / tier. No shell commands, no check numbers, no
  hook names in the readout — those live in the report's appendix. Skill names
  (`/context-update`, `/connect-code`) are fine: they are the buttons the user presses.
- Numbers over adjectives ("6 pages untouched for 4+ months" beats "significant staleness").
- Cap the chat readout at ~25 lines; the report holds everything.

**1. Chat readout** — template:

```
Wiki health — {YYYY-MM-DD}: {one-line verdict, e.g. "tidy; 5 things need a decision"}

✅ Fixed for you ({n})
- Added {k} files to their folder's contents list ({folders})
- Processed-files list sorted, {k} duplicate lines removed
- 🔒 {k} of these touched protected files and went through your approval prompt ({approved} approved, {rejected} rejected)

🟡 Needs your decision ({n}) — nothing here changes until you say so
1. ⛔ {what} — {where}. → {suggested change}. Owner: {name}
2. {what} — {where}. → {suggested change}. Owner: {name}
   …
Say "apply 2", "apply all", "skip 4" or "confirm 3" — I'll show the exact edit, then make it
(protected files still ask at the write prompt).

🟢 Fine — {clean areas, in plain names}
Full detail (paths, per-check counts): governance/health/{YYYY-MM-DD}-wiki-lint.md
```

**2. Dated report** `governance/health/{YYYY-MM-DD}-wiki-lint.md`, plus its line appended to
`health/CLAUDE.md` (`- [{date}-wiki-lint.md]({date}-wiki-lint.md) — {verdict}`). The
session-start hook injects the report's first 12 lines into every session, so the head IS
the briefing — exactly this shape:

```
# Wiki health — {YYYY-MM-DD}
_verdict:_ {one line}
_fixed:_ {n} · _needs a decision:_ {n} · _fine:_ {n} of 12 checks · _mode:_ {default | report-only}
_links:_ {n} broken · {m} unknown names   ← the link-health line; session-start prints this head
_top decisions:_
1. {what — where → suggested change (owner)}
2. …
3. …
_full readout below · re-run /wiki-lint after acting on these_
```
Then, in order: **Fixed for you** (each edit, before → after in one line) · **Needs your
decision** (the full list, grouped by kind, owner and suggested change per item) · **Fine** ·
**Technical appendix** (per-check counts 1–12, raw findings with paths, staleness table by
tier and owner, the script's own output — for the person doing the fixing and for the
Action-vs-skill agreement). If 30%+ of non-ignored files are stale: prepend the
recovery-session block (1 hour, divide stale files among owners, update / archive / confirm
each, re-run).

**3. Acting on a yes.** "apply N" → show the exact before / after in chat, write it through
the normal path (the guard prompts on gated files), mark the item `applied {date}` in the
report. "confirm N" (untouched page) → stamp its `updated:` frontmatter / `Last verified:` line with today (converting a legacy `_updated:` line to frontmatter in the same edit) — i.e. with
today's date when the page has one; otherwise say plainly that it will show up again until
it is edited or archived. "skip N" → leave it, note `skipped {date}` in the report so the
next run says "skipped last time". Never act on an item without one of these.

## Rules

1. Mechanical repairs only, by default; never auto-delete or auto-archive; never rewrite
   prose, resolve a contradiction, or touch staleness without a yes on the specific item.
   Commit the repairs as `context: wiki-lint` (skip when auto-sync owns git); gated files are
   never auto-committed — the user lands them.
2. Assign findings to owners using the team roster in root CLAUDE.md.
3. This skill is the single writer for `governance/health/`.
4. Slack post of the readout is additive when the MCP is connected — the repo report is
   written regardless.
5. The Action and this skill must agree: `.github/scripts/wiki-lint.sh` implements checks
   2–4 and 8–10 mechanically (report only — repairs are this skill's); when you change a
   check here, change the script in the same PR (gated — steward). Its messages follow the
   same plain-language contract.
6. Plain language is a rule, not a style: a readout that says "nav coverage", "ledger",
   "YAML", "orphan", "drift" or "gated" to the user is a defect — fix the wording before
   sending.
