---
name: feature-launch-gate
description: Pre-launch repo completeness check. Verifies PRD, metrics, queries, schemas, decisions, and feature-index entry exist before a feature ships. Two modes — full gate for major launches, lightweight for small changes.
argument-hint: "[feature] [--lightweight] [--no-experiment]"
group: os-admin
---

# Feature Launch Gate

Verify the Team OS repo is updated before a feature ships. Two modes: full gate for major launches, lightweight for small changes.

The enforcement rule: *"The feature is not rolled out until the repository is updated."* This skill operationalizes that rule.

## When to Use

Before any feature launch: `/feature-launch-gate {feature-or-initiative-name}`

For small changes (bug fixes, copy updates): `/feature-launch-gate {feature-or-initiative-name} --lightweight`

The gate runs per **initiative** (the shipping work effort — see `product-development/product/initiatives/`); its checks resolve against the target feature's entry in `feature-index.yaml`. Worked demo: the shipped example initiative passes the full gate; `tier-discount-promo` (PRD and eng plan deliberately missing) shows the BLOCKED state.

## Full Gate Checklist

### Product Context
- [ ] PRD exists in `product-development/product/PRDs/{area}/` for this feature
  - PRD passes content checks: covers all 6 sections (Hypothesis / Problem / Strategic fit / Solution / Success metrics / Non-goals), no `[FILL IN]` / `[NEED:]` / `[Your X]` / `[GAP:` placeholder tokens remain, ≥ 400 words. *File-existence alone is not enough — placeholder PRDs fail this check, and a `[GAP:]` marker means the evidence behind a section is still missing.*
- [ ] Decisions made during development are logged in `product-development/product/decisions/`
- [ ] Pre-mortem exists at `product-development/product/PRDs/{area}/reviews/{feature-name}-premortem.md` and no Launch-Blocking Tiger row is missing Mitigation / Owner / Due (NOT APPLICABLE in lightweight mode or when no launch checklist exists for the feature)
- [ ] Feature is registered in `product-development/feature-index.yaml` with all related artifacts

### Design (if applicable)
- [ ] UX research findings checked in (if user research was conducted)
- [ ] Design rationale documented in the PRD or a decision log entry
- [ ] Figma URL referenced in the feature-index.yaml entry

### Analytics
- [ ] Metric definitions for this feature checked into `analytics/metrics/{area}/`
  - Each metric has explicit numerator + denominator + window per the conventions in `metrics/billing/billing-metrics.md`
  - **Each metric's referenced canonical query path resolves to a real file on disk** (gate parses the metric file's "Canonical query" link and verifies the path exists — file-existence of the metric file alone is not enough)
- [ ] SQL queries for key metrics verified by analyst and saved in `analytics/queries/{area}/`
  - Header `Last verified:` must be a real date within the last 90 days (not `[YYYY-MM-DD]` placeholder)
  - At least one warehouse-specific block runs as-is
- [ ] Table schemas for any new tables documented in `analytics/schemas/{area}/`
  - Schema header has refresh / lag / volume / partition_key / pii / grain / owner
- [ ] New tables registered in `analytics/data-catalog.yaml` with all required fields
- [ ] **Schema drift detected.** If the feature added a column to an existing table, the schema doc and `data-catalog.yaml#last_validated` must both have been updated this PR. Use `/wiki-lint --schema-drift` to detect column-doc mismatches against your warehouse's `INFORMATION_SCHEMA`.
- [ ] Dashboard link added to `analytics/dashboards/{area}/` (if applicable)
- [ ] **Experiment auto-detection.** Gate scans the PRD for keywords (`A/B`, `treatment`, `holdout`, `experiment`, `control`, `MDE`, `power`, `assigned`). If any are present, an experiment is assumed launching and the gate requires:
  - Pre-registered design at `analytics/experiments/{area}/{name}-{date}-experiment-design.md` (with hypothesis, MDE, sample size, stopping rules, decision criteria)
  - Results file is added separately *after* the experiment concludes (not at launch)
  - PM can override with `--no-experiment` flag with explicit reason in the gate output

