---
name: context-update
description: Fold new artifacts into the team wiki — transcripts, pasted threads, documents, session facts — routing each piece by TYPE (customer insight, decision, lesson, metric change, competitor intel, stakeholder fact, business fact, initiative material, junk) to its proper page, updating navigation and indexes, and recording every handled file in the ledger. Three modes — sweep (no args: process everything new in product-development/inbox/ and under */transcripts/ via the ledger), single artifact (a path), pasted content ("fold this in"). Detects new initiatives/accounts/competitors and scaffolds their pages, respects the write policy (Tier-2 files need in-session confirmation), skips junk, and always ends with a run summary. Use on /context-update, "fold this in / into context", "update the repo from this thread/doc", after sharing a meeting outcome or document worth remembering, or when the repo looks behind reality. For a meeting or call transcript use /process-meeting instead — sweeps gate transcripts and delegate them to it.
argument-hint: "[path or pasted content]"
group: os-admin
---

# context-update — fold new artifacts into the team wiki

The ingest engine. Everything the team learns gets compiled into the wiki once, immediately,
by this skill — not re-derived per session, not left to humans to file.

## The model

- **Four content classes** (full contract: `governance/write-back-contract.md`):
  raw material (`*/transcripts/`, source docs — read-only inputs, never edited; pages link
  INTO them), records (dated append-only streams: `decisions/`, `calls/summaries/`,
  experiment results), living pages (edit-in-place current truth: `account-context.md`,
  `business-info.md`, `stakeholders.md`, `segmentation-matrix.md`, `current-quarter.md`,
  `initiatives/*.md`), deliverables (PRDs, analyses — functional folders).
- **Index layer**: root `CLAUDE.md` (+ its business-fundamentals mirror block),
  `product-development/feature-index.yaml`, every folder's `CLAUDE.md` file list.
- **Ledger**: `governance/processed.txt` — one repo-root-relative path per
  line = "already folded". Idempotency across runs, machines, and teammates.
- **Write policy**: `governance/write-policy.yaml`. Confirm-tier files
  (business-info, stakeholders, segmentation-matrix, current-quarter, feature-index, root
  CLAUDE.md) are edited only after showing the exact before/after and getting an in-session yes. Headless runs
  write a proposal to `governance/proposals/{date}-{slug}.md` instead.
- Invariant to protect: an agent that reads root CLAUDE.md plus one account page or one
  initiative page has working context for that thread without opening a transcript.

## Modes

1. **Sweep** (default, no input): discover unprocessed artifacts, fold them all, report.
2. **Single artifact** (a path was given): fold just that file. Safe headlessly — update
   the ledger by Read + Write when Bash is unavailable; never assume git.
3. **Pasted content** (text in chat, no file): distill and fold; cite the source as
   `(chat, YYYY-MM-DD, <who shared>)`; **no raw file is created and no ledger entry** — this
   is also the ONLY path for material that must never be committed raw (customer PII,
   pre-announcement numbers): distilled facts land on pages, nothing else lands anywhere.

## Procedure

**0. Orient.** Read root `CLAUDE.md` (loaded anyway) and, once routing is known, the target
account page / initiative page / area CLAUDE.md — before writing anything.

**1. Discover (sweep mode only):**
```bash
comm -23 <(find product-development/product/customers/accounts \
                product-development/product/meetings \
                product-development/inbox \
           -type f \( -path '*/transcripts/*' -o -path '*/inbox/*' \) \
           \( -name '*.md' -o -name '*.txt' -o -name '*.pdf' -o -name '*.docx' \) \
           ! -name 'CLAUDE.md' 2>/dev/null | sort) \
        <(sort governance/processed.txt 2>/dev/null)
```
(No shell globs on purpose — an unmatched `accounts/*/…` glob aborts the whole pipeline in
zsh while the repo has no account folders yet; `-path` matching has no such failure mode
and also covers `retros/transcripts/` and the `inbox/` drop zone.)
If more than ~15 are new, process newest-first and report what was left for the next run —
no silent truncation.

**2. Gate each artifact (cheap checks before folding):**
- **Junk gate**: empty or near-empty files, test recordings, purely social calls with no
  project relevance → ledger it, do not fold, count as "junk".
- **Duplicate gate**: a transcript for an account+date whose summary already exists is a
  re-processing — fold only genuinely new information (usually none), then ledger it, count
  as "dup". Near-identical content inside one batch → ONE routed item, every file ledgered.
