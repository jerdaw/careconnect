# Brampton Production Approval Packet

Date: 2026-07-07
Status: approval required before any production write, migration, deploy, merge, or rollback

## Decision Needed

Approve or reject applying the Brampton coverage migration and deploying the multi-city application release.

## What Is Already Confirmed

- The linked production database was inspected read-only through the Supabase CLI.
- `services.primary_place_id` and `services.coverage` are absent before migration.
- `services_public.primary_place_id` and `services_public.coverage` are absent before migration.
- The previous provenance-sanitizing public-view migration is applied.
- `services_public` uses `security_invoker=true`.
- `services` has RLS enabled.
- Existing live grants are broader than the repo baseline, so the pending migration now explicitly revokes `services_public` privileges before granting expected read access.
- The Brampton coverage migration has not been applied.
- The private/shared operations register records CareConnect-specific restore/provider proof as a planned target, not a completed proof.

## Must Not Proceed Until

- Backup/restore posture is either proven through the approved private operations source of truth or explicitly accepted as a known release risk by the approving human.
- The exact target environment is confirmed.
- The approving human explicitly authorizes the migration and deployment.
- A rollback owner and decision path are identified.

## Backup And Rollback Posture

Current public-safe finding: CareConnect has a documented runtime contract and a planned restore/provider proof target in the private/shared operations source of truth, but the CareConnect-specific proof is not yet recorded as complete. Do not treat backup/rollback posture as confirmed for Brampton production approval unless that proof is completed or the approving human explicitly accepts the risk for this release.

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

## Migration Command

Do not run this command without explicit approval:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db push --linked
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

## Application Smoke Checks After Deploy Approval

- Kingston selected-place search returns Kingston-local records and broad Ontario/Canada records.
- Brampton selected-place search returns the approved Brampton first launch set and broad Ontario/Canada records.
- Brampton selected-place search does not return Kingston-only local services.
- `/api/v1/search/services` rejects invalid `filters.placeId` with `400`.
- Public search introduces no user query logging or tracking.

## Rollback Boundaries

- Application rollback can revert to the previous release after deploy approval.
- Data correction must use a follow-up reviewed data commit.
- Schema rollback requires separate database rollback approval.
