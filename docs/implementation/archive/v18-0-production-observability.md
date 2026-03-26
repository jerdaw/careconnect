# v18.0: Production Observability & Operational Excellence

**Version:** 18.0
**Date:** 2026-01-30
**Status:** PLANNING
**Dependencies:** v17.6 (Authorization Resilience Complete)
**Estimated Effort:** 24-32 hours (4-5 days)

---

## Executive Summary

### Current State (v17.6)

HelpBridge is production-ready with comprehensive resilience, security, and testing infrastructure:

✅ **Core Platform**:

- 196 curated social services (validated via `npm run audit:data`)
- Zero-knowledge hybrid search (local + server modes)
- WCAG 2.1 AA accessibility compliance
- 7-language internationalization (EN, FR, ZH-Hans, AR, PT, ES, PA)
- Offline-ready PWA with IndexedDB fallback

✅ **Resilience & Performance**:

- Circuit breaker pattern protecting database operations
- Performance tracking system (p50/p95/p99 metrics)
- k6 load testing infrastructure
- Tiered authorization with fail-safe strategy (ADR-017)
- Health check endpoint (`/api/v1/health`)

✅ **Security & Authorization**:

- Role-Based Access Control (Owner, Admin, Editor, Viewer)
- Row-Level Security policies
- Multi-layered authorization (UI → Server → Database)
- XSS prevention, CSP headers, rate limiting

✅ **Testing**:

- 100 test files, 537 passing tests (95%+ coverage on critical paths)
- Unit, integration, E2E (Playwright), load (k6), accessibility (Axe)
- CI/CD with automated validation

### Key Unknowns & Assumptions

**Unknowns**:

1. Production traffic patterns (no real-world baseline yet)
2. Database failure frequency in production (Supabase SLA: 99.9%)
3. Geographic distribution of users (impacts CDN strategy)
4. Partner organization adoption rate (dashboard usage patterns unknown)

**Assumptions**:

1. User expects production deployment within 1-2 months
2. Budget constraints favor open-source/free-tier solutions initially
3. Vercel remains the deployment platform (impacts observability choices)
4. Manual data curation continues (no automated scraping planned)

**Partially Complete Work from v17.5/v17.6**:

- ⚠️ Circuit breaker integration tests (3 failing, timeout issues)
- ⚠️ API routes lack circuit breaker protection (only 40% coverage)
- ⚠️ Metrics endpoint exists but lacks authentication
- ⚠️ No production monitoring/alerting infrastructure
- ⚠️ Performance baseline metrics not documented

### Goal

Complete the operational excellence foundation by:

1. **Finishing v17.5+ rollout** (circuit breaker coverage, integration tests, baseline metrics)
2. **Adding production-grade observability** (monitoring, alerting, dashboards)
3. **Establishing SLOs/SLAs** (define success criteria for production)
4. **Creating operational runbooks** (incident response, troubleshooting guides)

This prepares the platform for production launch with confidence that issues can be detected, diagnosed, and resolved quickly.

---

## Phased Implementation Plan

### Phase 1: Complete Circuit Breaker Rollout (8-10 hours)

**Goal:** Achieve 100% circuit breaker coverage on all database operations and validate resilience via integration tests.

**Priority:** HIGH
**Risk:** MEDIUM (touches critical paths, but infrastructure exists)

#### 1.1 Protect Remaining API Routes (3 hours)

**Current State:**
Only search data loading, service management, and analytics have circuit breaker protection (~40% of DB operations).

**Remaining Routes to Protect:**

- `/api/v1/notifications/subscribe` - POST
- `/api/v1/notifications/unsubscribe` - POST
- `/api/v1/analytics/search` - POST
- `/api/v1/feedback` - POST, GET
- `/api/v1/feedback/[id]` - PATCH, DELETE
- `/api/v1/services/[id]/update-request` - POST
- `/api/v1/services/[id]` - PATCH, DELETE
- `/api/v1/services` - POST

**Implementation Pattern:**

```typescript
// Before
const { data, error } = await supabase.from("table").select("*")

// After
const { data, error } = await withCircuitBreaker(
  async () => supabase.from("table").select("*"),
  async () => null // Fallback for non-critical reads (or omit for writes)
)
```

**Deliverables:**

- [ ] 8 API routes protected with circuit breaker
- [ ] Fallback strategies documented per route (fail-closed vs fail-open)
- [ ] Unit tests for each protected route (mock circuit open state)

**Validation:**

- Type-check passes: `npm run type-check`
- Build succeeds: `npm run build`
- Route tests pass: `npm test -- app/api`

---

#### 1.2 Fix Circuit Breaker Integration Tests (4 hours)

**Current State:**
3 integration tests failing due to timeout/state transition issues:

- `should log all state transitions` - CircuitOpenError not caught properly
- Likely timing-dependent tests with 30s timeouts

**Root Cause Analysis:**

- Tests likely depend on precise timing (30s circuit timeout)
- Mock database simulator may not properly trigger state transitions
- Insufficient wait time for HALF_OPEN → CLOSED transitions

**Refactoring Approach:**

