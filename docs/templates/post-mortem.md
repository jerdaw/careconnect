---
status: draft
last_updated: YYYY-MM-DD
author: your-name
tags: [post-mortem, incident, operations]
---

# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Severity:** [P0 / P1 / P2]
**Duration:** [Time from detection to resolution, e.g., "2 hours 15 minutes"]
**Author:** [Your name]
**Reviewed By:** [Reviewer names]

---

## Summary

[2-3 sentence description of what happened. Include: what broke, how users were affected, and the immediate resolution.]

Example: "On 2024-06-15, the search API experienced intermittent 500 errors due to a database connection pool exhaustion. Users saw search failures for ~45 minutes. The issue was resolved by restarting the database connection pool and increasing the max connections limit."

---

## Impact

| Metric            | Value                             |
| ----------------- | --------------------------------- |
| Users Affected    | [Number or %, e.g., "~1,200"]     |
| Services Impacted | [List, e.g., "Search, Analytics"] |
| Data Loss         | [None / Describe scope]           |
| Revenue Impact    | [If applicable]                   |
| Detection Time    | [Time from start to detection]    |
| Resolution Time   | [Time from detection to fix]      |

**User-Facing Impact:**

- [Describe what users experienced, e.g., "Search returned no results"]
- [Severity: Critical / High / Medium / Low]

---

## Timeline

All times in **[Timezone]** (UTC-5).

| Time  | Event                                                             |
| ----- | ----------------------------------------------------------------- |
| 14:00 | Incident begins (first error in logs)                             |
| 14:15 | Slack alert fires: "High Error Rate"                              |
| 14:17 | Engineer acknowledges alert, begins investigation                 |
| 14:25 | Root cause identified: database connection pool exhausted         |
| 14:30 | Temporary fix applied: restart connection pool                    |
| 14:35 | Service restored, monitoring for stability                        |
| 14:45 | Permanent fix deployed: increased max_connections from 100 to 200 |
| 15:00 | Incident declared resolved, monitoring continues                  |
| 15:30 | Post-mortem review scheduled                                      |

---

## Root Cause

**Technical Root Cause:**

[Detailed explanation of what caused the incident at a technical level. Be specific.]

Example: "The database connection pool had a maximum size of 100 connections. During peak traffic (500 concurrent users), the application exhausted all available connections and began queuing requests. After 30 seconds, queued requests timed out, returning 500 errors to users."

**Contributing Factors:**

- [Factor 1, e.g., "No alerting on connection pool utilization"]
- [Factor 2, e.g., "Load testing did not simulate peak traffic patterns"]
- [Factor 3, if applicable]

---

## What Went Well

✅ Things that worked effectively during the incident:

- [Positive 1, e.g., "Slack alerting detected the issue within 2 minutes"]
- [Positive 2, e.g., "Graceful degradation prevented total outage"]
- [Positive 3, e.g., "Clear runbook made diagnosis quick"]
- [Positive 4, if applicable]

---

## What Went Poorly

❌ Areas for improvement:

- [Issue 1, e.g., "No connection pool monitoring before the incident"]
- [Issue 2, e.g., "Rollback procedure was unclear in runbook"]
- [Issue 3, e.g., "Communication to users was delayed by 20 minutes"]
- [Issue 4, if applicable]

---

## Action Items

| #   | Action Item                                      | Owner  | Due Date   | Status      |
| --- | ------------------------------------------------ | ------ | ---------- | ----------- |
| 1   | Add connection pool metrics to dashboard         | [Name] | YYYY-MM-DD | In Progress |
| 2   | Set up alert for pool utilization >80%           | [Name] | YYYY-MM-DD | Not Started |
| 3   | Update runbook with rollback procedure           | [Name] | YYYY-MM-DD | Complete    |
| 4   | Schedule load testing for peak traffic scenarios | [Name] | YYYY-MM-DD | Not Started |
| 5   | Document incident communication playbook         | [Name] | YYYY-MM-DD | Not Started |

---

## Lessons Learned

**Key Takeaways:**

1. [Lesson 1, e.g., "Observability gaps can delay incident response"]
2. [Lesson 2, e.g., "Load testing must include realistic peak scenarios"]
3. [Lesson 3, e.g., "Clear communication templates reduce user anxiety"]

**Prevention Strategies:**

- [Strategy 1, e.g., "Add pre-deployment load testing requirement"]
- [Strategy 2, e.g., "Implement auto-scaling for connection pools"]
- [Strategy 3, if applicable]

---

## References

- **Runbook:** [Link to relevant runbook, e.g., `docs/runbooks/high-error-rate.md`]
- **Slack Thread:** [Link to incident Slack thread]
- **Logs:** [Link to Axiom/logs query, e.g., `https://app.axiom.co/query?...`]
- **Metrics:** [Link to observability dashboard during incident]
- **Related ADR:** [Link to relevant architecture decision record, if applicable]

---

## Sign-Off

**Reviewed By:**

- [Name] - [Role] - [Date]
- [Name] - [Role] - [Date]

**Status:** [Draft / Under Review / Approved]
