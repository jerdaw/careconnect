# Load Testing Guide

This guide covers load testing for HelpBridge using k6.

> [!IMPORTANT]
> HelpBridge does **not** vendor the `k6` executable in git. Install `k6` locally and ensure it is available on your shell `PATH` before running any `npm run test:load*` command.

## Overview

Load testing validates that the application performs well under expected and peak traffic conditions. We use [k6](https://k6.io/) for load testing, which provides:

- JavaScript-based test scripts
- Realistic load simulation
- Detailed performance metrics
- CI/CD integration

## Prerequisites

### Install k6

**macOS:**

```bash
brew install k6
```

**Linux:**

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**

```powershell
choco install k6
```

**Verification:**

```bash
k6 version
```

### Start the Application

```bash
npm run dev
# Or for production build:
npm run build && npm start
```

## Test Types

### 1. Smoke Test

**Purpose:** Verify basic functionality with minimal load.

**Characteristics:**

- 1 virtual user (VU)
- 30 second duration
- Tests basic connectivity

**Run:**

```bash
npm run test:load:smoke
```

**Expected Results:**

- 100% success rate
- p95 latency < 1000ms
- All health checks pass

---

### 2. Search API Load Test

**Purpose:** Realistic load testing with gradual ramp-up.

**Characteristics:**

- Ramps from 10 to 50 VUs over 5 minutes
- Sustained load at 50 VUs for 3 minutes
- Tests keyword search, filters, location-based queries
- Validates crisis detection

**Run:**

```bash
npm run test:load
```

**Expected Results:**

- p95 latency < 800ms
- p99 latency < 1500ms
- Error rate < 5%
- 95% of checks pass

**Thresholds:**

```javascript
{
  http_req_duration: ['p(95)<800', 'p(99)<1500'],
  http_req_failed: ['rate<0.05'],
  checks: ['rate>0.95'],
}
```

---

### 3. Sustained Load Test

**Purpose:** Long-running test to detect memory leaks and performance degradation.

**Characteristics:**

- Constant 20 VUs
- 30 minute duration (adjustable)
- Monitors for stability issues

**Run:**

```bash
npm run test:load:sustained
```

**Expected Results:**

- Stable performance across duration
- p95 latency < 1000ms
- p99 latency < 2000ms
- No performance degradation over time

**Warning Signs:**

- ⚠️ p99 latency increasing over time (memory leak)
- ⚠️ Error rate increasing (resource exhaustion)
- ⚠️ p99 > 3000ms (critical threshold)

---

### 4. Spike Test

**Purpose:** Test system resilience under sudden traffic spikes.

**Characteristics:**

- Spike from 0 to 100 VUs in 10 seconds
- Hold at 100 VUs for 1 minute
- Drop back to 0

**Run:**

```bash
npm run test:load:spike
```

**Expected Results:**

- p95 latency < 2000ms
- p99 latency < 5000ms
- Error rate < 15% (relaxed during spike)
- Rate limiting activates (protecting system)
- Circuit breaker may activate (expected)

**Success Criteria:**

- System degrades gracefully (doesn't crash)
- Rate limiting prevents cascading failures
- System recovers after spike
- Circuit breaker activates if needed

---

## Understanding Results

### Key Metrics

**Response Time Percentiles:**

- **p50 (median):** 50% of requests complete faster than this
- **p95:** 95% of requests complete faster than this (target SLA)
- **p99:** 99% of requests complete faster than this (worst case)
- **max:** Slowest request

**Error Rates:**

- **http_req_failed:** Percentage of HTTP errors (non-2xx)
- **search_errors:** Custom metric for search-specific errors

**Custom Metrics:**

- **search_duration:** Average search operation time
- **rate_limit_hits:** Number of rate limit activations
- **circuit_breaker_activations:** Circuit breaker open events

### Example Output

```
=== Search API Load Test Summary ===

Total Requests: 15234
Failed Requests: 2.3%

Response Times:
  p50: 245ms
  p95: 678ms
  p99: 1234ms
  max: 2456ms

Custom Metrics:
  Search Error Rate: 2.1%
  Avg Search Duration: 287ms
```

### Interpreting Results

**Good Performance:**

- ✅ p95 < 800ms
- ✅ p99 < 1500ms
- ✅ Error rate < 5%
- ✅ Stable performance across test duration

**Degraded Performance:**

- ⚠️ p95 between 800-1200ms
- ⚠️ p99 between 1500-2500ms
- ⚠️ Error rate between 5-10%
- Action: Investigate slow queries, optimize code

**Critical Issues:**

- ❌ p95 > 1200ms
- ❌ p99 > 3000ms
- ❌ Error rate > 10%
- Action: Stop deployment, investigate immediately

---

## Baseline Performance Metrics

### Current Baseline (v17.5)

Established on: 2026-01-25

**Environment:** Local development server (not representative of production)

| Test       | VUs   | Duration | p50 | p95 | p99 | Error Rate |
| ---------- | ----- | -------- | --- | --- | --- | ---------- |
| Smoke      | 1     | 30s      | TBD | TBD | TBD | TBD        |
| Search API | 10-50 | 10m      | TBD | TBD | TBD | TBD        |
| Sustained  | 20    | 30m      | TBD | TBD | TBD | TBD        |
| Spike      | 0-100 | 1m       | TBD | TBD | TBD | TBD        |

**Note:** Run tests and document actual baseline metrics before first production deployment.

---

## Running Tests Against Different Environments

### Local Development

```bash
npm run test:load:smoke
```

### Staging/Preview

```bash
BASE_URL=https://preview.helpbridge.ca npm run test:load:smoke
```

### Production (Caution!)

```bash
# Only run smoke tests against production
# NEVER run sustained or spike tests against production
BASE_URL=https://helpbridge.ca npm run test:load:smoke
```

---

## CI/CD Integration

### GitHub Actions (Optional)

Create `.github/workflows/load-test.yml`:

```yaml
name: Load Test

on:
  workflow_dispatch: # Manual trigger only
  schedule:
    - cron: "0 2 * * 0" # Weekly on Sunday at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm start &

      - name: Wait for application
        run: sleep 10

      - name: Run smoke test
        run: npm run test:load:smoke

      - name: Run load test
        run: npm run test:load

      - name: Upload results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: load-test-results
          path: "*.json"
```

**Important:** Mark as non-blocking initially. Only fail CI if performance degrades significantly.

---

## Troubleshooting

### High Latency

**Symptoms:** p95 > 1000ms, p99 > 2000ms

**Possible Causes:**

- Database queries not optimized
- Missing indexes
- N+1 query problems
- Network latency to Supabase

**Actions:**

1. Enable performance tracking: `NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING=true`
2. Check logs for slow operations
3. Review database query plans
4. Check `/api/v1/health` for DB latency

### High Error Rate

**Symptoms:** Error rate > 5%

**Possible Causes:**

- Rate limiting too strict
- Database connection pool exhausted
- Circuit breaker opening
- Timeout issues

**Actions:**

1. Check `/api/v1/health` for circuit breaker state
2. Review rate limit configuration
3. Check database connection pool size
4. Increase timeout values if needed

### Memory Leaks

**Symptoms:** p99 latency increasing over time in sustained test

**Possible Causes:**

- In-memory cache not pruning
- Event listeners not cleaned up
- Database connections not released

**Actions:**

1. Monitor Node.js heap usage
2. Review in-memory caching logic (`lib/performance/metrics.ts`)
3. Check database connection cleanup
4. Use `node --inspect` and Chrome DevTools memory profiler

### Circuit Breaker Activating

**Symptoms:** 503 errors, circuit_breaker_activations > 0

**Status:** This is expected behavior during spikes!

**Actions:**

1. Check `/api/v1/health` for current state
2. Verify fallback to JSON working
3. If persistent, investigate upstream Supabase issues
4. Adjust circuit breaker thresholds if needed:
   - `CIRCUIT_BREAKER_FAILURE_THRESHOLD`
   - `CIRCUIT_BREAKER_TIMEOUT`

---

## Best Practices

### DO:

- ✅ Run smoke tests before every deployment
- ✅ Run load tests weekly on staging
- ✅ Document baseline metrics
- ✅ Track performance trends over time
- ✅ Test realistic user scenarios
- ✅ Monitor during tests (health endpoint, logs)

### DON'T:

- ❌ Run sustained/spike tests against production
- ❌ Run load tests during business hours (staging)
- ❌ Ignore gradual performance degradation
- ❌ Test without monitoring enabled
- ❌ Make changes without re-establishing baseline

---

## Further Reading

- [k6 Documentation](https://k6.io/docs/)
- [k6 Documentation](https://grafana.com/docs/k6/latest/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/automated-performance-testing/)
- HelpBridge: `docs/adr/014-database-index-optimization.md`
- HelpBridge: `docs/adr/013-unified-rls-policy.md`

---

## Next Steps

1. **Establish Baseline:** Run all tests and document metrics in this file
2. **Set Alerts:** Configure monitoring to alert on performance degradation
3. **Automate:** Set up weekly load tests in CI/CD
4. **Optimize:** Use insights to guide performance improvements
5. **Re-test:** Verify optimizations with load tests
