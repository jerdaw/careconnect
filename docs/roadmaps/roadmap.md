# Kingston Care Connect: Roadmap

> **Current Version**: v17.4 (Dashboard & Partner Portal Complete)
> **Last Updated**: 2026-01-23

---

## v17.0: Production Readiness - Security & Authorization

**Status**: Completed (2026-01-20)
**Priority**: CRITICAL

### Scope

#### Security Fixes (BLOCKING)

- [x] **API Authorization Bug**: Add `org_id` ownership checks to service PUT/DELETE endpoints
  - File: `app/api/v1/services/[id]/route.ts`
  - Users can currently modify/delete ANY service (horizontal privilege escalation)
- [x] **Admin Role Verification**: Replace `NODE_ENV` checks with proper admin role verification
- [x] **Rate Limit Persistence**: Migrate in-memory rate limiting to persistent store (Vercel KV/Redis)
- [x] **Service Export Authentication**: Require auth on `/api/v1/services/export` (exposes embeddings)

#### API Completeness

- [x] **PATCH Endpoint**: Add partial update support for `/api/v1/services/{id}`
- [x] **Soft Deletes**: Implement soft delete (mark as deleted) instead of hard delete
- [x] **Error Response Standardization**: Unify all API error responses to consistent format
- [x] **Deprecate Legacy Endpoints**: Add 301 redirects from `/api/feedback` to `/api/v1/feedback`
- [x] **Remove Unused Endpoints**: Delete `/api/v1/submissions` mock endpoint

### Success Criteria

- Zero horizontal privilege escalation vulnerabilities
- All API routes have proper authorization checks
- Rate limiting survives serverless cold starts
- Error responses follow consistent schema

---

## v17.1: Test Coverage & Quality Gates

**Status**: Completed (2026-01-19)
**Priority**: HIGH

### Summary

Implemented comprehensive test coverage improvements, raising overall coverage from 45% to 75%+ through systematic testing of critical paths:

- **Next.js 15 Testing Patterns**: Created standardized SSR mocking strategy (ADR-008) and centralized mock setup
- **Search Engine Core**: Achieved 65%+ coverage on data loading, orchestration, and vector similarity
- **AI System**: Extracted WebLLM logic for testability, reached 85% coverage on query refinement
- **Offline Infrastructure**: Achieved 80%+ coverage on feedback sync, cache, and IndexedDB operations
- **Component Testing**: Added comprehensive tests for ChatAssistant, EmergencyModal, SearchBar, SearchResultsList, ClaimFlow
- **API Routes**: Added tests for admin routes, notifications, and service endpoints
- **Integration Tests**: Created 9 user journey scenarios covering search, AI, offline, and auth flows

### Key Achievements

- 89 test files, 442 passing tests
- Created centralized test fixtures in `tests/fixtures/`
- Documented testing patterns in ADR-008
- CI pipeline passing with coverage gating

See [archive/2026-01-19-v17-1-test-coverage.md](archive/2026-01-19-v17-1-test-coverage.md) for implementation details.

### Success Criteria

- ✅ Overall coverage: 45% → 75%+
- ✅ `lib/search/**`: Maintained 65%+ threshold
- ✅ `lib/ai/**`: Reached 85% threshold
- ✅ `lib/offline/**`: Reached 75%+
- ✅ Zero critical paths without test coverage

---

## v17.2: Internationalization Completion

**Status**: Completed (2026-01-20)
**Priority**: HIGH

### Summary

Completed all translation gaps for 5 EDIA locales (ZH-HANS, AR, PT, ES, PA) using AI-powered translation. All locales now have full parity with the English source.

Key achievements:

- **Translation Gaps Resolved**: 126 missing keys per locale translated across all EDIA languages
- **Offline Page Localization**: Moved `/app/offline/` to `/app/[locale]/offline/` with full i18n support
- **RTL Support**: Arabic offline page properly displays right-to-left
- **AI Translation Workflow**: Established AI-powered translation as the standard approach (no external API costs)

> [!NOTE]
> **External Translation APIs (Future)**: Infrastructure for DeepL/Google Translate is documented in the detailed roadmap. Do not pursue without explicit user approval.

See [archive/2026-01-20-v17-2-internationalization.md](archive/2026-01-20-v17-2-internationalization.md) for implementation details.

### Success Criteria

- ✅ `npm run i18n-audit` passes with zero missing keys
- ✅ Offline page displays correctly in all 7 locales
- ✅ RTL layout works for Arabic in offline mode

---

## v17.3: Accessibility Compliance (WCAG 2.1 AA / AODA)

**Status**: Completed (2026-01-20)
**Priority**: HIGH

### Summary

Achieved full WCAG 2.1 Level AA compliance across core user journeys. Resolved critical gaps in form accessibility, modal focus management, and color contrast.

Key achievements:

- **100% Green Accessibility CI**: Integrated `@axe-core/playwright` and `eslint-plugin-jsx-a11y` into the CI pipeline (50+ passed audits).
- **Standardized Form Accessibility**: Implemented `AccessibleFormField` with robust ARIA support (`aria-describedby`, `aria-invalid`) across all user-facing forms.
- **Modal Logic Refactor**: Migrated `EmergencyModal` and others to Radix UI `Dialog` primitives for native focus trapping and keyboard navigation.
- **Improved Contrast & Navigation**: Resolved 15+ WCAG 2.1 AA color contrast violations and standardized skip-links across all pages.
- **Compliance Documentation**: Published the KCC Accessibility Statement and AODA Compliance Report.

See [archive/2026-01-20-v17-3-accessibility.md](archive/2026-01-20-v17-3-accessibility.md) for implementation details.

### Scope

#### Form Accessibility (CRITICAL)

- [x] **FormField Component**: Add `aria-describedby`, `aria-invalid`, `aria-required`
- [x] **Error Linking**: Connect error messages to inputs via `aria-describedby`
- [x] **Required Indicators**: Add `aria-required="true"` to required fields
- [x] **Fieldset/Legend**: Group related form fields properly

#### Modal/Dialog Accessibility

- [x] **EmergencyModal**: Add `role="dialog"`, `aria-modal`, `aria-labelledby`
- [x] **Migrate to Radix Dialog**: Replace manual focus trap with Radix primitives
- [x] **Escape Key Handling**: Document keyboard shortcuts

#### Image Accessibility

- [x] **Alt Text Audit**: Add meaningful alt text to 80+ images
- [x] **Decorative Images**: Mark decorative images with `alt=""`

#### Testing & Tooling

- [x] **JSX A11y Plugin**: Add `eslint-plugin-jsx-a11y` to catch violations
- [x] **Expand E2E Tests**: Add 15+ accessibility test cases
- [x] **Form Testing**: Test all forms with screen readers
- [x] **Color Contrast Tests**: Add automated contrast verification

### Success Criteria

- All forms have proper ARIA attributes
- Axe-core reports zero critical/serious violations
- AODA compliance checklist complete
- ESLint catches accessibility violations

---

## v17.4: Dashboard & Partner Portal Completion

**Status**: Completed (2026-01-25)
**Priority**: HIGH

### Summary

Completed all 4 phases of the Dashboard & Partner Portal implementation, achieving full production readiness with comprehensive RBAC, data isolation, and admin improvements.

Key achievements:

- **Phase 1 (RLS Extensions)**: Implemented dashboard-specific RLS policies for feedback, analytics, and notifications with partner data isolation
- **Phase 2 (Dashboard Features)**: Created settings page, service CRUD operations, member management, and notifications database integration
- **Phase 3 (Admin Improvements)**: Enhanced admin service form, added reindex progress tracking, push notification targeting, and action logging
- **Phase 4 (RBAC)**: Implemented 4-tier role hierarchy (owner/admin/editor/viewer) with 19 granular permissions, ownership transfer, and centralized authorization following ADR-007

