-- =====================================================================================
-- Migration: v22.0 Pilot Metric Source Instrumentation (Additive Only)
-- =====================================================================================
-- Purpose:
-- 1. Add source tables for M2/M4/M5/M6/M7 pilot metrics.
-- 2. Add opaque repeat-failure attribution on pilot contact attempts.
-- 3. Preserve privacy-safe constraints and organization-scoped RLS policies.
--
-- Safety:
-- - Additive only.
-- - No destructive data migration or mutation of existing service records.
-- =====================================================================================

ALTER TABLE pilot_contact_attempt_events
  ADD COLUMN IF NOT EXISTS entity_key_hash TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pilot_contact_attempt_entity_key_hash_format'
  ) THEN
    ALTER TABLE pilot_contact_attempt_events
      ADD CONSTRAINT pilot_contact_attempt_entity_key_hash_format
      CHECK (entity_key_hash IS NULL OR entity_key_hash ~ '^[0-9A-Fa-f]{64}$');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pilot_contact_attempt_cycle_org_entity_hash
  ON pilot_contact_attempt_events(pilot_cycle_id, recorded_by_org_id, entity_key_hash)
  WHERE entity_key_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS pilot_connection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_cycle_id TEXT NOT NULL CHECK (char_length(pilot_cycle_id) <= 100),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  service_id TEXT NOT NULL REFERENCES services(id),
  connected_at TIMESTAMPTZ NOT NULL,
  contact_attempt_event_id UUID REFERENCES pilot_contact_attempt_events(id) ON DELETE SET NULL,
  referral_event_id UUID REFERENCES pilot_referral_events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pilot_connection_exactly_one_anchor
    CHECK (((contact_attempt_event_id IS NOT NULL)::int + (referral_event_id IS NOT NULL)::int) = 1)
);

