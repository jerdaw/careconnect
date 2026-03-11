# v18.0 Phase 3: SLO Decision Guide

**Version:** 1.0
**Date Created:** 2026-02-05
**Status:** Draft - Awaiting User Decisions
**Estimated Time:** 30-45 minutes to review and decide

---

## Executive Summary

This document guides you through defining Service Level Objectives (SLOs) for HelpBridge. **SLOs are measurable targets that define what "good" looks like for your service.** You need to make strategic decisions about:

1. **Uptime Target** - What percentage of time should the service be available?
2. **Latency Target** - How fast should search results return?
3. **Error Budget** - How many errors are acceptable?
4. **Status Page Configuration** - How to communicate health to users?

**Why This Matters:** SLOs determine when you get alerted, what gets prioritized, and how you communicate reliability to users. Too strict = alert fatigue and unnecessary firefighting. Too loose = poor user experience.

**What You Need to Decide:** Choose one tier (Optimistic, Realistic, or Conservative) for each SLO dimension based on your launch timeline, resources, and user expectations.

---

## Background: What Are SLOs?

### Core Concepts

**Service Level Indicator (SLI)** - A measurement (e.g., "95% of requests completed in <500ms")
**Service Level Objective (SLO)** - Your internal target (e.g., "99.5% uptime")
**Service Level Agreement (SLA)** - A contract with consequences (not applicable yet - you're not at this stage)

### Example: Google Search

- **SLI:** Search result load time
- **SLO:** 99% of searches return results in <1 second
- **Error Budget:** 1% of searches can fail or be slow without breaking the SLO

### Your Context

HelpBridge is a **civic search engine** for social services:

- **Traffic Pattern:** Bursty (crisis searches, after-hours spikes)
- **User Expectation:** Fast results (people in crisis can't wait)
- **Data Freshness:** Updated weekly (not real-time trading platform)
- **Infrastructure:** Serverless (Vercel) + Supabase (managed PostgreSQL)
- **Current State:** Pre-launch, no production traffic data yet

---

## SLO Decision Framework

### Dimension 1: Uptime Target

**Question:** What percentage of time should the service return successful responses?

#### Option A: Optimistic (99.9% - "Three Nines")

**What it means:**

- Allows 43 minutes of downtime per month
- Roughly 8 hours of downtime per year

**Pros:**

- ✅ Competitive with major SaaS products
- ✅ Builds user trust and confidence
- ✅ Good for marketing/credibility

**Cons:**

- ❌ Requires significant on-call effort
- ❌ Limited error budget for experiments
- ❌ May be unrealistic for pre-launch with single maintainer

**Realistic for you?** Only if:

- You have 24/7 on-call rotation
- Supabase is on Pro tier (not free)
- You have tested failover procedures extensively

---

#### Option B: Realistic (99.5% - "Two Nines Five")

**What it means:**

- Allows 3.6 hours of downtime per month
- Roughly 1.8 days of downtime per year

**Pros:**

- ✅ **Achievable with serverless + managed database**
- ✅ Reasonable error budget for maintenance and experiments
- ✅ Aligns with free-tier Supabase capabilities
- ✅ Room for learning and iteration

**Cons:**

- ⚠️ May see occasional brief outages during database maintenance
- ⚠️ Requires monitoring and rapid incident response (already built in v18.0!)

**Realistic for you?** Yes, if:

- You're using Supabase free/Pro tier
- You respond to critical alerts within 30 minutes
- You accept scheduled maintenance windows (announced in advance)

**💡 RECOMMENDED for initial launch**

---

#### Option C: Conservative (99.0% - "Two Nines")

**What it means:**

- Allows 7.2 hours of downtime per month
- Roughly 3.6 days of downtime per year

**Pros:**

- ✅ Very achievable, low operational stress
- ✅ Large error budget for experimentation
- ✅ Good for alpha/beta testing phase

**Cons:**

- ❌ Users may notice frequent brief outages
- ❌ Not competitive for production civic service
- ❌ May hurt trust if downtime is during crisis hours

**Realistic for you?** Only if:

- You're still in beta/soft-launch phase
- You plan to upgrade to 99.5% after 3-6 months
- User expectations are explicitly set (e.g., "Beta Service")

---

### Dimension 2: Latency Target

**Question:** How fast should search API responses be?

**Context from your existing testing infrastructure:**

- **Smoke test expectations:** p95 <1000ms (single user, cold database)
- **Load test expectations:** p95 200-500ms (realistic traffic)
- **Roadmap target mentioned:** p95 <800ms

#### Option A: Optimistic (p95 < 500ms)

**What it means:**

- 95% of requests complete in under 500ms
- 5% can be slower (error budget)

**Pros:**

- ✅ Excellent user experience (feels instant)
- ✅ Competitive with commercial search engines
- ✅ Good for mobile users on slower networks

**Cons:**

- ❌ Requires database query optimization
- ❌ May need paid Supabase tier for connection pooling
- ❌ Difficult to achieve during traffic spikes

**Realistic for you?** Only if:

- You complete database query optimization (indexes, caching)
- Supabase is on Pro tier (faster connection pooling)
- You're using CDN caching for static assets

---

#### Option B: Realistic (p95 < 800ms)

**What it means:**

- 95% of requests complete in under 800ms
- 5% can be slower (up to 2-3 seconds is OK)

**Pros:**

- ✅ **Achievable with current infrastructure (mentioned in roadmap)**
- ✅ Still feels fast to users (< 1 second = "instant")
- ✅ Tolerates database cold starts and connection pooling delays
- ✅ Matches your existing baseline test expectations

**Cons:**

- ⚠️ Occasional requests may feel sluggish (1-2 seconds)
- ⚠️ Requires monitoring for slow query regressions

**Realistic for you?** Yes, if:

- You're on Supabase free tier (with occasional cold starts)
- You monitor for slow query regressions (v18.0 already built this!)
- You optimize critical paths but accept some variance

**💡 RECOMMENDED for initial launch**

---

#### Option C: Conservative (p95 < 1200ms)

**What it means:**

- 95% of requests complete in under 1.2 seconds
- 5% can be slower (up to 3-5 seconds)

**Pros:**

- ✅ Very achievable, large latency budget
- ✅ Tolerates database maintenance and cold starts
- ✅ Good for beta/testing phase

**Cons:**

- ❌ Users may notice "loading" delay (>1 second feels slow)
- ❌ Poor experience on mobile/slow networks
- ❌ Not competitive for production civic service

**Realistic for you?** Only if:

- You're in beta/soft-launch phase
- You plan aggressive query optimization in first 3 months
- User expectations are set ("Beta - Expect Delays")

---

### Dimension 3: Error Budget

**Question:** What error rate is acceptable?

**Context:** Error rate = (failed requests / total requests) × 100

#### Calculation Based on Uptime Target

If you choose **99.5% uptime**, your error budget is:

- **0.5% of requests can fail** without breaking SLO
- Example: 10,000 requests/day → 50 failures allowed

If you choose **99.9% uptime**, your error budget is:

- **0.1% of requests can fail**
- Example: 10,000 requests/day → 10 failures allowed

#### What Counts as an "Error"?

**HTTP Status Codes:**

- ✅ **200-299:** Success (counts toward SLO)
- ❌ **400-499:** Client errors (user's fault, **exclude from SLO**)
- ❌ **500-599:** Server errors (your fault, **count against SLO**)
- ❌ **Timeout:** No response in 30 seconds (count against SLO)

**Special Cases:**

- **Circuit breaker OPEN (503):** Count against SLO (this is expected behavior during outages)
- **Rate limiting (429):** Exclude from SLO (user exceeded quota)
- **Search returns 0 results:** Not an error (successful empty response)

#### Recommendation

**Match your uptime target:**

- 99.5% uptime → 0.5% error budget
- 99.9% uptime → 0.1% error budget

**Why:** Uptime and error rate are closely correlated. Choosing different targets creates confusion.

---

### Dimension 4: Status Page Configuration

**Question:** How should you communicate service health to users?

#### What is Upptime?

[Upptime](https://upptime.js.org/) is a **free, open-source status page** that runs on GitHub Actions.

**How it works:**

1. GitHub Actions pings your API every 5 minutes
2. Records uptime/downtime and response times
3. Generates static site hosted on GitHub Pages
4. Costs: $0 (runs on free GitHub Actions quota)

**Example:** `https://status.helpbridge.ca`

#### Configuration Decisions

##### What endpoints to monitor?

**Option A: Minimal (Recommended for Launch)**

- ✅ `/api/v1/health` - Overall system health
- ✅ `/api/v1/search/services` - Core search API

**Option B: Comprehensive**

- `/api/v1/health`
- `/api/v1/search/services`
- `/api/v1/services/export` (offline sync)
- `/api/v1/analytics` (dashboard)

**Recommendation:** Start with Option A, add more endpoints after 1 month of production data.

##### How often to check?

**Options:**

- Every 1 minute (aggressive, burns GitHub Actions quota faster)
- **Every 5 minutes** (default, recommended)
- Every 15 minutes (too infrequent, miss brief outages)

**Recommendation:** Every 5 minutes (2,880 checks/day = well within GitHub free tier)

##### What to display publicly?

**Option A: Transparency (Recommended)**

- Show uptime percentage (last 30 days)
- Show average response time
- Show incident history with timestamps
- Link to runbooks (optional)

**Option B: Minimal**

- Show only "Operational" / "Degraded" / "Down" status
- Hide response times and incident details

**Recommendation:** Option A (Transparency) - builds trust with civic service users

---

## Decision Template

Fill this out to finalize your SLOs:

```yaml
# HelpBridge SLO Configuration
version: "1.0"
effective_date: "2026-02-12" # Replace with your launch date
review_date: "2026-05-12" # Review after 3 months

uptime_target:
  slo: 99.5% # Choose: 99.0%, 99.5%, or 99.9%
  measurement_window: 30d # Rolling 30-day window
  error_budget: 0.5% # 1.0% for 99.0%, 0.5% for 99.5%, 0.1% for 99.9%

latency_target:
  p50_ms: 200 # Median response time target
  p95_ms: 800 # 95th percentile target (choose: 500, 800, or 1200)
  p99_ms: 2000 # 99th percentile target (typically 2-3x p95)
  measurement_window: 24h # Rolling 24-hour window

error_rate_target:
  max_error_rate: 0.5% # Match uptime_target.error_budget
  exclude_4xx: true # Don't count client errors (404, 400, 429)
  count_circuit_breaker: true # Count circuit breaker 503s (expected behavior)

status_page:
  enabled: true
  url: "https://status.helpbridge.ca"
  check_interval: 5m
  endpoints:
    - "/api/v1/health"
    - "/api/v1/search/services"
  display_response_times: true
  display_incident_history: true
```

---

## Implementation Checklist

Once you've made your decisions, follow these steps:

### Step 1: Update Configuration Files

- [ ] Create `docs/operations/slo-targets.yaml` (use template above)
- [ ] Update alerting thresholds in `lib/observability/alert-throttle.ts` (if needed)
- [ ] Document SLO rationale in `docs/adr/020-slo-targets.md`

### Step 2: Configure Upptime

- [ ] Fork [upptime/upptime](https://github.com/upptime/upptime) on GitHub
- [ ] Update `.upptime/config.yml` with your endpoints
- [ ] Configure custom domain `status.helpbridge.ca` (requires DNS CNAME)
- [ ] Enable GitHub Pages on `gh-pages` branch
- [ ] Wait 5 minutes for first check to run

**Detailed Guide:** [Upptime Setup Guide](https://upptime.js.org/docs/get-started)

### Step 3: Build SLO Monitoring Dashboard

**Where:** Extend existing `/admin/observability` dashboard

**New components to add:**

- [ ] **SLO Compliance Widget** - Shows current vs target (e.g., "99.7% / 99.5% ✅")
- [ ] **Error Budget Widget** - Shows remaining budget (e.g., "0.2% / 0.5% remaining")
- [ ] **Latency Target Widget** - Shows p95 current vs target (e.g., "650ms / 800ms ✅")
- [ ] **30-Day Trend Graph** - Historical SLO compliance over time

**Estimated Effort:** 4-6 hours (coding + testing)

### Step 4: Update Alerting

**Modify:** `lib/observability/alert-throttle.ts`

**Add new alert types:**

```typescript
// SLO violation alerts
"slo-uptime-breach": 1 * 60 * 60 * 1000,      // 1 hour throttle
"slo-latency-breach": 30 * 60 * 1000,         // 30 minute throttle
"slo-error-budget-75": 24 * 60 * 60 * 1000,   // 24 hour throttle (at 75% consumed)
"slo-error-budget-90": 6 * 60 * 60 * 1000,    // 6 hour throttle (at 90% consumed)
```

**Modify:** `lib/resilience/telemetry.ts`

**Add SLO breach detection:**

```typescript
// Check if error budget is exceeded
const errorBudget = 0.005 // 0.5% for 99.5% uptime
const currentErrorRate = failures / totalRequests
if (currentErrorRate > errorBudget * 0.75) {
  // Alert: 75% of error budget consumed
  void sendSlackAlert("slo-error-budget-75", { currentErrorRate, errorBudget })
}
```

**Estimated Effort:** 2-3 hours (coding + testing)

### Step 5: Document and Communicate

- [ ] Update `README.md` with SLO targets (public-facing)
- [ ] Update `CLAUDE.md` with SLO decision rationale
- [ ] Add SLO targets to deployment checklist
- [ ] Create "SLO Review" calendar reminder (3 months from launch)

---

## Example: Recommended Configuration for Initial Launch

Based on your current infrastructure and pre-launch status, here's a **recommended starting point**:

```yaml
# RECOMMENDED: Conservative but Achievable SLOs for Launch
uptime_target:
  slo: 99.5% # 3.6 hours downtime/month allowed
  error_budget: 0.5%

latency_target:
  p95_ms: 800 # Matches roadmap target
  p99_ms: 2000

error_rate_target:
  max_error_rate: 0.5% # Matches uptime target

status_page:
  enabled: true
  check_interval: 5m
  endpoints:
    - "/api/v1/health"
    - "/api/v1/search/services"
```

**Rationale:**

- **99.5% uptime:** Achievable with Supabase free tier + circuit breaker protection (already built)
- **p95 <800ms:** Matches your roadmap target and expected baseline performance
- **Public status page:** Builds trust with civic service users

**After 3 months of production data, consider upgrading to:**

- 99.9% uptime (if Supabase on Pro tier)
- p95 <500ms (if you optimize database queries)

---

## Dependencies & Blockers

### User Actions Required

Before implementing Phase 3, you need:

1. ✅ **SLO Decisions** - Fill out the decision template above (30-45 min)
2. ⚠️ **Domain Configuration** - Set up `status.helpbridge.ca` CNAME to GitHub Pages (~10 min)
3. ⚠️ **GitHub Repository** - Fork upptime/upptime and configure endpoints (~20 min)
4. ⏸️ **Production Baseline Data** (Optional but Recommended) - Run 1 week of production traffic to validate targets

**Total Setup Time:** 1-2 hours (excluding production data collection)

### Can Proceed Without Production Data?

**Yes, but with caveats:**

- ✅ You can deploy Upptime and status page immediately
- ✅ You can implement SLO monitoring dashboard
- ⚠️ SLO targets will be **estimated** based on load test baselines
- ⚠️ You should review/adjust targets after 1-4 weeks of real traffic

**Recommendation:** Deploy with estimated targets, add "⚠️ Targets subject to adjustment during beta" disclaimer on status page.

---

## Next Steps

1. **Review this document** (30-45 min) - Understand the tradeoffs
2. **Make decisions** - Fill out the decision template
3. **Reply with your choices** - I'll implement the SLO monitoring dashboard and Upptime configuration
4. **Set up DNS** - Configure `status.helpbridge.ca` CNAME (you must do this)
5. **Deploy** - I'll guide you through Upptime deployment

---

## Questions to Consider

Before finalizing your decisions, ask yourself:

1. **What's my launch timeline?**
   - Launching in 2 weeks → Conservative targets (99.0%, p95 <1200ms)
   - Launching in 2 months → Realistic targets (99.5%, p95 <800ms)

2. **How often can I respond to incidents?**
   - 24/7 on-call → Aggressive targets (99.9%)
   - Business hours only → Conservative targets (99.5%)

3. **What's my Supabase tier?**
   - Free tier → Conservative latency targets (p95 <1200ms)
   - Pro tier → Realistic latency targets (p95 <800ms)

4. **What are user expectations?**
   - Beta/soft launch → Set expectations low, exceed them
   - Production civic service → Users expect reliability

5. **How much time do I have for optimization?**
   - Limited time → Conservative targets, improve later
   - 1-2 months → Realistic targets, optimize before launch

---

## Related Documentation

- [v18.0 Implementation Summary](../implementation/v18-0-IMPLEMENTATION-SUMMARY.md)
- [Performance Baseline Walkthrough](../testing/BASELINE-WALKTHROUGH.md)
- [Observability Dashboard Usage](../observability/dashboard-usage.md)
- [Circuit Breaker Runbook](../runbooks/circuit-breaker-open.md)
- [ADR-019: Production Observability](../adr/019-production-observability-and-alerting.md)
- [Upptime Documentation](https://upptime.js.org/docs)

---

**Last Updated:** 2026-02-05
**Version:** 1.0
**Status:** Awaiting User Decisions

**Next Review:** After user decisions are made, or 2026-02-12 (whichever comes first)
