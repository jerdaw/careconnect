---
status: stable
last_updated: 2026-01-15
owner: jer
tags: [security, database, rls]
---

# Database Security & Row Level Security (RLS)

## Overview

CareConnect uses Supabase PostgreSQL with Row Level Security (RLS) to ensure data security and privacy. This document outlines our security model, RLS policies, and best practices.

## Security Model

### Public Access

The following data is accessible to anonymous users (`anon` role):

- **Published Services** (`services_public` view): Only services with `published = true` and `verification_status NOT IN ('draft', 'archived')`
- **Analytics Events** (`analytics_events`): Read-only aggregate data (no PII)
- **Plain Language Summaries** (`plain_language_summaries`): Public educational content
- **Feedback Aggregations** (materialized views): Anonymous impact metrics for transparency

### Authenticated Access

Users authenticated via Supabase Auth have access to:

- **Organization Management**: View and manage their own organizations
- **Organization Members**: Invite, view, and manage members within their organization
- **Service Claims**: Claim unclaimed services for their organization
- **Service Updates**: Request and approve updates to services they manage
- **Plain Language Content**: Create and manage summaries (admin/backend processes)

### Service Role

The `service_role` (backend/system) has elevated privileges for:

- **Notification Audit**: Insert and view notification logs
- **Admin Operations**: Bypass RLS for system maintenance

## Row Level Security Policies

### `services_public` View

**Security Note**: This view is intentionally created with `security_invoker = true` (not `SECURITY DEFINER`) to ensure it runs with the permissions of the querying user, not the view creator.

```sql
CREATE VIEW services_public
WITH (security_invoker = true)
AS SELECT ... FROM services
WHERE published = true
  AND (verification_status IS NULL OR verification_status NOT IN ('draft', 'archived'));
```

### `analytics_events` Table

**INSERT Policy**: `Public can record views`

- **Roles**: `anon`, `authenticated`
- **Constraint**: Requires valid `service_id` that exists in `services_public`
- **Purpose**: Prevents spam/invalid analytics events

```sql
WITH CHECK (
  service_id IS NOT NULL
  AND service_id IN (SELECT id FROM services_public)
)
```

### `partner_terms_acceptance` Table

**INSERT Policy**: `Enable insert for public claim flow`

- **Constraint**: Requires valid `service_id` and non-empty `user_email`
- **Purpose**: Ensures data quality for partner claims

**SELECT Policy**: `Enable select for admins`

- **Roles**: `service_role`
- **Optimization**: Uses `(SELECT auth.role())` for performance

### `service_submissions` Table

**INSERT Policy**: `Public can submit`

- **Roles**: `anon`, `authenticated`
- **Constraint**: Requires non-empty `name` and `description`
- **Purpose**: Prevents empty submissions

### `organizations` Table

**SELECT Policy**: `Members can view own organization`

- **Constraint**: User must be a member via `organization_members`

**UPDATE/DELETE Policies**: `Admins can update/delete organization`

- **Constraint**: User must have `owner` or `admin` role

### `organization_members` Table

**SELECT Policy**: `Members can view org members`

- **Constraint**: User must be a member of the organization

**INSERT/UPDATE/DELETE Policies**: `Admins can manage members`

- **Constraint**: User must have `owner` or `admin` role
- **Note**: Separated into individual policies per operation to avoid "Multiple Permissive Policies" performance warning

### `service_update_requests` Table

**SELECT Policy**: `Users can view service requests`

- **Constraint**: User must be a member of the organization that owns the service

**INSERT Policy**: `Partners can create requests`

- **Constraint**: User must be a member of the organization that owns the service

**UPDATE/DELETE Policies**: `Admins can update/delete requests`

- **Constraint**: User must have `owner` or `admin` role in the organization

### `plain_language_summaries` Table

**SELECT Policy**: `Anyone can read summaries` (public)

**INSERT/UPDATE/DELETE Policies**: `Authenticated can write/update/delete summaries`

- **Constraint**: Requires valid `service_id` that exists in `services` table
- **Note**: In practice, managed by backend/admin processes

### `notification_audit` Table

**INSERT Policy**: `Service role can insert notifications`

- **Roles**: `service_role` only
- **Purpose**: System-only access for notification logging

**SELECT Policy**: `Admins can view notification audit`

- **Roles**: `service_role` only

### `push_subscriptions` Table

**ALL Policy**: `Service role only`

- **Roles**: `service_role`
- **Optimization**: Uses `(SELECT auth.role())` for scalar subquery performance

### `feedback` Table

**INSERT Policy**: `Anyone can submit feedback`

- **Roles**: `anon`, `authenticated`
- **Constraint**: Requires non-empty `feedback_type`
- **Privacy**: No PII, no persistent user IDs

## Performance Optimizations

### Auth Function Calls

To avoid re-evaluating `auth.role()` and `auth.uid()` for each row, we wrap them in SELECT subqueries:

```sql
-- ❌ Bad: Re-evaluates for each row
USING (auth.uid() = user_id)

-- ✅ Good: Evaluated once
USING ((SELECT auth.uid()) = user_id)
```

### Consolidating Permissive Policies

Multiple permissive policies for the same `role` and `action` cause performance issues. We consolidate by:

1. Separating `FOR ALL` into `FOR SELECT/INSERT/UPDATE/DELETE`
2. Combining multiple SELECT policies using `OR` logic

## Intentional Security Warnings

The following Supabase linter warnings are **expected and intentional**:

### Materialized Views in API

- **Tables**: `feedback_aggregations`, `unmet_needs_summary`
- **Reason**: Intentionally exposed for public transparency on the `/impact` page
- **Mitigation**: Views contain only aggregated, anonymized data (no PII)

### Unused Indexes

- **Level**: INFO (not security/performance critical)
- **Reason**: Indexes prepared for future features and query patterns
- **Policy**: Keep unless database becomes resource-constrained

## Testing RLS Policies

See `tests/integration/rls-policies.test.ts` for automated RLS policy tests that verify:

1. Anonymous users can read published services
2. Authenticated users can manage their own organizations
3. Admins can update/delete within their organizations
4. Service-role can insert notification audits
5. Invalid data is rejected by policies

## Migration Strategy

All RLS policy changes are versioned in `supabase/migrations/`. Key migrations:

- `20260115000000_security_remediations.sql`: Initial security hardening
- `20260115000001_performance_remediations.sql`: Performance optimizations
- `20260115000002_additional_security_fixes.sql`: SECURITY DEFINER removal
- `20260115000003_final_rls_fixes.sql`: Policy consolidation

## Security Audits

Last audited: 2026-01-14 (v16.0)

All CRITICAL and ERROR-level Supabase linter warnings have been resolved. Remaining WARN-level items are documented above as intentional design decisions.

## Best Practices

1. **Never use `SECURITY DEFINER`** on views unless absolutely necessary
2. **Always validate foreign keys** in RLS policies (e.g., `service_id IN (SELECT id FROM services)`)
3. **Use scalar subqueries** for auth functions: `(SELECT auth.uid())`
4. **Separate policies by operation** to avoid "Multiple Permissive Policies" warnings
5. **Test RLS policies** in integration tests before deploying
6. **Document intentional warnings** to avoid confusion in future audits
