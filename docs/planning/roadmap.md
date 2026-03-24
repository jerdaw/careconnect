# HelpBridge: Product Roadmap

> **Current Version**: v22.0 (Non-Duplicate Value Decision Plan, Phase 0)
> **Next Milestone**: v22.0 Gate 0 Exit (C1/C2/D4 blocker closure)
> **Last Updated**: 2026-03-24
> **Platform Status**: Strategic Repositioning — v22.0 Decision-Gated Planning

## 📊 Current State

- **Services**: 196 manually curated social services (verified 2026-02-11)
- **Tests**: full default Vitest suite green as of 2026-03-18 (`149` files; `1142` passed; `24` skipped); coverage snapshot still needs a fresh `npm run test:coverage` run
  - High-value component smoke coverage, unhappy-path coverage, and live feedback/update integration coverage all advanced in the latest autonomous pass
  - Default `tests/e2e/**` Chromium suite now carries 0 inline skips; production-only and server-mode checks moved to dedicated commands in [E2E Automation Baseline (2026-03-12)](../testing/e2e-skip-baseline-2026-03-09.md)
  - CI budget mode: Playwright runs on `workflow_dispatch` or `main` commits containing `[run-e2e]`
- **Load Testing**: k6 infrastructure and baseline documentation are in place; follow-up work is comparative analysis and ongoing refresh
- **Resilience**: 100% circuit breaker protection on all API routes and database operations
- **Security**: Dependency hygiene automation is in place (Dependabot, dependency review on PRs, CI validation, header checks)
- **Accessibility**: WCAG 2.1 AA compliant (automated testing via Axe-core)
- **Languages**: 7 locales (EN, FR, ZH-Hans, AR, PT, ES, PA)
  - All 7 locale files remain at translation-key parity
  - Advanced French service-data fields remain incomplete (`access_script_fr`, `hours_text_fr`, `eligibility_notes_fr`, `synthetic_queries_fr`)
- **Offline-Ready**: PWA with IndexedDB fallback and background sync
- **Push Notifications**: Optional only; UI and SDK remain disabled unless OneSignal is explicitly configured
- **Observability**: Production monitoring (Axiom), automated alerting (Slack, 6 alert types), SLO monitoring (PROVISIONAL targets), 5 operational runbooks, deployment procedures, incident response plan
- **Data Quality**:
  - Coordinates: 70.4% (58/196 missing — impacts geolocation)
  - Email: 17.9% (161/196 missing — contact channel gap)
  - Identity Tags: 44.4% (109/196 missing — personalization limited)
  - French Synthetic Queries: 36.2% (125/196 missing — semantic search gap)
- **Deployment Status**: Live on the direct-VPS path at `https://helpbridge.ca`; Docker deploys now prefer `buildx`, `/api/v1/health` reports the deployed revision, and public boot degrades safely when optional browser integrations are unset
- **Branding**: HelpBridge rename is complete end-to-end across this repo, the GitHub remote, `platform-ops`, and the live VPS runtime (`helpbridge-web`)

---

## 🎯 Active Work

### v22.0: Non-Duplicate Value Decision Plan 🔄 ACTIVE

**Status**: PHASE 0 IN PROGRESS — **Gate 0 Exit NO-GO** (Step 1 sign-off locked; real-world blockers remain)
**Priority**: CRITICAL (Strategic Non-Duplication with 211)
**Total Effort**: 90-day decision cycle (~13 weeks)
**Timeline**: Phase 0 (2 weeks) + Phase 1 (8 weeks) + Phase 2 decision cycle
**Dependencies**: v22 objective evaluation artifacts + integration feasibility decision
**Created**: 2026-02-27
**Current State**: Pilot DB schema, RLS policies, hardened admin function, internal pilot APIs, and pilot test suite are implemented and validated. Step 1 decision locks are complete; baseline M1/M3 execution is recorded (both `NULL` due to zero baseline-window events); Gate 0 evidence workspace scaffolding is in place; and a draft C2 retention/deletion policy now exists in repo. Gate 0 still remains NO-GO until legal/privacy and partner-operation blockers are closed.

Reposition HelpBridge from potential directory duplication to measurable last-mile outcome value (connection success, reliability, referral completion), with explicit kill criteria if value is not demonstrated.

**👉 Detailed Plan: [v22.0 Non-Duplicate Value Decision Plan](v22-0-non-duplicate-value-decision-plan.md)**
**👉 Approval Checklist: [v22.0 Step 1 Approval Checklist](v22-0-approval-checklist.md)**
**👉 Phase 0 Execution Spec: [v22.0 Phase 0 Implementation Plan](../implementation/v22-0-phase-0-implementation-plan.md)**
**👉 User-Owned Gate 0 Actions: [v22.0 Gate 0 User Action Tracker](../implementation/v22-0-gate-0-user-action-tracker.md)**
**👉 Evidence Intake Pack: [v22.0 Gate 0 Evidence Intake Pack](../implementation/v22-0-gate-0-evidence-intake-pack.md)**
**👉 Evidence Workspace: [v22.0 Gate 0 Evidence Workspace](../implementation/v22-0-evidence/README.md)**

#### Gate-Oriented Objectives

1. Prove non-duplicate value vs 211 on measurable connection outcomes.
2. Validate privacy-safe integration feasibility with 211 data pathways.
3. Keep strict stop conditions for initiatives that do not outperform baseline.

#### Remaining Required Actions (Gate 0)

1. `UA-1 / G0-3`: Attach candidate partner legal/API terms and complete clause-level C1 review (`2026-03-21` target).
2. `UA-2 / G0-4`: Approve the draft field-level retention windows + deletion procedure, attach privacy sign-off, and add dated verification evidence (`2026-03-21` target).
3. `UA-3 / G0-8`: Attach named pilot partner list + outreach owner + execution evidence (`2026-03-21` target).
4. Keep sync discipline using [v22.0 Gate 0 User Action Tracker](../implementation/v22-0-gate-0-user-action-tracker.md) and [v22.0 Gate 0 Evidence Intake Pack](../implementation/v22-0-gate-0-evidence-intake-pack.md).
5. Re-evaluate Gate 0 using [v22.0 Gate 0 Exit Checklist (Decision Control)](../implementation/v22-0-gate-0-exit-checklist.md) after every accepted evidence update.

#### Agent-Executable Follow-Through (Blocked on User Evidence)

These tasks are repo-local and automatable, but they start only after the corresponding human-owned evidence exists:

1. Update Gate 0 trackers and control docs after each accepted `UA-1` / `UA-2` / `UA-3` evidence drop.
2. Sync the integration decision record, approval checklist references, and evidence matrix to the latest blocker state.
3. Re-evaluate the Gate 0 exit checklist and re-run `npm run check:v22-gate0`.
4. Keep pilot API/schema/tests/docs aligned with any approved Gate 0 control changes.

#### Gate 0 Exit Blockers (NO-GO)

1. Candidate partner legal/API terms are not yet attached for C1 clause-level review.
2. Draft retention windows and deletion procedure for C2 now exist in repo, but they are not yet approved or backed by dated verification evidence.
3. D4 partner outreach execution evidence is not yet complete.
4. Baseline metrics are recorded but currently `NULL` for M1/M3 due to zero events in baseline window.

#### Completed in This Cycle

1. Pilot tables created with full CRUD RLS policies (`pilot_contact_attempt_events`, `pilot_referral_events`, `pilot_metric_snapshots`, `pilot_integration_feasibility_decisions`).
2. Legacy `user_metadata` admin gate removed from `bulk_update_service_status`; replaced with `is_admin()` check.
3. Internal pilot endpoints implemented and documented in OpenAPI/architecture docs.
4. Pilot API/schema/metrics tests added and passing.
5. Gate 0 decision control document added and linked across v22 artifacts.
6. Gate 0 user action tracker added and linked from roadmap.
7. Gate 0 evidence intake pack added for C1/C2/D4 submission standardization.
8. Release guard added (`npm run check:v22-gate0`) to block release-tag creation while Gate 0 is `NO-GO` without forcing routine CI red.
9. E2E automation baseline documented and linked in roadmap + v19 execution handoff.
10. Temporary free-tier CI budget mode enabled for Playwright E2E (manual dispatch or `[run-e2e]` on `main`).
11. Gate 0 evidence workspace added for C1/C2/D4 submission handling.
12. Draft C2 retention policy proposal and deletion verification runbook added.
13. Typed retention-policy config and tests added to keep the C2 draft internally consistent.

#### Gate 1 Thresholds (Pilot Cycle 1)

- Failed contact attempts reduced by at least 30% vs baseline.
- Time-to-successful-connection reduced by at least 25%.
- Freshness SLA compliance at least 70%.
- Referral outcome capture at least 50%.
- Fatal data-decay error rate at or below 10%.

---

### v19.0: Launch Preparation ⏸️ ON HOLD (Pending v22 Gate 0)

**Status**: Deployment baseline and automation are complete; remaining manual QA, beta, and launch operations are deferred pending v22 Strategic Gate
**Priority**: HIGH
**Total Effort**: ~30 hours of launch-prep automation/documentation plus user-run execution
**User Execution Effort**: ~30-38 hours over 7+ weeks
**Timeline**: 7-8 weeks (Phase 1 QA → beta testing → launch)
**Completed**: 2026-02-10 (automation & documentation)

Keep launch-prep procedures ready while the live VPS deployment remains stable and v22 determines whether broader launch execution should proceed.

#### Automation Boundary

1. Agent-executable work in this stream is already complete: QA automation, environment validation, launch docs, rollback procedures, communication templates, beta materials, and E2E skip-baseline documentation.
2. Remaining work in this stream is intentionally human-executed: production environment audit, real-user journey testing, top-20 service review, beta operations, and launch communications.
3. Repo-local follow-through can resume once v22 permits it: running automation, updating execution logs/checklists, and fixing issues surfaced by the scripted checks.

---

**📋 USER ACTION REQUIRED:**

**The public deployment baseline is live. The remaining v19 work is manual QA, beta execution, and launch operations when v22 permits.**

**👉 Start here: [v19.0 User Execution Guide](v19-0-user-execution-guide.md)**

**Quick Start:**

1. **Phase 1 QA** (4-6 hours) → Follow `docs/operations/final-qa-procedures.md`
2. **Beta Testing** (4 weeks, 15-20 min/day) → Follow `docs/operations/beta-testing-plan.md`
3. **Launch operations** (when resumed) → Follow `docs/operations/launch-monitoring-checklist.md`

**Detailed step-by-step walkthrough:** [v19.0 User Execution Guide](v19-0-user-execution-guide.md)

---

#### Goals (All Automation & Documentation Complete ✅)

1. ✅ **Final Quality Assurance**: Automation built, awaiting user execution
2. ✅ **User Documentation**: User guide (EN/FR) and FAQ (22 questions) complete
3. ✅ **Launch Safety**: Monitoring checklist, rollback procedures, communication templates ready
4. ✅ **Soft Launch Beta**: 3-phase beta testing plan complete
5. ✅ **Launch Materials**: Press kit, social media templates, assets guide complete

#### Implementation Phases

