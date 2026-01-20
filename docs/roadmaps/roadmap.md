# Kingston Care Connect: Roadmap

> **Current Version**: v16.4 (High-Value Improvements)
> **Last Updated**: 2026-01-19

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

**Status**: Planned
**Priority**: HIGH

### Scope

#### Translation Gaps (126 missing keys per EDIA locale)

- [ ] **Complete ZH-HANS** (Simplified Chinese): 126 missing keys
- [ ] **Complete AR** (Arabic): 126 missing keys
- [ ] **Complete PT** (Portuguese): 126 missing keys
- [ ] **Complete ES** (Spanish): 126 missing keys
- [ ] **Complete PA** (Punjabi): 126 missing keys

Missing key categories:

- VerificationLevels (L0, L1, L2, L3)
- Dashboard operations (logout, pending, profile)
- Freshness badges (verified, unknown, verifiedOn)
- Feedback form UI

#### RTL & Offline Localization

- [ ] **Offline Page RTL**: Fix hardcoded `lang="en"` in `/app/offline/layout.tsx`
- [ ] **Offline Page i18n**: Add translations for offline page content
- [ ] **Dynamic Offline Locale**: Make offline layout locale-aware

#### Cleanup

- [ ] **Remove Extra Keys**: 10 extra keys in EDIA locales (Feedback.\* duplicates)

### Success Criteria

- `npm run i18n-audit` passes with zero missing keys
- Offline page displays correctly in all 7 locales
- RTL layout works for Arabic in offline mode

---

## v17.3: Accessibility Compliance (WCAG 2.1 AA / AODA)

**Status**: Planned
**Priority**: HIGH

### Scope

#### Form Accessibility (CRITICAL)

- [ ] **FormField Component**: Add `aria-describedby`, `aria-invalid`, `aria-required`
- [ ] **Error Linking**: Connect error messages to inputs via `aria-describedby`
- [ ] **Required Indicators**: Add `aria-required="true"` to required fields
- [ ] **Fieldset/Legend**: Group related form fields properly

#### Modal/Dialog Accessibility

- [ ] **EmergencyModal**: Add `role="dialog"`, `aria-modal`, `aria-labelledby`
- [ ] **Migrate to Radix Dialog**: Replace manual focus trap with Radix primitives
- [ ] **Escape Key Handling**: Document keyboard shortcuts

#### Image Accessibility

- [ ] **Alt Text Audit**: Add meaningful alt text to 80+ images
- [ ] **Decorative Images**: Mark decorative images with `alt=""`

#### Testing & Tooling

- [ ] **JSX A11y Plugin**: Add `eslint-plugin-jsx-a11y` to catch violations
- [ ] **Expand E2E Tests**: Add 15+ accessibility test cases
- [ ] **Form Testing**: Test all forms with screen readers
- [ ] **Color Contrast Tests**: Add automated contrast verification

### Success Criteria

- All forms have proper ARIA attributes
- Axe-core reports zero critical/serious violations
- AODA compliance checklist complete
- ESLint catches accessibility violations

---

## v17.4: Dashboard & Partner Portal Completion

**Status**: Planned
**Priority**: HIGH

### Scope

#### Missing Features

- [ ] **Settings Page**: Create `/dashboard/settings` (currently broken navigation)
- [ ] **Notifications Database**: Connect dashboard notifications to real DB (currently mock data)
- [ ] **Service Deletion**: Add delete functionality to partner dashboard
- [ ] **Service Creation Endpoint**: Add public create endpoint (currently admin-only via JSON)

#### Data Isolation Fixes

- [ ] **RLS Policy Enforcement**: Partners see ALL data - filter by `org_id`
- [ ] **Feedback Filtering**: Dashboard shows all system feedback, not partner-specific
- [ ] **Analytics Filtering**: Dashboard analytics are global, not per-partner

#### Admin Panel Improvements

- [ ] **Admin Save to Database**: Use Supabase instead of JSON file writes
- [ ] **Reindex Progress Tracking**: Add progress indicator for embedding generation
- [ ] **OneSignal Targeting**: Add user segment targeting (currently sends to "All")
- [ ] **Complete Service Form**: Add missing fields (hours, phone, email, fees, eligibility)

#### RBAC Implementation

- [ ] **Permission Enforcement**: Implement owner/admin/editor/viewer role checks
- [ ] **Organization Management UI**: Add member invite/management interface
- [ ] **Role-Based UI Rendering**: Hide features based on user role

### Success Criteria

- All dashboard navigation links functional
- Partners only see their own data
- Full service CRUD operations working
- RLS policies verified with integration tests

---

## v17.5: Data Quality & Enrichment

**Status**: Planned
**Priority**: HIGH

