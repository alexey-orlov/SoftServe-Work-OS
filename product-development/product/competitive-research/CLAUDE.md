# Competitive Research

Competitor matrix and per-competitor teardowns.

**Read this when:** You need positioning, a feature comparison, or a competitor's recent moves.

## Contents

### Subfolders

- [competitors/](competitors/) — One folder per tracked competitor
- [intel/](intel/) — Monthly cross-competitor monitoring records from `/competitor-analysis`, append-only

### Files

- [competitive-landscape.md](competitive-landscape.md) — Whole-portfolio living master: tiered competitor list, positioning map, differentiation thesis, win/lose patterns
- [competitive-matrix.md](competitive-matrix.md) — Capability comparison living master: General (whole-product) table + one table per product area; splits to `competitive-matrix-{area}.md` when an area outgrows it

### Created on demand

- `competitors/{slug}/teardown.md` — one living profile per competitor, from `../processes/templates/competitor-teardown-template.md`; slug is kebab-case and equals the folder name
- `competitive-matrix-{area}.md` — per-area matrix split from `../processes/templates/competitive-area-matrix-template.md`; {area} matches a `../PRDs/` folder name
