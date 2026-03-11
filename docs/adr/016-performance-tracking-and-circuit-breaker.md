# ADR 016: Performance Tracking and Circuit Breaker Pattern

## Status

Accepted

## Date

2026-01-25

## Context

HelpBridge relies on Supabase for critical data operations including search, service management, analytics, and authorization. As the platform scales, two key operational concerns have emerged:

### 1. Performance Visibility Gap

**Problem**: No systematic way to measure or track performance of critical operations

- Search latency unknown (keyword, vector, data loading)
- Database query performance not monitored
- API response times not tracked
- No baseline metrics for regression detection
- Performance degradation goes unnoticed until users complain

**Impact**:

- Can't identify performance bottlenecks
- No data to guide optimization efforts
- Risk of slow performance degrading user experience
- Difficult to validate that optimizations actually improve performance

### 2. Cascading Failure Risk

**Problem**: No protection against Supabase outages or degraded performance

- Every request waits for full database timeout (~30s)
- Failed operations retry indefinitely without backoff
- Single database failure can cascade across the entire application
- No graceful degradation when database is unavailable
- Offline sync hammers failing endpoints

**Impact**:

- Poor user experience during outages (long hangs instead of fast fails)
- Resource exhaustion from repeated failing requests
- Potential for cascading failures across dependent systems
- No fallback mechanism when database is unavailable

### Prior Art

**Existing Resilience Mechanisms**:

- ADR-010: PWA offline fallback with IndexedDB caching (client-side only)
- Search has JSON fallback (but no automatic triggering)
- Rate limiting on API endpoints (protection from abuse, not internal failures)

**Gap**: No server-side resilience pattern for database failures

## Decision

Implement **two complementary operational improvements** for v17.5+:

### 1. Performance Tracking System

A lightweight, opt-in performance instrumentation system:

**Core Components**:

- `lib/performance/tracker.ts` - Wrapper around logger for tracking operations
- `lib/performance/metrics.ts` - In-memory aggregation (p50, p95, p99)
- Environment variable gated: `NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING`

**Instrumented Paths**:

- Search operations (total, data load, keyword scoring, vector scoring)
- API routes (request-to-response latency)
- Database queries (by source: Supabase, IndexedDB, JSON fallback)

**Design Principles**:

- **Non-invasive**: <1ms overhead per operation
- **Opt-in**: Disabled by default, enabled per environment
- **Development-first**: In-memory storage only (no production overhead)
- **Structured**: Integrates with existing logger for consistency

### 2. Circuit Breaker Pattern

A resilience pattern that prevents cascading failures:

**Core Components**:

- `lib/resilience/circuit-breaker.ts` - Generic circuit breaker implementation
- `lib/resilience/supabase-breaker.ts` - Supabase-specific wrapper
- `lib/resilience/telemetry.ts` - Event logging and monitoring

**States**:

1. **CLOSED** (normal): Requests pass through
2. **OPEN** (failing): Requests fast-fail, preventing cascading failures
3. **HALF_OPEN** (testing): Allow limited requests to test recovery

**Configuration** (environment variables):

```bash
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=3        # Failures before opening
CIRCUIT_BREAKER_TIMEOUT=30000              # ms before retry (OPEN → HALF_OPEN)
```

**Protected Operations**:

- Database queries (`lib/search/data.ts`, `lib/services.ts`, `lib/analytics.ts`)
- Service management (claim, update, fetch)
- Analytics tracking (non-critical, graceful degradation)
- Offline sync (respects circuit state, skips when open)

**Design Principles**:

- **Fail-fast**: Prevent long waits during outages
- **Automatic recovery**: Transitions to HALF_OPEN after timeout
- **Fallback-aware**: Integrates with existing JSON fallback in search
- **Observable**: Logs state transitions for debugging

## Implementation

### Phase 1: Core Infrastructure ✅

**Performance Tracking**:

```typescript
// lib/performance/tracker.ts
await trackPerformance(
  "search.total",
  async () => {
    // Operation here
  },
  { queryLength: query.length }
)
```

**Circuit Breaker**:

```typescript
// lib/resilience/supabase-breaker.ts
const result = await withCircuitBreaker(
  async () => supabase.from("services").select("*"),
  async () => loadFromJSONFallback() // Optional fallback
)
```

**Environment Validation** (Zod):

```typescript
// lib/env.ts
CIRCUIT_BREAKER_ENABLED: z.string().transform(val => val !== 'false'),
CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.string().pipe(z.number().int().positive()),
NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING: z.string().transform(val => val === 'true'),
```

