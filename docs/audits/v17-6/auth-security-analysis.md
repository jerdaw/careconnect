# Authorization Resilience Security Analysis

## 1. Failure Modes

### Fail-Open (Bypass Auth on Circuit Open)
- **Risk:** High
- **Scenario:** Database is down, circuit opens. An attacker tries to edit a service they don't own.
- **Outcome:** If we bypass auth, they succeed (assuming the edit operation itself doesn't require the DB to verify ownership, which it usually does).
- **Nuance:** Most write operations *also* require the DB to perform the write. If the DB is down, the write fails anyway. So fail-open on auth might be moot for writes *unless* the write goes to a different system (e.g., search index, cache) or if the failure is partial (reads fail, writes succeed - unlikely).
- **Read Operations:** Fail-open on reads (e.g., "can I view this private service?") could leak data if the data is fetched from cache/search index while DB is down.

### Fail-Closed (Deny Auth on Circuit Open)
- **Risk:** Denial of Service
- **Scenario:** Database is flaky (high latency). Circuit opens.
- **Outcome:** Users cannot access their own dashboard.
- **Impact:** Poor UX, but secure.

## 2. Usage Patterns (Preliminary)

- `assertServiceOwnership`: Used in `updateService`, `deleteService`. **High Risk**.
- `assertOrganizationMembership`: Used in dashboard access. **Medium Risk** (Read access).
- `assertPermission`: Used for specific granular actions. Mixed risk.

## 3. Recommended Strategy: Tiered Approach

We will categorize authorization checks into:
1.  **High Risk (Mutations):** Fail-Closed. If we can't verify you own it, you can't change it.
    - Examples: `deleteService`, `updateService`, `transferOwnership`
2.  **Low/Medium Risk (Reads/Nav):** Fail-Open (or Cached). Allow users to view the dashboard shell even if permission check fails, but maybe hide sensitive data?
    - Actually, for "viewing the dashboard", if we fail-closed, the page crashes.
    - If we fail-open, they might see a button they can't click (DB down).

**Decision:**
Implement **Tiered Circuit Breaker Protection** in `assertServiceOwnership` and friends.
- Add `riskLevel` parameter.
- High risk -> Fail Closed.
- Low risk -> Log warning and allow (or return false if boolean).

## 4. Implementation Plan
- Modify `lib/auth/authorization.ts` to use `withCircuitBreaker`.
- Define default risk levels.
- Update consumers if necessary (or rely on defaults).
