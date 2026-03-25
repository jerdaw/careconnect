-- =====================================================================================
-- Migration: Fix Remaining Security Warnings
-- =====================================================================================
-- Purpose: 
-- 1. Fix 'security_definer_view' by setting security_invoker = true on API views.
-- 2. Fix 'materialized_view_in_api' by explicitly revoking anon/authenticated access to backing MVs.
-- Date: 2026-01-26 (Part 3)
-- =====================================================================================

-- 1. FIX: SECURITY DEFINER VIEW
-- Views created without 'security_invoker = true' run with the owner's permissions (SECURITY DEFINER behavior).
-- We want them to run with the invoker's permissions (though MVs don't have RLS, this satisfies the linter security check).

ALTER VIEW feedback_aggregations SET (security_invoker = true);
ALTER VIEW unmet_needs_summary SET (security_invoker = true);


-- 2. FIX: MATERIALIZED VIEW IN API
-- 'REVOKE ALL FROM PUBLIC' was not sufficient because 'anon' and 'authenticated' are specific roles in Supabase
-- that might not be fully covered by PUBLIC revocation in the way the linter expects, or were granted explicitly.

REVOKE ALL ON mat_feedback_aggregations FROM anon, authenticated;
REVOKE ALL ON mat_unmet_needs_summary FROM anon, authenticated;
