---
status: archived
last_updated: 2026-03-30
owner: jer
tags: [planning, v20.0, maintenance, privacy, authorization, performance, testing]
---

# v20.0 Runtime Hardening and Performance Remediation

## Summary

This archive records the completed maintenance wave that implemented the March 2026 audit remediation plan while v22.0 remained the active strategic planning track.

This was not a new strategic version. It was bounded v20.0 maintenance work to harden privacy and governance behavior, tighten partner-write controls, reduce bundle cost, and keep CI signal trustworthy while Gate 0 remains blocked on human-owned evidence.

## Completed Outcomes

1. Hardened privacy and governance behavior:
   - removed raw search-query text from public service-list error logging
   - normalized provenance handling across DB, public mapping, export, and trust UI without fabricating verifier identities or timestamps
   - stopped generic service-edit flows from auto-refreshing verification timestamps
2. Tightened service creation and operator-facing correctness:
   - restricted `POST /api/v1/services` to authenticated organization-scoped partner creation with membership and permission checks
   - aligned the public OpenAPI contract and route tests with the org-scoped behavior
   - fixed Slack dashboard/runbook URLs and removed placeholder repository links
   - replaced naive dashboard CSV parsing with `papaparse` so quoted commas, escaped quotes, and multiline fields parse safely
3. Reduced unnecessary runtime and bundle cost:
   - split the global AI assistant into a lightweight shell plus lazy-loaded panel
   - deferred semantic-search worker startup until actual search intent
   - deferred AI query expansion until the search path opts into it
   - reduced the localized home-route first-load bundle from about `2.28 MB` to `315 kB`
4. Raised coverage and stabilized tooling:
   - added focused tests for provenance normalization, org-scoped service creation, Slack URL resolution, CSV parsing, telemetry, observability, push notifications, and member actions
   - updated the local `ci:check` helper to mirror hosted validation while skipping the DB lane only when Docker/`psql` prerequisites are unavailable locally
   - repaired the noisy scheduled workflow drift in `Sync 211 Ontario Data` and `Production Smoke`

## Verification Snapshot

Validated on 2026-03-30:

1. `npm run format:check`
2. `npm run lint`
3. `npm run type-check`
4. `npm run test:coverage` -> `159` files, `1178` tests passed, `24` skipped, `72.37%` statements / `79.31%` branches / `83.04%` functions / `72.37%` lines
5. `npm run build`
6. `npm run analyze` -> localized home route first-load JS `315 kB`
7. `npm audit --omit=dev` -> `0 vulnerabilities`

## Remaining Follow-Through

These items remain on the active roadmap because they are environment- or strategy-dependent, not because this maintenance batch is still open:

1. Run `npm run db:types` on a Docker-capable machine and remove the last intentional untyped admin-audit access once generated schema coverage exists.
2. Run `npm run test:db` locally on a Docker + `psql` machine whenever DB/auth changes need local verification beyond the hosted CI lane.
3. Continue the human-owned v22.0 Gate 0 closure work for `C1` legal review and `D4` partner-ops evidence.

## Canonical References

1. [Roadmap](../roadmap.md)
2. [Planning Index](../README.md)
3. [v20.0 Repo Audit Remediation Archive](2026-03-29-v20-0-repo-audit-remediation.md)
