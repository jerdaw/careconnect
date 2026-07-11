# Admin Save Circuit Breaker Implementation Plan

**Goal:** Close one explicit ADR-016 mutation-route resilience gap by protecting the admin service-save database operations.

**Architecture:** Keep authentication and authorization outside this route-level change because centralized authorization already applies its risk-aware circuit-breaker policy. Wrap the critical service read and upsert locally with the shared Supabase breaker and no fallback, converting returned Supabase errors into rejected operations. Preserve the existing mixed audit path: resolved Supabase errors are ignored, while rejected/network failures can already return `500` after the primary upsert persists. Consistent transactional audit semantics are separate work.

**Tech Stack:** Next.js App Router, TypeScript, Supabase, Vitest.

---

### Task 1: Add failing route contract tests

**Files:**

- Modify: `tests/api/admin/save.test.ts`

**Steps:**

1. Mock `withCircuitBreaker` as a pass-through wrapper.
2. Require the successful update flow to invoke it for the service read and upsert only.
3. Require read and upsert wrapper rejection to return a handled `500` before later mutations.
4. Prove resolved Supabase errors reject inside the wrapper, not after it returns.
5. Run the focused test and confirm the new expectations fail before production changes.

### Task 2: Protect admin save operations

**Files:**

- Modify: `app/api/admin/save/route.ts`

**Steps:**

1. Import `withCircuitBreaker`.
2. Wrap the existing-service read and service upsert independently with no fallback.
3. Reject non-`PGRST116` read errors and all upsert errors inside the wrapper.
4. Run the focused route test until green.

### Task 3: Record partial ADR progress

**Files:**

- Modify: `docs/adr/016-performance-tracking-and-circuit-breaker.md`

**Steps:**

1. Add a checked nested item for the admin save route.
2. Leave the overall remaining-route rollout item unchecked and name representative remaining work.

### Task 4: Validate and deliver

**Steps:**

1. Run related resilience/integration tests.
2. Run format, lint, type-check, reference, root, diff, and full Vitest checks.
3. Obtain independent review, address findings, then commit, push, and open a focused PR.
