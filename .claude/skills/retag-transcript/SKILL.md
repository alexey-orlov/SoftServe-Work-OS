---
name: retag-transcript
description: Correct or amend the tag frontmatter (customers, areas, features, initiatives, themes, type) on a filed transcript — the only sanctioned edit path for raw-material filing metadata. Appends every change to the transcript's tag-amendments log, never touches the body, keeps initiative-page Activity backlinks in step when initiative tags change, and updates the ingestion ledger when a file is renamed. Use on /retag-transcript, "retag this transcript", "this call was actually about X too", "wrong customer on this interview". NOT for editing transcript content (immutable raw material), summaries (their writers own them — /process-meeting), or filing new transcripts (/process-meeting).
group: communication-ops
---

# Retag Transcript

Transcript bodies are immutable raw material; their frontmatter tags are *filing
metadata* — the one part that may be corrected after filing, and only through this
skill (the carve-out is written into `governance/write-back-contract.md` and
`governance/link-schema.yaml#types.transcript`).

## Flow

1. **Locate** the transcript (path, or find by date/customer in
   `product-development/product/user-insights/transcripts/`). Read its current
   frontmatter.
2. **Propose the diff** — current tags vs corrected tags, one line per change,
   with the reason. Wait for the user's yes (tags steer every future query;
   corrections are deliberate).
3. **Apply**: update the frontmatter keys AND append one line to
   `tag-amendments:` in the same edit:
   `- YYYY-MM-DD — {key}: {old} → {new} ({reason})`
   Never touch anything below the closing `---`.
4. **Keep joins in step** (write-back-contract rule 8):
   - Initiative added → append a dated Activity line on that initiative's page
     linking the transcript's summary (or the transcript itself when no summary
     exists).
   - Initiative removed → leave existing Activity lines in place (history), note
     the removal in the amendment reason.
5. **Ledger**: if the correction includes a filename fix (wrong date/account in
   the name), update the matching `governance/processed.txt` line in the same
   change.

## Self-check

- Body untouched below the frontmatter fence.
- Every changed key has a `tag-amendments:` line with a date and reason.
- Every slug written resolves per `governance/link-schema.yaml` (unknown slug →
  stop and ask, or route to the catalog/initiative creation flow first).
- Initiative additions carry their Activity backlink in the same change.