1. **Reduce timeout in test environment** (5s instead of 30s via env var)
2. **Use fake timers** (Vitest `vi.useFakeTimers()`) to control time progression
3. **Improve database simulator** to track call counts and simulate recovery
4. **Add explicit state assertions** after each transition

**Implementation:**

```typescript
// tests/integration/circuit-breaker-db.test.ts

import { vi } from "vitest"

describe("Circuit Breaker Integration", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    process.env.CIRCUIT_BREAKER_TIMEOUT = "5000" // 5s for tests
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should transition CLOSED → OPEN → HALF_OPEN → CLOSED", async () => {
    const breaker = getSupabaseBreaker()

    // 1. Start in CLOSED state
    expect(breaker.getState()).toBe("CLOSED")

    // 2. Trigger 3 failures to open circuit
    dbSimulator.simulateFailure(3)
    await expect(() => searchServices("test")).rejects.toThrow()
    await expect(() => searchServices("test")).rejects.toThrow()
    await expect(() => searchServices("test")).rejects.toThrow()

    // Circuit should be OPEN
    expect(breaker.getState()).toBe("OPEN")

    // 3. Fast-forward past timeout (5s)
    vi.advanceTimersByTime(5001)

    // State should transition to HALF_OPEN (next request will test recovery)
    const result = await searchServices("test") // Should attempt recovery

    // If DB is restored, should be CLOSED
    dbSimulator.restore()
    await searchServices("test")
    expect(breaker.getState()).toBe("CLOSED")
  })
})
```

**Deliverables:**

- [ ] All 9 integration tests passing
- [ ] Test duration reduced from 60s to <10s via fake timers
- [ ] Test flakiness eliminated (run 10x without failure)
- [ ] CI integration confirmed (non-blocking per ADR-015)

**Validation:**

- Integration tests pass: `npm test -- tests/integration/circuit-breaker-db.test.ts`
- No test flakiness: `for i in {1..10}; do npm test -- tests/integration/circuit-breaker-db.test.ts || break; done`

---

#### 1.3 Document Performance Baselines (2 hours)

**Current State:**
Load testing infrastructure exists (k6 scripts) but no baseline metrics documented.

**Objective:**
Establish quantitative baseline for future regression detection.

**Tasks:**

1. **Run all k6 load tests locally**

   ```bash
   npm run test:load:smoke       # 1 VU, 30s
   npm run test:load             # 10-50 VUs, ramp-up
   npm run test:load:sustained   # 20 VUs, 30min
   npm run test:load:spike       # 0-100 VUs spike
   ```

2. **Capture metrics:**
   - Request throughput (req/s)
   - Response times (p50, p95, p99)
   - Error rate (%)
   - Circuit breaker activations
   - Memory usage stability

3. **Document in standardized format:**
   - Test environment specs (CPU, RAM, network, DB tier)
   - Date/time of baseline
   - Expected vs actual results
   - Regression thresholds (e.g., p95 > +20% = regression)

**Deliverable:**

- [ ] `docs/testing/performance-baselines.md` created
- [ ] All 4 load tests executed and documented
- [ ] Regression thresholds defined
- [ ] Next review date set (3 months)

**Format:**

```markdown
# Performance Baseline Metrics

## Environment

- Date: 2026-01-30
- Version: v18.0
- Hardware: [Record actual specs]
- Database: Supabase Free Tier, US-East-1

## Smoke Test (Basic Connectivity)

- Duration: 30s
- VUs: 1
- Results:
  - Throughput: 5 req/s
  - p95 latency: 150ms
  - p99 latency: 200ms
  - Error rate: 0%

## Search API Load Test (Realistic Traffic)

- Duration: 5min
- VUs: 10-50 (ramp-up)
- Results:
  - Throughput: 45 req/s (sustained)
  - p95 latency: 380ms
  - p99 latency: 850ms
  - Error rate: 2%

## Thresholds for Regression Alerts

- p95 latency increase: >20% = WARNING, >50% = CRITICAL
- Error rate increase: >2% absolute = WARNING
- Circuit breaker false-opens: >0 = CRITICAL
```

**Validation:**

- All metrics captured with timestamps
- Regression thresholds match project SLOs (defined in Phase 4)

---

#### 1.4 Secure Metrics Endpoint (1 hour)

**Current State:**
`/api/v1/metrics` exists but lacks authentication (security risk in production).

**Security Requirements:**

- **Development/Staging:** Require authentication OR whitelist localhost
- **Production:** Require admin authentication + rate limiting

**Implementation:**

```typescript
// app/api/v1/metrics/route.ts

import { createClient } from "@/lib/supabase"
import { assertAdminRole } from "@/lib/auth/authorization"

export async function GET(request: NextRequest) {
  // Security check
  const isDev = process.env.NODE_ENV === "development"
  const isLocalhost = request.headers.get("host")?.startsWith("localhost")

  if (!isDev && !isLocalhost) {
    // Production/staging: require admin auth
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (!user || error) {
      return new Response("Unauthorized", { status: 401 })
    }

    await assertAdminRole(supabase, user.id)
  }

  // Return metrics...
}
```

**Deliverables:**

- [ ] Authentication enforced on `/api/v1/metrics`
- [ ] Rate limiting added (30 req/min per IP)
- [ ] Admin-only access in production
- [ ] Documentation updated in CLAUDE.md