### Engineering
- [ ] Known limitations or edge cases documented
- [ ] **Code reality** — when `engineering/code-repos.yaml` has ≥1 reachable non-placeholder repo: the feature flag/config and the analytics events named in the PRD and metric docs exist in code, verified via `/code-qa` with `repo@sha` citations (located by name/scout search — no feature→repo mapping assumed). NOT APPLICABLE when the registry is absent or all remotes are placeholders — mark N/A, not failed

### Navigation
- [ ] All new files have entries in their folder's CLAUDE.md
- [ ] `product-development/CLAUDE.md` updated if new folders were created
- [ ] `feature-index.yaml` updated for the feature (including its `initiatives:` list)
- [ ] The initiative's page in `product/initiatives/` reflects current truth — artifacts linked, `_updated:` fresh

## Lightweight Gate Checklist

For small changes that don't add new metrics, tables, or features:

- [ ] If a decision was made, it's logged
- [ ] If a new metric was added, it's defined and registered in feature-index
- [ ] Relevant CLAUDE.md files are updated

## Output Format

```
## Feature Launch Gate: {Feature Name}
## Mode: {Full / Lightweight}

### PASSED (X/Y)
- ✅ PRD exists: product-development/product/PRDs/billing/credit-usage-dashboard-prd.md
- ✅ Metric definitions updated: analytics/metrics/billing/credit-usage-metrics.md
- ✅ Feature-index entry: feature-index.yaml#billing.credit-usage-dashboard
- ...

### FAILED (X/Y)
- ❌ No SQL queries found for new metrics. Expected in: analytics/queries/billing/
- ❌ Dashboard link not added to feature-index.yaml
- ...

### NOT APPLICABLE (X/Y)
- ➖ No new tables created — schema check skipped
- ➖ No experiment launching — experiment design check skipped
- ...

### VERDICT: {PASS / BLOCKED}
{If BLOCKED: list specific files that need creation or updates with full paths}

Verdict saved to: product-development/product/launches/{initiative-slug}-gate-{YYYY-MM-DD}.md
```

## Persist the verdict (mandatory)

The gate run is a record, not just a chat message. After every run (PASS or BLOCKED):

1. Save the filled checklist + verdict to `product-development/product/launches/{initiative-slug}-gate-{YYYY-MM-DD}.md`.
2. Append its row to the END of the file list in `launches/CLAUDE.md`.
3. Link the verdict from the initiative's page (`Artifacts → Launch checklist / gate verdict`); on PASS for a shipping initiative, that page's `_status:` moves to `shipped YYYY-MM-DD — …`.
4. End your reply listing every repo path written or updated.

Without this, there is no way to audit whether the gate was actually run before a launch.

## Rules

1. Full gate: if ANY analytics item fails, the feature is BLOCKED. Other items are warnings.
2. Lightweight gate: advisory only. List what's missing but don't block. **Exception:** `--lightweight` cannot suppress analytics blockers when the diff touches `analytics/metrics/`, `analytics/schemas/`, or `analytics/data-catalog.yaml`. Adding metrics or changing schemas always runs the full analytics gate.
3. Be specific about what's missing and where it should go.
4. The PM owns resolving failures. They can delegate but own completion.
5. Items that genuinely don't apply (no new tables = no schema needed) should be marked NOT APPLICABLE, not FAILED.
6. After a successful gate, post a one-line confirmation to the team's launch channel.
7. PRD content check uses these placeholder tokens to fail: `[FILL IN]`, `[NEED:`, `[Your `, `[Replace `, `[Add `, `[Description]`, `[Priority 1]`, `[GAP:`. If any of those are still present in the PRD, fail with the specific token list and line numbers. `[GAP:` failures name the missing evidence and the close-it action from the marker text itself.

---

## Chain Position

Stage 7 (final) of the de-risk-a-bet chain (`product-development/product/handbook/de-risk-a-bet.md`) — upstream: `/launch-checklist` · downstream: — (post-launch: `/feature-results`). Skip rules live in the chain doc.
