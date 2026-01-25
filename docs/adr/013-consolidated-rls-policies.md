# ADR 013: Consolidated RLS Policies and Security Hardening

## Status

Accepted

## Date

2026-01-26

## Context

As the application grew, the Row Level Security (RLS) policies for key tables (specifically `services`, `feedback`, and `organization_members`) became fragmented. This led to:

1.  **Overlapping Policies**: Multiple permissive policies applied to the same action (e.g., both "Admins can view all" and "Partners can view own"), causing `multiple_permissive_policies` linter warnings.
2.  **Performance Issues**: Policies were evaluating `auth.uid()` and `auth.role()` repeatedly per row, leading to `auth_rls_initplan` warnings.
3.  **Security Risks**: Some policies (e.g., public inserts) relied on overly broad `WITH CHECK (true)` logic, raising `rls_policy_always_true` warnings.
4.  **Schema Drift**: `SECURITY DEFINER` functions were mutable (lacking fixed `search_path`), and some tables missed standard `updated_at` columns.

## Decision

We decided to adopt a strict "One Policy Per Action Per Role" (or unified per action) strategy and explicitly harden all database artifacts.

### 1. Unified RLS Policies

Instead of having separate policies for "Admins" and "Partners" that both allow `SELECT`, we consolidate them into a single `Unified view policy`.

- **Logic**: `(is_admin() OR is_org_member())`
- **Benefit**: Eliminates policy overlap warnings and makes permission logic easier to trace in a single location.

### 2. Performance Optimization (InitPlan)

We wrap all stable function calls in subqueries to force Postgres to evaluate them once per query (InitPlan) rather than per row.

- **Before**: `auth.role() = 'authenticated'`
- **After**: `(SELECT auth.role()) = 'authenticated'`

### 3. Security Hardening

- **Search Path**: All `SECURITY DEFINER` functions must explicitly set `SET search_path = public, extensions` to prevent search path hijacking.
- **Input Validation**: Public INSERT policies (e.g., for `feedback`) must check for required non-null fields rather than checking `true`.

### 4. scorched-earth Migration Strategy

To resolve the complex web of legacy policies, we employed a "scorched earth" approach in migration `20260126050000...`:

1.  Drop **ALL** existing policies for a table.
2.  Re-create only the strictly necessary, unified policies.
    Sth strategy ensures no "zombie" policies remain from previous iterations.

## Consequences

### Positive

- **Linter Compliance**: The database schema now passes `supabase db lint` with zero errors or warnings (except intentionally ignored config warnings).
- **Performance**: RLS execution is faster due to InitPlan optimization.
- **Maintainability**: Fewer, clearer policies are easier to audit.

### Negative

- **Complexity**: Unified policies are individually more complex (contain `OR` logic) than small, granular policies.
- **Migration Risk**: The "scorched earth" approach requires careful testing to ensure no valid access paths are accidentally removed.

## References

- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
