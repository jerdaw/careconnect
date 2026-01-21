-- Migration: 20260121000000_dashboard_completion.sql
-- Purpose: Support real notifications and enforce multi-tenant isolation

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read) WHERE read = false;

-- RLS for Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Harden RLS for Services
-- Partners should only be able to view/edit services belonging to their organization
-- We already have some policies, but let's ensure they are strict.

DROP POLICY IF EXISTS "Partners can manage their own services" ON services;

CREATE POLICY "Partners can view their organization's services" ON services
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can manage their organization's services" ON services
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

-- 3. Harden RLS for Feedback
-- Partners should only see feedback for their services

DROP POLICY IF EXISTS "Partners can view feedback" ON feedback;

CREATE POLICY "Partners can view feedback for their services" ON feedback
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = feedback.service_id
      AND om.user_id = auth.uid()
    )
  );

-- 4. Admin Bypass (Implicitly handled if they have 'admin' role in auth.users, 
-- but we usually handle it by adding them to every org or checking role)
-- For this pilot, admins can be added to a "Global" org if needed, but let's 
-- add a policy for system admins specifically if they have the role in metadata.

CREATE POLICY "Admins have full access to services" ON services
  FOR ALL TO authenticated
  USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' )
  WITH CHECK ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

CREATE POLICY "Admins have full access to feedback" ON feedback
  FOR ALL TO authenticated
  USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' )
  WITH CHECK ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );
