-- =====================================================================================
-- Baseline Migration: HelpBridge Schema Foundation
-- =====================================================================================
-- This baseline consolidates all pre-March-2026 migrations into a single reproducible
-- schema definition. It replaces 38 individual migration files that contained
-- overlapping, duplicate, and iteratively-fixed schema objects.
--
-- Created: 2026-03-24 (v20.0 Migration Recovery)
-- Absorbs: 002_v6_prerequisites through 20260126110000_fix_search_paths
--
-- This migration contains NO data mutations — only schema definitions.
-- =====================================================================================

BEGIN;

-- =====================================================================================
-- 1. EXTENSIONS
-- =====================================================================================

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER DATABASE postgres SET search_path TO "$user", public, extensions;

-- =====================================================================================
-- 2. CORE TABLES
-- =====================================================================================

-- Organizations (Partner Agencies)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  domain TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services (the core data table — ~196 curated social services)
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_fr TEXT,
  description TEXT,
  description_fr TEXT,
  address TEXT,
  address_fr TEXT,
  phone TEXT,
  url TEXT,
  email TEXT,
  hours JSONB,
  hours_text TEXT,
  hours_text_fr TEXT,
  fees TEXT,
  fees_fr TEXT,
  eligibility TEXT,
  eligibility_fr TEXT,
  application_process TEXT,
  application_process_fr TEXT,
  languages TEXT[],
  bus_routes TEXT[],
  accessibility JSONB,
  last_verified TIMESTAMPTZ,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  category TEXT,
  tags JSONB,
  scope TEXT,
  virtual_delivery BOOLEAN DEFAULT FALSE,
  primary_phone_label TEXT,
  service_area TEXT,
  authority_tier TEXT,
  resource_indicators JSONB,
  synthetic_queries TEXT[],
  synthetic_queries_fr TEXT[],
  coordinates JSONB,
  embedding JSONB,
  display_provenance BOOLEAN DEFAULT TRUE,
  plain_language_available BOOLEAN DEFAULT FALSE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  admin_notes TEXT,
  last_admin_review TIMESTAMPTZ,
  reviewed_by UUID,
  provenance JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_deleted_at ON services(deleted_at);

-- Organization Members (RBAC membership)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- Analytics Events (Privacy-First: No IPs, No User IDs)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_service_id ON analytics_events(service_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);

-- Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful_yes', 'helpful_no', 'issue', 'not_found')),
  description TEXT,
  message TEXT CHECK (length(message) <= 1000),
  category_searched TEXT CHECK (category_searched IN (
    'Food', 'Crisis', 'Housing', 'Health', 'Legal', 'Financial',
    'Employment', 'Education', 'Transport', 'Community', 'Indigenous', 'Wellness'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_service ON feedback(service_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);

-- Service Update Requests
CREATE TABLE service_update_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  field_updates JSONB NOT NULL,
  justification TEXT CHECK (length(justification) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_update_requests_service ON service_update_requests(service_id);
CREATE INDEX idx_update_requests_status ON service_update_requests(status);
CREATE INDEX idx_update_requests_requested_by ON service_update_requests(requested_by);
CREATE INDEX idx_service_update_requests_requested_by_status
  ON service_update_requests(requested_by, status);

-- Plain Language Summaries
CREATE TABLE plain_language_summaries (
  service_id TEXT PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
  summary_en TEXT NOT NULL CHECK (length(summary_en) <= 500),
  summary_fr TEXT CHECK (length(summary_fr) <= 500),
  how_to_use_en TEXT NOT NULL CHECK (length(how_to_use_en) <= 1000),
  how_to_use_fr TEXT CHECK (length(how_to_use_fr) <= 1000),
  reviewed_by TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Push Subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  keys JSONB NOT NULL,
  categories TEXT[] NOT NULL DEFAULT ARRAY['general'],
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_categories ON push_subscriptions USING GIN (categories);

-- Service Submissions (community queue)
CREATE TABLE service_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  phone TEXT,
  url TEXT,
  address TEXT,
  submitted_by_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_status ON service_submissions(status);
CREATE INDEX idx_submissions_created ON service_submissions(created_at DESC);

-- Search Analytics
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT,
  results_count INT,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  performed_by UUID,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at DESC);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read) WHERE read = FALSE;

-- Organization Settings
CREATE TABLE organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  website TEXT,
  phone TEXT,
  description TEXT,
  email_on_feedback BOOLEAN DEFAULT TRUE,
  email_on_service_update BOOLEAN DEFAULT TRUE,
  weekly_analytics_report BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Invitations
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_expires ON organization_invitations(expires_at) WHERE accepted_at IS NULL;

-- App Admins (secure admin lookup table)
CREATE TABLE app_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reindex Progress Tracking
CREATE TABLE reindex_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_services INT NOT NULL,
  processed_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'complete', 'error', 'cancelled')),
  error_message TEXT,
  triggered_by UUID,
  service_snapshot_count INT,
  duration_seconds INT,
  CONSTRAINT valid_processed CHECK (processed_count >= 0 AND processed_count <= total_services)
);

