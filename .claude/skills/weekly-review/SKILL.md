---
name: weekly-review
description: Close out the week in one run — Part A, the team digest (initiative-by-initiative movement, stalls, next week's due items, repo health; Slack-ready), then Part B, your execution review (plan vs actual on the week's priorities, learnings, draft priorities for /weekly-plan). --digest runs Part A alone, headless-safe for a Friday cron. One data pass feeds both. Saves to product/reports/{YYYY}-W{XX}-weekly-review.md. Absorbs the old /weekly-synthesis. Run Friday afternoon or Monday morning. Not the account/ARR rollup (/portfolio-pulse), not audience-tailored updates (/status-update), not demand triage (/prioritize-requests).
argument-hint: "[--digest] [last-week]"
group: communication-ops
---

# weekly-review — the week, closed out in one run

Two parts, one data pass. **Part A** is the team digest — what moved, initiative by
initiative, readable by anyone and Slack-ready. **Part B** is your execution review — plan
vs actual, learnings, and next week's draft priorities. The digest is the shared record;
the review is what you do about it.

## Usage

```
/weekly-review              → Part A + Part B (interactive)
/weekly-review --digest     → Part A only — headless-safe, for a Friday cron
/weekly-review last-week    → review the previous week (if you forgot)
```

Best time: Friday afternoon (week fresh, plan next week right after; `/weekly-plan`
follows). Alternative: Monday morning. A `--digest` run earlier in the week is extended in
place by a later full run — same file, keyed by ISO week. Past weeks are never rewritten.

Scheduling and the single-runner rule (one steward-owned scheduled task per team — no
duplicate crons, nothing tied to one person's laptop):
`os-installation/claude-code/scheduled-governance.md`.

## One data pass (read in this order)

**Git is enrichment, not a precondition.** Check once before step 1 (`git log -1` in the
repo). No repository, or a history shorter than the window, and you skip step 2, the
status-change detection in step 1, the catalog-flip read in step 5, and the Contributors
count: Repo Health comes from file signals (files added in the window, modification
dates) and the ledger instead, and the run prints one honest line — "no git history here —
movement read from files and the ledger only". A run that quietly reports an empty week
because git was missing is the bug.

1. `product-development/product/initiatives/` — every page with `status: active` (frontmatter; legacy `_status:` reads the same), plus any page whose status changed during the week. Quiet actives get a `paused?` proposal in the digest (this skill is the named proposer of `paused`). Pull each page's Activity lines dated in
   the window and its Open loops with due dates.
2. Git commits from the last 7 days across `product-development/` — catches changes no
   Activity line records.
3. `product-development/product/decisions/` — entries dated this week. Each entry's
   `initiatives:` frontmatter (legacy `Initiative:` header) routes it: a named slug → that initiative's bullet; empty → "Also
   this week".
4. The week's summaries — meetings and calls (`meetings/*/summaries/`,
   `customers/accounts/*/calls/summaries/`) plus research
   (`user-insights/*-interview-insights.md` session reports and the
   `user-insights/{topic}-{date}.md` cross-interview syntheses) — their `initiatives:`
   frontmatter (legacy `Initiatives touched:`) routes the same way.
5. `product-development/product/strategy/current-quarter.md` — for the quarter checkpoint;
   the latest file in `strategy/roadmaps/` when the team keeps one; and any
   `product-development/feature-index.yaml` status flip in the week's diff (`planned` →
   `live` / `retired`) — read only, `/feature-launch-gate` is the catalog's one status writer.
6. The latest report in `governance/health/` — staleness count.
7. `product-development/product/user-insights/feature-requests/` — records with `requested:`
   in the window, and their `tracker_ref` state (`"-"` = awaiting tracker push). When a
   tracker MCP is connected (Linear / Jira / Asana), cross-check tickets labeled
   `customer-request` created in the window.
8. Transcripts dated in the window — `product-development/product/user-insights/transcripts/`
   (the central customer-facing archive) and `meetings/*/transcripts/` (internal meetings
   and retros, which stay there by design) — diffed against `governance/processed.txt`.
   Carry two numbers into Repo Health: how many landed this week, with their accounts, and
   how many are not yet folded.

**Part B additionally:** `planning/{YYYY}-W{XX}-weekly-plan.md` (what
you intended — if none exists, note "week wasn't planned, reviewing what happened only" and
suggest `/weekly-plan` Monday), `planning/` daily plans (what actually
happened), PRDs modified this week (for work no initiative tracks),
`launches/`, `user-insights/` (research conducted). MCPs when
connected: Linear/Jira for completed tasks, analytics for launched-feature metrics.

## Part A — Team Digest (Slack-ready)

