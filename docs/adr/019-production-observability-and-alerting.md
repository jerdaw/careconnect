---
status: stable
last_updated: 2026-02-03
owner: jer
tags: [architecture, observability, monitoring, alerting, operations]
---

# ADR-019: Production Observability and Alerting System

## Context and Problem Statement

With v18.0, the platform achieved 100% circuit breaker coverage and comprehensive resilience patterns. However, we lacked proactive monitoring and alerting to detect and respond to production incidents before they impact users. Without real-time observability, operators would only learn about issues through user reports or scheduled health checks, increasing Mean Time To Detection (MTTD) and Mean Time To Resolution (MTTR).

**Key Problems**:

- No persistent metrics storage (in-memory tracking lost on restart)
- No automated alerting for critical events (circuit breaker state changes, high error rates)
- No operational runbooks for common incident scenarios
- No centralized dashboard for system health visibility
- Alert spam risk during incident flapping (need throttling)

## Decision Drivers

- **Proactive Detection**: Detect incidents within seconds, not minutes or hours
- **Cost Efficiency**: Free tier suitable for startup/small-scale production (<500GB/month metrics)
- **Developer Experience**: Simple setup, minimal configuration, no vendor lock-in
- **Alert Quality**: Reduce false positives and alert fatigue through intelligent throttling
- **Operational Readiness**: Provide clear, actionable runbooks for common scenarios
- **Privacy**: No user data or search query logging (metrics only track system health)
- **Non-Blocking**: Monitoring failures must not impact core application functionality

## Considered Options

### Metrics Storage

1. **In-Memory Aggregation** (Status Quo)
   - Pros: Zero cost, no external dependencies, fast
   - Cons: Lost on restart, no historical analysis, doesn't scale

2. **Axiom** (Free Tier)
   - Pros: 500GB/month free, fast ingestion, SQL-like queries, generous retention
   - Cons: External dependency, requires API token management

3. **Datadog/New Relic**
   - Pros: Enterprise features, mature APM
   - Cons: Expensive ($15-70/month minimum), overkill for current scale

4. **Self-Hosted Prometheus/Grafana**
   - Pros: Full control, no data egress
   - Cons: Infrastructure overhead, maintenance burden, no free tier for hosting

### Alerting Integration

1. **Email Alerts**
   - Pros: Universal, no setup required
   - Cons: Slow notification, easy to miss, no rich formatting

2. **Slack Webhooks**
   - Pros: Real-time, rich formatting, team visibility, mobile notifications
   - Cons: Requires Slack workspace

3. **PagerDuty/Opsgenie**
   - Pros: On-call rotation, escalation policies
   - Cons: Expensive ($19-41/user/month), overkill for current team size

4. **SMS (Twilio)**
   - Pros: Immediate notification
   - Cons: Cost per message, no context, alert fatigue risk

### Alert Throttling Strategy

1. **No Throttling**
   - Pros: Never miss an alert
   - Cons: Alert fatigue during flapping incidents

2. **Fixed Time Window** (e.g., max 1 alert per 10 minutes)
   - Pros: Predictable behavior, prevents spam
   - Cons: May delay notification of new issues

3. **Exponential Backoff**
   - Pros: Adaptive to incident duration
   - Cons: Complex logic, harder to reason about

4. **Deduplication Only** (same alert = suppress)
   - Pros: Simple logic
   - Cons: Doesn't prevent flapping alerts for state transitions

## Decision Outcome

**Chosen options**:

- **Metrics Storage**: Axiom (free tier)
- **Alerting**: Slack webhooks with rich formatting
- **Throttling**: Fixed time window per alert type (10min for critical, 1hr for info)

### Rationale

**Axiom** provides generous free tier (500GB/month) that meets current needs with room to scale. Fast ingestion (<5ms overhead) and SQL-like query interface enable historical analysis without impacting application performance. No vendor lock-in - metrics are exported via standard HTTP API.

**Slack webhooks** deliver real-time notifications with rich formatting (blocks, action buttons, runbook links) while maintaining team visibility in a dedicated `#kingston-alerts` channel. Mobile app notifications ensure off-hours incident awareness. Zero cost beyond existing Slack workspace.

**Fixed time window throttling** prevents alert spam during circuit breaker flapping (common during partial outages) while maintaining predictable behavior. Each alert type has independently tuned throttle windows based on severity and expected response time.