CREATE INDEX idx_reindex_progress_status_started ON reindex_progress(status, started_at DESC);
CREATE INDEX idx_reindex_progress_triggered_by ON reindex_progress(triggered_by);

-- Admin Actions
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN (
    'service_edit', 'service_delete', 'service_restore',
    'bulk_update', 'reindex', 'push_notification'
  )),
  performed_by UUID NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_service_id TEXT,
  target_count INT,
  details JSONB,
  ip_address INET
);

CREATE INDEX idx_admin_actions_performed_by ON admin_actions(performed_by, performed_at DESC);
CREATE INDEX idx_admin_actions_service ON admin_actions(target_service_id) WHERE target_service_id IS NOT NULL;
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action, performed_at DESC);


-- =====================================================================================
-- 3. VIEWS
-- =====================================================================================

-- Public Projection View (core public API surface)
CREATE VIEW services_public AS
SELECT
  id, name, name_fr, description, description_fr,
  address, address_fr, phone, url, email,
  hours, fees, eligibility, application_process,
  languages, bus_routes, accessibility,
  last_verified, verification_status,
  category, tags, scope, virtual_delivery,
  primary_phone_label, created_at, authority_tier,
  resource_indicators, synthetic_queries, synthetic_queries_fr,
  coordinates, provenance
FROM services
WHERE
  published = TRUE
  AND deleted_at IS NULL
  AND verification_status IN ('L1', 'L2', 'L3');

ALTER VIEW services_public SET (security_invoker = true);


-- =====================================================================================
-- 4. MATERIALIZED VIEWS
-- =====================================================================================

CREATE MATERIALIZED VIEW mat_feedback_aggregations AS
SELECT
  service_id,
  count(*) FILTER (WHERE feedback_type = 'helpful_yes') AS helpful_yes_count,
  count(*) FILTER (WHERE feedback_type = 'helpful_no') AS helpful_no_count,
  count(*) FILTER (WHERE feedback_type = 'issue') AS total_issues_count,
  count(*) FILTER (WHERE feedback_type = 'issue' AND status = 'resolved') AS resolved_issues_count,
  count(*) FILTER (WHERE feedback_type = 'issue' AND status = 'pending') AS open_issues_count,
  max(created_at) AS last_feedback_at
FROM feedback
WHERE service_id IS NOT NULL
GROUP BY service_id;

CREATE INDEX idx_mat_feedback_agg_service ON mat_feedback_aggregations(service_id);

-- API-facing view wrapping the materialized view
CREATE VIEW feedback_aggregations AS
SELECT * FROM mat_feedback_aggregations;

CREATE MATERIALIZED VIEW mat_unmet_needs_summary AS
SELECT
  category_searched,
  count(*) AS request_count,
  max(created_at) AS last_requested_at
FROM feedback
WHERE feedback_type = 'not_found' AND category_searched IS NOT NULL
GROUP BY category_searched
ORDER BY request_count DESC;

-- API-facing view wrapping the materialized view
CREATE VIEW unmet_needs_summary AS
SELECT * FROM mat_unmet_needs_summary;

-- Partner Service Analytics
CREATE VIEW partner_service_analytics AS
SELECT
  s.id AS service_id,
  s.name,
  s.org_id,
  s.verification_status,
  COALESCE(fa.helpful_yes_count, 0) AS helpful_yes_count,
  COALESCE(fa.helpful_no_count, 0) AS helpful_no_count,
  COALESCE(fa.open_issues_count, 0) AS open_issues_count,
  fa.last_feedback_at,
  CASE
    WHEN COALESCE(fa.helpful_yes_count, 0) + COALESCE(fa.helpful_no_count, 0) = 0 THEN NULL
    ELSE ROUND(
      (COALESCE(fa.helpful_yes_count, 0)::NUMERIC /
       (COALESCE(fa.helpful_yes_count, 0) + COALESCE(fa.helpful_no_count, 0))) * 100,
      1
    )
  END AS helpfulness_percentage