**Validation:**

- Unauthenticated request returns 401: `curl http://localhost:3000/api/v1/metrics`
- Authenticated request succeeds with valid admin token
- Rate limit enforced: `for i in {1..35}; do curl http://localhost:3000/api/v1/metrics; done`

---

### Phase 2: Production Monitoring Infrastructure (10-12 hours)

**Goal:** Establish automated monitoring and alerting for production health.

**Priority:** HIGH
**Risk:** LOW (net-new features, no existing code changes)

#### 2.1 Integrate with External APM (Axiom) (4 hours)

**Rationale:**
In-memory performance tracking is development-only. Production needs persistent, queryable metrics.

**Tool Selection: Axiom**

- **Pros:** Free tier (500GB/month), Vercel integration, structured logging, fast querying
- **Cons:** Third-party dependency, requires API key management
- **Alternatives Considered:** Datadog (too expensive), New Relic (complex setup), Sentry (focused on errors, not metrics)

**Implementation:**

```typescript
// lib/observability/axiom.ts

import { Axiom } from "@axiomhq/js"

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN!,
  orgId: process.env.AXIOM_ORG_ID!,
})

export async function sendMetrics(dataset: string, events: any[]) {
  if (process.env.NODE_ENV !== "production") return // Only in production

  try {
    await axiom.ingest(dataset, events)
  } catch (error) {
    logger.error("Axiom ingestion failed", { error })
    // Don't throw - metrics are non-critical
  }
}

// Hook into existing performance tracker
export function configureProductionMetrics() {
  if (process.env.NODE_ENV === "production") {
    // Send metrics to Axiom every 60s
    setInterval(async () => {
      const metrics = getAllMetrics() // From lib/performance/metrics.ts
      await sendMetrics("performance", metrics)
    }, 60000)
  }
}
```

**Integration Points:**

1. Performance tracker → Axiom (every 60s batch)
2. Circuit breaker events → Axiom (real-time)
3. API errors → Axiom (real-time)
4. Health check results → Axiom (every 5min)

**Deliverables:**

- [ ] Axiom SDK integrated (`@axiomhq/js`)
- [ ] Environment variables added (`AXIOM_TOKEN`, `AXIOM_ORG_ID`, `AXIOM_DATASET`)
- [ ] Metrics batching implemented (60s intervals)
- [ ] Circuit breaker events sent to Axiom
- [ ] Documentation: `docs/observability/axiom-setup.md`

**Validation:**

- Metrics appear in Axiom dashboard within 2min of sending
- No errors in application logs during metric ingestion
- Batch size reasonable (<10KB per batch)

---

#### 2.2 Create Observability Dashboard (4 hours)

**Objective:**
Visualize real-time system health without leaving the application.

**Approach:**
Build internal dashboard at `/admin/observability` using existing metrics + Axiom data.

**Features:**

1. **Circuit Breaker Status**
   - Current state (CLOSED/OPEN/HALF_OPEN)
   - Failure count, success count, failure rate
   - Time in current state
   - Historical state transitions (last 24h)

2. **Performance Metrics**
   - Search latency (p50, p95, p99) - last 1h, 24h, 7d
   - API response times by endpoint
   - Database query latency
   - Error rate trends

3. **System Health**
   - Database connectivity status
   - Uptime percentage (last 7d, 30d)
   - Active sessions (if trackable)
   - Cache hit rates (IndexedDB, service worker)

4. **Recent Incidents**
   - Circuit breaker opens (last 24h)
   - High error rate periods
   - Slow query alerts

**Tech Stack:**

- Recharts (already in use for analytics)
- Radix UI components (tables, cards, badges)
- Server component with periodic refresh (60s)

**Implementation:**

```typescript
// app/[locale]/admin/observability/page.tsx

import { getCircuitBreakerStats } from '@/lib/resilience/supabase-breaker'
import { getMetricsSummary } from '@/lib/performance/metrics'
import { queryAxiomMetrics } from '@/lib/observability/axiom'

export default async function ObservabilityPage() {
  const cbStats = getCircuitBreakerStats()
  const perfMetrics = getMetricsSummary()
  const recentIncidents = await queryAxiomMetrics('incidents', '24h')

  return (
    <div className="space-y-6">
      <CircuitBreakerCard stats={cbStats} />
      <PerformanceCharts metrics={perfMetrics} />
      <IncidentTimeline incidents={recentIncidents} />
    </div>
  )
}
```

**Deliverables:**

- [ ] Dashboard page created at `/admin/observability`
- [ ] Circuit breaker status card
- [ ] Performance charts (p50/p95/p99 over time)
- [ ] Recent incidents timeline
- [ ] Auto-refresh every 60s
- [ ] Admin-only access enforced

**Validation:**

- Dashboard loads in <2s
- Metrics update automatically every 60s
- Charts render correctly with real data
- Non-admin users get 403 Forbidden

---

#### 2.3 Configure Alerting (2 hours)

**Objective:**
Proactively notify on critical issues (circuit open, high error rate, slow queries).

**Alert Channels:**

1. **Email** (using Supabase Auth + Resend)
2. **Slack** (webhook for team notifications)
3. **Dashboard Banners** (in-app alerts for admins)

