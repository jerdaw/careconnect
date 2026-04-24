# Communication Templates

**Version:** 1.0
**Date Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Purpose:** Pre-written messages for launch and incident scenarios

---

## Overview

These templates ensure clear, consistent communication during launch and incidents. Customize with specific details, but maintain the structure and tone.

**Key Principles:**

- **Clarity:** Use simple, direct language
- **Honesty:** Don't hide issues or minimize impact
- **Timeliness:** Communicate early and often
- **Action-Oriented:** Tell people what to do or what's being done

**Related Documents:**

- [Launch Monitoring Checklist](launch-monitoring-checklist.md)
- [Rollback Procedures](launch-rollback-procedures.md)
- [Incident Response Plan](incident-response-plan.md)

---

## Template 1: Launch Announcement (Internal)

**Purpose:** Notify team that the platform is live

**When to Use:** Immediately after confirming launch is successful

**Channel:** Slack (team channel)

### Template

```
🚀 **CareConnect: LIVE**

The platform is now publicly accessible at https://careconnect.ing

**Current Status:**
✅ All systems operational
✅ SLO compliance: Green
✅ Circuit breaker: CLOSED
✅ Error rate: <0.1%
✅ Latency p95: [XXX]ms

**Monitoring Plan:**
• Hourly checks (first 4 hours)
• Dashboard: /admin/observability
• Slack alerts: Enabled
• On-call: [Name]

**Next Update:** In 2 hours

**Questions?** DM @[Lead Engineer]

🎉 Great work team!
```

### Customization Notes

- **[XXX]ms:** Fill in actual p95 latency from dashboard
- **[Name]:** Fill in on-call engineer name
- **[Lead Engineer]:** Tag the appropriate person

### Example (Filled)

```
🚀 **CareConnect: LIVE**

The platform is now publicly accessible at https://careconnect.ing

**Current Status:**
✅ All systems operational
✅ SLO compliance: Green
✅ Circuit breaker: CLOSED
✅ Error rate: 0.08%
✅ Latency p95: 287ms

**Monitoring Plan:**
• Hourly checks (first 4 hours)
• Dashboard: /admin/observability
• Slack alerts: Enabled
• On-call: Sarah Chen

**Next Update:** In 2 hours

**Questions?** DM @tech-lead

🎉 Great work team!
```

---

## Template 2: Incident Notice (Critical)

**Purpose:** Alert team to critical issue requiring immediate action

**When to Use:** SEV-1 or SEV-2 incidents

**Channel:** Slack (alert channel + @channel mention)

### Template

```
🚨 **[SEV-1/SEV-2] INCIDENT: [Brief Title]**

**Issue:** [Clear description of what's broken]

**Impact:**
• Users affected: [All / Majority / Some]
• Services down: [List affected features]
• Data at risk: [Yes/No]

**Current Status:** [Investigating / Rolling back / Fixing]

**Actions Taken:**
1. [Action 1]
2. [Action 2]

**Next Steps:**
- [Immediate next action]
- [ETA for resolution]

**On-Call:** @[Name]
**Incident Commander:** @[Name] (if escalated)

**Status Updates:** Every [10/15/30] minutes

**Last Updated:** [HH:MM]

---

**Need help?** Reply in thread or DM @[On-Call]
```

### SEV-1 Example (Critical Outage)

```
🚨 **SEV-1 INCIDENT: Search Completely Down**

**Issue:** All search requests returning 500 errors. Site is unusable.

**Impact:**
• Users affected: ALL
• Services down: Search, service discovery
• Data at risk: No

**Current Status:** Rolling back deployment

**Actions Taken:**
1. Detected via automated alert at 14:23
2. Confirmed issue affects all users
3. Initiated rollback at 14:25
4. VPS rollback started to the last known good staged release

**Next Steps:**
- Rollback ETA: 2 minutes
- Verify service restoration
- Investigate root cause

**On-Call:** @sarah-chen
**Incident Commander:** Not escalated yet

**Status Updates:** Every 5 minutes

**Last Updated:** 14:26

---

**Need help?** Reply in thread or DM @sarah-chen
```

### SEV-2 Example (High Error Rate)

```
🚨 **SEV-2 INCIDENT: Elevated Error Rate**

**Issue:** Error rate spiked to 8% after latest deployment. Search failing intermittently.

**Impact:**
• Users affected: ~10% (estimated)
• Services down: None (degraded search)
• Data at risk: No

**Current Status:** Investigating

**Actions Taken:**
1. Alert received at 11:42
2. Confirmed error rate: 8.2%
3. Reviewing error logs - appears to be database timeout
4. Checking circuit breaker status

**Next Steps:**
- Attempt database connection pool adjustment
- If no improvement in 5 min, will rollback
- ETA: 10-15 minutes

**On-Call:** @alex-kim

**Status Updates:** Every 10 minutes

**Last Updated:** 11:45

---

**Need help?** Reply in thread or DM @alex-kim
```