FROM services s
LEFT JOIN feedback_aggregations fa ON s.id = fa.service_id
WHERE s.deleted_at IS NULL;

ALTER VIEW partner_service_analytics SET (security_invoker = true);

-- Active Reindex Operations
CREATE VIEW active_reindex_operations AS
SELECT
  rp.id,
  rp.started_at,
  rp.total_services,
  rp.processed_count,
  rp.status,
  rp.error_message,
  ROUND((rp.processed_count::NUMERIC / rp.total_services::NUMERIC) * 100, 1) AS progress_percentage,
  EXTRACT(EPOCH FROM (NOW() - rp.started_at))::INT AS elapsed_seconds
FROM reindex_progress rp
WHERE rp.status = 'running'
ORDER BY rp.started_at DESC;

ALTER VIEW active_reindex_operations SET (security_invoker = true);


-- =====================================================================================
-- 5. FUNCTIONS
-- =====================================================================================

-- is_admin(): Check admin status via app_admins table (not user_metadata)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION is_admin() SET search_path = public;

-- get_service_views(): Simple view count helper
CREATE OR REPLACE FUNCTION get_service_views(service_id_param TEXT)
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*) FROM analytics_events WHERE service_id = service_id_param;
$$;
ALTER FUNCTION get_service_views(TEXT) SET search_path = public;

-- get_user_organization_id(): Return user's org
CREATE OR REPLACE FUNCTION get_user_organization_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = user_uuid
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;
ALTER FUNCTION get_user_organization_id(UUID) SET search_path = public;

GRANT EXECUTE ON FUNCTION get_user_organization_id(UUID) TO authenticated;

-- user_can_manage_service(): Check service ownership
CREATE OR REPLACE FUNCTION user_can_manage_service(user_uuid UUID, service_uuid TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM services s
    JOIN organization_members om ON s.org_id = om.organization_id
    WHERE s.id = service_uuid
    AND om.user_id = user_uuid
    AND om.role IN ('owner', 'admin', 'editor')
  );
$$ LANGUAGE SQL SECURITY DEFINER;
ALTER FUNCTION user_can_manage_service(UUID, TEXT) SET search_path = public;

GRANT EXECUTE ON FUNCTION user_can_manage_service(UUID, TEXT) TO authenticated;

-- generate_invitation_token(): Secure random token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION generate_invitation_token() SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION generate_invitation_token() TO authenticated;

