# Playbook — target: `context-core`

Populate the general steering context — the files every session leans on — from the org's
real documents. General means org-level: who the company is, customers, model, team,
stakeholders, segments, quarter goals. Anything tied to one piece of current work belongs
to the `initiatives` target, not here. Coverage is governed by `context-manifest.yaml` in
this skill's folder (the manifest): every manifest item ends this target as **filled**,
**GAP**, or **N/A** — nothing is silently skipped. Shared lifecycle, state, readout, and
write rules: SKILL.md.

Never run the pipeline against the master repo's placeholder files as if they were
sources — in the master, outputs stage outside the repo per SKILL.md.

## Step 1 — Intake

Open by saying, in one short paragraph: what this step populates (the general steering
files), that initiative-specific material has its own later step, and that quality tracks
the model — if a stronger model is available in this environment, this is the phase to
run it on (one line, never repeated).

Then render the **intake table** from the manifest — one row per group, `tier: core`
under **Highly recommended**, `tier: later` under **Nice to have — can be set up later**,
columns: group label · what we're looking for (from the items' `what`, condensed) ·
typical sources (`sources_hint`). Close the table with the manifest's
`handled-elsewhere` pointers as a short "collected elsewhere" list so the picture is
complete. Then ask for, in one message: the org/company name and official website domain
(if the preflight didn't capture them), a one-paragraph self-description in the user's
own words, and sources — file paths, folders, or URLs, mapped loosely to table rows
("the deck covers rows 1–4") or just dumped.

Intake rules:

- **Sources are read in place, never copied into the repo.** Sensitive material
  (board packets, comp data) is accepted as a source, but only steering-safe business
  facts are extracted from it — the privacy contract in root CLAUDE.md wins over
  completeness.
- **Label sources as they arrive:** kind (deck / site / sheet / doc / export) and how
  current the user says it is. When two sources later disagree, these labels — not
  guessing — decide precedence.
- **Readability check before extraction:** verify each file opens (`.md`/`.txt`/`.pdf`
  directly, `.docx` via `textutil`/`pandoc`). List every unreadable file with what would
  fix it ("export the deck to PDF and re-drop") — nothing is silently skipped.
- **Out-of-scope input is parked, not rejected:** initiative briefs, transcripts, or
  anything artifact-specific goes to the status file's **Deferred sources** list with the
  target that will consume it, and the user is told when it will be used.
- **Scale:** dispatch extractors in parallel batches of 3–5 documents. Above ~15 readable
  sources, say how many agents that means and ask before proceeding — in batches, or,
  where the environment offers multi-agent workflow orchestration, as one larger parallel
  pass. Never escalate silently.
- Not everything needs a source: the user may answer any row directly in chat. A stated
  answer is a source (`chat, YYYY-MM-DD`).

Record everything under **Inputs received**; phase → `gathering`.

## Step 2 — Extract

Dispatch `context-extractor` subagents (agent definition in `.claude/agents/`): each
batch gets the relevant manifest items (id, section, `what`) and its sources, and returns
a fact sheet — found (value + verbatim quote + exact source) / conflict (both readings) /
absent. The orchestrating session reads fact sheets only, never the sources themselves.
Persist returned facts into the facts annex (format below) as they arrive, so an
interrupted run resumes without re-extraction.

## Step 3 — Resolve

Settle each manifest item — and each entry of the manifest's `facts:` registry exactly
once, writing every consumer item from that single value:

1. **Precedence:** a dedicated source beats a passing mention (a segmentation sheet beats
   a deck slide that mentions segments); a newer source beats an older one (per the
   intake labels); the user's direct statement beats any document.
2. **Conflicts the rules can't settle** are collected into ONE batched question —
   recommended reading first, both quotes shown. Every conflict the rules did settle is
   still disclosed in the report (winner and loser named), never resolved silently.
3. **N/A is a real outcome:** when the org's shape makes an item inapplicable (a
   single-product org and per-category matrices; no per-use-case segmentation), propose
   N/A with the reason, confirm with the user, and record it. N/A items are shown
   distinctly in the report and never counted as missing.
4. **No invention, no pure inference:** an item with no stated source value stays GAP.
   Condensing stated facts is allowed; adding plausible ones is not.

