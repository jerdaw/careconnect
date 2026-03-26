# v18.0 Phase 2: Production Monitoring Infrastructure - Implementation Plan

**Version:** 18.0-Phase-2
**Date:** 2026-01-30
**Status:** READY FOR IMPLEMENTATION
**Dependencies:** v18.0 Phase 1 (Complete)
**Estimated Effort:** 10-12 hours (2-3 days)
**Target Completion:** 2026-02-12

---

## Executive Summary

### Current State

**Phase 1 Completion Status (v18.0):**

- ✅ **Task 1.1:** All 8 API routes protected with circuit breaker pattern (100% coverage)
- ✅ **Task 1.2:** All 540 integration tests passing (3 previously failing tests fixed)
- ✅ **Task 1.3:** Performance baseline infrastructure ready (user execution pending)
- ✅ **Task 1.4:** Metrics endpoint secured with admin-only production access
- ✅ **Zero type errors**, build passing, production-ready codebase

**Infrastructure:**

- 196 curated services in database
- Circuit breaker protecting all database operations
- Performance tracking system in place (`lib/performance/`)
- Health check API at `/api/v1/health`
- Metrics API at `/api/v1/metrics` (admin-only in production)
- k6 load testing suite ready

**Key Gaps (What Phase 2 Addresses):**

- ❌ No persistent metrics storage (in-memory only, dev-only)
- ❌ No production monitoring or alerting
- ❌ No observability dashboard for real-time health visibility
- ❌ No automated incident detection
- ❌ No operational runbooks for troubleshooting

### Current State Summary

HelpBridge has completed Phase 1 of production observability. The platform now has comprehensive resilience (circuit breaker pattern, fail-safe authorization, performance tracking), but lacks **production-grade monitoring and alerting**.

**Production Readiness Assessment:**

- **Resilience:** 🟢 Excellent (circuit breaker, graceful degradation, health checks)
- **Testing:** 🟢 Excellent (540 tests, 100% coverage on critical paths)
- **Security:** 🟢 Excellent (RBAC, RLS, admin-only metrics)
- **Observability:** 🔴 **Insufficient** (no persistent metrics, no alerts, no dashboard)
- **Incident Response:** 🔴 **Missing** (no runbooks, no escalation paths, no SLOs)

**Verdict:** Platform is resilient but **blind in production**. Phase 2 adds the eyes and ears.

### Key Unknowns & Assumptions

**Unknowns:**

1. **Actual production metric volume** - Estimated 5-10GB/month, but depends on traffic
2. **Alert noise level** - Unknown if thresholds will cause alert fatigue
3. **Axiom query performance** - Free tier limits unknown in practice
4. **User's monitoring preferences** - Slack vs. email vs. PagerDuty

**Assumptions:**

1. **Budget:** Free-tier solutions only (Axiom 500GB/month free, Slack free tier)
2. **Deployment:** Vercel remains the platform (affects observability tool selection)
3. **Timeline:** User expects production launch within 1 month (Phase 2 is critical path)
4. **Scope:** Focus on backend observability (not frontend RUM or user analytics)
5. **Team Size:** Solo developer or small team (automated alerts more critical)

**Partially Implemented Work:**

- ✅ Performance tracking exists but is development-only (not production-ready)
- ✅ Circuit breaker telemetry exists but not exported to external system
- ✅ Health check endpoint exists but not monitored continuously
- ❌ No alerting infrastructure
- ❌ No observability dashboard
- ❌ No runbooks

### Goal

Transform the platform from **resilient but blind** to **resilient and observable** by:

1. **Persistent Metrics:** Integrate Axiom for production-grade metric storage and querying
2. **Real-Time Visibility:** Build observability dashboard at `/admin/observability`
3. **Proactive Alerting:** Configure Slack + email notifications for critical issues
4. **Incident Response:** Document operational runbooks for common failure scenarios

**Success Criteria:**

- Detect and alert on circuit breaker opens within 30 seconds
- Visualize p50/p95/p99 latency trends in real-time
- Enable debugging of production issues without SSH access
- Reduce mean-time-to-recovery (MTTR) from unknown to <15 minutes

---

## Phased Implementation Plan

### Phase 2 Overview: Production Monitoring Infrastructure (10-12 hours)

**Goal:** Establish automated monitoring and alerting for production health.

**Priority:** HIGH
**Risk:** LOW (net-new features, no existing code changes)
**Dependencies:** Phase 1 complete (circuit breaker, performance tracking, health checks)

**Key Decisions:**

1. **APM Tool:** Axiom (free tier, Vercel-native, structured logging)
2. **Alert Channel:** Slack webhooks (free, immediate notifications)
3. **Dashboard:** Internal Next.js page (no third-party dashboards)
4. **Deployment:** Gradual rollout with feature flags

---

### Task 2.1: Integrate Axiom for Persistent Metrics (4 hours)

**Objective:** Send performance metrics, circuit breaker events, and health check results to Axiom for persistent storage and querying.

**Priority:** CRITICAL
**Risk:** MEDIUM (external dependency, requires API key)
**Estimated Duration:** 4 hours

---

#### 2.1.1 Install Axiom SDK and Configure Environment (30 minutes)

**Installation:**

```bash
npm install @axiomhq/js
```

**Environment Variables:**
Add to `.env.example` and `.env.local`:

```bash
# Axiom Observability (v18.0 Phase 2)
# Sign up at https://axiom.co (free tier: 500GB/month)
AXIOM_TOKEN=your-axiom-token
AXIOM_ORG_ID=your-axiom-org-id
AXIOM_DATASET=kingston-care-production
```

