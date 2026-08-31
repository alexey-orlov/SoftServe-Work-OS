---
name: user-research-synthesis
description: Cross-interview synthesis over the central tagged transcript archive — what is actually true about a problem, across 4+ filed interviews. Scope a run by topic or slug (--initiative/--area/--feature/--customer, resolved against the governance/link-schema.yaml registries — unknown slug stops the run) or by --hypothesis (evidence for and against one named PRD/job-spec hypothesis → supported/refuted/mixed verdict + a suggested confidence update, applied to the PRD only by /prd-draft). Prints the coverage readout before synthesizing — N transcripts carry the scope tag, N read, exclusions with reasons, near-misses offered to /retag-transcript — then extracts Mom-Test-weighted observations, affinity-maps them into a theme hierarchy with honest frequencies (X of N read), severity, contradictions, and missing segments, and saves user-insights/{topic}-{date}.md with scope-link frontmatter, linked from each named initiative page. Pasted material is additional input; pasted raw transcripts go to /process-meeting for filing first. Use on /user-research-synthesis, "what did we learn about X across interviews?", "does the evidence support this hypothesis?". NOT for filing transcripts or per-session processing (/process-meeting — this skill never files or edits raw material and never creates feature-request records), correcting transcript tags (/retag-transcript), counting demand in a request pile (/prioritize-requests), or editing the PRD (/prd-draft).
argument-hint: "[topic | --initiative {slug} | --area {slug} | --feature {slug} | --customer {slug} | --hypothesis {text or PRD/job-spec hypothesis row}]"
group: discovery-customers
---

## Quick Start

**What to provide:** A scope. Nothing else — the corpus is already filed and tagged in
`product-development/product/user-insights/transcripts/`.

```
/user-research-synthesis onboarding friction                → free topic: themes:/content match
/user-research-synthesis --initiative time-off-requests-v1  → transcripts tagged with that initiative
/user-research-synthesis --area billing                     → transcripts tagged with that area
/user-research-synthesis --feature credit-usage-dashboard   → transcripts tagged with that feature
/user-research-synthesis --customer acme-example            → that account's transcripts
/user-research-synthesis --hypothesis "SMB admins self-serve setup without a call"
                                                            → evidence for and against, verdict
```

**What you get:** the coverage readout (what's in the corpus, what was excluded and why,
what looks mistagged), then themes with frequency and severity, contradictions, missing
segments, and recommendations — saved to `user-insights/{topic}-{date}.md`. Hypothesis
mode gets an evidence-for/against table and a supported/refuted/mixed verdict instead.

**Time:** 15–30 minutes depending on corpus size.

---

# User Research Synthesis

Establish what is **true** about a problem from interviews you designed and ran. A request
pile tells you what customers want (`/prioritize-requests` counts that); this skill tells
you what is actually going on — with "you should add Z" explicitly discarded as unreliable
and past behavior weighted over promises.

The corpus is the central tagged archive, not an upload. `/process-meeting` files every
interview and customer call to `user-insights/transcripts/` with tag frontmatter; this
skill queries those tags, reads the filed set, and writes one cross-interview report. One
filing pipeline, one synthesis layer.

---

## When to Use

- **After a research round completes** — 4+ interviews filed across sessions (per-session
  insight reports are `/process-meeting`'s job; the ladder governs who synthesizes)
- **Before or during `/prd-draft`** — when an initiative's evidence needs consolidating,
  or a Key-hypotheses row needs a verdict (`--hypothesis`)
- **When a Collect Signal theme from `/prioritize-requests` needs resolving** — demand is
  proven, truth isn't; this is the instrument that resolves it

**When NOT to use:**

- One session's interviews → `/process-meeting` (interview category writes the session report)
- Inbound request piles from support/sales → `/prioritize-requests`
- Quantifying a feature's value → `/impact-sizing`
- Writing the interview questions → `/interview-guide`

---

## Scoping

Resolve the scope before anything else. Slug scopes resolve against the entity registries
in `governance/link-schema.yaml`:

| Flag | Resolves against |
|------|------------------|
| `--initiative {slug}` | `product-development/product/initiatives/*.md` — the filename is the slug |
| `--area {slug}` / `--feature {slug}` | `product-development/feature-index.yaml` catalog |
| `--customer {slug}` | `product-development/product/customers/accounts/*/` folder names |

**Unknown slug → stop.** Print the nearest existing slugs and end the run — never
synthesize against a scope that resolves to nothing. A free-text topic needs no registry:
it matches `themes:` tags plus title/content — and its report's scope links are the UNION
of the `areas:` / `features:` / `customers:` tags on the transcripts it actually read (the
`synthesis` type requires at least one; a union that comes back empty means the corpus is
untagged — say so and stop rather than filing a linkless report).

**`--hypothesis` mode.** Name the hypothesis verbatim — typically a row from a PRD's Key
hypotheses table or a job spec's open question, or pasted text. When it comes from a
PRD/job spec, the corpus is scoped by that document's initiative (resolve the slug as
above); free-text hypotheses are topic-scoped. The run synthesizes evidence FOR and
AGAINST that one statement and ends with a supported/refuted/mixed verdict plus a
suggested confidence update (e.g. `Med → High`) — **written into the synthesis report
only**. The PRD's table is updated by `/prd-draft`, its one writer; say so in the readout.

