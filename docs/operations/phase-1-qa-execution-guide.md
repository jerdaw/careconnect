# Phase 1 QA Execution Guide

**Version**: v19.0 Phase 1
**Last Updated**: 2026-02-09
**Purpose**: Step-by-step guide for executing Phase 1 Pre-Launch QA

---

## Overview

Phase 1 QA consists of two parts:

1. **Automated Checks** — Run via `npm run qa:prelaunch` (10 checks)
2. **Manual Procedures** — Requires human execution (detailed below)

This guide walks you through the complete QA process from start to finish.

---

## Part 1: Automated Pre-Launch QA

### Prerequisites

- Local development environment set up
- `.env.local` configured with required variables
- All Phase 1.5 implementation complete

### Execution Steps

#### Step 1: Verify Environment Configuration

```bash
npm run validate:env
```

**Expected Result**: ✅ Environment configuration looks good!

**What it checks**:

- All required variables present in `.env.local`
- No placeholder values detected
- Lists optional variables status

**If it fails**:

- Review missing variables list
- Check `.env.example` for reference values
- Add missing variables to `.env.local`
- Re-run until it passes

---

#### Step 2: Run Comprehensive Automated QA

```bash
npm run qa:prelaunch
```

**Duration**: ~3-5 minutes (includes full production build)

**What it checks**:

1. ✅ **TypeScript Compilation** — `tsc --noEmit` passes
2. ✅ **ESLint** — Zero linting errors/warnings
3. ✅ **Service Data Schema** — All 196 services validate
4. ✅ **Data Completeness** — Audit for missing fields
5. ✅ **Translation Parity** — EN/FR key counts match
6. ✅ **Environment Config** — `.env.local` exists
7. ✅ **Production Build** — `npm run build` succeeds
8. ✅ **Critical Files** — All Phase 1.5 files present
9. ✅ **Unit Tests** — 700+ tests pass
10. ✅ **Structured Logging** — No `console.*` in API routes

**Expected Result**:

```
✅ PRE-LAUNCH QA PASSED
   All automated checks passed. Proceed to manual QA steps.

📋 Next Steps:
   1. Review docs/operations/final-qa-procedures.md
   2. Execute manual QA sections (production env audit, user journey testing)
   3. Complete data quality review for top 20 services
```

**If any checks fail**:

- Review failure details in output
- Fix issues identified
- Re-run `npm run qa:prelaunch` until all checks pass
- Do NOT proceed to manual QA until automated checks pass

---

## Part 2: Manual QA Procedures

**⚠️ IMPORTANT**: Only proceed once `npm run qa:prelaunch` passes completely.

---

### Manual Check 1: Production Environment Audit

**Goal**: Verify production hosting platform is configured correctly.

#### 1.1 Vercel Dashboard Review

Navigate to: https://vercel.com/[your-project]/settings/environment-variables

**Checklist**:

- [ ] All required environment variables present
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
  - `NEXT_PUBLIC_APP_URL` (set to `https://careconnect.ing`)
  - `NEXT_PUBLIC_APP_VERSION` (current version)
  - `NEXT_PUBLIC_SEARCH_MODE` (set to `local` or `server`)

- [ ] Observability variables configured (if using v18.0 monitoring)
  - `AXIOM_TOKEN`
  - `AXIOM_ORG_ID`
  - `AXIOM_DATASET`
  - `SLACK_WEBHOOK_URL`

- [ ] Circuit breaker configuration
  - `CIRCUIT_BREAKER_ENABLED=true`
  - `CIRCUIT_BREAKER_FAILURE_THRESHOLD=5`
  - `CIRCUIT_BREAKER_TIMEOUT=10000`

- [ ] No placeholder values remain
  - Search for "example", "your-", "[value]"
  - Verify all values are production-ready

- [ ] Sensitive keys kept secure
  - `SUPABASE_SECRET_KEY` is production key (not dev)
  - `SLACK_WEBHOOK_URL` points to production channel
  - Never exposed in client-side code

#### 1.2 Domain Configuration

