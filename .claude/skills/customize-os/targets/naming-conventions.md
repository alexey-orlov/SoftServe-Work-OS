# Playbook — target: `naming-conventions`

Adopt the org's own terms for the three artifact names the OS ships with, and execute the
mapping repo-wide. Two parts: the one-time naming question (asked at this target's slot in
the guided sequence, or earlier the moment any template target is about to run — a house
template must title with the org's words), and the sweep that applies a chosen mapping.
Shared lifecycle, state, readout, and write rules: SKILL.md.

## The naming question (once per status file)

The OS ships three artifact names, used across templates, guidance, readouts, and
navigation:

- **PRD** — the initiative-level definition of a larger feature, written so the bet maps
  to business outcomes (problem, value, proof — not implementation detail). `/prd-draft`
  → `PRDs/{area}/{slug}-prd.md`.
- **Jobs** — the independently shippable slices an agreed initiative is cut into,
  sequenced riskiest-first. `/jobs-breakdown` → `{slug}-jobs-breakdown.md`.
- **Job specs** — the per-job buildable contract between PRD and tickets (rules, ACs,
  states, scope priorities). `/job-spec-draft` → `{slug}-{job}-job-spec.md`.

**Trigger:** the status file's header has no `naming:` field. Asked at this target's
sequence slot, and earlier only when a template target is invoked first (`status` mode
only reports the field). Explain the ladder above in the org's context, then ask ONE
question: keep these names, or map any of them to the org's own terms (brief, one-pager,
epic, slice, feature spec, story spec — partial maps are fine)? State the boundary
honestly BEFORE they choose: a mapping changes every human-facing surface — document
titles, headings, prose, readouts — while slash commands (`/prd-draft`,
`/jobs-breakdown`, `/job-spec-draft`) and machine identifiers (file and folder names such
as `PRDs/` and `*-job-spec.md`, template filenames, feature-index keys) keep the OS
names, because master-maintained skills read those literally and renaming them would fork
every skill for one instance — the same rule that keeps a house format a template swap,
never a skill fork. Net effect: their team types `/prd-draft` and gets a document titled
with THEIR word.

- **Keep** → write `naming: canonical (confirmed YYYY-MM-DD)` into the status file
  header. Never ask again. Target → `complete`.
- **Map** → a complete mapping, collected in the same question — not re-asked later:
  singular and plural of each house term, the compound document names the mapping implies
  (the jobs-breakdown document — default "{Jobs-term} Breakdown"), and the casing policy
  (proper noun everywhere, or lowercase mid-sentence — default: follow the org's own
  written usage; unseen, lowercase mid-sentence). Record it all in the header and run the
  sweep below (an originally requested target queues as next — name that in the readout).
  Until the sweep is `installed`, other targets take the mapping as an input (derived
  templates title with house terms) but repo prose still carries OS names — say so rather
  than letting it surprise. Documents created earlier in the guided sequence use OS names
  until this sweep renames them — that is expected, not drift.

## Derive the sweep

1. **Conventions block:** draft **Document Naming Conventions** for `business-info.md` →
   Product Development → Development Process (same pattern as Metric Reporting
   Conventions): the mapping table (OS term → house term with the naming-question
   decisions — plurals, compound document names, casing policy → one-line definition)
   plus three application rules — house terms in every human-facing surface agents write
   **from adoption day forward** (titles, headings, prose, readouts, tickets, Slack
   drafts); OS terms unchanged in machine surfaces (slash commands, file and folder
   names, template filenames, feature-index keys, document-internal ID schemes —
   enumerate them in the block); either term from the user resolves to the same artifact.