> [!NOTE]
> **ADR Compliance**: Phase 4 underwent comprehensive audit and fixes to ensure compliance with ADR-007 (Authorization), ADR-005 (Type Safety), and ADR-014 (Structured Logging). See `docs/implementation/v17-4-phase4-audit-fixes.md` for details.

See [archive/2026-01-25-v17-4-dashboard-partner-portal.md](archive/2026-01-25-v17-4-dashboard-partner-portal.md) for complete implementation details.

### Success Criteria

- ✅ All dashboard navigation links functional
- ✅ Partners only see their own data (RLS enforced)
- ✅ Full service CRUD operations working
- ✅ RBAC system with 4 roles and 19 permissions
- ✅ Atomic ownership transfer implemented
- ✅ Centralized authorization patterns
- ✅ Admin panel uses database (not JSON files)

---

## v17.5: Data Quality & Enrichment

**Status**: In Progress
**Priority**: HIGH

See the detailed plan: `docs/roadmaps/2026-01-17-v17-5-data-quality.md`.
Deep Research ingestion record: `docs/roadmaps/archive/2026-01-23-v17-5-ai-output-ingestion.md`.

### Scope

#### Critical Data Gaps (Snapshot: 196 services)

- [x] **Geographic Scope**: 0 missing `scope` field (done)
- [ ] **Coordinates**:
  - 58/196 missing `coordinates` (any reason; includes virtual/confidential/multi-location)
  - 18/196 missing `coordinates` (required for Kingston physical distance search)
  - 17/196 missing physical `address` (primary blocker before geocoding can run)
  - Track + workflow: `docs/roadmaps/v17-5-coordinates/README.md` (run `npm run audit:coords`)
- [x] **Access Scripts**: 0/196 missing `access_script` (content present; UI surface still needed)

#### Accessibility Data

- [x] **Plain Language Flag**: 0 missing `plain_language_available` field (done; type/schema wiring complete)
- [ ] **Structured Hours**: 11/196 missing structured `hours` object (10 active); track via `npm run audit:hours`
  - Track + workflow: `docs/roadmaps/v17-5-hours/README.md` (run `npm run audit:hours`)

#### Non-IRL Confirmations (Web Verification)

These are “confirm via official web sources” tasks (no provider outreach required).

- **Addresses to verify (Phase 3):** run `npm run audit:coords` and fix `missing_address` items (do not invent addresses; use `virtual_delivery: true` when appropriate)
  - `kfpl-rideau-heights`
  - `kingston-pregnancy-care`
  - `alzheimer-society-kfla`
  - `autism-ontario-east`
  - `cnib-kingston`
  - `kfla-children-services`
  - `kingston-east-community-centre`
  - `kingston-humane-society`
  - `st-john-ambulance-kingston`
  - `red-cross-kingston`
  - `habitat-for-humanity-kingston`
  - `odsp-kingston`
  - `service-canada-kingston`
  - `service-ontario-kingston`
  - `kingston-police-non-emerg`
  - `opp-frontenac`
  - `coast-mental-health`
- **Hours to verify (Phase 5):** run `npm run audit:hours` and resolve remaining missing structured `hours` + `hours_text` (use strict evidence; avoid seasonality-induced false “Open Now”)
  - `alzheimer-society-kfla`
  - `autism-ontario-east`
  - `cnib-kingston`
  - `kfla-children-services`
  - `kingston-east-community-centre`
  - `st-john-ambulance-kingston`
  - `red-cross-kingston`
  - `habitat-for-humanity-kingston`
  - `service-ontario-kingston`
  - `geneva-centre-autism`

#### IRL Confirmations (Provider Outreach)

These are “confirm by contacting the org” tasks (email/phone/form), needed for L3 upgrades.

- [ ] **Establish L3 Services**: 0/196 at provider-confirmed level
  - Target major Crisis/Health providers for official partnership
- [ ] **L4 Gold Standard**: Identify candidates for third-party audit (governance concept; not in code yet)

