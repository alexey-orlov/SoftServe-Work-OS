# Accounts

One subfolder per customer account, slugified.

**Read this when:** You are looking up a specific account.

## Contents

### Files

- [portfolio.yaml](portfolio.yaml) — Account health registry (status, ARR, renewal, risks, expansion signals, and segment fields — vertical, size band, use cases — per account); read by `/portfolio-pulse`, updated by `/process-meeting` and `/context-update`, rolled up into `strategy/business-context/segmentation-matrix.md`. Ships with one synthetic `acme-example` entry
- [acme-example/](acme-example/) — EXAMPLE (synthetic) — E-commerce corp, lead-enrichment; healthy; last call 2026-07-30

_Add a one-line entry here for every account folder you add._