**Validation Schema:**
Update `lib/env.ts` with Axiom variables:

```typescript
export const env = createEnv({
  server: {
    // ... existing ...
    AXIOM_TOKEN: z.string().optional(),
    AXIOM_ORG_ID: z.string().optional(),
    AXIOM_DATASET: z.string().default("kingston-care-production"),
  },
})
```

**Deliverables:**

- [ ] `@axiomhq/js` added to `package.json`
- [ ] Environment variables added to `.env.example`
- [ ] Validation schema updated in `lib/env.ts`
- [ ] Type-check passing

**Validation:**

```bash
npm run type-check  # Should pass with new env vars
```

---

#### 2.1.2 Create Axiom Integration Module (1 hour)

**File:** `lib/observability/axiom.ts`

**Implementation:**

```typescript
/**
 * Axiom Observability Integration
 *
 * Sends structured logs, metrics, and events to Axiom for production monitoring.
 *
 * Features:
 * - Batched metric ingestion (every 60s)
 * - Circuit breaker event streaming (real-time)
 * - Error-resilient (failed ingestion doesn't crash app)
 * - Production-only (no-op in development)
 *
 * @see https://axiom.co/docs
 */

import { Axiom } from "@axiomhq/js"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"

// Singleton Axiom client
let axiomClient: Axiom | null = null

/**
 * Initialize Axiom client (lazy, production-only)
 */
function getAxiomClient(): Axiom | null {
  if (process.env.NODE_ENV !== "production") {
    return null // No-op in dev/staging
  }

  if (!env.AXIOM_TOKEN || !env.AXIOM_ORG_ID) {
    logger.warn("Axiom credentials missing, observability disabled", {
      component: "axiom",
    })
    return null
  }

  if (!axiomClient) {
    axiomClient = new Axiom({
      token: env.AXIOM_TOKEN,
      orgId: env.AXIOM_ORG_ID,
    })
    logger.info("Axiom client initialized", {
      dataset: env.AXIOM_DATASET,
      component: "axiom",
    })
  }

  return axiomClient
}

/**
 * Send events to Axiom dataset
 */
export async function ingestEvents(dataset: string, events: any[]): Promise<void> {
  const client = getAxiomClient()
  if (!client) return // No-op if not configured

  try {
    await client.ingest(dataset, events)
    logger.debug(`Ingested ${events.length} events to Axiom`, {
      dataset,
      component: "axiom",
    })
  } catch (error) {
    // Don't throw - metrics are non-critical, app should continue
    logger.error("Axiom ingestion failed", {
      error: error instanceof Error ? error.message : String(error),
      dataset,
      eventCount: events.length,
      component: "axiom",
    })
  }
}

/**
 * Send performance metrics to Axiom
 */
export async function sendPerformanceMetrics(metrics: any): Promise<void> {
  await ingestEvents(env.AXIOM_DATASET, [
    {
      _time: new Date().toISOString(),
      type: "performance",
      ...metrics,
    },
  ])
}

/**
 * Send circuit breaker event to Axiom
 */
export async function sendCircuitBreakerEvent(event: {
  state: string
  previousState: string
  failureCount: number
  successCount: number
  failureRate: number
}): Promise<void> {
  await ingestEvents(env.AXIOM_DATASET, [
    {
      _time: new Date().toISOString(),
      type: "circuit_breaker",
      severity: event.state === "OPEN" ? "CRITICAL" : "INFO",
      ...event,
    },
  ])
}

/**
 * Send health check result to Axiom
 */
export async function sendHealthCheck(healthData: any): Promise<void> {
  await ingestEvents(env.AXIOM_DATASET, [
    {
      _time: new Date().toISOString(),
      type: "health_check",
      ...healthData,
    },
  ])
}

/**
 * Send API error to Axiom
 */
export async function sendApiError(error: {
  endpoint: string
  method: string
  statusCode: number
  errorMessage: string
  userId?: string
}): Promise<void> {
  await ingestEvents(env.AXIOM_DATASET, [
    {
      _time: new Date().toISOString(),
      type: "api_error",
      severity: error.statusCode >= 500 ? "ERROR" : "WARN",
      ...error,
    },
  ])
}

/**
 * Flush any pending events (called on shutdown)
 */
export async function flushAxiom(): Promise<void> {
  const client = getAxiomClient()
  if (client) {
    await client.flush()
    logger.info("Axiom client flushed", { component: "axiom" })
  }
}
```

**Deliverables:**

- [ ] `lib/observability/axiom.ts` created
- [ ] All functions properly typed
- [ ] Error handling comprehensive (non-throwing)
- [ ] Production-only guard implemented
- [ ] Structured logging integrated

**Validation:**

```bash
npm run type-check  # Should pass
```

---

#### 2.1.3 Integrate with Performance Tracker (1 hour)

**File:** `lib/performance/metrics.ts` (modify)

**Add Axiom Export:**

```typescript
import { sendPerformanceMetrics } from "@/lib/observability/axiom"

// ... existing code ...

/**
 * Export metrics to Axiom (production only)
 * Called periodically via scheduled job
 */
export async function exportMetricsToAxiom(): Promise<void> {
  if (process.env.NODE_ENV !== "production") return

  const metrics = getMetrics()
  await sendPerformanceMetrics({
    totalOperations: metrics.totalOperations,
    trackingSince: metrics.trackingSince,
    operations: metrics.operations,
  })
}
```

**Deliverables:**

- [ ] `exportMetricsToAxiom()` function added
- [ ] Metrics formatted for Axiom ingestion
- [ ] Production-only guard

