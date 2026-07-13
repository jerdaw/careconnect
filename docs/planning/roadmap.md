---
status: stable
last_updated: 2026-07-13
owner: jer
tags: [planning, roadmap, v22.0, governance, multi-city, brampton]
---

# CareConnect: Product Roadmap

> **Current Version**: v22.0 non-duplicate value decision plan
> **Decision Gate**: Gate 0 exit is `NO-GO`
> **Immediate Priority**: service reverification plus C1/D4 evidence closure
> **Brampton Status**: approved eight-record first launch is complete; further changes are gated
> **Last Updated**: 2026-07-13
> **Platform Status**: technically mature, operating as a constrained public directory while evidence gates remain open

## Executive Status

| Area                    | Current state                                                                                                                                                                                                                                                   | Authoritative evidence                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Strategic decision      | v22 Gate 0 exit remains `NO-GO`; the constrained public-directory disposition is not full pilot approval.                                                                                                                                                       | [Gate 0 Exit Checklist](../implementation/v22-0-gate-0-exit-checklist.md)                 |
| Service availability    | 204 records: 8 fresh, 1 due-but-visible, and 195 stale/hidden. The 42 stale Crisis records are the first verification lane.                                                                                                                                     | [2026-07-13 Freshness Audit](../audits/service-freshness/2026-07-13/staleness-summary.md) |
| Gate 0 evidence         | `G0-3 / C1` lacks partner legal/API terms and clause review. `G0-8 / D4` lacks named partners, outreach ownership, and dated execution evidence.                                                                                                                | [User Action Tracker](../implementation/v22-0-gate-0-user-action-tracker.md)              |
| Brampton                | The approved eight-record launch is complete. Six records are L2; Knights Table and Ste. Louise remain L1. Deferred candidates and any future L2/L3 changes stay gated.                                                                                         | [Brampton Readiness Report](../launch/brampton-readiness-report.md)                       |
| Offline threat model    | F3 replay evidence and F5 bounded cache-rehydration evidence are complete. F1 queue-payload inspection and F2 authenticated sign-out QA still require real queue/session evidence before activation.                                                            | [Offline/Local Threat Model](../security/v22-0-offline-local-threat-model.md)             |
| Technical baseline      | The default Vitest, DB integration, lint, type-check, build, reference, accessibility, and deterministic search-report lanes are established. Workflow runtime hygiene is current. Routine work should maintain these lanes, not invent new scope.              | [Maintenance Audit](../maintenance-audit.md)                                              |
| Public/private boundary | Application behavior and public-safe evidence belong here; active deployment facts are maintained privately. Credentials, provider-console actions, exact deployment state, and shared-host operations remain in the private/shared operations source of truth. | [ADR-022](../adr/022-public-documentation-boundary.md)                                    |

Freshness governance treats 180 days as the hard visibility limit and 90 days as the priority-service reverification target. The v22 90-day window is a review checkpoint rather than a guaranteed build schedule.

**Repository-only execution queue:** empty. The P0 lanes below require real
service, legal, or partner evidence. Until one of those inputs changes, repo
work is limited to concrete regressions, security/dependency maintenance, and
truth updates that preserve the established validation and safety boundaries.

## Priority Order

The first four lanes are parallel human-owned priorities. Repository work follows only when their evidence arrives or when a concrete regression appears.

