-- Remove unused indexes identified by Supabase performance advisor
-- Analysis date: 2026-01-24
-- See: docs/adr/adr-014-index-optimization.md (if you want to document this)

-- Drop unused indexes on organization_invitations (email and token are never filtered)
DROP INDEX IF EXISTS idx_org_invitations_email;
DROP INDEX IF EXISTS idx_org_invitations_token;

-- Drop unused indexes on services (scope/authority filtering happens client-side)
DROP INDEX IF EXISTS idx_services_scope;
DROP INDEX IF EXISTS idx_services_authority_tier;

-- Drop all indexes on audit_logs (write-only table, no SELECT queries in app)
DROP INDEX IF EXISTS idx_audit_logs_record;
DROP INDEX IF EXISTS idx_audit_logs_performed_by;
DROP INDEX IF EXISTS idx_audit_logs_performed_at;

-- Drop all indexes on notification_audit (write-only table, no SELECT queries in app)
DROP INDEX IF EXISTS idx_notification_audit_sent_by;
DROP INDEX IF EXISTS idx_notification_audit_sent_at;
DROP INDEX IF EXISTS idx_notification_audit_onesignal_id;

-- Drop unused index on organization_members (invited_by is never queried)
DROP INDEX IF EXISTS idx_org_members_invited_by;

-- Drop unused index on feedback (status filtering is client-side)
DROP INDEX IF EXISTS idx_feedback_status;

-- ADD missing index on service_update_requests (actively queried in dashboard)
-- Dashboard queries: .eq("requested_by", email).eq("status", "pending")
CREATE INDEX IF NOT EXISTS idx_service_update_requests_requested_by_status
  ON service_update_requests(requested_by, status);

-- Optional: Add created_at to the composite index for ORDER BY optimization
-- CREATE INDEX IF NOT EXISTS idx_service_update_requests_requested_by_status_created
--   ON service_update_requests(requested_by, status, created_at DESC);

COMMENT ON INDEX idx_service_update_requests_requested_by_status IS
  'Supports dashboard queries filtering by requested_by and status';
