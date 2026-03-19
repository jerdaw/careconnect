# Launch Monitoring Checklist

**Version:** 1.0
**Date Created:** 2026-02-09
**Last Updated:** 2026-03-11
**Purpose:** Systematic monitoring procedures for safe production launch

---

## Overview

This checklist ensures comprehensive monitoring during the critical launch period. Follow these procedures to detect and respond to issues quickly.

**Launch Phases:**

1. **Pre-Launch** (T-1 hour): Final verification before go-live
2. **Launch Day - Critical Hours** (Hours 0-4): Intensive monitoring
3. **Launch Day - Extended** (Hours 4-24): Continued close monitoring
4. **Post-Launch Week** (Days 2-7): Daily monitoring

**Related Documents:**

- [Rollback Procedures](launch-rollback-procedures.md)
- [Incident Response Plan](incident-response-plan.md)
- [Observability Dashboard](/admin/observability)

---

## Pre-Launch Checklist (T-1 Hour)

**Goal:** Verify all systems are operational before announcing launch.

**Timeframe:** 1 hour before public announcement

### 1. Deployment Verification

- [ ] **Confirm deployment successful**
  - Confirm `/srv/apps/helpbridge-web/current` points at the intended release
  - Verify `docker ps` shows `helpbridge-web` up on `127.0.0.1:3300`
  - Check container logs for warnings or crash loops

- [ ] **Verify production URL accessible**
  - Visit production URL in browser
  - Confirm homepage loads correctly
  - Check for HTTPS (no certificate errors)

### 2. Health Check Validation

- [ ] **Test health check endpoint**

  ```bash
  curl https://helpbridge.ca/api/v1/health
  ```

  - Expected: 200 OK status
  - Response includes: `"status": "healthy"`
  - Circuit breaker state: `"CLOSED"`

- [ ] **Check observability dashboard**
  - Visit `/admin/observability`
  - Confirm dashboard loads without errors
  - Verify latest metrics are recent (<5 min old)

### 3. Critical User Journey Testing

- [ ] **Crisis Search Flow**
  - Search for "suicide help"
  - Verify crisis banner appears
  - Check Distress Centre Kingston is first result
  - Confirm contact information is clickable
  - **Target:** Complete flow in <5 seconds

- [ ] **General Search Flow**
  - Search for "food bank"
  - Verify results appear
  - Check top 3 results are relevant
  - Confirm service cards display correctly
  - **Target:** Results in <800ms

- [ ] **Mobile Responsiveness**
  - Test on mobile device or browser mobile view
  - Verify search works
  - Check service cards are readable
  - Test tap targets (phone, email, website)

### 4. Monitoring Infrastructure

- [ ] **Confirm Slack alerts enabled**
  - Check `SLACK_WEBHOOK_URL` is set
  - Test with sample alert (if safe to do so)
  - Verify Slack channel receives alerts

- [ ] **Verify Axiom metrics flowing**
  - Check Axiom dashboard for recent data
  - Confirm metrics are being exported
  - Verify cron job is active

- [ ] **Check SLO dashboard status**
  - Visit SLO Compliance Card on observability page
  - Confirm uptime tracking is active
  - Verify error budget shows correct baseline
  - Check latency p95 is being measured

### 5. Security & Configuration

- [ ] **Verify environment variables**
  - All required env vars set in production
  - No placeholder values (like "YOUR_KEY_HERE")
  - Secrets are not exposed in client

- [ ] **Test rate limiting**
  - Confirm rate limiting is active (60 req/min)
  - Verify rate limit headers in response
  - Check rate limit doesn't block legitimate use

- [ ] **Check CSP headers**
  - Inspect response headers in browser dev tools
  - Confirm Content-Security-Policy is present
  - Verify no CSP violations in console

### 6. Data Quality Spot Check

- [ ] **Verify top services are accurate**
  - Check top 5 crisis services have correct phone numbers
  - Verify hours are up to date
  - Confirm addresses are correct

- [ ] **Test search quality**
  - Search for "food"
  - Verify Partners in Mission Food Bank appears
  - Check verification badges are visible
  - Confirm descriptions are helpful

### 7. Error Monitoring Baseline

- [ ] **Review error logs**
  - Check application logs for errors (should be minimal/none)
  - Review database connection logs
  - Verify no unexpected warnings

- [ ] **Confirm zero critical errors**
  - No 500 errors in recent logs
  - No database connection failures
  - Circuit breaker has not opened

### 8. Team Readiness

- [ ] **On-call schedule confirmed**
  - Know who is on-call for launch day
  - Contact information is current
  - Escalation path is clear

