-- Remove genuinely unused indexes identified via codebase analysis
-- Analysis date: 2026-01-24
-- These indexes were confirmed unused by searching all application code

-- Drop GIN index on push_subscriptions.categories (app only filters by endpoint)
DROP INDEX IF EXISTS idx_push_subscriptions_categories;

-- Drop indexes on service_submissions (write-only table, never queried by app)
DROP INDEX IF EXISTS idx_submissions_status;
DROP INDEX IF EXISTS idx_submissions_created;

-- Drop index on partner_terms_acceptance (table exists but never queried)
DROP INDEX IF EXISTS idx_partner_terms_service_id;

-- Drop indexes on admin_actions (write-only audit table, no SELECT queries)
DROP INDEX IF EXISTS idx_admin_actions_service;
DROP INDEX IF EXISTS idx_admin_actions_action_type;

-- IMPORTANT: The following indexes are USED and should NOT be removed:
-- - idx_mat_feedback_agg_service (used in analytics views)
-- - idx_feedback_created (used for ordering feedback by date)
-- - idx_update_requests_service (used in dashboard queries)
-- - idx_update_requests_status (used for filtering pending requests)
-- - idx_update_requests_requested_by (used for user-specific queries)
-- - idx_notifications_read (used for unread notification counts)
-- - idx_org_invitations_expires (used for pending invitation queries)
-- - idx_reindex_progress_status_started (used in admin reindex status)
-- - idx_analytics_service_id (used in analytics API)
-- - idx_analytics_created_at (used for time-based analytics)
-- - idx_feedback_service (used for feedback lookups)
-- - idx_org_members_org (used heavily for member queries)
-- - idx_org_invitations_org (used for invitation lookups)
-- - idx_services_deleted_at (used in export filters)
--
-- Supabase's linter may report these as "unused" due to low query volume
-- or because queries go through views/functions rather than direct table access.
