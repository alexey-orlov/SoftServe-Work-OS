# Write-Back Contract

Every skill that writes a file into this repo closes the loop in the same way. This file is
the contract's source of truth; each writing skill carries a short "Write-back (mandatory)"
block that points here. Change the contract here — the blocks in skills stay stable.

**Why this exists:** the repo is a self-updating wiki. A file without a navigation entry is
invisible to every future session; an index nobody produces goes stale the day it's written.
The failure mode this contract prevents is *passive accumulation* — files landing in folders
while the maps that make them findable rot. Unwritten-back work is unfinished work.

## The four content classes

| Class | Examples | Rule |
|---|---|---|
| **Raw material** | `*/transcripts/`, source docs | Immutable. Never edit; wiki pages link INTO them (provenance). `product-development/inbox/` is staging, not yet raw material — `/process-meeting`'s move into a `transcripts/` home is the filing act. |
| **Records** | decision log, call/meeting summaries, digests, experiment results, health reports | Append-only dated streams. New file per event; never rewrite history. |
| **Living pages** | `business-info.md`, `stakeholders.md`, `segmentation-matrix.md`, `current-quarter.md`, `account-context.md`, `initiatives/*.md`, `competitive-landscape.md`, `competitive-matrix*.md`, `competitors/*/teardown.md` | Edit in place to current truth. Never stack "UPDATE:" lines — a newer fact replaces the older one; if the change itself matters, it becomes a decision-log entry or an Activity line. Bump the page's `_updated:` date. |
| **Deliverables** | PRDs, RFCs, analyses, prototypes, checklists | Work products that are team knowledge. Saved in their functional folder, registered in navigation, linked from their initiative page. |

## Routing by content type

The canonical table for any durable takeaway — used by the capture loop
(`.claude/team-learnings.md` header), `/context-update`, `/process-meeting`, and
`/session-retro`. Narrowest scope wins; the target path's tier in
`governance/write-policy.yaml` decides the mechanics — the loop never invents its own
permission model.

| Content | Destination | Tier → action |
|---|---|---|
| Skill- or agent-specific rule / gotcha | that skill's SKILL.md self-check (or the agent file under `.claude/agents/`) | admin — propose the exact diff; large reworks flag "eval-first" |
| Cross-cutting agent-behavior rule | `.claude/team-learnings.md` | admin — propose one line; at the ~30-line cap, name the weakest entry to prune |
| Team-process lesson | `product/meetings/retros/lessons-learned.md` | auto — append dated line with source |
| Product choice / hindsight | `product/decisions/` | auto — dated entry |
| Business / steering fact | its confirm-tier file (`write-policy.yaml#confirm`) | confirm — exact before/after + in-session yes; headless → proposal |
| Structural change — folders created/renamed/dissolved, templates, what-goes-where conventions | the structure itself | admin mechanics ALWAYS — propose, never apply (templates are admin by policy glob; folder conventions by this rule). Routine per-file nav appends (step 1 of the uniform block) stay auto |
| Personal preference / private content | personal OS | never this repo (privacy contract) |

