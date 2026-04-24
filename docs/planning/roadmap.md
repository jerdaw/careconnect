---
status: stable
last_updated: 2026-04-23
owner: jer
tags: [planning, roadmap, v22.0, governance]
---

# CareConnect: Product Roadmap

> **Current Version**: v22.0 (Non-Duplicate Value Decision Plan, Phase 0)
> **Next Milestone**: v22.0 Gate 0 Exit (C1/D4 blocker closure)
> **Last Updated**: 2026-04-23
> **Platform Status**: Strategic Repositioning - v22.0 Decision-Gated Planning

## Current State

- **Services**: 196 manually curated social services (`npm run validate-data` and `npm run audit:data` on 2026-04-03)
- **Tests**: default Vitest suite green as of 2026-04-20 (`177` files; `1305` passed; `24` skipped)
- **DB integration lane**: `npm run db:types` and `npm run test:db` are green as of 2026-04-20 on a Docker-capable machine, and local Supabase-backed retrieval, route, export, search, and policy tests remain healthy
- **Coverage**: `72.13%` statements / `78.85%` branches / `83.20%` functions / `72.13%` lines from `npm run test:coverage` on 2026-04-03
- **Repo hygiene**: `npm run check:refs`, typed service DB write paths, dashboard server actions, and dependency cleanup are complete
- **Dependency audit**: `npm audit --omit=dev` reports `0 vulnerabilities`
- **Full audit lane**: `npm audit --audit-level=high` still reports unresolved high/critical findings in the current dependency tree, so the GitHub CI audit step remains advisory for now
- **Bundle baseline**: localized home route first-load JS is `315 kB` after lazy AI and semantic-search startup deferral
- **E2E**: default Chromium suite is skip-free; production/server-mode checks live in dedicated opt-in commands
- **Accessibility**: WCAG 2.1 AA automation remains in place
- **Languages**: 7 locales at translation-key parity
- **Dashboard trust/resilience**: partner overview metrics are live, degraded read states are explicit, and localized dashboard/admin redirects now preserve locale
- **Search explainability**: public search results now surface deduplicated match reasons with an accessible disclosure for deeper scoring context
- **Stale-data governance**: search now excludes records beyond the 180-day freshness window, freshness badges distinguish expired records, and direct-linked detail pages show an explicit stale-record warning
- **Freshness policy alignment**: governance and planning docs now treat 180 days as the hard visibility limit, 90 days as a priority-service target, and the v22 90-day window as a review checkpoint rather than a guaranteed build schedule
- **Workflow runtime hygiene**: active GitHub Actions use Node-24-compatible major versions, and release automation uses `gh release create` instead of the archived release action
- **GitHub automation hygiene**: bundle analysis, Dependabot review gates, scheduled governance reminders, and finding workflows now run quiet-by-default with sticky comments/issues only when action is required
- **URL health governance**: the monthly health check writes an Actions summary, auto-closes its finding issue when the report returns clean, and can use bounded official provider override probes for repeat CI-only false positives without changing curated public URLs
- **Lint hygiene**: repo-wide ESLint now ignores local MkDocs build output under `site/`, so `npm run lint` remains actionable even when docs artifacts exist locally
- **Semantic search resilience**: browser embedding-worker failures now fail closed to keyword-only search, and embedding request errors settle cleanly instead of emitting synthetic vectors
- **Pilot metric stack**: M2/M4/M5/M6/M7 source schema, recompute path, and scorecard snapshot flow are implemented; values remain data-dependent rather than schema-blocked
- **Pilot readiness reporting**: scoped JSON/Markdown/CSV readiness exports now exist for bounded A6/A16 follow-through without mutating curated service data
- **French service-data gaps**: runtime hardening is complete, but governed content follow-through still remains for `access_script_fr`, `hours_text_fr`, `eligibility_notes_fr`, and `synthetic_queries_fr`
- **Offline**: PWA with IndexedDB fallback, background sync, and snapshot-age/stale-data messaging on offline surfaces
- **Privacy-safe mapping**: service-detail pages gate third-party map previews behind explicit user action
- **Partner write hardening**: partner-facing service mutation routes now use explicit editable-field allowlists, role-aware service ownership checks, and owner/admin-only delete semantics
- **Search parity and freshness**: local and server search now align on `location` and `openNow` filters, including empty-query open-now browsing; local and server ranking now share the same scoring engine; offline export fingerprints are stable and successful syncs invalidate the in-memory service cache
- **Privacy-safe sharing and analytics**: share-target hydration now uses a short-lived first-party cookie, printable cards generate inline QR codes locally, search analytics store only locale + result count, and detail-page analytics distinguish internal views from outbound referrals
- **Observability**: Axiom metrics, Slack alerting, SLO monitoring, and runbooks are live
- **Health visibility**: `/api/v1/health` is public and read-only, while `/api/v1/health/probe` is the authenticated uptime-sampling and alert-evaluation path
- **Middleware auth resilience**: refreshed Supabase session cookies now survive the locale middleware pass and protected-route redirects
- **DB-authoritative runtime data**: search/detail loading no longer overlays live DB reads with local JSON metadata when Supabase is available
- **DB rollout safety**: `npm run backfill:db-runtime-fields` now exists to fill blank runtime/search fields in existing Supabase environments after the JSON-overlay removal without overwriting non-empty live values, and the current production Supabase environment has been backfilled successfully
- **Deployment**: Live on the direct-VPS path at `https://careconnect.ing`, with `helpbridge.ca` and `www.helpbridge.ca` redirecting to the canonical host
- **Ops documentation truth**: active incident, rollback, alerting, and launch QA docs now point at the direct-VPS runtime instead of the historical Vercel path
- **Feedback retention copy**: privacy copy no longer promises a fixed automatic 90-day feedback deletion timeline that the implementation does not evidence
- **Deploy contract drift**: the current live VPS frontend deploy path still requires `sudo ./scripts/archive/deploy-vps-proof.sh ...` because `/etc/projects-merge/env` remains root-only in the observed host contract
- **Branding**: CareConnect rename is complete across this repo, the `jerdaw/careconnect` GitHub repo slug, `platform-ops`, and the live VPS runtime
- **211 sync posture**: quarantined to explicit manual runs only; no scheduled or mock-data ingestion path remains active
- **Data quality gaps**:
  - Scope: 0 missing
  - Coordinates (any): 58 missing
  - Coordinates (required): 18 missing
  - Kingston missing address: 17
  - Access scripts: 0 missing
  - Structured hours (active services): 10 missing
  - Hours text (active services): 10 missing
  - French access scripts: 196 missing
  - French hours text: 196 missing
  - French eligibility notes: 118 missing
  - French synthetic queries: 125 missing

