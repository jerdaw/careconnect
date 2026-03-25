-- Migration: 20260115000001_performance_remediations.sql
-- Purpose: Fix Supabase performance linter warnings

-- ============================================
-- 1. Fix push_subscriptions - Auth RLS InitPlan
-- ============================================
-- Issue: auth.role() re-evaluated for each row
-- Fix: Wrap in (SELECT ...) for scalar subquery optimization

DROP POLICY IF EXISTS "Service role only" ON push_subscriptions;

CREATE POLICY "Service role only" ON push_subscriptions
  FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- ============================================
-- 2. Fix partner_terms_acceptance - Auth RLS InitPlan
-- ============================================
-- Issue: auth.role() re-evaluated for each row
-- Fix: Wrap in (SELECT ...) for scalar subquery optimization

DROP POLICY IF EXISTS "Enable select for admins" ON partner_terms_acceptance;

CREATE POLICY "Enable select for admins" ON partner_terms_acceptance
  FOR SELECT USING ((SELECT auth.role()) = 'service_role');

-- ============================================
-- 3. Fix organization_members - Multiple Permissive Policies
-- ============================================
-- Issue: "Admins can manage members" and "Members can view org members" 
--        both apply to SELECT, causing performance issues
-- Fix: Consolidate into a single SELECT policy with OR logic

DROP POLICY IF EXISTS "Admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Members can view org members" ON organization_members;

-- Single consolidated SELECT policy
CREATE POLICY "Members can view org members" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = organization_members.organization_id
    )
  );

-- Separate policy for admin operations (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage members" ON organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = organization_members.organization_id
      AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = organization_members.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- 4. Add indexes for unindexed foreign keys
-- ============================================

-- organization_members.invited_by
CREATE INDEX IF NOT EXISTS idx_org_members_invited_by 
  ON organization_members(invited_by);

-- partner_terms_acceptance.service_id
CREATE INDEX IF NOT EXISTS idx_partner_terms_service_id 
  ON partner_terms_acceptance(service_id);

-- service_submissions.reviewed_by
CREATE INDEX IF NOT EXISTS idx_service_submissions_reviewed_by 
  ON service_submissions(reviewed_by);

-- services.org_id
CREATE INDEX IF NOT EXISTS idx_services_org_id 
  ON services(org_id);
