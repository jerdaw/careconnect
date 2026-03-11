# Performance Baseline Metrics

**Version:** v18.0
**Date Established:** 2026-01-30
**Last Updated:** [TO BE FILLED]
**Status:** TEMPLATE - Awaiting Test Execution

---

## Overview

This document establishes performance baselines for HelpBridge to enable:

- **Regression Detection:** Identify performance degradations in future releases
- **Capacity Planning:** Understand system limits and scaling needs
- **SLA/SLO Definition:** Set realistic reliability targets
- **Infrastructure Optimization:** Make data-driven decisions

---

## Test Environment

### System Configuration

**Date of Baseline:** [TO BE FILLED]
**Application Version:** v18.0
**Node.js Version:** [Run: `node --version`]
**Next.js Version:** 15.5.9

**Hardware Specifications:**

- **CPU:** [Run: `lscpu | grep "Model name"`]
- **RAM:** [Run: `free -h | grep Mem`]
- **Storage:** [Run: `df -h /`]
- **Network:** [Local/LAN/Internet]

**Database:**

- **Provider:** Supabase
- **Tier:** [Free/Pro]
- **Region:** [TO BE FILLED]
- **Connection:** [Direct/Pooled]

**Deployment:**

- **Environment:** Local Development
- **Server Mode:** Development (`npm run dev`)
- **Build Type:** [Development/Production]
- **Port:** 3000

---

## Baseline Test Results

### 1. Smoke Test (Basic Connectivity)

**Command:** `npm run test:load:smoke`
**Purpose:** Verify basic functionality and connectivity
**Duration:** 30 seconds
**Virtual Users:** 1
**Target:** `http://localhost:3000/api/v1/search/services`

#### Results

**Throughput:**

- Requests per second: [TO BE FILLED] req/s
- Total requests: [TO BE FILLED]
- Failed requests: [TO BE FILLED]

**Response Times:**

- **Min:** [TO BE FILLED] ms
- **Avg:** [TO BE FILLED] ms
- **Median (p50):** [TO BE FILLED] ms
- **p90:** [TO BE FILLED] ms
- **p95:** [TO BE FILLED] ms
- **p99:** [TO BE FILLED] ms
- **Max:** [TO BE FILLED] ms

**Error Rate:**

- Total errors: [TO BE FILLED]
- Error rate: [TO BE FILLED]%
- HTTP 2xx: [TO BE FILLED]
- HTTP 4xx: [TO BE FILLED]
- HTTP 5xx: [TO BE FILLED]

**Expected Thresholds:**

- ✅ Success rate: >99%
- ✅ p95 latency: <1000ms
- ✅ p99 latency: <2000ms
- ✅ Error rate: <1%

**Status:** [PASS/FAIL/PENDING]

---

### 2. Search API Load Test (Realistic Traffic)

**Command:** `npm run test:load`
**Purpose:** Simulate realistic user traffic patterns
**Duration:** 5 minutes
**Virtual Users:** 10-50 (ramp-up)
**Target:** `/api/v1/search/services`

#### Test Scenarios

1. **Keyword Search (40%):** `?query=food`
2. **Category Filtered (30%):** `?category=health`
3. **Geo-Proximity (20%):** `?lat=44.2312&lng=-76.4860`
4. **Combined Filters (10%):** `?query=counselling&category=mental-health`

#### Results

**Throughput:**

- Peak req/s: [TO BE FILLED]
- Average req/s: [TO BE FILLED]
- Total requests: [TO BE FILLED]
- Successful requests: [TO BE FILLED]
- Failed requests: [TO BE FILLED]

**Response Times:**

- **Min:** [TO BE FILLED] ms
- **Avg:** [TO BE FILLED] ms
- **Median (p50):** [TO BE FILLED] ms
- **p90:** [TO BE FILLED] ms
- **p95:** [TO BE FILLED] ms
- **p99:** [TO BE FILLED] ms
- **Max:** [TO BE FILLED] ms