**Alert Rules:**
| Alert Type | Condition | Severity | Channel | Throttle |
|------------|-----------|----------|---------|----------|
| Circuit Breaker Open | State = OPEN | CRITICAL | Email + Slack | Immediate |
| High Error Rate | Error rate >5% (5min window) | WARNING | Slack | 10min |
| Slow Queries | p95 latency >2000ms (5min window) | WARNING | Slack | 15min |
| Database Down | Health check fails 3x | CRITICAL | Email + Slack | Immediate |
| Low Uptime | Uptime <99% (24h rolling) | WARNING | Email | Daily digest |

**Implementation:**

```typescript
// lib/observability/alerts.ts

import { sendEmail } from "@/lib/email"
import { sendSlackNotification } from "@/lib/integrations/slack"

interface Alert {
  type: "circuit_open" | "high_error_rate" | "slow_queries" | "database_down"
  severity: "CRITICAL" | "WARNING"
  message: string
  metadata: Record<string, any>
}

export async function sendAlert(alert: Alert) {
  const timestamp = new Date().toISOString()

  // Log alert
  logger.warn(`ALERT: ${alert.type}`, { alert, timestamp })

  // Send to appropriate channels
  if (alert.severity === "CRITICAL") {
    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: `🚨 CRITICAL: ${alert.message}`,
      body: JSON.stringify(alert, null, 2),
    })
  }

  await sendSlackNotification({
    channel: "#kingston-care-alerts",
    text: `${alert.severity === "CRITICAL" ? "🚨" : "⚠️"} ${alert.message}`,
    metadata: alert.metadata,
  })
}

// Alert throttling to prevent spam
const alertThrottle = new Map<string, number>()

export function shouldSendAlert(alertKey: string, throttleMs: number): boolean {
  const lastSent = alertThrottle.get(alertKey)
  const now = Date.now()

  if (!lastSent || now - lastSent > throttleMs) {
    alertThrottle.set(alertKey, now)
    return true
  }

  return false
}
```

**Integration:**

- Circuit breaker telemetry calls `sendAlert()` on state transitions
- Health check endpoint triggers alerts on failures
- Scheduled job (Vercel Cron) runs periodic checks

**Deliverables:**

- [ ] Alert system implemented with throttling
- [ ] Slack webhook integration
- [ ] Email alerts via Resend
- [ ] Alert configuration documented
- [ ] Test alerts sent successfully

**Validation:**

- Simulate circuit open → receive email + Slack notification within 30s
- Verify throttling prevents alert spam (max 1 per 10min for warnings)
- Check alert metadata includes useful debugging info

---

#### 2.4 Create Operational Runbooks (2 hours)

**Objective:**
Document step-by-step incident response procedures for common failure scenarios.

**Runbooks to Create:**

**1. Circuit Breaker Open**

```markdown
# Runbook: Circuit Breaker Open

## Symptoms

- `/api/v1/health` returns `503 Service Unavailable`
- Circuit breaker state = OPEN
- Users see "Service temporarily unavailable" errors
- Alert: "Circuit breaker 'supabase' is OPEN"

## Diagnosis

1. Check circuit breaker stats: `GET /api/v1/health`
2. Check Supabase status: https://status.supabase.com
3. Review recent logs for database errors
4. Check database performance in Supabase dashboard

## Resolution Steps

1. **If Supabase is down:**
   - Wait for Supabase to recover (automatic)
   - Circuit will auto-transition to HALF_OPEN after 30s
   - Monitor recovery via health check

2. **If Supabase is up but circuit is open:**
   - Possible database overload or query timeout
   - Review slow query logs in Supabase
   - Consider optimizing problematic queries
   - Manually reset circuit (not recommended): restart application

3. **If circuit repeatedly opens:**
   - Increase circuit breaker timeout (env var)
   - Investigate root cause (query performance, indexes)
   - Consider scaling database tier

## Prevention

- Monitor database performance metrics weekly
- Optimize slow queries identified in Supabase dashboard
- Ensure database indexes are up-to-date (run `npm run db:verify`)

## Escalation

- If circuit remains open >5min, escalate to senior engineer
- If data loss suspected, engage database team immediately
```

**2. High Error Rate**
**3. Slow Query Performance**
**4. Database Migration Failures**

**Deliverables:**

- [ ] `docs/runbooks/circuit-breaker-open.md`
- [ ] `docs/runbooks/high-error-rate.md`
- [ ] `docs/runbooks/slow-queries.md`
- [ ] `docs/runbooks/database-migration.md`
- [ ] Runbook index added to `docs/README.md`

**Validation:**

- Runbooks follow consistent template
- Include realistic scenarios based on actual failure modes
- Reviewed by at least one other engineer

---

### Phase 3: Service Level Objectives (4-6 hours)

**Goal:** Define measurable success criteria for production reliability.

**Priority:** MEDIUM
**Risk:** LOW (documentation-only, no code changes)

#### 3.1 Define SLOs (2 hours)

**Service Level Objectives (SLOs):**

**Availability SLO:**