- [ ] Custom domain `careconnect.ing` configured and SSL active
- [ ] WWW redirect configured (www.careconnect.ing → careconnect.ing)
- [ ] DNS records verified with `dig careconnect.ing`

#### 1.3 Deployment Settings

- [ ] Production branch set to `main`
- [ ] Auto-deployment enabled
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install`
- [ ] Node.js version: `22.x`

---

### Manual Check 2: Critical User Journey Testing

**Goal**: Verify core user flows work end-to-end in production.

**Where to test**: Use production URL `https://careconnect.ing`

#### 2.1 Search Flow (Crisis Query)

**User Story**: Someone in crisis searches for immediate help.

**Test Steps**:

1. Navigate to `https://careconnect.ing`
2. Enter search query: `"I need food today"`
3. Press Enter or click Search

**Expected Behavior**:

- [ ] Crisis banner appears at top of results
- [ ] 988 crisis line prominently displayed
- [ ] Food banks sorted by distance (if location granted)
- [ ] Results show within 2 seconds
- [ ] No JavaScript errors in browser console

**Pass/Fail**: **\_\_\_\_**

**Notes**: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

#### 2.2 Search Flow (Normal Query)

**User Story**: User searches for general social services.

**Test Steps**:

1. Navigate to `https://careconnect.ing`
2. Enter search query: `"housing support"`
3. Press Enter

**Expected Behavior**:

- [ ] 5-10 relevant results displayed
- [ ] Services show name, address, phone
- [ ] "View Details" button visible on each card
- [ ] Results load within 1 second

**Pass/Fail**: **\_\_\_\_**

**Notes**: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

#### 2.3 Service Detail Page

**User Story**: User clicks into a service to see full details.

**Test Steps**:

1. From search results, click "View Details" on first result
2. Review service detail page

**Expected Behavior**:

- [ ] Service name displayed as H1 heading
- [ ] Full description visible
- [ ] Contact information clearly shown (phone, address)
- [ ] Operating hours displayed (if available)
- [ ] "Get Directions" link works (opens map)
- [ ] "Call Now" button works on mobile
- [ ] Page accessible via keyboard navigation

**Pass/Fail**: **\_\_\_\_**

**Notes**: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

#### 2.4 Language Switching (EN ↔ FR)

**User Story**: Francophone user switches to French.

**Test Steps**:

1. Navigate to `https://careconnect.ing`
2. Click language selector (top-right)
3. Select "Français"
4. Verify URL changes to `/fr`
5. Search for `"banque alimentaire"`

**Expected Behavior**:

- [ ] URL changes to `/fr`
- [ ] All UI text switches to French
- [ ] Search works in French
- [ ] Service names/descriptions show French versions (if available)
- [ ] Can switch back to English successfully

**Pass/Fail**: **\_\_\_\_**

**Notes**: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

#### 2.5 Accessibility (Keyboard Navigation)

**User Story**: Screen reader user navigates the site.

**Test Steps**:

1. Navigate to `https://careconnect.ing`
2. Use only Tab, Enter, and Arrow keys (no mouse)
3. Navigate through search → results → service detail

**Expected Behavior**:

- [ ] Can tab to search input
- [ ] Can type search query
- [ ] Can press Enter to search
- [ ] Can tab through result cards
- [ ] Can press Enter to open service detail
- [ ] Focus indicators clearly visible
- [ ] No keyboard traps

**Pass/Fail**: **\_\_\_\_**

**Notes**: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

#### 2.6 Mobile Responsiveness

**User Story**: User accesses site on mobile device.

**Test Device/Emulator**: \***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***

**Test Steps**:

1. Open `https://careconnect.ing` on mobile device
2. Test search flow
3. Test service detail page
4. Test language switching

**Expected Behavior**:

- [ ] Layout adapts to mobile viewport
- [ ] Search input easily tappable
- [ ] Results cards stack vertically
- [ ] Buttons are touch-friendly (44x44px minimum)
- [ ] Text is readable without zooming
- [ ] No horizontal scrolling

**Pass/Fail**: **\_\_\_\_**

**Notes**: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

### Manual Check 3: Production Monitoring Verification

**Goal**: Verify observability stack is working.

