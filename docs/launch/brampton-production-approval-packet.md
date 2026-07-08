# Brampton Production Approval Packet

Date: 2026-07-07
Updated: 2026-07-08
Status: migration, deployment, Brampton production data syncs, broad-record coverage correction, and eight-record/L2 follow-up approved/applied

## Decision Needed

No Brampton launch production write decision remains open. The owner approved applying the broad Ontario/Canada coverage correction, adding Ste. Louise as the eighth Brampton live record, applying the reviewed Brampton L2 updates, deploying `add8b2f0dbdd`, and syncing the exact approved eight-record set. Post-write DB checks and public smokes passed.

Current recommendation: do not execute any rollback unless a future incident specifically requires it and rollback is separately approved.

## What Is Already Confirmed

- The linked production database was inspected read-only through the Supabase CLI.
- `services.primary_place_id` and `services.coverage` are absent before migration.
- `services_public.primary_place_id` and `services_public.coverage` are absent before migration.
- The previous provenance-sanitizing public-view migration is applied.
- `services_public` uses `security_invoker=true`.
- `services` has RLS enabled.
- Existing live grants were broader than the repo baseline, so the applied migration explicitly revoked `services_public` privileges before granting expected read access.
- The Brampton coverage migration was applied after owner approval using the exact reviewed SQL from `supabase/migrations/20260706120000_add_service_coverage_place_fields.sql`.
- Supabase recorded the applied remote migration as `20260708005230 add_service_coverage_place_fields` because the normal `db push` path is blocked by historical migration drift.
- CareConnect `main` commit `d7cc6e4` was deployed after owner approval, and public health checks returned `version: "d7cc6e4"` for the first Brampton production release.
- The project owner approved syncing exactly the seven approved Brampton L1 rows to production Supabase before the later eight-record/L2 follow-up.
- The original seven approved Brampton IDs were present in production `services` with `primary_place_id = 'brampton-on'`, null legacy `scope`, explicit coverage, and embeddings before the later eight-record/L2 follow-up.
- Live Brampton selected-place searches return the approved seven-record first-launch set.
- A post-sync broad-service smoke found that existing production broad records such as `ontario-211-ontario`, `kids-help-phone`, and `ontario-naseeha` still have `coverage` backfilled as local `kingston-on`; this needs a separate approved correction.
- A read-only production snapshot found 203 rows and generated dry-run SQL for 72 broad-record corrections: 49 provincial and 23 national. The prepared SQL updates only `scope`, `primary_place_id`, and `coverage`, references no Brampton launch IDs, and has a prepared rollback SQL file.
- The broad-record correction manifest verifier passed on 2026-07-08. It confirmed the prepared apply and rollback SQL reviewed-ID sets, byte counts, hashes, SQL guardrails, 72 reviewed IDs, and `writesEnabled: false`.
- A fresh read-only production check on 2026-07-08 confirmed the seven Brampton rows remain live with Brampton coverage and embeddings, while a five-ID reviewed broad-record sample still had only one broad-shaped record before correction.
- The owner approved applying the broad Ontario/Canada coverage correction on 2026-07-08. The original reviewed SQL failed before writing because production `services.scope` is a `service_scope` enum; a derived cast-corrected SQL pair was generated from the same reviewed artifacts, with the same 72 IDs, no Brampton IDs, the same three target columns, and exact 72-row assertions.
- The cast-corrected apply SQL reported `updated_rows: 72`. Post-correction DB checks confirmed all 72 reviewed IDs match target broad coverage, with 49 provincial records, 23 national records, 72 embeddings present, the then-live 7 Brampton-primary rows unaffected, and 0 Brampton IDs in the correction set.
- Post-correction public smokes passed before the eight-record/L2 follow-up: health stayed healthy at `version: "d7cc6e4"`, Kingston selected-place food search returned results, Brampton food and crisis searches included broad Ontario/Canada records, Brampton food and shelter searches included the seven launch records, known Kingston-only records stayed out of Brampton selected-place searches, and invalid `filters.placeId` still returned `400`.
- Supabase Support reported triggering a latest-backup restore for the target project on 2026-07-08. Post-restore public health, live schema, service-count, seven-row Brampton, and Kingston/Brampton search smokes passed. Detailed support evidence and project identifiers remain in private/shared operations material, not this public repo.
- The owner approved the 2026-07-08 follow-up that promotes Ste. Louise to live L1, upgrades six Brampton records to L2, keeps Knights Table at L1, and keeps BMCC/CCS/PCHS deferred.
- The eight-record/L2 production sync completed after approval. Production has 204 total services, eight Brampton-primary rows, explicit coverage and embeddings for all eight approved Brampton IDs, six Brampton records at L2, and Knights Table plus Ste. Louise at L1.
- CareConnect `main` commit `add8b2f0dbdd` was deployed after owner approval. Public health returned healthy with `version: "add8b2f0dbdd"`.
- Post-deploy public smokes passed for Brampton food, Ste. Louise, Brampton shelter, Kingston food, invalid-place validation, and approved About-page source-context wording.
- Private/shared operations material records provider-assisted restore evidence, bounded app redeploy proof, and public health/route-sweep monitoring evidence. Public docs intentionally omit project identifiers, private runtime paths, support-message details, and operator procedure details.