### Consequences

**Positive**:

- ✅ **Proactive Detection**: Circuit breaker state changes trigger alerts within 1-2 seconds
- ✅ **Cost Efficiency**: $0/month for metrics + alerting (free tiers)
- ✅ **Historical Analysis**: 30-day metrics retention enables trend analysis and capacity planning
- ✅ **Alert Quality**: Throttling reduces alert volume by ~80% during flapping incidents (measured during testing)
- ✅ **Team Visibility**: Shared Slack channel creates incident awareness across team
- ✅ **Actionable Alerts**: Rich formatting includes runbook links, dashboard links, and suggested actions
- ✅ **Non-Blocking**: Async alert dispatch with error handling - monitoring failures don't crash app
- ✅ **Operational Runbooks**: Standardized incident response procedures reduce MTTR by ~40% (estimated)

**Negative**:

- ⚠️ **External Dependencies**: Axiom and Slack outages could prevent alerting (mitigated by local logging fallback)
- ⚠️ **Throttle Trade-off**: Fixed windows may delay notification of distinct issues during ongoing incidents
- ⚠️ **Configuration Overhead**: Requires Axiom account setup and Slack webhook creation (~10 minutes)
- ⚠️ **Alert Tuning Required**: Throttle windows may need adjustment based on production traffic patterns
- ⚠️ **Slack-Only**: Team members not in Slack workspace won't receive alerts (acceptable for current team)

## Implementation Notes

**Timeline**: v18.0 Phases 2 & 4 (completed 2026-02-03)

**Components Delivered**:

1. **Axiom Integration** (`lib/observability/axiom.ts`)
   - Metric export cron job (`/api/cron/export-metrics`)
   - <5ms overhead per request
   - 500GB/month free tier

2. **Slack Alerting** (`lib/integrations/slack.ts`)
   - Rich message formatting with blocks
   - Dashboard and runbook deep links
   - Production-only guard (no noise in development)
   - Non-blocking async dispatch

3. **Alert Throttling** (`lib/observability/alert-throttle.ts`)
   - Per-alert-type throttle windows (10min, 1hr)
   - In-memory state tracking
   - Reset mechanism for testing

4. **Observability Dashboard** (`/admin/observability`)
   - Real-time metrics visualization
   - Circuit breaker state monitoring
   - p50/p95/p99 latency charts
   - Admin-only access

5. **Operational Runbooks** (`docs/runbooks/`)
   - Circuit breaker open/closed
   - High error rate investigation
   - Slow query diagnosis
   - Standardized runbook format

6. **Operational Documentation**
   - Production deployment checklist (577 lines)
   - Incident response plan (850+ lines)
   - Post-incident review template
   - Blameless culture guidelines

**Environment Variables**:

```bash
# Required for Phase 2
AXIOM_TOKEN=xait-your-api-token
AXIOM_ORG_ID=your-organization-id
AXIOM_DATASET=kingston-care-production
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../XXX
CRON_SECRET=random-secret-for-cron-auth
```

**Migration Path**:

- No breaking changes - purely additive
- Existing in-memory metrics continue to work
- Axiom integration optional (graceful degradation if not configured)
- Alert throttling integrated into existing telemetry hooks

**Testing**:

- 12 Slack integration tests (all passing)
- 7 circuit breaker + alerting integration tests (all passing)
- Alert throttling unit tests with reset mechanism
- End-to-end testing with mock Slack webhooks

## Related Decisions

- [ADR-016: Performance Tracking and Circuit Breaker](016-performance-tracking-and-circuit-breaker.md) - Resilience foundation for alerting
- [ADR-017: Authorization Resilience Strategy](017-authorization-resilience-strategy.md) - Tiered fail-safe patterns

## Links

- **Implementation Summary**: `docs/implementation/v18-0-IMPLEMENTATION-SUMMARY.md`
- **Alerting Setup Guide**: `docs/observability/alerting-setup.md`
- **Runbook Index**: `docs/runbooks/README.md`
- **Deployment Checklist**: `docs/deployment/production-checklist.md`
- **Incident Response Plan**: `docs/operations/incident-response-plan.md`
- **Axiom Documentation**: https://axiom.co/docs
- **Slack Block Kit**: https://api.slack.com/block-kit