2. **Inventory, then classify — before editing anything.** `rg -n -i` every old-term
   variant (acronym, plural, possessive, hyphenated, spaced, spelled-out: `PRD(s)`,
   `product requirements document(s)`, `job spec(s)` / `job-spec`, `jobs breakdown` /
   `jobs-breakdown`, bare `job(s)` where it means a delivery slice). Classify EVERY hit
   into five classes: **rename** (prose in the mapped sense — living documents and
   forward-looking artifacts only) · **keep — machine identifier** (protected by SHAPE,
   not only by list: paths, filenames, index keys and key names quoted in comments, slash
   commands, backticked tokens, YAML and CI keys, `{placeholder}` tokens,
   document-internal ID schemes skills emit or parse (`J-1`, …), frontmatter or
   pseudo-frontmatter labels — a key-shaped token absent from the enumerated list is
   still machine: leave it alone and note it, never rename or re-case it mid-sweep) ·
   **keep — historical record** (the past keeps its words: verbatim transcripts are
   immutable and dated records are append-only per `governance/write-back-contract.md` —
   call/meeting summaries, decision entries, gate verdicts, filed reports and reviews,
   experiment docs, dated lesson and Activity lines. A March gate that said "PRD" still
   says PRD; no record may claim someone used a word before the org adopted it) · **keep
   — different sense** (jobs-to-be-done / JTBD research language, the customer's "job" in
   discovery and prioritization contexts, the product's own compute/cron jobs, unrelated
   uses) · **out of scope** (`.claude/**`, path-scoped whatever it contains — skills,
   agents, and hooks are master-maintained and stay universal; their readouts will still
   say the OS word — the conventions block is the bridge; note that to the user once).
   The counts per class are this target's derived artifact — record them in the status
   file.
3. **The sense rule that will bite:** a jobs→{X} mapping never touches jobs-to-be-done
   language. "The job behind the request", JTBD interview guides, and journey maps speak
   of the *customer's* job; only the delivery objects `/jobs-breakdown` and
   `/job-spec-draft` produce get renamed. When one sentence carries both senses, rename
   only the delivery one.

## Validate — audit the classification BEFORE applying

Spawn a fresh-context subagent given only the mapping, the boundary rules from the
conventions block, and the classified inventory (not your reasoning). It re-greps
independently and hunts five failure modes: sense errors (JTBD or customer-job hits
classed rename), boundary errors (machine identifiers classed rename), record errors
(transcripts, dated records, or quoted speech classed rename), missed variants (case,
plural, possessive, spaced/hyphenated/spelled-out forms absent from the inventory), and
files the inventory never visited. Fold fixes into the classification, re-run once if
anything changed, record the result. Phase → `validated` only then; the post-apply verify
lives in the install step.

## Install — apply file by file

1. Read the gated set from `governance/write-policy.yaml` at run time, never from a
   remembered list (it gates whole trees, not just the obvious files —
   `business-context/`, `handbook/templates/`, `engineering/`, `governance/`,
   `os-installation/`, `Documentation/`, `.claude/`, `.github/`, plus root `CLAUDE.md`,
   `feature-index.yaml`, and `toolchain.yaml` — comment lines but never their keys);
   gated files each pass the
   write prompt, auto-tier prose (folder `CLAUDE.md`s outside those trees, handbook docs
   outside `templates/`, worked examples, initiative pages, README) writes directly.
   Prose around a canonical token renames; the token stays verbatim: "cut the initiative
   into epics with `/jobs-breakdown`". Substitution is not the finish line — re-read
   every edited sentence: articles (a/an), doubled terms (the source's "per-job job
   specs" becomes "per-Epic specs", never "per-Epic Epic Specs"), casing registers (an
   ALL-CAPS line stays all-caps), and one treatment per surface (rows of the same table,
   items of the same list). Commit by tier — auto-tier normally; gated files in their own
   commit, landed deliberately per the policy.
2. **Post-apply verify** — re-run the full inventory; every remaining hit must fall in a
   keep or out-of-scope class (the run's own artifacts — conventions block, status file,
   decision record — intentionally name the OS terms in the mapping itself: expected, not
   residual), anything else gets fixed before the readout, and the residual counts by
   class go in the status file. Then the **mirror check**: any number or claim restated
   across the run's own artifacts must agree — a correction lands on every surface that
   carries it, or the other surfaces cite the status file instead of restating.
3. A stray template the pre-existing check (template playbook) left at a consuming path
   is replaced here. **Already-installed house templates** get their title and heading
   lines updated in the same run; not-yet-derived template targets record the mapping
   under **Inputs received**.
4. Companions: `/decision-log-entry` ("Adopted house naming: {map}" — boundary line
   included); house-template titles aligned or queued. All done → `complete`.
5. **Master repo: never sweep the master** — record the mapping, stage the conventions
   block with its "Install as:" header, and say in the readout that the sweep executes in
   the instance.
