# v14.0: Measurable Impact, Equity & Trust

> **Status**: In Planning
> **Roadmap Version**: v14.0
> **Last Updated**: 2026-01-12
> **Target Completion**: Q1 2026
> **Owner/Resourcing**: Single-maintainer, free-tier friendly
> **Scope Guardrail**: No IRL partnerships required; focus on product quality & measurability

This document is the **version definition and implementation plan** for v14.0, which establishes **verifiable community impact without tracking**, **equity-first access**, and **visible verification trust signals**.

---

## 0) Executive Summary

### The Vision

CareConnect has achieved technical maturity (v13.x) with privacy-first architecture, legal compliance, and AI safety. However, we lack:

1. **Measurability**: We don't know if the platform is helpful or where it's failing users
2. **Equity**: Access barriers remain for marginalized communities (language, literacy, connectivity)
3. **Trust**: Users can't verify data quality or know when services were last checked

v14.0 addresses these gaps **without compromising privacy** through privacy-preserving feedback, accessibility enhancements, and transparent verification.

### Three Pillars

1. **Privacy-Preserving Outcomes + QI Loop**: Measure usefulness and continuously improve data quality without tracking users
2. **Equity-First Access Pack**: Full localization, plain-language mode, low-bandwidth outputs, accessibility upgrades
3. **Visible Verification + Provenance**: Display trust signals, verification dates, and enable partner update requests

### Strategic Alignment

This roadmap positions CareConnect for:

- **McMaster partnership**: Evaluation/QI capabilities demonstrate measurable outcomes
- **Queen's partnership**: Kingston governance & partner engagement infrastructure
- **Western partnership**: Operational reliability at scale with quality assurance
- **Toronto/TMU readiness**: Equity-first access removes barriers for diverse populations

---

## 1) Goals / Non-Goals

### Goals (Must-Have)

**Pillar 1: Privacy-Preserving Outcomes**

1. Implement opt-in user feedback ("Was this helpful?", "Report an issue", "Couldn't find what I need")
2. Store only aggregated metrics + anonymized feedback content (no cookies, no persistent IDs)
3. Build triage queue + resolution workflow for feedback with staleness links
4. Enable quarterly public reporting on impact & data quality

**Pillar 2: Equity-First Access** 5. Close remaining `next-intl` gaps for all 7 locales (100% UI coverage) 6. Add plain-language summaries for top 50 highest-impact services 7. Create printable "resource cards" (phone/address/hours only) for offline distribution 8. AODA-focused UX improvements (keyboard-first, reduced-motion, skip links)

**Pillar 3: Visible Verification** 9. Display `verified_at`, `verified_by`, and provenance on Service Detail pages 10. Enable partner update requests with audit trail (who/what/when) and human approval 11. Consistent crisis-safe routing with 911/988 escalation UI

### Non-Goals (Explicitly Out of Scope)

- User accounts or persistent logins for public users (partners only)
- Tracking pixels, cookies, or session identifiers for public users
- AI-generated plain-language content (human review required)
- Automated service verification (manual process remains)
- Real-time service availability (capacity/waitlist tracking)
- Social features (sharing, bookmarks, user profiles)
- Mobile app development (deferred to v15.0)
- New service research or expansion beyond current 196 services

---

## 2) Current State Snapshot (v13.1 Baseline)

### What We Have

- **196 verified services** (169 Kingston + 27 Ontario-wide) with 100% embedding coverage
- **Privacy-first architecture**: Server-side search, no-store cache headers, no query logging
- **AI compliance**: Crisis circuit breaker, deterministic results, safety preambles
- **Legal foundation**: PIPEDA/AODA compliant ToS, Privacy Policy, Accessibility Policy
- **7 locales**: EN, FR, AR, ZH-HANS, ES, PA, PT with routing and basic translations
- **Basic feedback**: Mailto fallback + API endpoint (existing but underutilized)
- **Partner portal**: Service CRUD, analytics dashboard (partners can manage their listings)

### What's Missing

- **Impact visibility**: No way to measure usefulness or identify gaps
- **Localization gaps**: Many UI strings remain untranslated (estimated 60-70% coverage)
- **Literacy barriers**: Complex service descriptions assume high reading level
- **Accessibility gaps**: Some keyboard flows incomplete, no reduced-motion support
- **Trust signals**: Verification dates and provenance hidden from public view
- **Partner engagement**: No structured update request workflow

### Key Constraints

- **Privacy requirement**: Cannot introduce user tracking or persistent IDs
- **Solo development**: Must remain achievable for a single maintainer without team staffing
- **Free-tier friendly**: No paid services for core functionality
- **Manual verification**: Cannot automate data quality (governance constraint)

---

## 3) Target Architecture

### Conceptual Model

```
User Journey Flow:
┌─────────────────┐
│  Search Service │
└────────┬────────┘
         │
         ├─ Found? ──► View Details ──► "Was this helpful?" (Pillar 1)
         │                    │
         │                    └─► Display Trust Panel (Pillar 3)
         │
         └─ Not Found? ──► "Couldn't find service" (Pillar 1)
                            ↓
                     Triage Queue (Pillar 1)


Equity Layer (Pillar 2):
┌────────────────────────────────────────┐
│  Every Page:                           │
│  • Full locale support (7 languages)  │
│  • Plain-language option (top 50)     │
│  • Printable resource cards           │
│  • Keyboard navigation                │
│  • Reduced-motion support             │
└────────────────────────────────────────┘
```

### Data Flow: Privacy-Preserving Feedback

```
User submits feedback
    ↓
POST /api/v1/feedback
    ↓
Store in Supabase `feedback` table:
    - feedback_id (uuid, auto-generated)
    - service_id (reference, nullable for "couldn't find")
    - feedback_type (enum: helpful_yes, helpful_no, issue, not_found)
    - message (text, optional, max 1000 chars)
    - category_searched (enum, optional, for not_found)
    - created_at (timestamp)
    - status (enum: pending, reviewed, resolved, dismissed)
    - resolved_at (timestamp, nullable)
    - resolved_by (text, nullable, partner email or "system")

NO stored:
    - User IP (rate limiting in-memory only)
    - Session ID
    - User fingerprint
    - Referrer
    - Search query text (for not_found, only category enum)

Aggregations (materialized view, updated hourly):
    - Total feedback count by type
    - % helpful ratings
    - Issue reports per service
    - Unmet need categories (for not_found)
```

### UI Components: Feedback System

**Component Hierarchy:**

