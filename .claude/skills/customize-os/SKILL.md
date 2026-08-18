---
name: customize-os
description: Adapt a deployed instance of this OS to a customer or org — interactive and resumable. Opens by confirming artifact naming (PRD / jobs / job specs — keep, or map to the org's terms; a mapping is executed repo-wide by the naming-conventions target: conventions block in business-info.md plus the full prose sweep, with machine identifiers and slash commands kept canonical). Reads customization state first, asks only for missing inputs, derives customized context files from the org's real artifacts, installs behind the gated write prompt, and ends every run with a readout — what changed and where, plus what's still needed (Critical / Other) — after asking, once per instance, which auto-sync mode the org wants (direct or pr) and turning it on with your yes. Progress persists in os-installation/customization-status.md across sessions (/customize-os continue). Template targets — house PRD, jobs-breakdown, and job-spec formats (each derived from 2–4 example documents); pre-existing templates that entered the repo outside the skill are flagged, captured as inputs, and removed with approval. House formats land in customer instances only — in the master repo it stages output outside the repo. Use on /customize-os, "customize this OS for {customer}", "adopt our PRD format", "rename PRDs/jobs to our terms", "continue customization", "where does customization stand?". NOT for connecting tool servers (/connect-mcps), code access (/connect-code), or drafting an actual PRD (/prd-draft — run it after the template is installed).
argument-hint: "[target|continue|status] [example file paths...]"
group: os-admin
---

## Quick Start

```
/customize-os                        → read state; resume the top in-progress target, or start guided
/customize-os continue               → same, explicit
/customize-os status                 → report progress across all targets; change nothing
/customize-os naming-conventions     → adopt the org's own terms for PRD / jobs / job specs, repo-wide
/customize-os prd-template ~/a.docx ~/b.docx   → run one target with inputs up front
```

**Every run ends the same way:** the closing readout (Step 6) — what changed and where, what's still missing (Critical / Other), and the saved state that lets the next session pick up exactly here.

---

# /customize-os — Fit the Instance to the Org

The OS's skills are universal; everything org-specific lives in customized context files (see `.claude/team-learnings.md`). This skill is the guided, resumable way to produce those files from the org's real artifacts instead of hand-writing them. Customization is a program, not a session: state persists, steps close one at a time, and any session can continue where the last one stopped.

## The target lifecycle

Every target — current and future — moves through the same five phases, tracked in the status file:

```
not started → gathering → derived → validated → installed → complete
```

`installed` = the artifact is live at its consuming path. `complete` = companions done too (conventions blocks, decision log entry). A target can sit at any phase between sessions.

## State — the status file

**Location:** where the outputs land. Customer instance → `os-installation/customization-status.md` (auto tier — updated without prompts, committed with the instance). Master-repo staging runs → `{staging folder}/customization-status.md` beside the staged artifacts, outside the repo — engagement state never lands in the master.

**Read it FIRST on every invocation; update it LAST on every run.** Create it on first run:

```markdown
# Customization Status — {Org}
_updated: YYYY-MM-DD · mode: instance | staging ({path}) · naming: canonical (confirmed YYYY-MM-DD) | house — {OS term → house term, …} (mapped YYYY-MM-DD) · auto-sync: direct | pr (chosen YYYY-MM-DD, on | not yet on) | undecided_

## {target}
- **Phase:** gathering | derived | validated | installed | complete
- **Artifacts:** {what} → {path} (one line each, including staged drafts)
- **Inputs received:** {example paths, house rules confirmed} (paths may be machine-specific — re-ask if unreachable, don't fail)
- **Open — Critical:** {what blocks closing this phase — how to provide it}
- **Open — Other:** {what would improve the result — not blocking}
- **Log:** YYYY-MM-DD — {one line per session: what moved}
```

`status` mode prints a per-target summary from this file and exits.

## Interaction contract

- **State and repo before questions.** Read the status file, then look for answers in the repo and any documents the user pointed at (an org SOP often answers approval-ladder and naming questions — quote what you found, confirm, don't re-ask).
- **Open with one compact question set** covering only the genuinely missing inputs — not an interview, not one-question-at-a-time for things that batch naturally.
- **Follow-ups mid-run are expected**, whenever derivation hits something only the user can settle: examples disagree on structure, an evidence slot has no natural home, a house rule is unknowable from the artifacts, the install destination is ambiguous. Ask the specific question, with your recommended default first.
- **Never invent an answer to avoid a question; never block silently.** If the user isn't available to answer, take the recommended default, mark the item **Open — Critical** or **Open — Other** in the status file, and say so in the readout.

## Instance vs. master — where am I?

House formats belong to the customer instance **only** — the master repo stays format-neutral: the installed template owns document structure, the skill keeps the method, so a house format is one gated template swap per instance and never a skill fork. Confirm once per status file which repo this is (record it as `mode:`):

- **Customer instance** → install targets at their consuming paths, gated prompt per file.
- **SoftServe master** (placeholders like `[Your Product]` in root CLAUDE.md, SoftServe credits) → never overwrite universal defaults. Derive and validate as normal, **stage** outputs in the engagement's project folder (ask where, once) with an "Install as:" header naming the instance path.

## Step 0 — Confirm artifact naming (once per status file, before any target)

The OS ships three artifact names, used across templates, guidance, readouts, and navigation:

- **PRD** — the initiative-level definition of a larger feature, written so the bet maps to business outcomes (problem, value, proof — not implementation detail). `/prd-draft` → `PRDs/{area}/{slug}-prd.md`.
- **Jobs** — the independently shippable slices an agreed initiative is cut into, sequenced riskiest-first. `/jobs-breakdown` → `{slug}-jobs-breakdown.md`.
- **Job specs** — the per-job buildable contract between PRD and tickets (rules, ACs, states, scope priorities). `/job-spec-draft` → `{slug}-{job}-job-spec.md`.

**Trigger:** the status file's header has no `naming:` field — first run, or first run since this step existed. Runs before Step 1 in every mode except `status` (which only reports the field). Explain the ladder above in the org's context, then ask ONE question: keep these names, or map any of them to the org's own terms (brief, one-pager, epic, slice, feature spec, story spec — partial maps are fine)? State the boundary honestly BEFORE they choose: a mapping changes every human-facing surface — document titles, headings, prose, readouts — while slash commands (`/prd-draft`, `/jobs-breakdown`, `/job-spec-draft`) and machine identifiers (file and folder names such as `PRDs/` and `*-job-spec.md`, template filenames, feature-index keys) keep the OS names, because master-maintained skills read those literally and renaming them would fork every skill for one instance — the same rule that keeps a house format a template swap, never a skill fork. Net effect: their team types `/prd-draft` and gets a document titled with THEIR word.

- **Keep** → write `naming: canonical (confirmed YYYY-MM-DD)` into the status file header. Never ask again.
- **Map** → a complete mapping, collected in the same question — not re-asked later: singular and plural of each house term, the compound document names the mapping implies (the jobs-breakdown document — default "{Jobs-term} Breakdown"), and the casing policy (proper noun everywhere, or lowercase mid-sentence — default: follow the org's own written usage; unseen, lowercase mid-sentence). Record it all in the header and make `naming-conventions` this run's target (an originally requested target queues as next — name that in the readout). Until that target is `installed`, other targets take the mapping as an input (derived templates title with house terms) but repo prose still carries OS names — say so rather than letting it surprise.

## Step 1 — Resolve the target

From args, the status file, or by asking. One target per run.

| Target | Status | What happens |
|--------|--------|--------------|
| `prd-template` — house PRD/brief format | **Implemented** (Steps 2–5) | Derive `product-development/product/handbook/templates/prd-template.md` from example documents; `/prd-draft` follows it from the next run |
| `jobs-breakdown-template` — house format for the initiative→jobs cut | **Implemented** (Steps 2–5) | Derive `product-development/product/handbook/templates/jobs-breakdown-template.md` from the org's real breakdown/release-plan/epic-cut documents; `/jobs-breakdown` follows it from the next run |
| `job-spec-template` — house format for the per-job buildable contract | **Implemented** (Steps 2–5) | Derive `product-development/product/handbook/templates/job-spec-template.md` from the org's real per-job requirement documents (their micro-job / feature-spec / story-spec equivalents); `/job-spec-draft` follows it from the next run |
| `naming-conventions` — the org's own artifact terms | **Implemented** (Step 3 note + Steps 4–5) | Execute the Step 0 mapping: Document Naming Conventions block in `business-info.md`, then the full prose sweep — inventory → classify → audit → apply → verify; machine identifiers and slash commands stay canonical |
| `metric-conventions` — KPI tier names, required fields, artifact name | Manual (guided) | Fill `business-info.md` → "Metric Reporting Conventions" from the org's KPI docs; offer to draft the block from an example |
| `fundamentals` — business-info, segmentation, stakeholders | Manual (pointer) | Route to `os-installation/` install guide and the living masters in `strategy/business-context/` |
| `auto-sync` — which git landing mode the instance runs | **Implemented** (Step 6a) | Ask direct vs pr once, record it in the status header, turn it on via `/auto-sync on {mode}`; `/customize-os auto-sync` re-asks |

**Extending this skill** (planned): new targets are new rows here plus a target-specific derivation note in Step 3 — the lifecycle, state format, interaction contract, and readout are shared and don't change. Other handbook templates (any file in `handbook/templates/`) follow the `prd-template` recipe as-is with a different consuming path.

## Step 2 — Gather (ask only what's missing)

**Pre-existing template check — template targets, before gathering.** Scan for house-format templates that entered the repo outside this skill: (a) the consuming path's file carries org-specific content (real org/product names, house sections) with no derivation top matter and no status-file record for the target; (b) overlapping extras — org template files for the same artifact under `handbook/templates/`, `product-development/inbox/`, `PRDs/`, or the repo root. (Stock scaffolds — bracketed placeholders, no org content — are the OS's defaults, never flagged.) Found → surface each and **strongly recommend removal**, with the three reasons stated: it bypassed derivation — no slot routing, so owning skills silently drop evidence slots with no named home, and no fidelity validation; it competes with the consuming path — the owning skill reads exactly one file, so edits to a stray copy never reach a draft and the two formats drift apart; and it is invisible to customization state, freshness audits, and the write-policy trail. Capture before removing: record it under **Inputs received** and run the Step 3.1 extraction on it — a stray house template is usually the best structure source (item 3 below). Then, with the user's explicit yes in this session: remove extras now (`git rm`; an untracked stray is committed first, then removed — git history is the archive, never a loose copy). A stray **at the consuming path** is never deleted early — the owning skill needs a template present — it is replaced at install (Step 5). A captured stray alone meets the gathering minimum with **zero** filled examples — the voice layer then has no source; record that explicitly as Open — Other. Declined → keep it, record **Open — Other** naming the drift risk, and continue. Nothing found → say nothing and move on.

1. **Org name** — for the status file, staging filenames, derivation headers.
2. **2–4 reference examples** — real, filled documents in the house format (paths; `.docx` via `textutil -convert txt` or `pandoc`, `.pdf` read directly). Filled examples beat blank templates — they show voice in use. One example: accept with a warning (n=1 structure is fragile → record as Open — Other). More than 4: ask which are canonical.
3. **An existing house template, if one exists** — wins on intended structure; examples still supply voice. A stray flagged by the pre-existing check lands here automatically — captured first, removed per that check.
4. **House rules the examples can't show** — approval ladder, confidentiality footer, naming conventions. Check the org's SOP first; confirm rather than re-ask.

Record everything received under **Inputs received**; phase → `gathering` until the minimum (≥1 example or a house template) is in hand.

## Step 3 — Derive

Work from structure outward; never carry content. Phase → `derived` when the draft artifact exists.

1. **Per-example extraction:** banner/header, meta-table fields, section names and order, numbering/casing, recurring sub-blocks, table shapes, footer.
2. **Common skeleton:** in all examples → in; in a majority → in, flagged; in one only → follow-up question. Where examples disagree on a sub-block's shape, prefer the newest/most evolved and say so.
3. **Blank it:** every piece of real content becomes a `[bracketed placeholder]` describing what belongs there — zero real numbers, names, or feature specifics survive.
4. **Write the guidance layer** — per-section `>` blocks (marked "never emitted"), carrying: slot routing from the owning skill's contract — ALL of its slot groups get a named home, never silently dropped (`prd-template` → `/prd-draft` Step 3's problem/value/solution/proof-side slots; `jobs-breakdown-template` → `/jobs-breakdown`'s backbone / gated job table with Type-Priority-Status columns / sequencing rationale / cross-job decisions / coverage check; `job-spec-template` → `/job-spec-draft`'s 16 core sections, however the house format names or merges them, plus the method rules that survive ANY house format: two-register ACs with no widgets in a Then, the mandatory variations verdict, cross-cutting rows answered-or-deferred, evidence labels, the quality gate as the single checklist); voice rules observed in the examples (tone, reading level, role-neutral naming, how the org writes honest unknowns — paired with the OS's `[GAP:]` convention); cross-links into the instance (metric sections → `business-info.md` conventions + `/feature-metrics`; decisions → `/decision-log-entry`; launch conditions → `/launch-checklist`; job-level constraint sections → `platform-model.md` + `tech-constraints.md`).
5. **Top matter:** "Install as:" header, derivation date + source names, drafting quality checklist at the bottom.

**`naming-conventions` derivation** — replaces the numbered flow above for this target:

1. **Conventions block:** draft **Document Naming Conventions** for `business-info.md` → Product Development → Development Process (same pattern as Metric Reporting Conventions): the mapping table (OS term → house term with the Step 0 decisions — plurals, compound document names, casing policy → one-line definition) plus three application rules — house terms in every human-facing surface agents write **from adoption day forward** (titles, headings, prose, readouts, tickets, Slack drafts); OS terms unchanged in machine surfaces (slash commands, file and folder names, template filenames, feature-index keys, document-internal ID schemes — enumerate them in the block); either term from the user resolves to the same artifact.
2. **Inventory, then classify — before editing anything.** `rg -n -i` every old-term variant (acronym, plural, possessive, hyphenated, spaced, spelled-out: `PRD(s)`, `product requirements document(s)`, `job spec(s)` / `job-spec`, `jobs breakdown` / `jobs-breakdown`, bare `job(s)` where it means a delivery slice). Classify EVERY hit into five classes: **rename** (prose in the mapped sense — living documents and forward-looking artifacts only) · **keep — machine identifier** (protected by SHAPE, not only by list: paths, filenames, index keys and key names quoted in comments, slash commands, backticked tokens, YAML and CI keys, `{placeholder}` tokens, document-internal ID schemes skills emit or parse (`J-1`, …), frontmatter or pseudo-frontmatter labels — a key-shaped token absent from the enumerated list is still machine: leave it alone and note it, never rename or re-case it mid-sweep) · **keep — historical record** (the past keeps its words: verbatim transcripts are immutable and dated records are append-only per `governance/write-back-contract.md` — call/meeting summaries, decision entries, gate verdicts, filed reports and reviews, experiment docs, dated lesson and Activity lines. A March gate that said "PRD" still says PRD; no record may claim someone used a word before the org adopted it) · **keep — different sense** (jobs-to-be-done / JTBD research language, the customer's "job" in discovery and prioritization contexts, the product's own compute/cron jobs, unrelated uses) · **out of scope** (`.claude/**`, path-scoped whatever it contains — skills, agents, and hooks are master-maintained and stay universal; their readouts will still say the OS word — the conventions block is the bridge; note that to the user once). The counts per class are this target's derived artifact — record them in the status file.
3. **The sense rule that will bite:** a jobs→{X} mapping never touches jobs-to-be-done language. "The job behind the request", JTBD interview guides, and journey maps speak of the *customer's* job; only the delivery objects `/jobs-breakdown` and `/job-spec-draft` produce get renamed. When one sentence carries both senses, rename only the delivery one.
4. **Apply file by file** — this is the install act (Step 5): read the gated set from `governance/write-policy.yaml` at run time, never from a remembered list (it gates whole trees, not just the obvious files — `business-context/`, `handbook/templates/`, `engineering/`, `governance/`, `os-installation/`, `.claude/`, `.github/`, plus root `CLAUDE.md` and `feature-index.yaml` — comment lines but never its keys); gated files each pass the write prompt, auto-tier prose (folder `CLAUDE.md`s outside those trees, handbook docs outside `templates/`, worked examples, initiative pages, README) writes directly. Prose around a canonical token renames; the token stays verbatim: "cut the initiative into epics with `/jobs-breakdown`". Substitution is not the finish line — re-read every edited sentence: articles (a/an), doubled terms (the source's "per-job job specs" becomes "per-Epic specs", never "per-Epic Epic Specs"), casing registers (an ALL-CAPS line stays all-caps), and one treatment per surface (rows of the same table, items of the same list). Commit by tier — auto-tier normally; gated files in their own commit, landed deliberately per the policy.
5. **Already-installed house templates** get their title and heading lines updated in the same run; not-yet-derived template targets record the mapping under **Inputs received**.

## Step 4 — Validate (skip only on explicit user request)

Spawn a subagent given ONLY (a) the owning skill's drafting contract (`prd-template` → `/prd-draft` Step 3; `jobs-breakdown-template` → `/jobs-breakdown` Steps 2–6; `job-spec-template` → `/job-spec-draft` Steps 3–9), (b) the derived template, (c) a synthetic scenario with deliberate evidence holes — reference examples withheld. Judge against a fidelity checklist derived from the real examples (sections/order/naming, meta completeness, sub-blocks, voice, honest-TBD + `[GAP:]` pairing, zero invented numbers, zero guidance leakage). Fix failures **template-side**, re-run once if fixes were made, record the score. Phase → `validated`.

**`naming-conventions` validation** — audit the classification BEFORE applying: spawn a fresh-context subagent given only the mapping, the boundary rules from the conventions block, and the classified inventory (not your reasoning). It re-greps independently and hunts five failure modes: sense errors (JTBD or customer-job hits classed rename), boundary errors (machine identifiers classed rename), record errors (transcripts, dated records, or quoted speech classed rename), missed variants (case, plural, possessive, spaced/hyphenated/spelled-out forms absent from the inventory), and files the inventory never visited. Fold fixes into the classification, re-run once if anything changed, record the result. Phase → `validated` only then; the post-apply verify lives in Step 5.

## Step 5 — Install

1. Show the derived artifact and validation result.
2. **Instance:** write to the consuming path (gated, native prompt). **Staging:** write beside the status file with the "Install as:" header. Phase → `installed`.
3. Offer companions in the same run: the KPI section implies tier names → offer to fill `business-info.md` → "Metric Reporting Conventions" (gated); offer `/decision-log-entry` ("Adopted {org} house format for {target}", sources + score). All companions done → `complete`.
4. **`naming-conventions`:** install = the Step 3 apply pass, then **post-apply verify** — re-run the full inventory; every remaining hit must fall in a keep or out-of-scope class (the run's own artifacts — conventions block, status file, decision record — intentionally name the OS terms in the mapping itself: expected, not residual), anything else gets fixed before the readout, and the residual counts by class go in the status file. Then the **mirror check**: any number or claim restated across the run's own artifacts must agree — a correction lands on every surface that carries it, or the other surfaces cite the status file instead of restating. A stray template the pre-existing check left at a consuming path is replaced here. Companions: `/decision-log-entry` ("Adopted house naming: {map}" — boundary line included); house-template titles aligned or queued. **Master repo: never sweep the master** — record the mapping, stage the conventions block with its "Install as:" header, and say in the readout that the sweep executes in the instance.

## Step 6a — Choose the auto-sync mode (once per status file, at the close of the run)

**Trigger:** the status header has no `auto-sync:` field (or `undecided`), or the run's
target is `auto-sync`. Skipped in `status` mode and in master-repo staging runs (the
mode belongs to the instance). Runs after the target's work, before the readout — the
end of customization is when the org decides how work lands.

Read first: `settings → auto-commit → enabled` and `settings → auto-merge → strategy` in
`governance/write-policy.yaml`, the origin URL (`github.com` → GitHub guide, `dev.azure.com`
/ `visualstudio.com` → Azure guide, none → the guide comes once the repo is on a server),
and whether the server rule is in place if that is knowable (a `.github/CODEOWNERS` with a
real team, the admin's word). Then ask ONE question, recommendation first, in plain words:

- **pr — recommended when `main` is (or will be) pull-request-only on the server:** you
  work on your own branch; everyday files reach `main` by themselves through small pull
  requests that merge on their own; gated files (the OS's steering files and rules) go
  to `main` only through a pull request an admin approves — "propose the gated changes"
  when you are done. Needs the admin setup in `os-installation/admin-setup-{github|
  azure-devops}.md` to actually enforce the approval, and `gh` / `az` logged in.
- **direct — recommended for a solo steward or a small trusted team with an open
  `main`:** everyday files are committed on `main` and pushed every turn; gated files
  are written behind the write prompt and held until you say "commit and push the gated
  changes" — they go to `main` too, just not by themselves. Nothing to set up on the server.
- **later** — record `undecided`; ask again next run.

Record the answer in the header (`auto-sync: pr (chosen YYYY-MM-DD, not yet on)`), then
offer to turn it on now: on a yes, invoke `/auto-sync on {mode}` in this run (the flip is
a gated edit — the write prompt still confirms it) and update the header to `on`; on a
no, the readout's Automation line names the command. Never flip without the yes; never
nag mid-run — this question lives here and in `/customize-os auto-sync` only.

## Step 6 — Record and close (mandatory, every run — including interrupted ones)

Update the status file (phase, artifacts, inputs, open items, log line), then end with this readout:

```
Customization run — {org} · {target} · phase: {phase}

Changed this run
  ✓ {artifact} → {path it lives at now}
  ✓ status updated → {status file path}

Was the provided info sufficient?
  Critical — blocks closing this step
    ✗ {missing input} — {exactly how to provide it}
  Other — would improve the result, not blocking
    ⚠ {nice-to-have and what it would add}
  (or: ✓ sufficient — nothing outstanding for this phase)

Next: {the single next action, and whose it is}
Automation: {auto-sync {mode} — ON (turned on this run) | chosen, turn on with /auto-sync on {mode}
  {+ ", after the admin has done os-installation/admin-setup-{github|azure-devops}.md" for pr}
  | undecided — ask again with /customize-os auto-sync}
Resume anytime with /customize-os continue — state is saved.
```

Rules: **Changed this run** lists real paths, never descriptions alone. The sufficiency split is honest — an item is Critical only if the phase genuinely cannot close without it; everything else is Other. Unanswered follow-ups land here, not in silence. **Automation line:** the outcome of Step 6a from the status header — mode, on or not, and the one command or guide that comes next; never a second question here.

---

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   CLAUDE.md (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Feature-scoped artifact → propose the `product-development/feature-index.yaml` addition
   and apply it only after the user confirms (Tier 2 in `governance/write-policy.yaml`).
   Initiative-scoped → link the artifact from `product-development/product/initiatives/{slug}.md`.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.

---

## Output Quality Self-Check

Before presenting to the user, verify:

- [ ] **State first, state last:** the status file was read before anything else and updated before the readout — even if the run was interrupted mid-phase
- [ ] **Readout complete:** paths for everything changed, sufficiency split into Critical / Other (or an explicit "sufficient"), a single named next action, and the Automation line
- [ ] **Auto-sync mode asked, not assumed** (Step 6a): the status header carries `auto-sync:` — direct, pr, or an explicit undecided — before the readout; the flip ran only on the user's yes
- [ ] **Questions asked, not assumed:** every ambiguity was either asked as a follow-up or taken as a recommended default AND recorded as an open item — never silently guessed
- [ ] **Zero content carry-over:** no real numbers, customer names, feature specifics, or quotes from the examples survive in a derived template — structure and voice rules only
- [ ] **Every slot routed:** all of the owning skill's slot groups (`/prd-draft`'s four, `/jobs-breakdown`'s five, `/job-spec-draft`'s sixteen) have a named home in the guidance layer
- [ ] **Validation ran** (or the user explicitly skipped it — recorded as Open — Other) with score + failures reported
- [ ] **Right repo:** installed in an instance, or staged outside the master — never overwrote the master's universal defaults
- [ ] **Naming resolved first:** the status file header carries a `naming:` field (canonical or the mapping) before any target work ran this session
- [ ] **Pre-existing templates handled** (template targets): the check ran — strays captured as inputs then removed on a yes, or declined and recorded as Open — Other; never silently kept, never silently deleted
- [ ] **Sweep audited then verified** (naming-conventions): classification audited by a fresh-context subagent before applying; post-apply re-grep left only classified keeps — machine identifiers, historical records, different-sense, out-of-scope — and the mirror check passed
- [ ] **History untouched** (naming-conventions): zero diff hunks inside transcripts, dated records, or quoted speech — the past keeps its words
