---
status: draft
last_updated: 2026-03-29
owner: jer
tags: [implementation, v22.0, controls, privacy, retention]
---

# v22.0 Control C2 Privacy Retention Mapping

Control reference:

1. [v22.0 Integration Feasibility Decision Record](v22-0-integration-feasibility-decision.md)

## Control Objective

Map all candidate integration payload fields to explicit retention limits and data minimization rules, ensuring no conflict with privacy-first constraints.

## Retention Mapping (Current State)

| Payload Field                                                            | Data Class                   | Required for Function | Retention Window   | Storage Location                          | Deletion Mechanism                                            | Notes                                           |
| ------------------------------------------------------------------------ | ---------------------------- | --------------------- | ------------------ | ----------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| `decision`                                                               | governance decision enum     | yes                   | approved: 365 days | `pilot_integration_feasibility_decisions` | time-based; decision-superseded via manual governance runbook | enum-only field; no raw user text               |
| `decision_date`                                                          | governance metadata          | yes                   | approved: 365 days | `pilot_integration_feasibility_decisions` | time-based; decision-superseded via manual governance runbook | required for audit trail                        |
| `redline_checklist_version`                                              | governance metadata          | yes                   | approved: 365 days | `pilot_integration_feasibility_decisions` | time-based; decision-superseded via manual governance runbook | version traceability                            |
| `violations[]`                                                           | policy outcome codes         | yes                   | approved: 365 days | `pilot_integration_feasibility_decisions` | time-based; decision-superseded via manual governance runbook | code list only, no free-form user data required |
| `compensating_controls[]`                                                | governance remediation notes | conditional           | approved: 365 days | `pilot_integration_feasibility_decisions` | time-based; decision-superseded via manual governance runbook | currently manual governance text                |
| `owners[]`                                                               | internal ownership labels    | yes                   | approved: 365 days | `pilot_integration_feasibility_decisions` | time-based; decision-superseded via manual governance runbook | role/owner labels only                          |
| Disallowed keys (`query`, `query_text`, `message`, `user_text`, `notes`) | prohibited                   | no                    | n/a                | rejected at validation layer              | n/a                                                           | enforced by privacy guard schemas               |

## Data Minimization Basis

1. Integration and pilot schemas restrict payloads to enumerated codes and governance metadata.
2. Disallowed privacy keys are blocked by validation in `lib/schemas/privacy-guards.ts`.
3. No external integration endpoint is active; only internal pilot feasibility recording endpoint exists.

Key references:

1. [v22.0 Integration Feasibility Decision Record](v22-0-integration-feasibility-decision.md)
2. [ADR-020: v22 Phase 0 Pilot Instrumentation and Privacy Guardrails](../adr/020-v22-pilot-phase0-instrumentation-and-privacy-guardrails.md)
3. [Governance Protocol: The Kingston 150 Standard](../governance/standards.md)
4. [v22.0 C2 Retention Policy Proposal](v22-0-c2-retention-policy-proposal.md)
5. [v22.0 C2 Deletion Verification Runbook](v22-0-c2-deletion-verification-runbook.md)
6. `lib/config/pilot-retention.ts`

## Policy Lock Checklist (For Closure)

All items are required to mark C2 `complete`:

- [x] Retention duration is defined for each allowed field in the retention mapping table.
- [x] Deletion trigger is defined for each allowed field (`time-based`, `decision-superseded`, or both).
- [x] Deletion executor is defined (job/manual owner) for each allowed field.
- [x] Verification evidence is attached (read-only query output or audit proof confirming deletion path behavior).
- [x] Privacy sign-off memo is attached with reviewer name and date.
- [x] Updates are synchronized in [v22.0 Integration Feasibility Decision Record](v22-0-integration-feasibility-decision.md).

Acceptance criteria:

1. C2-2, C2-3, and C2-5 are all checked complete.
2. No field in the retention mapping table remains `pending policy lock`.
3. Evidence table contains dated links and status `complete`.

## Required Checks

- [x] C2-1: No prohibited personal identifiers in integration payload.
- [x] C2-2: Retention windows are explicitly defined per field.
- [x] C2-3: Deletion path is defined and testable.
- [x] C2-4: Data minimization rationale documented.
- [x] C2-5: Privacy review sign-off captured.

## Evidence Table

| Artifact                       | Location                                                                                   | Reviewer | Date       | Status              |
| ------------------------------ | ------------------------------------------------------------------------------------------ | -------- | ---------- | ------------------- |
| Retention matrix               | this document                                                                              | jer      | 2026-03-29 | complete (approved) |
| Policy proposal                | [v22.0 C2 Retention Policy Proposal](v22-0-c2-retention-policy-proposal.md)                | jer      | 2026-03-29 | complete (approved) |
| Deletion verification runbook  | [v22.0 C2 Deletion Verification Runbook](v22-0-c2-deletion-verification-runbook.md)        | jer      | 2026-03-24 | complete (prep)     |
| Code-backed retention config   | `lib/config/pilot-retention.ts`                                                            | jer      | 2026-03-29 | complete (approved) |
| Privacy review memo            | [C2-20260329 Submission](v22-0-evidence/c2-retention/C2-20260329.md)                       | jer      | 2026-03-29 | complete            |
| Verification evidence bundle   | [C2-20260329 Submission](v22-0-evidence/c2-retention/C2-20260329.md)                       | jer      | 2026-03-29 | complete            |
| Redline traceability note (R4) | [v22.0 Integration Feasibility Decision Record](v22-0-integration-feasibility-decision.md) | jer      | 2026-03-09 | complete            |

## Decision

- Result: `complete`
- Conflicts identified: `None.`
- Escalation needed: `None.`

## Verification Note

Completion requires updating C2 status in [v22.0 Integration Feasibility Decision Record](v22-0-integration-feasibility-decision.md).
