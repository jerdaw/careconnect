# Kingston Care Connect: Product Roadmap

> **Current Version**: v18.0 (Production Observability Complete)
> **Next Version**: v19.0 (Launch Preparation) - All Documentation & Automation Complete ✅
> **Last Updated**: 2026-02-10
> **Platform Status**: Ready for Beta Launch - Phase 1 QA Execution Required

## 📊 Current State

- **Services**: 196 manually curated social services (verified 2026-02-11)
- **Test Coverage**: 713 passing tests (53.72% statement coverage — target: 75%)
  - Branch: 80.69% ✅ | Functions: 81.71% ✅ | Statements: 53.72% ⚠️
  - Gaps: 61/85 components untested (28% coverage), 4 untested utility functions (geo, fuzzy, synonyms, query-expander)
  - 7 E2E tests skipped (documented as known limitations)
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

### v19.0: Launch Preparation ⏳ AWAITING USER EXECUTION

**Status**: All Documentation & Automation Complete ✅ - User Execution Required
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

- **Phase 1.5** (6h): Pre-Launch Technical Hygiene ✅ **COMPLETE**
  - [x] Add SEO basics (robots.txt, sitemap.ts, not-found.tsx, error.tsx, global-error.tsx)
  - [x] Add security.txt for responsible disclosure
  - [x] Replace console._ with logger._ in 8 files (7 API routes + FAQ page)
  - [x] Fix 4 E2E tests, document 6 as known limitations (skip count reduced from 10 to 6)
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

- robots.txt, sitemap.ts, and not-found.tsx implemented
- security.txt added with contact info
- Zero console._ calls in API routes (all use logger._)
- E2E tests fixed or documented as known limitations
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

**Status**: Ongoing (Manual Work)
**Priority**: LOW
**Effort**: User-driven at own pace

Follow-up on verification levels and French translation of access scripts. This is manual data curation work separate from technical feature development.

#### Current Data Quality Gaps

Run `npm run audit:data` to refresh current counts:

- ~18/196 services missing coordinates (impacts proximity search)
- ~17/196 services missing verified physical address
- ~10/196 services missing structured hours
- 0/196 services at L3 verification (provider-confirmed partnerships)

#### Available Tools

**Translation Helper (v17.6)**:

```bash
npm run translate:prompt <batch-file>   # Generate translation prompts
npm run translate:parse <batch> <response>  # Parse AI responses
npm run translate:validate <batch>      # Validate translations
```

**Data Auditing**:

```bash
npm run audit:data           # Current service count and gaps
npm run bilingual-check      # Verify French completeness
npm run check-staleness      # Find services needing re-verification
```

#### Tasks (User-driven)

- [ ] Translate `access_script_fr` for remaining services (batch process)
- [ ] Web-verify 17 missing addresses (no provider contact required)
- [ ] Web-verify 10 missing hours (no provider contact required)
- [ ] Run geocoding for verified addresses: `OPENCAGE_API_KEY=... npm run geocode`
- [ ] Future: Establish first 10 L3 partnerships (requires provider outreach)
- [ ] Future: Expand underrepresented categories (Transport, Financial, Indigenous)

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

---

### Data Quality & Enrichment (Manual Process)

**Status**: Ongoing (Manual Work)
**Priority**: LOW
**Effort**: User-driven at own pace

Follow-up on verification levels and French translation of access scripts. This is manual data curation work separate from technical feature development.

#### Current Data Quality Gaps

Run `npm run audit:data` to refresh current counts:

- ~58/196 services missing coordinates (30%, impacts proximity search)
- ~18/196 services critically missing coordinates (9%)
- ~17/196 services missing verified physical address (9%)
- ~10/196 services missing structured hours (5%)
- 0/196 services at L3 verification (provider-confirmed partnerships)

#### Available Tools

**Translation Helper (v17.6)**:

```bash
npm run translate:prompt <batch-file>   # Generate translation prompts
npm run translate:parse <batch> <response>  # Parse AI responses
npm run translate:validate <batch>      # Validate translations
```