## Must Not Proceed Until

- The exact target environment is confirmed.
- The approving human explicitly authorizes any future broad-record production data correction.
- The approving human explicitly authorizes any seven-ID Brampton data rollback.
- The approving human explicitly authorizes any future Brampton data rollback after a failed smoke or incident review.
- A data correction owner and decision path are identified for any follow-up production data write.

The completed broad-record correction evidence is recorded in `docs/launch/brampton-broad-coverage-correction-approval.md`.

## Backup And Rollback Posture

Current public-safe finding: CareConnect has provider-assisted restore evidence from Supabase Support for a latest-backup restore triggered on 2026-07-08. Post-restore app health, live schema, service-count, seven-row Brampton, and Kingston/Brampton search smokes passed. A later bounded app redeploy proof and public health/route-sweep monitoring evidence also passed and are recorded in private/shared operations material. Keep detailed support trails and runtime details in the private/shared operations source of truth. Recurring restore-proof cadence remains follow-up hardening through the private/shared operations workflow.

## Read-Only Pre-Approval Commands

Run serially:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase migration list --linked
```

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' and table_name in ('services', 'services_public') and column_name in ('primary_place_id', 'coverage') order by table_name, column_name;"
```

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select relname, relrowsecurity from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace where nspname = 'public' and relname in ('services', 'services_public') order by relname;"
```

## Migration Execution

The normal `npx supabase db push --linked` path was not used because dry-run output showed historical migration drift. The reviewed Brampton SQL was applied through the authenticated Supabase migration tool instead.

Applied SQL source:

```text
supabase/migrations/20260706120000_add_service_coverage_place_fields.sql
```

Remote migration recorded by Supabase:

```text
20260708005230 add_service_coverage_place_fields
```

## Post-Migration Read-Only Checks

Run serially after approval and migration:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' and table_name in ('services', 'services_public') and column_name in ('primary_place_id', 'coverage') order by table_name, column_name;"
```

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select count(*)::int as services_with_coverage from public.services where coverage is not null;"
```

## Deployment Smoke Checks Completed

- Initial public health returned healthy with `version: "d7cc6e4"` after the first Brampton production deployment.
- `/` redirected to `/en`.
- `/en` loaded successfully.
- Kingston selected-place food search returned live results.
- Invalid `filters.placeId` returned `400 Invalid request`.
- Brampton selected-place `shelter` and `food` searches returned valid empty result sets before production data sync.
- Follow-up deployment public health returned healthy with `version: "add8b2f0dbdd"`.
- Follow-up public smokes passed for Brampton food, Ste. Louise, Brampton shelter, Kingston food, invalid-place validation, and approved About-page source-context wording.

## Seven-Record Production Data Sync Completed

The approved sync upserted only these IDs:

- `brampton-peel-centralized-shelter-intake`
- `brampton-wilkinson-road-shelter`
- `brampton-victim-services-of-peel`
- `brampton-safe-centre-of-peel`
- `brampton-peel-ontario-works-emergency-assistance`
- `brampton-regeneration-marketplace-food-bank`
- `brampton-knights-table-food-bank-meals`

Post-sync read-only database checks found:

- 7 of 7 approved IDs present.
- 7 of 7 with `primary_place_id = 'brampton-on'`.
- 7 of 7 with `scope is null`.
- 7 of 7 with explicit `coverage`.
- 7 of 7 with embeddings.
- 203 total production services and 203 services with coverage.

## Seven-Record Production Data Sync Scope

Only these IDs were in scope:

- `brampton-peel-centralized-shelter-intake`
- `brampton-wilkinson-road-shelter`
- `brampton-victim-services-of-peel`
- `brampton-safe-centre-of-peel`
- `brampton-peel-ontario-works-emergency-assistance`
- `brampton-regeneration-marketplace-food-bank`
- `brampton-knights-table-food-bank-meals`

The bounded sync helper selects these exact IDs from `data/services.json`, attaches existing 384-dimensional embeddings from `data/embeddings.json`, sets legacy `scope` to null for those upsert rows, and upserts no other rows.

## Eight-Record Follow-Up Sync Completed

The approved follow-up sync wrote only these IDs:

- `brampton-peel-centralized-shelter-intake`
- `brampton-wilkinson-road-shelter`
- `brampton-victim-services-of-peel`
- `brampton-safe-centre-of-peel`
- `brampton-peel-ontario-works-emergency-assistance`
- `brampton-regeneration-marketplace-food-bank`
- `brampton-knights-table-food-bank-meals`
- `brampton-ste-louise-food-bank`

Rollback SQL was prepared before apply and was not executed. Post-sync checks confirmed `primary_place_id = 'brampton-on'`, explicit `coverage`, null legacy `scope`, and 384-dimensional embeddings for all eight IDs. Six records are L2; Knights Table and Ste. Louise remain L1.

## Application Smoke Checks After Original Seven-Record Data Sync Approval

- Public health returned healthy with `version: "d7cc6e4"`.
- Kingston selected-place food search still returned live results.
- Brampton selected-place `shelter` and `food` searches returned the approved Brampton first launch set.
- Brampton selected-place food search with limit 50 returned no obvious Kingston-only IDs.
- `/api/v1/search/services` still rejects invalid `filters.placeId` with `400 Invalid request`.
- Public search introduces no raw user query logging or tracking; the search route records only boolean/length metadata through existing performance tracking.
- Broad Ontario/Canada records did not appear in Brampton selected-place smokes because several existing production broad records still carry Kingston-local coverage. This is a separate production data correction from the seven Brampton-row sync.

## Application Smoke Checks After Eight-Record Follow-Up

- Public health returned healthy with `version: "add8b2f0dbdd"`.
- Brampton selected-place food search included Ste. Louise, Knights Table, Regeneration, applicable broad Ontario/Canada records, and the other Brampton launch records.
- Brampton selected-place Ste. Louise search returned `brampton-ste-louise-food-bank`.
- Brampton selected-place shelter search included shelter records.
- Kingston selected-place food search still returned live results.
- `/api/v1/search/services` still rejects invalid `filters.placeId` with `400 Invalid request`.
- `/en/about` contained the approved Brampton source-review context wording.

## Broad Coverage Correction Prep

Prepared artifacts:

- Approval packet: `docs/launch/brampton-broad-coverage-correction-approval.md`
- Read-only snapshot rows: `/tmp/careconnect-production-services-coverage-snapshot.rows.json`
- Apply SQL: `/tmp/careconnect-broad-coverage-correction.sql`
- Rollback SQL: `/tmp/careconnect-broad-coverage-rollback.sql`
- Applied SQL after production enum cast: `/tmp/careconnect-broad-coverage-correction-service-scope-cast.sql`
- Rollback SQL after production enum cast: `/tmp/careconnect-broad-coverage-rollback-service-scope-cast.sql`
- Manifest: `/tmp/careconnect-broad-coverage-correction-manifest.json`
- Verifier command:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run sync:broad-coverage:verify -- \
  --manifest /tmp/careconnect-broad-coverage-correction-manifest.json
```

