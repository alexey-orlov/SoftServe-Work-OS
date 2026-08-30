# Write-Back Contract

Every skill that writes a file into this repo closes the loop in the same way. This file is
the contract's source of truth; each writing skill carries a short "Write-back (mandatory)"
block that points here. Change the contract here — the blocks in skills stay stable.
Exempt (nothing to write back): `slack-message` (Slack is the artifact's home),
`context-update` and `wiki-lint` (they ARE the loop), `code-qa` (answers live in chat;
durable findings route via `/context-update`).

**Why this exists:** the repo is a self-updating wiki. A file without a navigation entry is
invisible to every future session; an index nobody produces goes stale the day it's written.
The failure mode this contract prevents is *passive accumulation* — files landing in folders
while the maps that make them findable rot. Unwritten-back work is unfinished work.

## The four content classes

| Class | Examples | Rule |
|---|---|---|
| **Raw material** | `user-insights/transcripts/` (the central tagged archive), `meetings/*/transcripts/`, source docs | Bodies immutable. Never edit; wiki pages link INTO them (provenance). The tag FRONTMATTER on a transcript is filing metadata, not content — corrected only via `/retag-transcript`, every change logged in `tag-amendments:`. `product-development/inbox/` is staging, not yet raw material — `/process-meeting`'s move into the raw home (customer-facing → `user-insights/transcripts/{date}-{account}-{type}.md`; internal meetings/retros → that series' `transcripts/`) is the filing act. |
| **Records** | decision log, call/meeting summaries, digests, experiment results, health reports | Append-only dated streams. New file per event; never rewrite history. |
| **Living pages** | registry: `write-policy.yaml#living-pages` — e.g. `business-info.md`, `account-context.md`, `initiatives/*.md`, `competitors/*/teardown.md` | Edit in place to current truth. Never stack "UPDATE:" lines — a newer fact replaces the older one; if the change itself matters, it becomes a decision-log entry or an Activity line. Bump the page's `_updated:` date. |
| **Deliverables** | PRDs, RFCs, analyses, prototypes, checklists | Work products that are team knowledge. Saved in their functional folder, registered in navigation, linked from their initiative page. |

## Routing by content type

The canonical table for any durable takeaway — used by the capture loop
(`.claude/team-learnings.md` header), `/context-update`, `/process-meeting`, and
`/session-retro`. Narrowest scope wins; the target path's tier in
`governance/write-policy.yaml` decides the mechanics — the loop never invents its own
permission model.

| Content | Destination | Tier → action |
|---|---|---|
| Skill- or agent-specific rule / gotcha | that skill's SKILL.md self-check (or the agent file under `.claude/agents/`) | gated — propose the exact diff, apply on the user's in-session yes; large reworks flag "eval-first" |
| Cross-cutting agent-behavior rule | `.claude/team-learnings.md` | gated — propose one line, apply on the user's in-session yes; at the ~30-line cap, name the weakest entry to prune |
| Team-process lesson | `product/meetings/retros/lessons-learned.md` | auto — append dated line with source |
| Product choice / hindsight | `product/decisions/` | auto — dated entry |
| Business / steering fact | its gated steering file (listed in `write-policy.yaml`) | gated — exact before/after + in-session yes; headless → proposal |
| Structural change — folders created/renamed/dissolved, templates, what-goes-where conventions | the structure itself | gated mechanics ALWAYS — propose, apply only on an in-session yes (templates are gated by policy glob; folder conventions by this rule). Routine per-file nav appends (step 1 of the uniform block) stay auto |
| Personal preference / private content | personal OS | never this repo (privacy contract) |