CREATE INDEX IF NOT EXISTS idx_pilot_connection_cycle_org_time
  ON pilot_connection_events(pilot_cycle_id, org_id, connected_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_connection_contact_attempt
  ON pilot_connection_events(contact_attempt_event_id)
  WHERE contact_attempt_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pilot_connection_referral
  ON pilot_connection_events(referral_event_id)
  WHERE referral_event_id IS NOT NULL;

ALTER TABLE pilot_connection_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pilot connections select" ON pilot_connection_events;
CREATE POLICY "Pilot connections select" ON pilot_connection_events
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_connection_events.org_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Pilot connections insert" ON pilot_connection_events;
CREATE POLICY "Pilot connections insert" ON pilot_connection_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_connection_events.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Pilot connections update" ON pilot_connection_events;
CREATE POLICY "Pilot connections update" ON pilot_connection_events
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_connection_events.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_connection_events.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Pilot connections delete" ON pilot_connection_events;
CREATE POLICY "Pilot connections delete" ON pilot_connection_events
  FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE TABLE IF NOT EXISTS pilot_service_scope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_cycle_id TEXT NOT NULL CHECK (char_length(pilot_cycle_id) <= 100),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  service_id TEXT NOT NULL REFERENCES services(id),
  sla_tier TEXT NOT NULL CHECK (sla_tier IN ('crisis', 'high_demand', 'standard')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pilot_service_scope_unique UNIQUE (pilot_cycle_id, org_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_pilot_scope_cycle_org_service
  ON pilot_service_scope(pilot_cycle_id, org_id, service_id);

ALTER TABLE pilot_service_scope ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pilot scope select" ON pilot_service_scope;
CREATE POLICY "Pilot scope select" ON pilot_service_scope
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_service_scope.org_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Pilot scope insert" ON pilot_service_scope;
CREATE POLICY "Pilot scope insert" ON pilot_service_scope
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_service_scope.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Pilot scope update" ON pilot_service_scope;
CREATE POLICY "Pilot scope update" ON pilot_service_scope
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_service_scope.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_service_scope.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Pilot scope delete" ON pilot_service_scope;
CREATE POLICY "Pilot scope delete" ON pilot_service_scope
  FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE TABLE IF NOT EXISTS service_operational_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_cycle_id TEXT NOT NULL CHECK (char_length(pilot_cycle_id) <= 100),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  service_id TEXT NOT NULL REFERENCES services(id),
  checked_at TIMESTAMPTZ NOT NULL,
  status_code TEXT NOT NULL CHECK (status_code IN ('available', 'temporarily_unavailable', 'closed', 'unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_status_cycle_org_service_checked
  ON service_operational_status_events(pilot_cycle_id, org_id, service_id, checked_at DESC);

ALTER TABLE service_operational_status_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pilot service status select" ON service_operational_status_events;
CREATE POLICY "Pilot service status select" ON service_operational_status_events
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = service_operational_status_events.org_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Pilot service status insert" ON service_operational_status_events;
CREATE POLICY "Pilot service status insert" ON service_operational_status_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = service_operational_status_events.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Pilot service status update" ON service_operational_status_events;
CREATE POLICY "Pilot service status update" ON service_operational_status_events
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = service_operational_status_events.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = service_operational_status_events.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Pilot service status delete" ON service_operational_status_events;
CREATE POLICY "Pilot service status delete" ON service_operational_status_events
  FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE TABLE IF NOT EXISTS pilot_data_decay_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_cycle_id TEXT NOT NULL CHECK (char_length(pilot_cycle_id) <= 100),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  service_id TEXT NOT NULL REFERENCES services(id),
  audited_at TIMESTAMPTZ NOT NULL,
  is_fatal BOOLEAN NOT NULL,
  fatal_error_category TEXT CHECK (
    fatal_error_category IS NULL
    OR fatal_error_category IN (
      'wrong_or_disconnected_phone',
      'invalid_or_defunct_intake_path',
      'materially_incorrect_eligibility',
      'service_closed_or_unavailable_but_listed_available'
    )
  ),
  verification_mode TEXT NOT NULL CHECK (
    verification_mode IN ('web_only', 'web_plus_call', 'provider_confirmation')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pilot_data_decay_fatal_category_required
    CHECK (
      (is_fatal = TRUE AND fatal_error_category IS NOT NULL)
      OR (is_fatal = FALSE AND fatal_error_category IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_pilot_data_decay_cycle_org_audited
  ON pilot_data_decay_audits(pilot_cycle_id, org_id, audited_at DESC);

ALTER TABLE pilot_data_decay_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pilot data decay audits select" ON pilot_data_decay_audits;
CREATE POLICY "Pilot data decay audits select" ON pilot_data_decay_audits
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_data_decay_audits.org_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Pilot data decay audits insert" ON pilot_data_decay_audits;
CREATE POLICY "Pilot data decay audits insert" ON pilot_data_decay_audits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_data_decay_audits.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Pilot data decay audits update" ON pilot_data_decay_audits;
CREATE POLICY "Pilot data decay audits update" ON pilot_data_decay_audits
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_data_decay_audits.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_data_decay_audits.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Pilot data decay audits delete" ON pilot_data_decay_audits;
CREATE POLICY "Pilot data decay audits delete" ON pilot_data_decay_audits
  FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE TABLE IF NOT EXISTS pilot_preference_fit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_cycle_id TEXT NOT NULL CHECK (char_length(pilot_cycle_id) <= 100),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  cohort_label TEXT NOT NULL CHECK (char_length(cohort_label) BETWEEN 1 AND 100),
  recorded_at TIMESTAMPTZ NOT NULL,
  preferred_via_helpbridge BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pilot_preference_fit_cycle_org_recorded
  ON pilot_preference_fit_events(pilot_cycle_id, org_id, recorded_at DESC);

ALTER TABLE pilot_preference_fit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pilot preference fit select" ON pilot_preference_fit_events;
CREATE POLICY "Pilot preference fit select" ON pilot_preference_fit_events
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_preference_fit_events.org_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Pilot preference fit insert" ON pilot_preference_fit_events;
CREATE POLICY "Pilot preference fit insert" ON pilot_preference_fit_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_preference_fit_events.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Pilot preference fit update" ON pilot_preference_fit_events;
CREATE POLICY "Pilot preference fit update" ON pilot_preference_fit_events
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_preference_fit_events.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = pilot_preference_fit_events.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Pilot preference fit delete" ON pilot_preference_fit_events;
CREATE POLICY "Pilot preference fit delete" ON pilot_preference_fit_events
  FOR DELETE
  TO authenticated
  USING (is_admin());