### Scope

#### Critical Data Gaps (196 services)

- [ ] **Geographic Scope**: 147/196 (75%) missing `scope` field
  - Assign "kingston", "ontario", or "canada" to all services
- [ ] **Coordinates**: 179/196 (91%) missing lat/lng
  - Geocode addresses via Google Maps/OpenCage API
- [ ] **Access Scripts**: 143/196 (73%) missing `access_script`
  - Add phone anxiety talking points for accessibility

#### Accessibility Data

- [ ] **Plain Language Tracking**: 191/196 (97%) missing `plain_language_available` flag
- [ ] **Structured Hours**: 122/196 (62%) missing machine-readable `hours` object
  - Convert `hours_text` to structured format for "Open Now" filtering

#### Verification Level Upgrade

- [ ] **Establish L3 Services**: 0/196 at provider-confirmed level
  - Target major Crisis/Health providers for official partnership
- [ ] **L4 Gold Standard**: Identify candidates for third-party audit

#### Category Expansion

- [ ] **Transport Services**: Currently only 2 (target: 5+)
- [ ] **Financial Services**: Currently only 4 (target: 8+)
- [ ] **Indigenous Services**: Currently only 3 (target: 8+)

### Success Criteria

- 100% services have `scope` field
- 80%+ services have coordinates
- 50%+ services have access scripts
- At least 10 services at L3 verification

---

## v17.6: PWA Enhancement

**Status**: Planned
**Priority**: MEDIUM

### Scope

#### Manifest Improvements

- [ ] **Screenshots**: Add mobile and tablet screenshots for app stores
- [ ] **Categories**: Add app categorization for discovery
- [ ] **Icon Set**: Add comprehensive icon sizes (16, 32, 180, 192, 512px)
- [ ] **Locale-Aware Start URL**: Respect user language preference

#### Service Worker Enhancement

- [ ] **Offline Fallback Route**: Serve offline page when network unavailable
- [ ] **Background Sync**: Implement periodic sync for feedback queue
- [ ] **Skip Waiting**: Force old service worker to unload on update
- [ ] **Cache Strategy**: Implement explicit Workbox cache strategies

### Success Criteria

- PWA passes Lighthouse PWA audit
- Offline mode works for all 7 locales
- Feedback syncs automatically when back online

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

- [v17.1: Test Coverage & Quality Gates](archive/2026-01-19-v17-1-test-coverage.md) (2026-01-19)
- [v17.0: Security & Authorization](archive/2026-01-17-v17-0-security-authorization.md) (2026-01-20)
- [v16.4: High-Value Improvements](archive/2026-01-15-v16-4-high-value-improvements.md) (2026-01-15)
- [v16.3: Quality & Tooling Refresh](archive/2026-01-15-v16-3-quality-tooling-refresh.md) (2026-01-15)
- [v16.2: Security Hardening](archive/2026-01-15-v16-2-security-hardening.md) (2026-01-15)
- [v16.1: Technical Debt & Quality Fixes](archive/v16-1-technical-debt-fixes.md) (2026-01-14)

- [v16.0: Search Ranking Enhancements](archive/v16-0-search-ranking-enhancements.md) (2026-01-14)
- [v15.0: Mobile-Ready Infrastructure](archive/v15-0-mobile-ready-infrastructure.md) (2026-01-13)
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

Based on comprehensive audit (2026-01-19), here is the overall status:

| Area                    | Status              | Blocking? | Est. Effort |
| :---------------------- | :------------------ | :-------- | :---------- |
| **v17.0 Security**      | ✅ Completed        | No        | 1-2 weeks   |
| **v17.1 Test Coverage** | ✅ Completed        | No        | 2-3 weeks   |
| **v17.2 i18n**          | ❌ 126 keys missing | No        | 1 week      |
| **v17.3 Accessibility** | ⚠️ ~70% complete    | No        | 1-2 weeks   |
| **v17.4 Dashboard**     | ⚠️ Incomplete       | No        | 1-2 weeks   |
| **v17.5 Data Quality**  | ⚠️ Gaps             | No        | 3-4 weeks   |
| **v17.6 PWA**           | ⚠️ Basic            | No        | 1 week      |
| **Mobile App**          | ⏸️ Paused           | N/A       | 4-6 weeks   |

**Estimated Total to Production**: 8-12 weeks of focused development

### Critical Path (Must Complete Before Public Launch)

1. **v17.0** - Fix API authorization vulnerability (✅ DONE)
2. **v17.1** - Raise test coverage to 75%+ (✅ DONE)
3. **v17.2** - Complete i18n for all 7 locales
4. **v17.3** - AODA/WCAG 2.1 AA compliance