| Order | Workstream                       | Next action                                                                                                                                                | Completion condition                                                                     |
| ----- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| P0-A  | Crisis-service reverification    | Complete [issue #13](https://github.com/jerdaw/careconnect/issues/13) from the 42-record Crisis queue; call, check official web sources, and verify hours. | Evidence-backed facts are committed, validation passes, and the monthly cycle is closed. |
| P0-B  | General-service reverification   | Continue [issue #14](https://github.com/jerdaw/careconnect/issues/14) from the dated worksheet without changing `verified_at` before real verification.    | The current quarterly queue is evidence-backed and the freshness audit is regenerated.   |
| P0-C  | `G0-3 / C1` legal evidence       | Complete [issue #28](https://github.com/jerdaw/careconnect/issues/28): attach terms, review C1-1 through C1-4, and record the legal recommendation.        | C1 evidence is accepted and Gate 0 trackers are synchronized.                            |
| P0-D  | `G0-8 / D4` partner-ops evidence | Complete [issue #29](https://github.com/jerdaw/careconnect/issues/29): name partners and owners and attach dated outreach execution evidence.              | D4 evidence is accepted and Gate 0 trackers are synchronized.                            |
| P1    | Gate reassessment                | After C1 and D4 close, run `npm run check:v22-evidence` and `npm run check:v22-gate0`, then record an explicit `GO` or reaffirmed `NO-GO`.                 | The decision and its evidence are internally consistent and owner-approved.              |
| P2    | Pilot execution, only after `GO` | Resume v19/v21 in the order documented below and complete F1/F2 with real queue and authenticated-session evidence.                                        | Gate 1 produces measurable outcomes against the published success thresholds.            |

## Maintenance and Deferral Rules

### Allowed while Gate 0 is blocked

1. Fix concrete regressions in data safety, crisis behavior, accessibility, auth/admin reliability, or established validation lanes.
2. Keep the roadmap, evidence trackers, tests, and public/private documentation boundary aligned with verified state changes.
3. Continue Brampton candidates only after a specific record is approved for the governed L1 workflow.
4. Record provider restore, deployment, monitoring, and credential-dependent evidence only in the private/shared operations source of truth.

### Deferred until a prerequisite changes

- Broad UI polish, advanced French enrichment, the admin data-quality dashboard, and breaking dependency upgrades.
- Remaining DB migration-history cleanup until its schema/history approach is explicitly approved.
- Authenticated dashboard/admin visual QA until a valid local Supabase environment and signed-in sessions are available.
- Optional production smoke/reindex automation until an approved private-operations path exists.
- Deferred Brampton candidates and future L2/L3 upgrades until individually approved and verified.

### Explicit stop rules

1. Do not expand directory breadth to compete with 211.
2. Do not start new pilot-facing features or restart v19 while Gate 0 remains `NO-GO`.
3. Do not treat prep-only packets, automated URL checks, or generated audits as service, legal, or partner verification.
4. Do not update service facts or `provenance.verified_at` without real verification evidence.
5. Do not pull forward public packaging or external-validation work before real pilot evidence exists.

## Cross-Repo Docs Platform Policy

As of 2026-04-15, CareConnect follows the shared documentation-platform policy used across the affected MkDocs repos:

1. Keep this repo on MkDocs 1.x plus Material in the short term, and treat that stack as supported legacy rather than the strategic default for new standalone docs sites.
2. The intended MkDocs replacement is Zensical, but only after it clears the shared readiness gates: real strict-mode enforcement, a supported publish/deploy path, and parity for each repo's required plugins.
3. The migration order is wave-based: `qquotes` first, then `visitbrief`, then `waittimecanada`, then plugin-heavier repos like CareConnect.
4. CareConnect is a later-wave candidate because it depends on `social`, `git-revision-date-localized`, and `swagger-ui-tag`, so it should not be the proving ground.
5. If Zensical stalls or fails to deliver the required compatibility in a reasonable window, use Sphinx + MyST as the mature fallback for any future standalone docs rebuild instead of starting fresh on MkDocs.

## Completed Bounded Launch Track

### Brampton Constrained Multi-City Launch Closeout ✅ PRODUCTION COMPLETE

**Status:** The multi-city foundation, approved data, production rollout, accessibility and visual QA, broad-coverage correction, and bounded recovery/monitoring evidence are complete.

| Outcome                 | Final state                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Supported-place launch  | Eight Brampton records are live with explicit coverage and regenerated embeddings; six are L2 and two remain L1.                  |
| Search and API behavior | Place-aware local/server search, exports, OpenAPI contracts, DB mapping, and Kingston/Brampton regressions are covered.           |
| Verification boundary   | Deferred candidates remain draft-only. Any future candidate or L2/L3 change must pass the governed record-level workflow.         |
| Public wording boundary | Partnership, endorsement, official, and future land/source-context wording remains human-approved.                                |
| Operations boundary     | Exact migration, deployment, restore, monitoring, and rollback evidence remains in the private/shared operations source of truth. |

No Brampton implementation is active by default. Repository follow-through is limited to keeping docs/tests aligned with verified changes or processing a specifically approved record.

References: [readiness](../launch/brampton-readiness-report.md), [rollout](../launch/brampton-rollout-checklist.md), [manual QA](../launch/brampton-manual-qa.md), and [verification workplan](../launch/brampton-l2-l3-verification-workplan.md).

## Active Strategic Work

### v22.0: Non-Duplicate Value Decision Plan 🔄 ACTIVE

**Status**: Phase 0 in progress - **Gate 0 Exit NO-GO**
**Priority**: Critical
**Timeline**: target 90-day decision review cycle (~13 weeks), contingent on external Gate 0 dependency closure
**Created**: 2026-02-27

CareConnect is being repositioned from possible directory duplication toward measurable last-mile outcome value. This path uses explicit hypotheses, strict kill criteria, and governance gates before any broader pilot execution.

The 90-day window is a review target rather than a guaranteed engineering schedule. It is only realistic if legal/API review and partner-operations evidence arrive early enough to support a real decision inside that window.

**Core objective**

1. Prove non-duplicate value vs 211 on measurable connection outcomes.
2. Validate privacy-safe integration feasibility with 211 pathways.
3. Keep explicit stop conditions if outcome value is not demonstrated.

**Current technical position**

1. Pilot DB schema, RLS policies, internal pilot APIs, and pilot tests are implemented.
2. Step 1 approval locks are complete.
3. Gate 0 evidence scaffolding is in repo.
4. C2 retention policy approval, privacy sign-off, and dated verification evidence are complete.
5. C1/D4 evidence-intake validation now protects against accidentally treating `prep_only` packets as closure evidence, including dated submission IDs, canonical artifact templates, C1/D4 traceability inventories, and D4 outreach-log source-artifact checks.
6. Gate 0 remains `NO-GO` because C1 legal evidence and D4 partner-ops evidence are still incomplete.
7. The 2026-07-02 limited public-directory disposition permits only constrained directory operation and is not legal approval.

**Immediate blockers**

1. `G0-3 / C1`: candidate partner legal/API terms are not yet attached for clause-level review.
2. `G0-8 / D4`: named pilot partner list, outreach ownership, and dated execution evidence are missing.
3. Baseline execution is recorded, but current M1/M3 values are `NULL` because the baseline window had zero events.

**Required user-owned actions**

1. `UA-1`: attach candidate partner legal/API terms and complete clause-level C1 review.
2. `UA-3`: attach named pilot partner list, outreach owner assignment, and dated outreach execution evidence.

**Agent follow-through once evidence exists**

1. Update the Gate 0 trackers and source control docs.
2. Sync the integration decision record, approval checklist references, and evidence matrix.
3. Re-evaluate Gate 0 and re-run `npm run check:v22-evidence` plus `npm run check:v22-gate0`.
4. Keep pilot APIs, schemas, tests, and docs aligned with any approved control changes.

**Gate 1 success thresholds**

- Failed contact attempts reduced by at least 30% vs baseline
- Time-to-successful-connection reduced by at least 25%
- Freshness SLA compliance at least 70%
- Referral outcome capture at least 50%
- Fatal data-decay error rate at or below 10%

**Canonical references**

- [v22.0 Non-Duplicate Value Decision Plan](v22-0-non-duplicate-value-decision-plan.md)
- [v22.0 Approval Checklist](v22-0-approval-checklist.md)
- [v22.0 Phase 0 Implementation Plan](../implementation/v22-0-phase-0-implementation-plan.md)
- [v22.0 Gate 0 User Action Tracker](../implementation/v22-0-gate-0-user-action-tracker.md)
- [v22.0 Gate 0 Evidence Intake Pack](../implementation/v22-0-gate-0-evidence-intake-pack.md)
- [v22.0 Gate 0 Exit Checklist](../implementation/v22-0-gate-0-exit-checklist.md)
- [v22.0 Limited Public Directory Pilot Risk Disposition (2026-07-02)](../implementation/v22-0-limited-public-directory-pilot-risk-disposition-2026-07-02.md)
- [v22.0 Autonomous Gate 0 Maintenance Pass Archive (2026-06-13)](../implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md)
- [v22.0 Worktree Checkpoint (2026-06-13)](../implementation/v22-0-worktree-checkpoint-2026-06-13.md)

## On Hold

### v19.0: Launch Preparation ⏸️ ON HOLD

**Status**: Automation and documentation complete; human execution deferred pending v22 Gate 0
**Priority**: High, but subordinate to v22

The launch-prep stream is intentionally paused. The repo-local automation is already built, but the remaining work is manual QA, beta execution, and launch operations. Resume only after v22 permits it.

**When resumed**

1. Run the production environment audit.
2. Execute critical user-journey testing.
3. Complete the top-20 service review.
4. Resume beta operations and launch monitoring.

**References**

- [v19.0 Launch Preparation Plan](v19-0-launch-preparation.md)
- [v19.0 User Execution Guide](v19-0-user-execution-guide.md)
- [v19.0 Phase 1 Execution Handoff (2026-03-09)](../implementation/archive/v19-phase-1-execution-handoff-2026-03-09.md)

### v21.0: External Validation ⏸️ PARKED

**Status**: Parked until after v22 Gate 0 / Gate 1 evidence.

This backlog is sorted by public-interest validation value under the current v22 constraints. The sequencing rule is:

1. Close v22 blockers first.
2. Then create real pilot evidence.
3. Then publish external-validation artifacts grounded in that evidence.

**Allowed now only if they directly support v22**

1. Close Gate 0 partner/legal evidence (`UA-1`, `UA-3`).
2. Run bounded verification and pilot-scope data-quality work when it improves pilot readiness.
3. Preserve the completed Tier 0 hardening bundle as baseline capability, not as a reason to pull forward packaging work.

**First work after Gate 0 exit**

1. Run a small real-world pilot in one actual referral workflow.
2. Formalize the 211 boundary/handoff, run crisis-safety validation, add a quick-exit path for violence-sensitive browsing, and conduct professional usability sessions.
3. Build partner/referrer collateral, expose logistics needed for referrals, add shortlist/multi-print referrer workflows where pilot users need them, begin L3 outreach, and recruit the first advisory reviewers.

**First proof artifacts after live pilot activity starts**

1. Publish a baseline-to-pilot scorecard and decision memo.
2. Secure factual support letters and first L3 confirmations.
3. Publish transparency and status surfaces, plus drill/accessibility/equity evidence.

**Later packaging work**

1. External privacy/AI review.
2. Leadership/collaboration visibility updates.
3. Presentations, poster/case-study, and other dissemination artifacts.

This work remains strategically useful, but it depends on real operational evidence. Keep it parked until the v22 pilot produces something defensible to publish.

Reference:

- [v21.0 External Validation Plan](v21-external-validation-plan.md)

### v20.0: Testing and Technical Excellence ⏸️ MAINTENANCE MODE

**Status**: Most autonomous backlog work is complete; only bounded maintenance remains active

Useful maintenance items:

1. Keep the default E2E suite healthy.
2. Keep the dedicated DB integration lane healthy and deterministic.
3. Publish a fresh coverage snapshot.
4. Fix repo-local regressions surfaced by routine validation.
5. Reduce persistent monthly URL-health inconclusives only when they repeat across live runs and a stable official provider probe exists.

Deferred items:

1. Advanced French service-data enrichment
2. Admin-facing data quality dashboard

References:

- [2026-02-12 v20.0 Phase 1 Implementation Plan](archive/2026-02-12-v20-0-phase-1-implementation-plan.md)
- [2026-03-12 v20.0 Autonomous Backlog Closeout](archive/2026-03-12-v20-0-autonomous-backlog-closeout.md)
- [2026-03-24 v20.0 DB Integration Test Lane](archive/2026-03-24-v20-0-db-integration-test-lane.md)
- [2026-03-24 v20.0 Supabase Migration Recovery](archive/2026-03-24-v20-0-supabase-migration-recovery-plan.md)

## Completed Work

### Recent Completed Milestones

- **Autonomous closeout and evidence refresh (2026-07-13)**: merged the focused roadmap-truth, scoring-contract, admin circuit-breaker, authorization-doc, notification-JSON, Next.js patch, deterministic search-report, disposable-DB replay, and offline-recovery batches; completed F3/F5 repository evidence; refreshed the 204-record freshness queue; and left only human/external evidence work active.
- **Brampton multi-city foundation and first launch (2026-07-07)**: implemented place-aware coverage/search foundations, promoted the approved initial seven-record L1 launch set and later approved eighth record, regenerated embeddings, verified Kingston/Brampton regression behavior, completed the bounded production rollout, and kept deferred candidates draft-only.
- **Brampton launch QA and positioning evidence (2026-07-07)**: unblocked local Chromium a11y and DB smoke runs with user-space dependencies, documented passing QA plus a11y/browser-console follow-ups, completed draft-only land acknowledgment source research, and preserved production migration/deploy/partner wording as explicit approval gates.
- **Closeout triage checkpoint (2026-07-01)**: recorded the current finish-now/defer/human-owned matrix after auth/admin regression hardening and CI validation; no additional repo-side implementation is recommended before Gate 0 evidence unless a concrete regression appears.
- **Auth/admin regression guardrails (2026-07-01)**: added focused auth callback/login/admin regression coverage and a non-production browser smoke spec after the production auth/admin troubleshooting pass.
- **Close-out prep and French access-script merge (2026-06-28)**: completed the reviewed `access_script_fr` batch merge for all 196 service records, refreshed the access-script audit to `0` missing French access scripts, added the service verification workplan for all 196 due services, and closed the French translation review issue while leaving manual verification and Gate 0 evidence blockers tracked separately.
- **v22 Gate 0 autonomous maintenance checkpoint (2026-06-13)**: completed the bounded repo-local maintenance pass for C1/D4 evidence guards, D4 artifact-inventory validation, offline privacy/recovery hardening, pilot event contracts, OpenAPI coverage, readiness input validation, and roadmap stop-rule cleanup while leaving Gate 0 blocked on external evidence; archived in [2026-06-13 v22.0 Autonomous Gate 0 Maintenance](../implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md).
- **Public GitHub cleanup (2026-06-05)**: established the public documentation boundary in ADR-022, sanitized public deployment/operations/planning/legal docs, replaced the real platform contract with fake-only example content plus a legacy-path tombstone, migrated durable private originals to the private/shared operations source of truth while preserving ignored local copies, updated boundary tests/scripts, and archived the completed pass in [2026-06-04 Public GitHub Cleanup](archive/2026-06-04-public-github-cleanup.md).
- **Public and operational surface polish (2026-05-01)**: completed the bounded reference sources, suggest-service intake, route-reference cleanup, public workflow, static legal/help/trust, settings, and authenticated dashboard/admin polish wave without changing service-data, search, auth, or schema contracts; archived in [2026-05-01 v20.0 Public and Operational Surface Polish](archive/2026-05-01-v20-0-public-and-operational-surface-polish.md).
- **About page polish (2026-04-30)**: rebuilt `/about` as a calmer trust and context page, removed duplicated homepage-style sections, restored the page-level background wash, aligned hero/source/context/CTA sections on a shared rail, and refined the primary CTA treatment without changing service data or search behavior; archived in [2026-04-30 v20.0 About Page Polish](archive/2026-04-30-v20-0-about-page-polish.md).
- **Homepage search UX polish (2026-04-29)**: moved filters into the active search/results state, compacted category controls with an accessible "more categories" expansion, restored and refined the service/category/language metrics rail, folded trust-strip content into a clearer `How It Works` flow, tuned desktop/mobile section spacing and footer layout, and refreshed related copy/i18n/test coverage; archived in [2026-04-29 v20.0 Homepage Search UX Polish](archive/2026-04-29-v20-0-homepage-search-ux-polish.md).
- **Gate 0 prep and deploy-contract alignment (2026-04-28)**: added prep-only C1/D4 evidence packets, synchronized Gate 0 tracker wording without closing evidence blockers, and archived the pass in [2026-04-28 v22.0 Gate 0 Prep and Deploy Contract Alignment](archive/2026-04-28-v22-0-gate-0-prep-and-deploy-contract-alignment.md).
- **Repo audit truth remediation (2026-04-24)**: corrected the public feedback-retention claim to the evidenced implementation, normalized the remaining tool-provenance example in active docs, and archived the completed follow-through in [2026-04-24 v20.0 Repo Audit Truth Remediation](archive/2026-04-24-v20-0-repo-audit-truth-remediation.md).
- **Quiet GitHub automation and URL health hardening (2026-04-23)**: converted routine GitHub governance workflows to quiet-by-default sticky issue/comment behavior, reconciled duplicate reminder issues, added reusable bot-issue synchronization for scheduled workflows, hardened the monthly URL health lane with official override probes plus Actions summaries, and verified clean auto-close/no-reopen behavior for the broken-URL issue lane; archived in [2026-04-23 v20.0 Quiet GitHub Automation and URL Health Hardening](archive/2026-04-23-v20-0-quiet-github-automation-and-url-health-hardening.md).
- **Semantic search fail-closed and lint hygiene (2026-04-15)**: removed synthetic semantic-search fallback vectors, made worker/embed failures degrade to keyword-only search, restored authoritative repo-wide linting by excluding local MkDocs output, synced architecture docs, and added focused hook/documentation hygiene coverage; archived in [2026-04-15 v20.0 Semantic Search Fail-Closed and Lint Hygiene](archive/2026-04-15-v20-0-semantic-search-fail-closed-and-lint-hygiene.md).
- **Gate 0 wait maintenance bundle (2026-04-05)**: completed search explainability, stale-data runtime governance, workflow-runtime doc alignment, and solo-scale freshness-policy calibration while Gate 0 remained blocked; archived in [2026-04-05 v22.0 Gate 0 Wait Maintenance Bundle](archive/2026-04-05-v22-0-gate-0-wait-maintenance-bundle.md).
- **Map privacy and offline snapshot safety surfaces (2026-04-04)**: replaced automatic Google Maps embeds with explicit opt-in previews, surfaced offline snapshot age/stale warnings on offline surfaces, updated threat-model/user-guide/architecture docs, and added focused UI/helper coverage; archived in [2026-04-04 v22.0 Map Privacy and Offline Snapshot Safety](archive/2026-04-04-v22-0-map-privacy-and-offline-snapshot-safety.md).
- **Tier 0 external-validation support hardening (2026-04-01)**: completed pilot metric instrumentation, public-claim hardening, focused pilot/privacy test coverage, and bounded readiness-audit tooling; archived in [2026-04-01 v22.0 Pilot Metric Instrumentation and Tier 0 Hardening](archive/2026-04-01-v22-0-pilot-metric-instrumentation-and-tier-0-hardening.md).
- **CareConnect repo finalization (2026-04-03)**: completed the GitHub repo rename to `jerdaw/careconnect` and related public documentation cleanup; archived in [CareConnect Rebrand Archive](archive/2026-03-18-careconnect-rebrand.md).
- **C2 retention control closure (2026-03-29)**: approved retention policy, captured privacy sign-off, attached dated read-only verification evidence, and moved `G0-4` to `pass`.
- **Workflow/runtime cleanup and 211 sync quarantine (2026-04-01)**: upgraded the remaining Node-runtime-sensitive GitHub Actions, replaced archived release creation with `gh`, removed placeholder 211 sync records, and restricted the 211 sync path to explicit manual execution only.
- **Audit remediation hardening (2026-03-30)**: enforced org-scoped service creation, removed fabricated provenance, fixed Slack/runbook links and dashboard CSV parsing, added focused runtime coverage, repaired noisy scheduled workflows, and reduced the localized home-route first-load JS to `315 kB`.
- **Repo audit remediation (2026-03-29)**: completed the typed service-write cleanup, feedback/dashboard action consolidation, member-management split, privacy-safe analytics hardening, reference validation, and dependency/script hygiene follow-through.
- **Dashboard trust, resilience, and locale hardening (2026-03-30)**: replaced placeholder partner metrics with live 30-day summaries, added deterministic degraded states for impact/analytics/feedback pages, localized observability/admin surfaces, and tightened focused i18n duplicate-English enforcement.
- **Code quality remediation (2026-03-26)**: 0 npm audit vulnerabilities, console→logger migration, component reorganization, schemas rename, ESLint strictness for lib/, file cleanup.
- **Premium Dark Mode (2026-03-25)**: Redesigned dark theme with high-contrast Slate-950 base, pure white text, and structured elevation.
- **v20.0 migration recovery (2026-03-18)**: 41-file migration chain collapsed into a single reproducible baseline + 3 forward migrations, test infrastructure unified on migration-linked bootstrap.
- **v20.0 maintenance (2026-03-18)**: real DB-backed Supabase retrieval/policy test lane added with blocking CI coverage
- **v18.0**: Production observability, Slack alerting, SLO tracking, observability dashboard, and runbooks
- **v17.7**: Search quality testing framework and scoring refinements
- **v17.6**: Authorization resilience, translation workflow automation, and load-testing baseline
- **v17.5**: Circuit breaker rollout, performance tracking, health/metrics endpoints, and k6 infrastructure
- **v17.0-v17.4**: Security, test coverage, internationalization, accessibility, and partner portal foundations

### Why This Matters

The project already has the technical base for a live, privacy-first, resilient service directory. The open question is no longer whether the app can ship technically. The open question is whether it creates enough non-duplicate operational value to justify continued expansion.

### Archive and Historical Plans

- [Planning Archive](archive/)
- [v22.0 Autonomous Gate 0 Maintenance Archive](../implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md)
- [Public GitHub Cleanup Archive](archive/2026-06-04-public-github-cleanup.md)
- [v20.0 Public and Operational Surface Polish Archive](archive/2026-05-01-v20-0-public-and-operational-surface-polish.md)
- [v20.0 About Page Polish Archive](archive/2026-04-30-v20-0-about-page-polish.md)
- [v20.0 Quiet GitHub Automation and URL Health Hardening Archive](archive/2026-04-23-v20-0-quiet-github-automation-and-url-health-hardening.md)
- [v22.0 Gate 0 Wait Maintenance Bundle Archive](archive/2026-04-05-v22-0-gate-0-wait-maintenance-bundle.md)
- [v22.0 Map Privacy and Offline Snapshot Safety Archive](archive/2026-04-04-v22-0-map-privacy-and-offline-snapshot-safety.md)
- [v22.0 Pilot Metric Instrumentation and Tier 0 Hardening Archive](archive/2026-04-01-v22-0-pilot-metric-instrumentation-and-tier-0-hardening.md)
- [v20.0 Runtime Hardening and Performance Remediation Archive](archive/2026-03-30-v20-0-runtime-hardening-and-performance-remediation.md)
- [v20.0 Workflow Runtime Cleanup and 211 Sync Quarantine Archive](archive/2026-04-01-v20-0-workflow-runtime-cleanup-and-211-sync-quarantine.md)
- [v20.0 Repo Audit Remediation Archive](archive/2026-03-29-v20-0-repo-audit-remediation.md)
- [Code Quality Remediation Archive](archive/2026-03-26-v22-0-code-quality-remediation.md)
- [CareConnect Rebrand Archive](archive/2026-03-18-careconnect-rebrand.md)
- [v20.0 DB Integration Test Lane Archive](archive/2026-03-24-v20-0-db-integration-test-lane.md)
- [v17.6 Archive](archive/2026-01-25-v17-6-post-v17-5-enhancements.md)
- [v17.5 Archive](archive/2026-01-25-v17-5-performance-and-resilience.md)
- [v17.4 Archive](archive/2026-01-25-v17-4-dashboard-partner-portal.md)
- [v17.3 Archive](archive/2026-01-20-v17-3-accessibility.md)
- [v17.2 Archive](archive/2026-01-20-v17-2-internationalization.md)
- [v17.1 Archive](archive/2026-01-19-v17-1-test-coverage.md)
- [v17.0 Archive](archive/2026-01-17-v17-0-security-authorization.md)

## Review Triggers

Update this roadmap when any of the following happen:

1. `UA-1`, `UA-2`, or `UA-3` changes status.
2. Gate 0 moves from `NO-GO` to `GO`, or is re-affirmed as `NO-GO`.
3. v19 resumes or is explicitly deferred further.
4. A major data-quality, testing, or deployment baseline changes.
5. v21 tier sequencing changes or a new external-validation evidence artifact materially changes what is worth prioritizing.
6. A new strategic version becomes active.

## Operating Rule

If there is tension between adding more capability and closing the current decision gate, close the decision gate first.
