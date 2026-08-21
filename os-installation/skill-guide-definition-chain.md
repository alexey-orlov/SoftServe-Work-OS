# Skill Guide — Instance Setup and the Definition Chain

How six skills work, one page each: the setup skill that teaches the OS your org's context, tools, and document formats, and the five skills that carry a bet from idea to buildable contract.

**Read this when:** You want to know what a `/`-command actually does before running it, or you are explaining the definition chain to someone new.

_updated: 2026-08-21 · source: each skill's `SKILL.md` in `.claude/skills/`_

## How the six fit together

```
/customize-os        installs YOUR context + YOUR house templates + YOUR artifact names
        │                (everything below then emits your format, unchanged skills)
        ▼
/prd-draft  ──►  /prd-challenge  ──►  /jobs-breakdown  ──►  /job-spec-draft  ──►  /job-spec-challenge  ──►  /create-tickets
  why this bet      stress-test it      cut into jobs        contract per job       judged checkpoint          the backlog
     (loop)          (never auto-run)     (re-runnable)          (one writer)         (never edits the spec)
```

Two rules run through all of them: **the template owns the format** (skills stay universal, the installed template carries house structure), and **one writer per file** (a challenge skill reports, the draft skill writes).

**The seam gate.** When spec- and story-writing belongs to another role — a BA, Technical PM, or Product Owner — `/pm-handoff` runs at the end of the chain, before the work leaves the PM: four checks (no open or unvalidated items; prototype links present; approval confirmed in the documents' own status fields; no essential template section missing without a stated reason) over the whole feature or a single job, ending in a READY / NOT READY verdict with a fix route per failure. It follows both rules above: it reports and never edits, and it reads the installed templates and the Document Naming Conventions block fresh each run — so house formats and house terms from `/customize-os` flow through it with no skill change.

| # | Page | Skill | One line |
|---|------|-------|----------|
| 1 | [below](#1-customize-os--fit-the-instance-to-the-org) | `/customize-os` | Derive the org's house templates and artifact names from its real documents |
| 2 | [below](#2-prd-draft--the-prd-loop) | `/prd-draft` | Draft and re-draft the PRD as the living state of a bet |
| 3 | [below](#3-prd-challenge--every-critique-lens-at-once) | `/prd-challenge` | Run every critique lens in parallel, merge into one ranked report |
| 4 | [below](#4-jobs-breakdown--the-cut) | `/jobs-breakdown` | Cut the agreed initiative into independently shippable jobs |
| 5 | [below](#5-job-spec-draft--the-buildable-contract) | `/job-spec-draft` | Write the buildable contract for one job |
| 6 | [below](#6-job-spec-challenge--independent-judgment-on-the-contract) | `/job-spec-challenge` | Judge that contract before it becomes tickets |

---

## 1) `/customize-os` — fit the instance to the org

### At a glance

| Field | Detail |
|-------|--------|
| **Purpose** | Adapt a deployed copy of this OS to one customer or org — one guided, resumable sequence from populating the steering context out of the org's real documents through initiative pages, tool choices, artifact naming, and house templates. Org-specific content lives in customized context files — never hardcoded into a skill. |
| **When used** | Right after install, to populate the steering context and create the first initiative pages · when the org wants its own PRD / breakdown / job-spec format adopted · when the org calls these artifacts something else (brief, epic, slice, feature spec) · to set or change the design-system or user-research choice · to check demo readiness · to resume an unfinished customization · to ask where customization stands. |
| **Data it takes in** | Org name, product name(s), official domain<br>Source documents for context population — decks, one-pagers, org charts, OKR docs, CRM/segmentation exports (read in place, never copied into the repo)<br>Names of 3+ current or recent initiatives, with any briefs/transcripts behind them<br>2–4 **real, filled** example documents per house-template target (`.docx`, `.pdf`, `.md` — filled beats blank, they show voice)<br>House rules the examples can't show — approval ladder, confidentiality footer, naming conventions<br>Its own state files from previous sessions |
| **What it outputs** | Populated steering files — `business-info.md`, the root `CLAUDE.md` fundamentals block, `stakeholders.md`, `segmentation-matrix.md`, `current-quarter.md` — every item filled, an honest GAP, or N/A, with a row-by-row coverage report (optional web enrichment for public facts)<br>Initiative pages with their material folded in<br>The `prototyping:` and `user-research:` choices in `toolchain.yaml`<br>A house template at `handbook/templates/{prd\|jobs-breakdown\|job-spec}-template.md`; for a naming map, a **Document Naming Conventions** block plus the repo-wide prose sweep<br>Updated state: `os-installation/customization-status.md` + `customization-facts.yaml` (values, sources, provenance)<br>A closing readout: what changed and where, what's still missing (Critical / Other), sequence position, the single next action |
| **Not for** | Connecting tool servers (`/connect-mcps`), code access (`/connect-code`), generating synthetic demo data (`/demo-data` — customize-os only assesses readiness and delegates), or writing an actual PRD (`/prd-draft` — run it *after* customization). |

### How it works, step by step

| Step | What happens |
|------|--------------|
| 0 — Read state | Reads `customization-status.md` **first**, then looks for answers in the repo and any documents you pointed at. It only asks for what it genuinely can't find. |
| 1 — Preflight (once) | Confirms which repo this is (customer instance vs. SoftServe master — the master stages outputs outside the repo, never overwrites its universal defaults) and captures org name, product name(s), and the official domain. |
| 2 — The guided sequence | Runs the next open step. **context-core**: shows what the steering files need, reads your documents through extractor subagents (every value carries a verbatim quote — nothing invented), resolves conflicts by source precedence (a dedicated source beats a passing mention, newer beats older, your word beats any document), installs behind the gated prompt, verifies, and reports row by row — filled / GAP / N-A — then offers web research for the public-fact gaps only. Then **initiatives** (3+ pages, material folded via the ingestion skills) → **design-system** and **research-source** (toolchain choices; meeting cadences) → **demo-readiness** (assess; delegate gaps to `/demo-data`) → **naming-conventions** (keep or map, one question, swept repo-wide on a map) → **house templates** (gather 2–4 filled examples → derive a blanked skeleton + guidance layer → validate with a fresh subagent → install) → **metric-conventions**. Any step can be run by name; skips are recorded with their consequence; prerequisites are enforced with the reason; material that belongs to a later step is parked and used when that step runs. |
| 3 — Auto-sync close (once) | At the end of whichever run gets there: how work lands (direct vs. pr), a plain-language walkthrough of which files need your yes vs. which agents write freely (confirm as shipped, or adjust stricter/looser), and who stewards the OS. |
| 4 — Record and close | Updates the state files and prints the readout — what changed and where, Critical / Other gaps, sequence position, the single next action. Every run ends here, including interrupted ones. |

### Options

**Commands**

1. `/customize-os` — read state; resume where the sequence left off, or start guided
2. `/customize-os continue` — the same, explicitly
3. `/customize-os status` — report progress across all targets, change nothing
4. `/customize-os context-core` — populate (or re-run) the steering-context step by name
5. `/customize-os prd-template ~/a.docx ~/b.docx` — run one target with inputs up front

**Targets** (the guided sequence runs them in this order; each also runs by name)

- `context-core` — populate the general steering context from real documents; coverage report + optional web enrichment *(implemented; `fundamentals` is accepted as an alias)*
- `initiatives` — create the org's initiative pages and fold their material in *(implemented)*
- `design-system` — how prototypes get design grounding → `toolchain.yaml` *(implemented)*
- `research-source` — where research/meeting records come from + meeting cadences → `toolchain.yaml` *(implemented)*
- `demo-readiness` — enough real data to demo? assess, or delegate gaps to `/demo-data` *(implemented)*
- `naming-conventions` — execute the artifact-name mapping repo-wide *(implemented)*
- `prd-template` / `jobs-breakdown-template` / `job-spec-template` — house formats *(implemented)*
- `metric-conventions` — KPI tier names and required fields *(guided, manual)*
- `auto-sync` — landing mode + the gated-list walkthrough *(implemented; also runs once automatically at the close)*

**Choice points**

- Naming: **keep canonical** · **map** (partial maps are fine — e.g. jobs → epics, job specs kept)
- Mode: **customer instance** (install at the consuming path) · **master repo** (derive and stage outside the repo)
- Web enrichment: **research selected public-fact gaps** · **skip** (web fills gaps only, never overwrites what you provided)
- Worked examples: once real content lands — **remove per category** (reference-clean) · **keep**
- A pre-existing stray template: **remove** (recommended, after capturing it as an input) · **keep** (recorded as a drift risk)
- Auto-sync: **direct** · **pr** · **later** — plus the gated list **as shipped** · **stricter** · **looser**

**Lifecycle every target moves through:** `not started → gathering → derived → validated → installed → complete`

---

## 2) `/prd-draft` — the PRD loop

### At a glance

| Field | Detail |
|-------|--------|
| **Purpose** | Draft and iterate the PRD as the *living state of a bet*, not a one-shot document. Every run re-reads the evidence attached to the initiative, folds it in, marks what is still unbacked, closes the gaps it can close by itself, and says where the bet stands. |
| **When used** | A new feature idea or problem statement · every time new evidence lands (a call summary, a research synthesis, an investigation) · when you ask "where does this feature stand?" |
| **Data it takes in** | Your idea / brief, or just the slug of an existing initiative<br>The repo, read in priority order: initiative page → strategy + current quarter → related PRDs → customer research, calls and feature requests → `business-info.md` → `segmentation-matrix.md` (account count + ARR of the target segment) → analytics investigations → competitive research → the product code via `/code-qa` → stakeholders<br>Your answers to **only** the questions the repo couldn't answer |
| **What it outputs** | The PRD at `product-development/product/PRDs/{area}/{slug}-prd.md` — one file per feature, forever (the stage lives in the Meta table, never in the filename)<br>`[GAP: what's missing — how to close it]` markers inside the sections they weaken<br>First run: the initiative page, plus a proposed `feature-index.yaml` entry (you confirm before it's applied)<br>Artifacts written by the research closers that ran this run<br>A **readiness readout**: what moved · what's backed (with paths) · what's still assumed · what only you can do · what's waiting on someone else |
| **Not for** | Challenging a finished draft (`/prd-challenge` — deliberately never auto-run), cutting the agreed PRD into jobs (`/jobs-breakdown`), or making tickets (`/create-tickets`). |

### How it works, step by step

| Step | What happens |
|------|--------------|
| 1 — Read the state | Walks the ten sources above in priority order. If `business-info.md` is still full of `[Your ...]` placeholders it says so and offers to fill it first — then proceeds either way. |
| 2 — Ask only what's missing | Opens with what it already has, then asks only the remaining questions. An unanswered question becomes a `[GAP:]`, never a blocker. |
| 3 — Draft or update | Re-reads the installed PRD template fresh (that file, not this skill, owns section order, meta fields, table shapes and voice), then routes the evidence into it: problem-side, value-side, solution-side, proof-side. Anything with no evidence gets a `[GAP:]` instead of an invented number. |
| 4 — Register the work | First run only: proposes the feature-index entry (you confirm) and creates the initiative page. Later runs keep the page current — artifact rows filled, one dated activity line per run. |
| 5 — Close what you can | Runs the research that can close a gap **in the same run** — parallel subagents, each executing its own skill end to end and writing its own artifact. Bounded and source-gated (see Options). You confirm results, not permission. |
| 6 — The readiness readout | Reads the four lenses — desirability, viability, feasibility, usability — against the evidence actually attached, and closes with the readout. Every run ends here. |

### Options

**Commands and flags**

1. `/prd-draft` — start from scratch with guided questions
2. `/prd-draft [paste your idea]` — first run; questions you already answered are skipped
3. `/prd-draft [slug]` — later run: re-read evidence, update, close what's closable, report what moved
4. `/prd-draft [slug] --draft-only` — fast text-only pass, skips the auto-research
5. `/prd-draft --ai` — adds the AI behavior contract (example inputs, edge cases, never-do)

**The six required questions** (any left unanswered becomes a `[GAP:]`)

1. Problem and segment — what pain, and who exactly feels it
2. Frequency and criticality — how often it bites, what it costs
3. Today's alternative — what they do now; this is what the solution must beat
4. Hypothesis — if we build X, then Y moves by Z, because [behavior assumption]
5. Strategy fit and lever — at most **two** business levers (acquisition / activation / retention / expansion-LTV / cost to serve)
6. Stage — Team Kickoff → Planning Review → XFN Kickoff → Solution Review → Launch Readiness → Impact Review

**Auto-research closers** — max **3 per run**, riskiest gaps first, and only when the source exists

- Feasibility gap → `/code-qa` (needs a reachable repo in `code-repos.yaml`)
- Missing baseline → `/retention-analysis` · `/activation-analysis` · `/expansion-strategy` (needs warehouse access or stored baselines)
- Lever with no money number → `/impact-sizing` (needs the baseline + a filled segmentation matrix)
- Unverified competitor claim → `/competitor-analysis`
- **Never auto-run:** `/prd-challenge`, anything human-facing (`/interview-guide`), anything outbound (`/slack-message`, `/create-tickets`)

---

## 3) `/prd-challenge` — every critique lens at once

### At a glance

| Field | Detail |
|-------|--------|
| **Purpose** | One command, every critique lens, one coherent result. You never have to know which of four review skills to run — this runs them all independently and merges what comes back, leading with the ranked unverified assumptions. |
| **When used** | Whenever you want the full critique of a PRD. Natural moments: the gap count has dropped materially, or a stage milestone is coming. A thin PRD is a legitimate target — the report is simply short and assumption-heavy. Always your call; `/prd-draft` suggests it but never fires it. |
| **Data it takes in** | A PRD slug or path (or nothing — it lists PRDs touched in the last 30 days and asks)<br>The full PRD text, including which sections are `[GAP:]`-only — the document's own content decides the depth<br>The initiative page, for what evidence is already attached |
| **What it outputs** | One dated report at `PRDs/{area}/reviews/{slug}-challenge-{YYYY-MM-DD}.md` — never overwritten, so successive reports show the bet getting stronger. It contains: a one-line verdict · the ranked unverified-assumption table (impact, confidence, next step, owner) · what holds up · contradictions between lenses · what couldn't be assessed · per-lens detail<br>Each skill lens also writes its own artifact (assumption map, red-team, pre-mortem)<br>The PRD's Open Questions and the initiative page's Open loops, updated with owners<br>A gated proposal to add the report to the feature index |
| **Not for** | A bare idea with no document (`/assumption-map`), a strategy or decision doc (`/red-team`), a job spec (`/job-spec-challenge`), re-gating a breakdown (re-run `/jobs-breakdown`), or the launch verdict (`/feature-launch-gate`). |

### How it works, step by step

| Step | What happens |
|------|--------------|
| 1 — Pick and read the PRD | Finds it, reads it fully, notes the stage, which sections exist and which are `[GAP:]`-only. Breakdown and job-spec files are excluded — they aren't PRDs. |
| 2 — Decide the lens set | All four lens groups by default. The pre-mortem is dropped when there's no ship-shaped Solution and Rollout to rehearse — with the reason stated in the report. |
| 3 — Spawn every lens in parallel | One message, many subagents, **blind to each other** — no lens sees another's output before synthesis, so the first reviewer's framing can't anchor the rest. Skill lenses execute the real skill end to end; persona lenses read their reviewer file first. |
| 4 — Synthesise | Deduplicates across lenses (keeping every attribution) → ranks the unverified assumptions by *how much breaks if wrong* × *how little we know*, capped at ~10 → surfaces contradictions instead of averaging them → credits what holds up → names what couldn't be assessed. |
| 5 — Write the report | Saves the dated report. Every "next step" is a concrete act — a named skill run, a query, N interviews with a named audience, an engineering spike — tagged **Agent** (runnable now), **You**, or a role. Never "do more research." |
| 6 — Flow the results back | Ranked rows land in the PRD's Open Questions; the initiative page gets its artifact rows, a dated activity line, and top next steps as open loops; the feature-index addition is proposed for confirmation. |

### Options

**Commands**

1. `/prd-challenge` — challenge the most recent PRD (confirms first)
2. `/prd-challenge [slug or path]` — challenge a specific PRD
3. `/prd-challenge --lenses "map,attack,personas,premortem"` — run a subset; the report names what was skipped and why

**The four lens groups**

- **Assumptions** — `/assumption-map`, always. Feature mode by default; initiative mode for a new-product bet (adds ethics, GTM, team & org)
- **Attack** — `/red-team`, always. Steelmanned kill-assumption contracts: fails-if, evidence this week, kill criterion, cheapest test
- **Four risks** — seven reviewer personas, always
- **Failure rehearsal** — `/pre-mortem`, only when Solution and Rollout exist and aren't `[GAP:]`-only

**The seven persona seats**

| Seat | Risk it owns | Seat | Risk it owns |
|------|--------------|------|--------------|
| Engineering | Feasibility | UX Research | Value — evidence quality |
| Design | Usability | Customer Voice | Value — first person "I" |
| Executive | Viability — business | Skeptic | General doubt |
| Legal | Viability — compliance | | |

---

## 4) `/jobs-breakdown` — the cut

### At a glance

| Field | Detail |
|-------|--------|
| **Purpose** | Cut an agreed initiative into independently shippable jobs — each one valuable on its own, end-to-end, and small enough to build and test alone — then sequence them riskiest-assumption-first. The cut decides what gets de-risked first. |
| **When used** | After the PRD is agreed, ideally once it has survived `/prd-challenge`. Re-run any time to fold in new evidence and job-spec statuses — the job table is a live status board. A rough idea with no PRD → run `/prd-draft` first; this skill cuts an agreed bet, it doesn't define one. |
| **Data it takes in** | An initiative slug or a PRD path<br>The PRD (its solution section is the seam; scope boundary and non-goals feed the coverage check)<br>The initiative page · the challenge reviews (ranked assumptions drive sequencing) · customer research (the actors and variations that exist in reality) · `platform-model.md` (permissions, fixed enums, compliance domains) · `tech-constraints.md` (limits and the do-not-re-implement registry) · the code via `/code-qa` (decides Integration vs Net new) · segmentation and portfolio data (reach) · sibling breakdowns (shared objects) |
| **What it outputs** | The living breakdown at `PRDs/{area}/{initiative-slug}-jobs-breakdown.md` — backbone, a gated and sequenced job table with per-row rationale, cross-job open decisions with owners, and a coverage check proving every PRD scope item landed in a job or is explicitly out<br>A gated proposal adding the `jobs-breakdown:` key to the feature-index entry<br>The initiative page's artifact row and a dated activity line<br>A compact readout naming the next job to spec |
| **Not for** | Writing the per-job contract (`/job-spec-draft` — next, one job at a time), drafting the PRD (`/prd-draft`), or cutting dev tickets (`/create-tickets` — later, from an agreed job spec). |

### How it works, step by step

| Step | What happens |
|------|--------------|
| 1 — Read the state | Walks the nine sources above. If `platform-model.md` or `tech-constraints.md` is still `[TBD]`, it proceeds but carries that as an owned gap row — never a silent skip. |
| 2 — Rebuild the backbone | Lays the initiative out as its end-to-end story before cutting anything: activities left to right as users live them, every actor named (including out-of-scope ones), core objects listed — built from evidence, not imagination. The backbone is the seam: a cut that doesn't traverse it is a component, not a job. |
| 3 — Cut candidates | Walking-skeleton-first — the first job is the thinnest path across the *whole* backbone with the loop closed. Then widen: by actor, by capability, by depth. Each candidate is checked for variations (a variation whose backbone differs end-to-end becomes its own job) and typed. |
| 4 — Gate every candidate | Each candidate runs the four pressure tests (outcome-changing · standalone-shippable · vertical · scope-sane), the false-thin-slice trap, and INVEST. A failure gets re-cut — never shipped into the table as "we'll fix it in the job spec". |
| 5 — Sequence with reasons | Riskiest assumption first: the job that tests the most dangerous unknown ships first, usually the skeleton. Every priority states its reason in dependency or risk language, never a bare Must/Should. Jobs that can run in parallel once their dependency is live are noted. |
| 6 — Write, register, read out | Writes per the installed template (including the coverage check and quality gate), proposes the feature-index key, updates the initiative page, and prints the readout. Later runs lead with what moved: statuses advanced, jobs re-gated, cuts that changed and why. |

### Options

**Commands**

1. `/jobs-breakdown [slug]` — first run: rebuild the backbone, cut and gate the jobs, sequence them
2. `/jobs-breakdown [slug]` — later run: fold new evidence and job-spec statuses, re-gate what changed
3. `/jobs-breakdown [PRD path]` — the same, pointed straight at a PRD file

**Job Type** — set from what the code actually shows, not from hope

- **Integration** — existing components surfaced or connected; feasibility verification is the critical path
- **Net new** — new objects or flows; earns a full-depth job spec
- **Enhancement** — existing behavior changed

**Priority** — Must · Should · Could · Won't-now, each with its dependency or risk reason

**Job status ladder** — `not-drafted → drafted → agreed → handed-off`

**Variation dispositions** — nuance and branch stay inside a job; a **different job** (backbone differs end-to-end) is cut as its own job, never buried as a footnote

---

## 5) `/job-spec-draft` — the buildable contract

### At a glance

| Field | Detail |
|-------|--------|
| **Purpose** | Write the buildable contract for **one** job — the level between the PRD and tickets. It describes what a user must be able to do and why: clear enough that the build can't get it wrong, open enough that design and engineering find the best way. Proportionate by design (an Integration job is 2–3 pages; a risky net-new stateful one earns full depth). |
| **When used** | After the breakdown, one job at a time, riskiest first. Also the only way accepted `/job-spec-challenge` verdicts get folded back in — this skill is the spec file's single writer. |
| **Data it takes in** | A job from the breakdown (`J-2`, or initiative + job name), or an ad-hoc job description<br>The breakdown row (type, riskiest assumption, dependencies) · the PRD and initiative page · sibling job specs (shared objects and states) · `platform-model.md` · `tech-constraints.md` · customer research (the job in users' own words, variation signals) · segmentation + portfolio (reach denominators) · analytics baselines · an existing prototype (**a hypothesis, not a requirement** — its UI is never copied in) · prior reviews |
| **What it outputs** | The living contract at `PRDs/{area}/{initiative-slug}-{job-slug}-job-spec.md` — variations dispositioned, capabilities swept complete with state maps, rules with testable acceptance criteria, grounded scope priorities<br>A readout led by **decisions only you can make**, plus what moved, backed vs still-assumed, research rows with methods, and the engineering-confirmations list<br>The breakdown's job row status bumped and the spec linked; initiative page row + dated activity line; a gated feature-index proposal |
| **Not for** | The initiative-level PRD (`/prd-draft`), the cut itself (`/jobs-breakdown` — runs first), challenging the draft (`/job-spec-challenge`), tickets (`/create-tickets` — after the spec is agreed), or visualising the solution (`/prototype` — a job spec is its natural input). |

### How it works, step by step

| Step | What happens |
|------|--------------|
| 1 — Assemble context | Reads the ten sources above. Only questions that block the job's definition — its object, its actors, its loop — are asked; everything else drafts with a `[GAP:]`. |
| 2 — Classify the job | Type (Integration / Net new / Enhancement) and risk level (does it touch money, privacy, compliance, or an irreversible action?). Both modulate everything downstream: depth, which sections trigger, how hard feasibility is pushed. |
| 3 — Walk the spine | First pass, top-down: root cause → outcome → job story → the slice (riskiest assumption, backbone, what it covers, preconditions) → object and fields → capabilities and flow per actor. |
| 4 — Variation scan (mandatory) | Self-interrogates along company / user / situation dimensions. Every hit is classified — not material · nuance · branch · different job — and the verdict is written into the spec. Silence is not an option. |
| 5 — The sweep battery | Four (or five) subagents run in parallel and blind, hunting what authors miss. Findings come back to the skill; only it writes. For an Integration job the four may run as one combined pass, stated in the readout. |
| 6 — Feasibility and constraints | When a reachable repo covers the area, `/code-qa` verifies the assumed components, endpoints, limits and integration seams, and the draft is matched against `tech-constraints.md`. **No code access → an explicit TODO in the spec**, never a silent skip. Everything Engineering must confirm before scope commits is listed. |
| 7 — Prioritize and scope | Each variation and candidate requirement is scored on sourced Reach · Frequency · Severity, with compliance / money / privacy / irreversibility auto-Must. Effort is deliberately **not** scored — that's Engineering's number. Unevidenced reach or frequency makes the tier *provisional* plus a research row. |
| 8 — Route the research | Every open question and provisional priority gets a row: best method → route. Up to three bounded, source-gated closers run in the same pass; anything human-facing or outbound is only suggested. |
| 9 — Synthesize and gate | Writes per the installed template, proportionate — conditional sections only when triggered, state diagrams only for stateful objects — then runs the template's quality gate and fixes failures before presenting. |
| 10 — The readout | Ends with decisions only you can make, what moved, backed vs assumed, research needed, engineering must confirm, variation dispositions, and the next step. |

### Options

**Commands and flags**

1. `/job-spec-draft [initiative] J-2` — draft or update the contract for that job
2. `/job-spec-draft [job description]` — ad-hoc: classify, scan, sweep, draft; flags the missing breakdown
3. `/job-spec-draft [...] --market` — adds the competitor-capability sweep (evidence, never UI)

**The sweeps** (parallel, blind to each other)

- **S1 Capabilities & states** — missing lifecycle verbs, the inverse of every action, unreachable or no-exit states, multiplicity, zero-one-many
- **S2 Actors & permissions** — persona × action holes, out-of-scope personas, self-access, delegation and absence, permission carriers
- **S3 Situations & exceptions** — per step, "the worst realistic thing instead": actors, timing, data, interruptions
- **S4 Cross-cutting** — the nine cross-cutting dimensions, every row answered or deferred with its risk
- **S5 Market** — `--market` only: competitor capability sets for this job, as evidence, never UI

**Evidence labels on every load-bearing claim** — `[Evidenced]` (source named) · `[Partial]` (signal, not proof) · `[Hypothesis — needs validation]`

**The constraint line** — run on every specific-looking detail: *if the build changed this, where would the problem show up?*

1. Caught in design review as look-and-feel → it's a **solution**: relocate it to the capability it serves, or free it up
2. Surfaces after launch as a legal / money / data failure → it's a **constraint**: keep it as a rule plus its reason
3. Rare third outcome — a **Commit**: the team genuinely agreed there's one viable path; keep it stamped (capability served · why the only path · agreed by · date)

**Priority tiers** — Must · Should · Could · Won't-now (auto-Must for compliance, money, privacy, irreversibility)

---

## 6) `/job-spec-challenge` — independent judgment on the contract

### At a glance

| Field | Detail |
|-------|--------|
| **Purpose** | The judged checkpoint on a drafted job spec, by reviewers who did not write it: mechanical sweeps plus the three-amigos panel, run in parallel and blind, merged into one report with a readiness verdict for tickets. |
| **When used** | When a drafted spec has stabilised — sweeps folded, gap count low — and before its breakdown status moves to *agreed* or tickets are cut. A thin spec is a legitimate target; the report is simply short and gap-heavy. `/job-spec-draft` suggests it and never auto-runs it. |
| **Data it takes in** | A job spec path, or initiative + `J-N` (nothing → it lists recent specs and asks)<br>The full spec text, plus its type and risk flags (which gate the conditional seats)<br>The breakdown row — the cut-fidelity baseline · the PRD and initiative page · `platform-model.md` · `tech-constraints.md` · sibling job specs · prior reviews of this spec |
| **What it outputs** | One deduplicated report at `PRDs/{area}/reviews/{initiative-slug}-{job-slug}-job-spec-challenge-{YYYY-MM-DD}.md`, containing: the readiness verdict (ready for `/create-tickets` · ready after these fixes · not ready, and why) · decisions only you can make, pinned first · blocking findings ranked by what breaks downstream · the relocation table · gaps · unverified claims with next steps · bet-level escalations · contradictions · what holds up · what couldn't be assessed<br>A dated activity line on the initiative page and a gated feature-index proposal<br>**The job spec itself, untouched** |
| **Not for** | A PRD (`/prd-challenge`), re-gating the cut (`/jobs-breakdown`), fixing the spec (`/job-spec-draft` — the rewrite happens on your yes, through it), or the launch verdict (`/feature-launch-gate`). |

### How it works, step by step

| Step | What happens |
|------|--------------|
| 1 — Pick and read the spec | Reads it, assembles the context above, notes type and risk flags. Pointed at a breakdown instead → that's the cut, not a contract, and re-gating belongs to `/jobs-breakdown`. |
| 2 — Decide the lens set | Sweeps S1–S4 and the three seats by default; conditional seats join on their trigger; every skipped lens is named with its reason. |
| 3 — The orchestrator's own pre-pass | Before spawning anything: runs the constraint line on every solution-shaped line (producing relocation candidates), fills in variation verdicts if the spec's section is thin, and checks **cut fidelity** — does what's actually in scope exercise the assumption this job was cut to test? |
| 4 — Spawn every lens in parallel | One message, many subagents, blind to each other. Personas get the spec and context paths only — blind to the pre-pass. Feasibility runs in the same batch when code access exists; otherwise the report header carries an explicit TODO. |
| 5 — Synthesise | Deduplicates with attribution → ranks blocking findings by *what breaks downstream* × *how little we know*, capped at ~10 → builds the relocation table so no flagged line vanishes silently → harvests every `[Hypothesis]`, `[Partial]` and provisional tier as unverified claims → surfaces contradictions → credits what holds up and names what couldn't be assessed. |
| 6 — Write the report | Saves it dated, one per run, never overwritten. |
| 7 — Flow the results back | Initiative activity line · gated feature-index proposal · different-job flags offered to `/jobs-breakdown` · bet-level findings routed to `/prd-challenge` · and the rewrite **offered**, applied only on your yes and only through `/job-spec-draft`. |

### Options

**Commands and flags**

1. `/job-spec-challenge` — challenge the most recent job spec (confirms first)
2. `/job-spec-challenge [path | initiative J-N]` — challenge a specific spec
3. `/job-spec-challenge [...] --lenses "sweeps,po-ba"` — subset; add `skeptic` here to seat general doubt
4. `/job-spec-challenge [...] --market` — adds the S5 competitor-capability sweep

**The seats**

| Seat | Runs | Owns | Focus |
|------|------|------|-------|
| PO/BA | Always | Ticket-readiness | Rules unambiguous · ACs testable and traceable · scope cuttable · owners and asks actionable |
| QA Lead | Always | Testability | Falsifiable ACs · exception rows assertable · states reachable in a test environment · NFRs measurable |
| Eng Lead | Always | Feasibility | Seams real · confirmations complete and answerable · atomicity and migration questions present · hidden complexity (flags missing effort ranges, never produces the numbers) |
| Legal | Money / privacy / compliance / irreversibility | Compliance | The flagged risk domains only |
| Designer | Net-new user-facing surface | Solution-openness | Is the contract open enough for design; are flows and states complete — never asks the spec to add UI |
| Skeptic | Opt-in via `--lenses` | General doubt | Job altitude only: the slice, the tiers, the evidence labels — not the bet |

Plus sweeps **S1–S4** always (S5 on `--market`), reading the same lens files `/job-spec-draft` uses — one source of truth for author-time and challenge-time sweeps.

**Relocation verdicts** — every flagged line gets exactly one, and none disappears silently

1. **Relocate** to the capability it serves
2. **Constraint** — keep it, as a rule plus its reason
3. **Commit** — keep it, stamped
4. **Free up** — drop the constraint, with the why recorded
5. **Gap flag** — nothing to decide yet; it's missing information

**What it deliberately does not re-run** (those lenses belong to the bet level, stage 4)

- `/assumption-map` → the spec is its own inventory; synthesis harvests every unverified label instead
- `/red-team` → replaced by named job-level checks: the constraint line, the false-thin-slice test, tier grounding, cut fidelity
- `/pre-mortem` → S3 is the micro-pre-mortem at job granularity; launch failure is rehearsed once per initiative
- Anything found *above* job altitude is escalated to `/prd-challenge` or `/red-team` — never silently dropped

---

## Two things worth remembering across all six

1. **The template owns the format.** Skills stay universal; `/customize-os` installs the house structure into `handbook/templates/`, and every drafting skill reads it fresh each run. A house format is one template swap per instance — never a skill fork.
2. **One writer per file.** `/prd-draft` owns the PRD, `/jobs-breakdown` owns the breakdown, `/job-spec-draft` owns the job spec. The two challenge skills report and never edit — their accepted verdicts are folded back by the owning writer, on your yes.
