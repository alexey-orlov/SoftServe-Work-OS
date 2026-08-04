---
name: weekly-synthesis
description: The team's one weekly digest — what moved initiative by initiative, what stalled, what's due next week, and repo health. Slack-ready and saved to the repo. Run Friday afternoon or before Monday standup.
group: communication-ops
---

# Weekly Synthesis

One digest per week, written once, readable by anyone — teammate, manager, or exec. It looks both ways: what moved this week and what's lined up for next. Initiatives are the spine; changes that belong to no initiative follow; repo health closes.

## When to Use

- Run every Friday afternoon (automate via cron or Claude Code hooks)
- Run manually before Monday standup
- Adjust the day to match your team's timezone and sprint cadence

## Inputs (read in this order)

1. `product-development/product/initiatives/` — every page with `_status: active`, plus any page whose `_status:` changed during the week. Pull each page's Activity lines dated in the window and its Open loops with due dates.
2. Git commits from the last 7 days across `product-development/` — catches changes no Activity line records.
3. `product-development/product/decisions/` — entries dated this week. Each entry's `Initiative:` header routes it: a named slug → that initiative's bullet; `-` → "Also this week".
4. The week's meeting and call summaries — their `Initiatives touched:` headers route the same way.
5. `product-development/product/strategy/current-quarter.md` — for the quarter checkpoint.
6. The latest report in `product-development/_meta/health/` — staleness count.

## Output Format

```markdown
## 📋 Weekly Synthesis — Week of {date range}

### Initiatives

- **[{slug}]({link to page})** ({_status}) — {1-2 lines: what moved, from this week's Activity}
  - ⚠️ {overdue open loop — owner — days overdue} (only when true)
- **{slug}** (active) — no movement this week. {One line: what it's waiting on, from Open loops.}

### Also this week (no initiative)

- **Decisions:** {title} — {one line} ({link})
- **Customer calls:** {customer}: {key takeaway, role-attributed quote if relevant}
- **Analytics:** {metrics, queries, schemas, experiments that changed}
- **Competitive:** {new entries or matrix updates}
- **Retros / lessons:** {list}

### Next week

- {Open loop due within 7 days} — {owner} — {due date} — {initiative}
- {Launch or gate expected: {initiative} → `/feature-launch-gate`}
- **Quarter checkpoint:** {one line — which current-quarter objective this week's movement served, or "no objective moved this week"}

### ⚡ Top 3 Things to Know

1. {Most important new information}
2. {Second}
3. {Third}

### 📊 Repo Health

- Files added: {N} · Contributors: {N} of {team size} {— first-time contributor 🎉 if any}
- Stale files (latest /wiki-lint report): {N}
```

## If Nothing Changed This Week

Don't skip the synthesis. Post:

```markdown
## 📋 Weekly Synthesis — Week of {Date}

No changes this week. If decisions were made or customer calls happened, they should be checked in.

Quick reminder: /decision-log-entry after meetings with decisions, /customer-call after calls.
```

This gentle nudge prevents the repo from going silent without being preachy.

## Rules

1. Keep under 500 words. Scan, not report.
2. One bullet per active initiative, including the silent ones — "no movement" on an active initiative is information, not noise.
3. Route by declared headers first (`Initiative:` on decisions, `Initiatives touched:` on summaries); use the git diff only for changes that carry no header.
4. "Top 3 Things to Know" is the most-read section. Prioritize: decisions affecting the whole team > customer insights > metric movements.
5. **Always** save to `product-development/product/meetings/team-bi-weekly/summaries/{YYYY-MM-DD}-weekly-synthesis.md` and append its row to the END of that folder's CLAUDE.md list (contract: `.claude/references/write-back-contract.md`). If Slack MCP is connected, posting to the team's product channel is additive — the repo record is written regardless (a Slack-only synthesis leaves no baseline for next week's diff).
6. Tag specific people when an item is relevant to them (roster in root CLAUDE.md).
7. Boundaries: audience-tailored narratives (your manager, an exec, XFN partners) are `/status-update`'s job; the account/ARR portfolio rollup is `/portfolio-pulse`. For multi-team setups, each team runs its own `/weekly-synthesis` in its own channel; pair with `/portfolio-pulse` on Friday afternoon for the full picture.
