---
status: archived
last_updated: 2026-03-29
owner: jer
tags: [planning, v20.0, maintenance, repo-hygiene, typing, privacy]
---

# v20.0 Repo Audit Remediation

## Summary

This archive records the completed maintenance batch that closed the repo-audit follow-through work while v22.0 remained the active strategic planning track.

This was not a new strategic version. It was bounded v20.0 maintenance work to reduce drift, harden privacy/tooling, and keep the repo stable while Gate 0 remains blocked on human-owned evidence.

## Completed Outcomes

1. Normalized repo contracts and tooling:
   - added `generate-embeddings`, `db:types`, and `check:refs`
   - standardized remaining workflows on Node 22
   - replaced deprecated `next lint` usage in `lint-staged`
   - fixed stale script/doc references
2. Added local ephemeral Supabase type-generation workflow:
   - reusable local Supabase bootstrap helper
   - `npm run db:types` script and supporting shell helpers
   - refreshed `types/supabase.ts` structure to match the local schema contract
3. Hardened privacy and analytics:
   - removed raw query text from client analytics payloads
   - enforced JSON validation plus `Cache-Control: no-store` / `X-Robots-Tag: noindex` on search analytics
   - reused the shared Supabase client/env path for analytics
   - cached Upstash rate-limiters instead of recreating them per request
4. Consolidated feedback and dashboard mutations:
   - shared server-side feedback handler for canonical and deprecated routes
   - server actions for organization settings, notifications, and invitation writes
5. Refactored dashboard member management:
   - split the monolithic component into a data hook plus focused UI subcomponents
   - moved invitation creation/cancellation to server actions
6. Tightened service and search typing:
   - typed `ServicePublic`
   - added typed public-row and service-table mapping helpers
   - removed nearly all `unsafeFrom()` callsites from production code
7. Closed dependency and script hygiene gaps:
   - exposed useful maintenance scripts in `package.json`
   - added safe `--help` / dry-run behavior where needed
   - cleared `npm audit --omit=dev`

## Verification Snapshot

Validated on 2026-03-29:

1. `npm run check:refs`
2. `npm run lint`
3. `npm run type-check`
4. `npm test -- --run` -> `152` files passed, `1152` tests passed, `24` skipped
5. `npm run build`
6. `npm audit --omit=dev` -> `0 vulnerabilities`

## Remaining Follow-Through

These items remain on the active roadmap because they were environment- or schema-dependent, not because the maintenance batch is still open:

1. Run `npm run db:types` on a Docker-capable machine and commit the generated `types/supabase.ts` output from the live local stack.
2. Replace the final intentional `unsafeFrom()` usage for `notification_audit` once generated schema coverage or a typed contract exists for that table.
3. Publish a fresh coverage snapshot with `npm run test:coverage`.

## Canonical References

1. [Roadmap](../roadmap.md)
2. [Planning Index](../README.md)
3. [Code Quality Remediation Archive](2026-03-26-v22-0-code-quality-remediation.md)
