---
name: demo-showcase
description: Build demo data from a scenario spec — and prove it works. generate reads a use-case spec (the scenarios a demo must show, each with its invocation and its expected outcome), plans the data each scenario needs, stops for your yes, then generates raw artifacts and runs them through the real pipeline (/process-meeting, /context-update) so every record is consistent by construction; optional backdated commit history gives /weekly-review a real rhythm. eval is the point — it runs every scenario exactly as the presenter will, judges each expected outcome against what actually happened, and writes a pass/fail run log with evidence; data gaps get fixed and re-run, skill-behaviour findings are reported, never papered over. deck builds presenter slides, one per scenario (offered, never assumed). Sandbox mode dresses a whole demo instance in native-looking content (no visible [DEMO] tags) while the manifest keeps removal exact; production mode inherits /demo-data's visible marking. Use on /demo-showcase, "build the demo data for these scenarios", "make this demo runnable", "test that the demo actually works", "build the demo deck". NOT for a small bounded seed inside a real team instance (/demo-data), judging whether a demo needs synthetic data (/customize-os demo-readiness), populating real context (/customize-os), or processing real meetings (/process-meeting).
argument-hint: "[generate|eval|deck|status|remove] [spec-path]"
group: os-admin
---

## Quick Start

```
/demo-showcase generate demo-spec.md   → plan the data for every scenario, stop for yes, build, then eval
/demo-showcase eval                    → re-run every scenario as scripted; refresh the run log
/demo-showcase eval S3                 → one scenario by id
/demo-showcase deck                    → presenter slides, one per scenario
/demo-showcase status                  → what synthetic content exists, and the last eval verdict
/demo-showcase remove                  → reverse the manifest exactly
```

---

# /demo-showcase — Demo Data That Is Proven to Demo

A demo fails in front of an audience for one of two reasons: the data the scenario needs
isn't there, or it's there but the skill doesn't do what the script promised. This skill
exists to kill both. It builds data **from the scenarios backwards**, then it **runs the
demo itself** and reports what actually happened.

**Relationship to `/demo-data`:** that skill seeds a real team instance that is thin on
content — it proposes its own small scenario, marks everything `[DEMO]`, and stays
deliberately tiny. This skill is for the other job: a whole instance that exists to be
demoed, built to a spec someone else wrote, at whatever scale that spec needs, with an
eval pass. Same manifest discipline, same "real pipeline only" rule. When the ask is
"seed our repo so the OS has something to show", that's `/demo-data`. When the ask is
"here are the twelve things I must be able to show on Tuesday", it's this one.

## The scenario spec — the input contract

A markdown file the requester writes (or `/customize-os demo-readiness` emits). The skill
reads it as the source of truth and never invents scenarios of its own.

Per scenario: **`id`** · **`name`** · **`narrative`** (what the audience should see and
why it matters) · **`invocation`** (the exact prompt or command the presenter will run) ·
**`expected`** (checkable outcome statements — the eval judges these one by one) ·
**`data-needs`** (free-form: what must exist for it to run).

Global sections: the cast (people, accounts, initiatives), vocabulary and naming rules,
money and metric anchors, volume floors, PII rules, history/backdating plan, and an
explicit out-of-scope list.

**A spec with vague `expected` statements produces a worthless eval.** "The synthesis is
good" cannot be judged; "the synthesis cites at least 6 transcripts, including at least
one filed under another account" can. When a scenario's expectations aren't checkable,
say so at the planning checkpoint and propose sharper ones — don't silently accept them.

## Preconditions

- **Context populated first** — `os-installation/customization-status.md` shows
  `context-core` installed. Synthetic facts written before the real context exists will
  contradict it later.
- **Never the master repo** (placeholders in root `CLAUDE.md`, SoftServe credits) — demo
  content there would ship to every customer.
- Interactive for `generate` (the plan needs a human yes). `eval`, `status` and `deck`
  run unattended.
- `remove` and `status` need only the manifest; if it's missing, say so and stop — never
  guess at what might be synthetic.

## Mode — sandbox or production

Asked once, recorded in the manifest header:

- **sandbox** — the whole instance exists for demos. Content looks native: no `[DEMO]`
  slugs, banners, or `(demo)` suffixes anywhere. The manifest alone carries the synthetic
  inventory, so removal stays exact and nothing on screen breaks the illusion. Only
  legitimate for an instance that is *not* anyone's real workspace; confirm that out loud
  before choosing it.
- **production** — a real team instance. Inherits `/demo-data`'s visible marking rules
  unchanged.

## Generate

**1 — Read state.** Customization status and facts annex, the spec, existing initiative
pages and accounts, and *the repo's actual mechanisms as they exist today* (catalogs,
registers, templates, link schema). Generate against what the repo really has, never
against a remembered structure — a skill or template may have changed since the spec was
written.

**2 — Plan, then stop.** One message: a coverage table mapping every spec scenario to the
data that will make it run, the file list with counts and target paths, the story arc
(which meeting produces which decision, what pattern the research will show), the history
plan, and anything the spec leaves ambiguous — with your recommendation. Flag unjudgeable
`expected` statements here. **Nothing is written before the yes**; the yes covers the run.