- [ ] **Communication channels ready**
  - Slack channel for launch monitoring active
  - Key stakeholders have access
  - Communication templates ready (see Task 3.3)

### Pre-Launch Sign-Off

**If all checks pass:**

- ✅ System is ready for launch
- ✅ Monitoring is active
- ✅ Team is prepared

**If any checks fail:**

- 🚫 **DO NOT LAUNCH**
- Investigate and fix issues
- Re-run failed checks
- Document any deviations

**Sign-Off:**

- Date/Time: **\*\***\_\_\_**\*\***
- Checked By: **\*\***\_\_\_**\*\***
- Status: GO / NO-GO

---

## Launch Day: Critical Hours (0-4 Hours)

**Goal:** Detect and respond to issues immediately.

**Monitoring Frequency:** Every 30 minutes

**Who:** Primary on-call engineer + backup

### Every 30 Minutes: Quick Check

#### Dashboard Review (5 min)

- [ ] **Visit `/admin/observability`**
  - Uptime: Should be >99.5%
  - Error rate: Should be <0.5%
  - Latency p95: Should be <800ms
  - Circuit breaker: Should be CLOSED

- [ ] **Check SLO Compliance Card**
  - All 3 metrics green (Uptime, Error Budget, Latency)
  - No violation alerts displayed
  - Error budget remaining >90%

#### Slack Monitoring (2 min)

- [ ] **Review Slack alerts**
  - Check for any automated alerts
  - Review alert severity
  - Confirm alerts are legitimate (not false positives)

- [ ] **No critical alerts?**
  - ✅ Continue monitoring
  - If critical alert: Follow [Incident Response Plan](incident-response-plan.md)

#### User Feedback (3 min)

- [ ] **Check feedback channels**
  - Review feedback widget submissions
  - Check email (feedback@helpbridge.ca)
  - Monitor social media (if applicable)

- [ ] **Common issues?**
  - Document any patterns
  - Escalate if multiple users report same issue

### Hourly: Deep Dive (15 min)

**Hours 1, 2, 3, 4 after launch**

#### Performance Analysis

- [ ] **Review latency trends**
  - Check p50, p95, p99 latencies
  - Compare to baseline (<800ms p95)
  - Look for degradation trends

- [ ] **Check error rate details**
  - Review error types (4xx vs 5xx)
  - Identify most common errors
  - Verify errors are not increasing

- [ ] **Monitor circuit breaker**
  - Confirm state is CLOSED
  - Check failure counts (should be low)
  - Review any state transitions

#### Traffic Analysis

- [ ] **Review search patterns**
  - Top 10 search queries (aggregate only, privacy-safe)
  - Are users finding what they need?
  - Any unexpected search patterns?

- [ ] **Check traffic volume**
  - Request rate (req/min)
  - Compare to load test baselines
  - Verify rate limiting is not blocking legitimate traffic

#### Data Quality

- [ ] **Spot-check search results**
  - Test 3-5 common searches
  - Verify results are relevant
  - Check service card displays correctly

- [ ] **Review "no results" feedback**
  - Check NotFoundFeedback submissions
  - Identify missing services or categories
  - Document for future data additions

### Critical Hour Checklist

**Hour 0-1 (First Hour):**

- [ ] 30 min check ✅
- [ ] 60 min deep dive ✅
- [ ] No critical issues detected ✅

**Hour 1-2:**

- [ ] 90 min check ✅
- [ ] 120 min deep dive ✅
- [ ] No critical issues detected ✅

**Hour 2-3:**

- [ ] 150 min check ✅
- [ ] 180 min deep dive ✅
- [ ] No critical issues detected ✅

**Hour 3-4:**

- [ ] 210 min check ✅
- [ ] 240 min deep dive ✅
- [ ] No critical issues detected ✅

### Hour 4: First Milestone

**After 4 hours of stable operation:**

- [ ] **Review overall health**
  - Total uptime: \_\_\_\_%
  - Total error rate: \_\_\_\_%
  - Average p95 latency: **\_**ms

- [ ] **Document any issues**
  - List all issues encountered (even resolved ones)
  - Note resolutions
  - Update runbooks if needed

- [ ] **Post status update**
  - Internal: Update team on launch status
  - External: Consider posting on status page (if configured)

**If all metrics green:**

- ✅ Reduce monitoring frequency to every 2 hours
- ✅ Continue to hour 24

**If issues detected:**

- ⚠️ Continue hourly monitoring
- ⚠️ Investigate root causes
- ⚠️ Consider rollback if critical (see [Rollback Procedures](launch-rollback-procedures.md))

---

## Launch Day: Extended Hours (4-24 Hours)