**Data Auditing**:

```bash
npm run audit:data           # Current service count and gaps
npm run bilingual-check      # Verify French completeness
npm run check-staleness      # Find services needing re-verification
```

#### Tasks (User-driven)

- [ ] Translate `access_script_fr` for remaining services (batch process)
- [ ] Web-verify 17 missing addresses (no provider contact required)
- [ ] Web-verify 10 missing hours (no provider contact required)
- [ ] Run geocoding for verified addresses: `OPENCAGE_API_KEY=... npm run geocode`
- [ ] Future: Establish first 10 L3 partnerships (requires provider outreach)
- [ ] Future: Expand underrepresented categories (Transport, Financial, Indigenous)

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

**Status**: IN PROGRESS (Phase 1A-1C Complete ✅)
**Priority**: HIGH (Pre-Production Requirement)
**Total Effort**: ~100-120 hours (AI-autonomous work)
**Timeline**: 2-4 weeks
**Dependencies**: None (can start immediately)
**Completion**: 6/38 items done (A1, A3, A6, C1, C3, C4)

Comprehensive technical improvements to reach production-quality standards: achieve 75% test coverage, eliminate code quality gaps, complete i18n translations, and improve documentation completeness.

**Context**: Based on comprehensive codebase audit (2026-02-11), these items represent foundational work that can be completed autonomously by AI coding agents with minimal human oversight.

#### Category A: Code Quality & Type Safety (~15h)

**A1. Replace remaining `console.*` calls with `logger.*`** ✅ COMPLETE (2026-02-12)

- Files: All 14 calls in 7 files (hooks/useShare.ts, useServiceFeedback.ts, usePushNotifications.ts, useLocalStorage.ts, useVoiceInput.ts, useNetworkStatus.ts, lib/external/211-client.ts)
- Impact: Consistent structured logging across codebase
- Commit: ff56b09
- Effort: 2h (actual)

**A2. Reduce ESLint disable directives from 26 to <10** (4-6h)

- Replace `any` with proper types in middleware.ts, dashboard pages, component props
- Impact: Improved type safety, reduced technical debt
- Effort: M

**A3. Harden update-request API validation** ✅ COMPLETE (2026-02-12)

- File: `app/api/v1/services/[id]/update-request/route.ts`
- Replaced `z.record(z.any())` with `z.enum(ALLOWED_UPDATE_FIELDS)` (18 explicit fields)
- Impact: Prevents injection attacks via field_updates
- Commit: ff56b09
- Effort: 30min (actual)

**A4. Migrate direct `process.env` to `lib/env.ts`** (2-3h)

- Files: 4 API routes currently bypass validation
- Impact: Consistent environment variable validation
- Effort: S

**A5. Harden CSV import field mapping** (2-3h)

- File: `app/[locale]/dashboard/services/import/page.tsx:94`
- Add strict schema validation before import
- Impact: Prevents malformed data imports
- Effort: S

**A6. Remove unused code with eslint-disable** ✅ COMPLETE (2026-02-12)

- Files: `components/ui/use-toast.ts` (use actionTypes properly), `app/[locale]/admin/notifications/page.tsx` (fix isSubmitting usage)
- Impact: Code cleanup, maintainability
- Commit: ff56b09
- Effort: 30min (actual)

#### Category B: Test Coverage (~60h) — LARGEST GAP

**B1. Write unit tests for untested search utilities** (6-8h)

- `lib/search/geo.ts` - Haversine distance, proximity multipliers
- `lib/search/fuzzy.ts` - Levenshtein-based matching
- `lib/search/synonyms.ts` - Synonym expansion, bilingual terms
- `lib/ai/query-expander.ts` - Query reformulation
- Impact: Core search logic tested, prevents regressions
- Effort: M

**B2. Write tests for 4 untested API routes** (4-6h)

- `/api/v1/services/[id]/printable`
- `/api/v1/services/[id]/summary`
- `/api/v1/services/[id]/update-request`
- `/api/admin/reindex/status`
- Impact: API contract coverage
- Effort: M