```markdown
## 📋 Weekly Review — Week of {date range}

### Initiatives

**{Area}**

- **[{slug}]({link to page})** ({status}) — {1-2 lines: what moved, from this week's Activity}
  - ⚠️ {overdue open loop — owner — days overdue} (only when true)
- **{slug}** (active) — no movement this week. {One line: what it's waiting on, from Open loops.}

{repeat per area — group by each initiative's `areas:` frontmatter, display names from
`feature-index.yaml`; a page declaring only `features:` gets its area resolved through the
catalog; an initiative spanning two areas is listed under the first. One area in play →
flat list, no header.}

Quiet this week: {catalog areas with no active initiative — names only} (omit when none)

### Also this week (no initiative)

- **Decisions:** {title} — {one line} ({link})
- **Customer calls:** {customer}: {key takeaway, role-attributed quote if relevant}
- **Research:** {session report or cross-interview synthesis} — {one line} ({link})
- **Feature requests:** {request} — {account} — {pending push | {tracker_ref}} ({link to record})
- ⏳ {N} request(s) awaiting tracker push — `/create-tickets push` (only when N > 0)
- **Analytics:** {metrics, queries, schemas, experiments that changed}
- **Competitive:** {new entries or matrix updates}
- **Retros / lessons:** {list}

### Next week

- {Open loop due within 7 days} — {owner} — {due date} — {initiative}
- {Launch or gate expected: {initiative} → `/feature-launch-gate`}
- **Quarter checkpoint:** {one line — which current-quarter objective this week's movement served, or "no objective moved this week"; when current-quarter.md is still the unfilled template, say so once — "quarter not filled in — `/customize-os`" — and move on}
- **Catalog:** {`{feature}` planned → live (shipped {date}) / retired, one line} (only when a status flipped this week; add the roadmap in the same line when the latest `roadmaps/` file changed)

### ⚡ Top 3 Things to Know

1. {Most important new information}
2. {Second}
3. {Third}

### 📊 Repo Health

- Files added: {N} · Contributors: {N} of {team size} {— first-time contributor 🎉 if any}
- Stale files (latest /wiki-lint report): {N}
- Transcripts: {N} this week ({accounts}){ · {M} not yet folded — `/process-meeting`, only when M > 0}

### 🔎 Where to look

- {The one page worth opening this week} ({link}) — {why, half a line}
- {Second, only when there is one}
```

**If nothing changed this week, don't skip it.** Post the digest anyway with:

> No changes this week. If decisions were made or customer calls happened, they should be
> checked in. Quick reminder: /decision-log-entry after meetings with decisions,
> /process-meeting after calls.

The gentle nudge prevents the repo from going silent without being preachy.

### Digest rules

1. Keep Part A under 500 words. Scan, not report.
2. One bullet per active initiative, **including the silent ones** — "no movement" on an
   active initiative is information, not noise.
3. Route by declared links first (`initiatives:` frontmatter on decisions and summaries; legacy headers on
   summaries); use the git diff only for changes that carry no header.
4. "Top 3 Things to Know" is the most-read section. Prioritize: decisions affecting the
   whole team > customer insights > metric movements.
5. Tag specific people when an item is relevant to them (roster in root CLAUDE.md).
6. Messenger posting (Slack, Teams — whichever team-messenger MCP is connected) is
   additive — the repo record is written first, regardless; a messenger-only digest leaves
   no baseline for next week's diff. A `--digest` (headless) run posts automatically when
   a messenger MCP is connected and otherwise notes "not posted — repo record only" in its
   run summary; interactive runs show the draft and ask before posting.
7. Drop empty categories in "Also this week" — no stub bullets, no "none this week". If
   every category is empty, the section goes with them.

## Part B — Execution Review (default; skipped by --digest)

```markdown
## Execution Review

### TL;DR
- {5-6 bullets: PRDs advanced/stalled, launches, completion rate, key win, key challenge}

### Priorities — plan vs actual
#### Priority 1: {title}
**Planned:** {intent} → **Actual:** {outcome} — ✅ Complete / 🟡 Partial / ❌ Not started
- {task-level detail only where it explains the gap; carried-over items get a why}
{repeat for top 3}

### Top 3 Learnings
- {What worked / didn't — specific, with the concrete change for next time. "Work harder"
  is not a learning.}

### Next Week Preview
1. {Draft priority — why: carry-over / new urgent / strategic next step}
2. {…}
3. {…}

**Items to unblock Monday:** {blocker — blocked by whom — specific ask}
```

Decisions and metric movements are NOT restated here — Part A already carries them; Part B
links and adds only the so-what for your own execution.

**Offer after Part B:** append durable process learnings to
`meetings/retros/lessons-learned.md` (`- YYYY-MM-DD — lesson (source link)`); run
`/weekly-plan` to formalize next week.

**"Full review" (only when asked):** expand Part B with stakeholder pulse (engagement gaps,
new relationships), task-level execution metrics (completion / carry-over / scope-creep
rates), a PRD pipeline table with stage movement, meeting-value assessment, and pattern
analysis (recurring blockers, underestimated task types, best deep-work windows).

## Save

`product-development/product/reports/{YYYY}-W{XX}-weekly-review.md` — one file per
ISO week (frontmatter: `week:`, `week_start:`, `week_end:`, `quarter:`). Append the nav row
to `reports/CLAUDE.md` on first write of the week.

## Boundaries

- `/portfolio-pulse` — the account/ARR rollup (exec lens). Pair on Friday for the full picture.
- `/status-update` — audience-tailored narratives (your manager, an exec, XFN partners).
- `/prioritize-requests` — demand triage. The rollup triangle: portfolio-pulse rolls up
  **accounts**, this skill rolls up **the week**, prioritize-requests rolls up **demand**.
- `/process-meeting` — files the summaries this skill reads; run it first when transcripts
  are still unprocessed (the session-start fold backlog will say so).

## Output quality self-check

- [ ] Every active initiative has a bullet, silent ones included, grouped by area
- [ ] Declared links routed first (`initiatives:` frontmatter, legacy headers read the same);
      git diff only filled the gaps — and was skipped honestly when there is no history
- [ ] Empty "Also this week" categories dropped, not stubbed
- [ ] Part A under 500 words, Slack-ready, saved to the repo regardless of posting
- [ ] Part B compares against the actual weekly plan (or says the week wasn't planned)
- [ ] Learnings are specific and actionable; at least one thing that didn't go well, with a
      root cause
- [ ] Next-week draft priorities grounded in this week's outcomes; blockers have owners and
      a Monday action
- [ ] Nothing restated across parts — decisions live in Part A, links elsewhere
- [ ] File saved to `reports/`, nav row appended, `/weekly-plan` offered

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
