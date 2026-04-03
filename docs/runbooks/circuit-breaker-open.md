# Runbook: Circuit Breaker Open

## Overview

**Severity:** 🔴 **CRITICAL**
**Impact:** Database operations are protected, some writes may fail
**MTTR:** 5-15 minutes (automatic recovery) or 2-30 minutes (manual intervention)

The circuit breaker has detected repeated failures to Supabase and entered OPEN state to prevent cascading failures. Database operations are fast-failing to protect the system.

---

## Symptoms

You'll know the circuit breaker is open when:

- ✅ **Slack alert:** "🚨 Circuit Breaker OPEN"
- ✅ **Dashboard:** Observability page shows circuit state = OPEN (red badge)
- ✅ **User impact:** Some operations may return errors (graceful degradation)
- ✅ **Logs:** `Circuit breaker 'supabase' OPENED` messages

**User Impact:**

- ✅ **Search:** Works (falls back to JSON files)
- ❌ **Service claims:** Fail (write operations blocked)
- ❌ **Service edits:** Fail (write operations blocked)
- ✅ **Service views:** Work (cached or fallback data)
- ✅ **Analytics:** Degraded (historical data unavailable)

---

## Immediate Actions (< 2 minutes)

### 1. Confirm Circuit State

Navigate to the observability dashboard:

```
https://yourdomain.com/admin/observability
```

**Check:**

- Circuit breaker card shows state: OPEN (red)
- Failure count > threshold (default: 3)
- Failure rate > 50%

### 2. Check Supabase Status

Open Supabase dashboard:

```
https://app.supabase.com/project/YOUR_PROJECT_ID
```

**Look for:**

- 🟢 **Status page:** All systems operational?
- ⚠️ **Incidents:** Any active incidents?
- 📊 **Database metrics:** CPU/Memory/Disk usage
- 🔌 **Connection count:** Near max connections?

---

## Diagnosis Steps

### Step 1: Identify Root Cause

**Check Axiom logs:**

```
https://app.axiom.co
Dataset: kingston-care-production
Query: event_type:circuit_breaker AND state:OPEN
Time range: Last 15 minutes
```

**Common Causes:**

| Symptom                | Root Cause                | Fix                                |
| ---------------------- | ------------------------- | ---------------------------------- |
| "Connection timeout"   | Network issue             | Wait for recovery (auto)           |
| "Too many connections" | Connection pool exhausted | Restart Supabase (contact support) |
| "Read-only mode"       | Database maintenance      | Wait for maintenance window        |
| "Auth failed"          | Invalid credentials       | Check environment variables        |
| "Query timeout"        | Slow query or table lock  | Identify slow query, add index     |

### Step 2: Check Recent Changes

**Review recent deployments:**

```bash
vercel deployments list --prod
# Look for deployments in last 30 minutes
```

**Questions:**

- Did you deploy new code recently?
- Did you change database schema?
- Did you update environment variables?
- Did traffic spike (marketing campaign)?

### Step 3: Check Performance Metrics

**In Observability Dashboard:**

- Check "Top Operations" for abnormal latencies
- Look for p99 latency spikes (>1000ms)
- Check total operations count (traffic spike?)

**In Supabase:**

- Query: `SELECT * FROM pg_stat_activity WHERE state = 'active'`
- Look for long-running queries (>10s)

---

## Resolution

### Quick Fix (Automatic Recovery)

**Circuit breaker will auto-recover:**

- ⏰ **Timeout:** 30 seconds (default)
- 🔄 **Transition:** OPEN → HALF_OPEN (testing)
- ✅ **Success:** HALF_OPEN → CLOSED (1 successful request)
- ❌ **Failure:** HALF_OPEN → OPEN (retry in 30s)

**Timeline:**

```
T+0s:    Circuit opens (3 failures detected)
T+30s:   Circuit enters HALF_OPEN
T+30s:   Test request sent
T+31s:   ✅ Success → Circuit CLOSED
         ❌ Failure → Circuit OPEN, wait 30s, repeat
```

