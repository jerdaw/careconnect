# v18.0 Phase 2: Executive Summary

**Phase:** Production Monitoring Infrastructure
**Version:** 18.0-Phase-2
**Date:** 2026-01-30
**Status:** READY FOR IMPLEMENTATION
**Estimated Effort:** 10-12 hours (2-3 days)

---

## TL;DR

**What:** Add production-grade observability (Axiom metrics, real-time dashboard, Slack alerts, operational runbooks)

**Why:** Phase 1 made the platform resilient but blind in production. Phase 2 adds visibility into system health.

**How:** Integrate Axiom for persistent metrics → Build admin dashboard → Configure alerts → Document runbooks

**When:** 2-3 days of focused development

**Outcome:** Detect and respond to production issues within minutes, not hours

---

## Current State Analysis

### Phase 1 Completion (v18.0)

**✅ Achievements:**

- 100% circuit breaker coverage on all API routes
- 540 tests passing (0 failures, 0 type errors)
- Admin-only metrics endpoint security
- Performance baseline infrastructure ready
- Production-ready resilience patterns

**Current Capabilities:**

- Circuit breaker protects database operations
- Performance metrics tracked in-memory (dev-only)
- Health check API available
- Graceful degradation during failures

**Current Gaps:**

- ❌ No persistent metrics storage (data lost on restart)
- ❌ No production monitoring or alerting
- ❌ No real-time visibility into system health
- ❌ No incident response procedures
- ❌ Mean-time-to-detection (MTTD): Unknown (potentially hours)
- ❌ Mean-time-to-recovery (MTTR): Unknown

### Why Phase 2 Matters

**Scenario: Production Database Failure**

**Without Phase 2:**

1. Circuit breaker opens (resilient ✅)
2. Users see fallback data (graceful ✅)
3. **Nobody knows it happened** ❌
4. **Discovered hours later when user reports issue** ❌
5. **No historical data to debug** ❌
6. **No procedure for resolution** ❌

**With Phase 2:**

1. Circuit breaker opens (resilient ✅)
2. Slack alert within 30 seconds ✅
3. Admin checks observability dashboard ✅
4. Reviews circuit breaker runbook ✅
5. Historical metrics in Axiom help debug ✅
6. Issue resolved in <15 minutes ✅

**Impact:** Reduce MTTD from hours to seconds, MTTR from hours to minutes.

---

## Strategic Goals

### Goal 1: Production Visibility

**Current:** Blind to production health (in-memory metrics lost on restart)

**Target:** Persistent metrics in Axiom with 7-day retention

**Benefits:**

- Historical data for debugging
- Trend analysis for capacity planning
- Regression detection (compare to baselines)
- Compliance documentation (uptime reports)

---

### Goal 2: Proactive Alerting

**Current:** Reactive (user reports issues)

**Target:** Automated Slack alerts within 30 seconds of critical events

**Benefits:**

- Detect issues before users report them
- Reduce MTTD from hours to seconds
- Enable faster incident response
- Prevent cascading failures

---

### Goal 3: Operational Excellence

**Current:** No documented incident procedures

**Target:** 4 operational runbooks with step-by-step resolution procedures

**Benefits:**

- Consistent incident response
- Reduce MTTR with clear procedures
- Enable new team members to respond
- Reduce stress during incidents

---

## Business Value

### Quantified Benefits

**Uptime Improvement:**

- Current: Unknown (no monitoring)
- Target: 99.5% (measured and enforced)
- **Value:** User trust, reduced churn

**Mean-Time-to-Detection:**

- Current: Hours (user-reported)
- Target: <30 seconds (automated alerts)
- **Value:** 100x faster incident detection

**Mean-Time-to-Recovery:**

- Current: Hours (no procedures)
- Target: <15 minutes (documented runbooks)
- **Value:** 8x faster resolution

**Operational Efficiency:**

- Current: Manual monitoring (developer time)
- Target: Automated (zero ongoing cost)
- **Value:** Developer time freed for features

---

### Risk Reduction

**Production Launch Risks (Without Phase 2):**

- ❌ Invisible failures (circuit breaker opens, nobody knows)
- ❌ No data for debugging production issues
- ❌ No escalation path for incidents
- ❌ Potential data loss (in-memory metrics)

**Production Launch Readiness (With Phase 2):**

- ✅ Comprehensive monitoring and alerting
- ✅ Historical data for debugging
- ✅ Clear incident response procedures
- ✅ Persistent metrics in Axiom (7-day retention)

---

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Kingston Care Connect (Next.js App)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Performance  │  │  Circuit     │  │  Health      │ │
│  │  Tracker     │  │  Breaker     │  │  Check API   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │          │
│         └────────┬─────────┴──────────────────┘         │
│                  │ (Metrics)                             │
│                  ▼                                       │
│         ┌────────────────┐                               │
│         │ Axiom Client   │ ─────┐                       │
│         └────────────────┘      │                       │
└─────────────────────────────────┼───────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
         ┌──────────────────┐        ┌──────────────────┐
         │  Axiom.co        │        │  Slack Webhook   │
         │  (Metrics Store) │        │  (Alerts)        │
         └──────────────────┘        └──────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │  Observability   │ ◄─── Admin Dashboard
         │  Dashboard       │      (Real-time View)
         │  (/admin/obs)    │
         └──────────────────┘
