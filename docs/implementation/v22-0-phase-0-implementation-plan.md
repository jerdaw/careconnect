---
status: draft
last_updated: 2026-03-29
owner: jer
tags: [implementation, v22.0, phase-0, instrumentation, governance]
---

# v22.0 Phase 0 Implementation Plan (2-Week Baseline + Instrumentation)

## Summary

Phase 0 establishes the evidence and measurement foundation required before any Phase 1 pilot build work.

Primary outcomes:

1. Baseline metrics computed and reproducible.
2. Privacy-safe instrumentation implemented without query-text logging.
3. 211 integration feasibility decision recorded (`go`, `conditional`, `blocked`).
4. Offline/local storage threat model completed with no unresolved critical findings.

This plan is execution-ready and decision-complete for implementation.

## Implementation Progress (2026-03-09)

Completed:

1. Workstream B instrumentation plumbing is implemented (types, schemas, routes, storage).
2. Pilot DB schema and RLS migrations are applied and verified in Supabase.
3. Missing-table safety behavior is preserved with explicit `501` responses.
4. Pilot API/schema/metrics automated tests are implemented and passing.
5. D1-D7 approval lock completed (`v22-0-approval-checklist.md`).
6. Integration feasibility decision captured in conditional mode with controls C1-C3.
7. Threat-model owner/due-date mitigation matrix completed with no unresolved critical findings.
8. Baseline report artifact created in Gate 0 minimum mode.
9. SQL Editor execution runbook and query helper script added for baseline M1/M3 execution.
10. Gate 0 evidence status tracker added for centralized closure tracking.
11. Baseline M1/M3 execution completed (window: 2026-02-10 to 2026-03-09) and recorded in baseline report.

Remaining:

1. Complete the remaining conditional integration control C1 before external activation.

Gate decision control:

1. [v22.0 Gate 0 Exit Checklist (Decision Control)](v22-0-gate-0-exit-checklist.md)

## Scope

Included:

1. Baseline metric definitions, data dictionary, and reproducible calculation queries.
2. Pilot event contracts and internal APIs for contact attempts and referral outcomes.
3. Integration feasibility decision workflow with redline enforcement.
4. Threat model execution for offline/local storage confidentiality and integrity.
5. Gate 0 evidence package assembly.

Excluded:

1. Phase 1 pilot feature implementation (service reliability UI/workflows, referral UX expansion).
2. Search ranking policy changes for stale/unavailable services.
3. Public launch preparation or v19 execution tasks.

## Hard Constraints (Non-Negotiable)

1. No raw user query text persistence in database, logs, or telemetry payloads.
2. All API write paths must use Zod validation and explicit allowlists.
3. All Supabase operations in new routes must be wrapped with `withCircuitBreaker()`.
4. All protected write routes must enforce authorization checks (`assertPermission` or stricter equivalent).
5. Any unresolved critical threat-model finding blocks Gate 0 completion.

## Public API / Interface Impact

No new public, unauthenticated API endpoints are introduced in Phase 0.

Phase 0 introduces internal authenticated pilot endpoints only:

1. `POST /api/v1/pilot/events/contact-attempt`
2. `POST /api/v1/pilot/events/referral`
3. `PATCH /api/v1/pilot/events/referral/{id}`
4. `GET /api/v1/pilot/metrics/scorecard`
5. `POST /api/v1/pilot/integration-feasibility`

These endpoints are internal to pilot operations and governance workflows.

## Data Contracts (Decision-Locked)

### Type Additions

Add new type files:

1. `types/pilot-contact-attempt.ts`
2. `types/pilot-referral.ts`
3. `types/pilot-metrics.ts`
4. `types/integration-feasibility.ts`

### `PilotContactAttemptEvent`

Required fields:

1. `id` (string UUID)
2. `pilot_cycle_id` (string)
3. `service_id` (string)
4. `attempt_channel` (`phone` | `website` | `email` | `in_person` | `referral`)
5. `attempt_outcome` (`connected` | `disconnected_number` | `no_response` | `intake_unavailable` | `invalid_routing` | `other_failure`)
6. `attempted_at` (ISO timestamp)
7. `recorded_by_org_id` (string)

Optional fields:

1. `resolved_at` (ISO timestamp)
2. `outcome_notes_code` (enumerated code only, no free text)

Disallowed fields:

1. Raw search query text
2. User message text
3. Direct personal identifiers

### `PilotReferralEvent`

Required fields:

1. `id` (string UUID)
2. `pilot_cycle_id` (string)
3. `source_org_id` (string)
4. `target_service_id` (string)
5. `referral_state` (`initiated` | `connected` | `failed` | `client_withdrew` | `no_response_timeout`)
6. `created_at` (ISO timestamp)
7. `updated_at` (ISO timestamp)

Optional fields:

1. `terminal_at` (ISO timestamp)
2. `failure_reason_code` (enumerated code only)

Disallowed fields:

1. Free-text notes containing user details
2. User query text
3. Personal contact data

### `IntegrationFeasibilityDecision`

Required fields:

1. `decision` (`go` | `conditional` | `blocked`)
2. `decision_date` (ISO date)
3. `redline_checklist_version` (string)
4. `violations` (array of predefined violation codes)
5. `compensating_controls` (array; required when `decision=conditional`)
6. `owners` (array of owner IDs or role labels)