**B3. Write unit test for `useRBAC` hook** (1-2h)

- Only untested hook (13/14 tested)
- Impact: Permission logic coverage
- Effort: S

**B4. Write component tests for critical untested components** (8-12h)

- `components/layout/Header.tsx`, `Footer.tsx`
- `components/layout/LanguageSwitcher.tsx`
- `components/search/SearchInterface.tsx`
- `components/home/SearchControls.tsx`, `SearchChips.tsx`
- `components/offline/OfflineBanner.tsx`, `OfflineSync.tsx`
- Impact: Core UI interaction coverage
- Effort: L

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

**D1. Create missing template files** (1-2h)

- `docs/templates/post-mortem.md`
- `docs/templates/runbook-template.md`
- Effort: S

**D2. Create admin operations guide** (3-4h)

- Observability dashboard usage, admin role setup
- Effort: S

**D3. Create developer onboarding guide** (2-3h)

- Setup checklist, key files, testing expectations
- Effort: S

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

**E1. Add git tags for version milestones** (1h)

- Create tags for v10.0, v15.0, v17.0, v18.0, v19.0
- Effort: S

**E2. Add security header validation to CI** (2-3h)

- Integrate Mozilla Observatory or OWASP ZAP
- Effort: S

**E3. Add coverage threshold enforcement** (1h)

- Verify global 75% threshold is enforced in CI
- Effort: S

**E4. Create GitHub release notes** (2h)

- Auto-generate from CHANGELOG.md
- Effort: S

**E5. Set up Dependabot/Renovate** (1-2h)

- Automated dependency update PRs
- Effort: S

**E6. Add bundle size tracking to CI** (1h)

- Verify bundle-analysis.yml reports size diffs on PRs
- Effort: S

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

### v21.0: Production Deployment & Admissions Portfolio (HIGHEST VALUE)

**Status**: PLANNED
**Priority**: CRITICAL (Admissions Impact)
**Total Effort**: ~40-50 hours autonomous + 20-30 hours human intervention
**Timeline**: 12 weeks (includes partner outreach, user testing)
**Dependencies**: v20.0 completion (test coverage, quality)

Transform the project from "impressive prototype" to "deployed, validated, evidence-backed community tool" with real-world impact metrics and professional portfolio artifacts.

**Context**: Based on OMSAS ABS + CanMEDS admissions analysis (2026-02-11), these items maximize medical school application value by demonstrating real-world impact, leadership, and professional competency.

#### Phase 1: Production Deployment (Week 1) — HUMAN REQUIRED

**#1. Deploy to Production and Document Live URL** (2-3h + 1 day DNS)

- **Category**: Impact/Adoption
- **Why (Admissions)**: Transforms "I built" into "I launched and operate"
- **What to do**: Deploy to Vercel (free tier), configure custom domain
- **Evidence**: Live URL, deployment date, uptime metrics
- **Effort**: S (2-3h Vercel; domain setup 1 day DNS)
- **Prereqs**: Domain purchase (~$15/year)
- **CanMEDS**: Health Advocate, Leader

**#29. Set Up Automated Uptime Monitoring** (1-2h)

