# Runbook: SLO Violation

**Status:** Active
**Last Updated:** 2026-02-05
**Owner:** Platform Team
**Related Runbooks:** [Circuit Breaker Open](circuit-breaker-open.md), [High Error Rate](high-error-rate.md), [Slow Queries](slow-queries.md)

---

## Overview

This runbook provides response procedures for Service Level Objective (SLO) violations in HelpBridge.

**SLO Targets (PROVISIONAL):**

- **Uptime:** 99.5% (3h 36m downtime budget/month)
- **Latency:** p95 < 800ms
- **Error Budget:** 0.5% (derived from uptime)

> **Note:** Current SLO targets are PROVISIONAL (see `docs/planning/v18-0-phase-3-slo-decision-guide.md`). Adjust based on production data and business requirements.

---

## Severity Levels

| Severity     | Condition                                                   | Response Time | Impact                  |
| ------------ | ----------------------------------------------------------- | ------------- | ----------------------- |
| **Critical** | Uptime < 99.5%, Error budget exhausted, Latency p95 > 800ms | 15 minutes    | User-facing degradation |
| **Warning**  | Error budget >50% consumed                                  | 1 hour        | Potential future impact |

---

## Alert Types

### 1. Uptime SLO Violation

**Symptom:** Uptime drops below 99.5% target over 30-day window

**Possible Causes:**

- Circuit breaker frequently opening (database failures)
- Recurring health check failures
- Infrastructure outages
- Deployment issues

**Diagnosis:**

```bash
# Check circuit breaker state
curl https://your-domain.com/api/v1/health | jq '.checks.circuitBreaker'

# View observability dashboard
open https://your-domain.com/admin/observability

# Check recent uptime history
# (View SLO Compliance Card on dashboard)
```

**Resolution:**

1. **Identify Root Cause:**
   - Check circuit breaker status (see [Circuit Breaker Runbook](circuit-breaker-open.md))
   - Review recent deployments (rollback if necessary)
   - Check infrastructure status (Vercel, Supabase dashboards)

2. **Immediate Actions:**
   - If circuit breaker OPEN: Follow circuit breaker runbook
   - If deployment-related: Rollback to last known good version
   - If infrastructure issue: Contact provider support

3. **Mitigation:**
   - Enable fallback to local JSON data (automatic)
   - Increase circuit breaker failure threshold (temporary)
   - Scale database resources if capacity-related

4. **Recovery Validation:**
   - Monitor uptime trending back up
   - Confirm health checks passing consistently
   - Verify error budget stabilizing

**Prevention:**

- Improve database resilience (connection pooling, query optimization)
- Implement canary deployments
- Add pre-deployment smoke tests
- Set up infrastructure monitoring alerts

---

### 2. Error Budget Exhausted

**Symptom:** Error budget reaches 0% (all downtime allowance consumed)

**Possible Causes:**

- Multiple incidents in short time period
- Sustained degraded performance
- High error rate over extended period
- Cascading failures

**Diagnosis:**

```bash
# Check error budget status
curl https://your-domain.com/api/v1/health | jq '.checks.slo.errorBudget'

# Check recent incidents
# (View dashboard for circuit breaker history, error rate trends)

# Calculate burn rate
# Error budget consumed / days elapsed = daily burn rate
```

**Resolution:**

1. **Freeze Non-Critical Changes:**
   - Pause feature deployments
   - Only deploy critical fixes
   - Increase code review rigor

2. **Stabilization Actions:**
   - Investigate recent errors (check logs, Axiom)
   - Fix highest-impact bugs first
   - Increase monitoring sensitivity
   - Add extra validation before deploys

3. **Budget Recovery:**
   - Error budget resets over 30-day rolling window
   - Focus on incident prevention
   - Monitor daily burn rate
   - Wait for window to roll past incident dates

4. **Communicate:**
   - Notify stakeholders of change freeze
   - Update status page (if applicable)
   - Document incident timeline
   - Plan post-incident review

**Prevention:**

- Improve testing coverage (see `docs/development/testing-guidelines.md`)
- Add feature flags for gradual rollouts
- Implement automated rollback triggers
- Conduct pre-mortem planning for high-risk changes

---

### 3. Latency SLO Violation

**Symptom:** p95 latency exceeds 800ms target

**Possible Causes:**

- Database query performance degradation
- Increased traffic load
- Memory pressure (WebLLM)
- Network latency
- Embedding generation overhead

**Diagnosis:**

