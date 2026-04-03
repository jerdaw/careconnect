# Launch Rollback Procedures

**Version:** 1.0
**Date Created:** 2026-02-09
**Last Updated:** 2026-03-11
**Purpose:** Clear procedures for reverting problematic deployments

---

## Overview

This document provides step-by-step rollback procedures for different failure scenarios. Use these procedures to quickly restore service when issues arise during or after launch.

**Core Principle:** When in doubt, roll back. It's better to revert and investigate than to leave users with a broken experience.

**Related Documents:**

- [Launch Monitoring Checklist](launch-monitoring-checklist.md)
- [Incident Response Plan](incident-response-plan.md)
- [Deployment Checklist](../deployment/production-checklist.md)

---

## Decision Matrix

### When to Roll Back vs. Forward-Fix

**Roll Back when:**

- ✅ Critical functionality is broken (search, crisis services)
- ✅ Data loss or corruption risk
- ✅ Security vulnerability discovered
- ✅ Widespread user impact (>10% of users affected)
- ✅ No immediate fix available
- ✅ Uncertainty about root cause

**Forward-Fix when:**

- ✅ Fix is simple and well-understood
- ✅ Impact is minor (<5% of users)
- ✅ Rollback would cause more disruption
- ✅ Hot-fix can be deployed in <15 minutes
- ✅ Root cause is known and isolated

**Ask yourself:**

1. How many users are affected?
2. How severe is the impact?
3. Do I know the root cause?
4. Can I fix it in <15 minutes?
5. Is there risk of making it worse?

**If unsure:** Roll back, then investigate.

---

## Severity Levels

### SEV-1: Critical - Immediate Rollback Required

**Definition:** Complete service outage or data loss risk

**Examples:**

- Search completely broken
- Site won't load (500 errors for all users)
- Database connection failures
- Authentication completely broken
- Data corruption or loss
- Security breach

**Response Time:** <5 minutes
**Action:** Immediate rollback
**Decision Authority:** Any on-call engineer

---

### SEV-2: High - Rollback Strongly Recommended

**Definition:** Major degradation affecting many users

**Examples:**

- Error rate >5% sustained for >5 minutes
- Critical features broken (crisis search, service cards)
- Performance severely degraded (p95 >2000ms)
- Widespread search failures
- Mobile site broken

**Response Time:** <15 minutes
**Action:** Rollback unless fix is immediate
**Decision Authority:** On-call engineer (escalate if uncertain)

---

### SEV-3: Medium - Evaluate Before Rolling Back

**Definition:** Moderate impairment, some users affected

**Examples:**

- Error rate 1-5%
- Slow performance (p95 800-1500ms)
- Non-critical feature broken (print button, map view)
- Intermittent issues
- Accessibility regression

**Response Time:** <1 hour
**Action:** Attempt forward-fix, rollback if no progress in 30 min
**Decision Authority:** On-call engineer + lead

---

### SEV-4: Low - Forward-Fix Preferred

**Definition:** Minor issues, low user impact

**Examples:**

- Visual glitches
- Minor UI bugs
- Low-traffic features affected
- Documentation errors
- Non-blocking performance issues

**Response Time:** <4 hours
**Action:** Forward-fix via next deployment
**Decision Authority:** Development team

---

## Rollback Procedures

### Scenario 1: Critical Bug (SEV-1)

**Symptoms:**

- Search returns 500 errors
- Site won't load for users
- Database connection failures
- Complete feature failure
- Data loss risk

**Impact:** All users affected, service unusable

**Rollback Time:** <5 minutes

#### Step-by-Step Rollback

**1. Acknowledge the Incident (30 seconds)**

- [ ] Post in Slack: "🚨 SEV-1: Rolling back deployment - [brief description]"
- [ ] Start timer for accountability

**2. Identify the last known good VPS release (1 minute)**

