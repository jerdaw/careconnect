-- =====================================================================================
-- Migration: v17.4 Security Cleanup
-- =====================================================================================
-- Purpose: Fix security warnings including SECURITY DEFINER views, 
-- insecure user_metadata usage, and exposed database objects.
-- Date: 2026-01-24
-- =====================================================================================

-- =====================================================================================
-- 1. FIX: SECURITY DEFINER VIEW
-- =====================================================================================
-- Issue: services_public was enforcing RLS of the creator, not the invoker.
-- Fix: Set security_invoker = true to enforce RLS of the querying user.

ALTER VIEW services_public SET (security_invoker = true);

-- =====================================================================================
-- 2. FIX: RLS REFERENCES USER_METADATA
-- =====================================================================================
-- Issue: Relying on generic user_metadata for admin privileges is insecure 
-- as it can be editable by users in some configurations.
-- Fix: Create a dedicated app_admins table managed by database owners.

CREATE TABLE IF NOT EXISTS app_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unique(user_id)
);

-- Enable RLS on app_admins
ALTER TABLE app_admins ENABLE ROW LEVEL SECURITY;

-- Only super-admins (database owners) or existing admins can view/manage
-- ideally only manageable via SQL console or initial seed, but here we allow
-- self-read for checks.
CREATE POLICY "Admins can view admin list" ON app_admins
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Helper function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to use app_admins table instead of user_metadata

-- A. services
DROP POLICY IF EXISTS "Admins can insert services." ON services;
CREATE POLICY "Admins can insert services" ON services
  FOR INSERT
  WITH CHECK ( is_admin() );

-- B. feedback
DROP POLICY IF EXISTS "Admins have full access to feedback" ON feedback;
CREATE POLICY "Admins have full access to feedback" ON feedback
  FOR ALL
  TO authenticated
  USING ( is_admin() );

-- C. reindex_progress (Drop old ones first)
DROP POLICY IF EXISTS "Admins can view reindex progress" ON reindex_progress;
DROP POLICY IF EXISTS "Admins can insert reindex progress" ON reindex_progress;
DROP POLICY IF EXISTS "Admins can update reindex progress" ON reindex_progress;

CREATE POLICY "Admins can view reindex progress" ON reindex_progress
  FOR SELECT TO authenticated USING ( is_admin() );

CREATE POLICY "Admins can insert reindex progress" ON reindex_progress
  FOR INSERT TO authenticated WITH CHECK ( is_admin() );

CREATE POLICY "Admins can update reindex progress" ON reindex_progress
  FOR UPDATE TO authenticated USING ( is_admin() ) WITH CHECK ( is_admin() );

-- D. admin_actions
DROP POLICY IF EXISTS "Admins can view admin actions" ON admin_actions;
CREATE POLICY "Admins can view admin actions" ON admin_actions
  FOR SELECT TO authenticated USING ( is_admin() );

-- =====================================================================================
-- 3. FIX: PERMISSIVE RLS POLICY
-- =====================================================================================
-- Issue: "System can insert admin actions" was always true for INSERT.
-- Fix: Remove the permissive policy. Inserts should happen via the secure function.

DROP POLICY IF EXISTS "System can insert admin actions" ON admin_actions;

-- =====================================================================================
-- 4. FIX: MUTABLE SEARCH PATHS
-- =====================================================================================
-- Issue: Functions missing 'search_path' can be exploited if malicious objects 
-- are planted in other schemas.
-- Fix: Explicitly set search_path to 'public' (or appropriate schema).

ALTER FUNCTION get_user_organization_id(UUID) SET search_path = public;
ALTER FUNCTION user_can_manage_service(UUID, TEXT) SET search_path = public;
ALTER FUNCTION generate_invitation_token() SET search_path = public, extensions;
ALTER FUNCTION accept_organization_invitation(TEXT) SET search_path = public, extensions;
ALTER FUNCTION soft_delete_service(TEXT) SET search_path = public;
ALTER FUNCTION log_admin_action(TEXT, UUID, TEXT, INT, JSONB, INET) SET search_path = public;
ALTER FUNCTION update_reindex_progress(UUID, INT, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION bulk_update_service_status(TEXT[], TEXT, BOOLEAN, UUID) SET search_path = public;

-- =====================================================================================
-- 5. FIX: EXPOSED MATERIALIZED VIEWS
-- =====================================================================================
-- Issue: Materialized views were accessible to 'anon' via Data API.
-- Fix: Revoke permissions from 'anon'.

REVOKE ALL ON feedback_aggregations FROM anon;
REVOKE ALL ON unmet_needs_summary FROM anon;
