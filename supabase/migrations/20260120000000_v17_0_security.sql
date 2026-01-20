-- v17.0 Security & Authorization (Phase 0)
-- Comprehensive RLS Hardening & Audit Logging
-- CORRECTED: Fixed UUID type comparisons

-- 1. Create audit_logs table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs(performed_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = (SELECT auth.uid())
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 2. Harden services table RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published services" ON services;
CREATE POLICY "Public can view published services" ON services
    FOR SELECT
    USING (published = true);

DROP POLICY IF EXISTS "Org members can insert services" ON services;
CREATE POLICY "Org members can insert services" ON services
    FOR INSERT
    WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.user_id = (SELECT auth.uid())
            AND om.organization_id = services.org_id
            AND om.role IN ('owner', 'admin', 'editor')
        )
    );

DROP POLICY IF EXISTS "Org members can update own services" ON services;
CREATE POLICY "Org members can update own services" ON services
    FOR UPDATE
    USING (
        (SELECT auth.uid()) IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.user_id = (SELECT auth.uid())
            AND om.organization_id = services.org_id
            AND om.role IN ('owner', 'admin', 'editor')
        )
    );

DROP POLICY IF EXISTS "Org admins can delete own services" ON services;
CREATE POLICY "Org admins can delete own services" ON services
    FOR DELETE
    USING (
        (SELECT auth.uid()) IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.user_id = (SELECT auth.uid())
            AND om.organization_id = services.org_id
            AND om.role IN ('owner', 'admin')
        )
    );

-- 3. Harden feedback table RLS (CRITICAL LEAK FIX)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read feedback" ON feedback;
DROP POLICY IF EXISTS "Partners can view their feedback" ON feedback;
CREATE POLICY "Partners can view their feedback" ON feedback
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM services s
            JOIN organization_members om ON s.org_id = om.organization_id
            WHERE s.id = feedback.service_id
            AND om.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Authenticated users can update feedback" ON feedback;
DROP POLICY IF EXISTS "Partners can update feedback status" ON feedback;
CREATE POLICY "Partners can update feedback status" ON feedback
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM services s
            JOIN organization_members om ON s.org_id = om.organization_id
            WHERE s.id = feedback.service_id
            AND om.user_id = (SELECT auth.uid())
            AND om.role IN ('owner', 'admin', 'editor')
        )
    );

-- 4. Harden service_update_requests RLS (CRITICAL LEAK FIX)
ALTER TABLE service_update_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners can see own requests" ON service_update_requests;
DROP POLICY IF EXISTS "Partners can view own requests" ON service_update_requests;
CREATE POLICY "Partners can view own requests" ON service_update_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM services s
            JOIN organization_members om ON s.org_id = om.organization_id
            WHERE s.id = service_update_requests.service_id
            AND om.user_id = (SELECT auth.uid())
        )
    );

-- 5. Harden plain_language_summaries RLS
ALTER TABLE plain_language_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can manage summaries" ON plain_language_summaries;
DROP POLICY IF EXISTS "Authenticated can write summaries" ON plain_language_summaries;
DROP POLICY IF EXISTS "Authenticated can update summaries" ON plain_language_summaries;
DROP POLICY IF EXISTS "Authenticated can delete summaries" ON plain_language_summaries;

CREATE POLICY "Partners can manage own summaries" ON plain_language_summaries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM services s
            JOIN organization_members om ON s.org_id = om.organization_id
            WHERE s.id = plain_language_summaries.service_id
            AND om.user_id = (SELECT auth.uid())
            AND om.role IN ('owner', 'admin', 'editor')
        )
    );