```
ServiceDetailPage
  └─ TrustPanel (Pillar 3: verification info)
  └─ FeedbackWidget (Pillar 1: "Was this helpful?")
      ├─ ThumbsUp / ThumbsDown
      ├─ ReportIssueButton → ReportIssueModal
      └─ SuccessToast

SearchResults (empty state)
  └─ NotFoundFeedback (Pillar 1: "Couldn't find service")
      ├─ CategorySelector (optional)
      ├─ MessageTextarea (optional)
      └─ SubmitButton

DashboardFeedbackPage (partners only)
  └─ FeedbackTriage
      ├─ FeedbackList (filterable by status, service)
      ├─ FeedbackDetail
      └─ ResolveActions (mark resolved, link to service edit)
```

---

## 4) Key Design Decisions

| Decision                     | Recommendation                | Rationale                        | Alternatives Considered                                  |
| ---------------------------- | ----------------------------- | -------------------------------- | -------------------------------------------------------- |
| **Feedback storage**         | Supabase table with RLS       | Free-tier friendly, no new infra | Redis (costs), localStorage (not accessible to partners) |
| **Plain-language authoring** | Manual review workflow        | Quality control, legal safety    | AI-generated (hallucination risk, liability)             |
| **Localization strategy**    | Complete all 7 locales        | Equity commitment, accessibility | EN/FR only (excludes marginalized groups)                |
| **Printable cards**          | Server-rendered HTML → PDF    | No external service needed       | PDF.js (bundle size), external API (privacy risk)        |
| **Trust panel placement**    | Service detail page only      | Avoids search result clutter     | Search results (too noisy)                               |
| **Partner updates**          | Structured request → approval | Audit trail, prevents vandalism  | Direct edit (no review), email-only (no tracking)        |
| **QI reporting**             | Quarterly manual export       | Matches solo-dev capacity        | Real-time dashboard (over-engineering)                   |

---

## 5) Data Model Plan

### 5.1 New Tables

#### `feedback` (User Feedback)

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT REFERENCES services(id) ON DELETE CASCADE NULL, -- nullable for not_found
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful_yes', 'helpful_no', 'issue', 'not_found')),
  message TEXT NULL CHECK (LENGTH(message) <= 1000),
  category_searched TEXT NULL CHECK (category_searched IN ('Food', 'Crisis', 'Housing', 'Health', 'Legal', 'Employment', 'Financial', 'Wellness', 'Education', 'Transport', 'Community', 'Indigenous')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  resolved_at TIMESTAMPTZ NULL,
  resolved_by TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  INDEX idx_feedback_service (service_id),
  INDEX idx_feedback_status (status),
  INDEX idx_feedback_created (created_at DESC)
);

-- RLS Policies
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Public can insert
CREATE POLICY "Anyone can submit feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- Only authenticated partners can read/update
CREATE POLICY "Authenticated users can read feedback" ON feedback
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update feedback" ON feedback
  FOR UPDATE USING (auth.role() = 'authenticated');
```

#### `service_update_requests` (Partner Update Workflow)

```sql
CREATE TABLE service_update_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL, -- partner email
  field_updates JSONB NOT NULL, -- { "phone": "+1-613-123-4567", "hours": {...} }
  justification TEXT NULL CHECK (LENGTH(justification) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  INDEX idx_update_requests_service (service_id),
  INDEX idx_update_requests_status (status),
  INDEX idx_update_requests_requested_by (requested_by)
);

-- RLS Policies
ALTER TABLE service_update_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create requests for their services
CREATE POLICY "Partners can request updates" ON service_update_requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can see their own requests
CREATE POLICY "Partners can see own requests" ON service_update_requests
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin-level review (implement role check as needed)
CREATE POLICY "Admins can review requests" ON service_update_requests
  FOR UPDATE USING (auth.role() = 'authenticated'); -- TODO: Add admin role check
```

#### `plain_language_summaries` (Simplified Service Descriptions)

```sql
CREATE TABLE plain_language_summaries (
  service_id TEXT PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
  summary_en TEXT NOT NULL CHECK (LENGTH(summary_en) <= 500),
  summary_fr TEXT NULL CHECK (LENGTH(summary_fr) <= 500),
  how_to_use_en TEXT NOT NULL CHECK (LENGTH(how_to_use_en) <= 1000), -- step-by-step
  how_to_use_fr TEXT NULL CHECK (LENGTH(how_to_use_fr) <= 1000),
  reviewed_by TEXT NOT NULL, -- reviewer name or email
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure only high-impact services get summaries
  CHECK (service_id IN (SELECT id FROM services WHERE verification_level IN ('L2', 'L3')))
);

-- RLS: Public read
ALTER TABLE plain_language_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read summaries" ON plain_language_summaries
  FOR SELECT USING (true);
```

### 5.2 Extended Fields on `services`

```sql
-- Add display_provenance flag (opt-in for trust panel)
ALTER TABLE services
  ADD COLUMN display_provenance BOOLEAN DEFAULT true;

-- Add plain_language_available flag (for UI toggle)
ALTER TABLE services
  ADD COLUMN plain_language_available BOOLEAN DEFAULT false;
```

### 5.3 Materialized View: Feedback Aggregations

```sql
CREATE MATERIALIZED VIEW feedback_aggregations AS
SELECT
  service_id,
  COUNT(*) FILTER (WHERE feedback_type = 'helpful_yes') AS helpful_yes_count,
  COUNT(*) FILTER (WHERE feedback_type = 'helpful_no') AS helpful_no_count,
  COUNT(*) FILTER (WHERE feedback_type = 'issue' AND status = 'pending') AS open_issues_count,
  MAX(created_at) AS last_feedback_at
FROM feedback
WHERE service_id IS NOT NULL
GROUP BY service_id;

-- Refresh hourly via cron (Supabase pg_cron or CI job)
CREATE INDEX idx_feedback_agg_service ON feedback_aggregations(service_id);
```

```sql
CREATE MATERIALIZED VIEW unmet_needs_summary AS
SELECT
  category_searched,
  COUNT(*) AS request_count,
  MAX(created_at) AS last_requested_at
FROM feedback
WHERE feedback_type = 'not_found' AND category_searched IS NOT NULL
GROUP BY category_searched
ORDER BY request_count DESC;