**Response Time Distribution:**

- <100ms: [TO BE FILLED]%
- 100-300ms: [TO BE FILLED]%
- 300-500ms: [TO BE FILLED]%
- 500-1000ms: [TO BE FILLED]%
- > 1000ms: [TO BE FILLED]%

**Error Breakdown:**

- Total errors: [TO BE FILLED]
- Error rate: [TO BE FILLED]%
- Timeout errors: [TO BE FILLED]
- Connection errors: [TO BE FILLED]
- HTTP 5xx: [TO BE FILLED]

**Circuit Breaker Behavior:**

- State during test: [CLOSED/OPEN/HALF_OPEN]
- Transitions: [TO BE FILLED]
- Fast failures: [TO BE FILLED]

**Expected Thresholds:**

- ✅ Throughput: >50 req/s sustained
- ✅ p95 latency: <500ms
- ✅ p99 latency: <1000ms
- ✅ Error rate: <5%
- ✅ Circuit breaker: Remains CLOSED

**Status:** [PASS/FAIL/PENDING]

---

### 3. Sustained Load Test (Stability)

**Command:** `npm run test:load:sustained`
**Purpose:** Test system stability under continuous load
**Duration:** 30 minutes
**Virtual Users:** 20 (constant)
**Target:** `/api/v1/search/services`

#### Results

**Throughput (Sustained):**

- Average req/s: [TO BE FILLED]
- Min req/s: [TO BE FILLED]
- Max req/s: [TO BE FILLED]
- Total requests: [TO BE FILLED]

**Response Times (Over Time):**

- **p95 at 5min:** [TO BE FILLED] ms
- **p95 at 15min:** [TO BE FILLED] ms
- **p95 at 30min:** [TO BE FILLED] ms
- **Degradation:** [TO BE FILLED]% (should be <10%)

**Error Rate Trend:**

- Errors at 5min: [TO BE FILLED]%
- Errors at 15min: [TO BE FILLED]%
- Errors at 30min: [TO BE FILLED]%
- Trend: [Stable/Increasing/Decreasing]

**Resource Utilization:**

- Memory usage start: [TO BE FILLED] MB
- Memory usage end: [TO BE FILLED] MB
- Memory leak detected: [YES/NO]
- CPU usage average: [TO BE FILLED]%
- CPU usage max: [TO BE FILLED]%

**Circuit Breaker Stability:**

- State throughout test: [CLOSED/OPEN/HALF_OPEN]
- Unexpected transitions: [TO BE FILLED]
- False opens: [TO BE FILLED]

**Expected Thresholds:**

- ✅ Stable latency (p95 variance <10%)
- ✅ Memory usage flat (no leaks)
- ✅ Error rate consistent (<5%)
- ✅ Circuit breaker remains CLOSED

**Status:** [PASS/FAIL/PENDING]

---

### 4. Spike Test (Stress & Recovery)

**Command:** `npm run test:load:spike`
**Purpose:** Test system behavior under sudden traffic spikes
**Duration:** ~2 minutes
**Virtual Users:** 0 → 100 (spike in 10s) → 0
**Target:** `/api/v1/search/services`

#### Results

**Spike Behavior:**

- Max concurrent users: 100
- Ramp-up time: 10 seconds
- Spike duration: 30 seconds
- Ramp-down time: 10 seconds

**During Spike:**

- Peak req/s: [TO BE FILLED]
- p95 latency: [TO BE FILLED] ms
- p99 latency: [TO BE FILLED] ms
- Error rate: [TO BE FILLED]%

**Circuit Breaker Response:**

- Opened during spike: [YES/NO]
- Time to open: [TO BE FILLED] seconds (if opened)
- Requests blocked: [TO BE FILLED]
- Fallback invocations: [TO BE FILLED]

**Recovery Metrics:**

