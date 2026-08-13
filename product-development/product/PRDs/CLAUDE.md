# PRDs

Product requirements documents, subfoldered by product area.

**Read this when:** You need the spec for a feature. Check `feature-index.yaml` first to find which area it lives in.

## Contents

### Subfolders

- [examples/](examples/) — Reference PRDs showing the expected shape and depth. Not live specs
- [general/](general/) — PRDs not yet assigned to a product area. Retag into a real area when one emerges
- `{area}/reviews/` — Review artifacts for that area's PRDs: `[slug]-challenge-[YYYY-MM-DD].md` (`/prd-challenge` — dated, one per run), `[doc-slug]-red-team.md` (`/red-team`), `[feature-slug]-assumption-map.md` (`/assumption-map`), `[feature-slug]-premortem.md` (`/pre-mortem`), `[initiative-slug]-[feature-slug]-brief-review-[YYYY-MM-DD].md` (`/feature-brief` challenge — dated, one per run)
- [billing/](billing/) — Billing & credits area; holds the synthetic worked-example PRD (credit usage dashboard)
- [workforce/](workforce/) — Workforce & team-coverage area; holds the synthetic worked example of the PRD → feature-breakdown → feature-brief chain (team time-off & coverage)

### Created on demand

- `prototypes/` — Prototype prompts, napkin sketches, first-draft summaries, and feedback rounds — created on first use by `/prototype`, `/napkin-sketch`, `/prototype-feedback`, `/code-first-draft`