**Goal:** Ensure stability continues through first full day.

**Monitoring Frequency:** Every 2 hours

**Who:** Primary on-call engineer (backup on standby)

### Every 2 Hours: Standard Check (10 min)

**Hours: 6, 8, 10, 12, 14, 16, 18, 20, 22, 24**

#### Dashboard Quick Review

- [ ] **Visit `/admin/observability`**
  - Uptime still >99.5%?
  - Error rate still <0.5%?
  - Latency p95 still <800ms?
  - Circuit breaker still CLOSED?

- [ ] **SLO Compliance**
  - All metrics green?
  - Error budget consumption normal (<10% used)?
  - No violation alerts?

#### Alert Review

- [ ] **Check Slack for alerts**
  - Any new alerts since last check?
  - Review and triage
  - Acknowledge or escalate

#### Trend Analysis

- [ ] **Compare to previous check**
  - Are metrics improving or degrading?
  - Any concerning trends?
  - Document significant changes

### End of Day 1 (Hour 24)

**After 24 hours of operation:**

#### Final Day 1 Review

- [ ] **Calculate Day 1 metrics**
  - Total uptime: \_\_\_\_%
  - Total error rate: \_\_\_\_%
  - Average p95 latency: **\_**ms
  - Peak concurrent users: **\_**
  - Total searches performed: **\_**

- [ ] **Review all incidents**
  - List all issues (resolved and ongoing)
  - Document resolutions
  - Create follow-up tasks if needed

- [ ] **Assess SLO compliance**
  - Did we meet 99.5% uptime target?
  - Is error budget consumption acceptable?
  - Did we stay under 800ms p95 latency?

#### Day 1 Status Report

**Complete Day 1 summary:**

```
Day 1 Launch Summary (24 hours)

Status: [STABLE / DEGRADED / CRITICAL]

Metrics:
- Uptime: ____%
- Error Rate: ____%
- Latency p95: _____ms
- Total Searches: _____

Issues Encountered:
1. [Issue description] - [RESOLVED / ONGOING]
2. [Issue description] - [RESOLVED / ONGOING]

Actions Taken:
- [Action 1]
- [Action 2]

Next Steps:
- [Next step 1]
- [Next step 2]

Overall Assessment: [1-2 sentence summary]
```

- [ ] **Share summary with team**
  - Post in Slack
  - Email stakeholders
  - Update status page (if configured)

**If Day 1 stable:**

- ✅ Reduce monitoring to daily checks (see Post-Launch Week)
- ✅ Celebrate the successful launch! 🎉

**If issues ongoing:**

- ⚠️ Continue 2-hour monitoring
- ⚠️ Escalate to incident response if needed
- ⚠️ Consider rollback for critical issues

---

## Post-Launch Week (Days 2-7)

**Goal:** Monitor for emerging issues and establish normal operations.

**Monitoring Frequency:** Daily

**Who:** On-call rotation

### Daily Check (15 min)

**Time:** Once per day (morning recommended)

#### Dashboard Review

- [ ] **Visit `/admin/observability`**
  - Review 24-hour metrics
  - Check SLO compliance
  - Verify circuit breaker stable

- [ ] **Compare to baseline**
  - Is uptime meeting 99.5% target?
  - Is error rate under 0.5%?
  - Is latency p95 under 800ms?

#### Weekly Trends

- [ ] **Analyze weekly data** (Days 3, 5, 7)
  - Uptime trend: Stable / Improving / Degrading?
  - Error rate trend: Stable / Improving / Degrading?
  - Latency trend: Stable / Improving / Degrading?

#### Search Quality

- [ ] **Review search patterns**
  - Top 20 search queries (aggregate, privacy-safe)
  - Are users finding what they need?
  - Any common "no results" searches?

- [ ] **Check feedback**
  - Review feedback widget submissions
  - Identify common themes
  - Prioritize improvements

#### Data Quality

- [ ] **Spot-check services**
  - Verify hours are still accurate
  - Check contact information works
  - Test a few random service cards

### Week 1 Milestones

**Day 2:**

- [ ] Daily check complete
- [ ] No critical issues

**Day 3:**

- [ ] Daily check complete
- [ ] First weekly trend analysis
- [ ] No critical issues

**Day 5:**

- [ ] Daily check complete
- [ ] Mid-week trend analysis
- [ ] No critical issues

**Day 7:**

- [ ] Daily check complete
- [ ] Full week trend analysis
- [ ] Week 1 retrospective

### Week 1 Retrospective (Day 7)

**After 7 days of operation:**

#### Metrics Summary

