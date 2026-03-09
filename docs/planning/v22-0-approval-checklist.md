---
status: stable
last_updated: 2026-03-09
owner: jer
tags: [roadmap, v22.0, approvals, gate-0, governance]
---

# v22.0 Approval Checklist (Step 1 Sign-Off)

This is the canonical decision record for v22.0 Step 1 approvals.

Use this file to:

1. Lock approvals before Phase 0 starts.
2. Record decision ownership and dates.
3. Determine Gate 0 readiness with an explicit go/no-go outcome.

Related documents:

1. [v22.0 Non-Duplicate Value Decision Plan](v22-0-non-duplicate-value-decision-plan.md)
2. [v22.0 Phase 0 Implementation Plan](../implementation/v22-0-phase-0-implementation-plan.md)

## Approval Records

Instructions:

1. Set `selected_choice` to an explicit value.
2. Set `decision_status` to `locked` only after owner sign-off.
3. Populate `date` with ISO format (`YYYY-MM-DD`).
4. Keep `blocked_if_unset` as `true` for all records.

| decision_id | decision_title                  | default_choice                                                                                               | selected_choice                                                                                              | decision_status | owner | date       | evidence_required                                               | blocked_if_unset |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------- | ----- | ---------- | --------------------------------------------------------------- | ---------------- |
| D1          | Objective Function              | Connection outcomes over directory breadth                                                                   | Connection outcomes over directory breadth                                                                   | locked          | jer   | 2026-03-09 | Signed objective statement aligned with Gate 1 metrics          | true             |
| D2          | Hard Constraints                | No breadth race, no raw query-text logging, no claim overstatement, no unverifiable external-claim promotion | No breadth race, no raw query-text logging, no claim overstatement, no unverifiable external-claim promotion | locked          | jer   | 2026-03-09 | Constraint acceptance note with privacy/legal review references | true             |
| D3          | Pilot Domain                    | Housing intake                                                                                               | Housing intake                                                                                               | locked          | jer   | 2026-03-09 | Pilot domain memo with rationale and excluded domains list      | true             |
| D4          | Pilot Partner Target Range      | 5-10 providers and 2-3 frontline organizations                                                               | 5-10 providers and 2-3 frontline organizations                                                               | locked          | jer   | 2026-03-09 | Partner target list with outreach owner and fallback list       | true             |
| D5          | Stage Gates and Kill Rules      | Use thresholds and kill rules exactly as written in v22 plan                                                 | Use thresholds and kill rules exactly as written in v22 plan                                                 | locked          | jer   | 2026-03-09 | Stage-gate checklist signed with no unresolved threshold edits  | true             |
| D6          | API Integration Redlines        | No user query-text sharing and no forced user-identifying telemetry                                          | No user query-text sharing and no forced user-identifying telemetry                                          | locked          | jer   | 2026-03-09 | Redline checklist mapped to API/data contracts                  | true             |
| D7          | Integration-Blocked Contingency | Narrow scope first, then responsible deprecation criteria if outcomes fail                                   | Narrow scope first, then responsible deprecation criteria if outcomes fail                                   | locked          | jer   | 2026-03-09 | Contingency decision tree with owner and trigger conditions     | true             |

Evidence lock references (2026-03-09):

1. [v22.0 Step 1 Decision Locks (2026-03-09)](../implementation/v22-0-step-1-decision-locks-2026-03-09.md)
2. [v22.0 Integration Feasibility Decision Record](../implementation/v22-0-integration-feasibility-decision.md)
3. [v22.0 Offline/Local Data Threat Model](../security/v22-0-offline-local-threat-model.md)
4. [v22.0 Phase 0 Baseline Report (2026-03-09)](../implementation/v22-0-phase-0-baseline-report-2026-03-09.md)

## Sign-Off Checklist

- [x] D1 locked
- [x] D2 locked
- [x] D3 locked
- [x] D4 locked
- [x] D5 locked
- [x] D6 locked
- [x] D7 locked
- [x] No unresolved privacy redline conflicts
- [x] Pilot domain and partner range explicitly named in this document

## Phase 0 Go/No-Go

| Criterion                                    | Current Status | Evidence Link                                                                                          |
| -------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| 7/7 approval records set to `locked`         | GO             | This document (D1-D7 table)                                                                            |
| No unresolved redline conflicts              | GO             | [Integration Feasibility Decision Record](../implementation/v22-0-integration-feasibility-decision.md) |
| Pilot domain and target partner range locked | GO             | This document (D3, D4)                                                                                 |

Decision rule:

1. If all three criteria are `GO`, Phase 0 may begin.
2. If any criterion is `NO-GO`, Phase 0 remains blocked.

Current outcome: **GO (Step 1 sign-off complete; conditional integration controls documented).**

## Technical Prerequisites Completed (2026-03-09)

- [x] Pilot Phase 0 schema migration applied and verified in Supabase.
- [x] Pilot RLS policy coverage verified (`SELECT`, `INSERT`, `UPDATE`, `DELETE` on all 4 pilot tables).
- [x] Legacy `user_metadata` function references removed from public functions (`user_metadata_function_count = 0`).
- [x] Internal pilot routes and validation/test coverage implemented.

## Phase 0 Evidence Artifacts

1. [v22.0 Phase 0 Baseline Metric Definitions](../implementation/v22-0-phase-0-baseline-metric-definitions.md)
2. [v22.0 Phase 0 Baseline Query Spec](../implementation/v22-0-phase-0-baseline-query-spec.md)
3. [v22.0 Integration Feasibility Decision Record](../implementation/v22-0-integration-feasibility-decision.md)
4. [v22.0 External-Claim Re-Validation Log](../implementation/v22-0-external-claim-revalidation-log.md)
5. [v22.0 Offline/Local Data Threat Model](../security/v22-0-offline-local-threat-model.md)
6. [v22.0 Step 1 Decision Locks (2026-03-09)](../implementation/v22-0-step-1-decision-locks-2026-03-09.md)
7. [v22.0 Phase 0 Baseline Report (2026-03-09)](../implementation/v22-0-phase-0-baseline-report-2026-03-09.md)
