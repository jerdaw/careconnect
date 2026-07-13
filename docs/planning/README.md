---
status: stable
last_updated: 2026-07-10
owner: jer
tags: [planning, roadmap, governance, public-docs, multi-city, brampton]
---

# Planning Documents

This directory contains planning and strategy documents for CareConnect.

> Historical note: files under `docs/planning/archive/` preserve earlier phases
> of the project and may still use pre-CareConnect naming or transitional
> branding.
> Treat those references as historical only; current operational guidance uses
> the CareConnect name and `careconnect.ing`.

## Active Planning: v22.0 and Brampton

**Status:** v22 Gate 0 decision work remains `NO-GO` pending C1/D4 closure. The approved eight-record Brampton first-launch set is live in production; future verification, expansion, and official/partner wording remain approval-gated.
**Created:** 2026-02-27

### Quick Start (Read These First)

1. **[Roadmap](roadmap.md)** ⭐ START HERE
   - Current product state, active work, completed work, Brampton launch gates, and follow-ups
   - **Reading time:** 10 minutes

2. **[v22.0 Non-Duplicate Value Decision Plan](v22-0-non-duplicate-value-decision-plan.md)**
   - Strategic objective, hypotheses, kill rules, and stage gates
   - **Reading time:** 15 minutes

3. **[Brampton Launch Readiness Report](../launch/brampton-readiness-report.md)**
   - Current Brampton launch evidence, completed production/QA status, and remaining verification/approval gates
   - **Reading time:** 10 minutes

### Detailed Documentation (Optional)

- [Brampton Rollout Checklist](../launch/brampton-rollout-checklist.md)
  - Operational checklist for local QA, production schema preflight, migration/deploy approval, rollback, and post-launch work
  - **Reading time:** 5 minutes

- [Brampton Manual QA](../launch/brampton-manual-qa.md)
  - Browser/a11y, DB smoke, viewport, selector, and search QA evidence plus current follow-up defects
  - **Reading time:** 5 minutes

- [Brampton Public Positioning Drafts](../launch/brampton-public-positioning-drafts.md)
  - Supported-region copy direction, partner/source-reference wording, and draft-only land acknowledgment source review
  - **Reading time:** 5 minutes

- [Public GitHub Cleanup Archive (2026-06-04)](archive/2026-06-04-public-github-cleanup.md)
  - Completed public documentation boundary cleanup, private-note preservation, ADR-022 creation, and boundary-safe script/test updates
  - **Reading time:** 5 minutes

- [v20.0 Public and Operational Surface Polish Archive (2026-05-01)](archive/2026-05-01-v20-0-public-and-operational-surface-polish.md)
  - Completed reference sources, suggest-service intake, settings, public workflow, static legal/help/trust, and authenticated operational surface polish
  - **Reading time:** 5 minutes

- [v20.0 About Page Polish Archive (2026-04-30)](archive/2026-04-30-v20-0-about-page-polish.md)
  - Completed About page layout, background, section rhythm, shared-rail alignment, and CTA styling polish
  - **Reading time:** 5 minutes

- [v20.0 Homepage Search UX Polish Archive (2026-04-29)](archive/2026-04-29-v20-0-homepage-search-ux-polish.md)
  - Completed homepage search/filter spacing, active-filter UX polish, metrics-rail refinement, and homepage credibility flow polish
  - **Reading time:** 5 minutes

- [v20.0 Repo Audit Truth Remediation Archive (2026-04-24)](archive/2026-04-24-v20-0-repo-audit-truth-remediation.md)
  - Completed closeout for the 2026-04-23 audit findings and remediation wave
  - **Reading time:** 5-10 minutes

- [v22.0 Gate 0 Prep and Deploy Contract Alignment Archive (2026-04-28)](archive/2026-04-28-v22-0-gate-0-prep-and-deploy-contract-alignment.md)
  - Completed autonomous maintenance pass for prep-only Gate 0 evidence packets, deploy-contract alignment, and validation
  - **Reading time:** 5 minutes

