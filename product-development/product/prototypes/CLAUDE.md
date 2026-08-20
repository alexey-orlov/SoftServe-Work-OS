# Prototypes

Clickable prototypes and prototype-adjacent artifacts — one flat folder, files keyed by feature slug (matching `feature-index.yaml`).

**Read this when:** You need a feature's prototype, its feedback history, a challenge report, or the cached design system.

## Conventions

- `{slug}.html` — self-contained clickable prototype (`/prototype`)
- `{slug}-feedback-log.md` — the prototype's companion record: build record (sources, coverage checklist, gaps) written by `/prototype`, then one appended section per review round by `/prototype-feedback`
- `{slug}-challenge-round-{N}.md` — structured critique reports (`/prototype-challenge`)
- `{slug}-{tool}-prompt.md` — external-tool prompt (v0 / lovable / bolt) when the prototype is built outside the repo (`/prototype`)
- `{slug}-napkin-sketch.md` — ASCII wireframes (`/napkin-sketch`)
- `{slug}-first-draft.md`, `{slug}-reference-impl/` — first-pass implementation summaries (`/code-first-draft`)

### Subfolders

- [design-system/](design-system/) — cached Figma token extraction shared by all prototypes (`tokens.css` + `design-system.md`)
- [history/](history/) — pre-round snapshots `{slug}-r{N}.html`; deliberately not listed file-by-file

### Files

_None yet — skills append entries here as prototypes land._
