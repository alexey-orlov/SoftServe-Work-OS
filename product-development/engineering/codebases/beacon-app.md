# Codebase Map — beacon-app

> Synthetic worked example for the fictional product Beacon. Replace with a real map via `/connect-code`.

**Repo:** beacon-app@4f2a9c1d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a39 (main) · **Generated:** 2026-08-05 by `/connect-code`
**Routing hint only — never cite this file as evidence. Cite code lines at the clone's current HEAD.**

## Top-level layout

| Path | What lives there |
|------|------------------|
| `apps/web/` | Customer-facing Next.js app — dashboard pages, auth, settings |
| `services/billing-worker/` | Node worker — consumes Stripe webhooks + burn-service events, maintains `org_balances`, folds hourly rollups |
| `services/billing-worker/migrations/` | App Postgres schema (balances, rollups) |
| `packages/shared/` | Shared types, feature-flag definitions, API client |
| `packages/ui/` | Design-system components |
| `infra/` | Deploy config — where entry points and schedules are actually wired |

## Entry points

- Web routes: `apps/web/app/` — App Router, one folder per page
- Billing worker main: `services/billing-worker/src/index.ts`
- Flag definitions: `packages/shared/flags.ts`
- Scheduled jobs (incl. the nightly balance reconciliation): `infra/schedules.yaml`

## Key flows

1. **Credit burn → balance:** burn-service event → `services/billing-worker/src/consumers/` → `org_balances` (transactional) + `org_credit_rollups_hourly` (90-day retention).
2. **Dashboard read:** `apps/web/app/(dashboard)/usage/` → single-row `org_balances` lookup — never the warehouse.

## Not covered

Mobile app (separate, unregistered repo) · `infra/` internals beyond schedules · test fixtures.
