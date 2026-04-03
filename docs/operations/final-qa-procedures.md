# Final Quality Assurance Procedures

**Version:** v19.0 Phase 1
**Purpose:** Pre-launch quality assurance to ensure platform readiness for beta testing
**Estimated Time:** 4-6 hours
**Prerequisites:** v18.0 Production Observability complete ✅

---

## Overview

This document provides detailed procedures for final quality assurance before launching beta testing. All tasks must be completed and pass acceptance criteria before inviting beta users.

**Related Documents:**

- [Beta Testing Plan](beta-testing-plan.md) - Follow this after QA complete
- [Launch Monitoring Checklist](launch-monitoring-checklist.md) - Monitor during beta
- [Incident Response Plan](incident-response-plan.md) - If issues arise

---

## Table of Contents

1. [Production Environment Audit](#1-production-environment-audit-2-hours)
2. [Critical User Journey Testing](#2-critical-user-journey-testing-2-3-hours)
3. [Data Quality Final Review](#3-data-quality-final-review-1-hour)
4. [Pre-Beta Launch Checklist](#pre-beta-launch-checklist)

---

## 1. Production Environment Audit (2 hours)

**Goal:** Verify production environment is correctly configured and secure.

### 1.1: Environment Variables Verification (30 minutes)

**Checklist:**

- [ ] **Access production environment**
  - SSH to the VPS
  - Review `/etc/projects-merge/env/careconnect-web.env`
  - Confirm the staged release under `/srv/apps/careconnect-web/current`

- [ ] **Verify core variables present:**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (public Supabase URL)
  - [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon key)
  - [ ] `SUPABASE_SECRET_KEY` (service role key)
  - [ ] `NEXT_PUBLIC_SEARCH_MODE` (should be `local` or `server`)

- [ ] **Verify observability variables (v18.0):**
  - [ ] `SLACK_WEBHOOK_URL` (for alerts)
  - [ ] `AXIOM_TOKEN` (metrics storage)
  - [ ] `AXIOM_ORG_ID` (organization ID)
  - [ ] `AXIOM_DATASET` (dataset name, e.g., `kingston-care-production`)

- [ ] **Verify optional variables (if used):**
  - [ ] `TWILIO_ACCOUNT_SID` (phone validation)
  - [ ] `TWILIO_AUTH_TOKEN` (phone validation)
  - [ ] `NEXT_PUBLIC_ONESIGNAL_APP_ID` (only if push notifications are enabled)
  - [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (only if push notifications are enabled)
  - [ ] `VAPID_PRIVATE_KEY` (only if push notifications are enabled)

- [ ] **Cross-reference with `.env.example`**
  - Open `.env.example` in codebase
  - Verify no required variables are missing
  - Check that production values are NOT using example/placeholder values

**Acceptance Criteria:**

- ✅ All required environment variables present in production
- ✅ No placeholder or example values in production
- ✅ Sensitive keys (service role, Slack webhook) are not exposed publicly

---

### 1.2: Database Security Verification (30 minutes)

**Checklist:**

- [ ] **Verify Supabase RLS (Row Level Security) is active**
  - Log into Supabase dashboard
  - Navigate to Authentication → Policies
  - Confirm policies exist for `services`, `organizations`, `organization_memberships` tables

- [ ] **Test RLS policies:**
  - [ ] Try to read `services` table without auth (should succeed - public read)
  - [ ] Try to insert into `services` table without auth (should fail)
  - [ ] Try to update `services` table without auth (should fail)
  - [ ] Try to access `organization_memberships` without auth (should fail)

- [ ] **Verify database connection limits:**
  - Supabase dashboard → Settings → Database
  - Check connection pooling is enabled
  - Max connections: Default is fine for MVP

**Commands to Test RLS:**

```bash
# Test public read access (should work)
curl -X GET 'https://[your-project].supabase.co/rest/v1/services?select=id,name&limit=1' \
  -H "apikey: [anon-key]" \
  -H "Content-Type: application/json"

# Test unauthorized write (should fail with 401/403)
curl -X POST 'https://[your-project].supabase.co/rest/v1/services' \
  -H "apikey: [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Service"}'
```

**Acceptance Criteria:**

- ✅ RLS policies are enabled on all tables
- ✅ Public read access works for `services` table
- ✅ Unauthorized writes are blocked

---

### 1.3: Authentication Flow Testing (30 minutes)

**Test in production environment (e.g., https://careconnect.ing):**

**Signup Flow:**

- [ ] Navigate to signup page
- [ ] Fill out form with test email (e.g., `qa-test-[timestamp]@example.com`)
- [ ] Submit form
- [ ] Verify email confirmation sent
- [ ] Click confirmation link in email
- [ ] Verify redirect to login or dashboard
- [ ] Check Supabase dashboard → Authentication → Users (new user should appear)

**Login Flow:**

- [ ] Navigate to login page
- [ ] Enter test user credentials
- [ ] Submit form
- [ ] Verify successful login (redirect to dashboard or home)
- [ ] Check session persists on page reload

**Password Reset Flow:**

- [ ] Navigate to "Forgot Password" link
- [ ] Enter test email
- [ ] Submit form
- [ ] Verify reset email received
- [ ] Click reset link
- [ ] Enter new password
- [ ] Verify redirect to login
- [ ] Login with new password (should work)

**Acceptance Criteria:**

- ✅ All 3 auth flows complete without errors
- ✅ Email delivery working (check spam folder if needed)
- ✅ Session persistence working
- ✅ No console errors during auth flows

---

### 1.4: Security Headers Verification (15 minutes)

**Check CSP and security headers are present:**

```bash
# Validate deployed runtime headers
SECURITY_HEADERS_BASE_URL=https://careconnect.ing npm run validate:security-headers:runtime
```

**Expected Headers:**

- [ ] `Content-Security-Policy` present
- [ ] `X-Frame-Options: DENY` or `SAMEORIGIN`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy` present

**Verify CSP allows required resources:**

- [ ] Navigate to homepage in production
- [ ] Open browser DevTools → Console
- [ ] Check for CSP violation errors (should be none)
- [ ] Test map loads correctly (requires external scripts)
- [ ] Test AI chat widget (if using WebLLM)

**Acceptance Criteria:**

- ✅ All security headers present
- ✅ No CSP violations in browser console
- ✅ External resources (map, AI) load correctly

---

### 1.5: CORS Configuration Check (15 minutes)

**Test API routes accept requests:**

```bash
# Test search API endpoint
curl -X POST https://careconnect.ing/api/v1/search/services \
  -H "Content-Type: application/json" \
  -d '{"query": "food bank", "limit": 5}'

# Test health check endpoint
curl https://careconnect.ing/api/v1/health
```

**Expected Results:**

- [ ] Search API returns JSON results (not CORS error)
- [ ] Health check returns `{"status": "ok"}` or similar
- [ ] No CORS errors when calling from browser

**Browser Test:**

- [ ] Open production site
- [ ] Open DevTools → Network tab
- [ ] Perform a search
- [ ] Check API requests succeed (200 status)
- [ ] No CORS errors in console

**Acceptance Criteria:**

- ✅ API routes accessible from production domain
- ✅ No CORS errors in browser
- ✅ Search API returns valid JSON

---

### 1.6: Rate Limiting Verification (15 minutes)

**Test rate limiting is active:**

**Option A: Manual Test (Quick)**

- [ ] Open production site in browser
- [ ] Open DevTools → Console
- [ ] Run multiple searches rapidly (10+ in quick succession)
- [ ] Check if rate limiting triggers (429 status code)

**Option B: Script Test (Thorough)**

```bash
# Test rate limiting (60 req/min limit)
for i in {1..65}; do
  curl -X POST https://careconnect.ing/api/v1/search/services \
    -H "Content-Type: application/json" \
    -d '{"query": "test"}' \
    -w "%{http_code}\n" \
    -s -o /dev/null
  sleep 0.5
done
```

**Expected:** After ~60 requests within a minute, should receive `429 Too Many Requests`

**Acceptance Criteria:**

- ✅ Rate limiting is active
- ✅ Requests beyond limit receive 429 status
- ✅ Rate limit resets after time window

---

### 1.7: Error Boundary Testing (15 minutes)

**Trigger error boundaries to verify fallback UI:**

**Test 1: 404 Page**

- [ ] Navigate to `https://careconnect.ing/nonexistent-page`
- [ ] Verify custom 404 page displays (not default Next.js 404)
- [ ] Verify "Return Home" link works

**Test 2: API Error Handling**

- [ ] Temporarily disconnect internet (or use DevTools → Network → Offline)
- [ ] Perform a search
- [ ] Verify graceful error message (not crash)
- [ ] Reconnect internet
- [ ] Verify search works again

**Test 3: Circuit Breaker Fallback (v18.0)**

- [ ] Check `/admin/observability` dashboard
- [ ] Verify circuit breaker status is CLOSED (normal operation)
- [ ] If circuit breaker is OPEN: Verify fallback data loads (JSON file)

**Acceptance Criteria:**

- ✅ Custom error pages display correctly
- ✅ Network errors handled gracefully (no white screen)
- ✅ Circuit breaker fallback works if database unavailable

---

### Production Environment Audit Summary

**Completion Checklist:**

- [ ] All environment variables verified and correct
- [ ] Database RLS policies active and tested
- [ ] Auth flows (signup, login, password reset) working
- [ ] Security headers present and CSP not blocking resources
- [ ] CORS configuration allows API requests
- [ ] Rate limiting active (60 req/min)
- [ ] Error boundaries display fallback UI correctly

**Estimated Time:** 2 hours
**Pass Criteria:** All items checked ✅
**If Failed:** Fix issues before proceeding to user journey testing

---

## 2. Critical User Journey Testing (2-3 hours)

**Goal:** Manually test the 5 most important user flows to ensure flawless operation.

**Prerequisites:**

- Production environment audit complete ✅
- Testing device(s) ready: Desktop + Mobile
- Screen reader installed (for accessibility test): NVDA (Windows), VoiceOver (Mac), TalkBack (Android)

---

### Journey 1: Crisis Search (Top Priority) - 15 minutes

**Scenario:** User in crisis needs immediate help.

**Steps:**

1. **Navigate to production site**
   - [ ] Open `https://careconnect.ing` in browser
   - [ ] Page loads in <3 seconds

2. **Perform crisis search**
   - [ ] Type "suicide help" in search box
   - [ ] Press Enter or click Search
   - [ ] **Timer:** Results appear in <5 seconds total ⏱️

3. **Verify crisis detection**
   - [ ] Crisis warning banner appears at top of results
   - [ ] Banner text: "If you're in immediate danger, call 911 or go to the nearest emergency room."
   - [ ] Crisis hotline numbers displayed prominently:
     - Distress Centre Kingston: 613-544-1771
     - Canada Suicide Prevention Service: 1-833-456-4566

4. **Verify top result**
   - [ ] "Distress Centre of Kingston" appears in top 3 results
   - [ ] Service card displays:
     - Name clearly visible
     - Phone number clickable (tel: link)
     - Hours of operation shown
     - Crisis keyword highlighted in description

5. **Test contact action**
   - [ ] Click phone number
   - [ ] On mobile: Verify dialer opens with correct number
   - [ ] On desktop: Verify tel: protocol handler or copy prompt

**Acceptance Criteria:**

- ✅ Crisis banner appears for crisis queries
- ✅ Distress Centre appears in top 3 results
- ✅ Contact information accurate and clickable
- ✅ Total time <5 seconds from query to actionable result
- ✅ No errors in browser console

**If Failed:** 🚨 **CRITICAL** - This is the #1 priority. Fix immediately before any beta testing.

---

### Journey 2: General Search Flow - 20 minutes

**Scenario:** User needs food assistance.

**Steps:**

1. **Perform general search**
   - [ ] Clear previous search
   - [ ] Type "food bank" in search box
   - [ ] Press Enter
   - [ ] **Timer:** Results appear in <800ms (check Network tab in DevTools) ⏱️

2. **Verify search results quality**
   - [ ] At least 5 results displayed
   - [ ] Top 3 results are relevant food banks/food programs:
     - Partners in Mission Food Bank
     - Loving Spoonful
     - Kingston Community Health Centre (Food Programs)
   - [ ] Results sorted by relevance (not alphabetical)

3. **Inspect service card completeness**
   - [ ] Pick top result, verify card displays:
     - Service name
     - Short description
     - Contact information (phone, email, website)
     - Address (if physical location)
     - Hours of operation
     - Verification badge (L1/L2/L3)
     - Categories/tags

4. **Test map integration**
   - [ ] Map displays on right side (desktop) or below (mobile)
   - [ ] Markers appear for all results with coordinates
   - [ ] Click a marker
   - [ ] Verify popup shows service name
   - [ ] Click "View Details" in popup
   - [ ] Verify scrolls to corresponding service card

5. **Test filtering**
   - [ ] Click "Open Now" filter (if available)
   - [ ] Verify results update to show only currently open services
   - [ ] Clear filter
   - [ ] Verify all results return

6. **Test pagination/load more**
   - [ ] Scroll to bottom of results
   - [ ] If "Load More" button present, click it
   - [ ] Verify additional results load

**Acceptance Criteria:**

- ✅ Search latency <800ms (p95)
- ✅ Top 3 results highly relevant to query
- ✅ Service cards display complete information
- ✅ Map shows correct locations for services with coordinates
- ✅ Filters work correctly
- ✅ No JavaScript errors

**If Failed:** Fix before beta. Search quality is core functionality.

---

### Journey 3: Accessibility Navigation - 30 minutes

**Scenario:** User with vision impairment navigates using keyboard and screen reader.

**Prerequisites:**

- Install screen reader: NVDA (Windows), VoiceOver (Mac), TalkBack (Android)
- Close mouse or don't use it during test

**Steps:**

1. **Keyboard-only navigation to search**
   - [ ] Navigate to homepage using only Tab key
   - [ ] Verify focus indicator visible on each focusable element
   - [ ] Tab to search input field
   - [ ] Verify search input receives focus (visible outline)
   - [ ] Type "housing help"
   - [ ] Press Enter (not clicking Search button)
   - [ ] Verify search executes

2. **Navigate search results with keyboard**
   - [ ] Press Tab repeatedly
   - [ ] Verify focus moves through results in logical order:
     1. Search input
     2. Filters (if present)
     3. First result card
     4. Clickable elements within card (phone, website, etc.)
     5. Second result card
     6. And so on...
   - [ ] Verify focus never gets "trapped" (can always Tab forward/backward)
   - [ ] Press Shift+Tab to move backward
   - [ ] Verify backward navigation works

3. **Activate links with keyboard**
   - [ ] Tab to a phone number link
   - [ ] Press Enter
   - [ ] Verify link activates (same as clicking)
   - [ ] Tab to a website link
   - [ ] Press Enter
   - [ ] Verify link opens in new tab

4. **Screen reader testing**
   - [ ] Enable screen reader (NVDA: Ctrl+Alt+N, VoiceOver: Cmd+F5)
   - [ ] Navigate to search input
   - [ ] Verify screen reader announces: "Search, edit text" or similar
   - [ ] Type "crisis help"
   - [ ] Verify screen reader reads characters as typed
   - [ ] Press Enter
   - [ ] Verify screen reader announces results count: "12 results found" or similar
   - [ ] Navigate through results
   - [ ] Verify screen reader reads service name, description, contact info
   - [ ] Verify ARIA labels are descriptive (not "button" or "link")

5. **Test skip links**
   - [ ] Reload page
   - [ ] Press Tab once (before screen reader announces header)
   - [ ] Verify "Skip to main content" link appears
   - [ ] Press Enter
   - [ ] Verify focus jumps to main search area (skipping header/nav)

6. **Test form labels**
   - [ ] Tab to search input
   - [ ] Verify screen reader announces label: "Search for services" or similar
   - [ ] Verify label is associated with input (not just placeholder text)

**Acceptance Criteria:**

- ✅ All interactive elements reachable via keyboard
- ✅ Focus indicator visible at all times
- ✅ No keyboard traps (can Tab through entire page)
- ✅ Screen reader announces all content meaningfully
- ✅ ARIA labels present and descriptive
- ✅ Skip links functional
- ✅ WCAG 2.1 AA compliance maintained

**If Failed:** 🚨 **HIGH PRIORITY** - Accessibility is a legal requirement and core value. Fix before beta.

---

### Journey 4: Mobile Experience - 30 minutes

**Scenario:** User on mobile phone needs to find services.

**Prerequisites:**

- Physical mobile device (preferred) or browser DevTools mobile emulation
- Test on iOS Safari and Android Chrome if possible

**Steps:**

1. **Mobile page load**
   - [ ] Navigate to `https://careconnect.ing` on mobile
   - [ ] **Timer:** Page loads in <5 seconds on 4G ⏱️
   - [ ] Verify responsive layout (no horizontal scrolling)
   - [ ] Verify text readable without zooming

2. **Mobile search interaction**
   - [ ] Tap search input
   - [ ] Verify keyboard appears
   - [ ] Type "mental health"
   - [ ] Verify no autocomplete interference (if search suggestions present, they should be helpful)
   - [ ] Tap Search button or press Go on keyboard
   - [ ] Verify results appear

3. **Touch interactions**
   - [ ] Scroll through results (smooth scrolling)
   - [ ] Tap a service card to expand details (if collapsible)
   - [ ] Verify card expands correctly
   - [ ] Tap phone number
   - [ ] **On real device:** Verify phone dialer opens with correct number
   - [ ] Go back to browser
   - [ ] Tap email address
   - [ ] Verify email app opens with correct address
   - [ ] Go back to browser
   - [ ] Tap website link
   - [ ] Verify opens in new tab or same tab (consistent behavior)

4. **Mobile map usability**
   - [ ] Scroll to map section
   - [ ] Verify map loads on mobile
   - [ ] Pinch to zoom on map
   - [ ] Verify map zooms correctly (not page zoom)
   - [ ] Drag map to pan
   - [ ] Verify map panning works (not page scroll)
   - [ ] Tap a marker
   - [ ] Verify popup displays
   - [ ] Verify popup is readable (not cut off)

5. **Mobile form controls**
   - [ ] Test any filters (Open Now, Categories)
   - [ ] Verify dropdowns/toggles work with touch
   - [ ] Verify buttons have adequate touch target size (44x44px minimum)

6. **Mobile offline mode**
   - [ ] Enable Airplane Mode on device (or DevTools → Network → Offline)
   - [ ] Perform a search
   - [ ] Verify offline indicator appears
   - [ ] Verify search still works (cached data)
   - [ ] Disable Airplane Mode
   - [ ] Verify online indicator appears (if present)

**Acceptance Criteria:**

- ✅ Page loads in <5 seconds on 4G
- ✅ Responsive layout works on screens 320px - 430px wide
- ✅ Touch targets at least 44x44px
- ✅ Contact buttons (tel:, mailto:) work correctly
- ✅ Map usable with touch gestures
- ✅ Offline mode functional
- ✅ No text cut off or requiring horizontal scroll

**If Failed:** Fix before beta. Mobile is primary access method for many users.

---

### Journey 5: Offline Mode - 20 minutes

**Scenario:** User loses internet connection mid-search.

**Steps:**

1. **Initial online state**
   - [ ] Navigate to production site (online)
   - [ ] Perform a search: "food assistance"
   - [ ] Verify results load normally
   - [ ] Note number of results returned

2. **Trigger offline mode**
   - [ ] Open browser DevTools
   - [ ] Network tab → Throttling dropdown → Offline
   - [ ] OR physically disconnect internet

3. **Test offline search**
   - [ ] Clear search (if possible) or reload page
   - [ ] Perform new search: "housing help"
   - [ ] **Verify offline indicator appears** (e.g., banner, icon, toast message)
   - [ ] Verify search still executes (using IndexedDB cache)
   - [ ] Verify results returned (may be stale data, that's OK)
   - [ ] Verify results count matches expectations (~196 services available offline)

4. **Test offline service details**
   - [ ] Click a service card
   - [ ] Verify service details display (from cache)
   - [ ] Verify contact information available
   - [ ] Verify map shows cached location (or shows "offline" state)

5. **Test offline limitations**
   - [ ] Try to submit feedback (if feedback form present)
   - [ ] Verify offline message appears
   - [ ] Verify form data queued for later sync (if implemented)

6. **Test reconnection**
   - [ ] Re-enable internet connection (DevTools → Online, or reconnect WiFi)
   - [ ] Perform a new search
   - [ ] Verify online indicator appears (banner disappears, icon changes)
   - [ ] Verify search hits server (fresh data)
   - [ ] Check Network tab: Verify API requests resume

7. **Background sync (if implemented)**
   - [ ] After reconnection, verify any queued feedback syncs automatically
   - [ ] Check browser console for sync success messages

**Acceptance Criteria:**

- ✅ Offline indicator visible when connection lost
- ✅ Search still works offline (using IndexedDB)
- ✅ ~196 services available in offline cache
- ✅ Service details display from cache
- ✅ Reconnection detected automatically
- ✅ Online mode resumes seamlessly
- ✅ Background sync works (if implemented)

**If Failed:** Offline mode is a v15.0 feature. Fix before beta to ensure PWA reliability.

---

### Critical User Journey Testing Summary

**Completion Checklist:**

- [ ] Journey 1: Crisis Search passed (CRITICAL)
- [ ] Journey 2: General Search Flow passed
- [ ] Journey 3: Accessibility Navigation passed (HIGH PRIORITY)
- [ ] Journey 4: Mobile Experience passed
- [ ] Journey 5: Offline Mode passed

**Estimated Time:** 2-3 hours
**Pass Criteria:** All 5 journeys complete without critical errors
**Priority:** Journey 1 and 3 are blocking (crisis search and accessibility)

---

## 3. Data Quality Final Review (1 hour)

**Goal:** Ensure top services have complete, accurate data for beta users.

### 3.1: Data Completeness Audit (20 minutes)

**Run automated audit:**

```bash
cd /path/to/careconnect
npm run audit:data
```

**Review output for gaps:**

- [ ] **Total service count:** Should be ~196 services
- [ ] **Missing coordinates:** Should be <10% (ideally <5%)
- [ ] **Missing hours:** Should be <10% (or have "Call for hours")
- [ ] **Missing French translations:** Should be <5% for high-traffic services

**If gaps exceed thresholds:**

- Prioritize fixing top 20 most-searched services first
- Defer low-traffic services to post-beta

---

### 3.2: Top 20 Services Verification (30 minutes)

**Manually verify the top 20 most-searched services have complete data.**

**Top 20 Priority Services (Estimated based on category):**

**Crisis (Must be 100% complete):**

1. Distress Centre of Kingston
2. Interval House of Kingston (domestic violence)
3. Kingston Community Health Centre - Crisis Services
4. Sexual Assault Centre Kingston

**Food Security:** 5. Partners in Mission Food Bank 6. Loving Spoonful 7. The Table Community Food Centre 8. St. Vincent de Paul Food Bank

**Housing:** 9. Kingston Youth Shelter 10. Causeway Work Centre - Housing Help 11. Housing Help Centre 12. Kingston Home Base

**Health:** 13. Kingston Community Health Centre 14. Queen's Family Health Team 15. KFL&A Public Health 16. Canadian Mental Health Association - Kingston

**Legal/Financial:** 17. Legal Aid Ontario - Kingston 18. Employment and Education Centre 19. Ontario Works - Kingston Office 20. Community Legal Clinic

---

**For each service, verify:**

- [ ] **Name (EN):** Clear, official name
- [ ] **Name (FR):** French translation present
- [ ] **Description (EN):** Clear, concise (2-3 sentences)
- [ ] **Description (FR):** French translation present
- [ ] **Contact Information:**
  - [ ] Phone number (formatted: 613-XXX-XXXX or 1-XXX-XXX-XXXX)
  - [ ] Email address (if available)
  - [ ] Website URL (https://..., working link)
- [ ] **Address:**
  - [ ] Physical address complete (street, city, postal code)
  - [ ] OR marked as "No physical location" if online-only
- [ ] **Coordinates:**
  - [ ] Latitude and longitude present (if physical location)
  - [ ] Geocoded coordinates accurate (check on map)
- [ ] **Hours:**
  - [ ] Structured hours present (JSON format)
  - [ ] OR hours_text: "Call for hours" or similar
  - [ ] Hours accurate (check website if possible)
- [ ] **Access Script (EN):**
  - [ ] Clear eligibility criteria
  - [ ] Documents needed (if any)
  - [ ] How to access (walk-in, appointment, referral)
- [ ] **Access Script (FR):**
  - [ ] French translation present
- [ ] **Verification Level:**
  - [ ] Crisis services: L2 or L3 (minimum)
  - [ ] High-traffic services: L1 or higher
  - [ ] No L0 services in top 20

**Use this template for spot-checks:**

```
Service: [Name]
- [✅/❌] Name EN/FR
- [✅/❌] Description EN/FR
- [✅/❌] Contact info complete
- [✅/❌] Address accurate
- [✅/❌] Coordinates present
- [✅/❌] Hours accurate
- [✅/❌] Access script EN/FR
- [✅/❌] Verification L1+
Notes: [Any issues or updates needed]
```

---

### 3.3: Random Spot Check (10 minutes)

**Verify data accuracy for 5 random services:**

**Selection method:**

```bash
# Generate 5 random service IDs
npm run tools:search "food" | head -20 | shuf | head -5
```

**For each random service:**

- [ ] Open service in data file (`data/services.json`)
- [ ] Cross-check website URL (visit site, verify still active)
- [ ] Verify phone number format correct
- [ ] Check description matches current service offering (no outdated info)
- [ ] Verify coordinates are accurate (check on Google Maps)

**If errors found:**

- Document in tracking sheet
- Fix before beta if high-traffic service
- Defer to post-beta if low-priority

---

### Data Quality Review Summary

**Completion Checklist:**

- [ ] Data audit run (`npm run audit:data`)
- [ ] Top 20 services verified 100% complete
- [ ] Crisis services verified L2+ with accurate contact info
- [ ] 5 random services spot-checked for accuracy
- [ ] Any critical gaps documented and fixed

**Estimated Time:** 1 hour
**Pass Criteria:**

- Top 20 services have complete data
- All crisis services verified L2+
- No placeholder text in production data

---

## Pre-Beta Launch Checklist

**Before inviting beta users, confirm all tasks complete:**

### Production Environment ✅

- [ ] Environment variables verified
- [ ] Database RLS policies active
- [ ] Auth flows (signup, login, reset) working
- [ ] Security headers present
- [ ] Rate limiting active (60 req/min)
- [ ] Error boundaries functional

### Critical User Journeys ✅

- [ ] Crisis search works flawlessly (<5 sec, banner appears)
- [ ] General search returns relevant results (<800ms)
- [ ] Accessibility: Keyboard navigation and screen reader functional
- [ ] Mobile: Touch interactions and responsive design working
- [ ] Offline: Search works without internet connection

### Data Quality ✅

- [ ] Top 20 services have complete, accurate data
- [ ] All crisis services verified L2+ with correct contact info
- [ ] No placeholder or test data in production

### Observability Ready (v18.0) ✅

- [ ] `/admin/observability` dashboard accessible
- [ ] Axiom metrics flowing (check dashboard)
- [ ] Slack alerts configured and tested
- [ ] Circuit breaker monitoring active
- [ ] SLO tracking operational

### Documentation Ready (v19.0 Phase 2) ✅

- [ ] User guide published (EN + FR)
- [ ] FAQ published (EN + FR)
- [ ] Error messages improved and helpful

### Monitoring Ready (v19.0 Phase 3) ✅

- [ ] Launch monitoring checklist ready
- [ ] Rollback procedures documented
- [ ] Communication templates prepared

### Beta Testing Ready (v19.0 Phase 4) ✅

- [ ] Beta testing plan documented
- [ ] Feedback collection system operational
- [ ] Beta user tracking spreadsheet prepared

---

## If Issues Arise

**Priority Levels:**

- **P0 (Critical):** Blocks beta launch entirely
  - Crisis search not working
  - Authentication completely broken
  - Accessibility failures (WCAG violations)
  - Security vulnerabilities
  - **Action:** Fix immediately before proceeding

- **P1 (High):** Significantly impacts user experience
  - Search performance >1500ms consistently
  - Mobile layout broken on major devices
  - Major data gaps in top 20 services
  - **Action:** Fix before inviting beta users

- **P2 (Medium):** Minor issues, workarounds available
  - Non-critical features not working (e.g., filters)
  - Data gaps in low-traffic services
  - Minor visual bugs
  - **Action:** Document, fix during beta or defer to post-beta

- **P3 (Low):** Polish issues, doesn't impact core functionality
  - Cosmetic issues
  - Edge case bugs
  - Nice-to-have features missing
  - **Action:** Backlog for future

---

## Next Steps After QA Complete

1. **Review this checklist** - Ensure all items checked ✅
2. **Document any deferred issues** - Create GitHub issues for P2/P3 items
3. **Prepare beta environment** - Ensure production is stable
4. **Follow Beta Testing Plan** - Begin Phase 1: Invite-Only Beta (10-20 users)
   - See `docs/operations/beta-testing-plan.md`

---

## Related Documents

- [Beta Testing Plan](beta-testing-plan.md) - 3-phase rollout strategy
- [Beta Feedback Analysis](beta-feedback-analysis.md) - Feedback management
- [Launch Monitoring Checklist](launch-monitoring-checklist.md) - Daily monitoring during beta
- [Rollback Procedures](launch-rollback-procedures.md) - If critical issues arise
- [User Guide](../user-guide.md) - Share with beta users
- [FAQ](../faq.md) - Share with beta users

---

**Document Version:** 1.0
**Last Updated:** 2026-02-09
**Status:** Ready for Use
**Estimated Total Time:** 4-6 hours