- **Phase 1** (4-6h): Final Quality Assurance (Automation ✅, User Execution Pending)
  - [x] QA procedures documented
  - [x] Automated QA runner created (`npm run qa:prelaunch` - 10 checks)
  - [x] Environment validator created (`npm run validate:env`)
  - [x] User execution guide created (`docs/operations/phase-1-qa-execution-guide.md`)
  - [ ] Production environment audit (user execution required)
  - [ ] Critical user journey testing (6 scenarios, user execution required)
  - [ ] Data quality final review (top 20 services, user execution required)

- **Phase 1.5** (6h): Pre-Launch Technical Hygiene ✅ **COMPLETE**
  - [x] Add SEO basics (`app/robots.ts` -> `/robots.txt`, `sitemap.ts`, `not-found.tsx`, `error.tsx`, `global-error.tsx`)
  - [x] Add security.txt for responsible disclosure
  - [x] Replace console._ with logger._ in 8 files (7 API routes + FAQ page)
  - [x] Document the E2E automation baseline in [E2E Automation Baseline (2026-03-12)](../testing/e2e-skip-baseline-2026-03-09.md)
  - [x] Enable Dependabot for automated dependency updates
  - [x] Bonus: Fix embeddings generation script to output formatted JSON
  - [x] Follow-up: remove inline default-suite E2E skips and move environment-dependent checks into opt-in automation commands

- **Phase 2** (4-6h): User-Facing Documentation ✅ **COMPLETE**
  - [x] User guide (EN + FR)
  - [x] FAQ (22 questions, EN + FR)
  - [x] Error messages & help text improvements
  - [x] Documentation linked from footer (/user-guide, /faq routes)

- **Phase 3** (3-5h): Launch Monitoring & Safety ✅ **COMPLETE**
  - [x] Launch monitoring checklist
  - [x] Rollback procedures (3 severity levels)
  - [x] Communication templates (5 templates)

- **Phase 4** (3-5h): Soft Launch Strategy ✅ **COMPLETE**
  - [x] Beta testing plan (3-phase: invite, expanded, public)
  - [x] Feedback collection and analysis system

- **Phase 5** (2-3h): Optional Launch Materials ✅ **COMPLETE**
  - [x] Press kit (comprehensive 11,000+ word resource)
  - [x] Social media templates (all platforms, multiple variants)
  - [x] Launch assets guide (complete specifications for designers)

#### Success Criteria

**Phase 1:**

- Production environment audit 100% passed
- All 5 critical user journeys tested successfully
- Top 20 services have complete, accurate data

**Phase 1.5:**

- `robots.txt` implemented alongside `sitemap.ts` and `not-found.tsx`
- `security.txt` added with contact info
- Zero console._ calls in target API routes (all use logger._)
- E2E test skips fixed or explicitly documented as known limitations
- Dependabot enabled and configured

**Phase 2:**

- User guide published in EN and FR
- FAQ covers at least 12 common questions
- All error messages reviewed and improved

**Phase 3:**

- Launch monitoring checklist ready
- Rollback procedures documented for 3 severity levels
- Communication templates prepared

**Phase 4:**

- Beta testing plan covers 3 phases
- Feedback collection system operational
- <5 P0 bugs in Week 1 beta, <10 P1 bugs in Week 2

**Phase 5 (Optional):**

- Press kit available if desired
- Social media assets ready if desired

#### Timeline

**Recommended Schedule:**

- Week 1: Phase 1 (QA) + Phase 1.5 (Technical Hygiene)
- Week 2: Address Phase 1.5 findings, finalize preparations
- Week 3-6: Soft Launch Beta execution
- Week 7: Address beta feedback
- Week 8: Full public launch 🚀

**Note**: Phase 1.5 items are critical blockers identified during 2026-02-09 codebase audit. These must be completed before beta launch.

📄 **Documentation**:

- [v19.0 Launch Preparation Plan](v19-0-launch-preparation.md)
- [v19.0 Phase 1 Execution Handoff (2026-03-09)](../implementation/v19-phase-1-execution-handoff-2026-03-09.md)

---

## ✅ Completed Work

### v18.0: Production Observability & Operational Excellence ✅ COMPLETE

**Status**: All Phases COMPLETE (Phase 3 with PROVISIONAL SLO targets)
**Priority**: COMPLETED
**Total Effort**: ~28 hours
**Completed**: 2026-02-06

Complete the operational foundation for production launch by adding production-grade monitoring, alerting, and operational documentation.

#### Goals

1. ✅ **Complete Circuit Breaker Rollout**: 100% coverage on all API routes (COMPLETE)
2. ✅ **Production Monitoring**: Integrate with Axiom for persistent metrics (COMPLETE)
3. ✅ **Observability Dashboard**: Real-time system health at `/admin/observability` (COMPLETE)
4. ✅ **Alerting System**: Automated Slack notifications for critical issues (COMPLETE)
5. 🔄 **SLO Framework**: Define and track 99.5% uptime, p95 <800ms latency (IN PROGRESS - decision guide created, awaiting user choices)
6. 📋 **Public Status Page**: Deploy Upptime at `status.helpbridge.ca` (PLANNED)
7. ✅ **Operational Runbooks**: Document incident response procedures (COMPLETE)

#### Implementation Phases

- **Phase 1** (8-10h): Complete Circuit Breaker Rollout ✅ **COMPLETE**
  - [x] Protect 8 remaining API routes (5 protected, 3 already covered)
  - [x] Fix 3 failing integration tests (540/540 passing)
  - [x] Document performance baselines (infrastructure ready, user execution pending)
  - [x] Secure metrics endpoint (admin-only in production)

- **Phase 2** (10-12h): Production Monitoring Infrastructure ✅ **COMPLETE**
  - [x] Task 2.1: Integrate Axiom (free tier, 500GB/month) - 4h ✅
  - [x] Task 2.2: Build observability dashboard - 4h ✅
  - [x] Task 2.3: Configure alerting (Slack) - 2h ✅
  - [x] Task 2.4: Create 3 operational runbooks + index - 2h ✅

