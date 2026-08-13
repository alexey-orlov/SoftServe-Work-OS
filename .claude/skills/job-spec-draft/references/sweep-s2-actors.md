# Sweep S2 — Actors & permissions

A job spec written from the happy-path actor's chair. This sweep sits in every other chair. Ground truth for what the system can actually enforce lives in `platform-model.md` §§1–2 and §8 — read them first; unfilled → flag `[GAP: platform model unfilled]` and proceed on stated assumptions.

## The matrix

Build persona × action for every action §6 names — including personas the job is NOT for. Every cell gets a value: can · cannot (and what they see instead: nothing, read-only, an explanation) · not applicable (say why). An empty cell is a finding.

## Checks beyond the matrix

1. **Out-of-scope personas get a defined experience.** "Not for them" still renders something — permission-denied state, absent affordance, or an upgrade path. Silence ships a dead end or a leak.
2. **The permission carrier.** For every persona difference the job spec relies on ("only admins can X"): what system mechanism carries it (platform-model §1–2)? A persona difference with **no carrier** cannot ship — the mechanism becomes a rule the build implements, not an assumption.
3. **Self-access.** Each action against the actor's *own* records: can an approver approve their own request? Can an admin change their own permissions? Can the actor see their own history? Check platform-model §8; an unstated self-access rule around approval or money is a finding, not a default.
4. **Delegation & absence.** Who acts when the designated actor is on leave, terminated, or not set? Does delegated authority expire, and is delegated action attributed to the delegate in the audit trail? (Absence *situations* are S3's; the *capability and permission* to delegate is yours.)
5. **Role-change mid-object.** The actor loses the permission (or leaves) while their objects are mid-flow — who inherits, and can in-flight items be reassigned?
6. **Plan / packaging eligibility.** Which plans include this job? Same persona on a lower plan: absent, visible-but-locked, or limited? (S4 carries the cross-cutting row; you supply the persona-level answer.)
7. **The last-admin rule.** Any action that could remove the last actor able to manage this job (delete the only approver, demote the only admin) — what prevents an unmanageable state?

## Return format

The completed matrix (or the deltas against the draft's), plus findings with dispositions: **in-job** (matrix row / rule naming the carrier) · **deferred** (risk + where) · **open question** (owner — security/platform questions usually land with Engineering or the platform owner) · **constraint** (rule + why — permission scoping is a presumed-constraint domain). Clean checks: say so.
