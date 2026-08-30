---
name: prototype-feedback
description: Apply review feedback to an existing prototype — triage every item (fidelity gap, token drift, design change, spec change, system gap, content realism, out of scope, unclear), resolve the decisions in one batched exchange, snapshot then edit the file surgically (never regenerate), re-run the token audit, and log every item's disposition in the prototype's feedback log so declined and deferred items stay answerable. Divergences are decisions — changes contradicting Figma are flagged as divergences; changes contradicting the job spec or PRD route back through /job-spec-draft or /prd-draft, never silently absorbed. Works on repo HTML prototypes and, via prompt-file updates, on external v0 / Lovable / Bolt ones. Use on /prototype-feedback, "here's the feedback on the prototype", "the PMs had comments", "design review said…", "apply this round of feedback", a pasted thread, transcript, or annotated screenshot about a prototype. NOT for generating the critique yourself (/prototype-challenge), building the prototype (/prototype), or feedback on production application code.
argument-hint: "[prototype path or slug]"
group: prototyping
---

# Prototype Feedback

Apply a round of review feedback to an existing prototype without losing the three things that make it useful: alignment with the design system, alignment with the spec, and a record of why it looks the way it does.

## Why this exists

Editing HTML from a list of comments is easy. Doing it over three rounds without the artifact degrading is not. Three failures cause most of the damage. First, the fastest way to satisfy "make that button darker" is to type a hex code, so token compliance erodes exactly when feedback volume is highest. Second, much of what arrives as "feedback" is not a report that the preview is wrong — it is a request for a design Figma doesn't contain, or a behavior the spec doesn't contain; applying those silently turns the preview into an unlabelled second source of truth, and someone later builds what nobody approved. Third, a reviewer whose comment disappears without explanation stops giving useful feedback, which costs far more than the comment did.

So: triage first, edits second, and an explicit disposition for every item.

## Step 1 — Gather both halves

**The prototype and its context** (all under `product-development/product/prototypes/`):

- The artifact — `{slug}.html`, or for an external build, `{slug}-{tool}-prompt.md`. Resolve the slug via the initiative pages if only a feature or initiative name was given ({slug} = the initiative slug).
- `design-system/tokens.css` + `design-system.md` — the token set this preview is bound to, plus recorded gaps. (A plain-HTML prototype is bound to its own `:root` block instead.)
- `{slug}-feedback-log.md` — the build record (source spec, coverage, gaps) and earlier rounds. **Read it before anything else.** Reviewers re-raise points already declined; "we decided against that in round 1 because X" is worth far more than quietly doing it this time.
- The spec the build record links — the job spec or PRD. Needed to tell "the preview is wrong" from "the reviewer wants the spec changed".

**The feedback, in whatever form it arrives:** pasted text, a bullet list, a document, a meeting transcript; an annotated screenshot (view it — arrows and circles carry location information the text omits); a Slack/Teams/email thread (if a connector is available and the user points at a thread, offer to pull it — never go hunting uninvited).

If feedback references screens or elements the file doesn't have, say so rather than inventing them — the reviewer likely saw a different version (check `history/`).

**If the feedback is approval, say so and stop.** "This looks great" is a complete result; making changes anyway to demonstrate effort wastes the reviewer's next round.

## Step 2 — Triage every item

Split the feedback into individual items, even when it arrives as one paragraph — "love the dashboard but the table is cramped and can we use our new green" is three items with three dispositions. Classify each:

| Category | What it means | What to do |
|---|---|---|
| **Fidelity gap** | Preview doesn't match the Figma design | Fix the preview; re-read the Figma node if unsure which is right |
| **Token drift** | Preview uses values outside the token set | Fix, then re-run the audit |
| **Design change** | Reviewer wants what the Figma design doesn't show | A decision, not a fix — step 3 |
| **Spec change** | Reviewer wants behavior the job spec / PRD doesn't contain (or contradicts) | A decision, not a fix — step 3; accepted changes route through the spec's writer |
| **System gap** | Needs a token/component the design system lacks | Nearest existing token, record the gap, name it in the reply |
| **Content realism** | Data, copy, or density reads as fake | Fix the preview |
| **Out of scope** | Performance, APIs, real data, eng feasibility | Acknowledge and route (backlog, engineer); don't build it into a preview |
| **Unclear** | "Feels off", "make it pop" | Diagnose from the file and propose — `references/vague-feedback.md` |

Then locate each actionable item in the file — screen id and selector — before editing anything. An item you cannot locate is an item you cannot honestly mark as applied.

## Step 3 — Resolve decisions before touching the file

Four situations need the user. **Batch them into a single exchange**, each with a concrete proposal attached so a yes costs three words.

