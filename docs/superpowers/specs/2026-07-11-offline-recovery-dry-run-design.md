# Offline Recovery Dry-Run Design

## Context

Threat-model finding F5 requires execution evidence that browser-local queue auditing and non-destructive re-sync work as documented. Unit and component coverage already protect the underlying IndexedDB, feedback queue, aggregate audit, and online-event behavior, but the runbook still records no browser dry run.

## Decision

Run one local-browser recovery exercise against the checked-in app in local search mode:

1. Load the app online and wait for the normal offline sync to populate IndexedDB.
2. Record only aggregate object-store counts and metadata presence; never inspect or emit queued payloads.
3. Confirm the pending feedback queue and reserved pilot-draft key counts before any recovery action.
4. Switch the browser offline and reproduce a user-visible network/offline state without clearing storage.
5. Restore connectivity, trigger the documented non-destructive online recovery path, and confirm `/api/v1/services/export` succeeds.
6. Re-audit aggregate counts and confirm the service cache remains populated and freshness metadata is present.
7. Leave all queue stores and verified service data untouched.

If every step is directly observed, record a public-safe evidence note and mark F5 verified for this local-browser workflow only. Do not claim production, multi-browser, device-loss, or unrecoverable-corruption coverage.

## Stop Rules

- Stop if the browser cannot reliably control online/offline state.
- Stop if aggregate inspection would require reading or exposing raw queued payloads.
- Stop before clearing any queue, cache, database, service worker, or user preference.
- Stop if the app requires credentials or private environment configuration.

## Validation

Preserve browser observations as aggregate evidence, run focused offline tests, threat-model consistency, lint, type-check, format, references, and diff checks. Deliver this as a stacked PR on the F3 evidence branch because both batches update the same threat-model document.
