-- CareConnect: Concurrent Index Creation Script
-- This script should be run outside of a transaction block.
-- Purpose: Create indexes without locking tables to ensure zero-downtime.

-- Organization Members
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_invited_by ON organization_members(invited_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

-- Partner Terms
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partner_terms_service_id ON partner_terms(service_id);

-- Service Submissions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_submissions_reviewed_by ON service_submissions(reviewed_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_status ON service_submissions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_created ON service_submissions(created_at DESC);

-- Services
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_org_id ON services(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_scope ON services(scope);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_authority_tier ON services(authority_tier);

-- Feedback
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_agg_service ON feedback_aggregations(service_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_service_id ON feedback(service_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_audit_sent_by ON notification_audit(sent_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_audit_sent_at ON notification_audit(sent_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_audit_onesignal_id ON notification_audit(onesignal_id);

-- Push Subscriptions (GIN Index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_subscriptions_categories ON push_subscriptions USING GIN (categories);
