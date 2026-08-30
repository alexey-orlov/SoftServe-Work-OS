# Transcripts — the central raw archive

Customer-facing raw transcripts — interviews AND customer calls — in one flat home:
`{YYYY-MM-DD}-{account}-{type}.md` (type: `interview` | `call`). Every file carries tag
frontmatter (`date`, `type`, `customers`, `areas`, `features`, `initiatives`, `themes`)
per `governance/link-schema.yaml` — the tags are what make one conversation findable
from every module it touched. Bodies are immutable; tags are filing metadata, corrected
only via `/retag-transcript` (each change logged in `tag-amendments:`). Summaries stay
with their owners: call summaries in `customers/accounts/{slug}/calls/summaries/`,
interview session reports one level up (`../{date}-interview-insights.md`) — read those
first; come here only when the summary falls short. Internal meeting and retro
transcripts are operational records and stay under `product/meetings/`.

**Read this when:** The summary isn't enough and you need the verbatim conversation, or
you're querying by tag (customer, area, feature, initiative).

## Contents

### Files

- [2026-07-30-acme-example-interview.md](2026-07-30-acme-example-interview.md) — EXAMPLE (synthetic) — Acme discovery interview, 32 min: Monday export rebuild, silent credit depletion

## Writers

`/process-meeting` (interview and customer-call categories) files transcripts here with
their tags proposed from content; `/user-research-synthesis` when handed raw transcripts
directly; `/retag-transcript` corrects tags. Transcripts are the faithful record — raw
names may appear here; the roles-only PII rule applies to the summary layer, never
retroactively to transcripts.