- Time to HALF_OPEN: [TO BE FILLED] seconds
- Time to CLOSED: [TO BE FILLED] seconds
- Total recovery time: [TO BE FILLED] seconds
- Post-spike error rate: [TO BE FILLED]%

**Expected Behavior:**

- ⚠️ Circuit breaker MAY open (acceptable)
- ✅ Recovers within 60 seconds
- ✅ No permanent degradation
- ✅ Error rate returns to baseline

**Status:** [PASS/FAIL/PENDING]

---

## Regression Detection Thresholds

### Critical Thresholds (FAIL Build)

Any regression exceeding these thresholds should **fail CI/CD** and block deployment:

| Metric                          | Baseline          | Threshold    | Regression Limit |
| ------------------------------- | ----------------- | ------------ | ---------------- |
| **Search API p95**              | [TO BE FILLED] ms | +50%         | [CALCULATED] ms  |
| **Search API p99**              | [TO BE FILLED] ms | +100%        | [CALCULATED] ms  |
| **Error Rate**                  | [TO BE FILLED]%   | +5% absolute | [CALCULATED]%    |
| **Circuit Breaker False Opens** | 0                 | >0           | 1+ occurrences   |

### Warning Thresholds (WARN but Pass)

Regressions exceeding these thresholds should **warn** but not block deployment:

| Metric             | Baseline             | Threshold | Regression Limit   |
| ------------------ | -------------------- | --------- | ------------------ |
| **Search API p95** | [TO BE FILLED] ms    | +20%      | [CALCULATED] ms    |
| **Throughput**     | [TO BE FILLED] req/s | -20%      | [CALCULATED] req/s |
| **Memory Usage**   | [TO BE FILLED] MB    | +30%      | [CALCULATED] MB    |

---

## Baseline Interpretation Guide

### Response Time Targets

**Search API (Primary Use Case):**

- **Excellent:** p95 <300ms, p99 <500ms
- **Good:** p95 <500ms, p99 <1000ms
- **Acceptable:** p95 <800ms, p99 <2000ms
- **Poor:** p95 >800ms (needs optimization)

**Justification:** User research shows:

- <300ms: Feels instant
- 300-1000ms: Acceptable for search results
- > 1000ms: Users perceive as slow

### Throughput Targets

**Realistic Load:**

- **Minimum:** 50 req/s (baseline capacity)
- **Target:** 100 req/s (comfortable headroom)
- **Maximum:** [TO BE DETERMINED via spike test]

**Justification:**

- Current scale: ~196 services, low traffic expected initially
- Future scale: 500+ services, moderate traffic
- 50 req/s = 4.3M requests/day (well above expected usage)

### Error Rate Acceptable Ranges

- **0-1%:** Excellent (random network issues only)
- **1-5%:** Acceptable (may indicate rate limiting or DB throttling)
- **5-10%:** Warning (investigate causes)
- **>10%:** Critical (system degradation)

---

## Known Performance Characteristics

### Database Query Performance

**Supabase Free Tier Limitations:**

- Connection pooling: 60 connections max
- Query timeout: 8 seconds
- Rate limiting: 100 requests/second per project

**Circuit Breaker Protection:**

- Opens after 3 consecutive failures OR 50% error rate (60s window)
- Timeout: 30 seconds before attempting recovery
- Fast-fail: <1ms when circuit is OPEN

### Search Performance Factors

**Variables Affecting Latency:**

1. **Query Complexity:** Simple keyword (fast) vs complex filters (slower)
2. **Result Count:** Larger result sets require more processing
3. **Database State:** Cold vs warm cache
4. **Network Latency:** Local vs remote database
5. **Concurrent Requests:** Resource contention

**Optimization Strategies:**

- ✅ Circuit breaker prevents cascading failures
- ✅ IndexedDB fallback for offline scenarios
- ✅ Client-side caching (service worker)
- ⏸️ Server-side query result caching (future)

