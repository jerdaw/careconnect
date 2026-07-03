---
status: archived
last_updated: 2026-07-03
owner: jer
tags: [planning, security, maintenance, provenance]
---

# Residual Security Closure - 2026-07-03

## Summary

Completed the CareConnect portion of the residual security closure pass without
changing the v22 Gate 0 decision state or adding new pilot scope.

## Outcomes

- Recreated `services_public` so UUID-shaped `provenance.verified_by` values are
  replaced with `CareConnect Admin` in the public projection only.
- Preserved underlying `services.provenance` values for authenticated partner,
  editor, and audit compatibility.
- Added shared public-provenance sanitization for search/detail API response
  shaping and mapper boundaries.
- Hardened service URL schemas to accept only `http` and `https` URLs while
  preserving ordinary validation failures for malformed URLs.
- Retired the prior 1452-row broad-scan residual as future scoped assurance
  work rather than current implementation work.

## Verification

Validated locally on 2026-07-03:

1. `npm run test -- tests/lib/search/map-service-public.test.ts tests/api/v1/search-api.test.ts tests/api/v1/services-id.test.ts tests/api/v1/services.test.ts tests/lib/schemas/service-url.test.ts`
2. `npm run test:db -- tests/db/policies.test.ts`
3. `npm run test -- tests/lib/schemas/service-csv-import.test.ts tests/api/v1/services/update-request.test.ts tests/lib/schemas/service-url.test.ts tests/lib/search/map-service-public.test.ts tests/api/v1/search-api.test.ts tests/api/v1/services-id.test.ts tests/api/v1/services.test.ts`
4. `npm run type-check`

The focused API/schema/provenance run covered 94 Vitest tests. The DB policy run
covered 4 Supabase-backed tests.

## Follow-ups

- `npm run ci:check` currently reaches the Search QA lane and fails the curated
  relevance scenarios against the current 49-service fallback dataset. Treat
  that as search-quality backlog, not as a blocker for this security closure.
- Future security scans should be scoped by project and surface instead of
  treating the previous 1452-row broad-pass residual as line-by-line
  implementation work.
