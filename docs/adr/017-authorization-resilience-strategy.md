# 017. Authorization Resilience Strategy

## Status

Accepted

## Context

Our application relies on Supabase for data storage and authorization checks (Row Level Security and application-level role checks). When the database is experiencing high latency or downtime, authorization checks typically fail, causing the entire application to become unusable (Fail-Closed).

We recently implemented a Circuit Breaker pattern to protect the system from cascading failures during database outages. We need to decide how authorization checks should behave when the circuit is OPEN (fast-failing).

## Decision

We will implement a **Tiered Circuit Breaker Protection** strategy for authorization checks.

### 1. High-Risk Operations (Mutations)

**Strategy:** Fail-Closed
**Rationale:** Security takes precedence. We cannot allow users to modify, delete, or transfer resources if we cannot verify their permissions with 100% certainty.
**Behavior:** When the circuit is OPEN, `assertServiceOwnership` and similar mutation checks will throw a `CircuitOpenError` (or wrap it in an `AuthorizationError`), effectively blocking the action.

### 2. Low-Risk Operations (Reads/Navigation)

**Strategy:** Fail-Closed (Default) with Future Option for Fail-Open
**Rationale:** Currently, most read operations also require the database to fetch the data being authorized. If the DB is down to the point of tripping the breaker, the data fetch will likely fail anyway. Therefore, failing closed on auth is safe and consistent.
**Future Proofing:** We will structure the code to allow "Low Risk" checks to potentially fail-open (log only) in the future if we move to cached data or search-index based reads where the DB might be down but data is still accessible.

## Consequences

### Positive

- **Security:** Strict security guarantees are maintained. No unauthorized mutations can occur during outages.
- **Resilience:** Fast failure prevents authorization checks from hanging and consuming resources when the DB is down.
- **Observability:** Authorization failures due to circuit breaking are distinctly logged.

### Negative

- **Availability:** During database glitches, users will not be able to manage their services. This is acceptable as the alternative (security vulnerability) is worse.

## Implementation

We will modify `lib/auth/authorization.ts` to wrap Supabase calls in `withCircuitBreaker`.
We will add a `riskLevel` parameter to authorization functions to support the tiered approach, defaulting to `'high'`.
