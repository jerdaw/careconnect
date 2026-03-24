# Runbook: Slow Query Performance

## Overview

**Severity:** 🟡 **WARNING**
**Impact:** User experience degraded (slow page loads)
**MTTR:** 10-30 minutes

Performance metrics show high p95/p99 latencies (>1000ms) for database operations. Users are experiencing slow page loads but operations are succeeding.

---

## Symptoms

You'll know there's a slow query issue when:

- ⚠️ **Dashboard:** p99 latency >1000ms in Top Operations
- ⚠️ **User reports:** "Page is slow to load", "Search takes forever"
- ⚠️ **Logs:** Request duration warnings (>500ms)
- ✅ **Circuit breaker:** Still CLOSED (operations succeeding, just slow)

**User Impact:**

- Slow page loads (3-10+ seconds)
- Searches take longer than expected
- Dashboard loads slowly
- Form submissions feel sluggish
- BUT: Everything eventually works (no errors)

---

## Immediate Actions (< 2 minutes)

### 1. Check Dashboard "Top Operations"

Navigate to:

```
https://yourdomain.com/admin/observability
```

**Identify slow operations:**

- Look for p95/p99 latency >500ms
- Note which operations are slow
- Check if latency is increasing over time

**Example findings:**

```
Operation: api.search.dbQuery
  p50: 120ms ✅
  p95: 850ms ⚠️
  p99: 2500ms 🔴

Operation: api.services.list
  p50: 200ms ✅
  p95: 450ms ⚠️
  p99: 1800ms 🔴
```

### 2. Check Supabase Performance Metrics

Open Supabase dashboard:

```
https://app.supabase.com/project/YOUR_PROJECT_ID/database/query-performance
```

**Check:**

- Database CPU usage (<80% is healthy)
- Active connections (<80% of max)
- Slow queries list
- Table statistics

### 3. Quick Impact Assessment

**Questions:**

- Is this affecting all users or just some?
- Is it a specific feature or site-wide?
- Did it start after a deployment?
- Is traffic higher than usual?

---

## Diagnosis Steps

### Step 1: Identify Slow Operation

**From Dashboard, note:**

- Operation name (e.g., `api.search.dbQuery`)
- p95 latency (e.g., 850ms)
- p99 latency (e.g., 2500ms)
- Request count (to assess impact)

### Step 2: Find Slow Query in Supabase

**Option A: Using Supabase Dashboard**

1. Navigate to Database → Query Performance
2. Sort by "Mean time" (descending)
3. Look for queries >100ms

**Option B: Using SQL**

```sql
-- Find slow queries (requires pg_stat_statements extension)
SELECT
  query,
  calls,
  mean_exec_time as avg_ms,
  max_exec_time as max_ms,
  stddev_exec_time as stddev_ms,
  rows
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- >100ms average
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Example output:**

```
query                                  | calls | avg_ms | max_ms | rows
---------------------------------------|-------|--------|--------|------
SELECT * FROM services WHERE org_i... | 1250  | 850    | 3200   | 45
SELECT * FROM feedback WHERE servi... | 890   | 620    | 2100   | 120
```

### Step 3: Analyze Query Plan

For the identified slow query:

```sql
EXPLAIN ANALYZE
[YOUR_SLOW_QUERY];
```

**Example:**

```sql
EXPLAIN ANALYZE
SELECT * FROM services
WHERE organization_id = 'org-123'
  AND verification_level >= 2;
```

**What to look for:**

1. **Seq Scan (Sequential Scan):**

   ```
   Seq Scan on services  (cost=0.00..1250.00 rows=45)
   ```

   - ❌ **BAD:** Full table scan (reads entire table)
   - ✅ **FIX:** Add index

2. **High cost:**

   ```
   cost=0.00..5000.00
   ```

   - ❌ Cost >1000 indicates expensive operation
   - ✅ Optimize query or add index

3. **Row estimation mismatch:**

   ```
   rows=1000 (actual rows=50000)
   ```

   - ❌ Planner guessed wrong
   - ✅ Run ANALYZE on table to update stats

4. **Nested loops:**

   ```
   Nested Loop  (cost=0.00..10000.00)
   ```

   - ⚠️ Can be slow for large datasets
   - ✅ Consider JOIN strategy change

---

## Resolution

### Quick Fix: Add Missing Index

**Most common fix** - add index on filtered columns.

**Identify columns to index:**

```sql
-- Look at WHERE clause in slow query
-- Example: WHERE organization_id = 'org-123' AND verification_level >= 2
```

**Create index:**

```sql
-- Single-column index
CREATE INDEX CONCURRENTLY idx_services_org_id
ON services(organization_id);

