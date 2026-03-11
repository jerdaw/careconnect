---
status: draft
last_updated: 2026-03-09
owner: jer
tags: [implementation, v22.0, phase-0, metrics, baseline]
---

# v22.0 Phase 0 Baseline Metric Definitions

This document is the canonical metric dictionary for v22.0 Phase 0.

Source strategy definitions:

1. [v22.0 Non-Duplicate Value Decision Plan](../planning/v22-0-non-duplicate-value-decision-plan.md)
2. [v22.0 Phase 0 Implementation Plan](v22-0-phase-0-implementation-plan.md)

## Baseline Window

Use a fixed 4-week baseline window immediately before pilot start:

1. `baseline_start`: YYYY-MM-DD (inclusive)
2. `baseline_end`: YYYY-MM-DD (inclusive)

All baseline calculations must:

1. use the same window for all primary metrics,
2. be reproducible from saved query specs,
3. log query version and execution date.

## Phase 0 Computability Status (2026-03-09)

Gate 0 minimum mode is active for this cycle.

| Metric | Computability Now        | Notes                                                                                        |
| ------ | ------------------------ | -------------------------------------------------------------------------------------------- |
| M1     | Computable               | Uses `pilot_contact_attempt_events` directly.                                                |
| M2     | Not currently computable | Requires `pilot_connection_events` or equivalent anchor/success table not yet instrumented.  |
| M3     | Computable               | Uses `pilot_referral_events` directly.                                                       |
| M4     | Not currently computable | Requires `pilot_service_scope` + `service_operational_status_events` tables not yet present. |
| M5     | Not currently computable | Query spec currently references `referral_entity_id`, which is not in current pilot schema.  |
| M6     | Not currently computable | Requires `pilot_data_decay_audits`, not yet instrumented.                                    |
| M7     | Not currently computable | Requires `pilot_preference_fit_events`, not yet instrumented.                                |

## Metric Dictionary

| Metric ID | Name                             | Formula                                                                    | Numerator Source                                | Denominator Source                    | Reporting           | Minimum Data Quality                  |
| --------- | -------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------- | ------------------- | ------------------------------------- |
| M1        | Failed Contact Rate              | `failed_contact_events / total_contact_attempts`                           | Contact attempts with failure outcomes          | All contact attempts                  | rate + trend        | >=95% outcome coding completeness     |
| M2        | Time to Successful Connection    | `timestamp(successful_connection) - timestamp(initial_search_or_referral)` | Successful connection events                    | Initial search/referral anchor events | median, p75, p90    | >=90% valid timestamps                |
| M3        | Referral Completion Capture Rate | `referrals_with_terminal_state / total_referrals`                          | Referrals in terminal states                    | Total referrals created               | rate + trend        | >=95% referral state completeness     |
| M4        | Freshness SLA Compliance         | `services_meeting_status_sla / pilot_services_total`                       | Services updated within SLA by tier             | Pilot services in scope               | rate                | 100% service SLA tier assignment      |
| M5        | Repeat Failure Rate              | `users_or_referrals_with_2plus_failures / total_users_or_referrals`        | Distinct referral entities with 2+ failures     | Distinct referral entities            | rate                | >=95% stable entity identifiers       |
| M6        | Data-Decay Fatal Error Rate      | `records_with_access_blocking_errors / records_sampled`                    | Fatal errors from verification sample           | Records sampled in period             | rate + severity mix | dual-source verification completed    |
| M7        | Preference-Fit Indicator         | `cohort_tasks_preferably_completed_via_helpbridge / cohort_total_tasks`    | Tasks completed via HelpBridge in target cohort | All tracked cohort tasks              | rate                | cohort attribution completeness >=90% |

## Enumerations (Locked For Phase 0)

### Failed contact outcomes (M1)

1. `disconnected_number`
2. `no_response`
3. `intake_unavailable`
4. `invalid_routing`
5. `other_failure`

### Terminal referral states (M3)

1. `connected`
2. `failed`
3. `client_withdrew`
4. `no_response_timeout`

### Fatal data-decay categories (M6)

1. `wrong_or_disconnected_phone`
2. `invalid_or_defunct_intake_path`
3. `materially_incorrect_eligibility`
4. `service_closed_or_unavailable_but_listed_available`

## Data Source Mapping (Planned Tables/Views)

| Metric | Primary Source                                                        | Secondary Source         |
| ------ | --------------------------------------------------------------------- | ------------------------ |
| M1     | `pilot_contact_attempt_events`                                        | `pilot_metric_snapshots` |
| M2     | `pilot_connection_events` (planned)                                   | `pilot_metric_snapshots` |
| M3     | `pilot_referral_events`                                               | `pilot_metric_snapshots` |
| M4     | `pilot_service_scope` + `service_operational_status_events` (planned) | `services`               |
| M5     | `pilot_contact_attempt_events` + stable entity key (planned)          | `pilot_metric_snapshots` |
| M6     | `pilot_data_decay_audits` (planned)                                   | Manual verification logs |
| M7     | `pilot_preference_fit_events` (planned)                               | Pilot scorecard notes    |

## Quality Gates For Baseline Acceptance (Gate 0 Minimum Mode)

All must pass before Gate 0:

1. Query reproducibility confirmed for executable metrics.
2. M1 and M3 baseline values are reported (or explicitly null when no pilot events exist).
3. M2/M4/M5/M6/M7 are marked `N/A` with explicit schema/instrumentation dependency notes.
4. Missingness and exclusion rates are documented per metric.
5. Any known bias/confounders are listed in notes.

## Required Output Artifact

Generate one baseline report with:

1. metric value table (M1-M7),
2. confidence caveats and known limitations,
3. query version references,
4. sign-off section for product + governance owners.

Current artifact:

1. [v22.0 Phase 0 Baseline Report (2026-03-09)](v22-0-phase-0-baseline-report-2026-03-09.md)