- A path already in the ledger verbatim = no-op beyond the summary line.

**2a. Inbox arrivals** (`product-development/inbox/` — arrival contract in its CLAUDE.md):
the gates above run first — junk → ledger the *inbox* path and leave the file (humans
delete the file and its ledger line together). Everything else is a meeting record →
delegate to `/process-meeting` (single writer for transcript → summary → account/portfolio
updates → ledger). It infers the date, detects the category, **moves** the file to its
canonical `*/transcripts/` home, and ledgers the **destination** path — never the inbox
path, which would break `/wiki-lint` check 8 after the move. A file the gates can't place
without a human (unknown account, no matching meeting type) → leave it in the inbox, never
ledger it, and name it in the run summary; it re-surfaces every sweep until someone
renames, files, or deletes it.

**3. Route by TYPE — type beats location.** A decision found inside a customer call still
becomes a `decisions/` entry; the account page carries a one-line pointer, never a restated
copy. Mixed artifacts are split — each part goes to its home, one ledger entry for the file.

| Type | Signal | Destination + follow-through |
|---|---|---|
| Customer insight / request | call transcript, support thread, quote | an unprocessed meeting/call transcript → hand to `/process-meeting` (single writer for transcript → summary → account/portfolio updates → ledger; the junk/dup gates above still run here first). Non-transcript customer facts: rewrite `account-context.md` to current truth → refresh the row in `accounts/CLAUDE.md` and `portfolio.yaml#{c}` (last_call, health, segment fields) → a feature request also lands as one line in the matching feature's PRD open questions or its index entry (Tier 2 → confirm) |
| Decision | "we decided / chose", tradeoff language | `decisions/{YYYY-MM-DD}-{slug}.md` per `/decision-log-entry` format (quick entry is fine — set its `Initiative:` header, slug(s) or `-`) + append to the END of Recent Decisions in `decisions/CLAUDE.md` + link from each initiative page named in the header (same change). From a transcript: automatic, with the transcript linked under Related and the decision flagged in the run summary. Mid-session ("we decided X"): file immediately and show the entry |
| Lesson | "next time…", retro item, agent correction | team-process lesson → append to `meetings/retros/lessons-learned.md`; agent-behavior or skill-specific rule → per the canonical "Routing by content type" table in `governance/write-back-contract.md` (narrowest scope first: the skill's own self-check before `.claude/team-learnings.md`; admin tier — steward's in-session yes applies, otherwise file the exact change in `governance/proposals/`) |
| Metric change | definition/threshold/window moved | edit `analytics/metrics/{area}/…` in place + `data-catalog.yaml` if a table changed |
| Competitor intel | competitor named with a new fact | `competitive-research/competitors/{slug}/teardown.md` (first intel: create the folder + CLAUDE.md stub, copy `handbook/templates/competitor-teardown-template.md`) + refresh the affected `competitive-matrix.md` cells (and the `competitive-landscape.md` line when positioning-level) |
| Stakeholder fact | durable role/preference/decision-power change | `stakeholders.md` (Tier 2 → confirm). **Reconcile the structure, not just the cell**: if the new fact breaks the doc's grouping (a person now leads what the doc splits), MOVE them and fix the grouping — patching one row inside a contradicted scheme is the same staleness failure as not editing |
| Business fact | ICP / pricing / positioning / stage shift | `business-info.md` (Tier 2 → confirm) **and the root CLAUDE.md fundamentals block in the SAME change** — the mirror rule; one without the other leaves the wiki self-contradictory |
| Segment shift | account signed / churned / re-tiered; vertical, size band, or use-case mix changed | update `portfolio.yaml#{c}` segment fields (auto) → refresh the affected cells **and totals** of `business-context/segmentation-matrix.md` (Tier 2 → confirm), keeping its totals equal to the fundamentals block and business-info Key Metrics — the same mirror rule |
| Initiative material | scope change, milestone, artifact for current work; a summary's `Initiatives touched:` header names slugs | the initiative's page in `product/initiatives/` (edit in place — one dated Activity line per declared slug, linking the summary; declared joins beat inference, infer only when the field is absent) + the artifact's own home per its class |
| Code finding | `/code-qa` output worth keeping — a PRD-vs-code discrepancy, a real limit/parameter, a "why" | route by what it changes: discrepancy → one line in the feature PRD's Open Questions + flag the owner; durable limit/parameter → the feature's PRD or metrics doc, cited `repo@sha path:L1-L2`; a "why" worth history → decision entry. Never a page under `engineering/codebases/` — maps route, never store answers |
| New entity | first artifact for an unknown account / initiative / competitor | **index check first** — read `accounts/CLAUDE.md` keys, `initiatives/` pages, `feature-index.yaml`, the `competitive-landscape.md` at-a-glance list BEFORE creating. Then scaffold: account per `/process-meeting`'s customer-call scaffold step; initiative page from the template + `initiatives/CLAUDE.md` line + proposed feature-index `initiatives:` addition (Tier 2); competitor folder + `teardown.md` from the template + matrix column + landscape line |
| Junk | empty, test, purely social | ledger + count |