- v17.5 Phase 6 tracking:
  - Tracker: `data/verification/l3-candidates.csv` (no PII / no private communications in git)
  - Workspace: `docs/roadmaps/v17-5-verification/README.md`
  - Generate suggestions: `npm run audit:l3` → `docs/roadmaps/v17-5-verification/outputs/l3-candidate-suggestions.json`

#### Category Expansion

- [ ] **Transport Services**: Currently only 2 (target: 5+)
- [ ] **Financial Services**: Currently only 4 (target: 8+)
- [ ] **Indigenous Services**: Currently only 3 (target: 8+)

### Success Criteria

- 90%+ services have coordinates
- 70%+ services have structured hours
- 100% services have access scripts and they are visible on service detail pages
- At least 10 services at L3 verification

---

## v17.6: PWA Enhancement

**Status**: 🟡 Implemented (Release Verification Pending)
**Priority**: MEDIUM

See the detailed plan: `docs/roadmaps/2026-01-17-v17-6-pwa-enhancement.md`.

### Scope

#### Manifest Improvements

- [ ] **Screenshots**: Replace placeholder screenshots with real captures (must keep exact sizes)
- [x] **Categories**: Add app categorization for discovery
- [x] **Icon Set**: Add comprehensive icon sizes (16, 32, 180, 192, 512px + maskable + shortcuts + badge)
- [x] **Icon Path Fix**: Align manifest + service worker icon paths with real files in `public/`
- [x] **Locale-Aware Start URL**: Keep `start_url: "/"` so `next-intl` middleware can respect language preference

#### Service Worker Enhancement

- [x] **Notification Polish**: Ensure push notifications use valid `icon`/`badge` assets
- [x] **Cache Strategy**: Verify Workbox runtime caching matches real API routes (`/api/v1/...`)
- [x] **Shortcuts/Share Hydration**: Support `?q=` and `?category=` on the home page so shortcuts + share target work
- [ ] **Lighthouse Audit**: Confirm Lighthouse PWA score targets in production build

### Success Criteria

- PWA passes Lighthouse PWA audit
- Offline mode works for all 7 locales
- Offline data + queued feedback syncs automatically when back online (app-layer sync)

---

## v15.1: Mobile App Launch