### Phase 2: Integration ✅

**Files Modified**:

- `lib/search/index.ts` - Performance tracking for search orchestration
- `lib/search/data.ts` - Circuit breaker + performance tracking for data loading
- `lib/services.ts` - Circuit breaker for service management (3 functions)
- `lib/analytics.ts` - Circuit breaker for analytics (2 functions, graceful degradation)
- `lib/offline/sync.ts` - Respects circuit breaker state
- `app/api/v1/search/services/route.ts` - Performance tracking for API
- `app/api/v1/health/route.ts` - NEW: Health check endpoint

**Files Created**:

- `lib/performance/tracker.ts` (120 lines)
- `lib/performance/metrics.ts` (235 lines)
- `lib/resilience/circuit-breaker.ts` (265 lines)
- `lib/resilience/supabase-breaker.ts` (115 lines)
- `lib/resilience/telemetry.ts` (130 lines)
- `app/api/v1/health/route.ts` (130 lines)

**Tests**:

- `tests/lib/performance/tracker.test.ts` (16 tests, 100% pass)
- `tests/lib/resilience/circuit-breaker.test.ts` (18 tests, 100% pass)

### Phase 3: Load Testing ✅

**k6 Infrastructure**:

- `tests/load/smoke-test.k6.js` - Basic connectivity (1 VU, 30s)
- `tests/load/search-api.k6.js` - Realistic load (10-50 VUs, ramp-up)
- `tests/load/sustained-load.k6.js` - Stability test (20 VUs, 30min)
- `tests/load/spike-test.k6.js` - Spike/stress test (0-100 VUs in 10s)

**Documentation**:

- `docs/testing/load-testing.md` - Comprehensive guide with thresholds

**npm Scripts**:

```bash
npm run test:load          # Main search API test
npm run test:load:smoke    # Quick connectivity check
npm run test:load:sustained # Long-running stability
npm run test:load:spike    # Spike/stress test
```

## Consequences

### Positive

**Performance Tracking**:

- ✅ **Visibility**: Clear metrics on operation latencies (p50, p95, p99)
- ✅ **Regression Detection**: Can establish baseline and catch degradation
- ✅ **Optimization Guidance**: Data-driven decisions on what to optimize
- ✅ **Minimal Overhead**: <1ms per operation, opt-in only
- ✅ **Development-Friendly**: Works locally without external services

**Circuit Breaker**:

- ✅ **Fast Failures**: Prevents 30s hangs during outages (fail in <1ms)
- ✅ **Graceful Degradation**: Automatic fallback to JSON in search
- ✅ **Automatic Recovery**: Self-healing via HALF_OPEN state
- ✅ **Resource Protection**: Prevents hammering failing endpoints
- ✅ **Observable**: State transitions logged for debugging

**Operational**:

- ✅ **Health Check**: New `/api/v1/health` endpoint for monitoring
- ✅ **Load Testing**: k6 scripts provide baseline metrics
- ✅ **Type Safety**: All env vars validated via Zod

### Negative

**Performance Tracking**:

- ⚠️ **Memory Usage**: In-memory metrics store (mitigated: max 1000 samples/operation, 10min retention, dev-only)
- ⚠️ **Per-Process State**: Metrics not shared across serverless instances (acceptable for dev/staging)
- ⚠️ **Manual Analysis**: No automatic alerting (future: integrate with Axiom/Sentry)

**Circuit Breaker**:

- ⚠️ **False Positives**: Could open on transient errors (mitigated: 50% failure rate threshold + 3 consecutive failures)
- ⚠️ **Per-Process State**: Each serverless instance has independent circuit state (acceptable trade-off)
- ⚠️ **Coordination Gap**: No distributed circuit state (future: could use Redis if needed)
- ⚠️ **Auth Implications**: Circuit breaker on auth queries could lock out users (mitigated: fail-closed security)

**Operational**:

- ⚠️ **Configuration Complexity**: 3 new environment variables to tune
- ⚠️ **Incomplete Rollout**: Only ~40% of Supabase calls protected initially (API routes need coverage)

### Neutral

- **k6 Dependency**: Adds load testing tool to dev dependencies (~50MB)
- **Code Complexity**: +1000 lines of code, but well-tested and isolated

## Alternatives Considered

### 1. Use Supabase Built-in Resilience

**Considered**: Rely on Supabase client library's retry/timeout mechanisms

