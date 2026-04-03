# v19.0 Launch Preparation: User Execution Guide

**Status:** Ready for Execution
**Total Time Required:** 4-6 hours (Phase 1 QA) + 4 weeks (Beta Testing)
**Prerequisites:** All v19.0 documentation complete ✅

---

## Overview

This guide walks you through **exactly what you need to do** to take CareConnect from current state to full public launch.

**Your tasks are split into two phases:**

1. **Phase 1: Final QA** (4-6 hours of manual testing) - **Do this first**
2. **Phase 4: Beta Testing** (4 weeks, 15-20 min/day) - **Do this second**

**All documentation is complete.** You just need to execute the procedures.

---

## Quick Reference

| Task                                   | Time Required                | Blocking?           | Document Reference                                 |
| -------------------------------------- | ---------------------------- | ------------------- | -------------------------------------------------- |
| Phase 1: Production Environment Audit  | 2 hours                      | Yes                 | `docs/operations/final-qa-procedures.md` Section 1 |
| Phase 1: User Journey Testing          | 2-3 hours                    | Yes (Crisis + A11y) | `docs/operations/final-qa-procedures.md` Section 2 |
| Phase 1: Data Quality Review           | 1 hour                       | Yes                 | `docs/operations/final-qa-procedures.md` Section 3 |
| **Phase 1 Total**                      | **4-6 hours**                | **Yes**             |                                                    |
| Beta Week 1: Invite-Only (10-20 users) | 15 min/day                   | Yes                 | `docs/operations/beta-testing-plan.md` Phase 1     |
| Beta Week 2: Expanded (50-100 users)   | 20 min/day                   | Yes                 | `docs/operations/beta-testing-plan.md` Phase 2     |
| Beta Weeks 3-4: Public Soft Launch     | 20 min/day                   | Yes                 | `docs/operations/beta-testing-plan.md` Phase 3     |
| **Beta Total**                         | **15-20 hours over 4 weeks** | **Yes**             |                                                    |

---

## PART 1: Phase 1 Final QA (4-6 hours) - START HERE

**Goal:** Verify production is ready before inviting beta users.

**When to do this:** Before beta testing starts.

**Document to follow:** `docs/operations/final-qa-procedures.md`

---

### Step 1.A: Production Environment Audit (2 hours)

#### 1. Environment Variables Check (30 min)

**What:** Verify all required environment variables are set in production.

**How:**

1. Log into Vercel dashboard
2. Navigate to: Project → Settings → Environment Variables
3. Open checklist: `docs/operations/final-qa-procedures.md` Section 1.1
4. Verify each variable:
   - `NEXT_PUBLIC_SUPABASE_URL` ✓
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ✓
   - `SUPABASE_SECRET_KEY` ✓
   - `SLACK_WEBHOOK_URL` ✓
   - `AXIOM_TOKEN` ✓
   - `AXIOM_ORG_ID` ✓
   - `AXIOM_DATASET` ✓
   - (Full list in document)
5. Cross-reference with `.env.example` file
6. Confirm: No placeholder values (e.g., "your-token-here")

**Pass criteria:** All required variables present with real values.

**If fail:** Add missing variables in Vercel, redeploy.

---

#### 2. Database Security Check (30 min)

**What:** Verify Row Level Security (RLS) policies protect your database.

**How:**

1. Log into Supabase dashboard
2. Navigate to: Authentication → Policies
3. Confirm policies exist for:
   - `services` table (public read, no write)
   - `organizations` table (RLS enabled)
   - `organization_memberships` table (RLS enabled)
4. Run test commands from document Section 1.2:

   ```bash
   # Test public read (should work)
   curl -X GET 'https://[your-project].supabase.co/rest/v1/services?select=id,name&limit=1' \
     -H "apikey: [anon-key]"

   # Test unauthorized write (should fail with 401/403)
   curl -X POST 'https://[your-project].supabase.co/rest/v1/services' \
     -H "apikey: [anon-key]" \
     -d '{"name": "Test"}'
   ```

**Pass criteria:** Public can read, unauthorized writes blocked.

**If fail:** Enable RLS policies in Supabase, re-test.

---

#### 3. Authentication Flow Testing (30 min)

**What:** Verify signup, login, and password reset work.

**How:**

1. Go to production site (e.g., `https://careconnect.ing`)
2. **Test Signup:**
   - Navigate to signup page
   - Create account: `qa-test-[timestamp]@example.com`
   - Check: Email confirmation received?
   - Click confirmation link
   - Check: Redirected to dashboard/home?
3. **Test Login:**
   - Log in with test account
   - Check: Session persists on page reload?
4. **Test Password Reset:**
   - Click "Forgot Password"
   - Enter test email
   - Check: Reset email received?
   - Click reset link, set new password
   - Check: Can log in with new password?

**Pass criteria:** All 3 flows complete without errors.

**If fail:** Check Supabase email templates, SMTP settings.

---

#### 4. Security Headers Check (15 min)

**What:** Verify CSP and security headers are present.

**How:**

1. Run in terminal:
   ```bash
   SECURITY_HEADERS_BASE_URL=https://careconnect.ing npm run validate:security-headers:runtime
   ```
2. Confirm headers present:
   - `Content-Security-Policy`
   - `X-Frame-Options`
   - `X-Content-Type-Options`
3. Open production site in browser
4. Open DevTools → Console
5. Check: No CSP violation errors?

**Pass criteria:** All security headers present, no violations.

**If fail:** Check `next.config.ts` headers configuration.

---

#### 5. Rate Limiting Check (15 min)

**What:** Verify API rate limiting is active (60 requests/minute).

**How:**

1. Open production site
2. Open DevTools → Network tab
3. Perform same search 10+ times rapidly
4. Check: Eventually get 429 status code?

**Pass criteria:** Rate limiting triggers after ~60 requests in 1 minute.

**If fail:** Check rate limiting middleware configuration.

---

#### 6. Error Boundary Check (15 min)

**What:** Verify errors display gracefully, no crashes.

**How:**

1. **Test 404:**
   - Visit: `https://careconnect.ing/nonexistent-page`
   - Check: Custom 404 page displays?
   - Check: "Return Home" link works?
2. **Test Offline:**
   - DevTools → Network → Offline
   - Try to search
   - Check: Graceful error message (no crash)?
   - Check: Offline indicator appears?
   - Go back Online
   - Check: Search works again?

**Pass criteria:** All errors handled gracefully, no white screens.

**If fail:** Check error boundary components, offline service worker.

---

### Step 1.B: Critical User Journey Testing (2-3 hours)

**Five test scenarios. Crisis and Accessibility are BLOCKING.**

---

#### Journey 1: Crisis Search (15 min) - **CRITICAL - MUST PASS**

**What:** Verify crisis queries work perfectly.

**Why critical:** This is the #1 use case. Lives depend on it.

**How:**

1. Go to production site
2. Type: "suicide help" in search box
3. Press Enter
4. **Verify checklist:**
   - [ ] Crisis warning banner appears at top
   - [ ] Banner text: "If you're in immediate danger, call 911..."
   - [ ] Distress Centre Kingston in top 3 results
   - [ ] Phone number clickable: 613-544-1771
   - [ ] Total time <5 seconds from query to result
   - [ ] No errors in browser console

**Pass criteria:** All 6 checks pass. Zero tolerance for failure.

**If fail:** 🚨 BLOCKING - Fix immediately before any beta users.

**Full test script:** `docs/operations/final-qa-procedures.md` Section 2, Journey 1

---

#### Journey 2: General Search Flow (20 min)

**What:** Verify normal search works well.

**How:**

1. Search for: "food bank"
2. Open DevTools → Network tab
3. **Verify checklist:**
   - [ ] Results appear in <800ms (check Network timing)
   - [ ] At least 5 results displayed
   - [ ] Top 3 are relevant food banks:
     - Partners in Mission Food Bank
     - Loving Spoonful
     - The Table Community Food Centre (or similar)
   - [ ] Service cards show complete info:
     - Name, description, phone, address, hours
   - [ ] Map displays with markers
   - [ ] Clicking map marker shows service name
   - [ ] Filters work (if present)

**Pass criteria:** Search is fast, relevant, complete.

**If fail:** Check search scoring, service data completeness.

**Full test script:** `docs/operations/final-qa-procedures.md` Section 2, Journey 2

---

#### Journey 3: Accessibility Navigation (30 min) - **HIGH PRIORITY - MUST PASS**

**What:** Verify keyboard navigation and screen reader support.

**Why critical:** Legal requirement (WCAG 2.1 AA). Equity imperative.

**Prerequisites:**

- Install screen reader:
  - Windows: NVDA (free download)
  - Mac: VoiceOver (built-in, Cmd+F5)
  - Linux: Orca

**How:**

**Part 1: Keyboard Navigation (15 min)**

1. Close/ignore your mouse
2. Press Tab key repeatedly
3. **Verify checklist:**
   - [ ] Can navigate entire site with Tab only
   - [ ] Focus indicator visible on every element
   - [ ] Focus order is logical (top to bottom, left to right)
   - [ ] Never get "trapped" (can always Tab forward/backward)
   - [ ] Can activate links/buttons with Enter key
   - [ ] Can submit search with Enter key
   - [ ] Shift+Tab moves backward correctly

**Part 2: Screen Reader (15 min)**

1. Enable screen reader (NVDA: Ctrl+Alt+N, VoiceOver: Cmd+F5)
2. Navigate to search input
3. **Verify checklist:**
   - [ ] Screen reader announces: "Search, edit text" or similar
   - [ ] Typing query: Characters read aloud
   - [ ] Submitting search: Results count announced ("12 results found")
   - [ ] Navigating results: Service names and descriptions read
   - [ ] ARIA labels are descriptive (not just "button" or "link")
   - [ ] Skip links work ("Skip to main content")
   - [ ] Form labels properly associated with inputs

**Pass criteria:** All keyboard and screen reader checks pass.

**If fail:** 🚨 BLOCKING - Fix accessibility issues before beta.

**Full test script:** `docs/operations/final-qa-procedures.md` Section 2, Journey 3

---

#### Journey 4: Mobile Experience (30 min)

**What:** Verify mobile usability.

**How:**

1. Open production site on mobile phone (or DevTools mobile emulation)
2. **Verify checklist:**
   - [ ] Page loads in <5 seconds
   - [ ] No horizontal scrolling required
   - [ ] Text readable without zooming
   - [ ] Search works on mobile keyboard
   - [ ] Tap phone number → dialer opens (on real device)
   - [ ] Tap email → email app opens
   - [ ] Map is usable (pinch to zoom, pan with touch)
   - [ ] Service cards readable at mobile width
   - [ ] Touch targets large enough (no tiny buttons)

**Pass criteria:** Fully usable on mobile, no layout issues.

**If fail:** Fix responsive layout, touch targets.

**Full test script:** `docs/operations/final-qa-procedures.md` Section 2, Journey 4

---

#### Journey 5: Offline Mode (20 min)

**What:** Verify PWA offline functionality works.

**How:**

1. Load production site normally
2. Enable Airplane Mode (or DevTools → Network → Offline)
3. Try to search for "housing help"
4. **Verify checklist:**
   - [ ] Offline indicator appears (banner, icon, toast)
   - [ ] Search still executes (using IndexedDB cache)
   - [ ] Results returned (~196 services available offline)
   - [ ] Service details accessible
   - [ ] Map shows cached locations (or "offline" state)
5. Disable Airplane Mode
6. Perform new search
7. **Verify checklist:**
   - [ ] Online indicator appears
   - [ ] Search hits server (fresh data)
   - [ ] Network requests resume (check DevTools)

**Pass criteria:** Offline mode works, online reconnection seamless.

**If fail:** Check service worker, IndexedDB sync.

**Full test script:** `docs/operations/final-qa-procedures.md` Section 2, Journey 5

---

### Step 1.C: Data Quality Final Review (1 hour)

---

#### 1. Data Completeness Audit (20 min)

**What:** Check for gaps in service data.

**How:**

1. Open terminal
2. Run data audit:
   ```bash
   cd /path/to/careconnect
   npm run audit:data
   ```
3. Review output:
   - **Total services:** Should be ~196
   - **Missing coordinates:** Note count (should be <10%)
   - **Missing hours:** Note count (should be <10%)
   - **Missing French translations:** Note count
4. **Assess:**
   - Are gaps acceptable? (<10% missing data)
   - If gaps too high: Prioritize top 20 services first

**Pass criteria:** <10% missing critical data (coords, hours).

**If fail:** Prioritize fixing top 20 high-traffic services.

---

#### 2. Top 20 Services Verification (30 min)

**What:** Ensure most-searched services have complete, accurate data.

**How:**

1. Open `data/services.json` in editor
2. Find these 20 high-priority services (list in document Section 3.2):

   **Crisis (MUST be 100% complete):**
   - Distress Centre of Kingston
   - Interval House of Kingston
   - Kingston Community Health Centre - Crisis Services
   - Sexual Assault Centre Kingston

   **Food Security:**
   - Partners in Mission Food Bank
   - Loving Spoonful
   - The Table Community Food Centre
   - St. Vincent de Paul Food Bank

   **Housing:**
   - Kingston Youth Shelter
   - Causeway Work Centre - Housing Help
   - Housing Help Centre
   - Kingston Home Base

   **Health:**
   - Kingston Community Health Centre
   - Queen's Family Health Team
   - KFL&A Public Health
   - CMHA Kingston

   **Legal/Financial:**
   - Legal Aid Ontario - Kingston
   - Employment and Education Centre
   - Ontario Works - Kingston
   - Community Legal Clinic

