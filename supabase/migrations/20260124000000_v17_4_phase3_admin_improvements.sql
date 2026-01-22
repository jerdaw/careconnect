-- =====================================================================================
-- Migration: v17.4 Phase 3 - Admin Panel Improvements
-- =====================================================================================
-- Purpose: Support admin panel features including reindex progress tracking,
--          improved service management, and admin audit logging
-- Date: 2026-01-24
-- Phase: 3 of 4
-- =====================================================================================

-- =====================================================================================
-- 1. REINDEX PROGRESS TRACKING TABLE
-- =====================================================================================
-- Tracks the progress of embedding generation/reindexing operations
-- Allows admin to monitor long-running reindex tasks

CREATE TABLE IF NOT EXISTS reindex_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_services INT NOT NULL,
  processed_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'complete', 'error', 'cancelled')),
  error_message TEXT,
  triggered_by UUID REFERENCES auth.users(id),
  -- Metadata
  service_snapshot_count INT, -- Number of services at start time
  duration_seconds INT, -- Calculated on completion
  CONSTRAINT valid_processed CHECK (processed_count >= 0 AND processed_count <= total_services)
);

-- Index for quick lookups of recent/active reindex operations
CREATE INDEX idx_reindex_progress_status_started ON reindex_progress(status, started_at DESC);
CREATE INDEX idx_reindex_progress_triggered_by ON reindex_progress(triggered_by);

-- =====================================================================================
-- 2. RLS POLICIES FOR REINDEX PROGRESS
-- =====================================================================================
-- Only admins can view and create reindex progress records

ALTER TABLE reindex_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reindex progress" ON reindex_progress
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can insert reindex progress" ON reindex_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update reindex progress" ON reindex_progress
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- =====================================================================================
-- 3. ADMIN ACTION AUDIT LOG
-- =====================================================================================
-- Tracks admin actions on services for accountability
-- Complements the existing audit_logs table with admin-specific actions

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('service_edit', 'service_delete', 'service_restore', 'bulk_update', 'reindex', 'push_notification')),
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_service_id TEXT, -- Service ID if applicable
  target_count INT, -- Number of items affected (for bulk operations)
  details JSONB, -- Additional context (e.g., what was changed)
  ip_address INET -- Track IP for security
);

-- Indexes for querying admin actions
CREATE INDEX idx_admin_actions_performed_by ON admin_actions(performed_by, performed_at DESC);
CREATE INDEX idx_admin_actions_service ON admin_actions(target_service_id) WHERE target_service_id IS NOT NULL;
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action, performed_at DESC);

-- RLS: Only admins can view admin action logs
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin actions" ON admin_actions
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "System can insert admin actions" ON admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow inserts from any authenticated user (logged automatically)

-- =====================================================================================
-- 4. HELPER FUNCTION: LOG ADMIN ACTION
-- =====================================================================================
-- Utility function to log admin actions from application code

CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_performed_by UUID,
  p_target_service_id TEXT DEFAULT NULL,
  p_target_count INT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
BEGIN
  INSERT INTO admin_actions (
    action,
    performed_by,
    target_service_id,
    target_count,
    details,
    ip_address
  ) VALUES (
    p_action,
    p_performed_by,
    p_target_service_id,
    p_target_count,
    p_details,
    p_ip_address
  ) RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- 5. FUNCTION: UPDATE REINDEX PROGRESS
-- =====================================================================================
-- Updates the progress of an ongoing reindex operation

