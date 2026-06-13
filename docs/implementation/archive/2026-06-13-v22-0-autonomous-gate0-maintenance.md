---
status: archived
last_updated: 2026-06-13
owner: jer
tags: [implementation, archive, v22.0, gate-0, governance, maintenance]
---

# v22.0 Autonomous Gate 0 Maintenance Pass (2026-06-12)

## Purpose

Make safe autonomous progress while Gate 0 remains blocked on user-owned C1
legal evidence and D4 partner-operations evidence.

This pass intentionally does not close `UA-1`, `UA-3`, `G0-3`, `G0-8`, or
Gate 0. No partner names, legal conclusions, outreach facts, service data, or
production instructions were generated.

## Constraints

1. Leave C1 and D4 pending until real evidence exists.
2. Improve evidence discipline without requiring private operations material.
3. Keep changes repo-local and boundary-safe.
4. Add validation that can run before a future Gate 0 re-review.

## Options Considered

| Option                                            | Assessment                                                                                                              | Decision       |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------- |
| Docs-only cleanup                                 | Low risk but weak; future reviewers could still accidentally mark prep-only evidence as closure.                        | Not sufficient |
| Add the full Gate 0 decision guard to normal CI   | Not viable while Gate 0 intentionally remains `NO-GO`; would block unrelated safe maintenance.                          | Rejected       |
| Add evidence-intake guard to normal validation    | Viable after targeted tests proved it passes pending-state docs while blocking false closure states.                    | Chosen         |
| Targeted evidence-intake guard                    | Directly protects the active blocker surface without changing app behavior or gate status.                              | Chosen         |
| Add DB-level pilot replay constraints             | Not safe autonomously because it would require a migration and live-schema preflight.                                   | Deferred       |
| Define replay criteria in code and runbook        | Safe repo-local progress that makes the future duplicate-suppression implementation testable.                           | Chosen         |
| Use existing event primary keys for retries       | Backward-compatible no-migration path for atomic supplied-ID retry suppression.                                         | Chosen         |
| Suppress semantic duplicates without event IDs    | Not safe without a new stored fingerprint/unique index or a non-atomic pre-query.                                       | Rejected       |
| Keep duplicate responses inline per route         | Works but leaves six routes open to cache/status/body drift.                                                            | Rejected       |
| Centralize pilot write responses                  | Small, testable helper keeps create and idempotent retry responses consistent.                                          | Chosen         |
| Add a pilot draft table/store now                 | Not justified because no current pilot draft queue exists and a new persistence surface raises risk.                    | Rejected       |
| Add reserved-prefix draft cleanup on sign-out     | Safe no-op for current behavior that gives future pilot drafts a tested expiry and cleanup contract.                    | Chosen         |
| Document existing pilot scope route in OpenAPI    | Safe contract alignment for an implemented internal endpoint; no runtime, data, auth, or DB change.                     | Chosen         |
| Add supplied-ID duplicate response to scope       | Misaligned with current route semantics; scope uses upsert and returns `201` success.                                   | Rejected       |
| Document existing metrics recompute route         | Safe contract alignment for an implemented internal endpoint and tested route behavior.                                 | Chosen         |
| Change recompute to return `201` or snapshots     | Not a contract-alignment task; changing response semantics could affect existing clients/tests.                         | Rejected       |
| Add a threat-model consistency guard              | Safe enforcement of the documented Gate 0 security rule without changing finding verification status.                   | Chosen         |
| Auto-close high/medium threat-model findings      | Requires manual QA, integration, or dry-run evidence that is not available autonomously.                                | Rejected       |
| Align remaining pilot response schemas            | Safe OpenAPI-only hardening for already-tested internal route behavior.                                                 | Chosen         |
| Refactor pilot route response bodies              | Unnecessary for contract alignment and could create runtime/client risk.                                                | Rejected       |
| Add pilot storage resilience coverage             | Existing storage code already uses `withCircuitBreaker`; tests can pin the contract without churn.                      | Chosen         |
| Rewrite pilot storage around a new abstraction    | Higher risk and unnecessary while the current storage seam is small and already circuit-wrapped.                        | Rejected       |
| Align stale C2 evidence wording                   | Safe docs consistency fix using existing C2 verification evidence already present in the repo.                          | Chosen         |
| Re-open C2 or invent new verification evidence    | Not justified; existing C2 docs contain completed read-only verification evidence.                                      | Rejected       |
| Clarify baseline report sign-off wording          | Safe docs consistency fix: M1/M3 execution is recorded, while formal sign-off remains non-gating.                       | Chosen         |
| Mark baseline product/governance sign-off done    | Would invent formal sign-off evidence.                                                                                  | Rejected       |
| Add route tests for documented success envelopes  | Safe coverage hardening for existing referral update and integration-feasibility behavior.                              | Chosen         |
| Change response helpers for these routes          | Unnecessary; routes already return the documented envelope and no-store headers.                                        | Rejected       |
| Add integration-feasibility error-path tests      | Safe route coverage for documented `401/429/501/500` behavior without changing runtime code.                            | Chosen         |
| Broaden integration route behavior now            | Not needed; the existing route behavior matches the documented internal contract.                                       | Rejected       |
| Add referral update error-path tests              | Safe route coverage for documented protected update behavior without changing runtime code.                             | Chosen         |
| Change referral update authorization semantics    | Not safe or necessary; existing `assertPermission` behavior is already the intended protection path.                    | Rejected       |
| Add shared instrumentation rate-limit tests       | Safe coverage for documented `429` behavior across existing internal pilot instrumentation routes.                      | Chosen         |
| Refactor instrumentation route rate limiting      | Unnecessary; existing route behavior is consistent and only needed test coverage.                                       | Rejected       |
| Add metrics-recompute rate-limit coverage         | Safe coverage for documented `429` behavior on the existing internal recompute route.                                   | Chosen         |
| Change recompute limiter/auth ordering            | Not needed; the route already fails fast on rate limit before authenticated work.                                       | Rejected       |
| Add referral create error-path tests              | Safe route coverage for existing protected create behavior without changing runtime code.                               | Chosen         |
| Change referral create response semantics         | Not needed; existing success, retry, storage, and error envelopes are now covered by tests.                             | Rejected       |
| Document and test pilot JSON `415` responses      | Safe contract alignment for existing shared content-type validation on internal JSON write routes.                      | Chosen         |
| Change content-type enforcement behavior          | Not needed; current shared `validateContentType` behavior already matches the privacy-safe contract.                    | Rejected       |
| Derive OpenAPI route coverage from filesystem     | Safe test-only guard that prevents new internal pilot routes from silently missing contract docs.                       | Chosen         |
| Keep route documentation guard hardcoded only     | Too easy for future route additions to bypass until someone remembers to update the test inventory.                     | Rejected       |
| Derive OpenAPI method coverage from route files   | Safe test-only guard that catches undocumented implemented `GET/POST/PATCH` pilot methods.                              | Chosen         |
| Assume documented path implies documented method  | Too weak; a path can exist in OpenAPI while a new route method remains undocumented.                                    | Rejected       |
| Assert OpenAPI pilot paths match implemented set  | Safe test-only guard that prevents stale pilot contract paths from outliving removed routes.                            | Chosen         |
| Allow stale planned pilot paths in OpenAPI        | Rejected for internal routes; the public-safe contract should describe implemented behavior.                            | Rejected       |
| Assert OpenAPI methods match route exports        | Safe test-only guard that prevents stale method docs under otherwise valid pilot paths.                                 | Chosen         |
| Keep method coverage one-way only                 | Too weak; it catches missing methods but not stale documented methods after route changes.                              | Rejected       |
| Validate local OpenAPI component refs             | Safe test-only guard that catches broken schema/response refs without adding a YAML parser dependency.                  | Chosen         |
| Add a new OpenAPI parser dependency               | Not needed for this narrow guard; existing string checks can validate local refs with lower churn.                      | Rejected       |
| Guard pilot OpenAPI operation metadata            | Safe test-only guard that keeps internal pilot operations cookie-authenticated and uniquely named.                      | Chosen         |
| Change runtime auth from contract test work       | Not needed; this slice verifies the documented contract rather than changing authorization behavior.                    | Rejected       |
| Derive pilot JSON-write contract checks           | Safe test-only guard that removes a hardcoded write-route list and follows implemented non-GET routes.                  | Chosen         |
| Keep JSON-write coverage manually listed          | Too easy for future write routes to miss request-body or `415` contract checks.                                         | Rejected       |
| Add recovery snapshot freshness status            | Safe aggregate diagnostic improvement using the existing offline stale/fresh policy.                                    | Chosen         |
| Add raw queue inspection to recovery diagnostics  | Rejected; recovery evidence must remain aggregate-only and avoid raw payload exposure.                                  | Rejected       |
| Add aggregate recovery recommendations            | Safe dry-run support that turns aggregate diagnostics into non-destructive next-action IDs.                             | Chosen         |
| Add destructive recovery actions to helper        | Rejected; destructive clearing requires queue preservation evidence and owner judgment.                                 | Rejected       |
| Return `null` for uninspectable draft counts      | Safer than a false zero when browser storage access is blocked or unavailable.                                          | Chosen         |
| Treat inaccessible draft storage as empty         | Rejected; it could hide local draft data during recovery triage.                                                        | Rejected       |
| Sanitize offline recovery warning metadata        | Safe privacy hardening; aggregate diagnostics do not need raw exception objects or messages.                            | Chosen         |
| Keep raw recovery exceptions in warning logs      | Rejected; local storage/browser errors can contain details that are not needed for public-safe triage.                  | Rejected       |
| Normalize offline feedback queue payloads         | Safe local hardening that makes stored/replayed payloads match the public feedback API schema.                          | Chosen         |
| Replay queued feedback exactly as stored          | Rejected; legacy empty optional fields can make valid offline votes fail later API validation.                          | Rejected       |
| Delete invalid queued feedback immediately        | Rejected for now; invalid items follow the existing retry-count policy without being sent to the API.                   | Rejected       |
| Restrict idempotent retry suppression to PKs      | Safe storage hardening; future semantic unique constraints should not be silently treated as retries.                   | Chosen         |
| Suppress every duplicate-key error with an ID     | Rejected; too broad once replay/fingerprint unique constraints are introduced.                                          | Rejected       |
| Sanitize offline sync failure metadata            | Safe privacy hardening for local recovery diagnostics and background sync logs.                                         | Chosen         |
| Return raw sync exceptions to UI callers          | Rejected; raw browser/network exceptions are not needed for recovery triage.                                            | Rejected       |
| Validate pilot readiness scope inputs             | Safe governance hardening; malformed scope evidence should fail closed before producing audit outputs.                  | Chosen         |
| Trust readiness scope files and DB rows as typed  | Rejected; unchecked casts can turn malformed partner scope inputs into misleading readiness reports.                    | Rejected       |
| Neutralize readiness CSV formula prefixes         | Safe worksheet hardening for audit outputs that may be opened in spreadsheet software.                                  | Chosen         |
| Leave readiness CSV cells unmodified              | Rejected; formula-like service names or reviewer fields could be interpreted by spreadsheet software.                   | Rejected       |
| Reject duplicate readiness scope identities       | Safe governance hardening; repeated scope rows should not inflate readiness audit counts.                               | Chosen         |
| Deduplicate readiness scope rows silently         | Rejected; silent dedupe can hide upstream scope-prep errors that should be corrected before review.                     | Rejected       |
| Tighten D4 outreach CSV structure checks          | Safe evidence-discipline hardening for future closure attempts without judging outreach sufficiency.                    | Chosen         |
| Accept any D4 outreach CSV shape                  | Rejected; malformed logs could pass structure checks while lacking dated traceability.                                  | Rejected       |
| Validate closure submission dates and counts      | Safe evidence-discipline hardening for dated, attributable C1/D4 closure packets.                                       | Chosen         |
| Accept free-form closure dates and count text     | Rejected; malformed dates/counts weaken auditability and can pass current placeholder-only checks.                      | Rejected       |
| Require C1 non-pass rationale and fallback        | Safe evidence-structure hardening; non-pass clause rows need auditable rationale and fallback fields.                   | Chosen         |
| Accept bare C1 non-pass matrix outcomes           | Rejected; a failed/conditional clause without rationale or fallback is not auditable closure evidence.                  | Rejected       |
| Enforce C1 clause matrix header and row count     | Safe evidence-structure hardening; duplicate or malformed matrix rows make closure evidence ambiguous.                  | Chosen         |
| Read the first matching C1 matrix row only        | Rejected; silently ignoring duplicate clause rows can hide contradictory closure evidence.                              | Rejected       |
| Enforce D4 partner-list header, types, duplicates | Safe evidence-structure hardening; partner target counts must come from unambiguous rows.                               | Chosen         |
| Count loose D4 partner-list type text             | Rejected; broad substring matching can count ambiguous or placeholder partner type values.                              | Rejected       |
| Cross-check D4 submitted counts against artifacts | Safe evidence-structure hardening; submitted counts should match the attached traceability artifacts.                   | Chosen         |
| Trust D4 submitted counts without cross-checking  | Rejected; count text can drift from partner-list and outreach-log evidence.                                             | Rejected       |
| Require C1 artifact inventory traceability        | Safe evidence-structure hardening; C1 source artifacts need auditable mapping without storing private raw files in git. | Chosen         |
| Trust C1 matrix source text without inventory     | Rejected; matrix source labels can drift from the attached review bundle and weaken closure auditability.               | Rejected       |
| Require closure Submission ID filename match      | Safe evidence-structure hardening; dated closure packets should have one unambiguous identity across file and content.  | Chosen         |
| Trust mismatched submission identifiers           | Rejected; mismatched IDs make evidence packets harder to audit and can route checks to the wrong dated artifacts.       | Rejected       |
| Require D4 artifact inventory traceability        | Safe evidence-structure hardening; outreach source artifacts need auditable mapping without storing private raw files.  | Chosen         |
| Trust D4 outreach source text without inventory   | Rejected; outreach-log source labels can drift from the attached execution bundle and weaken closure auditability.      | Rejected       |

