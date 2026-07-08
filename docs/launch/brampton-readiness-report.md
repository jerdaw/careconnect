# Brampton Launch Readiness Report

Date: 2026-07-07
Updated: 2026-07-08
Branch: `main` after PR #33 merge

## Status

- Foundation code: verified and merged to `main` in PR #33.
- Kingston live behavior: verified by local and server search regressions.
- Brampton first-launch behavior: verified by local and server search regressions.
- Brampton repo service data: seven approved L1 records added to `data/services.json`.
- Brampton production service data: seven approved L1 records synced to production Supabase after approval.
- Broad production service coverage: follow-up required. Existing production broad Ontario/Canada records were previously backfilled as Kingston-local and do not yet serve Brampton selected-place searches; dry-run correction SQL and rollback SQL are prepared for approval only.
- Production migration: applied after approval; post-migration DB checks passed.
- Deployment: application release `d7cc6e4` deployed and public health checks passed.

## Approval Gates

- Additional Brampton record promotions require the same L1 approval workflow.
- Human approval required before any broad Ontario/Canada production coverage correction.
- Human approval required before executing the prepared seven-ID Brampton data rollback.
- Human approval required for land acknowledgment and partner relationship wording.

## Evidence Log

- 2026-07-06: Confirmed current branch is `codex/multi-city-brampton-foundation`.
- 2026-07-06: Reviewed the approved multi-city foundation design and implementation plan.
- 2026-07-07: Project owner approved the recommended Brampton first launch set and requested additional research for unresolved source conflicts.
- 2026-07-07: Additional Knights Table research resolved the L1 address decision to the official provider contact page at `73 Hale Road`; the older 211 Ontario pantry address remains documented for L2 follow-up.
- 2026-07-07: All 14 source URLs used for the promoted Brampton records returned HTTP 200 during source reachability checks.
- 2026-07-07: Added seven approved Brampton L1 records to `data/services.json`, regenerated `data/embeddings.json`, and kept deferred candidates draft-only.
- 2026-07-07: Replaced the local Chromium and `psql` blockers with a user-space dependency extraction under `/tmp/careconnect-local-deps`; browser a11y and DB smoke reruns completed.
- 2026-07-07: Ran restricted production control-plane readiness, preflight summary, status summary, and CareConnect service-health checks through the approved private operations wrapper; all completed successfully without collecting secret values or raw sensitive output.
- 2026-07-07: Completed authenticated live Supabase schema inspection through `npx supabase db query --linked` after CLI login and project linking.
- 2026-07-07: Remediated recorded strict Axe findings for hidden focusable content, contrast, and optional semantic-search worker rejection handling.
- 2026-07-07: Added Brampton visual QA screenshot coverage for desktop, tablet, and mobile homepage/search states; tablet header clipping was fixed by moving desktop navigation to the `lg` breakpoint.
- 2026-07-07: Prepared `docs/launch/brampton-production-approval-packet.md` and `data/drafts/brampton-on/reviews/2026-07-07-next-verification-queue.md`; both remain approval/draft artifacts only.
- 2026-07-07: PR #33 merged the Brampton multi-city foundation into `main` with merge commit `c16cb5f3462edf988cf01fa87fbf548f5006ab0b`.
- 2026-07-07: Post-merge verification on `main` passed full Vitest, lint, type check, format check, reference check, data validation, DB validation alias, embedding freshness check, and `SKIP_EMBEDDINGS=1 npm run build`.
- 2026-07-07: Post-merge read-only Supabase preflight confirmed the Brampton coverage migration remains unapplied; `20260706120000` is local-only and production still has no `primary_place_id` or `coverage` columns on `services` or `services_public`.
- 2026-07-07: Project owner approved applying the production migration with the documented precautions, while accepting the unresolved CareConnect-specific restore/provider proof risk for this release.
- 2026-07-07: Applied the reviewed Brampton coverage migration to production through the authenticated Supabase migration tool using the exact SQL from `supabase/migrations/20260706120000_add_service_coverage_place_fields.sql`. Supabase recorded the remote migration as `20260708005230 add_service_coverage_place_fields`.
- 2026-07-07: Post-migration checks confirmed `primary_place_id` and `coverage` exist on `services` and `services_public`; all 196 production services have coverage; `services` still has RLS enabled; `services_public` remains `security_invoker=true`; `anon` and `authenticated` have SELECT-only access to `services_public`.
- 2026-07-08: Project owner approved deployment of CareConnect `main` commit `d7cc6e4`; the approved operator deploy path built image `careconnect-web:d7cc6e4`, restarted the `careconnect-web` container, and local/public health checks returned `version: "d7cc6e4"`.
- 2026-07-08: Independent public smoke checks confirmed `https://careconnect.ing/api/v1/health` returns healthy with `version: "d7cc6e4"`, `/` redirects to `/en`, `/en` loads, invalid `filters.placeId` returns `400`, and Kingston selected-place food search returns results.
- 2026-07-08: Post-deploy Brampton selected-place searches for `shelter` and `food` returned valid empty result sets; authenticated read-only Supabase query confirmed none of the seven approved Brampton IDs are present in production `services`.
- 2026-07-08: Added a bounded Brampton production data closeout plan and sync helper path. The helper selects exactly the seven approved IDs, validates Brampton coverage and 384-dimensional embeddings, defaults to dry-run, and refuses `--apply` without an explicit approval token.
- 2026-07-08: Project owner approved syncing exactly the seven approved Brampton L1 records to production Supabase and running post-sync smoke checks.
- 2026-07-08: Applied the seven-record production data sync through the authenticated Supabase CLI path. Post-sync DB checks found all seven approved IDs, all seven with `primary_place_id = 'brampton-on'`, all seven with `scope is null`, all seven with coverage, and all seven with embeddings. Production now has 203 services, 203 services with coverage, and 7 Brampton-primary rows.
- 2026-07-08: Post-sync public smokes confirmed health is healthy at `version: "d7cc6e4"`, Brampton `shelter` and `food` selected-place searches return the approved seven-record first-launch set, Kingston selected-place food search still returns live results, invalid `filters.placeId` still returns `400 Invalid request`, and Brampton food search with limit 50 returned no obvious Kingston-only IDs.
- 2026-07-08: The broad Ontario/Canada Brampton smoke did not return expected broad records. Read-only production inspection showed records such as `ontario-211-ontario`, `kids-help-phone`, and `ontario-naseeha` still have production `coverage` backfilled as local `kingston-on`, while repo JSON marks those services as broader `scope` values. This is a separate production data parity gap and is not fixed by rolling back the seven Brampton rows.
- 2026-07-08: Prepared the exact seven-ID data rollback in `docs/launch/brampton-seven-id-data-rollback-prep.md` for approval only. It was not executed.
- 2026-07-08: Captured a fresh read-only production coverage snapshot with 203 rows and generated dry-run broad-coverage correction SQL, rollback SQL, and a manifest with SHA-256 hashes. The dry run selected 72 existing broad records, 49 provincial and 23 national. Guardrails confirmed the SQL updates only `scope`, `primary_place_id`, and `coverage`, has exact 72-row assertions, and references no Brampton launch IDs. Production write was not executed; see `docs/launch/brampton-broad-coverage-correction-approval.md`.
- 2026-07-08: Added and ran the broad-coverage manifest verifier. `npm run sync:broad-coverage:verify -- --manifest /tmp/careconnect-broad-coverage-correction-manifest.json` returned `ok: true`, confirmed 72 reviewed IDs, matched manifest ID count to the correction summary, matched apply and rollback SQL reviewed-ID sets to the manifest, matched apply and rollback SQL byte counts and SHA-256 values, matched apply and rollback SQL guardrails, and confirmed `writesEnabled: false`.
- 2026-07-08: Reconfirmed production state read-only after verifier prep. Public health returned healthy at `version: "d7cc6e4"`. Supabase read-only checks found all seven Brampton rows still present with `primary_place_id = 'brampton-on'`, null legacy `scope`, explicit coverage, and embeddings. A reviewed broad-record sample found 1 of 5 sampled IDs already broad-shaped, confirming the 72-record broad correction remains unapplied.
- 2026-07-08: Rechecked the private/shared operations source of truth for CareConnect restore/provider proof. Public-safe finding remains: a CareConnect restore/provider proof target is planned but not recorded as complete, and no safe autonomous restore/provider proof runner was found for this repo. Reindex readiness is separately closed and auth/admin smoke remains synthetic-config gated; neither substitutes for restore/provider proof.