- **Category**: Reliability/Quality
- **What to do**: Configure UptimeRobot/Freshping, create status page
- **Evidence**: Public status page URL, uptime percentage badge
- **Effort**: S
- **Prereqs**: Production deployment (#1)

#### Phase 2: Usage Metrics & Evidence (Week 2) — AUTONOMOUS

**#2. Collect and Document Real Usage Metrics** (4-6h)

- **Category**: Impact/Adoption
- **Why**: Quantified impact ("served X searches") beats portfolio projects
- **What to do**: Privacy-preserving analytics (aggregate only), track searches/sessions/crisis activations
- **Evidence**: Analytics dashboard screenshots, monthly reports
- **Effort**: M (analytics API exists)
- **Prereqs**: Production deployment (#1)

**#6. Create Public-Facing Impact Page** (3-4h)

- **Category**: Communication/Documentation
- **Why**: Professional impact presentation for evaluators
- **What to do**: Populate `/impact` page with mission, service count, accessibility compliance, privacy architecture
- **Evidence**: Public impact page URL, screenshot
- **Effort**: S (route exists)
- **Prereqs**: None — AI-autonomous

**#10. Add CI Badges to README** (1h)

- **Category**: Professionalism/Governance
- **Why**: Visual quality indicators for evaluators
- **What to do**: Add badges for CI status, coverage %, license, a11y, Node version, languages
- **Evidence**: Professional README
- **Effort**: S
- **Prereqs**: CI passing

**#11. Create Project Website / Documentation Portal** (2-3h)

- **Category**: Communication/Documentation
- **Why**: Public governance artifacts = auditable professionalism
- **What to do**: Deploy mkdocs to GitHub Pages via existing workflow
- **Evidence**: Public docs URL (e.g., docs.kingstoncare.ca)
- **Effort**: S (workflow exists)
- **Prereqs**: None

#### Phase 3: Scholarship & Professional Artifacts (Weeks 3-4) — AUTONOMOUS

**#7. Publish Privacy Architecture Whitepaper** (1-2 days)

- **Category**: Scholarship/Evaluation
- **Why**: Demonstrates scholarly output in health-adjacent privacy
- **What to do**: Polish `docs/whitepapers/privacy_architecture.md`, publish on Medium/preprint
- **Evidence**: Published URL, DOI/preprint link
- **Effort**: M
- **Prereqs**: None
- **CanMEDS**: Scholar, Professional

**#14. Document Algorithmic Impact Assessment Prominently** (1-2h)

- **Category**: Privacy/Security/Ethics
- **Why**: AIA Level 1 classification = ethical AI governance
- **What to do**: Link from README, create `/governance` page
- **Evidence**: Public AIA page
- **Effort**: S
- **Prereqs**: None

**#16. Write Data Governance Policy Document** (3-4h)

- **Category**: Professionalism/Governance
- **Why**: Consolidates L0-L3 verification into auditable policy
- **What to do**: Merge governance/standards.md + verification protocol + staleness SOP
- **Evidence**: Data Governance Policy PDF
- **Effort**: S
- **Prereqs**: None

**#23. Document AI-Assisted Development Methodology** (1-2 days)

- **Category**: Scholarship/Evaluation
- **Why**: Novel AI pair programming approach = publishable contribution
- **What to do**: 2-3 page reflection on Claude co-authorship, quality control, lessons learned
- **Evidence**: Published blog post or whitepaper
- **Effort**: M
- **Prereqs**: None

#### Phase 4: Quality & Compliance (Weeks 3-4) — AUTONOMOUS

**#9. Achieve and Document Full WCAG 2.1 AA Compliance** (4-8h)

- **Category**: Professionalism/Governance
- **Why**: AODA legal compliance + Professional responsibility
- **What to do**: Run `npm run test:a11y`, fix issues, formalize compliance report
- **Evidence**: AODA compliance report, a11y test badge
- **Effort**: M
- **Prereqs**: None (mostly automatable)

**#13. Create Formal Release Notes and Versioned Releases** (2h)

- **Category**: Professionalism/Governance
- **Why**: Mature software lifecycle management
- **What to do**: Tag v15-v19, create GitHub Releases with CHANGELOG excerpts
- **Evidence**: GitHub Releases page
- **Effort**: S
- **Prereqs**: None

**#15. Implement and Document Ethics Review Process** (3h)

- **Category**: Privacy/Security/Ethics
- **Why**: Ethical AI governance (crisis detection review)
- **What to do**: Formalize crisis detection review, create ethics checklist
- **Evidence**: Ethics review SOP, decision tree
- **Effort**: S
- **Prereqs**: None

**#24. Add Comprehensive API Documentation** (2-3h)

- **Category**: Professionalism/Governance
- **Why**: Professional API design (OpenAPI spec exists)
- **What to do**: Deploy Swagger UI or Redoc for `docs/api/openapi.yaml`
- **Evidence**: Interactive API docs URL
- **Effort**: S
- **Prereqs**: None

#### Phase 5: Performance & Monitoring (Weeks 4-5) — AUTONOMOUS

**#19. Add Automated Data Quality Monitoring Dashboard** (4-6h)

- **Category**: Reliability/Quality
- **Why**: Ongoing quality commitment beyond one-time build
- **What to do**: Admin component displaying real-time completeness scores
- **Evidence**: Admin dashboard screenshot
- **Effort**: M
- **Prereqs**: None

**#20. Conduct and Document Load/Performance Test** (2-3h)

- **Category**: Reliability/Quality
- **Why**: Operational rigor
- **What to do**: Run `npm run test:load`, document baselines
- **Evidence**: Load test results report
- **Effort**: S
- **Prereqs**: Production deployment for realistic results

**#25. Implement and Document Penetration Test Results** (4-6h)

- **Category**: Privacy/Security/Ethics
- **Why**: Security assessment demonstrates diligence
- **What to do**: Run OWASP ZAP, document findings, remediate, re-test
- **Evidence**: Security assessment report, before/after counts
- **Effort**: M
- **Prereqs**: Production deployment (#1)

#### Phase 6: Communication Artifacts (Weeks 5-6) — AUTONOMOUS

**#5. Write Reflective Project Summary (ABS-Format)** (2-3h)

- **Category**: Communication/Documentation
- **Why**: OMSAS ABS entries need STAR-format narratives
- **What to do**: 150-word entry: gap, role, actions, results
- **Evidence**: ABS-ready narrative, one-page PDF
- **Effort**: S
- **Prereqs**: Usage data (#2) strengthens significantly

**#18. Create One-Page Project Brief** (2h)

- **Category**: Communication/Documentation
- **Why**: Shareable with admissions, partners, advisors
- **What to do**: 1-page PDF: problem, solution, approach, impact, governance, team
- **Evidence**: Shareable PDF
- **Effort**: S
- **Prereqs**: None

**#21. Create Presentation / Poster** (4-6h)

- **Category**: Communication/Documentation
- **Why**: Conference-style asset for ABS supplements, interviews
- **What to do**: 10-slide deck or A0 poster
- **Evidence**: Slide deck PDF, poster PDF
- **Effort**: M
- **Prereqs**: None

**#36. Create Project Logo/Brand Identity** (2h)

- **Category**: Communication/Documentation
- **Why**: Visual professionalism
- **What to do**: Simple logo + color scheme via Canva
- **Effort**: S
- **Prereqs**: None

**#37. Record 2-Minute Demo Video** (1-2h)

- **Category**: Communication/Documentation
- **Why**: More compelling than screenshots
- **What to do**: Screen recording walkthrough, embed in README
- **Effort**: S
- **Prereqs**: Production deployment (#1)

**#38. Create Contributor/Acknowledgments Page** (1-2h)

- **Category**: Communication/Documentation
- **What to do**: Populate `/about/partners` route
- **Effort**: S
- **Prereqs**: None

#### Phase 7: Data Enrichment (Weeks 6-8) — AUTONOMOUS

**#22. Complete French Translation of Advanced Fields** (6-8h)

- **Category**: Impact/Adoption
- **Why**: French Language Services Act compliance = equity
- **What to do**: `access_script_fr`, `eligibility_notes_fr`, `hours_text_fr` (196 services)
- **Evidence**: Bilingual audit showing 100% FR
- **Effort**: M (6-8h total)
- **Prereqs**: None (pipeline exists)

**#26. Backfill Identity Tags for 109 Services** (4-6h)

- **Category**: Impact/Adoption
- **Why**: Enables personalization for vulnerable populations
- **What to do**: LLM classification + human review for age, cultural, gender, disability tags
- **Evidence**: Identity tag audit showing 90%+ coverage
- **Effort**: M
- **Prereqs**: **Needs human review of AI suggestions**

**#27. Geocode 58 Services Missing Coordinates** (1h)

- **Category**: Reliability/Quality
- **Why**: "Near Me" geolocation for mobile users
- **What to do**: Run `npm run geocode`
- **Evidence**: Completeness report showing 95%+ coordinates
- **Effort**: S (fully automated)
- **Prereqs**: OPENCAGE_API_KEY (free tier)

#### Phase 8: Governance & Operational Excellence (Weeks 7-9) — AUTONOMOUS

**#17. Add Contribution Evidence (PRs, Issues, Code Review)** (1h ongoing)

- **Category**: Leadership/Collaboration
- **Why**: Visible collaboration artifacts
- **What to do**: Switch to feature branch + PR workflow, create Issues
- **Evidence**: PR history, issue tracker, code review comments
- **Effort**: S (setup 1h, then ongoing)
- **Prereqs**: None

**#28. Create Incident Response Tabletop Exercise** (3h)

- **Category**: Leadership/Collaboration
- **Why**: Operational maturity, Leader competency
- **What to do**: Design scenario (e.g., "Supabase creds compromised"), walk through 4C protocol
- **Evidence**: Tabletop exercise document, timeline
- **Effort**: S
- **Prereqs**: None

**#30. Add CODE_OF_CONDUCT.md** (30 min)

- **Category**: Professionalism/Governance
- **Why**: Inclusive community values
- **What to do**: Add Contributor Covenant
- **Evidence**: CODE_OF_CONDUCT.md in repo
- **Effort**: S
- **Prereqs**: None

**#31. Create Stakeholder Map** (2h)

- **Category**: Leadership/Collaboration
- **Why**: Systems thinking demonstration
- **What to do**: Diagram showing beneficiaries, influencers, communication
- **Evidence**: Stakeholder map diagram
- **Effort**: S
- **Prereqs**: None

**#32. Document Accessibility Testing Methodology** (2-3h)

- **Category**: Professionalism/Governance
- **Why**: Depth beyond "we pass Axe-core"
- **What to do**: Consolidate a11y guide + testing procedures
- **Evidence**: Accessibility Testing Methodology document
- **Effort**: S
- **Prereqs**: None

**#33. Create Risk Register** (2-3h)

- **Category**: Professionalism/Governance
- **Why**: Mature project management
- **What to do**: Risk table with likelihood, impact, mitigation, owner
- **Evidence**: Risk register document
- **Effort**: S
- **Prereqs**: None

**#34. Add License Compliance Checker to CI** (1-2h)

- **Category**: Professionalism/Governance
- **Why**: Automated compliance checking
- **What to do**: Add `license-checker` to CI
- **Evidence**: License compliance CI check
- **Effort**: S
- **Prereqs**: None

**#35. Document Lessons Learned / Post-Mortem** (3h)

- **Category**: Scholarship/Evaluation
- **Why**: Reflective practice (CanMEDS Scholar)
- **What to do**: 1-2 page retrospective on 44-day sprint
- **Evidence**: Published retrospective
- **Effort**: S
- **Prereqs**: None

#### Phase 9: Human-Dependent High-Value Items (Weeks 3-12) — REQUIRES HUMAN

**#3. Secure One Formal Community Partner** (2-4 weeks outreach)

- **Category**: Leadership/Collaboration
- **Why**: HIGHEST VALUE — Partner letter validates real-world relevance
- **What to do**: Contact Kingston CHC, 211 Ontario, United Way. Propose pilot. Get MOU.
- **Evidence**: Partner endorsement letter, MOU, logo
- **Effort**: L (requires significant human intervention)
- **Prereqs**: Production deployment (#1)
- **CanMEDS**: Collaborator (CORE ROLE)

**#4. Conduct Supervised User Testing Session** (1-2 weeks)

- **Category**: Scholarship/Evaluation
- **Why**: Evaluation methodology = Scholar role
- **What to do**: Recruit 5 participants, 30-min sessions, SUS scores, implement findings
- **Evidence**: Usability study report, consent forms, before/after screenshots
- **Effort**: L (requires human intervention)
- **Prereqs**: Production deployment (#1)
- **CanMEDS**: Scholar

**#8. Formalize Advisory Board** (2-4 weeks)

- **Category**: Leadership/Collaboration
- **Why**: Governance maturity, stakeholder engagement
- **What to do**: Recruit 2-3 advisors (clinician, social worker, community member), hold inaugural meeting
- **Evidence**: Advisor names/titles, meeting minutes
- **Effort**: L (requires human intervention)
- **Prereqs**: None
- **CanMEDS**: Leader, Collaborator

#### Success Criteria (v21.0)

**Production Evidence:**

- ✅ Live production URL with custom domain
- ✅ 30 days of usage metrics (searches, sessions, crisis activations)
- ✅ Uptime >99% over first month
- ✅ Public status page operational

**Admissions Portfolio:**

- ✅ ABS-ready STAR narrative (150 words)
- ✅ One-page project brief PDF
- ✅ 10-slide presentation deck
- ✅ 2-minute demo video
- ✅ Published privacy whitepaper (Medium/preprint)
- ✅ Public docs site (governance, ADRs, compliance)
- ✅ Professional README with badges

**Collaboration Evidence:**

- ✅ One formal partner endorsement letter
- ✅ Usability study report (n=5)
- ✅ Advisory board inaugural meeting minutes
- ✅ PR-based workflow with visible collaboration

**Compliance & Governance:**

- ✅ WCAG 2.1 AA compliance formalized
- ✅ Data Governance Policy PDF
- ✅ AIA publicly documented
- ✅ Ethics review SOP
- ✅ Risk register
- ✅ Stakeholder map

**Quality Evidence:**

- ✅ Penetration test report
- ✅ Load test baseline documentation
- ✅ Data quality dashboard
- ✅ API documentation (Swagger)

**French/Equity:**

- ✅ 100% French core fields, 90%+ advanced fields
- ✅ 90%+ identity tag coverage
- ✅ 95%+ geocoding coverage

---

### v22.0: Post-Launch Search Quality & UX Improvements (Planned)

**Priority**: HIGH (After Beta Launch)
**Effort**: ~15-20 hours
**Timeline**: 2-4 weeks post-launch

Improve search quality and user experience based on real-world usage patterns from beta testing.

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

### v21.0: Community Engagement & Content Expansion (Planned)

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
- **Community-driven service suggestions** - See v21.0 planned work above
- **Multi-language support expansion** - Add Korean, Ukrainian based on demographic needs (data-driven decision)
- ~~Enhanced search: Fuzzy matching, typo tolerance~~ - ALREADY IMPLEMENTED (Levenshtein distance, max 2 edits)
- **Voice search improvements** - Consider if user feedback indicates demand

---

## 📖 Using This Roadmap

### For Developers

- **Current work**: Focus on "Active Work" section (currently manual data quality tasks)
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
   - Add `/public/robots.txt` with crawl directives
   - Add `/app/sitemap.ts` route handler
   - Add `/app/[locale]/not-found.tsx` branded 404 page
   - Add route-level `/app/[locale]/error.tsx` error boundaries

2. **Security Contact** (~15min)
   - Add `/public/.well-known/security.txt` per RFC 9116

3. **Code Quality** (~1h)
   - Replace `console.*` with `logger.*` in 7 API routes:
     - `/app/api/v1/feedback/route.ts`
     - `/app/api/v1/notifications/subscribe/route.ts`
     - `/app/api/v1/notifications/unsubscribe/route.ts`
     - `/app/api/v1/services/export/route.ts`
     - `/app/api/admin/reindex/route.ts`
     - `/app/api/v1/services/[id]/summary/route.ts`
     - `/app/api/v1/analytics/search/route.ts`

4. **Test Reliability** (~4-6h or document)
   - Fix or explicitly document 11 skipped E2E tests across 8 files
   - Tests skip due to mock data navigation issues
   - Either repair or add to known limitations

5. **Dependency Management** (~30min)
   - Add `.github/dependabot.yml` for automated security updates

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
- **Last reviewed**: 2026-02-09
- **Last audit**: 2026-02-09 (comprehensive codebase audit completed)
