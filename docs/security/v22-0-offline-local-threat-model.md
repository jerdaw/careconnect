---
status: stable
last_updated: 2026-06-12
owner: jer
tags: [security, v22.0, threat-model, offline, privacy]
---

# v22.0 Offline/Local Data Threat Model

This document evaluates confidentiality, integrity, and availability risks for offline/local data handling in v22 pilot workflows.

Related:

1. [v22.0 Phase 0 Implementation Plan](../implementation/v22-0-phase-0-implementation-plan.md)
2. [v22.0 Non-Duplicate Value Decision Plan](../planning/v22-0-non-duplicate-value-decision-plan.md)

## Scope

In scope:

1. Browser local storage and IndexedDB caches.
2. Offline synchronization queues.
3. Pilot event payloads stored/transmitted locally.
4. Device-loss and unauthorized local access scenarios.

Out of scope:

1. Unrelated server infrastructure not used by pilot workflows.
2. Third-party systems beyond integration redline assessment.

## Assets

| Asset                               | Sensitivity | Storage Location        | Owner                    |
| ----------------------------------- | ----------- | ----------------------- | ------------------------ |
| Service directory cache             | Medium      | IndexedDB               | Engineering              |
| Embeddings cache                    | Low/Medium  | IndexedDB               | Engineering              |
| Pilot contact/referral event drafts | High        | Local/offline queue     | Engineering + Governance |
| Sync metadata and timestamps        | Medium      | Local storage/IndexedDB | Engineering              |

## Threat Scenarios

| Threat ID | Scenario                                                      | Impact                      | Likelihood | Severity (`critical` \| `high` \| `medium` \| `low`) | Mitigation                                                                                    | Owner                 | Status                             |
| --------- | ------------------------------------------------------------- | --------------------------- | ---------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------- | ---------------------------------- |
| T1        | Lost or stolen device exposes locally cached pilot event data | Confidentiality breach      | Medium     | high                                                 | Minimize payload fields, keep identifiers non-personal, add queue expiry and local clear UX   | Engineering           | mitigations_defined_owner_assigned |
| T2        | Malicious script attempts local data exfiltration             | Confidentiality breach      | Low/Medium | high                                                 | Maintain strict CSP/XSS controls, reject raw query persistence, preserve allowlist validation | Engineering           | mitigations_defined_owner_assigned |
| T3        | Offline queue replay duplicates/poisons metrics events        | Integrity loss              | Medium     | medium                                               | Idempotency key policy + duplicate write guard                                                | Engineering           | mitigations_defined                |
| T4        | Stale offline data appears current to pilot users             | Integrity loss              | Medium     | medium                                               | Freshness timestamps + stale-state UI messaging                                               | Product + Engineering | mitigations_defined                |
| T5        | Local corruption drops queued referral outcomes               | Availability/integrity loss | Low/Medium | medium                                               | Retry workflow + sync diagnostics + recovery guidance                                         | Engineering           | mitigations_defined                |

## Risk Acceptance Rule

1. Any unresolved `critical` finding blocks Gate 0 completion.
2. Any unresolved `high` finding requires explicit owner, due date, and mitigation plan.

## Mitigation Tracking

| Finding ID | Severity | Mitigation Plan                                                                                | Owner                 | Due Date   | Verification Method                                       | Verified |
| ---------- | -------- | ---------------------------------------------------------------------------------------------- | --------------------- | ---------- | --------------------------------------------------------- | -------- |
| F1         | high     | Enforce local queue payload minimization (no personal contact fields, no free-text notes)      | Engineering           | 2026-03-21 | Schema + payload inspection against pilot event contracts | no       |
| F2         | high     | Confirm expiry and clear-on-sign-out behavior for pilot drafts in local storage                | Engineering           | 2026-03-21 | Manual QA scenario + unit tests around storage cleanup    | no       |
| F3         | medium   | Add replay detection criteria (idempotency key + duplicate event suppression) to pilot runbook | Engineering           | 2026-03-21 | Integration test using repeated submission payload        | no       |
| F4         | medium   | Ensure stale data timestamp surfacing in pilot UI/operations process                           | Product + Engineering | 2026-03-21 | Focused component tests + offline UI walkthrough evidence | yes      |
| F5         | medium   | Define local corruption recovery steps in runbook (resync + queued item audit)                 | Engineering           | 2026-03-21 | Documented runbook step + dry-run execution               | no       |

