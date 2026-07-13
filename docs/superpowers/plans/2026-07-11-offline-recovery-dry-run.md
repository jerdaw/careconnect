# Offline Recovery Dry-Run Implementation Plan

**Goal:** Execute and document the non-destructive browser recovery workflow required by threat-model finding F5.

**Architecture:** Use the real local app and browser IndexedDB, inspect aggregate counts only, exercise browser offline/online transitions, and rely on the existing `OfflineSync` network-restoration path. This is evidence work, not a runtime feature change.

**Tech Stack:** Next.js local server, in-app browser automation, IndexedDB, Vitest.

**Status:** Partially completed on 2026-07-11. The aggregate-only production-browser dry run verified initial cache population, queue/draft auditing, offline state, the online recovery event, retained stores, sync metadata, and service-export reachability. F5 remains unverified because the fresh cache was not cleared and rehydrated. Complete it only in an explicitly disposable browser profile after confirming queue counts are zero, as documented in the runbook.

---

### Task 1: Establish the online baseline

1. Start the app with local search data and no Supabase credentials.
2. Open the localized home route and wait for offline sync.
3. Confirm `/api/v1/services/export` succeeds.
4. Record aggregate `services`, `embeddings`, `pendingFeedback`, and metadata counts/presence only.
5. Count reserved pilot draft keys by key name prefix only; do not read values.

### Task 2: Exercise non-destructive recovery

1. Switch the browser context offline.
2. Confirm the app reports or behaves as offline while retaining browser-local state.
3. Do not clear any store or queue.
4. Restore connectivity and wait for the online-event sync path.
5. Confirm service export is reachable and the cache remains populated with sync metadata present.

### Task 3: Record scoped evidence

**Files:**

- Modify: `docs/runbooks/offline-local-recovery.md`
- Modify: `docs/security/v22-0-offline-local-threat-model.md`

1. Add a dated aggregate-only dry-run record.
2. Mark F5 verified only if every required observation succeeds.
3. Explicitly limit the claim to the local browser and non-destructive path.
4. Leave F1 and F2 unchanged.

### Task 4: Validate and deliver

1. Run focused offline audit/sync/component tests.
2. Run threat-model consistency, lint, type-check, format, references, root hygiene, and diff checks.
3. Obtain independent review.
4. Commit, push, and open a stacked PR targeting `codex/pilot-replay-db-evidence`.