#### 3.1 Axiom Dashboard Check

Navigate to: https://app.axiom.co/[your-org]/datasets/kingston-care-production

**Checklist**:

- [ ] Dataset receiving logs
- [ ] Recent log entries visible (within last 5 minutes)
- [ ] Log levels include INFO, WARN, ERROR
- [ ] Structured metadata present (component, action, etc.)

**Last log timestamp**: **\*\*\*\***\_\_**\*\*\*\***

---

#### 3.2 Slack Alerting Check

Navigate to: Your configured Slack channel

**Checklist**:

- [ ] Bot user connected to workspace
- [ ] Webhook URL is correct in Vercel env vars
- [ ] Test alert sent successfully (optional)

**To test manually** (optional):

```bash
curl -X POST [SLACK_WEBHOOK_URL] \
  -H 'Content-Type: application/json' \
  -d '{"text":"🧪 Test alert from Phase 1 QA"}'
```

---

#### 3.3 SLO Dashboard Access

Navigate to: `https://careconnect.ing/admin/observability`

**Requirements**: Admin account required

**Checklist**:

- [ ] Page loads successfully
- [ ] SLO Compliance card visible
- [ ] Uptime percentage displayed
- [ ] Error budget shown
- [ ] p95 latency displayed
- [ ] Circuit breaker status shown
- [ ] Real-time metrics updating

**If admin account not set up**:

```sql
-- Run in Supabase SQL Editor
INSERT INTO app_admins (user_id) VALUES ('your-user-uuid');
```

---

### Manual Check 4: Data Quality Spot Check

**Goal**: Verify top services have complete, accurate data.

#### 4.1 Top 20 Services Review

**Instruction**: Open `https://careconnect.ing` and search for each category below. Review the top result for completeness.

| #   | Category        | Service Name         | Complete? | Issues               |
| --- | --------------- | -------------------- | --------- | -------------------- |
| 1   | "food bank"     | \***\*\_\_\_\_\*\*** | ☐         | \***\*\_\_\_\_\*\*** |
| 2   | "crisis"        | \***\*\_\_\_\_\*\*** | ☐         | \***\*\_\_\_\_\*\*** |
| 3   | "housing"       | \***\*\_\_\_\_\*\*** | ☐         | \***\*\_\_\_\_\*\*** |
| 4   | "mental health" | \***\*\_\_\_\_\*\*** | ☐         | \***\*\_\_\_\_\*\*** |
| 5   | "addiction"     | \***\*\_\_\_\_\*\*** | ☐         | \***\*\_\_\_\_\*\*** |

**Data Completeness Criteria** (check each):

- [ ] Service name clear and descriptive
- [ ] Description includes eligibility criteria
- [ ] Phone number present and formatted correctly
- [ ] Address complete with postal code
- [ ] Operating hours listed (if applicable)
- [ ] Contact information up-to-date (verify via web search if uncertain)

**Issues Found**: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

### Manual Check 5: Error Handling Verification

**Goal**: Verify error boundaries and 404 handling work.

#### 5.1 Custom 404 Page

**Test Steps**:

1. Navigate to `https://careconnect.ing/en/nonexistent-page`
2. Verify custom 404 page renders

**Expected Behavior**:

- [ ] Branded 404 page shows (not default Next.js 404)
- [ ] Header and footer present
- [ ] "Page Not Found" message displayed
- [ ] "Go Home" button visible and works
- [ ] "Search Services" button visible and works

**Pass/Fail**: **\_\_\_\_**

---

#### 5.2 Error Boundary (Intentional Error)

**Test Steps** (only in staging/dev, not production):

1. Temporarily break a page (e.g., add `throw new Error("test")` to a component)
2. Deploy to staging
3. Visit the broken page

**Expected Behavior**:

- [ ] Error boundary catches the error
- [ ] Branded error page shows
- [ ] Error ID displayed
- [ ] "Try Again" button visible
- [ ] Error logged to Axiom with error ID

**Note**: Skip this test in production. Verify in staging only.

---

## Part 3: Sign-Off

### QA Completion Checklist

