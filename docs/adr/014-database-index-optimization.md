# ADR 014: Database Index Optimization

## Status

Accepted

## Date

2026-01-24

## Context

Supabase's performance advisor flagged 33 potential performance issues in the database:

1. **Unindexed Foreign Keys (4 warnings)**: Foreign key columns without covering indexes, which can impact JOIN performance.
2. **Unused Indexes (29 warnings)**: Indexes that Postgres has never used according to `pg_stat_user_indexes`, potentially wasting storage and slowing writes.

Before taking action, a comprehensive codebase analysis was performed to determine:

- Which foreign keys are actually queried in JOINs or WHERE clauses
- Which indexes are genuinely unused vs. false positives due to low traffic
- Whether audit/provenance fields require indexes

## Decision

We adopted a data-driven approach to index management:

### 1. Audit-Only Foreign Keys: No Indexes

The following foreign keys are **write-only audit fields** never used in queries:

- `audit_logs.performed_by`
- `notification_audit.sent_by`
- `organization_invitations.accepted_by`
- `organization_invitations.invited_by`
- `organization_members.invited_by`
- `services.deleted_by`
- `services.reviewed_by`
- `partner_terms_acceptance.service_id`

**Decision**: Leave these unindexed. Adding indexes would slow down INSERT/UPDATE operations with zero query benefit.

### 2. Genuinely Unused Indexes: Remove

Through codebase analysis, 18 indexes were confirmed as genuinely unused:

**Migration 1 (20260124000001_optimize_indexes.sql)**:

- `idx_org_invitations_email` - Email never filtered
- `idx_org_invitations_token` - Token lookup only in DB functions
- `idx_services_scope` - Filtering happens client-side
- `idx_services_authority_tier` - Scoring done in-memory
- `idx_audit_logs_record` - Write-only table
- `idx_audit_logs_performed_by` - Write-only table
- `idx_audit_logs_performed_at` - Write-only table
- `idx_notification_audit_sent_by` - Write-only table
- `idx_notification_audit_sent_at` - Write-only table
- `idx_notification_audit_onesignal_id` - Write-only table
- `idx_org_members_invited_by` - Never queried
- `idx_feedback_status` - Client-side filtering only

**Migration 2 (20260124000002_remove_unused_indexes.sql)**:

- `idx_push_subscriptions_categories` - GIN index unused (only filters by endpoint)
- `idx_submissions_status` - Table never queried
- `idx_submissions_created` - Table never queried
- `idx_partner_terms_service_id` - Table never queried
- `idx_admin_actions_service` - Write-only audit table
- `idx_admin_actions_action_type` - Write-only audit table

### 3. Missing Critical Index: Add

Dashboard queries for `service_update_requests` were performing table scans:

```typescript
.eq("requested_by", user.email)
.eq("status", "pending")
```

**Decision**: Added composite index `idx_service_update_requests_requested_by_status` on `(requested_by, status)`.

### 4. False Positives: Keep

15 indexes flagged as "unused" are **actively used** but not detected due to:

- Low query volume (development/staging environment)
- Queries going through views/functions rather than direct table access
- Postgres statistics not yet accumulated

These indexes are retained:

- `idx_mat_feedback_agg_service` - Used in analytics views
- `idx_analytics_service_id` - Used in analytics API
- `idx_analytics_created_at` - Time-based analytics
- `idx_feedback_service` - Feedback lookups
- `idx_feedback_created` - Ordering feedback by date
- `idx_update_requests_service` - Dashboard queries
- `idx_update_requests_status` - Filter by pending
- `idx_update_requests_requested_by` - User-specific queries
- `idx_org_members_org` - Heavy usage in member management
- `idx_notifications_read` - Unread notification counts
- `idx_org_invitations_org` - Invitation lookups
- `idx_org_invitations_expires` - Pending invitation cleanup
- `idx_services_deleted_at` - Export filtering
- `idx_reindex_progress_status_started` - Admin reindex status

## Consequences

### Positive

- **Performance**: Removed 18 unused indexes, reducing storage overhead and improving write performance
- **Query Optimization**: Added 1 critical missing index for dashboard queries
- **Code-First Validation**: Every index decision was validated against actual application code, not just static analysis
- **Clear Documentation**: Future developers can reference this ADR to understand why certain foreign keys are intentionally unindexed

### Negative

- **Ongoing Warnings**: Supabase will continue to flag the 8 unindexed foreign keys and 15 "unused" indexes as INFO-level warnings
- **Manual Validation**: Requires periodic review of warnings as the application evolves

### Neutral

- **Postgres Statistics**: As production traffic increases, Postgres will recognize more of the "unused" indexes as actively used

## Implementation

Two migrations were created:

1. **20260124000001_optimize_indexes.sql**: Removed 12 unused indexes, added 1 critical index
2. **20260124000002_remove_unused_indexes.sql**: Removed 6 additional unused indexes

Both migrations use `IF EXISTS` guards to ensure idempotency.

## Future Considerations

- Run `ANALYZE` on tables periodically to help Postgres recognize index usage
- Re-evaluate warnings after production traffic accumulates for 2-4 weeks
- Consider removing `partner_terms_acceptance`, `service_submissions`, and `admin_actions` tables entirely if they remain unused

## References

- [Supabase Database Linter - Unindexed Foreign Keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
- [Supabase Database Linter - Unused Indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)
- [PostgreSQL Index Usage Statistics](https://www.postgresql.org/docs/current/monitoring-stats.html#MONITORING-PG-STAT-USER-INDEXES-VIEW)