-- Refresh daily
```

---

## 6) API Contracts

### 6.1 New Endpoint: `POST /api/v1/feedback`

**Purpose**: Accept user feedback without tracking

**Request (JSON)**

```jsonc
{
  "type": "helpful_yes" | "helpful_no" | "issue" | "not_found",
  "serviceId": "string (optional, required for helpful/issue)",
  "message": "string (optional, max 1000 chars)",
  "categorySearched": "Food|Crisis|..." // optional, for not_found only
}
```

**Response (JSON)**

```jsonc
{
  "success": true,
  "message": "Thank you for your feedback",
}
```

**Privacy Requirements**

- Rate limit: 10 feedback submissions per IP per hour (in-memory only)
- No logging of IP, user agent, or referrer
- No cookies or session storage
- Cache-Control: no-store
- CORS: restrict to own domain only

### 6.2 New Endpoint: `POST /api/v1/services/[id]/update-request`

**Purpose**: Partners request structured updates with approval workflow

**Request (JSON)**

```jsonc
{
  "fieldUpdates": {
    "phone": "+1-613-123-4567",
    "hours": { "monday": { "open": "09:00", "close": "17:00" } },
  },
  "justification": "string (optional, max 500 chars)",
}
```

**Response (JSON)**

```jsonc
{
  "success": true,
  "requestId": "uuid",
  "status": "pending",
  "message": "Update request submitted for review",
}
```

**Authentication**

- Requires: `auth.user()` (Supabase session)
- Authorization: Partner must have `org_id` matching service's `org_id` (or be admin)

### 6.3 New Endpoint: `GET /api/v1/services/[id]/printable`

**Purpose**: Generate printable resource card (HTML for browser print)

**Response**: HTML page with print-optimized CSS

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Resource Card: [Service Name]</title>
    <style>
      @media print {
        @page {
          margin: 0.5in;
        }
        body {
          font-size: 14pt;
          line-height: 1.5;
        }
        .no-print {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <h1>[Service Name]</h1>
    <p><strong>Phone:</strong> [Phone]</p>
    <p><strong>Address:</strong> [Address]</p>
    <p><strong>Hours:</strong> [Hours Text]</p>
    <p><strong>Eligibility:</strong> [Eligibility]</p>
    <p class="no-print">
      <button onclick="window.print()">Print This Card</button>
    </p>
  </body>
</html>
```

**Cache**: Public, s-maxage=3600 (1 hour)

---

## 7) UX & Product Behavior

### 7.1 Feedback Widget (Pillar 1)

**Placement**: Bottom of Service Detail page, above footer

**UI Flow**:

```
[Service Detail Content]

┌───────────────────────────────────────┐
│ Was this information helpful?         │
│                                        │
│  [👍 Yes]  [👎 No]  [⚠️ Report Issue] │
└───────────────────────────────────────┘
```

**Interactions**:

1. **Thumbs Up**: Submit `helpful_yes`, show toast "Thanks for your feedback!"
2. **Thumbs Down**: Submit `helpful_no`, show optional textarea "What was missing?" (optional)
3. **Report Issue**: Open modal with:
   - Radio buttons: Wrong Phone | Wrong Address | Service Closed | Other
   - Textarea: "Please describe" (optional, max 1000 chars)
   - Submit button: "Send Report"

**Empty State (No Results)**:

```
┌────────────────────────────────────────────┐
│ No services found                          │
│                                            │
│ Can't find what you need?                  │
│ [Tell us what you're looking for]          │
└────────────────────────────────────────────┘
```

Clicking opens modal:

- Category dropdown (optional)
- Textarea: "What service were you looking for?" (optional, 500 chars)
- Submit → feedback_type: not_found

### 7.2 Trust Panel (Pillar 3)

**Placement**: Service Detail page, below description, above contact info

**UI Layout**:

```
┌─────────────────────────────────────────────────┐
│ 🔍 Verification Information                     │
│                                                 │
│ Last Verified: January 5, 2026                  │
│ Verified By: CareConnect Team         │
│ Method: Phone confirmation                      │
│ Evidence: [Link to source]                      │
│                                                 │
│ See something wrong? [Report an Issue]          │
└─────────────────────────────────────────────────┘
```

**Data Displayed** (from `provenance` field):

- `verified_at` (formatted as "Month Day, Year")
- `verified_by`
- `method` (e.g., "Phone", "Email", "Website", "In-person")
- `evidence_url` (if public)

**Conditional Rendering**:

- Only show if `display_provenance = true` (default true, but partners can opt-out)
- For L0 (unverified): Show warning "⚠️ This service has not been verified yet"

### 7.3 Plain-Language Mode (Pillar 2)

**Toggle Placement**: Top of Service Detail page (if available)

**UI**:

```
[Service Name]

Toggle: [Simple View] | Detailed View

┌──────────────────────────────────────┐
│ Simple View:                         │
│                                      │
│ What they do:                        │
│ [Plain-language summary, ~200 words] │
│                                      │
│ How to use this service:             │
│ 1. [Step 1]                          │
│ 2. [Step 2]                          │
│ 3. [Step 3]                          │
└──────────────────────────────────────┘
```

**Availability**: Only for top 50 services with `plain_language_available = true`

**Reading Level Target**: Grade 6-8 (Flesch-Kincaid score 60-70)

### 7.4 Printable Resource Cards (Pillar 2)

**Access**: Button on Service Detail page

```
[Print Resource Card] button → Opens /api/v1/services/[id]/printable in new tab
```

**Format**: Single-page HTML optimized for:

- Black & white printing
- High contrast
- Large text (14pt minimum)
- No images or decorations
- Essential info only: Name, Phone, Address, Hours, Eligibility

**Use Case**: Front-line workers at shelters, drop-in centres can print and distribute

### 7.5 Partner Update Request (Pillar 3)

**Access**: Dashboard → My Services → [Service] → "Request Update" button

**Flow**:

1. Click "Request Update"
2. Modal opens with form:
   - Editable fields: Phone, Email, URL, Address, Hours, Eligibility
   - Justification textarea (optional): "Why is this change needed?"
3. Submit → creates `service_update_request` with status "pending"
4. Partner sees confirmation: "Update request submitted. We'll review within 5 business days."
5. Admin reviews in Dashboard → Approve or Reject
6. Partner receives status update (no email, check dashboard)

**Audit Trail**: All requests stored with timestamps, reviewer, and action taken

---

## 8) Localization Strategy (Pillar 2)

### 8.1 Current Coverage Audit

**Methodology**:

```bash
npm run i18n-audit  # Identifies missing translation keys
```

**Expected Gaps** (hypothesis):

- Dashboard pages: 40% coverage
- Error messages: 50% coverage
- Form labels: 70% coverage
- Static content pages (About, Terms): 80% coverage
- Search UI: 90% coverage

