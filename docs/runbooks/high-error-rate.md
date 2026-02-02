# Runbook: High Error Rate

## Overview

**Severity:** 🟡 **WARNING**
**Impact:** User experience degraded, may escalate to critical
**MTTR:** 5-20 minutes

High error rate detected (>10% of requests failing). This is an early warning signal that may lead to circuit breaker opening if not addressed.

---

## Symptoms

You'll know there's a high error rate when:

- ⚠️ **Slack alert:** "⚠️ High Error Rate Alert"
- ⚠️ **Dashboard:** Error rate >10% in Top Operations
- ⚠️ **User reports:** Occasional "Something went wrong" messages
- ⚠️ **Logs:** Increased error log volume

**User Impact:**

- Some requests succeed, others fail intermittently
- User experience degraded but not completely broken
- May notice slow response times
- Errors appear inconsistently

---

## Immediate Actions (< 2 minutes)

### 1. Check Observability Dashboard

Navigate to:

```
https://yourdomain.com/admin/observability
```

**Check:**

- Current error rate percentage
- Which operations are failing
- Error rate trend (increasing/stable/decreasing)
- Circuit breaker state (still CLOSED?)

### 2. Identify Failing Operations

**In Dashboard "Top Operations" section:**

- Look for operations with high failure counts
- Note error rate percentage per operation
- Identify if errors are concentrated or widespread

### 3. Check Recent Deployments

```bash
vercel deployments list --prod
# Look for deployments in last 30 minutes
```

**Questions:**

- Was there a deployment recently?
- Did error rate spike after deployment?
- Are there any ongoing releases?

---

## Diagnosis Steps

### Step 1: Identify Failing Endpoints

**In Axiom:**

```
https://app.axiom.co
Dataset: kingston-care-production
Query:
  ['level'] == "error"
  | summarize count() by endpoint, status_code
  | where count > 10
  | sort by count desc
Time range: Last 15 minutes
```

**Common Patterns:**

- Single endpoint failing → Likely code bug in that endpoint
- Multiple endpoints → Infrastructure or database issue
- Specific HTTP status → See table below

### Step 2: Classify Error Type

| Status Code | Type          | Common Causes                    |
| ----------- | ------------- | -------------------------------- |
| 400         | Bad Request   | Invalid input, schema changes    |
| 401/403     | Auth Error    | Token expiry, permission changes |
| 429         | Rate Limit    | Traffic spike, DoS attack        |
| 500         | Server Error  | Code bug, database issue         |
| 502/503     | Gateway Error | Vercel issue, cold start timeout |
| 504         | Timeout       | Slow query, external API delay   |

### Step 3: Check Root Cause

**For 4xx errors:**

- Recent schema changes?
- Client app updated?
- API contract broken?
- Input validation changes?

**For 5xx errors:**

- Recent deployment?
- Database performance degraded?
- External service down?
- Memory/CPU exhaustion?

**For timeouts (504):**

- Slow query introduced?
- Cold start issue (Vercel)?
- External API latency?
- Database connection pool exhausted?

### Step 4: Check System Resources

**In Vercel Dashboard:**

- Function execution time increasing?
- Memory usage spikes?
- Cold starts frequency?

**In Supabase:**

- Database CPU usage?
- Active connections count?
- Slow queries?

---

## Resolution

### Fix Deployment Issue

**If error rate spiked after recent deployment:**

```bash
# Option 1: Rollback bad deployment
vercel rollback PREV_DEPLOYMENT_URL

# Option 2: Hotfix and redeploy
git revert COMMIT_HASH
git push origin main
```

**Verify:**

```bash
# Wait 2-3 minutes after rollback
curl https://yourdomain.com/api/v1/health

# Check error rate dropped
# Monitor dashboard for 10 minutes
```

### Fix Database Performance

**If slow queries are the cause:**

```sql
-- Find slow queries in Supabase SQL Editor
SELECT
  query,
  calls,
  mean_exec_time as avg_ms,
  max_exec_time as max_ms
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- >1s
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add missing index (example)
CREATE INDEX CONCURRENTLY idx_services_org_id
ON services(organization_id);
```

