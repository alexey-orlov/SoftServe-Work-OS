# PRDs

Product requirements documents, subfoldered by product area. **Files key by INITIATIVE
slug** — one PRD per initiative (`{initiative-slug}-prd.md`), filed under the initiative's
primary (first-listed) area; a feature's history is the sequence of its initiatives' PRDs.
Every file carries `initiatives:` frontmatter per `governance/link-schema.yaml`.

**Read this when:** You need a spec. The catalog (`feature-index.yaml`) says which area a
feature lives in; the initiative pages targeting it link the PRDs.

## Contents

### Subfolders

- [examples/](examples/) — Reference PRDs showing the expected shape and depth. Not live specs
- [general/](general/) — PRDs not yet assigned to a product area. Retag into a real area when one emerges
- `{area}/reviews/` — Review artifacts for that area's initiatives, all keyed by initiative slug: `[initiative-slug]-challenge-[YYYY-MM-DD].md` (`/prd-challenge` — dated, one per run), `[initiative-slug]-red-team.md` (`/red-team`), `[initiative-slug]-assumption-map.md` (`/assumption-map`), `[initiative-slug]-premortem.md` (`/pre-mortem`), `[initiative-slug]-[job-slug]-job-spec-challenge-[YYYY-MM-DD].md` (`/job-spec-challenge` — dated, one per run)
- [billing/](billing/) — Billing & credits area; holds the synthetic worked-example PRD (credit usage dashboard)
- [workforce/](workforce/) — Workforce & team-coverage area; holds the synthetic worked example of the PRD → jobs-breakdown → job-spec-draft chain (team time-off & coverage)