### 8.2 Translation Workflow

**Phase 1: Extract All Keys**

1. Run `i18n-audit` to generate report
2. Export missing keys to `i18n-gaps-report.csv`
3. Prioritize by page traffic (Search > Service Detail > Dashboard > Static)

**Phase 2: Translation**

1. EN content review: Simplify complex strings before translation
2. Machine translation (Google Translate API, free tier): EN → 6 other locales
3. Community review (optional): Post to local cultural orgs for FR, AR verification

**Phase 3: Integration**

1. Update `messages/{locale}.json` files
2. Test all locales in dev environment
3. Add regression test: "All keys present in all locales"

**Quality Threshold**: 100% coverage for critical paths (Search, Service Detail, Feedback)

### 8.3 Service Data Localization

**Current State**: Most services have `name_fr` and `description_fr` only

**v14.0 Goal**: All 196 services have FR translations (minimum)

**Optional**: Ontario-wide services get all 7 locales (leverage Google Translate with manual review)

---

## 9) Accessibility Enhancements (Pillar 2)

### 9.1 Keyboard Navigation Audit

**Critical Flows to Test**:

1. Search: Tab to input → Type → Tab to results → Enter to open
2. Service Detail: Tab through all links, buttons, feedback widget
3. Modal dialogs: Focus trap working, Escape to close
4. Dashboard: Tab through navigation, forms, tables

**Checklist**:

- [ ] All interactive elements reachable via Tab
- [ ] Visible focus indicators (blue outline, 2px minimum)
- [ ] Logical tab order (top-to-bottom, left-to-right)
- [ ] No keyboard traps (can always Tab out)
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals and dropdowns

### 9.2 Reduced-Motion Support

**Implementation**:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Apply to**:

- All Framer Motion animations
- CSS transitions on hover/focus
- Loading spinners (Loader2 component)
- Modal entry/exit animations

### 9.3 Screen Reader Testing

**Tools**: NVDA (Windows), VoiceOver (Mac)

**Test Scenarios**:

1. Search flow: Announce results count, read result titles
2. Service Detail: Announce all sections (description, contact, hours, trust panel)
3. Feedback widget: Announce button labels, form errors
4. Empty state: Announce "No results found" and suggestion

**Requirements**:

- All images have alt text
- All forms have labels (visible or aria-label)
- All dynamic content has aria-live regions
- All buttons have descriptive text (no icon-only buttons without aria-label)

### 9.4 Color Contrast

**WCAG 2.1 AA Minimum**: 4.5:1 for normal text, 3:1 for large text

**Audit Tools**: Lighthouse, axe DevTools

**Fix Plan**:

- Run Lighthouse on all pages
- Fix contrast failures (likely: muted text, disabled buttons)
- Re-test until score > 95

---

## 10) Implementation Plan (Sequential Phases)

### Phase 0 — Planning, Audit, and Baseline (Week 1)

**Objective**: Establish current state, identify gaps, lock architectural decisions

**Deliverables**:

- [ ] Run `npm run i18n-audit` and document coverage % by locale and page
- [ ] Accessibility audit: Lighthouse scores for top 5 pages
- [ ] Keyboard navigation manual test results
- [ ] Database schema review: Confirm Supabase table limits and free-tier capacity
- [ ] Service prioritization: Identify top 50 services for plain-language summaries (by traffic or category)
- [ ] Create tracking doc: `docs/v14-progress.md` with phase checklists

**Exit Criteria**:

- We have baseline metrics for localization coverage, accessibility scores, and service usage
- We have decided on top 50 services for Phase 3
- Database schema is designed and reviewed (no blockers)

---

### Phase 1 — Privacy-Preserving Feedback Infrastructure (Week 2-3)

**Objective**: Build feedback submission, storage, and triage queue without tracking

#### 1.1 Database Schema

**Tasks**:

- [ ] Create `feedback` table with RLS policies
- [ ] Create `service_update_requests` table with RLS policies
- [ ] Create `feedback_aggregations` materialized view
- [ ] Create `unmet_needs_summary` materialized view
- [ ] Test RLS: Ensure `anon` can insert, `authenticated` can read/update
- [ ] Add Supabase cron job (or CI job) to refresh materialized views hourly

**Validation**:

- [ ] Manual SQL test: Insert feedback as anon → Success
- [ ] Manual SQL test: Select feedback as anon → Denied
- [ ] Manual SQL test: Select feedback as authenticated → Success

#### 1.2 API Endpoints

**Tasks**:

- [ ] Implement `POST /api/v1/feedback` with Zod validation
- [ ] Add rate limiting (10 req/hour per IP, in-memory cache)
- [ ] Add privacy headers: `Cache-Control: no-store`, `X-Robots-Tag: noindex`
- [ ] Log nothing except errors (no request bodies, no IPs in structured logs)
- [ ] Test rate limiting: Confirm 429 after 10 requests
- [ ] Test validation: Confirm 400 for invalid inputs

**Validation**:

- [ ] Integration test: Submit valid feedback → 200
- [ ] Integration test: Submit invalid feedback → 400
- [ ] Integration test: Submit 11th feedback in hour → 429

#### 1.3 UI Components: Feedback Widget

**Tasks**:

- [ ] Create `components/feedback/FeedbackWidget.tsx` (Thumbs up/down + Report Issue)
- [ ] Create `components/feedback/ReportIssueModal.tsx` (Radio buttons + textarea)
- [ ] Create `components/feedback/NotFoundFeedback.tsx` (Empty state feedback)
- [ ] Add to Service Detail page below description
- [ ] Add to Search results empty state
- [ ] Localize all strings in `messages/{locale}.json`
- [ ] Test all feedback types (helpful_yes, helpful_no, issue, not_found)
- [ ] Test accessibility: Keyboard navigation, screen reader announcements

**Validation**:

- [ ] E2E test: Click "Yes" → See toast → Check DB for record
- [ ] E2E test: Click "Report Issue" → Fill form → Submit → Check DB
- [ ] E2E test: Search with no results → Click "Tell us" → Submit → Check DB

**Exit Criteria**:

- Public users can submit feedback without tracking
- Feedback stored in Supabase with proper RLS
- UI is accessible and localized

---

### Phase 2 — Partner Dashboard: Feedback Triage (Week 4)

**Objective**: Enable partners to view, review, and resolve feedback on their services

#### 2.1 Dashboard Page: Feedback Triage

**Tasks**:

- [ ] Create `app/[locale]/dashboard/feedback/page.tsx`
- [ ] Implement FeedbackList component (table view with filters)
  - Columns: Date, Service, Type, Message, Status
  - Filters: Status (pending, reviewed, resolved), Service (dropdown)
- [ ] Implement FeedbackDetail component (drawer or modal)
  - Show full message, service context, submitted date
  - Actions: "Mark Reviewed", "Resolve", "Dismiss", "Link to Service Edit"
- [ ] Implement status update API: `PATCH /api/v1/feedback/[id]` (authenticated only)
- [ ] Add RLS policy: Partners can only update feedback for their services
- [ ] Add audit log: Record who resolved feedback and when

**Validation**:

- [ ] Partner logs in → Sees feedback for their services only
- [ ] Partner clicks "Resolve" → Status updates → Timestamp recorded
- [ ] Partner cannot see feedback for services they don't own

#### 2.2 Analytics: Feedback Aggregations

**Tasks**:

- [ ] Add `useServiceFeedback` hook to fetch aggregations for a service
- [ ] Display on Service Detail page (Dashboard view):
  - "👍 92% helpful (23 votes)"
  - "⚠️ 3 open issues"
- [ ] Add to Dashboard Analytics page:
  - Chart: Feedback over time (helpful vs issues)
  - Table: Services with most issues (descending)
  - Metric: % services with no feedback in 90 days

**Validation**:

- [ ] Aggregations refresh correctly after new feedback
- [ ] Dashboard displays accurate counts

**Exit Criteria**:

- Partners can triage feedback efficiently
- Feedback resolution workflow is auditable
- Analytics provide actionable insights

---

### Phase 3 — Plain-Language Summaries (Week 5-6)

**Objective**: Create simplified, accessible service descriptions for top 50 services

#### 3.1 Service Selection

**Tasks**:

- [ ] Query analytics: Identify top 50 services by page views (if available)
- [ ] Fallback: Select top 50 by category importance (Crisis, Food, Housing prioritized)
- [ ] Create spreadsheet: `docs/plain-language-priority.csv` with service IDs and rationale

#### 3.2 Content Creation Workflow

**Tasks**:

- [ ] Create `docs/plain-language-guide.md` (writing guidelines)
  - Target reading level: Grade 6-8
  - Sentence length: < 20 words
  - Active voice, avoid jargon
  - Include "How to use" steps (1-5 steps max)
- [ ] For each service:
  - [ ] Draft plain-language summary (200-300 words)
  - [ ] Draft "How to use" steps (3-5 steps)
  - [ ] Test readability: Paste into https://readable.com (target score 60-70)
  - [ ] Human review: At least 2 reviewers per service
  - [ ] Store in `plain_language_summaries` table

**Validation**:

- [ ] All 50 summaries meet readability target
- [ ] All summaries reviewed by at least 2 people
- [ ] Summaries stored in DB with reviewer name and date

#### 3.3 UI Integration

**Tasks**:

- [ ] Add toggle to Service Detail page: "Simple View | Detailed View"
- [ ] Fetch plain-language summary if `plain_language_available = true`
- [ ] Render summary and steps in simplified layout
- [ ] Add query param: `?plain=true` for direct links
- [ ] Localize toggle and labels
- [ ] Test: Compare Detailed View vs Simple View side-by-side

**Validation**:

- [ ] Toggle works on all 50 services
- [ ] Simple View displays correctly on mobile
- [ ] Screen reader announces view change

**Exit Criteria**:

- Top 50 services have plain-language summaries
- Users can toggle between Simple and Detailed views
- Summaries are accessible and localized

---

### Phase 4 — Full Localization (Week 7-8)

**Objective**: Achieve 100% UI coverage for all 7 locales

#### 4.1 Translation Extraction

**Tasks**:

- [ ] Run `npm run i18n-audit` → Generate report
- [ ] Export missing keys to CSV (columns: key, page, EN text, FR, AR, ZH, ES, PA, PT)
- [ ] Prioritize: Critical paths first (Search, Service Detail, Feedback, Dashboard)

#### 4.2 Translation Execution

**Option A: Machine Translation (Fast, 80% quality)**

- [ ] Use Google Translate API (free tier: 500k chars/month)
- [ ] Batch translate all missing keys for all 6 non-EN locales
- [ ] Manual review: Sample 10% of translations for accuracy

**Option B: Community Translation (Slow, 95% quality)**

- [ ] Post translation request to local cultural organizations
- [ ] Provide spreadsheet for community members to fill in
- [ ] Review and merge submissions

**Recommended**: Start with Option A, iterate with Option B for critical strings

**Tasks**:

- [ ] Translate all missing keys (target: 100% coverage)
- [ ] Update `messages/{locale}.json` files
- [ ] Test: Load app in each locale, verify no missing string placeholders
- [ ] Add CI test: `npm run i18n-audit` must report 0 missing keys

**Validation**:

- [ ] `npm run i18n-audit` reports 100% coverage for all locales
- [ ] Manual spot check: Load 5 pages in each locale, verify strings display

#### 4.3 Service Data Translation

**Tasks**:

- [ ] Ensure all 196 services have `name_fr` and `description_fr`
- [ ] For Ontario-wide services: Add translations for all 7 locales (optional, use machine translation + review)
- [ ] Update service detail rendering to select locale-appropriate fields

**Exit Criteria**:

- 100% UI coverage for all 7 locales
- All services have FR translations (minimum)
- No placeholder strings visible in any locale

---

### Phase 5 — Visible Verification & Trust Signals (Week 9)

**Objective**: Display provenance and verification info to build user trust

#### 5.1 Trust Panel Component

**Tasks**:

- [ ] Create `components/service/TrustPanel.tsx`
- [ ] Fetch `provenance` field from service data
- [ ] Render:
  - Last Verified date (formatted, localized)
  - Verified By (name or organization)
  - Method (Phone, Email, Website, etc.)
  - Evidence URL (link, if public)
- [ ] Add to Service Detail page below description
- [ ] Conditional rendering: Only show if `display_provenance = true`
- [ ] Localize all labels and date formatting

**Validation**:

- [ ] Trust Panel displays for all services with provenance data
- [ ] Date formatting respects user locale
- [ ] Evidence link opens in new tab

#### 5.2 Partner Update Request Workflow

**Tasks**:

- [ ] Create `components/dashboard/UpdateRequestModal.tsx`
- [ ] Add "Request Update" button to Dashboard → My Services → [Service]
- [ ] Modal form:
  - Editable fields: Phone, Email, URL, Address, Hours (structured), Eligibility
  - Justification textarea (optional)
  - Submit button