- **Target:** 99.5% uptime (monthly)
- **Measurement:** Health check endpoint availability
- **Error Budget:** 216 minutes/month (30 days × 0.5%)
- **Exclusions:** Scheduled maintenance (announced 24h in advance)

**Latency SLO:**

- **Target:** p95 search latency <800ms
- **Measurement:** `/api/v1/search/services` response time
- **Degraded State:** p95 >800ms but <2000ms
- **Outage:** p95 >2000ms

**Error Rate SLO:**

- **Target:** <5% error rate (5xx responses)
- **Measurement:** HTTP status codes from all API routes
- **Warning Threshold:** 5-10% error rate
- **Critical Threshold:** >10% error rate

**Data Freshness SLO:**

- **Target:** Search results reflect database updates within 5 minutes
- **Measurement:** Time between service update and appearance in search
- **Exclusions:** JSON fallback mode (stale by design during outages)

**Deliverable:**

- [ ] `docs/observability/slo-definition.md` created
- [ ] SLO targets aligned with user expectations
- [ ] Measurement methodology documented
- [ ] Error budget tracking plan defined

---

#### 3.2 SLO Monitoring Dashboard (2 hours)

**Objective:**
Visualize SLO compliance in real-time.

**Dashboard Components:**

1. **Uptime SLO:** Current month uptime percentage, error budget remaining
2. **Latency SLO:** p95 latency trend (last 7d), threshold line at 800ms
3. **Error Rate SLO:** Error percentage (last 24h), threshold line at 5%
4. **Incidents:** Count of SLO violations this month

**Implementation:**

- Add SLO tab to `/admin/observability`
- Query Axiom for historical SLO data
- Calculate error budget burn rate
- Alert when error budget <20% remaining

**Deliverable:**

- [ ] SLO dashboard tab added to observability page
- [ ] Error budget burn rate calculator
- [ ] Historical SLO compliance (last 3 months)

**Validation:**

- Dashboard accurately reflects health check data
- Error budget calculation matches manual computation
- Alerts trigger at 20% error budget remaining

---

#### 3.3 Public Status Page (2 hours)

**Objective:**
Transparent communication of system status to users and partners.

**Approach:**
Use **Statuspage.io** (free tier) or self-hosted **Upptime** (GitHub Actions).

**Recommendation: Upptime**

- **Pros:** Free, open-source, GitHub-hosted, no third-party dependency
- **Cons:** Requires GitHub Actions (free for public repos)
- **Setup:** 30 minutes

**Status Page Components:**

1. **Current Status:** Operational / Degraded / Outage
2. **System Components:**
   - Search API
   - Partner Dashboard
   - Database
   - AI Features
3. **Uptime Percentage:** Last 30d, 90d
4. **Recent Incidents:** Last 10 incidents with timestamps and resolutions
5. **Scheduled Maintenance:** Upcoming maintenance windows

**Implementation:**

```yaml
# .upptimerc.yml

owner: helpbridge-ca
repo: upptime
sites:
  - name: HelpBridge
    url: https://helpbridge.ca
  - name: Search API
    url: https://helpbridge.ca/api/v1/health
    expectedStatusCodes:
      - 200
  - name: Partner Dashboard
    url: https://helpbridge.ca/dashboard

status-website:
  cname: status.helpbridge.ca
  name: HelpBridge Status
  theme: night
```

**Deliverable:**

- [ ] Upptime configured in separate GitHub repo
- [ ] Status page deployed at `status.helpbridge.ca` (or subdomain)
- [ ] Automated incident detection via health check
- [ ] Status badge added to main README.md

**Validation:**

- Status page loads in <2s
- Component statuses update every 5min
- Incident timeline shows historical data
- Downtime detection works (test by failing health check)

---

### Phase 4: Operational Documentation (2-4 hours)

**Goal:** Comprehensive documentation for production operations and incident management.

**Priority:** LOW
**Risk:** NONE (documentation-only)

#### 4.1 Update CLAUDE.md (1 hour)

**Additions:**

- Observability & Monitoring section
  - Axiom integration
  - Dashboard usage
  - Alert configuration
  - SLO definitions
- Circuit breaker best practices
  - When to adjust thresholds
  - Interpreting circuit states
  - Debugging circuit opens
- Load testing guidelines
  - Running baselines
  - Interpreting results
  - Regression detection

**Deliverable:**

- [ ] CLAUDE.md updated with new observability sections
- [ ] Links to runbooks and SLO docs

---

#### 4.2 Production Deployment Checklist (1 hour)

**File:** `docs/deployment/production-checklist.md`

**Checklist Items:**

- [ ] Environment variables configured in Vercel
- [ ] Supabase production database provisioned
- [ ] Axiom account set up and API token added
- [ ] Slack webhook configured for alerts
- [ ] Admin email set for critical alerts
- [ ] Status page deployed and linked
- [ ] DNS configured (status.helpbridge.ca)
- [ ] SSL certificates valid
- [ ] Database backups enabled (Supabase automatic)
- [ ] Rate limiting tested in production
- [ ] Circuit breaker thresholds validated
- [ ] Load test baseline documented
- [ ] SLOs published on status page
- [ ] Runbooks reviewed by team
- [ ] Incident response roles assigned

**Deliverable:**