```

### Data Flow

1. **Metric Collection (every 60s):**
   - Vercel Cron triggers `/api/cron/export-metrics`
   - Collects performance metrics from in-memory tracker
   - Batches events for Axiom ingestion
   - Non-blocking (app continues if Axiom fails)

2. **Event Streaming (real-time):**
   - Circuit breaker state changes → Axiom + Slack
   - API errors → Axiom
   - Health check results → Axiom

3. **Dashboard (on-demand):**
   - Admin navigates to `/admin/observability`
   - Server component fetches current stats
   - Client auto-refreshes every 60s
   - No external API calls (uses in-memory data + Axiom cache)

4. **Alerting (event-driven):**
   - Circuit breaker OPEN → Slack alert (throttled 10min)
   - High error rate → Slack alert (throttled 15min)
   - Alert throttling prevents spam

---

## Tooling Decisions

### Why Axiom?

**Alternatives Considered:**

- Datadog: $15/host/month (too expensive)
- New Relic: Complex setup, overkill for needs
- Sentry: Error-focused, not metrics-focused
- Self-hosted Prometheus: Operational burden

**Axiom Wins:**

- ✅ Free tier (500GB/month >> 5-10GB estimated)
- ✅ Vercel-native integration
- ✅ Structured logging (JSON events)
- ✅ Fast querying (sub-second)
- ✅ No operational overhead

---

### Why Slack?

**Alternatives Considered:**

- Email: Slow, gets lost in inbox
- PagerDuty: $24/user/month (overkill for solo/small team)
- SMS: Costs per message

**Slack Wins:**

- ✅ Free (incoming webhooks)
- ✅ Immediate notifications
- ✅ Team collaboration
- ✅ Searchable history

---

### Why Internal Dashboard?

**Alternatives Considered:**

- Axiom dashboard: External dependency, slower
- Grafana: Operational burden, overkill
- Third-party APM: Expensive, complex

**Internal Dashboard Wins:**

- ✅ No external dependency
- ✅ Fast (server component, <2s load)
- ✅ Customizable (exactly what we need)
- ✅ Admin-only access (existing auth)

---

## Implementation Phases

### Phase 2.1: Axiom Integration (4 hours)

**Goal:** Persistent metrics storage

**Deliverables:**

- Axiom SDK integrated
- Metrics batching (60s intervals)
- Circuit breaker event streaming
- Cron job for scheduled exports

**Success Criteria:**

- Metrics appear in Axiom within 2 minutes
- No application errors during ingestion
- Overhead <5ms per batch

---

### Phase 2.2: Observability Dashboard (4 hours)

**Goal:** Real-time visibility

**Deliverables:**

- Dashboard page at `/admin/observability`
- Circuit breaker status card
- Performance metrics charts
- Health summary
- Auto-refresh (60s)

**Success Criteria:**

- Dashboard loads in <2s
- Admin-only access enforced
- Auto-refresh works smoothly

---

### Phase 2.3: Alerting (2 hours)

**Goal:** Proactive notifications

**Deliverables:**

- Slack webhook integration
- Circuit breaker OPEN alert
- Alert throttling (10min intervals)

**Success Criteria:**

- Alerts received within 30 seconds
- Throttling prevents spam
- No false positives

---

### Phase 2.4: Runbooks (2 hours)

**Goal:** Documented incident procedures

**Deliverables:**

- Circuit breaker open runbook
- High error rate runbook
- Slow query performance runbook
- Runbook index

**Success Criteria:**

- Runbooks are actionable (step-by-step)
- Peer-reviewed for accuracy
- Linked from main docs

---

## Success Metrics

### Phase 2 Complete When:

**Infrastructure:**

- ✅ Axiom integration live in production
- ✅ Metrics batching every 60s
- ✅ Circuit breaker events streaming
- ✅ Dashboard functional at `/admin/observability`
- ✅ Slack alerts configured and tested
- ✅ 4 operational runbooks published

**Quality:**

- ✅ All 540+ tests passing
- ✅ Type-check passing (0 errors)
- ✅ Build successful
- ✅ Manual testing complete

**Documentation:**

- ✅ Axiom setup guide
- ✅ Dashboard usage guide
- ✅ Alerting configuration guide
- ✅ 4 operational runbooks
- ✅ CLAUDE.md updated

---

## Dependencies & User Actions

### Required Before Starting

**1. Create Axiom Account (5 minutes):**

- Visit https://axiom.co
- Sign up (free tier)
- Create dataset: `kingston-care-production`
- Generate API token
- Note organization ID

**2. Set Up Slack Webhook (5 minutes):**

- Visit https://slack.com/apps/A0F7XDUAZ-incoming-webhooks
- Create incoming webhook
- Select channel (e.g., `#kingston-care-alerts`)
- Copy webhook URL