-- Multi-column index (for combined WHERE clauses)
CREATE INDEX CONCURRENTLY idx_services_org_verification
ON services(organization_id, verification_level);
```

**Why CONCURRENTLY?**

- Creates index without locking table
- Allows reads/writes during creation
- Takes longer but no downtime

**Verify index was created:**

```sql
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename = 'services'
ORDER BY indexname;
```

**Common indexes to add:**

```sql
-- Foreign keys (if not already indexed)
CREATE INDEX CONCURRENTLY idx_services_org_id ON services(organization_id);
CREATE INDEX CONCURRENTLY idx_feedback_service_id ON feedback(service_id);
CREATE INDEX CONCURRENTLY idx_analytics_service_id ON analytics_events(service_id);

-- Frequently filtered columns
CREATE INDEX CONCURRENTLY idx_services_verification_level
ON services(verification_level);

CREATE INDEX CONCURRENTLY idx_services_created_at
ON services(created_at DESC);

-- Composite indexes for multi-column WHERE clauses
CREATE INDEX CONCURRENTLY idx_services_org_verification
ON services(organization_id, verification_level);

-- Text search (if using ILIKE)
CREATE INDEX CONCURRENTLY idx_services_name_trgm
ON services USING gin(name gin_trgm_ops);

-- Enable trigram extension first:
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Medium Fix: Optimize Query

**Problem: N+1 queries**

**Before (slow):**

```typescript
// Makes 1 + N queries
const services = await supabase.from("services").select("*")

for (const service of services.data) {
  // N additional queries!
  const { data: org } = await supabase.from("organizations").select("name").eq("id", service.organization_id).single()
}
```

**After (fast):**

```typescript
// Single query with JOIN
const { data: services } = await supabase.from("services").select(`
    *,
    organization:organizations(id, name)
  `)
```

**Problem: Fetching too much data**

**Before:**

```typescript
// Fetches all columns, all rows
const { data } = await supabase.from("services").select("*")
```

**After:**

```typescript
// Fetch only needed columns, with pagination
const { data } = await supabase.from("services").select("id, name, description").range(0, 49) // Limit to 50 rows
```

**Problem: Inefficient filtering**

**Before:**

```typescript
// Filter in application code (slow)
const { data: allServices } = await supabase.from("services").select("*")
const filtered = allServices.filter((s) => s.verification_level >= 2)
```

**After:**

```typescript
// Filter in database (fast)
const { data } = await supabase.from("services").select("*").gte("verification_level", 2)
```

### Long-Term Fix: Add Caching

**For read-heavy operations:**

```typescript
import { unstable_cache } from "next/cache"

// Cache service list for 5 minutes
export const getCachedServices = unstable_cache(
  async () => {
    const { data } = await supabase.from("services").select("*").eq("verification_level", 3)
    return data
  },
  ["services-list-l3"],
  {
    revalidate: 300, // 5 minutes
    tags: ["services"],
  }
)

// Use in API route or server component
const services = await getCachedServices()
```

**Cache invalidation:**

```typescript
import { revalidateTag } from "next/cache"

// After updating services
await updateService(id, data)
revalidateTag("services") // Clear cache
```

### Update Table Statistics

**If query planner has wrong estimates:**

```sql
-- Update statistics for specific table
ANALYZE services;

-- Update statistics for all tables
ANALYZE;

-- Verify statistics updated
SELECT
  schemaname,
  tablename,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'services';
```

---

## Verification

After implementing fix:

### 1. Re-run EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
[YOUR_PREVIOUSLY_SLOW_QUERY];
```

**Look for:**

- ✅ Index Scan instead of Seq Scan
- ✅ Cost reduced by >50%
- ✅ Execution time <100ms

**Example before:**

```
Seq Scan on services  (cost=0.00..1250.00 rows=45 width=1024)
  (actual time=0.123..850.456 rows=45 loops=1)
Planning Time: 0.145 ms
Execution Time: 850.789 ms
```

**Example after (with index):**

```
Index Scan using idx_services_org_id on services
  (cost=0.29..12.45 rows=45 width=1024)
  (actual time=0.021..0.089 rows=45 loops=1)
