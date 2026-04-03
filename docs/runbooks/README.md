# Operational Runbooks

## Overview

This directory contains step-by-step troubleshooting guides (runbooks) for common production incidents in CareConnect.

**Purpose:** Enable rapid incident response by providing clear, actionable steps for diagnosing and resolving issues.

**Audience:** On-call engineers, platform operators, DevOps team.

---

## Runbook Inventory

### Critical Incidents

| Runbook                                           | Severity    | MTTR      | Description                                   |
| ------------------------------------------------- | ----------- | --------- | --------------------------------------------- |
| [Circuit Breaker Open](./circuit-breaker-open.md) | 🔴 Critical | 5-15 min  | Database operations protected due to failures |
| [SLO Violation](./slo-violation.md)               | 🔴 Critical | 15-60 min | Service Level Objective targets not met       |

### Warnings & Degraded Performance

| Runbook                                 | Severity   | MTTR      | Description                               |
| --------------------------------------- | ---------- | --------- | ----------------------------------------- |
| [High Error Rate](./high-error-rate.md) | 🟡 Warning | 5-20 min  | Error rate >10%, may escalate to critical |
| [Slow Queries](./slow-queries.md)       | 🟡 Warning | 10-30 min | Database queries taking >1000ms           |

### Operational Procedures

| Procedure                       | Type    | Duration | Description                                    |
| ------------------------------- | ------- | -------- | ---------------------------------------------- |
| [PWA Testing](./pwa-testing.md) | Testing | 15 min   | Progressive Web App functionality verification |

---

## Quick Start

### During an Incident

1. **Check Alerts:**
   - Slack: `#kingston-alerts` channel
   - Dashboard: [/admin/observability](/admin/observability)

2. **Identify Incident Type:**
   - Circuit breaker open → [Circuit Breaker Runbook](./circuit-breaker-open.md)
   - High error rate → [High Error Rate Runbook](./high-error-rate.md)
   - Slow performance → [Slow Queries Runbook](./slow-queries.md)

3. **Follow Runbook Steps:**
   - Immediate Actions (< 2 min)
   - Diagnosis Steps
   - Resolution
   - Verification
   - Escalation (if needed)

4. **Document Incident:**
   - Create post-mortem (template: `docs/templates/post-mortem.md`)
   - Update runbook if gaps found

---

## Runbook Template

All runbooks follow this structure:

```markdown
# Runbook: [Incident Type]

## Overview

- Severity: 🔴 Critical / 🟡 Warning / 🟢 Info
- Impact: User-facing impact description
- MTTR: Mean time to recovery

## Symptoms

How to detect this issue.

## Immediate Actions (< 2 minutes)

Critical first steps.

## Diagnosis Steps

Systematic troubleshooting.

## Resolution

Step-by-step fixes.

## Verification

How to confirm issue is resolved.

## Escalation

When and how to escalate.

## Prevention

How to prevent recurrence.

## Related Resources

Links to docs, dashboards, code.
```

---

## Alert → Runbook Mapping

| Alert Type             | Slack Message             | Runbook                                           |
| ---------------------- | ------------------------- | ------------------------------------------------- |
| Circuit Breaker OPEN   | 🚨 Circuit Breaker OPEN   | [Circuit Breaker Open](./circuit-breaker-open.md) |
| Circuit Breaker CLOSED | ✅ Circuit Breaker CLOSED | N/A (Recovery notification)                       |
| High Error Rate        | ⚠️ High Error Rate Alert  | [High Error Rate](./high-error-rate.md)           |
| SLO Uptime Violation   | 🚨 Uptime SLO Alert       | [SLO Violation](./slo-violation.md)               |
| SLO Error Budget       | 🚨 Error Budget Alert     | [SLO Violation](./slo-violation.md)               |
| SLO Latency Violation  | 🚨 Latency SLO Alert      | [SLO Violation](./slo-violation.md)               |

---

## On-Call Resources

### Dashboards

- **Observability:** [/admin/observability](/admin/observability)
  - Real-time metrics, circuit breaker state, top operations