- [ ] **Calculate Week 1 averages**
  - Average uptime: \_\_\_\_%
  - Average error rate: \_\_\_\_%
  - Average p95 latency: **\_**ms
  - Total searches: **\_**
  - Unique users: **\_** (estimate)

- [ ] **SLO Compliance**
  - Met 99.5% uptime target? YES / NO
  - Stayed under 0.5% error rate? YES / NO
  - Met <800ms p95 latency? YES / NO

#### Issue Analysis

- [ ] **Review all issues**
  - Total incidents: **\_**
  - Critical (SEV-1): **\_**
  - High (SEV-2): **\_**
  - Medium (SEV-3): **\_**
  - Low (SEV-4): **\_**

- [ ] **Identify patterns**
  - Common issue types
  - Time-of-day patterns
  - User-facing vs internal issues

#### Improvements Identified

- [ ] **Performance optimizations**
  - List slow queries or endpoints
  - Identify caching opportunities
  - Document optimization tasks

- [ ] **Data quality improvements**
  - Services to add/update
  - Categories needing expansion
  - Verification level upgrades

- [ ] **Feature requests**
  - User feedback themes
  - Common feature requests
  - Prioritize for future versions

#### Week 1 Report

**Complete comprehensive summary:**

```
Week 1 Launch Report

Status: [SUCCESS / PARTIAL SUCCESS / NEEDS IMPROVEMENT]

Metrics:
- Uptime: ____%
- Error Rate: ____%
- Latency p95: _____ms
- Total Searches: _____
- User Engagement: [HIGH / MEDIUM / LOW]

Highlights:
- [Success 1]
- [Success 2]
- [Success 3]

Challenges:
- [Challenge 1] - [How resolved]
- [Challenge 2] - [How resolved]

SLO Compliance:
- Uptime: [MET / NOT MET]
- Error Budget: [MET / NOT MET]
- Latency: [MET / NOT MET]

Lessons Learned:
1. [Lesson 1]
2. [Lesson 2]
3. [Lesson 3]

Next Steps:
- [Action 1]
- [Action 2]
- [Action 3]

Overall Assessment:
[2-3 sentence summary of launch success]
```

- [ ] **Share Week 1 report**
  - Email to team
  - Post in Slack
  - Archive for future reference

### Transition to Normal Operations

**After Week 1:**

- [ ] **Update monitoring schedule**
  - Transition from daily to weekly checks
  - Define normal monitoring cadence
  - Update on-call rotation

- [ ] **Review SLO targets**
  - Are PROVISIONAL targets appropriate?
  - Should targets be adjusted based on Week 1 data?
  - Document any changes to `lib/config/slo-targets.ts`

- [ ] **Update runbooks**
  - Incorporate lessons learned
  - Add new scenarios encountered
  - Update resolution procedures

- [ ] **Plan improvements**
  - Create GitHub issues for identified improvements
  - Prioritize based on impact
  - Schedule for next version

---

## Quick Reference

### Critical Thresholds

| Metric          | Target | Warning   | Critical |
| --------------- | ------ | --------- | -------- |
| Uptime          | >99.5% | <99.5%    | <99.0%   |
| Error Rate      | <0.5%  | >0.5%     | >1.0%    |
| Latency p95     | <800ms | >800ms    | >1500ms  |
| Circuit Breaker | CLOSED | HALF_OPEN | OPEN     |

### Key URLs

- **Observability Dashboard:** `/admin/observability`
- **Health Check:** `/api/v1/health`
- **Metrics:** `/api/v1/metrics` (dev/staging only)
- **Status Page:** `status.helpbridge.ca` (when configured)

### Key Contacts

- **On-Call Engineer:** [Name/Contact]
- **Backup Engineer:** [Name/Contact]
- **Escalation:** [Name/Contact]

### Related Documents

- [Rollback Procedures](launch-rollback-procedures.md)
- [Incident Response Plan](incident-response-plan.md)
- [SLO Violation Runbook](../runbooks/slo-violation.md)
- [Circuit Breaker Runbook](../runbooks/circuit-breaker-open.md)

---

## Notes

**Monitoring Philosophy:**

- Be proactive, not reactive
- Document everything
- Communicate early and often
- Don't panic - follow procedures

**When to Escalate:**

- Critical errors (SEV-1) immediately
- High error rates (SEV-2) within 15 minutes
- SLO violations within 30 minutes
- Uncertain situations - when in doubt, escalate

**Remember:**

- Users depend on this platform in crisis situations
- Fast detection and response save lives
- Good monitoring enables continuous improvement

---

**Last Updated:** 2026-02-09
**Version:** 1.0
**Next Review:** After first launch or 2026-03-09
