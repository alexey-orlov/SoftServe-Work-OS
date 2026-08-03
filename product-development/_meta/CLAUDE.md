# _meta — machine surfaces of the wiki

Ledger, write policy, health reports, and pending proposals. Written by the governance
machinery (`/context-update`, `/wiki-lint`, hooks) — not a place for content.

**Read this when:** You need to know what has already been folded, what is protected, or
how healthy the repo is.

## Contents

### Files

- [write-policy.yaml](write-policy.yaml) — Which paths agents change freely (auto), which need in-session confirmation (confirm), which only the steward touches (admin). The single traceable registry of protected context.
- [processed.txt](processed.txt) — The ingestion ledger: one repo-root-relative path per line, kept sorted. A path here = already folded by `/context-update` (junk and duplicates are ledgered too). Merge conflicts: keep both sides, then `sort -u`. Written only by ingest skills.

### Subfolders

- [health/](health/) — Dated `/wiki-lint` reports. Written only by wiki-lint.
- [proposals/](proposals/) — Pending Tier-2 change proposals from headless runs (a scheduled job may not edit confirm-tier files; it files the proposed diff here instead). Surfaced by the session-start hook; delete a proposal after applying or rejecting it.
