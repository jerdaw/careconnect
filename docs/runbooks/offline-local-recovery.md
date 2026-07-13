# Runbook Summary: Offline Local Data Recovery

**Last Updated:** 2026-07-13

This public summary describes safe recovery principles for browser-local
CareConnect data when IndexedDB, cache storage, or offline queues appear stale
or corrupted. It intentionally excludes private incident notes, live host
access, dashboard links, and environment-specific production commands.

## Scope

In scope:

1. Browser IndexedDB database `careconnect-offline-v1`.
2. Service directory and embedding caches.
3. Local metadata such as `lastSync` and export `version`.
4. Public feedback queue store `pendingFeedback`.
5. Any future pilot event draft queue if one is introduced.

Out of scope:

1. Production database repair.
2. Private partner operations records.
3. Manual changes to verified service data.
4. Recovery steps that require exporting raw user text or personal contact
   fields.

## Recovery Principles

1. Preserve queued write intent before clearing local data.
2. Count queued items without copying raw free-text payloads into public issues.
3. Prefer a forced re-sync of service cache data before deleting IndexedDB.
4. Treat pilot event drafts as sensitive if a future queue is introduced.
5. Document only aggregate recovery evidence in public git.

## Pilot Draft Cleanup Policy

Pilot event draft storage is reserved for keys prefixed with
`careconnect-pilot-draft-`. These drafts are treated as sensitive local data.

Current code-level policy:

1. Draft envelopes expire after `8` hours.
2. Malformed draft envelopes are treated as unsafe to keep.
3. Unknown draft schema versions are treated as unsafe to keep.
4. Sign-out clears reserved pilot draft keys from `localStorage` and
   `sessionStorage`.
5. Service caches, embeddings, user preferences, and public feedback queues are
   not cleared by the pilot draft sign-out cleanup helper.

This policy is implemented in `lib/offline/pilot-draft-cleanup.ts` and wired
into `components/layout/AuthProvider.tsx`.

## Aggregate Audit Helper

`lib/offline/local-recovery-audit.ts` provides a privacy-preserving recovery
snapshot for local troubleshooting. It reports:

1. Service cache count.
2. Embedding cache count.
3. Pending feedback queue count.
4. Pilot draft key counts in `localStorage` and `sessionStorage`.
5. Whether `lastSync` and export `version` metadata exist.
6. The `lastSync` freshness status using the same `fresh`, `stale`, or
   `unknown` policy as the offline UI.

The helper does not read queued feedback payloads, service records, embeddings,
draft payloads, raw search text, or personal contact fields.

If browser draft storage cannot be inspected, the affected draft count is
reported as `null` instead of `0`. This avoids treating blocked storage access
as evidence that no local draft data exists.

Recovery warnings log only sanitized error type metadata and storage class
labels. They must not log raw queue payloads, raw draft values, raw search text,
or raw browser exception messages.

Offline service-export sync failures return sanitized error summaries such as
`errorType` and, for HTTP failures, `httpStatus`. Background sync components
also log sanitized error types for service-worker registration, data sync,
feedback sync, and offline fallback prewarm failures.

The offline feedback queue validates queued payloads against the public feedback
API schema before local storage and again before replay. Empty optional strings
are removed before storage/replay so offline thumbs-up/down feedback does not
create invalid `category_searched` values. Invalid queued items are not sent to
the API; they follow the existing retry-count policy without logging raw
feedback text.

`buildOfflineLocalRecoveryPlan()` converts the aggregate snapshot into
non-destructive recommendation IDs for dry-run recovery notes:

1. `preserve_queued_writes` - queued feedback or pilot draft counts are present.
2. `retry_offline_sync` - the service cache is empty, export metadata is
   missing, or `lastSync` is stale/unknown.
3. `inspect_browser_storage` - IndexedDB could not be opened from the browser,
   or draft storage counts could not be inspected.
4. `run_in_browser` - diagnostics were attempted outside a browser context.
5. `no_immediate_recovery_action` - aggregate counts and freshness metadata do
   not indicate a local recovery action.

These recommendations are intentionally non-destructive. They do not authorize
clearing queues, exporting raw payloads, or modifying verified service data.

## Public Recovery Workflow

1. Confirm the user-visible symptom:
   - Offline search returns no services.
   - Service details are stale after returning online.
   - Feedback remains queued after connectivity returns.
   - Browser storage errors appear in the console.
2. Inspect local storage classes in browser DevTools:
   - IndexedDB: `careconnect-offline-v1`
   - Object stores: `services`, `embeddings`, `meta`, `pendingFeedback`
   - Cache Storage entries used by service export or PWA fallback routes