## 2026-06-12 Mitigation Evidence Audit

This audit covered repo-local implementation evidence only. It did not inspect
private/shared operations material and does not close any partner, legal, or
production-readiness evidence gates.

| Finding ID | Evidence Inspected                                                                                                                                                                                                                                                                                                                                                            | Current Result                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1         | `lib/schemas/privacy-guards.ts`, `lib/schemas/pilot-events.ts`, `tests/lib/schemas/privacy-guards.test.ts`, `tests/lib/schemas/pilot-events.test.ts`                                                                                                                                                                                                                          | Partially mitigated at the pilot event contract boundary: schemas reject raw query/message/notes fields, personal contact fields, and free-text fields. The local queue-specific behavior remains unverified, so `Verified` stays `no`.                                                                                                          |
| F2         | `lib/offline/pilot-draft-cleanup.ts`, `components/layout/AuthProvider.tsx`, `tests/lib/offline/pilot-draft-cleanup.test.ts`, `tests/components/AuthProvider.test.tsx`                                                                                                                                                                                                         | Pilot draft TTL, malformed-envelope pruning, and sign-out cleanup for reserved pilot draft keys are implemented and covered by unit/component tests. No actual pilot draft queue was identified, and manual QA evidence is still missing, so `Verified` stays `no`.                                                                              |
| F3         | `lib/pilot/event-replay-policy.ts`, `lib/pilot/storage.ts`, pilot event routes, `tests/lib/pilot/event-replay-policy.test.ts`, `tests/lib/pilot/storage.test.ts`, route tests                                                                                                                                                                                                 | Replay criteria, deterministic privacy-safe fingerprints, and supplied-ID primary-key retry handling are unit/API/storage covered. Non-primary duplicate constraints are not suppressed as idempotent retries. Live repeated-submission integration evidence remains missing, so `Verified` stays `no`.                                          |
| F4         | Existing threat-model record                                                                                                                                                                                                                                                                                                                                                  | Previously verified stale-state surfacing remains recorded as `yes`; this pass did not re-open it.                                                                                                                                                                                                                                               |
| F5         | `docs/runbooks/offline-local-recovery.md`, `lib/offline/local-recovery-audit.ts`, `tests/lib/offline/local-recovery-audit.test.ts`, `lib/offline/feedback.ts`, `tests/lib/offline/feedback.test.ts`, `lib/offline/db.ts`, `lib/offline/sync.ts`, `tests/unit/lib/offline/sync.test.ts`, `components/offline/OfflineSync.tsx`, `tests/components/offline/OfflineSync.test.tsx` | A public-safe recovery workflow and aggregate audit helper now cover queue counts, cache counts, sync metadata, non-destructive re-sync, destructive-clearing safeguards, API-schema validation before feedback queue storage/replay, and sanitized sync failure metadata. Dry-run execution evidence remains missing, so `Verified` stays `no`. |

## Validation Checklist

- [x] Device-loss scenario assessed for all local data classes
- [x] Local payload minimization reviewed against privacy redlines
- [x] Sync queue integrity controls documented
- [x] Stale-data handling and UX fallback reviewed
- [x] No unresolved `critical` findings

## Sign-Off

- Security/governance owner review: `jer` (2026-03-09)
- Notes: high-severity items have explicit owners and due dates; no unresolved critical findings. F4 timestamp/stale-state surfacing is implemented on offline surfaces as of 2026-04-04.

## Gate 0 Security Outcome

| Criterion                                        | Status |
| ------------------------------------------------ | ------ |
| Critical findings resolved                       | GO     |
| High findings have owners and mitigation plans   | GO     |
| Threat model signed by security/governance owner | GO     |

## Automated Consistency Check

Run `npm run check:v22-threat-model` after editing this file. The guard checks
the mitigation matrix and Gate 0 security outcome for internal consistency; it
does not judge whether a mitigation is strategically sufficient or close any
finding that still lacks its stated verification evidence.