## Findings

- No app-level launch blocker identified in the local test, build, data, or source-reachability lanes.
- Browser a11y is no longer environment-blocked for this session; the Chromium suite passed using extracted user-space libraries.
- Local DB smoke is no longer environment-blocked for this session; it passed using an extracted PostgreSQL client.
- Full viewport visual QA is captured and documented for desktop, tablet, and mobile.
- Live Supabase schema migration is complete; application deployment is complete.
- The seven approved Brampton L1 service rows are live in production.
- Remaining production data follow-up: broad Ontario/Canada records need a separate approved correction before Brampton selected-place results can include the intended broad canonical records. Approval-ready SQL is prepared, but the production write remains gated.

## Technical Verification

- Branch diff reviewed: pass. Changes are scoped to multi-city foundation code, search/UI contracts, public docs, migration, tests, readiness artifacts, and approved Brampton live data.
- Critical contracts reviewed: pass. `PlaceId` uses stable IDs, explicit `coverage` takes precedence, local and server search accept `placeId`, selected-place ranking includes a local/regional coverage preference, OpenAPI matches the implemented coverage shape, and the search API keeps `no-store` for query/location/open-now/place-filtered searches.
- Existing data comparison: pass. Structured comparison against `HEAD:data/services.json` confirmed 196 existing records were unchanged, with seven Brampton records added and no removals.
- Targeted Vitest suite: pass, 15 files and 230 tests passed in the original Brampton readiness pass.
- Autonomous closeout targeted suite: pass, `npm test -- tests/scripts/broad-coverage-production-correction.test.ts tests/api/v1/search-api.test.ts tests/hooks/useServices.test.ts tests/lib/places/coverage.test.ts --run`, 4 files and 53 tests passed on 2026-07-08.
- Brampton promotion suite: pass, 5 files and 39 tests passed.
- Full Vitest suite: pass, 218 files and 1730 tests passed, 24 skipped on 2026-07-08.
- Lint: pass, `npm run lint`.
- Type check: pass, `npm run type-check`.
- Format check: pass, `npm run format:check`.
- i18n audit: pass, 7 locales with 1219 keys each and no missing or extra keys.
- Reference check: pass across 151 files.
- Data validation: pass, 203 services.
- DB validation alias: pass, 203 records.
- Embedding consistency check: pass, 203 services, 203 embeddings, 384 dimensions.
- Build: pass, `SKIP_EMBEDDINGS=1 npm run build`; Next.js production build completed and postbuild embedding generation was intentionally skipped.
- Whitespace diff check: pass, `git diff --check`.
- Browser a11y: pass, `npm run test:a11y -- --project=chromium`, 10 Chromium tests, rerun on 2026-07-08.
- Strict a11y regression: pass, `npx playwright test tests/e2e/accessibility-regression.spec.ts --project=chromium`, 5 Chromium tests.
- Visual QA capture: pass, `npx playwright test tests/e2e/brampton-visual-qa.spec.ts --project=chromium`, 6 Chromium screenshot tests.
- DB smoke: pass, `npm run test:db:smoke`, 2 smoke tests against the disposable local Supabase stack, rerun on 2026-07-08.
- Restricted production control-plane preflight: pass, dev-space readiness and wrapper-gated CareConnect preflight/status/service-health checks completed without sensitive-output collection.
- Production approval packet: prepared; migration, deployment, and seven-row production data sync applied after approval; broad-record coverage correction dry-run is prepared and remains separately approval-gated.
- Production data sync: applied after approval for exactly seven Brampton L1 records; post-sync DB and core API smokes completed.
- Future verification queue: prepared as draft-only; no additional Brampton records promoted.

