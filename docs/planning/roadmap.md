# Kingston Care Connect: Product Roadmap

> **Current Version**: v18.0 (Production Observability Complete)
> **Next Milestone**: v22.0 (Non-Duplicate Value Decision Plan)
> **Last Updated**: 2026-03-09
> **Platform Status**: Strategic Repositioning — v22.0 Decision-Gated Planning

## 📊 Current State

- **Services**: 196 manually curated social services (verified 2026-02-11)
- **Test Coverage**: 974 passing tests (component coverage improving)
  - Branch: Coverage metrics pending update | Functions: Pending | Statements: Pending
  - Gaps: 56/85 components untested (34% coverage - up from 28%), 4 untested utility functions (geo, fuzzy, synonyms, query-expander)
  - 7 E2E tests skipped (documented as known limitations)
  - Recent: +80 component tests (OfflineBanner, LanguageSwitcher, SearchChips, Header, Footer)
- **Load Testing**: k6 infrastructure in place, baseline metrics pending documentation
- **Resilience**: 100% circuit breaker protection on all API routes and database operations
- **Security**: 0 vulnerabilities, all dependencies patched (tar 7.5.7)
- **Accessibility**: WCAG 2.1 AA compliant (automated testing via Axe-core)
- **Languages**: 7 locales (EN, FR, ZH-Hans, AR, PT, ES, PA)
  - French Coverage: 100% core (name_fr, description_fr), 0% advanced (access_script_fr, hours_text_fr, eligibility_notes_fr)
  - 5 non-EN/FR locales missing ~2 i18n keys each
- **Offline-Ready**: PWA with IndexedDB fallback and background sync
- **Observability**: Production monitoring (Axiom), automated alerting (Slack, 6 alert types), SLO monitoring (PROVISIONAL targets), 5 operational runbooks, deployment procedures, incident response plan
- **Data Quality**:
  - Coordinates: 70.4% (58/196 missing — impacts geolocation)
  - Email: 17.9% (161/196 missing — contact channel gap)
  - Identity Tags: 44.4% (109/196 missing — personalization limited)
  - French Synthetic Queries: 36.2% (125/196 missing — semantic search gap)
- **Deployment Status**: Pre-production (not deployed, no real-world usage metrics)

---

## 🎯 Active Work

### v22.0: Non-Duplicate Value Decision Plan 🔄 ACTIVE

**Status**: PHASE 0 IN PROGRESS — Step 1 sign-off locked; baseline execution + conditional integration controls pending
**Priority**: CRITICAL (Strategic Non-Duplication with 211)
**Total Effort**: 90-day decision cycle (~13 weeks)
**Timeline**: Phase 0 (2 weeks) + Phase 1 (8 weeks) + Phase 2 decision cycle
**Dependencies**: v22 objective evaluation artifacts + integration feasibility decision
**Created**: 2026-02-27
**Current State**: Pilot DB schema, RLS policies, hardened admin function, internal pilot APIs, and pilot test suite are implemented and validated. Step 1 decision locks are complete; baseline execution remains blocked in this workspace without Supabase credentials, and conditional integration controls are open.

Reposition KCC from potential directory duplication to measurable last-mile outcome value (connection success, reliability, referral completion), with explicit kill criteria if value is not demonstrated.

**👉 Detailed Plan: [v22.0 Non-Duplicate Value Decision Plan](v22-0-non-duplicate-value-decision-plan.md)**
**👉 Approval Checklist: [v22.0 Step 1 Approval Checklist](v22-0-approval-checklist.md)**
**👉 Phase 0 Execution Spec: [v22.0 Phase 0 Implementation Plan](../implementation/v22-0-phase-0-implementation-plan.md)**

#### Gate-Oriented Objectives

1. Prove non-duplicate value vs 211 on measurable connection outcomes.
2. Validate privacy-safe integration feasibility with 211 data pathways.
3. Keep strict stop conditions for initiatives that do not outperform baseline.

#### Immediate Next Steps (Phase 0)

1. Execute baseline M1/M3 queries in Supabase environment and write values into `v22-0-phase-0-baseline-report-2026-03-09.md`.
2. Complete integration conditional controls C1/C2 (`2026-03-21` target) before any external integration activation.
3. Close remaining external-claim re-validation entries with primary-source citations.
4. Confirm named pilot partner list and outreach owner assignment for D4 execution.

#### Operational Follow-Up (One-Time)

