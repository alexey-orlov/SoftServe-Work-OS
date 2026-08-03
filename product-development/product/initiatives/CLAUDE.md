# Initiatives

One living page per initiative — the current-work layer that joins what the functional
folders separate. An initiative is a work effort ("XYZ v2.0", "XYZ global expansion")
targeting one or more durable features from `product-development/feature-index.yaml`.

**Read this when:** You need the state of a piece of current work — its goal, artifacts,
decisions, and open loops — in one page, without grepping six folders.

## Rules

- **Create** a page (copy `../processes/templates/initiative-page-template.md`) when an
  initiative starts — first PRD draft, first scoped work. `/prd-draft` and `/context-update`
  do this; check this folder for an existing page before creating (one page per initiative).
- **Slug** is kebab-case and immutable; the page name IS the initiative's id everywhere
  (feature-index `initiatives:` lists, current-quarter links, gate verdicts).
- **Edit in place** — the page always describes current truth (`_status:`, `_updated:`).
  Artifacts and decisions are LINKED, never restated. Budget ≤120 lines.
- **Close, don't delete**: on ship/kill set `_status: shipped YYYY-MM-DD — <outcome>` (or
  `killed …`), link the launch-gate verdict, keep the lessons. Closed pages stay — they
  hold the record.
- Statuses: `active` · `paused` · `shipped` · `killed`.

## Contents

### Files

_Empty. Add a one-line entry here (append to the end) for every initiative page you create._
