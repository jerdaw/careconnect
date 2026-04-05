---
status: archived
last_updated: 2026-04-05
owner: jer
tags: [planning, archive, v22.0, v20.0, search, governance, documentation, testing]
---

# v22.0 Gate 0 Wait Maintenance Bundle

## Summary

This archive records a bounded maintenance bundle completed while v22.0 Gate 0 remained blocked on user-owned legal and partner evidence.

The work stayed inside the "parallel maintenance while Gate 0 waits" lane and focused on repo-local quality, governance enforcement, and documentation alignment rather than new pilot-facing scope.

## Completed Outcomes

1. Closed the public search explainability follow-through:
   - added normalized, deduplicated match-reason handling
   - surfaced match reasons on result cards
   - preserved match reasons into linked detail pages
2. Enforced stale-data runtime governance:
   - local and server search now exclude records beyond the 180-day visibility window
   - freshness badges now distinguish expired records
   - direct-linked detail pages now show an explicit stale-record warning when the listing is outside the governance window
3. Reconciled active CI/runtime docs with the live workflow stack:
   - release docs now use `gh release create`
   - load-testing docs now reference current GitHub Action majors and Node 22
   - documentation hygiene coverage now guards those active references
4. Calibrated active governance/planning docs for a solo-operable operating model:
   - 180 days is the hard visibility cutoff
   - 90 days is the target re-verification window for pilot / priority services
   - the v22 90-day cycle is documented as a dependency-contingent decision checkpoint rather than a guaranteed build schedule
5. Added focused automated coverage for:
   - match-reason normalization and routing
   - stale-data filtering in local search and the search API
   - freshness helper behavior and expired UI states
   - active documentation alignment around workflow/runtime and freshness policy

## Canonical References Updated

1. [Roadmap](../roadmap.md)
2. [Architecture](../../architecture.md)
3. [Governance Standards](../../governance/standards.md)
4. [Verification Protocol](../../governance/verification-protocol.md)
5. [Planning README](../README.md)
6. [Project README](../../../README.md)
7. [Docs Index](../../index.md)
8. [Testing Guidelines](../../development/testing-guidelines.md)

## Verification Snapshot

Validated during the 2026-04-05 maintenance pass:

1. `npm test -- --run tests/lib/freshness.test.ts tests/lib/search/index.test.ts tests/api/v1/search-api.test.ts tests/components/services/ServiceDetailPage.test.tsx tests/components/ui/FreshnessBadge.test.tsx`
2. `npm test -- --run tests/components/ServiceCard.test.tsx tests/components/services/ServiceDetailPage.test.tsx tests/lib/search/match-reasons.test.ts`
3. `npm test -- --run tests/unit/documentation-hygiene.test.ts`
4. `npm run ci:check`

## What Remains Open

This archive does not unblock v22.0 Gate 0 or close the remaining bounded maintenance backlog.

Still-open follow-through remains on the main roadmap:

1. `A1` Gate 0 partner/legal evidence closure
2. bounded `A6` / `A16` pilot-readiness follow-through based on real evidence inputs
3. client/server ranking unification behind a shared scoring engine
4. Docker-capable regeneration of `types/supabase.ts` plus the remaining typed `notification_audit` path cleanup
