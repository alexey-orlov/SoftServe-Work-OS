# Sweep S3 — Situations & exceptions

The Cockburn walk: take every flow in §6 (per branch, where §5 found branches) and at **each step** ask — *what's the worst realistic thing that could be true instead?* Findings become §11 rows: **situation → what must be true** — never UI ("show a red toast" is design's call; "the submitter learns why it failed" is the requirement).

## Prompts per step — four families

**Actors** (people are the flakiest component):
- The next actor is unavailable: on leave, terminated, role changed, permission revoked mid-flow, never assigned
- The actor and the counter-actor are the same person (self-approval — cross-check S2's verdict)
- The org link the step assumes is broken: no manager set, team empty, account suspended mid-flow

**Timing:**
- Mid-cycle: the action lands during a boundary (period close, cycle rollover, plan change taking effect)
- Retroactive: the action targets a past date, a closed period, an already-processed record
- Expiry: the pending thing outlives its validity (invitation, approval window, token) — what state results?
- Concurrency: two actors act on the same object at once (approve + withdraw racing); the same actor double-submits
- In-flight change: the job (or a permission, or the plan) turns on/off while objects are mid-flow

**Data:**
- Missing / invalid / duplicate at the moment of action (not just at entry)
- Volume: the step at 0 items, 1, and 500 (Zero-One-Many — S1 names the capability, you name the situation)
- Past-dated, future-dated, timezone-boundary values ("today" at 23:30 in another timezone)
- The referenced object is gone: deleted, archived, converted, merged

**Interruptions:**
- The session dies mid-flow — what's saved, what's lost, what does the user find on return?
- The notification/email fails to send — does the state change survive delivery failure? (It usually must; say so)
- The integration/dependency the step leans on is down or slow — blocked, queued, or degraded?
- The action half-completes across systems — the atomic-transaction question; route it to §14, and for money/privacy-touching flows mark the Risks & break points trigger

## Rules

- Every exception row states an **outcome that must hold**, or is explicitly marked open (`?`) with an owner — never left implied.
- Tag rows with the §5 variation they belong to when not universal.
- The list is **a floor, not a ceiling** — expected incomplete; design and QA will find more, and the job spec says so.
- An exception that reveals a missing capability (e.g. "expired invite" implies "re-invite") → hand it to S1's disposition, don't duplicate it.

## Return format

Proposed §11 rows (situation → outcome → variation tag → open?), plus any finding that is really a rule, a §14 engineering question, or a deferral with risk. Clean steps: say which steps came back clean — the walk itself is the evidence.
