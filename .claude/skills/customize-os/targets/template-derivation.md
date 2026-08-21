# Playbook — template targets: `prd-template` · `jobs-breakdown-template` · `job-spec-template`

Derive a house document format from the org's real, filled documents and install it as the
template the owning skill reads. One recipe, three consuming paths:

| Target | Consuming path | Owning skill |
|--------|----------------|--------------|
| `prd-template` | `product-development/product/handbook/templates/prd-template.md` | `/prd-draft` |
| `jobs-breakdown-template` | `…/templates/jobs-breakdown-template.md` | `/jobs-breakdown` |
| `job-spec-template` | `…/templates/job-spec-template.md` | `/job-spec-draft` |

Any other file in `handbook/templates/` follows this same recipe with a different
consuming path. Prerequisite: artifact naming must be resolved (the status header carries
`naming:`) — a mapping decides what the derived template's titles and headings say.
Shared lifecycle, state, readout, and write rules: SKILL.md.

## Step 1 — Gather (ask only what's missing)

**Pre-existing template check — before gathering.** Scan for house-format templates that
entered the repo outside this skill: (a) the consuming path's file carries org-specific
content (real org/product names, house sections) with no derivation top matter and no
status-file record for the target; (b) overlapping extras — org template files for the
same artifact under `handbook/templates/`, `product-development/inbox/`, `PRDs/`, or the
repo root. (Stock scaffolds — bracketed placeholders, no org content — are the OS's
defaults, never flagged.) Found → surface each and **strongly recommend removal**, with
the three reasons stated: it bypassed derivation — no slot routing, so owning skills
silently drop evidence slots with no named home, and no fidelity validation; it competes
with the consuming path — the owning skill reads exactly one file, so edits to a stray
copy never reach a draft and the two formats drift apart; and it is invisible to
customization state, freshness audits, and the write-policy trail. Capture before
removing: record it under **Inputs received** and run the Step 2 extraction on it — a
stray house template is usually the best structure source (input 3 below). Then, with the
user's explicit yes in this session: remove extras now (`git rm`; an untracked stray is
committed first, then removed — git history is the archive, never a loose copy). A stray
**at the consuming path** is never deleted early — the owning skill needs a template
present — it is replaced at install (Step 4). A captured stray alone meets the gathering
minimum with **zero** filled examples — the voice layer then has no source; record that
explicitly as Open — Other. Declined → keep it, record **Open — Other** naming the drift
risk, and continue. Nothing found → say nothing and move on.

Inputs:

1. **Org name** — for the status file, staging filenames, derivation headers.
2. **2–4 reference examples** — real, filled documents in the house format (paths;
   `.docx` via `textutil -convert txt` or `pandoc`, `.pdf` read directly). Filled
   examples beat blank templates — they show voice in use. One example: accept with a
   warning (n=1 structure is fragile → record as Open — Other). More than 4: ask which
   are canonical.
3. **An existing house template, if one exists** — wins on intended structure; examples
   still supply voice. A stray flagged by the pre-existing check lands here automatically
   — captured first, removed per that check.
4. **House rules the examples can't show** — approval ladder, confidentiality footer,
   naming conventions. Check the org's SOP first; confirm rather than re-ask.

Record everything received under **Inputs received**; phase → `gathering` until the
minimum (≥1 example or a house template) is in hand.

## Step 2 — Derive

Work from structure outward; never carry content. Phase → `derived` when the draft
artifact exists.

1. **Per-example extraction:** banner/header, meta-table fields, section names and order,
   numbering/casing, recurring sub-blocks, table shapes, footer.
2. **Common skeleton:** in all examples → in; in a majority → in, flagged; in one only →
   follow-up question. Where examples disagree on a sub-block's shape, prefer the
   newest/most evolved and say so.
3. **Blank it:** every piece of real content becomes a `[bracketed placeholder]`
   describing what belongs there — zero real numbers, names, or feature specifics survive.
4. **Write the guidance layer** — per-section `>` blocks (marked "never emitted"),
   carrying: slot routing from the owning skill's contract — ALL of its slot groups get a
   named home, never silently dropped (`prd-template` → `/prd-draft` Step 3's
   problem/value/solution/proof-side slots; `jobs-breakdown-template` →
   `/jobs-breakdown`'s backbone / gated job table with Type-Priority-Status columns /
   sequencing rationale / cross-job decisions / coverage check; `job-spec-template` →
   `/job-spec-draft`'s 16 core sections, however the house format names or merges them,
   plus the method rules that survive ANY house format: two-register ACs with no widgets
   in a Then, the mandatory variations verdict, cross-cutting rows answered-or-deferred,
   evidence labels, the quality gate as the single checklist); voice rules observed in
   the examples (tone, reading level, role-neutral naming, how the org writes honest
   unknowns — paired with the OS's `[GAP:]` convention); cross-links into the instance
   (metric sections → `business-info.md` conventions + `/feature-metrics`; decisions →
   `/decision-log-entry`; launch conditions → `/launch-checklist`; job-level constraint
   sections → `platform-model.md` + `tech-constraints.md`).
5. **Top matter:** "Install as:" header, derivation date + source names, drafting quality
   checklist at the bottom.

## Step 3 — Validate (skip only on explicit user request)

Spawn a subagent given ONLY (a) the owning skill's drafting contract (`prd-template` →
`/prd-draft` Step 3; `jobs-breakdown-template` → `/jobs-breakdown` Steps 2–6;
`job-spec-template` → `/job-spec-draft` Steps 3–9), (b) the derived template, (c) a
synthetic scenario with deliberate evidence holes — reference examples withheld. Judge
against a fidelity checklist derived from the real examples (sections/order/naming, meta
completeness, sub-blocks, voice, honest-TBD + `[GAP:]` pairing, zero invented numbers,
zero guidance leakage). Fix failures **template-side**, re-run once if fixes were made,
record the score. Phase → `validated`.

## Step 4 — Install

1. Show the derived artifact and validation result.
2. **Instance:** write to the consuming path (gated, native prompt). **Staging:** write
   beside the status file with the "Install as:" header. Phase → `installed`.
3. Offer companions in the same run: the KPI section implies tier names → offer to fill
   `business-info.md` → "Metric Reporting Conventions" (gated); offer
   `/decision-log-entry` ("Adopted {org} house format for {target}", sources + score).
   All companions done → `complete`.
