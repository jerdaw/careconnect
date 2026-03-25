-- Migration: 20260115000000_security_remediations.sql
-- Purpose: Fix Supabase security linter warnings

-- ============================================
-- 1. Fix services_public view - Remove SECURITY DEFINER
-- ============================================
-- The view should use invoker's permissions, not definer's.
-- We need to recreate it without SECURITY DEFINER property.
-- NOTE: Only includes columns that exist in the services table.

DROP VIEW IF EXISTS services_public;

CREATE VIEW services_public AS
SELECT
  id,
  name,
  name_fr,
  description,
  description_fr,
  address,
  address_fr,
  phone,
  url,
  email,
  hours,
  fees,
  eligibility,
  application_process,
  languages,
  bus_routes,
  accessibility,
  last_verified,
  verification_status,
  category,
  tags,
  created_at,
  -- v16.0 ranking fields
  authority_tier,
  resource_indicators
FROM services
WHERE 
  published = true 
  AND (verification_status IS NULL OR verification_status NOT IN ('draft', 'archived'));

-- Re-grant permissions (they're dropped with the view)
GRANT SELECT ON services_public TO anon;
GRANT SELECT ON services_public TO authenticated;

-- ============================================
-- 2. Fix analytics_events - Harden INSERT policy
-- ============================================
-- Current: WITH CHECK (true) - allows any insert
-- Fix: Require valid service_id that exists in published services

DROP POLICY IF EXISTS "Public can record views" ON analytics_events;

CREATE POLICY "Public can record views" ON analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    service_id IS NOT NULL 
    AND service_id IN (SELECT id FROM services_public)
  );

-- ============================================
-- 3. Fix partner_terms_acceptance - Harden INSERT policy
-- ============================================
-- Current: WITH CHECK (true) - allows any insert
-- Fix: Require valid service_id and non-empty email

DROP POLICY IF EXISTS "Enable insert for public claim flow" ON partner_terms_acceptance;

CREATE POLICY "Enable insert for public claim flow" ON partner_terms_acceptance
  FOR INSERT
  WITH CHECK (
    service_id IS NOT NULL 
    AND service_id IN (SELECT id FROM services_public)
    AND user_email IS NOT NULL 
    AND user_email != ''
  );

-- ============================================
-- 4. Fix service_submissions - Harden INSERT policy
-- ============================================
-- Current: WITH CHECK (true) - allows any insert
-- Fix: Require non-empty required fields

DROP POLICY IF EXISTS "Public can submit" ON service_submissions;

CREATE POLICY "Public can submit" ON service_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND name != ''
    AND description IS NOT NULL AND description != ''
  );

-- ============================================
-- 5. Fix organizations - Add missing RLS policies
-- ============================================
-- Currently: RLS enabled but no policies exist

-- Members can view their own organization
CREATE POLICY "Members can view own organization" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = (SELECT auth.uid())
    )
  );

-- Admins/owners can manage their organization
CREATE POLICY "Admins can manage organization" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );
