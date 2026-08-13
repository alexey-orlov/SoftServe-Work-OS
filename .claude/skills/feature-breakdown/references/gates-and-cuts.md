# Gates and cut lines — the checklists behind /feature-breakdown Steps 3–4

Loaded by `/feature-breakdown` when gating candidates or re-cutting a failed one. Every gate is a question to answer honestly, not a box to tick.

## The four pressure tests (every candidate passes all four)

1. **Outcome-changing** — does shipping this alone change what someone *does*? Name the behavior change. A feature whose only outcome is "enables F-next" is a component wearing a feature's name — merge it into the feature it enables.
2. **Standalone-shippable** — if the initiative were killed the day after this shipped, would a real group of users keep getting value from it? "Releasable with no core issues" is the bar: a feature no assistive-tech user can operate or that silently drops a handoff notification isn't standalone-shippable, however complete its happy path.
3. **Vertical** — does it traverse the backbone end-to-end (thin at every station), or does it perfect one station? Four polished screens for one actor that never reach the next actor = horizontal slice, re-cut it.
4. **Scope-sane** — is the size defensible against the riskiest assumption it tests? "Everything for everyone" is the smell; ask the appetite question: *is the width worth the time it costs, or is one end-to-end path the real job here?* Width is right only when width itself is the riskiest assumption (e.g. "can the data model hold all 12 categories?").

## The false-thin-slice trap

A candidate scoped to *just the first step* ("user submits — the decision comes in a later feature") *feels* thin but never reaches an outcome, so it can't prove the loop holds. Thin means **narrow AND end-to-end**, not "the front half, done thoroughly." Tell: a status enum naming states the slice never exercises (`Approved` / `Paid` with no approval or payment in scope).

**New-object conversion:** when a feature introduces a *new* object that converts into an *existing* one, the conversion boundary is usually the riskiest slice — scope the hand-off (what carries over, what's still missing, the "converted but not yet complete" state), not the new object's whole lifecycle. The flashy part is rarely the risk; the seam into the existing system is.

## INVEST (accept/reject, applied at feature grain)

- **I**ndependent — buildable without waiting on an unfinished sibling (declared dependencies are fine; hidden ones are the failure)
- **N**egotiable — states the need, leaves the how open (a candidate defined by its UI is a prototype spec, not a feature)
- **V**aluable — pressure test 1
- **E**stimable — Engineering could size it after reading the brief; if not, the unknown becomes a spike or an Engineering-confirmation item
- **S**mall — weeks not months; if it can't be told as one job story + a handful of rules, cut again
- **T**estable — its riskiest assumption has an observable confirm/kill signal

## The cut-line menu (when a candidate fails a gate, re-cut along one of these)

Walking skeleton first, always. Then, in rough order of preference:

| Cut line | Cut along… | Example shape |
|----------|-----------|---------------|
| **Paths** | one user path vs the others | happy path first; the exception path becomes F-next |
| **Actors** | one persona's version of the flow | requester's loop first; the approver's richer view later |
| **Data** | one data variation / subset | one region, one record type, one plan tier first |
| **Rules** | relaxed vs full business rules | flat rule first; the per-segment rule matrix later |
| **Interfaces** | one entry surface | in-product first; API/import/mobile later |
| **Operations** | subset of CRUD + domain verbs | create + see first — but run the inverse-action check: a flow with no way back isn't shippable if users can err (deliberate one-way is fine, stated with why) |
| **Simple/complex** | the simple core vs configurability | fixed behavior first; settings later |
| **Spike** | extract the unknowable | when sizing is impossible, cut a time-boxed learning slice and say what question it answers |

Two rules for using the menu: the first cut through any backbone is **Paths (the skeleton)** — the menu widens from there; and every cut names what it *defers* (the coverage check catches silent drops).

## Sequencing inputs (Step 5)

- **Risk:** the challenge report / assumption map ranking — the feature testing the most dangerous unknown goes first.
- **Dependency:** name the concrete surface or data a feature waits on ("F-3 needs F-1's [list surface] live"), and flag any external dependency (endpoint confirmation, migration) as an Engineering-confirmation item for the brief.
- **Reach:** segment sizes from `segmentation-matrix.md` / `portfolio.yaml` break ties between equally risky cuts — sourced numbers, or `[Hypothesis — needs validation]`.
- **Auto-escalation:** a feature closing a compliance, money-correctness, privacy, or irreversibility gap is Must regardless of reach.