- [ ] SSH to the VPS
- [ ] List `/srv/apps/careconnect-web/releases/`
- [ ] Identify the previous known-good release directory
- [ ] Confirm the current symlink target before changing it

**3. Initiate Rollback (2 minutes)**

- [ ] Repoint `current` to the previous release
- [ ] Re-run the VPS deploy script with the production env file
- [ ] Wait for the container replacement to complete

```bash
ln -sfn /srv/apps/careconnect-web/releases/<previous-release> \
  /srv/apps/careconnect-web/current
cd /srv/apps/careconnect-web/current
./scripts/deploy-vps-proof.sh /etc/projects-merge/env/careconnect-web.env
```

**4. Verify Rollback Success (1 minute)**

- [ ] Visit production URL in incognito window
- [ ] Test critical user journey (search for "food bank")
- [ ] Check health endpoint: `curl https://careconnect.ing/api/v1/health`
- [ ] Confirm 200 OK status

**5. Monitor for Stability (1 minute)**

- [ ] Check `/admin/observability` dashboard
- [ ] Verify error rate drops to <0.5%
- [ ] Confirm circuit breaker is CLOSED
- [ ] Check Slack for any new alerts

**6. Communicate Rollback (30 seconds)**

- [ ] Post in Slack: "✅ Rollback complete. Service restored. Investigating root cause."
- [ ] Update status page (if configured)
- [ ] Note total downtime

**Total Time:** <5 minutes

#### Post-Rollback Actions

- [ ] **Document the incident**
  - What broke?
  - When did it start?
  - How was it detected?
  - What was the impact?

- [ ] **Create GitHub issue**
  - Title: "SEV-1: [Brief description] - [Date]"
  - Label: `bug`, `sev-1`, `production`
  - Assign to appropriate developer

- [ ] **Investigate root cause**
  - Review deployment diff
  - Check logs for errors
  - Reproduce locally if possible
  - Document findings

- [ ] **Plan fix**
  - Create hotfix branch
  - Write tests that would catch this bug
  - Review and test thoroughly
  - Deploy with extra caution

- [ ] **Schedule Post-Incident Review (PIR)**
  - Within 48 hours of incident
  - Follow [Incident Response Plan](incident-response-plan.md)

**Prevention:**

- Why did this reach production?
- How can we prevent similar issues?
- Do we need better testing?
- Should deployment process change?

---

### Scenario 2: High Error Rate (SEV-2)

**Symptoms:**

- Error rate >5% sustained
- Many users reporting issues
- Search failing for some users
- Database queries timing out
- Performance severely degraded

**Impact:** 5-50% of users affected

**Rollback Time:** <15 minutes

#### Step-by-Step Rollback

**1. Confirm Error Rate (2 minutes)**

- [ ] Check `/admin/observability` dashboard
- [ ] Verify error rate >5%
- [ ] Check error distribution (which endpoints?)
- [ ] Review error logs for patterns

**2. Attempt Quick Fix (5 minutes)**

**Only if:**

- Root cause is obvious
- Fix is 1-line change
- You're confident it will work

**Quick fix examples:**

- Revert single environment variable
- Fix typo in query
- Adjust rate limit threshold

**If fix works:**

- ✅ Monitor for 5 minutes
- ✅ Verify error rate drops
- ✅ Document the fix

**If fix doesn't work or is uncertain:**

- 🔄 Proceed to rollback

**3. Initiate Rollback (3 minutes)**

- [ ] Post in Slack: "⚠️ SEV-2: Rolling back - high error rate"
- [ ] SSH to the VPS
- [ ] Repoint `current` to the previous working release
- [ ] Run `./scripts/deploy-vps-proof.sh /etc/projects-merge/env/careconnect-web.env`
- [ ] Wait for completion

**4. Verify Rollback (3 minutes)**

- [ ] Test critical user journeys
- [ ] Check error rate has dropped
- [ ] Verify health check returns 200 OK
- [ ] Monitor dashboard for 2 minutes

