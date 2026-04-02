---
status: archived
last_updated: 2026-04-01
owner: jer
tags: [planning, v22.0, admissions, pilot, metrics, privacy, testing, documentation]
---

# v22.0 Pilot Metric Instrumentation and Tier 0 Hardening

## Summary

This archive records the completed Tier 0 admissions-support bundle executed while v22.0 Gate 0 remained blocked on user-owned legal and partner evidence.

The work intentionally stayed inside the allowed near-term scope:

1. `A3` pilot metric computability
2. `A11` public claim / placeholder hardening
3. `A22` focused pilot/privacy reliability coverage
4. bounded `A6` / `A16` readiness tooling, without curated service-data edits

## Completed Outcomes

1. Extended the pilot metric-source schema:
   - added `pilot_connection_events`
   - added `pilot_service_scope`
   - added `service_operational_status_events`
   - added `pilot_data_decay_audits`
   - added `pilot_preference_fit_events`
   - added `entity_key_hash` to `pilot_contact_attempt_events`
2. Implemented internal authenticated pilot APIs for:
   - connection events
   - pilot scope services
   - service operational status events
   - data-decay audits
   - preference-fit events
   - metric recompute into `pilot_metric_snapshots`
3. Preserved privacy guardrails:
   - rejected disallowed free-text/privacy fields on the new pilot write paths
   - kept repeat-failure attribution on opaque SHA-256 digests instead of raw identifiers
4. Added bounded readiness reporting:
   - `npm run audit:pilot-readiness`
   - JSON machine-readable report
   - Markdown summary
   - CSV verification worksheet
   - no edits to `data/services.json`
5. Hardened active public claims and placeholders:
   - acknowledgments wording
   - partner/reference page posture
   - active locale copy associated with that surface
   - press-kit/runtime/accessibility/privacy wording
6. Added focused automated coverage:
   - pilot route validation, permission, privacy-reject, missing-table, and success paths
   - recompute route behavior
   - pilot metric snapshot computation
   - readiness-audit helpers and script-adjacent behavior

## Canonical References Updated

1. [Architecture](../../architecture.md)
2. [Main Roadmap](../roadmap.md)
3. [v21 Admissions Portfolio Plan](../v21-admissions-portfolio-plan.md)
4. [v22.0 Phase 0 Baseline Metric Definitions](../../implementation/v22-0-phase-0-baseline-metric-definitions.md)
5. [v22.0 Phase 0 Baseline Query Spec](../../implementation/v22-0-phase-0-baseline-query-spec.md)
6. [v22.0 Phase 0 Baseline SQL Editor Runbook](../../implementation/v22-0-phase-0-baseline-sql-editor-runbook.md)
7. [v22.0 Phase 0 Implementation Plan](../../implementation/v22-0-phase-0-implementation-plan.md)

## Verification Snapshot

Validated during the 2026-04-01 maintenance pass:

1. `npm run ci:check`
2. targeted Vitest coverage for the new pilot routes, recompute path, metric logic, schema validation, and readiness audit helpers
3. `npm run audit:pilot-readiness -- --scope-file ...` sanity-checked in temp-output mode

Not fully validated in this environment:

1. `npm run test:db` / `npm run test:db:smoke` were skipped locally because `psql` is not installed on this machine

## What Remains Open

This archive does not close the broader admissions backlog.

Still-open near-term work:

1. `A1` Gate 0 partner/legal evidence closure
2. real bounded `A6` verification-cycle execution
3. real bounded `A16` pilot-scope data corrections based on the new audit outputs

Later evidence work remains governed by the main roadmap and v21 plan.
