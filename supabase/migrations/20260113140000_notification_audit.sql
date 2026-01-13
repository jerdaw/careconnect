-- Create notification_audit table for tracking push notifications
CREATE TABLE IF NOT EXISTS notification_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT DEFAULT 'broadcast',
    onesignal_id TEXT,
    sent_by UUID REFERENCES auth.users(id),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_notification_audit_sent_by ON notification_audit(sent_by);
CREATE INDEX idx_notification_audit_sent_at ON notification_audit(sent_at DESC);
CREATE INDEX idx_notification_audit_onesignal_id ON notification_audit(onesignal_id);

-- Enable RLS
ALTER TABLE notification_audit ENABLE ROW LEVEL SECURITY;

-- Admin users can view all notifications
CREATE POLICY "Admins can view notification audit"
    ON notification_audit
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Service role can insert (used by API)
CREATE POLICY "Service role can insert notifications"
    ON notification_audit
    FOR INSERT
    WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON notification_audit TO authenticated;
GRANT INSERT ON notification_audit TO service_role;
