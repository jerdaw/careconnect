# Brampton Production Approval Packet

Date: 2026-07-07
Updated: 2026-07-08
Status: migration, deployment, and seven-record Brampton production data sync approved/applied; broad-record coverage correction dry-run prepared but not applied

## Decision Needed

Approve or reject the separate production data correction for existing broad Ontario/Canada records that were backfilled as Kingston-local during migration. The dry-run approval packet is `docs/launch/brampton-broad-coverage-correction-approval.md`.

Approve or reject executing the prepared seven-ID Brampton data rollback in `docs/launch/brampton-seven-id-data-rollback-prep.md`. Current recommendation: do not roll back unless the intended outcome is to remove Brampton public results, because rollback would not fix the broad-record coverage gap.

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
- CareConnect `main` commit `d7cc6e4` was deployed after owner approval, and public health checks returned `version: "d7cc6e4"`.
- The project owner approved syncing exactly the seven approved Brampton L1 rows to production Supabase.
- The seven approved Brampton IDs are present in production `services` with `primary_place_id = 'brampton-on'`, null legacy `scope`, explicit coverage, and embeddings.
- Live Brampton selected-place searches return the approved seven-record first-launch set.
- A post-sync broad-service smoke found that existing production broad records such as `ontario-211-ontario`, `kids-help-phone`, and `ontario-naseeha` still have `coverage` backfilled as local `kingston-on`; this needs a separate approved correction.
- A read-only production snapshot found 203 rows and generated dry-run SQL for 72 broad-record corrections: 49 provincial and 23 national. The prepared SQL updates only `scope`, `primary_place_id`, and `coverage`, references no Brampton launch IDs, and has a prepared rollback SQL file.
- The broad-record correction manifest verifier passed on 2026-07-08. It confirmed the prepared apply and rollback SQL reviewed-ID sets, byte counts, hashes, SQL guardrails, 72 reviewed IDs, and `writesEnabled: false`.
- A fresh read-only production check on 2026-07-08 confirmed the seven Brampton rows remain live with Brampton coverage and embeddings, while a five-ID reviewed broad-record sample still has only one broad-shaped record; the broad correction remains unapplied.
- Supabase Support reported triggering a latest-backup restore for the target project on 2026-07-08. Post-restore public health, live schema, service-count, seven-row Brampton, and Kingston/Brampton search smokes passed. Detailed support evidence and project identifiers remain in private/shared operations material, not this public repo.

## Must Not Proceed Until

- The exact target environment is confirmed.
- The approving human explicitly authorizes any broad-record production data correction.
- The approving human explicitly authorizes any seven-ID Brampton data rollback.
- A data correction owner and decision path are identified for any follow-up production data write.

The required approval text for the broad-record correction is recorded in `docs/launch/brampton-broad-coverage-correction-approval.md`.

## Backup And Rollback Posture

Current public-safe finding: CareConnect has provider-assisted restore evidence from Supabase Support for a latest-backup restore triggered on 2026-07-08. Post-restore app health, live schema, service-count, seven-row Brampton, and Kingston/Brampton search smokes passed. Keep the detailed support trail in the private/shared operations source of truth. Recurring autonomous restore-proof automation remains follow-up hardening through the private/shared operations workflow.

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

- Public health returned healthy with `version: "d7cc6e4"`.
- `/` redirected to `/en`.
- `/en` loaded successfully.
- Kingston selected-place food search returned live results.
- Invalid `filters.placeId` returned `400 Invalid request`.
- Brampton selected-place `shelter` and `food` searches returned valid empty result sets before production data sync.

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

## Application Smoke Checks After Data Sync Approval

- Public health returned healthy with `version: "d7cc6e4"`.
- Kingston selected-place food search still returned live results.
- Brampton selected-place `shelter` and `food` searches returned the approved Brampton first launch set.
- Brampton selected-place food search with limit 50 returned no obvious Kingston-only IDs.
- `/api/v1/search/services` still rejects invalid `filters.placeId` with `400 Invalid request`.
- Public search introduces no raw user query logging or tracking; the search route records only boolean/length metadata through existing performance tracking.
- Broad Ontario/Canada records did not appear in Brampton selected-place smokes because several existing production broad records still carry Kingston-local coverage. This is a separate production data correction from the seven Brampton-row sync.

## Broad Coverage Correction Prep

Prepared artifacts:

- Approval packet: `docs/launch/brampton-broad-coverage-correction-approval.md`
- Read-only snapshot rows: `/tmp/careconnect-production-services-coverage-snapshot.rows.json`
- Apply SQL: `/tmp/careconnect-broad-coverage-correction.sql`
- Rollback SQL: `/tmp/careconnect-broad-coverage-rollback.sql`
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
- Production write was not executed.

## Rollback Boundaries

- Application rollback can revert to the previous release after explicit approval, but rollback is not currently indicated by the post-deploy smoke checks.
- Data correction must use a follow-up reviewed data commit or an explicitly approved production correction.
- The prepared seven-ID Brampton data rollback is in `docs/launch/brampton-seven-id-data-rollback-prep.md` and was not executed.
- The broad-record correction rollback SQL is prepared locally but must not be executed without explicit approval if post-correction smoke checks fail.
- Schema rollback requires separate database rollback approval.
