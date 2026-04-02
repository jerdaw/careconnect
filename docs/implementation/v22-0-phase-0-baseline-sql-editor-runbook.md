---
status: stable
last_updated: 2026-04-01
owner: jer
tags: [implementation, v22.0, phase-0, baseline, sql, runbook]
---

# v22.0 Phase 0 Baseline SQL Editor Runbook

This runbook executes the Phase 0 baseline metrics in Supabase SQL Editor without local credentials.

Related:

1. [v22.0 Phase 0 Baseline Metric Definitions](v22-0-phase-0-baseline-metric-definitions.md)
2. [v22.0 Phase 0 Baseline Query Spec](v22-0-phase-0-baseline-query-spec.md)
3. [v22.0 Phase 0 Baseline Report (2026-03-09)](v22-0-phase-0-baseline-report-2026-03-09.md)

## Preconditions

1. Supabase project access with SQL Editor permissions.
2. v22 pilot migrations already applied.
3. `org_id` for the pilot organization is known if org-scoped metrics will be run.
4. Baseline window locked to:
   - `baseline_start = 2026-02-10T00:00:00Z`
   - `baseline_end = 2026-03-09T00:00:00Z`

## Step 1: Preflight Dependency Check

Run:

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

Expected minimum for the fully instrumented Phase 0 schema:

1. `pilot_contact_attempt_events` exists.
2. `pilot_referral_events` exists.
3. `pilot_connection_events` exists.
4. `pilot_service_scope` exists.
5. `service_operational_status_events` exists.
6. `pilot_data_decay_audits` exists.
7. `pilot_preference_fit_events` exists.

## Step 2: Execute M1

Run:

```sql
-- query_id: v22_phase0_m1_failed_contact_rate
-- query_version: 2
-- owner: jer
-- last_updated: 2026-03-09
WITH params AS (
  SELECT
    TIMESTAMPTZ '2026-02-10T00:00:00Z' AS baseline_start,
    TIMESTAMPTZ '2026-03-09T00:00:00Z' AS baseline_end
),
attempts AS (
  SELECT e.attempt_outcome
  FROM pilot_contact_attempt_events e
  CROSS JOIN params p
  WHERE e.attempted_at >= p.baseline_start
    AND e.attempted_at < p.baseline_end
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

Capture output values:

1. `failed_contact_events`
2. `total_contact_attempts`
3. `failed_contact_rate`

## Step 3: Execute M3

Run:

```sql
-- query_id: v22_phase0_m3_referral_completion_capture_rate
-- query_version: 2
-- owner: jer
-- last_updated: 2026-03-09
WITH params AS (
  SELECT
    TIMESTAMPTZ '2026-02-10T00:00:00Z' AS baseline_start,
    TIMESTAMPTZ '2026-03-09T00:00:00Z' AS baseline_end
),
referrals AS (
  SELECT e.referral_state
  FROM pilot_referral_events e
  CROSS JOIN params p
  WHERE e.created_at >= p.baseline_start
    AND e.created_at < p.baseline_end
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

Capture output values:

1. `referrals_with_terminal_state`
2. `total_referrals`
3. `completion_capture_rate`

## Step 4: Execute M2-M7 When Source Tables Contain Data

Use the executable SQL in [v22.0 Phase 0 Baseline Query Spec](v22-0-phase-0-baseline-query-spec.md) for:

1. `M2` Time to Successful Connection
2. `M4` Freshness SLA Compliance
3. `M5` Repeat Failure Rate
4. `M6` Data-Decay Fatal Error Rate
5. `M7` Preference-Fit Indicator

If a source table is present but the baseline window contains no qualifying events, record the metric as `NULL`
or `N/A` with an empty-data note rather than a schema-dependency note.

## Step 5: Update Baseline Report

Update the active baseline report artifact for the run you executed:

1. Set each metric status to `Completed`, `NULL`, or `N/A` with the correct reason.
2. Copy numeric outputs when the denominator is non-zero.
3. Use empty-window notes for missing activity and dependency notes only for missing schema.
4. Add execution metadata:
   - execution timestamp (UTC)
   - operator
   - run context (`Supabase SQL Editor`)

Historical note:

1. [v22-0-phase-0-baseline-report-2026-03-09.md](v22-0-phase-0-baseline-report-2026-03-09.md) is a historical
   pre-instrumentation baseline artifact and should remain unchanged except for clearly marked historical notes.

## Step 6: Quality Checks

1. No fabricated values.
2. Query IDs and versions preserved.
3. Baseline window unchanged.
4. Any zero-denominator metrics recorded as `NULL` with note.

## Sign-Off Fields

Record in baseline report:

1. Product owner sign-off date.
2. Governance owner sign-off date.
3. Any confidence caveats from low event counts.
