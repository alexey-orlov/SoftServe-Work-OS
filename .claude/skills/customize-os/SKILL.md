---
name: customize-os
description: Adapt a deployed instance of this OS to a customer or org — interactive, stateful, resumable. One guided sequence covers setup end to end - populate the general steering context from the org's real documents (manifest-driven — every steering item ends filled, GAP, or N/A; no invention; optional web enrichment for public facts), create initiative pages and fold their material in, set the design-system and user-insights choices in toolchain.yaml, assess demo readiness (synthetic data via /demo-data), resolve artifact naming (org terms executed repo-wide; slash commands and machine identifiers stay canonical), derive house PRD / jobs-breakdown / job-spec templates from 2–4 examples, and close by choosing the auto-sync mode with a plain-language review of the gated-file list. Reads state first (os-installation/customization-status.md), asks only for missing inputs, installs behind the gated write prompt, parks out-of-order input instead of rejecting it, ends every run with a changed-what-where + Critical/Other readout. Real content lands in customer instances only — master runs stage outside the repo. Use on /customize-os, "customize this OS for {customer}", "set up / populate our context", "create our initiatives", "adopt our PRD format", "set up the design system", "continue customization", "where does customization stand?". NOT for connecting tool servers (/connect-mcps), code access (/connect-code), drafting a real PRD (/prd-draft), or generating demo data directly (/demo-data).
argument-hint: "[target|continue|status] [example file paths...]"
group: os-admin
---

## Quick Start

```
/customize-os                        → read state; resume where the sequence left off, or start guided
/customize-os continue               → same, explicit
/customize-os status                 → report progress across all targets; change nothing
/customize-os context-core           → run one target by name (any name from the registry)
/customize-os prd-template ~/a.docx ~/b.docx   → run one target with inputs up front
```

**Every run ends the same way:** the closing readout — what changed and where, what's
still missing (Critical / Other), the sequence position, and the saved state that lets
the next session pick up exactly here.

---

# /customize-os — Fit the Instance to the Org

The OS's skills are universal; everything org-specific lives in customized context files
(see `.claude/team-learnings.md`). This skill is the guided, resumable way to produce
those files from the org's real artifacts instead of hand-writing them. Customization is
a program, not a session: state persists, steps close one at a time, and any session can
continue where the last one stopped — during initial setup, and again later whenever new
material or a change of mind arrives.

## The guided sequence

With no target argument, work runs in this order. Each entry is a target; its method
lives in a playbook file in this skill's `targets/` folder — **read the playbook fully
before running its target.** This file is the frame: lifecycle, state, interaction rules,
readout.

| # | Target | Playbook | What it settles |
|---|--------|----------|-----------------|
| 1 | `context-core` | `targets/context-core.md` | The general steering context — business info, team, stakeholders, segmentation, quarter — populated from real documents; report; optional web enrichment |
| 2 | `initiatives` | `targets/initiatives.md` | Real initiative pages (aim for 3+) and their attached material folded in |
| 3 | `design-system` | `targets/design-system.md` | How prototypes get design grounding → `toolchain.yaml` |
| 4 | `research-source` | `targets/research-source.md` | Where research/meeting records come from → `toolchain.yaml`; meeting cadences; optional first load |
| 5 | `demo-readiness` | `targets/demo-readiness.md` | Enough real data to demo? Best demo path, or delegate gaps to `/demo-data` |
| 6 | `naming-conventions` | `targets/naming-conventions.md` | Keep PRD / jobs / job specs, or adopt the org's terms repo-wide |
| 7 | `prd-template` · `jobs-breakdown-template` · `job-spec-template` | `targets/template-derivation.md` | House document formats derived from 2–4 real examples |
| 8 | `metric-conventions` | (guided inline) | KPI tier names, required fields → `business-info.md` "Metric Reporting Conventions"; offer to draft the block from an example |
| — | auto-sync close | (below) | Once per instance, at the end of whichever run gets there: landing mode + governance identity + the gated-list walkthrough |

`fundamentals` is accepted as an alias for `context-core`. **Extending this skill:** a new
target is a new row here plus a playbook file — the lifecycle, state format, interaction
contract, and readout are shared and don't change.

