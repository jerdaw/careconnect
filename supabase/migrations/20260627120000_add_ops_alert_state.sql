-- Durable operator notification state for critical-only recovery gating.

CREATE TABLE IF NOT EXISTS ops_alert_state (
  incident_key TEXT PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT 'slack',
  notification_tier TEXT NOT NULL CHECK (notification_tier IN ('P0', 'P1', 'P2', 'P3')),
  active BOOLEAN NOT NULL DEFAULT true,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_notified_at TIMESTAMPTZ,
  last_resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_alert_state_active_tier
  ON ops_alert_state(active, notification_tier)
  WHERE active = true;

ALTER TABLE ops_alert_state ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE ops_alert_state IS
  'Durable operator alert state used to send recovery notifications only after a P0/P1 incident paged.';
