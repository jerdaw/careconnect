# Runbook: Remote Migration History Repair

## Overview

After the v20.0 migration recovery, the repository's migration chain was rebuilt
from scratch. The local chain is now:

1. `20260101000000_baseline.sql` — consolidated schema baseline
2. `20260308120000_v22_pilot_phase0_tables.sql`
3. `20260308121000_v22_harden_bulk_update_service_status_admin_check.sql`
4. `20260311032000_fix_rls_recursion_for_org_members_and_services.sql`

The hosted Supabase project's `supabase_migrations.schema_migrations` table
still contains the old 38-migration history. This runbook reconciles the two.

## Prerequisites

- Supabase CLI linked to the remote project (`npx supabase link`)
- `SUPABASE_SECRET_KEY` set in environment
- Database backup taken before proceeding

## Steps

### 1. Take a backup

```bash
npx supabase db dump -f pre-repair-backup.sql
```

### 2. Check current remote migration state

```bash
npx supabase migration list
```

You should see all 38 old migration timestamps listed as `applied`.

### 3. Mark old migrations as reverted

For each old migration that was absorbed into the baseline, mark it as reverted:

```bash
npx supabase migration repair 002_v6_prerequisites --status reverted
npx supabase migration repair 003_org_members --status reverted
npx supabase migration repair 004_feedback --status reverted
npx supabase migration repair 20251230143500 --status reverted
npx supabase migration repair 20260103 --status reverted
npx supabase migration repair 20260108000001 --status reverted
npx supabase migration repair 20260108150000 --status reverted
npx supabase migration repair 20260112000000 --status reverted
npx supabase migration repair 20260113080000 --status reverted
npx supabase migration repair 20260113140000 --status reverted
npx supabase migration repair 20260113190000 --status reverted
npx supabase migration repair 2026011400131100 --status reverted
npx supabase migration repair 20260115000000 --status reverted
npx supabase migration repair 20260115000001 --status reverted
npx supabase migration repair 20260115000002 --status reverted
npx supabase migration repair 20260115000003 --status reverted
npx supabase migration repair 20260116000000 --status reverted
npx supabase migration repair 20260120000000 --status reverted
npx supabase migration repair 20260121000000 --status reverted
npx supabase migration repair 20260122000000 --status reverted
npx supabase migration repair 20260123000000 --status reverted
npx supabase migration repair 20260124000000 --status reverted
npx supabase migration repair 20260124000001 --status reverted
npx supabase migration repair 20260124000002 --status reverted
npx supabase migration repair 20260124010000 --status reverted
npx supabase migration repair 20260125000000 --status reverted
npx supabase migration repair 20260126000000 --status reverted
npx supabase migration repair 20260126010000 --status reverted
npx supabase migration repair 20260126020000 --status reverted
npx supabase migration repair 20260126030000 --status reverted
npx supabase migration repair 20260126040000 --status reverted
npx supabase migration repair 20260126050000 --status reverted
npx supabase migration repair 20260126060000 --status reverted
npx supabase migration repair 20260126070000 --status reverted
npx supabase migration repair 20260126080000 --status reverted
npx supabase migration repair 20260126090000 --status reverted
npx supabase migration repair 20260126100000 --status reverted
npx supabase migration repair 20260126110000 --status reverted
```

### 4. Mark the baseline as applied

The new baseline was not actually run remotely (the schema already exists),
so mark it as applied without re-running the SQL:

```bash
npx supabase migration repair 20260101000000 --status applied
```

### 5. Verify the forward migrations

The three forward migrations should already be `applied` in the remote history.
Verify with:

```bash
npx supabase migration list
```

Expected state:

- `20260101000000` — applied
- `20260308120000` — applied
- `20260308121000` — applied
- `20260311032000` — applied
- All others — reverted

### 6. Confirm with db push (dry run)

```bash
npx supabase db push --dry-run
```

Should report no pending migrations.

## Rollback

If anything goes wrong, restore from the backup:

```bash
psql "$DATABASE_URL" < pre-repair-backup.sql
```

Then re-run `npx supabase migration repair` to undo the status changes.