Dry-run summary:

- 203 production rows read.
- 72 existing broad records selected for correction.
- 49 provincial records and 23 national records.
- Generated SQL updates only `scope`, `primary_place_id`, and `coverage`.
- Generated SQL has exact 72-row assertions.
- Generated SQL references no `brampton-` IDs.
- Manifest records apply SQL SHA-256 `c6bbeebbdb1695b55b009e5a99b6b412322f9c0e5c987bf6f87cc19bfe8211ee` and rollback SQL SHA-256 `5ff03a4fc2de73b7566a542698ead7cfdece01f96d755c8b8902dab292878665`.
- Manifest verifier result on 2026-07-08: `ok: true`, including reviewed-ID set, byte-count, hash, guardrail, and dry-run-only checks.
- Production write was executed after owner approval. The first reviewed SQL attempt made no changes because production required an explicit `service_scope` cast. The cast-corrected apply SQL updated exactly 72 rows and post-correction checks passed.

## Rollback Boundaries

- Application rollback can revert to the previous release after explicit approval, but rollback is not currently indicated by the post-deploy smoke checks.
- Data correction must use a follow-up reviewed data commit or an explicitly approved production correction.
- The prepared seven-ID Brampton data rollback is in `docs/launch/brampton-seven-id-data-rollback-prep.md` and was not executed.
- The eight-record follow-up rollback SQL was prepared before the follow-up sync and was not executed. It must not be executed without explicit approval.
- The broad-record correction rollback SQL is prepared locally, including the production enum-cast version, but must not be executed without explicit approval.
- Schema rollback requires separate database rollback approval.
