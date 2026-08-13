# Sweep S1 — Capabilities & states

The most common weakness in a real brief isn't a hidden solution — it's a **missing capability**: the author writes the one verb they pictured and leaves out the verbs that make the thing usable. If the brief never names them, someone else decides them by accident. Walk four passes over **every object the feature names**, then the content-language check.

## Pass 1 — Lifecycle + domain verbs

Can the user *create* it, *see* it, *change/correct* it, *remove* it? Then the domain verbs this object family needs: submit, withdraw, cancel, duplicate, resubmit, archive, reassign, export. Authors reliably write `create` and forget `edit` / `delete`.

## Pass 2 — The inverse of every action

For every action, what undoes it? submit ↔ withdraw · approve ↔ reverse/reopen · send ↔ recall · deny ↔ resubmit/appeal · publish ↔ unpublish · close ↔ reopen. **This is where most missing capabilities hide** — a flow that only goes forward isn't a workflow; people err and need a way back. A deliberately one-way action is a finding too: name it and say *why* it's irreversible (that "why" is usually a constraint, and irreversibility auto-escalates priority — see prioritization.md).

## Pass 3 — The state map

List every state the object can be in. For each: who moves it, to which next state, under what condition. **A state nothing reaches, or a state with no exit, is a missing requirement** — surface it. Cross-check against the draft's scope: a status enum naming states the feature never exercises is the false-thin-slice tell (report it; the fix belongs to the breakdown). The product of this pass is §6's state diagram — simple, one per stateful object.

## Pass 4 — Multiplicity & scope

- One or many: does anyone act on a batch? What happens at 0, 1, and many (Zero-One-Many — empty state, singular case, pagination/volume)?
- Mine vs others': whose objects can each persona see and touch? (Feeds S2's matrix.)
- Duplicates: can two of these exist for the same context, and is that valid or an error?

## Content-language check

Every field where one user enters content that *another* user will read (names, labels, descriptions, titles shown to an approver or teammate) — check `platform-model.md` §6: if the product carries a multi-language obligation, each such field is a constraint (accepts a value per obligated language), not copy detail. Invisible in a single-language prototype; the brief is where it gets caught.

## Return format

Findings only, each with a proposed disposition: **in-feature** (the capability/rule/AC/state row to add) · **deferred** (risk + which feature picks it up) · **open question** (owner) · **constraint** (rule + why). Don't stop at three findings — a real object often needs six to ten capabilities; complete beats short. Nothing to report → say "nothing to assess" for the passes that came back clean.