## Technical Residual Risks

- Browser visual QA is documented in `docs/launch/brampton-manual-qa.md`.
- Production migration was applied after explicit approval. The application deployment was performed on 2026-07-08 and health checks passed.
- Live Supabase schema inspection completed through the Supabase CLI and authenticated Supabase tooling. The Brampton coverage migration is applied in production.
- Production data inspection confirmed the seven approved Brampton rows are in production with `primary_place_id = 'brampton-on'`, null legacy `scope`, explicit coverage, and embeddings.
- Existing production broad records still need a separate approved data correction because the migration backfilled several repo-broad records as Kingston-local from the previous live values. Apply and rollback SQL have been prepared from a read-only production snapshot but not executed.
- CareConnect-specific restore/provider proof remains a private-ops hardening follow-up and is not proven complete by the app-repo Brampton launch evidence.

## Browser And Accessibility QA

- Local dev server: pass, `npm run dev` served `http://localhost:3000`.
- Homepage HTTP check: pass, `/en` returned `HTTP/1.1 200 OK`.
- Homepage server-rendered multi-city signals: pass, markup includes the supported-community meta description, accessible hero title, `Kingston`, `Brampton`, visible `Showing Kingston`, and a `Change city` combobox.
- Place-selection focused tests: pass, 4 files and 29 tests passed.
- Strict Axe regression: pass, 5 routes with no serious or critical WCAG A/AA violations.
- Playwright a11y command: pass after extracting Chromium runtime dependencies to `/tmp/careconnect-local-deps`, 10 Chromium tests passed with 0 Axe violations on audited routes.
- Browser-console follow-up: optional `useSemanticSearch` worker fetch failure is caught and logged as a warning; no unhandled rejection appeared in the a11y output.
- Chrome-control fallback: blocked by connector metadata failure before browser selection.
- Full viewport visual QA: pass; see `docs/launch/brampton-manual-qa.md`.

