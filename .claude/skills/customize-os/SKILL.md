---
name: customize-os
description: Adapt a deployed instance of this OS to a customer or org — interactive and resumable. Reads customization state first, asks only for missing inputs (targeted follow-ups mid-run), derives customized context files from the org's real artifacts, installs behind the gated write prompt, and ends every run with a readout — what changed and where it lives now, plus what's still needed split into Critical (blocks closing the step) and Other (improves quality, not blocking). Progress persists in os-installation/customization-status.md so customization continues across sessions (/customize-os continue). First implemented target - the house PRD/brief template, derived from 2–4 example documents (blanked skeleton, guidance layer routing /prd-draft's evidence slots, subagent fidelity validation); further targets plug into the same lifecycle. House formats land in customer instances only (decision 2026-08-13) — in the master repo it stages output outside the repo. Use on /customize-os, "customize this OS for {customer}", "adopt our PRD format", "continue customization", "where does customization stand?". NOT for connecting tool servers (/connect-mcps), code access (/connect-code), or drafting an actual PRD (/prd-draft — run it after the template is installed).
argument-hint: "[target|continue|status] [example file paths...]"
group: os-admin
---

## Quick Start

```
/customize-os                        → read state; resume the top in-progress target, or start guided
/customize-os continue               → same, explicit
/customize-os status                 → report progress across all targets; change nothing
/customize-os prd-template ~/a.docx ~/b.docx   → run one target with inputs up front
```

**Every run ends the same way:** the closing readout (Step 6) — what changed and where, what's still missing (Critical / Other), and the saved state that lets the next session pick up exactly here.

---

# /customize-os — Fit the Instance to the Org

The OS's skills are universal; everything org-specific lives in customized context files (see `.claude/team-learnings.md`). This skill is the guided, resumable way to produce those files from the org's real artifacts instead of hand-writing them. Customization is a program, not a session: state persists, steps close one at a time, and any session can continue where the last one stopped.

## The target lifecycle

Every target — current and future — moves through the same five phases, tracked in the status file:

```
not started → gathering → derived → validated → installed → complete
```

`installed` = the artifact is live at its consuming path. `complete` = companions done too (conventions blocks, decision log entry). A target can sit at any phase between sessions.

## State — the status file

**Location:** where the outputs land. Customer instance → `os-installation/customization-status.md` (auto tier — updated without prompts, committed with the instance). Master-repo staging runs → `{staging folder}/customization-status.md` beside the staged artifacts, outside the repo — engagement state never lands in the master.

**Read it FIRST on every invocation; update it LAST on every run.** Create it on first run:

```markdown
# Customization Status — {Org}
_updated: YYYY-MM-DD · mode: instance | staging ({path})_

## {target}
- **Phase:** gathering | derived | validated | installed | complete
- **Artifacts:** {what} → {path} (one line each, including staged drafts)
- **Inputs received:** {example paths, house rules confirmed} (paths may be machine-specific — re-ask if unreachable, don't fail)
- **Open — Critical:** {what blocks closing this phase — how to provide it}
- **Open — Other:** {what would improve the result — not blocking}
- **Log:** YYYY-MM-DD — {one line per session: what moved}
```

`status` mode prints a per-target summary from this file and exits.

## Interaction contract

- **State and repo before questions.** Read the status file, then look for answers in the repo and any documents the user pointed at (an org SOP often answers approval-ladder and naming questions — quote what you found, confirm, don't re-ask).
- **Open with one compact question set** covering only the genuinely missing inputs — not an interview, not one-question-at-a-time for things that batch naturally.
- **Follow-ups mid-run are expected**, whenever derivation hits something only the user can settle: examples disagree on structure, an evidence slot has no natural home, a house rule is unknowable from the artifacts, the install destination is ambiguous. Ask the specific question, with your recommended default first.
- **Never invent an answer to avoid a question; never block silently.** If the user isn't available to answer, take the recommended default, mark the item **Open — Critical** or **Open — Other** in the status file, and say so in the readout.

## Instance vs. master — where am I?

House formats belong to the customer instance **only** (decision `product-development/product/decisions/2026-08-13-prd-draft-template-driven-format.md`). Confirm once per status file which repo this is (record it as `mode:`):

- **Customer instance** → install targets at their consuming paths, gated prompt per file.
- **SoftServe master** (placeholders like `[Your Product]` in root CLAUDE.md, SoftServe credits) → never overwrite universal defaults. Derive and validate as normal, **stage** outputs in the engagement's project folder (ask where, once) with an "Install as:" header naming the instance path.

## Step 1 — Resolve the target

From args, the status file, or by asking. One target per run.

| Target | Status | What happens |
|--------|--------|--------------|
| `prd-template` — house PRD/brief format | **Implemented** (Steps 2–5) | Derive `product-development/product/handbook/templates/prd-template.md` from example documents; `/prd-draft` follows it from the next run |
| `metric-conventions` — KPI tier names, required fields, artifact name | Manual (guided) | Fill `business-info.md` → "Metric Reporting Conventions" from the org's KPI docs; offer to draft the block from an example |
| `fundamentals` — business-info, segmentation, stakeholders | Manual (pointer) | Route to `os-installation/` install guide and the living masters in `strategy/business-context/` |

**Extending this skill** (planned): new targets are new rows here plus a target-specific derivation note in Step 3 — the lifecycle, state format, interaction contract, and readout are shared and don't change. Other handbook templates (any file in `handbook/templates/`) follow the `prd-template` recipe as-is with a different consuming path.

## Step 2 — Gather (ask only what's missing)

1. **Org name** — for the status file, staging filenames, derivation headers.
2. **2–4 reference examples** — real, filled documents in the house format (paths; `.docx` via `textutil -convert txt` or `pandoc`, `.pdf` read directly). Filled examples beat blank templates — they show voice in use. One example: accept with a warning (n=1 structure is fragile → record as Open — Other). More than 4: ask which are canonical.
3. **An existing house template, if one exists** — wins on intended structure; examples still supply voice.
4. **House rules the examples can't show** — approval ladder, confidentiality footer, naming conventions. Check the org's SOP first; confirm rather than re-ask.

Record everything received under **Inputs received**; phase → `gathering` until the minimum (≥1 example or a house template) is in hand.

## Step 3 — Derive

Work from structure outward; never carry content. Phase → `derived` when the draft artifact exists.

1. **Per-example extraction:** banner/header, meta-table fields, section names and order, numbering/casing, recurring sub-blocks, table shapes, footer.
2. **Common skeleton:** in all examples → in; in a majority → in, flagged; in one only → follow-up question. Where examples disagree on a sub-block's shape, prefer the newest/most evolved and say so.
3. **Blank it:** every piece of real content becomes a `[bracketed placeholder]` describing what belongs there — zero real numbers, names, or feature specifics survive.
4. **Write the guidance layer** — per-section `>` blocks (marked "never emitted"), carrying: evidence-slot routing (ALL of `/prd-draft` Step 3's problem/value/solution/proof-side slots get a named home — slots may never be silently dropped); voice rules observed in the examples (tone, reading level, role-neutral naming, how the org writes honest unknowns — paired with the OS's `[GAP:]` convention); cross-links into the instance (metric sections → `business-info.md` conventions + `/feature-metrics`; decisions → `/decision-log-entry`; launch conditions → `/launch-checklist`).
5. **Top matter:** "Install as:" header, derivation date + source names, drafting quality checklist at the bottom.

## Step 4 — Validate (skip only on explicit user request)

Spawn a subagent given ONLY (a) `/prd-draft` Step 3's drafting contract, (b) the derived template, (c) a synthetic scenario with deliberate evidence holes — reference examples withheld. Judge against a fidelity checklist derived from the real examples (sections/order/naming, meta completeness, sub-blocks, voice, honest-TBD + `[GAP:]` pairing, zero invented numbers, zero guidance leakage). Fix failures **template-side**, re-run once if fixes were made, record the score. Phase → `validated`.

## Step 5 — Install

1. Show the derived artifact and validation result.
2. **Instance:** write to the consuming path (gated, native prompt). **Staging:** write beside the status file with the "Install as:" header. Phase → `installed`.
3. Offer companions in the same run: the KPI section implies tier names → offer to fill `business-info.md` → "Metric Reporting Conventions" (gated); offer `/decision-log-entry` ("Adopted {org} house format for {target}", sources + score). All companions done → `complete`.

## Step 6 — Record and close (mandatory, every run — including interrupted ones)

Update the status file (phase, artifacts, inputs, open items, log line), then end with this readout:

```
Customization run — {org} · {target} · phase: {phase}

Changed this run
  ✓ {artifact} → {path it lives at now}
  ✓ status updated → {status file path}

Was the provided info sufficient?
  Critical — blocks closing this step
    ✗ {missing input} — {exactly how to provide it}
  Other — would improve the result, not blocking
    ⚠ {nice-to-have and what it would add}
  (or: ✓ sufficient — nothing outstanding for this phase)

Next: {the single next action, and whose it is}
Resume anytime with /customize-os continue — state is saved.
```

Rules: **Changed this run** lists real paths, never descriptions alone. The sufficiency split is honest — an item is Critical only if the phase genuinely cannot close without it; everything else is Other. Unanswered follow-ups land here, not in silence.

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

- [ ] **State first, state last:** the status file was read before anything else and updated before the readout — even if the run was interrupted mid-phase
- [ ] **Readout complete:** paths for everything changed, sufficiency split into Critical / Other (or an explicit "sufficient"), a single named next action
- [ ] **Questions asked, not assumed:** every ambiguity was either asked as a follow-up or taken as a recommended default AND recorded as an open item — never silently guessed
- [ ] **Zero content carry-over:** no real numbers, customer names, feature specifics, or quotes from the examples survive in a derived template — structure and voice rules only
- [ ] **Every evidence slot routed:** all four `/prd-draft` slot groups have a named home in the guidance layer
- [ ] **Validation ran** (or the user explicitly skipped it — recorded as Open — Other) with score + failures reported
- [ ] **Right repo:** installed in an instance, or staged outside the master — never overwrote the master's universal defaults
