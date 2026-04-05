---
status: archived
last_updated: 2026-04-04
owner: jer
tags: [planning, archive, v22.0, privacy, offline, accessibility]
---

# v22.0 Map Privacy and Offline Snapshot Safety

## Summary

This archive records two bounded roadmap items completed while v22.0 Gate 0 remained blocked on user-owned evidence:

1. Gate third-party map loading behind explicit user action.
2. Surface offline snapshot age and stale-data warnings so cached results do not appear silently current.

The work stayed inside the "parallel maintenance while Gate 0 waits" lane and did not change curated service data, RBAC scope, or pilot-governance controls.

## Completed Outcomes

1. Replaced automatic Google Maps embeds on public service-detail pages with an opt-in preview panel.
2. Preserved explicit outbound directions as a user-triggered external action rather than a page-load side effect.
3. Added localized privacy copy that warns users before loading the external map preview.
4. Added a shared offline snapshot-status component backed by IndexedDB `lastSync` metadata.
5. Surfaced relative snapshot age, absolute timestamp, and stale-data warnings on:
   - the dedicated offline page
   - the global offline banner
6. Added focused tests for:
   - map opt-in behavior
   - offline snapshot helper logic
   - offline snapshot UI rendering
   - offline page/banner integration

## Canonical References Updated

1. [Roadmap](../roadmap.md)
2. [Architecture](../../architecture.md)
3. [Offline/Local Threat Model](../../security/v22-0-offline-local-threat-model.md)
4. [User Guide](../../user-guide.md)
5. [French User Guide](../../user-guide.fr.md)
6. [README](../../../README.md)
7. [Docs Index](../../index.md)

## Verification Snapshot

Validated during the 2026-04-04 maintenance pass:

1. `npx vitest run tests/components/services/ExternalMapPanel.test.tsx tests/components/services/ServiceDetailPage.test.tsx`
2. `npx vitest run tests/lib/offline/snapshot.test.ts tests/components/offline/OfflineSnapshotStatus.test.tsx tests/components/offline/OfflinePage.test.tsx tests/components/ui/OfflineBanner.test.tsx`
3. `npm run lint`
4. `npm run type-check`

## What Remains Open

This archive does not resolve the broader stale-data governance backlog.

Still-open follow-through remains on the main roadmap:

1. Enforce the approved stale-data runtime policy for records beyond the freshness window.
2. Reconcile verification-level definitions, stale-data thresholds, and public display policy into one source of truth.
