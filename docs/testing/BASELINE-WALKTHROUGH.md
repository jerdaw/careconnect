# Performance Baseline Testing Walkthrough

**Task:** v18.0 Phase 1, Task 1.3 - Document Performance Baselines
**Estimated Time:** 45-60 minutes (including 30min sustained test)
**Status:** Ready to Execute

---

## Overview

This walkthrough guides you through establishing performance baselines for Kingston Care Connect. You'll run 4 load tests and document the results.

### What You'll Do

1. **Start the development server** (5 min)
2. **Run smoke test** (30 seconds)
3. **Run realistic load test** (5 minutes)
4. **Run sustained load test** (30 minutes) ⏰ Long-running
5. **Run spike test** (2 minutes)
6. **Analyze and document results** (10 minutes)

---

## Prerequisites

### 1. Verify k6 is Installed

```bash
k6 version
```

**Expected output:** `k6 v0.x.x`

**If not installed:**

- **macOS:** `brew install k6`
- **Linux:** See https://k6.io/docs/get-started/installation/
- **Windows:** Download from https://k6.io/docs/get-started/installation/

### 2. Verify Database Connection

```bash
# Check if Supabase credentials are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Both should output URLs/keys. If empty, check `.env.local`.

---

## Step-by-Step Instructions

### Step 1: Start the Development Server

**Terminal 1 (keep this running):**

```bash
# Start dev server
npm run dev
```

**Wait for:** `✓ Ready in X.XXs`

**Verify server is running:**

```bash
# In a NEW terminal (Terminal 2)
curl http://localhost:3000/api/v1/health
```

**Expected:** JSON response with `"status": "healthy"`

---

### Step 2: Run Smoke Test (30 seconds)

**Purpose:** Verify basic connectivity and establish minimum performance floor.

**Command:**

```bash
# Terminal 2
npm run test:load:smoke
```

**What happens:**

- 1 virtual user
- 30 seconds duration
- Hits `/api/v1/search/services` with simple queries

**Watch for:**

- ✅ `checks.........................: 100.00%` (or close to it)
- ✅ `http_req_failed................: 0.00%` (ideally)
- ✅ `http_req_duration...............: avg=XXXms p(95)=XXXms`

**Capture results:**

```bash
# Run again and save to file
npm run test:load:smoke > smoke-test-results.txt 2>&1
```

**Analyze:**

```bash
npm run analyze:load-test smoke-test-results.txt smoke
```

**Copy the output** and save it for later (you'll add it to the baseline doc).

---

### Step 3: Run Realistic Load Test (5 minutes)

**Purpose:** Simulate realistic traffic with multiple users and query types.

**Command:**

```bash
npm run test:load > load-test-results.txt 2>&1
```

**What happens:**

- 10-50 virtual users (gradual ramp-up)
- 5 minutes duration
- Mix of query types (keyword, category, geo, combined)

**This will take 5 minutes.** You can monitor progress in the terminal.

**Watch for:**

- Circuit breaker state (should remain CLOSED)
- Error rate (should be <5%)
- p95 latency (target <500ms)

**After completion, analyze:**

```bash
npm run analyze:load-test load-test-results.txt load
```

**Copy the output** for documentation.

---

### Step 4: Run Sustained Load Test (30 minutes) ⏰

**Purpose:** Test system stability under continuous load.

**⚠️ WARNING:** This test runs for **30 minutes**. Plan accordingly!

**Command:**

```bash
npm run test:load:sustained > sustained-test-results.txt 2>&1
```

**What happens:**

- 20 virtual users (constant)
- 30 minutes duration
- Monitors for memory leaks, performance degradation

**While it runs:**

- ✅ Server should remain responsive
- ✅ No memory leaks (check system monitor)
- ✅ Circuit breaker should stay CLOSED
- ☕ Take a break! This is a good time for coffee.

**Monitor system resources (optional):**

```bash
# In Terminal 3
watch -n 5 "ps aux | grep 'next-server' | grep -v grep"
```

**After completion, analyze:**

```bash
npm run analyze:load-test sustained-test-results.txt sustained
```

**Copy the output** for documentation.

---

### Step 5: Run Spike Test (2 minutes)

**Purpose:** Test circuit breaker behavior under sudden traffic spikes.

**Command:**

```bash
npm run test:load:spike > spike-test-results.txt 2>&1
```

**What happens:**

- 0 → 100 users in 10 seconds (spike)
- Hold for 30 seconds
- Ramp down to 0

**Expected behavior:**

- Circuit breaker MAY open (this is OK!)
- Should recover within 60 seconds
- Post-spike error rate should return to normal

**Watch for:**

- Circuit breaker transitions (CLOSED → OPEN → HALF_OPEN → CLOSED)
- Recovery time
- Any permanent degradation (there shouldn't be any)

**After completion, analyze:**

```bash
npm run analyze:load-test spike-test-results.txt spike
```

**Copy the output** for documentation.

---

### Step 6: Document Results

Now you have 4 result files:

- `smoke-test-results.txt`
- `load-test-results.txt`
- `sustained-test-results.txt`
- `spike-test-results.txt`

And 4 analyzed summaries (from the `analyze:load-test` commands).

**Update the baseline document:**

```bash
# Open the baseline template
code docs/testing/performance-baselines.md
# Or: vim docs/testing/performance-baselines.md
```

**Fill in the placeholders:**

1. **Test Environment Section:**
   - Date: `date`
   - Node version: `node --version`
   - CPU: `lscpu | grep "Model name"`
   - RAM: `free -h | grep Mem | awk '{print $2}'`

2. **Each test section:**
   - Copy/paste the analyzed metrics from each test
   - Fill in [TO BE FILLED] placeholders
   - Mark status as PASS or FAIL based on thresholds

3. **Regression Thresholds:**
   - Calculate: Baseline × 1.5 (for +50% threshold)
   - Calculate: Baseline × 2.0 (for +100% threshold)
   - Fill in the calculated values

**Example:**

```markdown
### 1. Smoke Test Results