**Verify index created:**

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename = 'services';
```

### Fix Rate Limiting

**If legitimate traffic is being rate-limited:**

```typescript
// Temporarily increase rate limit in affected API route
// Example: app/api/v1/search/services/route.ts
const { success } = await rateLimit({
  key: identifier,
  limit: 120, // Increase from 60
  window: "1m",
})
```

**Note:** This is a temporary fix. Consider:

- Is the traffic legitimate?
- Should we add caching instead?
- Do we need DDoS protection?

### Fix External Service Failure

**If external API is down:**

1. Check service status page
2. Implement fallback if available
3. Add circuit breaker for external API
4. Communicate downtime to users

**Example - Add fallback:**

```typescript
try {
  return await externalAPI.call()
} catch (error) {
  logger.warn("External API failed, using fallback", { error })
  return fallbackData
}
```

### Fix Schema/Validation Issue

**If 400 errors due to validation:**

```typescript
// Review recent schema changes
// Check Zod schema definitions

// Example fix - make field optional
const schema = z.object({
  field: z.string().optional(), // Was required
})
```

---

## Verification

After implementing fix:

- [ ] **Check error rate:** Should drop below 5% within 5 minutes
- [ ] **Check dashboard:** All operations showing green status
- [ ] **Monitor for 15 minutes:** No new error spikes
- [ ] **Check Slack:** No new high error rate alerts
- [ ] **User reports:** Complaints should stop
- [ ] **Test critical paths:** Manually test affected endpoints

**Verification commands:**

```bash
# Test endpoint that was failing
curl https://yourdomain.com/api/v1/[affected-endpoint]

# Check health endpoint
curl https://yourdomain.com/api/v1/health

# Monitor error logs
vercel logs --prod | grep -i error | tail -n 20
```

---

## Escalation

### When to Escalate

Escalate to **CRITICAL** severity if:

- Error rate >25% (quarter of requests failing)
- Error rate increasing despite fixes
- Circuit breaker opens
- User impact severe (customer complaints)
- Root cause unclear after 20 minutes

### Escalation Actions

1. **Circuit Breaker Opens:**
   - Follow [Circuit Breaker Open](./circuit-breaker-open.md) runbook
   - This becomes a CRITICAL incident

2. **Root Cause Unclear:**
   - Escalate to senior engineer
   - Gather diagnostic data (logs, metrics, traces)
   - Consider enabling debug logging

3. **External Service Outage:**
   - Monitor external service status page
   - Communicate to users via status page
   - Implement workaround if possible

4. **Database Issue:**
   - Contact Supabase support
   - Prepare for potential downtime
   - Communicate to stakeholders

---

## Prevention

### Short-Term (After Incident)

- [ ] Add integration tests for error scenarios
- [ ] Set up API contract testing
- [ ] Add input validation tests
- [ ] Create alert for error rate >5% (earlier warning)

### Long-Term (System Hardening)

- [ ] Implement comprehensive error monitoring
- [ ] Add distributed tracing (e.g., OpenTelemetry)
- [ ] Set up synthetic monitoring (uptime checks)
- [ ] Create load testing suite
- [ ] Add chaos engineering tests
- [ ] Implement graceful degradation patterns
- [ ] Add circuit breakers for external APIs
- [ ] Set up automated canary deployments

### Monitoring Improvements

**Add alerts for:**

- Error rate >5% (early warning)
- Slow queries >500ms
- Rate limit triggers >10/min
- External API failures
- Database connection pool usage >80%

**Add dashboards for:**

- Error breakdown by endpoint
- Error breakdown by status code
- Error rate trend over time
- Top failing operations

---

## Related Resources

- **Runbooks:**
  - [Circuit Breaker Open](./circuit-breaker-open.md)
  - [Slow Queries](./slow-queries.md)

- **Dashboards:**
  - [Observability Dashboard](/admin/observability)
  - [Axiom Logs](https://app.axiom.co)
  - [Vercel Dashboard](https://vercel.com/dashboard)
  - [Supabase Dashboard](https://app.supabase.com)

- **Documentation:**
  - [Performance Tracking](../adr/016-performance-tracking-and-circuit-breaker.md)
  - [Database Optimization](../adr/014-database-index-optimization.md)
  - [Alerting Setup](../observability/alerting-setup.md)

---

## Post-Incident Checklist

After resolving a high error rate incident:

- [ ] Document root cause
- [ ] Update runbook if gaps found
- [ ] Create post-mortem (if significant)
- [ ] Add preventive measures
- [ ] Update monitoring/alerting if needed
- [ ] Share learnings with team
- [ ] Schedule follow-up review

---

**Last Updated:** 2026-01-31
**Reviewed By:** [Pending first production incident]
**Next Review:** After first high error rate incident or 2026-02-28