**Expected MTTR:** 30-60 seconds (if root cause self-healed).

---

### Manual Intervention

**When to intervene:**

- Circuit repeatedly opens after closing (flapping)
- Root cause is not self-healing (e.g., config error)
- User impact is severe (blocking critical operations)

**Options:**

#### Option 1: Force Close Circuit (Emergency Only)

**⚠️ WARNING:** Only use if you've confirmed database is healthy.

```typescript
// In Node.js REPL or API route
import { getSupabaseBreaker } from "@/lib/resilience/supabase-breaker"

const breaker = getSupabaseBreaker()
breaker.forceClose()
```

**When to use:**

- False positive (circuit opened due to transient blip)
- Database is confirmed healthy
- You need to unblock critical operations immediately

**Risks:**

- If database is actually unhealthy, may cause cascading failures
- Should only be used with monitoring

#### Option 2: Fix Root Cause

**Database connection issue:**

```bash
# Check Supabase connection string
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# Verify connectivity
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
```

**Slow query issue:**

```sql
-- Find slow queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - pg_stat_activity.query_start > interval '10 seconds'
ORDER BY duration DESC;

-- Kill slow query (if safe)
SELECT pg_terminate_backend(PID);
```

**Environment variable issue:**

```bash
# Redeploy with corrected env vars
vercel env pull
# Edit .env.local
vercel --prod
```

#### Option 3: Rollback Deployment

If recent deployment caused the issue:

```bash
# List recent deployments
vercel deployments list

# Rollback to previous stable version
vercel rollback DEPLOYMENT_URL
```

---

## Verification

After resolution, verify circuit health:

### 1. Check Dashboard

- Circuit state: CLOSED (green)
- Failure rate: <10%
- Recent operations: Latencies normal

### 2. Test Critical Path

```bash
# Test service search (read operation)
curl https://yourdomain.com/api/v1/services

# Test health check
curl https://yourdomain.com/api/v1/health

# Response should be 200 OK with status: "healthy"
```

### 3. Monitor for 15 Minutes

- Stay on dashboard
- Watch for re-opening (flapping)
- Check Slack for new alerts

---

## Escalation

### When to Escalate

- Circuit flaps (opens/closes >3 times in 10 minutes)
- Root cause unclear after 15 minutes of investigation
- User impact severe (customer complaints)
- Supabase status page shows incident

### Escalation Path

1. **Supabase Support:**
   - Email: support@supabase.com
   - Dashboard: Open support ticket
   - Include: Project ID, timestamp, error messages

2. **On-Call Engineer:**
   - (Future: Add PagerDuty integration)

3. **Incident Commander:**
   - (Future: Define IC role for major incidents)

---

## Prevention

### Short-Term (After Incident)

- [ ] Review logs to identify root cause
- [ ] Add monitoring for early warning signals
- [ ] Tune circuit breaker thresholds if needed
- [ ] Document incident in post-mortem

### Long-Term (System Hardening)

- [ ] Add database query performance monitoring
- [ ] Set up connection pool monitoring
- [ ] Configure database alerts (CPU, memory, connections)
- [ ] Add synthetic monitoring (uptime checks)
- [ ] Implement read replicas for redundancy

---

## Related Resources

- **Dashboard:** `/admin/observability`
- **Axiom Logs:** [https://app.axiom.co](https://app.axiom.co)
- **Supabase Dashboard:** [https://app.supabase.com](https://app.supabase.com)
- **Circuit Breaker Code:** `lib/resilience/circuit-breaker.ts`
- **ADR:** [016-performance-tracking-and-circuit-breaker.md](../adr/016-performance-tracking-and-circuit-breaker.md)

---

**Last Updated:** 2026-01-31
**Reviewed By:** [Pending first production incident]
**Next Review:** After first circuit breaker incident or 2026-02-28
