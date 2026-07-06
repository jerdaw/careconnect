# PR Description: Brampton Multi-City Launch Readiness

## Summary

- Keeps Kingston live.
- Adds and verifies Brampton-ready multi-city foundations.
- Preserves manual curation and L1 launch gates.
- Adds launch readiness, QA, draft candidate, duplicate review, L1 review template, and rollout artifacts.
- Fixes one active Kingston-specific feedback mailto subject so public UI language is supported-region neutral.

## Data Governance

- No fabricated service data.
- No Brampton records promoted to live search in this autonomous pass.
- Draft candidates remain in `data/drafts/brampton-on`.
- Human approval is required before service data changes.
- Human approval is required before changing Brampton from preview/draft language to live language.

## Verification

- `npm test -- tests/lib/places/registry.test.ts tests/lib/places/coverage.test.ts tests/lib/search/index.test.ts tests/hooks/useServices.test.ts tests/api/v1/search-api.test.ts tests/components/home/PlaceSelector.test.tsx tests/components/home/RotatingRegionHero.test.tsx tests/lib/search/map-service-public.test.ts tests/api/v1/services/export.test.ts tests/lib/service-db.test.ts tests/lib/services.test.ts tests/components/ServiceCard.test.tsx tests/components/home/SearchResultsList.test.tsx tests/lib/ai/query-expander.test.ts tests/unit/openapi-pilot-events.test.ts --run`: passed, 15 files and 230 tests.
- `npm test -- tests/components/home/PlaceSelector.test.tsx tests/components/home/SearchResultsList.test.tsx tests/hooks/useSearch.test.ts tests/hooks/useServices.test.ts --run`: passed, 4 files and 29 tests.
- `npm test -- tests/lib/service-db.test.ts tests/lib/services.test.ts tests/lib/search/map-service-public.test.ts tests/api/v1/services/export.test.ts tests/api/v1/search-api.test.ts --run`: passed, 5 files and 29 tests.
- `npm run lint`: passed.
- `npm run type-check`: passed.
- `npm run format:check`: passed.
- `npm run i18n-audit`: passed, 7 locales with 1219 keys each.
- `npm run check:refs`: passed across 151 files.
- `npm run validate-data`: passed, 196 services.
- `npm run db:validate`: passed, 196 records.
- `npm run check:embeddings`: passed, 196 services, 196 embeddings, 384 dimensions.
- `SKIP_EMBEDDINGS=1 npm run build`: passed.
- `git diff --check`: passed.
- `npm run test:db:smoke`: not run to completion because local `psql` is unavailable.
- `npm run test:a11y -- --project=chromium`: blocked by local WSL browser dependencies after Chromium cache install; see `docs/launch/brampton-manual-qa.md`.

## Rollout Notes

- Production migration requires explicit approval and read-only schema preflight.
- Deployment requires explicit approval.
- Brampton should not be positioned as live until approved L1 records are added.
- Browser visual QA should be rerun in a browser-capable environment before merge/deploy.

## Reviewer Checklist

- [ ] Location selector behavior is transparent.
- [ ] Kingston behavior remains intact.
- [ ] Brampton preview behavior is honest.
- [ ] Coverage contracts are consistent across TypeScript, Zod, OpenAPI, DB mapping, and UI.
- [ ] Public docs do not imply official partnerships.
- [ ] Draft service candidates are not live data.
- [ ] Production migration remains unapplied until approval.
