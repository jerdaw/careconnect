---
status: stable
last_updated: 2026-03-24
owner: jer
tags: [architecture, testing, supabase, ci, roadmap]
---

# ADR-021: Use A Dedicated Supabase DB Integration Test Lane

## Context and Problem Statement

CareConnect needed real DB-backed coverage for the public retrieval boundary: `services`, `services_public`, service detail, export, search, and RLS-backed policy behavior.

The existing test posture relied mostly on mocks for Supabase behavior. During implementation, a second issue became explicit: the repository's historical migration chain is not currently sufficient to rebuild the full database from a fresh local reset.

That created two separate needs:

1. add reliable runtime DB integration tests now, and
2. track migration-history repair as follow-up work instead of blocking the test lane.

## Decision Drivers

- Prove public retrieval behavior against a real local database.
- Keep CI runtime and container cost acceptable on GitHub free-tier budget constraints.
- Avoid coupling the test lane to broken or incomplete historical migrations.
- Use deterministic synthetic fixtures rather than curated production-like data.

## Considered Options

1. Continue relying on mocked Supabase tests only.
   - Rejected: does not prove runtime retrieval contracts or RLS behavior.
2. Run DB tests against the repository migration history directly.
   - Rejected for now: fresh local resets fail because the migration chain is incomplete/out of order.
3. Boot a minimal disposable local Supabase project and apply an explicit test bootstrap + seed.
   - Chosen.

## Decision Outcome

Adopt a dedicated DB integration test lane that:

1. boots a disposable minimal local Supabase stack,
2. applies deterministic SQL bootstrap and synthetic fixtures,
3. runs a serial Vitest config for `tests/db/**`, and
4. blocks CI through a dedicated `test-db-integration` job.

This lane is authoritative for runtime DB retrieval behavior. It is not a substitute for repairing the repository's historical migration chain.

## Consequences

### Positive

- Real DB-backed retrieval and policy tests now run locally and in CI.
- CI cost stays lower by starting only the minimal required local Supabase services.
- Synthetic fixtures keep test behavior deterministic and governance-safe.

### Negative / Tradeoffs

- Bootstrap SQL must stay aligned with the public retrieval boundary as schema expectations evolve.
- ~~The DB lane currently validates runtime contracts, not full migration-history rebuildability.~~ (Resolved: v20.0 migration recovery restored a clean, reproducible migration chain.)
- ~~Migration-history cleanup remains an active roadmap item.~~ (Resolved: v20.0 collapsed 38 migrations into a single baseline + 3 forward migrations.)

## Implementation Notes

- Runner: `scripts/run-db-tests.sh`
- DB Vitest config: `vitest.db.config.mts`
- Schema baseline: `supabase/migrations/20260101000000_baseline.sql`
- Synthetic fixtures: `supabase/test-support/integration-seed.sql`
- Tests: `tests/db/`
- Test bootstrap now uses `supabase db reset` (migration-driven), replacing the previous manual `bootstrap.sql` approach.

## Related Decisions

- [ADR-008: Next.js Testing Patterns](008-nextjs-testing-patterns.md)
- [ADR-013: Consolidated RLS Policies](013-consolidated-rls-policies.md)
- [ADR-015: Non-Blocking E2E Tests](015-non-blocking-e2e-tests.md)

## Links

- `docs/development/testing-guidelines.md`
- `docs/planning/archive/2026-03-24-v20-0-db-integration-test-lane.md`
- `docs/planning/roadmap.md`
