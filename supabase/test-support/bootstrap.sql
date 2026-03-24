BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP VIEW IF EXISTS services_public CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_fr TEXT,
  description TEXT,
  description_fr TEXT,
  address TEXT,
  address_fr TEXT,
  phone TEXT,
  url TEXT,
  email TEXT,
  hours JSONB,
  fees TEXT,
  eligibility TEXT,
  application_process TEXT,
  languages TEXT[],
  bus_routes TEXT[],
  accessibility JSONB,
  last_verified TIMESTAMPTZ,
  verification_status TEXT NOT NULL,
  category TEXT,
  tags JSONB,
  scope TEXT,
  virtual_delivery BOOLEAN DEFAULT FALSE,
  primary_phone_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  authority_tier TEXT,
  resource_indicators JSONB,
  synthetic_queries TEXT[],
  synthetic_queries_fr TEXT[],
  coordinates JSONB,
  embedding JSONB,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  admin_notes TEXT,
  last_admin_review TIMESTAMPTZ,
  reviewed_by UUID,
  provenance JSONB
);

CREATE TABLE organization_members (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible services" ON services
  FOR SELECT TO anon, authenticated
  USING (
    published = TRUE
    AND deleted_at IS NULL
    AND verification_status IN ('L1', 'L2', 'L3')
  );

CREATE POLICY "Service role can manage services" ON services
  FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Users can read own memberships" ON organization_members
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role can read memberships" ON organization_members
  FOR SELECT TO service_role
  USING (TRUE);

CREATE POLICY "Service role can read organizations" ON organizations
  FOR SELECT TO service_role
  USING (TRUE);

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
  scope,
  virtual_delivery,
  primary_phone_label,
  created_at,
  authority_tier,
  resource_indicators,
  synthetic_queries,
  synthetic_queries_fr,
  coordinates,
  provenance
FROM services
WHERE
  published = TRUE
  AND deleted_at IS NULL
  AND verification_status IN ('L1', 'L2', 'L3');

ALTER VIEW services_public SET (security_invoker = true);

CREATE POLICY "Public can insert analytics for visible services" ON analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    event_type IN ('view', 'view_detail', 'click_call', 'click_website')
    AND service_id IN (SELECT id FROM services_public)
  );

CREATE POLICY "Public can submit feedback for visible services" ON feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    feedback_type <> ''
    AND (
      service_id IS NULL
      OR service_id IN (SELECT id FROM services_public)
    )
  );

CREATE POLICY "Service role can manage analytics" ON analytics_events
  FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Service role can manage feedback" ON feedback
  FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON services TO anon, authenticated, service_role;
GRANT SELECT ON services_public TO anon, authenticated, service_role;
GRANT SELECT ON organization_members TO authenticated, service_role;
GRANT INSERT, SELECT ON analytics_events TO anon, authenticated, service_role;
GRANT INSERT, SELECT ON feedback TO anon, authenticated, service_role;
GRANT SELECT ON organizations TO authenticated, service_role;

COMMIT;