**Automated Checks**:

- [ ] `npm run validate:env` passes
- [ ] `npm run qa:prelaunch` passes (all 10 checks)

**Manual Checks**:

- [ ] Production environment audit complete
- [ ] Critical user journey testing complete (6 flows)
- [ ] Production monitoring verified
- [ ] Data quality spot check complete (top 20)
- [ ] Error handling verified

**Issues Found**: \***\*\_\_\*\*** (0 = ready to launch)

**Blocker Issues** (must fix before launch):

- ***

**Nice-to-Have Issues** (can defer):

- ***

---

### Launch Readiness Decision

**Based on QA results, CareConnect is**:

- [ ] ✅ **READY FOR BETA LAUNCH** — All checks passed, no blockers
- [ ] ⚠️ **READY WITH KNOWN ISSUES** — Minor issues documented, can launch
- [ ] ❌ **NOT READY** — Blocker issues must be resolved first

**QA Completed By**: **\*\*\*\***\_\_\_\_**\*\*\*\***
**Date**: **\*\*\*\***\_\_\_\_**\*\*\*\***
**Signature**: **\*\*\*\***\_\_\_\_**\*\*\*\***

---

## Next Steps After QA

### If Ready for Launch:

1. **Review Launch Plan**: `docs/planning/v19-0-launch-preparation.md`
2. **Set Up Monitoring**: `docs/operations/launch-monitoring-checklist.md`
3. **Prepare Rollback**: `docs/operations/launch-rollback-procedures.md`
4. **Execute Beta Launch**: Follow beta testing plan
5. **Monitor Metrics**: Watch SLO dashboard for first 48 hours

### If Issues Found:

1. Document issues in GitHub Issues or project tracker
2. Prioritize blockers vs. nice-to-haves
3. Assign issues to team members
4. Fix blocker issues
5. Re-run Phase 1 QA from start
6. Update roadmap with revised timeline

---

## Troubleshooting Common Issues

### Automated QA Failures

**Issue**: TypeScript compilation fails

**Fix**:

```bash
npm run type-check
# Review errors, fix, repeat
```

---

**Issue**: ESLint errors

**Fix**:

```bash
npm run lint
npm run lint:fix  # Auto-fix where possible
```

---

**Issue**: Unit tests fail

**Fix**:

```bash
npm test -- --run
# Review failures, fix tests or code, repeat
```

---

**Issue**: Production build fails

**Fix**:

```bash
npm run build
# Check build errors
# Common causes: env vars, missing dependencies
```

---

### Manual QA Issues

**Issue**: Search returns no results

**Possible Causes**:

- Service data not loaded (check `data/services.json`)
- Search mode misconfigured (check `NEXT_PUBLIC_SEARCH_MODE`)
- Embeddings not generated (run `npm run build`)

**Fix**: Verify `data/services.json` has ~196 services, re-run build

---

**Issue**: Language switching doesn't work

**Possible Causes**:

- i18n routing misconfigured
- Translation keys missing

**Fix**:

```bash
npm run i18n-audit
# Check for missing translation keys
```

---

**Issue**: Monitoring dashboard shows no data

**Possible Causes**:

- Axiom credentials incorrect
- Logs not being sent
- Dashboard querying wrong dataset

**Fix**:

1. Verify `AXIOM_TOKEN`, `AXIOM_ORG_ID`, `AXIOM_DATASET` in Vercel
2. Check Axiom dashboard for recent logs
3. Review `lib/observability/axiom.ts` implementation

---

## Additional Resources

- **Full QA Procedures**: `docs/operations/final-qa-procedures.md`
- **Launch Checklist**: `docs/operations/launch-monitoring-checklist.md`
- **Rollback Plan**: `docs/operations/launch-rollback-procedures.md`
- **Beta Testing Plan**: `docs/operations/beta-testing-plan.md`
- **User Guide**: `docs/user-guide.md`

---

## Revision History

| Version | Date       | Changes                        | Author           |
| ------- | ---------- | ------------------------------ | ---------------- |
| 1.0     | 2026-02-09 | Initial version for Phase 1 QA | Development Team |