3. For **each service**, verify 11 fields:
   - [ ] Name (English)
   - [ ] Name (French)
   - [ ] Description (English)
   - [ ] Description (French)
   - [ ] Phone number (formatted: 613-XXX-XXXX)
   - [ ] Email (if available)
   - [ ] Website (https://..., working link)
   - [ ] Address (complete: street, city, postal code)
   - [ ] Coordinates (latitude, longitude)
   - [ ] Hours (structured data OR "Call for hours")
   - [ ] Access script (English + French)
   - [ ] Verification level: L1+ (L2+ for crisis services)

**Use tracking template from document Section 3.2.**

**Pass criteria:** All 20 services have complete data. Crisis services are L2+.

**If fail:** Fill in missing data before beta.

---

#### 3. Random Spot Check (10 min)

**What:** Verify data accuracy for random services.

**How:**

1. Pick 5 random services from `data/services.json`
2. For each:
   - Visit website URL (is it still active?)
   - Check phone number format (correct?)
   - Verify coordinates on Google Maps (accurate location?)
   - Check description (still current? no outdated info?)

**Pass criteria:** No major data errors found.

**If fail:** Note errors, fix high-priority services.

---

### Phase 1 Completion Checklist

**Before proceeding to beta testing, confirm ALL of these:**

#### Production Environment ✅

- [ ] All environment variables verified and correct
- [ ] Database RLS policies active and tested
- [ ] Auth flows working (signup, login, password reset)
- [ ] Security headers present (CSP, X-Frame-Options)
- [ ] CORS configuration allows API requests
- [ ] Rate limiting active (60 req/min triggers 429)
- [ ] Error boundaries display gracefully

#### Critical User Journeys ✅

- [ ] **Journey 1: Crisis Search works perfectly** (<5 sec, banner appears) **BLOCKING**
- [ ] Journey 2: General Search returns relevant results (<800ms)
- [ ] **Journey 3: Accessibility works** (keyboard + screen reader) **BLOCKING**
- [ ] Journey 4: Mobile experience functional
- [ ] Journey 5: Offline mode works

#### Data Quality ✅

- [ ] Data audit run, gaps <10%
- [ ] Top 20 services have complete data (11 fields each)
- [ ] All crisis services verified L2+ with accurate contact info
- [ ] Random spot check passed (5 services)

#### Observability Ready ✅

- [ ] `/admin/observability` dashboard accessible
- [ ] Axiom metrics flowing
- [ ] Slack alerts configured
- [ ] Circuit breaker monitoring active
- [ ] SLO tracking operational

**If all checked:** ✅ **READY FOR BETA TESTING**

**If any BLOCKING items failed:** 🚨 **FIX BEFORE PROCEEDING**

**Estimated time:** 4-6 hours total

---

## PART 2: Phase 4 Beta Testing (4 weeks) - DO THIS SECOND

**Goal:** Test with real users in controlled phases before full launch.

**When to do this:** After Phase 1 QA passes all checks.

**Document to follow:** `docs/operations/beta-testing-plan.md`

---

### Week 1: Invite-Only Beta (10-20 users)

**Goal:** Test with trusted community partners. Find critical bugs.

---

#### Day 1: Recruit Beta Users (1-2 hours)

**What:** Invite 10-20 trusted users to test the platform.

**Who to invite:**

- Community partners (social workers, case managers)
- Library staff (Isabel Turner, Calvin Park, Pittsburgh branches)
- Service providers (5-8 organizations)
- Trusted community advocates

**How:**

1. Open: `docs/operations/beta-testing-plan.md` Section: "Phase 1 Recruitment"
2. Find email invitation template
3. Customize with your information:
   - Replace `[Platform Name]` → CareConnect
   - Replace `[Your Name]` → Your name
   - Replace `[Link]` → Production URL
4. Send to each person individually (personalize!)
5. Attach: User guide (`docs/user-guide.md` or share `/user-guide` link)
6. Track responses in Beta User Tracking Spreadsheet (template in document)

**Target:** 10-20 confirmed beta users

**Template provided** - just fill in blanks.

---

#### Days 2-7: Daily Monitoring (15 min/day)

**What:** Check platform health and collect feedback daily.

**Daily routine (every day, ~15 min):**

1. **Check Feedback Channels (5 min):**
   - [ ] In-app feedback widget: Any new submissions?
   - [ ] Email (feedback@careconnect.ing): Any messages?
   - [ ] Note feedback in tracking spreadsheet

2. **Check Observability Dashboard (5 min):**
   - [ ] Visit `/admin/observability`
   - [ ] Uptime: >99%? (should be green)
   - [ ] Error rate: <2%? (should be low)
   - [ ] Any Slack alerts? (check Slack channel)

3. **Review Error Logs (5 min):**
   - [ ] Supabase dashboard → Logs
   - [ ] Any crashes or 500 errors?
   - [ ] Note any patterns

**Use checklist:** `docs/operations/beta-testing-plan.md` Section: "Phase 1 Daily Monitoring"

**If critical bug found (P0):**

- Fix immediately (<24 hours)
- Notify beta users when resolved
- Use template from `docs/operations/beta-feedback-analysis.md`

---

#### Day 7: Week 1 Review (1 hour)

**What:** Analyze feedback, decide if ready for Week 2.

**How:**

1. **Review all feedback** (30 min):
   - Open tracking spreadsheet
   - Categorize each item:
     - **Type:** Bug, Feature, UX, Data, Performance, Accessibility, Positive, Other
     - **Priority:** P0 (critical), P1 (high), P2 (medium), P3 (low)
   - Use criteria from `docs/operations/beta-feedback-analysis.md` Section: "Priority Levels"

2. **Check exit criteria** (15 min):
   - [ ] <5 P0 bugs discovered total
   - [ ] All P0 bugs fixed
   - [ ] Uptime >99% for the week
   - [ ] Error rate <2% average
   - [ ] Positive feedback from >70% of users

3. **Decide next step** (15 min):
   - **If all criteria met:** ✅ Proceed to Week 2 (Expanded Beta)
   - **If not met:** ⏸️ Extend Week 1, fix issues, re-check in 3 days

**Weekly review template:** `docs/operations/beta-testing-plan.md` Section: "Week 1 Review"

---

### Week 2: Expanded Beta (50-100 users)

**Goal:** Test with larger user base. Validate performance at scale.

---

#### Day 8: Expand Recruitment (1 hour)

**What:** Invite broader community to join beta.

**Who to invite:**

- Student volunteers (Queen's University, SLC)
- Community leaders
- General public via community boards
- Social service users

**How:**

1. Use recruitment template: `docs/operations/beta-testing-plan.md` Section: "Phase 2 Recruitment"
2. Post to:
   - Community bulletin boards (physical + online)
   - Community partner newsletters
   - Social media (low-key post, not promoted)
3. Email community organizations
4. Track sign-ups in spreadsheet

**Target:** 50-100 total beta users (including Week 1 users)

---

#### Days 9-14: Daily Monitoring (20 min/day)

**What:** Monitor with increased attention to performance.

**Daily routine (every day, ~20 min):**

1. **Check Feedback (5 min):** Same as Week 1

2. **Check Observability (10 min):**
   - [ ] Uptime: >99%?
   - [ ] Error rate: <1%? (tighter than Week 1)
   - [ ] **Performance:** p95 latency <800ms?
   - [ ] Traffic patterns: Any spikes or unusual behavior?
   - [ ] Check SLO compliance card

3. **Review Search Quality (5 min):**
   - [ ] Look at top search queries (aggregate, privacy-safe)
   - [ ] Are users finding what they need?
   - [ ] Any common failed searches?

**Use checklist:** `docs/operations/beta-testing-plan.md` Section: "Phase 2 Daily Monitoring"

---

#### Day 14: Week 2 Review (1 hour)

**What:** Assess readiness for public soft launch.

**Check exit criteria:**

- [ ] <10 P1 bugs discovered (can have some P2/P3)
- [ ] All P0 bugs fixed
- [ ] All P1 bugs fixed
- [ ] Platform handles 50+ concurrent users
- [ ] Performance: p95 latency <800ms consistently
- [ ] Error rate <1%
- [ ] Positive feedback from >75% of users

**If all met:** ✅ Proceed to Weeks 3-4 (Public Soft Launch)

**If not:** ⏸️ Extend Week 2, address issues

---

### Weeks 3-4: Public Soft Launch (Unlimited Users)

**Goal:** Open to public. Monitor at scale. Prepare for full launch.

---

#### Day 15: Low-Key Public Announcement (30 min)

**What:** Make platform publicly available without big fanfare.

**How:**

1. **Update site:**
   - Remove any "Beta" banners (if present)
   - Update status to "Available"

2. **Announce (low-key):**
   - Social media post (organic, not paid): "CareConnect is now available to help you find local services..."
   - Email to community partners
   - Word-of-mouth through beta users
   - Community partner newsletters

3. **DON'T do:**
   - Press release (save for full launch)
   - Paid advertising
   - Big promotional campaign

**Template:** `docs/operations/beta-testing-plan.md` Section: "Phase 3 Announcement"

---

#### Days 16-28: Daily Monitoring (15-20 min/day)

**What:** Monitor real-world usage at scale.

**Daily routine (every day, ~15-20 min):**

1. **Check Observability Dashboard (10 min):**
   - [ ] Visit `/admin/observability`
   - [ ] **Uptime:** >99.5%? (tighter SLO)
   - [ ] **Error rate:** <0.5%? (tighter SLO)
   - [ ] **Latency p95:** <800ms?
   - [ ] **Circuit breaker:** CLOSED? (green)
   - [ ] **SLO compliance:** All green?
   - [ ] Any Slack alerts?

2. **Process Feedback (5-10 min):**
   - [ ] Check all feedback channels
   - [ ] Triage new feedback (type + priority)
   - [ ] Add to tracking spreadsheet
   - [ ] Create GitHub issues for P0/P1 bugs

3. **Weekly Pattern Check (Mondays, extra 15 min):**
   - [ ] Review traffic trends
   - [ ] Top search queries (any surprises?)
   - [ ] User retention (are beta users returning?)
   - [ ] Any emerging patterns?

**Use checklist:** `docs/operations/beta-testing-plan.md` Section: "Phase 3 Daily Monitoring"

**Response times:**

- **P0 bugs:** Fix immediately (<24 hours)
- **P1 bugs:** Fix within 3 days
- **P2 bugs:** Fix before full launch
- **P3 bugs:** Backlog for post-launch

---

#### Day 28: Launch Readiness Assessment (2 hours)

**What:** Complete scorecard to decide if ready for full public launch.

**How:**

1. **Complete Launch Readiness Scorecard** (1 hour):
   - Open: `docs/operations/beta-feedback-analysis.md` Section: "Launch Readiness Scorecard"
   - Score 7 categories on scale of 1-5:

   | Category              | Weight | Your Score | Pass? |
   | --------------------- | ------ | ---------- | ----- |
   | **Stability**         | 25%    | \_\_\_/5   | ✓/✗   |
   | **User Satisfaction** | 20%    | \_\_\_/5   | ✓/✗   |
   | **Performance**       | 15%    | \_\_\_/5   | ✓/✗   |
   | **Data Quality**      | 15%    | \_\_\_/5   | ✓/✗   |
   | **Accessibility**     | 10%    | \_\_\_/5   | ✓/✗   |
   | **Search Quality**    | 10%    | \_\_\_/5   | ✓/✗   |
   | **Feedback Response** | 5%     | \_\_\_/5   | ✓/✗   |

   **Scoring guide:**
   - 5 = Excellent (exceeds expectations)
   - 4 = Good (meets all targets)
   - 3 = Acceptable (minor issues)
   - 2 = Needs work (major issues)
   - 1 = Not ready (critical problems)

2. **Calculate weighted score** (15 min):
   - Multiply each score by weight
   - Sum all weighted scores
   - Example: (5 × 0.25) + (4 × 0.20) + ... = Final Score

3. **Make launch decision** (45 min):
   - **Score >4.0:** ✅ **READY FOR FULL PUBLIC LAUNCH**
   - **Score 3.5-4.0:** ⚠️ Address concerns, then launch
   - **Score 3.0-3.5:** ⏸️ Extend soft launch, fix major issues
   - **Score <3.0:** 🚫 Not ready, significant work needed

**Scorecard template:** `docs/operations/beta-feedback-analysis.md`

---

### Beta Testing Completion Checklist

**Before full public launch, confirm:**

- [ ] **Week 1 complete:** 10-20 users, <5 P0 bugs, all fixed
- [ ] **Week 2 complete:** 50-100 users, <10 P1 bugs, all fixed
- [ ] **Weeks 3-4 complete:** Public soft launch, 2+ weeks stable
- [ ] **Uptime:** >99.5% for final 2 weeks
- [ ] **Error rate:** <0.5% for final 2 weeks
- [ ] **Performance:** p95 <800ms consistently
- [ ] **All P0/P1 bugs fixed**
- [ ] **Launch Readiness Scorecard:** >4.0
- [ ] **User feedback:** Majority positive

**If all checked:** ✅ **READY FOR FULL PUBLIC LAUNCH**

**Total beta time:** 4 weeks, ~15-20 hours total effort

---

## PART 3: Full Public Launch (After Beta)

**When:** After Launch Readiness Scorecard >4.0

---

### Launch Day Actions (2-3 hours)

#### 1. Final Pre-Launch Check (30 min)

**One more quick verification:**

- [ ] Run critical user journey tests (5 scenarios)
- [ ] Check `/admin/observability` - all green?
- [ ] Verify no open P0/P1 bugs
- [ ] Check Slack alerts configured
- [ ] Confirm rollback procedures accessible

---

#### 2. Public Announcement (1 hour)

**Announce broadly:**

**Option A: Full Announcement**

- Press release to local media
- Social media campaign (promoted posts)
- Email to all community partners
- Post to community boards city-wide
- Community radio/TV (if available)

**Option B: Gradual Announcement**

- Social media posts (organic + promoted)
- Email to community partners
- Word-of-mouth expansion
- Local news if they reach out

**Choose based on your capacity and goals.**

**Templates available (optional):** `docs/planning/v19-0-launch-preparation.md` Phase 5

---

#### 3. Launch Day Monitoring (4 hours, first 4 hours critical)

**Follow:** `docs/operations/launch-monitoring-checklist.md`

**First 4 hours (every 30 min):**

1. **Quick check** (10 min each):
   - [ ] Visit `/admin/observability` dashboard
   - [ ] Check Slack for alerts
   - [ ] Review top search queries
   - [ ] Check error rate (<0.5%)
   - [ ] Verify latency (<800ms p95)

2. **Every hour (deep dive, 15 min):**
   - [ ] Performance analysis (p50/p95/p99)
   - [ ] Traffic analysis (spikes? patterns?)
   - [ ] Data quality spot check
   - [ ] User feedback review

**Hours 4-24 (every 2 hours):**

- Standard check (10 min)
- Dashboard review
- Alert review
- Trend analysis

**Full checklist:** `docs/operations/launch-monitoring-checklist.md`

---

#### 4. If Issues Arise (As Needed)

**Use rollback procedures if critical issue found:**

**Severity 1 (SEV-1): Critical Bug**

- **Symptoms:** Search broken, auth failing, data loss risk
- **Response:** <5 minutes
- **Action:** Immediate rollback via Vercel
- **Follow:** `docs/operations/launch-rollback-procedures.md` SEV-1 procedure

**Severity 2 (SEV-2): High Error Rate**

- **Symptoms:** Error rate >5%, users reporting issues
- **Response:** <15 minutes
- **Action:** Try quick fix (5 min), then rollback if no improvement
- **Follow:** `docs/operations/launch-rollback-procedures.md` SEV-2 procedure

**Severity 3 (SEV-3): Performance Degradation**

- **Symptoms:** p95 latency >1500ms, slowness reports
- **Response:** <30 minutes
- **Action:** Evaluate root cause, attempt optimization, rollback if persistent
- **Follow:** `docs/operations/launch-rollback-procedures.md` SEV-3 procedure

**Full rollback procedures:** `docs/operations/launch-rollback-procedures.md`

---

### Post-Launch Week (Days 2-7)

**Daily monitoring** (15 min/day):

- Check observability dashboard
- Review SLO compliance
- Process user feedback
- Monitor for issues

**Weekly review** (Day 7, 1 hour):

- Assess first week performance
- Review all feedback
- Identify improvements
- Celebrate successes!

**Use checklist:** `docs/operations/launch-monitoring-checklist.md` Section: "Post-Launch Week"

---

## Summary: Your Complete Action Plan

### Phase 1: Final QA (4-6 hours) **START HERE**

1. Production environment audit (2 hours)
2. Critical user journey testing (2-3 hours)
3. Data quality review (1 hour)
4. **Must pass** all blocking criteria

### Week 1: Invite-Only Beta (10-20 users)

1. Day 1: Recruit users (1-2 hours)
2. Days 2-7: Daily monitoring (15 min/day)
3. Day 7: Week 1 review (1 hour)

### Week 2: Expanded Beta (50-100 users)

1. Day 8: Expand recruitment (1 hour)
2. Days 9-14: Daily monitoring (20 min/day)
3. Day 14: Week 2 review (1 hour)

### Weeks 3-4: Public Soft Launch

1. Day 15: Low-key announcement (30 min)
2. Days 16-28: Daily monitoring (15-20 min/day)
3. Day 28: Launch readiness assessment (2 hours)

### Full Public Launch (After scorecard >4.0)

1. Final pre-launch check (30 min)
2. Public announcement (1 hour)
3. Launch day monitoring (first 4 hours critical)
4. Post-launch week monitoring (15 min/day)

---

## Time Investment Summary

| Phase                 | Time Required                  | When        |
| --------------------- | ------------------------------ | ----------- |
| Phase 1 QA            | 4-6 hours one-time             | Before beta |
| Week 1 Beta           | ~2.5 hours                     | Week 1      |
| Week 2 Beta           | ~3.5 hours                     | Week 2      |
| Weeks 3-4 Soft Launch | ~5 hours                       | Weeks 3-4   |
| Launch Day            | 5-6 hours                      | Launch day  |
| **Total**             | **~20-25 hours over 5+ weeks** |             |

**Most time is daily monitoring (15-20 min/day) spread across weeks.**

---

## All Documents Reference

| Document                                         | Purpose                    | When to Use           |
| ------------------------------------------------ | -------------------------- | --------------------- |
| **This guide**                                   | High-level execution plan  | Always - your roadmap |
| `docs/operations/final-qa-procedures.md`         | Detailed Phase 1 QA steps  | Phase 1 (4-6 hours)   |
| `docs/operations/beta-testing-plan.md`           | Detailed beta procedures   | Weeks 1-4 (beta)      |
| `docs/operations/beta-feedback-analysis.md`      | Feedback management        | Throughout beta       |
| `docs/operations/launch-monitoring-checklist.md` | Launch day monitoring      | Launch day + Week 1   |
| `docs/operations/launch-rollback-procedures.md`  | Emergency rollback         | If critical issue     |
| `docs/operations/communication-templates.md`     | Incident communication     | If issues arise       |
| `docs/user-guide.md`                             | User documentation         | Share with beta users |
| `docs/faq.md`                                    | Frequently asked questions | Share with users      |

---

## Questions & Troubleshooting

### "What if I find a critical bug during QA?"

- **Stop.** Don't proceed to beta.
- **Fix immediately.**
- **Re-test** that specific scenario.
- **Verify** no regressions.
- **Then** continue QA.

### "What if crisis search doesn't work?"

- **This is BLOCKING.** Do not proceed to beta under any circumstances.
- **Fix immediately** before any users access the platform.
- **Lives depend on this working perfectly.**

### "What if accessibility fails?"

- **This is BLOCKING.** Legal requirement (WCAG 2.1 AA).
- **Fix before beta.**
- **Re-test with keyboard and screen reader.**
- **Verify** all interactions work without mouse.

### "What if I can't recruit beta users?"

- **Quality over quantity.** Start with 5-10 trusted users.
- **Week 1** can be smaller if needed.
- **Extend Week 1** instead of rushing to Week 2.
- **Key:** Get diverse feedback (different use cases, devices, accessibility needs).

### "What if I don't have time for daily monitoring?"

- **Daily monitoring is critical** during beta.
- **15-20 min/day** is minimum safe amount.
- **If truly unavailable:** Extend beta phases (Week 1 = 2 weeks, etc.)
- **Don't skip** - monitoring prevents disasters.

### "Can I skip beta testing entirely?"

- **Not recommended.** Beta testing finds issues before public sees them.
- **If you must:** At minimum, do Week 1 with 5-10 trusted users.
- **Risk:** Public launch with unknown bugs = bad user experience.

### "What if scorecard is <4.0?"

- **Don't launch yet.**
- **Review low-scoring categories.**
- **Fix major issues.**
- **Extend soft launch 1-2 weeks.**
- **Re-assess scorecard.**
- **Launch when ready (>4.0), not on schedule.**

### "What if there's a critical issue on launch day?"

- **Stay calm.**
- **Follow rollback procedures** in `docs/operations/launch-rollback-procedures.md`
- **SEV-1 = rollback in <5 minutes** via Vercel dashboard
- **Communicate** using templates in `docs/operations/communication-templates.md`
- **Fix issue, re-deploy, monitor closely.**

---

## Success Indicators

**You're on track if:**

- ✅ Phase 1 QA passes all blocking criteria
- ✅ Week 1 beta: <5 P0 bugs, all fixed
- ✅ Week 2 beta: <10 P1 bugs, all fixed
- ✅ Soft launch: Uptime >99.5%, error rate <0.5%
- ✅ Users report positive experiences
- ✅ No accessibility complaints
- ✅ Crisis search works perfectly every time
- ✅ Launch readiness scorecard >4.0

**You're ready to launch when:**

- ✅ All above indicators met
- ✅ 2+ weeks of stable soft launch
- ✅ All P0/P1 bugs fixed
- ✅ Team feels confident
- ✅ Rollback procedures tested and understood

---

## Final Checklist Before You Start

**Prerequisites:**

- [ ] All v19.0 documentation complete ✅
- [ ] Production site deployed and accessible
- [ ] `/admin/observability` dashboard accessible
- [ ] Slack alerts configured
- [ ] You have 4-6 hours available for Phase 1 QA
- [ ] You can commit 15-20 min/day for 4 weeks (beta)
- [ ] You've read this entire guide
- [ ] You understand the process

**If all checked:** ✅ **You're ready to start Phase 1 QA!**

**Next step:** Open `docs/operations/final-qa-procedures.md` and begin Section 1.1 (Environment Variables Check).

---

**Document Version:** 1.0
**Last Updated:** 2026-02-09
**Status:** Ready for User Execution
**Estimated Total Time:** 20-25 hours over 5+ weeks
**Start Here:** Phase 1 Final QA → `docs/operations/final-qa-procedures.md`