Admin- and confirm-tier proposals that can't be approved in-session land as files in
`governance/proposals/` (format in that folder's CLAUDE.md). The gate itself — this file,
`write-policy.yaml`, hooks — may be *proposed* against but is applied only by the steward
via PR, never in-session.

## The uniform block (canonical text)

Writing skills carry exactly this, after their save-location section:

```markdown
## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   `CLAUDE.md` (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Feature-scoped artifact → propose the `product-development/feature-index.yaml` addition
   and apply it only after the user confirms (Tier 2 in `governance/write-policy.yaml`).
   Initiative-scoped → link the artifact from `product-development/product/initiatives/{slug}.md`.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.
```

## Rules behind the block

1. **Append to the END, never re-sort.** Two teammates adding files the same day must not
   conflict. The only thing allowed to re-order a navigation list is `/wiki-lint --fix`
   (single writer for mechanical order). Modeled on `decision-log-entry` Rule 3.
2. **Check before creating.** Before adding a feature key to `feature-index.yaml` or
   creating an initiative page, read the existing keys/pages — near-duplicates are merged,
   not multiplied. One home per item; other pages link, never restate.
3. **Write policy applies to every write.** Auto-tier paths (the default) are written
   directly. Confirm-tier paths: show the exact before/after, get an in-session yes first;
   headless runs write a proposal to `governance/proposals/` instead.
   Admin-tier paths: never edit on your own initiative — show the exact change; the
   steward's in-session yes (the write-guard prompt) applies it, otherwise file it as a
   proposal in `governance/proposals/` for the steward to land via PR.
4. **Provenance.** Every non-obvious claim in a wiki page links to its source, relative to
   the page (a summary links its transcript; account-context links summaries; a distilled
   chat fact cites `(chat, YYYY-MM-DD)`). Evidence-bound register: specific, no filler,
   inferences marked "(inferred)", dates as YYYY-MM-DD, "-" for empty sections.
5. **Budgets.** Living pages ≤120 lines; folder CLAUDE.md ≤80 lines; root CLAUDE.md ≤150.
   When a page outgrows its budget, split a subpage and link it — don't let it sprawl.
6. **The ledger** (`governance/processed.txt`) is appended only by ingest
   skills — the ones that consume raw sources: `/context-update`, `/process-meeting`, and
   `/user-research-synthesis` (when handed raw transcripts directly). One repo-root-relative
   path per line, kept sorted (`sort -o`). Junk and duplicates are ledgered too, so nothing
   is re-judged.
7. **Run visibility.** A skill that processed multiple items reports what it did —
   processed / folded / skipped counts and every path touched. Nothing is handled silently.
8. **Initiative joins are declared, not inferred.** Records that can touch current work
   carry an initiative header — decision entries `Initiative:`, meeting/call summaries
   `Initiatives touched:` — set to slug(s) from `product/initiatives/` or `-`. Whoever
   writes the record adds the matching backlink in the SAME change: the decision linked
   from each named page's Decisions section; the summary linked from one dated Activity
   line per named slug. `/wiki-lint` check 5 flags one-way drift (a named slug with no
   backlink); pages linking records that don't name them is fine.

## One writer per surface

| Surface | Only writer |
|---|---|
| `decisions/CLAUDE.md` "Recent Decisions" list | `/decision-log-entry` (and `/decision-doc` via the same rule) — append-only |
| `feature-index.yaml` feature keys | `/prd-draft` and `/context-update` propose (Tier 2); other skills only append artifact rows to existing keys (also Tier 2) |
| `governance/processed.txt` | ingest skills (rule 6) |
| `governance/health/` | `/wiki-lint` |
| `governance/proposals/` | headless runs (created), humans (cleared) |
| root CLAUDE.md fundamentals block ↔ `business-info.md` | kept consistent in the SAME change — `business-info.md` is Tier 2 confirm; the root block is admin: the steward approves both together in-session; a headless or non-steward change to business-info files the matching root-block proposal in the same run |
| `segmentation-matrix.md` (segment counts / ARR) | quarterly refresh + `/context-update` segment-shift folds, always Tier 2 confirm; its General-matrix totals reconciled with business-info Key Metrics and the root fundamentals ARR in the SAME change |
| `accounts/{c}/calls/` and `meetings/{type}/` transcripts + summaries (incl. `retros/transcripts/`) | `/process-meeting` — `/context-update` sweeps gate junk/dups and delegate unprocessed transcripts to it; it never writes call/meeting summaries itself |
| `customers/research-synthesis/` | `/process-meeting` (`{date}-interview-insights.md`, per session) and `/user-research-synthesis` (`{topic}-{date}.md`, cross-interview) — distinct filename patterns |
| `reports/` (periodic rollups) | by filename prefix: `*-weekly-review.md` → `/weekly-review` · `*-portfolio-pulse-*.md` → `/portfolio-pulse` · `*-status-*.md` → `/status-update` · `*-daily-batch.md` → `/process-meeting` |
| `planning/` (forward plans) | by filename prefix: `*-daily-plan.md` / `*-draft.md` → `/daily-plan` · `*-weekly-plan.md` → `/weekly-plan` |
| `meetings/retros/lessons-learned.md` | append-only, by `/process-meeting`, `/weekly-review`, and `/context-update` |
| `meetings/{type}/docs/feedback-*.md` | `/meeting-feedback` |
| `product-development/inbox/` | integrations (and humans) drop files; `/context-update` sweeps gate them; `/process-meeting` moves them out to their transcript home; humans clear junk (file + ledger line together) |
| `customers/feature-requests/` records | created by `/process-meeting`; `tracker_ref` set only by `/create-tickets` push mode |
| navigation list re-ordering | `/wiki-lint --fix` only |
| `engineering/code-repos.yaml` + `engineering/codebases/*.md` | `/connect-code` (create, refresh, regenerate) — `/code-qa` reads only, writes nothing |
| `competitive-research/` living surfaces — `competitive-landscape.md`, `competitive-matrix*.md`, `competitors/*/teardown.md` | `/competitor-analysis` owns them; `/context-update` and `/process-meeting` may refresh matrix cells, teardown facts, and landscape lines when folding call-borne intel |
| `competitive-research/intel/` monthly records | `/competitor-analysis` monitoring mode only — append-only, one `{YYYY-MM}.md` per run |
| `product/PRDs/{area}/` PRD files (`{slug}-prd.md`) | `/prd-draft` — creates and iterates; other skills link, never edit the PRD body |
| `product/PRDs/{area}/reviews/` | by filename suffix: `{slug}-assumption-map.md` → `/assumption-map` · `{slug}-red-team.md` → `/red-team` · `{slug}-challenge-{YYYY-MM-DD}.md` → `/prd-challenge` (dated, one per run) · `{slug}-premortem.md` → `/pre-mortem` — the skills also run as `/prd-challenge` lenses and keep these same filenames |
| `product/PRDs/prototypes/` | by filename suffix: `*-napkin-sketch.md` → `/napkin-sketch` · `*-{v0,lovable,bolt}-prompt.md`, `*-artifacts-v[N].md`, `*-figma-handoff.md` → `/prototype` · `*-feedback-round-[N].md` → `/prototype-feedback` · `*-first-draft.md`, `*-reference-impl/` → `/code-first-draft` |
| `product/launches/` | `{slug}-launch-checklist.md` → `/launch-checklist` · `{slug}-gate-{date}.md` verdicts → `/feature-launch-gate` |
| `analytics/metrics/{area}/` | by filename prefix: `feature-metrics-*` → `/feature-metrics` · `{feature}-experiment-metrics.md` → `/experiment-metrics` · `north-star-*` → `/define-north-star` · `metrics-framework-*` / `metric-hierarchy-*` → `/metrics-framework` |
| `.claude/team-learnings.md` | steward only (admin tier) — agents propose entries via the capture loop in that file's header, `/session-retro`, or `governance/proposals/`; never edit directly |

## Exempt skills

`slack-message` (Slack is the artifact's home),
`context-update` and `wiki-lint` (they ARE the loop), `code-qa` (answers live in chat;
durable findings route via `/context-update`; it writes nothing).
