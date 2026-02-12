# Runbook: [Issue Name]

## Overview

**Severity:** [🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM / ⚪ LOW]
**Impact:** [Brief description of user/system impact]
**MTTR:** [Expected time to resolution, e.g., "5-15 minutes" or "< 1 hour"]
**Last Reviewed:** YYYY-MM-DD

[Brief 1-2 sentence description of when this runbook applies and what it helps resolve.]

Example: "This runbook guides you through diagnosing and resolving high error rates in the API. It applies when error rates exceed 10% for more than 5 minutes."

---

## Symptoms

You'll know this issue is occurring when:

- ✅ **Alert:** [Specific alert name/message that fires]
- ✅ **Dashboard:** [What you'll see in observability dashboard]
- ✅ **User Reports:** [Common user complaints/symptoms]
- ✅ **Logs:** [Specific log patterns or error messages]

**User Impact:**

- [Feature/service 1]: [Affected / Working / Degraded]
- [Feature/service 2]: [Affected / Working / Degraded]
- [Feature/service 3]: [Affected / Working / Degraded]

**Example:**

- ✅ **Search:** Degraded (slow responses)
- ❌ **Service Claims:** Failing (500 errors)
- ✅ **Service Views:** Working (cached data)

---

## Immediate Actions (< 2 minutes)

**Goal:** Stop the bleeding and stabilize the system.

### 1. [Action Name]

[Clear, numbered steps with specific commands or UI actions]

**Check:**

```bash
# Example command to verify status
curl -I https://yourdomain.com/api/v1/health
```

**Expected Output:**

```
HTTP/2 200
...
```

### 2. [Action Name]

[Next immediate action]

**Commands:**

```bash
# Example diagnostic command
docker logs app-container --tail 100
```

**What to Look For:**

- [Indicator 1]
- [Indicator 2]

### 3. [Action Name]

[Final immediate stabilization step]

---

## Diagnosis Steps

### Step 1: [Diagnosis Task]

**Objective:** [What you're trying to determine]

**Commands:**

```bash
# Example: Check error logs
tail -f /var/log/app/errors.log | grep "ERROR"
```

**Interpretation:**

| Observation           | Likely Cause         | Next Step                |
| --------------------- | -------------------- | ------------------------ |
| [Pattern 1 in output] | [Root cause]         | Go to Resolution Step X  |
| [Pattern 2 in output] | [Another root cause] | Go to Resolution Step Y  |
| [Pattern 3 in output] | [Yet another cause]  | Go to Escalation Section |

### Step 2: [Next Diagnosis Task]

**Check System Metrics:**

Navigate to observability dashboard:

```
https://yourdomain.com/admin/observability
```

**Look for:**

- [Metric 1]: [Normal range vs. problem range]
- [Metric 2]: [Normal range vs. problem range]
- [Metric 3]: [Normal range vs. problem range]

### Step 3: [Additional Diagnosis]

**Check External Dependencies:**

- [Dependency 1, e.g., "Supabase status page"]
- [Dependency 2, e.g., "Third-party API health"]

---

## Resolution Procedures

### Scenario A: [Root Cause Type]

**When:** [Conditions that indicate this scenario]

**Fix:**

1. [Step 1 with specific commands]

   ```bash
   # Example command
   systemctl restart app-service
   ```

2. [Step 2]

   ```bash
   # Example verification
   curl https://yourdomain.com/api/v1/health
   ```

3. [Step 3]

**Verification:** [How to confirm the fix worked]

**Time to Resolution:** [Estimated time]

### Scenario B: [Another Root Cause Type]

**When:** [Conditions that indicate this scenario]

**Fix:**

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Rollback Plan:**

If this fix doesn't work or causes new issues:

```bash
# Rollback commands
git revert HEAD
git push origin main
```

### Scenario C: [Yet Another Root Cause]

**When:** [Conditions that indicate this scenario]

**Fix:**

1. [Step 1]
2. [Step 2]

---

## Verification

After applying the fix, verify the system is healthy:

### 1. Check Health Endpoint

```bash
curl -I https://yourdomain.com/api/v1/health
# Expected: HTTP/2 200
```

### 2. Verify Metrics

Check the observability dashboard for:

- ✅ [Metric 1 returns to normal range]
- ✅ [Metric 2 shows no spikes]
- ✅ [Error rate < 1%]

### 3. Test User Flows

Manually test critical user journeys:

- ✅ [User flow 1, e.g., "Search for 'food bank'"]
- ✅ [User flow 2, e.g., "View service details"]
- ✅ [User flow 3, e.g., "Submit feedback"]

### 4. Monitor for Stability

Watch metrics for 10-15 minutes to confirm stability:

```bash
# Example: tail logs
tail -f /var/log/app/access.log | grep "500"
# Expected: No 500 errors
```

---

## Escalation

### When to Escalate

Escalate if:

- ❌ Issue persists after 30 minutes of troubleshooting
- ❌ Resolution steps don't work or cause new problems
- ❌ Root cause is unclear after diagnosis steps
- ❌ Data loss or corruption is suspected
- ❌ Multiple systems are affected (compound failure)

### Who to Escalate To

| Role                | Contact        | When to Engage                         |
| ------------------- | -------------- | -------------------------------------- |
| Tech Lead           | [Name / Slack] | Complex technical issues               |
| Database Admin      | [Name / Slack] | Database-related root causes           |
| Infrastructure Lead | [Name / Slack] | Infrastructure or hosting issues       |
| On-Call Manager     | [Name / Phone] | Critical incidents affecting all users |

### Escalation Message Template

```
🚨 Incident Escalation

Issue: [Brief description]
Severity: [P0/P1/P2]
Duration: [How long has it been ongoing?]
Impact: [Who/what is affected?]
Steps Taken: [What have you tried?]
Current Status: [What's the current state?]

Runbook: [Link to this runbook]
Dashboard: [Link to observability dashboard]
```

---

## Prevention

**Long-Term Fixes:**

To prevent this issue from recurring:

1. **[Prevention Strategy 1]**
   - Action: [Specific action to take]
   - Owner: [Who should implement this?]
   - Timeline: [When should this be done?]

2. **[Prevention Strategy 2]**
   - Action: [Specific action]
   - Owner: [Who?]
   - Timeline: [When?]

3. **[Prevention Strategy 3]**
   - Action: [Specific action]
   - Owner: [Who?]
   - Timeline: [When?]

**Monitoring Improvements:**

- [Improvement 1, e.g., "Add alert for X metric"]
- [Improvement 2, e.g., "Increase log retention to 90 days"]

**Related Work:**

- [Link to ADR about architectural change]
- [Link to feature request or technical debt ticket]

---

## References

- **Related Runbooks:**
  - [Runbook Name](./runbook-filename.md)
  - [Another Runbook](./another-runbook.md)

- **Architecture Decisions:**
  - [ADR-XXX: Relevant Decision](../adr/XXX-title.md)

- **External Documentation:**
  - [Third-party API docs](https://example.com/docs)
  - [Database documentation](https://example.com/db-docs)

- **Monitoring & Alerts:**
  - [Observability Dashboard](https://yourdomain.com/admin/observability)
  - [Axiom Logs](https://app.axiom.co)
  - [Supabase Dashboard](https://app.supabase.com)

---

## Changelog

| Date       | Changes                     | Author |
| ---------- | --------------------------- | ------ |
| YYYY-MM-DD | Initial creation            | [Name] |
| YYYY-MM-DD | Added Scenario C resolution | [Name] |
| YYYY-MM-DD | Updated escalation contacts | [Name] |

**Next Review Date:** YYYY-MM-DD
