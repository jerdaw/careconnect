# Pilot Replay Database Evidence Design

## Context

Threat-model finding F3 requires integration evidence that a repeated pilot event submission is atomically suppressed by a real backing store. The storage layer already treats a supplied-ID primary-key conflict as an idempotent duplicate, but current coverage mocks the Supabase response.

The repository already provides a disposable Supabase DB lane with deterministic organizations, users, services, migrations, and service-role cleanup access. This batch uses that lane without changing schema, seed data, production configuration, or replay policy.

## Decision

Add one serial DB integration test for `insertContactAttempt`:

1. Use the seeded owner identity and organization so the write traverses the existing authenticated RLS policy.
2. Submit a fixed, privacy-safe contact-attempt payload with a client-supplied UUID.
3. Submit two copies concurrently through the same storage function so the primary-key race is exercised.
4. Verify exactly one insert succeeds, the other is classified as `duplicate: true` with no exposed error, and exactly one row exists.
5. Delete the fixed row before and after the assertion through the disposable service-role client so reruns remain isolated.

If the real DB test passes, update the F3 threat-model row and replay runbook to cite the disposable backing-store evidence. Do not claim production validation.

## Boundaries

- No migrations, grants, policies, generated types, or production database access.
- No changes to replay fingerprints, response contracts, or storage behavior.
- No user-derived text or personal contact data in the fixture.
- Do not mark F1, F2, or F5 verified.

## Validation

Run the focused DB test in the disposable Supabase lane, then the full DB lane, focused unit coverage, lint, type-check, formatting, reference checks, and the regular Vitest suite. Local Docker Desktop is currently unhealthy, so GitHub's existing `test-db-integration` CI lane is the authoritative backing-store run if the local engine remains unavailable.
