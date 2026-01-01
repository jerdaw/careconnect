-- Feedback table for user-submitted corrections
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'wrong_phone', 'wrong_address', 'service_closed', 'other'
  )),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Index for dashboard queries
CREATE INDEX idx_feedback_service_id ON feedback(service_id);
CREATE INDEX idx_feedback_status ON feedback(status);

-- RLS Policies
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Public can submit feedback (anonymous)
CREATE POLICY "Public can submit feedback"
  ON feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Partners can view feedback for their services
CREATE POLICY "Partners can view their feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN org_members om ON s.org_id = om.org_id
      WHERE s.id = feedback.service_id
      AND om.user_id = auth.uid()
    )
  );

-- Partners can update feedback status
CREATE POLICY "Partners can update feedback status"
  ON feedback FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN org_members om ON s.org_id = om.org_id
      WHERE s.id = feedback.service_id
      AND om.user_id = auth.uid()
    )
  );