## Public Positioning Review

### Safe Updates Made

- Updated `components/layout/BetaBanner.tsx` feedback email subject from Kingston-specific pilot wording to neutral `CareConnect Pilot Feedback`.
- Updated public service-count and Brampton launch wording to describe Brampton as a small first launch set, not a complete local directory.

### Human Approval Required

- Land acknowledgment wording: unchanged. Brampton-specific wording remains gated until verified through reliable local or Indigenous-led public sources.
- Land acknowledgment source review: updated in `docs/launch/brampton-public-positioning-drafts.md` with municipal, regional, and Indigenous-governance source links. Final wording remains human-approval gated.
- Partner page relationship wording: unchanged. Existing public copy frames source references as inputs for manual review, not endorsements or official partnerships.
- Any copy implying official municipal, regional, provincial, or provider affiliation: no new affiliation wording added.

### Boundary-Safety Notes

- No private hostnames, credentials, webhook URLs, deployment inventory, or private runbook details were added to public docs.

## Brampton Draft Candidate Packet

- Draft candidate artifact: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md`.
- Candidate count: 11 candidates.
- Promoted L1 count: 7 records.
- Deferred count: 4 records.
- Scope covered: shelter/housing crisis, victim and family-violence crisis support, Ontario Works/emergency assistance, food access, newcomer support, and community health/wellness.
- Source reachability: pass. Every source URL used by the promoted Brampton records returned HTTP 200 during this readiness pass.
- L1 status: seven candidates were approved and promoted to live data; deferred candidates remain draft-only.
- Broad canonical reuse: existing 988, ConnexOntario, Kids Help Phone, Health811, 211 Ontario, and Ontario Victim Support Line records are reused rather than duplicated in repo data. Production broad-record coverage still needs a separate approved correction before this reuse is reflected in Brampton selected-place results.

## Duplicate And Canonical Review

- Duplicate review artifact: `data/drafts/brampton-on/duplicates/2026-07-06-canonical-review.md`.
- Existing data comparison: reviewed current `data/services.json` identifiers, names, phone numbers, URLs, legacy scopes, and primary place values.
- Main canonical caution: several deferred organizations may need narrower program records after L1 review instead of broad organization-level records.
- Knights Table L1 note: official provider contact page is canonical for the L1 address; 211 Ontario still lists an older pantry address and should be rechecked before L2.

## Migration And Database Readiness

- Migration file reviewed: `supabase/migrations/20260706120000_add_service_coverage_place_fields.sql`.
- Local migration safety review: pass. The migration adds `primary_place_id` and `coverage` with `IF NOT EXISTS`, backfills from legacy `scope`, recreates `services_public`, normalizes public-view grants, and grants read access to expected roles.
- Public view review: pass. `services_public` exposes `primary_place_id` and `coverage` while continuing to sanitize UUID-shaped verifier identifiers in provenance.
- DB mapping/export tests: pass, 5 files and 29 tests.
- Local disposable DB smoke lane: pass after extracting PostgreSQL client binaries to `/tmp/careconnect-local-deps`, 2 smoke tests passed.
- Production control-plane preflight: pass for wrapper-gated readiness, preflight summary, status summary, and CareConnect service-health checks.
- Pre-migration live Supabase schema inspection: pass. The linked database is PostgreSQL 17.6. The previous `services_public` provenance-sanitizing migration was applied; the Brampton coverage migration was not applied yet. At that point, live `services` and `services_public` did not have `primary_place_id` or `coverage`. `services_public` sanitized UUID-shaped verifier identifiers and had `security_invoker=true`. `services` had RLS enabled with select/insert/update/delete policies. Existing live grants on `services` and `services_public` were broader than the repo baseline expected; `services` writes were constrained by RLS, and the Brampton migration explicitly revoked anon/authenticated privileges on `services_public` before granting SELECT.
- Post-merge Supabase read-only check: pass. `npx supabase migration list --linked` shows `20260706120000` as local-only, and `npx supabase db query --linked` confirmed no production `primary_place_id` or `coverage` columns yet.
- Production migration approval: granted by the project owner with the documented precautions, accepting the unresolved CareConnect-specific restore/provider proof risk for this release.
- Production deployment approval: granted by the project owner for CareConnect `main` commit `d7cc6e4`; deployment completed on 2026-07-08.
- Production SQL: applied through the authenticated Supabase migration tool using the exact reviewed migration SQL. Because `db push` was blocked by historical migration drift, Supabase recorded the remote migration as `20260708005230 add_service_coverage_place_fields`; the local reviewed file remains `20260706120000_add_service_coverage_place_fields.sql`.
- Post-migration schema check: pass. `services.primary_place_id`, `services.coverage`, `services_public.primary_place_id`, and `services_public.coverage` exist with expected `text`/`jsonb` types.
- Post-migration data check: pass. Production has 196 services, 196 services with non-null coverage, 195 Kingston-local records with `primary_place_id = 'kingston-on'`, and one Canada-wide record with national coverage.
- Post-migration public view check: pass. `services_public` remains a `security_invoker=true` view, and `anon`/`authenticated` have SELECT-only access to `services_public`.
- Post-deploy data gap check: pass. Production has 0 rows for the seven approved Brampton IDs, so Brampton selected-place searches correctly return empty results until the seven-row data sync is approved and applied.
- Post-sync data check: pass for the approved seven Brampton rows. Production has all seven approved IDs, all seven with Brampton primary place, explicit coverage, null legacy scope, and embeddings.
- Post-sync broad coverage check: follow-up required. Production broad records inspected during the smoke still carry Kingston-local coverage, so broad Ontario/Canada reuse in Brampton needs a separate approved correction. Dry-run correction prep selected 72 broad records for approval.
- Broad coverage manifest verification: pass. The verifier command confirmed the prepared apply SQL, rollback SQL, manifest reviewed-ID set, byte counts, hashes, guardrails, reviewed ID count, and dry-run-only flag before any approval-gated production write.

## Final Readiness Decision

- Foundation/readiness code: merged to `main` in PR #33 after local and GitHub verification.
- Ready to publish Brampton live records: yes for the approved seven-record L1 first launch set. The rows are live in production.
- Production migration: applied after approval; post-migration DB checks passed.
- Production deployment: applied after approval; health and Kingston/API guardrail smoke checks passed.
- Ready for Brampton public results: yes for the approved first-launch set. Do not claim broad Ontario/Canada canonical reuse in Brampton production results until the separate broad-coverage data correction is approved and applied.

## Recommended Next Human Decisions

1. Approve or reject the prepared broad Ontario/Canada production coverage correction for the 72 reviewed existing canonical records.
2. Approve or reject executing the prepared seven-ID Brampton data rollback. Current recommendation: do not roll back unless the desired outcome is to remove Brampton public results; rollback would not fix the broad-record coverage gap.
3. Approve any land acknowledgment or official relationship wording before publication.
4. Continue Brampton expansion through deferred L1 reviews only.
5. Complete CareConnect restore/provider proof as follow-up hardening even though the migration risk was accepted for this release.
