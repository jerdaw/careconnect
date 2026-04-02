---
status: draft
last_updated: 2026-04-01
owner: jer
tags: [implementation, v22.0, phase-0, sql, metrics]
---

# v22.0 Phase 0 Baseline Query Spec

This document defines reproducible baseline query patterns for Phase 0 metrics.

Companion documents:

1. [v22.0 Phase 0 Baseline Metric Definitions](v22-0-phase-0-baseline-metric-definitions.md)
2. [v22.0 Phase 0 Implementation Plan](v22-0-phase-0-implementation-plan.md)
3. [v22.0 Phase 0 Baseline SQL Editor Runbook](v22-0-phase-0-baseline-sql-editor-runbook.md)

## Gate 0 Minimum Mode

As of 2026-04-01, the required Phase 0 pilot tables and fields are instrumented in the repo-local
schema. Historical baseline runs may still show `N/A` for M2/M4/M5/M6/M7 when the relevant source
tables are empty, but those metrics no longer depend on missing schema.

## Parameters

All executable queries must parameterize:

1. `:baseline_start` (date/timestamp)
2. `:baseline_end` (date/timestamp)
3. `:pilot_cycle_id` (string, optional for pre-pilot compatibility)
4. `:org_id` (UUID, required for org-scoped pilot metrics beyond historical pre-pilot compatibility)

## Query Versioning

Use this metadata header in every saved query:

```sql
-- query_id: v22_phase0_m1_failed_contact_rate
-- query_version: 2
-- owner: jer
-- last_updated: 2026-03-09
```

## Preflight: Schema Dependency Check

Run this before metric execution to verify available dependencies:

```sql
-- query_id: v22_phase0_preflight_schema_dependencies
-- query_version: 1
-- owner: jer
-- last_updated: 2026-03-09
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'pilot_contact_attempt_events',
    'pilot_referral_events',
    'pilot_metric_snapshots',
    'pilot_connection_events',
    'pilot_service_scope',
    'service_operational_status_events',
    'pilot_data_decay_audits',
    'pilot_preference_fit_events'
  )
ORDER BY table_name;
```

## M1 Failed Contact Rate (Executable)

```sql
-- query_id: v22_phase0_m1_failed_contact_rate
-- query_version: 2
-- owner: jer
-- last_updated: 2026-03-09
WITH attempts AS (
  SELECT attempt_outcome
  FROM pilot_contact_attempt_events
  WHERE attempted_at >= :baseline_start
    AND attempted_at < :baseline_end
),
counts AS (
  SELECT
    COUNT(*) AS total_contact_attempts,
    COUNT(*) FILTER (
      WHERE attempt_outcome IN (
        'disconnected_number',
        'no_response',
        'intake_unavailable',
        'invalid_routing',
        'other_failure'
      )
    ) AS failed_contact_events
  FROM attempts
)
SELECT
  failed_contact_events,
  total_contact_attempts,
  CASE
    WHEN total_contact_attempts = 0 THEN NULL
    ELSE failed_contact_events::numeric / total_contact_attempts
  END AS failed_contact_rate
FROM counts;
```

## M2 Time to Successful Connection

```sql
-- query_id: v22_phase0_m2_time_to_connection
-- query_version: 3
-- owner: jer
-- last_updated: 2026-04-01
WITH connection_durations AS (
  SELECT
    EXTRACT(
      EPOCH FROM (
        pce.connected_at - COALESCE(pcae.attempted_at, pre.created_at)
      )
    ) / 3600.0 AS hours_to_connection
  FROM pilot_connection_events pce
  LEFT JOIN pilot_contact_attempt_events pcae
    ON pcae.id = pce.contact_attempt_event_id
  LEFT JOIN pilot_referral_events pre
    ON pre.id = pce.referral_event_id
  WHERE pce.pilot_cycle_id = :pilot_cycle_id
    AND pce.org_id = :org_id
    AND pce.connected_at >= :baseline_start
    AND pce.connected_at < :baseline_end
    AND COALESCE(pcae.attempted_at, pre.created_at) IS NOT NULL
)
SELECT
  percentile_cont(0.5) WITHIN GROUP (ORDER BY hours_to_connection) AS m2_p50_hours,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY hours_to_connection) AS m2_p75_hours,
  percentile_cont(0.9) WITHIN GROUP (ORDER BY hours_to_connection) AS m2_p90_hours,
  COUNT(*) AS successful_connections
FROM connection_durations;
```

## M3 Referral Completion Capture Rate (Executable)

```sql
-- query_id: v22_phase0_m3_referral_completion_capture_rate
-- query_version: 2
-- owner: jer
-- last_updated: 2026-03-09
WITH referrals AS (
  SELECT referral_state
  FROM pilot_referral_events
  WHERE created_at >= :baseline_start
    AND created_at < :baseline_end
),
counts AS (
  SELECT
    COUNT(*) AS total_referrals,
    COUNT(*) FILTER (
      WHERE referral_state IN ('connected', 'failed', 'client_withdrew', 'no_response_timeout')
    ) AS referrals_with_terminal_state
  FROM referrals
)
SELECT
  referrals_with_terminal_state,
  total_referrals,
  CASE
    WHEN total_referrals = 0 THEN NULL
    ELSE referrals_with_terminal_state::numeric / total_referrals
  END AS completion_capture_rate
FROM counts;
```

## M4 Freshness SLA Compliance

