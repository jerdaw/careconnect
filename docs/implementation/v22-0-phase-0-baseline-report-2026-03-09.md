---
status: draft
last_updated: 2026-03-09
owner: jer
tags: [implementation, v22.0, phase-0, metrics, baseline-report]
---

# v22.0 Phase 0 Baseline Report (2026-03-09)

Historical note:

1. This report captures the 2026-03-09 pre-instrumentation baseline run.
2. M2/M4/M5/M6/M7 were `N/A` at that time because the extended metric-source schema had not yet been added.
3. Current metric computability is documented in the newer baseline definitions and query-spec documents.

This report is the first Gate 0 baseline artifact using minimum-mode metric coverage.

Related:

1. [v22.0 Phase 0 Baseline Metric Definitions](v22-0-phase-0-baseline-metric-definitions.md)
2. [v22.0 Phase 0 Baseline Query Spec](v22-0-phase-0-baseline-query-spec.md)
3. [v22.0 Phase 0 Baseline SQL Editor Runbook](v22-0-phase-0-baseline-sql-editor-runbook.md)

## Baseline Window

1. `baseline_start`: 2026-02-10T00:00:00Z
2. `baseline_end`: 2026-03-09T00:00:00Z

## Execution Environment Status

Execution completed using linked project access through Supabase CLI + read-only REST queries:

1. `.env.local` is still not present in this workspace.
2. Baseline values were retrieved from linked project `dgoxbxcyynmijqkujymy` with read-only calls.
3. No metric values are fabricated in this report.

## Metric Output Table (Gate 0 Minimum Mode)

| Metric | Query ID                                         | Status    | Value | Notes                                                                     |
| ------ | ------------------------------------------------ | --------- | ----- | ------------------------------------------------------------------------- |
| M1     | `v22_phase0_m1_failed_contact_rate`              | Completed | NULL  | `failed_contact_events=0`, `total_contact_attempts=0` in baseline window  |
| M2     | `v22_phase0_m2_time_to_connection`               | N/A       | N/A   | Missing `pilot_connection_events`                                         |
| M3     | `v22_phase0_m3_referral_completion_capture_rate` | Completed | NULL  | `referrals_with_terminal_state=0`, `total_referrals=0` in baseline window |
| M4     | `v22_phase0_m4_freshness_sla_compliance`         | N/A       | N/A   | Missing `pilot_service_scope` and `service_operational_status_events`     |
| M5     | `v22_phase0_m5_repeat_failure_rate`              | N/A       | N/A   | Missing stable entity key for repeat-failure attribution                  |
| M6     | `v22_phase0_m6_data_decay_fatal_error_rate`      | N/A       | N/A   | Missing `pilot_data_decay_audits`                                         |
| M7     | `v22_phase0_m7_preference_fit_indicator`         | N/A       | N/A   | Missing `pilot_preference_fit_events`                                     |

## Reproducible Execution Steps

1. Run preflight query `v22_phase0_preflight_schema_dependencies`.
2. Run M1 and M3 parameterized queries from baseline query spec.
3. Record query execution timestamp and operator.
4. Update this table with numeric outputs and confidence caveats.

## Execution Log

| Field               | Value                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Run context         | `npx supabase` linked project + read-only REST queries                                                                            |
| Executed by         | `jer`                                                                                                                             |
| Executed at (UTC)   | `2026-03-09T02:14:58Z`                                                                                                            |
| Query set           | `v22_phase0_preflight_schema_dependencies`, `v22_phase0_m1_failed_contact_rate`, `v22_phase0_m3_referral_completion_capture_rate` |
| Query helper script | `supabase/scripts/v22-phase0-baseline-minimum.sql`                                                                                |

Preflight results:

1. Present: `pilot_contact_attempt_events`, `pilot_referral_events`, `pilot_metric_snapshots`
2. Missing: `pilot_connection_events`, `pilot_service_scope`, `service_operational_status_events`, `pilot_data_decay_audits`, `pilot_preference_fit_events`

## Known Limitations

1. Gate 0 minimum mode is active because only M1/M3 are currently executable.
2. M2/M4/M5/M6/M7 need additional schema instrumentation before numeric baselines are possible.
3. Any Gate 0 decision using this report must treat non-executable metrics as explicit dependency gaps.

## Sign-Off

- Product owner: `pending`
- Governance owner: `pending`
- Notes: This artifact is structurally complete and ready for value entry once database execution context is available.
