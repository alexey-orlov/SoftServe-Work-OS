# Category: retro

Retro ceremonies produce a **writeup**, not a transcript/summary pair — the retros folder is
deliberately flat, with raw recordings one level down in `retros/transcripts/`.

## Files

- **Writeup** → `product-development/product/meetings/retros/{YYYY-MM-DD}-retro.md`, built
  from `product-development/product/processes/templates/retrospective-template.md` (copy the
  template's sections — What Went Well / What Could Have Gone Better / What Will We Do
  Differently (action table) / Key Metrics / Shoutouts — don't restate them here). Add
  `**Initiatives touched:** {slug(s) or "-"}` to the header.
- **Transcript** (when the retro was recorded) →
  `product-development/product/meetings/retros/transcripts/{YYYY-MM-DD}-retro.md` + ledger line.
- Nav: writeup line at the END of `retros/CLAUDE.md`; transcript line in
  `retros/transcripts/CLAUDE.md`.

## Lessons extraction (the point of the ceremony)

Each durable **team-process** lesson from "What Will We Do Differently" also lands as one
line appended to `product-development/product/meetings/retros/lessons-learned.md`:

```
- YYYY-MM-DD — lesson (source: [retro](YYYY-MM-DD-retro.md))
```

Scope guard (from that file's header):
- Team-process lessons only → `lessons-learned.md`
- Product learnings → `product-development/product/decisions/` as hindsight notes
- Agent-behavior rules → `.claude/team-learnings.md` is admin tier — propose the line to
  the steward, don't edit

## Action items

The "What Will We Do Differently" table needs an owner + date per row (shared pipeline
rule). Recurring unactioned lessons from previous retros → call them out in the writeup.
