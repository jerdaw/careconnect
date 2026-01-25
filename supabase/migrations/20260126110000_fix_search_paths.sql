-- Migration: Fix search_path for SECURITY DEFINER functions
-- Date: 2026-01-26
-- Purpose: Security hardening by explicitly setting search_path to public for SECURITY DEFINER functions

-- 1. Fix bulk_update_service_status
ALTER FUNCTION bulk_update_service_status(TEXT[], TEXT, BOOLEAN, UUID) SET search_path = public;

-- 2. Fix accept_organization_invitation
ALTER FUNCTION accept_organization_invitation(TEXT) SET search_path = public;

-- 3. Fix update_reindex_progress
ALTER FUNCTION update_reindex_progress(UUID, INT, TEXT, TEXT) SET search_path = public;

-- 4. Fix transfer_ownership (signature from previous logs)
ALTER FUNCTION transfer_ownership(UUID, UUID, UUID) SET search_path = public;
