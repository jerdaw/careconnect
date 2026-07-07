# PR Description: Brampton Multi-City Launch Readiness

## Summary

- Keeps Kingston live.
- Adds and verifies Brampton-ready multi-city foundations.
- Preserves manual curation and L1 launch gates.
- Promotes the approved seven-record Brampton first launch set to live data.
- Adds launch readiness, QA, draft candidate, duplicate review, L1 review template, and rollout artifacts.
- Fixes one active Kingston-specific feedback mailto subject so public UI language is supported-region neutral.
- Adds strict a11y regression coverage, remediates recorded browser/a11y defects, and adds desktop/tablet/mobile visual QA capture.

## Data Governance

- No fabricated service data.
- Seven Brampton records were promoted to live search after project-owner approval.
- Draft candidates remain in `data/drafts/brampton-on`.
- Human approval remains required before promoting additional Brampton draft records.
- Land acknowledgment, official relationship wording, production migration, and deployment remain approval-gated.
- Public-positioning closeout: approval-ready wording options prepared; no final land acknowledgment, official relationship wording, or partnership claims published.

## Verification

- `npm test -- tests/lib/places/registry.test.ts tests/lib/places/coverage.test.ts tests/lib/search/index.test.ts tests/hooks/useServices.test.ts tests/api/v1/search-api.test.ts tests/components/home/PlaceSelector.test.tsx tests/components/home/RotatingRegionHero.test.tsx tests/lib/search/map-service-public.test.ts tests/api/v1/services/export.test.ts tests/lib/service-db.test.ts tests/lib/services.test.ts tests/components/ServiceCard.test.tsx tests/components/home/SearchResultsList.test.tsx tests/lib/ai/query-expander.test.ts tests/unit/openapi-pilot-events.test.ts --run`: passed, 15 files and 230 tests.
- `npm test -- tests/unit/brampton-live-launch-data.test.ts tests/unit/brampton-draft-artifacts.test.ts tests/lib/places/coverage.test.ts tests/api/v1/search-api.test.ts tests/hooks/useServices.test.ts --run`: passed, 5 files and 39 tests.
- `npm test -- tests/components/home/PlaceSelector.test.tsx tests/components/home/SearchResultsList.test.tsx tests/hooks/useSearch.test.ts tests/hooks/useServices.test.ts --run`: passed, 4 files and 29 tests.
- `npm test -- tests/lib/service-db.test.ts tests/lib/services.test.ts tests/lib/search/map-service-public.test.ts tests/api/v1/services/export.test.ts tests/api/v1/search-api.test.ts --run`: passed, 5 files and 29 tests.
- `npm test -- --run`: passed, 216 files, 1703 tests, 24 skipped.
- `npm run lint`: passed.
- `npm run type-check`: passed.
- `npm run format:check`: passed.
- `npm run i18n-audit`: passed, 7 locales with 1219 keys each.
- `npm run check:refs`: passed across 151 files.
- `npm run validate-data`: passed, 203 services.
- `npm run db:validate`: passed, 203 records.
- `npm run check:embeddings`: passed, 203 services, 203 embeddings, 384 dimensions.
- `SKIP_EMBEDDINGS=1 npm run build`: passed; postbuild embedding generation was intentionally skipped.
- `git diff --check`: passed.
- Brampton source URL reachability check: passed, 14 source URLs returned HTTP 200 on 2026-07-07.
- `npm run test:db:smoke`: passed with extracted user-space PostgreSQL client binaries, 2 smoke tests.
- `npx playwright test tests/e2e/accessibility-regression.spec.ts --project=chromium`: passed, 5 Chromium route tests with no serious or critical WCAG A/AA Axe violations.
- `npm run test:a11y -- --project=chromium`: passed with extracted user-space Chromium libraries, 10 Chromium tests and 0 Axe violations on audited routes. Optional semantic worker fetch failure is caught and logged as a warning, with no unhandled rejection in the output.
- `npx playwright test tests/e2e/brampton-visual-qa.spec.ts --project=chromium`: passed, 6 Chromium screenshot tests across desktop, tablet, and mobile homepage/search states.
- Restricted production control-plane readiness, preflight summary, status summary, and CareConnect service-health checks: passed without collecting secret values or raw sensitive output.
- Authenticated live Supabase schema inspection: passed through `npx supabase db query --linked` after CLI login and project linking. The Brampton coverage migration is not applied; live `services`/`services_public` lack `primary_place_id` and `coverage`; existing live grants are broader than the repo baseline expects, so the pending migration now normalizes `services_public` grants before granting SELECT.

## Rollout Notes

- Production migration requires explicit approval. Read-only schema preflight is complete.
- Deployment requires explicit approval.
- Brampton can be positioned as a live supported place with a small first L1 launch set, not a complete local directory.
- Browser visual QA screenshot review is documented in `docs/launch/brampton-manual-qa.md`.
- Land acknowledgment source research is documented, but final wording remains approval-gated.

## Reviewer Checklist

- [x] Location selector behavior is transparent.
- [x] Kingston behavior remains intact.
- [x] Brampton first-launch behavior is honest.
- [x] Coverage contracts are consistent across TypeScript, Zod, OpenAPI, DB mapping, and UI.
- [x] Public docs do not imply official partnerships.
- [x] Deferred draft service candidates are not live data.
- [ ] Production migration remains unapplied until approval.