**5. Communicate and Monitor (2 minutes)**

- [ ] Post in Slack: "✅ Rollback complete. Error rate: [current %]"
- [ ] Continue monitoring every 5 minutes for 30 minutes
- [ ] Verify stability

**Total Time:** <15 minutes

#### Post-Rollback Analysis

- [ ] **Analyze error logs**
  - Which errors were most common?
  - Which endpoints were affected?
  - Were there any patterns (time, user type, etc.)?

- [ ] **Review deployment changes**
  - What changed between deployments?
  - Was there database schema change?
  - Were dependencies updated?

- [ ] **Create issue and fix**
  - Document root cause
  - Create hotfix with tests
  - Review thoroughly
  - Test in staging first

**Prevention:**

- Add integration tests for affected paths
- Improve error monitoring
- Consider canary deployments for high-risk changes

---

### Scenario 3: Performance Degradation (SEV-3)

**Symptoms:**

- p95 latency >1500ms
- Slow page loads
- Timeouts intermittently
- Database slow queries
- Users report "sluggish" experience

**Impact:** All users affected, but service still works

**Rollback Time:** <30 minutes (evaluate first)

#### Step-by-Step Evaluation

**1. Diagnose Performance Issue (10 minutes)**

- [ ] Check `/admin/observability` dashboard
  - Current p50, p95, p99 latencies
  - Latency trends over last hour
  - Any sudden spikes or gradual degradation?

- [ ] Review slow query logs (if available)
  - Which queries are slowest?
  - Are there N+1 queries?
  - Missing indexes?

- [ ] Check circuit breaker status
  - Is it HALF_OPEN or OPEN?
  - Are database connections timing out?

- [ ] Monitor resource usage
  - Is database connection pool exhausted?
  - Are serverless functions timing out?

**2. Attempt Optimization (10 minutes)**

**If root cause is clear:**

- **Missing index?**
  - Add index via Supabase dashboard
  - Monitor improvement

- **Database connection issue?**
  - Check connection pool settings
  - Restart stale connections

- **Cache invalidation?**
  - Clear cache if applicable
  - Verify cache hit rate

**If optimization works:**

- ✅ Monitor for 15 minutes
- ✅ Verify latency returns to normal
- ✅ Document the fix

**3. Decide: Rollback or Continue Monitoring (5 minutes)**

**Roll back if:**

- Optimization didn't work
- Latency continues to degrade
- Users are complaining
- p95 >2000ms

**Continue monitoring if:**

- Latency is stabilizing
- p95 is 800-1500ms (within tolerance)
- Optimization is showing improvement
- User impact is minimal

**4. If Rolling Back: Execute Rollback (5 minutes)**

- [ ] Post in Slack: "⚠️ SEV-3: Rolling back - performance degradation"
- [ ] SSH to the VPS
- [ ] Repoint `current` to the previous release
- [ ] Run `./scripts/deploy-vps-proof.sh /etc/projects-merge/env/careconnect-web.env`
- [ ] Monitor latency recovery

**5. Verify Performance Restored (5 minutes)**

- [ ] Check p95 latency <800ms
- [ ] Test search feels responsive
- [ ] Monitor for 10 minutes
- [ ] Confirm stable

**Total Time:** <30 minutes (evaluation) + <5 minutes (rollback if needed)

#### Post-Issue Analysis

- [ ] **Identify slow queries**
  - Use Supabase query performance analyzer
  - Add missing indexes
  - Optimize N+1 queries

- [ ] **Review code changes**
  - Were new queries added?
  - Are there inefficient loops?
  - Is caching being used properly?

- [ ] **Load test fixes**
  - Run `npm run test:load` with fixes
  - Verify latency under load
  - Compare to baseline

**Prevention:**

- Add performance tests to CI
- Monitor query performance in development
- Use database query explain plans
- Profile slow paths before deploying

---

## Emergency Rollback via CLI

