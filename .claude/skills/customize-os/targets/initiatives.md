# Playbook — target: `initiatives`

Create the instance's real initiative pages and fold the material behind them into the
repo, so current work has a living spine from day one. Prerequisite: org identity from
`context-core` (at least the company/product basics — pages need real vocabulary).
Shared lifecycle, state, readout, and write rules: SKILL.md.

## Step 1 — Collect

Ask for the names of the org's **current or recent initiatives — at least 3** if they
have that many (fewer is accepted with a note; more is welcome). For each, only the
minimum: one line on what it is, status (`exploring` or `active` — recently finished work
is welcome too if it still gets referenced), owner if known. Then ask, optionally, for
any existing material per initiative — briefs, master docs, call transcripts or
summaries, web pages — explaining this seeds the per-initiative context the delivery
skills (`/prd-draft` onward) build on. Consume the status file's **Deferred sources**
list here: anything parked earlier that names an initiative is now assigned to it,
confirmed with the user.

## Step 2 — Create the pages

Before creating anything, read `product-development/product/initiatives/` and
`feature-index.yaml` — near-duplicates are merged into the existing page, never
multiplied. For each genuinely new initiative:

1. Page from `handbook/templates/initiative-page-template.md`, following the slug and
   size rules in `initiatives/CLAUDE.md`; fill only what the user stated — everything
   else stays the template's placeholders (the page grows through normal work, not
   through padding). If the user named source-of-truth folders or documents for an
   initiative, list them under `## Sources` in priority order; initiative-specific
   guidance (≤400 chars) goes under `## Instructions`.
2. Append the page's line to `initiatives/CLAUDE.md` (end of list).
3. Seed the `feature-index.yaml` CATALOG (gated) — one batch, the catalog's only bulk
   shaping. **Read the resolved `product-areas` fact in `customization-facts.yaml` first**
   — context-core settles it, this target installs it, and the annex's `fi-areas` item
   carries the features it resolved under each area. Play both back as one table: a row
   per area with its features, the resolved names · where each came from · confirm /
   rename / merge. Ask cold ("your 3–6 product areas, in your own words", or derived from
   the initiatives just named) ONLY when the fact came back GAP. Go to the org's documents
   and public site/docs only for the deltas the annex doesn't already carry, reusing the
   source roots context-core Step 7 already confirmed (the annex's `sources:` entries with
   `kind: site` / `docs-site`) — ask for roots again only if none are recorded. Quote where each entry
   came from and let the user correct before applying. Status: `live` (with `shipped:`
   where the date is known) for features the org's site or docs show as shipped,
   `planned` for what it calls upcoming — this batch is the one licensed exception to the
   gate-only status flip (`governance/write-back-contract.md`). Replace the file's
   commented starter areas, file each new initiative's feature under its area, and check
   that every new initiative's frontmatter targets resolve against the seeded catalog.
   After this the index grows organically — `/prd-draft` and `/context-update` propose
   entries as work starts.
4. Offer to list the active ones under **In Flight** in `current-quarter.md` when that
   section was populated.

## Step 3 — Fold the attached material

Route every attached artifact through the engines that own ingestion — never inline:

- **Transcripts / meeting or call records** → `/process-meeting`, one per record, with
  the initiative join declared ("this belongs to {slug}") so summaries land with the
  right `initiatives:` frontmatter and Activity backlinks.
- **Docs, briefs, threads, exports** → `/context-update` (single-artifact mode), join
  declared the same way.
- **Web pages** → fetch the content, then fold it via `/context-update` as pasted
  content, source URL cited.

The engines handle routing, navigation, and the ledger; this target only orchestrates and
then links the resulting artifacts from each initiative page's **Artifacts** section.
Batch bookkeeping: after all folds, confirm every attached item appears in
`governance/processed.txt` (the engines write it; this target only checks) and every
initiative page links what arrived for it. Report processed / folded / skipped counts per
the contract.

Phase → `installed` when pages exist and all attached material is folded; `complete` once
catalog seeding is approved (or explicitly declined → Open — Other).
