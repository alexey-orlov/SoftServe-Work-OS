# Translating vague feedback

Reviewers describe symptoms, not causes. "Feels cluttered" is a real observation
about a real problem, but it names the sensation rather than the property that
produced it. The job is to find the candidate causes, check which one is actually
present in the file, and propose that specific change - not to ask "what do you
mean?" and hand the diagnostic work back.

Use this the way a diagnosis works: the phrase narrows the search, the file tells
you which candidate is true. If two or more candidates are equally present, that is
the point at which to ask, with both options named.

## Common phrases and what to check

**"Feels cluttered" / "too busy" / "cramped"**
Spacing scale used inconsistently between sibling elements; padding one step below
the design system's default for that component; too many competing accent colors;
borders where whitespace would separate adequately; data density higher than the
Figma frame shows. Check the actual token steps in use before adding space
everywhere - the usual cause is two adjacent components using different steps.

**"Feels empty" / "lots of dead space"**
Container max-width wider than the design system's content measure; a grid holding
fewer items than it was designed for; realistic data thinner than production; a
layout built for a larger breakpoint than the one being viewed.

**"Doesn't pop" / "needs more punch" / "flat"**
No clear single primary action on the screen; the primary action styled with the
same weight as secondary ones; type scale compressed so headings barely differ from
body; no elevation token applied where the design system uses one; accent color used
so often it stops reading as emphasis.

**"Feels heavy" / "dense" / "aggressive"**
Type weights above the design system's body and heading defaults; large filled
surfaces where the system specifies subtle ones; borders on every element; radius
smaller than the system default, which reads harder than intended.

**"Hard to scan" / "I don't know where to look"**
No visual hierarchy in headings; table columns not aligned by data type - numbers
should be right-aligned; row separation missing; the most important column not
first; important status not carrying the semantic color tokens.

**"Off brand" / "doesn't look like us"**
Run the token audit first. This phrase is very often literal token drift rather
than a matter of taste, and the audit answers it in seconds. If the audit is clean,
the likely causes are a substituted font, missing elevation, or radius and border
treatments that diverge from the system defaults.

**"Confusing" / "I wouldn't know what to do"**
Missing or unclear primary action; labels that describe the system rather than the
user's task; no empty state, so a first-time view looks broken; validation that
appears without saying how to fix the problem; a flow step with no visible way back.

**"Not what I asked for"**
Stop diagnosing. Re-read the original brief and the Figma node, and ask which part
diverged. This phrase usually signals a misunderstanding earlier in the chain than
anything CSS can fix, and guessing at it burns the reviewer's patience.

## Phrases that are not actually vague

Some feedback sounds soft but is fully specific, and treating it as ambiguous is its
own kind of failure - it reads as stalling.

- "Can we try the wider layout?" - specific, if the design system defines layout widths.
- "This should match the settings page." - specific, go look at the settings page.
- "Same as last time." - specific, check the prototype's `{slug}-feedback-log.md`.
- "Use the new green." - specific if the design system has one green named new; a
  system gap question if it does not.

## How to propose

Name the property, the token, and the expected effect, then ask for confirmation in
the same breath. A reviewer can approve a proposal in three words, whereas an open
question costs them the effort of doing the diagnosis you skipped.

Good: "The cards use `--space-3` but the sections around them use `--space-5`, which
is probably what reads as cramped. I'd move the cards to `--space-5` so the rhythm
matches. Sound right?"

Weak: "Could you clarify what you'd like changed about the spacing?"