**3. Generate Cron Secret (1 minute):**

```bash
openssl rand -base64 32
```

**4. Add Environment Variables:**

```bash
AXIOM_TOKEN=xait-...
AXIOM_ORG_ID=...
AXIOM_DATASET=kingston-care-production
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
CRON_SECRET=your-random-secret
```

**Total User Time:** ~15 minutes

---

## Timeline

### Optimistic (2 days)

- Day 1: Task 2.1 (Axiom Integration) - 4 hours
- Day 2: Tasks 2.2, 2.3, 2.4 in parallel - 4 hours

### Realistic (3 days)

- Day 1: Task 2.1 (Axiom Integration) - 4 hours
- Day 2: Task 2.2 (Dashboard) - 4 hours
- Day 3: Tasks 2.3 (Alerting) + 2.4 (Runbooks) - 4 hours

### Conservative (4 days)

- Day 1: Task 2.1 (Axiom Integration) - 4 hours
- Day 2: Task 2.2 (Dashboard) - 4 hours
- Day 3: Task 2.3 (Alerting) - 2 hours
- Day 4: Task 2.4 (Runbooks) + Testing - 2 hours

**Target:** 3 days (realistic)

---

## Risks & Mitigation

### Risk 1: Axiom Integration Failures

**Impact:** HIGH (blocks entire phase)
**Probability:** MEDIUM

**Mitigation:**

- Comprehensive error handling (non-throwing)
- Fallback to in-memory metrics
- Production guard (dev doesn't fail)

---

### Risk 2: Alert Spam

**Impact:** MEDIUM (alert fatigue)
**Probability:** MEDIUM

**Mitigation:**

- Alert throttling (10-15min intervals)
- Tested thresholds from baseline metrics
- Kill switch (remove webhook URL)

---

### Risk 3: Dashboard Performance

**Impact:** LOW (slow admin dashboard)
**Probability:** LOW

**Mitigation:**

- Server component (minimal client JS)
- Caching (60s stale OK)
- Pagination for large datasets

---

## Next Steps

### After Phase 2 Completion

**Immediate (Phase 3):**

- Define SLOs (uptime, latency, error rate)
- Build SLO monitoring dashboard
- Deploy public status page (Upptime)

**Future Enhancements:**

- Email alerts (via Resend)
- PagerDuty integration (on-call rotation)
- Advanced Axiom queries (anomaly detection)
- Automated load testing in CI

---

## Key Decisions

**Decision 1: Axiom over Self-Hosted Prometheus**

- Rationale: No operational burden, free tier sufficient
- Trade-off: External dependency vs. operational simplicity
- **Verdict:** Axiom (pragmatic for solo/small team)

**Decision 2: Slack over Email**

- Rationale: Immediate notifications, team collaboration
- Trade-off: Requires Slack workspace
- **Verdict:** Slack primary, email future enhancement

**Decision 3: Internal Dashboard over External**

- Rationale: Fast, customizable, no external dependency
- Trade-off: Build time vs. integration time
- **Verdict:** Internal (4 hours well spent)

**Decision 4: Cron over Real-Time Streaming**

- Rationale: Simpler, free on Vercel, 60s latency acceptable
- Trade-off: Real-time vs. simplicity
- **Verdict:** Cron (60s good enough for non-critical metrics)

---

## Questions & Answers

**Q: Why not use Vercel Analytics?**

- A: Vercel Analytics is frontend-focused (RUM). We need backend observability (circuit breaker, database health).

**Q: Why Axiom instead of Supabase logs?**

- A: Supabase logs are basic. Axiom provides structured logging, fast querying, and longer retention.

**Q: Can we skip the dashboard and just use Axiom?**

- A: Axiom dashboard is external (slower). Internal dashboard provides instant visibility without leaving the app.

**Q: What if we exceed Axiom free tier?**

- A: Estimated usage is 5-10GB/month << 500GB free tier. Alert at 80% (400GB). Upgrade to paid tier if needed.

**Q: Can Phase 2 be done before Phase 1?**

- A: No. Phase 2 depends on circuit breaker infrastructure from Phase 1.

---

## Conclusion

**Phase 2 transforms Kingston Care Connect from resilient but blind to resilient and observable.**

**Before Phase 2:**

- Platform is resilient (circuit breaker, graceful degradation) ✅
- Production health unknown ❌
- Incidents discovered reactively (user reports) ❌
- No historical data for debugging ❌

**After Phase 2:**

- Platform is resilient ✅
- Production health visible in real-time ✅
- Incidents detected proactively (automated alerts) ✅
- Historical data in Axiom (7-day retention) ✅

**Impact:** Reduce MTTD from hours to seconds, MTTR from hours to minutes, enable confident production launch.

---

**Date:** 2026-01-30
**Status:** READY FOR IMPLEMENTATION
**Estimated Completion:** 2026-02-12 (3 days of focused development)