**If you do not have your usual shell session open on the VPS:**

### Prerequisites

```bash
ssh haadmin@your-vps
```

### Rollback Command

```bash
# List recent releases
ls -1 /srv/apps/careconnect-web/releases

# Repoint current to the previous release and redeploy
ln -sfn /srv/apps/careconnect-web/releases/<previous-release> \
  /srv/apps/careconnect-web/current
cd /srv/apps/careconnect-web/current
./scripts/deploy-vps-proof.sh /etc/projects-merge/env/careconnect-web.env
```

### Verify Rollback

```bash
# Check running container and health
docker ps --filter name=careconnect-web
curl http://127.0.0.1:3300/api/v1/health

# Test health endpoint
curl https://careconnect.ing/api/v1/health
```

---

## Rollback Decision Tree

```
Issue Detected
    |
    ├─ SEV-1 (Complete outage)?
    │   └─ YES → ROLLBACK IMMEDIATELY (<5 min)
    │
    ├─ SEV-2 (High error rate >5%)?
    │   ├─ Quick fix obvious?
    │   │   ├─ YES → Try fix (5 min), then rollback if no improvement
    │   │   └─ NO → ROLLBACK (<15 min)
    │   └─ Root cause unknown?
    │       └─ YES → ROLLBACK (<15 min)
    │
    ├─ SEV-3 (Performance degraded)?
    │   ├─ Latency >2000ms?
    │   │   └─ YES → ROLLBACK (<30 min)
    │   ├─ Optimization possible?
    │   │   ├─ YES → Try optimization (10 min), monitor (15 min)
    │   │   └─ NO → ROLLBACK (<30 min)
    │   └─ Latency <1500ms?
    │       └─ YES → MONITOR, consider forward-fix
    │
    └─ SEV-4 (Minor issue)?
        └─ Forward-fix in next deployment
```

---

## Communication Templates

### Rollback Initiated

**Slack:**

```
🚨 [SEV-1/SEV-2/SEV-3] Rollback Initiated

Issue: [Brief description]
Impact: [User impact]
Action: Rolling back to previous deployment
ETA: [Time estimate]
Status updates: Every [frequency]
```

### Rollback Complete

**Slack:**

```
✅ Rollback Complete

Deployed: [Previous deployment URL/version]
Downtime: [Duration]
Current status: [Stable/Monitoring]
Error rate: [Current %]
Latency p95: [Current ms]

Next steps:
- Root cause investigation
- Issue created: [GitHub issue link]
- PIR scheduled: [Date/time]
```

### Rollback Failed

**Slack:**

```
🚨 URGENT: Rollback Failed

Issue: [Description]
Attempted rollback: [What was tried]
Current state: [System status]
Action needed: [Escalation/next steps]

@[Lead Engineer] @[Backup] - Immediate assistance needed
```

---

## Post-Rollback Checklist

After any rollback, complete these steps:

### Immediate (Within 1 Hour)

- [ ] **Verify service stability**
  - Monitor dashboard for 30 minutes
  - Confirm metrics are normal
  - Check for new alerts

- [ ] **Document incident**
  - Create GitHub issue with `rollback` label
  - Include: symptoms, timeline, actions taken
  - Attach relevant logs/screenshots

- [ ] **Communicate status**
  - Update team via Slack
  - Post on status page (if configured)
  - Notify stakeholders if needed

### Short-Term (Within 24 Hours)

- [ ] **Root cause analysis**
  - Review deployment diff
  - Analyze logs and metrics
  - Reproduce issue locally
  - Document findings

- [ ] **Create hotfix**
  - Write failing test that reproduces bug
  - Implement fix
  - Verify tests pass
  - Code review

- [ ] **Test hotfix thoroughly**
  - Test locally
  - Deploy to staging
  - Run full test suite
  - Manual QA

### Medium-Term (Within 48 Hours)

