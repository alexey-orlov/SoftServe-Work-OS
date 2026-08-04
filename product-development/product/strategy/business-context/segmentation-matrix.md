# Segmentation Matrix

_updated: [YYYY-MM-DD] · snapshot: [YYYY-MM-DD] · owner: [Name]

The quantitative mix of the paying B2B customer base: how many accounts and how much ARR sit in each segment — vertical × size band — overall and per use-case category. When a task needs "how many accounts / how much ARR is in segment X", this file is the answer; no other file in the repo carries these numbers.

**What belongs here:** the canonical segment axes (size bands, verticals, use-case categories), the counting rules, and the filled matrices.

**What does not:** who we *target* and why — ICP, personas, budgets, TAM/SAM/SOM — lives in [business-info.md](business-info.md). Per-account facts — one account's status, ARR, renewal, risks — live in [portfolio.yaml](../../customers/accounts/portfolio.yaml). What counts as ARR is defined in `analytics/metrics/`. This file only aggregates.

## Segment Axes

Canonical labels — every other doc, skill, and `portfolio.yaml` entry uses these exact names.

**Size bands** (firmographic, by employee count — set thresholds during setup, then keep them stable so matrices stay comparable quarter over quarter):

| Band | Meaning | Threshold |
|------|---------|-----------|
| SMB | Small & mid-size business | [under 200 employees] |
| Corp | Corporate / mid-market | [200–2,000 employees] |
| Ent | Enterprise | [over 2,000 employees] |

**Verticals** — every account maps to exactly one; keep the list short and use `Other` for the tail:

[Vertical 1] · [Vertical 2] · [Vertical 3] · Other

**Use-case categories** — the distinct jobs / product lines accounts buy. For multi-category and multi-product products only; single-product teams delete this axis and the per-category matrices below:

[Category A] · [Category B]

## Counting Rules

- **Count** = paying accounts at the snapshot date. Free tier, trials, and churned accounts are excluded.
- **ARR** uses the definition in `analytics/metrics/` — the same number quoted in the root `CLAUDE.md` fundamentals block and business-info's Key Metrics. **Mirror rule: the General matrix totals (accounts, ARR) must equal both; whoever changes one reconciles all three in the same change.**
- **General matrix:** each account sits in exactly one cell — one vertical, one size band. Cells sum to the totals; the totals are the truth.
- **Category matrices:** an account appears in **every** category it actively uses, so category totals overlap and exceed the General totals — they are lenses, not partitions.
- **ARR attribution in category matrices:** [pick one, state it here, delete the other — **full-ARR**: the account's entire ARR appears in each category it uses (shows revenue exposure per category) / **split-ARR**: ARR divided across categories per billed product line (category totals sum to the General total)]. Never mix the two.

## General Matrix — all paying accounts

Source: [portfolio.yaml roll-up / billing export / warehouse query — link it]

| Vertical | SMB # | SMB ARR | Corp # | Corp ARR | Ent # | Ent ARR | Total # | Total ARR |
|----------|-------|---------|--------|----------|-------|---------|---------|-----------|
| [Vertical 1] | [N] | [$] | [N] | [$] | [N] | [$] | [N] | [$] |
| [Vertical 2] | [N] | [$] | [N] | [$] | [N] | [$] | [N] | [$] |
| [Vertical 3] | [N] | [$] | [N] | [$] | [N] | [$] | [N] | [$] |
| Other | [N] | [$] | [N] | [$] | [N] | [$] | [N] | [$] |
| **Total** | **[N]** | **[$]** | **[N]** | **[$]** | **[N]** | **[$]** | **[N]** | **[$]** |

## Per-Category Matrices

Same shape as the General matrix, one section per use-case category — an account using three categories appears in three tables. The attribution rule above applies; add a section for each category you add.

### [Category A]

| Vertical | SMB # | SMB ARR | Corp # | Corp ARR | Ent # | Ent ARR | Total # | Total ARR |
|----------|-------|---------|--------|----------|-------|---------|---------|-----------|
| [Vertical 1] | [N] | [$] | [N] | [$] | [N] | [$] | [N] | [$] |
| [Vertical 2] | [N] | [$] | [N] | [$] | [N] | [$] | [N] | [$] |
| Other | [N] | [$] | [N] | [$] | [N] | [$] | [N] | [$] |
| **Total** | **[N]** | **[$]** | **[N]** | **[$]** | **[N]** | **[$]** | **[N]** | **[$]** |

### [Category B]

| Vertical | SMB # | SMB ARR | Corp # | Corp ARR | Ent # | Ent ARR | Total # | Total ARR |
|----------|-------|---------|--------|----------|-------|---------|---------|-----------|
| [Vertical 1] | [N] | [$] | [N] | [$] | [N] | [$] | [N] | [$] |
| [Vertical 2] | [N] | [$] | [N] | [$] | [N] | [$] | [N] | [$] |
| Other | [N] | [$] | [N] | [$] | [N] | [$] | [N] | [$] |
| **Total** | **[N]** | **[$]** | **[N]** | **[$]** | **[N]** | **[$]** | **[N]** | **[$]** |

## Maintenance

- **Confirm tier** (`product-development/_meta/write-policy.yaml`): every edit shows the exact before/after and gets an in-session yes; headless runs file a proposal in `_meta/proposals/` instead.
- **Refresh:** full refresh each quarter alongside `current-quarter.md`; between quarters `/context-update` refreshes the affected cells when an account lands, churns, or is re-segmented. Bump `_updated:` and the snapshot date on every change.
- **Sources:** managed accounts carry `vertical`, `size_band`, and `use_cases` in [portfolio.yaml](../../customers/accounts/portfolio.yaml); a self-serve long tail comes from [billing export / warehouse query — register it in `analytics/queries/` and `data-catalog.yaml` when wired].
- **Read by:** `/prd-draft`, `/impact-sizing`, `/prioritize-requests`, `/expansion-strategy`, `/retention-analysis`, `/activation-analysis`, `/strategy-sprint`, `/write-prod-strategy`, `/portfolio-pulse` — any work that needs segment denominators or revenue weighting.
