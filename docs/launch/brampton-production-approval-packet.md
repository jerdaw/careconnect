# Brampton Production Approval Packet

Date: 2026-07-07
Updated: 2026-07-08
Status: migration, deployment, and seven-record Brampton production data sync approved/applied; broad-record coverage correction remains separate

## Decision Needed

Approve or reject a separate production data correction for existing broad Ontario/Canada records that were backfilled as Kingston-local during migration.

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
- The private/shared operations register records CareConnect-specific restore/provider proof as a planned target, not a completed proof.

## Must Not Proceed Until

- The exact target environment is confirmed.
- The approving human explicitly authorizes any broad-record production data correction.
- The approving human explicitly authorizes any seven-ID Brampton data rollback.
- A data correction owner and decision path are identified for any follow-up production data write.

## Backup And Rollback Posture

Current public-safe finding: CareConnect has a documented runtime contract and a planned restore/provider proof target in the private/shared operations source of truth, but the CareConnect-specific proof is not yet recorded as complete. The project owner explicitly accepted this risk for the Brampton migration after the preflight checks passed. Complete the proof as follow-up hardening.

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

## Rollback Boundaries

- Application rollback can revert to the previous release after explicit approval, but rollback is not currently indicated by the post-deploy smoke checks.
- Data correction must use a follow-up reviewed data commit or an explicitly approved production correction.
- The prepared seven-ID Brampton data rollback is in `docs/launch/brampton-seven-id-data-rollback-prep.md` and was not executed.
- Schema rollback requires separate database rollback approval.