- **Phase 3** (10h): Service Level Objectives ✅ **COMPLETE** (PROVISIONAL targets)
  - [x] Create SLO decision guide with recommendations - 1h ✅ (2026-02-05)
  - [x] Build SLO monitoring dashboard (PROVISIONAL: 99.5% uptime, p95 <800ms) - 10h ✅ (2026-02-06)
  - [x] SLO configuration module with type-safe targets
  - [x] In-memory SLO tracker (30-day rolling window)
  - [x] Dashboard widgets (SLO Compliance Card, Disclaimer Banner)
  - [x] Slack alerting integration (3 alert types)
  - [x] Health check integration (uptime tracking)
  - [x] SLO violation runbook
  - [x] Comprehensive unit tests (37/37 passing)
  - [ ] Deploy public status page (Upptime) - **DEFERRED** (awaiting domain config)
  - [ ] User confirmation of SLO targets - **PENDING** (awaiting production data review)

- **Phase 4** (2-4h): Operational Documentation ✅ **COMPLETE**
  - [x] Update AGENTS.md with observability patterns
  - [x] Create production deployment checklist
  - [x] Document incident response plan

#### Post-Completion Actions (Optional)

**For Full Production Readiness:**

- ⏸️ **Review SLO Targets**: Confirm or adjust PROVISIONAL targets after 2-4 weeks production data
  - Current: 99.5% uptime, p95 <800ms, 0.5% error budget
  - Update `lib/config/slo-targets.ts` and set `SLO_STATUS = "CONFIRMED"`
- ⏸️ **Deploy Upptime Status Page**: Public status monitoring (requires domain configuration)
  - Domain: Configure `status.helpbridge.ca` subdomain - ~10 min
  - GitHub Fork: Fork upptime/upptime repository - ~5 min

#### Success Criteria

**Phase 1 (COMPLETE):**

- ✅ 100% API route circuit breaker protection (8/8 routes)
- ✅ All tests passing (540/540 tests, zero flakiness)
- ✅ Metrics endpoint secured (admin-only in production)
- ✅ Performance baseline infrastructure ready

**Phase 2 (100% COMPLETE):**

- ✅ Axiom integration live with <5ms overhead (Task 2.1)
- ✅ Observability dashboard functional at `/admin/observability` (Task 2.2)
- ✅ Automated Slack alerts firing correctly (Task 2.3)
- ✅ 3 operational runbooks + index published (Task 2.4)

**Phase 3 (COMPLETE with PROVISIONAL targets):**

- ✅ SLO monitoring dashboard functional with 3-column layout
- ✅ Uptime tracking operational (99.5% target, PROVISIONAL)
- ✅ Error budget tracking (0.5% budget, PROVISIONAL)
- ✅ Latency SLO monitoring (p95 <800ms, PROVISIONAL)
- ✅ Slack alerting for SLO violations (3 alert types, throttled)
- ✅ Comprehensive unit tests (37/37 passing, 100% coverage)
- ✅ SLO violation runbook created
- ✅ Provisional disclaimer banner prompts user review
- ⏸️ Public status page deployment (awaiting domain configuration)

**Phase 4 (100% COMPLETE):**

- ✅ AGENTS.md updated with observability patterns
- ✅ Production deployment checklist created
- ✅ Incident response plan documented

📄 **Documentation**:

- **[v18.0 Complete Implementation Summary](../implementation/v18-0-IMPLEMENTATION-SUMMARY.md)** 📊
- [Roadmap Overview](v18-0/production-observability.md)
- [Phase 1 Complete](../implementation/v18-0-phase-1-COMPLETE.md) ✅
- [Phase 2 Full Plan](../implementation/v18-0-phase-2-implementation-plan.md)
- **[Phase 3 SLO Decision Guide](v18-0-phase-3-slo-decision-guide.md)** 📋
- **[Phase 3 Implementation Summary](../implementation/v18-0-phase-3-implementation-summary.md)** ✅
- [Phase 2 Visual Roadmap](v18-0/v18-0-phase-2-visual-roadmap.md)
- [Task 2.1 Complete](../implementation/v18-0-task-2-1-completion-summary.md) ✅
- [Task 2.2 Complete](../implementation/v18-0-task-2-2-completion-summary.md) ✅
- [Tasks 2.3 & 2.4 Plan](../implementation/v18-0-phase-2-tasks-3-4-implementation-plan.md) ✅
- [Tasks 2.3 & 2.4 Quick Start](v18-0/v18-0-phase-2-final-README.md) ✅
- [Tasks 2.3 & 2.4 Executive Summary](v18-0/v18-0-phase-2-final-executive-summary.md)
- [Phase 2 Executive Summary](v18-0/v18-0-phase-2-executive-summary.md)
- [Phase 4 Complete](../implementation/v18-0-phase-4-COMPLETE.md) ✅

---

## ⏸️ Paused Work

### Data Quality & Enrichment (Manual Process)

**Status**: Absorbed into v21.0 Plan
**Priority**: Now part of v21.0 Phase 1–2
**Reference**: [v21.0 Admissions Portfolio Plan](v21-admissions-portfolio-plan.md)

Data quality tasks (geocoding, French translations, L3 verification, identity tags) have been integrated into the v21.0 plan with specific sequencing, effort estimates, and success criteria. See:

- **Geocoding**: v21.0 Phase 1, P1-3 (target 85–90% coverage)
- **French translations**: v21.0 Phase 2, P2-5 (with native speaker review requirement)
- **L3 verification**: v21.0 Phase 2, P2-4 (target 5–8 confirmed L3s)
- **Identity tags**: v21.0 Phase 3, P3-8 (evidence-based pass on top 30–40 services)

