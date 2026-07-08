# Brampton Production Approval Packet

Date: 2026-07-07
Updated: 2026-07-08
Status: migration and deployment approved/applied; seven-record production data sync still required

## Decision Needed

Approve or reject syncing the seven approved Brampton L1 service rows into production Supabase.

## What Is Already Confirmed

- The linked production database was inspected read-only through the Supabase CLI.
- `services.primary_place_id` and `services.coverage` are absent before migration.
- `services_public.primary_place_id` and `services_public.coverage` are absent before migration.
- The previous provenance-sanitizing public-view migration is applied.
- `services_public` uses `security_invoker=true`.
- `services` has RLS enabled.
- Existing live grants are broader than the repo baseline, so the pending migration now explicitly revokes `services_public` privileges before granting expected read access.
- The Brampton coverage migration was applied after owner approval using the exact reviewed SQL from `supabase/migrations/20260706120000_add_service_coverage_place_fields.sql`.
- Supabase recorded the applied remote migration as `20260708005230 add_service_coverage_place_fields` because the normal `db push` path is blocked by historical migration drift.
- CareConnect `main` commit `d7cc6e4` was deployed after owner approval, and public health checks returned `version: "d7cc6e4"`.
- Read-only production checks on 2026-07-08 confirmed the seven approved Brampton IDs are not yet present in production `services`.
- Live Brampton selected-place searches return valid empty result sets until the seven approved rows are synced.
- The private/shared operations register records CareConnect-specific restore/provider proof as a planned target, not a completed proof.

## Must Not Proceed Until

- The exact target environment is confirmed.
- The approving human explicitly authorizes syncing exactly the seven approved Brampton L1 rows.
- A data correction owner and decision path are identified.

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

## Seven-Record Production Data Sync Scope

Only these IDs are in scope:

- `brampton-peel-centralized-shelter-intake`
- `brampton-wilkinson-road-shelter`
- `brampton-victim-services-of-peel`
- `brampton-safe-centre-of-peel`
- `brampton-peel-ontario-works-emergency-assistance`
- `brampton-regeneration-marketplace-food-bank`
- `brampton-knights-table-food-bank-meals`

The bounded sync helper must select these exact IDs from `data/services.json`, attach existing 384-dimensional embeddings from `data/embeddings.json`, and upsert no other rows.

## Application Smoke Checks After Data Sync Approval

- Kingston selected-place search returns Kingston-local records and broad Ontario/Canada records.
- Brampton selected-place search returns the approved Brampton first launch set and broad Ontario/Canada records.
- Brampton selected-place search does not return Kingston-only local services.
- `/api/v1/search/services` rejects invalid `filters.placeId` with `400`.
- Public search introduces no user query logging or tracking.

## Rollback Boundaries

- Application rollback can revert to the previous release after explicit approval, but rollback is not currently indicated by the post-deploy smoke checks.
- Data correction must use a follow-up reviewed data commit or an explicitly approved seven-ID production correction.
- Schema rollback requires separate database rollback approval.
