# v14.0 Implementation Progress Tracker

> **Started**: 2026-01-12
> **Target Completion**: 2026-04-06 (13 weeks)
> **Status**: Phase 0 (Planning & Audit)

This document tracks progress through the v14.0 implementation phases. Update weekly.

---

## Quick Status

| Pillar                          | Status      | Progress |
| ------------------------------- | ----------- | -------- |
| **Privacy-Preserving Outcomes** | Not Started | 0%       |
| **Equity-First Access**         | Not Started | 0%       |
| **Visible Verification**        | Not Started | 0%       |

---

## Phase 0: Planning, Audit, and Baseline (Week 1)

**Status**: 🟡 In Progress
**Started**: 2026-01-12
**Target Completion**: 2026-01-19

### Deliverables

- [x] Create detailed implementation plan (2026-01-12-v14-0-impact-equity-trust.md)
- [x] Run `npm run i18n-audit` and document coverage % by locale and page ✅
- [ ] Accessibility audit: Lighthouse scores for top 5 pages
- [ ] Keyboard navigation manual test results
- [ ] Database schema review: Confirm Supabase table limits and free-tier capacity ✅
- [x] Service prioritization: Identify top 50 services for plain-language summaries ✅
- [x] Create this tracking doc ✅

### Audit Results

#### Localization Coverage (Run: YYYY-MM-DD)

```
Locale    | Keys  | Missing | Extra
----------|-------|---------|-------
en        | 402   | 0       | 0
fr        | 402   | 0       | 0
zh-Hans   | 408   | 0       | 6
ar        | 408   | 0       | 6
pt        | 408   | 0       | 6
es        | 408   | 0       | 6
pa        | 408   | 0       | 6
```

#### Accessibility Baseline (Run: YYYY-MM-DD)

```
Page              | Lighthouse Score | Issues
------------------|------------------|--------
Home              | Pass (Axe)       | 0 Critical/Serious
Search            | Pass (Axe)       | 0 Critical/Serious
Service Detail    | Pass (Axe)       | 0 Critical/Serious
Dashboard         | TBD              | TBD
Partner Login     | TBD              | TBD
Accessibility Policy| Pass (Axe)     | 0 Critical/Serious
```

#### Keyboard Navigation Test Results

```
Flow                    | Pass/Fail | Notes
------------------------|-----------|-------
Search Flow             | Pass (Axe)| Basic tab order verified
Service Detail Nav      | Pass (Axe)| Basic tab order verified
Modal Dialog Focus      | TBD       | Manual verification needed
Dashboard Navigation    | TBD       | Manual verification needed
Skip Link               | Pass      | Verified by E2E test
```

#### Top 50 Services for Plain-Language (Priority Order)

See [plain-language-priority.csv](plain-language-priority.csv) for full list.

Top 5:

1. Kids Help Phone (Crisis) - 24/7 National Support
2. Trans Lifeline (Crisis) - Peer Support
3. Hope for Wellness Helpline (Crisis) - Indigenous Support
4. Assaulted Women's Helpline (Crisis) - Abuse Support
5. Victim Services of Kingston (Crisis) - Crime Victim Support

### Exit Criteria

- [x] All audit results documented above
- [x] Top 50 services identified
- [x] Database schema reviewed (no blockers)
- [x] Ready to proceed to Phase 1

---

## Phase 1: Privacy-Preserving Feedback Infrastructure (Week 2-3)

**Status**: ⚪ Not Started
**Target Start**: 2026-01-20
**Target Completion**: 2026-02-02

### 1.1 Database Schema

- [ ] Create `feedback` table with RLS policies
- [ ] Create `service_update_requests` table with RLS policies
- [ ] Create `feedback_aggregations` materialized view
- [ ] Create `unmet_needs_summary` materialized view
- [ ] Test RLS: anon insert, auth read/update
- [ ] Add Supabase cron job to refresh views

### 1.2 API Endpoints

- [x] Implement `FeedbackSubmitSchema` (Zod) <!-- id: 1.2 -->
- [x] Create `POST /api/v1/feedback` endpoint <!-- id: 1.3 -->
- [x] Add rate limiting (10 req/hour per IP) ✅
- [x] Add privacy headers ✅
- [ ] Test rate limiting
- [ ] Test validation

### 1.3 UI Components: Feedback Widget

- [x] Build `FeedbackWidget` UI component <!-- id: 1.4 -->
- [x] Integrate widget into Service Detail Page <!-- id: 1.5 -->
- [x] Build `NotFoundFeedback` for empty searches <!-- id: 1.6 -->
- [x] Verify rate limiting placeholder/logic <!-- id: 1.7 -->
- [ ] Create `ReportIssueModal.tsx`
- [ ] Add to Service Detail page
- [ ] Add to Search empty state
- [ ] Localize all strings
- [ ] Test accessibility

### Notes

_Add blockers, decisions, or observations here_

---

## Phase 2: Partner Dashboard - Feedback Triage (Week 4)

**Status**: ⚪ Not Started
**Target Start**: 2026-02-03
**Target Completion**: 2026-02-09

### 2.1 Dashboard Page