---

## Inputs

| Source | What to extract | If missing |
|--------|-----------------|------------|
| `product-development/product/user-insights/transcripts/*.md` | **The primary corpus.** Read the fenced frontmatter of every file; filter by the run's scope tag (`initiatives:` / `areas:` / `features:` / `customers:`, or `themes:` + content for a free topic). `type: interview` is primary evidence; `type: call` corroborates | Nothing carries the tag → print the coverage readout anyway and stop — build the corpus via `/interview-guide` → `/process-meeting`. Exception: pasted non-transcript material (survey verbatims, support excerpts) is present → proceed on it, label the report **preliminary**, and state in the readout that N counts pasted items, not filed transcripts |
| Prior syntheses — `user-insights/{topic}-{date}.md` | Previous findings on adjacent topics — build on, don't duplicate; name any theme the new corpus overturns | First synthesis — note it, continue |
| Session reports — `user-insights/{date}-interview-insights.md` | Per-session insight cards for in-scope transcripts — the fast first pass before the raw read | Read the raw transcripts directly |
| `user-insights/feature-requests/*.md` | Explicit asks from in-scope accounts — demand context beside a theme, never truth evidence on its own | — |
| `product-development/product/PRDs/{area}/*.md` | Problem framing + the Key hypotheses table — what the team already believes; the source row in `--hypothesis` mode | Note the missing framing, continue |
| `product-development/product/strategy/` (`current-quarter.md`, `business-context/business-info.md`) | Strategic fit for recommendations; ICP + personas for the missing-segments check | Recommendations carry no fit line; missing-segments check runs on sample facts only |
| `user-insights/interview-guides/` | What was asked — the leading-question risk check for evidence weighting | Skip the bias check, say so |

**Pasted or uploaded material is additional input**, layered on top of the filed corpus —
notes, survey verbatims, support excerpts. **Pasted raw transcripts are the exception:**
they route through the delegation clause in Write-back below — `/process-meeting` files
them first, then this run synthesizes over the filed set.

---

## Coverage Readout (mandatory — before any synthesis)

Print, in chat, before extracting a single observation:

```
Corpus — {scope}: 7 transcripts carry the tag · 6 read
Excluded: 2026-05-02-acme-example-call.md — status call, no research content (stated in report)
Near misses (share the scope's neighborhood, lack the tag):
  2026-06-11-initech-interview.md — tagged areas:[billing], not initiatives:[credit-usage-dashboard-v1]
  → retag via /retag-transcript? Continuing on the tagged corpus either way.
```

- **Every scope-tagged transcript is accounted for** — read, or excluded with a stated
  reason that also lands in the report's Coverage section. Never silently synthesize a
  partial corpus.
- **Near-miss detection:** derive the scope's neighborhood and list transcripts tagged in
  it but missing the scope tag itself — for an initiative scope, transcripts carrying the
  initiative page's declared `areas:`/`features:`/`customers:`; for a feature scope, its
  parent area (the catalog resolves it); for a customer scope, filenames carrying the
  account slug whose `customers:` tag lacks it. Offer `/retag-transcript`, then continue
  on the tagged corpus — retagging is the PM's call, not this run's.
- **N = the read count.** Every frequency claim downstream uses it as the denominator
  ("4 of 6 transcripts read") — never a vaguer base.
- Fewer than 4 `type: interview` transcripts in scope → say so and proceed only on an
  explicit yes, labeling the report **preliminary**.

---

## What It Does

### Step 1: Resolve the scope

Per Scoping above. Unknown slug stops the run.

### Step 2: Discover the corpus and print the coverage readout

Read the fenced frontmatter of every file in `transcripts/`, filter by the scope tag,
detect near misses, print the readout. Layer in any pasted additional input (delegating
raw transcripts first).

### Step 3: Extract observations

Per transcript: verbatim quotes, observed behaviors, pain points, workarounds, context
(role, segment, environment), emotion signals. Weight each observation by the Mom Test:

