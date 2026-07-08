# Brampton Seven-ID Data Rollback Prep

Date: 2026-07-08
Status: prepared for approval only; not executed

## Why This Exists

The approved seven-record Brampton data sync completed, and Brampton selected-place searches now return the approved first-launch set. A separate post-sync broad-coverage smoke check found that existing production broad Ontario/Canada records such as `ontario-211-ontario`, `kids-help-phone`, and `ontario-naseeha` still have production coverage backfilled as Kingston-local. Rolling back the seven Brampton rows would not fix that broad-coverage issue.

This rollback is prepared only because the production sync approval required an exact seven-ID rollback path if post-sync smoke checks failed. Do not execute it without explicit human approval.

## Scope

Rollback would delete only these seven rows from production `public.services`:

- `brampton-peel-centralized-shelter-intake`
- `brampton-wilkinson-road-shelter`
- `brampton-victim-services-of-peel`
- `brampton-safe-centre-of-peel`
- `brampton-peel-ontario-works-emergency-assistance`
- `brampton-regeneration-marketplace-food-bank`
- `brampton-knights-table-food-bank-meals`

Rollback would not:

- change schema,
- change app deployment,
- change land acknowledgment or partner wording,
- correct existing broad Ontario/Canada coverage rows,
- remove any Kingston records.

## Exact SQL

```sql
begin;

do $$
declare
  deleted_count integer;
begin
  delete from public.services
  where id in (
    'brampton-peel-centralized-shelter-intake',
    'brampton-wilkinson-road-shelter',
    'brampton-victim-services-of-peel',
    'brampton-safe-centre-of-peel',
    'brampton-peel-ontario-works-emergency-assistance',
    'brampton-regeneration-marketplace-food-bank',
    'brampton-knights-table-food-bank-meals'
  );

  get diagnostics deleted_count = row_count;

  if deleted_count <> 7 then
    raise exception 'Expected to delete exactly 7 Brampton rows, deleted %', deleted_count;
  end if;
end $$;

commit;
```

## Post-Rollback Checks

If approved and executed, rerun:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select count(*)::int as approved_brampton_rows from public.services where id in ('brampton-peel-centralized-shelter-intake', 'brampton-wilkinson-road-shelter', 'brampton-victim-services-of-peel', 'brampton-safe-centre-of-peel', 'brampton-peel-ontario-works-emergency-assistance', 'brampton-regeneration-marketplace-food-bank', 'brampton-knights-table-food-bank-meals');"
```

Expected after rollback: `approved_brampton_rows` is `0`.

Also rerun Brampton and Kingston public search smokes to confirm the rollback produced the intended public behavior.