---

## Template 3: Status Update (During Incident)

**Purpose:** Provide regular updates during ongoing incident

**When to Use:** Every 10-30 minutes during active incident (based on severity)

**Channel:** Slack (same thread as incident notice)

### Template

```
**UPDATE [#1/2/3...] - [HH:MM]**

**Status:** [Investigating / Mitigating / Resolving / Monitoring]

**Progress:**
- [What's been done since last update]
- [Current action being taken]

**Metrics:**
- Error rate: [Current %]
- Uptime: [Current %]
- Latency p95: [Current ms]

**Next Update:** [Time] or when status changes

**ETA to Resolution:** [Best estimate or "Unknown - still investigating"]
```

### Example (During Mitigation)

```
**UPDATE #2 - 14:31**

**Status:** Mitigation in Progress

**Progress:**
- Rollback completed at 14:28
- Verified previous version is live
- Error rate dropping: 0.3% (was 8.2%)
- Monitoring for stability

**Metrics:**
- Error rate: 0.3% ⬇️
- Uptime: 99.2% (recovering)
- Latency p95: 412ms ✅

**Next Update:** 14:45 or when error rate stabilizes

**ETA to Resolution:** 10-15 minutes (monitoring phase)
```

---

## Template 4: All-Clear (Incident Resolved)

**Purpose:** Confirm incident is resolved and service is stable

**When to Use:** After incident is resolved and monitored for stability

**Channel:** Slack (same thread as incident notice)

### Template

```
✅ **ALL-CLEAR: Incident Resolved**

**Incident:** [Brief title from original notice]
**Duration:** [Start time] to [End time] ([Total duration])
**Resolution:** [How it was fixed]

**Final Metrics:**
- Uptime: [%]
- Error rate: [%]
- Latency p95: [ms]
- Users impacted: [Estimate]

**Root Cause:** [Brief explanation, or "Under investigation"]

**Next Steps:**
1. Post-Incident Review (PIR) scheduled: [Date/Time]
2. GitHub issue created: [Link]
3. Preventive measures: [Brief list or "TBD after PIR"]

**Continued Monitoring:**
- [How long we'll monitor closely]
- [Who's on watch]

**Status:** 🟢 **STABLE**

---

Thank you to everyone who helped resolve this quickly! 🙏
```

### Example (After Rollback)

```
✅ **ALL-CLEAR: Search Outage Resolved**

**Incident:** SEV-1 - Search Completely Down
**Duration:** 14:23 to 14:35 (12 minutes)
**Resolution:** Rolled back to v18.2.1, deployment error in search index

**Final Metrics:**
- Uptime: 99.1% (within SLO)
- Error rate: 0.2%
- Latency p95: 387ms
- Users impacted: ~50 (estimated)

**Root Cause:** Broken import in search/index.ts introduced in v18.2.2. Passed local tests due to different module resolution.

**Next Steps:**
1. Post-Incident Review (PIR) scheduled: Tomorrow 10am
2. GitHub issue created: #456
3. Preventive measures:
   - Add import validation to pre-deploy checks
   - Improve staging environment parity
   - Add smoke test for search endpoint

**Continued Monitoring:**
- Hourly checks for next 4 hours
- Sarah staying on-call through EOD

**Status:** 🟢 **STABLE**

---

Thank you to everyone who helped resolve this quickly! 🙏
Special thanks to @sarah-chen for fast rollback and @alex-kim for root cause analysis.
```

---

## Template 5: Weekly Summary (Post-Launch)

**Purpose:** Regular status report after launch

**When to Use:** End of Week 1, then weekly/biweekly

**Channel:** Slack (team channel) + Email to stakeholders

### Template