## Decision Summary

CareConnect is not currently in a breadth-expansion phase.

The active question is whether the project can prove non-duplicate value relative to 211 through measurable last-mile outcomes such as connection success, reliability, and referral completion. Until that is demonstrated, roadmap priority stays on governance closure, pilot readiness, and evidence discipline rather than new feature expansion.

## What To Do Now

1. Close the remaining v22.0 Gate 0 blockers in strict order: C1 legal review, then D4 partner operations evidence.
2. Keep the repo stable while Gate 0 is blocked: maintain tests, keep docs aligned, and avoid speculative feature work.
3. If pulling forward any admissions backlog work, treat `A3`, `A11`, and `A22` as complete; only `A1` and bounded `A6` / `A16` remain valid near-term Tier 0 execution.
4. Preserve launch readiness materials, but do not resume beta or public-launch execution until v22 permits it.

## What Not To Do Now

1. Do not expand directory breadth to compete with 211.
2. Do not start new pilot-facing features before Gate 0 evidence is accepted.
3. Do not restart v19 launch execution while v22 remains `NO-GO`.
4. Do not pull forward Tier 1-4 admissions packaging work before real pilot evidence exists.
5. Do not pull forward parked enrichment or portfolio work unless it directly supports the active gate.

## Cross-Repo Docs Platform Policy

As of 2026-04-15, CareConnect follows the shared documentation-platform policy used across the affected MkDocs repos:

1. Keep this repo on MkDocs 1.x plus Material in the short term, and treat that stack as supported legacy rather than the strategic default for new standalone docs sites.
2. The intended MkDocs replacement is Zensical, but only after it clears the shared readiness gates: real strict-mode enforcement, a supported publish/deploy path, and parity for each repo's required plugins.
3. The migration order is wave-based: `qquotes` first, then `visitbrief`, then `waittimecanada`, then plugin-heavier repos like CareConnect.
4. CareConnect is a later-wave candidate because it depends on `social`, `git-revision-date-localized`, and `swagger-ui-tag`, so it should not be the proving ground.
5. If Zensical stalls or fails to deliver the required compatibility in a reasonable window, use Sphinx + MyST as the mature fallback for any future standalone docs rebuild instead of starting fresh on MkDocs.

