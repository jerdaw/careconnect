---
status: archived
last_updated: 2026-04-15
owner: jer
tags: [planning, archive, v20.0, maintenance, search, lint, documentation, testing]
---

# v20.0 Semantic Search Fail-Closed and Lint Hygiene

## Summary

This archive records a bounded maintenance bundle completed while v22.0 Gate 0 remained blocked.

The work stayed inside the active maintenance lane and focused on code-quality safeguards rather than new product scope:

1. restore an authoritative repo-wide lint baseline
2. make semantic search fail closed when the browser embedding worker cannot initialize or execute
3. sync canonical docs and tests to the new runtime behavior

## Completed Outcomes

1. Restored repo-wide lint signal:
   - excluded local MkDocs build output under `site/` from ESLint traversal
   - removed the local `site/` artifact so root-hygiene checks pass again
2. Hardened the semantic search worker path:
   - removed synthetic mock embeddings from `app/worker.ts`
   - kept worker init failures in an explicit error state instead of reporting `ready`
   - added request-scoped embed responses so failures settle cleanly per request
3. Hardened the semantic-search hook:
   - in-flight embedding promises now settle on both success and error
   - worker failures clear pending request listeners and preserve keyword-only search behavior
   - semantic enhancement now skips itself when embeddings are unavailable
4. Reconciled canonical docs with the live runtime:
   - architecture now documents keyword-only fallback when semantic worker initialization fails
   - architecture now points push-notification service-worker behavior at `public/sw.js` / `public/custom-sw.js`
5. Added focused regression coverage for:
   - semantic worker init failure handling
   - embedding request error settlement
   - keyword-only fallback when semantic enhancement cannot upgrade results

## Canonical References Updated

1. [Roadmap](../roadmap.md)
2. [Planning README](../README.md)
3. [Architecture](../../architecture.md)

## Verification Snapshot

Validated during the 2026-04-15 maintenance pass:

1. `npm run lint`
2. `npm run type-check`
3. `npx vitest run tests/hooks/useSemanticSearch.test.ts tests/hooks/useServices.test.ts`
4. `npx vitest run tests/unit/documentation-hygiene.test.ts`
5. `npm run check:refs`
6. `npm run check:root`

## What Remains Open

This archive does not change the active Gate 0 blocker order or add new roadmap debt.

Still-open maintenance items remain on the main roadmap:

1. regenerate `types/supabase.ts` on a Docker-capable machine and remove the last intentional `notification_audit` typing escape hatch
2. unify client and server ranking behind one shared scoring engine
3. keep the default skip-free E2E suite healthy while leaving Playwright execution to CI/manual dispatch during GitHub free-tier budget mode