## Schema Validation

Create Zod schemas:

1. `lib/schemas/pilot-events.ts`
2. `lib/schemas/integration-feasibility.ts`

Validation rules:

1. Strip unknown keys and reject disallowed keys.
2. Enforce enumerations for outcome/failure fields.
3. Enforce timestamp/date ISO format validation.
4. Reject payloads containing keys: `query`, `query_text`, `message`, `user_text`, `notes`.

## Route-Level Security Model

### Write endpoints

1. Require authenticated session.
2. Require organization-scoped write permission via `assertPermission(..., "canCreateServices")` or stronger.
3. Apply rate limits:
   - Contact/referral writes: 60 requests/minute per IP.
   - Integration decision writes: 10 requests/minute per IP.
4. Set `Cache-Control: no-store` on responses.

### Read endpoint (`/pilot/metrics/scorecard`)

1. Require authenticated session.
2. Require analytics access via `assertPermission(..., "canViewAnalytics")` or admin role.
3. Return only aggregated statistics; no event-level PII.

## Workstreams and Timeline

## Week 1 (Days 1-5)

### Workstream A: Baseline Definitions + Data Dictionary

1. Lock formulas for M1-M7 as defined in v22 strategy doc.
2. Produce a metric data dictionary with:
   - metric name
   - formula
   - numerator/denominator source
   - freshness expectation
   - known limitations
3. Build reproducible baseline query set for 4-week pre-pilot window.

Deliverables:

1. [v22.0 Phase 0 Baseline Metric Definitions](v22-0-phase-0-baseline-metric-definitions.md)
2. [v22.0 Phase 0 Baseline Query Spec](v22-0-phase-0-baseline-query-spec.md)
3. [v22.0 Phase 0 Baseline SQL Editor Runbook](v22-0-phase-0-baseline-sql-editor-runbook.md)

### Workstream B: Instrumentation Plumbing

1. Add pilot types and Zod schemas.
2. Add internal pilot endpoints with auth, RBAC, and circuit breaker.
3. Add aggregate scorecard calculation path.
4. Ensure telemetry/logging paths never store raw query text.

Deliverables:

1. Internal endpoint implementations.
2. Unit/integration test coverage for route validation and privacy rejects.

## Week 2 (Days 6-10)

### Workstream C: 211 Integration Feasibility

1. Execute redline checklist against candidate integration terms/flows.
2. Record feasibility decision (`go`, `conditional`, `blocked`).
3. If `conditional`, document mandatory compensating controls and deadline.
4. If `blocked`, lock contingency path and trigger conditions.

Deliverable:

1. [v22.0 Integration Feasibility Decision Record](v22-0-integration-feasibility-decision.md)

### Workstream D: Offline/Local Threat Model + Claim Re-Validation

1. Execute threat model for offline/local data (lost/stolen device scenarios).
2. Classify findings by severity (`critical`, `high`, `medium`, `low`).
3. Define mitigations and owners for all `high`/`critical` findings.
4. Complete evidence re-validation log for external-agent-derived claims.

Deliverables:

1. [v22.0 Offline/Local Data Threat Model](../security/v22-0-offline-local-threat-model.md)
2. [v22.0 External-Claim Re-Validation Log](v22-0-external-claim-revalidation-log.md)

### Gate 0 Package Assembly (Day 10)

Assemble:

1. Baseline metrics report.
2. Integration feasibility decision record.
3. Threat model report.
4. Re-validation log.
5. Updated approval checklist with lock status.

## Gate 0 Acceptance Criteria

All criteria must pass:

1. Baseline values exist for primary metrics (M1-M4 minimum).
2. Measurement queries validated end-to-end against stored events.
3. Integration feasibility decision recorded with rationale.
4. Threat model has zero unresolved `critical` findings.
5. Approval checklist shows 7/7 decisions locked.

## Test Plan

### Automated

1. Route schema tests:
   - Accept valid payloads.
   - Reject unknown/disallowed text fields.
2. Authorization tests:
   - Write endpoints reject unauthenticated requests.
   - Write endpoints reject insufficient permissions.
3. Privacy regression tests:
   - Attempt payloads with `query_text` or `notes` and assert 400 rejection.
4. Scorecard aggregation tests:
   - Validate metric outputs for controlled fixtures.

### Manual

1. Call each endpoint with authenticated and unauthenticated sessions.
2. Verify metrics endpoint returns aggregate-only values.
3. Trigger redline decision path for all three outcomes (`go`, `conditional`, `blocked`).
4. Validate Gate 0 package completeness against checklist.

## Rollout and Monitoring

1. Keep pilot endpoints internal and undocumented for public consumers during Phase 0.
2. Use existing observability stack (Axiom + Slack alerting) for endpoint failure monitoring.
3. Add Phase 0-specific alert labels for:
   - schema rejection spikes
   - high 5xx rates on pilot routes
   - scorecard compute failures

## Explicit Defaults and Assumptions

1. Pilot domain default is housing intake unless D3 changes.
2. Pilot partner range default is 5-10 providers and 2-3 frontline orgs unless D4 changes.
3. Integration decision is blocked from auto-upgrading; any move from `blocked` or `conditional` to `go` requires explicit checklist update.
4. Phase 1 work remains blocked until Gate 0 criteria are passed and recorded.