- [v22.0 Autonomous Gate 0 Maintenance Archive (2026-06-13)](../implementation/archive/2026-06-13-v22-0-autonomous-gate0-maintenance.md)
  - Completed bounded repo-local maintenance pass for evidence guards, D4 artifact-inventory validation, offline recovery/privacy, pilot event contracts, and readiness validation while leaving C1/D4 evidence externally blocked
  - **Reading time:** 10 minutes

- [Autonomous Maintenance Plan Archive (2026-06-28)](archive/2026-06-28-autonomous-maintenance-plan.md)
  - Completed documentation, validation, local CI parity, and read-only embeddings freshness maintenance queue while leaving v22 C1/D4 evidence externally blocked
  - **Reading time:** 5-10 minutes

- [CareConnect Closeout Triage Checkpoint (2026-07-01)](../implementation/careconnect-closeout-triage-2026-07-01.md)
  - Current finish-now/defer/human-owned matrix after auth/admin regression hardening and CI validation
  - **Reading time:** 5 minutes

- [Residual Security Closure Archive (2026-07-03)](archive/2026-07-03-residual-security-closure.md)
  - Completed public provenance projection hardening and related API/schema verification
  - **Reading time:** 5 minutes

- [Maintenance Audit (2026-07-05)](../maintenance-audit.md)
  - Completed repo-health maintenance report covering scoped code fixes, docs updates, verification status, and remaining follow-ups
  - **Reading time:** 10-15 minutes

- **[v22.0 Approval Checklist](v22-0-approval-checklist.md)**
  - Canonical sign-off record for Gate 0 decisions
  - **Reading time:** 10 minutes

- **[v22.0 Phase 0 Implementation Plan](../implementation/v22-0-phase-0-implementation-plan.md)**
  - Technical execution spec for pilot instrumentation and governance evidence
  - **Reading time:** 20-30 minutes

- **[CareConnect Rebrand Archive](archive/2026-03-18-careconnect-rebrand.md)**
  - Historical record of the completed repo + runtime rename
  - **Reading time:** 5 minutes

- **[v20.0 DB Integration Test Lane Archive](archive/2026-03-24-v20-0-db-integration-test-lane.md)**
  - Historical record of the completed real DB integration test lane and the remaining migration-history follow-up
  - **Reading time:** 5 minutes

- **[v20.0 Repo Audit Remediation Archive](archive/2026-03-29-v20-0-repo-audit-remediation.md)**
  - Historical record of the completed repo-maintenance batch: typed service writes, dashboard action extraction, search typing cleanup, script/reference hygiene, and dependency cleanup
  - **Reading time:** 5-10 minutes

- **[v20.0 Runtime Hardening and Performance Remediation Archive](archive/2026-03-30-v20-0-runtime-hardening-and-performance-remediation.md)**
  - Historical record of the completed audit-driven hardening wave: privacy/governance fixes, org-scoped service creation, CSV import repair, lazy AI/search loading, and workflow cleanup
  - **Reading time:** 5-10 minutes

- **[v20.0 Workflow Runtime Cleanup and 211 Sync Quarantine Archive](archive/2026-04-01-v20-0-workflow-runtime-cleanup-and-211-sync-quarantine.md)**
  - Historical record of the completed maintenance wave that quarantined the experimental 211 sync path and closed the remaining GitHub Actions runtime follow-up
  - **Reading time:** 5 minutes

- **[v21.0 External Validation Plan](v21-external-validation-plan.md)**
  - Public-interest external-validation backlog, ordered by current strategic value
  - Read this only after the main roadmap so the v22 gate-first constraints stay clear
  - **Reading time:** 10-15 minutes

- **[v22.0 Pilot Metric Instrumentation and Tier 0 Hardening Archive](archive/2026-04-01-v22-0-pilot-metric-instrumentation-and-tier-0-hardening.md)**
  - Completed closeout for the A3/A11/A22 bundle plus bounded A6/A16 readiness tooling
  - Use this when you need a concise historical record of what landed on 2026-04-01
  - **Reading time:** 5-10 minutes

