# Fixing RLS Infinite Recursion

## Issue
The health check and load tests are failing with `503 Service Unavailable` due to a database error:
`infinite recursion detected in policy for relation "organization_members"`

## Cause
The Row Level Security (RLS) policy on `organization_members` is querying the `organization_members` table itself to verify membership. This creates a recursive loop.

**Recursive Policy:**
```sql
CREATE POLICY "Members can view org members" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
    )
  );
```

## Fix
To break the recursion, we need to extract the membership check into a `SECURITY DEFINER` function. This function bypasses RLS policies when executed, preventing the loop.

### Step 1: Create the Helper Function

Run the following SQL in the Supabase SQL Editor:

```sql
-- Function to check if current user is member of an organization
-- SECURITY DEFINER allows it to bypass RLS on organization_members
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$;
```

### Step 2: Update Policies

Update the inconsistent policies to use this function.

**For `organization_members`:**
```sql
DROP POLICY IF EXISTS "Members can view org members" ON organization_members;

CREATE POLICY "Members can view org members" ON organization_members
  FOR SELECT USING (
    is_org_member(organization_id)
  );
```

**For `services` (Unified view policy):**
```sql
DROP POLICY IF EXISTS "Unified view policy for services" ON services;

CREATE POLICY "Unified view policy for services" ON services
  FOR SELECT
  TO public
  USING (
    published = true
    OR
    (
      auth.role() = 'authenticated' AND (
        is_admin()
        OR
        is_org_member(org_id)
      )
    )
  );
```

### Step 3: Verify

Run the smoke test again to verify the fix:
```bash
npm run test:load:smoke
```