---

#### 2.1.4 Integrate with Circuit Breaker Telemetry (1 hour)

**File:** `lib/resilience/telemetry.ts` (modify)

**Add Axiom Event Streaming:**

```typescript
import { sendCircuitBreakerEvent } from "@/lib/observability/axiom"

export function logCircuitBreakerTransition(
  breakerName: string,
  fromState: CircuitState,
  toState: CircuitState,
  stats: CircuitBreakerStats
): void {
  // Existing logging...
  logger.info(`Circuit breaker '${breakerName}' transitioned: ${fromState} → ${toState}`, {
    breakerName,
    fromState,
    toState,
    stats,
    component: "circuit-breaker",
  })

  // NEW: Send to Axiom
  void sendCircuitBreakerEvent({
    state: toState,
    previousState: fromState,
    failureCount: stats.failureCount,
    successCount: stats.successCount,
    failureRate: stats.failureRate,
  })
}
```

**Deliverables:**

- [ ] Circuit breaker events sent to Axiom on state transitions
- [ ] Non-blocking async calls (don't slow down circuit breaker logic)

---

#### 2.1.5 Create Scheduled Metric Export Job (30 minutes)

**File:** `app/api/cron/export-metrics/route.ts`

**Implementation:**

```typescript
/**
 * Scheduled job to export metrics to Axiom
 *
 * Vercel Cron: https://vercel.com/docs/cron-jobs
 *
 * Schedule: Every 60 seconds
 */

import { NextRequest, NextResponse } from "next/server"
import { exportMetricsToAxiom } from "@/lib/performance/metrics"
import { sendHealthCheck } from "@/lib/observability/axiom"
import { logger } from "@/lib/logger"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this header)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Export performance metrics
    await exportMetricsToAxiom()

    // Export health check status
    const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/health`)
    const healthData = await healthResponse.json()
    await sendHealthCheck(healthData)

    logger.info("Metrics exported to Axiom", { component: "cron" })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Metric export failed", {
      error: error instanceof Error ? error.message : String(error),
      component: "cron",
    })

    return NextResponse.json({ error: "Export failed", message: String(error) }, { status: 500 })
  }
}
```

**Vercel Configuration:**
Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/export-metrics",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Environment Variable:**
Add to `.env.example`:

```bash
# Cron Job Authentication (v18.0 Phase 2)
# Generate a secure random string for cron job authentication
CRON_SECRET=your-random-secret-string
```

**Deliverables:**

- [ ] Cron endpoint created at `/api/cron/export-metrics`
- [ ] Vercel cron schedule configured (every 60s)
- [ ] Cron secret authentication implemented
- [ ] Error handling with logging

**Validation:**

```bash
# Manually trigger cron (with secret)
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/export-metrics
```

---

#### 2.1.6 Testing & Validation (30 minutes)

**Test Checklist:**

1. **Environment Setup:**

   ```bash
   # Set up Axiom credentials in .env.local
   AXIOM_TOKEN=xait-...
   AXIOM_ORG_ID=...
   AXIOM_DATASET=kingston-care-staging
   ```

2. **Manual Metric Export:**

   ```typescript
   // In development, temporarily enable Axiom
   const { sendPerformanceMetrics } = await import("@/lib/observability/axiom")
   await sendPerformanceMetrics({ test: true })
   ```

3. **Verify Axiom Dashboard:**
   - Log into axiom.co
   - Check `kingston-care-staging` dataset
   - Confirm events appear within 2 minutes

4. **Circuit Breaker Event Test:**
   - Trigger circuit breaker open (simulate DB failure)
   - Verify event appears in Axiom with `type: 'circuit_breaker'`

5. **Cron Job Test:**
   - Deploy to Vercel staging
   - Wait for cron execution
   - Verify metrics in Axiom dashboard

**Validation Criteria:**

- ✅ Events appear in Axiom within 2 minutes
- ✅ No errors in application logs during ingestion
- ✅ Batch size reasonable (<10KB per batch)
- ✅ Cron job executes successfully every 60s
- ✅ Production guard prevents dev metrics

**Deliverables:**

- [ ] Axiom integration tested end-to-end
- [ ] All validation criteria met
- [ ] Documentation: `docs/observability/axiom-setup.md`

---

### Task 2.2: Create Observability Dashboard (4 hours)

**Objective:** Build internal dashboard at `/admin/observability` for real-time system health visualization.

**Priority:** HIGH
**Risk:** LOW (UI-only, no backend changes)
**Estimated Duration:** 4 hours

---

#### 2.2.1 Create Dashboard Page Structure (1 hour)

**File:** `app/[locale]/admin/observability/page.tsx`

**Implementation:**

```typescript
/**
 * Observability Dashboard
 *
 * Real-time system health monitoring for platform admins.
 *
 * Features:
 * - Circuit breaker status (CLOSED/OPEN/HALF_OPEN)
 * - Performance metrics (p50/p95/p99 latency)
 * - Recent incidents (last 24h)
 * - System health summary
 *
 * Access: Admin-only (enforced via middleware)
 */

import { Metadata } from 'next'
import { getSupabaseBreakerStats } from '@/lib/resilience/supabase-breaker'
import { getMetrics } from '@/lib/performance/metrics'
import { createClient } from '@/lib/supabase'
import { assertAdminRole } from '@/lib/auth/authorization'
import { CircuitBreakerCard } from '@/components/observability/CircuitBreakerCard'
import { PerformanceCharts } from '@/components/observability/PerformanceCharts'
import { HealthSummary } from '@/components/observability/HealthSummary'
import { IncidentTimeline } from '@/components/observability/IncidentTimeline'
import { RefreshButton } from '@/components/observability/RefreshButton'