Planning Time: 0.098 ms
Execution Time: 0.112 ms
```

**✅ Result:** 850ms → 0.1ms (99.9% improvement!)

### 2. Check Dashboard

Monitor observability dashboard for 10-15 minutes:

- [ ] p99 latency drops to <500ms
- [ ] p95 latency drops to <200ms
- [ ] No new slow query alerts
- [ ] Overall request duration improved

### 3. Test User Experience

**Manual testing:**

- [ ] Load affected pages/features
- [ ] Verify pages load quickly (<2s)
- [ ] Search responds promptly
- [ ] No noticeable lag

### 4. Monitor Production

**Watch for regressions:**

```bash
# Monitor logs for slow queries
vercel logs --prod | grep -i "slow query"

# Check Axiom for performance events
# Query: operation_duration_ms > 1000
```

---

## Escalation

### When to Escalate

Escalate if:

- Query cannot be optimized further
- Database CPU consistently >80%
- Caching doesn't help
- User complaints continue
- Index doesn't improve performance
- Query is already optimized but still slow

### Escalation Options

1. **Database Scaling:**
   - Upgrade Supabase plan
   - Increase database resources
   - Contact: Supabase support

2. **Read Replicas:**
   - Add read replicas for heavy read workloads
   - Requires: Supabase Pro plan or higher

3. **Denormalization:**
   - Create materialized views
   - Add computed columns
   - Duplicate data strategically

4. **Architectural Changes:**
   - Move to different storage (e.g., Redis for hot data)
   - Implement full-text search engine (Algolia, Elasticsearch)
   - Add caching layer (Redis, Memcached)

---

## Prevention

### Short-Term (After Incident)

- [ ] Add missing indexes identified during investigation
- [ ] Set up slow query monitoring (alert if query >500ms)
- [ ] Review all similar queries for same issue
- [ ] Update query performance tests

### Long-Term (System Hardening)

- [ ] Set up automatic query performance monitoring
- [ ] Add database query performance tests to CI
- [ ] Create query optimization guidelines for team
- [ ] Schedule quarterly database performance audit
- [ ] Set up automated ANALYZE scheduling
- [ ] Implement query result caching strategy
- [ ] Add database connection pooling monitoring
- [ ] Create load testing scenarios

### Monitoring Improvements

**Add alerts for:**

- Slow queries >500ms
- Database CPU >70%
- Database connections >80% of max
- Table bloat >20%

**Regular maintenance:**

```sql
-- Schedule monthly VACUUM ANALYZE
VACUUM ANALYZE;

-- Check for bloated tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
    pg_relation_size(schemaname||'.'||tablename)) AS external_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

---

## Related Resources

- **Runbooks:**
  - [High Error Rate](./high-error-rate.md)
  - [Circuit Breaker Open](./circuit-breaker-open.md)

- **Documentation:**
  - [Database Index Optimization](../adr/014-database-index-optimization.md)
  - [Performance Tracking](../adr/016-performance-tracking-and-circuit-breaker.md)

- **External Resources:**
  - [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
  - [Supabase Database Docs](https://supabase.com/docs/guides/database)
  - [Use The Index, Luke](https://use-the-index-luke.com/) (SQL indexing guide)

- **Tools:**
  - [Observability Dashboard](/admin/observability)
  - [Supabase Query Performance](https://app.supabase.com)
  - [Axiom Performance Metrics](https://app.axiom.co)

---

## Query Optimization Checklist

Use this checklist when optimizing slow queries:

- [ ] **Identify slow query** (via dashboard or logs)
- [ ] **Run EXPLAIN ANALYZE** on the query
- [ ] **Check for Sequential Scans** → Add index if found
- [ ] **Check WHERE clause** → Index filtered columns
- [ ] **Check JOIN conditions** → Index join columns
- [ ] **Check row estimation** → Run ANALYZE if mismatch
- [ ] **Optimize query logic** (remove N+1, limit columns)
- [ ] **Add caching** (if appropriate)
- [ ] **Test with EXPLAIN ANALYZE** (verify improvement)
- [ ] **Monitor in production** (ensure sustained improvement)
- [ ] **Document changes** (why index was added)

---

**Last Updated:** 2026-01-31
**Reviewed By:** [Pending first production incident]
**Next Review:** After first slow query incident or 2026-02-28