## Implementation

1. Added `scripts/check-v22-evidence-intake.sh`.
2. Added `npm run check:v22-evidence`.
3. Wired the evidence-intake guard into `npm run check:v22-gate0` before the
   final GO/NO-GO decision check.
4. Added fixture-oriented Vitest coverage for the guard in
   `tests/scripts/check-v22-evidence-intake.test.ts`.
5. Hardened `scripts/check-v22-gate0-exit.sh` so `NO-GO` blocking checks must
   match the actual non-`pass` required-check rows.
6. Added fixture-oriented Vitest coverage for the Gate 0 decision guard in
   `tests/scripts/check-v22-gate0-exit.test.ts`.
7. Added `npm run check:v22-evidence` to local CI validation and GitHub static
   analysis.
8. Updated the intake pack, sync runbook, action tracker, and README command
   reference.
9. Hardened `lib/schemas/privacy-guards.ts` so pilot/integration payload
   validation rejects raw personal contact and free-text field names in addition
   to raw query/message/notes fields.
10. Added focused schema coverage for the expanded privacy guard in
    `tests/lib/schemas/privacy-guards.test.ts` and
    `tests/lib/schemas/pilot-events.test.ts`.
11. Updated `docs/security/v22-0-offline-local-threat-model.md` with a
    repo-local mitigation evidence audit that preserves the unverified status of
    local queue expiry, replay suppression, and corruption recovery findings.
12. Added `lib/pilot/event-replay-policy.ts` with deterministic privacy-safe
    replay fingerprints for pilot event payloads.
13. Added `tests/lib/pilot/event-replay-policy.test.ts` coverage for stable
    fingerprints, criteria changes, event-kind separation, and ignoring fields
    outside the replay criteria.
14. Added the public-safe
    `docs/runbooks/pilot-event-replay.md` summary and linked it from the
    runbook index.
15. Added the public-safe `docs/runbooks/offline-local-recovery.md` summary for
    aggregate queue audit, non-destructive re-sync, and destructive-clearing
    safeguards, and linked it from the runbook index.
16. Added `lib/offline/pilot-draft-cleanup.ts` with reserved-prefix pilot draft
    TTL, expired/malformed envelope pruning, and sign-out cleanup helpers.
17. Wired pilot draft cleanup into `components/layout/AuthProvider.tsx` before
    Supabase sign-out.
18. Added focused coverage in `tests/lib/offline/pilot-draft-cleanup.test.ts`
    and `tests/components/AuthProvider.test.tsx`.
19. Updated `docs/runbooks/offline-local-recovery.md` and
    `docs/security/v22-0-offline-local-threat-model.md` to record F2 as
    code-covered but not fully verified because no actual pilot draft queue or
    manual QA evidence exists.
20. Added `lib/offline/local-recovery-audit.ts` to build a privacy-preserving
    local recovery snapshot with only aggregate cache, queue, draft-key, and
    sync-metadata counts.
21. Added `tests/lib/offline/local-recovery-audit.test.ts` coverage showing the
    helper avoids queued payload reads and omits internal error details from
    returned snapshots.
22. Added optional client event UUID `id` support to pilot event create schemas.
23. Updated pilot event storage so duplicate primary-key conflicts are treated
    as idempotent retries only when a client event `id` was supplied.
24. Updated pilot event create routes to return no-store `200` responses with
    `duplicate: true` for those supplied-ID retries.
25. Added schema, storage, and route coverage for supplied-ID idempotent retry
    handling.
26. Updated `docs/api/openapi.yaml` so pilot event create endpoints document
    optional client event IDs and supplied-ID duplicate retry responses.
27. Added `tests/unit/openapi-pilot-events.test.ts` to pin the documented pilot
    event OpenAPI contract.
28. Added `lib/pilot/responses.ts` to centralize no-store pilot create success
    and idempotent retry responses.
29. Updated pilot event create routes to use the shared pilot response helper.
30. Added `tests/lib/pilot/responses.test.ts` for helper-level response
    contract coverage.
31. Documented the existing `POST /api/v1/pilot/scope/services` internal route
    in `docs/api/openapi.yaml` with its privacy-safe payload schema.
32. Extended `tests/unit/openapi-pilot-events.test.ts` to pin the pilot scope
    OpenAPI contract and its current `201` success behavior.
