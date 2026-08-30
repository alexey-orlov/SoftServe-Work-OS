---
status: exploring
note: "[one line: where this stands right now]"
updated: [YYYY-MM-DD]
owner: "[Name from team roster]"
areas: [[area-slug]]
features: [[feature-slug]]
---

# [Initiative Name]

## Snapshot

- [3–6 bullets: what this initiative is, why now, what "done" means]

## Scope & goal

- **Goal:** [the outcome, with the metric it should move]
- **In scope:** [bullets]
- **Out of scope:** [bullets]

## Instructions

- [Optional, ≤400 characters total: standing initiative-specific guidance every agent
  working this initiative follows — constraints, tone, must-check context. "-" if none.]

## Sources

- [Source-of-truth folders or documents for this initiative, highest priority first —
  local repo paths or SharePoint / Drive / Confluence links (usable when that
  connection is set up). "-" if none.]

## Artifacts

- PRD: [PENDING: product/PRDs/[area]/[initiative-slug]-prd.md]
- Assumption map: -
- Challenge report: -
- Jobs breakdown: -
- Job specs: -
- Impact sizing: -
- User insights: -
- Competitive analysis: -
- Pre-mortem: -
- Eng plan: -
- Metrics: -
- Experiments: -
- Launch checklist / gate verdict: -

## Decisions

- [YYYY-MM-DD — [decision title](../decisions/YYYY-MM-DD-slug.md); newest first, links only]

## Open loops

- [Mine / Theirs: commitment or waiting-on, owner, due date if known]

## Activity

- [YYYY-MM-DD — one line on what changed; newest first, keep ≤10, drop the oldest]

<!--
Template rules (delete this comment when filling):
- Copy to product-development/product/initiatives/{slug}.md; slug is immutable kebab-case,
  unique across areas + features + initiatives (versioned pattern: {feature}-v1, -v2, …).
- The frontmatter is the machine header (link contract: governance/link-schema.yaml).
  status: exploring | active | paused | shipped | killed — exploring = the bet is still
  being weighed; flip to active in place when the team commits. TARGETS ARE REQUIRED:
  areas:/features: name ≥1 catalog slug — an unmapped initiative cannot exist (a new
  feature is proposed to feature-index.yaml as `status: planned` in the same change).
- Every status change appends a dated Activity line in the same change.
- Edit in place — this page always describes current truth. Never stack "UPDATE:" lines.
- Link artifacts and decisions; never restate their content here. "-" for empty sections.
- Use [PENDING: path] for artifacts that are planned but not written yet.
- ## Instructions is steering, not documentation: hard cap 400 characters; agents read it
  before working the initiative. ## Sources is ordered by priority — first entry wins on
  conflicting facts; reorder by editing the list (or drag in the OS Console).
- Budget ≤120 lines. On ship/kill: set status accordingly (outcome in note:), link the
  gate verdict, keep lessons — closed pages stay.
- After creating: add a line to initiatives/CLAUDE.md (append to the end).
-->