```sql
-- query_id: v22_phase0_m4_freshness_sla_compliance
-- query_version: 3
-- owner: jer
-- last_updated: 2026-04-01
WITH scoped_services AS (
  SELECT service_id, sla_tier
  FROM pilot_service_scope
  WHERE pilot_cycle_id = :pilot_cycle_id
    AND org_id = :org_id
),
latest_checks AS (
  SELECT
    service_id,
    MAX(checked_at) AS latest_checked_at
  FROM service_operational_status_events
  WHERE pilot_cycle_id = :pilot_cycle_id
    AND org_id = :org_id
    AND checked_at < :baseline_end
  GROUP BY service_id
),
compliance AS (
  SELECT
    ss.service_id,
    ss.sla_tier,
    lc.latest_checked_at,
    CASE ss.sla_tier
      WHEN 'crisis' THEN INTERVAL '24 hours'
      WHEN 'high_demand' THEN INTERVAL '48 hours'
      ELSE INTERVAL '7 days'
    END AS sla_window
  FROM scoped_services ss
  LEFT JOIN latest_checks lc
    ON lc.service_id = ss.service_id
)
SELECT
  COUNT(*) FILTER (
    WHERE latest_checked_at IS NOT NULL
      AND latest_checked_at >= (:baseline_end::timestamptz - sla_window)
  ) AS services_meeting_sla,
  COUNT(*) AS scoped_services_total,
  CASE
    WHEN COUNT(*) = 0 THEN NULL
    ELSE COUNT(*) FILTER (
      WHERE latest_checked_at IS NOT NULL
        AND latest_checked_at >= (:baseline_end::timestamptz - sla_window)
    )::numeric / COUNT(*)
  END AS freshness_sla_compliance
FROM compliance;
```

## M5 Repeat Failure Rate

```sql
-- query_id: v22_phase0_m5_repeat_failure_rate
-- query_version: 3
-- owner: jer
-- last_updated: 2026-04-01
WITH failed_attempts AS (
  SELECT entity_key_hash
  FROM pilot_contact_attempt_events
  WHERE pilot_cycle_id = :pilot_cycle_id
    AND recorded_by_org_id = :org_id
    AND attempted_at >= :baseline_start
    AND attempted_at < :baseline_end
    AND entity_key_hash IS NOT NULL
    AND attempt_outcome IN (
      'disconnected_number',
      'no_response',
      'intake_unavailable',
      'invalid_routing',
      'other_failure'
    )
),
grouped_failures AS (
  SELECT entity_key_hash, COUNT(*) AS failure_count
  FROM failed_attempts
  GROUP BY entity_key_hash
)
SELECT
  COUNT(*) FILTER (WHERE failure_count >= 2) AS repeat_failure_entities,
  COUNT(*) AS distinct_entities,
  CASE
    WHEN COUNT(*) = 0 THEN NULL
    ELSE COUNT(*) FILTER (WHERE failure_count >= 2)::numeric / COUNT(*)
  END AS repeat_failure_rate
FROM grouped_failures;
```

## M6 Data-Decay Fatal Error Rate

```sql
-- query_id: v22_phase0_m6_data_decay_fatal_error_rate
-- query_version: 3
-- owner: jer
-- last_updated: 2026-04-01
WITH audits AS (
  SELECT is_fatal, fatal_error_category
  FROM pilot_data_decay_audits
  WHERE pilot_cycle_id = :pilot_cycle_id
    AND org_id = :org_id
    AND audited_at >= :baseline_start
    AND audited_at < :baseline_end
)
SELECT
  COUNT(*) FILTER (WHERE is_fatal) AS fatal_audits,
  COUNT(*) AS audits_total,
  CASE
    WHEN COUNT(*) = 0 THEN NULL
    ELSE COUNT(*) FILTER (WHERE is_fatal)::numeric / COUNT(*)
  END AS fatal_error_rate
FROM audits;
```

## M7 Preference-Fit Indicator

```sql
-- query_id: v22_phase0_m7_preference_fit_indicator
-- query_version: 3
-- owner: jer
-- last_updated: 2026-04-01
WITH preference_events AS (
  SELECT preferred_via_helpbridge
  FROM pilot_preference_fit_events
  WHERE pilot_cycle_id = :pilot_cycle_id
    AND org_id = :org_id
    AND recorded_at >= :baseline_start
    AND recorded_at < :baseline_end
)
SELECT
  COUNT(*) FILTER (WHERE preferred_via_helpbridge) AS preferred_via_helpbridge_count,
  COUNT(*) AS cohort_total_tasks,
  CASE
    WHEN COUNT(*) = 0 THEN NULL
    ELSE COUNT(*) FILTER (WHERE preferred_via_helpbridge)::numeric / COUNT(*)
  END AS preference_fit_indicator
FROM preference_events;
```

## Gate 0 Minimum Execution Set

Run in order:

1. Preflight schema dependency check.
2. M1 failed contact rate query.
3. M2 time to successful connection query.
4. M3 referral completion capture rate query.
5. M4 freshness SLA compliance query.
6. M5 repeat failure rate query.
7. M6 data-decay fatal error rate query.
8. M7 preference-fit indicator query.

Reference helper script:

1. `supabase/scripts/v22-phase0-baseline-minimum.sql`

## Baseline Query QA Checklist

- [x] Query headers include `query_id` and `query_version`
- [x] Executable queries (M1, M3) use parameterized date inputs
- [x] Null/zero denominator behavior is explicitly handled for executable metrics
- [x] Conditional empty-data handling is explicitly documented for instrumented metrics
- [x] Baseline outputs saved with execution timestamp and owner
- [x] Metric outputs copied into baseline report artifact