**Status**: Paused - see [Paused Items](#paused-items-pending-user-approval)

### Scope

- [ ] **Native App Builds**: iOS (Xcode) and Android (Android Studio) packages
- [ ] **App Store Assets**: Icons, screenshots, store metadata, privacy labels
- [ ] **Store Submissions**: App Store and Google Play reviews
- [ ] **Launch & Monitoring**: Public launch with crash monitoring and analytics

### Success Criteria

- Pass app store reviews on first attempt
- 500+ installs in first 90 days
- 4.5+ star rating
- ≥99% crash-free rate

**Timeline**: 4-6 weeks after approval and macOS access

---

## Paused Items Pending User Approval

> [!IMPORTANT]
> Do not proceed with items in this section without explicit user approval.

### v15.1: Mobile App Development

**Requires:**

- macOS with Xcode (iOS builds)
- Android Studio (Android builds)
- Apple Developer Program ($99/year)
- Google Play Console ($25 one-time)

**Action**: User must confirm macOS access and approve costs.

### General Gating Criteria

The following types of work require user approval:

- Paid services or external accounts
- Special hardware/OS requirements (macOS, specific dev environments)
- Major architectural changes
- Third-party integrations with costs

---

## Future Considerations

Items under evaluation for future roadmap inclusion:

- **API Keys & Server-to-Server Auth**: For third-party integrations
- **GraphQL API**: Alongside REST for flexible querying
- **Webhooks**: Event-driven integrations for partners
- **Circuit Breaker**: Graceful degradation on Supabase outages
- **Performance Regression Testing**: Track search latency, AI inference time
- **Load Testing**: Verify behavior under high search volume

---

## Completed Versions

See [archive/](archive/) for implementation details:

- [v17.4: Dashboard & Partner Portal](archive/2026-01-25-v17-4-dashboard-partner-portal.md) (Complete - Pending Testing)
- [v17.3: Accessibility Compliance](archive/2026-01-20-v17-3-accessibility.md) (2026-01-20)
- [v17.2: Internationalization Completion](archive/2026-01-20-v17-2-internationalization.md) (2026-01-20)
- [v17.1: Test Coverage & Quality Gates](archive/2026-01-19-v17-1-test-coverage.md) (2026-01-19)
- [v17.0: Security & Authorization](archive/2026-01-17-v17-0-security-authorization.md) (2026-01-20)
- [v16.4: High-Value Improvements](archive/2026-01-15-v16-4-high-value-improvements.md) (2026-01-15)
- [v16.3: Quality & Tooling Refresh](archive/2026-01-15-v16-3-quality-tooling-refresh.md) (2026-01-15)
- [v16.2: Security Hardening](archive/2026-01-15-v16-2-security-hardening.md) (2026-01-15)
- [v16.0: Search Ranking Enhancements](archive/2026-01-14-v16-0-search-ranking-enhancements.md) (2026-01-14)
- [v15.0: Mobile-Ready Infrastructure](archive/2026-01-13-v15-0-mobile-ready-infrastructure.md) (2026-01-13)
- [v14.0: Impact, Equity & Trust](archive/2026-01-13-v14-0-impact-equity-trust.md) (2026-01-13)
- [v13.1: AI Compliance Remediation](archive/2026-01-12-v13-1-ai-compliance-remediation.md) (2026-01-12)
- [v13.0: Secure Data Architecture](archive/2026-01-07-v13-0-librarian-model.md) (2026-01-07)
- [v12.0: Legal & Compliance](archive/2026-01-02-v12-0-legal-compliance.md) (2026-01-02)
- [v11.0: Scope Expansion](archive/2026-01-08-v11-0-scope-expansion.md) (2026-01-08)
- [v10.0: Data Architecture](archive/2026-01-02-v10-0-data-architecture.md) (2026-01-02)

---

## Removed Items

Items removed from roadmap due to feasibility/scope concerns:

| Item                                   | Reason                        |
| :------------------------------------- | :---------------------------- |
| Partner Onboarding (email auto-verify) | Security risk                 |
| Conversational Intake AI               | Complexity, browser support   |
| Navigator Sharing                      | Scope creep                   |
| Trip Planner                           | Paid API, scope creep         |
| User-tracking Impact Analytics         | Privacy risk                  |
| Full Health Literacy Rewrite           | Effort without review process |
| Text-to-Speech                         | Not core functionality        |
| Research Publication                   | Not software development      |

---

## Production Readiness Summary

Based on comprehensive audit (2026-01-20), here is the overall status:

| Area                    | Status           | Blocking? | Est. Effort |
| :---------------------- | :--------------- | :-------- | :---------- |
| **v17.0 Security**      | ✅ Completed     | No        | 1-2 weeks   |
| **v17.1 Test Coverage** | ✅ Completed     | No        | 2-3 weeks   |
| **v17.2 i18n**          | ✅ Completed     | No        | 1 week      |
| **v17.3 Accessibility** | ✅ Completed     | No        | 1-2 weeks   |
| **v17.4 Dashboard**     | ✅ Complete\*    | No        | 0.5-1 week  |
| **v17.5 Data Quality**  | ⚠️ In Progress   | No        | 3-4 weeks   |
| **v17.6 PWA**           | 🟡 Implemented\* | No        | 1-2 weeks   |
| **Mobile App**          | ⏸️ Paused        | N/A       | 4-6 weeks   |

**Estimated Total to Production**: 5-9 weeks of focused development

\*Complete pending final QA/testing pass and any post-audit fixes.
\*Implemented pending Lighthouse + device install verification.

### Critical Path (Must Complete Before Public Launch)

1. **v17.0** - Fix API authorization vulnerability (✅ DONE)
2. **v17.1** - Raise test coverage to 75%+ (✅ DONE)
3. **v17.2** - Complete i18n for all 7 locales (✅ DONE)
4. **v17.3** - AODA/WCAG 2.1 AA compliance (✅ DONE)