- [ ] Implement `POST /api/v1/services/[id]/update-request`
  - Validate: Partner must own service or be admin
  - Store in `service_update_requests` table
  - Return request ID and status
- [ ] Create `app/[locale]/dashboard/update-requests/page.tsx` (Admin view)
  - List all pending requests
  - Detail view: Side-by-side diff (current vs proposed)
  - Actions: Approve (apply changes), Reject (with reason)
- [ ] Implement approval logic:
  - Approve → Update `services` table with new values → Mark request resolved
  - Reject → Update request status → Store rejection reason

**Validation**:

- [ ] Partner submits update request → Stored in DB
- [ ] Admin sees request in dashboard
- [ ] Admin approves → Service updated, request marked resolved
- [ ] Admin rejects → Request marked rejected, reason stored

#### 5.3 Crisis-Safe Routing Enhancement

**Tasks**:

- [ ] Ensure all crisis-related services display 911/988 escalation UI
- [ ] Add to Service Detail page (for Crisis category):
  - Banner: "🚨 In an emergency, call 911 immediately"
  - Button: "988 Suicide & Crisis Lifeline"
- [ ] Test: Load crisis services, verify banner displays

**Exit Criteria**:

- Verification info visible on all services (opt-in)
- Partner update workflow functional
- Crisis services have consistent safety UI

---

### Phase 6 — Printable Resource Cards (Week 10)

**Objective**: Enable offline distribution of service info for front-line workers

#### 6.1 Printable Endpoint

**Tasks**:

- [ ] Implement `GET /api/v1/services/[id]/printable`
- [ ] Server-render HTML with print CSS:
  - Page break: avoid (single page)
  - Font size: 14pt minimum
  - Margins: 0.5in
  - Color: Black & white
  - Content: Name, Phone, Address, Hours, Eligibility only
- [ ] Add "Print Resource Card" button to Service Detail page
- [ ] Test: Click button → Opens printable page → Click browser Print → Verify layout

**Validation**:

- [ ] Printable page renders correctly in Chrome, Firefox, Safari
- [ ] Print output is single page (no cutoffs)
- [ ] Text is legible and high contrast

#### 6.2 Batch Export (Optional)

**Tasks**:

- [ ] Add Dashboard page: "Export Resource Cards" (Admin only)
- [ ] Allow selection of multiple services (checkboxes)
- [ ] Generate multi-page PDF with one card per page
- [ ] Download as PDF file

**Note**: Defer to Phase 7 if time-constrained

**Exit Criteria**:

- Single-service printable cards work
- (Optional) Batch export functional

---

### Phase 7 — Accessibility Hardening (Week 11)

**Objective**: Ensure WCAG 2.1 AA compliance across all new features

#### 7.1 Keyboard Navigation Testing

**Tasks**:

- [ ] Manual test all new components:
  - Feedback widget: Tab to buttons, Enter to activate
  - Report Issue modal: Tab through form, Escape to close
  - Trust Panel: Tab to evidence link
  - Update Request modal: Tab through form fields
- [ ] Fix any keyboard traps or missing focus indicators
- [ ] Add focus-visible styles (blue outline, 2px)

**Validation**:

- [ ] All interactive elements reachable via Tab
- [ ] Focus indicators visible on all elements
- [ ] No keyboard traps

#### 7.2 Reduced-Motion Implementation

**Tasks**:

- [ ] Add `prefers-reduced-motion` media query to global CSS
- [ ] Test: Enable reduced motion in OS settings → Verify animations stop
- [ ] Apply to all Framer Motion components (add `reducedMotion="user"` prop)

**Validation**:

- [ ] Reduced motion setting respected on all pages

#### 7.3 Screen Reader Testing

**Tasks**:

- [ ] Test with NVDA (Windows):
  - Feedback widget: Buttons announced correctly
  - Trust Panel: Content read in logical order
  - Plain-language toggle: Announces view change
- [ ] Fix any missing labels or aria attributes
- [ ] Test with VoiceOver (Mac) for sanity check

**Validation**:

- [ ] All new features accessible via screen reader

#### 7.4 Lighthouse Audit

**Tasks**:

- [ ] Run Lighthouse on all pages with new features
- [ ] Target: Accessibility score > 95
- [ ] Fix any color contrast, heading hierarchy, or alt text issues

**Exit Criteria**:

- All pages score > 95 on Lighthouse Accessibility
- Manual screen reader testing passes
- Keyboard navigation works flawlessly

---

### Phase 8 — Quality Assurance & Hardening (Week 12)

**Objective**: Ensure production readiness through comprehensive testing

#### 8.1 Unit Tests (Vitest)

**Tasks**:

- [ ] Test feedback submission logic (API route)
- [ ] Test rate limiting (in-memory cache)
- [ ] Test Zod schemas for all new endpoints
- [ ] Test plain-language summary rendering
- [ ] Test trust panel conditional display

**Target Coverage**: 80% for new modules

#### 8.2 Integration Tests

**Tasks**:

- [ ] Test feedback submission flow: POST /api/v1/feedback → Check DB
- [ ] Test update request flow: POST /api/v1/services/[id]/update-request → Check DB
- [ ] Test printable endpoint: GET /api/v1/services/[id]/printable → Check HTML

#### 8.3 E2E Tests (Playwright)

**Critical Flows**:

- [ ] User submits helpful feedback → Success toast displayed
- [ ] User reports issue → Modal opens → Submit → DB record created
- [ ] User searches, no results → Submits "not found" feedback
- [ ] Partner submits update request → Admin approves → Service updated
- [ ] User toggles plain-language view → Content changes
- [ ] User clicks print button → Printable page opens

**Validation**:

- [ ] All E2E tests pass on Chromium, Firefox, Safari

#### 8.4 Localization Testing

**Tasks**:

- [ ] Load app in all 7 locales
- [ ] Verify no missing string errors
- [ ] Spot check critical pages (Search, Service Detail, Dashboard)
- [ ] Test RTL layout (Arabic locale)

#### 8.5 Performance Testing

**Tasks**:

- [ ] Run Lighthouse Performance audit
- [ ] Target: Score > 90
- [ ] Check bundle size: Ensure no significant increase from v13.1
- [ ] Test on slow 3G connection (throttled in DevTools)

**Exit Criteria**:

- All tests pass (unit, integration, E2E)
- Lighthouse scores: Accessibility > 95, Performance > 90
- No localization errors
- No regressions from v13.1

