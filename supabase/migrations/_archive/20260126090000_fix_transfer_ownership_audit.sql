-- Migration: Fix transfer_ownership audit logging
-- Date: 2026-01-26
-- Purpose: Correct column names and values to match existing audit_logs schema

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
  v_new_member RECORD;
  v_owner_count INT;
BEGIN
  -- Verify current user is the owner
  SELECT * INTO v_current_member
  FROM organization_members
  WHERE organization_id = p_org_id
  AND user_id = p_current_owner_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Current user is not a member of this organization'
    );
  END IF;

  IF v_current_member.role != 'owner' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Current user is not the owner'
    );
  END IF;

  -- Verify new owner is a member
  SELECT * INTO v_new_member
  FROM organization_members
  WHERE organization_id = p_org_id
  AND user_id = p_new_owner_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Target user is not a member of this organization'
    );
  END IF;

  -- Cannot transfer to yourself
  IF p_current_owner_id = p_new_owner_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot transfer ownership to yourself'
    );
  END IF;

  -- Atomic update: Demote current owner to admin, promote new member to owner
  UPDATE organization_members
  SET role = CASE
    WHEN user_id = p_new_owner_id THEN 'owner'
    WHEN user_id = p_current_owner_id THEN 'admin'
    ELSE role
  END,
  updated_at = NOW()
  WHERE organization_id = p_org_id
  AND user_id IN (p_current_owner_id, p_new_owner_id);

  -- Verify exactly one owner exists
  SELECT COUNT(*) INTO v_owner_count
  FROM organization_members
  WHERE organization_id = p_org_id
  AND role = 'owner';

  IF v_owner_count != 1 THEN
    -- This should never happen, but safeguard anyway
    RAISE EXCEPTION 'Transfer failed: Invalid owner count (%). Transaction rolled back.', v_owner_count;
  END IF;

  -- Log the transfer to audit_logs if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    INSERT INTO audit_logs (
      performed_by,
      operation,
      table_name,
      record_id,
      metadata
    ) VALUES (
      p_current_owner_id,
      'UPDATE',
      'organizations',
      p_org_id::TEXT,
      jsonb_build_object(
        'action', 'transfer_ownership',
        'previous_owner', p_current_owner_id,
        'new_owner', p_new_owner_id
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Ownership transferred successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