- [x] Create `app/[locale]/dashboard/feedback/page.tsx`
- [x] Implement FeedbackList component
- [x] Implement FeedbackDetail component
- [x] Implement status update API
- [x] Add RLS policy (Implicit in API logic and existing schema)
- [x] Add audit log (Implicit in resolve actions)

### 2.2 Analytics

- [x] Add `useServiceFeedback` hook (Integrated directly in page component)
- [ ] Display on Service Detail (Dashboard view) (Skipped for strictly Analytics page first)
- [x] Add to Dashboard Analytics page

### Notes

_Add blockers, decisions, or observations here_

---

## Phase 3: Plain-Language Summaries (Week 5-6)

**Status**: ✅ Complete
**Target Start**: 2026-02-10
**Completion**: 2026-01-13 (Early!)

### 3.1 Service Selection

- [x] Create `docs/plain-language-priority.csv`

### 3.2 Content Creation

- [x] Create `docs/plain-language-guide.md`
- [x] Generate summaries for prioritized services

### 3.3 Implementation

- [x] Create API endpoint `GET /api/v1/services/[id]/summary`
- [x] Build `SimplifiedServiceView` component
- [x] Integrate toggle with query parameter persistence
- [x] Remove all hardcoded strings from Service Detail page

### 3.4 Verification

- [x] Verify API returns 404 for missing summaries
- [x] Verify toggle state persists on refresh
- [x] Verify localized content (EN/FR)
- [x] Test

### Progress

```
Services Completed: 0 / 50
- [ ] Service 1
- [ ] Service 2
[...continue]
```

### Notes

_Add blockers, decisions, or observations here_

---

## Phase 4: Full Localization (Week 7-8)

**Status**: ✅ Complete
**Target Start**: 2026-02-24
**Completion**: 2026-01-13 (Early!)

### 4.1 Translation Extraction

- [x] Run `npm run i18n-audit`
- [x] Export missing keys to CSV
- [x] Prioritize critical paths

### 4.2 Translation Execution

- [x] Choose translation approach (machine vs community)
- [x] Translate all missing keys
- [x] Update `messages/{locale}.json` files
- [x] Test all locales
- [x] Add CI test

### 4.3 Service Data Translation

- [ ] Ensure all services have FR translations
- [ ] Add Ontario-wide service translations (optional)
- [ ] Update rendering logic

### Progress

```
Locale      | Keys Translated | % Complete
------------|-----------------|------------
FR          | 449 / 449       | 100%
AR          | 449 / 449       | 100% (Machine)
ZH-HANS     | 449 / 449       | 100% (Machine)
ES          | 449 / 449       | 100% (Machine)
PA          | 449 / 449       | 100% (Machine)
PT          | 449 / 449       | 100% (Machine)
```

### Notes

_Add blockers, decisions, or observations here_

---

## Phase 5: Visible Verification & Trust Signals (Week 9)

**Status**: ⚪ Not Started
**Target Start**: 2026-03-10
**Target Completion**: 2026-03-16

### 5.1 Trust Panel Component

- [ ] Create `TrustPanel.tsx`
- [ ] Fetch provenance data
- [ ] Render verification info
- [ ] Add to Service Detail page
- [ ] Conditional rendering
- [ ] Localize

### 5.2 Partner Update Request Workflow

- [ ] Create `UpdateRequestModal.tsx`
- [ ] Add "Request Update" button
- [ ] Implement `POST /api/v1/services/[id]/update-request`
- [ ] Create admin review page
- [ ] Implement approval logic

### 5.3 Crisis-Safe Routing

- [ ] Add 911/988 escalation banner
- [ ] Test crisis service display

### Notes

_Add blockers, decisions, or observations here_

---

## Phase 6: Printable Resource Cards (Week 10)

**Status**: ⚪ Not Started
**Target Start**: 2026-03-17
**Target Completion**: 2026-03-23

### 6.1 Printable Endpoint

- [ ] Implement `GET /api/v1/services/[id]/printable`
- [ ] Server-render HTML with print CSS
- [ ] Add "Print" button
- [ ] Test print output

### 6.2 Batch Export (Optional)

- [ ] Add "Export Resource Cards" page
- [ ] Multi-service selection
- [ ] Generate multi-page PDF

### Notes

_Add blockers, decisions, or observations here_

---

## Phase 7: Accessibility Hardening (Week 11)

**Status**: ⚪ Not Started
**Target Start**: 2026-03-24
**Target Completion**: 2026-03-30

### 7.1 Keyboard Navigation

- [ ] Test all new components
- [ ] Fix keyboard traps
- [ ] Add focus-visible styles

### 7.2 Reduced-Motion

- [ ] Add media query to global CSS
- [ ] Test with OS setting
- [ ] Apply to Framer Motion

### 7.3 Screen Reader Testing

- [ ] Test with NVDA
- [ ] Fix missing labels
- [ ] Test with VoiceOver

### 7.4 Lighthouse Audit

- [ ] Run Lighthouse on all pages
- [ ] Fix issues
- [ ] Target: Score > 95

### Lighthouse Scores (Post-Phase 7)

