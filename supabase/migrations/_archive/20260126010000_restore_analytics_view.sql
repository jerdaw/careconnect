-- =====================================================================================
-- Migration: Restore Partner Service Analytics View
-- =====================================================================================
-- Purpose: Restore the partner_service_analytics view which was dropped by cascade.
-- It now points to the new feedback_aggregations View instead of the old Materialized View.
-- Date: 2026-01-26
-- =====================================================================================

DROP VIEW IF EXISTS partner_service_analytics;

CREATE VIEW partner_service_analytics AS
SELECT
  s.id as service_id,
  s.name,
  s.org_id,
  s.verification_status,
  COALESCE(fa.helpful_yes_count, 0) as helpful_yes_count,
  COALESCE(fa.helpful_no_count, 0) as helpful_no_count,
  COALESCE(fa.open_issues_count, 0) as open_issues_count,
  fa.last_feedback_at,
  -- Calculate helpfulness rate
  CASE
    WHEN COALESCE(fa.helpful_yes_count, 0) + COALESCE(fa.helpful_no_count, 0) = 0 THEN NULL
    ELSE ROUND(
      (COALESCE(fa.helpful_yes_count, 0)::NUMERIC /
       (COALESCE(fa.helpful_yes_count, 0) + COALESCE(fa.helpful_no_count, 0))) * 100,
      1
    )
  END as helpfulness_percentage
FROM services s
LEFT JOIN feedback_aggregations fa ON s.id = fa.service_id
WHERE s.deleted_at IS NULL;  -- Exclude soft-deleted services

ALTER VIEW partner_service_analytics SET (security_invoker = true);
GRANT SELECT ON partner_service_analytics TO authenticated;

COMMENT ON VIEW partner_service_analytics IS
  'Partner-specific service analytics excluding deleted services. RLS from services table applies automatically.';
