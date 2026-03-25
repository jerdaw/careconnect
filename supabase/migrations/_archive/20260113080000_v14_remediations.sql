-- v14.0 Remediations: Security & Privacy

-- 1. Fix Feedback RLS
-- Partners should only see feedback for their own services, plus global "not found" feedback.
DROP POLICY IF EXISTS "Authenticated users can read feedback" ON feedback;
CREATE POLICY "Partners can read feedback" ON feedback
FOR SELECT TO authenticated USING (
  (service_id IS NULL) OR
  EXISTS (
    SELECT 1 FROM services
    WHERE services.id = feedback.service_id
    AND services.org_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Authenticated users can update feedback" ON feedback;
CREATE POLICY "Partners can update feedback" ON feedback
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM services
    WHERE services.id = feedback.service_id
    AND services.org_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
);

-- 2. Fix Service Update Requests RLS
-- Partners should only manage requests for their own services.
DROP POLICY IF EXISTS "Partners can request updates" ON service_update_requests;
CREATE POLICY "Partners can request updates" ON service_update_requests
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM services
    WHERE services.id = service_update_requests.service_id
    AND services.org_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Partners can see own requests" ON service_update_requests;
CREATE POLICY "Partners can see requests" ON service_update_requests
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM services
    WHERE services.id = service_update_requests.service_id
    AND services.org_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  )
);

-- 3. Analytics Access
-- Grant SELECT on materialized views to anon for public Impact page.
GRANT SELECT ON feedback_aggregations TO anon;
GRANT SELECT ON unmet_needs_summary TO anon;
GRANT SELECT ON feedback_aggregations TO authenticated;
GRANT SELECT ON unmet_needs_summary TO authenticated;

-- 4. Improve Impact Page Performance (Materialized View update)
DROP MATERIALIZED VIEW IF EXISTS feedback_aggregations;
CREATE MATERIALIZED VIEW feedback_aggregations AS
SELECT
  service_id,
  count(*) FILTER (WHERE feedback_type = 'helpful_yes') AS helpful_yes_count,
  count(*) FILTER (WHERE feedback_type = 'helpful_no') AS helpful_no_count,
  count(*) FILTER (WHERE feedback_type = 'issue') AS total_issues_count,
  count(*) FILTER (WHERE feedback_type = 'issue' AND status = 'resolved') AS resolved_issues_count,
  count(*) FILTER (WHERE feedback_type = 'issue' AND status = 'pending') AS open_issues_count,
  max(created_at) AS last_feedback_at
FROM feedback
WHERE service_id IS NOT NULL
GROUP BY service_id;

CREATE INDEX idx_feedback_agg_service ON feedback_aggregations(service_id);

GRANT SELECT ON feedback_aggregations TO anon;
GRANT SELECT ON feedback_aggregations TO authenticated;
