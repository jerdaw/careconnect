# v18.0 Phase 2: Quick Start Guide

**Welcome to Phase 2: Production Monitoring Infrastructure**

This document provides a quick overview and links to all Phase 2 planning documents.

---

## 📚 Documentation Index

### Planning Documents

1. **[Implementation Plan](../implementation/v18-0-phase-2-implementation-plan.md)** - Detailed technical plan (70+ pages)
   - Complete task breakdown (4 tasks, 12 hours)
   - Code examples and file structure
   - Testing strategy
   - Success criteria

2. **[Executive Summary](v18-0-phase-2-executive-summary.md)** - High-level overview (10 pages)
   - Business value and impact
   - Strategic goals
   - Risk assessment
   - Key decisions

3. **[Visual Roadmap](v18-0-phase-2-visual-roadmap.md)** - Progress tracker
   - Task dependencies
   - Milestone tracking
   - Daily progress templates
   - Risk tracker

4. **[Phase 1 Completion](../implementation/v18-0-phase-1-COMPLETE.md)** - What was just finished
   - All 4 Phase 1 tasks complete
   - 540/540 tests passing
   - 100% circuit breaker coverage

---

## 🎯 Phase 2 At a Glance

### What You're Building

**Observability Infrastructure:**

- Persistent metrics storage (Axiom)
- Real-time admin dashboard (`/admin/observability`)
- Automated Slack alerts
- Operational runbooks

### Why It Matters

**Before Phase 2:**

- Resilient platform ✅
- Blind to production health ❌
- Reactive incident response ❌

**After Phase 2:**

- Resilient platform ✅
- Real-time visibility ✅
- Proactive alerting ✅

### Time Investment

- **Total:** 10-12 hours (2-3 days)
- **User Setup:** 15 minutes (Axiom, Slack, env vars)
- **Implementation:** 10 hours (Axiom, dashboard, alerts, runbooks)
- **Testing:** 2 hours (validation, documentation)

---

## 🚀 Quick Start (5 Minutes)

### 1. User Prerequisites (Before Implementation)

**Action 1: Create Axiom Account (5 min)**

1. Go to https://axiom.co
2. Sign up (free tier: 500GB/month)
3. Create dataset: `kingston-care-production`
4. Generate API token (Settings → API Tokens → Create)
5. Note your Organization ID (Settings → Organization)

**Action 2: Create Slack Webhook (5 min)**

1. Go to https://slack.com/apps/A0F7XDUAZ-incoming-webhooks
2. Click "Add to Slack"
3. Select channel (e.g., `#kingston-care-alerts`)
4. Copy webhook URL (starts with `https://hooks.slack.com/...`)

**Action 3: Generate Cron Secret (1 min)**

```bash
openssl rand -base64 32
```

**Action 4: Add Environment Variables**
Add to `.env.local`:

```bash
# Axiom Observability
AXIOM_TOKEN=xait-xxxx-xxxx-xxxx
AXIOM_ORG_ID=your-org-id
AXIOM_DATASET=kingston-care-production

# Slack Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/xxx

# Cron Authentication
CRON_SECRET=your-random-secret-here
```

---

### 2. Implementation Tasks

**Task 2.1: Axiom Integration (4 hours)**

