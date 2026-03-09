---
status: draft
last_updated: 2026-03-09
owner: jer
tags: [implementation, v22.0, phase-0, sql, metrics]
---

# v22.0 Phase 0 Baseline Query Spec

This document defines reproducible baseline query patterns for Phase 0 metrics.

Companion documents:

1. [v22.0 Phase 0 Baseline Metric Definitions](v22-0-phase-0-baseline-metric-definitions.md)
2. [v22.0 Phase 0 Implementation Plan](v22-0-phase-0-implementation-plan.md)

## Gate 0 Minimum Mode

As of 2026-03-09, only M1 and M3 are executable against current pilot schema.

M2, M4, M5, M6, and M7 remain `N/A` until their required tables/fields are instrumented.

## Parameters

All executable queries must parameterize:

1. `:baseline_start` (date/timestamp)
2. `:baseline_end` (date/timestamp)
3. `:pilot_cycle_id` (string, optional for pre-pilot compatibility)

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

## M2 Time to Successful Connection (Not Yet Instrumented)

Dependency gap:

1. Requires `pilot_connection_events` (or equivalent anchor/success event table).

```sql
-- query_id: v22_phase0_m2_time_to_connection
-- query_version: 2
-- owner: jer
-- last_updated: 2026-03-09
SELECT
  'N/A'::text AS metric_status,
  'Missing table: pilot_connection_events'::text AS reason;
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

## M4 Freshness SLA Compliance (Not Yet Instrumented)

Dependency gap:

1. Requires `pilot_service_scope`.
2. Requires `service_operational_status_events`.

```sql
-- query_id: v22_phase0_m4_freshness_sla_compliance
-- query_version: 2
-- owner: jer
-- last_updated: 2026-03-09
SELECT
  'N/A'::text AS metric_status,
  'Missing dependencies: pilot_service_scope, service_operational_status_events'::text AS reason;
```

## M5 Repeat Failure Rate (Not Yet Instrumented)

Dependency gap:

1. Requires stable entity key for repeated-failure attribution (for example `referral_entity_id`), which is not in current pilot schema.

```sql
-- query_id: v22_phase0_m5_repeat_failure_rate
-- query_version: 2
-- owner: jer
-- last_updated: 2026-03-09
SELECT
  'N/A'::text AS metric_status,
  'Missing stable entity key for repeat-failure attribution'::text AS reason;
```

## M6 Data-Decay Fatal Error Rate (Not Yet Instrumented)

Dependency gap:

1. Requires `pilot_data_decay_audits`.

```sql
-- query_id: v22_phase0_m6_data_decay_fatal_error_rate
-- query_version: 2
-- owner: jer
-- last_updated: 2026-03-09
SELECT
  'N/A'::text AS metric_status,
  'Missing table: pilot_data_decay_audits'::text AS reason;
```

## M7 Preference-Fit Indicator (Not Yet Instrumented)

Dependency gap:

1. Requires `pilot_preference_fit_events`.

```sql
-- query_id: v22_phase0_m7_preference_fit_indicator
-- query_version: 2
-- owner: jer
-- last_updated: 2026-03-09
SELECT
  'N/A'::text AS metric_status,
  'Missing table: pilot_preference_fit_events'::text AS reason;
```

## Gate 0 Minimum Execution Set

Run in order:

1. Preflight schema dependency check.
2. M1 failed contact rate query.
3. M3 referral completion capture rate query.
4. Record M2/M4/M5/M6/M7 as `N/A` with dependency reasons from this document.

## Baseline Query QA Checklist

- [x] Query headers include `query_id` and `query_version`
- [x] Executable queries (M1, M3) use parameterized date inputs
- [x] Null/zero denominator behavior is explicitly handled for executable metrics
- [x] Dependency gaps for non-executable metrics are explicitly documented
- [ ] Baseline outputs saved with execution timestamp and owner
- [ ] Metric outputs copied into baseline report artifact