**Throughput:**

- Requests per second: 15.2 req/s
- Total requests: 456
- Failed requests: 0

**Response Times:**

- **Min:** 45ms
- **Avg:** 123ms
- **Median (p50):** 115ms
- **p90:** 178ms
- **p95:** 245ms
- **p99:** 389ms
- **Max:** 567ms

**Status:** ✅ PASS
```

---

### Step 7: Commit Results

```bash
# Add the updated baseline document
git add docs/testing/performance-baselines.md
git add docs/testing/baseline-*.md  # Analyzed summaries

# Commit
git commit -m "docs(testing): establish v18.0 performance baselines

- Smoke test: [YOUR p95]ms p95
- Load test: [YOUR p95]ms p95, [YOUR rate] req/s
- Sustained test: [YOUR p95]ms p95 (stable over 30min)
- Spike test: Circuit breaker behavior validated

Baseline metrics established for regression detection.

Refs: v18.0 Task 1.3"
```

---

## Troubleshooting

### Issue: "Connection refused" or "ECONNREFUSED"

**Cause:** Dev server not running
**Fix:**

```bash
# Terminal 1: Start dev server
npm run dev
```

### Issue: High error rates (>10%)

**Possible causes:**

1. **Database connection issues:** Check Supabase status
2. **Rate limiting:** You hit Supabase free tier limits
3. **Circuit breaker opening:** Expected during spike test, not during others

**Check circuit breaker state:**

```bash
curl http://localhost:3000/api/v1/health | jq '.checks.circuitBreaker'
```

### Issue: Very slow response times (p95 >2000ms)

**Possible causes:**

1. **Cold database:** First requests are slower (run test twice)
2. **Local resource constraints:** Close other applications
3. **Network latency:** Check Supabase region vs your location

**Try:**

```bash
# Warm up the database first
for i in {1..10}; do curl -s http://localhost:3000/api/v1/search/services?query=food > /dev/null; done

# Then run test again
npm run test:load:smoke
```

### Issue: k6 not found

**Fix:**

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

---

## Expected Results (Rough Guidelines)

These are **rough estimates** - your results may vary based on:

- Hardware specs
- Database region/tier
- Network latency
- System load

### Smoke Test (1 VU, 30s)

- **Throughput:** 10-20 req/s
- **p95:** 100-300ms
- **Error rate:** 0-1%

### Load Test (10-50 VUs, 5min)

- **Throughput:** 40-100 req/s
- **p95:** 200-500ms
- **Error rate:** 0-5%

### Sustained Test (20 VUs, 30min)

- **Throughput:** 30-60 req/s (stable)
- **p95:** 200-500ms (stable, <10% variance)
- **Error rate:** 0-5% (consistent)

### Spike Test (0-100 VUs)

- **During spike p95:** 500-2000ms
- **Circuit breaker:** May open (OK)
- **Recovery:** <60 seconds
- **Post-spike:** Returns to baseline

---

## Success Criteria

Your baseline is **successful** if:

- ✅ All 4 tests complete without crashes
- ✅ Smoke test error rate <1%
- ✅ Load test p95 <1000ms
- ✅ Sustained test shows stable performance (no degradation)
- ✅ Spike test demonstrates circuit breaker recovery
- ✅ Results documented in `performance-baselines.md`

---

## What's Next

After documenting baselines:

1. **Task 1.4:** Secure the metrics endpoint (`/api/v1/metrics`)
2. **Phase 2:** Set up production monitoring (Axiom integration)
3. **Phase 3:** Define SLOs based on these baselines

---

## Notes

- **First run slower:** Database cold starts can make first test slower - run twice
- **Supabase free tier:** Has limits (100 req/s), may cause some errors at high load
- **Circuit breaker:** Should stay CLOSED except during spike test
- **Memory usage:** Monitor for leaks during sustained test

---

## Questions?

If you encounter issues or unexpected results:

1. Check the troubleshooting section above
2. Review k6 output for specific error messages
3. Check `/api/v1/health` for circuit breaker state
4. Consult `docs/adr/016-performance-tracking-and-circuit-breaker.md`

---

**Date:** 2026-01-30
**Version:** 1.0