#### Available Tools (unchanged)

```bash
npm run audit:data           # Current service count and gaps
npm run bilingual-check      # Verify French completeness
npm run check-staleness      # Find services needing re-verification
npm run translate:prompt     # Generate translation prompts
npm run translate:parse      # Parse translation output
npm run translate:validate   # Validate translations
npm run geocode              # Geocode addresses (requires OPENCAGE_API_KEY)
npm run audit:l3             # Export L3 verification candidates
```

📄 [Historical Context](archive/2026-01-23-v17-5-data-quality.md)

---

## 📚 Release History

Production-readiness complete (v17.0–v18.0). Platform is resilient, secure, accessible, and performant. See [archive/](archive/) for full implementation details.

### Recent Releases

- **v18.1: Technical Maintenance & Quality Improvements** (2026-02-06)
  - **Security**: Patched 3 high severity tar vulnerabilities (7.5.4 → 7.5.7)
  - **Dependencies**: Updated 187 packages safely via npm update
  - **Test Coverage**: +33 new tests (680 → 713 total, +4.9%)
    - New: rate-limit.test.ts (11 tests, 100% coverage)
    - New: feedback.test.ts (7 tests, 100% coverage)
    - Enhanced: engine.test.ts (+8 tests, lib/ai 72% → 74% coverage)
    - Enhanced: useVoiceInput.test.ts (+7 tests, 41% → 100% coverage)
  - **Documentation**: Updated README.md and AGENTS.md with v18.0 info, fixed 12 outdated references
  - **Code Quality**: Fixed 18 ESLint warnings, maintained 0 TypeScript errors
  - **Impact**: Improved security posture, increased test reliability, enhanced maintainability

- **v18.0: Production Observability & Operational Excellence** (2026-02-06) - **100% COMPLETE**
  - **Phase 1**: Complete circuit breaker rollout (100% API route protection)
  - **Phase 2**: Production monitoring infrastructure (Axiom integration, Slack alerting, runbooks, observability dashboard)
  - **Phase 3**: SLO monitoring dashboard (99.5% uptime, p95 <800ms targets - PROVISIONAL)
  - **Phase 4**: Operational documentation (deployment checklist, incident response plan, PIR templates)
  - **Optional Follow-Ups**: SLO target confirmation (awaiting production data), Upptime status page (awaiting domain config)
  - ADR-019: Production observability and alerting system
  - 140 new tests added (540 → 680 total)
  - ~3,500 lines of operational documentation
  - Automated alerting with throttling (6 alert types)
  - 5 operational runbooks for common incident scenarios
  - Estimated 50% reduction in deployment-related incidents, 40% reduction in MTTR
  - [Implementation Summary](../implementation/v18-0-IMPLEMENTATION-SUMMARY.md)

- **v17.7: Search Quality Testing & Scoring Refinements** (2026-02-03)
  - Comprehensive search quality testing framework (Golden Set + Sampling strategy)
  - 61 deterministic regression tests for search result quality
  - 200-query test runner with detailed analysis and reporting
  - Systemic scoring improvements: intent targeting precision, authority boost refinement, description matching quality
  - Enhanced crisis detection (added "suicidal", "hits me", domestic violence patterns)
  - Synonym expansion for abbreviations (OW, ODSP) with tokenizer allowlist
  - ADR-018: Search quality testing and scoring refinements
  - Test infrastructure: `tests/search/golden-set.test.ts`, `scripts/search-test-runner.ts`
  - Quality report: `tests/fixtures/search-quality-report.md`

- **[v17.6: Authorization Resilience](archive/2026-01-25-v17-6-post-v17-5-enhancements.md)** (2026-01-25)
  - **4 phases complete**: Load testing baselines, circuit breaker integration tests, translation workflow, authorization protection
  - Tiered circuit breaker protection for all 6 authorization functions
  - Fail-secure strategy (high risk) vs fail-open with safe defaults (low risk)
  - 9 circuit breaker integration tests (all passing)
  - 7 translation helper unit tests (all passing)
  - French translation workflow automation (`translate:prompt`, `translate:parse`, `translate:validate`)
  - k6 load testing baseline metrics documented
  - ADR-017: Authorization resilience strategy

- **[v17.5: Performance Tracking & Circuit Breaker](archive/2026-01-25-v17-5-performance-and-resilience.md)** (2026-01-25)
  - **Core resilience infrastructure**: Circuit breaker pattern for Supabase database failures
  - Performance tracking system with p50/p95/p99 latency metrics
  - Health check endpoint (`/api/v1/health`) with circuit breaker status
  - Metrics endpoint (`/api/v1/metrics`) for development/staging observability
  - k6 load testing infrastructure (smoke, sustained load, spike tests)
  - 34 new tests (unit + integration), 100% test coverage for resilience layer
  - ADR-016: Performance tracking and circuit breaker pattern
  - Protected operations: search, analytics, service management, offline sync

### Foundation (v17.0–v17.4)

