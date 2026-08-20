---
name: pm-handoff
description: Readiness gate for handing requirements from PM to BA / Technical PM / Product Owner (who write the specs and user stories) — an entire feature (PRD + jobs-breakdown + every job spec) or a single job (initiative + J-N). Four checks against the documents as they stand, every finding cited file:line — (1) no open/unvalidated items ([GAP:], TBD, [TODO:], [Hypothesis] labels, open questions, unchecked engineering confirmations); (2) prototype links present and resolving, or an explicit in-doc reason why none; (3) approval confirmed in the documents' own status fields (PRD Approved; spec Agreed/Handed off; breakdown + initiative page consistent) — a verbal yes never substitutes; (4) no essential template section missing (section set read fresh from the installed templates — house formats apply) unless the doc states why it was skipped. Output: a ✅/❌/⚠️/➖ checklist, READY / NOT READY verdict, fix route per failure — speaking the org's artifact terms when business-info.md carries a Document Naming Conventions block. Chat-only; a dated record to PRDs/{area}/reviews/ only on request (--save). Never edits the checked documents. Use on /pm-handoff, "ready to hand off?", "handoff check for {initiative}", "can the BA pick this up?". NOT for content quality (/prd-challenge, /job-spec-challenge), re-gating the cut (/jobs-breakdown), launch readiness (/feature-launch-gate), or cutting tickets (/create-tickets — run it after a READY verdict).
argument-hint: "[initiative|prd-path] [J-N|job-spec-path] [--save]"
group: delivery
---

# PM Handoff — Requirements Readiness Check

The gate at the definition→delivery seam: before requirements pass from PM to a BA / Technical PM / Product Owner who will write the detailed specs and user stories, verify the package is actually ready to be picked up by someone who wasn't in the room. The receiver gets documents, not context — so the documents must carry everything.

**This skill reports; it never edits.** The PRD belongs to `/prd-draft`, the breakdown to `/jobs-breakdown`, each job spec to `/job-spec-draft` — every failure below names the fix route, and the fix happens there (or by the human owner). Statuses move to `Handed off` through their owning skills after the handoff actually happens, never through this one.

## Quick Start

```
/pm-handoff                              → list initiatives with recent PRD/spec activity, ask which
/pm-handoff {initiative}                 → feature mode: PRD + breakdown + all job specs
/pm-handoff {initiative} J-2             → single-job mode: that job spec + its parent PRD
/pm-handoff {path-to-prd-or-spec}        → same, resolved from the file
/pm-handoff {…} --save                   → also persist the dated record (otherwise chat-only)
```

## Step 1 — Resolve the handoff package

From the argument, resolve via `product-development/feature-index.yaml` first (`prd`, `jobs-breakdown`, `job-specs` keys), then by globbing `PRDs/{area}/{slug}-*`. State the package explicitly before checking — the reader must see what the receiver would receive:

- **Feature mode:** the PRD, the jobs-breakdown (if one exists), and every job spec whose breakdown row is not `deferred`. A single-feature initiative with no breakdown (chain skip rule) is fine — say so.
- **Single-job mode:** that one job spec, plus the parent PRD (the receiver needs the why-context; the PRD is checked too).
- **PRD-only package** (no jobs cut yet) is legitimate — in some orgs the BA/TPM/PO creates the specs *from* the PRD. Check what exists, mark the job-spec items ➖ with that stated, and note `/jobs-breakdown` as the option if the team wants the cut done PM-side.

## Step 2 — Read the org's conventions before checking

1. **Naming:** read `business-info.md` → **Document Naming Conventions** (present only after a `/customize-os` naming mapping). When present, all human-facing output of this skill — headings, verdicts, prose — uses the house terms; machine identifiers (paths, `*-prd.md` / `*-job-spec.md` suffixes, `J-N` IDs, slash commands) stay canonical, per that block's own rules. No block → OS terms.
2. **Templates:** read the *installed* `handbook/templates/prd-template.md` and `job-spec-template.md` fresh. They may be house formats installed by `/customize-os` — the template on disk, not this skill, defines the essential-section set for check 4 and the shape of status/meta fields for check 3.

## Step 3 — The four checks