33. Documented the existing `POST /api/v1/pilot/metrics/recompute` internal
    route in `docs/api/openapi.yaml` with its privacy-safe selector and current
    success envelope.
34. Extended `tests/unit/openapi-pilot-events.test.ts` to pin the recompute
    OpenAPI contract, including `200` success and `501` storage-readiness
    behavior.
35. Added OpenAPI path-presence coverage for all implemented internal pilot
    routes listed in the v22 Phase 0 plan.
36. Added `scripts/check-v22-threat-model.sh` to validate that the offline/local
    threat-model mitigation matrix and Gate 0 security outcome stay internally
    consistent.
37. Added `tests/scripts/check-v22-threat-model.test.ts` fixture coverage for
    high findings with pending verification, unresolved critical findings,
    incomplete high-finding metadata, contradictory Gate 0 security outcomes,
    and placeholder sign-off lines.
38. Added `npm run check:v22-threat-model`, wired it into local CI validation,
    GitHub static analysis, and the Gate 0 release guard.
39. Updated the README command reference and threat-model automation note.
40. Updated `docs/api/openapi.yaml` so referral update and integration
    feasibility success responses document their existing `success: true`
    envelope.
41. Updated `docs/api/openapi.yaml` so pilot scorecard responses document the
    scorecard envelope, optional Gate 1 threshold evaluation, and existing
    `404` not-found response.
42. Extended `tests/unit/openapi-pilot-events.test.ts` to pin those response
    contracts.
43. Expanded `tests/lib/pilot/storage.test.ts` to pin circuit-breaker wrapping
    for representative insert, update, and read storage paths.
44. Updated the C2 retention evidence README and C2-20260329 field-level rows
    so they reference the existing completed read-only verification evidence
    instead of stale pending-evidence wording.
45. Added documentation-hygiene coverage to keep C2 retention evidence aligned
    with the Gate 0 `G0-4` pass state.
46. Updated the Phase 0 baseline report sign-off note so it no longer says the
    report is waiting on database execution context after M1/M3 execution was
    recorded.
47. Added documentation-hygiene coverage to keep baseline execution evidence
    distinct from still-pending product/governance sign-off fields.
48. Added route coverage proving referral update and integration-feasibility
    success paths return the documented `success: true` envelopes with
    `Cache-Control: no-store`.
49. Added integration-feasibility route coverage for rate limit, unauthenticated
    access, missing pilot storage, and storage failure responses.
50. Added referral update route coverage for rate limit, unauthenticated access,
    authorization failure, missing pilot storage, and storage failure responses.
51. Added shared instrumentation-route coverage for rate-limit responses across
    connection, scope, service-status, data-decay-audit, and preference-fit
    writes.
52. Added metrics-recompute route coverage for rate-limit responses and the
    authenticated-work short-circuit.
53. Added referral create route coverage for rate limit, unauthenticated access,
    authorization failure, invalid payloads, missing pilot storage, storage
    failure, and the no-store success envelope.
54. Added pilot JSON write route coverage for unsupported media type responses
    and documented the existing `415` contract in OpenAPI.
55. Updated the OpenAPI pilot contract test to derive implemented pilot route
    paths from `app/api/v1/pilot/**/route.ts`, including Next dynamic segment
    mapping from `[id]` to `{id}`.
56. Extended the OpenAPI pilot contract test to derive exported HTTP methods
    from each implemented `route.ts` file and assert the matching OpenAPI
    method block is documented.
57. Added a symmetric OpenAPI pilot path inventory check so documented
    `/pilot/...` paths must exactly match implemented pilot route files.
58. Added a symmetric OpenAPI pilot method inventory check so documented HTTP
    method blocks must exactly match exported route methods for each pilot path.
59. Added a deduplicated local OpenAPI component reference check for
    `#/components/schemas/*` and `#/components/responses/*` refs.
60. Added OpenAPI pilot operation metadata checks for documented `cookieAuth`,
    valid `operationId` fields, and unique pilot operation IDs.
61. Replaced the hardcoded pilot JSON-write path list with derived non-GET
    route operations, and asserted each documents an `application/json` request
    body plus the existing `415` response.
62. Extended the offline local recovery snapshot with `lastSyncStatus` using
    the existing offline snapshot freshness policy, and documented the aggregate
    diagnostic in the public recovery runbook.
63. Added `buildOfflineLocalRecoveryPlan()` to convert aggregate recovery
    snapshots into non-destructive recommendation IDs for dry-run notes.
64. Made pilot draft storage counts nullable when `localStorage` or
    `sessionStorage` cannot be inspected, and mapped unknown draft counts to the
    non-destructive `inspect_browser_storage` recommendation.
65. Sanitized offline local recovery and pilot draft cleanup warning metadata
    so logs carry storage class and error type only, not raw exception objects
    or messages.
66. Moved sign-out draft storage lookup inside each guarded cleanup block so
    blocked `localStorage` access does not prevent `sessionStorage` cleanup.
67. Added offline feedback queue payload normalization through
    `FeedbackSubmitSchema` before IndexedDB storage and before API replay.
68. Removed empty optional strings from queued feedback payloads so offline
    thumbs-up/down submissions do not persist invalid `category_searched`
    values.
69. Added sanitized sync warnings for invalid queued feedback, API rejection,
    and DB-access failure paths without logging raw feedback text.
70. Tightened pilot event storage idempotency so supplied-ID duplicate retries
    are suppressed only for primary-key or `id` key conflicts, while other
    duplicate constraints remain storage errors.
71. Sanitized `syncOfflineData()` failure results and warning logs so they
    return `errorType` and optional `httpStatus` instead of raw thrown objects
    or browser/network messages.
72. Sanitized `OfflineSync` background warning logs for service worker
    registration, data sync, pending feedback sync, and offline fallback
    prewarm failures.
73. Added fail-closed validation for pilot readiness scope entries loaded from
    JSON files or Supabase before generating audit outputs.
74. Sanitized Supabase pilot scope load failures and invalid-scope errors so
    readiness tooling reports field paths and error codes without raw row
    values, partner notes, or database messages.
75. Neutralized spreadsheet formula prefixes in pilot readiness CSV output so
    generated verification worksheets treat formula-like text as text.
76. Applied the pilot readiness scope validator inside
    `buildPilotReadinessReport()` as well as the file and Supabase loaders, so
    direct report-builder callers cannot bypass malformed-scope checks.
77. Added duplicate pilot readiness scope identity detection for
    `(pilot_cycle_id, org_id, service_id)` so repeated rows fail closed instead
    of inflating audit counts.
78. Tightened the D4 outreach log evidence-intake guard to require the
    canonical CSV header, `YYYY-MM-DD` dates, positive attempt numbers, and
    `source_artifact` traceability on execution rows.
79. Updated the Gate 0 evidence intake pack and sync runbook to document the
    machine-enforced D4 outreach CSV structure.
80. Tightened C1 and D4 closure submission validation so required submission
    dates must use `YYYY-MM-DD` and D4 target/contact-attempt counts must be
    positive integers.
81. Updated the Gate 0 evidence intake pack and sync runbook to document the
    machine-enforced closure submission date and count structure.
82. Tightened C1 clause-matrix validation so non-pass outcomes require both
    `Notes / rationale` and `Required mitigation or fallback` values.
83. Updated the Gate 0 evidence intake pack and sync runbook to document the
    machine-enforced C1 non-pass rationale and fallback structure.
84. Tightened C1 clause-matrix validation so closure evidence must use the
    canonical matrix header and include exactly one row for each required
    clause ID (`C1-1` through `C1-4`).
85. Updated the Gate 0 evidence intake pack and sync runbook to document the
    machine-enforced C1 matrix header and exact-row structure.
86. Tightened D4 partner-list validation so closure evidence must use the
    canonical partner-list header, exact partner types, and no duplicate
    organization / partner rows.
87. Updated the Gate 0 evidence intake pack and sync runbook to document the
    machine-enforced D4 partner-list header, type, and duplicate-row structure.
88. Tightened D4 closure validation so submitted target and contact-attempt
    counts must match the attached provider rows, frontline organization rows,
    and outreach-log execution rows.
89. Updated the Gate 0 evidence intake pack and sync runbook to document the
    machine-enforced D4 submission-to-artifact count consistency checks.
90. Tightened C1 closure validation so completed legal/API review evidence must
    include a canonical artifact inventory with non-placeholder source
    metadata and at least one artifact marked as used in the clause matrix.
91. Cross-checked C1 clause-matrix source artifact values against inventory
    Artifact ID and Filename / location values marked `Used in clause matrix`
    = `yes`.
92. Added the reusable C1 artifact inventory template and updated the C1
    evidence README, intake pack, and sync runbook to document the
    machine-enforced artifact traceability checks.
93. Normalized Markdown table header comparisons in the evidence-intake guard
    so formatter-aligned table spacing does not fail otherwise canonical C1/D4
    evidence headers.
94. Added a regression fixture for formatter-aligned C1 matrix, C1 inventory,
    and D4 partner-list headers.
95. Normalized the existing prep-only C1 artifact inventory scaffold to match
    the canonical inventory column names while preserving its `prep_only`
    status.
96. Tightened C1 and D4 closure validation so the `Submission ID` line must be
    present and match the dated submission filename prefix.