```
📊 **Week [#] Status Report: CareConnect**

**Reporting Period:** [Start Date] to [End Date]

---

### 🎯 Overall Status: [EXCELLENT / GOOD / NEEDS ATTENTION]

**Key Metrics:**
- **Uptime:** [XX.X%] (Target: 99.5%) [✅/⚠️/❌]
- **Error Rate:** [X.XX%] (Target: <0.5%) [✅/⚠️/❌]
- **Latency (p95):** [XXX ms] (Target: <800ms) [✅/⚠️/❌]
- **Total Searches:** [XXX,XXX]
- **Unique Users:** [XX,XXX] (estimated)

---

### 📈 Highlights

**What Went Well:**
- [Achievement 1]
- [Achievement 2]
- [Achievement 3]

**User Feedback:**
- [Positive feedback summary]
- [Most requested feature]
- [Common praise points]

**Performance:**
- [Notable performance improvements]
- [Stability observations]

---

### 🔧 Challenges

**Issues Encountered:**
1. **[Issue 1]** - [Brief description]
   - Impact: [User impact level]
   - Resolution: [How resolved]
   - Status: [RESOLVED / IN PROGRESS]

2. **[Issue 2]** - [Brief description]
   - Impact: [User impact level]
   - Resolution: [How resolved]
   - Status: [RESOLVED / IN PROGRESS]

**SLO Compliance:**
- [Any SLO violations]
- [Error budget consumption: XX%]

---

### 📊 Search Analytics (Privacy-Safe)

**Top Categories:**
1. [Category 1]: XX% of searches
2. [Category 2]: XX% of searches
3. [Category 3]: XX% of searches

**Most Common "No Results":**
- [Common missing service type 1]
- [Common missing service type 2]
- [Common missing service type 3]

**Action:** [Plan to address gaps]

---

### 🚀 Next Week

**Priorities:**
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

**Planned Improvements:**
- [Improvement 1]
- [Improvement 2]

**Monitoring Focus:**
- [What to watch]

---

### 👥 Team

**On-Call This Week:** [Name]
**On-Call Next Week:** [Name]

**Questions?** DM @[Lead] or reply in thread

---

**Next Report:** [Date]
```

### Example (Week 1 Post-Launch)

```
📊 **Week 1 Status Report: CareConnect**

**Reporting Period:** Feb 2-9, 2026

---

### 🎯 Overall Status: EXCELLENT

**Key Metrics:**
- **Uptime:** 99.7% (Target: 99.5%) ✅
- **Error Rate:** 0.3% (Target: <0.5%) ✅
- **Latency (p95):** 423 ms (Target: <800ms) ✅
- **Total Searches:** 12,847
- **Unique Users:** 3,241 (estimated)

---

### 📈 Highlights

**What Went Well:**
- Zero critical (SEV-1) incidents
- All SLO targets met or exceeded
- Positive user feedback (92% positive sentiment)
- Crisis search working flawlessly

**User Feedback:**
- Users love the offline mode
- Verification badges build trust
- Bilingual support appreciated
- "Fastest social services search I've used"

**Performance:**
- Average latency improved 15% over week (learning cache)
- Zero circuit breaker activations
- Database queries optimized mid-week

---

### 🔧 Challenges

**Issues Encountered:**
1. **Minor UI glitch on mobile Safari** (SEV-4)
   - Impact: Visual only, 5% of mobile users
   - Resolution: Hotfix deployed Feb 5
   - Status: RESOLVED

2. **Slow load on first visit** (SEV-3)
   - Impact: 2-3 second first load for 10% of users
   - Resolution: Added service worker prefetch
   - Status: RESOLVED

**SLO Compliance:**
- No violations
- Error budget consumption: 12% (0.06% of 0.5% budget)
- Well within targets

---

### 📊 Search Analytics (Privacy-Safe)

**Top Categories:**
1. Food: 34% of searches
2. Housing: 22% of searches
3. Mental Health/Crisis: 18% of searches
4. Health Services: 14% of searches
5. Legal: 12% of searches

**Most Common "No Results":**
- "Pet food bank" (animal services not in scope)
- "Car repair assistance" (transport limited)
- "Dentist" (expanding health services)

**Action:** Reviewing scope to potentially add dental and transport categories

---

### 🚀 Next Week

**Priorities:**
1. Add 5 missing dental services
2. Improve mobile first-load performance
3. Expand transport category

**Planned Improvements:**
- Implement search suggestions (in progress)
- Add more French service descriptions
- Enhanced crisis detection

**Monitoring Focus:**
- Watch for search pattern changes
- Monitor error rate as traffic grows

---

### 👥 Team

**On-Call This Week:** Sarah Chen
**On-Call Next Week:** Alex Kim

**Questions?** DM @tech-lead or reply in thread

---

🎉 **Fantastic first week! Thanks to everyone for the monitoring and quick responses.**

**Next Report:** Feb 16
```

---

## Customization Guide

### Tone Guidelines

**Internal Communication (Slack):**

- Professional but friendly
- Use emojis to convey urgency/status
- Be direct and clear
- Include actionable information

**External Communication (Status Page, if configured):**

- More formal tone
- Avoid jargon
- Focus on user impact
- Provide clear next steps