**Simple toolchain surfaces have no target here by design.** `toolchain.yaml`'s
binary-choice surfaces (ticketing, meeting-transcripts, knowledge-base, analytics,
feature-requests, calendar — `mcp | files`) are set from the OS Console's Integrations tab
or fall out of a `/connect-mcps` run; only the two rich surfaces (`prototyping:`,
`user-insights:`) need the guided targets above. Don't invent targets for the simple ones.

## Order discipline

The sequence is the default path, and the skill leans on it firmly — but order is
enforced by dependencies, not stubbornness:

- **Hard prerequisites (block, with the reason):** `initiatives` and `demo-readiness`
  need `context-core` (pages and synthetic data must not precede the real context they
  build on); the naming question must be answered before any template target (a house
  template titles with the org's words); web enrichment only follows the coverage report.
- **Everything else bends:** any target can be skipped or run by name. A skip is
  recorded in the status file with its consequence, and later readouts keep naming the
  earliest open step under **Next** — once per run, never mid-run nagging.
- **Out-of-order input is parked, never rejected:** material that belongs to a later
  target (initiative briefs during context work, transcripts before the research step)
  goes to the status file's **Deferred sources** list with its consuming target, and the
  user is told when it will be used. Nothing handed over is lost.

## The target lifecycle

Every target moves through the same phases, tracked in the status file:

```
not started → gathering → derived → validated → installed → complete
```

`installed` = the artifact is live at its consuming path. `complete` = companions done
too (conventions blocks, decision log entry). A target can sit at any phase between
sessions. (`context-core` verifies after install — population validates the live files,
not a draft; its playbook says so.)

## State

**Read state FIRST on every invocation; update it LAST on every run — including
interrupted ones.** Two files, living where the outputs land (customer instance →
`os-installation/`; master staging runs → the staging folder, outside the repo):

**`customization-status.md`** — the human-readable program state. Create on first run:

```markdown
# Customization Status — {Org}
_updated: YYYY-MM-DD · mode: instance | staging ({path}) · naming: canonical (confirmed YYYY-MM-DD) | house — {OS term → house term, …} (mapped YYYY-MM-DD) · auto-sync: direct | pr (chosen YYYY-MM-DD, on | not yet on) | undecided_

## Sequence
| # | Target | Phase | One line |
(one row per sequence entry, plus any target run by name)

## Deferred sources
- {path or URL} → {consuming target} (noted YYYY-MM-DD)

## {target}
- **Phase:** gathering | derived | validated | installed | complete
- **Artifacts:** {what} → {path} (one line each, including staged drafts)
- **Inputs received:** {paths, house rules confirmed} (paths may be machine-specific — re-ask if unreachable, don't fail)
- **Coverage:** (context-core only) {group}: filled n · GAP n · N/A n — detail in the facts annex
- **Open — Critical:** {what blocks closing this phase — how to provide it}
- **Open — Other:** {what would improve the result — not blocking}
- **Log:** YYYY-MM-DD ({git user.name}) — {one line per session: what moved}
```

**`customization-facts.yaml`** — the facts annex: resolved values, quotes, provenance,
per-item status. Format and rules in `targets/context-core.md`. It is the resume point
and audit trail for population — the status file stays a summary.

`status` mode prints the Sequence table plus per-target summaries and exits. Both files
sit on a gated path: batch each run's state updates into one write at the close, not a
prompt per touch.

## Interaction contract

- **State and repo before questions.** Read the status file, then look for answers in the
  repo and any documents the user pointed at (an org SOP often answers approval-ladder
  and naming questions — quote what you found, confirm, don't re-ask).
- **Choice-shaped questions use the interactive question form** (AskUserQuestion) —
  proceed/skip, either/or, multi-select offers — with the recommended option first.
  Free-form input (names, descriptions, paths, URLs) is asked in plain chat. One compact
  question set per moment, covering only the genuinely missing inputs — not an interview,
  not one-question-at-a-time for things that batch naturally.
- **Follow-ups mid-run are expected** whenever derivation hits something only the user
  can settle: sources disagree, an evidence slot has no natural home, a house rule is
  unknowable from the artifacts, the install destination is ambiguous. Ask the specific
  question, with your recommended default first.
- **Never invent an answer to avoid a question; never block silently.** If the user isn't
  available, take the recommended default, mark the item **Open — Critical** or **Open —
  Other** in the status file, and say so in the readout.
- This skill is interactive by design: a headless run reports status and files proposals
  per `governance/write-policy.yaml` — it never customizes unattended.

## Instance vs. master — where am I?

Customized content belongs to the customer instance **only** — the master repo stays
neutral: placeholder steering files, canonical names, `undecided` toolchain keys. Confirm
once per status file which repo this is (record it as `mode:`):

- **Customer instance** → install targets at their consuming paths, gated prompt per file.
- **SoftServe master** (placeholders like `[Your Product]` in root CLAUDE.md, SoftServe
  credits) → never overwrite universal defaults. Derive and validate as normal, **stage**
  outputs in the engagement's project folder (ask where, once) with an "Install as:"
  header naming the instance path.

## Preflight (once per status file)

Before the first target: confirm the mode (above), and capture the org's name, product
name(s), official website domain, and a one-paragraph description in the user's own
words. The domain anchors any later web research; the description seeds nothing by itself
— population works from sources, not from this paragraph alone.

## The auto-sync close (once per instance, at the close of the run)

**Trigger:** the status header has no `auto-sync:` field (or `undecided`), or the run's
target is `auto-sync`. Skipped in `status` mode and in master staging runs. Runs after
the target's work, before the readout — the end of customization is when the org decides
how work lands. Three parts, one conversation, plain words throughout:

1. **The landing mode.** Read first: `settings → auto-commit → enabled` and `settings →
   auto-merge → strategy` in `governance/write-policy.yaml`, the origin URL (`github.com`
   → GitHub guide, `dev.azure.com` / `visualstudio.com` → Azure guide, none → the guide
   comes once the repo is on a server), and whether the server rule is in place if that
   is knowable (a `.github/CODEOWNERS` with a real team, the admin's word). Then ask ONE
   question, recommendation first:
   - **pr — recommended when `main` is (or will be) pull-request-only on the server:**
     you work on your own branch; everyday files reach `main` by themselves through small
     pull requests that merge on their own; gated files (the OS's steering files and
     rules) go to `main` only through a pull request an admin approves — "propose the
     gated changes" when you are done. Needs the admin setup in
     `os-installation/admin-setup-{github|azure-devops}.md` to actually enforce the
     approval, and `gh` / `az` logged in.
   - **direct — recommended for a solo steward or a small trusted team with an open
     `main`:** everyday files are committed on `main` and pushed every turn; gated files
     are written behind the write prompt and held until you say "commit and push the
     gated changes" — they go to `main` too, just not by themselves. Nothing to set up
     on the server.
   - **later** — record `undecided`; ask again next run.
2. **What's protected — confirm or adjust.** Show the two kinds of files in everyday
   language, derived from `governance/write-policy.yaml` at run time (never a remembered
   list): *"These need your yes before they change"* — the gated entries, each explained
   by the policy's own comment line ("the steering files every session leans on, the
   templates that shape every document, the system's own rules…") — versus *"everything
   else, which agents write freely"* — records, summaries, PRDs, analyses, initiative
   pages. Then ask: keep it as shipped (recommended — it protects exactly the files that
   steer everything), make it stricter, or make it looser — with one or two concrete
   examples each (stricter: also gate `current-quarter.md` or the competitive-research
   pages; looser: un-gate `Documentation/**` if the team iterates its docs constantly).
   Chosen adjustments are edits to the policy's `tiers:` list, behind its own gated
   prompt; when the list changed, note that the server-side mirror regenerates from it
   (the admin guides and `/propose` cover the how).
3. **Who stewards.** If `steward:` or the `reviewers:` handles in the policy are still
   placeholders: ask who stewards the OS (suggest the current `git config user.name` +
   email) and, when the server setup is in play, the admin group handle. Written in the
   same gated change as part 2.

Record the mode in the header (`auto-sync: pr (chosen YYYY-MM-DD, not yet on)`), then
offer to turn it on now: on a yes, invoke `/auto-sync on {mode}` in this run (the flip is
a gated edit — the write prompt still confirms it) and update the header to `on`; on a
no, the readout's Automation line names the command. Never flip without the yes; never
nag mid-run — this conversation lives here and in `/customize-os auto-sync` only.

## Record and close (mandatory, every run — including interrupted ones)

Update the status file (sequence row, phase, artifacts, inputs, open items, log line),
then end with this readout:

```
Customization run — {org} · {target} · phase: {phase}
Sequence: step {n} of {N} · next up: {target or "sequence complete"}

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

Rules: **Changed this run** lists real paths, never descriptions alone. The sufficiency
split is honest — an item is Critical only if the phase genuinely cannot close without
it; everything else is Other. Unanswered follow-ups land here, not in silence.
**Automation line:** the outcome of the auto-sync close from the status header — mode, on
or not, and the one command or guide that comes next; never a second question here. After
a run that wrote many files, suggest `/wiki-lint` as the independent health check — once,
in **Next**, not as a demand.

---

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   CLAUDE.md (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Feature-scoped artifact → propose the `product-development/feature-index.yaml` addition
   and apply it only after the user confirms (gated in `governance/write-policy.yaml`).
   Initiative-scoped → link the artifact from `product-development/product/initiatives/{slug}.md`.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.

---

## Output Quality Self-Check

Before presenting to the user, verify:

- [ ] **State first, state last:** the status file was read before anything else and updated before the readout — even if the run was interrupted mid-phase; state writes batched into one close-of-run change
- [ ] **Playbook read:** the running target's `targets/*.md` file was read in full before its work started (where one exists — the sequence table marks the inline ones)
- [ ] **Readout complete:** paths for everything changed, sufficiency split into Critical / Other (or an explicit "sufficient"), sequence position, a single named next action, and the Automation line
- [ ] **Order held or consciously bent:** hard prerequisites enforced with the reason; skips recorded with consequence; out-of-order input parked in Deferred sources, and deferred items were consumed or are still listed — never dropped
- [ ] **Coverage honest** (context-core): every manifest item ended filled, GAP, N/A, or pending approval; the report renders from the same manifest groups as the intake table; numbers grep-traced to sources; no template residue in filled sections; shared facts agree across their surfaces
- [ ] **Nothing invented:** every installed value traces to a source or the user's own words — plausible-but-unstated stays GAP; web enrichment filled GAPs only and never overwrote a human-provided value
- [ ] **Delegation respected:** ingestion ran through `/context-update` / `/process-meeting` (they own routing and the ledger), connections through `/connect-mcps`, synthetic data through `/demo-data` — never inlined here
- [ ] **Questions asked, not assumed:** every ambiguity was either asked as a follow-up or taken as a recommended default AND recorded as an open item — never silently guessed
- [ ] **Auto-sync close ran when due:** mode recorded (direct, pr, or explicit undecided); the gated-list walkthrough shown in plain language; steward/reviewers filled or recorded open; the flip ran only on the user's yes
- [ ] **Right repo:** installed in an instance, or staged outside the master — never overwrote the master's universal defaults
- [ ] **Naming resolved before template work:** the status header carries `naming:` before any template target ran
- [ ] **Zero content carry-over** (template targets): no real numbers, customer names, feature specifics, or quotes from the examples survive in a derived template — structure and voice rules only
- [ ] **Every slot routed** (template targets): all of the owning skill's slot groups have a named home in the guidance layer
- [ ] **Validation ran** (or the user explicitly skipped it — recorded as Open — Other) with score + failures reported
- [ ] **Pre-existing templates handled** (template targets): strays captured as inputs then removed on a yes, or declined and recorded as Open — Other; never silently kept, never silently deleted
- [ ] **Sweep audited then verified** (naming-conventions): classification audited by a fresh-context subagent before applying; post-apply re-grep left only classified keeps; the mirror check passed; zero diff hunks inside transcripts, dated records, or quoted speech
