# Notification JSON Error Handling Implementation Plan

**Goal:** Return stable client errors for malformed and non-object JSON on notification subscription routes without changing existing response envelopes.

**Architecture:** Keep parsing local to each flat-envelope route. Separate syntax failure from payload-shape validation, and reject both before rate limiting or database work.

**Tech Stack:** Next.js App Router, TypeScript, Vitest.

---

### Task 1: Add failing request-contract tests

**Files:**

- Modify: `tests/api/v1/notifications/subscribe.test.ts`
- Modify: `tests/api/v1/notifications/unsubscribe.test.ts`

**Steps:**

1. Send malformed JSON and require exact `400 { error: "Invalid JSON" }` responses.
2. Send JSON `null` and require each route's existing invalid-payload response.
3. Assert invalid bodies do not reach rate limiting or Supabase setup.
4. Run both route suites and confirm the new tests fail before implementation.

### Task 2: Handle JSON input locally

**Files:**

- Modify: `app/api/v1/notifications/subscribe/route.ts`
- Modify: `app/api/v1/notifications/unsubscribe/route.ts`

**Steps:**

1. Parse the request body in a nested `try/catch`.
2. Return the flat malformed-JSON response on parse failure.
3. Reject non-object JSON through existing payload-specific responses.
4. Preserve all downstream route behavior.

### Task 3: Close the maintenance recommendation

**Files:**

- Modify: `docs/maintenance-audit.md`

**Steps:**

1. Record the two-route malformed-JSON correction.
2. Record why a shared helper remains intentionally deferred.

### Task 4: Validate and deliver

**Steps:**

1. Run focused route tests, format, lint, type-check, references, root hygiene, and the full suite.
2. Confirm no data, schema, RBAC, environment, or unrelated API changes.
3. Obtain independent review, address findings, commit, push, and open a focused PR.
