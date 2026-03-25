-- Migration: 20260108_add_scope_enum.sql
-- v11.0: Add scope enum for Ontario expansion
-- Purpose: Replace is_provincial boolean with explicit scope enum

-- 1. Create the scope enum type
DO $$ BEGIN
    CREATE TYPE service_scope AS ENUM ('kingston', 'ontario', 'canada');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add scope column to services table (default to kingston)
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS scope service_scope DEFAULT 'kingston';

-- 3. Add new fields for provincial service metadata
ALTER TABLE services ADD COLUMN IF NOT EXISTS virtual_delivery BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS primary_phone_label TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_area TEXT;

-- 4. Migrate existing is_provincial data to new scope column
-- (Only run if is_provincial column exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'services' AND column_name = 'is_provincial') THEN
        UPDATE services SET scope = 'ontario' WHERE is_provincial = true;
        UPDATE services SET virtual_delivery = true WHERE is_provincial = true;
    END IF;
END $$;

-- 5. Update the public view to expose scope and new fields
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
  scope,
  virtual_delivery,
  primary_phone_label,
  created_at
FROM services
WHERE 
  published = true 
  AND (verification_status IS NULL OR verification_status NOT IN ('draft', 'archived'));

-- 6. Grant access to the updated view
GRANT SELECT ON services_public TO anon;
GRANT SELECT ON services_public TO authenticated;

-- 7. Add index for scope filtering
CREATE INDEX IF NOT EXISTS idx_services_scope ON services(scope);
