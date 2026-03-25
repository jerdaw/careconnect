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
-- NOTE: Only includes columns that exist in the services table
-- Must DROP first since CREATE OR REPLACE cannot remove columns
DROP VIEW IF EXISTS services_public;

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
  created_at,
  -- v16.0 ranking fields
  authority_tier,
  resource_indicators
FROM services
WHERE 
  published = true 
  AND (verification_status IS NULL OR verification_status NOT IN ('draft', 'archived'));

-- Re-grant permissions (dropped with the view)
GRANT SELECT ON services_public TO anon;
GRANT SELECT ON services_public TO authenticated;
