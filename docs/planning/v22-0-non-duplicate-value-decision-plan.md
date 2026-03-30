---
status: draft
last_updated: 2026-03-29
owner: jer
tags: [roadmap, v22.0, strategy, decision-framework, pilot]
phase_0_status: in_progress
gate_0_status: evidence_collection_in_progress
approval_checklist_status: locked
---

# v22.0: Non-Duplicate Value Decision Plan (HelpBridge + 211 Complement Strategy)

## Summary

This document converts three inputs into one objective path forward:

1. The original strategic plan (ambitious differentiation through reliability/referrals/navigation).
2. Devil's-advocate critique (how each element can fail or become duplicate/low value).
3. Steelman critique (best-case strategic value for each element).

The output is a **decision system**, not a belief system:

1. Pre-register hypotheses.
2. Pre-register falsifiers.
3. Score options with a weighted model.
4. Execute in stage gates.
5. Keep only initiatives that hit outcome thresholds.

This is designed to prevent HelpBridge from becoming:

1. a subset of 211,
2. a duplicate of 211,
3. or an inferior alternative to 211.

## User Review Required

> [!IMPORTANT]
> This plan is decision-complete, but Phase 1 pilot operations must not start until these approvals are explicit.

Execution references:

1. [v22.0 Approval Checklist](v22-0-approval-checklist.md)
2. [v22.0 Phase 0 Implementation Plan](../implementation/v22-0-phase-0-implementation-plan.md)

Required approvals:

1. Confirm v22.0 objective function (connection outcomes over directory breadth).
2. Confirm hard constraints (no breadth race with 211, no query-text logging, no claim overstatement).
3. Confirm pilot domain (default: housing intake).
4. Confirm pilot partner target range (5-10 providers, 2-3 frontline orgs).
5. Confirm stage-gate thresholds and kill rules as written.
6. Confirm API integration redlines (no user query-text sharing; no forced user-identifying telemetry).
7. Confirm integration-blocked contingency path (narrow scope or responsible deprecation criteria).

If any item changes, update this document before Gate 0 sign-off.

## Phase 0 Progress Snapshot (2026-03-09)

Completed technical foundation:

1. Pilot schema migration applied (`20260308120000_v22_pilot_phase0_tables`).
2. Admin hardening migration applied (`20260308121000_v22_harden_bulk_update_service_status_admin_check`).
3. Pilot storage verification scripts added (preflight + post-migration + rollback helper).
4. Internal pilot APIs implemented and documented (`/pilot/events/*`, `/pilot/metrics/scorecard`, `/pilot/integration-feasibility`).
5. Pilot API/schema/metrics tests implemented and passing.
6. Step 1 approvals D1-D7 locked in approval checklist.
7. Integration feasibility decision recorded as `conditional` with controls C1-C3.
8. Offline/local threat model updated with mitigation owners/dates and no unresolved critical findings.
9. Gate 0 minimum-mode baseline report artifact created.
10. Gate 0 minimum-mode baseline M1/M3 execution completed with read-only linked-project queries.

Still required before Gate 0 exit:

1. Complete the remaining conditional integration control C1 before any external integration activation.

## Gate 0 Exit Readiness (Current)

- Current readiness: **NO-GO** (as of 2026-03-29)

Blocking items:

1. C1 legal closure is pending candidate partner terms for clause-level review.
2. Partner-operation evidence for D4 (named partner list + outreach owner execution) is pending.
3. Baseline report is complete, but M1/M3 are `NULL` in the current window due to zero observed events.

Canonical gate decision control:

1. [v22.0 Gate 0 Exit Checklist (Decision Control)](../implementation/v22-0-gate-0-exit-checklist.md)

## Decision Log Authority

This document defines strategic intent and thresholds. Decision records and sign-off state are tracked in:

1. [v22.0 Approval Checklist](v22-0-approval-checklist.md)

## Evidence-Quality Protocol (Critical)

This plan now incorporates prior internal research and two external AI-agent research memos.

Rules for using those memos:

1. External-agent outputs are **hypothesis inputs**, not facts, because those agents did not inspect the HelpBridge codebase.
2. Any externally sourced claim affecting architecture, governance, or go/no-go decisions must be re-validated using:
   - primary source citation, and
   - local repo evidence where relevant.