- **Design changes diverging from Figma.** Apply in the preview and record a divergence, or keep the preview faithful and take it to Figma first. Neither is wrong — a preview is often exactly where design iterates — but it must be a deliberate decision, because the preview is what stakeholders will remember.
- **Spec changes.** The preview can demonstrate the new behavior this round, but the requirement itself lands only through its one writer — `/job-spec-draft` (or `/prd-draft`). Offer to run it after this round; until then the log carries the divergence. Never quietly extend the prototype past the spec — that is exactly how UI choices masquerade as requirements.
- **Contradictions between reviewers.** "Condense the table" (PM) and "more breathing room" (designer) cannot both land; picking one silently makes the other's review look ignored. Surface with both names attached.
- **Genuine ambiguity.** Ask once, with the diagnosis done: "I'd raise the primary action to `--color-accent-strong` and add `--shadow-md` — does that land?" beats "what did you mean?".

## Step 4 — Apply as one round

Snapshot first, so "what did it look like before?" stays answerable:

```bash
cp product-development/product/prototypes/{slug}.html product-development/product/prototypes/history/{slug}-r{N}.html
```

Then make targeted edits. **Do not regenerate the file.** Rebuilding discards everything nobody commented on — the realistic data reviewers grew used to, the states, the copy that was fine — and makes the round diff useless; a file that changed everywhere reads as a different prototype and reviewers start over. While editing: every new value references a token (a value with no token is a system gap to record, not a hex code to type); keep screen ids and DOM order stable (nav, `data-goto`, and reviewers' location references depend on them); a new screen or state joins the nav; new content matches the plausibility of what's around it.

**External-tool prototypes:** the same triage applies, but "apply" means targeted edits to `{slug}-{tool}-prompt.md` (with a `## Round {N} changes` note at the top) for the user to re-run in the tool — flag that a regenerated external build may shift things nobody asked to change.

## Step 5 — Verify

```bash
python .claude/skills/prototype/scripts/audit_tokens.py product-development/product/prototypes/{slug}.html --tokens product-development/product/prototypes/design-system/tokens.css
diff product-development/product/prototypes/history/{slug}-r{N}.html product-development/product/prototypes/{slug}.html
```

The audit matters more after a feedback round than after the build — feedback pushes toward one-off values. Read the diff too: it catches edits that landed somewhere unintended and confirms the change set matches the items claimed as applied. If a browser tool is available, render the changed screens — cramped, unbalanced, and hard-to-scan can only be verified by eye.

## Step 6 — Log and report

Append to `{slug}-feedback-log.md`:

```markdown
## Round {N} — {date} — {source, e.g. #design-review thread}

| Item | From | Category | Disposition | Note |
|---|---|---|---|---|
| Table rows too tight | Marta | Fidelity gap | Applied | Row height now --space-6, matches node 412:1058 |
| Use the new green for CTAs | Ihor | Design change | Applied, diverges | Figma still shows --color-accent; flagged to Ihor |
| Auto-approve small requests | Dana | Spec change | Deferred to spec | Needs /job-spec-draft — rule change, not a preview fix |
| "Header feels heavy" | Dana | Unclear | Applied | Diagnosed: heading weight one step above system default |

### Divergences from Figma
- CTA fill uses --color-accent-new; Figma node 412:1058 still shows --color-accent (round {N})

### Spec changes routed
- Auto-approve threshold → /job-spec-draft, awaiting run

### System gaps surfaced
- No token for a 2px focus ring on dark surfaces; using --color-border-strong
```

Then report in the conversation with the same dispositions, briefly: lead with what changed, name what did not and why, and list divergences, routed spec changes, and gaps separately — those are the items someone else must act on. **Every item the user gave appears somewhere in the report**; silence on an item reads as it being lost.

## Write-back (mandatory)

Full contract: `governance/write-back-contract.md`. The log file is already in `product/prototypes/CLAUDE.md` from the build (append it if somehow missing); history snapshots are exempt by that folder's convention. If a round materially changed what the prototype demonstrates, refresh the initiative page's Prototype row note (auto-tier) in the same change. End the reply listing every repo path written or updated.

## Traps

- **Applying a design or spec change without flagging the divergence** — the one that causes real downstream damage.
- **Editing the spec from this skill** — spec changes route through `/job-spec-draft` / `/prd-draft`, the one writer.
- **Fixing a design-system complaint locally.** "Our blue is too dark" is feedback for the design-system owner; patching one preview hides the signal and guarantees the next preview has the same problem.
- **Regenerating the file** instead of editing it.
- **Answering vague feedback with a redesign** — diagnose, propose, ask once.
- **Splitting the user's decisions into many small questions** — one exchange, all of them.
- **Dropping items that are awkward to categorize** — deferred-with-reason is a legitimate disposition; missing is not.
- **Treating volume as quality** — ten small edits that satisfy the letter of the feedback while the screen gets busier is not a successful round.