| Unreliable — flag, never count as truth | Reliable — evidence |
|---|---|
| Future predictions ("I would definitely use this") | Past behavior ("last time I tried X, I had to Y") |
| Hypotheticals ("if you built X, I'd Y") | Specific stories with sequence and consequence |
| Compliments without specifics | Recurring observed patterns ("every single time…") |
| Naked feature requests ("you should add Z") | Workarounds actually built (spreadsheets, scripts, manual steps) |

Cross-check the interview guide: answers to leading questions get their weight cut, and
the report says which.

### Step 4: Cluster into a theme hierarchy (affinity mapping)

Group observations into sub-themes, sub-themes into themes. Each theme carries:

- **Frequency** — X of N transcripts read (N from the readout)
- **Severity** — High / Med / Low, from emotion intensity + workaround cost
- **Evidence strength** — **Strong**: 3+ transcripts with reliable-column evidence ·
  **Moderate**: 2 transcripts, or one strong story corroborated by a feature-request
  record · **Weak**: single anecdote, or reliable-column evidence absent. A theme resting
  only on unreliable-column material is flagged, never promoted.
- **JTBD framing** — When [situation], I want to [motivation], so I can [outcome]
- **Root cause** — run Five Whys past the surface ask ("wants better search" → scattered
  templates); name the level you stopped at
- **Verbatim quotes** — role-attributed with the account slug, never customer-side names
  (transcripts keep names; every downstream layer is roles-only)

**Contradictions get their own callout** — both camps, counts, and a recommendation.
Evidence that contradicts the going-in hypothesis gets extra weight; it is the hardest
to see.

### Step 5: Check the sample (missing voices)

Compare who was interviewed against the ICP and personas in `business-info.md`: segments,
sizes, roles, tiers not in the corpus. State the generalization risk and the next research
round that closes it. If findings contradict a persona or ICP fact, propose the exact
before/after edit to `business-info.md` — gated, applied only on the user's yes, with the
root CLAUDE.md fundamentals block kept consistent in the same change (mirror rule).

### Step 6: Recommend

Build / explore-next / deprioritize — each naming a concrete area, feature, or flow, with
strategic fit read from `current-quarter.md` when it's filled. Open questions carry an
owner. Themes deliberately not addressed get a reason.

**`--hypothesis` mode replaces Steps 4–6:** two evidence tables (FOR / AGAINST, one row
per observation with its transcript path and Mom Test weight), the verdict
(supported / refuted / mixed), the suggested confidence update for the source row, and
what would settle a mixed verdict. Hand the update to `/prd-draft`.

### Step 7: Save and write back

Per Output Format and Write-back below.

---

## Output Format

Save to: `product-development/product/user-insights/{topic}-{date}.md` — scoped runs use
the slug as `{topic}` (e.g. `time-off-requests-v1-2026-08-30.md`); hypothesis runs append
`-hypothesis` to the source document's initiative slug, or kebab the pasted statement.
Never the `*-interview-insights.md` pattern — that filename belongs to `/process-meeting`.

Fenced YAML frontmatter — the scope links plus every transcript read (link contract:
`governance/link-schema.yaml#types.synthesis`):

```yaml
---
date: 2026-08-30
type: synthesis
initiatives: [time-off-requests-v1]   # the run's scope links — only the keys the scope names
areas: []
features: []
customers: []
themes: [approval-chains, mobile-requests]
docs:
  - product-development/product/user-insights/transcripts/2026-08-12-acme-example-interview.md
  - product-development/product/user-insights/transcripts/2026-08-19-initech-interview.md
---
```

Report skeleton:

````markdown
# Research Synthesis: {topic}

**Scope:** {scope} · **Corpus:** {tagged} tagged / {N} read · **Date:** {YYYY-MM-DD}

## Coverage
[The readout, verbatim: read / excluded-with-reason / near-miss disposition]

## Executive Summary
[Top 3 insights, each one line with frequency. Recommended actions: build / explore / deprioritize.]

## Themes
[Per theme: frequency X of N · severity · evidence strength · JTBD · root cause ·
role-attributed quotes with transcript links · contradiction callouts where found]