- [ ] Production deployment checklist created
- [ ] All items reviewed and validated before launch

---

#### 4.3 Incident Response Plan (2 hours)

**File:** `docs/observability/incident-response-plan.md`

**Sections:**

1. **Incident Severity Levels:**
   - **SEV1 (Critical):** Complete outage, data loss risk, security breach
   - **SEV2 (High):** Degraded performance, partial outage, circuit open >5min
   - **SEV3 (Medium):** Minor performance degradation, non-critical errors
   - **SEV4 (Low):** Cosmetic issues, logging errors

2. **Incident Response Roles:**
   - **Incident Commander:** Coordinates response, makes decisions
   - **Communications Lead:** Updates status page, notifies stakeholders
   - **Technical Lead:** Investigates and implements fixes
   - **Scribe:** Documents timeline and actions taken

3. **Response Timeline:**
   - **0-5min:** Acknowledge alert, assess severity, assign roles
   - **5-15min:** Initial investigation, update status page
   - **15-30min:** Implement mitigation, test fix
   - **30-60min:** Deploy fix, verify resolution
   - **Post-incident:** Write postmortem within 24h

4. **Communication Templates:**
   - Initial incident notification
   - Progress update (every 30min)
   - Resolution announcement
   - Postmortem summary

**Deliverable:**

- [ ] Incident response plan documented
- [ ] Response roles assigned
- [ ] Communication templates created
- [ ] Postmortem template included

**Validation:**

- Plan reviewed by all stakeholders
- Dry-run incident simulation conducted

---

## Success Criteria

### Phase 1: Circuit Breaker Rollout

- ✅ 100% of API routes protected with circuit breaker
- ✅ All 9 integration tests passing (no flakiness)
- ✅ Performance baselines documented
- ✅ Metrics endpoint secured with authentication
- ✅ No production regressions introduced

### Phase 2: Monitoring Infrastructure

- ✅ Axiom integration live in production
- ✅ Observability dashboard functional
- ✅ Alerts firing correctly (tested via simulation)
- ✅ 4 operational runbooks published
- ✅ Team trained on alert response

### Phase 3: SLOs

- ✅ SLOs defined and approved by stakeholders
- ✅ SLO monitoring dashboard live
- ✅ Public status page deployed
- ✅ Error budget tracking active
- ✅ SLO compliance >90% in first month

### Phase 4: Documentation

- ✅ CLAUDE.md updated with observability sections
- ✅ Production deployment checklist complete
- ✅ Incident response plan approved
- ✅ All documentation reviewed and validated

---

## Timeline & Milestones

### Week 1 (Jan 30 - Feb 5)

**Focus:** Complete Phase 1 (Circuit Breaker Rollout)

- **Day 1-2:** Protect remaining API routes (1.1)
- **Day 3-4:** Fix integration tests (1.2)
- **Day 5:** Document performance baselines (1.3), secure metrics endpoint (1.4)

**Milestone:** Circuit breaker coverage 100%, all tests passing

---

### Week 2 (Feb 6 - Feb 12)

**Focus:** Phase 2 (Monitoring Infrastructure)

- **Day 1-2:** Axiom integration (2.1)
- **Day 3-4:** Observability dashboard (2.2)
- **Day 5:** Alerting configuration (2.3), operational runbooks (2.4)

**Milestone:** Production monitoring live, alerts functional

---

### Week 3 (Feb 13 - Feb 19)

**Focus:** Phase 3 (SLOs) + Phase 4 (Documentation)

- **Day 1:** Define SLOs (3.1)
- **Day 2:** SLO monitoring dashboard (3.2)
- **Day 3:** Public status page (3.3)
- **Day 4-5:** Update CLAUDE.md (4.1), deployment checklist (4.2), incident plan (4.3)

**Milestone:** SLOs published, documentation complete

---

### Week 4 (Feb 20 - Feb 26)

**Focus:** Validation, Testing, Production Readiness

- **Day 1-2:** End-to-end validation of all phases
- **Day 3:** Load testing with production config
- **Day 4:** Dry-run incident simulation
- **Day 5:** Final review and sign-off

**Milestone:** v18.0 production-ready, launch approved

---

## Dependencies & Blockers

### Required (Must Have)

- ✅ v17.6 complete (authorization resilience)
- ✅ Vercel account with production deployment
- ⚠️ Axiom account (free tier) - **User action required**
- ⚠️ Slack workspace with webhook - **User action required**
- ⚠️ Domain for status page (status.helpbridge.ca) - **User action required**

### Optional (Nice to Have)

- ⏳ Supabase production tier (more generous limits, better performance)
- ⏳ Dedicated Sentry account (error tracking, distinct from Axiom)
- ⏳ PagerDuty integration (advanced on-call rotation)

### Known Blockers

- **None identified** - All infrastructure is free-tier compatible
- Slack webhook is free (no paid account required)
- Axiom free tier is sufficient (500GB/month >> estimated 10GB/month)

---

## Rollout & Rollback Strategy

### Rollout Plan

**Phase 1: Canary Release (10% of traffic)**

1. Deploy v18.0 to staging environment
2. Run full test suite including load tests
3. Validate circuit breaker protection on all routes
4. Deploy to production with feature flags (observability disabled)
5. Monitor for 24h with existing health checks