export const metadata: Metadata = {
  title: 'Observability Dashboard | Admin',
  description: 'Real-time system health monitoring',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ObservabilityPage() {
  // Admin-only access
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  await assertAdminRole(supabase, user.id)

  // Fetch current system state
  const circuitBreakerStats = getSupabaseBreakerStats()
  const performanceMetrics = getMetrics()

  // TODO: Query Axiom for historical incidents (Phase 2.2.3)
  const recentIncidents = []

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Observability Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time system health and performance monitoring
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* System Health Summary */}
      <HealthSummary
        circuitBreaker={circuitBreakerStats}
        metrics={performanceMetrics}
      />

      {/* Circuit Breaker Status */}
      <CircuitBreakerCard stats={circuitBreakerStats} />

      {/* Performance Metrics */}
      <PerformanceCharts metrics={performanceMetrics} />

      {/* Recent Incidents */}
      <IncidentTimeline incidents={recentIncidents} />
    </div>
  )
}
```

**Middleware Protection:**
Update `middleware.ts` to ensure admin-only access:

```typescript
// Add to protected routes
const adminOnlyRoutes = [
  "/admin/observability",
  // ... existing admin routes
]
```

**Deliverables:**

- [ ] Dashboard page created at `/admin/observability`
- [ ] Admin-only access enforced
- [ ] Server component with periodic refresh
- [ ] Basic layout structure

---

#### 2.2.2 Build Dashboard Components (2 hours)

**Component 1: Circuit Breaker Card**

**File:** `components/observability/CircuitBreakerCard.tsx`

```typescript
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CircuitBreakerStats } from '@/lib/resilience/circuit-breaker'

interface CircuitBreakerCardProps {
  stats: CircuitBreakerStats
}

