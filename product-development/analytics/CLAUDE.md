# Analytics

Metrics, queries, schemas, dashboards, experiments, and investigations.

**Read this when:** You need a number, its definition, or the SQL behind it.

## Contents

### Subfolders

- [dashboards/](dashboards/) — Dashboard definitions and links by area
- [experiments/](experiments/) — Experiment designs and results by area
- [investigations/](investigations/) — Ad-hoc analytical investigations by area
- [metrics/](metrics/) — Metric definitions by area — numerator, denominator, caveats, owner
- [queries/](queries/) — Reusable SQL by area. Never commit customer-identifier cohorts inline
- [schemas/](schemas/) — Table and event schema documentation by area

### Files

- [data-catalog.yaml](data-catalog.yaml) — Warehouse table registry: owner, refresh, upstream, grain, PII flag, used-by per table; column-level detail lives in `schemas/`
- `cohort-exclusions.yaml` — cohort exclusion windows, created on first use by analytics skills