### Emoji Key

**Status Indicators:**

- 🟢 Green / All Clear
- 🟡 Yellow / Warning
- 🔴 Red / Critical
- ⚪ Gray / Unknown

**Severity:**

- 🚨 SEV-1 (Critical)
- ⚠️ SEV-2/SEV-3 (High/Medium)
- ℹ️ SEV-4 (Low)

**Trends:**

- ⬆️ Increasing
- ⬇️ Decreasing
- ➡️ Stable

**Status:**

- ✅ Complete/Good
- ❌ Failed/Bad
- ⏳ In Progress
- 🔍 Investigating

### Timing Guidelines

**Incident Notice:**

- SEV-1: Within 5 minutes of detection
- SEV-2: Within 15 minutes
- SEV-3: Within 30 minutes

**Status Updates:**

- SEV-1: Every 5-10 minutes
- SEV-2: Every 15 minutes
- SEV-3: Every 30 minutes

**All-Clear:**

- After monitoring confirms stability (varies by severity)
- SEV-1: After 30 minutes of stable operation
- SEV-2: After 15 minutes
- SEV-3: After resolution verified

### Required Information

**All communications should include:**

- Timestamp
- Current status
- Impact assessment
- Actions taken or planned
- Who to contact for questions
- When next update will come

**Never include:**

- User-identifying information
- Security vulnerabilities (until patched)
- Speculation without evidence
- Blame or finger-pointing

---

## Special Scenarios

### Template: Planned Maintenance

```
🔧 **Planned Maintenance Notice**

**What:** [Brief description of maintenance]
**When:** [Date/Time] ([Duration estimate])
**Impact:** [What will be affected]

**During Maintenance:**
- Service availability: [Available with degraded performance / Brief downtime]
- Expected disruption: [Minimal / Moderate / Significant]

**Why:** [Brief justification]

**Status Updates:** [Where to check]

**Questions?** Reply in thread or DM @[Contact]

**Next Update:** [When maintenance starts]
```

### Template: Feature Launch

```
🎉 **New Feature Launched: [Feature Name]**

**What's New:**
[Brief description of feature]

**Why It Matters:**
[User benefit]

**How to Use:**
[Quick start guide or link to docs]

**Known Limitations:**
- [Limitation 1]
- [Limitation 2]

**Feedback Welcome:**
[How to provide feedback]

**More Info:** [Link to docs/blog post]
```

### Template: Degraded External Service

```
⚠️ **External Service Impact: [Service Name]**

**Issue:** [External service] is experiencing [issue]
**Our Impact:** [How it affects CareConnect]

**Current Status:**
- Core search: [Working / Degraded / Down]
- Service details: [Working / Degraded / Down]
- [Other features]: [Status]

**Workaround:** [If available]

**Monitoring:** We're monitoring [external service] status
**ETA:** Per [external service], expected resolution: [Time or "Unknown"]

**Updates:** We'll post updates as we learn more

**Questions?** Reply in thread
```

---

## Best Practices

### Do's

✅ **Communicate Early:** Better to over-communicate than under
✅ **Be Honest:** Don't minimize issues or hide problems
✅ **Provide Context:** Help people understand why it matters
✅ **Give ETAs:** Even if uncertain, give a time for next update
✅ **Thank People:** Acknowledge help and patience
✅ **Follow Up:** Always close the loop

### Don'ts

❌ **Don't Speculate:** Only share confirmed information
❌ **Don't Blame:** Focus on resolution, not fault
❌ **Don't Use Jargon:** Keep language accessible
❌ **Don't Disappear:** Maintain regular updates
❌ **Don't Overpromise:** Be realistic about timelines
❌ **Don't Forget Context:** Link to related info

---

## Quick Reference

### Update Frequency by Severity

| Severity | Update Frequency | Duration                    |
| -------- | ---------------- | --------------------------- |
| SEV-1    | Every 5-10 min   | Until resolved              |
| SEV-2    | Every 15 min     | Until resolved              |
| SEV-3    | Every 30 min     | Until resolved or clear ETA |
| SEV-4    | As needed        | When fixed                  |

### Essential Information

**Every communication needs:**

1. Timestamp
2. Current status
3. Impact
4. Next steps
5. Contact person
6. When next update comes

---

## Related Documents

- [Incident Response Plan](incident-response-plan.md)
- [Launch Monitoring Checklist](launch-monitoring-checklist.md)
- [Rollback Procedures](launch-rollback-procedures.md)

---

**Last Updated:** 2026-02-09
**Version:** 1.0
**Next Review:** After first incident or 2026-03-09