---

## Historical Baselines

### v18.0 Baseline (Initial - 2026-01-30)

**Status:** PENDING EXECUTION

**Environment:**

- Version: v18.0
- Date: [TO BE FILLED]
- Configuration: [TO BE FILLED]

**Results:**

- Search API p95: [TO BE FILLED] ms
- Search API p99: [TO BE FILLED] ms
- Throughput: [TO BE FILLED] req/s
- Error rate: [TO BE FILLED]%

**Notes:**

- First baseline measurement
- Establishes initial targets
- Circuit breaker coverage: 100%

---

### Future Baseline Comparisons

When measuring new baselines, compare against this table:

| Version | Date       | p95 (ms)  | p99 (ms)  | Req/s     | Error %   | Notes            |
| ------- | ---------- | --------- | --------- | --------- | --------- | ---------------- |
| v18.0   | 2026-01-30 | [PENDING] | [PENDING] | [PENDING] | [PENDING] | Initial baseline |
| v18.1   | TBD        | -         | -         | -         | -         | -                |
| v18.2   | TBD        | -         | -         | -         | -         | -                |

---

## Next Steps

### After Establishing Baseline

1. **Integrate with CI/CD:**
   - Add load test job to GitHub Actions
   - Run on every PR to main branch
   - Compare results against baseline
   - Fail build if critical thresholds exceeded

2. **Set Up Monitoring:**
   - Configure Axiom to track p95/p99 in production
   - Create alerts for threshold violations
   - Build real-time performance dashboard

3. **Schedule Re-baseline:**
   - Re-run every quarter or after major infrastructure changes
   - Update this document with new measurements
   - Document reasons for any significant changes

4. **Optimize Based on Data:**
   - If p95 >800ms: Investigate slow queries
   - If error rate >5%: Review circuit breaker tuning
   - If throughput <50 req/s: Check database connection pooling

---

## Appendix: Running the Baseline Tests

### Prerequisites

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Verify server is running:**

   ```bash
   curl http://localhost:3000/api/v1/health
   ```

3. **Ensure database is accessible:**
   - Check Supabase dashboard
   - Verify environment variables are set

### Running Tests

**1. Smoke Test (30 seconds):**

```bash
npm run test:load:smoke
```

**2. Realistic Load Test (5 minutes):**

```bash
npm run test:load
```

**3. Sustained Load Test (30 minutes):**

```bash
npm run test:load:sustained
```

**4. Spike Test (2 minutes):**

```bash
npm run test:load:spike
```

### Capturing Results

k6 outputs results to the console. Capture them with:

```bash
# Save output to file
npm run test:load > baseline-results.txt 2>&1

# Or use k6's built-in JSON output
k6 run --out json=results.json tests/load/search-api.k6.js
```

### Interpreting k6 Output

Look for these key sections in the output:

```
checks.........................: 100.00%  ← Should be >99%
http_req_duration..............: avg=123ms p(95)=456ms  ← Key metrics
http_req_failed................: 2.5%     ← Should be <5%
http_reqs......................: 1234     ← Total requests
iterations.....................: 1234/s   ← Requests per second
```

---

## Maintenance

### Review Schedule

- **Weekly:** Check production metrics for anomalies
- **Monthly:** Review baseline relevance
- **Quarterly:** Re-run full baseline suite
- **After Major Changes:** Re-establish baseline

### Update Triggers

Re-baseline when:

- Upgrading database tier (Free → Pro)
- Major code refactoring (search algorithm changes)
- Infrastructure changes (new hosting, CDN, etc.)
- Significant performance improvements implemented

### Document Maintenance

- **Owner:** Development Team
- **Last Review:** [TO BE FILLED]
- **Next Review:** [TO BE FILLED + 3 months]

---

**Status:** TEMPLATE - Ready for test execution
**Created:** 2026-01-30
**Version:** 1.0