## Step 4 — Write

Install resolved values into the steering files:

- Fill the template's own fields inside each covered section; keep heading structure.
  Unfilled fields inside an otherwise-filled section become `[GAP: what's missing]` —
  never left as bare bracketed placeholders, never padded with plausible text.
- **Gated files** (`business-context/**`, root CLAUDE.md, and any other path the write
  policy lists) each pass the native write prompt. The root fundamentals block, the H1
  title, and `business-info.md` are written in the same change (the mirror rule);
  segmentation totals must agree with business-info Key Metrics in the same change.
- **A declined write is recorded, not retried:** mark the file's items
  `pending approval` with the reason in the annex, and show them that way in the report.
- Respect the page budgets in `governance/write-back-contract.md`; provenance stays in
  the annex — steering files carry facts, not citation clutter.
- Update the facts annex and the status file's coverage lines as each file lands.

Phase → `installed` when every core-tier file is written or explicitly declined/deferred.

## Step 5 — Verify

Spawn one fresh-context subagent given the manifest, the facts annex, and the written
files — not this session's reasoning. It checks:

1. every manifest item is filled, GAP, N/A, or pending approval — no silent misses, and
   no `section:` in the manifest that no longer matches the file's headings (drift is
   reported, never patched silently);
2. **numbers trace:** every numeric value (ARR, prices, counts, dates) greps back to its
   claimed source; text values sampled;
3. **no residue:** filled sections contain no leftover bracketed placeholders and no
   template example content;
4. **shared facts agree** across every consumer surface listed in the manifest's
   `facts:` registry.

Fix what it finds, re-run once if anything changed, record the result. Phase →
`validated` (kept even though it follows install here — population verifies the live
files, not a draft).

## Step 6 — Report

Render the completion report in chat — same groups, same order, same names as the intake
table, one line per group with per-item detail beneath:

```
| Steering surface | Status | Detail |
✅ filled · ◻ GAP · N/A · ⏸ pending approval
```

- File names are clickable repo links; every filled item names its source; every
  rules-settled conflict shows winner and loser.
- GAPs listed with exactly how to close each ("provide X", "answer in chat", "eligible
  for web research").
- **Worked-example disposition** (customer instances only): scan for the OS's shipped
  synthetic examples (EXAMPLE banners and their slugs) across initiatives, decisions,
  accounts, PRDs, analytics artifacts, feature-index entries, the code-repos worked
  example, and team-learnings seed entries. Real content now exists → list what was
  found by category and ask which to remove. Removal is reference-clean: the pages, their
  navigation lines, feature-index entries, and cross-links go in the same change; purely
  pedagogical `examples/` folders are kept unless the user says otherwise.
- Then offer **web enrichment** once, via the interactive question form: only groups
  whose GAP items carry `web: true` in the manifest are offered (multi-select). Nothing
  eligible → skip the offer entirely.

## Step 7 — Web enrichment (only what the user selected)

Dispatch `context-extractor` in web mode — anchored on the confirmed official domain,
selected GAP items only. Rules: authoritative sources only; **fills GAPs only** — a web
finding that conflicts with an already-installed value is reported, never applied;
anything ambiguous stays GAP. Install per Step 4, verify per Step 5 (new items only),
then render the **delta report**: the same table showing only rows that changed, each new
value marked `(web, {domain}, YYYY-MM-DD)` in the annex.

## The facts annex

`os-installation/customization-facts.yaml` (staging runs: beside the status file) — the
resume point, audit trail, and what re-runs diff against:

```yaml
_updated: YYYY-MM-DD
sources:
  - {id, name, path-or-url, kind, dated, user-label}
items:
  {manifest-item-id}: {status: filled|gap|na|pending-approval, value, quote, source-id, note}
facts:
  {fact-id}: {value, source-id}
```

Quotes stay ≤25 words; privacy-class sources store `(withheld — {source})` as the quote.

## Re-runs

`context-core` can be re-entered anytime — after testing, or when new documents surface.
Read the annex first, diff: new sources are extracted, existing filled values are touched
only when a newer-precedence source or the user contradicts them (the change is named in
the report), GAPs re-resolve, and the report shows before → after per changed item.
