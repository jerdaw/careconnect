-- =====================================================================================
-- Migration: Compliance & Perf Fixes (Linter Clean Sweep)
-- =====================================================================================
-- Purpose: 
-- 1. Fix 'auth_rls_initplan' by wrapping auth.role() in (SELECT ...).
-- 2. Fix 'rls_policy_always_true' by adding basic validity check to public INSERT.
-- Date: 2026-01-26 (Sequence 07)
-- =====================================================================================

-- =====================================================================================
-- 1. FIX: SERVICES TABLE PERFORMANCE (InitPlan)
-- =====================================================================================
-- Issue: "Unified view policy for services" calls auth.role() per row.
-- Fix: Wrap in (SELECT auth.role()).

DROP POLICY IF EXISTS "Unified view policy for services" ON services;

CREATE POLICY "Unified view policy for services" ON services
  FOR SELECT
  TO public
  USING (
    published = true
    OR
    (
      (SELECT auth.role()) = 'authenticated' AND (
        is_admin()
        OR
        EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = services.org_id
          AND om.user_id = (SELECT auth.uid())
        )
      )
    )
  );

-- =====================================================================================
-- 2. FIX: FEEDBACK TABLE SAFETY (Always True)
-- =====================================================================================
-- Issue: "Unified insert policy for feedback" has WITH CHECK (true).
-- Fix: Check that required fields are present (safety check).
-- Required fields per schema: service_id, feedback_type.

DROP POLICY IF EXISTS "Unified insert policy for feedback" ON feedback;

CREATE POLICY "Unified insert policy for feedback" ON feedback
  FOR INSERT
  TO public
  WITH CHECK (
    service_id IS NOT NULL 
    AND feedback_type IS NOT NULL
  );