1. On next login to desktop WSL clone, resync to rewritten `main` history:
   - `git fetch origin`
   - `git checkout main`
   - `git reset --hard origin/main`

#### Completed in This Cycle

1. Pilot tables created with full CRUD RLS policies (`pilot_contact_attempt_events`, `pilot_referral_events`, `pilot_metric_snapshots`, `pilot_integration_feasibility_decisions`).
2. Legacy `user_metadata` admin gate removed from `bulk_update_service_status`; replaced with `is_admin()` check.
3. Internal pilot endpoints implemented and documented in OpenAPI/architecture docs.
4. Pilot API/schema/metrics tests added and passing.

#### Gate 1 Thresholds (Pilot Cycle 1)

- Failed contact attempts reduced by at least 30% vs baseline.
- Time-to-successful-connection reduced by at least 25%.
- Freshness SLA compliance at least 70%.
- Referral outcome capture at least 50%.
- Fatal data-decay error rate at or below 10%.

---

### v19.0: Launch Preparation ⏸️ ON HOLD (Pending v22 Gate 0)

**Status**: All Documentation & Automation Complete ✅ - Execution Deferred Pending v22 Strategic Gate
**Priority**: HIGH
**Total Effort**: ~30 hours (100% complete)
**User Execution Effort**: ~30-38 hours over 7+ weeks
**Timeline**: 7-8 weeks (Phase 1 QA → beta testing → launch)
**Completed**: 2026-02-10 (automation & documentation)

Finalize all pre-launch preparations to safely transition from development to production with real users.

---

**📋 USER ACTION REQUIRED:**

**All documentation is complete. You now need to execute the procedures.**

**👉 Start here: [v19.0 User Execution Guide](v19-0-user-execution-guide.md)**

**Quick Start:**

1. **Phase 1 QA** (4-6 hours) → Follow `docs/operations/final-qa-procedures.md`
2. **Beta Testing** (4 weeks, 15-20 min/day) → Follow `docs/operations/beta-testing-plan.md`
3. **Full Launch** (After scorecard >4.0) → Follow `docs/operations/launch-monitoring-checklist.md`

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

- **Phase 1.5** (6h): Pre-Launch Technical Hygiene ⚠️ **NEAR COMPLETE**
  - [x] Add SEO basics (`app/robots.ts` -> `/robots.txt`, `sitemap.ts`, `not-found.tsx`, `error.tsx`, `global-error.tsx`)
  - [x] Add security.txt for responsible disclosure
  - [x] Replace console._ with logger._ in 8 files (7 API routes + FAQ page)
  - [ ] Fix or document remaining E2E test skips (current: 7 skipped tests)
  - [x] Enable Dependabot for automated dependency updates
  - [x] Bonus: Fix embeddings generation script to output formatted JSON

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
6. 📋 **Public Status Page**: Deploy Upptime at `status.kingstoncare.ca` (PLANNED)
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
  - [x] Update CLAUDE.md with observability patterns
  - [x] Create production deployment checklist
  - [x] Document incident response plan

#### Post-Completion Actions (Optional)

**For Full Production Readiness:**

- ⏸️ **Review SLO Targets**: Confirm or adjust PROVISIONAL targets after 2-4 weeks production data
  - Current: 99.5% uptime, p95 <800ms, 0.5% error budget
  - Update `lib/config/slo-targets.ts` and set `SLO_STATUS = "CONFIRMED"`
- ⏸️ **Deploy Upptime Status Page**: Public status monitoring (requires domain configuration)
  - Domain: Configure `status.kingstoncare.ca` subdomain - ~10 min
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

- ✅ CLAUDE.md updated with observability patterns
- ✅ Production deployment checklist created
- ✅ Incident response plan documented

📄 **Documentation**:

- **[v18.0 Complete Implementation Summary](../implementation/v18-0-IMPLEMENTATION-SUMMARY.md)** 📊
- [Roadmap Overview](v18-0-production-observability.md)
- [Phase 1 Complete](../implementation/v18-0-phase-1-COMPLETE.md) ✅
- [Phase 2 Full Plan](../implementation/v18-0-phase-2-implementation-plan.md)
- **[Phase 3 SLO Decision Guide](v18-0-phase-3-slo-decision-guide.md)** 📋
- **[Phase 3 Implementation Summary](../implementation/v18-0-phase-3-implementation-summary.md)** ✅
- [Phase 2 Visual Roadmap](../planning/v18-0-phase-2-visual-roadmap.md)
- [Task 2.1 Complete](../implementation/v18-0-task-2-1-completion-summary.md) ✅
- [Task 2.2 Complete](../implementation/v18-0-task-2-2-completion-summary.md) ✅
- [Tasks 2.3 & 2.4 Plan](../implementation/v18-0-phase-2-tasks-3-4-implementation-plan.md) ✅
- [Tasks 2.3 & 2.4 Quick Start](../planning/v18-0-phase-2-final-README.md) ✅
- [Tasks 2.3 & 2.4 Executive Summary](../planning/v18-0-phase-2-final-executive-summary.md)
- [Phase 2 Executive Summary](../planning/v18-0-phase-2-executive-summary.md)
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
npm run translate:parse      # Parse AI responses
npm run translate:validate   # Validate translations
npm run geocode              # Geocode addresses (requires OPENCAGE_API_KEY)
npm run audit:l3             # Export L3 verification candidates
```

📄 [Historical Context](archive/2026-01-23-v17-5-data-quality.md)

---

## ✅ Completed Work

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

### Recent Releases

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

## ⏸️ Paused Work

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

**Status**: IN PROGRESS (Phase 1A-1J Complete ✅)
**Priority**: HIGH (Pre-Production Requirement)
**Total Effort**: ~100-120 hours (AI-autonomous work)
**Timeline**: 2-4 weeks
**Dependencies**: None (can start immediately)
**Completion**: 21/38 items done (A1, A2, A3, A4, A5, A6, B1, B2, B3, C1, C3, C4, D1, D3, E1, E2, E3, E4, E5, E6)
**Note**: Crisis-path component testing (B4 subset) and French translations (C5, C6) are now also sequenced in the [v21.0 Admissions Portfolio Plan](v21-admissions-portfolio-plan.md) as deployment prerequisites (Phase 1) and governance execution tasks (Phase 2). Remaining v20.0 items (B5–B9, C2, D2, D4–D6, F1–F3, G1–G3) can proceed in parallel.

Comprehensive technical improvements to reach production-quality standards: achieve 75% test coverage, eliminate code quality gaps, complete i18n translations, and improve documentation completeness.

**Context**: Based on comprehensive codebase audit (2026-02-11), these items represent foundational work that can be completed autonomously by AI coding agents with minimal human oversight.

#### Category A: Code Quality & Type Safety (~15h)

**A1. Replace remaining `console.*` calls with `logger.*`** ✅ COMPLETE (2026-02-12)

- Files: All 14 calls in 7 files (hooks/useShare.ts, useServiceFeedback.ts, usePushNotifications.ts, useLocalStorage.ts, useVoiceInput.ts, useNetworkStatus.ts, lib/external/211-client.ts)
- Impact: Consistent structured logging across codebase
- Commit: ff56b09
- Effort: 2h (actual)

**A2. Reduce ESLint disable directives from 26 to <10** ✅ COMPLETE (2026-02-12)

- Reduced from 23 to 12 directives (48% reduction, excluding tests/worker.ts)
- Files: middleware.ts (CookieOptions), hooks/useServices.ts (SupportedLocale), app/api/admin/reindex/route.ts (ReturnType), components/ui/section.tsx (refactored types), app/api/v1/analytics/route.ts (AnalyticsEvent), components/services/TrustPanel.tsx (Provenance)
- Remaining 12 blocked by missing Supabase type definitions
- Impact: Improved type safety, reduced technical debt
- Commit: e18ff97
- Effort: 2h (actual)

**A3. Harden update-request API validation** ✅ COMPLETE (2026-02-12)

- File: `app/api/v1/services/[id]/update-request/route.ts`
- Replaced `z.record(z.any())` with `z.enum(ALLOWED_UPDATE_FIELDS)` (18 explicit fields)
- Impact: Prevents injection attacks via field_updates
- Commit: ff56b09
- Effort: 30min (actual)

**A4. Migrate direct `process.env` to `lib/env.ts`** ✅ COMPLETE (2026-02-12)

- Files: 13 API routes migrated (admin/data, admin/reindex, admin/reindex/status, admin/save, cron/export-metrics, health, v1/analytics, v1/feedback/[id], v1/health, v1/metrics, v1/services/[id], v1/services/[id]/update-request, v1/services/route)
- Replaced all `process.env.NEXT_PUBLIC_*`, `process.env.CRON_SECRET`, `process.env.NODE_ENV` with validated `env.*`
- Impact: Type-safe environment validation, eliminates non-null assertions
- Commit: 3a858f0
- Effort: 1.5h (actual)

**A5. Harden CSV import field mapping** ✅ COMPLETE (2026-02-12)

- Files: `lib/schemas/service-csv-import.ts` (new), `app/[locale]/dashboard/services/import/page.tsx`, `tests/lib/schemas/service-csv-import.test.ts` (new)
- Created CSVImportRowSchema with strict field validation, header normalization (30+ variations), contact method requirements
- Enhanced import page: validation summary, field-level errors, visual status indicators, logger integration
- Added 32 comprehensive test cases covering validation scenarios
- Impact: Prevents SQL injection and malformed data via validated CSV imports
- Commit: f57aa70
- Effort: 2.5h (actual)

**A6. Remove unused code with eslint-disable** ✅ COMPLETE (2026-02-12)

- Files: `components/ui/use-toast.ts` (use actionTypes properly), `app/[locale]/admin/notifications/page.tsx` (fix isSubmitting usage)
- Impact: Code cleanup, maintainability
- Commit: ff56b09
- Effort: 30min (actual)

#### Category B: Test Coverage (~60h) — LARGEST GAP

**B1. Write unit tests for untested search utilities** ✅ COMPLETE (2026-02-12)

- ✅ `lib/search/geo.ts` - Haversine distance, proximity multipliers (20 tests)
- ✅ `lib/search/fuzzy.ts` - Levenshtein-based matching (24 tests)
- ✅ `lib/search/synonyms.ts` - Synonym expansion, bilingual terms (24 tests)
- ✅ `lib/ai/query-expander.ts` - Query reformulation with AI engine mocking (23 tests)
- Impact: Core search logic tested, prevents regressions
- Commits: c272018 (geo, fuzzy, synonyms), 8215ebc (query-expander)
- Effort: 2.5h actual (6-8h estimated)

**B2. Write tests for 4 untested API routes** ✅ COMPLETE (2026-02-12)

- Created tests/api/v1/services/update-request.test.ts (9 tests)
- Created tests/api/admin/reindex-status.test.ts (9 tests)
- Note: printable and summary routes already had tests
- Tests cover: auth, validation, error handling, edge cases, metric calculations
- Impact: API contract coverage, 18 new tests
- Commit: 95f8b37
- Effort: 2h (actual)

**B3. Write unit test for `useRBAC` hook** ✅ COMPLETE (2026-02-12)

- All untested hook now tested (14/14 hooks tested)
- 20 comprehensive tests covering all 4 roles, permissions, hierarchy, self-modification restrictions, memoization
- Impact: Permission logic coverage complete
- Commit: c272018
- Effort: 30min (actual)

**B4. Write component tests for critical untested components** (8-12h) [✅ COMPLETE]

Completed (145 tests across 8 components):

- ✅ `components/layout/Header.tsx` (18 tests) - navigation, auth states, mobile menu, skip link
- ✅ `components/layout/Footer.tsx` (19 tests) - layout sections, links, locale handling, accessibility
- ✅ `components/layout/LanguageSwitcher.tsx` (16 tests) - locale selection, RTL support, popover interaction
- ✅ `components/home/SearchChips.tsx` (17 tests) - saved search display, click/remove interactions
- ✅ `components/ui/OfflineBanner.tsx` (10 tests) - offline state, sync functionality, accessibility
- ✅ `components/home/SearchControls.tsx` (22 tests) - category selection, location toggle, open now, accessibility
- ✅ `components/offline/OfflineSync.tsx` (15 tests) - initial sync, requestIdleCallback, online events, offline prewarm
- ✅ `components/home/SearchBar.tsx` (28 tests) - input interaction, save button, voice search, accessibility

Component coverage improved from 28% to 38% (32/85 components tested).

- Impact: Core UI interaction coverage complete
- Commits: 1095e84 (first 5 components), 68fc85f (final 3 components)
- Effort: L (8h actual)

**B5. Add smoke tests for 40+ untested components** (10-15h)

- Render + basic interaction + a11y assertions via `getByRole()`
- Impact: Component coverage from 28% to ~60%
- Effort: L

**B6. Fix/stabilize 7 skipped E2E tests** (6-8h)

- Update selectors in multi-lingual, offline, dashboard, about tests
- Add Supabase mock for data-integrity tests in CI
- Impact: E2E reliability
- Effort: M

**B7. Add error scenario / unhappy path tests** (6-8h)

- Timeout, network failure, partial failure, malformed input tests
- Impact: Resilience testing
- Effort: M

**B8. Integration test for feedback workflow** (3h)

- End-to-end: submit → triage → resolve
- Effort: S

**B9. Integration test for service update request** (3h)

- Partner submits → admin reviews → applies changes
- Effort: S

**Coverage Goal**: Achieve 75% statement coverage (current: 53.72%)

#### Category C: i18n & Data Enrichment (~20h)

**C1. Backfill missing i18n keys in 5 locales** ✅ COMPLETE (2026-02-12)

- Added 13 keys per locale (not 2 as initially estimated): UserGuide (title, description), FAQ (title, description), Footer.quickLinks (resources, userGuide, faq), Search (searchHint + 5 help items)
- All 7 locales now at 846/846 keys (100% parity)
- Translations: Arabic (RTL), Simplified Chinese, Spanish, Portuguese, Punjabi (Gurmukhi)
- Commit: 75285bf
- Effort: 2h (actual)

**C2. Generate French synthetic queries for 125 services** (3-4h)

- 71/196 services have `synthetic_queries_fr`; 125 need them
- Use `npm run translate:prompt` + LLM batch pipeline
- Impact: French semantic search recall +40%
- Effort: M

**C3. Expand crisis keyword list** ✅ COMPLETE (2026-02-12)

- Expanded from 34 to 50 keywords (47% increase)
- Added suicide/self-harm: "suicidal ideation", "suicidal thoughts", "self-injury", etc.
- Added French crisis terms: "je veux mourir", "me tuer", "violence conjugale", etc.
- Added violence/safety: "sexual abuse", "threatened", "stalking", "human trafficking"
- Impact: Broader crisis detection coverage
- Commit: 6816797
- Effort: 1.5h (actual)

**C4. Expand synonym dictionary** ✅ COMPLETE (2026-02-12)

- Expanded from 40 to 54 synonym groups (35% increase)
- Added 14 new groups: housing (unhoused, eviction), financial (cerb, ei, tax), practical (id, transportation, childcare, clothing), seniors (home care, assisted living), common (free, appointment, interpreter)
- Impact: Better recall for housing, financial, practical, seniors queries
- Commit: 6816797
- Effort: 1.5h (actual)
- Impact: Search vocabulary coverage
- Effort: S

**C5. Populate `access_script_fr` for 196 services** (4-6h)

- Use translation pipeline: export → LLM translate → parse → validate
- Impact: French users get self-advocacy scripts
- Effort: M

**C6. Auto-generate `hours_text_fr` from structured hours** (2-3h)

- Translate day names, format patterns
- Impact: French hours descriptions
- Effort: S

#### Category D: Documentation Gaps (~15h)

**D1. Create missing template files** ✅ COMPLETE (2026-02-12)

- Created `docs/templates/post-mortem.md` with comprehensive incident review structure
- Created `docs/templates/runbook-template.md` with operational runbook format
- Both templates follow existing docs/templates/ patterns with YAML frontmatter
- Impact: Consistent documentation for incidents and operational procedures
- Commit: 7cae83e
- Effort: 30min (actual)

**D2. Create admin operations guide** (3-4h)

- Observability dashboard usage, admin role setup
- Effort: S

**D3. Create developer onboarding guide** ✅ COMPLETE (2026-02-12)

- Expanded CONTRIBUTING.md from 67 to 470+ lines
- Added sections: quick start, philosophy, architecture, tech stack, directories, critical files, workflow, testing expectations, data management, code style, common pitfalls, boundaries
- Impact: Comprehensive developer resource, reduces onboarding friction
- Commit: 70c24df
- Effort: 2h (actual)

**D4. Add GDPR compliance documentation** (2-3h)

- International user consideration alongside PIPEDA
- Effort: S

**D5. Create database migration procedures** (2-3h)

- Schema change workflow, rollback procedures
- Effort: S

**D6. Document performance baselines** (2-3h)

- Fill in 4 PENDING entries in `docs/testing/performance-baselines.md`
- Effort: S

#### Category E: CI/CD & DevOps (~10h)

**E1. Add git tags for version milestones** ✅ COMPLETE (2026-02-12)

- Created annotated tags for v10.0, v15.0, v17.0, v18.0, v19.0
- Tags include detailed descriptions of each version's features
- Tags NOT pushed to remote (local only for now)
- Impact: Better version navigation and release tracking
- Effort: 15min (actual)

**E2. Add security header validation to CI** ✅ COMPLETE (2026-02-12)

- Created custom validation script (scripts/validate-security-headers.ts)
  - Validates all 7 security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy, X-DNS-Prefetch-Control
  - Checks CSP directives completeness (9 required directives)
  - Validates HSTS max-age minimum threshold (1 year)
  - Warns about known issues (unsafe-inline, unsafe-eval for WebLLM)
  - Parses next.config.ts dynamically, no external dependencies
- Added npm script: validate:security-headers
- Integrated into CI workflow (static-analysis job)
- Comprehensive documentation (docs/development/security-headers.md)
  - Header explanations and rationale
  - Modification procedures with examples
  - Browser testing guide
  - Troubleshooting section
- Impact: Prevents security header misconfiguration, blocks deployments with weak headers
- Commit: 90d436f
- Effort: 2.5h (actual)

**E3. Add coverage threshold enforcement** ✅ COMPLETE (2026-02-12)

- CI now runs tests with coverage (npm run test:coverage)
- Coverage reports uploaded as artifacts
- Realistic thresholds set: 50% statements/lines, 80% branches/functions
- Per-file thresholds for critical paths (search 90%, eligibility 95%)
- Created comprehensive coverage strategy guide (docs/testing/coverage-strategy.md)
- Impact: PRs that reduce coverage below thresholds now fail CI
- Commit: c0390ac
- Effort: 1h (actual)

**E4. Create GitHub release notes** ✅ COMPLETE (2026-02-12)

- Created generate-release-notes.js script for parsing CHANGELOG.md
  - Extracts release notes for specific version
  - Formats for GitHub with footer and links
  - Supports JSON output and file export
  - CLI with help, version, and options
- Created release.yml workflow for automated releases
  - Triggers on version tags (v*.*.\*)
  - Generates notes from CHANGELOG.md automatically
  - Creates GitHub release without manual intervention
  - Uploads release notes as artifact (90 days retention)
- Comprehensive release process guide (docs/development/release-process.md)
  - Standard workflow, semantic versioning, changelog best practices
  - Manual and automated release procedures
  - Pre-release support (beta, alpha, RC)
  - Release checklist and troubleshooting
- Added npm script: release:notes for local generation
- Impact: Automated release process, consistent release notes, reduced overhead
- Commit: bedd64c
- Effort: 2h (actual)

**E5. Set up Dependabot/Renovate** ✅ COMPLETE (2026-02-12)

- Enhanced .github/dependabot.yml with better grouping (production-patch, production-minor, dev-dependencies)
- Increased PR limit from 5 to 10, added scheduled time (09:00 UTC Monday)
- Created dependabot-auto-merge.yml workflow for safe auto-merge
  - Auto-approves patch updates and dev minor updates
  - Auto-merges patch updates after CI passes
  - Comments on PRs requiring manual review
- Comprehensive dependency management guide (docs/development/dependency-management.md)
  - Review checklists, common scenarios, security update handling
  - Troubleshooting, best practices, metrics
- Impact: Reduces maintenance burden, estimated 2-3 hours/month saved
- Commit: 8a46ef9
- Effort: 1.5h (actual)

**E6. Add bundle size tracking to CI** ✅ COMPLETE (2026-02-12)

- Enhanced bundle-analysis.yml workflow with comparison and PR comments
- Configured @next/bundle-analyzer in next.config.ts
- Created compare-bundle-size.js script for baseline comparison
- Automatic PR comments with detailed size diffs
- 30-day artifact retention for historical tracking
- Warning thresholds: +10KB or +5% increase
- Created comprehensive bundle size tracking guide (docs/development/bundle-size-tracking.md)
- Impact: Developers get immediate visibility into bundle size impact, preventing performance regressions
- Commit: adbeb64
- Effort: 1.5h (actual)

#### Category F: Security & Privacy (~6h)

**F1. Add OWASP dependency-check to CI** (2h)

- Deeper scanning than `npm audit`
- Effort: S

**F2. Add automated CSP header validation** (2h)

- E2E test for security headers
- Effort: S

**F3. Add rate limiting tests for all API endpoints** (2-3h)

- Extend from search to feedback, analytics, admin routes
- Effort: S

#### Category G: Code Architecture (~10h)

**G1. Move AI metadata from JSON to Supabase** (4-6h)

- TODO at `lib/search/data.ts:72`
- synthetic_queries → database
- Effort: M

**G2. Extract shared enhancer function** (2h)

- TODO at `hooks/useServices.ts:115`
- Effort: S

**G3. Create data quality dashboard component** (4-6h)

- Automated field completeness scores
- Display in admin panel
- Effort: M

#### Success Criteria

- ✅ Test coverage ≥75% statements (current: 53.72%)
- ✅ Zero `console.*` calls in production code
- ✅ All 7 E2E tests passing or documented as known limitations
- ✅ French coverage: 100% core fields, 90%+ advanced fields
- ✅ All ESLint disable directives justified or removed
- ✅ Git tags for all major versions
- ✅ Coverage enforcement in CI
- ✅ Security scanning in CI
- ✅ Documentation gaps closed (templates, guides, procedures)

---

### v21.0: Admissions Portfolio & Production Launch (PAUSED)

**Status**: PAUSED — Revisit after v22.0 Gate 1 decision
**Priority**: CRITICAL (Admissions Impact)
**Total Effort**: ~85–120 hours (mix of autonomous + human-required work)
**Timeline**: 12 weeks (4 phases)
**Dependencies**: v19.0 documentation complete ✅
**Created**: 2026-02-25

Transform the project from "impressive prototype" to "deployed, validated, evidence-backed community tool" with real-world impact metrics and professional portfolio artifacts.

**Context**: Developed through a structured three-pass analysis (comprehensive scan → devil's advocate → steelman → objective synthesis) to maximize medical school application value while ensuring all recommendations are defensible and achievable.

**👉 Detailed Plan: [v21.0 Admissions Portfolio Plan](v21-admissions-portfolio-plan.md)**

#### Strategic Insight

The project has exceptional documentation, governance design, and technical infrastructure. The credibility gap is entirely in **execution** — no deployment, no users, no named partners, no verified services at L3. Every item prioritizes execution of existing systems over building new ones.

#### Phase Summary

| Phase       | When       | Effort | Theme                                                                                                                                        |
| ----------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 0** | Today      | <2h    | Immediate housekeeping (name on project, EDIA fix, git tags, ABS gap analysis)                                                               |
| **Phase 1** | Week 1     | 15–20h | Pre-deployment critical path (crisis test protocol, crisis-path component tests, geocoding, deploy, demo video)                              |
| **Phase 2** | Weeks 2–4  | 25–35h | Governance execution (first verification cycle, L3 outreach, French translations, impact page, project brief)                                |
| **Phase 3** | Weeks 4–8  | 20–30h | External validation (advisory board, professional feedback sessions, community meeting, accessibility audit, published compliance summaries) |
| **Phase 4** | Weeks 8–12 | 25–35h | Evidence portfolio (partner endorsement, service gap analysis, volunteer pilot, grant application, final ABS)                                |

#### Key Design Decisions

- **Crisis test protocol is a deployment blocker** — the most ethically significant feature must be verified before going live
- **Impact page framed around governance metrics, not usage** — low early traffic would backfire; data quality metrics are compelling on day 1
- **User testing reframed as professional consultations** — front-line social workers (not students), framed as consultation (not research) to avoid ethics review requirements
- **French translations require native speaker review** — AI-translated crisis access scripts for vulnerable populations create liability without quality review
- **Partner endorsement at Week 8+** — must deploy, achieve L3s, and build relationships first
- **Component testing scoped to crisis path** — safety-driven engineering decision, not a coverage percentage target

#### Success Criteria

**Production Evidence:**

- [ ] Live production URL with custom domain
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
- **Testing**: Run `npm test` for unit/integration, `npm run test:e2e:local` for E2E

### For Contributors

- Check `CONTRIBUTING.md` for contribution guidelines
- Review ADRs in `docs/adr/` for architectural decisions
- Test commands documented in `CLAUDE.md`
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

4. **Test Reliability** (~4-6h or document)
   - [ ] Resolve or document 7 skipped E2E tests (current repo state)
   - [x] Known limitations are documented for current skip set

5. **Dependency Management** (~30min)
   - [x] Add `.github/dependabot.yml` for automated security updates

### Recommended (High Priority, Not Blocking)

6. **Input Validation Hardening** (~1h)
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
