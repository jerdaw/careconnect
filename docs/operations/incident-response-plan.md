# Incident Response Plan

**Version:** 1.0
**Last Updated:** 2026-02-03
**Maintained By:** Platform Team
**Review Frequency:** Quarterly or after major incidents

---

## Table of Contents

1. [Overview](#overview)
2. [Incident Severity Levels](#incident-severity-levels)
3. [Incident Response Process](#incident-response-process)
4. [Roles & Responsibilities](#roles--responsibilities)
5. [Communication Protocols](#communication-protocols)
6. [Incident Response Workflow](#incident-response-workflow)
7. [Post-Incident Process](#post-incident-process)
8. [Tools & Resources](#tools--resources)
9. [Appendix](#appendix)

---

## Overview

### Purpose

This plan defines CareConnect's approach to detecting, responding to, and resolving production incidents. The goal is to minimize user impact and restore normal service as quickly as possible.

### Scope

This plan covers all production incidents affecting:

- Search functionality
- Service data availability
- User authentication/authorization
- Partner dashboard
- API endpoints
- Database availability
- Performance degradation

### Principles

1. **User-First:** Minimize user impact above all else
2. **Transparency:** Communicate openly about incidents
3. **Rapid Response:** Acknowledge within 15 minutes, contain within 1 hour
4. **Learn & Improve:** Every incident is a learning opportunity
5. **Blameless:** Focus on systems, not individuals

---

## Incident Severity Levels

### Critical (SEV-1) 🔴

**Definition:** Complete service outage or critical functionality broken affecting all users.

**Examples:**

- Website completely down (500 errors)
- Search functionality non-responsive for all users
- Database unavailable
- Authentication system broken
- Data breach or security incident
- Circuit breaker stuck open

**Response Time:**

- Detection → Acknowledgment: <5 minutes
- Acknowledgment → Mitigation: <15 minutes
- Target MTTR: <1 hour

**Response Team:**

- On-call engineer (immediate)
- Incident Commander (within 15 min)
- CTO (notified immediately)

**Communication:**

- Slack: #kingston-alerts (immediate)
- Status updates: Every 15 minutes
- User communication: Yes (status page, email if extended)

---

### High (SEV-2) 🟠

**Definition:** Major functionality degraded or unavailable for subset of users.

**Examples:**

- Search returning no results for specific queries
- Partner dashboard intermittently failing
- Slow performance (p95 >2000ms)
- Circuit breaker flapping
- High error rates (>10%)
- Geolocation broken
- AI features non-functional

**Response Time:**

- Detection → Acknowledgment: <15 minutes
- Acknowledgment → Mitigation: <30 minutes
- Target MTTR: <4 hours

**Response Team:**

- On-call engineer (immediate)
- Incident Commander (within 30 min)
- Additional engineers (if needed)

**Communication:**

- Slack: #kingston-alerts
- Status updates: Every 30 minutes
- User communication: If extended beyond 2 hours

---

### Medium (SEV-3) 🟡

**Definition:** Minor functionality impaired, workarounds available.

**Examples:**

- Individual API endpoint slow
- Non-critical feature broken (analytics, feedback)
- Elevated error rates (<10%)
- PWA offline sync failing
- Minor UI bugs
- Accessibility issues

**Response Time:**

- Detection → Acknowledgment: <1 hour
- Acknowledgment → Mitigation: <4 hours
- Target MTTR: <24 hours

**Response Team:**

- On-call engineer
- Incident Commander (if escalates)

**Communication:**

- Slack: #kingston-ops
- Status updates: Hourly (if active)
- User communication: No (unless prolonged)

---

### Low (SEV-4) 🟢

**Definition:** Minimal user impact, cosmetic issues, or monitoring alerts.

**Examples:**

- Metrics collection failing
- Documentation errors
- Non-user-facing bugs
- Performance degradation in non-critical paths
- Monitoring false positives

**Response Time:**

- Detection → Acknowledgment: <4 hours
- Target MTTR: <1 week

**Response Team:**

- Assigned engineer
- No incident commander needed

**Communication:**

- Slack: #kingston-ops
- Status updates: Daily
- User communication: No

---

## Incident Response Process

### Phase 1: Detection & Alerting

**Detection Sources:**

1. **Automated Monitoring:**
   - Slack alerts (circuit breaker, error rates)
   - Axiom alerts (custom queries)
   - Vercel deployment failures
   - Health check failures

2. **User Reports:**
   - Support emails
   - Social media mentions
   - Partner dashboard feedback

3. **Proactive Monitoring:**
   - Observability dashboard review
   - Manual smoke tests
   - Third-party monitoring (if configured)

**Alert Channels:**

- **Slack:** `#kingston-alerts` (automated + manual)
- **Email:** alerts@careconnect.ing (backup)
- **Phone:** (Future: PagerDuty integration)

---

### Phase 2: Acknowledgment & Triage

**Within 5-15 minutes of detection (based on severity):**

**Step 1: Acknowledge**

- [ ] Confirm alert is not a false positive
- [ ] Post in #kingston-alerts: "🚨 Incident acknowledged, investigating"
- [ ] Assign incident number: `INC-YYYYMMDD-NNN` (e.g., INC-20260203-001)

**Step 2: Assess Severity**

Use severity matrix above to classify incident:

```
SEV-1: Complete outage, critical functionality broken
SEV-2: Major degradation, subset of users affected
SEV-3: Minor impairment, workarounds available
SEV-4: Minimal impact, cosmetic issues
```

**Step 3: Initiate Response**

- [ ] Assign Incident Commander (SEV-1, SEV-2)
- [ ] Create incident channel: `#inc-YYYYMMDD-NNN` (SEV-1, SEV-2)
- [ ] Pull in additional engineers if needed
- [ ] Start incident timeline (timestamp all actions)

**Template Message:**

```
🚨 INCIDENT ACKNOWLEDGED: INC-20260203-001

Severity: SEV-2 (High)
Issue: Search returning no results for food bank queries
Impact: Subset of users unable to find food assistance services
Start Time: 2026-02-03 14:23 UTC
Incident Commander: @engineer
Status: Investigating

Dashboard: https://careconnect.ing/admin/observability
Runbook: https://github.com/.../docs/runbooks/high-error-rate.md

Updates will be posted every 30 minutes.
```

---

### Phase 3: Investigation & Diagnosis

**Systematic Troubleshooting:**

**Step 1: Gather Context**

- [ ] Check observability dashboard (`/admin/observability`)
- [ ] Review recent deployments (last 24 hours)
- [ ] Check Vercel function logs
- [ ] Review Axiom events
- [ ] Check circuit breaker status
- [ ] Review database status (Supabase dashboard)

**Step 2: Identify Root Cause**

Use appropriate runbook:

- Circuit breaker open → `docs/runbooks/circuit-breaker-open.md`
- High error rates → `docs/runbooks/high-error-rate.md`
- Slow queries → `docs/runbooks/slow-queries.md`

**Step 3: Form Hypothesis**

Document working theory:

```
Hypothesis: Recent deployment introduced bug in search scoring logic
Evidence: Error rate spiked at 14:15 UTC, 10 minutes after deployment
Next Step: Review diff of search/scoring.ts changes
```

---

### Phase 4: Mitigation & Resolution

**Mitigation Strategy:**

**Option A: Immediate Rollback (< 5 minutes)**

Use when:

- Recent deployment is root cause
- Issue is severe (SEV-1, SEV-2)
- Quick rollback is safe

```bash
# Rollback to previous deployment
vercel rollback <LAST_KNOWN_GOOD_URL>

# Verify service restored
curl https://careconnect.ing/api/v1/health
```

**Option B: Hotfix Deployment (15-30 minutes)**

Use when:

- Issue identified and fix is simple
- Rollback not possible (schema changes)
- Fix can be deployed quickly

```bash
# Create hotfix branch
git checkout -b hotfix/inc-20260203-001

# Make minimal fix
# Test locally
npm test -- --run
npm run build

# Deploy
git push origin hotfix/inc-20260203-001
# Create PR, merge, auto-deploy
```

**Option C: Workaround (varies)**

Use when:

- Root cause unclear
- Fix requires significant development
- Temporary workaround available

Examples:

- Route traffic to fallback endpoints
- Enable maintenance mode
- Disable problematic feature
- Manual data correction

---

### Phase 5: Verification

**Confirm Resolution:**

- [ ] Core functionality restored
- [ ] Error rates returned to normal (<1%)
- [ ] Circuit breaker stable (CLOSED)
- [ ] Performance metrics normal (p95 <800ms)
- [ ] No new alerts triggered
- [ ] User reports stopped

**Smoke Tests:**

```bash
# Test critical paths
curl https://careconnect.ing/api/v1/health
# Expected: {"status":"healthy"}

curl https://careconnect.ing/api/v1/services
# Expected: 196+ services

curl -X POST https://careconnect.ing/api/v1/search/services \
  -H "Content-Type: application/json" \
  -d '{"query":"food bank"}'
# Expected: 10+ results
```

**User Validation:**

- [ ] Test affected functionality as end user
- [ ] Verify mobile app works (if applicable)
- [ ] Check PWA offline mode works
- [ ] Verify authentication flow
- [ ] Test partner dashboard

---

### Phase 6: Communication

**Internal Communication:**

**Incident Resolved:**

```
✅ INCIDENT RESOLVED: INC-20260203-001

Severity: SEV-2 (High)
Duration: 47 minutes (14:23 - 15:10 UTC)
Root Cause: Bug in search scoring logic introduced in deploy #123
Resolution: Rolled back to previous deployment
User Impact: ~200 users unable to search for food banks

Timeline:
- 14:23: Incident detected via Slack alert
- 14:25: Incident acknowledged, IC assigned
- 14:30: Root cause identified (recent deployment)
- 14:35: Rollback initiated
- 14:40: Service restored
- 15:10: Verification complete, incident closed

Next Steps:
- Post-mortem scheduled for 2026-02-04 10:00 UTC
- Fix being developed in PR #456
- Enhanced testing added to prevent recurrence

Thanks to @engineer1, @engineer2 for rapid response.
```

**External Communication:**

**For SEV-1 (Critical) Incidents:**

- Update status page (if configured)
- Post on social media (if prolonged >1 hour)
- Email affected partners (if known)

**Template Status Update:**

```
We're currently experiencing issues with search functionality.
Our team is actively working on a fix.

Affected: Search for food bank services
Status: Investigating
Started: 2:23 PM EST
Next Update: 3:00 PM EST

We apologize for any inconvenience.
```

---

## Roles & Responsibilities

### On-Call Engineer

**Responsibilities:**

- First responder to all incidents
- Acknowledge incidents within response time SLA
- Perform initial triage and assessment
- Execute standard runbook procedures
- Escalate to Incident Commander if needed
- Document incident timeline

**Availability:**

- 24/7 on-call rotation (weekly rotations)
- Response time: <15 minutes for SEV-1, <30 minutes for SEV-2
- Access to all production systems

**Tools Required:**

- Laptop with VPN access
- Vercel admin access
- Supabase admin access
- Slack mobile app
- GitHub admin access

---

### Incident Commander (IC)

**Responsibilities:**

- Lead incident response for SEV-1 and SEV-2
- Coordinate response team
- Make critical decisions (rollback, workarounds)
- Own communication (internal and external)
- Ensure runbooks are followed
- Conduct post-incident review

**When to Engage:**

- All SEV-1 incidents (immediately)
- SEV-2 incidents (within 30 minutes)
- SEV-3 escalations (if requested)

**Decision Authority:**

- Approve rollbacks
- Approve hotfix deployments
- Coordinate with stakeholders
- Declare incident resolved

---

### Subject Matter Experts (SMEs)

**Responsibilities:**

- Provide technical expertise for specific systems
- Support IC and on-call engineer
- Review proposed fixes
- Participate in post-incident analysis

**Areas:**

- Search & AI: Search algorithm, WebLLM, embeddings
- Database: Supabase, schema, migrations
- Infrastructure: Vercel, circuit breaker, observability
- Security: Authentication, authorization, RLS
- Frontend: React, Next.js, PWA

---

## Communication Protocols

### Internal Channels

**Slack Channels:**

- **#kingston-alerts**: Automated alerts + incident notifications
- **#kingston-ops**: General operations, non-urgent issues
- **#inc-YYYYMMDD-NNN**: Dedicated incident channel (created per incident)

**Incident Channel Best Practices:**

- Pin IC message at top
- Post all updates in thread
- Use timestamps for all actions
- Archive after incident resolved
- Invite stakeholders only (keep focused)

---

### Update Frequency

| Severity | Update Frequency | Channels                      |
| -------- | ---------------- | ----------------------------- |
| SEV-1    | Every 15 minutes | #kingston-alerts, status page |
| SEV-2    | Every 30 minutes | #kingston-alerts              |
| SEV-3    | Every 1 hour     | #kingston-ops                 |
| SEV-4    | Daily            | #kingston-ops                 |

---

### External Communication

**When to Communicate:**

- SEV-1: Always (immediate)
- SEV-2: If duration >2 hours
- SEV-3: If user-facing and prolonged
- SEV-4: Never (internal only)

**Channels:**

- Status page (if configured)
- Social media (Twitter/X)
- Email to affected partners
- Website banner (for major incidents)

---

## Incident Response Workflow

### Flowchart

```
Alert Received
     ↓
  Acknowledge (5-15 min)
     ↓
  Assess Severity (SEV-1 to SEV-4)
     ↓
  ┌─────────────────┐
  │  SEV-1, SEV-2   │
  │  Engage IC      │
  │  Create channel │
  └─────────────────┘
     ↓
  Investigate
     ↓
  ┌─────────────────┬─────────────────┬─────────────────┐
  │  Recent deploy? │  Database issue?│  Code bug?      │
  │  → Rollback     │  → Runbook      │  → Hotfix       │
  └─────────────────┴─────────────────┴─────────────────┘
     ↓
  Mitigate
     ↓
  Verify Resolution
     ↓
  Communicate Resolution
     ↓
  Schedule Post-Mortem
     ↓
  Close Incident
```

---

## Post-Incident Process

### Post-Incident Review (PIR)

**Timing:** Within 48 hours of incident resolution

**Attendees:**

- Incident Commander
- On-call engineer(s)
- Subject matter experts
- Stakeholders (optional)

**Agenda:**

1. **Incident Overview** (5 min)
   - Timeline of events
   - Impact summary
   - Resolution summary

2. **What Went Well** (10 min)
   - Fast detection
   - Effective communication
   - Runbook usefulness
   - Team collaboration

3. **What Could Be Improved** (15 min)
   - Detection gaps
   - Response delays
   - Documentation issues
   - Tool limitations

4. **Root Cause Analysis** (15 min)
   - Technical root cause
   - Contributing factors
   - Why did defenses fail?
   - 5 Whys analysis

5. **Action Items** (15 min)
   - Preventive measures
   - Monitoring improvements
   - Runbook updates
   - Training needs
   - Assign owners and due dates

**Blameless Culture:**

- Focus on systems, not individuals
- Assume good intent
- Ask "how" not "who"
- Learn from mistakes

---

### Post-Incident Report Template

```markdown
# Post-Incident Review: INC-YYYYMMDD-NNN

## Incident Summary

**Incident ID:** INC-20260203-001
**Severity:** SEV-2 (High)
**Duration:** 47 minutes
**Incident Commander:** @engineer
**Date:** 2026-02-03

## Impact

**User Impact:**

- Estimated 200 users unable to search for food banks
- 0 data loss, 0 security impact

**Business Impact:**

- Potential trust impact (service reliability)
- No revenue impact (free service)

## Timeline

| Time (UTC) | Event                                  |
| ---------- | -------------------------------------- |
| 14:15      | Deploy #123 completed                  |
| 14:23      | Slack alert: High error rate detected  |
| 14:25      | Incident acknowledged, IC assigned     |
| 14:30      | Root cause identified (deployment)     |
| 14:35      | Rollback initiated                     |
| 14:40      | Service restored                       |
| 15:10      | Verification complete, incident closed |

## Root Cause

**Technical:**

- Bug in `lib/search/scoring.ts` line 145
- Division by zero when no results matched
- Not caught in unit tests (edge case)

**Contributing Factors:**

- Insufficient test coverage for edge cases
- No integration test for zero-result scenarios
- No staged rollout (100% traffic immediately)

**Five Whys:**

1. Why did search fail? → Division by zero error
2. Why division by zero? → No results matched query
3. Why not caught in tests? → Edge case not tested
4. Why edge case not tested? → Test coverage gap
5. Why coverage gap? → Scoring logic tests focus on happy path

## What Went Well

✅ Fast detection (8 minutes via automated alerts)
✅ Rapid rollback (15 minutes to resolution)
✅ Clear communication and updates
✅ Runbooks helpful for troubleshooting
✅ No data loss or security impact

## What Could Be Improved

❌ Test coverage for edge cases
❌ No staged rollout strategy
❌ Integration tests don't cover zero-results
❌ Monitoring didn't catch pre-production

## Action Items

| Action                                     | Owner | Due Date   | Priority |
| ------------------------------------------ | ----- | ---------- | -------- |
| Add edge case tests for scoring.ts         | @dev1 | 2026-02-05 | High     |
| Implement staged rollout (5% → 50% → 100%) | @dev2 | 2026-02-10 | Medium   |
| Add integration test for zero-results      | @dev1 | 2026-02-05 | High     |
| Update runbook with this scenario          | @ic   | 2026-02-04 | Low      |
| Review test coverage in CI                 | @dev2 | 2026-02-07 | Medium   |

## Lessons Learned

1. **Testing:** Edge cases are as important as happy paths
2. **Deployment:** Staged rollouts catch issues before full impact
3. **Monitoring:** Early warning systems work (caught in 8 min)
4. **Runbooks:** Having procedures accelerates resolution

## Prevention Measures

**Short-term:**

- Add comprehensive edge case tests
- Increase test coverage threshold to 80%

**Long-term:**

- Implement canary deployments (5% traffic first)
- Add synthetic monitoring (automated smoke tests post-deploy)
- Consider feature flags for risky changes

---

**PIR Conducted:** 2026-02-04 10:00 UTC
**Participants:** IC, Dev1, Dev2, Stakeholder
**Follow-up:** Action items tracked in GitHub Issues
```

---

## Tools & Resources

### Monitoring & Observability

- **Observability Dashboard:** `/admin/observability`
- **Axiom:** https://app.axiom.co
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com

### Communication

- **Slack:** `#kingston-alerts`, `#kingston-ops`
- **Status Page:** (Future: status.careconnect.ing)
- **Email:** alerts@careconnect.ing

### Documentation

- **Runbooks:** `docs/runbooks/`
- **Deployment Checklist:** `docs/deployment/production-checklist.md`
- **Security Incident Response:** `docs/security/breach-response-plan.md`
- **ADRs:** `docs/adr/`

### Tools

- **Vercel CLI:** For rollbacks and deployments
- **GitHub CLI:** For hotfix PRs
- **curl/httpie:** For smoke tests
- **jq:** For JSON parsing in tests

---

## Appendix

### A. Incident Severity Decision Tree

```
Is the entire service down?
├─ Yes → SEV-1
└─ No
    ├─ Is core functionality broken for all users?
    │   ├─ Yes → SEV-1
    │   └─ No
    │       ├─ Is major functionality degraded?
    │       │   ├─ Yes → SEV-2
    │       │   └─ No
    │       │       ├─ Is minor functionality impaired?
    │       │       │   ├─ Yes → SEV-3
    │       │       │   └─ No → SEV-4
```

---

### B. Common Incident Types & Runbooks

| Incident Type        | Runbook                                   | Typical MTTR        |
| -------------------- | ----------------------------------------- | ------------------- |
| Circuit breaker open | `docs/runbooks/circuit-breaker-open.md`   | 5-15 min            |
| High error rates     | `docs/runbooks/high-error-rate.md`        | 15-30 min           |
| Slow performance     | `docs/runbooks/slow-queries.md`           | 30-60 min           |
| Deployment failure   | `docs/deployment/production-checklist.md` | 5-10 min (rollback) |
| Security breach      | `docs/security/breach-response-plan.md`   | Varies              |

---

### C. Contact Information

**On-Call Rotation:**

- Week of 2026-02-03: @engineer1 (primary), @engineer2 (backup)
- Rotation schedule: Monday 9am ET

**Escalation:**

- Incident Commander: @ic-rotation
- CTO: @cto (SEV-1 only)
- Support: support@careconnect.ing

**External:**

- Supabase Support: support@supabase.com
- Vercel Support: Via dashboard
- Axiom Support: support@axiom.co

---

### D. Incident Metrics (Track Quarterly)

**Target SLAs:**

| Metric                   | Target  | Current |
| ------------------------ | ------- | ------- |
| Detection time (SEV-1)   | <5 min  | TBD     |
| Response time (SEV-1)    | <15 min | TBD     |
| MTTR (SEV-1)             | <1 hour | TBD     |
| Incident count (monthly) | <5      | TBD     |
| False positive rate      | <10%    | TBD     |

---

## Changelog

| Date       | Version | Changes                        | Author |
| ---------- | ------- | ------------------------------ | ------ |
| 2026-02-03 | 1.0     | Initial incident response plan | Team   |

---

**Next Review:** After first major incident or 2026-05-03
**Maintained By:** Platform Team
**Questions?** See `docs/runbooks/README.md` or ask in #kingston-ops