- [ ] **Schedule Post-Incident Review (PIR)**
  - Invite: on-call engineer, lead, stakeholders
  - Prepare timeline and findings
  - Follow [Incident Response Plan](incident-response-plan.md)

- [ ] **Update runbooks**
  - Add new failure scenario if novel
  - Update resolution procedures
  - Improve detection methods

- [ ] **Prevent recurrence**
  - Add tests to catch this issue
  - Update deployment checklist
  - Consider process improvements

---

## Metrics to Track

### Rollback Metrics

Track these for continuous improvement:

- **Number of rollbacks per month**
  - Target: <1 rollback per quarter
  - Red flag: >1 rollback per month

- **Rollback time (detection to resolution)**
  - SEV-1 target: <5 minutes
  - SEV-2 target: <15 minutes
  - SEV-3 target: <30 minutes

- **Downtime caused by issue**
  - Measure from issue start to rollback complete
  - Track against SLO error budget

- **Time to redeploy fix**
  - Measure from rollback to successful fix deployment
  - Track trend - should decrease over time

### Improvement Opportunities

**If rollbacks are frequent:**

- Improve pre-deployment testing
- Add integration tests
- Require staging deployment first
- Implement canary deployments

**If rollback time is slow:**

- Practice rollback procedures
- Improve monitoring and alerting
- Simplify rollback process
- Document common scenarios better

---

## Best Practices

### Before You Roll Back

1. **Capture evidence**
   - Take screenshots of error dashboards
   - Save error logs
   - Document user reports
   - Note exact time issue started

2. **Communicate proactively**
   - Tell team you're investigating
   - Set expectations for timeline
   - Keep stakeholders informed

3. **Verify it's deployment-related**
   - Check if issue started with deployment
   - Rule out external causes (Supabase outage, DNS)
   - Confirm rollback will actually fix it

### During Rollback

1. **Follow procedures**
   - Don't skip steps
   - Document what you're doing
   - Time each action

2. **Stay calm**
   - Panic leads to mistakes
   - Trust the process
   - Ask for help if unsure

3. **Communicate clearly**
   - Post updates regularly
   - Be honest about status
   - Don't speculate without evidence

### After Rollback

1. **Monitor closely**
   - Don't assume it's fixed
   - Watch dashboards for 30+ minutes
   - Be ready to escalate

2. **Learn from it**
   - Conduct blameless PIR
   - Document lessons learned
   - Update processes

3. **Fix properly**
   - Don't rush the fix
   - Test thoroughly
   - Get code review

---

## When NOT to Roll Back

**Don't roll back if:**

- Issue is external (Supabase outage, DNS problem)
- Rollback would cause data loss
- Database migration is one-way only
- Issue was in previous deployment too
- Rollback introduces different critical bug

**Instead:**

- Fix forward if possible
- Implement workaround
- Scale resources if performance issue
- Wait for external service recovery

---

## Emergency Contacts

**On-Call Engineer:** [Name/Contact]
**Backup Engineer:** [Name/Contact]
**Lead Engineer:** [Name/Contact]
**Escalation:** [Management contact]

**External:**

- Hetzner console/support (host access issues only)
- Supabase Support: support@supabase.io

---

## Related Procedures

- [Launch Monitoring Checklist](launch-monitoring-checklist.md) - What to watch during launch
- [Incident Response Plan](incident-response-plan.md) - Full incident management process
- [Production Deployment Checklist](../deployment/production-checklist.md) - Safe deployment practices
- [Circuit Breaker Runbook](../runbooks/circuit-breaker-open.md) - Database protection
- [High Error Rate Runbook](../runbooks/high-error-rate.md) - Error investigation

---

**Remember:** Rolling back is not a failure. It's a safety mechanism. Better to roll back and fix properly than to leave users with a broken experience.

When in doubt, roll back.

---

**Last Updated:** 2026-03-11
**Version:** 1.0
**Next Review:** After first rollback or 2026-03-09