-- accept_organization_invitation(): Accept invite and add member
-- (final version from 20260126080000 — fixed unused variable)
CREATE OR REPLACE FUNCTION accept_organization_invitation(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  invitation_record organization_invitations%ROWTYPE;
BEGIN
  SELECT * INTO invitation_record
  FROM organization_invitations
  WHERE token = invitation_token
  AND accepted_at IS NULL
  AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = invitation_record.organization_id
    AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member of this organization');
  END IF;

  INSERT INTO organization_members (
    organization_id, user_id, role, invited_by, invited_at, accepted_at
  ) VALUES (
    invitation_record.organization_id,
    auth.uid(),
    invitation_record.role,
    invitation_record.invited_by,
    invitation_record.invited_at,
    NOW()
  );

  UPDATE organization_invitations
  SET accepted_at = NOW(), accepted_by = auth.uid()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', invitation_record.organization_id,
    'role', invitation_record.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION accept_organization_invitation(TEXT) SET search_path = public;

GRANT EXECUTE ON FUNCTION accept_organization_invitation(TEXT) TO authenticated;

-- soft_delete_service(): Soft delete with ownership check
CREATE OR REPLACE FUNCTION soft_delete_service(service_uuid TEXT)
RETURNS JSONB AS $$
DECLARE
  service_record services%ROWTYPE;
BEGIN
  IF NOT user_can_manage_service(auth.uid(), service_uuid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO service_record FROM services WHERE id = service_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Service not found');
  END IF;

  IF service_record.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Service already deleted');
  END IF;

  UPDATE services
  SET deleted_at = NOW(), deleted_by = auth.uid(), published = false
  WHERE id = service_uuid;

  RETURN jsonb_build_object('success', true, 'message', 'Service deleted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION soft_delete_service(TEXT) SET search_path = public;

GRANT EXECUTE ON FUNCTION soft_delete_service(TEXT) TO authenticated;

-- log_admin_action(): Audit trail for admin operations
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
    action, performed_by, target_service_id, target_count, details, ip_address
  ) VALUES (
    p_action, p_performed_by, p_target_service_id, p_target_count, p_details, p_ip_address
  ) RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION log_admin_action(TEXT, UUID, TEXT, INT, JSONB, INET) SET search_path = public;

-- update_reindex_progress(): Update reindex progress
-- (final version from 20260126080000 — fixed unused variable)
CREATE OR REPLACE FUNCTION update_reindex_progress(
  p_progress_id UUID,
  p_processed_count INT,
  p_status TEXT DEFAULT 'running',
  p_error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
BEGIN
  SELECT started_at INTO v_started_at
  FROM reindex_progress
  WHERE id = p_progress_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

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
ALTER FUNCTION update_reindex_progress(UUID, INT, TEXT, TEXT) SET search_path = public;

-- transfer_ownership(): Atomic ownership transfer
-- (final version from 20260126100000 — fixed unused variable, correct audit_logs columns)
CREATE OR REPLACE FUNCTION transfer_ownership(
  p_org_id UUID,
  p_current_owner_id UUID,
  p_new_owner_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_member RECORD;
  v_owner_count INT;
BEGIN
  SELECT * INTO v_current_member
  FROM organization_members
  WHERE organization_id = p_org_id
  AND user_id = p_current_owner_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Current user is not a member of this organization');
  END IF;

  IF v_current_member.role != 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Current user is not the owner');
  END IF;

  PERFORM 1
  FROM organization_members
  WHERE organization_id = p_org_id
  AND user_id = p_new_owner_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target user is not a member of this organization');
  END IF;

  IF p_current_owner_id = p_new_owner_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer ownership to yourself');
  END IF;

  UPDATE organization_members
  SET role = CASE
    WHEN user_id = p_new_owner_id THEN 'owner'
    WHEN user_id = p_current_owner_id THEN 'admin'
    ELSE role
  END,
  updated_at = NOW()
  WHERE organization_id = p_org_id
  AND user_id IN (p_current_owner_id, p_new_owner_id);

  SELECT COUNT(*) INTO v_owner_count
  FROM organization_members
  WHERE organization_id = p_org_id
  AND role = 'owner';

  IF v_owner_count != 1 THEN
    RAISE EXCEPTION 'Transfer failed: Invalid owner count (%). Transaction rolled back.', v_owner_count;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    INSERT INTO audit_logs (performed_by, operation, table_name, record_id, metadata)
    VALUES (
      p_current_owner_id, 'UPDATE', 'organizations', p_org_id::TEXT,
      jsonb_build_object('action', 'transfer_ownership', 'previous_owner', p_current_owner_id, 'new_owner', p_new_owner_id)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Ownership transferred successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
ALTER FUNCTION transfer_ownership(UUID, UUID, UUID) SET search_path = public;

GRANT EXECUTE ON FUNCTION transfer_ownership(UUID, UUID, UUID) TO authenticated;


-- =====================================================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_update_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE plain_language_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE reindex_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- ---- SERVICES (Unified policies — superseded by recursion-fix forward migration) ----
-- These are created here in their pre-recursion-fix form.
-- The forward migration 20260311032000 will DROP and re-create them.
CREATE POLICY "Unified view policy for services" ON services
  FOR SELECT TO public
  USING (
    published = true
    OR (
      auth.role() = 'authenticated' AND (
        is_admin()
        OR EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = services.org_id
          AND om.user_id = (SELECT auth.uid())
        )
      )
    )
  );

CREATE POLICY "Unified insert policy for services" ON services
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Unified update policy for services" ON services
  FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Unified delete policy for services" ON services
  FOR DELETE TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

-- Service role bypass for services
CREATE POLICY "Service role can manage services" ON services
  FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- ---- ORGANIZATIONS ----
CREATE POLICY "Service role can read organizations" ON organizations
  FOR SELECT TO service_role
  USING (TRUE);

-- ---- ORGANIZATION MEMBERS ----
-- These are in their pre-recursion-fix form.
-- The forward migration 20260311032000 will DROP and re-create them.
CREATE POLICY "Members can view org members" ON organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = organization_members.organization_id
    )
  );

CREATE POLICY "Admins can manage members" ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = organization_members.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update members" ON organization_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = organization_members.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete members" ON organization_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = organization_members.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Service role can read memberships" ON organization_members
  FOR SELECT TO service_role
  USING (TRUE);

CREATE POLICY "Users can read own memberships" ON organization_members
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ---- ANALYTICS EVENTS ----
CREATE POLICY "Public can insert analytics for visible services" ON analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    event_type IN ('view', 'view_detail', 'click_call', 'click_website')
    AND service_id IN (SELECT id FROM services_public)
  );

CREATE POLICY "Service role can manage analytics" ON analytics_events
  FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- ---- FEEDBACK (Unified policies) ----
CREATE POLICY "Unified view policy for feedback" ON feedback
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = feedback.service_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Unified update policy for feedback" ON feedback
  FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = feedback.service_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = feedback.service_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Unified delete policy for feedback" ON feedback
  FOR DELETE TO authenticated
  USING (is_admin());

CREATE POLICY "Unified insert policy for feedback" ON feedback
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Service role can manage feedback" ON feedback
  FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- ---- SERVICE UPDATE REQUESTS ----
CREATE POLICY "Users can view service requests" ON service_update_requests
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = service_update_requests.service_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Partners can create requests" ON service_update_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = service_update_requests.service_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can update requests" ON service_update_requests
  FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = service_update_requests.service_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can delete requests" ON service_update_requests
  FOR DELETE TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = service_update_requests.service_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

-- ---- PLAIN LANGUAGE SUMMARIES ----
CREATE POLICY "Anyone can read summaries" ON plain_language_summaries
  FOR SELECT USING (true);

CREATE POLICY "Partners can manage own summaries" ON plain_language_summaries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = plain_language_summaries.service_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

-- ---- PUSH SUBSCRIPTIONS ----
CREATE POLICY "Service role only" ON push_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- ---- SERVICE SUBMISSIONS ----
CREATE POLICY "Public can submit" ON service_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ---- AUDIT LOGS ----
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (is_admin());

-- ---- NOTIFICATIONS ----
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- ORGANIZATION SETTINGS ----
CREATE POLICY "Org members can view their settings" ON organization_settings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can update settings" ON organization_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_settings.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_settings.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- ---- ORGANIZATION INVITATIONS ----
CREATE POLICY "Org members can view invitations" ON organization_invitations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can manage invitations" ON organization_invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- ---- APP ADMINS ----
CREATE POLICY "Admins can view admin list" ON app_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---- REINDEX PROGRESS ----
CREATE POLICY "Admins can view reindex progress" ON reindex_progress
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Admins can insert reindex progress" ON reindex_progress
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update reindex progress" ON reindex_progress
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ---- ADMIN ACTIONS ----
CREATE POLICY "Admins can view admin actions" ON admin_actions
  FOR SELECT TO authenticated USING (is_admin());


-- =====================================================================================
-- 7. GRANTS
-- =====================================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON services TO anon, authenticated, service_role;
GRANT SELECT ON services_public TO anon, authenticated, service_role;
GRANT SELECT ON organization_members TO authenticated, service_role;
GRANT INSERT, SELECT ON analytics_events TO anon, authenticated, service_role;
GRANT INSERT, SELECT ON feedback TO anon, authenticated, service_role;
GRANT SELECT ON organizations TO authenticated, service_role;
GRANT SELECT ON partner_service_analytics TO authenticated;
GRANT SELECT ON feedback_aggregations TO anon, authenticated;
GRANT SELECT ON unmet_needs_summary TO anon, authenticated;

REVOKE ALL ON mat_feedback_aggregations FROM PUBLIC;
REVOKE ALL ON mat_unmet_needs_summary FROM PUBLIC;

ALTER MATERIALIZED VIEW mat_feedback_aggregations OWNER TO postgres;
ALTER MATERIALIZED VIEW mat_unmet_needs_summary OWNER TO postgres;

-- =====================================================================================
-- END OF BASELINE
-- =====================================================================================

COMMIT;
