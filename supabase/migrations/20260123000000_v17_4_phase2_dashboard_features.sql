-- v17.4 Phase 2: Dashboard Feature Completion
-- Purpose: Add organization settings, member invitations, and enhanced notifications
-- Dependencies: v17.4 Phase 1 (20260122000000_v17_4_phase1_rls_extensions.sql)

-- =============================================================================
-- 1. ORGANIZATION SETTINGS TABLE
-- =============================================================================
-- Store organization-level preferences and settings

CREATE TABLE IF NOT EXISTS organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,

  -- Contact Information
  website TEXT,
  phone TEXT,
  description TEXT,

  -- Notification Preferences
  email_on_feedback BOOLEAN DEFAULT true,
  email_on_service_update BOOLEAN DEFAULT true,
  weekly_analytics_report BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for organization_settings
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

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

COMMENT ON TABLE organization_settings IS
  'Organization-level settings and notification preferences. RLS ensures only org members can access.';

-- =============================================================================
-- 2. ORGANIZATION INVITATIONS TABLE
-- =============================================================================
-- Track pending member invitations

CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),

  UNIQUE(organization_id, email)
);

CREATE INDEX idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_expires ON organization_invitations(expires_at) WHERE accepted_at IS NULL;

-- RLS for organization_invitations
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

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

COMMENT ON TABLE organization_invitations IS
  'Pending member invitations. Invites expire after 7 days.';

-- =============================================================================
-- 3. FUNCTION: Generate Invitation Token
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_invitation_token() TO authenticated;

COMMENT ON FUNCTION generate_invitation_token IS
  'Generates a secure random token for member invitations';

-- =============================================================================
-- 4. FUNCTION: Accept Invitation
-- =============================================================================
CREATE OR REPLACE FUNCTION accept_organization_invitation(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  invitation_record organization_invitations%ROWTYPE;
  new_member_id UUID;
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
  ) RETURNING id INTO new_member_id;

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

GRANT EXECUTE ON FUNCTION accept_organization_invitation(TEXT) TO authenticated;

COMMENT ON FUNCTION accept_organization_invitation IS
  'Accepts an organization invitation and adds the user as a member';

-- =============================================================================
-- 5. SOFT DELETE FIELDS FOR SERVICES
-- =============================================================================
-- Add soft delete fields if they don't exist

DO $$
BEGIN
  -- Add deleted_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE services ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_services_deleted_at ON services(deleted_at);
  END IF;

  -- Add deleted_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE services ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Update partner_service_analytics view to exclude deleted services
DROP VIEW IF EXISTS partner_service_analytics;

CREATE VIEW partner_service_analytics AS
SELECT
  s.id as service_id,
  s.name,
  s.org_id,
  s.verification_status,
  COALESCE(fa.helpful_yes_count, 0) as helpful_yes_count,
  COALESCE(fa.helpful_no_count, 0) as helpful_no_count,
  COALESCE(fa.open_issues_count, 0) as open_issues_count,
  fa.last_feedback_at,
  -- Calculate helpfulness rate
  CASE
    WHEN COALESCE(fa.helpful_yes_count, 0) + COALESCE(fa.helpful_no_count, 0) = 0 THEN NULL
    ELSE ROUND(
      (COALESCE(fa.helpful_yes_count, 0)::NUMERIC /
       (COALESCE(fa.helpful_yes_count, 0) + COALESCE(fa.helpful_no_count, 0))) * 100,
      1
    )
  END as helpfulness_percentage
FROM services s
LEFT JOIN feedback_aggregations fa ON s.id = fa.service_id
WHERE s.deleted_at IS NULL;  -- Exclude soft-deleted services

ALTER VIEW partner_service_analytics SET (security_invoker = true);
GRANT SELECT ON partner_service_analytics TO authenticated;

COMMENT ON VIEW partner_service_analytics IS
  'Partner-specific service analytics excluding deleted services. RLS from services table applies automatically.';

-- =============================================================================
-- 6. FUNCTION: Soft Delete Service
-- =============================================================================
CREATE OR REPLACE FUNCTION soft_delete_service(service_uuid TEXT)
RETURNS JSONB AS $$
DECLARE
  service_record services%ROWTYPE;
BEGIN
  -- Check if user can manage this service (RLS will also enforce this)
  IF NOT user_can_manage_service(auth.uid(), service_uuid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get service record
  SELECT * INTO service_record FROM services WHERE id = service_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Service not found');
  END IF;

  IF service_record.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Service already deleted');
  END IF;

  -- Soft delete the service
  UPDATE services
  SET
    deleted_at = NOW(),
    deleted_by = auth.uid(),
    published = false  -- Unpublish deleted services
  WHERE id = service_uuid;

  RETURN jsonb_build_object('success', true, 'message', 'Service deleted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION soft_delete_service(TEXT) TO authenticated;

COMMENT ON FUNCTION soft_delete_service IS
  'Soft deletes a service. Checks ownership before deletion.';

-- =============================================================================
-- 7. AUDIT LOG ENTRY
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      operation,
      new_data,
      performed_by,
      metadata
    ) VALUES (
      'migrations',
      '20260123000000_v17_4_phase2_dashboard_features',
      'CREATE',
      jsonb_build_object(
        'migration', 'v17.4 Phase 2 Dashboard Features',
        'description', 'Added organization_settings, invitations, and service soft delete'
      ),
      NULL,
      jsonb_build_object('automated', true)
    );
  END IF;
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Next steps:
-- 1. Update settings page to use organization_settings table
-- 2. Implement member invitation UI
-- 3. Create service creation endpoint
-- 4. Test soft delete functionality
-- =============================================================================