- **[v20.0 Semantic Search Fail-Closed and Lint Hygiene Archive](archive/2026-04-15-v20-0-semantic-search-fail-closed-and-lint-hygiene.md)**
  - Completed closeout for the semantic worker fail-closed hardening, lint-boundary cleanup, and related docs/test updates
  - Use this when you need the historical record for the 2026-04-15 maintenance pass
  - **Reading time:** 5 minutes

- **[v20.0 Quiet GitHub Automation and URL Health Hardening Archive](archive/2026-04-23-v20-0-quiet-github-automation-and-url-health-hardening.md)**
  - Completed closeout for the quiet-by-default GitHub automation rollout, bot-issue reconciliation, and URL-health false-positive hardening
  - Use this when you need the historical record for the 2026-04-23 maintenance pass
  - **Reading time:** 5 minutes

- **[v20.0 Repo Audit Truth Remediation Archive](archive/2026-04-24-v20-0-repo-audit-truth-remediation.md)**
  - Completed closeout for the 2026-04-23 audit findings after the direct-VPS docs/privacy/planning reconciliation pass
  - Use this when you need the historical record for the 2026-04-24 maintenance pass
  - **Reading time:** 5 minutes

---

## Document Navigation

```
docs/planning/
├── README.md ← You are here
├── roadmap.md (main roadmap, updated for v22.0 and Brampton)
├── archive/ (completed version plans)
├── archive/2026-06-04-public-github-cleanup.md
├── archive/2026-05-01-v20-0-public-and-operational-surface-polish.md
├── archive/2026-04-30-v20-0-about-page-polish.md
├── archive/2026-04-29-v20-0-homepage-search-ux-polish.md
├── archive/2026-04-28-v22-0-gate-0-prep-and-deploy-contract-alignment.md
├── archive/2026-04-24-v20-0-repo-audit-truth-remediation.md
├── archive/2026-04-23-v20-0-quiet-github-automation-and-url-health-hardening.md
├── v21-external-validation-plan.md
├── archive/2026-04-15-v20-0-semantic-search-fail-closed-and-lint-hygiene.md
├── archive/2026-04-01-v22-0-pilot-metric-instrumentation-and-tier-0-hardening.md
├── v22-0-non-duplicate-value-decision-plan.md
├── v22-0-approval-checklist.md
├── archive/2026-04-01-v20-0-workflow-runtime-cleanup-and-211-sync-quarantine.md
├── archive/2026-06-28-autonomous-maintenance-plan.md
├── archive/2026-06-28-autonomous-maintenance-status.md
├── archive/2026-03-18-careconnect-rebrand.md
├── archive/2026-03-30-v20-0-runtime-hardening-and-performance-remediation.md
└── archive/2026-03-29-v20-0-repo-audit-remediation.md
```

---

## Quick Reference

### What is active now?

Two tracks are active:

1. **v22.0: Non-Duplicate Value Decision Plan**
   - The strategic planning track for proving non-duplicate value relative to 211 through measured connection outcomes, strict privacy constraints, and explicit kill criteria.
2. **Brampton constrained multi-city launch closeout and bounded verification**
   - The approved eight-record first-launch set is live in production. Further records and L2/L3 changes continue only through the governed verification and approval workflow.

### Why Now?

The platform is technically mature, but the next decision is strategic rather than purely technical:

- Avoid direct breadth competition with 211
- Validate measurable last-mile outcome value
- Keep governance and privacy redlines explicit before expanding pilot work

### Timeline

**Target ~90-day decision review cycle**

- Phase 0: baseline + governance locks
- Phase 1: pilot execution
- Phase 2: objective go / conditional / stop decision

This is a decision checkpoint target, not a guaranteed delivery schedule. The review window assumes external blockers such as legal review and partner evidence close in time to support a meaningful decision.

### Cost

Pilot cost remains bounded by existing infrastructure and partner participation assumptions documented in the v22 plan.

### Dependencies

Current dependencies and completed prerequisites:

- Gate 0 blocker closure (`C1`, `D4`)
- Baseline evidence already published
- Integration feasibility decision already recorded in conditional mode
- Offline/local threat-model completion already recorded
- Brampton first-launch production, accessibility, visual QA, and broad-coverage closeout already recorded

---

## How to Proceed

### Option 1: Continue Bounded Brampton Verification