97. Added fixture coverage for mismatched C1 and D4 submission IDs.
98. Updated the Gate 0 evidence intake pack and sync runbook to document the
    machine-enforced submission-ID-to-filename consistency check.
99. Updated the C1 and D4 evidence submission templates and README files so
    future closure packets state the same submission-ID-to-filename rule at the
    source.
100. Tightened D4 closure validation so completed partner-operations evidence
     must include a canonical artifact inventory with non-placeholder source
     metadata and at least one artifact marked as supporting an outreach-log
     row.
101. Cross-checked D4 outreach-log `source_artifact` values against inventory
     Artifact ID and Filename / location values marked `Supports outreach-log
row` = `yes`.
102. Added the reusable D4 artifact inventory template and updated the D4
     evidence README, submission template, intake pack, and sync runbook to
     document the machine-enforced artifact traceability checks.
103. Added fixture coverage for missing D4 artifact inventories and
     outreach-log source artifacts that are absent from the inventory.
104. Added the
     [v22.0 Worktree Checkpoint](v22-0-worktree-checkpoint-2026-06-13.md) to
     group the current worktree by review theme and recommend commit
     boundaries without creating commits.

## Guard Behavior

The guard is status-aware:

1. Pending `UA-1/G0-3` and `UA-3/G0-8` may have only `prep_only` artifacts.
2. Complete/pass C1 requires a non-prep C1 submission, artifact inventory, and
   clause matrix with non-placeholder reviewer, artifact, clause, and
   recommendation fields, plus a `Submission ID` matching the submission
   filename.
3. Complete/pass D4 requires a non-prep D4 submission, partner list, outreach
   log, and artifact inventory with non-placeholder owner, target-count, dated
   execution, and source-artifact traceability fields, plus a `Submission ID`
   matching the submission filename.
4. The guard checks evidence structure and doc consistency only. It does not
   determine whether legal terms are acceptable or whether outreach evidence is
   strategically sufficient.

## Verification

Commands run from the repo root:

1. `bash scripts/check-v22-evidence-intake.sh` - passed; current pending C1/D4 state is internally consistent.
2. `bash -n scripts/check-v22-evidence-intake.sh` - passed.
3. `bash -n scripts/check-v22-gate0-exit.sh` - passed.
4. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
5. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts` - passed (`9` tests).
6. `node --import tsx scripts/check-references.ts` - passed (`143` files checked).
7. `node node_modules/eslint/bin/eslint.js tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts` - passed.
8. `node node_modules/typescript/bin/tsc --noEmit` - passed.
9. `bash scripts/check-root-hygiene.sh` - passed.
10. `git diff --check` - passed.
11. `node node_modules/prettier/bin/prettier.cjs --check ...` - passed after formatting new implementation/test artifacts.
12. `node node_modules/vitest/vitest.mjs run tests/lib/schemas/privacy-guards.test.ts tests/lib/schemas/pilot-events.test.ts` - passed (`19` tests).
13. `node node_modules/eslint/bin/eslint.js lib/schemas/privacy-guards.ts tests/lib/schemas/privacy-guards.test.ts tests/lib/schemas/pilot-events.test.ts` - passed.
14. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/event-replay-policy.test.ts` - passed (`4` tests).
15. `node node_modules/eslint/bin/eslint.js lib/pilot/event-replay-policy.ts tests/lib/pilot/event-replay-policy.test.ts` - passed.
16. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts tests/lib/schemas/privacy-guards.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/pilot/event-replay-policy.test.ts` - passed (`32` tests).
17. `node node_modules/prettier/bin/prettier.cjs --check docs/runbooks/offline-local-recovery.md docs/runbooks/README.md docs/security/v22-0-offline-local-threat-model.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
18. `node node_modules/vitest/vitest.mjs run tests/lib/offline/pilot-draft-cleanup.test.ts tests/components/AuthProvider.test.tsx` - passed (`8` tests).
19. `node node_modules/eslint/bin/eslint.js lib/offline/pilot-draft-cleanup.ts components/layout/AuthProvider.tsx tests/lib/offline/pilot-draft-cleanup.test.ts tests/components/AuthProvider.test.tsx` - passed.
20. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts tests/lib/schemas/privacy-guards.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/pilot/event-replay-policy.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts tests/components/AuthProvider.test.tsx` - passed (`40` tests).
21. `node node_modules/vitest/vitest.mjs run tests/lib/offline/local-recovery-audit.test.ts` - passed (`3` tests).
22. `node node_modules/eslint/bin/eslint.js lib/offline/local-recovery-audit.ts tests/lib/offline/local-recovery-audit.test.ts` - passed.
23. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts tests/lib/schemas/privacy-guards.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/pilot/event-replay-policy.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts tests/lib/offline/local-recovery-audit.test.ts tests/components/AuthProvider.test.tsx` - passed (`43` tests).
24. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/storage.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/v1/pilot-referral.test.ts tests/lib/schemas/pilot-events.test.ts` - passed (`67` tests).
25. `node node_modules/eslint/bin/eslint.js lib/pilot/storage.ts lib/schemas/pilot-events.ts app/api/v1/pilot/events/contact-attempt/route.ts app/api/v1/pilot/events/referral/route.ts app/api/v1/pilot/events/connection/route.ts app/api/v1/pilot/events/service-status/route.ts app/api/v1/pilot/events/data-decay-audit/route.ts app/api/v1/pilot/events/preference-fit/route.ts tests/lib/pilot/storage.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/v1/pilot-referral.test.ts tests/lib/schemas/pilot-events.test.ts` - passed.
26. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts tests/lib/schemas/privacy-guards.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/pilot/event-replay-policy.test.ts tests/lib/pilot/storage.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts tests/lib/offline/local-recovery-audit.test.ts tests/components/AuthProvider.test.tsx tests/api/pilot-contact-attempt.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/v1/pilot-referral.test.ts` - passed (`95` tests).
27. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts` - passed (`13` tests).
28. `node node_modules/eslint/bin/eslint.js tests/unit/openapi-pilot-events.test.ts` - passed.
29. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts tests/lib/schemas/privacy-guards.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/pilot/event-replay-policy.test.ts tests/lib/pilot/storage.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts tests/lib/offline/local-recovery-audit.test.ts tests/components/AuthProvider.test.tsx tests/api/pilot-contact-attempt.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/v1/pilot-referral.test.ts tests/unit/openapi-pilot-events.test.ts` - passed (`108` tests).
30. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/responses.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/v1/pilot-referral.test.ts` - passed (`51` tests).
31. `node node_modules/eslint/bin/eslint.js lib/pilot/responses.ts tests/lib/pilot/responses.test.ts app/api/v1/pilot/events/contact-attempt/route.ts app/api/v1/pilot/events/referral/route.ts app/api/v1/pilot/events/connection/route.ts app/api/v1/pilot/events/service-status/route.ts app/api/v1/pilot/events/data-decay-audit/route.ts app/api/v1/pilot/events/preference-fit/route.ts` - passed.
32. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts tests/lib/schemas/privacy-guards.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/pilot/event-replay-policy.test.ts tests/lib/pilot/storage.test.ts tests/lib/pilot/responses.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts tests/lib/offline/local-recovery-audit.test.ts tests/components/AuthProvider.test.tsx tests/api/pilot-contact-attempt.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/v1/pilot-referral.test.ts tests/unit/openapi-pilot-events.test.ts` - passed (`110` tests).
33. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts` - passed (`14` tests).
34. `node node_modules/eslint/bin/eslint.js tests/unit/openapi-pilot-events.test.ts` - passed.
35. `node node_modules/prettier/bin/prettier.cjs --check docs/api/openapi.yaml tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
36. `node --import tsx scripts/check-references.ts` - passed (`143` files checked).
37. `git diff --check` - passed.
38. `bash scripts/check-v22-evidence-intake.sh` - passed.
39. `bash scripts/check-root-hygiene.sh` - passed.
40. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
41. `node node_modules/typescript/bin/tsc --noEmit` - passed.
42. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts tests/api/pilot-metrics-recompute.test.ts` - passed (`21` tests).
43. `node node_modules/eslint/bin/eslint.js tests/unit/openapi-pilot-events.test.ts tests/api/pilot-metrics-recompute.test.ts` - passed.
44. `node node_modules/prettier/bin/prettier.cjs --check docs/api/openapi.yaml tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
45. `node --import tsx scripts/check-references.ts` - passed (`143` files checked).
46. `git diff --check` - passed.
47. `node node_modules/typescript/bin/tsc --noEmit` - passed.
48. `bash scripts/check-root-hygiene.sh` - passed.
49. `bash scripts/check-v22-evidence-intake.sh` - passed.
50. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
51. Static OpenAPI route-contract check with the bundled desktop Node runtime - passed after adding full internal pilot route path coverage.
52. Bundled desktop Node `prettier --check docs/api/openapi.yaml tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
53. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts` - passed (`26` tests).
54. `node node_modules/eslint/bin/eslint.js tests/unit/openapi-pilot-events.test.ts` - passed.
55. `node node_modules/prettier/bin/prettier.cjs --check docs/api/openapi.yaml tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
56. `bash -n scripts/check-v22-threat-model.sh && bash scripts/check-v22-threat-model.sh` - passed.
57. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-threat-model.test.ts` - passed (`5` tests).
58. `node node_modules/eslint/bin/eslint.js tests/scripts/check-v22-threat-model.test.ts` - passed.
59. `npm run check:v22-threat-model` - passed.
60. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result after threat-model guard integration: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
61. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-threat-model.test.ts tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts tests/unit/openapi-pilot-events.test.ts` - passed (`40` tests).
62. `node node_modules/prettier/bin/prettier.cjs --check tests/scripts/check-v22-threat-model.test.ts package.json .github/workflows/ci.yml README.md docs/security/v22-0-offline-local-threat-model.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md docs/api/openapi.yaml tests/unit/openapi-pilot-events.test.ts` - passed.
63. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
64. `node node_modules/eslint/bin/eslint.js tests/scripts/check-v22-threat-model.test.ts tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts tests/unit/openapi-pilot-events.test.ts` - passed.
65. `node node_modules/typescript/bin/tsc --noEmit` - passed.
66. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
67. `bash scripts/check-root-hygiene.sh` - passed.
68. `git diff --check` - passed.
69. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
70. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts tests/api/pilot-scorecard.test.ts tests/api/v1/pilot-scorecard.test.ts` - passed (`41` tests).
71. `node node_modules/eslint/bin/eslint.js tests/unit/openapi-pilot-events.test.ts tests/api/pilot-scorecard.test.ts tests/api/v1/pilot-scorecard.test.ts` - passed.
72. `node node_modules/prettier/bin/prettier.cjs --check docs/api/openapi.yaml tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
73. `node node_modules/typescript/bin/tsc --noEmit` - passed.
74. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
75. `git diff --check` - passed.
76. `bash scripts/check-root-hygiene.sh` - passed.
77. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
78. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
79. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/storage.test.ts` - passed (`5` tests).
80. `node node_modules/eslint/bin/eslint.js tests/lib/pilot/storage.test.ts` - passed.
81. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/storage.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/v1/pilot-referral.test.ts tests/api/pilot-scorecard.test.ts tests/api/v1/pilot-scorecard.test.ts tests/unit/openapi-pilot-events.test.ts` - passed (`95` tests).
82. `node node_modules/eslint/bin/eslint.js tests/lib/pilot/storage.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/v1/pilot-referral.test.ts tests/api/pilot-scorecard.test.ts tests/api/v1/pilot-scorecard.test.ts tests/unit/openapi-pilot-events.test.ts` - passed.
83. `node node_modules/prettier/bin/prettier.cjs --check tests/lib/pilot/storage.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md docs/api/openapi.yaml tests/unit/openapi-pilot-events.test.ts` - passed.
84. `node node_modules/typescript/bin/tsc --noEmit` - passed.
85. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
86. `git diff --check` - passed.
87. `bash scripts/check-root-hygiene.sh` - passed.
88. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
89. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
90. `node node_modules/vitest/vitest.mjs run tests/unit/documentation-hygiene.test.ts` - passed (`14` tests).
91. `node node_modules/eslint/bin/eslint.js tests/unit/documentation-hygiene.test.ts` - passed.
92. `node node_modules/prettier/bin/prettier.cjs --check docs/implementation/v22-0-evidence/c2-retention/README.md docs/implementation/v22-0-evidence/c2-retention/C2-20260329.md tests/unit/documentation-hygiene.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
93. `node node_modules/typescript/bin/tsc --noEmit` - passed.
94. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
95. `git diff --check` - passed.
96. `bash scripts/check-root-hygiene.sh` - passed.
97. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
98. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
99. `node node_modules/vitest/vitest.mjs run tests/unit/documentation-hygiene.test.ts` - passed (`15` tests).
100. `node node_modules/eslint/bin/eslint.js tests/unit/documentation-hygiene.test.ts` - passed.
101. `node node_modules/prettier/bin/prettier.cjs --check docs/implementation/v22-0-phase-0-baseline-report-2026-03-09.md tests/unit/documentation-hygiene.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting the maintenance log.
102. `git diff --check` - passed.
103. `node node_modules/typescript/bin/tsc --noEmit` - passed.
104. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
105. `bash scripts/check-root-hygiene.sh` - passed.
106. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
107. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
108. `node node_modules/vitest/vitest.mjs run tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts` - passed (`8` tests).
109. `node node_modules/eslint/bin/eslint.js tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts` - passed.
110. `node node_modules/prettier/bin/prettier.cjs --check tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting the maintenance log.
111. `node node_modules/vitest/vitest.mjs run tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/unit/openapi-pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts` - passed (`40` tests).
112. `node node_modules/eslint/bin/eslint.js tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/unit/openapi-pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts` - passed.
113. `node node_modules/typescript/bin/tsc --noEmit` - passed.
114. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
115. `bash scripts/check-root-hygiene.sh` - passed.
116. `git diff --check` - passed.
117. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
118. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
119. `node node_modules/vitest/vitest.mjs run tests/api/v1/pilot-integration-feasibility.test.ts` - passed (`7` tests).
120. `node node_modules/eslint/bin/eslint.js tests/api/v1/pilot-integration-feasibility.test.ts` - passed.
121. `node node_modules/vitest/vitest.mjs run tests/api/v1/pilot-integration-feasibility.test.ts tests/api/v1/pilot-referral.test.ts tests/unit/openapi-pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts` - passed (`44` tests).
122. `node node_modules/eslint/bin/eslint.js tests/api/v1/pilot-integration-feasibility.test.ts tests/api/v1/pilot-referral.test.ts tests/unit/openapi-pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts` - passed.
123. `node node_modules/prettier/bin/prettier.cjs --check tests/api/v1/pilot-integration-feasibility.test.ts tests/api/v1/pilot-referral.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
124. `node node_modules/typescript/bin/tsc --noEmit` - passed.
125. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
126. `git diff --check` - passed.
127. `bash scripts/check-root-hygiene.sh` - passed.
128. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
129. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
130. `node node_modules/vitest/vitest.mjs run tests/api/v1/pilot-referral.test.ts` - passed (`9` tests).
131. `node node_modules/eslint/bin/eslint.js tests/api/v1/pilot-referral.test.ts` - passed.
132. `node node_modules/vitest/vitest.mjs run tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/unit/openapi-pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts tests/lib/schemas/pilot-events.test.ts` - passed (`64` tests).
133. `node node_modules/eslint/bin/eslint.js tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/unit/openapi-pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts tests/lib/schemas/pilot-events.test.ts` - passed.
134. `node node_modules/prettier/bin/prettier.cjs --check tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
135. `node node_modules/typescript/bin/tsc --noEmit` - passed.
136. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
137. `git diff --check` - passed.
138. `bash scripts/check-root-hygiene.sh` - passed.
139. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
140. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
141. `node node_modules/vitest/vitest.mjs run tests/api/pilot-instrumentation-routes.test.ts` - passed (`40` tests).
142. `node node_modules/eslint/bin/eslint.js tests/api/pilot-instrumentation-routes.test.ts` - passed.
143. `node node_modules/vitest/vitest.mjs run tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/unit/openapi-pilot-events.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts` - passed (`114` tests).
144. `node node_modules/eslint/bin/eslint.js tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/unit/openapi-pilot-events.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts` - passed.
145. `node node_modules/prettier/bin/prettier.cjs --check tests/api/pilot-instrumentation-routes.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
146. `node node_modules/typescript/bin/tsc --noEmit` - passed.
147. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
148. `git diff --check` - passed.
149. `bash scripts/check-root-hygiene.sh` - passed.
150. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
151. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
152. `node node_modules/vitest/vitest.mjs run tests/api/pilot-metrics-recompute.test.ts` - passed (`7` tests).
153. `node node_modules/vitest/vitest.mjs run tests/api/pilot-metrics-recompute.test.ts tests/api/pilot-scorecard.test.ts tests/api/v1/pilot-scorecard.test.ts tests/unit/openapi-pilot-events.test.ts tests/lib/observability/pilot-metrics.test.ts tests/lib/schemas/pilot-events.test.ts` - passed (`71` tests).
154. `node node_modules/eslint/bin/eslint.js tests/api/pilot-metrics-recompute.test.ts` - passed.
155. `node node_modules/prettier/bin/prettier.cjs --check tests/api/pilot-metrics-recompute.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
156. `node node_modules/typescript/bin/tsc --noEmit` - passed.
157. `node --import tsx scripts/check-references.ts` - passed.
158. `git diff --check` - passed.
159. `bash scripts/check-root-hygiene.sh` - passed.
160. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
161. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
162. `node node_modules/vitest/vitest.mjs run tests/api/v1/pilot-referral.test.ts` - passed (`15` tests).
163. `node node_modules/vitest/vitest.mjs run tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-contact-attempt.test.ts tests/unit/openapi-pilot-events.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts tests/lib/pilot/responses.test.ts` - passed (`122` tests).
164. `node node_modules/eslint/bin/eslint.js tests/api/v1/pilot-referral.test.ts` - passed.
165. `node node_modules/prettier/bin/prettier.cjs --check tests/api/v1/pilot-referral.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
166. `node node_modules/typescript/bin/tsc --noEmit` - passed.
167. `node --import tsx scripts/check-references.ts` - passed.
168. `git diff --check` - passed.
169. `bash scripts/check-root-hygiene.sh` - passed.
170. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
171. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
172. `node node_modules/vitest/vitest.mjs run tests/api/pilot-instrumentation-routes.test.ts tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/api/pilot-metrics-recompute.test.ts tests/unit/openapi-pilot-events.test.ts` - passed (`116` tests).
173. `node node_modules/eslint/bin/eslint.js tests/api/pilot-instrumentation-routes.test.ts tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/api/pilot-metrics-recompute.test.ts tests/unit/openapi-pilot-events.test.ts` - passed.
174. `node node_modules/prettier/bin/prettier.cjs --check docs/api/openapi.yaml tests/api/pilot-instrumentation-routes.test.ts tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/api/pilot-metrics-recompute.test.ts tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
175. `node node_modules/typescript/bin/tsc --noEmit` - passed.
176. `node --import tsx scripts/check-references.ts` - passed.
177. `git diff --check` - passed.
178. `bash scripts/check-root-hygiene.sh` - passed.
179. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
180. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
181. `node node_modules/vitest/vitest.mjs run tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/api/pilot-metrics-recompute.test.ts tests/unit/openapi-pilot-events.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts tests/lib/pilot/responses.test.ts` - passed (`148` tests).
182. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts` - passed (`38` tests).
183. `node node_modules/eslint/bin/eslint.js tests/unit/openapi-pilot-events.test.ts` - passed.
184. `node node_modules/prettier/bin/prettier.cjs --check tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
185. `node --import tsx scripts/check-references.ts` - passed.
186. `git diff --check` - passed.
187. `bash scripts/check-root-hygiene.sh` - passed.
188. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
189. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
190. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts` - passed (`49` tests).
191. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/api/pilot-metrics-recompute.test.ts tests/api/pilot-scorecard.test.ts tests/api/v1/pilot-scorecard.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts` - passed (`170` tests).
192. `node node_modules/eslint/bin/eslint.js tests/unit/openapi-pilot-events.test.ts` - passed.
193. `node node_modules/prettier/bin/prettier.cjs --check tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
194. `node node_modules/typescript/bin/tsc --noEmit` - passed.
195. `node --import tsx scripts/check-references.ts` - passed.
196. `git diff --check` - passed.
197. `bash scripts/check-root-hygiene.sh` - passed.
198. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
199. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
200. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts` - passed (`50` tests).
201. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/api/pilot-metrics-recompute.test.ts tests/api/pilot-scorecard.test.ts tests/api/v1/pilot-scorecard.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts` - passed (`171` tests).
202. `node node_modules/eslint/bin/eslint.js tests/unit/openapi-pilot-events.test.ts` - passed.
203. `node node_modules/prettier/bin/prettier.cjs --check tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
204. `node node_modules/typescript/bin/tsc --noEmit` - passed.
205. `node --import tsx scripts/check-references.ts` - passed.
206. `git diff --check` - passed.
207. `bash scripts/check-root-hygiene.sh` - passed.
208. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
209. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
210. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts` - passed (`61` tests).
211. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/api/pilot-metrics-recompute.test.ts tests/api/pilot-scorecard.test.ts tests/api/v1/pilot-scorecard.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts` - passed (`182` tests).
212. `node node_modules/eslint/bin/eslint.js tests/unit/openapi-pilot-events.test.ts` - passed.
213. `node node_modules/prettier/bin/prettier.cjs --check tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
214. `node node_modules/typescript/bin/tsc --noEmit` - passed.
215. `node --import tsx scripts/check-references.ts` - passed.
216. `git diff --check` - passed.
217. `bash scripts/check-root-hygiene.sh` - passed.
218. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
219. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
220. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts` - passed (`85` tests).
221. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/api/pilot-metrics-recompute.test.ts tests/api/pilot-scorecard.test.ts tests/api/v1/pilot-scorecard.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts` - passed (`206` tests).
222. `node node_modules/eslint/bin/eslint.js tests/unit/openapi-pilot-events.test.ts` - passed.
223. `node node_modules/prettier/bin/prettier.cjs --check tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
224. `node node_modules/typescript/bin/tsc --noEmit` - passed.
225. `node --import tsx scripts/check-references.ts` - passed.
226. `git diff --check` - passed.
227. `bash scripts/check-root-hygiene.sh` - passed.
228. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
229. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
230. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts` - passed (`108` tests).
231. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/api/pilot-metrics-recompute.test.ts tests/api/pilot-scorecard.test.ts tests/api/v1/pilot-scorecard.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts` - passed (`229` tests).
232. `node node_modules/eslint/bin/eslint.js tests/unit/openapi-pilot-events.test.ts` - passed.
233. `node node_modules/prettier/bin/prettier.cjs --check tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
234. `node node_modules/typescript/bin/tsc --noEmit` - passed.
235. `node --import tsx scripts/check-references.ts` - passed.
236. `git diff --check` - passed.
237. `bash scripts/check-root-hygiene.sh` - passed.
238. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
239. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
240. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts` - passed (`118` tests).
241. `node node_modules/vitest/vitest.mjs run tests/unit/openapi-pilot-events.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/v1/pilot-referral.test.ts tests/api/v1/pilot-integration-feasibility.test.ts tests/api/pilot-metrics-recompute.test.ts tests/api/pilot-scorecard.test.ts tests/api/v1/pilot-scorecard.test.ts tests/lib/schemas/pilot-events.test.ts tests/lib/schemas/integration-feasibility.test.ts` - passed (`239` tests).
242. `node node_modules/eslint/bin/eslint.js tests/unit/openapi-pilot-events.test.ts` - passed.
243. `node node_modules/prettier/bin/prettier.cjs --check tests/unit/openapi-pilot-events.test.ts docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
244. `node node_modules/typescript/bin/tsc --noEmit` - passed.
245. `node --import tsx scripts/check-references.ts` - passed.
246. `git diff --check` - passed.
247. `bash scripts/check-root-hygiene.sh` - passed.
248. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
249. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
250. `node node_modules/vitest/vitest.mjs run tests/lib/offline/local-recovery-audit.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts tests/lib/offline/snapshot.test.ts` - passed (`14` tests).
251. `node node_modules/vitest/vitest.mjs run tests/lib/offline/local-recovery-audit.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts tests/lib/offline/snapshot.test.ts tests/components/offline/OfflineSnapshotStatus.test.tsx tests/components/AuthProvider.test.tsx` - passed (`20` tests).
252. `node node_modules/eslint/bin/eslint.js lib/offline/local-recovery-audit.ts tests/lib/offline/local-recovery-audit.test.ts` - passed.
253. `node node_modules/prettier/bin/prettier.cjs --check lib/offline/local-recovery-audit.ts tests/lib/offline/local-recovery-audit.test.ts docs/runbooks/offline-local-recovery.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
254. `node node_modules/typescript/bin/tsc --noEmit` - passed.
255. `node --import tsx scripts/check-references.ts` - passed.
256. `git diff --check` - passed.
257. `bash scripts/check-root-hygiene.sh` - passed.
258. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
259. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
260. `node node_modules/vitest/vitest.mjs run tests/lib/offline/local-recovery-audit.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts tests/lib/offline/snapshot.test.ts tests/components/offline/OfflineSnapshotStatus.test.tsx tests/components/AuthProvider.test.tsx` - passed (`24` tests).
261. `node node_modules/eslint/bin/eslint.js lib/offline/local-recovery-audit.ts tests/lib/offline/local-recovery-audit.test.ts` - passed.
262. `node node_modules/prettier/bin/prettier.cjs --check lib/offline/local-recovery-audit.ts tests/lib/offline/local-recovery-audit.test.ts docs/runbooks/offline-local-recovery.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
263. `node node_modules/typescript/bin/tsc --noEmit` - passed.
264. `node --import tsx scripts/check-references.ts` - passed.
265. `git diff --check` - passed.
266. `bash scripts/check-root-hygiene.sh` - passed.
267. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
268. `bash scripts/check-v22-gate0-exit.sh` - expected blocked result: evidence intake and threat-model checks pass, then Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`.
269. `node node_modules/vitest/vitest.mjs run tests/lib/offline/local-recovery-audit.test.ts` - passed (`10` tests).
270. `node node_modules/vitest/vitest.mjs run tests/lib/offline/local-recovery-audit.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts tests/lib/offline/snapshot.test.ts tests/components/offline/OfflineSnapshotStatus.test.tsx tests/components/AuthProvider.test.tsx` - passed (`25` tests).
271. `node node_modules/eslint/bin/eslint.js lib/offline/local-recovery-audit.ts tests/lib/offline/local-recovery-audit.test.ts` - passed.
272. `node node_modules/prettier/bin/prettier.cjs --check lib/offline/local-recovery-audit.ts tests/lib/offline/local-recovery-audit.test.ts docs/runbooks/offline-local-recovery.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
273. `node node_modules/typescript/bin/tsc --noEmit` - passed.
274. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
275. `git diff --check` - passed.
276. `bash scripts/check-root-hygiene.sh` - passed.
277. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh` - passed.
278. `if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: evidence intake and threat-model checks pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
279. `node node_modules/vitest/vitest.mjs run tests/lib/offline/local-recovery-audit.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts` - passed (`15` tests).
280. `node node_modules/vitest/vitest.mjs run tests/lib/offline/local-recovery-audit.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts tests/lib/offline/snapshot.test.ts tests/components/offline/OfflineSnapshotStatus.test.tsx tests/components/AuthProvider.test.tsx` - passed (`26` tests).
281. `node node_modules/eslint/bin/eslint.js lib/offline/local-recovery-audit.ts lib/offline/pilot-draft-cleanup.ts tests/lib/offline/local-recovery-audit.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts` - passed.
282. `node node_modules/prettier/bin/prettier.cjs --check lib/offline/local-recovery-audit.ts lib/offline/pilot-draft-cleanup.ts tests/lib/offline/local-recovery-audit.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts docs/runbooks/offline-local-recovery.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting `tests/lib/offline/local-recovery-audit.test.ts`.
283. `node node_modules/typescript/bin/tsc --noEmit` - passed.
284. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
285. `git diff --check` - passed.
286. `bash scripts/check-root-hygiene.sh` - passed.
287. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
288. `node node_modules/vitest/vitest.mjs run tests/lib/offline/feedback.test.ts` - passed (`10` tests).
289. `node node_modules/vitest/vitest.mjs run tests/lib/offline/feedback.test.ts tests/lib/offline/local-recovery-audit.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts tests/lib/offline/snapshot.test.ts tests/components/offline/OfflineSnapshotStatus.test.tsx tests/components/offline/OfflineSync.test.tsx tests/components/AuthProvider.test.tsx` - passed (`54` tests).
290. `node node_modules/eslint/bin/eslint.js lib/offline/feedback.ts tests/lib/offline/feedback.test.ts` - passed.
291. `node node_modules/prettier/bin/prettier.cjs --check lib/offline/feedback.ts tests/lib/offline/feedback.test.ts docs/runbooks/offline-local-recovery.md docs/security/v22-0-offline-local-threat-model.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting `lib/offline/feedback.ts` and `docs/security/v22-0-offline-local-threat-model.md`.
292. `node node_modules/typescript/bin/tsc --noEmit` - passed.
293. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
294. `git diff --check` - passed.
295. `bash scripts/check-root-hygiene.sh` - passed.
296. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
297. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/storage.test.ts` - passed (`6` tests).
298. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/storage.test.ts tests/lib/pilot/event-replay-policy.test.ts tests/lib/pilot/responses.test.ts tests/api/pilot-contact-attempt.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/v1/pilot-referral.test.ts` - passed (`84` tests).
299. `node node_modules/eslint/bin/eslint.js lib/pilot/storage.ts tests/lib/pilot/storage.test.ts` - passed.
300. `node node_modules/prettier/bin/prettier.cjs --check lib/pilot/storage.ts tests/lib/pilot/storage.test.ts docs/runbooks/pilot-event-replay.md docs/security/v22-0-offline-local-threat-model.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting `docs/security/v22-0-offline-local-threat-model.md`.
301. `node node_modules/typescript/bin/tsc --noEmit` - passed.
302. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
303. `git diff --check` - passed.
304. `bash scripts/check-root-hygiene.sh` - passed.
305. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
306. `node node_modules/vitest/vitest.mjs run tests/unit/lib/offline/sync.test.ts tests/components/offline/OfflineSync.test.tsx` - passed (`24` tests).
307. `node node_modules/vitest/vitest.mjs run tests/unit/lib/offline/sync.test.ts tests/components/offline/OfflineSync.test.tsx tests/lib/offline/feedback.test.ts tests/lib/offline/local-recovery-audit.test.ts tests/lib/offline/pilot-draft-cleanup.test.ts tests/lib/offline/snapshot.test.ts tests/components/offline/OfflineSnapshotStatus.test.tsx tests/components/ui/OfflineBanner.test.tsx tests/components/AuthProvider.test.tsx` - passed (`70` tests) after retrying an intermittent WSL transport failure.
308. `node node_modules/eslint/bin/eslint.js lib/offline/sync.ts components/offline/OfflineSync.tsx tests/unit/lib/offline/sync.test.ts tests/components/offline/OfflineSync.test.tsx` - passed.
309. `node node_modules/prettier/bin/prettier.cjs --check lib/offline/sync.ts components/offline/OfflineSync.tsx tests/unit/lib/offline/sync.test.ts tests/components/offline/OfflineSync.test.tsx docs/runbooks/offline-local-recovery.md docs/security/v22-0-offline-local-threat-model.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting `docs/security/v22-0-offline-local-threat-model.md` and `docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md`.
310. `node node_modules/typescript/bin/tsc --noEmit` - passed.
311. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
312. `git diff --check` - passed.
313. `bash scripts/check-root-hygiene.sh` - passed after retrying an intermittent WSL transport timeout.
314. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
315. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/readiness-audit.test.ts` - passed (`7` tests).
316. `node node_modules/eslint/bin/eslint.js lib/pilot/readiness-audit.ts tests/lib/pilot/readiness-audit.test.ts` - passed.
317. `node node_modules/prettier/bin/prettier.cjs --check lib/pilot/readiness-audit.ts tests/lib/pilot/readiness-audit.test.ts docs/implementation/v22-pilot-readiness/README.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
318. `node node_modules/typescript/bin/tsc --noEmit` - passed.
319. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/readiness-audit.test.ts tests/lib/pilot/storage.test.ts tests/lib/pilot/event-replay-policy.test.ts tests/lib/pilot/responses.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-metrics-recompute.test.ts tests/unit/openapi-pilot-events.test.ts` - passed (`190` tests).
320. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
321. `git diff --check` - passed.
322. `bash scripts/check-root-hygiene.sh` - passed.
323. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
324. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/readiness-audit.test.ts` - passed (`8` tests).
325. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/readiness-audit.test.ts tests/lib/pilot/storage.test.ts tests/lib/pilot/event-replay-policy.test.ts tests/lib/pilot/responses.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-metrics-recompute.test.ts tests/unit/openapi-pilot-events.test.ts` - passed (`191` tests).
326. `node node_modules/eslint/bin/eslint.js lib/pilot/readiness-audit.ts tests/lib/pilot/readiness-audit.test.ts` - passed.
327. `node node_modules/prettier/bin/prettier.cjs --check lib/pilot/readiness-audit.ts tests/lib/pilot/readiness-audit.test.ts docs/implementation/v22-pilot-readiness/README.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting `tests/lib/pilot/readiness-audit.test.ts`.
328. `node node_modules/typescript/bin/tsc --noEmit` - passed.
329. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
330. `git diff --check` - passed.
331. `bash scripts/check-root-hygiene.sh` - passed.
332. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
333. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/readiness-audit.test.ts` - passed (`9` tests).
334. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/readiness-audit.test.ts tests/lib/pilot/storage.test.ts tests/lib/pilot/event-replay-policy.test.ts tests/lib/pilot/responses.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-metrics-recompute.test.ts tests/unit/openapi-pilot-events.test.ts` - passed (`192` tests).
335. `node node_modules/eslint/bin/eslint.js lib/pilot/readiness-audit.ts tests/lib/pilot/readiness-audit.test.ts` - passed.
336. `node node_modules/prettier/bin/prettier.cjs --check lib/pilot/readiness-audit.ts tests/lib/pilot/readiness-audit.test.ts docs/implementation/v22-pilot-readiness/README.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
337. `node node_modules/typescript/bin/tsc --noEmit` - passed.
338. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
339. `git diff --check` - passed.
340. `bash scripts/check-root-hygiene.sh` - passed.
341. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
342. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/readiness-audit.test.ts` - passed (`11` tests).
343. `node node_modules/eslint/bin/eslint.js lib/pilot/readiness-audit.ts tests/lib/pilot/readiness-audit.test.ts` - passed.
344. `node node_modules/prettier/bin/prettier.cjs --check lib/pilot/readiness-audit.ts tests/lib/pilot/readiness-audit.test.ts docs/implementation/v22-pilot-readiness/README.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting `lib/pilot/readiness-audit.ts`.
345. `node node_modules/typescript/bin/tsc --noEmit` - passed.
346. `node node_modules/vitest/vitest.mjs run tests/lib/pilot/readiness-audit.test.ts tests/lib/pilot/storage.test.ts tests/lib/pilot/event-replay-policy.test.ts tests/lib/pilot/responses.test.ts tests/api/pilot-instrumentation-routes.test.ts tests/api/pilot-metrics-recompute.test.ts tests/unit/openapi-pilot-events.test.ts` - passed (`194` tests).
347. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
348. `git diff --check && bash scripts/check-root-hygiene.sh` - passed.
349. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
350. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed (`12` tests).
351. `bash -n scripts/check-v22-evidence-intake.sh && bash -n scripts/check-v22-gate0-exit.sh && bash -n scripts/check-v22-threat-model.sh` - passed.
352. `node node_modules/eslint/bin/eslint.js tests/scripts/check-v22-evidence-intake.test.ts` - passed.
353. `node node_modules/prettier/bin/prettier.cjs --check tests/scripts/check-v22-evidence-intake.test.ts docs/implementation/v22-0-gate-0-evidence-intake-pack.md docs/implementation/v22-0-gate-0-evidence-sync-runbook.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting `tests/scripts/check-v22-evidence-intake.test.ts`.
354. `node node_modules/typescript/bin/tsc --noEmit` - passed.
355. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
356. `git diff --check && bash scripts/check-root-hygiene.sh` - passed.
357. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
358. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed (`14` tests).
359. `bash -n scripts/check-v22-evidence-intake.sh && bash -n scripts/check-v22-gate0-exit.sh && bash -n scripts/check-v22-threat-model.sh` - passed.
360. `node node_modules/eslint/bin/eslint.js tests/scripts/check-v22-evidence-intake.test.ts` - passed.
361. `node node_modules/prettier/bin/prettier.cjs --check tests/scripts/check-v22-evidence-intake.test.ts docs/implementation/v22-0-gate-0-evidence-intake-pack.md docs/implementation/v22-0-gate-0-evidence-sync-runbook.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting `docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md`.
362. `node node_modules/typescript/bin/tsc --noEmit` - passed.
363. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
364. `git diff --check && bash scripts/check-root-hygiene.sh` - passed.
365. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
366. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed (`16` tests).
367. `bash -n scripts/check-v22-evidence-intake.sh && bash -n scripts/check-v22-gate0-exit.sh && bash -n scripts/check-v22-threat-model.sh` - passed.
368. `node node_modules/eslint/bin/eslint.js tests/scripts/check-v22-evidence-intake.test.ts` - passed.
369. `node node_modules/prettier/bin/prettier.cjs --check tests/scripts/check-v22-evidence-intake.test.ts docs/implementation/v22-0-gate-0-evidence-intake-pack.md docs/implementation/v22-0-gate-0-evidence-sync-runbook.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting `tests/scripts/check-v22-evidence-intake.test.ts`.
370. `node node_modules/typescript/bin/tsc --noEmit` - passed.
371. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
372. `git diff --check && bash scripts/check-root-hygiene.sh` - passed.
373. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
374. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed (`18` tests).
375. `bash -n scripts/check-v22-evidence-intake.sh && bash -n scripts/check-v22-gate0-exit.sh && bash -n scripts/check-v22-threat-model.sh` - passed.
376. `node node_modules/eslint/bin/eslint.js tests/scripts/check-v22-evidence-intake.test.ts` - passed.
377. `node node_modules/prettier/bin/prettier.cjs --check tests/scripts/check-v22-evidence-intake.test.ts docs/implementation/v22-0-gate-0-evidence-intake-pack.md docs/implementation/v22-0-gate-0-evidence-sync-runbook.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
378. `node node_modules/typescript/bin/tsc --noEmit` - passed.
379. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
380. `git diff --check && bash scripts/check-root-hygiene.sh` - passed.
381. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
382. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed (`21` tests).
383. `bash -n scripts/check-v22-evidence-intake.sh && bash -n scripts/check-v22-gate0-exit.sh && bash -n scripts/check-v22-threat-model.sh` - passed.
384. `node node_modules/eslint/bin/eslint.js tests/scripts/check-v22-evidence-intake.test.ts` - passed.
385. `node node_modules/prettier/bin/prettier.cjs --check tests/scripts/check-v22-evidence-intake.test.ts docs/implementation/v22-0-gate-0-evidence-intake-pack.md docs/implementation/v22-0-gate-0-evidence-sync-runbook.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting `docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md`.
386. `node node_modules/typescript/bin/tsc --noEmit` - passed.
387. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
388. `git diff --check && bash scripts/check-root-hygiene.sh` - passed.
389. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
390. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed (`22` tests).
391. `bash -n scripts/check-v22-evidence-intake.sh && bash -n scripts/check-v22-gate0-exit.sh && bash -n scripts/check-v22-threat-model.sh` - passed.
392. `node node_modules/eslint/bin/eslint.js tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed.
393. `node node_modules/prettier/bin/prettier.cjs --check tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts docs/implementation/v22-0-gate-0-evidence-intake-pack.md docs/implementation/v22-0-gate-0-evidence-sync-runbook.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
394. `node node_modules/typescript/bin/tsc --noEmit` - passed.
395. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
396. `git diff --check` - passed.
397. `bash scripts/check-root-hygiene.sh` - passed.
398. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
399. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed (`25` tests).
400. `bash -n scripts/check-v22-evidence-intake.sh && bash -n scripts/check-v22-gate0-exit.sh && bash -n scripts/check-v22-threat-model.sh` - passed.
401. `node node_modules/eslint/bin/eslint.js tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed.
402. `node node_modules/prettier/bin/prettier.cjs --check tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts docs/implementation/v22-0-evidence/c1-partner-terms/ARTIFACT_INVENTORY_TEMPLATE.md docs/implementation/v22-0-evidence/c1-partner-terms/C1-20260428-artifact-inventory.md docs/implementation/v22-0-evidence/c1-partner-terms/README.md docs/implementation/v22-0-gate-0-evidence-intake-pack.md docs/implementation/v22-0-gate-0-evidence-sync-runbook.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed after formatting the C1 prep inventory scaffold.
403. `node node_modules/typescript/bin/tsc --noEmit` - passed.
404. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
405. `git diff --check` - passed.
406. `bash scripts/check-root-hygiene.sh` - passed.
407. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
408. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed (`27` tests).
409. `bash -n scripts/check-v22-evidence-intake.sh && bash -n scripts/check-v22-gate0-exit.sh && bash -n scripts/check-v22-threat-model.sh` - passed.
410. `node node_modules/eslint/bin/eslint.js tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed.
411. `node node_modules/prettier/bin/prettier.cjs --check tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts docs/implementation/v22-0-gate-0-evidence-intake-pack.md docs/implementation/v22-0-gate-0-evidence-sync-runbook.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
412. `node node_modules/typescript/bin/tsc --noEmit` - passed.
413. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
414. `git diff --check` - passed after retrying a transient WSL transport failure.
415. `bash scripts/check-root-hygiene.sh` - passed.
416. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
417. `node node_modules/prettier/bin/prettier.cjs --check docs/implementation/v22-0-evidence/c1-partner-terms/SUBMISSION_TEMPLATE.md docs/implementation/v22-0-evidence/c1-partner-terms/README.md docs/implementation/v22-0-evidence/d4-partner-ops/SUBMISSION_TEMPLATE.md docs/implementation/v22-0-evidence/d4-partner-ops/README.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md` - passed.
418. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
419. `git diff --check` - passed.
420. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.
421. `node node_modules/vitest/vitest.mjs run tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed (`29` tests).
422. `bash -n scripts/check-v22-evidence-intake.sh && bash -n scripts/check-v22-gate0-exit.sh && bash -n scripts/check-v22-threat-model.sh` - passed.
423. `node node_modules/eslint/bin/eslint.js tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts` - passed.
424. `node node_modules/prettier/bin/prettier.cjs --check tests/scripts/check-v22-evidence-intake.test.ts tests/scripts/check-v22-gate0-exit.test.ts docs/implementation/v22-0-evidence/d4-partner-ops/ARTIFACT_INVENTORY_TEMPLATE.md docs/implementation/v22-0-evidence/d4-partner-ops/D4-20260428-artifact-inventory.md docs/implementation/v22-0-evidence/d4-partner-ops/README.md docs/implementation/v22-0-evidence/d4-partner-ops/SUBMISSION_TEMPLATE.md docs/implementation/v22-0-gate-0-evidence-intake-pack.md docs/implementation/v22-0-gate-0-evidence-sync-runbook.md docs/implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md docs/implementation/v22-0-worktree-checkpoint-2026-06-13.md` - passed after formatting the D4 prep inventory scaffold, sync runbook, script tests, and maintenance ledger.
425. `node node_modules/typescript/bin/tsc --noEmit` - passed.
426. `node --import tsx scripts/check-references.ts` - passed (`144` files checked).
427. `git diff --check` - passed.
428. `bash scripts/check-root-hygiene.sh` - passed.
429. `bash scripts/check-v22-threat-model.sh && bash scripts/check-v22-evidence-intake.sh && if bash scripts/check-v22-gate0-exit.sh; then echo GATE0_EXIT_ZERO; else echo GATE0_EXIT_NONZERO; fi` - expected blocked result: consistency guards pass, Gate 0 remains `NO-GO` with blocking checks `G0-3`, `G0-8`, and the guard exits nonzero.

The desktop shell did not expose `npm` on WSL `PATH`, so validation used an
available Linux Node runtime directly with repo-local `node_modules`.
WSL later became intermittently
unavailable with `Wsl/Service/E_UNEXPECTED`, so the final path-coverage-only
OpenAPI assertion was also checked with the bundled desktop Node runtime.

## Remaining Work

1. Obtain and attach real C1 partner legal/API terms before any C1 closure
   attempt.
2. Obtain and attach real D4 named partner, outreach owner, and dated execution
   evidence before any D4 closure attempt.
3. Run `npm run check:v22-evidence` and `npm run check:v22-gate0` after any
   evidence sync.