**3a. New initiative — create the page when the content shows true engagement:** the team
carries its own commitments/deliverables in the thread AND it has expected continuation (a
scoped feature effort, a named program). A topic merely discussed once does NOT qualify —
when in doubt, add an open loop `possible initiative: <x>?` to the closest existing page and
promote on the second artifact at the latest. On ship/kill: set `_status:`, link the gate
verdict, keep the lessons; closed pages stay.

**4. Merge into pages — curation rules (the heart):**
- **Rewrite in place.** Living pages always describe current truth. Never stack "UPDATE:"
  lines; a newer fact replaces the older one. If the change itself matters, it becomes a
  decision entry or one Activity line — not a residue on the page.
- **Provenance**: every non-obvious claim links to its source, relative to the page
  (summaries link transcripts; account pages link summaries; pasted facts cite
  `(chat, YYYY-MM-DD, <who>)`).
- Evidence-bound register: specific, no filler; inferences marked "(inferred)"; "-" for
  empty sections; dates as YYYY-MM-DD. Don't copy quotes longer than one line — distill.
- **Budgets**: living pages ≤120 lines (trim Activity first; split a subpage if truth
  genuinely outgrows it); folder CLAUDE.md ≤80 lines.
- Bump the page's `_updated:` date.

**5. Update navigation + indexes (mandatory, same run):** every new file gets a line at the
END of its folder's `CLAUDE.md` list (append-only — never re-sort); new folders get a 5-line
CLAUDE.md stub + a parent entry; feature-index changes are proposed and confirmed (Tier 2).

**6. Ledger.** Append every handled path — folded, junk, and duplicate alike:
```bash
printf '%s\n' "<repo-relative-path>" >> governance/processed.txt \
  && sort -o governance/processed.txt governance/processed.txt
```
(Headless: Read the ledger, Write it back with the new line — no Bash.) Pasted content is
never ledgered (no file exists).

**7. Commit (sweep / interactive modes; skip when the harness owns git).**
```bash
git add -A && git commit -m "context: <one line on what changed>"
```

## Out of scope

- Never edit raw material (`*/transcripts/`, source docs) — read-only inputs.
- `governance/health/` is `/wiki-lint`'s surface; `governance/processed.txt` is appended here but
  never rewritten beyond sorting; admin-tier paths are never edited (propose to steward).
- Deliverable *creation* belongs to its skill (`/prd-draft`, `/process-meeting`, …) —
  this skill folds facts and fixes the maps; it doesn't ghost-write PRDs or summaries from
  transcripts.

## Run summary (always output)

`processed N (folded F · junk J · dup D) — inbox: filed M · left L — pages touched: … —
records filed: decisions X · summaries Y — proposals filed: … — new entities: … —
backlog: …` — plus one line per
substantive change so the team can correct the folding, and an explicit list of every
Tier-2 confirmation that was asked (or proposal filed).

## Self-check before finishing

- No invented facts; every new claim traceable to a source link that resolves.
- Superseded facts removed, not stacked; "-" for empty sections; pages within budget;
  `_updated:` bumped on every touched living page.
- Routing went by TYPE: no decision buried in an account page, no business fact patched
  without its root-CLAUDE.md mirror, no segment shift folded without the matrix cells and
  totals reconciled, no stakeholder cell patched inside a contradicted grouping.
- Write policy honored: no confirm-tier file changed without an in-session yes (or a
  proposal filed headlessly); no admin-tier file touched.
- Ledger updated for EVERY artifact handled, including junk and duplicates.
- Inbox arrivals ledgered under their destination path (junk under its inbox path);
  nothing left in the inbox unreported.
- Navigation current: every new file has a nav line, every new folder a stub + parent entry.
- New entities got scaffold + nav + index treatment (after the index check).
- **Nothing handled silently**: every discovered artifact appears in the run summary as
  folded, junk, dup, or named backlog.