---

### Phase 9 — Rollout & Monitoring (Week 13)

**Objective**: Ship safely with monitoring and rollback plan

#### 9.1 Staging Deployment

**Tasks**:

- [ ] Deploy to staging environment
- [ ] Run full smoke test suite
- [ ] Internal dogfooding: Team uses staging for 1 week
- [ ] Collect feedback from team
- [ ] Fix critical bugs before production

#### 9.2 Production Deployment

**Tasks**:

- [ ] Deploy to production
- [ ] Monitor Supabase logs for errors (first 24 hours)
- [ ] Monitor feedback submission rate (should increase)
- [ ] Monitor page load times (should remain stable)
- [ ] Check Sentry/error tracking for new issues

#### 9.3 Rollback Plan

**If critical issues arise**:

- [ ] Revert deployment to v13.1
- [ ] Disable feedback submission endpoint (feature flag)
- [ ] Keep database schema (backward compatible)
- [ ] Fix issues in staging
- [ ] Re-deploy when stable

#### 9.4 User Communication

**Tasks**:

- [ ] Update homepage with v14.0 announcement
- [ ] Publish blog post (optional): "How we measure impact without tracking you"
- [ ] Update Privacy Policy if needed (ensure feedback collection is disclosed)
- [ ] Post to social media (Twitter, LinkedIn): Highlight equity features

**Exit Criteria**:

- v14.0 deployed to production
- No critical bugs reported in first 48 hours
- Feedback submissions working correctly

---

### Phase 10 — Quarterly Reporting Setup (Ongoing)

**Objective**: Enable data-driven quality improvements through public reporting

#### 10.1 Reporting Script

**Tasks**:

- [ ] Create `scripts/generate-qi-report.ts`
- [ ] Query `feedback` table for:
  - Total feedback count (last 90 days)
  - % helpful ratings (yes vs no)
  - Top 10 services with most issues
  - Top 5 unmet need categories (from not_found feedback)
  - Median resolution time for issues
  - % services verified in last 90 days
- [ ] Export to Markdown: `docs/reports/qi-report-YYYY-QN.md`
- [ ] Include charts (optional): Use Chart.js or similar to embed images

#### 10.2 Public Reporting Page

**Tasks**:

- [ ] Create `app/[locale]/impact/page.tsx`
- [ ] Display latest QI report (pull from `docs/reports/`)
- [ ] Metrics:
  - "92% of users found services helpful"
  - "234 service issues resolved in Q1"
  - "5 top unmet needs: [list]"
- [ ] Update quarterly (manual process, add to calendar)

**Exit Criteria**:

- Reporting script generates valid output
- Public reporting page live
- First report published (Q1 2026)

---

## 11) Definition of Done (DoD)

v14.0 is considered "done" when:

**Pillar 1: Privacy-Preserving Outcomes**

- [ ] Public users can submit feedback (helpful, issue, not found) without tracking
- [ ] Feedback stored in Supabase with proper RLS (public insert, auth read/update)
- [ ] Partners can triage feedback in Dashboard
- [ ] Quarterly QI report script functional
- [ ] Public reporting page live

**Pillar 2: Equity-First Access**

- [ ] 100% UI localization coverage for all 7 locales (en, fr, ar, zh-Hans, es, pa, pt)
- [ ] Top 50 services have plain-language summaries and "How to use" steps
- [ ] Printable resource cards available for all services
- [ ] Lighthouse Accessibility score > 95 on all pages
- [ ] Keyboard navigation works flawlessly (no traps, visible focus)
- [ ] Reduced-motion support implemented

**Pillar 3: Visible Verification**

- [ ] Trust Panel displays on Service Detail pages with verification info
- [ ] Partner update request workflow functional (submit, review, approve/reject)
- [ ] Audit trail for all update requests
- [ ] Crisis services display 911/988 escalation UI consistently

**General**

- [ ] No regressions from v13.1 (all existing features work)
- [ ] E2E tests pass for all critical flows
- [ ] Performance maintained (Lighthouse > 90)
- [ ] Production deployment successful with no critical bugs

---

## 12) Risks & Mitigations

