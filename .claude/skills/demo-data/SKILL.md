---
name: demo-data
description: Generate a small, internally consistent set of synthetic demo data for a customer instance — and remove it cleanly later. generate (default) reads customization state, proposes a bounded demo scenario (a [DEMO]-slugged initiative, 2–3 meeting/call transcripts, a handful of interview snippets with clear patterns, the decisions they lead to) and stops for your yes; then drops the raw artifacts into product-development/inbox/ and runs the real pipeline (/process-meeting, /context-update) so summaries, decisions, initiative pages, and the ledger stay consistent by construction; optionally fills remaining steering GAPs with clearly marked demo values. Every created file, edited page section, and ledger line is recorded in os-installation/demo-data-manifest.md. remove reverses exactly that manifest — files, ledger lines, page edits, marked steering values. status reports what synthetic content exists now. Requires populated context (/customize-os context-core installed) first; customer instances only, never the master repo. Use on /demo-data, "generate demo data", "create mock/sample data for the demo", "seed the repo for a demo", "remove the demo data". NOT for judging whether the demo needs synthetic data (/customize-os demo-readiness), populating real context (/customize-os), or processing real meetings (/process-meeting).
argument-hint: "[generate|remove|status] [scope notes...]"
group: os-admin
---

## Quick Start

```
/demo-data                 → generate (proposes a scenario first — nothing written before your yes)
/demo-data generate        → same, explicit; add scope notes ("research only", "for {initiative}")
/demo-data remove          → reverse everything the manifest records
/demo-data status          → what synthetic content exists now; change nothing
```

---

# /demo-data — Synthetic Content for Demos, Cleanly Reversible

Demo data exists to show the OS working end to end — meeting → summary → decision →
initiative page → research pattern — when real material is still thin. Two principles
govern everything here:

1. **Consistency by construction.** Raw artifacts (transcripts, notes) are generated;
   everything downstream of them — summaries, decision records, initiative updates,
   ledger lines — is produced by the same pipeline that handles real data. The demo
   shows the actual machinery, and the records cannot contradict their sources because
   the machinery derived them.
2. **A contained, recorded blast radius.** Synthetic content attaches only to
   `[DEMO]`-slugged initiatives (and accounts, when calls need one) with their own pages;
   real pages are touched only if the user explicitly asks, with the warning that removal
   will later edit that page. Every path created, page section edited, and ledger line
   added is recorded in the manifest — removal is a reversal, not a hunt.

## Preconditions (checked before anything else)

- **Customer instance only.** Master repo (placeholders in root CLAUDE.md, SoftServe
  credits) → refuse with one line; demo data in the master would ship to every customer.
- **Context populated first:** `os-installation/customization-status.md` shows
  `context-core` installed. Otherwise → stop and point to `/customize-os` — synthetic
  facts generated before the real context exists will contradict it later.
- Interactive session — the scenario needs a human yes.
- `remove` and `status` need only the manifest; if it's missing, say so and stop (never
  guess at what might be synthetic).

## Generate

