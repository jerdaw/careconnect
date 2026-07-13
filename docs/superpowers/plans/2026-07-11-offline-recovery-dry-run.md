# Offline Recovery Dry-Run Implementation Plan

**Goal:** Execute and document the browser recovery workflow required by threat-model finding F5, including safe cache rehydration.

**Architecture:** Use the real local app and browser IndexedDB, inspect aggregate counts only, exercise browser offline/online transitions, and complete cache rehydration on a fresh local origin after proving queued-write counts are zero. This is evidence work, not a runtime feature change.

**Tech Stack:** Next.js local server, in-app browser automation, IndexedDB, Vitest.

**Status:** Completed on 2026-07-13. The first aggregate-only browser run verified cache population, queue/draft auditing, offline state, online recovery, and service-export reachability. A second run on a fresh local origin confirmed zero queued writes, cleared only cache/freshness state, and observed automatic repopulation to 204 services and 204 embeddings with metadata restored. F5 is verified for this bounded local workflow.

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

### Task 3: Exercise disposable-profile cache rehydration

1. Use a fresh local origin and confirm service, embedding, queue, draft, and metadata aggregates.
2. Stop unless pending feedback and both pilot-draft counts are exactly zero.
3. Clear only `services`, `embeddings`, `lastSync`, and `version`.
4. Confirm cache counts are zero while queue/draft counts remain zero.
5. Reload online and confirm services, embeddings, and metadata are repopulated.

### Task 4: Record scoped evidence

**Files:**

- Modify: `docs/runbooks/offline-local-recovery.md`
- Modify: `docs/security/v22-0-offline-local-threat-model.md`

1. Add a dated aggregate-only dry-run record.
2. Mark F5 verified only if every required observation succeeds.
3. Explicitly limit the claim to the bounded local browser paths.
4. Leave F1 and F2 unchanged.

### Task 5: Validate and deliver

1. Run focused offline audit/sync/component tests.
2. Run threat-model consistency, lint, type-check, format, references, root hygiene, and diff checks.
3. Obtain independent review.
4. Commit, push, and open a stacked PR targeting `codex/pilot-replay-db-evidence`.
