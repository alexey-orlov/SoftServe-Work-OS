# Initiatives

One living page per initiative — the current-work layer that joins what the functional
folders separate. An initiative is a work effort ("XYZ v2.0", "XYZ global expansion")
targeting one or more durable features from `product-development/feature-index.yaml`.

**Read this when:** You need the state of a piece of current work — its goal, artifacts,
decisions, and open loops — in one page, without grepping six folders.

## Rules

- **Create** a page (copy `../handbook/templates/initiative-page-template.md`) when an
  initiative starts — first PRD draft, first scoped work. `/prd-draft` and `/context-update`
  do this; check this folder for an existing page before creating (one page per initiative).
- **Slug** is kebab-case and immutable; the page name IS the initiative's id everywhere
  (feature-index `initiatives:` lists, current-quarter links, gate verdicts).
- **Edit in place** — the page always describes current truth (`_status:`, `_updated:`).
  Artifacts and decisions are LINKED, never restated. Budget ≤120 lines.
- **`## Instructions`** (optional, ≤400 chars) is initiative-specific steering — read it
  before working the initiative and follow it. **`## Sources`** lists the initiative's
  source-of-truth folders/documents in priority order (first wins on conflict); consult
  them when drafting or folding material for this initiative.
- **Close, don't delete**: on ship/kill set `_status: shipped YYYY-MM-DD — <outcome>` (or
  `killed …`), link the launch-gate verdict, keep the lessons. Closed pages stay — they
  hold the record.
- Statuses: `exploring` · `active` · `paused` · `shipped` · `killed` (`exploring` = filed
  but not yet committed work; flip to `active` in place when the team commits).

## Contents

### Files

- [credit-usage-dashboard-v1.md](credit-usage-dashboard-v1.md) — EXAMPLE (synthetic) — shipped 2026-03-20; worked example of a closed initiative with a full artifact trail and a PASS gate verdict
- [tier-discount-promo.md](tier-discount-promo.md) — EXAMPLE (synthetic) — active; deliberately demos the BLOCKED-gate state (PRD + eng plan still `[PENDING:]`)
- [time-off-requests.md](time-off-requests.md) — EXAMPLE (synthetic) — active; demos the definition→delivery bridge (PRD → /jobs-breakdown → /job-spec-draft)

_Append a one-line entry to the end of this list for every initiative page you create._
