# Admin Save Circuit Breaker Design

## Context

ADR-016 keeps Phase 3 open until remaining mutation routes use the shared Supabase circuit breaker. `POST /api/admin/save` is an authenticated, admin-only service mutation route whose critical service read and upsert currently call Supabase directly.

## Decision

Protect the service read and upsert with `withCircuitBreaker` and no fallback. Convert their resolved Supabase errors into rejected operations so the breaker observes ordinary database failures. Treat the expected `PGRST116` read result as a create path, not a breaker failure. Authentication, RBAC, validation, and database mapping remain unchanged.

Keep the post-save audit insert and admin-action RPC on their existing mixed path: resolved Supabase errors are ignored, while rejected/network failures bubble to the route catch and can return `500` after the primary upsert persisted. Guarding them independently would not resolve that non-atomic response risk; consistent audit semantics require a separate transaction/schema decision. Add route-level tests that prove the two critical operations use the shared wrapper, that resolved database errors reject inside it, and that read/upsert wrapper rejection stops before later mutations. Circuit state transitions remain covered by the circuit-breaker library tests.

Record this route as partial Phase 3 progress in ADR-016 while leaving the broader remaining-route checkbox open.

## Boundaries

- No curated service-data, schema, migration, RBAC, environment, or production changes.
- No fallback for the service read, upsert, or authorization.
- No global circuit-breaker semantic changes.
- No transactional or response-contract redesign for post-save audit writes.
- Do not claim other mutation routes are protected.

## Validation

Run the focused route test first, related circuit-breaker tests, then formatting, lint, type-check, repository checks, and the full Vitest suite before delivery.
