# HelpBridge: Product Roadmap

> **Current Version**: v22.0 (Non-Duplicate Value Decision Plan, Phase 0)
> **Next Milestone**: v22.0 Gate 0 Exit (C1/D4 blocker closure)
> **Last Updated**: 2026-03-29
> **Platform Status**: Strategic Repositioning - v22.0 Decision-Gated Planning

## Current State

- **Services**: 196 manually curated social services (verified 2026-02-11)
- **Tests**: default Vitest suite green as of 2026-03-29 (`152` files; `1152` passed; `24` skipped)
- **DB integration lane**: local Supabase-backed retrieval, route, export, search, and policy tests are green via `npm run test:db`
- **Coverage**: fresh `npm run test:coverage` snapshot still needed
- **Repo hygiene**: `npm run check:refs`, typed service DB write paths, dashboard server actions, and dependency cleanup are complete
- **Dependency audit**: `npm audit --omit=dev` reports `0 vulnerabilities`
- **E2E**: default Chromium suite is skip-free; production/server-mode checks live in dedicated opt-in commands
- **Accessibility**: WCAG 2.1 AA automation remains in place
- **Languages**: 7 locales at translation-key parity
- **French service-data gaps**: `access_script_fr`, `hours_text_fr`, `eligibility_notes_fr`, and `synthetic_queries_fr` remain incomplete
- **Offline**: PWA with IndexedDB fallback and background sync
- **Observability**: Axiom metrics, Slack alerting, SLO monitoring, and runbooks are live
- **Deployment**: Live on the direct-VPS path at `https://helpbridge.ca`
- **Branding**: HelpBridge rename is complete across this repo, the GitHub remote, `platform-ops`, and the live VPS runtime
- **Data quality gaps**:
  - Coordinates: 70.4% complete (58/196 missing)
  - Email: 17.9% complete (161/196 missing)
  - Identity tags: 44.4% complete (109/196 missing)
  - French synthetic queries: 36.2% complete (125/196 missing)

## Decision Summary

HelpBridge is not currently in a breadth-expansion phase.

The active question is whether the project can prove non-duplicate value relative to 211 through measurable last-mile outcomes such as connection success, reliability, and referral completion. Until that is demonstrated, roadmap priority stays on governance closure, pilot readiness, and evidence discipline rather than new feature expansion.

## What To Do Now

1. Close the remaining v22.0 Gate 0 blockers in strict order: C1 legal review, then D4 partner operations evidence.
2. Keep the repo stable while Gate 0 is blocked: maintain tests, keep docs aligned, and avoid speculative feature work.
3. Preserve launch readiness materials, but do not resume beta or public-launch execution until v22 permits it.

## What Not To Do Now

1. Do not expand directory breadth to compete with 211.
2. Do not start new pilot-facing features before Gate 0 evidence is accepted.
3. Do not restart v19 launch execution while v22 remains `NO-GO`.
4. Do not pull forward parked enrichment or portfolio work unless it directly supports the active gate.

## Active Work

### v22.0: Non-Duplicate Value Decision Plan 🔄 ACTIVE

**Status**: Phase 0 in progress - **Gate 0 Exit NO-GO**
**Priority**: Critical
**Timeline**: 90-day decision cycle (~13 weeks)
**Created**: 2026-02-27

HelpBridge is being repositioned from possible directory duplication toward measurable last-mile outcome value. This path uses explicit hypotheses, strict kill criteria, and governance gates before any broader pilot execution.

**Core objective**

1. Prove non-duplicate value vs 211 on measurable connection outcomes.
2. Validate privacy-safe integration feasibility with 211 pathways.
3. Keep explicit stop conditions if outcome value is not demonstrated.

**Current technical position**

1. Pilot DB schema, RLS policies, internal pilot APIs, and pilot tests are implemented.
2. Step 1 approval locks are complete.
3. Gate 0 evidence scaffolding is in repo.
4. C2 retention policy approval, privacy sign-off, and dated verification evidence are complete.
5. Gate 0 remains `NO-GO` because C1 legal evidence and D4 partner-ops evidence are still incomplete.

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
3. Re-evaluate Gate 0 and re-run `npm run check:v22-gate0`.
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

## Parallel Maintenance While Gate 0 Waits

These items are worth doing only if they do not distract from Gate 0 closure:

1. Refresh the coverage baseline with `npm run test:coverage`.
2. Keep the default E2E suite skip-free and keep the opt-in production/server suites healthy.
3. Verify and document the remaining v22 threat-model mitigation items before pilot activation.
4. Keep top-level documentation aligned with the active roadmap state.
5. Run `npm run db:types` on a Docker-capable machine and remove the last intentional untyped admin-audit access once generated schema coverage exists.

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

### v21.0: Admissions Portfolio & Launch Narrative ⏸️ PARKED

**Status**: Parked until after v22 Gate 1

This work remains strategically useful, but it depends on real operational evidence. Keep it parked until the v22 pilot produces something defensible to package.

Reference:

- [v21.0 Admissions Portfolio Plan](v21-admissions-portfolio-plan.md)

### v20.0: Testing and Technical Excellence ⏸️ MAINTENANCE MODE

**Status**: Most autonomous backlog work is complete; only bounded maintenance remains active

Useful maintenance items:

1. Keep the default E2E suite healthy.
2. Keep the dedicated DB integration lane healthy and deterministic.
3. Publish a fresh coverage snapshot.
4. Fix repo-local regressions surfaced by routine validation.

Deferred items:

1. Advanced French service-data enrichment
2. Search AI metadata migration out of JSON
3. Admin-facing data quality dashboard
4. Regenerate `types/supabase.ts` using `npm run db:types` on a Docker-capable machine and then type the remaining `notification_audit` path

References:

- [2026-02-12 v20.0 Phase 1 Implementation Plan](archive/2026-02-12-v20-0-phase-1-implementation-plan.md)
- [2026-03-12 v20.0 Autonomous Backlog Closeout](archive/2026-03-12-v20-0-autonomous-backlog-closeout.md)
- [2026-03-24 v20.0 DB Integration Test Lane](archive/2026-03-24-v20-0-db-integration-test-lane.md)
- [2026-03-24 v20.0 Supabase Migration Recovery](archive/2026-03-24-v20-0-supabase-migration-recovery-plan.md)

## Completed Work

### Recent Completed Milestones

- **C2 retention control closure (2026-03-29)**: approved retention policy, captured privacy sign-off, attached dated read-only verification evidence, and moved `G0-4` to `pass`.
- **Repo audit remediation (2026-03-29)**: completed the typed service-write cleanup, feedback/dashboard action consolidation, member-management split, privacy-safe analytics hardening, reference validation, and dependency/script hygiene follow-through.
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
- [v20.0 Repo Audit Remediation Archive](archive/2026-03-29-v20-0-repo-audit-remediation.md)
- [Code Quality Remediation Archive](archive/2026-03-26-v22-0-code-quality-remediation.md)
- [HelpBridge Rebrand Archive](archive/2026-03-18-helpbridge-rebrand.md)
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
5. A new strategic version becomes active.

## Operating Rule

If there is tension between adding more capability and closing the current decision gate, close the decision gate first.