- [v17.4: Dashboard & Partner Portal](archive/2026-01-25-v17-4-dashboard-partner-portal.md)
- [v17.3: Accessibility Compliance](archive/2026-01-20-v17-3-accessibility.md)
- [v17.2: Internationalization](archive/2026-01-20-v17-2-internationalization.md)
- [v17.1: Test Coverage](archive/2026-01-19-v17-1-test-coverage.md)
- [v17.0: Security & Authorization](archive/2026-01-17-v17-0-security-authorization.md)
- [v16.4: High-Value Improvements](archive/2026-01-15-v16-4-high-value-improvements.md)
- [v16.3: Quality & Tooling](archive/2026-01-15-v16-3-quality-tooling-refresh.md)
- [v16.2: Security Hardening](archive/2026-01-15-v16-2-security-hardening.md)
- [v16.0: Search Ranking](archive/2026-01-14-v16-0-search-ranking-enhancements.md)
- [v15.0: Mobile-Ready Infrastructure](archive/2026-01-13-v15-0-mobile-ready-infrastructure.md)
- [v14.0: Impact, Equity & Trust](archive/2026-01-13-v14-0-impact-equity-trust.md)
- [v13.1: AI Compliance](archive/2026-01-12-v13-1-ai-compliance-remediation.md)
- [v13.0: Secure Data Architecture](archive/2026-01-07-v13-0-librarian-model.md)
- [v12.0: Legal & Compliance](archive/2026-01-02-v12-0-legal-compliance.md)
- [v11.0: Scope Expansion](archive/2026-01-08-v11-0-scope-expansion.md)
- [v10.0: Data Architecture](archive/2026-01-02-v10-0-data-architecture.md)

### 🏆 Key Achievements (v17 Cycle)

**Production Readiness Milestones**:

- ✅ **Zero-downtime resilience**: Circuit breaker prevents cascading failures during DB outages
- ✅ **Comprehensive testing**: 150+ tests across unit, integration, E2E, load, and accessibility
- ✅ **Security hardening**: Tiered authorization with fail-secure defaults, RLS policies, XSS prevention
- ✅ **Performance observability**: p50/p95/p99 metrics, health check API, circuit breaker telemetry
- ✅ **Accessibility compliance**: WCAG 2.1 AA, keyboard navigation, screen reader support
- ✅ **International support**: 7 languages with RTL support for Arabic
- ✅ **Mobile-ready**: PWA with offline support, service worker, IndexedDB caching
- ✅ **Developer experience**: Comprehensive documentation, ADRs, testing guides, automated workflows

---

## ⏸️ Paused Work (Additional)

### v15.1: Mobile App Launch

**Status**: Blocked - Awaiting User Decision
**Blockers**:

- Requires macOS with Xcode for iOS builds
- Requires paid Apple Developer account ($99/year)
- Requires Google Play Developer account ($25 one-time)
- **Total Cost**: $124 first year, then $99/year recurring

**Scope**: Native iOS/Android builds, app store submissions, launch monitoring, production app deployment

**Infrastructure Ready**:

- ✅ Capacitor configuration complete
- ✅ Android project configured
- ✅ iOS project configured (needs macOS to build)
- ✅ PWA fallback fully functional

> [!IMPORTANT]
> **Automation Boundary**: Do not proceed with paid services, special hardware/OS requirements, or major architectural changes without explicit user approval.

---

## 📋 Future Considerations

### v20.0: Technical Excellence & Testing (HIGH PRIORITY - Before Production)

**Status**: MAINTENANCE MODE — autonomous repo-local backlog pass complete; active scope is now limited to E2E suite upkeep plus deferred strategic items
**Priority**: HIGH (technical debt reduction and deeper test coverage)
**Remaining Effort**: ~4-8 hours of periodic maintenance plus deferred work after v22/v21 clarity
**Dependencies**: None for `B6`; deferred items still depend on v22/v21 direction
**Archive**:

- Phase 1 execution details: [2026-02-12-v20-0-phase-1-implementation-plan.md](archive/2026-02-12-v20-0-phase-1-implementation-plan.md)
- Autonomous backlog closeout: [2026-03-12-v20-0-autonomous-backlog-closeout.md](archive/2026-03-12-v20-0-autonomous-backlog-closeout.md)

This roadmap section now tracks only the unfinished v20 scope. Completed testing, security, documentation, and architecture batches are archived in the records above and summarized in [v20.0 Autonomous Backlog Summary (2026-03-12)](../implementation/v20-0-autonomous-backlog-summary-2026-03-12.md).

#### Can Proceed Now (Agent-Executable / Repo-Local)

**Testing depth**

- `B6`: Maintain the skip-free default E2E suite and keep the opt-in production/server-mode suites healthy

**Execution rule**

1. These items are useful regardless of which strategic path v22 takes.
2. They are the default agent-executable backlog when Gate 0 is waiting on external evidence.
3. Each change batch should also run and fix repo-local validation where feasible: `npm run lint`, `npm run type-check`, targeted tests, and build/Vitest checks by default.
4. Leave Playwright execution to CI/manual dispatch while GitHub Actions remains on free-tier budget mode unless a specific browser-only regression needs local reproduction.

#### Defer Until v22/v21 Clarity

**French and search enrichment**

- `C2`: Generate `synthetic_queries_fr` for the remaining services
- `C5`: Populate `access_script_fr` with reviewed translations
- `C6`: Generate and validate `hours_text_fr`

**Architecture**

- `G1`: Move search AI metadata out of JSON and into Supabase-backed storage
- `G3`: Build an admin-facing data quality dashboard

These items are still valuable, but they benefit from the partner, governance, and data-shape decisions that sit in the v22/v21 path. Keep them parked unless those dependencies become clearer.

#### Remaining Success Criteria

- Publish a fresh coverage snapshot and continue moving statement coverage toward 75%
- Keep the default E2E suite skip-free and keep the dedicated opt-in browser suites green in CI/manual validation windows
- Complete advanced French service-data coverage for the highest-value fields
- Close the remaining documentation and operational procedure gaps
- Tighten security and architecture follow-through without creating roadmap drift

---

### v21.0: Admissions Portfolio & Production Launch (PAUSED)

**Status**: PAUSED — Revisit after v22.0 Gate 1 decision
**Priority**: CRITICAL (Admissions Impact)
**Total Effort**: ~85–120 hours (mixed implementation + human-required work)
**Timeline**: 12 weeks (4 phases)
**Dependencies**: v19.0 documentation complete ✅
**Created**: 2026-02-25

