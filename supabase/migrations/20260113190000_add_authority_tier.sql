-- Add authority_tier column for ranking
-- This column helps prioritize official sources (government, healthcare) over community posts
ALTER TABLE services ADD COLUMN IF NOT EXISTS 
  authority_tier TEXT CHECK (authority_tier IN (
    'government', 'healthcare', 'established_nonprofit', 'community', 'unverified'
  ));

-- Add resource indicators as JSONB
-- Stores capacity data like staff_size, annual_budget, service_area_size
ALTER TABLE services ADD COLUMN IF NOT EXISTS 
  resource_indicators JSONB DEFAULT NULL;

-- Add index for authority-based sorting to speed up queries
CREATE INDEX IF NOT EXISTS idx_services_authority_tier 
  ON services(authority_tier);

-- Update the services_public view to include new columns
-- This is required for the API to see these fields
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
  eligibility_notes,
  eligibility_notes_fr,
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
  synthetic_queries,
  synthetic_queries_fr,
  created_at,
  -- NEW: v16.0 ranking fields
  authority_tier,
  resource_indicators,
  coordinates
FROM services
WHERE 
  published = true 
  AND (verification_status IS NULL OR verification_status NOT IN ('draft', 'archived'));