Gated changes that can't be approved in-session land as proposal files
in `governance/proposals/` (format in that folder's CLAUDE.md).

## The uniform block (canonical text)

Writing skills carry exactly this, after their save-location section:

```markdown
## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   `CLAUDE.md` (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Declare the artifact's links in its frontmatter per `governance/link-schema.yaml` —
   resolve them YOURSELF from context before filing (initiative-scoped work names its
   one initiative; the initiative page gets the artifact row filled + a dated Activity
   line in the same change). A brand-new feature/area → propose the catalog entry
   (`feature-index.yaml`, gated) in the same confirmed change that registers the work.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.
```

## Rules behind the block

1. **Append to the END, never re-sort.** Two teammates adding files the same day must not
   conflict. The only thing allowed to re-order a navigation list is `/wiki-lint` (single
   writer for mechanical order — its default run, and only where duplicate entries
   collided). Modeled on `decision-log-entry` Rule 3.
2. **Check before creating.** Before adding a catalog entry to `feature-index.yaml` or
   creating an initiative page, read the existing slugs — near-duplicates are merged,
   not multiplied, and a NEW slug must be unique across areas + features + initiatives
   (the versioned-initiative pattern: feature `time-off-requests`, initiatives
   `time-off-requests-v1`, `-v2`, …). One home per item; other pages link, never restate.
3. **Write policy applies to every write.** The tier mechanics are stated once, in the
   header of `governance/write-policy.yaml` — auto: write directly; gated: exact
   before/after + the user's in-session yes at the write prompt, and never
   auto-committed or pushed (headless → proposal). Point there; never restate.
4. **Provenance.** Every non-obvious claim in a wiki page links to its source, relative to
   the page (a summary links its transcript; account-context links summaries; a distilled
   chat fact cites `(chat, YYYY-MM-DD)`). Evidence-bound register: specific, no filler,
   inferences marked "(inferred)", dates as YYYY-MM-DD, "-" for empty sections.
5. **Budgets.** Living pages ≤120 lines (`segmentation-matrix.md` ≤200 — table-heavy by
   design); folder CLAUDE.md ≤80 lines; root CLAUDE.md ≤150. When a page outgrows its
   budget, split a subpage and link it — don't let it sprawl. `/wiki-lint` check 6
   enforces the same numbers — change them here and there in the same change.
6. **The ledger** (`governance/processed.txt`) is appended only by ingest
   skills — the ones that consume raw sources: `/context-update`, `/process-meeting`, and
   `/user-research-synthesis` (when handed raw transcripts directly). One repo-root-relative
   path per line, kept sorted (`sort -o`). Junk and duplicates are ledgered too, so nothing
   is re-judged. One removal exception: `/demo-data remove` strips exactly the lines its
   manifest records (synthetic content leaving the repo takes its ledger lines with it).
7. **Run visibility.** A skill that processed multiple items reports what it did —
   processed / folded / skipped counts and every path touched. Nothing is handled silently.
8. **Joins are declared, not inferred — in frontmatter, by the writer.** Every record
   and artifact carries its links as typed frontmatter keys (`initiatives:`, `areas:`,
   `features:`, `customers:`, `competitors:` — registry and required/optional per type:
   `governance/link-schema.yaml`; legacy bold headers like `Initiative:` /
   `Initiatives touched:` stay readable forever, `/wiki-lint` offers the conversion).
   Required links are resolved by the WRITER from context before filing — creating the
   initiative or proposing the catalog entry when none exists; on a genuine tie, one
   question; never homework left for the reader. Backlinks accumulate on initiative
   pages ONLY: whoever writes a record naming initiative slugs adds the matching
   backlink in the SAME change — a decision linked from each named page's Decisions
   section; a summary linked from one dated Activity line per named slug. The catalog,
   account pages, and teardowns never grow mention lists — reverse views (a feature's
   artifacts, a customer's interviews) are derived by the Console and by queries.
   `/wiki-lint` check 5 flags one-way drift; check 12 enforces the whole contract.

## One writer per surface

| Surface | Only writer |
|---|---|
| `decisions/CLAUDE.md` "Recent Decisions" list | `/decision-log-entry` (and `/decision-doc` via the same rule) — append-only |
| `feature-index.yaml` (the catalog) | New entries (`status: planned`) proposed by `/prd-draft` and `/context-update` in the same gated change that creates the targeting initiative; `/customize-os` seeds areas + features once during guided setup. Status flips are `/feature-launch-gate` ONLY — `planned → live` + `shipped:` date on PASS, re-reading the catalog immediately before writing; the kill flow (`/decision-log-entry`) proposes removing a planned-only entry. The catalog holds NO artifact rows — no other skill writes here |
| initiative pages `status:` | transitions are events, each appending a dated Activity line in the same change: `/prd-draft` sets it at creation (exploring/active) · `/feature-launch-gate` flips to `shipped` on PASS (verdict linked) · a kill decision (`/decision-log-entry`) flips to `killed` in the same change · `/weekly-review` proposes `paused` for silent actives · the OS Console dropdown (same rules, `shipped` demands the verdict link) |
| transcript tag frontmatter (`user-insights/transcripts/*`) | `/retag-transcript` only — every change appended to `tag-amendments:`; bodies immutable |
| `governance/processed.txt` | ingest skills (rule 6) |
| `governance/health/` | `/wiki-lint` |
| `governance/proposals/` | headless runs (created), humans (cleared) |
| root CLAUDE.md fundamentals block ↔ `business-info.md` | kept consistent in the SAME change — both gated: the user approves both together in-session; a headless change to business-info files the matching root-block proposal in the same run |
| `segmentation-matrix.md` (segment counts / ARR) | quarterly refresh + `/context-update` segment-shift folds, always gated; its General-matrix totals reconciled with business-info Key Metrics and the root fundamentals ARR in the SAME change |
| `user-insights/transcripts/` (central archive) + `accounts/{c}/calls/summaries/` + `meetings/{type}/` records | `/process-meeting` — files customer-facing transcripts to the central home (`{date}-{account}-{type}.md`, tags proposed from content), writes the summaries in their per-account / per-series homes, internal-meeting transcripts stay under `meetings/{type}/transcripts/`; `/context-update` sweeps gate junk/dups and delegate unprocessed transcripts to it; `/user-research-synthesis` may file directly-handed raw transcripts |
| `product/user-insights/` | `/process-meeting` (`{date}-interview-insights.md`, per session) and `/user-research-synthesis` (`{topic}-{date}.md`, cross-interview — queries transcripts by tag) — distinct filename patterns; the History cross-link in each participant's `account-context.md` lands in the same change; `interview-guides/` → `/interview-guide`, `journey-maps/` → `/journey-map` |
| `reports/` (periodic rollups) | by filename prefix: `*-weekly-review.md` → `/weekly-review` · `*-portfolio-pulse-*.md` → `/portfolio-pulse` · `*-status-*.md` → `/status-update` · `*-daily-batch.md` → `/process-meeting` |
| `planning/` (forward plans) | by filename prefix: `*-daily-plan.md` / `*-draft.md` → `/daily-plan` · `*-weekly-plan.md` → `/weekly-plan` |
| `meetings/retros/lessons-learned.md` | append-only, by `/process-meeting`, `/weekly-review`, and `/context-update` |
| `meetings/{type}/docs/feedback-*.md` | `/meeting-feedback` |
| `product-development/inbox/` | integrations (and humans) drop files, `/demo-data` drops its marked synthetic raw files; `/context-update` sweeps gate them; `/process-meeting` moves them out to their transcript home; humans clear junk (file + ledger line together) |
| `user-insights/feature-requests/` records | created by `/process-meeting`; `tracker_ref` set only by `/create-tickets` push mode |
| navigation list re-ordering | `/wiki-lint` only (its mechanical repairs, run by default) |
| `engineering/code-repos.yaml` + `engineering/codebases/*.md` | `/connect-code` (create, refresh, regenerate) — `/code-qa` reads only, writes nothing |
| `competitive-research/` living surfaces — `competitive-landscape.md`, `competitive-matrix*.md`, `competitors/*/teardown.md` | `/competitor-analysis` owns them; `/context-update` and `/process-meeting` may refresh matrix cells, teardown facts, and landscape lines when folding call-borne intel; `/customize-os` may seed landscape and matrix rows once during guided setup |
| `competitive-research/intel/` monthly records | `/competitor-analysis` monitoring mode only — append-only, one `{YYYY-MM}.md` per run |
| `product/PRDs/{area}/` PRD files (`{initiative-slug}-prd.md` — one PRD per initiative; a feature's history is its initiatives' PRDs) | `/prd-draft` — creates and iterates; other skills link, never edit the PRD body |
| `product/PRDs/{area}/` jobs-breakdown + job-spec files | by filename suffix: `{initiative-slug}-jobs-breakdown.md` → `/jobs-breakdown` · `{initiative-slug}-{job-slug}-job-spec.md` → `/job-spec-draft` — living docs, edited in place by their writer; other skills link, never edit |
| `product/PRDs/{area}/reviews/` | by filename suffix, all keyed by INITIATIVE slug: `{initiative-slug}-assumption-map.md` → `/assumption-map` · `{initiative-slug}-red-team.md` → `/red-team` · `{initiative-slug}-challenge-{YYYY-MM-DD}.md` → `/prd-challenge` (dated, one per run) · `{initiative-slug}-premortem.md` → `/pre-mortem` (this token, everywhere) · `{initiative-slug}-{job-slug}-job-spec-challenge-{YYYY-MM-DD}.md` → `/job-spec-challenge` (dated, one per run) · `{initiative-slug}[-{job-slug}]-handoff-check-{YYYY-MM-DD}.md` → `/pm-handoff` (dated, written on user request only) — the standalone skills also run as `/prd-challenge` lenses and keep these same filenames |
| `product/prototypes/` | by filename suffix: `{slug}.html`, `*-{v0,lovable,bolt}-prompt.md`, `design-system/` cache → `/prototype` · `{slug}-feedback-log.md` → two writers by section: `/prototype` creates it with the build record, `/prototype-feedback` appends rounds · `history/` snapshots → `/prototype-feedback` (exempt from nav listing by the folder's convention) · `*-challenge-round-[N].md` → `/prototype-challenge` · `*-napkin-sketch.md` → `/napkin-sketch` · `*-first-draft.md`, `*-reference-impl/` → `/code-first-draft` |
| `product/launches/` (launches are launches of INITIATIVES) | `{initiative-slug}-launch-checklist.md` → `/launch-checklist` · `{initiative-slug}-gate-{date}.md` verdicts → `/feature-launch-gate` — both files of one launch sort together |
| `analytics/metrics/{area}/` | by filename prefix: `feature-metrics-*` → `/feature-metrics` · `{job}-experiment-metrics.md` → `/experiment-metrics` · `north-star-*` → `/define-north-star` · `metrics-framework-*` / `metric-hierarchy-*` → `/metrics-framework` |
| `.claude/team-learnings.md` | gated — agents propose entries via the capture loop in that file's header, `/session-retro`, or `governance/proposals/`, applied only on the user's in-session yes |
| `strategy/business-context/platform-model.md` | PM fills and maintains (gated; `/customize-os` may fill it during guided setup from the PM's own sources); skills read only — `/job-spec-draft` and `/jobs-breakdown` cite it, never edit it |
| `engineering/tech-constraints.md` | Engineer fills and maintains (gated; `/customize-os` may fill it during guided setup from the Engineer's own sources); skills read only — confirmed answers from job specs' Engineering-confirmations lists are folded in by the Engineer, not by skills |
| `strategy/business-context/` initial population — `business-info.md`, `stakeholders.md`, `segmentation-matrix.md` | `/customize-os` (guided setup, gated per file); afterwards the living-page and mirror rules above govern ongoing edits |
| `os-installation/customization-status.md` + `customization-facts.yaml` | `/customize-os` — program state and the resolved-facts annex, updated once per run at the close |
| `os-installation/demo-data-manifest.md` | `/demo-data` — created by generate, cleared by remove |
| `product-development/toolchain.yaml` | choices (`approach:`/`source:` + `system:`): `/customize-os` guided targets for the two rich surfaces, the OS Console Integrations tab for any surface (each save gated) — `connection:` blocks: `/connect-mcps` only, after a tested connect; the console locks a surface's system field once its `connection:` exists |
| `os-installation/mcp-integration-logs/` | `/connect-mcps` — one frontmattered log per run; the console reads frontmatter for live status, writes nothing here |
| `governance/write-policy.yaml` `tiers:` list | steward via editor, or the OS Console Gated-files page (add/remove rule — the console regenerates `.github/CODEOWNERS` in the same commit and reminds about the Azure path filter) |
| initiative pages `## Instructions` + `## Sources` (incl. order) | the PM — directly or via the OS Console (instructions editor, source drag-reorder); skills read, never edit |
| `governance/proposals/` clearing from UI | the OS Console reject action (deletes the file, comment in the commit message) — same "humans clear" rule as above, one more surface for it |