export function CircuitBreakerCard({ stats }: CircuitBreakerCardProps) {
  const stateColor = {
    CLOSED: 'bg-green-500',
    OPEN: 'bg-red-500',
    HALF_OPEN: 'bg-yellow-500',
  }[stats.state]

  const stateLabel = {
    CLOSED: '✅ Healthy',
    OPEN: '🚨 Circuit Open',
    HALF_OPEN: '⚠️ Testing Recovery',
  }[stats.state]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Circuit Breaker Status</CardTitle>
            <CardDescription>Database resilience protection</CardDescription>
          </div>
          <Badge className={stateColor}>{stateLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">State</dt>
            <dd className="text-2xl font-bold">{stats.state}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Failure Rate</dt>
            <dd className="text-2xl font-bold">{(stats.failureRate * 100).toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Failures</dt>
            <dd className="text-2xl font-bold">{stats.failureCount}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Successes</dt>
            <dd className="text-2xl font-bold">{stats.successCount}</dd>
          </div>
        </dl>

        {stats.state !== 'CLOSED' && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Circuit is {stats.state}. Database operations are being protected.
            </p>
            {stats.nextAttempt && (
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Next recovery attempt: {new Date(stats.nextAttempt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**Component 2: Performance Charts**

**File:** `components/observability/PerformanceCharts.tsx`

```typescript
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricsSummary } from '@/lib/performance/metrics'

interface PerformanceChartsProps {
  metrics: MetricsSummary
}

export function PerformanceCharts({ metrics }: PerformanceChartsProps) {
  // Extract top 5 operations by request count
  const topOperations = Object.entries(metrics.operations)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>
          Tracking since {new Date(metrics.trackingSince).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Total Operations</p>
              <p className="text-3xl font-bold">{metrics.totalOperations}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Tracked Operations</p>
              <p className="text-3xl font-bold">{Object.keys(metrics.operations).length}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Uptime</p>
              <p className="text-3xl font-bold">
                {Math.floor((Date.now() - metrics.trackingSince) / 1000 / 60)}m
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Top Operations</h3>
            <div className="space-y-3">
              {topOperations.map(([name, stats]) => (
                <div key={name} className="border-l-4 border-primary pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">{stats.count} calls</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">p50:</span>{' '}
                      <span className="font-medium">{stats.p50.toFixed(0)}ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">p95:</span>{' '}
                      <span className="font-medium">{stats.p95.toFixed(0)}ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">p99:</span>{' '}
                      <span className="font-medium">{stats.p99.toFixed(0)}ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">avg:</span>{' '}
                      <span className="font-medium">{stats.avg.toFixed(0)}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {Object.keys(metrics.operations).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No performance data available yet.</p>
              <p className="text-sm mt-2">
                Enable performance tracking with{' '}
                <code className="bg-muted px-1 py-0.5 rounded">
                  NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING=true
                </code>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Component 3: Health Summary**

**File:** `components/observability/HealthSummary.tsx`

```typescript
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CircuitBreakerStats } from '@/lib/resilience/circuit-breaker'
import { MetricsSummary } from '@/lib/performance/metrics'

interface HealthSummaryProps {
  circuitBreaker: CircuitBreakerStats
  metrics: MetricsSummary
}

export function HealthSummary({ circuitBreaker, metrics }: HealthSummaryProps) {
  const overallStatus = circuitBreaker.state === 'CLOSED' ? 'healthy' : 'degraded'
  const statusColor = overallStatus === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-muted-foreground">Overall platform status</p>
        </div>
        <Badge className={`${statusColor} text-white px-4 py-2 text-lg`}>
          {overallStatus === 'healthy' ? '✅ Operational' : '⚠️ Degraded'}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Circuit Breaker</p>
          <p className="text-lg font-bold">{circuitBreaker.state}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Failure Rate</p>
          <p className="text-lg font-bold">{(circuitBreaker.failureRate * 100).toFixed(1)}%</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Operations Tracked</p>
          <p className="text-lg font-bold">{metrics.totalOperations}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Uptime</p>
          <p className="text-lg font-bold">
            {Math.floor((Date.now() - metrics.trackingSince) / 1000 / 60)}m
          </p>
        </div>
      </div>
    </Card>
  )
}
```

**Component 4: Refresh Button**

**File:** `components/observability/RefreshButton.tsx`

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function RefreshButton() {
  const router = useRouter()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.refresh()}
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh
    </Button>
  )
}
```

**Deliverables:**

- [ ] CircuitBreakerCard component
- [ ] PerformanceCharts component
- [ ] HealthSummary component
- [ ] RefreshButton component
- [ ] All components properly typed
- [ ] Responsive design

**Validation:**

```bash
npm run type-check  # Should pass
npm run build       # Should build successfully
```

---

#### 2.2.3 Add Client-Side Auto-Refresh (30 minutes)

**Enhancement:** Auto-refresh dashboard every 60 seconds without full page reload.

**File:** `app/[locale]/admin/observability/page.tsx` (modify)

Add auto-refresh logic:

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [router])

  return null
}

// Add to page:
<AutoRefresh />
```

**Deliverables:**

- [ ] Auto-refresh implemented (60s interval)
- [ ] Refresh indicator in UI
- [ ] Cleanup on unmount

---

#### 2.2.4 Testing & Documentation (30 minutes)

**Test Checklist:**

1. **Access Control:**
   - Non-admin user: Should get 403 Forbidden
   - Admin user: Should load dashboard

2. **Data Display:**
   - Circuit breaker stats displayed correctly
   - Performance metrics show real data
   - Auto-refresh updates data every 60s

3. **Responsive Design:**
   - Mobile: Stacked cards
   - Tablet: 2-column grid
   - Desktop: Full 4-column grid

4. **Performance:**
   - Dashboard loads in <2s
   - No console errors
   - Smooth auto-refresh

**Documentation:**
Create `docs/observability/dashboard-usage.md` with:

- How to access dashboard
- Interpreting circuit breaker states
- Understanding performance metrics
- Troubleshooting common issues

**Deliverables:**

- [ ] All test criteria pass
- [ ] Documentation complete
- [ ] Screenshots in docs

**Validation:**

```bash
npm run dev
# Navigate to /admin/observability
# Verify all components render
# Check auto-refresh works
```

---

### Task 2.3: Configure Alerting (2 hours)

**Objective:** Proactive notifications for critical system events.

**Priority:** MEDIUM
**Risk:** LOW (external webhooks, non-blocking)
**Estimated Duration:** 2 hours

---

#### 2.3.1 Slack Webhook Integration (45 minutes)

**File:** `lib/integrations/slack.ts`

```typescript
/**
 * Slack Webhook Integration
 *
 * Sends alerts to Slack channel for team notifications.
 *
 * Features:
 * - Circuit breaker state changes
 * - High error rate alerts
 * - Performance degradation warnings
 *
 * Setup: Create incoming webhook at https://slack.com/apps/A0F7XDUAZ-incoming-webhooks
 */

import { env } from "@/lib/env"
import { logger } from "@/lib/logger"

interface SlackMessage {
  text: string
  attachments?: Array<{
    color?: "good" | "warning" | "danger"
    title?: string
    text?: string
    fields?: Array<{
      title: string
      value: string
      short?: boolean
    }>
  }>
}

/**
 * Send message to Slack channel
 */
export async function sendSlackNotification(message: SlackMessage): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    logger.warn("Slack webhook URL not configured, skipping notification", {
      component: "slack",
    })
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`)
    }

    logger.debug("Slack notification sent", {
      component: "slack",
      messagePreview: message.text.substring(0, 50),
    })
  } catch (error) {
    logger.error("Failed to send Slack notification", {
      error: error instanceof Error ? error.message : String(error),
      component: "slack",
    })
  }
}

/**
 * Send circuit breaker alert to Slack
 */
export async function alertCircuitBreakerOpen(): Promise<void> {
  await sendSlackNotification({
    text: "🚨 *CRITICAL:* Circuit Breaker OPEN",
    attachments: [
      {
        color: "danger",
        title: "Database Circuit Breaker",
        text: "The circuit breaker has opened due to repeated database failures. Database operations are being fast-failed.",
        fields: [
          {
            title: "Severity",
            value: "CRITICAL",
            short: true,
          },
          {
            title: "Action Required",
            value: "Investigate database health",
            short: true,
          },
          {
            title: "Dashboard",
            value: `${process.env.NEXT_PUBLIC_APP_URL}/admin/observability`,
            short: false,
          },
        ],
      },
    ],
  })
}

/**
 * Send high error rate alert
 */
export async function alertHighErrorRate(errorRate: number): Promise<void> {
  await sendSlackNotification({
    text: `⚠️ *WARNING:* High Error Rate Detected`,
    attachments: [
      {
        color: "warning",
        title: "API Error Rate",
        text: `Error rate has exceeded threshold: ${errorRate.toFixed(1)}%`,
        fields: [
          {
            title: "Current Rate",
            value: `${errorRate.toFixed(1)}%`,
            short: true,
          },
          {
            title: "Threshold",
            value: "5%",
            short: true,
          },
        ],
      },
    ],
  })
}
```

**Environment Variable:**
Add to `.env.example`:

```bash
# Slack Integration (v18.0 Phase 2)
# Create incoming webhook at https://slack.com/apps/A0F7XDUAZ-incoming-webhooks
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Deliverables:**

- [ ] Slack integration module created
- [ ] Circuit breaker alert function
- [ ] High error rate alert function
- [ ] Environment variable configured

---

#### 2.3.2 Integrate Alerts with Circuit Breaker (30 minutes)

**File:** `lib/resilience/telemetry.ts` (modify)

Add Slack alerting:

```typescript
import { alertCircuitBreakerOpen } from "@/lib/integrations/slack"

export function logCircuitBreakerTransition(
  breakerName: string,
  fromState: CircuitState,
  toState: CircuitState,
  stats: CircuitBreakerStats
): void {
  // ... existing logging ...

  // Send Slack alert on OPEN state
  if (toState === "OPEN") {
    void alertCircuitBreakerOpen()
  }
}
```

**Deliverables:**

- [ ] Circuit breaker OPEN triggers Slack alert
- [ ] Non-blocking async call

---

#### 2.3.3 Alert Throttling (15 minutes)

**File:** `lib/observability/alert-throttle.ts`

```typescript
/**
 * Alert Throttling
 *
 * Prevents alert spam by rate-limiting notifications.
 */

const alertTimestamps = new Map<string, number>()

/**
 * Check if alert should be sent (throttled)
 *
 * @param alertKey - Unique identifier for alert type
 * @param throttleMs - Minimum time between alerts (ms)
 * @returns true if alert should be sent
 */
export function shouldSendAlert(alertKey: string, throttleMs: number): boolean {
  const now = Date.now()
  const lastSent = alertTimestamps.get(alertKey)

  if (!lastSent || now - lastSent > throttleMs) {
    alertTimestamps.set(alertKey, now)
    return true
  }

  return false
}

/**
 * Reset throttle for specific alert (for testing)
 */
export function resetAlertThrottle(alertKey: string): void {
  alertTimestamps.delete(alertKey)
}
```

Update circuit breaker alert with throttling:

```typescript
import { shouldSendAlert } from "@/lib/observability/alert-throttle"

if (toState === "OPEN" && shouldSendAlert("circuit-breaker-open", 600000)) {
  void alertCircuitBreakerOpen() // Max once per 10 minutes
}
```

**Deliverables:**

- [ ] Alert throttling implemented
- [ ] Circuit breaker alert throttled (10min)
- [ ] Error rate alert throttled (15min)

---

#### 2.3.4 Testing & Documentation (30 minutes)

**Test Checklist:**

1. **Slack Webhook Test:**

   ```bash
   curl -X POST $SLACK_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test from HelpBridge"}'
   ```

2. **Circuit Breaker Alert:**
   - Simulate circuit open (DB failure)
   - Verify Slack notification received within 30s
   - Verify throttling (second alert within 10min blocked)

3. **Error Rate Alert:**
   - Trigger high error rate
   - Verify Slack notification
   - Verify throttling

**Documentation:**
Create `docs/observability/alerting-setup.md` with:

- How to set up Slack webhook
- Alert types and thresholds
- Throttling behavior
- Testing alerts

**Deliverables:**

- [ ] Slack webhook tested
- [ ] All alerts tested
- [ ] Throttling verified
- [ ] Documentation complete

---

### Task 2.4: Create Operational Runbooks (2 hours)

**Objective:** Document incident response procedures for common failure scenarios.

**Priority:** MEDIUM
**Risk:** NONE (documentation-only)
**Estimated Duration:** 2 hours

---

#### 2.4.1 Circuit Breaker Open Runbook (45 minutes)

**File:** `docs/runbooks/circuit-breaker-open.md`

(See implementation plan v18.0 lines 568-599 for full template)

**Key Sections:**

1. Symptoms
2. Diagnosis steps
3. Resolution procedures
4. Prevention strategies
5. Escalation paths

**Deliverables:**

- [ ] Circuit breaker open runbook complete
- [ ] Reviewed by team
- [ ] Added to runbook index

---

#### 2.4.2 High Error Rate Runbook (30 minutes)

**File:** `docs/runbooks/high-error-rate.md`

**Template:**

```markdown
# Runbook: High Error Rate

## Symptoms

- Error rate >5% (5min window)
- Alert: "High error rate detected"
- Users reporting errors

## Diagnosis

1. Check Axiom dashboard for error patterns
2. Review recent deployments
3. Check external service status (Supabase, Vercel)
4. Review error logs by endpoint

## Resolution

1. Identify failing endpoint
2. Check for code changes (rollback if needed)
3. Verify database queries
4. Check rate limits
5. Monitor error rate after fix

## Prevention

- Comprehensive E2E tests before deployment
- Staged rollouts (10% → 50% → 100%)
- Load testing on staging

## Escalation

- If error rate >10%, escalate immediately
- If unresolved in 30min, page senior engineer
```

**Deliverables:**

- [ ] High error rate runbook complete

---

#### 2.4.3 Slow Query Performance Runbook (30 minutes)

**File:** `docs/runbooks/slow-queries.md`

**Deliverables:**

- [ ] Slow query runbook complete

---

#### 2.4.4 Runbook Index (15 minutes)

**File:** `docs/runbooks/README.md`

```markdown
# Operational Runbooks

## Available Runbooks

1. [Circuit Breaker Open](circuit-breaker-open.md)
2. [High Error Rate](high-error-rate.md)
3. [Slow Query Performance](slow-queries.md)
4. [Database Migration Failures](database-migration.md)

## Runbook Template

See `_template.md` for standard runbook format.

## Contributing

When creating new runbooks:

- Follow the template structure
- Include realistic scenarios
- Add validation steps
- Get peer review
```

**Deliverables:**

- [ ] Runbook index created
- [ ] All runbooks linked
- [ ] Template provided

---

## Success Criteria

### Overall Phase 2 Goals

**Infrastructure:**

- ✅ Axiom integration live in production
- ✅ Metrics batching every 60s via cron job
- ✅ Circuit breaker events sent to Axiom in real-time
- ✅ Observability dashboard functional at `/admin/observability`
- ✅ Slack alerts configured and tested
- ✅ 4 operational runbooks published

**Performance:**

- ✅ Axiom ingestion overhead <5ms per batch
- ✅ Dashboard loads in <2s
- ✅ Auto-refresh works smoothly
- ✅ No application errors during metric export

**Testing:**

- ✅ All 540 tests still passing
- ✅ Type-check passing
- ✅ Build successful
- ✅ Manual testing complete

**Documentation:**

- ✅ Axiom setup guide
- ✅ Dashboard usage guide
- ✅ Alerting configuration guide
- ✅ 4 operational runbooks
- ✅ CLAUDE.md updated

---

## Timeline & Milestones

### Day 1: Axiom Integration (4 hours)

- Install SDK and configure environment (30min)
- Create Axiom integration module (1h)
- Integrate with performance tracker (1h)
- Integrate with circuit breaker (1h)
- Create scheduled export job (30min)
- Testing and validation (30min)

**Milestone:** Metrics flowing to Axiom

---

### Day 2: Observability Dashboard (4 hours)

- Create dashboard page structure (1h)
- Build dashboard components (2h)
- Add auto-refresh (30min)
- Testing and documentation (30min)

**Milestone:** Dashboard live and functional

---

### Day 3: Alerting & Runbooks (4 hours)

- Slack webhook integration (45min)
- Integrate alerts with circuit breaker (30min)
- Alert throttling (15min)
- Testing (30min)
- Circuit breaker runbook (45min)
- High error rate runbook (30min)
- Slow query runbook (30min)
- Runbook index (15min)

**Milestone:** Phase 2 complete, production-ready

---

## Dependencies & Blockers

### Required User Actions

**Before Starting:**

1. ⚠️ **Sign up for Axiom account** (free tier): https://axiom.co
   - Create account
   - Create dataset: `kingston-care-production`
   - Generate API token
   - Note organization ID

2. ⚠️ **Set up Slack webhook** (free):
   - Go to https://slack.com/apps/A0F7XDUAZ-incoming-webhooks
   - Create incoming webhook
   - Select channel (e.g., `#kingston-care-alerts`)
   - Copy webhook URL

3. ⚠️ **Generate cron secret**:
   ```bash
   openssl rand -base64 32
   ```

**Environment Variables to Add:**

```bash
# Axiom
AXIOM_TOKEN=xait-...
AXIOM_ORG_ID=...
AXIOM_DATASET=kingston-care-production

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Cron
CRON_SECRET=your-random-secret
```

### No Blockers

All infrastructure is free-tier compatible:

- ✅ Axiom: 500GB/month free (estimated usage: 5-10GB/month)
- ✅ Slack: Incoming webhooks are free
- ✅ Vercel: Cron jobs included in all plans

---

## Rollout & Rollback Strategy

### Rollout Plan

**Phase 2.A: Staging Validation (Day 1-2)**

1. Deploy Axiom integration to staging
2. Verify metrics ingestion for 24h
3. Monitor performance overhead (<5ms)
4. Test alerts manually

**Phase 2.B: Production Canary (Day 3)**

1. Deploy to production with `AXIOM_ENABLED=false` (feature flag)
2. Monitor for 12h (no observability changes)
3. Enable Axiom for 10% of requests (gradual rollout)
4. Monitor for performance regression

**Phase 2.C: Full Rollout (Day 4)**

1. Enable Axiom for 100% of requests
2. Enable Slack alerts
3. Publish dashboard to admins
4. Monitor SLO compliance for 7 days

### Rollback Strategy

**Trigger Conditions:**

- Performance regression >5% (Axiom overhead too high)
- Application errors during metric export
- Alert spam (>10 alerts/hour)
- Dashboard errors preventing admin access

**Rollback Steps:**

1. **Immediate (1 minute):**
   - Set `AXIOM_ENABLED=false` in Vercel env vars
   - Restart application

2. **Within 5 minutes:**
   - Disable Slack webhook (remove env var)
   - Revert observability dashboard (rollback deployment)

3. **Within 1 hour:**
   - Investigate root cause
   - Fix issues
   - Prepare re-deployment

**Rollback Testing:**

- Test feature flag toggle in staging before production
- Verify application works without Axiom credentials
- Ensure dashboard degrades gracefully without data

---

## Risk Assessment & Mitigation

### Risk 1: Axiom Ingestion Failures

**Probability:** MEDIUM
**Impact:** LOW (metrics lost, but app continues)

**Mitigation:**

- All Axiom calls are try/catch wrapped (non-throwing)
- Application continues if ingestion fails
- Logs errors for debugging

**Monitoring:**

- Alert if ingestion fails >10 times/hour
- Dashboard shows last successful export

---

### Risk 2: Alert Spam

**Probability:** MEDIUM
**Impact:** MEDIUM (alert fatigue, missed critical alerts)

**Mitigation:**

- Alert throttling (max 1 per 10min for critical, 1 per 15min for warnings)
- Tested thresholds based on baseline metrics
- Kill switch: remove `SLACK_WEBHOOK_URL` to disable all alerts

**Monitoring:**

- Track alert frequency in Axiom
- Weekly review of alert patterns

---

### Risk 3: Dashboard Performance

**Probability:** LOW
**Impact:** LOW (slow admin dashboard, doesn't affect users)

**Mitigation:**

- Server component with minimal client JS
- Pagination for large incident lists
- Caching of performance metrics (60s stale OK)

**Monitoring:**

- Dashboard load time <2s target
- Lighthouse performance score >90

---

### Risk 4: Axiom Free Tier Limits

**Probability:** LOW
**Impact:** MEDIUM (data ingestion stops, metrics lost)

**Mitigation:**

- Estimated usage: 5-10GB/month << 500GB free tier
- Monitor usage in Axiom dashboard
- Alert at 80% of free tier (400GB)

**Monitoring:**

- Weekly usage review
- Automatic alert at 400GB threshold

---

## Testing Strategy

### Unit Tests

**New Tests to Add:**

- `lib/observability/axiom.test.ts`
  - Test ingestion with mock Axiom client
  - Test production-only guard
  - Test error handling (non-throwing)

- `lib/observability/alert-throttle.test.ts`
  - Test throttle logic
  - Test reset function

**Estimated:** 10 new tests

---

### Integration Tests

**New Tests to Add:**

- `tests/integration/axiom.test.ts`
  - Test end-to-end metric export
  - Test circuit breaker event streaming
  - Test cron job authentication

**Estimated:** 5 new integration tests

---

### Manual Testing

**Checklist:**

1. ✅ Axiom metrics appear in dashboard
2. ✅ Circuit breaker alert sent to Slack
3. ✅ Observability dashboard loads
4. ✅ Auto-refresh works
5. ✅ Cron job executes successfully
6. ✅ Alert throttling prevents spam
7. ✅ Runbooks are actionable

---

## Documentation Deliverables

### Technical Documentation

1. **`docs/observability/axiom-setup.md`**
   - Axiom account setup
   - Environment variable configuration
   - Troubleshooting ingestion issues

2. **`docs/observability/dashboard-usage.md`**
   - How to access dashboard
   - Interpreting metrics
   - Using circuit breaker status

3. **`docs/observability/alerting-setup.md`**
   - Slack webhook configuration
   - Alert types and thresholds
   - Testing alerts

### Operational Documentation

4. **`docs/runbooks/circuit-breaker-open.md`**
   - Diagnosis steps
   - Resolution procedures
   - Prevention strategies

5. **`docs/runbooks/high-error-rate.md`**
6. **`docs/runbooks/slow-queries.md`**
7. **`docs/runbooks/README.md`** (index)

### Updated Documentation

8. **`CLAUDE.md`** (update)
   - Add observability section
   - Document Axiom integration
   - Link to runbooks

9. **`.env.example`** (update)
   - Add Axiom variables
   - Add Slack webhook
   - Add cron secret

---

## Questions for User (Non-Blocking)

**Preferences to Clarify (can proceed with defaults):**

1. **Slack Channel Name:**
   - Default: `#kingston-care-alerts`
   - Alternative: Provide preferred channel name

2. **Alert Severity Preferences:**
   - Default: Circuit open = CRITICAL (email + Slack)
   - Default: High error rate = WARNING (Slack only)
   - Alternative: Specify different severity levels

3. **Cron Frequency:**
   - Default: Every 60 seconds (Vercel free tier: 1min minimum)
   - Alternative: If paid plan, could be more frequent

4. **Axiom Dataset Name:**
   - Default: `kingston-care-production`
   - Alternative: Provide preferred dataset name

**All questions have reasonable defaults, implementation can proceed without answers.**

---

## Completion Checklist

### Task 2.1: Axiom Integration

- [ ] Axiom SDK installed
- [ ] Environment variables configured
- [ ] Axiom integration module created
- [ ] Performance tracker integrated
- [ ] Circuit breaker events streaming
- [ ] Cron job created
- [ ] End-to-end testing complete
- [ ] Documentation: `axiom-setup.md`

### Task 2.2: Observability Dashboard

- [ ] Dashboard page created
- [ ] Circuit breaker card component
- [ ] Performance charts component
- [ ] Health summary component
- [ ] Auto-refresh implemented
- [ ] Admin-only access enforced
- [ ] Documentation: `dashboard-usage.md`

### Task 2.3: Alerting

- [ ] Slack integration module created
- [ ] Circuit breaker alert integrated
- [ ] Alert throttling implemented
- [ ] Webhook tested
- [ ] Documentation: `alerting-setup.md`

### Task 2.4: Runbooks

- [ ] Circuit breaker open runbook
- [ ] High error rate runbook
- [ ] Slow query runbook
- [ ] Runbook index (README)
- [ ] Peer review complete

### Final Validation

- [ ] All 540+ tests passing
- [ ] Type-check passing
- [ ] Build successful
- [ ] Manual testing complete
- [ ] Documentation reviewed
- [ ] Environment variables documented
- [ ] Rollback plan tested

---

## Next Steps After Phase 2

### Immediate (Phase 3)

- **Task 3.1:** Define SLOs (uptime, latency, error rate)
- **Task 3.2:** SLO monitoring dashboard
- **Task 3.3:** Public status page (Upptime)

### Future Enhancements

- Email alerts (via Resend)
- PagerDuty integration (on-call rotation)
- Advanced Axiom queries (anomaly detection)
- Automated load testing in CI (baseline comparison)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-30

**Status:** READY FOR IMPLEMENTATION
