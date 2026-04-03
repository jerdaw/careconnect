---
status: archived
last_updated: 2026-03-24
owner: jer
tags: [planning, archive, v20.0, testing, supabase, ci]
---

# v20.0 DB Integration Test Lane (2026-03-24)

## Summary

The v20 maintenance goal of adding a real DB-backed integration lane is complete. CareConnect now has deterministic local Supabase coverage for the public retrieval boundary and RLS-sensitive policy behavior.

## Completed Scope

- Added a dedicated `npm run test:db` runner for real DB integration tests
- Added a minimal disposable local Supabase profile for the DB lane
- Added deterministic SQL bootstrap and synthetic fixture seed files
- Added serial Vitest coverage for:
  - public list retrieval
  - public detail retrieval
  - export retrieval
  - search retrieval
  - RLS/policy behavior
  - retrieval parsing and JSON/static overlay behavior
- Added a blocking CI job for the DB lane
- Corrected the local `seed.sql` path contract for Supabase config
- Fixed the `vector` extension assumption in `002_v6_prerequisites.sql`

## What This Completion Means

- Real DB-backed retrieval behavior is now validated in a repeatable way.
- Mock-only tests are no longer the only signal for Supabase-backed reads.
- CI now blocks on the real DB lane in addition to lint, type-check, unit tests, and build.

## Remaining Follow-Up

This work does **not** mean the historical repository migration chain is fully rebuildable from scratch. That remains separate maintenance work and stays active in the roadmap until a fresh migration-only bootstrap succeeds without the dedicated DB test harness.

## Canonical References

- Active roadmap: [roadmap.md](../roadmap.md)
- Testing guidance: [docs/development/testing-guidelines.md](../../development/testing-guidelines.md)
- Decision record: [ADR-021](../../adr/021-dedicated-supabase-db-integration-tests.md)
