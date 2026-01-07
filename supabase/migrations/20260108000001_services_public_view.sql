-- Migration: 20260108000001_services_public_view.sql
-- v13.0 Librarian Model: Create public projection view and harden RLS

-- 1. Add 'published' column to services table
-- Default to true so existing services remain visible.
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

-- 2. Create the Public Projection View
-- Only includes columns that exist in the actual services table.
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
  created_at
  -- Deliberately excluded: embedding (internal), org_id (internal)
FROM services
WHERE 
  published = true 
  AND (verification_status IS NULL OR verification_status NOT IN ('draft', 'archived'));

-- 3. Harden RLS Policies

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Public services are viewable by everyone." ON services;

-- New policy: Only authenticated users can read from services table directly
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can select services' AND tablename = 'services') THEN
        CREATE POLICY "Authenticated can select services"
        ON services FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

-- Grant public (anon) access to the view only
GRANT SELECT ON services_public TO anon;
GRANT SELECT ON services_public TO authenticated;

-- Ensure RLS is active
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