**3 — Generate raw artifacts** into `product-development/inbox/`. Consistency rules:
every decision traceable to something actually said in a generated meeting; research
carrying the stated patterns *plus at least one divergent voice* so synthesis has
something honest to find; vocabulary, segments and personas from the instance's real
steering context; money figures consistent across every artifact that quotes them. Real
source material (anonymized customer records) is used as-is when the spec provides it —
it's more convincing than anything generated, and the spec's PII rules govern it.

**4 — Run the real pipeline.** `/process-meeting` per transcript with initiative joins
declared, `/context-update` for the rest. The engines write summaries, decisions, page
updates and ledger lines exactly as they would for real material — that's what makes the
records impossible to contradict their sources. Direct writes only where no engine owns
the artifact class; each one recorded in the manifest with the reason.

**5 — History** (sandbox only, when the spec asks). Commits are authored and dated per
the spec's plan (`GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE`), so document dates and commit
timestamps agree and week-over-week skills have a real rhythm to read.

**6 — Manifest** — `os-installation/demo-showcase-manifest.md`: mode, spec path and
version, every created file (final home after pipeline moves), every page section edited
with the line added, every ledger line, every steering before/after, and the commit range.
A reader must be able to reverse the whole run from the manifest alone.

**7 — Eval runs automatically** unless `--no-eval` was passed.

## Eval — the part that makes this skill worth having

For each scenario in the spec, execute the `invocation` **exactly as written** — the
presenter's words, not a friendlier paraphrase. Read-only scenarios run in place; any
scenario that writes runs in a throwaway worktree so the demo state stays pristine.
Dispatch one fresh-context subagent per scenario (they must not inherit your knowledge of
how the data was built — that's how you catch data a presenter could never find).

Judge each `expected` statement independently: **pass** (with the evidence quote that
proves it), **fail** (with what happened instead), or **unjudgeable** (say why). Then
diagnose every failure into one of three buckets, because they have different owners:

| Diagnosis | What it means | Action |
|---|---|---|
| **Data gap** | the scenario is right, the data doesn't support it | fix through the pipeline, re-run that scenario |
| **Skill behaviour** | the data is right, the skill doesn't do what the script promised | **report it — never paper over it.** This is real product feedback and may be the most valuable output of the run |
| **Spec expectation** | the expectation was wrong or unjudgeable | propose a sharper one; the requester decides |

Write `demo-run-log.md` beside the spec: one row per scenario — invocation, verdict,
per-expectation evidence, diagnosis and fix if any, and whether a re-run passed. Close
with an honest headline: *N of M scenarios pass unassisted*, and every remaining failure
with its owner. **A green log that required manual patching between the run and the
report is a lie** — if you patched, re-run and say so.

## Deck

**Offer it; never assume it.** When accepted, ask audience, branding and depth first,
then build one slide per scenario: the scenario name, the story beat, the exact prompt to
type, what the audience will see, and the data behind it. Only scenarios that pass eval
get a slide — a slide for a failing scenario is a trap for the presenter. Saved outside
the repo by default (presenter material, not repo content), path recorded in the manifest.

## Status · Remove

`status` — mode, spec, what synthetic content exists, when it was built, and the last
eval headline. `remove` — read the manifest, show what will be deleted and reverted, take
one yes, then reverse it exactly: files, pages, catalog entries, ledger lines, steering
values, and (on request) the backdated commits. Anything the manifest doesn't record is
not touched. Items that have drifted since they were written are listed for the user
rather than force-deleted. Close by deleting the manifest and suggesting `/wiki-lint`.

---

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for each new file at the END of its folder's CLAUDE.md list
   (append-only — never re-sort). The pipeline engines handle their own outputs; this
   skill lists what it wrote directly (raw drops, the manifest, pages it created).
2. Declare links in frontmatter per `governance/link-schema.yaml`; every artifact is
   reachable from its initiative page (row + dated Activity line). Catalog entries for
   demo-only features are gated and recorded in the manifest for exact removal.
3. In each artifact's header, link the source it was derived from (spec section or
   source record).
4. End your reply by listing every repo path you wrote or updated.

## Output Quality Self-Check

Before presenting to the user, verify:

- [ ] **Spec is the source of truth:** every scenario came from the spec; none invented; unjudgeable expectations were surfaced at the checkpoint, not silently accepted
- [ ] **Preconditions enforced:** instance not master; context-core installed; mode confirmed out loud; plan approved before the first write
- [ ] **Pipeline, not shortcuts:** summaries, decisions and page updates came from `/process-meeting` / `/context-update`; every direct write is recorded with its reason
- [ ] **Internally consistent:** decisions trace to generated meeting content; research carries the stated patterns plus a divergent voice; money and vocabulary agree across artifacts; no real customer names outside what the spec's PII rules allow
- [ ] **Eval ran as scripted:** invocations verbatim, fresh-context subagents, writing scenarios isolated; every expectation judged with evidence
- [ ] **Failures diagnosed, not hidden:** each failure bucketed data-gap / skill-behaviour / spec-expectation; skill-behaviour findings reported to the user, never worked around
- [ ] **Run log honest:** the headline count matches the log; anything patched was re-run and labelled; no scenario silently dropped
- [ ] **Manifest complete:** every file, edit, ledger line, steering change and commit range recorded — the run is reversible from the manifest alone
- [ ] **Marking correct for the mode:** sandbox is clean of `[DEMO]` residue; production carries the full visible marking
- [ ] **Deck offered, not assumed;** only passing scenarios got slides