**Rejected Because**:

- Supabase retries are for network failures, not database unavailability
- No configurable circuit breaker in Supabase client
- No fallback mechanism for read operations
- Doesn't prevent cascading failures

### 2. External APM Tool (Axiom, Datadog, New Relic)

**Considered**: Use external Application Performance Monitoring service

**Rejected Because**:

- Adds cost and external dependency
- Overkill for current scale
- Can be added later (performance tracking provides foundation)
- Our current logger already supports structured logging for future integration

**Future**: Once we have baseline metrics from our system, we can selectively send critical metrics to external APM

### 3. Redis-Based Circuit Breaker

**Considered**: Use Redis to share circuit breaker state across instances

**Rejected Because**:

- Adds infrastructure dependency (Redis)
- Overkill for current scale (serverless functions are short-lived)
- Per-instance circuit breaker is sufficient (fail-fast still works)
- Can be added later if coordination becomes critical

**Trade-off Accepted**: Each instance independently opens its circuit, but all instances benefit from fast failures

### 4. API Gateway Circuit Breaker (Vercel Edge Config)

**Considered**: Implement circuit breaker at API gateway level using Vercel Edge Config

**Rejected Because**:

- Tightly couples to Vercel platform
- Less flexible for fine-grained control
- Harder to test locally
- Our approach works everywhere (local, staging, any platform)

### 5. Prometheus + Grafana

**Considered**: Full metrics stack with time-series database

**Rejected Because**:

- Significant infrastructure overhead
- Overkill for current needs
- Can't run locally easily
- Our in-memory approach is sufficient for development

**Future**: Can export metrics to Prometheus if scale demands

## Configuration

### Environment Variables

**Added to `.env.example`**:

```bash
# Performance Tracking (v17.5+) - Development/Staging Only
NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING=false

# Circuit Breaker Configuration (v17.5+)
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=3     # Failures before opening
CIRCUIT_BREAKER_TIMEOUT=30000           # ms before retry (30s)
```

### Recommended Settings by Environment

**Development**:

```bash
NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING=true  # Enable metrics
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=3
CIRCUIT_BREAKER_TIMEOUT=30000
```

**Staging**:

```bash
NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING=true  # Enable metrics
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5           # Slightly higher threshold
CIRCUIT_BREAKER_TIMEOUT=60000                 # 1min timeout
```

**Production**:

```bash
NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING=false # Disable in-memory metrics
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=3
CIRCUIT_BREAKER_TIMEOUT=30000
```

## Monitoring and Observability

### Health Check Endpoint

**Endpoint**: `GET /api/v1/health`

**Response**:

```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2026-01-25T...",
  "version": "0.1.0",
  "checks": {
    "database": {
      "status": "up" | "down" | "degraded",
      "latencyMs": 45
    },
    "circuitBreaker": {
      "enabled": true,
      "state": "CLOSED" | "OPEN" | "HALF_OPEN",
      "stats": {
        "failureCount": 0,
        "successCount": 125,
        "failureRate": 0.0
      }
    },
    "performance": {  // Only when NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING=true
      "tracking": true,
      "metrics": { /* p50, p95, p99 for all operations */ }
    }
  }
}
```

**Status Codes**:

- `200`: Healthy or degraded
- `503`: Unhealthy (circuit open or database down)

### Log Events

**Circuit Breaker Events**:

```
[INFO] Circuit breaker 'supabase' state transition { from: 'CLOSED', to: 'OPEN', failureCount: 3 }
[WARN] Circuit breaker 'supabase' HALF-OPEN { nextAttemptTime: ... }
[INFO] Circuit breaker 'supabase' CLOSED { successCount: 1 }
```

**Performance Events** (when tracking enabled):

```
[INFO] Performance: search.total { operation: 'search.total', durationMs: 245.32, queryLength: 15 }
[INFO] Performance: search.dataLoad { operation: 'search.dataLoad', durationMs: 42.18, source: 'supabase' }
```

## Rollout Plan

### Phase 1: Core Infrastructure (Completed ✅)

- [x] Implement circuit breaker core
- [x] Implement performance tracking
- [x] Add environment variable validation
- [x] Write unit tests (34 tests)
- [x] Create load testing infrastructure

### Phase 2: Critical Path Integration (Completed ✅)

- [x] Protect search data loading
- [x] Protect service management functions
- [x] Protect analytics tracking
- [x] Add performance tracking to search
- [x] Add performance tracking to API routes
- [x] Create health check endpoint

