-- Fix live RLS recursion between organization_members and services.
-- Date: 2026-03-11
-- Reason: public reads were failing with
--   42P17 infinite recursion detected in policy for relation "organization_members"
--
-- Scope:
-- 1. add helper functions that read organization membership via SECURITY DEFINER
-- 2. replace only the organization_members and services policies that depended
--    on direct self-referential organization_members subqueries

BEGIN;

CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = target_org_id
      AND om.user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_org_admin(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = target_org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_org_services(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = target_org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'editor')
  );
$function$;

GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO public;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO public;
GRANT EXECUTE ON FUNCTION public.can_manage_org_services(UUID) TO public;

DROP POLICY IF EXISTS "Admins can delete members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;

CREATE POLICY "Members can view org members" ON public.organization_members
  FOR SELECT
  TO public
  USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can manage members" ON public.organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can update members" ON public.organization_members
  FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can delete members" ON public.organization_members
  FOR DELETE
  TO authenticated
  USING (public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "Unified delete policy for services" ON public.services;
DROP POLICY IF EXISTS "Unified insert policy for services" ON public.services;
DROP POLICY IF EXISTS "Unified update policy for services" ON public.services;
DROP POLICY IF EXISTS "Unified view policy for services" ON public.services;

CREATE POLICY "Unified view policy for services" ON public.services
  FOR SELECT
  TO public
  USING (
    published = true
    OR (
      (SELECT auth.role()) = 'authenticated'
      AND (
        public.is_admin()
        OR public.is_org_member(org_id)
      )
    )
  );

CREATE POLICY "Unified insert policy for services" ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.can_manage_org_services(org_id)
  );

CREATE POLICY "Unified update policy for services" ON public.services
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR public.can_manage_org_services(org_id)
  )
  WITH CHECK (
    public.is_admin()
    OR public.can_manage_org_services(org_id)
  );

CREATE POLICY "Unified delete policy for services" ON public.services
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR public.can_manage_org_services(org_id)
  );

COMMIT;
