# 017. Authorization Resilience Strategy

## Status

Accepted and implemented

## Context

CareConnect relies on Supabase for data storage and application-level authorization checks in addition to Row Level Security. When Supabase is unavailable, authorization checks must fail quickly without turning a resilience fallback into an authorization bypass.

The shared Supabase circuit breaker can reject an operation with `CircuitOpenError`. Authorization helpers therefore need explicit, reviewable behavior for high-, medium-, and low-risk callers.

## Decision

Use tiered circuit-breaker handling in `lib/auth/authorization.ts`:

1. **High risk** defaults to fail-closed. Mutation, permission, ownership, and admin assertions do not authorize access when the circuit is open.
2. **Medium risk** also fails closed. The distinct label records intent for organization-membership checks without weakening the current security behavior.
3. **Low risk** may handle `CircuitOpenError` with a helper-specific fallback for non-authoritative UI/read behavior. Other errors are not converted into low-risk success by the shared fallback handler.

Low risk is not permission to authorize a mutation. Production call sites must not pass `"low"` to admin, permission, ownership, membership, or other access-gating assertions. The current source-policy test detects direct, unaliased calls to `assertAdminRole`, `assertPermission`, and `assertServiceOwnership` when they contain a literal `"low"` argument. Aliased imports, namespace/property calls, nonliteral risk arguments, and other helpers still depend on code review.

### Implemented defaults and circuit-open outcomes

| Helper                         | Default risk | Circuit-open outcome at default                                    | Outcome if explicitly overridden to `low`                     |
| ------------------------------ | ------------ | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| `assertServiceOwnership`       | `high`       | Throws; the mutation/access assertion fails closed.                | Returns `true`; forbidden for protected or mutating paths.    |
| `assertOrganizationMembership` | `medium`     | Throws; membership cannot be asserted.                             | Returns `true`; forbidden for access-gating paths.            |
| `assertAdminRole`              | `high`       | Denies admin access through an `AuthorizationError`.               | Returns `true`; forbidden for protected or mutating paths.    |
| `getEffectivePermissions`      | `low`        | Returns no edit/delete/private-view permissions and a `null` role. | Same restrictive fallback.                                    |
| `assertPermission`             | `high`       | Throws; the requested permission is not granted.                   | Returns `viewer`; forbidden as proof of requested permission. |
| `getUserOrganizationRole`      | `low`        | Returns `null`.                                                    | Same restrictive fallback.                                    |
| `isUserAdmin`                  | `high`       | Returns `false`; non-circuit errors also deny admin status.        | Returns `true`; forbidden for protected or mutating paths.    |

Some assertion helpers retain an explicit low-risk parameter for non-authoritative presentation or navigation use. Their permissive fallback values must never be used to gate a write or protected resource. The default risk levels, production-call-site policy, and Row Level Security remain the security boundary.

## Implementation Evidence

- `lib/auth/authorization.ts` wraps its Supabase table-backed checks with `withCircuitBreaker` and applies helper-specific risk defaults and fallbacks. `assertAdminRole` calls `supabase.auth.getUser()` outside the breaker before delegating its table lookup to `isUserAdmin`.
- `tests/lib/auth/authorization.test.ts` covers high- and medium-risk fail-closed behavior plus representative low-risk fallbacks; it does not exercise every explicit override shown in the source-derived matrix.
- `tests/lib/auth/authorization-policy.test.ts` rejects direct, unaliased calls with a literal `"low"` argument for `assertAdminRole`, `assertPermission`, and `assertServiceOwnership` under `app`, `lib`, and `scripts`. It does not detect aliases, property calls, or computed/nonliteral risk arguments.
- Protected server actions and routes continue to call mutation/admin helpers at their fail-closed defaults.

## Consequences

### Positive

- Mutations and protected access remain denied when authorization cannot be verified.
- Circuit-open failures return quickly instead of waiting on repeated database timeouts.
- Non-authoritative permission/role display can degrade to restrictive values.
- Explicit defaults and a limited source-policy test make common direct low-risk mutation-authorization mistakes reviewable.

### Negative

- Users cannot manage services or enter protected areas during a database outage.
- Low-risk parameters remain powerful and require call-site discipline; the current source-policy guard does not cover every helper or call shape that can carry a risk override and must be extended if those forms become access gates or new helpers are added.
- Fallback state is process-local because the underlying circuit breaker is process-local.

## Validation

Run:

```bash
npm test -- --run tests/lib/auth/authorization.test.ts tests/lib/auth/authorization-policy.test.ts
npm run type-check
npm run lint
```

Any future change that permits a low-risk fallback in a protected or mutating path requires a separate security review and an update to this ADR and its policy tests.
