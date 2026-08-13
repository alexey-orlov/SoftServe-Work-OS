# Sweep S5 — Market patterns (runs only on `--market`)

What close competitors' products can and can't do for **this job** — capability evidence for §12 and the Competitive notes conditional section. This sweep informs *what to cover and how to prioritize it*; it never imports *how competitors' UIs look*.

## Sources, in order

1. **The repo first:** `product-development/product/competitive-research/` — `competitive-landscape.md`, `competitive-matrix*.md`, `competitors/*/teardown.md`. Cite the file; note staleness (`_updated:` older than ~90 days → say so).
2. **Web second**, only for gaps the repo can't answer: competitor docs, changelogs, help centers. Cite the page. No access or nothing found → `[GAP: competitor capability unverified — run /competitor-analysis]`; never guess.
3. **A deep, current teardown is not this sweep's job** — that's `/competitor-analysis`; suggest it when the repo is thin and the competitive question is load-bearing.

## What to return, per close competitor (2–4, from the landscape doc)

- **Capability set for this job:** which of the draft's capabilities they support / lack / gate behind a tier — and any capability they support that the draft doesn't name (a candidate finding for S1's disposition path, not an auto-add)
- **Table-stakes signal:** a capability all close competitors support is evidence toward Must ("expected by switchers") — evidence, not an automatic verdict; the tier still comes from Reach × Frequency × Severity (prioritization.md)
- **Differentiation signal:** a capability none support — opportunity or warning (they know something?); phrase as an open question when the why is unknown
- **Variation coverage:** do they handle a §5 variation the draft deferred (multi-entity, a compliance regime, a size band)? That's reach-risk evidence for the deferral decision

## Hard rules

- **Evidence, never UI.** "Competitor X supports bulk approval" is admissible; "Competitor X uses a right-side drawer" is not — never carry layout, copy, or interaction patterns into the brief.
- **Label everything:** `[Evidenced]` (seen in their docs/product, cited) · `[Partial]` (marketing claim, unverified) · `[Hypothesis — needs validation]`.
- **This job only.** No general competitive posture, pricing philosophy, or roadmap speculation — `/competitor-analysis` owns those.

## Return format

Per-competitor capability notes with citations and labels, then a one-paragraph synthesis: table-stakes for this job · where the draft exceeds or trails · which §12 rows this evidence moves and in which direction. Findings that imply new capabilities go through the standard disposition (in-feature / deferred / open question), marked as market-sourced.
