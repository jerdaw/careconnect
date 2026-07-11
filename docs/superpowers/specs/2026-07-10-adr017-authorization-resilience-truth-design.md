# ADR-017 Authorization Resilience Truth Design

## Context

ADR-017 describes low-risk authorization fallback as future work and says all reads currently fail closed. The implementation already has high-, medium-, and low-risk defaults, restrictive low-risk query fallbacks, explicit permissive assertion fallbacks, and a limited source-policy guard for direct literal-low calls to three high-risk helpers.

## Decision

Reconcile ADR-017 with the current implementation and tests. Document the helper-by-helper default matrix, distinguish circuit-open handling from ordinary errors, and state that low-risk assertion fallbacks are never valid for mutation or protected-resource authorization.

Keep this batch documentation-only. Do not change RBAC, authorization behavior, fallback values, call sites, or the circuit breaker.

## Validation

Run the focused authorization and policy tests to verify the cited behavior, then formatting, lint, type-check, documentation hygiene, reference, and root checks. Inspect the diff to confirm no runtime or RBAC files changed.