### Phase 3: Complete Rollout (In Progress ⚠️)

- [ ] Protect remaining API routes (POST, PUT, DELETE endpoints)
- [ ] Protect authorization checks (consider trade-offs)
- [ ] Add authentication to health check endpoint
- [ ] Add `/api/v1/metrics` endpoint (dev/staging only)
- [ ] Write integration tests
- [ ] Update CLAUDE.md with usage patterns

### Phase 4: Validation & Monitoring (Pending)

- [ ] Run load tests and establish baseline metrics
- [ ] Monitor circuit breaker activations in staging
- [ ] Tune thresholds based on real-world data
- [ ] Document operational runbook
- [ ] Add alerting for circuit breaker open events

## Success Metrics

### Performance Tracking

**Goal**: Establish baseline performance metrics

- ✅ Track p50, p95, p99 latencies for search operations
- ⏳ Establish baseline: p95 < 800ms for search API
- ⏳ Detect 20%+ performance regressions
- ⏳ Guide optimization efforts with data

### Circuit Breaker

**Goal**: Improve resilience and user experience during outages

- ✅ Fast-fail in <1ms when circuit is open (vs 30s timeout)
- ⏳ Automatic recovery within 30s-1min of service restoration
- ⏳ Zero cascading failures during Supabase outages
- ⏳ Graceful degradation: Search falls back to JSON when DB unavailable

### Load Testing

**Goal**: Validate performance under load

- ✅ Infrastructure in place (k6 scripts)
- ⏳ Smoke test: 100% success rate, p95 < 1000ms
- ⏳ Search API test: <5% error rate, p95 < 800ms
- ⏳ Sustained test: Stable performance over 30min
- ⏳ Spike test: Graceful degradation, no crashes

## Future Work

### Short Term (v17.6)

1. **Complete Circuit Breaker Rollout**: Protect all API routes and critical operations
2. **Integration Tests**: Test circuit breaker with simulated database failures
3. **Operational Documentation**: Create runbook for circuit breaker incidents
4. **Baseline Metrics**: Run load tests and document baseline performance

### Medium Term (v18.0)

1. **External Monitoring Integration**: Send critical metrics to Axiom or Sentry
2. **Alerting**: Configure alerts for circuit breaker open events
3. **Metrics API**: Expose `/api/v1/metrics` endpoint for dashboards
4. **Dashboard**: Build internal performance dashboard

### Long Term (v19.0+)

1. **Distributed Circuit Breaker**: Use Redis for cross-instance coordination (if needed)
2. **Advanced Metrics**: Track business metrics (conversion rates, user journeys)
3. **Automatic Scaling**: Use performance metrics to trigger autoscaling
4. **AI-Powered Anomaly Detection**: Detect performance anomalies automatically

## References

- **Circuit Breaker Pattern**: [Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
- **Release It! (Michael Nygard)**: Patterns for production-ready software
- **k6 Load Testing**: [k6.io/docs](https://k6.io/docs/)
- **Supabase Resilience**: [Supabase Status](https://status.supabase.com/)
- **Related ADRs**:
  - ADR-010: PWA Offline Fallback and Caching
  - ADR-014: Database Index Optimization
  - ADR-015: Non-Blocking E2E Tests

## Appendix: Circuit Breaker State Machine

```
┌─────────┐
│ CLOSED  │ (Normal operation)
└─────────┘
     │
     │ Failure threshold exceeded (3 failures OR 50% error rate)
     ▼
┌─────────┐
│  OPEN   │ (Fast-fail, block requests)
└─────────┘
     │
     │ Timeout elapsed (30s default)
     ▼
┌─────────┐
│ HALF-   │ (Testing recovery)
│ OPEN    │
└─────────┘
     │
     ├─ Success ───> CLOSED (Recovery confirmed)
     │
     └─ Failure ───> OPEN (Still failing, retry later)
```

## Appendix: Performance Tracking Flow

```
User Request
    │
    ▼
┌─────────────────────────────────────┐
│ trackPerformance('operation') START │
│ • Record start time                 │
│ • Execute operation                 │
│ • Record end time                   │
│ • Calculate duration                │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ recordMetric()                      │
│ • Store in-memory (dev only)        │
│ • Log with structured data          │
│ • Prune old samples (>10min)        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ getMetrics()                        │
│ • Calculate p50, p95, p99           │
│ • Aggregate by operation            │
│ • Available via /api/v1/health      │
└─────────────────────────────────────┘
```
