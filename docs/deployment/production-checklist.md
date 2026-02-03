# Production Deployment Checklist

**Version:** 1.0
**Last Updated:** 2026-02-03
**Maintained By:** Platform Team

---

## Overview

This checklist ensures safe, reliable deployments to production. Follow all steps in order before deploying new features or fixes to the Kingston Care Connect production environment.

**Deployment Platform:** Vercel
**Estimated Time:** 15-30 minutes (excluding tests)
**Prerequisites:** Repository access, Vercel admin access, admin privileges

---

## Pre-Deployment Checklist

### 1. Code Quality & Testing ✅

**Local Verification:**

- [ ] All changes committed to feature branch
- [ ] No uncommitted or unstaged changes (`git status` clean)
- [ ] Code formatted with Prettier (`npm run format`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript type-check passes (`npm run type-check`)
- [ ] No console.log or debugging statements in code

**Test Coverage:**

- [ ] All unit tests passing (`npm test -- --run`)
  - Expected: 643+ tests passing, 0 failures
  - Coverage thresholds met (lib/search 65%, lib/ai 85%, hooks 85%)
- [ ] Integration tests passing
- [ ] E2E tests passing locally (`npm run test:e2e:local`)
  - Note: E2E tests are non-blocking in CI (ADR-015)
- [ ] Accessibility tests passing (`npm run test:a11y`)
- [ ] No new test skips or `.only` modifiers

**Build Verification:**

- [ ] Production build succeeds (`npm run build`)
- [ ] No build warnings or errors
- [ ] Bundle size acceptable (check build output)
- [ ] Embeddings generated successfully (postbuild step)

---

### 2. Database & Schema Changes 🗄️

**If database schema changes:**

- [ ] Migration scripts tested in development
- [ ] Backup taken before migration
- [ ] Row Level Security (RLS) policies updated if needed
- [ ] Database indexes reviewed (see `docs/adr/014-database-index-optimization.md`)
- [ ] Migration is backward-compatible OR coordinated downtime planned
- [ ] Rollback plan documented

**If data changes:**

- [ ] Data validation scripts run (`npm run validate-data`)
- [ ] Data quality audit performed (`npm run audit:qa`)
- [ ] Service count verified (`npm run audit:data`)
- [ ] Embeddings regenerated if service data changed

---

### 3. Environment Variables 🔐

**Verify all required environment variables configured in Vercel:**

**Required:**

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (production domain)

**Observability (v18.0):**

- [ ] `AXIOM_TOKEN` (Axiom API token)
- [ ] `AXIOM_ORG_ID` (Axiom organization ID)
- [ ] `AXIOM_DATASET` (e.g., `kingston-care-production`)
- [ ] `SLACK_WEBHOOK_URL` (Slack alerts webhook)
- [ ] `CRON_SECRET` (for authenticated cron jobs)

**Circuit Breaker (v17.5+):**

- [ ] `CIRCUIT_BREAKER_ENABLED=true`
- [ ] `CIRCUIT_BREAKER_FAILURE_THRESHOLD=3`
- [ ] `CIRCUIT_BREAKER_TIMEOUT=30000`

**Optional:**

- [ ] `OPENAI_API_KEY` (if AI features enabled)
- [ ] `TWILIO_ACCOUNT_SID` (if phone validation used)
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `OPENCAGE_API_KEY` (if geocoding used)

**Verify:**

```bash
# Pull production environment variables (requires Vercel CLI)
vercel env pull --environment=production .env.production
# Review .env.production for completeness
```

---

### 4. Security Review 🔒

**Security Checks:**

- [ ] No secrets committed to repository
- [ ] No API keys in client-side code
- [ ] Authentication guards in place for protected routes
- [ ] Authorization checks on all server actions (use `lib/auth/authorization.ts`)
- [ ] Input validation on all API endpoints (Zod schemas)
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (escape user input, use `highlightMatches` safely)
- [ ] CSRF protection enabled (Next.js default)
- [ ] Rate limiting configured on public endpoints
- [ ] Content Security Policy (CSP) headers configured

**Dependency Audit:**

- [ ] No critical vulnerabilities (`npm audit --audit-level=high`)
- [ ] Dependencies up to date (review `npm outdated`)
- [ ] No known security advisories for dependencies

---

### 5. Performance & Resilience 🚀

**Performance Checks:**

- [ ] Circuit breaker enabled on all API routes
- [ ] Database queries optimized (no N+1 queries)
- [ ] Images optimized (use Next.js Image component)
- [ ] Bundle size within acceptable limits (<500KB first load JS)
- [ ] Critical resources preloaded
- [ ] Service Worker configured (PWA)

**Load Testing (Optional but Recommended):**

- [ ] Smoke test passed (`npm run test:load:smoke`)
- [ ] Load test passed (`npm run test:load`)
- [ ] Circuit breaker triggers correctly under load

**Resilience:**

- [ ] Fallback mechanisms tested (circuit breaker → JSON fallback)
- [ ] Offline mode works (PWA + IndexedDB)
- [ ] Error boundaries in place for critical components
- [ ] Graceful degradation for AI features

---

### 6. Monitoring & Observability 📊

**Axiom Setup:**

- [ ] Axiom dataset created (`kingston-care-production`)
- [ ] Axiom API token configured in Vercel
- [ ] Test event sent successfully
- [ ] Cron job tested (`/api/cron/export-metrics`)

**Slack Alerting:**

- [ ] Slack webhook created and configured
- [ ] Test alert sent successfully
- [ ] Alert channel monitored (`#kingston-alerts`)
- [ ] Alert throttling verified

**Dashboard:**

- [ ] Observability dashboard accessible (`/admin/observability`)
- [ ] Metrics displaying correctly
- [ ] Circuit breaker status visible

**Health Checks:**

- [ ] Health endpoint responds (`GET /api/v1/health`)
- [ ] All services reporting healthy
- [ ] Database connectivity confirmed

---

### 7. Documentation 📝

**Code Documentation:**

- [ ] README.md up to date
- [ ] CLAUDE.md reflects new features/patterns
- [ ] API documentation updated (if API changes)
- [ ] ADRs created for architectural decisions
- [ ] Runbooks updated for new failure modes

**User Documentation:**

- [ ] User-facing features documented
- [ ] Setup guides updated (if new integrations)
- [ ] Migration guide created (if breaking changes)

---

## Deployment Process

### Step 1: Create Pull Request 🔀

```bash
# Ensure you're on your feature branch
git checkout feature/your-feature

# Push to remote
git push origin feature/your-feature

# Create PR via GitHub CLI or web interface
gh pr create --title "feat: your feature description" \
  --body "Description of changes, testing performed, etc."
```

**PR Checklist:**

- [ ] PR title follows conventional commits (feat/fix/chore/docs)
- [ ] PR description includes:
  - What changed
  - Why it changed
  - How to test
  - Screenshots (if UI changes)
- [ ] CI checks pass (tests, linting, build)
- [ ] Code review approved by team member
- [ ] No merge conflicts

---

### Step 2: Preview Deployment 👀

**Vercel automatically creates preview deployment on PR:**

- [ ] Preview deployment URL available
- [ ] Preview deployment successful (no build errors)
- [ ] Manual testing on preview:
  - [ ] Core functionality works
  - [ ] New features work as expected
  - [ ] No console errors in browser
  - [ ] Mobile responsiveness verified
  - [ ] PWA functionality intact

**Smoke Test on Preview:**

```bash
# Test critical endpoints
curl https://preview-url.vercel.app/api/v1/health
curl https://preview-url.vercel.app/api/v1/services

# Test search
curl -X POST https://preview-url.vercel.app/api/v1/search/services \
  -H "Content-Type: application/json" \
  -d '{"query":"food bank"}'
```

---

### Step 3: Merge to Main 🎯

**Merge Strategy:**

- [ ] Squash and merge (clean history)
- [ ] Delete feature branch after merge
- [ ] Ensure main branch CI passes

```bash
# Via GitHub CLI
gh pr merge --squash --delete-branch

# Or via GitHub web interface
```

---

### Step 4: Production Deployment 🚀

**Vercel automatically deploys main branch to production:**

**Monitor Deployment:**

- [ ] Deployment starts within 1 minute of merge
- [ ] Build succeeds (watch Vercel dashboard)
- [ ] Deployment completes (usually 2-5 minutes)
- [ ] Deployment marked as "Ready"

**Deployment Notifications:**

- [ ] Vercel deployment notification received (Slack/email)
- [ ] No deployment errors or warnings

---

### Step 5: Post-Deployment Verification ✅

**Immediate Checks (< 5 minutes):**

- [ ] Production site loads (`https://kingstoncare.ca`)
- [ ] No 500 errors on homepage
- [ ] Search functionality works
- [ ] User authentication works
- [ ] Admin dashboard accessible (`/admin/observability`)

**Health Checks:**

```bash
# Verify health endpoint
curl https://kingstoncare.ca/api/v1/health

# Expected response:
# {"status":"healthy","timestamp":"...","circuitBreaker":{...}}

# Verify services endpoint
curl https://kingstoncare.ca/api/v1/services | jq '.data | length'

# Expected: 196+ services
```

**Database Verification:**

- [ ] Database connectivity confirmed
- [ ] Circuit breaker state: CLOSED
- [ ] No errors in Vercel function logs

**Observability Checks:**

- [ ] Axiom receiving events (check Axiom dashboard)
- [ ] Metrics dashboard updating (`/admin/observability`)
- [ ] No Slack alerts (indicates healthy system)

---

### Step 6: Monitor for Issues 🔍

**First Hour (Critical Window):**

- [ ] Watch Vercel function logs for errors
- [ ] Monitor Axiom for unusual events
- [ ] Check Slack alerts channel (`#kingston-alerts`)
- [ ] Monitor error rates in observability dashboard
- [ ] Verify circuit breaker remains CLOSED

**Performance Monitoring:**

- [ ] Response times normal (p95 <800ms)
- [ ] No memory leaks (function invocations stable)
- [ ] No cold start issues (first requests <3s)

**User Impact Monitoring:**

- [ ] No user complaints or bug reports
- [ ] Search quality maintained (test key queries)
- [ ] Analytics tracking working

---

### Step 7: Rollback Plan (If Needed) 🔄

**Immediate Rollback (< 5 minutes):**

If critical issues detected:

```bash
# List recent deployments
vercel deployments list --prod

# Rollback to previous stable deployment
vercel rollback <PREVIOUS_DEPLOYMENT_URL>

# Verify rollback
curl https://kingstoncare.ca/api/v1/health
```

**Rollback Triggers:**

- Circuit breaker flapping (opens >3 times in 10 minutes)
- Error rate >10% sustained for >5 minutes
- Critical functionality broken (search, auth, admin)
- Database connection failures
- Performance degradation (p95 >2000ms)

**Post-Rollback:**

- [ ] Incident documented in Slack
- [ ] Root cause investigation started
- [ ] Fix developed and tested
- [ ] Retry deployment with fix

---

### Step 8: Post-Deployment Tasks 📋

**Within 24 Hours:**

- [ ] Monitor metrics for anomalies
- [ ] Review error logs for new patterns
- [ ] Check user feedback channels
- [ ] Update deployment log (if maintained)

**Documentation Updates:**

- [ ] CHANGELOG.md updated with release notes
- [ ] Version number bumped (if applicable)
- [ ] Tag release in Git (`git tag v18.0`)

**Team Communication:**

- [ ] Deployment announcement in team Slack
- [ ] Known issues documented (if any)
- [ ] Next deployment scheduled (if needed)

---

## Emergency Rollback Procedures

### Scenario 1: Critical Bug in Production

**Symptoms:** Search broken, auth failing, data corruption

**Action:**

```bash
# Immediate rollback
vercel rollback <LAST_KNOWN_GOOD_URL>

# Notify team
# Post in #kingston-alerts: "🚨 Emergency rollback performed due to [issue]"

# Follow incident response plan
# See: docs/runbooks/README.md
```

---

### Scenario 2: Database Migration Failed

**Symptoms:** Database errors, missing tables, RLS failures

**Action:**

1. Rollback application first
2. Rollback database migration (use backup)
3. Verify data integrity
4. Document migration failure
5. Fix migration script offline
6. Test in staging before retry

---

### Scenario 3: Circuit Breaker Stuck Open

**Symptoms:** All requests failing fast, fallback data served

**Action:**

1. Check Supabase status (https://status.supabase.com)
2. Verify database connectivity
3. Review circuit breaker logs in Axiom
4. Follow runbook: `docs/runbooks/circuit-breaker-open.md`
5. Manual circuit reset if false positive (use admin dashboard)

---

## Deployment Frequency Guidelines

**Regular Deployments:**

- Frequency: Weekly (Fridays preferred)
- Window: Outside peak hours (evenings/weekends)
- Batch size: Multiple small PRs preferred over large releases

**Hotfixes:**

- Deployed immediately for critical bugs
- Skip preview testing if necessary (document why)
- Minimal changes (single bug fix)
- Extra monitoring required

**Major Releases:**

- Coordinated with team
- Staged rollout (preview → production)
- Extended monitoring period (24-48 hours)
- Rollback plan rehearsed

---

## Tools & Resources

**Required Tools:**

- Vercel CLI: `npm i -g vercel`
- GitHub CLI: `brew install gh` (or equivalent)
- jq: `brew install jq` (for JSON parsing)

**Dashboards:**

- Vercel: https://vercel.com/dashboard
- Supabase: https://app.supabase.com
- Axiom: https://app.axiom.co
- GitHub: https://github.com/yourusername/kingston-care-connect

**Documentation:**

- ADRs: `docs/adr/`
- Runbooks: `docs/runbooks/`
- API Docs: `docs/api/`
- Security: `docs/security/`

---

## Appendix: Common Issues & Solutions

### Issue: Build Fails on Vercel

**Cause:** Environment variable missing or build script error

**Solution:**

1. Check Vercel build logs for specific error
2. Verify all environment variables configured
3. Test build locally: `npm run build`
4. Check Node.js version matches (20+)

---

### Issue: Health Check Returns Unhealthy

**Cause:** Database connection failed or circuit breaker open

**Solution:**

1. Check Supabase dashboard for outages
2. Review circuit breaker status in logs
3. Verify environment variables (SUPABASE_SECRET_KEY)
4. Follow runbook: `docs/runbooks/circuit-breaker-open.md`

---

### Issue: Slack Alerts Not Sending

**Cause:** Webhook URL incorrect or not configured

**Solution:**

1. Verify `SLACK_WEBHOOK_URL` in Vercel environment variables
2. Test webhook manually: `curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"test"}'`
3. Check Slack app permissions
4. Review logs for "Slack webhook" errors

---

### Issue: Embeddings Not Generated

**Cause:** Postbuild script failed or services.json not found

**Solution:**

1. Check build logs for `generate-embeddings.ts` errors
2. Verify `data/services.json` exists and is valid
3. Run locally: `node --import tsx scripts/generate-embeddings.ts`
4. Check model download succeeded (~500MB)

---

## Changelog

| Date       | Version | Changes                      | Author |
| ---------- | ------- | ---------------------------- | ------ |
| 2026-02-03 | 1.0     | Initial production checklist | Team   |

---

**Next Review:** After first production incident or 2026-03-03
**Maintained By:** Platform Team
**Questions?** See `docs/runbooks/README.md` or ask in #kingston-ops
