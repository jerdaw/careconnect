BEGIN;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS access_script TEXT,
  ADD COLUMN IF NOT EXISTS access_script_fr TEXT;

CREATE TABLE IF NOT EXISTS notification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'broadcast',
  onesignal_id TEXT,
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_audit_sent_by ON notification_audit(sent_by);
CREATE INDEX IF NOT EXISTS idx_notification_audit_sent_at ON notification_audit(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_audit_onesignal_id ON notification_audit(onesignal_id);

ALTER TABLE notification_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view notification audit" ON notification_audit;
CREATE POLICY "Admins can view notification audit" ON notification_audit
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert notification audit" ON notification_audit;
CREATE POLICY "Admins can insert notification audit" ON notification_audit
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Service role can insert notification audit" ON notification_audit;
CREATE POLICY "Service role can insert notification audit" ON notification_audit
  FOR INSERT TO service_role
  WITH CHECK (true);

GRANT SELECT, INSERT ON notification_audit TO authenticated, service_role;

CREATE OR REPLACE VIEW services_public AS
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
  provenance,
  hours_text,
  hours_text_fr,
  eligibility_fr,
  application_process_fr,
  access_script,
  access_script_fr
FROM services
WHERE
  published = TRUE
  AND deleted_at IS NULL
  AND verification_status IN ('L1', 'L2', 'L3');

ALTER VIEW services_public SET (security_invoker = true);
GRANT SELECT ON services_public TO anon, authenticated, service_role;

COMMIT;