3. Claims with weak/indirect sources must be tagged `investigate` and cannot gate critical decisions.
4. Numeric scoring from external-agent reports is non-binding and advisory only.

## Problem Statement

Current strategic risk:

1. HelpBridge can drift into "directory competition" with 211, where 211 has structural breadth and channel advantages.
2. HelpBridge can make claims that are stronger than current evidence (verification freshness, accessibility absolutes, comparative language coverage framing).
3. HelpBridge can spend engineering effort on features that improve UI but do not improve real-world service connection outcomes.

Desired strategic position:

1. HelpBridge complements 211.
2. HelpBridge owns local "last-mile access performance" in Kingston.
3. HelpBridge proves value with measurable outcome improvements.

## Inputs (Source Synthesis)

### Input A: Original Plan (Opportunity Thesis)

Strongest opportunities identified:

1. Service Reliability Layer
2. Warm Referral Layer
3. Access Navigation Layer
4. Hard scope discipline (stop breadth-first duplication)

### Input B: Devil's Advocate (Failure Modes)

Primary risks:

1. Rebranding without outcome gains.
2. Operational complexity outpacing team capacity.
3. Stale operational data causing trust erosion.
4. Low partner adoption for referral workflows.
5. Attribution bias in pilot outcomes.

### Input C: Steelman (Strategic Upside)

Primary upside:

1. Differentiation via connection success (not listing count).
2. Durable value if HelpBridge becomes frontline workflow infrastructure.
3. High leverage if failed-contact and time-to-connection metrics improve materially.

## Objective Function and Constraints

## Primary Objective

Improve successful service connection outcomes for Kingston residents and frontline workers.

## Secondary Objectives

1. Preserve privacy-first architecture.
2. Reduce access friction for high-need scenarios.
3. Increase provider and frontline trust in data actionability.

## Hard Constraints

1. Do not build a breadth race with 211.
2. Do not degrade privacy guarantees (no raw query logging).
3. Do not introduce unverifiable comparative claims.
4. Do not scale initiatives that fail stage-gate metrics.
5. Do not accept third-party integration terms that require raw user query sharing.
6. Do not represent external-agent claims as confirmed evidence without re-validation.

## Non-Goals (v22.0)

1. Provincial expansion as a core objective.
2. Becoming a primary general-purpose directory for all service categories.
3. Large-scale data ingestion volume growth as a success metric.

## Decision Framework (Objectivity Protocol)

Every initiative must have:

1. **Hypothesis** (steelman claim)
2. **Falsifier** (devil's-advocate failure condition)
3. **Metric** (quantitative test)
4. **Kill threshold** (explicit stop condition)
5. **Evidence horizon** (by when signal must appear)

No initiative proceeds to scale without passing all five fields.

## Initiative Hypothesis Register

| ID  | Initiative                  | Hypothesis (Steelman)                                                               | Falsifier (Devil)                                                      | Primary Metric                                                   | Kill Threshold                                                              | Evidence Horizon |
| --- | --------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------- |
| H1  | Service Reliability Layer   | Operational status signals materially reduce dead-end attempts.                     | Data becomes stale/noisy and harms trust.                              | Failed contact rate                                              | <10% relative improvement after pilot cycle 1                               | 8 weeks          |
| H2  | Warm Referral Layer         | Referral tokens/workflows increase completed connections.                           | Partner workflow adoption stays too low.                               | Referral completion capture rate                                 | <30% partner usage by end of pilot cycle 1                                  | 8 weeks          |
| H3  | Access Navigation Layer     | Barrier-aware scripts reduce abandonment.                                           | Scripts become stale/unused and create maintenance burden.             | Search-to-contact conversion and repeat-failure rate             | No statistically meaningful conversion lift and no repeat-failure reduction | 10 weeks         |
| H4  | Scope Discipline            | Narrowing scope to last-mile outcomes increases strategic fit.                      | Product becomes too thin and loses user utility.                       | Monthly active frontline sessions + connection outcomes          | Active usage declines >20% with no outcome gains                            | 12 weeks         |
| H5  | Privacy Positioning         | Precise privacy claims strengthen trust without harming analytics utility.          | Copy changes reduce stakeholder confidence or insight quality.         | Trust survey + ability to monitor outcomes without query logging | Trust does not improve and governance team cannot monitor outcomes          | 6 weeks          |
| H6  | 211 Integration Feasibility | HelpBridge can consume 211 baseline data while preserving privacy redlines.         | Integration requires prohibited telemetry or is operationally blocked. | Signed technical/legal feasibility decision                      | No viable telemetry-safe path by end of Phase 0                             | 2 weeks          |
| H7  | Local Data Security         | Offline/local storage can remain privacy-protective under device-loss threat model. | Local storage design introduces material confidentiality risk.         | Security review findings (critical/high)                         | Any unresolved critical finding at pilot launch                             | 4 weeks          |
| H8  | User Preference Fit         | Target cohorts value private/offline self-serve for selected use cases.             | High-need users overwhelmingly require human-assisted channel first.   | Frontline-assisted preference and outcome study                  | No demonstrated fit for priority cohorts in pilot domain                    | 8 weeks          |

## Weighted Scoring Model

Each initiative is scored before build and at each stage gate.

## Criteria and Weights

1. Non-duplicate value vs 211: **35%**
2. Outcome impact potential (connection success): **25%**
3. Feasibility with current team/capacity: **20%**
4. Evidence speed (time to clear signal): **10%**
5. Risk/governance burden (inverse): **10%**

## Scoring Formula

`Weighted Score = sum(criterion_score_1_to_5 * weight)`

## Thresholds

1. `>= 4.0`: Green (build or scale)
2. `3.2 - 3.9`: Yellow (pilot only, tighten scope)
3. `< 3.2`: Red (defer or kill)

## Tie-breaker Rule

When two initiatives tie, pick the one with:

1. higher non-duplicate score,
2. lower operational burden,
3. faster evidence horizon.

## Stage-Gated Execution Plan

## Phase 0: Baseline + Instrumentation (2 weeks)

Goal:

1. Establish credible pre-intervention baseline.
2. Build measurement plumbing before product expansion.

Deliverables:

1. Baseline definitions for failed contact rate, time to connection, referral completion.
2. Event schema and dashboards for pilot metrics.
3. Partner onboarding packet and data-sharing boundaries.
4. Pre-registered analysis plan (what counts as success/failure).
5. 211 API/legal feasibility assessment with explicit privacy redline review.
6. Offline/local-storage threat model and mitigation checklist.
7. Evidence re-validation log for all external-agent-derived claims used in planning.

Gate 0 Exit Criteria:

1. All primary metrics have baseline values.
2. Privacy review approved.
3. Pilot participants confirmed.
4. Measurement queries validated end-to-end.
5. Integration feasibility decision recorded (`go`, `conditional`, or `blocked`).
6. No unresolved critical security findings in offline/local-storage design.

## Phase 1: Focused Pilot Build (6-8 weeks)

Scope:

1. Domain: housing intake (default pilot domain).
2. Pillars in scope: Service Reliability + Warm Referral.
3. Access Navigation in constrained mode (only for pilot services).

Deliverables:

1. Provider status update workflow.
2. Frontline referral token workflow.
3. Outcome capture states and barrier reasons.
4. Weekly pilot scorecard with trend analysis.

Gate 1 Exit Criteria (must pass all):

1. Failed contact attempts reduced by at least **30%** vs baseline.
2. Time-to-successful-connection reduced by at least **25%**.
3. Reliability freshness SLA compliance at least **70%**.
4. Referral outcome capture at least **50%** of pilot referrals.
5. Data-decay audit fatal error rate at or below **10%** (see M6).

Gate 1 Decisions:

1. Pass all: proceed to Phase 2 scale.
2. Miss 1 metric: iterate one more cycle with narrowed scope.
3. Miss 2+ metrics: kill weakest initiative and re-run with one pillar.

## Phase 2: Conditional Expansion (8-12 weeks)

Scope:

1. Expand only successful initiative(s) to second domain.
2. Keep strict stop conditions.
3. Add Access Navigation only if reliability and referral foundations are stable.

Gate 2 Exit Criteria:

1. Outcome gains persist in second domain.
2. Operational burden remains within team capacity.
3. No material privacy/governance regressions.

Gate 2 Decisions:

1. Scale to broader Kingston coverage.
2. Keep as focused infrastructure for specific domains.
3. Sunset non-performing modules.

## Pilot Design (Bias-Controlled)

## Population

1. 5-10 high-volume Kingston providers in selected domain.
2. 2-3 frontline organizations (caseworkers, navigators, outreach staff).

## Cohort Structure

1. Pilot cohort: services/orgs using new workflows.
2. Comparison cohort: similar services/orgs not yet using new workflows.

## Measurement Window

1. Baseline window: 4 weeks pre-pilot.
2. Pilot window: 8 weeks.
3. Optional extension window: 4 weeks for remediation cycle.

## Bias Controls

1. Pre-register metric formulas before pilot start.
2. Avoid changing success thresholds mid-cycle.
3. Control for seasonality where possible (same service categories).
4. Document external shocks (policy/funding/weather/service closures).
5. Separate adoption failure from product efficacy failure.

## Metrics Catalog (Precise Definitions)

## M1: Failed Contact Rate

Definition:

`failed_contact_rate = failed_contact_events / total_contact_attempts`

Failed contact events include:

1. disconnected phone,
2. no response after defined SLA window,
3. intake not available when marked available,
4. referral rejected due to invalid routing.

## M2: Time to Successful Connection

Definition:

`time_to_connection = timestamp(successful_connection) - timestamp(initial_search_or_referral)`

Reported as:

1. median,
2. p75,
3. p90.

## M3: Referral Completion Capture Rate

Definition:

`completion_capture_rate = referrals_with_terminal_state / total_referrals`

Terminal states:

1. connected,
2. failed,
3. client_withdrew,
4. no_response_timeout.

## M4: Freshness SLA Compliance

Definition:

`freshness_compliance = services_meeting_status_sla / pilot_services_total`

SLA tiers:

1. crisis: 24h,
2. high-demand non-crisis: 48h,
3. others in pilot: 7 days.

## M5: Repeat Failure Rate

Definition:

`repeat_failure_rate = users_or_referrals_with_2plus_failures / total_users_or_referrals`

Purpose:

1. validates if guidance/fallbacks reduce repeated dead ends.

## M6: Data-Decay Fatal Error Rate

Definition:

`fatal_error_rate = records_with_access_blocking_errors / records_sampled`

Fatal errors include:

1. wrong/disconnected phone number,
2. invalid/defunct intake path,
3. materially incorrect eligibility that blocks access,
4. closed or unavailable service still presented as available.

Sampling protocol:

1. minimum 20-record monthly random sample in pilot scope,
2. dual verification (web source + call or provider confirmation),
3. classify and log error severity.

## M7: Preference-Fit Indicator

Definition:

`preference_fit = cohort_tasks_preferably_completed_via_helpbridge / cohort_total_tasks`

Purpose:

1. tests where privacy/offline self-serve is materially preferred,
2. prevents over-applying HelpBridge in scenarios needing immediate human navigation.

## Proposed Repo-Level Implementation Map

This section maps plan execution to likely code locations.

## A) Types and Schemas

Potential changes:

1. Extend [`types/service.ts`](/home/jer/localsync/helpbridge-ca/types/service.ts) with operational-status metadata.
2. Add referral and barrier event types in `types/` (new files):
   - `types/referral.ts`
   - `types/service-operational-status.ts`
3. Add Zod schemas in `lib/schemas/` for all new write endpoints:
   - `lib/schemas/referral.ts`
   - `lib/schemas/service-status.ts`

## B) API Routes

Add scoped endpoints under [`app/api/v1`](/home/jer/localsync/helpbridge-ca/app/api/v1):

1. `app/api/v1/referrals/route.ts` (create/list referral events)
2. `app/api/v1/referrals/[id]/route.ts` (update terminal states)
3. `app/api/v1/services/[id]/status/route.ts` (provider status updates)
4. `app/api/v1/pilot/metrics/route.ts` (pilot scorecard data)
5. `app/api/v1/integration/feasibility/route.ts` (optional internal endpoint for integration readiness status)

Requirements:

1. rate limits and auth checks where applicable,
2. no raw query text persistence,
3. `withCircuitBreaker` around Supabase calls,
4. explicit `Cache-Control` behavior for sensitive flows.
5. enforce integration redline checks in adapters (no raw query forwarding).

## C) Search and Ranking

Potential integration points:

1. [`lib/search/index.ts`](/home/jer/localsync/helpbridge-ca/lib/search/index.ts)
2. [`lib/search/scoring.ts`](/home/jer/localsync/helpbridge-ca/lib/search/scoring.ts)
3. [`lib/search/server-scoring.ts`](/home/jer/localsync/helpbridge-ca/lib/search/server-scoring.ts)

Planned behavior:

1. down-rank stale/unavailable services for non-crisis intents,
2. promote high-confidence available alternatives,
3. surface deterministic "Plan B" fallbacks.

## D) Frontend Workflows

Candidate locations:

1. `components/home/` (search UX integration),
2. `components/services/` (service detail reliability + access path UI),
3. `app/[locale]/dashboard/` (partner/frontline referral and status tooling).

## E) Analytics and Observability

Candidate locations:

1. [`lib/analytics.ts`](/home/jer/localsync/helpbridge-ca/lib/analytics.ts)
2. [`lib/analytics/search-analytics.ts`](/home/jer/localsync/helpbridge-ca/lib/analytics/search-analytics.ts)
3. [`app/api/v1/metrics/route.ts`](/home/jer/localsync/helpbridge-ca/app/api/v1/metrics/route.ts)

Actions:

1. add pilot-specific aggregated metrics events,
2. preserve no-query-text policy,
3. track metric quality (missing terminal states, stale statuses).

## F) Governance and Documentation

Docs to update when implementation starts:

1. `docs/governance/standards.md` (operational-status provenance rules)
2. `docs/architecture.md` (new data flow for referral/status)
3. `docs/api/openapi.yaml` (new referral/status endpoints)
4. `docs/runbooks/` (status stale / referral pipeline incident handling)
5. `docs/security/` (offline/local data threat model and controls)

## Operating Model and RACI (Pilot)

## Roles

1. Product owner: pilot scope, success criteria, gate decisions.
2. Engineering lead: implementation quality and operational stability.
3. Data/governance lead: provenance audits and freshness SLA tracking.
4. Partner success lead: provider onboarding and adoption support.

## Decision Cadence

1. Weekly metric review (operational).
2. Bi-weekly strategic review (scope and risk).
3. Gate decisions at end of each phase with recorded rationale.

## Risk Register (Top Risks + Mitigations)

| Risk                                     | Type               | Trigger                                                            | Mitigation                                                                          | Owner                    |
| ---------------------------------------- | ------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------ |
| Stale status data harms trust            | Product/Governance | SLA compliance <70%                                                | Auto-expire stale status, fallback messaging, provider reminders                    | Governance lead          |
| Low partner adoption                     | Execution          | <30% partner activity                                              | Simplify workflow, onboarding support, reduce required fields                       | Partner success          |
| Metrics are noisy/unattributable         | Decision quality   | Contradictory trend signals                                        | Keep control cohort, pre-register analysis, annotate confounders                    | Product + Data           |
| Privacy drift                            | Compliance         | New fields risk re-identification                                  | Privacy review before release, aggregate/minimize retained metadata                 | Eng lead                 |
| Team capacity overload                   | Delivery           | Missed sprint goals for 2 cycles                                   | Reduce to one pillar, defer secondary features                                      | Product owner            |
| API chokepoint                           | Strategic          | 211 integration requires prohibited telemetry or restrictive terms | Enforce redlines; use conditional integration mode; predefine blocked-path fallback | Product owner + Eng lead |
| False-confidence from secondary research | Decision quality   | Non-validated external-agent claims drive design                   | Evidence re-validation log; primary-source-only for gate decisions                  | Data/governance lead     |

## Go/No-Go Decision Trees

## Gate 0 (After Baseline + Instrumentation)

1. If metrics are not baseline-ready: do not start pilot build.
2. If partner commitments are incomplete: shrink pilot scope before build.
3. If integration is `blocked` and no safe fallback scope is approved: pause rollout and execute contingency decision.

## Gate 1 (After Pilot Cycle 1)

1. Pass all Gate 1 metrics: scale successful pillar(s).
2. Miss one metric: one remediation cycle max.
3. Miss two or more metrics: kill weakest pillar and re-run narrowly.

## Gate 2 (After Expansion Cycle)

1. If gains persist and operational load is manageable: expand.
2. If gains regress or costs spike: keep as focused domain solution.
3. If no durable gains: sunset pilot modules and preserve learnings.

## Integration Contingency Paths

If integration is `conditional`:

1. proceed only with documented compensating controls,
2. set a re-negotiation milestone before Phase 2 expansion.

If integration is `blocked`:

1. choose one of:
   - narrow HelpBridge to tightly bounded, high-confidence local workflows, or
   - execute responsible deprecation plan.
2. deprecation trigger defaults:
   - repeated failure of primary outcome thresholds across two cycles, and
   - fatal error rate above threshold without recoverability.

## 90-Day Execution Timeline

## Weeks 1-2: Phase 0

1. Instrumentation and baseline completion.
2. Partner and cohort lock.
3. Pre-registration of hypotheses/falsifiers/thresholds.
4. API feasibility + legal/privacy redline assessment.
5. Offline/local data security threat modeling.

## Weeks 3-6: Phase 1 Build

1. Service Reliability + Warm Referral core implementation.
2. Limited Access Navigation for pilot services.
3. Internal QA, privacy review, and runbook drafting.

## Weeks 7-10: Phase 1 Live Pilot

1. Weekly scorecard and issue triage.
2. Adoption support and data quality interventions.
3. End-of-cycle Gate 1 decision.

## Weeks 11-13: Remediation or Scale Prep

1. If yellow: one remediation cycle.
2. If green: Phase 2 expansion prep.
3. If red: narrowed continuation or sunset execution.

## First 14 Days: Detailed Checklist

1. Finalize v22.0 objective function and hard constraints.
2. Approve metric definitions and formulas in this document.
3. Select pilot domain and services (recommended: housing intake).
4. Confirm pilot partners and assign owner per partner.
5. Define data retention and privacy boundaries for new events.
6. Create baseline dashboards and validate query accuracy.
7. Publish internal claim language updates to avoid overstatement.
8. Freeze non-pillar feature work except reliability/security defects.
9. Complete evidence re-validation log for all external-agent-derived claims used in this plan.
10. Record integration decision (`go`/`conditional`/`blocked`) with rationale.

## External-Agent Research Assimilation (Hypothesis Backlog)

The following items were accepted from external-agent reports as **investigate/validate** inputs:

1. Integration-first trajectory as default strategic path.
2. API terms may create telemetry reciprocity risk.
3. Offline-first systems require explicit lost/stolen-device safeguards.
4. Directory decay rate is a first-order operational risk requiring monthly audits.
5. Human-assisted vs self-serve preference must be tested with frontline cohorts.

None of the above are treated as confirmed facts until validated through Phase 0 evidence protocol.

## Weekly Decision Journal Template (Post-Approval)

Use this only for ongoing weekly operating decisions after Step 1 is approved.
Canonical Step 1 sign-offs remain in [v22.0 Approval Checklist](v22-0-approval-checklist.md).

| Date       | Decision                                                   | Rationale                                            | Evidence Used          | Alternatives Rejected | Owner         |
| ---------- | ---------------------------------------------------------- | ---------------------------------------------------- | ---------------------- | --------------------- | ------------- |
| YYYY-MM-DD | Example: Keep Warm Referral, defer Access Navigation scale | Adoption hit threshold, navigation signal still weak | Pilot week 4 scorecard | Scale both now        | Product owner |

## Documentation Links

Strategic context and evidence base:

1. [HelpBridge vs 211 Objective Evaluation (2026-02-27)](/home/jer/localsync/helpbridge-ca/docs/evaluation/HelpBridge_vs_211_Objective_Evaluation_2026-02-27.md)
2. [HelpBridge vs 211 Evidence Matrix (2026-02-27)](/home/jer/localsync/helpbridge-ca/docs/evaluation/HelpBridge_vs_211_Evidence_Matrix_2026-02-27.csv)
3. [HelpBridge vs 211 Positioning Playbook (2026-02-27)](/home/jer/localsync/helpbridge-ca/docs/evaluation/HelpBridge_vs_211_Positioning_Playbook_2026-02-27.md)

## Final Recommendation

Proceed with v22.0 under one condition:

1. Treat this as a measurable experiment with kill criteria, not a pre-committed multi-quarter build.

This is the best objective, non-biased path because:

1. steelman defines upside,
2. devil's advocate defines falsification,
3. stage gates force evidence-based survival of initiatives.