Every finding carries `file:line` evidence and one severity: **❌ blocker** · **⚠️ warning (PM judgment)** · **➖ N/A with the reason stated**. Markers quoted as convention-talk (a doc's own checklist text mentioning `[GAP:]`) are judged in context, not counted mechanically.

### 1) No open or unvalidated items

Scan every package document for:

| Finding | Severity |
|---------|----------|
| `[GAP:` · `TBD` / `[TBD]` · `[TODO:` · `[FILL IN]` · `[NEED:` · leftover template placeholders (`[Your `, `[Replace `, `[Add `, `[YYYY-MM-DD]`, `[Name]`, empty `[link]`) | ❌ |
| `[Hypothesis — needs validation]` evidence labels | ❌ — an unvalidated assumption by its own label |
| Unchecked PRD Open Questions · job spec §13 rows not closed · §14 engineering confirmations unchecked · §11 exception rows still `?` · `provisional` scope tiers · effort still `[Eng to confirm]` | ❌ — each with its location |
| Breakdown cross-job decisions still Open (feature mode) | ❌ — they block story-writing across jobs |
| `[Partial]` evidence labels | ⚠️ — signal-not-proof; the PM decides whether it hands off |

`[code-name]`-style labels are the job-spec altitude convention, never a violation. Section numbers above are the stock template's — with a house template installed, find the same content by role, not by number.

### 2) Prototype links present

- **PRD:** the Meta Links row and the Solution section's Mockup/Prototype field. An empty `[Prototype]()` or a bare `[Link or embed]` fails.
- **Job spec:** any prototype/mockup/Figma link, or a link into `product/prototypes/` artifacts (`/napkin-sketch`, `/prototype`, `/code-first-draft` outputs) — the Handoff note is its natural home.
- Repo-relative links must resolve to a real file (❌ if dead). External links (figma.com …) are reported *present, not verified*.
- No prototype **with an explicit in-doc reason** (e.g. "no prototype — backend-only job, no user-facing surface") → ➖ quoting the reason. No prototype, no reason → ❌ with the route: `/prototype` (or link the existing Figma and register it under the feature-index `figma.prototype` key).

### 3) Approval confirmed

The documents' own status fields are the source of truth — a verbal "it's approved" in chat does not pass; the fix is updating the doc through its owner, then re-running.

- **PRD:** Status field = `Approved` (Draft / In Review → ❌; the field may live in a Meta table or an inline header line — read the installed template's shape).
- **Job spec:** header Status cell = `Agreed` or `Handed off` (`Draft` → ❌).
- **Feature mode — package completeness:** every breakdown job row is `agreed`/`handed-off` with its spec in the package, `deferred` (➖, listed), or a ❌ (`not-drafted`/`drafted` Must job = incomplete package).
- **Consistency:** breakdown row status ↔ spec Status cell ↔ initiative page `_status:` must not contradict each other (drift → ⚠️; drift that contradicts an approval claim → ❌). Cite a decision-log entry recording the approval when one exists — corroboration, not a requirement.

### 4) No essential template section missing

Extract the essential-section spine from the installed template (its H2 sections, minus author-facing apparatus such as the PRD template's "PRD Quality Checklist"). Conditional sections (job spec: Definitions, Committed solutions, Risks & break points, Competitive notes, Handoff note; PRD: AI Behavior Contract) count only when their trigger fires. Then, per document:

- Match template sections to doc sections **by name first, then by evident content** — worked docs legitimately rename or merge sections; report the mapping when names differ rather than failing a rename.
- Section absent with an explicit in-doc reason (the job-spec proportionality rule: a non-applicable section carries one line saying why) → ➖ quoting the reason.
- Section absent with no stated reason → ❌ with the owner-skill route.
- A job spec being handed off with no **Handoff note** → ⚠️: its template trigger ("handoff to BA/dev is imminent") is firing right now — offer to add it via `/job-spec-draft`.

## Step 4 — Verdict and readout

Any ❌ → **NOT READY**. Only ⚠️ → **READY WITH WARNINGS** (list them — the PM decides). Clean → **READY FOR HANDOFF**.

```
## PM Handoff Check: {initiative} — {full feature | J-N {job-name}}
Mode: {feature | single job} · Package: {each path on its own line}
{Naming: house terms in use per business-info.md → Document Naming Conventions — only when a mapping exists}

### 1) Open & unvalidated items    — {✅ clean | N blockers, M warnings}
### 2) Prototype links             — {…}
### 3) Approval confirmed          — {…}
### 4) Template completeness       — {…}
{each section: one ✅/❌/⚠️/➖ line per document/finding, file:line, fix route on every ❌}

### VERDICT: {READY FOR HANDOFF | READY WITH WARNINGS | NOT READY}
{NOT READY → blockers ranked by what blocks the receiver first, each with fix route + owner}
{READY → next steps: hand the package over; statuses move to Handed off via /job-spec-draft + /jobs-breakdown;
 /create-tickets when the backlog is cut in-house}
```

Results live in chat. **Save only when asked** (`--save`, or "save the check" afterwards).

## Saving on request

Dated record — append-only, never overwritten, one file per run (same class as challenge reports):

- Feature mode: `product-development/product/PRDs/{area}/reviews/{initiative-slug}-handoff-check-{YYYY-MM-DD}.md`
- Single-job mode: `…/reviews/{initiative-slug}-{job-slug}-handoff-check-{YYYY-MM-DD}.md`

The file carries the full checklist output plus a header linking every checked document (provenance).

## Write-back (mandatory — only when a record was saved)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   CLAUDE.md (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Feature-scoped artifact → propose the `product-development/feature-index.yaml` addition
   (a `reviews:` row) and apply it only after the user confirms (gated in
   `governance/write-policy.yaml`).
   Initiative-scoped → link the artifact from `product-development/product/initiatives/{slug}.md`
   (one dated Activity line).
3. In the artifact's header, link the source material it was derived from (the checked docs).
4. End your reply by listing every repo path you wrote or updated.

## Chain position

Not a numbered de-risk stage — an org-process seam gate. It runs after stage 5 of `product-development/product/handbook/de-risk-a-bet.md` (specs drafted, challenged, agreed) and before the work leaves the PM: `/create-tickets` when the backlog is cut in-house, or the BA / Technical PM / Product Owner handoff when spec- and story-writing belong to another role. `/feature-launch-gate` stays the launch-moment verdict; this gate is about a *receiver*, not a release.

## Output Quality Self-Check

Before presenting, verify:

- [ ] **Package stated first** — every checked path listed; what's absent (no breakdown, no specs yet) named, not implied
- [ ] **Every ❌ has file:line + a fix route** naming the owner skill or human — never a bare "missing"
- [ ] **Nothing was edited** — no write to the PRD, breakdown, specs, or their statuses; fixes were routed, not applied
- [ ] **Doc-stated reasons honored** — every ➖ quotes the in-doc reason (or the package-level fact) that earned it
- [ ] **Verdict follows the rule** — any ❌ ⇒ NOT READY; warnings alone never block, but all are listed
- [ ] **House terms used** when `business-info.md` carries a Document Naming Conventions block; machine identifiers left canonical
- [ ] **Templates read from disk this run** — essential sections came from the installed templates, not from this file
- [ ] **Nothing saved unasked** — a record exists only if the user asked; if saved, the write-back block ran and the reply lists every path