## Active Work

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

1. Keep the default E2E suite skip-free and keep the opt-in production/server suites healthy.
2. Verify and document the remaining v22 threat-model mitigation items before pilot activation.
3. Reconcile the shared frontend env-file deploy contract with `platform-ops`: either restore a documented non-sudo operator-readable path that actually works with `/etc/projects-merge/env`, or standardize `sudo` as the current frontend deploy requirement across the shared runbooks.
4. Expand exact-English duplicate i18n auditing from the current focused namespaces to all used translation keys after the remaining legacy translation debt is localized.
5. From the admissions backlog, only execute the still-open Tier 0 items that strengthen pilot readiness or evidence discipline: `A1` and bounded `A6` / `A16`.
6. Keep docs dependencies bounded to the MkDocs 1.x line during routine maintenance, but defer any platform migration here until the earlier Zensical waves succeed and this repo's required plugin parity is proven.

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

**Status**: Parked until after v22 Gate 0 / Gate 1 evidence, but fully re-triaged on 2026-04-01

This backlog is now explicitly sorted by admissions value under the current v22 constraints. The sequencing rule is:

1. Close v22 blockers first.
2. Then create real pilot evidence.
3. Then package that evidence for admissions and external audiences.

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

- **Quiet GitHub automation and URL health hardening (2026-04-23)**: converted routine GitHub governance workflows to quiet-by-default sticky issue/comment behavior, reconciled duplicate reminder issues, added reusable bot-issue synchronization for scheduled workflows, hardened the monthly URL health lane with official override probes plus Actions summaries, and verified clean auto-close/no-reopen behavior for the broken-URL issue lane; archived in [2026-04-23 v20.0 Quiet GitHub Automation and URL Health Hardening](archive/2026-04-23-v20-0-quiet-github-automation-and-url-health-hardening.md).
- **Repo audit truth remediation (2026-04-23)**: aligned the active direct-VPS incident/rollback/observability/QA docs with the live runtime, corrected the public feedback-retention claim to the evidenced implementation, and left the GitHub `npm audit` step advisory because the current dependency tree still fails a full high-severity audit.
- **Semantic search fail-closed and lint hygiene (2026-04-15)**: removed synthetic semantic-search fallback vectors, made worker/embed failures degrade to keyword-only search, restored authoritative repo-wide linting by excluding local MkDocs output, synced architecture docs, and added focused hook/documentation hygiene coverage; archived in [2026-04-15 v20.0 Semantic Search Fail-Closed and Lint Hygiene](archive/2026-04-15-v20-0-semantic-search-fail-closed-and-lint-hygiene.md).
- **Gate 0 wait maintenance bundle (2026-04-05)**: completed search explainability, stale-data runtime governance, workflow-runtime doc alignment, and solo-scale freshness-policy calibration while Gate 0 remained blocked; archived in [2026-04-05 v22.0 Gate 0 Wait Maintenance Bundle](archive/2026-04-05-v22-0-gate-0-wait-maintenance-bundle.md).
- **Map privacy and offline snapshot safety surfaces (2026-04-04)**: replaced automatic Google Maps embeds with explicit opt-in previews, surfaced offline snapshot age/stale warnings on offline surfaces, updated threat-model/user-guide/architecture docs, and added focused UI/helper coverage; archived in [2026-04-04 v22.0 Map Privacy and Offline Snapshot Safety](archive/2026-04-04-v22-0-map-privacy-and-offline-snapshot-safety.md).
- **Tier 0 admissions-support hardening (2026-04-01)**: completed A3 pilot metric instrumentation, A11 public-claim hardening, A22 focused pilot/privacy test coverage, and bounded A6/A16 readiness-audit tooling; archived in [2026-04-01 v22.0 Pilot Metric Instrumentation and Tier 0 Hardening](archive/2026-04-01-v22-0-pilot-metric-instrumentation-and-tier-0-hardening.md).
- **CareConnect production cutover and repo finalization (2026-04-03)**: completed the live `careconnect.ing` VPS cutover, legacy HelpBridge-domain redirects, GitHub repo rename to `jerdaw/careconnect`, and post-cutover observability-noise cleanup; archived in [CareConnect Rebrand Archive](archive/2026-03-18-careconnect-rebrand.md).
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
5. v21 tier sequencing changes or a new admissions evidence artifact materially changes what is worth prioritizing.
6. A new strategic version becomes active.

## Operating Rule

If there is tension between adding more capability and closing the current decision gate, close the decision gate first.