```bash
# Check current latency metrics
curl https://your-domain.com/api/v1/health | jq '.checks.performance.metrics'

# View latency trends on dashboard
open https://your-domain.com/admin/observability

# Run load test to reproduce
npm run test:load:smoke
```

**Resolution:**

1. **Identify Slow Operations:**
   - Check Performance Charts on dashboard (p50/p95/p99)
   - Review Axiom logs for slow queries
   - Profile search operations locally
   - Check database query performance

2. **Quick Wins:**
   - Restart server (clear in-memory caches)
   - Scale database compute (Supabase dashboard)
   - Disable WebLLM if memory-constrained
   - Enable aggressive caching

3. **Optimization:**
   - Optimize slow database queries (add indexes)
   - Reduce embedding dimensions (if applicable)
   - Implement request coalescing
   - Add API response caching

4. **Load Management:**
   - Review rate limits (increase if legitimate traffic)
   - Add request prioritization
   - Implement graceful degradation
   - Consider CDN for static assets

**Prevention:**

- Regular performance testing (see `npm run test:load`)
- Query performance monitoring
- Capacity planning based on growth trends
- Optimize hot paths proactively

---

## Response Checklist

### Initial Response (0-15 minutes)

- [ ] Acknowledge alert (Slack thread reply)
- [ ] Check dashboard: `/admin/observability`
- [ ] Identify violation type (uptime/error-budget/latency)
- [ ] Determine severity (critical/warning)
- [ ] Assess user impact (check support channels)

### Investigation (15-30 minutes)

- [ ] Review related runbooks
- [ ] Check circuit breaker state
- [ ] Review recent deployments
- [ ] Check infrastructure status
- [ ] Identify root cause

### Mitigation (30-60 minutes)

- [ ] Apply immediate fixes (rollback, scaling, etc.)
- [ ] Verify mitigation effectiveness
- [ ] Update stakeholders
- [ ] Document actions taken

### Recovery (1-4 hours)

- [ ] Monitor SLO trending back to compliance
- [ ] Confirm error budget stabilizing
- [ ] Remove temporary mitigations
- [ ] Close incident

### Post-Incident (1-7 days)

- [ ] Schedule post-incident review
- [ ] Document lessons learned
- [ ] Implement preventive measures
- [ ] Update runbooks if needed

---

## Escalation

### Level 1: On-Call Engineer

- Initial response and diagnosis
- Apply standard mitigations
- Follow runbook procedures

### Level 2: Platform Lead

- Escalate if:
  - Multiple SLOs violated simultaneously
  - Root cause unclear after 30 minutes
  - Standard mitigations ineffective
  - User impact significant

### Level 3: Infrastructure/Database Team

- Escalate if:
  - Database performance issues
  - Infrastructure-level problems
  - Requires provider support

---

## Metrics and Monitoring

**Dashboard Location:** `/admin/observability`

**Key Metrics:**

- Uptime percentage (30-day window)
- Error budget remaining (%)
- Latency p95 (ms)
- SLO compliance status

**Alert Throttling:**

- Uptime violation: 30 minutes
- Error budget exhausted: 1 hour
- Latency violation: 15 minutes

**Data Sources:**

- In-memory uptime tracking (30-day retention)
- Performance metrics (in-memory)
- Circuit breaker telemetry

---

## Related Documentation

- [SLO Decision Guide](../planning/v18-0-phase-3-slo-decision-guide.md)
- [Circuit Breaker Runbook](circuit-breaker-open.md)
- [High Error Rate Runbook](high-error-rate.md)
- [Slow Queries Runbook](slow-queries.md)
- [Observability Setup](../observability/alerting-setup.md)

---

## Configuration

**SLO Targets:** `lib/config/slo-targets.ts`
**Tracker Logic:** `lib/observability/slo-tracker.ts`
**Alert Integration:** `lib/integrations/slack.ts`
**Health Check:** `app/api/v1/health/route.ts`

---

## Notes

- **In-Memory Tracking:** Uptime data resets on server restart (rebuilds quickly)
- **Provisional Targets:** Review and adjust after 2-4 weeks of production data
- **30-Day Window:** SLOs use rolling 30-day window (not calendar month)
- **Alert Fatigue:** Throttling prevents spam during prolonged incidents

---

## Changelog

| Date       | Change          | Author        |
| ---------- | --------------- | ------------- |
| 2026-02-05 | Initial version | Platform Team |

---

**Questions?** Contact platform team or file issue in GitHub.