Transform the project from "impressive prototype" to "deployed, validated, evidence-backed community tool" with real-world impact metrics and professional portfolio artifacts.

**Context**: Developed through a structured three-pass analysis (comprehensive scan → devil's advocate → steelman → objective synthesis) to maximize medical school application value while ensuring all recommendations are defensible and achievable.

**👉 Detailed Plan: [v21.0 Admissions Portfolio Plan](v21-admissions-portfolio-plan.md)**

#### Strategic Insight

The project now has a live deployment and strong documentation/governance infrastructure. The credibility gap is in **execution and external validation** — named partners, verified L3 services, outcome evidence, and documented professional adoption. Every item prioritizes execution of existing systems over building new ones.

#### Phase Summary

| Phase       | When       | Effort | Theme                                                                                                                                        |
| ----------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 0** | Today      | <2h    | Immediate housekeeping (name on project, EDIA fix, git tags, ABS gap analysis)                                                               |
| **Phase 1** | Week 1     | 15–20h | Early production hardening (crisis test protocol, crisis-path component tests, geocoding, demo video)                                        |
| **Phase 2** | Weeks 2–4  | 25–35h | Governance execution (first verification cycle, L3 outreach, French translations, impact page, project brief)                                |
| **Phase 3** | Weeks 4–8  | 20–30h | External validation (advisory board, professional feedback sessions, community meeting, accessibility audit, published compliance summaries) |
| **Phase 4** | Weeks 8–12 | 25–35h | Evidence portfolio (partner endorsement, service gap analysis, volunteer pilot, grant application, final ABS)                                |

#### Key Design Decisions

- **Crisis test protocol is a deployment blocker** — the most ethically significant feature must be verified before going live
- **Impact page framed around governance metrics, not usage** — low early traffic would backfire; data quality metrics are compelling on day 1
- **User testing reframed as professional consultations** — front-line social workers (not students), framed as consultation (not research) to avoid ethics review requirements
- **French translations require native speaker review** — unreviewed translated crisis access scripts for vulnerable populations create liability
- **Partner endorsement at Week 8+** — must deploy, achieve L3s, and build relationships first
- **Component testing scoped to crisis path** — safety-driven engineering decision, not a coverage percentage target

#### Success Criteria

**Production Evidence:**

- [x] Live production URL with custom domain
- [ ] Crisis detection formally tested (20 scenarios documented)
- [ ] ≥85% geocoding coverage (up from 70%)
- [ ] Public status page operational

**Governance Evidence:**

- [ ] First verification cycle completed and documented
- [ ] ≥5 services at L3 verification (up from 0)
- [ ] French advanced fields completed with native speaker review
- [ ] Identity tag pass documented (with negative findings where applicable)

**External Validation:**

- [ ] ≥1 named advisory board member with relevant credentials
- [ ] Professional feedback sessions documented (n≥3)
- [ ] ≥1 community engagement meeting documented
- [ ] ≥1 partner endorsement letter on file

**Portfolio Artifacts:**

- [ ] ABS-ready STAR narrative (150 words), fully substantiable
- [ ] 1-page project brief for professional referrers
- [ ] 2-minute demo video
- [ ] Impact page live (governance/data-quality framed)
- [ ] PIA and AI compliance summaries published
- [ ] Structural service gap analysis written and shared

---

### v22.1: Post-Launch Search Quality & UX Improvements (Deferred Candidate)

**Priority**: HIGH (After Beta Launch)
**Effort**: ~15-20 hours
**Timeline**: 2-4 weeks post-launch

Improve search quality and user experience based on real-world usage patterns from beta testing.

**Note**: Deferred until v22.0 stage gates pass and launch path is re-confirmed.

#### Goals

1. **Search Quality Monitoring**: Understand when searches fail and why
2. **Expanded Search Vocabulary**: Cover practical crisis terminology users actually use
3. **Geographic Transparency**: Show users when results are incomplete due to missing location data
4. **Partner Feedback Loop**: Automatically alert partners when services need attention

#### Implementation Tasks

- **Task 1** (4-6h): Zero-Results Tracking & Admin Dashboard
  - Wire `zero-results.ts` pattern hashing into analytics table
  - Create admin view: "Top 10 failed query patterns this week" (hashed)
  - Weekly digest email with actionable search quality insights
  - Dashboard widgets: services with <50% helpfulness, categories with high "not found" feedback

- **Task 2** (2-3h): Synonym Dictionary Expansion
  - Add ~90 practical terms based on real zero-results data
  - **Utilities**: "hydro", "bill help", "water bill", "phone bill", "internet"
  - **Documents**: "birth certificate", "ID", "OHIP card", "SIN", "passport"
  - **Childcare**: "daycare", "babysitting", "childcare subsidy", "baby"
  - **Seniors**: "nursing home", "home care", "meals on wheels", "assisted living"
  - **Transportation**: "bus pass", "ride", "accessible transit", "mobility"
  - **Addiction**: "rehab", "aa", "na", "sober", "detox"
  - **Education**: "ged", "literacy", "esl", "tutoring"
  - **Youth**: "runaway", "foster care", "emancipation"

- **Task 3** (2h): Geographic Search Transparency UI
  - Badge in results: "Showing X nearby + Y more without location data"
  - Show services without coordinates at bottom of "near me" results
  - Add "Location unavailable" note instead of silent exclusion

- **Task 4** (3-4h): Feedback Auto-Alerting for Partners
  - Auto-tag feedback by type (data quality vs. user confusion)
  - Email partner when service gets >3 issue reports in 7 days
  - Admin dashboard: "Top 5 services needing attention" widget

#### Success Criteria

- Zero-results tracking captures 100% of failed searches (hashed for privacy)
- Synonym coverage increases from ~30 to ~150 entries
- Geographic filter shows result completeness to users
- Partners receive automated alerts within 24h of threshold breach
- Search quality dashboard shows actionable insights weekly

---

### v23.0: Community Engagement & Content Expansion (Planned)

**Priority**: MEDIUM (Post-Launch, User-Driven)
**Effort**: ~8-10 hours initial setup, ongoing moderation
**Timeline**: 3-6 months post-launch

Enable community-driven service suggestions with moderation workflow.

#### Tasks

- [ ] Public service submission form (authenticated or anonymous with verification)
- [ ] Moderation queue for admin review
- [ ] Auto-suggest services based on "not found" feedback patterns
- [ ] Partner notification when community suggests updates to their services

---

### Observability & Performance (Post-v18.0)

- Real-time performance monitoring dashboard (visualize circuit breaker state, p50/p95/p99 graphs over time)
- Automated load testing in CI (scheduled weekly k6 runs with automatic baseline comparison)
- Performance regression alerts on pull requests (fail builds if latency degrades >20%)
- Lighthouse CI budget checks for bundle size and Core Web Vitals

### Advanced Resilience (Deprioritized)

The following items are over-engineering for current scale and are **not recommended** unless specific production issues emerge:

- ~~Enhanced circuit breaker features (per-operation, dynamic thresholds, predictive)~~ - Current static config works well
- ~~Multi-region resilience (database replica failover)~~ - Single-region Supabase is sufficient for Kingston
- ~~Cached authorization with Redis~~ - In-memory approach is fine at current scale

### API & Integration (Partner-Driven)

The following items should only be pursued if partners express specific needs:

- GraphQL API - **Skip unless requested** (REST is sufficient for current use cases)
- Webhooks - **Wait for partner demand** (no active integrations yet)
- API keys & server-to-server auth - **Wait for third-party integration requests**
- Public API documentation - **Consider** (OpenAPI spec exists at `docs/api/openapi.yaml`, needs publishing)

### Data & Content

- ✅ **Automated data staleness detection** - ALREADY IMPLEMENTED (monthly GitHub Action workflow)
- **Community-driven service suggestions** - See v23.0 planned work above
- **Multi-language support expansion** - Add Korean, Ukrainian based on demographic needs (data-driven decision)
- ~~Enhanced search: Fuzzy matching, typo tolerance~~ - ALREADY IMPLEMENTED (Levenshtein distance, max 2 edits)
- **Voice search improvements** - Consider if user feedback indicates demand

---

## 📖 Using This Roadmap

### For Developers

- **Current work**: Focus on "Active Work" section (currently v22.0 strategic decision gates)
- **Technical reference**: See "Completed Work" for implementation patterns and ADR links
- **Planning**: Review "Future Considerations" for upcoming features
- **Testing**: Run `npm test` for unit/integration; keep Playwright on CI/manual dispatch by default while free-tier budget mode is active

### For Contributors

- Check `CONTRIBUTING.md` for contribution guidelines
- Review ADRs in `docs/adr/` for architectural decisions
- Test commands documented in `AGENTS.md`
- Follow conventional commits (enforced by commitlint)

### For Stakeholders

- Platform is production-ready with v17.6 completion
- Manual data quality work ongoing at user's pace
- Future features prioritized by impact and feasibility
- Mobile app launch available upon user approval (requires paid accounts)

---

---

## 🚨 Pre-Launch Blockers (Must Complete Before Beta)

Based on comprehensive codebase audit (2026-02-09):

### Critical Items (Block Launch)

1. **SEO & Discoverability** (~3-4h)
   - [x] Add `/robots.txt` crawl directives (implemented via `/app/robots.ts`)
   - [x] Add `/app/sitemap.ts` route handler
   - [x] Add `/app/[locale]/not-found.tsx` branded 404 page
   - [x] Add route-level `/app/[locale]/error.tsx` error boundaries

2. **Security Contact** (~15min)
   - [x] Add `/public/.well-known/security.txt` per RFC 9116

3. **Code Quality** (~1h)
   - [x] Replace `console.*` with `logger.*` in 7 API routes:
     - `/app/api/v1/feedback/route.ts`
     - `/app/api/v1/notifications/subscribe/route.ts`
     - `/app/api/v1/notifications/unsubscribe/route.ts`
     - `/app/api/v1/services/export/route.ts`
     - `/app/api/admin/reindex/route.ts`
     - `/app/api/v1/services/[id]/summary/route.ts`
     - `/app/api/v1/analytics/search/route.ts`

4. **Test Reliability** (~4-6h)
   - [x] Remove inline skipped tests from the default E2E suite and move environment-dependent coverage to explicit opt-in commands
   - [x] Known limitations and opt-in suites are documented in the current automation baseline

5. **Dependency Management** (~30min)
   - [x] Add `.github/dependabot.yml` for automated security updates

### Recommended (High Priority, Not Blocking)

6. **Input Validation Hardening** (~1h)
   - Captured in `v20.0` as `F4`
   - Stricten `field_updates: z.record(z.any())` in `/app/api/v1/services/[id]/update-request/route.ts`
   - Use explicit allowed field list instead of `any()`

7. **CORS Configuration** (~30min)
   - Add explicit CORS middleware if API will be consumed externally
   - Can defer if internal-only

---

## 🔄 Roadmap Maintenance

- **Update frequency**: After each version release
- **Archive policy**: Completed roadmaps moved to `archive/` directory
- **Metrics refresh**: Run `npm run audit:data` before updating Current State
- **Last reviewed**: 2026-03-09
- **Last audit**: 2026-03-09 (v22 Gate 0 + roadmap hygiene pass)
