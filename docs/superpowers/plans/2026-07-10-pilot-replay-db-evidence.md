# Pilot Replay Database Evidence Implementation Plan

**Goal:** Close the repo-local evidence gap for F3 supplied-ID replay suppression against a disposable real backing store.

**Architecture:** Exercise the existing `insertContactAttempt` storage path through an authenticated local Supabase client, verify the actual primary-key conflict is mapped to an idempotent duplicate, and query the table with the disposable service-role client to prove only one row persists.

**Tech Stack:** TypeScript, Vitest, Supabase JS, disposable local Supabase/PostgreSQL.

---

### Task 1: Add the failing DB integration contract

**Files:**

- Modify: `tests/db/helpers.ts`
- Create: `tests/db/pilot-replay.test.ts`

**Steps:**

1. Expose the deterministic seeded organization ID from the DB helper.
2. Add a privacy-safe fixed contact-attempt payload.
3. Clean up the fixed event before the test.
4. Launch two identical `insertContactAttempt` writes concurrently with the seeded authenticated owner.
5. Assert exactly one success, one duplicate classification, and one persisted row.
6. Clean up in `finally` for repeatability.

### Task 2: Validate against the real disposable stack

**Steps:**

1. Run `npm run test:db -- tests/db/pilot-replay.test.ts`.
2. Run the full `npm run test:db` lane.
3. If local Docker remains unavailable, push only after static/local validation and require the GitHub `test-db-integration` result before documenting F3 as complete.

### Task 3: Update evidence truth

**Files:**

- Modify: `docs/security/v22-0-offline-local-threat-model.md`
- Modify: `docs/runbooks/pilot-event-replay.md`

**Steps:**

1. Mark F3 verified only after the real DB integration test passes.
2. Cite the exact test and clarify that evidence is disposable/local, not production.
3. Preserve all other finding statuses.
4. Run `npm run check:v22-threat-model` and documentation checks.

### Task 4: Validate and deliver

**Steps:**

1. Run focused storage tests, full Vitest, lint, type-check, format, references, root hygiene, and diff checks.
2. Obtain independent review.
3. Commit the test and evidence in one reviewable commit.
4. Push, open a focused PR, and wait for all CI including the DB integration lane.
