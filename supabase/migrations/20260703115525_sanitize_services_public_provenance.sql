-- Sanitize internal verifier identifiers on the public service projection.
-- The source services.provenance value is preserved for authenticated partner/admin flows.

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
  CASE
    WHEN provenance->>'verified_by' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN jsonb_set(provenance, '{verified_by}', to_jsonb('CareConnect Admin'::text), true)
    ELSE provenance
  END AS provenance,
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