3. Record only aggregate counts:
   - Number of cached services
   - Number of cached embeddings
   - `lastSync` timestamp presence
   - `lastSync` freshness status
   - `pendingFeedback` item count
   - Pilot draft queue item count, if such a queue exists
4. Attempt non-destructive recovery first:
   - Return the browser to online mode.
   - Reload the app.
   - Trigger or wait for offline sync.
   - Confirm `/api/v1/services/export` can be fetched.
5. If cache data remains stale but queues are empty:
   - Clear `services`, `embeddings`, and stale `meta` entries.
   - Leave queue stores untouched.
   - Reload online and confirm service export rehydrates IndexedDB.
6. If queued items exist:
   - Do not delete the queue as a first step.
   - Reconnect and retry sync.
   - If sync still fails, capture aggregate failure evidence only and escalate
     through private/shared operations material.
7. If IndexedDB cannot be opened:
   - Confirm whether any queue contents are recoverable through browser tools.
   - Escalate before destructive clearing when queued writes may exist.
   - Clear the affected local database only after queue preservation is either
     complete or explicitly waived by the appropriate owner.

## 2026-07-11 Non-Destructive Dry Run

The local production app was exercised in the in-app browser with local search data and no Supabase credentials. Only aggregate counts and key-name prefixes were inspected.

| Observation           | Online Baseline | Offline                               | Recovered Online |
| --------------------- | --------------: | ------------------------------------- | ---------------: |
| `navigator.onLine`    |          `true` | `false`                               |           `true` |
| Cached services       |             204 | Preserved; no store was cleared       |              204 |
| Cached embeddings     |             204 | Preserved; no store was cleared       |              204 |
| Pending feedback      |               0 | Audited before recovery               |                0 |
| Reserved pilot drafts |               0 | Audited by key prefix only            |                0 |
| Sync/version metadata |         present | Preserved                             |          present |
| Service export        |  200 / 204 rows | Unreachable while network was offline |   200 / 204 rows |
| User-visible state    |          online | Offline warning with last-update age  |  Warning cleared |

Restoring connectivity produced the structured `OfflineSync` `network_restore` event. The fresh cache remained intact, so the sync path correctly treated it as already current rather than rewriting it. No destructive recovery step was necessary or authorized.

Observed limitation: the in-app browser rejected service-worker registration with a `SecurityError`, and an offline search attempted to load an uncached JavaScript chunk. This run therefore verifies the aggregate audit and non-destructive re-sync path, not full offline navigation or recovery from an intentionally corrupted database.

## 2026-07-13 Disposable-Profile Cache Rehydration Dry Run

The remaining recovery step was exercised on the fresh local origin
`http://127.0.0.1:3000` with local search data and no Supabase credentials. The
origin was used only for this dry run. Before any clearing, the aggregate audit
reported 204 cached services, 204 cached embeddings, zero pending feedback
items, zero reserved pilot-draft keys in both browser storage areas, and present
`lastSync` and export-version metadata.

Only the `services` and `embeddings` stores plus the `lastSync` and `version`
metadata entries were cleared. The `pendingFeedback` store, pilot-draft storage,
preferences, and all other browser state were left untouched. An immediate
aggregate audit confirmed zero services, zero embeddings, absent sync/version
metadata, and unchanged zero queue/draft counts.

Reloading the online app triggered the normal `OfflineSync` initial-sync path.
The browser logged a successful offline-data sync, and the final aggregate audit
reported 204 services, 204 embeddings, restored `lastSync` and export-version
metadata, and zero pending feedback and pilot drafts. This directly verifies
cache rehydration from the public service export while preserving queued-write
stores.

## Verification Checklist

- [x] User-visible offline/search symptom is reproduced.
- [x] Local store counts are recorded without raw payload contents.
- [x] Non-destructive online re-sync is attempted.
- [x] Queued write stores are audited before any destructive clearing.
- [x] Service cache rehydrates from `/api/v1/services/export` after a safe disposable-profile cache reset.
- [x] Public notes exclude raw queries, free-text feedback, names, phone
      numbers, email addresses, street addresses, private dashboard links, and
      live environment details.

## Evidence Boundary

The two dry runs verify aggregate queue auditing, online recovery, and cache
rehydration for the local in-app-browser workflow. Full offline navigation,
service-worker compatibility in this browser surface, device loss, production
environments, and recovery when queued writes are present remain outside this
evidence.
