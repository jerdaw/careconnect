-- Migration: Schema and Function Fixes
-- Date: 2026-01-26
-- Purpose: Fix missing columns and unused variables identified by linter

-- 1. Add missing updated_at columns
-- Referenced by transfer_ownership and bulk_update_service_status functions
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Fix bulk_update_service_status type error and ensure updated_at usage is valid
CREATE OR REPLACE FUNCTION bulk_update_service_status(
  p_service_ids TEXT[],
  p_verification_status TEXT DEFAULT NULL,
  p_published BOOLEAN DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL
) RETURNS TABLE(updated_count INT, failed_ids TEXT[]) AS $$
DECLARE
  v_updated_count INT := 0;
  v_failed_ids TEXT[] := ARRAY[]::TEXT[]; -- Explicit cast to fix linter warning
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

-- 3. Fix unused variable in accept_organization_invitation
CREATE OR REPLACE FUNCTION accept_organization_invitation(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  invitation_record organization_invitations%ROWTYPE;
BEGIN
  -- Find the invitation
  SELECT * INTO invitation_record
  FROM organization_invitations
  WHERE token = invitation_token
  AND accepted_at IS NULL
  AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = invitation_record.organization_id
    AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member of this organization');
  END IF;

  -- Add user as organization member
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    invited_by,
    invited_at,
    accepted_at
  ) VALUES (
    invitation_record.organization_id,
    auth.uid(),
    invitation_record.role,
    invitation_record.invited_by,
    invitation_record.invited_at,
    NOW()
  );

  -- Mark invitation as accepted
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

-- 4. Fix unused variable in update_reindex_progress
CREATE OR REPLACE FUNCTION update_reindex_progress(
  p_progress_id UUID,
  p_processed_count INT,
  p_status TEXT DEFAULT 'running',
  p_error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
BEGIN
  -- Get current progress info
  SELECT started_at
  INTO v_started_at
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