**Phase 2: Enable Monitoring (50% of traffic)**

1. Enable Axiom integration (server-side only)
2. Monitor metric ingestion for 48h
3. Verify no performance degradation (<5ms overhead)
4. Enable observability dashboard for admins only

**Phase 3: Full Rollout (100% of traffic)**

1. Enable alerting (email + Slack)
2. Publish status page publicly
3. Monitor SLO compliance for 7d
4. Announce production readiness

### Rollback Strategy

**Trigger Conditions:**

- Performance regression >20% (p95 latency)
- New errors introduced (>2% error rate increase)
- Circuit breaker false-opens (>3 in 24h)
- Axiom integration causes application crashes

**Rollback Steps:**

1. **Immediate:** Revert deployment via Vercel (1-click rollback)
2. **Within 5min:** Disable Axiom integration (env var toggle)
3. **Within 10min:** Notify stakeholders via status page
4. **Within 1h:** Identify root cause, create hotfix
5. **Within 24h:** Publish postmortem, plan re-deployment

**Rollback Testing:**

- Test rollback procedure in staging before production
- Ensure previous version (v17.6) remains deployable
- Verify data migrations are backward-compatible

---

## Risk Assessment

### Low Risk

- **Operational runbooks:** Documentation-only, no code impact
- **SLO definitions:** Measurement framework, doesn't change behavior
- **Status page:** Separate deployment, no production dependencies

### Medium Risk

