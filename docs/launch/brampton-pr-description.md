# PR Description: Brampton Multi-City Launch Readiness

## Summary

- Keeps Kingston live.
- Adds and verifies Brampton-ready multi-city foundations.
- Preserves manual curation and L1 launch gates.
- Promotes the approved seven-record Brampton first launch set to live data.
- Adds launch readiness, QA, draft candidate, duplicate review, L1 review template, and rollout artifacts.
- Fixes one active Kingston-specific feedback mailto subject so public UI language is supported-region neutral.

## Data Governance

- No fabricated service data.
- Seven Brampton records were promoted to live search after project-owner approval.
- Draft candidates remain in `data/drafts/brampton-on`.
- Human approval remains required before promoting additional Brampton draft records.
- Land acknowledgment, official relationship wording, production migration, and deployment remain approval-gated.

## Verification

- `npm test -- tests/lib/places/registry.test.ts tests/lib/places/coverage.test.ts tests/lib/search/index.test.ts tests/hooks/useServices.test.ts tests/api/v1/search-api.test.ts tests/components/home/PlaceSelector.test.tsx tests/components/home/RotatingRegionHero.test.tsx tests/lib/search/map-service-public.test.ts tests/api/v1/services/export.test.ts tests/lib/service-db.test.ts tests/lib/services.test.ts tests/components/ServiceCard.test.tsx tests/components/home/SearchResultsList.test.tsx tests/lib/ai/query-expander.test.ts tests/unit/openapi-pilot-events.test.ts --run`: passed, 15 files and 230 tests.
- `npm test -- tests/unit/brampton-live-launch-data.test.ts tests/unit/brampton-draft-artifacts.test.ts tests/lib/places/coverage.test.ts tests/api/v1/search-api.test.ts tests/hooks/useServices.test.ts --run`: passed, 5 files and 39 tests.
- `npm test -- tests/components/home/PlaceSelector.test.tsx tests/components/home/SearchResultsList.test.tsx tests/hooks/useSearch.test.ts tests/hooks/useServices.test.ts --run`: passed, 4 files and 29 tests.
- `npm test -- tests/lib/service-db.test.ts tests/lib/services.test.ts tests/lib/search/map-service-public.test.ts tests/api/v1/services/export.test.ts tests/api/v1/search-api.test.ts --run`: passed, 5 files and 29 tests.
- `npm test -- --run`: passed, 216 files, 1701 tests, 24 skipped.
- `npm run lint`: passed.
- `npm run type-check`: passed.
- `npm run format:check`: passed.
- `npm run i18n-audit`: passed, 7 locales with 1219 keys each.
- `npm run check:refs`: passed across 151 files.
- `npm run validate-data`: passed, 203 services.
- `npm run db:validate`: passed, 203 records.
- `npm run check:embeddings`: passed, 203 services, 203 embeddings, 384 dimensions.
- `npm run build`: passed, including postbuild embedding generation for 203 services.
- `git diff --check`: passed.
- Brampton source URL reachability check: passed, 14 source URLs returned HTTP 200 on 2026-07-07.
- `npm run test:db:smoke`: blocked because local `psql` is unavailable.
- `npm run test:a11y -- --project=chromium`: blocked by local WSL browser dependencies; Chromium cannot load `libnspr4.so`. See `docs/launch/brampton-manual-qa.md`.

## Rollout Notes

- Production migration requires explicit approval and read-only schema preflight.
- Deployment requires explicit approval.
- Brampton can be positioned as a live supported place with a small first L1 launch set, not a complete local directory.
- Browser visual QA should be rerun in a browser-capable environment before deploy.

## Reviewer Checklist

- [x] Location selector behavior is transparent.
- [x] Kingston behavior remains intact.
- [x] Brampton first-launch behavior is honest.
- [x] Coverage contracts are consistent across TypeScript, Zod, OpenAPI, DB mapping, and UI.
- [x] Public docs do not imply official partnerships.
- [x] Deferred draft service candidates are not live data.
- [ ] Production migration remains unapplied until approval.