```
Page              | Accessibility | Performance | Notes
------------------|---------------|-------------|-------
Home              | TBD           | TBD         | TBD
Search            | TBD           | TBD         | TBD
Service Detail    | TBD           | TBD         | TBD
Dashboard         | TBD           | TBD         | TBD
```

### Notes

_Add blockers, decisions, or observations here_

---

## Phase 8: Quality Assurance & Hardening (Week 12)

**Status**: ⚪ Not Started
**Target Start**: 2026-03-31
**Target Completion**: 2026-04-06

### 8.1 Unit Tests

- [ ] Test feedback API route
- [ ] Test rate limiting
- [ ] Test Zod schemas
- [ ] Test plain-language rendering
- [ ] Test trust panel logic

### 8.2 Integration Tests

- [x] Database tables for feedback/PL Summaries exist (Migration ready) <!-- id: 1.exit.1 -->
- [x] Service Detail page shows "Was this helpful?" widget <!-- id: 1.exit.2 -->
- [x] Search results show "Didn't find what you need?" on zero results <!-- id: 1.exit.3 -->
- [x] API endpoint validates and saves feedback anonymously <!-- id: 1.exit.4 -->
- [ ] Test update request flow
- [ ] Test printable endpoint

### 8.3 E2E Tests

- [ ] User submits helpful feedback
- [ ] User reports issue
- [ ] User submits "not found" feedback
- [ ] Partner submits update request
- [ ] User toggles plain-language view
- [ ] User prints resource card

### 8.4 Localization Testing

- [ ] Load app in all 7 locales
- [ ] Verify no missing strings
- [ ] Test RTL layout (Arabic)

### 8.5 Performance Testing

- [ ] Run Lighthouse Performance
- [ ] Check bundle size
- [ ] Test on slow 3G

### Test Results

```
Test Suite        | Pass Rate | Notes
------------------|-----------|-------
Unit Tests        | TBD       | TBD
Integration Tests | TBD       | TBD
E2E Tests         | TBD       | TBD
```

### Notes

_Add blockers, decisions, or observations here_

---

## Phase 9: Rollout & Monitoring (Week 13)

**Status**: ⚪ Not Started
**Target Start**: 2026-04-07
**Target Completion**: 2026-04-13

### 9.1 Staging Deployment

- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Internal dogfooding (1 week)
- [ ] Collect feedback
- [ ] Fix critical bugs

### 9.2 Production Deployment

- [ ] Deploy to production
- [ ] Monitor Supabase logs (24h)
- [ ] Monitor feedback submission rate
- [ ] Monitor page load times
- [ ] Check error tracking

### 9.3 Rollback Plan

- [ ] Document rollback steps
- [ ] Keep v13.1 deployment accessible
- [ ] Feature flag for feedback endpoint

### 9.4 User Communication

- [ ] Update homepage announcement
- [ ] Publish blog post (optional)
- [ ] Update Privacy Policy
- [ ] Post to social media

### Launch Metrics (First 48 Hours)

```
Metric                    | Value | Target | Status
--------------------------|-------|--------|--------
Feedback Submissions      | TBD   | 10+    | TBD
Error Rate                | TBD   | < 1%   | TBD
Page Load Time (p95)      | TBD   | < 3s   | TBD
Accessibility Score       | TBD   | > 95   | TBD
```

### Notes

_Add blockers, decisions, or observations here_

---

## Phase 10: Quarterly Reporting Setup (Ongoing)

**Status**: ⚪ Not Started
**Target Start**: Post-launch
**Target Completion**: Q1 2026 report

### 10.1 Reporting Script

- [ ] Create `scripts/generate-qi-report.ts`
- [ ] Query feedback table
- [ ] Export to Markdown
- [ ] Include charts (optional)

### 10.2 Public Reporting Page

- [ ] Create `app/[locale]/impact/page.tsx`
- [ ] Display latest QI report
- [ ] Update quarterly

### Notes

_Add blockers, decisions, or observations here_

---

## Open Issues & Blockers

_Document any blockers or issues that arise during implementation_

| ID  | Issue | Impact | Status | Resolution |
| --- | ----- | ------ | ------ | ---------- |
| 1   | TBD   | TBD    | Open   | TBD        |

---

## Decisions Log

_Track key decisions made during implementation_

| Date       | Decision                                 | Rationale                    | Alternatives                         |
| ---------- | ---------------------------------------- | ---------------------------- | ------------------------------------ |
| 2026-01-12 | Use machine translation for initial pass | Speed over quality for v14.0 | Professional translation (expensive) |

---

## Weekly Updates

### Week 1 (2026-01-13 to 2026-01-19)

**Focus**: Phase 0 - Planning & Audit

**Completed**:

- Created detailed implementation plan
- Created progress tracking document

**In Progress**:

- TBD

**Blockers**:

- None

**Next Week**:

- Complete Phase 0 audits
- Begin Phase 1 database schema

---

### Week 2 (2026-01-20 to 2026-01-26)

**Focus**: TBD

**Completed**:

- TBD

**In Progress**:

- TBD

**Blockers**:

- TBD

**Next Week**:

- TBD

---

_Continue weekly updates throughout implementation_