- **Axiom integration:** Third-party dependency, potential ingestion failures
  - **Mitigation:** Fail-safe (log error, don't throw), test in staging
- **Circuit breaker coverage:** Touching critical API routes
  - **Mitigation:** Comprehensive tests, gradual rollout, feature flags
- **Alerting configuration:** Risk of alert fatigue or missed critical alerts
  - **Mitigation:** Throttling, severity levels, dry-run testing

### High Risk

- **Integration test refactoring:** Timing-dependent tests can be flaky
  - **Mitigation:** Use fake timers, reduce timeout, 10x run validation
- **Performance overhead:** New monitoring could slow down requests
  - **Mitigation:** Async ingestion, batching, <5ms overhead target

### Critical Dependencies

- **Axiom uptime:** If Axiom is down, metrics are lost (but app unaffected)
  - **Mitigation:** Axiom has 99.9% SLA, non-critical path
- **Slack webhook:** Alert delivery depends on Slack availability
  - **Mitigation:** Dual-channel alerts (email + Slack), log all alerts

---

## Future Enhancements (Post-v18.0)

### v18.1: Advanced Observability

- Custom Grafana dashboards (if Axiom query limits exceeded)
- Distributed tracing with OpenTelemetry
- User session replay for debugging (LogRocket, FullStory)
- Client-side error tracking (Sentry browser SDK)

### v18.2: Intelligent Alerting

- Anomaly detection using ML (Axiom AI features)
- Predictive alerts (circuit will open in 5min based on trends)
- Alert aggregation (summarize 10 similar alerts into 1)
- On-call rotation via PagerDuty

### v18.3: Performance Optimization

- CDN integration for static assets (Vercel Edge)
- Database query caching (Redis)
- Incremental static regeneration for service pages
- Edge Functions for geo-distributed search

### v19.0: Multi-Region Deployment

- Supabase read replicas in multiple regions
- Geo-routing based on user location
- Cross-region circuit breaker coordination
- Global load balancing

---

## Validation & Testing Strategy

### Pre-Production Testing

**1. Staging Environment Validation:**

- [ ] Deploy v18.0 to staging (`staging.helpbridge.ca`)
- [ ] Run full test suite: `npm test && npm run test:e2e && npm run test:a11y`
- [ ] Execute load tests: `npm run test:load:sustained` (30min)
- [ ] Verify circuit breaker triggers correctly (simulate DB failure)
- [ ] Test alert delivery (Slack + email)
- [ ] Validate Axiom metric ingestion (check dashboard)

**2. Regression Testing:**

- [ ] Compare load test results to v17.6 baselines
- [ ] Ensure p95 latency increase <5%
- [ ] Verify error rate unchanged
- [ ] Check bundle size increase <50KB

**3. Security Testing:**

- [ ] Verify metrics endpoint requires authentication
- [ ] Test rate limiting on observability endpoints
- [ ] Check CORS policies on new routes
- [ ] Scan for secret leakage in logs

**4. Accessibility Testing:**

- [ ] Run Axe audit on observability dashboard
- [ ] Verify keyboard navigation works
- [ ] Test screen reader compatibility
- [ ] Check color contrast ratios

### Post-Production Validation

**First 24 Hours:**

- [ ] Monitor circuit breaker state (should remain CLOSED)
- [ ] Check Axiom ingestion (metrics appearing every 60s)
- [ ] Verify alerts don't fire spuriously
- [ ] Monitor error logs for new issues

**First 7 Days:**

- [ ] Validate SLO compliance (uptime >99.5%, p95 <800ms)
- [ ] Review incident count (should be 0 for SEV1/SEV2)
- [ ] Analyze error budget burn rate
- [ ] Collect user feedback on any performance changes

**First 30 Days:**

- [ ] Publish first monthly SLO report
- [ ] Conduct retrospective on v18.0 rollout
- [ ] Identify areas for optimization
- [ ] Plan v18.1 enhancements based on production data

---

## Stakeholder Communication

### Weekly Progress Updates

**Format:** Slack message + email summary

**Template:**

```
📊 v18.0 Progress Update - Week [N]

Completed This Week:
- ✅ [Phase/Task completed]
- ✅ [Phase/Task completed]

In Progress:
- 🔄 [Current work]
- 🔄 [Current work]

Blockers:
- ⚠️ [Blocker description] - ETA: [date]

Next Week:
- 📅 [Planned work]
- 📅 [Planned work]

Overall Progress: [X]% complete
On Track for Launch: [Yes/No/At Risk]
```

### Launch Announcement

**Channels:**

- Status page announcement
- Email to partner organizations
- Social media (if applicable)
- Internal team Slack

**Key Messages:**

- New observability features improve reliability
- Transparent uptime tracking via status page
- Faster incident resolution with automated monitoring
- No user-facing changes (backend enhancements)

---

## References & Resources

### Related ADRs

- [ADR-016: Performance Tracking and Circuit Breaker](../adr/016-performance-tracking-and-circuit-breaker.md)
- [ADR-017: Authorization Resilience Strategy](../adr/017-authorization-resilience-strategy.md)
- [ADR-015: Non-Blocking E2E Tests](../adr/015-non-blocking-e2e-tests.md)

### External Documentation

- [Axiom Documentation](https://axiom.co/docs)
- [Upptime Setup Guide](https://upptime.js.org/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Circuit Breaker Pattern (Martin Fowler)](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Google SRE Book: SLOs](https://sre.google/sre-book/service-level-objectives/)

### Tools & Libraries

- `@axiomhq/js` - Axiom JavaScript SDK
- `@upstash/ratelimit` - Rate limiting (already installed)
- `recharts` - Dashboard charts (already installed)
- `vitest` - Testing framework (already installed)

---

## Appendix A: Environment Variables

**New Variables for v18.0:**

```bash
# Axiom Integration (Production Monitoring)
AXIOM_TOKEN=xaat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AXIOM_ORG_ID=helpbridge-ca-xxxxx
AXIOM_DATASET=performance

# Alerting
SLACK_WEBHOOK_URL=<your-slack-webhook-url>
ADMIN_EMAIL=admin@helpbridge.ca

# Circuit Breaker (Production Tuning)
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5  # Higher in prod (less sensitive)
CIRCUIT_BREAKER_TIMEOUT=60000        # 1min timeout (vs 30s in dev)

# Performance Tracking (Production)
NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING=false  # Disabled (use Axiom instead)

# Status Page
NEXT_PUBLIC_STATUS_PAGE_URL=https://status.helpbridge.ca
```

**Updated `.env.example`:**

```bash
# v18.0: Production Observability

# Axiom (Production Metrics)
AXIOM_TOKEN=
AXIOM_ORG_ID=
AXIOM_DATASET=performance

# Alerts
SLACK_WEBHOOK_URL=
ADMIN_EMAIL=

# Circuit Breaker
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60000
```

---

## Appendix B: Cost Analysis

### Estimated Monthly Costs (Production)

| Service      | Tier | Cost      | Usage Estimate                  |
| ------------ | ---- | --------- | ------------------------------- |
| **Vercel**   | Pro  | $20/month | Deployment platform             |
| **Supabase** | Free | $0        | <500MB DB, <2GB bandwidth       |
| **Axiom**    | Free | $0        | <500GB ingestion (~10GB actual) |
| **Slack**    | Free | $0        | Webhook only (no paid features) |
| **Upptime**  | Free | $0        | GitHub Actions (public repo)    |
| **Resend**   | Free | $0        | <100 emails/month (alerts)      |

**Total:** $20/month (Vercel only)

**Scaling Considerations:**

- If traffic >100k requests/month: Upgrade Supabase to Pro ($25/month)
- If metrics >500GB/month: Upgrade Axiom to Team ($25/month)
- Current estimates: 10k requests/month, 10GB metrics/month → free tier sufficient

---

## Appendix C: Performance Budget

**Target Performance Characteristics:**

| Metric                | Current (v17.6) | Target (v18.0) | Max Acceptable |
| --------------------- | --------------- | -------------- | -------------- |
| Bundle Size (gzip)    | 245KB           | <260KB         | 280KB          |
| Initial Load Time     | 1.2s            | <1.4s          | 1.8s           |
| Search API (p95)      | 380ms           | <400ms         | 500ms          |
| Memory Usage (client) | 45MB            | <50MB          | 60MB           |
| Memory Usage (server) | 120MB           | <140MB         | 160MB          |

**New Monitoring Overhead Targets:**

- Axiom ingestion: <2ms per batch (async)
- Circuit breaker check: <0.1ms per request
- Performance tracking: <0.5ms per operation (dev only)
- Total overhead: <5ms per request

---

**End of Implementation Plan**

---

**Version History:**

- v1.0 (2026-01-30): Initial plan created
- Next review: After Phase 1 completion (est. 2026-02-05)
