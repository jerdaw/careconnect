---
status: stable
last_updated: 2026-06-13
owner: jer
tags: [implementation, v22.0, checkpoint, review]
---

# v22.0 Worktree Checkpoint (2026-06-13)

## Purpose

Checkpoint the autonomous repo-local work completed while Gate 0 remains
blocked on user-owned C1 legal evidence and D4 partner-operations evidence.
This document is a review inventory only. It does not close Gate 0, assert
legal sufficiency, assert partner outreach sufficiency, or provide production
runbook instructions.

## Worktree Inventory

### Gate 0 Guards and Evidence Discipline

- Added status-aware C1/D4 evidence-intake validation and threat-model
  consistency checks.
- Hardened Gate 0 decision validation so `NO-GO` blocking checks must match
  the required-check rows.
- Added C1/D4 closure evidence structure checks for dated submissions,
  canonical evidence artifacts, submission IDs, traceability inventories, and
  submitted-count consistency.
- Updated evidence templates, runbooks, README command references, CI static
  validation, and targeted fixture tests.

### Offline Privacy and Recovery Hardening

- Added aggregate offline recovery diagnostics and non-destructive recovery
  recommendations.
- Added pilot draft cleanup helpers and sign-out cleanup wiring.
- Normalized offline feedback queue payloads before storage and replay.
- Sanitized offline sync and recovery warning/error metadata so raw payloads,
  browser exception messages, and network details are not surfaced.

### Pilot Event Idempotency and Contracts

- Added optional client event IDs for pilot event create payloads.
- Centralized no-store pilot create/idempotent-retry responses.
- Limited duplicate retry suppression to supplied-ID primary-key conflicts.
- Documented implemented internal pilot routes in OpenAPI and added contract
  tests for route/method inventory, operation metadata, JSON write contracts,
  and response envelopes.

### Pilot Readiness Governance

- Added fail-closed validation for pilot readiness scope inputs loaded from
  files, Supabase, and direct report-builder calls.
- Sanitized readiness load failures and invalid-scope diagnostics.
- Neutralized CSV formula prefixes in generated readiness worksheets.
- Rejected duplicate readiness scope identities instead of silently
  deduplicating.

### Documentation and Test Coverage

- Added public-safe runbooks for pilot event replay and offline local recovery.
- Updated the offline/local threat model with mitigation evidence status.
- Added documentation hygiene coverage for C2 retention and Phase 0 baseline
  evidence alignment.
- Expanded route, storage, OpenAPI, and script fixture tests for the changed
  contracts.

## Committed Review Boundaries

1. `chore: add v22 gate0 validation guards`
   - Gate 0 guard scripts, CI/npm wiring, evidence templates, evidence
     runbooks, and script tests.
2. `fix: harden offline recovery privacy`
   - Offline sync/feedback sanitization, recovery diagnostics, draft cleanup,
     runbooks, threat-model updates, and related tests.
3. `feat: add pilot event retry contracts`
   - Optional event IDs, supplied-ID retry behavior, shared pilot responses,
     storage duplicate handling, OpenAPI docs, and route tests.
4. `test: pin internal pilot openapi contracts`
   - Derived route/method inventory tests, operation metadata checks, JSON
     write `415` coverage, and documented response-envelope checks.
5. `fix: validate pilot readiness inputs`
   - Scope validation, sanitized readiness diagnostics, duplicate detection,
     CSV formula neutralization, readiness docs, and tests.
6. `fix: tighten pilot privacy key guards`
   - Pilot privacy-key schema validation and focused guard coverage.
7. `docs: checkpoint v22 maintenance worktree`
   - C2 retention wording, Phase 0 baseline note, roadmap/runbook references,
     and documentation hygiene tests.
8. `docs: clarify v22 remaining roadmap work`
   - Roadmap cleanup so the remaining default path is external C1/D4 evidence,
     not open-ended autonomous hardening.

## Verification To Preserve

- Focused Gate 0 guard tests must pass.
- Script syntax, ESLint, Prettier check, TypeScript, reference check, root
  hygiene, and `git diff --check` must pass before review.
- The v22 guard chain must keep returning the expected `NO-GO` result with
  blocking checks `G0-3` and `G0-8` until real external evidence is attached.

## Remaining External Blockers

1. Real C1 partner legal/API terms and reviewer outcome.
2. Real D4 named partner list, outreach owner, dated outreach execution
   evidence, and supporting artifact inventory.
3. Human decision to sync accepted evidence and re-evaluate Gate 0.
