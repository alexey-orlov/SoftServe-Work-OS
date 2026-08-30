# Initiatives

One living page per initiative — the current-work layer that joins what the functional
folders separate. An initiative is a work effort ("XYZ v2.0", "XYZ global expansion")
targeting one or more durable features from `product-development/feature-index.yaml`.

**Read this when:** You need the state of a piece of current work — its goal, artifacts,
decisions, and open loops — in one page, without grepping six folders.

## Rules

- **Create** a page (copy `../handbook/templates/initiative-page-template.md`) when an
  initiative starts — first PRD draft, first scoped work. `/prd-draft`, `/context-update`,
  and the OS Console do this; check this folder for an existing page before creating (one
  page per initiative). **Creation requires targets**: the frontmatter names ≥1 feature
  and/or area from the catalog — an unmapped initiative cannot exist (the creator resolves
  this from context, proposing the `planned` catalog entry when the feature is new).
- **Slug** is kebab-case, immutable, and unique across areas + features + initiatives —
  the versioned pattern is `{feature}-v1`, `-v2`, … (the page name IS the initiative's id
  everywhere: artifact filenames, record frontmatter, gate verdicts).
- **Frontmatter is the machine header** — `status:`, `note:`, `updated:`, `owner:`,
  `areas:`, `features:` (+ optional `customers:`, `competitors:`), per
  `governance/link-schema.yaml`. Legacy `_status:`-style pages stay readable; `/wiki-lint`
  offers the conversion.
- **Edit in place** — the page always describes current truth. Artifacts and decisions
  are LINKED, never restated. Budget ≤120 lines.
- **`## Instructions`** (optional, ≤400 chars) is initiative-specific steering — read it
  before working the initiative and follow it. **`## Sources`** lists the initiative's
  source-of-truth folders/documents in priority order (first wins on conflict); consult
  them when drafting or folding material for this initiative.
- **Close, don't delete**: on ship/kill set `status: shipped` (or `killed`) with the
  outcome in `note:`, link the launch-gate verdict, keep the lessons. Closed pages stay —
  they hold the record, and the staleness check exempts them.
- Statuses: `exploring` · `active` · `paused` · `shipped` · `killed` (`exploring` = filed
  but not yet committed work; flip to `active` in place when the team commits). **Every
  status change appends a dated Activity line in the same change** — transitions are
  events; writers per the one-writer table in `governance/write-back-contract.md`.

## Contents

### Files

- [credit-usage-dashboard-v1.md](credit-usage-dashboard-v1.md) — EXAMPLE (synthetic) — shipped 2026-03-20; worked example of a closed initiative with a full artifact trail and a PASS gate verdict
- [tier-discount-promo-v1.md](tier-discount-promo-v1.md) — EXAMPLE (synthetic) — active; deliberately demos the BLOCKED-gate state (PRD + eng plan still `[PENDING:]`)
- [time-off-requests-v1.md](time-off-requests-v1.md) — EXAMPLE (synthetic) — active; demos the definition→delivery bridge (PRD → /jobs-breakdown → /job-spec-draft)

_Append a one-line entry to the end of this list for every initiative page you create._