| Risk                                                     | Impact | Likelihood | Mitigation                                                                                                                                                           |
| -------------------------------------------------------- | ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Translation quality low (machine translation errors)** | Medium | High       | Start with machine translation, prioritize human review for critical strings (Search, Crisis), accept 80% quality for v14.0, iterate in v14.1                        |
| **Plain-language summaries take too long to create**     | High   | Medium     | Reduce scope from 50 to 25 services, leverage AI drafting with mandatory human review, accept incomplete coverage for v14.0                                          |
| **Feedback spam overwhelms partners**                    | Medium | Medium     | Implement aggressive rate limiting (10/hour), add moderation queue with auto-dismiss for profanity/spam keywords, require manual review before partner sees feedback |
| **Low feedback adoption (users don't engage)**           | Low    | High       | Accept low volume for v14.0, iterate on UX in v14.1, focus on making widget visible and non-intrusive                                                                |
| **Partner update requests create review bottleneck**     | Medium | Low        | Start with manual review (solo dev), add admin notification email, defer auto-approval logic to v15.0                                                                |
| **Accessibility testing reveals major issues late**      | High   | Low        | Start accessibility audit early (Phase 0), run Lighthouse weekly during development, budget extra time in Phase 7 for fixes                                          |
| **Database free-tier limits exceeded**                   | High   | Low        | Monitor Supabase usage dashboard, optimize feedback storage (delete old dismissed feedback after 1 year), add query limits                                           |
| **Performance regression from new features**             | Medium | Low        | Run Lighthouse before and after each phase, lazy-load heavy components (printable endpoint), use React.memo for expensive renders                                    |

---

## 13) Success Metrics

### Quantitative (Measurable via QI Reports)

1. **Feedback Volume**: Target 50+ feedback submissions per month by end of Q1 2026
2. **Helpful Rating**: Target > 85% helpful (yes vs no)
3. **Issue Resolution Rate**: Target > 80% of issues resolved within 30 days
4. **Unmet Needs Identified**: Target 10+ unique service requests to inform v15.0 expansion
5. **Localization Coverage**: 100% UI strings translated for all 7 locales
6. **Plain-Language Coverage**: Top 50 services (or 25% of total)
7. **Accessibility Score**: Lighthouse > 95 on all pages

### Qualitative (User Feedback)

1. **Partner Satisfaction**: Positive feedback from partners on triage workflow (collect via informal check-ins)
2. **User Anecdotes**: At least 3 user stories of how plain-language or localization helped (social media, email)
3. **Community Recognition**: Acknowledgment from local cultural organizations or accessibility advocates

### Strategic (Partnership Readiness)

1. **McMaster**: QI reporting demonstrates measurable outcomes → ready for evaluation partnership
2. **Queen's**: Partner update workflow demonstrates governance maturity → ready for institutional partnership
3. **Toronto/TMU**: Equity-first access removes barriers → ready for expansion to diverse populations

---

## 14) Open Questions (Resolve During Planning)

1. **Translation Budget**: Should we allocate budget for professional translation (FR, AR critical)? Or accept machine translation quality for v14.0?
   - **Recommendation**: Start with machine translation, budget $500 for FR review by certified translator (critical strings only)

2. **Plain-Language Scope**: 50 services or reduce to 25 to ship faster?
   - **Recommendation**: Start with 25 (top priority services: Crisis, Food, Housing), expand to 50 in v14.1

3. **Feedback Moderation**: Should we add profanity filter or manual review queue before partners see feedback?
   - **Recommendation**: Add simple keyword filter (blocklist), auto-dismiss obvious spam, manual review for edge cases

4. **Update Request Auto-Approval**: Should we auto-approve simple changes (e.g., phone number) or require manual review for all?
   - **Recommendation**: Manual review for all in v14.0, implement auto-approval rules in v15.0 after observing patterns

5. **Printable Cards Branding**: Should resource cards include QR code to service detail page?
   - **Recommendation**: Yes, add QR code in bottom-right corner for easy mobile access

6. **Public QI Reports**: Should we publish raw metrics (e.g., "234 issues reported") or only positive framing (e.g., "234 issues resolved")?
   - **Recommendation**: Transparent but positive framing: "234 issues resolved" + "5 unmet needs identified" shows responsiveness

7. **Crisis Escalation UI**: Should we add "Call 988" button directly on crisis service pages or just text?
   - **Recommendation**: Add both tel: link button AND text for accessibility (screen readers announce button, sighted users see both)

---

## 15) Post-Launch Iteration Plan (v14.1+)

### v14.1: Feedback UX Optimization (Based on v14.0 Data)

- A/B test feedback widget placement (bottom vs sidebar)
- Add contextual prompts: "Was [specific section] helpful?" (targeted feedback)
- Implement feedback analytics dashboard for solo dev (track submission rates, resolution times)

### v14.2: Plain-Language Expansion

- Expand from 25 to 50 services
- Add plain-language summaries in FR (machine translation + review)
- Implement user-contributed plain-language drafts (moderated submission form)

### v14.3: Advanced Accessibility

- Add screen reader shortcuts (skip to main content, skip to search)
- Implement voice navigation (experimental, Web Speech API)
- Add dyslexia-friendly font option (OpenDyslexic)

---

## 16) Appendices

### Appendix A: Feedback Schema Examples

**Example 1: Helpful Feedback**

```json
{
  "id": "a1b2c3d4-...",
  "service_id": "food-bank-project",
  "feedback_type": "helpful_yes",
  "message": null,
  "category_searched": null,
  "status": "pending",
  "resolved_at": null,
  "resolved_by": null,
  "created_at": "2026-01-15T14:23:00Z"
}
```

**Example 2: Issue Report**

```json
{
  "id": "e5f6g7h8-...",
  "service_id": "housing-first",
  "feedback_type": "issue",
  "message": "Phone number is disconnected. I called 3 times.",
  "category_searched": null,
  "status": "pending",
  "resolved_at": null,
  "resolved_by": null,
  "created_at": "2026-01-16T09:45:00Z"
}
```

**Example 3: Service Not Found**

```json
{
  "id": "i9j0k1l2-...",
  "service_id": null,
  "feedback_type": "not_found",
  "message": "Looking for free dental care for seniors",
  "category_searched": "Health",
  "status": "pending",
  "resolved_at": null,
  "resolved_by": null,
  "created_at": "2026-01-17T11:30:00Z"
}
```

### Appendix B: Plain-Language Example

**Before (Detailed View)**:

> "The Kingston Food Bank Project operates a centralized distribution facility providing emergency food assistance to income-qualified households within the Kingston CMA. Services include monthly food hampers, dietary accommodation protocols, and referral coordination with complementary social services. Eligibility verification requires government-issued identification and proof of residence within service boundaries."

**After (Simple View)**:

> **What they do:**
> The Food Bank gives free groceries to people who need help buying food. You can get a bag of food once a month.
>
> **How to use this service:**
>
> 1. Go to the Food Bank at 89 York Street (near City Hall)
> 2. Bring your ID and a piece of mail with your address
> 3. Tell them you need food help
> 4. They'll give you a bag of groceries
> 5. You can come back next month for more help

**Reading Level**: Grade 6 (Flesch-Kincaid: 65)

### Appendix C: Trust Panel Example

```
┌─────────────────────────────────────────────────────┐
│ 🔍 Verification Information                         │
│                                                     │
│ ✅ Last Verified: January 5, 2026                  │
│ 👤 Verified By: CareConnect Team         │
│ 📞 Method: Phone confirmation with staff           │
│ 🔗 Evidence: www.example.org/services              │
│                                                     │
│ ⚠️ See something wrong? [Report an Issue]          │
└─────────────────────────────────────────────────────┘
```

### Appendix D: Localization Checklist Template

```markdown
## Page: [Page Name]

### Strings to Translate

- [ ] Page title: "Search Services"
- [ ] Button: "Search"
- [ ] Placeholder: "What do you need help with?"
- [ ] Error: "No services found"
- [ ] Link: "View all services"

### Components

- [ ] Header navigation
- [ ] Footer links
- [ ] Search filters
- [ ] Feedback widget

### Test Cases

- [ ] Load page in all 7 locales
- [ ] Verify no "[missing translation]" placeholders
- [ ] Verify RTL layout (Arabic)
- [ ] Verify date/number formatting
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-12
**Next Review**: Start of Phase 2 (Week 3)
**Status**: Ready for Implementation

---

## Sign-Off

**Solo Developer**: Ready to proceed with Phase 0 (Planning & Audit)
**Target Start Date**: 2026-01-13
**Target Completion**: 2026-04-06 (13 weeks)

**Note**: This plan is flexible. If phases take longer than estimated, we can defer non-critical items (e.g., batch printable export, plain-language expansion) to v14.1 while maintaining core goals.
