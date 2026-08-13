---
name: customize-os
description: Adapt a deployed instance of this OS to a customer or org — interactive setup that asks for the org's reference artifacts, derives customized context files from them, and installs each behind the gated write prompt. First implemented target - the house PRD/brief template. Derives the instance's prd-template.md from 2–4 example documents (common skeleton extracted, content blanked to placeholders, per-section guidance blocks routing /prd-draft's evidence slots, voice rules from the examples, subagent format-fidelity validation before install). Other targets (metric reporting conventions, fundamentals) are pointed to their manual paths until implemented. Runs in the customer instance — house formats never land in the master repo (decision 2026-08-13); in the master it stages output outside the repo instead of installing. Use on /customize-os, "customize this OS for {customer}", "adopt our PRD format", "make the template match our briefs", "derive our template from these examples". NOT for connecting tool servers (/connect-mcps), code access (/connect-code), or drafting an actual PRD (/prd-draft — run it after the template is installed).
argument-hint: "[target, e.g. prd-template] [example file paths...]"
group: os-admin
---

## Quick Start

**What to provide:** the customization target and 2–4 reference examples of the org's real documents (paths — `.docx`, `.pdf`, or `.md`; filled examples beat blank templates because they show voice and conventions in use).

```
/customize-os                                        → guided: pick target, point to examples
/customize-os prd-template ~/path/Brief-A.docx ~/path/Brief-B.docx
```

**What you get:** a derived, blank, guidance-annotated template staged for review, a validation score against the org's own examples, and — after your gated yes — the file installed where the consuming skill reads it.

---

# /customize-os — Fit the Instance to the Org

The OS's skills are universal; everything org-specific lives in customized context files (see `.claude/team-learnings.md`). This skill is the guided way to produce those files from the org's real artifacts instead of hand-writing them.

## Instance vs. master — where am I?

House formats belong to the customer instance **only** (decision `product-development/product/decisions/2026-08-13-prd-draft-template-driven-format.md`). Before installing anything, confirm with the user which repo this is:

- **Customer instance** (a copy of the OS customized for one org) → install targets in place, gated prompt per file.
- **SoftServe master** (this repo — placeholders like `[Your Product]` in root CLAUDE.md, SoftServe credits) → never overwrite the universal defaults. Derive and validate as normal, but **stage** the output outside the repo (the engagement's project folder; ask where) with an "Install as:" header naming the instance path.

When unsure, ask — one question, not a guess.

## Step 1 — Choose the target

| Target | Status | What happens |
|--------|--------|--------------|
| `prd-template` — house PRD/brief format | **Implemented** (Steps 2–5) | Derive `product-development/product/handbook/templates/prd-template.md` from example documents; `/prd-draft` follows it from the next run |
| `metric-conventions` — KPI tier names, required fields, artifact name | Manual (guided) | Walk the user through filling `business-info.md` → "Metric Reporting Conventions" from their KPI docs; offer to draft the block from an example |
| `fundamentals` — business-info, segmentation, stakeholders | Manual (pointer) | Route to `os-installation/` install guide and the living masters in `strategy/business-context/` |

One target per run. If the user names none, ask — and when the examples they attach are PRDs/briefs, propose `prd-template`.

## Step 2 — Gather inputs (ask only what's missing)

1. **Org name** — used in staging filenames and the derivation header.
2. **2–4 reference examples** — real, filled documents in the house format. One example is accepted with a warning (structure inferred from n=1 is fragile); more than 4, ask which are canonical. Convert `.docx` via `textutil -convert txt` (macOS) or `pandoc`; read `.pdf` directly.
3. **An existing house template, if one exists** — it wins on intended structure; the examples still supply voice and conventions in use.
4. **Known house rules** the examples can't show — approval ladder, confidentiality footer, naming conventions. Check the org's SOP/process doc if one is on hand; quote what you found and confirm.

## Step 3 — Derive

Work from structure outward; never carry content:

1. **Per-example extraction:** banner/header block, meta-table fields, section names and order, numbering/casing style, recurring sub-blocks (e.g. "Who feels this most", kill metrics, launch conditions), table shapes and columns, footer.
2. **Common skeleton:** sections present in all examples → in; in a majority → in, flagged to the user; in one only → ask. Where examples disagree on a sub-block's shape, prefer the newest/most evolved example and say so.
3. **Blank it:** every piece of real content becomes a `[bracketed placeholder]` describing what belongs there. Self-check later verifies zero real numbers, names, or feature specifics survive.
4. **Write the guidance layer** — per-section `>` blockquote blocks (marked "never emitted"), carrying:
   - **Evidence-slot routing:** map ALL of `/prd-draft` Step 3's format-neutral slots (problem-side / value-side / solution-side / proof-side) to a named home section. Every slot gets a home; a slot the format genuinely lacks gets guidance on where it lands anyway — slots may never be silently dropped.
   - **Voice rules observed in the examples:** tone, reading level, person-naming conventions (role-neutral, they/them), tagline length, how the org writes honest unknowns — paired with the OS's `[GAP:]` marker convention.
   - **Cross-links into the instance:** metric sections point at `business-info.md` → Metric Reporting Conventions and `/feature-metrics` (summary in the doc, full definitions in `analytics/metrics/`); decisions point at `/decision-log-entry`; launch conditions at `/launch-checklist`.
5. **Top matter:** an "Install as:" header, the derivation date + source example names, and a drafting quality checklist at the bottom (derived from the org's own readiness/approval rules plus the OS hygiene rules).

## Step 4 — Validate (do this; skip only on explicit user request)

The proven pattern (13/13 on the first deployment): spawn a subagent given ONLY (a) the drafting contract from `/prd-draft` Step 3, (b) the derived template, (c) a synthetic scenario with deliberate evidence holes — reference examples withheld. Judge its output against a format-fidelity checklist you derive from the real examples: sections/order/naming, meta completeness, sub-block presence, voice rules, honest-TBD + `[GAP:]` pairing, zero invented numbers, zero guidance leakage.

Fix failures **template-side** (tighten a guidance line), re-run once if fixes were made, and report the score with the failures named. The adjustment lever is the template, never the skill.

## Step 5 — Install

1. Show the user the derived template and the validation result first.
2. **Instance:** write to the consuming path (`prd-template` → `product-development/product/handbook/templates/prd-template.md`) — gated, native prompt. **Master:** write to the agreed staging location outside the repo instead.
3. Offer the companion in the same run: a house template's KPI section usually implies the org's tier names — offer to fill `business-info.md` → "Metric Reporting Conventions" to match (gated).
4. Offer `/decision-log-entry`: "Adopted {org} house format for {target}", naming the source examples and validation score.

---

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   CLAUDE.md (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Feature-scoped artifact → propose the `product-development/feature-index.yaml` addition
   and apply it only after the user confirms (Tier 2 in `governance/write-policy.yaml`).
   Initiative-scoped → link the artifact from `product-development/product/initiatives/{slug}.md`.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.

---

## Output Quality Self-Check

Before presenting to the user, verify:

- [ ] **Zero content carry-over:** no real numbers, customer names, feature specifics, or quotes from the examples survive in the derived template — structure and voice rules only
- [ ] **Every evidence slot routed:** all four `/prd-draft` slot groups have a named home section in the guidance layer
- [ ] **Guidance is fenced:** every instruction block is a `>` blockquote explicitly marked as never emitted into drafts
- [ ] **Validation ran** (or the user explicitly skipped it) and the score + failures were reported
- [ ] **Right repo:** installed in an instance, or staged outside the master — never overwrote the master's universal default
- [ ] **Companions offered:** metric conventions block and `/decision-log-entry` offered when the target implied them
