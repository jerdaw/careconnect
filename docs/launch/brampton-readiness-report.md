# Brampton Launch Readiness Report

Date: 2026-07-06
Branch: `codex/multi-city-brampton-foundation`

## Status

- Foundation code: review in progress in this readiness pass.
- Kingston live behavior: not yet verified in this readiness pass.
- Brampton preview behavior: not yet verified in this readiness pass.
- Brampton live service data: not added by this autonomous pass.
- Production migration: not applied by this autonomous pass.
- Deployment: not performed by this autonomous pass.

## Approval Gates

- Human approval required before adding records to `data/services.json`.
- Human approval required before changing Brampton from preview/draft language to live language.
- Human approval required before production schema migration.
- Human approval required before deployment or merge.
- Human approval required for land acknowledgment and partner relationship wording.

## Evidence Log

- 2026-07-06: Confirmed current branch is `codex/multi-city-brampton-foundation`.
- 2026-07-06: Reviewed the approved multi-city foundation design and implementation plan.
- 2026-07-06: Confirmed this autonomous pass must not edit `data/services.json`, regenerate service embeddings for new records, apply production migrations, deploy, or publish official/partner/land-acknowledgment wording without human approval.

## Findings

- No launch blocker identified during the baseline audit.

## Technical Verification

- Branch diff reviewed: pass. Changes are scoped to multi-city foundation code, search/UI contracts, public docs, migration, tests, and readiness artifacts.
- Critical contracts reviewed: pass. `PlaceId` uses stable IDs, legacy `scope` remains compatible, explicit `coverage` takes precedence, local and server search accept `placeId`, selected-place ranking includes a local/regional coverage preference, OpenAPI matches the implemented coverage shape, and the search API keeps `no-store` for query/location/open-now/place-filtered searches.
- Targeted Vitest suite: pass, 15 files and 230 tests passed.
- Lint: pass, `npm run lint`.
- Type check: pass, `npm run type-check`.
- Format check: pass, `npm run format:check`.
- i18n audit: pass, 7 locales with 1219 keys each and no missing or extra keys.
- Reference check: pass across 151 files.
- Data validation: pass, 196 services.
- DB validation alias: pass, 196 records.
- Embedding consistency check: pass, 196 services, 196 embeddings, 384 dimensions.
- Build with `SKIP_EMBEDDINGS=1`: pass, Next.js production build completed and postbuild embedding generation was skipped.
- Whitespace diff check: pass, `git diff --check`.

## Technical Residual Risks

- Browser visual QA is tracked separately in `docs/launch/brampton-manual-qa.md`.
- Production migration was not applied.
- Brampton live records were not added.

## Browser And Accessibility QA

- Local dev server: pass, `npm run dev` served `http://localhost:3000`.
- Homepage HTTP check: pass, `/en` returned `HTTP/1.1 200 OK`.
- Homepage server-rendered multi-city signals: pass, markup includes the supported-community meta description, accessible hero title, `Kingston`, `Brampton`, visible `Showing Kingston`, and a `Change city` combobox.
- Place-selection focused tests: pass, 4 files and 29 tests passed.
- Playwright a11y command: blocked by local WSL browser dependencies. Chromium downloaded successfully, but launch failed because `libnspr4.so`, `libnss3.so`, and `libnssutil3.so` are missing. Passwordless sudo is unavailable, so dependencies could not be installed from this session.
- Chrome-control fallback: blocked by connector metadata failure before browser selection.
- Full viewport visual QA: not completed in this environment; see `docs/launch/brampton-manual-qa.md`.

## Public Positioning Review

### Safe Updates Made

- Updated `components/layout/BetaBanner.tsx` feedback email subject from Kingston-specific pilot wording to neutral `CareConnect Pilot Feedback`.

### Human Approval Required

- Land acknowledgment wording: unchanged. Brampton-specific wording remains gated until verified through reliable local or Indigenous-led public sources.
- Partner page relationship wording: unchanged. Existing public copy frames source references as inputs for manual review, not endorsements or official partnerships.
- Any copy implying official municipal, regional, provincial, or provider affiliation: no new affiliation wording added.

### Boundary-Safety Notes

- No private hostnames, credentials, webhook URLs, deployment inventory, or private runbook details were added to public docs.

## Brampton Draft Candidate Packet

- Draft candidate artifact: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md`.
- Candidate count: 11 draft-only candidates.
- Scope covered: shelter/housing crisis, victim and family-violence crisis support, Ontario Works/emergency assistance, food access, newcomer support, and community health/wellness.
- Source reachability: pass. Every source URL in the candidate packet returned HTTP 200 during this readiness pass.
- L1 status: all candidates remain `needs_l1_review`; none were promoted to live data.
- Broad canonical reuse: existing 988, ConnexOntario, Kids Help Phone, Health811, 211 Ontario, and Ontario Victim Support Line records are identified for reuse rather than Brampton duplication.

## Duplicate And Canonical Review

- Duplicate review artifact: `data/drafts/brampton-on/duplicates/2026-07-06-canonical-review.md`.
- Existing data comparison: reviewed current `data/services.json` identifiers, names, phone numbers, URLs, legacy scopes, and primary place values.
- Live data guard: pass. `git diff -- data/services.json data/embeddings.json` produced no output.
- Main canonical caution: several organizations may need narrower program records after L1 review instead of broad organization-level records.

## Migration And Database Readiness

- Migration file reviewed: `supabase/migrations/20260706120000_add_service_coverage_place_fields.sql`.
- Local migration safety review: pass. The migration adds `primary_place_id` and `coverage` with `IF NOT EXISTS`, backfills from legacy `scope`, recreates `services_public`, and grants read access to expected roles.
- Public view review: pass. `services_public` exposes `primary_place_id` and `coverage` while continuing to sanitize UUID-shaped verifier identifiers in provenance.
- DB mapping/export tests: pass, 5 files and 29 tests.
- Local disposable DB smoke lane: not run to completion because `psql` is unavailable in this environment.
- Production SQL: not applied.

## Final Readiness Decision

- Ready to merge foundation/readiness code: conditionally yes after final verification in this pass; browser visual QA remains an environment-limited manual follow-up.
- Ready to publish Brampton live records: no, requires human-approved L1 records.
- Ready for production migration: no, requires human approval and live schema preflight.
- Ready for deployment: no, requires human approval.

## Recommended Next Human Decisions

1. Review Brampton draft candidates.
2. Choose the first approved L1 records.
3. Approve or revise public positioning language.
4. Decide whether to run production migration and deploy after live schema preflight.