## Missing Voices
[Who wasn't in the sample vs ICP/personas · generalization risk · next round]

## Not Addressing (and why)

## Open Questions
[Each with an owner]

## Appendix: Observations
[The extracted observations, per transcript]
````

Hypothesis runs swap Themes → Evidence FOR / Evidence AGAINST tables + Verdict +
Suggested confidence update ("Confidence: Med → High — 5 of 6 transcripts show the
behavior; `/prd-draft` applies this to the PRD row").

**Chat budget:** the coverage readout, executive summary, and theme list (or the verdict)
in chat; full detail lives in the file.

## Write-back (mandatory)

After saving, close the loop — full contract: `governance/write-back-contract.md`:

1. Add a one-line entry for the new file at the END of the file list in its folder's
   `CLAUDE.md` (append-only — never re-sort existing lines; re-sorting causes merge
   conflicts). If you created a new folder, add it to the parent's CLAUDE.md and create a
   5-line CLAUDE.md stub inside it.
2. Declare the artifact's links in its frontmatter per `governance/link-schema.yaml` —
   resolve them YOURSELF from context before filing (initiative-scoped work names its
   one initiative; the initiative page gets the artifact row filled + a dated Activity
   line in the same change). A brand-new feature/area → propose the catalog entry
   (`feature-index.yaml`, gated) in the same confirmed change that registers the work.
3. In the artifact's header, link the source material it was derived from.
4. End your reply by listing every repo path you wrote or updated.

For this skill specifically: each initiative named in the report's frontmatter gets the
report linked from its page plus one dated Activity line (contract rule 8) — and that is
the only backlink surface. **This skill never writes `feature-index.yaml`** — its scope
slugs were resolved against the catalog before the run started, so the uniform block's
new-entry clause never fires here; a theme that deserves a new catalog feature routes
through `/prd-draft`'s registration step.

**Raw transcripts (delegation clause):** when handed raw transcripts directly (not already
processed by `/process-meeting`), this skill never files them itself — hand them to
`/process-meeting` first (batch mode for 4+, interview category per conversation: each is
filed to the central archive with tag frontmatter, the session report written,
feature-request records created, the ledger appended — the 3+/4+ interview ladder governs
who SYNTHESIZES, not filing, which is per-conversation and unbounded), then synthesize
over the filed set. One filing pipeline, one writer per surface
(`governance/write-back-contract.md` rule 6 and the one-writer table); the cost is one
"filing N transcripts first…" line before the synthesis starts.

---

## Boundaries

- **Never files transcripts** — raw material arriving here is delegated to
  `/process-meeting` (clause above).
- **Never edits raw material** — transcript bodies are immutable; tags are corrected only
  by `/retag-transcript` (this skill offers it at the readout, never applies it).
- **Never creates feature-request records** — `/process-meeting` and `/context-update`
  own those.
- **Not per-session processing** — one session's interviews get their insight report from
  `/process-meeting`; this skill starts at 4+ across sessions.
- **Never edits a PRD or job spec** — hypothesis verdicts and confidence updates live in
  the synthesis report; `/prd-draft` and `/job-spec-draft` fold them into their own files.
- **Never writes `feature-index.yaml`** — no catalog entries, no status flips.
- **Truth, not demand** — counting askers and routing verdicts is `/prioritize-requests`;
  its Collect Signal themes are this skill's best customers, and its Evidence axis reads
  this skill's themes as the strongest corroboration in the repo.

---

## Related Skills

**Before this:**
- `/interview-guide` — design the questions; its guide feeds the bias check here
- `/process-meeting` — files every transcript this skill reads; the 4+ ladder hands off here
- `/retag-transcript` — fix the tags the coverage readout flags, then re-run

**After this:**
- `/prd-draft` — turn themes into a spec; folds hypothesis confidence updates into the PRD
- `/prioritize-requests` — reads these themes as its strongest evidence
- `/competitor-analysis` — competitor mentions surfaced in themes route there
- `/write-prod-strategy` — cross-feature findings ladder into strategy

---

## Output Quality Self-Check

Before presenting output to the PM, verify:

- [ ] **Scope resolved:** slug matched its registry (or the run stopped), or a free topic was declared
- [ ] **Coverage readout printed before synthesis:** every scope-tagged transcript read or excluded with a stated reason, in chat and in the report
- [ ] **Near misses listed and `/retag-transcript` offered** — or "none found" stated
- [ ] **Every frequency uses N (the read count) as denominator** — no vaguer base anywhere
- [ ] **Mom Test weighting applied:** unreliable evidence flagged, no theme promoted on predictions or compliments alone
- [ ] **Themes backed by 2+ transcripts** (or explicitly marked Weak/preliminary), each with evidence strength, severity, JTBD, and a root cause
- [ ] **Contradictions and Missing Voices sections present** — even if "none found"
- [ ] **Quotes role-attributed with account slug** — no customer-side names outside transcripts
- [ ] **Frontmatter carries the scope links + `docs:` listing every transcript read**
- [ ] **Report linked from each named initiative page with a dated Activity line** in the same change; nav line appended to the END of `user-insights/CLAUDE.md`'s file list
- [ ] **No writes to `transcripts/`, `feature-requests/`, `feature-index.yaml`, any PRD or job spec** — hypothesis mode left the PRD untouched and said `/prd-draft` applies the update
- [ ] **Every repo path written is listed** at the end of the reply
