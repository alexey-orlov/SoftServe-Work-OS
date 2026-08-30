# Product Development

Root of all product, engineering, and analytics artifacts.

**Read this when:** You need any artifact — the catalog (`feature-index.yaml`) says what exists; initiative pages (`product/initiatives/`) hold each project's artifact trail.

## Contents

### Subfolders

- [analytics/](analytics/) — Metrics, queries, schemas, dashboards, experiments, and investigations
- [engineering/](engineering/) — Implementation plans, the code-repo registry, and codebase maps — code grounding for `/code-qa`
- [product/](product/) — Product context, PRDs, customers, strategy, decisions, and the team handbook
- [inbox/](inbox/) — Integration drop zone: transcripts land here; /context-update sweeps gate them and /process-meeting files them out

### Files

- [feature-index.yaml](feature-index.yaml) — The product map: areas → features catalog with durable facts (status, shipped date); artifacts live on initiative pages, which declare their targets (gated — changes need your in-session yes)
- [toolchain.yaml](toolchain.yaml) — The team's standing tool/approach choices plus live-connection records, one key per surface (nine surfaces: prototyping, user insights, ticketing, meeting transcripts, knowledge base, analytics, feature requests, team chat, calendar) — choices written by `/customize-os` and the OS Console, `connection:` blocks only by `/connect-mcps`, read by consuming skills before they ask (gated)
