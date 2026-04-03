---
status: draft
last_updated: 2026-04-01
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

## Phase 0 Computability Status (2026-04-01)

Gate 0 minimum mode remains the default interpretation for historical baseline reporting, but the
required Phase 0 instrumentation dependencies now exist in the pilot schema and internal API layer.
Metrics M2, M4, M5, M6, and M7 are computable once the new source tables are migrated and populated
for a pilot cycle.

| Metric | Computability Now        | Notes                                                                                           |
| ------ | ------------------------ | ----------------------------------------------------------------------------------------------- |
| M1     | Computable               | Uses `pilot_contact_attempt_events` directly.                                                   |
| M2     | Conditionally computable | Uses `pilot_connection_events` plus contact-attempt/referral anchor timestamps after recompute. |
| M3     | Computable               | Uses `pilot_referral_events` directly.                                                          |
| M4     | Conditionally computable | Uses `pilot_service_scope` plus `service_operational_status_events` recency by SLA tier.        |
| M5     | Conditionally computable | Uses `pilot_contact_attempt_events.entity_key_hash` for repeat-failure attribution.             |
| M6     | Conditionally computable | Uses `pilot_data_decay_audits` after audits are recorded for the pilot window.                  |
| M7     | Conditionally computable | Uses `pilot_preference_fit_events` after cohort events are recorded.                            |

## Metric Dictionary

| Metric ID | Name                             | Formula                                                                             | Numerator Source                                          | Denominator Source                             | Reporting           | Minimum Data Quality                  |
| --------- | -------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------- | ------------------- | ------------------------------------- |
| M1        | Failed Contact Rate              | `failed_contact_events / total_contact_attempts`                                    | Contact attempts with failure outcomes                    | All contact attempts                           | rate + trend        | >=95% outcome coding completeness     |
| M2        | Time to Successful Connection    | `timestamp(successful_connection) - timestamp(initial_contact_attempt_or_referral)` | Successful connection events                              | Initial contact-attempt/referral anchor events | median, p50/p75/p90 | >=90% valid timestamps                |
| M3        | Referral Completion Capture Rate | `referrals_with_terminal_state / total_referrals`                                   | Referrals in terminal states                              | Total referrals created                        | rate + trend        | >=95% referral state completeness     |
| M4        | Freshness SLA Compliance         | `services_meeting_status_sla / pilot_services_total`                                | Services updated within SLA by tier                       | Pilot services in scope                        | rate                | 100% service SLA tier assignment      |
| M5        | Repeat Failure Rate              | `hashed_entities_with_2plus_failures / distinct_hashed_entities`                    | Distinct `entity_key_hash` values with 2+ failed attempts | Distinct non-null `entity_key_hash` values     | rate                | >=95% stable entity hash coverage     |
| M6        | Data-Decay Fatal Error Rate      | `records_with_access_blocking_errors / records_sampled`                             | Fatal errors from verification sample                     | Records sampled in period                      | rate + severity mix | dual-source verification completed    |
| M7        | Preference-Fit Indicator         | `cohort_tasks_preferably_completed_via_careconnect / cohort_total_tasks`            | Tasks completed via CareConnect in target cohort          | All tracked cohort tasks                       | rate                | cohort attribution completeness >=90% |

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

| Metric | Primary Source                                              | Secondary Source         |
| ------ | ----------------------------------------------------------- | ------------------------ |
| M1     | `pilot_contact_attempt_events`                              | `pilot_metric_snapshots` |
| M2     | `pilot_connection_events`                                   | `pilot_metric_snapshots` |
| M3     | `pilot_referral_events`                                     | `pilot_metric_snapshots` |
| M4     | `pilot_service_scope` + `service_operational_status_events` | `pilot_metric_snapshots` |
| M5     | `pilot_contact_attempt_events` + `entity_key_hash`          | `pilot_metric_snapshots` |
| M6     | `pilot_data_decay_audits`                                   | Manual verification logs |
| M7     | `pilot_preference_fit_events`                               | `pilot_metric_snapshots` |

## Quality Gates For Baseline Acceptance (Gate 0 Minimum Mode)

All must pass before Gate 0:

1. Query reproducibility confirmed for executable metrics.
2. M1 and M3 baseline values are reported (or explicitly null when no pilot events exist).
3. M2/M4/M5/M6/M7 are either reported from populated instrumentation sources or explicitly marked `N/A`
   because the pilot window has no qualifying source events yet.
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