**Step 1 — read state.** The status file, the coverage lines / facts annex (what's real,
what's GAP), initiative pages, and any scope handed over (a gap list from `/customize-os
demo-readiness`, or the user's scope notes). Scope defaults to *exactly what's missing
for a demo* — never "more is better".

**Step 2 — propose the scenario, then stop.** One message: the `[DEMO]` initiative (name,
one-line premise grounded in the org's real domain and vocabulary from the steering
files), the artifact list with counts and target paths, the story arc — which meeting
leads to which decision, what pattern the interviews will show — and, only if steering
GAPs were requested, which GAP fields get demo values. Volumes stay small; a typical
full scenario is 2 customer calls + 1 internal meeting + 4–6 interview snippets + the
1–2 decisions they motivate. **Nothing is written before the user's yes**; the yes covers
the whole run.

**Step 3 — generate the raw artifacts** into `product-development/inbox/`, following its
naming conventions, every file opening with `> SYNTHETIC — demo data, remove with
/demo-data remove` and carrying `[DEMO]` in its title so the tag flows into filenames and
summaries downstream. Consistency rules: every decision traceable to what was actually
said in a generated meeting; interviews show 2–3 clear recurring patterns plus at least
one divergent voice (so synthesis has something honest to find); names and details are
fictional but the domain, segments, and vocabulary come from the instance's real steering
context. Never reuse a real customer's name.

**Step 4 — run the real pipeline.** The `[DEMO]` initiative page from the initiative
template (status `active`, targets pointing at `[DEMO]`-slugged catalog entries proposed in the same gated change — never at real features, so derived views stay clean; demo initiatives never reach `shipped`; its navigation line);
then `/process-meeting` per transcript with the initiative join declared, and the
`/context-update` sweep for the rest. The engines write summaries, decisions, page
updates, and the ledger exactly as they would for real material.

**Step 5 — steering fills (only if requested).** Each agreed GAP field gets its demo
value suffixed `(demo)`, written behind the gated prompt; the manifest records the exact
before-text for reversal.

**Step 6 — write the manifest** — `os-installation/demo-data-manifest.md`: every created
file (inbox drops may have been *moved* by the pipeline — record final homes), every page
section edited (with the line added), every ledger line, every steering before/after.
Then the readout: what exists now, the one-command removal, and the suggestion to run the
demo flow once (`/weekly-review` or a `/prd-draft` against the demo initiative) to see it
end to end.

## Remove

Read the manifest, show what will be deleted/reverted, get one yes, then reverse it
exactly: delete generated files and `[DEMO]` pages with their navigation lines and
`[DEMO]` catalog entries (gated where the path is gated) — the manifest records catalog
entries and any register/backlink lines it created, so removal reverses them too — strip the recorded ledger lines
(keep the file sorted), revert recorded page-section edits and steering before/afters.
Anything the manifest doesn't record is NOT touched. Files the manifest lists but reality
has since changed (a demo summary someone edited) are listed for the user instead of
force-deleted. Close by deleting the manifest itself and suggesting `/wiki-lint` as the
independent check. Partial removal ("just the interviews") works the same way, manifest
entries for the removed subset cleared.

## Status

Report from the manifest: what synthetic content exists, where, since when, and the
removal command. No manifest → "no synthetic demo data is recorded in this instance."

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   CLAUDE.md (append-only — never re-sort existing lines). The pipeline engines handle
   their own outputs; this skill lists what it wrote directly (raw drops before the
   sweep, the manifest, `[DEMO]` pages).
2. Declare links in frontmatter per `governance/link-schema.yaml` and link every artifact
   from the `[DEMO]` initiative page (row + dated Activity line). Catalog entries only for
   the `[DEMO]`-slugged features (gated), recorded in the manifest for exact removal.
3. In the artifact's header, link the source material it was derived from (for synthetic
   raw files: the banner IS the provenance).
4. End your reply by listing every repo path you wrote or updated.

## Output Quality Self-Check

Before presenting to the user, verify:

- [ ] **Preconditions enforced:** instance not master; context-core installed; scenario approved before the first write
- [ ] **Everything marked:** every synthetic file carries the banner and `[DEMO]` title tag; steering demo values carry `(demo)`
- [ ] **Pipeline, not shortcuts:** summaries, decisions, and page updates came from `/process-meeting` / `/context-update` runs, not written directly by this skill
- [ ] **Internally consistent:** each decision traces to generated meeting content; interviews carry the stated patterns + a divergent voice; vocabulary matches the instance's real steering context; no real customer names
- [ ] **Manifest complete:** every created file (final home after pipeline moves), edited section, ledger line, and steering before/after is recorded — a reader could reverse the run from the manifest alone
- [ ] **Blast radius held:** nothing synthetic attached to real pages without the user's explicit ask (and the removal warning given)
- [ ] **Remove is exact:** only manifest-recorded items touched; drifted items surfaced, not force-deleted; ledger left sorted; manifest deleted at the end
- [ ] **Volumes small:** the scenario stayed at demo scale — enough to show the loop, never a synthetic data lake