- **Axiom Logs:** [https://app.axiom.co](https://app.axiom.co)
  - Structured logs, performance events, circuit breaker events
- **Supabase:** [https://app.supabase.com](https://app.supabase.com)
  - Database metrics, query performance, connection status
- **Vercel:** [https://vercel.com/dashboard](https://vercel.com/dashboard)
  - Function logs, deployments, environment variables

### Access Requirements

- Admin role in CareConnect
- Axiom account access (datasets: `kingston-care-production`)
- Supabase project collaborator
- Vercel team member
- Slack `#kingston-alerts` channel member

### Communication Channels

- **Slack:** `#kingston-alerts` (automated alerts)
- **Slack:** `#kingston-incidents` (incident coordination)
- **Email:** alerts@kingstoncare.example.com (backup)

---

## Incident Response Process

### Severity Levels

| Level           | Response Time | Examples                                            |
| --------------- | ------------- | --------------------------------------------------- |
| 🔴 **Critical** | <15 min       | Circuit breaker open, complete outage, data breach  |
| 🟡 **Warning**  | <1 hour       | High error rate, slow queries, degraded performance |
| 🟢 **Info**     | <4 hours      | Recovery notifications, maintenance windows         |

### Response Time Targets

**Critical Incidents:**

- Detection → Response: <5 minutes
- Response → Diagnosis: <5 minutes
- Diagnosis → Fix: <10 minutes
- Total MTTR: <15 minutes

**Warning Incidents:**

- Detection → Response: <15 minutes
- Response → Diagnosis: <15 minutes
- Diagnosis → Fix: <30 minutes
- Total MTTR: <1 hour

### Escalation Matrix

```
Level 1: On-Call Engineer (You)
   ↓ (if unresolved after 30 min OR severity escalates)
Level 2: Senior Engineer / Team Lead
   ↓ (if unresolved after 1 hour OR major incident)
Level 3: Incident Commander + CTO
   ↓ (if PR impact OR security incident)
Level 4: External Support (Supabase, Vercel)
```

**When to Escalate:**

- Issue unresolved after time window
- Severity escalates (warning → critical)
- Root cause unclear
- Expertise needed beyond your level
- Security incident detected
- Public relations impact
- Customer SLA breach

**How to Escalate:**

1. **Gather context:**
   - Incident timeline
   - Steps already taken
   - Current status
   - Logs and error messages

2. **Notify next level:**
   - Slack: `@mention` in `#kingston-incidents`
   - (Future: PagerDuty page)

3. **Continue working:**
   - Don't wait idle
   - Keep investigating
   - Document findings

---

## Post-Incident Process

After resolving an incident:

### 1. Document Timeline

Record in incident log:

- **Detection time:** When alert fired or issue reported
- **Response time:** When investigation began
- **Diagnosis time:** When root cause identified
- **Resolution time:** When fix deployed
- **Verification time:** When confirmed resolved
- **Total downtime:** User-facing impact duration

**Example:**

```
Incident: Circuit Breaker Open
Detection:   2026-01-31 14:23:15 UTC (Slack alert)
Response:    2026-01-31 14:24:32 UTC (+1:17)
Diagnosis:   2026-01-31 14:28:45 UTC (+4:13)
Resolution:  2026-01-31 14:32:10 UTC (+3:25)
Verification: 2026-01-31 14:47:10 UTC (+15:00)
Total MTTR:  8:55 (within <15min target ✅)
Downtime:    None (graceful degradation)
```

### 2. Write Post-Mortem

Use template: `docs/templates/post-mortem.md`

**Sections:**

- **What happened?** (timeline + user impact)
- **Root cause analysis** (why did it happen?)
- **What went well?** (positive aspects)
- **What could improve?** (gaps, delays)
- **Action items** (prevent recurrence)

**Timeline for post-mortem:**

- Critical incidents: Within 24 hours
- Warning incidents: Within 1 week
- Info: Optional

### 3. Update Runbooks

Improve runbooks based on learnings:

- **Add missing steps** found during incident
- **Clarify confusing sections** that slowed response
- **Add new prevention measures**
- **Update commands** if syntax changed
- **Fix broken links**
- **Add new tools/dashboards** used

**Mark runbook as reviewed:**

```markdown
**Last Updated:** 2026-01-31
**Reviewed By:** [Your name] (after [incident ID])
**Next Review:** 2026-04-30
```

### 4. Share Learnings

- **Team meeting:** Discuss incident and learnings (blameless)
- **Update training materials:** Add to onboarding if relevant
- **External communication:** Status page update if public impact
- **Stakeholder update:** Inform leadership if major incident

---

## Continuous Improvement

### Monthly Review

At end of each month:

- [ ] Review all incidents from past month
- [ ] Identify patterns (recurring issues)
- [ ] Measure MTTR trends (improving or degrading?)
- [ ] Update runbooks based on learnings
- [ ] Add new runbooks for new incident types
- [ ] Check if alerts are actionable (too many false positives?)
- [ ] Verify escalation paths worked

**Metrics to track:**

- Total incidents (by severity)
- MTTR (mean time to recovery)
- Alert accuracy (true vs false positives)
- Runbook usage (which runbooks used most)
- Escalation rate (% of incidents escalated)

### Quarterly Audit

Every 3 months:

- [ ] **Test runbooks in staging environment**
  - Follow steps exactly as written
  - Verify all commands work
  - Update if anything changed

- [ ] **Verify all links and commands still work**
  - Dashboard URLs
  - API endpoints
  - CLI commands
  - External services

- [ ] **Update screenshots** if UI changed

- [ ] **Peer review:**
  - Someone who hasn't used runbook before
  - Fresh eyes catch unclear steps
  - Validate MTTR estimates

- [ ] **Conduct incident response drill:**
  - Simulate production incident
  - Follow runbooks
  - Measure response time
  - Identify gaps

---

## Contributing

### Adding a New Runbook

1. **Copy template** from `docs/templates/runbook-template.md`
2. **Fill in all sections:**
   - Overview (severity, impact, MTTR)
   - Symptoms (how to detect)
   - Immediate actions (<2 min steps)
   - Diagnosis steps (systematic troubleshooting)
   - Resolution (step-by-step fixes)
   - Verification (how to confirm fixed)
   - Escalation (when and how)
   - Prevention (avoid recurrence)
   - Related resources (links)

3. **Test steps in staging environment:**
   - Verify commands work
   - Check links are valid
   - Estimate MTTR accurately

4. **Peer review:**
   - Ask colleague to review
   - Test with someone unfamiliar with incident type
   - Incorporate feedback

5. **Add to this index:**
   - Update runbook inventory table
   - Add to alert mapping if applicable
   - Update runbook count at bottom

6. **Update alert mappings:**
   - If runbook corresponds to alert, document it
   - Link from alert to runbook in alerting system

### Updating Existing Runbook

After using a runbook during incident:

1. **Make changes** based on incident learnings
   - Add missing steps
   - Clarify unclear sections
   - Update commands if changed
   - Fix errors

2. **Add "Last Updated" date:**

   ```markdown
   **Last Updated:** 2026-01-31
   **Reviewed By:** [Your name]
   ```

3. **Increment review count** (track how many times used)

4. **Notify team:**
   - Post in `#kingston-ops`
   - Summarize changes
   - Tag relevant people

### Runbook Quality Standards

All runbooks must meet these standards:

- **Clarity:** Steps are clear and unambiguous
- **Completeness:** No assumed knowledge
- **Accuracy:** Commands tested and working
- **Actionable:** Specific steps, not vague advice
- **Timed:** MTTR estimate is realistic
- **Current:** Updated within last 6 months
- **Linked:** All references are valid links

**Before publishing:**

- [ ] Tested in staging environment
- [ ] Peer reviewed by another engineer
- [ ] Links verified (no 404s)
- [ ] Commands tested (copy-paste ready)
- [ ] MTTR estimated (based on test)
- [ ] Severity assigned correctly

---

## Training & Onboarding

### New Team Member Checklist

When onboarding new on-call engineer:

- [ ] **Grant access:**
  - Admin role in CareConnect
  - Axiom account (datasets: `kingston-care-production`)
  - Supabase project collaborator
  - Vercel team member
  - Slack `#kingston-alerts` channel

- [ ] **Review runbooks:**
  - Read all runbooks (30-60 min)
  - Ask questions
  - Note unclear sections

- [ ] **Shadow incident response:**
  - Observe experienced engineer
  - Follow along with runbook
  - Ask questions

- [ ] **Practice in staging:**
  - Simulate incidents
  - Follow runbooks
  - Measure time

- [ ] **First on-call shift:**
  - Pair with experienced engineer
  - Handle incidents together
  - Get feedback

### Incident Response Training

**Recommended training schedule:**

- **Week 1:** Read all runbooks
- **Week 2:** Shadow incident response
- **Week 3:** Practice in staging
- **Week 4:** First on-call (paired)
- **Week 5:** Solo on-call (backup available)

**Ongoing training:**

- Monthly incident review meetings
- Quarterly runbook drills
- Post-incident retrospectives

---

## Related Documentation

### Architecture & Design

- **ADR:** [Performance Tracking & Circuit Breaker](../adr/016-performance-tracking-and-circuit-breaker.md)
- **ADR:** [Database Index Optimization](../adr/014-database-index-optimization.md)

### Observability & Monitoring

- **Guide:** [Alerting Setup](../observability/alerting-setup.md)
- **Guide:** [Alerting Setup](../observability/alerting-setup.md)
- **Guide:** [Axiom Setup](../observability/USER-SETUP-REQUIRED.md)

### Security

- **Plan:** [Breach Response Plan](../security/breach-response-plan.md)

### Implementation

- **Plan:** [v18.0 Production Observability](../implementation/archive/v18-0-production-observability.md)

---

## Metrics & KPIs

### Incident Response Metrics

**Track these KPIs monthly:**

| Metric           | Target  | How to Measure                    |
| ---------------- | ------- | --------------------------------- |
| MTTR (Critical)  | <15 min | Avg time from alert to resolution |
| MTTR (Warning)   | <1 hour | Avg time from alert to resolution |
| Alert Accuracy   | >90%    | True positives / Total alerts     |
| Runbook Usage    | 100%    | % incidents using runbook         |
| Escalation Rate  | <20%    | % incidents requiring escalation  |
| Repeat Incidents | <10%    | % same root cause within 30 days  |

**Review quarterly:**

- Are we meeting MTTR targets?
- Is alert accuracy improving?
- Are runbooks being used?
- Are we learning from incidents?

---

## FAQ

**Q: What if runbook doesn't cover my incident?**
A: Use best judgment, follow similar runbook as guide, document steps, create new runbook after.

**Q: Should I update runbook during incident?**
A: No, focus on resolving incident. Document gaps, update runbook after resolution.

**Q: What if runbook steps don't work?**
A: Skip to escalation section, document what was tried, get help.

**Q: How do I know which runbook to use?**
A: Check alert type (Slack message), use alert → runbook mapping table above.

**Q: What if multiple problems at once?**
A: Triage by severity (critical first), escalate if overwhelmed, document timeline.

**Q: Should I follow runbook exactly?**
A: Use as guide, adapt if needed, document deviations, update runbook after.

---

## Contact Information

### Support Channels

**Supabase Support:**

- Email: support@supabase.com
- Dashboard: Open ticket from Supabase dashboard
- Docs: https://supabase.com/docs

**Vercel Support:**

- Dashboard: Open ticket from Vercel dashboard
- Docs: https://vercel.com/docs
- Status: https://www.vercel-status.com

**Axiom Support:**

- Email: support@axiom.co
- Docs: https://axiom.co/docs
- Status: https://status.axiom.co

### Internal Contacts

(Future: Add team contact information)

- On-call rotation schedule
- Escalation contacts
- Subject matter experts

---

## Changelog

| Date       | Change                                      | Author        |
| ---------- | ------------------------------------------- | ------------- |
| 2026-01-31 | Initial runbook creation (Phase 2 Task 2.4) | Platform Team |
| 2026-02-06 | Added SLO Violation runbook (Phase 3)       | Platform Team |
| -          | -                                           | -             |

---

**Runbook Count:** 5 operational runbooks
**Last Updated:** 2026-02-05
**Maintained By:** Platform Team
**Next Audit:** 2026-04-30 (Quarterly review)