- Install SDK: `npm install @axiomhq/js`
- Create `lib/observability/axiom.ts`
- Integrate with performance tracker
- Set up cron job
- See: [Implementation Plan § 2.1](../implementation/v18-0-phase-2-implementation-plan.md#task-21-integrate-axiom-for-persistent-metrics-4-hours)

**Task 2.2: Observability Dashboard (4 hours)**

- Create dashboard page: `app/[locale]/admin/observability/page.tsx`
- Build 4 components (CircuitBreakerCard, PerformanceCharts, etc.)
- Add auto-refresh
- See: [Implementation Plan § 2.2](../implementation/v18-0-phase-2-implementation-plan.md#task-22-create-observability-dashboard-4-hours)

**Task 2.3: Alerting (2 hours)**

- Create `lib/integrations/slack.ts`
- Integrate with circuit breaker telemetry
- Add alert throttling
- See: [Implementation Plan § 2.3](../implementation/v18-0-phase-2-implementation-plan.md#task-23-configure-alerting-2-hours)

**Task 2.4: Runbooks (2 hours)**

- Create 4 runbooks in `docs/runbooks/`
- Document incident procedures
- See: [Implementation Plan § 2.4](../implementation/v18-0-phase-2-implementation-plan.md#task-24-create-operational-runbooks-2-hours)

---

### 3. Validation

**After Each Task:**

```bash
npm run type-check  # Should pass
npm test -- --run   # Should pass (540/540)
npm run build       # Should succeed
```

**After Phase 2 Complete:**

1. Deploy to staging
2. Verify Axiom metrics appear
3. Test Slack alert (trigger circuit breaker)
4. Access dashboard at `/admin/observability`
5. Review runbooks for completeness

---

## 📊 Progress Tracking

### Daily Checklist

**Day 1: Axiom Integration**

- [ ] User setup complete (Axiom account, Slack webhook, env vars)
- [ ] Task 2.1.1: Install SDK and configure environment
- [ ] Task 2.1.2: Create Axiom integration module
- [ ] Task 2.1.3: Integrate with performance tracker
- [ ] Task 2.1.4: Integrate with circuit breaker
- [ ] Task 2.1.5: Create scheduled export job
- [ ] Task 2.1.6: Testing and validation
- [ ] **Milestone:** Metrics flowing to Axiom ✅

**Day 2: Dashboard**

- [ ] Task 2.2.1: Create dashboard page structure
- [ ] Task 2.2.2: Build dashboard components
- [ ] Task 2.2.3: Add auto-refresh
- [ ] Task 2.2.4: Testing and documentation
- [ ] **Milestone:** Dashboard operational ✅

**Day 3: Alerts & Runbooks**

- [ ] Task 2.3.1: Slack webhook integration
- [ ] Task 2.3.2: Integrate with circuit breaker
- [ ] Task 2.3.3: Alert throttling
- [ ] Task 2.3.4: Testing
- [ ] Task 2.4: Create 4 runbooks
- [ ] **Milestone:** Phase 2 complete ✅

---

## 🔍 Key Files Created

### New Modules

```
lib/
  observability/
    axiom.ts                    # Axiom client integration
    alert-throttle.ts           # Alert rate limiting
  integrations/
    slack.ts                    # Slack webhook client

app/
  api/
    cron/
      export-metrics/
        route.ts                # Scheduled metric export
  [locale]/
    admin/
      observability/
        page.tsx                # Dashboard page

components/
  observability/
    CircuitBreakerCard.tsx      # Circuit breaker status
    PerformanceCharts.tsx       # Performance metrics
    HealthSummary.tsx           # System health
    RefreshButton.tsx           # Manual refresh
```

### New Documentation

```
docs/
  observability/
    axiom-setup.md              # Axiom configuration guide
    dashboard-usage.md          # Dashboard user guide
    alerting-setup.md           # Alert configuration
  runbooks/
    circuit-breaker-open.md     # Incident response
    high-error-rate.md          # Error rate troubleshooting
    slow-queries.md             # Performance debugging
    README.md                   # Runbook index
```

### Modified Files

```
.env.example                    # Add Axiom, Slack, Cron env vars
lib/env.ts                      # Add env var validation
lib/performance/metrics.ts      # Add Axiom export
lib/resilience/telemetry.ts     # Add alert triggers
middleware.ts                   # Protect observability routes
vercel.json                     # Add cron schedule
CLAUDE.md                       # Update with observability section
```

---

## ❓ FAQ

### Q: Can I skip Phase 2 and go straight to production?

**A:** Not recommended. Phase 2 provides critical visibility into production health. Without it, you're flying blind.

**Risks without Phase 2:**

- Circuit breaker opens, nobody knows ❌
- Performance degradation goes unnoticed ❌
- No historical data for debugging ❌
- No incident response procedures ❌

---

### Q: What if I don't have a Slack workspace?

**A:** You can proceed with Phase 2 but skip Task 2.3 (Alerting). Alerts will be logged but not sent to Slack. Email alerts can be added later as an enhancement.

---

### Q: What if Axiom free tier is exceeded?

**A:** Very unlikely. Estimated usage: 5-10GB/month << 500GB free tier. If exceeded:

1. Alert triggers at 80% (400GB)
2. Upgrade to paid tier ($0.25/GB)
3. Reduce metric frequency (60s → 300s)

---

### Q: Can I use a different APM tool instead of Axiom?

**A:** Yes, but you'll need to modify the integration code. Axiom is recommended for:

- Free tier (500GB/month)
- Vercel-native integration
- Fast querying
- No operational overhead

Alternatives: Datadog ($$$), New Relic (complex), Prometheus (self-hosted burden).

---

### Q: How long does Phase 2 take?

**A:**

- **Optimistic:** 2 days (with parallelization)
- **Realistic:** 3 days (sequential implementation)
- **Conservative:** 4 days (with testing and validation)

**Target:** 3 days of focused development

---

## 🆘 Getting Help

### If You Get Stuck

**1. Check the Implementation Plan**

- Detailed code examples
- Step-by-step instructions
- Troubleshooting guides

**2. Review the Visual Roadmap**

- Task dependencies
- Progress tracker
- Common issues

**3. Consult the Executive Summary**

- High-level architecture
- Design decisions
- Risk mitigation

### Common Issues

**Issue: Axiom metrics not appearing**

- Check environment variables (AXIOM_TOKEN, AXIOM_ORG_ID)
- Verify dataset name matches (kingston-care-production)
- Check application logs for ingestion errors
- Verify cron job is executing (`/api/cron/export-metrics`)

**Issue: Slack alerts not sending**

- Check SLACK_WEBHOOK_URL is set
- Test webhook manually: `curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"test"}'`
- Verify channel permissions (webhook must have access)
- Check application logs for Slack API errors

**Issue: Dashboard not loading**

- Verify admin authentication is working
- Check middleware is protecting route
- Review browser console for errors
- Ensure performance tracking is enabled

---

## ✅ Success Checklist

### Phase 2 Complete When:

**Infrastructure:**

- [ ] Axiom SDK installed and configured
- [ ] Metrics batching every 60s (cron job)
- [ ] Circuit breaker events streaming to Axiom
- [ ] Dashboard accessible at `/admin/observability`
- [ ] Slack alerts configured and tested
- [ ] 4 operational runbooks published

**Quality:**

- [ ] All 540+ tests passing
- [ ] Type-check passing (0 errors)
- [ ] Build successful
- [ ] Manual testing complete

**Documentation:**

- [ ] Axiom setup guide created
- [ ] Dashboard usage guide created
- [ ] Alerting setup guide created
- [ ] 4 runbooks created and reviewed
- [ ] CLAUDE.md updated
- [ ] .env.example updated

**Validation:**

- [ ] Metrics appear in Axiom within 2 minutes
- [ ] Dashboard loads in <2s
- [ ] Circuit breaker alert received in Slack within 30s
- [ ] Alert throttling prevents spam
- [ ] Runbooks are actionable

---

## 🎯 Next Steps

### After Phase 2 Completion

**Immediate:**

1. Deploy to staging environment
2. Run full validation suite
3. Test alerts in production-like environment
4. Review runbooks with team

**Phase 3 (Next Batch):**

- Define SLOs (uptime, latency, error rate)
- Build SLO monitoring dashboard
- Deploy public status page (Upptime)
- **Estimated:** 4-6 hours

**Phase 4 (Final Batch):**

- Update CLAUDE.md with observability patterns
- Create production deployment checklist
- Document incident response plan
- **Estimated:** 2-4 hours

---

## 📅 Timeline

```
Week 1 (Phase 2):
  Mon: User setup + Task 2.1 (Axiom Integration)
  Tue: Task 2.2 (Dashboard)
  Wed: Task 2.3 (Alerts) + Task 2.4 (Runbooks)
  Thu: Testing and validation
  Fri: Deploy to staging

Week 2 (Phase 3):
  Mon-Tue: Define SLOs + Monitoring dashboard
  Wed: Public status page
  Thu-Fri: Testing and refinement

Week 3 (Phase 4):
  Mon: Update documentation
  Tue: Production deployment checklist
  Wed: Incident response plan
  Thu-Fri: Final validation and production launch

v18.0 Complete: 2026-02-26
```

---

## 📝 Notes

### Design Philosophy

**Phase 2 follows these principles:**

1. **Non-blocking:** Axiom failures don't crash the app
2. **Production-only:** Dev/staging use in-memory metrics
3. **Fail-safe:** Alert throttling prevents spam
4. **Simple:** Minimal dependencies, clear architecture

### Trade-offs

**Chosen:** Axiom (free tier, managed)
**Alternative:** Self-hosted Prometheus
**Rationale:** Operational simplicity >> cost savings (free tier)

**Chosen:** Cron (60s batching)
**Alternative:** Real-time streaming
**Rationale:** 60s latency acceptable, simpler implementation

**Chosen:** Internal dashboard
**Alternative:** External Grafana
**Rationale:** Fast, customizable, no external dependency

---

**Document Version:** 1.0
**Last Updated:** 2026-01-30
**Status:** READY FOR IMPLEMENTATION

**Get Started:** Read the [Implementation Plan](../implementation/v18-0-phase-2-implementation-plan.md)
