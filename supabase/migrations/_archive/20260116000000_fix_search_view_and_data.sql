-- Migration: 20260116000000_fix_search_view_and_data.sql
-- Fixes critical data integrity issues for Search API:
-- 1. Adds missing v16.0 search columns to 'services' table
-- 2. Updates 'crisis-988' scope to 'canada'
-- 3. Re-creates 'services_public' view with correct columns

-- 1. Schema Update: Add missing v16.0 columns
ALTER TABLE services ADD COLUMN IF NOT EXISTS synthetic_queries TEXT[];
ALTER TABLE services ADD COLUMN IF NOT EXISTS synthetic_queries_fr TEXT[];
ALTER TABLE services ADD COLUMN IF NOT EXISTS authority_tier TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS resource_indicators JSONB;
ALTER TABLE services ADD COLUMN IF NOT EXISTS coordinates JSONB;

-- 2. Data Fix
UPDATE services
SET scope = 'canada'
WHERE id = 'crisis-988';

-- 3. View Definition Update
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
  -- v11.0 Scope & delivery
  scope,
  virtual_delivery,
  primary_phone_label,
  created_at,
  -- v16.0 Search Ranking Fields
  authority_tier,
  resource_indicators,
  synthetic_queries,
  synthetic_queries_fr,
  coordinates
FROM services
WHERE 
  published = true 
  AND (verification_status IS NULL OR verification_status NOT IN ('draft', 'archived'));

-- Grant access (idempotent)
GRANT SELECT ON services_public TO anon;
GRANT SELECT ON services_public TO authenticated;
