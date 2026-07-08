# Brampton Launch Readiness Report

Date: 2026-07-07
Branch: `main` after PR #33 merge

## Status

- Foundation code: verified and merged to `main` in PR #33.
- Kingston live behavior: verified by local and server search regressions.
- Brampton first-launch behavior: verified by local and server search regressions.
- Brampton live service data: seven approved L1 records added.
- Production migration: not applied.
- Deployment: not performed.

## Approval Gates

- Additional Brampton record promotions require the same L1 approval workflow.
- Human approval required before production schema migration.
- Human approval required before deployment.
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

## Findings

- No app-level launch blocker identified in the local test, build, data, or source-reachability lanes.
- Browser a11y is no longer environment-blocked for this session; the Chromium suite passed using extracted user-space libraries.
- Local DB smoke is no longer environment-blocked for this session; it passed using an extracted PostgreSQL client.
- Full viewport visual QA is captured and documented for desktop, tablet, and mobile.
- Live Supabase schema preflight is complete; production migration remains unapplied and approval-gated.

## Technical Verification

- Branch diff reviewed: pass. Changes are scoped to multi-city foundation code, search/UI contracts, public docs, migration, tests, readiness artifacts, and approved Brampton live data.
- Critical contracts reviewed: pass. `PlaceId` uses stable IDs, explicit `coverage` takes precedence, local and server search accept `placeId`, selected-place ranking includes a local/regional coverage preference, OpenAPI matches the implemented coverage shape, and the search API keeps `no-store` for query/location/open-now/place-filtered searches.
- Existing data comparison: pass. Structured comparison against `HEAD:data/services.json` confirmed 196 existing records were unchanged, with seven Brampton records added and no removals.
- Targeted Vitest suite: pass, 15 files and 230 tests passed.
- Brampton promotion suite: pass, 5 files and 39 tests passed.
- Full Vitest suite: pass, 216 files and 1703 tests passed, 24 skipped.
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
- Browser a11y: pass, `npm run test:a11y -- --project=chromium`, 10 Chromium tests.
- Strict a11y regression: pass, `npx playwright test tests/e2e/accessibility-regression.spec.ts --project=chromium`, 5 Chromium tests.
- Visual QA capture: pass, `npx playwright test tests/e2e/brampton-visual-qa.spec.ts --project=chromium`, 6 Chromium screenshot tests.
- DB smoke: pass, `npm run test:db:smoke`, 2 smoke tests against the disposable local Supabase stack.
- Restricted production control-plane preflight: pass, dev-space readiness and wrapper-gated CareConnect preflight/status/service-health checks completed without sensitive-output collection.
- Production approval packet: prepared; migration and deploy remain unapplied and approval-gated.
- Future verification queue: prepared as draft-only; no additional Brampton records promoted.

## Technical Residual Risks

- Browser visual QA is documented in `docs/launch/brampton-manual-qa.md`.
- Production migration was not applied.
- Live Supabase schema inspection completed through the Supabase CLI. The pending Brampton coverage migration is not applied in production.
- Production deploy was not performed.

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
- Broad canonical reuse: existing 988, ConnexOntario, Kids Help Phone, Health811, 211 Ontario, and Ontario Victim Support Line records are reused rather than duplicated for Brampton.

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
- Live Supabase schema inspection: pass. The linked database is PostgreSQL 17.6. The previous `services_public` provenance-sanitizing migration is applied; the Brampton coverage migration is not applied. Live `services` and `services_public` do not yet have `primary_place_id` or `coverage`. `services_public` still sanitizes UUID-shaped verifier identifiers and has `security_invoker=true`. `services` has RLS enabled with select/insert/update/delete policies. Existing live grants on `services` and `services_public` are broader than the repo baseline expects; `services` writes are constrained by RLS, and the pending Brampton migration now explicitly revokes anon/authenticated privileges on `services_public` before granting SELECT.
- Post-merge Supabase read-only check: pass. `npx supabase migration list --linked` shows `20260706120000` as local-only, and `npx supabase db query --linked` confirmed no production `primary_place_id` or `coverage` columns yet.
- Backup/rollback posture: not yet proven for CareConnect-specific restore/provider recovery. The private/shared operations source of truth records this as a planned proof target, so production approval should either complete the proof or explicitly accept the risk.
- Production SQL: not applied.

## Final Readiness Decision

- Foundation/readiness code: merged to `main` in PR #33 after local and GitHub verification.
- Ready to publish Brampton live records: yes for the approved seven-record L1 first launch set.
- Ready for production migration: no, requires explicit human approval and a backup/rollback posture decision. The read-only live schema preflight is complete.
- Ready for deployment: no, requires human approval.

## Recommended Next Human Decisions

1. Decide whether to complete CareConnect restore/provider proof before migration approval or explicitly accept the current backup/rollback risk for this release.
2. Decide whether to approve the Brampton production migration after reviewing the completed live schema preflight.
3. Decide whether to deploy after migration approval and post-migration checks.
4. Approve any land acknowledgment or official relationship wording before publication.
5. Continue Brampton expansion through deferred L1 reviews only.
