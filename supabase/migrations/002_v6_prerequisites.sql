-- ============================================
-- V6 Prerequisites: Tables for upcoming features
-- ============================================

-- Service Submissions (Crowdsourcing Queue)
CREATE TABLE IF NOT EXISTS service_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  phone TEXT,
  url TEXT,
  address TEXT,
  submitted_by_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for admin review queue
CREATE INDEX IF NOT EXISTS idx_submissions_status ON service_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON service_submissions(created_at DESC);

-- RLS: Public can submit, only admins can view/update
ALTER TABLE service_submissions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can submit' AND tablename = 'service_submissions') THEN
        CREATE POLICY "Public can submit" ON service_submissions
          FOR INSERT TO anon, authenticated
          WITH CHECK (true);
    END IF;
END $$;

-- Push Subscriptions (for Phase 9)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  keys JSONB NOT NULL,
  categories TEXT[] NOT NULL DEFAULT ARRAY['general'],
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_categories ON push_subscriptions USING GIN (categories);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role only' AND tablename = 'push_subscriptions') THEN
        CREATE POLICY "Service role only" ON push_subscriptions
          FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Organization Members (for Phase 12)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can view org members' AND tablename = 'organization_members') THEN
        CREATE POLICY "Members can view org members" ON organization_members
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM organization_members om
              WHERE om.user_id = auth.uid()
              AND om.organization_id = organization_members.organization_id
            )
          );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage members' AND tablename = 'organization_members') THEN
        CREATE POLICY "Admins can manage members" ON organization_members
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM organization_members om
              WHERE om.user_id = auth.uid()
              AND om.organization_id = organization_members.organization_id
              AND om.role IN ('owner', 'admin')
            )
          );
    END IF;
END $$;