Use the active roadmap and verification workplan for the remaining Brampton track:

1. Resolve Knights Table address and program-split evidence before any L2 decision
2. Recheck Ste. Louise registration and hours before any L2 decision
3. Review BMCC, CCS, and PCHS one at a time through the L1 template
4. Require explicit approval before any future promotion, L2/L3 change, or official/partner wording

### Option 2: Close Gate 0

Use the active roadmap and Gate 0 tracker to close the remaining v22 blocking items:

1. Attach candidate partner legal/API terms for C1 review
2. Attach named pilot partner and outreach execution evidence for D4

### Option 3: Ask Questions

Review documents and ask clarifying questions about scope, timeline, or approach.

### Option 4: Request Changes

Propose modifications to scope, timeline, or implementation strategy.

---

## Document Updates

- **2026-03-24:** Planning index updated to reflect Gate 0 `NO-GO` blockers and current close-out order
- **2026-03-29:** Planning index updated to reflect completed C2 closure and remaining C1/D4 blockers
- **2026-03-29:** Added v20.0 repo-audit remediation archive and removed the stale reference to a nonexistent active v20 migration-recovery plan
- **2026-03-30:** Added the v20.0 runtime hardening and performance remediation archive and refreshed roadmap baseline metrics after the audit-driven maintenance wave
- **2026-04-01:** Added the v20.0 workflow runtime cleanup and 211 sync quarantine archive after closing the remaining Node-runtime workflow follow-up
- **2026-04-01:** Added the v22.0 Tier 0 external-validation support archive and updated the roadmap to treat pilot metric, public-claim, and focused privacy test hardening as complete baseline capability
- **2026-04-01:** Added the re-triaged v21 external-validation plan to the planning index and aligned the main roadmap with the new tiered sequencing
- **2026-04-03:** Finalized the CareConnect rebrand archive after the GitHub repo rename to `jerdaw/careconnect`
- **2026-04-15:** Added the semantic-search fail-closed and lint-hygiene archive after restoring actionable repo-wide linting and hardening the embedding-worker fallback path
- **2026-04-23:** Added the quiet GitHub automation and URL-health hardening archive after converting recurring governance workflows to quiet-by-default issue reuse and stabilizing the monthly health check against CI-only false positives
- **2026-04-24:** Archived the repo audit follow-up/remediation wave after the direct-VPS docs/privacy/planning reconciliation pass completed
- **2026-04-28:** Archived the Gate 0 prep and deploy-contract alignment pass after adding prep-only C1/D4 evidence packets, syncing tracker wording, and validating the sudo-required shared frontend env-file contract
- **2026-04-29:** Archived the homepage search UX polish pass after moving filters into the active search/results state, restoring and refining the service/category/language metrics rail, folding trust-strip content into the `How It Works` flow, and validating spacing/contrast updates
- **2026-04-30:** Archived the About page polish pass after consolidating trust/context content, restoring the smooth page-level background, aligning sections on a shared rail, and validating CTA styling updates
- **2026-05-03:** Refreshed roadmap baselines from current local validation, corrected the production/full dependency audit status, and added bounded dependency-audit remediation to active maintenance
- **2026-06-04:** Added the public GitHub cleanup archive after establishing ADR-022 and sanitizing public deployment, operations, planning, legal, and observability documentation
- **2026-07-05:** Added the maintenance audit checkpoint and refreshed roadmap test, coverage, and dependency-audit baselines after the repo-health pass
- **2026-07-07:** Updated the active roadmap for the Brampton constrained multi-city launch track, refreshed 203-record data-quality counts, linked launch readiness docs, and reordered next work around a11y/browser QA, completed authenticated schema preflight, and approval gates
- **2026-03-24:** v20.0 DB integration test lane archived; migration-history cleanup remains on the active roadmap
- **2026-03-18:** Planning index updated for v22.0 and CareConnect rebrand archive
- **2026-03-18:** CareConnect rebrand archived in `docs/planning/archive/2026-03-18-careconnect-rebrand.md`
- Next review: After any `UA-1` / `UA-2` / `UA-3` evidence update or the next material roadmap change
