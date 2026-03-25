-- =====================================================================================
-- Migration: Consolidate RLS Policies (Linter Fixes)
-- =====================================================================================
-- Purpose: Address 'multiple_permissive_policies' warnings by removing overlaps.
-- Date: 2026-01-26 (Sequence 04)
-- =====================================================================================

-- =====================================================================================
-- 1. FIX: SERVICES TABLE OVERLAPS (SECURITY HARDENING)
-- =====================================================================================
-- Issue: 'Authenticated can select services' allows ALL access, overriding tenant isolation.
--        It also overlaps with 'Partners can view their organization's services'.
-- Fix: Drop the permissive policy.

DROP POLICY IF EXISTS "Authenticated can select services" ON services;


-- =====================================================================================
-- 2. FIX: FEEDBACK TABLE REDUNDANCY
-- =====================================================================================
-- Issue: 'Partners can read feedback' (v14) overlaps with 'Partners can view feedback for their services' (Dashboard).
-- Fix: Drop the old/redundant policy.

DROP POLICY IF EXISTS "Partners can read feedback" ON feedback;


-- =====================================================================================
-- 3. FIX: SERVICE UPDATE REQUESTS REDUNDANCY
-- =====================================================================================
-- Issue: 'Partners can see requests' (v14) overlaps with 'Partners can view own requests' (v17).
-- Fix: Drop the old/redundant policy.

DROP POLICY IF EXISTS "Partners can see requests" ON service_update_requests;


-- =====================================================================================
-- 4. FIX: ORGANIZATION INVITATIONS (SPLIT READ/WRITE)
-- =====================================================================================
-- Issue: 'Org admins can manage invitations' (ALL) overlaps with 'Org members can view invitations' (SELECT).
-- Fix: Restrict Admin policy to INSERT, UPDATE, DELETE only.

DROP POLICY IF EXISTS "Org admins can manage invitations" ON organization_invitations;

CREATE POLICY "Org admins can manage invitations" ON organization_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can update invitations" ON organization_invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete invitations" ON organization_invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );


-- =====================================================================================
-- 5. FIX: ORGANIZATION SETTINGS (SPLIT READ/WRITE)
-- =====================================================================================
-- Issue: 'Org admins can update settings' (ALL) overlaps with 'Org members can view their settings' (SELECT).
-- Fix: Restrict Admin policy to INSERT, UPDATE, DELETE only.

DROP POLICY IF EXISTS "Org admins can update settings" ON organization_settings;

CREATE POLICY "Org admins can insert settings" ON organization_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_settings.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can update settings" ON organization_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_settings.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_settings.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete settings" ON organization_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_settings.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );


-- =====================================================================================
-- 6. FIX: PLAIN LANGUAGE SUMMARIES (SPLIT READ/WRITE)
-- =====================================================================================
-- Issue: 'Partners can manage own summaries' (ALL) overlaps with 'Anyone can read summaries' (SELECT).
-- Fix: Restrict Partner policy to INSERT, UPDATE, DELETE only.

DROP POLICY IF EXISTS "Partners can manage own summaries" ON plain_language_summaries;

CREATE POLICY "Partners can insert own summaries" ON plain_language_summaries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = plain_language_summaries.service_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Partners can update own summaries" ON plain_language_summaries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = plain_language_summaries.service_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = plain_language_summaries.service_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Partners can delete own summaries" ON plain_language_summaries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = plain_language_summaries.service_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );
