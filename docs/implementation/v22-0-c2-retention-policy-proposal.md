---
status: draft
last_updated: 2026-03-24
owner: jer
tags: [implementation, v22.0, privacy, retention, proposal]
---

# v22.0 C2 Retention Policy Proposal

This document converts the previously pending C2 retention table into a concrete draft policy artifact.

Status:

1. Policy draft is prepared in-repo.
2. Privacy sign-off is still required before C2 can be marked `complete`.
3. Gate 0 remains `NO-GO` until sign-off and verification evidence are attached.

Code-backed source of truth:

1. `lib/config/pilot-retention.ts`
2. `types/pilot-retention.ts`
3. `tests/lib/config/pilot-retention.test.ts`

## Proposed Policy

Recommended default for all allowed fields in `pilot_integration_feasibility_decisions`:

1. Retention window: `365 days`
2. Deletion triggers: `time_based` and `decision_superseded`
3. Deletion executor: `manual_governance_runbook`
4. Verification evidence: dry-run candidate query plus before/after deletion audit record

Rationale:

1. One year covers the 90-day decision cycle plus governance review and follow-up audit without normalizing indefinite retention.
2. The fields are enum/code/ownership metadata only, so the risk profile is lower than user-generated content, but the project still benefits from bounded retention.
3. Dual triggers let the project remove stale superseded decisions before the full time window when a newer decision record replaces them.

## Field Coverage

| Field                       | Proposed Retention Window | Deletion Trigger(s)             | Executor                  | Notes                                                            |
| --------------------------- | ------------------------- | ------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| `decision`                  | 365 days                  | time-based; decision-superseded | manual governance runbook | Keep long enough to support pilot and post-pilot audit review    |
| `decision_date`             | 365 days                  | time-based; decision-superseded | manual governance runbook | Required for dated audit traceability                            |
| `redline_checklist_version` | 365 days                  | time-based; decision-superseded | manual governance runbook | Ties record to the governing control set                         |
| `violations[]`              | 365 days                  | time-based; decision-superseded | manual governance runbook | Code-only values; not needed indefinitely                        |
| `compensating_controls[]`   | 365 days                  | time-based; decision-superseded | manual governance runbook | Applies only to conditional decisions                            |
| `owners[]`                  | 365 days                  | time-based; decision-superseded | manual governance runbook | Internal owner labels should expire with the underlying decision |

## Remaining Human Inputs

The following still require human review or execution:

1. Confirm that `365 days` is the approved retention window.
2. Confirm that manual deletion via documented runbook is acceptable until automation is explicitly approved.
3. Attach privacy sign-off memo with reviewer, date, and decision.
4. Attach actual verification evidence produced from the deletion runbook.

## Sign-Off Block

Privacy reviewer:

- Name:
- Date:
- Decision: approved | approved_with_conditions | rejected
- Notes:
