# v18.0 Phase 2 Completion: Quick Start Guide

**Batch:** Tasks 2.3 & 2.4 (Alerting + Runbooks)
**Duration:** 4 hours (0.5 days)
**Status:** READY FOR IMPLEMENTATION
**Date:** 2026-01-30

---

## What's Being Built

This batch completes Phase 2 of v18.0 Production Observability by adding:

1. **Proactive Alerting** (Task 2.3 - 2 hours)
   - Slack notifications when critical events occur
   - Alert throttling to prevent spam
   - Circuit breaker integration

2. **Operational Runbooks** (Task 2.4 - 2 hours)
   - Step-by-step incident response guides
   - 3 core runbooks (circuit breaker, errors, slow queries)
   - Runbook index and escalation procedures

**Result:** Platform transforms from passive monitoring to active incident detection and guided response.

---

## Prerequisites (5 Minutes)

### User Action Required: Create Slack Webhook

**Before starting implementation**, create a Slack incoming webhook:

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: `Kingston Care Alerts`, select your workspace
4. Click "Incoming Webhooks" → Toggle ON
5. Click "Add New Webhook to Workspace"
6. Select channel: `#kingston-alerts` (create if needed)
7. Copy webhook URL (starts with `https://hooks.slack.com/services/...`)

**Add to `.env.local`:**

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Already have from Task 2.1:**

- ✅ Axiom account and API token
- ✅ Cron secret
- ✅ Circuit breaker system
- ✅ Observability dashboard

---

## Implementation Plan

### Task 2.3: Configure Alerting (2 hours)

**What:** Send Slack alerts when circuit breaker opens or errors spike.

**Deliverables:**

- `lib/integrations/slack.ts` - Slack webhook client
- `lib/observability/alert-throttle.ts` - Prevent alert spam
- Modified: `lib/resilience/telemetry.ts` - Add alert triggers
- `docs/observability/alerting-setup.md` - User guide
- Unit tests for all new code

**Subtasks:**

1. Create Slack integration module (45 min)
2. Integrate with circuit breaker (30 min)
3. Implement alert throttling (15 min)
4. Testing & documentation (30 min)

**Validation:**

- [ ] Trigger circuit breaker manually
- [ ] Verify Slack alert received within 30s
- [ ] Second alert within 10min is throttled
- [ ] All tests passing

---

### Task 2.4: Operational Runbooks (2 hours)

**What:** Write step-by-step troubleshooting guides for common incidents.

**Deliverables:**

- `docs/runbooks/circuit-breaker-open.md` - Critical incident guide
- `docs/runbooks/high-error-rate.md` - Warning alert guide
- `docs/runbooks/slow-queries.md` - Performance guide
- `docs/runbooks/README.md` - Index and incident response process

**Subtasks:**

1. Circuit breaker runbook (45 min)
2. High error rate runbook (30 min)
3. Slow queries runbook (30 min)
4. Runbook index (15 min)

**Validation:**

- [ ] All runbooks follow template structure
- [ ] Links verified (dashboard, Axiom, Supabase)
- [ ] Peer review by non-author
- [ ] Runbooks tested in staging

---

## Quick Start

### Option A: Single 4-Hour Block (Recommended)

Perfect for focused implementation session:

```
Hour 1: Slack integration + circuit breaker alerts
Hour 2: Alert throttling + testing + docs
Hour 3: Write all 3 runbooks
Hour 4: Runbook index + validation
```

### Option B: Two 2-Hour Blocks

Split across 2 days if time-constrained:

**Day 1:** Task 2.3 (Alerting)

- Hour 1: Slack integration
- Hour 2: Throttling + testing

**Day 2:** Task 2.4 (Runbooks)

- Hour 1: Write 3 runbooks
- Hour 2: Index + validation

---

## Success Checklist

**After 4 hours, you should have:**

- [x] Slack alerts configured and tested
- [x] Circuit breaker triggers Slack within 30s
- [x] Alert throttling prevents spam (10min window)
- [x] 3 operational runbooks published
- [x] Runbook index created
- [x] All tests passing (540+)
- [x] Type-check passing
- [x] Production build succeeds
- [x] Documentation complete

**Phase 2 Status:** 100% ✅ COMPLETE

---

## File Checklist

**New Files (10 total):**

- [ ] `lib/integrations/slack.ts` (200 lines)
- [ ] `lib/observability/alert-throttle.ts` (120 lines)
- [ ] `docs/observability/alerting-setup.md` (200 lines)
- [ ] `docs/runbooks/README.md` (250 lines)
- [ ] `docs/runbooks/circuit-breaker-open.md` (400 lines)
- [ ] `docs/runbooks/high-error-rate.md` (250 lines)
- [ ] `docs/runbooks/slow-queries.md` (300 lines)
- [ ] `tests/lib/integrations/slack.test.ts` (100 lines)
- [ ] `tests/lib/observability/alert-throttle.test.ts` (150 lines)
- [ ] `tests/integration/alerting.test.ts` (100 lines)

**Modified Files (1 total):**

- [ ] `lib/resilience/telemetry.ts` (add Slack alert dispatch)

**Total New Code:** ~2000 lines (code + docs + tests)

---

## Testing Commands

```bash
# Type checking
npm run type-check

# Unit tests
npm test -- slack.test.ts
npm test -- alert-throttle.test.ts

# Integration test
npm test -- alerting.test.ts

# All tests
npm test -- --run

# Production build
npm run build

# Manual Slack test (after webhook setup)
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "🧪 Test alert from HelpBridge"}'
```

---

## Deployment Steps

### 1. Deploy to Staging

```bash
# Deploy preview
vercel

# Test alerting in staging
# (Trigger circuit breaker manually)

# Verify Slack alert received
```

### 2. Deploy to Production

```bash
# Add Slack webhook to Vercel env
vercel env add SLACK_WEBHOOK_URL

# Deploy to production
vercel --prod

# Monitor for 1 hour
# - Check dashboard
# - Watch Slack for alerts
# - Review Axiom logs
```

### 3. Validate

```bash
# Health check
curl https://yourdomain.com/api/v1/health

# View dashboard
open https://yourdomain.com/admin/observability

# Check Axiom
open https://app.axiom.co
```

---

## Rollback Plan

If deployment causes issues:

```bash
# List deployments
vercel deployments list --prod

# Rollback to previous
vercel rollback <PREVIOUS_DEPLOYMENT_URL>

# Verify
curl https://yourdomain.com/api/v1/health
```

**Rollback time:** <5 minutes

---

## Post-Completion

### Update Documentation

- [ ] Update `CLAUDE.md` with alerting section
- [ ] Update `docs/planning/roadmap.md` (mark Phase 2 complete)
- [ ] Update `docs/planning/v18-0-phase-2-visual-roadmap.md` (100%)

### Announce Completion

- [ ] Post in team Slack: "Phase 2 complete! Alerting + runbooks live."
- [ ] Schedule Phase 3 kickoff meeting
- [ ] Create Phase 2 retrospective document

### Knowledge Transfer

- [ ] Demo observability dashboard to team
- [ ] Walk through runbook usage
- [ ] Review incident response process
- [ ] Add team members to `#kingston-alerts` channel

---

## What's Next: Phase 3

**Phase 3: Service Level Objectives (4-6 hours)**

After 1-2 weeks of production data collection:

- Define SLOs (uptime, latency, error rate)
- Create SLO monitoring dashboard
- Set up public status page (Upptime)
- Configure SLO alerting (budget burn alerts)

**Estimated Start:** 2 weeks from now (after baseline metrics gathered)

---

## Need Help?

**Documentation:**

- **Full Plan:** `docs/implementation/v18-0-phase-2-tasks-3-4-implementation-plan.md`
- **Visual Roadmap:** `docs/planning/v18-0-phase-2-visual-roadmap.md`
- **Task 2.1 Summary:** `docs/implementation/v18-0-task-2-1-completion-summary.md`
- **Task 2.2 Summary:** `docs/implementation/v18-0-task-2-2-completion-summary.md`

**Tools:**

- Axiom: https://app.axiom.co
- Slack API: https://api.slack.com/apps
- Vercel: https://vercel.com/dashboard

**Common Issues:**

- **Slack webhook not working:** Check URL format, verify channel permissions
- **Alerts not sending:** Verify `NODE_ENV=production`
- **Tests failing:** Check mocks, verify circuit breaker state
- **Build errors:** Run `npm run type-check` first

---

**Ready to start?** Follow the detailed implementation plan in `v18-0-phase-2-tasks-3-4-implementation-plan.md`.

**Time estimate:** 4 hours total
**Difficulty:** Medium (mostly documentation, some integration code)
**Impact:** HIGH (proactive incident detection + guided response)

Let's complete Phase 2! 🚀