CREATE OR REPLACE FUNCTION update_reindex_progress(
  p_progress_id UUID,
  p_processed_count INT,
  p_status TEXT DEFAULT 'running',
  p_error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_total_services INT;
  v_started_at TIMESTAMPTZ;
BEGIN
  -- Get current progress info
  SELECT total_services, started_at
  INTO v_total_services, v_started_at
  FROM reindex_progress
  WHERE id = p_progress_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Update progress
  UPDATE reindex_progress
  SET
    processed_count = p_processed_count,
    status = p_status,
    error_message = p_error_message,
    completed_at = CASE
      WHEN p_status IN ('complete', 'error', 'cancelled') THEN NOW()
      ELSE completed_at
    END,
    duration_seconds = CASE
      WHEN p_status IN ('complete', 'error', 'cancelled')
      THEN EXTRACT(EPOCH FROM (NOW() - v_started_at))::INT
      ELSE duration_seconds
    END
  WHERE id = p_progress_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- 6. VIEW: ACTIVE REINDEX OPERATIONS
-- =====================================================================================
-- Convenience view for admin panel to show ongoing reindex operations

CREATE OR REPLACE VIEW active_reindex_operations AS
SELECT
  rp.id,
  rp.started_at,
  rp.total_services,
  rp.processed_count,
  rp.status,
  rp.error_message,
  ROUND((rp.processed_count::NUMERIC / rp.total_services::NUMERIC) * 100, 1) as progress_percentage,
  EXTRACT(EPOCH FROM (NOW() - rp.started_at))::INT as elapsed_seconds,
  u.email as triggered_by_email
FROM reindex_progress rp
LEFT JOIN auth.users u ON rp.triggered_by = u.id
WHERE rp.status = 'running'
ORDER BY rp.started_at DESC;

-- Security: Admin-only view
ALTER VIEW active_reindex_operations SET (security_invoker = true);

-- =====================================================================================
-- 7. ENHANCEMENT: ADD ADMIN NOTES TO SERVICES
-- =====================================================================================
-- Allow admins to add internal notes to services (not visible to partners or public)

ALTER TABLE services
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS last_admin_review TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN services.admin_notes IS 'Internal admin notes about service quality, verification issues, etc. Not visible to partners or public.';
COMMENT ON COLUMN services.last_admin_review IS 'Timestamp of last admin review/verification';
COMMENT ON COLUMN services.reviewed_by IS 'Admin user who last reviewed this service';

-- =====================================================================================
-- 8. FUNCTION: BULK UPDATE SERVICE STATUS
-- =====================================================================================
-- Allows admins to bulk update verification status or published status

CREATE OR REPLACE FUNCTION bulk_update_service_status(
  p_service_ids TEXT[],
  p_verification_status TEXT DEFAULT NULL,
  p_published BOOLEAN DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL
) RETURNS TABLE(updated_count INT, failed_ids TEXT[]) AS $$
DECLARE
  v_updated_count INT := 0;
  v_failed_ids TEXT[] := '{}';
  v_service_id TEXT;
BEGIN
  -- Validate admin role
  IF (SELECT auth.jwt() -> 'user_metadata' ->> 'role') != 'admin' THEN
    RAISE EXCEPTION 'Only admins can bulk update services';
  END IF;

  -- Update each service
  FOREACH v_service_id IN ARRAY p_service_ids
  LOOP
    BEGIN
      UPDATE services
      SET
        verification_status = COALESCE(p_verification_status, verification_status),
        published = COALESCE(p_published, published),
        reviewed_by = p_admin_user_id,
        last_admin_review = NOW(),
        updated_at = NOW()
      WHERE id = v_service_id;

      IF FOUND THEN
        v_updated_count := v_updated_count + 1;
      ELSE
        v_failed_ids := array_append(v_failed_ids, v_service_id);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_failed_ids := array_append(v_failed_ids, v_service_id);
    END;
  END LOOP;

  RETURN QUERY SELECT v_updated_count, v_failed_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- 9. NOTIFICATIONS
-- =====================================================================================
-- Phase 3 Enhancement: Notifications table was already created in Phase 2 migration
-- (20260121000000_dashboard_completion.sql). No changes needed here.

COMMENT ON TABLE notifications IS 'User notifications - created in previous migration';

-- =====================================================================================
-- VERIFICATION QUERIES (For Testing)
-- =====================================================================================

-- Check if Phase 3 tables were created successfully
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reindex_progress') THEN
    RAISE NOTICE '✓ reindex_progress table created';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_actions') THEN
    RAISE NOTICE '✓ admin_actions table created';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_admin_action') THEN
    RAISE NOTICE '✓ log_admin_action function created';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_reindex_progress') THEN
    RAISE NOTICE '✓ update_reindex_progress function created';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'bulk_update_service_status') THEN
    RAISE NOTICE '✓ bulk_update_service_status function created';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'active_reindex_operations') THEN
    RAISE NOTICE '✓ active_reindex_operations view created';
  END IF;
END $$;

-- =====================================================================================
-- END OF MIGRATION
-- =====================================================================================
