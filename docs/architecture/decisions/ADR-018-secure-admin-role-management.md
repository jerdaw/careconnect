# ADR 018: Secure Admin Role Management

## Status

Accepted

## Date

2026-01-24

## Context

Previously, the application determined admin privileges by checking the `user_metadata` JSON field on the `auth.users` table (specifically `user_metadata->'role' = 'admin'`).

The Supabase linter flagged this as a security vulnerability (`rls_references_user_metadata`). The `user_metadata` field is often editable by the user themselves (depending on configuration) and generally considered "user profile" data rather than "system authorization" data. Relying on it for critical security boundaries (Row Level Security) is risky.

## Decision

We have decided to move admin authorization to a dedicated, secure relational table: `app_admins`.

1.  **New Table**: `public.app_admins` tracks `user_id` (foreign key to `auth.users`).
2.  **Source of Truth**: Presence in this table grants admin privileges.
3.  **RLS Implementation**: RLS policies for critical tables (`services`, `admin_actions`, etc.) now check `EXISTS (SELECT 1 FROM app_admins WHERE user_id = auth.uid())`.
4.  **Helper Function**: A `SECURITY DEFINER` function `is_admin()` encapsulates this logic for reuse in policies.
5.  **Search Paths**: All secure functions explicitly set `search_path` to `public` to prevent path hijacking.

## Consequences

### Positive

- **Enhanced Security**: Admin status is now controlled solely by database administrators via SQL/migrations and cannot be tampered with by users.
- **Compliance**: Resolves the Supabase security linter errors.
- **Clarity**: Admin management is explicit (rows in a table) rather than implicit (JSON properties).

### Negative

- **Operational Overhead**: Granting admin rights now requires a database operation (SQL `INSERT`) rather than just updating a user's metadata via the dashboard UI or client.
- **Migration**: Existing admins (based on metadata) are not automatically migrated; they must be manually inserted into the new table.

## Implementation References

- Migration: `supabase/migrations/20260101000000_baseline.sql`
- Security verification reference: `docs/security/2026-01-20-v17-0-safety-audit.md`
