# v18.0 Phase 2 Completion: Alerting & Runbooks - Implementation Plan

**Version:** 18.0-Phase-2-Final
**Date:** 2026-01-30
**Status:** READY FOR IMPLEMENTATION
**Dependencies:** Tasks 2.1 and 2.2 Complete
**Estimated Effort:** 4 hours (0.5 days)
**Target Completion:** 2026-01-31

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Assessment](#current-state-assessment)
3. [Implementation Plan](#implementation-plan)
4. [Task 2.3: Configure Alerting](#task-23-configure-alerting)
5. [Task 2.4: Operational Runbooks](#task-24-operational-runbooks)
6. [Timeline & Milestones](#timeline--milestones)
7. [Rollout & Rollback Strategy](#rollout--rollback-strategy)
8. [Validation & Testing](#validation--testing)
9. [Dependencies & Risks](#dependencies--risks)
10. [Success Criteria](#success-criteria)

---

## Executive Summary

### Purpose

Complete Phase 2 of v18.0 Production Observability by adding **proactive alerting** and **operational runbooks** to the existing monitoring infrastructure. This transforms the platform from passive monitoring (dashboard) to active incident detection and response.

### Current State (Phase 2 Progress: 67%)

**Completed (8 hours):**

- ✅ **Task 2.1:** Axiom integration for persistent metrics storage
- ✅ **Task 2.2:** Observability dashboard at `/admin/observability`

**Remaining (4 hours):**

- ⏳ **Task 2.3:** Configure Alerting (Slack notifications) - 2 hours
- ⏳ **Task 2.4:** Operational Runbooks (incident response guides) - 2 hours

**Infrastructure Available:**

- Axiom SDK installed and configured (`lib/observability/axiom.ts`)
- Circuit breaker telemetry system (`lib/resilience/telemetry.ts`)
- Slack webhook environment variable defined (`SLACK_WEBHOOK_URL`)
- Rate limiting infrastructure (`lib/rate-limit.ts`)
- Structured logging system (`lib/logger.ts`)
- Admin observability dashboard with real-time metrics
- Cron job for hourly metric exports

### Key Unknowns & Assumptions

**Unknowns:**

1. **Alert volume in production** - Unknown how frequently circuit breaker will open under real load
2. **Slack workspace configuration** - User may need to create webhook (5 min setup)
3. **On-call rotation** - Unknown if user has team or is solo operator
4. **Escalation paths** - Unknown if alerts should escalate beyond Slack
5. **Alert threshold tuning** - May need adjustment after first week of production

**Assumptions:**

1. **Alerting Channel:** Slack is acceptable (free tier, immediate notifications)
2. **Alert Volume:** <10 alerts per day under normal conditions
3. **Response Time:** User can respond to alerts within 15 minutes during business hours
4. **Team Size:** Solo developer or small team (runbooks should be self-service)
5. **Budget:** Free-tier Slack (webhook limits: unlimited messages)
6. **Deployment:** Vercel with edge runtime (alerts via serverless functions)

**Constraints:**

1. **No PagerDuty/Opsgenie:** Free-tier only (Slack webhooks)
2. **No phone alerts:** Slack-only notifications
3. **No escalation chains:** Single-tier alerting
4. **No alert routing:** All alerts to same Slack channel
5. **No historical alert analysis:** Alerts are ephemeral in Slack (Axiom has event log)

### Goal

Transform the platform from **reactive monitoring** (user checks dashboard) to **proactive alerting** (platform notifies user of issues) plus **guided incident response** (runbooks for troubleshooting).

**Success Metrics:**

- Circuit breaker opens trigger Slack alert within **30 seconds**
- Alerts are actionable (link to dashboard + runbook)
- Alert fatigue avoided (throttling prevents spam)
- Runbooks enable non-expert troubleshooting (clear steps)
- Mean-Time-To-Recovery (MTTR) reduced by **50%**

---

## Current State Assessment

### Infrastructure Audit

**What's Already Built:**

1. **Telemetry System** (`lib/resilience/telemetry.ts`)
   - Circuit breaker event logging with 8 event types
   - Structured event data with metadata
   - Axiom integration for production events
   - Severity-based logging (error/warn/info)

2. **Observability Integration** (`lib/observability/axiom.ts`)
   - Singleton Axiom client (production-only)
   - Event ingestion functions:
     - `sendPerformanceMetrics()`
     - `sendCircuitBreakerEvent()`
     - `sendHealthCheck()`
     - `sendApiError()`
   - Error-resilient design (non-blocking)

3. **Rate Limiting** (`lib/rate-limit.ts`)
   - Dual-mode: Redis (production) + in-memory (dev)
   - Sliding window algorithm
   - Per-IP tracking
   - Configurable limits

4. **Environment Configuration** (`lib/env.ts`, `.env.example`)
   - `SLACK_WEBHOOK_URL` defined but unused
   - Zod validation for all integration variables
   - Production-only guards

5. **Logging Infrastructure** (`lib/logger.ts`)
   - Structured metadata support
   - Error ID generation
   - Production JSON logging

**What's Missing:**

1. **Slack Integration Module**
   - ❌ No `lib/integrations/slack.ts` (webhook client)
   - ❌ No message formatting/templating
   - ❌ No error handling for failed sends

2. **Alert Triggering Logic**
   - ❌ No integration with circuit breaker events
   - ❌ No threshold definitions (when to alert)
   - ❌ No alert context (dashboard links, runbook links)

3. **Alert Throttling**
   - ❌ No deduplication logic
   - ❌ No rate limiting for alerts (prevent spam)
   - ❌ No alert cooldown periods

4. **Operational Runbooks**
   - ❌ No circuit breaker troubleshooting guide
   - ❌ No high error rate runbook
   - ❌ No slow query runbook
   - ❌ No runbook index

### Existing Patterns to Leverage

**1. Non-Blocking External Calls Pattern:**

```typescript
// From lib/observability/axiom.ts
if (process.env.NODE_ENV === "production") {
  void import("@/lib/observability/axiom").then(({ sendEvent }) => {
    void sendEvent(data)
  })
}
```

**Rationale:** Alert dispatch shouldn't block application logic.

**2. Production Guard Pattern:**

```typescript
if (process.env.NODE_ENV !== "production") {
  return // No-op in development
}
```

**Rationale:** Alerts are production-only (avoid spam in dev).

**3. Error-Resilient Design:**

```typescript
try {
  await externalService()
} catch (error) {
  logger.warn("External service failed", { error })
  // Continue execution - don't throw
}
```

**Rationale:** Failed alerts shouldn't crash the app.

**4. Rate Limiting with Fallback:**

```typescript
const { success } = await rateLimit({
  key: identifier,
  limit: 10,
  window: "10m",
})

if (!success) {
  return // Silently skip (don't throw)
}
```

**Rationale:** Alert throttling prevents spam.

### Documentation Structure

**Existing Runbook Format** (`docs/runbooks/pwa-testing.md`):

```markdown
# Runbook Title

## Overview

Brief description of the scenario.

## Symptoms

How you know this issue is occurring.

## Diagnosis Steps

1. Check X
2. Verify Y
3. Examine Z

## Resolution

- Quick fix (if available)
- Long-term solution

## Escalation

When to escalate and to whom.

## Related Resources

Links to docs, dashboards, code.
```

**Incident Response Template** (`docs/security/breach-response-plan.md`):

- 4-phase response model
- Checklist format
- Role assignments
- Communication templates

**User Setup Guide Format** (`docs/observability/USER-SETUP-REQUIRED.md`):

- Step-by-step with screenshots
- Time estimates per step
- Verification tests
- Troubleshooting section

### Codebase Conventions

**File Organization:**

- Integrations: `lib/integrations/` (e.g., `slack.ts`)
- Observability: `lib/observability/` (e.g., `alert-throttle.ts`)
- Documentation: `docs/runbooks/`, `docs/observability/`

**Naming Conventions:**

- Functions: camelCase (`sendSlackAlert`)
- Types: PascalCase (`SlackMessage`)
- Constants: UPPER_SNAKE_CASE (`ALERT_COOLDOWN_MS`)
- Files: kebab-case (`alert-throttle.ts`)

**Error Handling:**

- Always wrap external calls in try/catch
- Log errors with structured metadata
- Don't throw for non-critical failures
- Return success/failure indicators

**Testing Requirements:**

- Unit tests for all new logic
- Mock external services (Slack API)
- Test throttling edge cases
- Integration test for alert flow

---

## Implementation Plan

### Phase 2 Final Tasks (4 hours total)

**Goal:** Add proactive alerting and incident response documentation.

**Approach:** Incremental implementation with validation at each step.

**Deliverables:**

1. Slack integration module
2. Alert throttling system
3. Circuit breaker alert triggers
4. Three operational runbooks
5. Runbook index
6. User setup guide

---

## Task 2.3: Configure Alerting

**Objective:** Send Slack notifications when critical events occur (circuit breaker opens, high error rates).

**Priority:** HIGH
**Risk:** LOW (non-blocking feature, graceful degradation)
**Estimated Duration:** 2 hours
**Dependencies:** Task 2.1 (Axiom integration), Circuit breaker telemetry

---

### 2.3.1 Create Slack Integration Module (45 minutes)

**File:** `lib/integrations/slack.ts`

**Purpose:** Centralized Slack webhook client for sending alerts.

**Implementation Requirements:**

1. **Slack Message Interface:**

```typescript
export interface SlackMessage {
  text: string // Fallback text (required)
  blocks?: SlackBlock[] // Rich formatting (optional)
  attachments?: SlackAttachment[] // Additional context
}

export interface SlackBlock {
  type: "section" | "header" | "divider" | "actions"
  text?: {
    type: "mrkdwn" | "plain_text"
    text: string
  }
  fields?: Array<{
    type: "mrkdwn"
    text: string
  }>
}

export interface SlackAttachment {
  color: "danger" | "warning" | "good" | string
  fields: Array<{
    title: string
    value: string
    short: boolean
  }>
  footer?: string
  ts?: number // Timestamp
}
```

2. **Core Functions:**

```typescript
/**
 * Send a message to Slack webhook
 *
 * @param message - Slack message payload
 * @returns Promise<boolean> - Success/failure
 */
export async function sendSlackMessage(message: SlackMessage): Promise<boolean>

/**
 * Send circuit breaker alert to Slack
 *
 * @param event - Circuit breaker event data
 */
export async function sendCircuitBreakerAlert(event: {
  state: CircuitState
  previousState: CircuitState
  failureCount: number
  failureRate: number
  timestamp: number
}): Promise<void>

/**
 * Send high error rate alert to Slack
 *
 * @param errorRate - Current error rate percentage
 * @param threshold - Threshold that was exceeded
 */
export async function sendHighErrorRateAlert(errorRate: number, threshold: number): Promise<void>

/**
 * Format circuit breaker event as Slack message
 */
function formatCircuitBreakerMessage(event: CircuitBreakerEvent): SlackMessage
```

3. **Design Principles:**

- **Production-only:** No-op in development/staging
- **Non-blocking:** Use async without await in callers
- **Error-resilient:** Log failures but don't throw
- **Rate-aware:** Respect Slack API limits (1 msg/sec)
- **Rich formatting:** Use Slack blocks for readability

4. **Message Template Example:**

```typescript
{
  text: "🚨 Circuit Breaker OPEN - Database operations protected",
  blocks: [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🚨 Circuit Breaker Alert"
      }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*Status:*\nOPEN" },
        { type: "mrkdwn", text: "*Failure Rate:*\n75%" },
        { type: "mrkdwn", text: "*Failures:*\n5" },
        { type: "mrkdwn", text: "*Time:*\n2024-01-30 14:23:45 UTC" }
      ]
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Database operations are being protected. Check the dashboard for details."
      }
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View Dashboard" },
          url: "https://yourdomain.com/admin/observability"
        },
        {
          type: "button",
          text: { type: "plain_text", text: "View Runbook" },
          url: "https://github.com/yourrepo/docs/runbooks/circuit-breaker-open.md"
        }
      ]
    }
  ]
}
```

**Deliverables:**

- [ ] `lib/integrations/slack.ts` created (200 lines)
- [ ] Type definitions for Slack messages
- [ ] Error handling and logging
- [ ] Production-only guard
- [ ] Unit tests for message formatting

**Validation:**

```bash
npm run type-check
npm test -- slack.test.ts
```

---

### 2.3.2 Integrate Alerts with Circuit Breaker (30 minutes)

**File:** `lib/resilience/telemetry.ts` (modify existing)

**Purpose:** Trigger Slack alerts when circuit breaker state changes.

**Implementation:**

1. **Modify `createCircuitBreakerTelemetry()` factory:**

```typescript
import type { CircuitState } from "./circuit-breaker"

export function createCircuitBreakerTelemetry(circuitName: string) {
  return {
    reportOpened: async (failureCount: number, failureRate: number) => {
      // Existing logging
      logger.error(`Circuit breaker '${circuitName}' OPENED`, {
        failureCount,
        failureRate,
        component: "circuit-breaker",
      })

      // Existing Axiom integration
      if (process.env.NODE_ENV === "production") {
        void import("@/lib/observability/axiom").then(({ sendCircuitBreakerEvent }) => {
          void sendCircuitBreakerEvent({
            state: CircuitState.OPEN,
            previousState: CircuitState.CLOSED,
            failureCount,
            successCount: 0,
            failureRate,
            timestamp: Date.now(),
          })
        })

        // NEW: Send Slack alert
        void import("@/lib/integrations/slack").then(({ sendCircuitBreakerAlert }) => {
          void sendCircuitBreakerAlert({
            state: CircuitState.OPEN,
            previousState: CircuitState.CLOSED,
            failureCount,
            failureRate,
            timestamp: Date.now(),
          })
        })
      }
    },

    reportClosed: async () => {
      // Existing logging
      logger.info(`Circuit breaker '${circuitName}' CLOSED (recovered)`, {
        component: "circuit-breaker",
      })

      // Existing Axiom integration
      // ... (no change)

      // NEW: Send recovery Slack alert (optional - may be noisy)
      if (process.env.NODE_ENV === "production") {
        void import("@/lib/integrations/slack").then(({ sendCircuitBreakerAlert }) => {
          void sendCircuitBreakerAlert({
            state: CircuitState.CLOSED,
            previousState: CircuitState.OPEN,
            failureCount: 0,
            failureRate: 0,
            timestamp: Date.now(),
          })
        })
      }
    },

    reportHalfOpen: async () => {
      // Existing logging (no Slack alert - too noisy)
      logger.info(`Circuit breaker '${circuitName}' HALF_OPEN (testing recovery)`, {
        component: "circuit-breaker",
      })
    },

    // ... other methods unchanged
  }
}
```

2. **Alert Triggering Rules:**

| Event             | Alert Sent?        | Rationale                            |
| ----------------- | ------------------ | ------------------------------------ |
| Circuit OPEN      | ✅ Yes (critical)  | Immediate action needed              |
| Circuit CLOSED    | ⚠️ Optional (info) | Recovery confirmation (may be noisy) |
| Circuit HALF_OPEN | ❌ No              | Transient state (testing)            |
| High failure rate | ✅ Yes (warning)   | Early warning before circuit opens   |

**Deliverables:**

- [ ] Modified `lib/resilience/telemetry.ts`
- [ ] Slack alerts integrated with circuit breaker events
- [ ] Alert context includes timestamp, failure count, rate
- [ ] Non-blocking async dispatch
- [ ] Unit tests updated

**Validation:**

```bash
npm run type-check
npm test -- telemetry.test.ts
```

---

### 2.3.3 Implement Alert Throttling (15 minutes)

**File:** `lib/observability/alert-throttle.ts` (new)

**Purpose:** Prevent alert spam by rate-limiting alerts per event type.

**Implementation:**

```typescript
/**
 * Alert Throttling System
 *
 * Prevents alert fatigue by limiting alert frequency per event type.
 *
 * Strategy:
 * - Circuit OPEN: Max 1 alert per 10 minutes
 * - High error rate: Max 1 alert per 5 minutes
 * - Circuit CLOSED: Max 1 alert per hour (recovery confirmation)
 *
 * Uses in-memory store (serverless-safe, resets on redeploy).
 */

import { logger } from "@/lib/logger"

export type AlertType = "circuit-open" | "circuit-closed" | "high-error-rate"

interface AlertThrottle {
  lastSent: number // Timestamp of last alert
  count: number // Total alerts sent
}

// In-memory throttle store (per-instance)
const alertThrottles = new Map<AlertType, AlertThrottle>()

// Throttle windows (milliseconds)
const THROTTLE_WINDOWS: Record<AlertType, number> = {
  "circuit-open": 10 * 60 * 1000, // 10 minutes
  "circuit-closed": 60 * 60 * 1000, // 1 hour
  "high-error-rate": 5 * 60 * 1000, // 5 minutes
}

/**
 * Check if alert should be sent
 *
 * @param alertType - Type of alert
 * @returns true if alert should be sent, false if throttled
 */
export function shouldSendAlert(alertType: AlertType): boolean {
  const now = Date.now()
  const throttle = alertThrottles.get(alertType)
  const windowMs = THROTTLE_WINDOWS[alertType]

  // First alert of this type
  if (!throttle) {
    alertThrottles.set(alertType, { lastSent: now, count: 1 })
    return true
  }

  // Check if throttle window has passed
  const timeSinceLastAlert = now - throttle.lastSent

  if (timeSinceLastAlert >= windowMs) {
    // Window expired, allow alert
    throttle.lastSent = now
    throttle.count += 1
    logger.info("Alert throttle expired, sending alert", {
      alertType,
      timeSinceLastMs: timeSinceLastAlert,
      totalAlerts: throttle.count,
    })
    return true
  }

  // Still within throttle window, block alert
  logger.warn("Alert throttled (spam prevention)", {
    alertType,
    timeSinceLastMs: timeSinceLastAlert,
    windowMs,
    nextAllowedAt: new Date(throttle.lastSent + windowMs).toISOString(),
  })
  return false
}

/**
 * Reset throttle for a specific alert type (testing only)
 */
export function resetThrottle(alertType: AlertType): void {
  alertThrottles.delete(alertType)
  logger.info("Alert throttle reset", { alertType })
}

/**
 * Get throttle status for debugging
 */
export function getThrottleStatus(): Record<AlertType, AlertThrottle | null> {
  return {
    "circuit-open": alertThrottles.get("circuit-open") || null,
    "circuit-closed": alertThrottles.get("circuit-closed") || null,
    "high-error-rate": alertThrottles.get("high-error-rate") || null,
  }
}
```

**Integration with Slack Module:**

```typescript
// In lib/integrations/slack.ts
import { shouldSendAlert } from "@/lib/observability/alert-throttle"

export async function sendCircuitBreakerAlert(event: CircuitBreakerEvent) {
  const alertType = event.state === CircuitState.OPEN ? "circuit-open" : "circuit-closed"

  // Check throttle
  if (!shouldSendAlert(alertType)) {
    return // Alert suppressed by throttle
  }

  // Send alert
  const message = formatCircuitBreakerMessage(event)
  await sendSlackMessage(message)
}
```

**Deliverables:**

- [ ] `lib/observability/alert-throttle.ts` created (120 lines)
- [ ] Throttle logic for 3 alert types
- [ ] In-memory store (serverless-safe)
- [ ] Debug functions for testing
- [ ] Unit tests for throttle edge cases

**Validation:**

```bash
npm test -- alert-throttle.test.ts
# Test: First alert sends immediately
# Test: Second alert within window is blocked
# Test: Alert after window expiry is allowed
```

---

### 2.3.4 Testing & Documentation (30 minutes)

**Testing Checklist:**

1. **Unit Tests:**
   - [ ] `tests/lib/integrations/slack.test.ts`
     - Mock fetch for Slack API
     - Test message formatting
     - Test error handling (network failure)
     - Test production-only guard

   - [ ] `tests/lib/observability/alert-throttle.test.ts`
     - Test first alert allowed
     - Test second alert blocked
     - Test throttle window expiry
     - Test reset function

   - [ ] `tests/lib/resilience/telemetry.test.ts` (update existing)
     - Test Slack alert integration
     - Test non-blocking dispatch
     - Test production guard

2. **Integration Test:**
   - [ ] `tests/integration/alerting.test.ts`
     - Trigger circuit breaker open
     - Verify Slack alert dispatched (mock)
     - Verify throttle applied
     - Verify Axiom event logged

3. **Manual Testing (Post-Deployment):**
   - [ ] Trigger circuit breaker manually (force failures)
   - [ ] Verify Slack alert received within 30 seconds
   - [ ] Trigger second alert within 10 minutes
   - [ ] Verify second alert is throttled
   - [ ] Wait 10 minutes, trigger third alert
   - [ ] Verify third alert is sent

**Documentation:**

**File:** `docs/observability/alerting-setup.md`

**Content:**

````markdown
# Alerting Setup Guide

## Overview

HelpBridge sends Slack alerts for critical events:

- Circuit breaker opens (database protection activated)
- Circuit breaker closes (recovery confirmed)
- High error rates (early warning)

## Prerequisites

- Slack workspace with admin access
- 5 minutes for setup

## Setup Steps

### Step 1: Create Slack Incoming Webhook (3 minutes)

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: `Kingston Care Alerts`
4. Select your workspace
5. Click "Incoming Webhooks" in sidebar
6. Toggle "Activate Incoming Webhooks" to ON
7. Click "Add New Webhook to Workspace"
8. Select channel: `#kingston-alerts` (create if needed)
9. Click "Allow"
10. Copy webhook URL (starts with `https://hooks.slack.com/services/...`)

### Step 2: Add Webhook to Environment (1 minute)

**Local Development:**
Add to `.env.local`:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```
````

**Vercel Deployment:**

1. Go to Vercel dashboard → Project Settings → Environment Variables
2. Add variable:
   - Name: `SLACK_WEBHOOK_URL`
   - Value: Your webhook URL
   - Environment: Production
3. Click "Save"
4. Redeploy: `vercel --prod`

### Step 3: Test Alerting (1 minute)

**Option A: Trigger Circuit Breaker (Recommended)**

Use the admin dashboard to force a circuit breaker open:

1. Navigate to `/admin/observability`
2. (Future: Add "Test Alert" button)

**Option B: Manual API Test**

```bash
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "🧪 Test alert from HelpBridge",
    "blocks": [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "If you see this message, alerting is configured correctly!"
      }
    }]
  }'
```

**Expected Result:** Message appears in Slack channel within 5 seconds.

## Alert Types

### Circuit Breaker OPEN (Critical)

- **Frequency:** Max 1 per 10 minutes
- **Action:** Check dashboard, review runbook
- **Runbook:** [Circuit Breaker Open](../runbooks/circuit-breaker-open.md)

### Circuit Breaker CLOSED (Info)

- **Frequency:** Max 1 per hour
- **Action:** None (recovery confirmation)

### High Error Rate (Warning)

- **Frequency:** Max 1 per 5 minutes
- **Action:** Monitor dashboard, investigate if persistent

## Troubleshooting

### No alerts received

1. **Check webhook URL:**

   ```bash
   echo $SLACK_WEBHOOK_URL
   # Should start with https://hooks.slack.com/services/
   ```

2. **Check production environment:**
   Alerts only send in production (`NODE_ENV=production`).

3. **Check Slack channel:**
   Verify you're in the correct channel (`#kingston-alerts`).

4. **Check logs:**
   ```bash
   vercel logs --prod | grep "Slack alert"
   ```

### Alerts are duplicated

**Cause:** Throttling disabled or multiple instances.

**Fix:** Throttling is per-instance. In serverless, this is expected. Axiom logs have deduplication.

### Alerts are delayed

**Cause:** Serverless cold starts.

**Expected:** Alerts send within 30 seconds (usually <5s).

## Best Practices

1. **Don't disable throttling** - Prevents alert fatigue
2. **Create dedicated channel** - Don't mix with other alerts
3. **Add mobile notifications** - Enable push on Slack mobile
4. **Review weekly** - Check if thresholds need tuning

## Related Documentation

- [Observability Dashboard](./dashboard-usage.md)
- [Circuit Breaker Runbook](../runbooks/circuit-breaker-open.md)
- [Axiom Setup](./USER-SETUP-REQUIRED.md)

````

**Deliverables:**
- [ ] All unit tests passing
- [ ] Integration test passing
- [ ] `docs/observability/alerting-setup.md` created
- [ ] Updated `.env.example` with Slack webhook comment
- [ ] Manual testing checklist completed

**Validation:**
```bash
npm test -- --run
npm run type-check
npm run build
````

---

## Task 2.4: Operational Runbooks

**Objective:** Document step-by-step troubleshooting guides for common production incidents.

**Priority:** MEDIUM
**Risk:** NONE (documentation-only)
**Estimated Duration:** 2 hours
**Dependencies:** None (can be done in parallel with 2.3)

---

### 2.4.1 Circuit Breaker Open Runbook (45 minutes)

**File:** `docs/runbooks/circuit-breaker-open.md`

**Content:**

```markdown
# Runbook: Circuit Breaker Open

## Overview

**Severity:** 🔴 **CRITICAL**
**Impact:** Database operations are protected, some writes may fail
**MTTR:** 5-15 minutes (automatic recovery) or 2-30 minutes (manual intervention)

The circuit breaker has detected repeated failures to Supabase and entered OPEN state to prevent cascading failures. Database operations are fast-failing to protect the system.

---

## Symptoms

You'll know the circuit breaker is open when:

- ✅ **Slack alert:** "🚨 Circuit Breaker OPEN"
- ✅ **Dashboard:** Observability page shows circuit state = OPEN (red badge)
- ✅ **User impact:** Some operations may return errors (graceful degradation)
- ✅ **Logs:** `Circuit breaker 'supabase' OPENED` messages

**User Impact:**

- ✅ **Search:** Works (falls back to JSON files)
- ❌ **Service claims:** Fail (write operations blocked)
- ❌ **Service edits:** Fail (write operations blocked)
- ✅ **Service views:** Work (cached or fallback data)
- ✅ **Analytics:** Degraded (historical data unavailable)

---

## Immediate Actions (< 2 minutes)

### 1. Confirm Circuit State

Navigate to the observability dashboard:
```

https://yourdomain.com/admin/observability

```

**Check:**
- Circuit breaker card shows state: OPEN (red)
- Failure count > threshold (default: 3)
- Failure rate > 50%

### 2. Check Supabase Status

Open Supabase dashboard:
```

https://app.supabase.com/project/YOUR_PROJECT_ID

```

**Look for:**
- 🟢 **Status page:** All systems operational?
- ⚠️ **Incidents:** Any active incidents?
- 📊 **Database metrics:** CPU/Memory/Disk usage
- 🔌 **Connection count:** Near max connections?

---

## Diagnosis Steps

### Step 1: Identify Root Cause

**Check Axiom logs:**
```

https://app.axiom.co
Dataset: kingston-care-production
Query: event_type:circuit_breaker AND state:OPEN
Time range: Last 15 minutes

````

**Common Causes:**

| Symptom | Root Cause | Fix |
|---------|------------|-----|
| "Connection timeout" | Network issue | Wait for recovery (auto) |
| "Too many connections" | Connection pool exhausted | Restart Supabase (contact support) |
| "Read-only mode" | Database maintenance | Wait for maintenance window |
| "Auth failed" | Invalid credentials | Check environment variables |
| "Query timeout" | Slow query or table lock | Identify slow query, add index |

### Step 2: Check Recent Changes

**Review recent deployments:**
```bash
vercel deployments list --prod
# Look for deployments in last 30 minutes
````

**Questions:**

- Did you deploy new code recently?
- Did you change database schema?
- Did you update environment variables?
- Did traffic spike (marketing campaign)?

### Step 3: Check Performance Metrics

**In Observability Dashboard:**

- Check "Top Operations" for abnormal latencies
- Look for p99 latency spikes (>1000ms)
- Check total operations count (traffic spike?)

**In Supabase:**

- Query: `SELECT * FROM pg_stat_activity WHERE state = 'active'`
- Look for long-running queries (>10s)

---

## Resolution

### Quick Fix (Automatic Recovery)

**Circuit breaker will auto-recover:**

- ⏰ **Timeout:** 30 seconds (default)
- 🔄 **Transition:** OPEN → HALF_OPEN (testing)
- ✅ **Success:** HALF_OPEN → CLOSED (1 successful request)
- ❌ **Failure:** HALF_OPEN → OPEN (retry in 30s)

**Timeline:**

```
T+0s:    Circuit opens (3 failures detected)
T+30s:   Circuit enters HALF_OPEN
T+30s:   Test request sent
T+31s:   ✅ Success → Circuit CLOSED
         ❌ Failure → Circuit OPEN, wait 30s, repeat
```

**Expected MTTR:** 30-60 seconds (if root cause self-healed).

---

### Manual Intervention

**When to intervene:**

- Circuit repeatedly opens after closing (flapping)
- Root cause is not self-healing (e.g., config error)
- User impact is severe (blocking critical operations)

**Options:**

#### Option 1: Force Close Circuit (Emergency Only)

**⚠️ WARNING:** Only use if you've confirmed database is healthy.

```typescript
// In Node.js REPL or API route
import { getSupabaseBreaker } from "@/lib/resilience/supabase-breaker"

const breaker = getSupabaseBreaker()
breaker.forceClose()
```

**When to use:**

- False positive (circuit opened due to transient blip)
- Database is confirmed healthy
- You need to unblock critical operations immediately

**Risks:**

- If database is actually unhealthy, may cause cascading failures
- Should only be used with monitoring

#### Option 2: Fix Root Cause

**Database connection issue:**

```bash
# Check Supabase connection string
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# Verify connectivity
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
```

**Slow query issue:**

```sql
-- Find slow queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - pg_stat_activity.query_start > interval '10 seconds'
ORDER BY duration DESC;

-- Kill slow query (if safe)
SELECT pg_terminate_backend(PID);
```

**Environment variable issue:**

```bash
# Redeploy with corrected env vars
vercel env pull
# Edit .env.local
vercel --prod
```

#### Option 3: Rollback Deployment

If recent deployment caused the issue:

```bash
# List recent deployments
vercel deployments list

# Rollback to previous stable version
vercel rollback DEPLOYMENT_URL
```

---

## Verification

After resolution, verify circuit health:

### 1. Check Dashboard

- Circuit state: CLOSED (green)
- Failure rate: <10%
- Recent operations: Latencies normal

### 2. Test Critical Path

```bash
# Test service search (read operation)
curl https://yourdomain.com/api/v1/services

# Test health check
curl https://yourdomain.com/api/v1/health

# Response should be 200 OK with status: "healthy"
```

### 3. Monitor for 15 Minutes

- Stay on dashboard
- Watch for re-opening (flapping)
- Check Slack for new alerts

---

## Escalation

### When to Escalate

- Circuit flaps (opens/closes >3 times in 10 minutes)
- Root cause unclear after 15 minutes of investigation
- User impact severe (customer complaints)
- Supabase status page shows incident

### Escalation Path

1. **Supabase Support:**
   - Email: support@supabase.com
   - Dashboard: Open support ticket
   - Include: Project ID, timestamp, error messages

2. **On-Call Engineer:**
   - (Future: Add PagerDuty integration)

3. **Incident Commander:**
   - (Future: Define IC role for major incidents)

---

## Prevention

### Short-Term (After Incident)

- [ ] Review logs to identify root cause
- [ ] Add monitoring for early warning signals
- [ ] Tune circuit breaker thresholds if needed
- [ ] Document incident in post-mortem

### Long-Term (System Hardening)

- [ ] Add database query performance monitoring
- [ ] Set up connection pool monitoring
- [ ] Configure database alerts (CPU, memory, connections)
- [ ] Add synthetic monitoring (uptime checks)
- [ ] Implement read replicas for redundancy

---

## Related Resources

- **Dashboard:** [/admin/observability](/admin/observability)
- **Axiom Logs:** [https://app.axiom.co](https://app.axiom.co)
- **Supabase Dashboard:** [https://app.supabase.com](https://app.supabase.com)
- **Circuit Breaker Code:** `lib/resilience/circuit-breaker.ts`
- **ADR:** [016-performance-tracking-and-circuit-breaker.md](../adr/016-performance-tracking-and-circuit-breaker.md)

---

**Last Updated:** 2026-01-30
**Reviewed By:** [Pending first production incident]
**Next Review:** After first circuit breaker incident or 2026-02-28

````

**Deliverables:**
- [ ] `docs/runbooks/circuit-breaker-open.md` created (400+ lines)
- [ ] Step-by-step diagnosis guide
- [ ] Resolution options with risk assessment
- [ ] Verification checklist
- [ ] Prevention recommendations

---

### 2.4.2 High Error Rate Runbook (30 minutes)

**File:** `docs/runbooks/high-error-rate.md`

**Content Structure:**

```markdown
# Runbook: High Error Rate

## Overview
**Severity:** 🟡 **WARNING**
**Impact:** User experience degraded, may escalate to critical
**MTTR:** 5-20 minutes

High error rate detected (>10% of requests failing). This is an early warning signal that may lead to circuit breaker opening if not addressed.

## Symptoms
- Slack alert: "⚠️ High Error Rate"
- Dashboard: Error rate >10% in Top Operations
- User reports: Occasional "Something went wrong" messages

## Immediate Actions (< 2 minutes)
1. Check observability dashboard
2. Identify failing operations (check Performance Charts)
3. Review recent deployments (last 30 min)

## Diagnosis Steps

### Step 1: Identify Failing Endpoints
**In Dashboard:**
- Look at "Top Operations" section
- Find operations with high failure counts
- Note error rate percentage

**In Axiom:**
````

event_type:api_error
| summarize count() by endpoint, status_code
| where count > 10
| sort by count desc

````

### Step 2: Classify Error Type

| Status Code | Type | Common Causes |
|-------------|------|---------------|
| 400 | Bad Request | Invalid input, schema changes |
| 401/403 | Auth Error | Token expiry, permission changes |
| 429 | Rate Limit | Traffic spike, DoS attack |
| 500 | Server Error | Code bug, database issue |
| 502/503 | Gateway Error | Vercel issue, cold start timeout |
| 504 | Timeout | Slow query, external API delay |

### Step 3: Check Root Cause

**For 4xx errors:**
- Recent schema changes?
- Client app updated?
- API contract broken?

**For 5xx errors:**
- Recent deployment?
- Database performance degraded?
- External service down?

**For timeouts:**
- Slow query introduced?
- Cold start issue (Vercel)?
- External API latency?

## Resolution

### Fix Deployment Issue
```bash
# Rollback bad deployment
vercel rollback PREV_DEPLOYMENT_URL

# Or hotfix and redeploy
git revert COMMIT_HASH
git push origin main
````

### Fix Database Performance

```sql
-- Find slow queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- >1s
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add missing index
CREATE INDEX CONCURRENTLY idx_name ON table(column);
```

### Fix Rate Limiting

```typescript
// Temporarily increase rate limit (if legitimate traffic)
// In lib/rate-limit.ts or affected API route
const { success } = await rateLimit({
  limit: 120, // Increase from 60
  window: "1m",
})
```

## Verification

- [ ] Error rate drops below 5%
- [ ] Dashboard shows green status
- [ ] No new Slack alerts for 15 minutes
- [ ] User reports stop

## Escalation

- If error rate >25%: CRITICAL (follow Circuit Breaker runbook)
- If cause unclear after 20 min: Escalate to senior engineer
- If external service outage: Monitor status page, communicate to users

## Prevention

- Add integration tests for error scenarios
- Set up API contract testing
- Monitor database query performance
- Configure alerting for slow queries

## Related Resources

- [Circuit Breaker Runbook](./circuit-breaker-open.md)
- [Slow Query Runbook](./slow-queries.md)
- Dashboard: /admin/observability

````

**Deliverables:**
- [ ] `docs/runbooks/high-error-rate.md` created (250+ lines)

---

### 2.4.3 Slow Query Performance Runbook (30 minutes)

**File:** `docs/runbooks/slow-queries.md`

**Content Structure:**

```markdown
# Runbook: Slow Query Performance

## Overview
**Severity:** 🟡 **WARNING**
**Impact:** User experience degraded (slow page loads)
**MTTR:** 10-30 minutes

Performance metrics show high p95/p99 latencies (>1000ms) for database operations.

## Symptoms
- Dashboard: p99 latency >1000ms in Top Operations
- User reports: "Page is slow to load"
- No circuit breaker alert (operations succeeding but slow)

## Immediate Actions
1. Check Dashboard "Top Operations"
2. Identify operations with p99 >500ms
3. Check Supabase performance metrics

## Diagnosis Steps

### Step 1: Identify Slow Operation
**In Dashboard:**
Note operation name with high latency, e.g.:
- `api.search.dbQuery` - p99: 2500ms
- `api.services.list` - p99: 1800ms

### Step 2: Find Slow Query

**In Supabase Dashboard:**
1. Navigate to Database → Query Performance
2. Sort by "Mean time" (descending)
3. Look for queries >100ms

**SQL Query:**
```sql
SELECT
  query,
  calls,
  mean_exec_time as avg_ms,
  max_exec_time as max_ms,
  stddev_exec_time as stddev_ms
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- >100ms
ORDER BY mean_exec_time DESC
LIMIT 20;
````

### Step 3: Analyze Query Plan

For the identified slow query:

```sql
EXPLAIN ANALYZE
[YOUR_SLOW_QUERY];
```

**Look for:**

- **Seq Scan:** Full table scan (needs index)
- **High cost:** Cost >1000 indicates expensive operation
- **Rows:** Actual rows >> estimated rows (outdated stats)

## Resolution

### Quick Fix: Add Index

**Identify missing index:**

```sql
-- Example: Search query scanning full table
EXPLAIN ANALYZE
SELECT * FROM services
WHERE organization_id = 'org-123';

-- If "Seq Scan" appears:
CREATE INDEX CONCURRENTLY idx_services_org_id
ON services(organization_id);
```

**Common indexes:**

```sql
-- Foreign keys
CREATE INDEX CONCURRENTLY idx_services_org_id ON services(organization_id);
CREATE INDEX CONCURRENTLY idx_feedback_service_id ON feedback(service_id);

-- Frequently filtered columns
CREATE INDEX CONCURRENTLY idx_services_verification_level
ON services(verification_level);

-- Composite indexes for multi-column WHERE clauses
CREATE INDEX CONCURRENTLY idx_services_org_verification
ON services(organization_id, verification_level);

-- Text search (if using ILIKE)
CREATE INDEX CONCURRENTLY idx_services_name_trgm
ON services USING gin(name gin_trgm_ops);
```

**Note:** `CONCURRENTLY` allows index creation without locking table.

### Medium Fix: Optimize Query

**Before:**

```typescript
// N+1 query problem
const services = await supabase.from("services").select("*")
for (const service of services.data) {
  const org = await supabase.from("organizations").select("name").eq("id", service.organization_id).single()
  // ...
}
```

**After:**

```typescript
// Join in single query
const { data: services } = await supabase.from("services").select(`
    *,
    organization:organizations(name)
  `)
```

### Long-Term Fix: Query Caching

```typescript
// Add caching layer for read-heavy queries
import { unstable_cache } from "next/cache"

const getServices = unstable_cache(
  async () => {
    return await supabase.from("services").select("*")
  },
  ["services-list"],
  { revalidate: 300 } // 5 minutes
)
```

## Verification

- [ ] Run `EXPLAIN ANALYZE` again - cost reduced by >50%
- [ ] Dashboard shows p99 latency <500ms
- [ ] User reports confirm improved speed

## Escalation

- If query cannot be optimized: Consider denormalization
- If database CPU >80%: Upgrade Supabase plan
- If caching doesn't help: Consider read replicas

## Prevention

- Add database query performance monitoring
- Set alerts for queries >500ms
- Review query plans before deploying schema changes
- Use Supabase query analyzer regularly

## Related Resources

- [Database Index Optimization ADR](../adr/014-database-index-optimization.md)
- PostgreSQL: [EXPLAIN documentation](https://www.postgresql.org/docs/current/using-explain.html)
- Supabase: [Performance guide](https://supabase.com/docs/guides/database/performance)

````

**Deliverables:**
- [ ] `docs/runbooks/slow-queries.md` created (300+ lines)

---

### 2.4.4 Create Runbook Index (15 minutes)

**File:** `docs/runbooks/README.md`

**Content:**

```markdown
# Operational Runbooks

## Overview

This directory contains step-by-step troubleshooting guides (runbooks) for common production incidents in HelpBridge.

**Purpose:** Enable rapid incident response by providing clear, actionable steps for diagnosing and resolving issues.

**Audience:** On-call engineers, platform operators, DevOps team.

---

## Runbook Inventory

### Critical Incidents

| Runbook | Severity | MTTR | Description |
|---------|----------|------|-------------|
| [Circuit Breaker Open](./circuit-breaker-open.md) | 🔴 Critical | 5-15 min | Database operations protected due to failures |

### Warnings & Degraded Performance

| Runbook | Severity | MTTR | Description |
|---------|----------|------|-------------|
| [High Error Rate](./high-error-rate.md) | 🟡 Warning | 5-20 min | Error rate >10%, may escalate to critical |
| [Slow Queries](./slow-queries.md) | 🟡 Warning | 10-30 min | Database queries taking >1000ms |

### Operational Procedures

| Procedure | Type | Duration | Description |
|-----------|------|----------|-------------|
| [PWA Testing](./pwa-testing.md) | Testing | 15 min | Progressive Web App functionality verification |

---

## Quick Start

### During an Incident

1. **Check Alerts:**
   - Slack: `#kingston-alerts` channel
   - Dashboard: [/admin/observability](/admin/observability)

2. **Identify Incident Type:**
   - Circuit breaker open → [Circuit Breaker Runbook](./circuit-breaker-open.md)
   - High error rate → [High Error Rate Runbook](./high-error-rate.md)
   - Slow performance → [Slow Queries Runbook](./slow-queries.md)

3. **Follow Runbook Steps:**
   - Immediate Actions (< 2 min)
   - Diagnosis Steps
   - Resolution
   - Verification
   - Escalation (if needed)

4. **Document Incident:**
   - Create post-mortem (template: `docs/templates/post-mortem.md`)
   - Update runbook if gaps found

---

## Runbook Template

All runbooks follow this structure:

```markdown
# Runbook: [Incident Type]

## Overview
- Severity: 🔴 Critical / 🟡 Warning / 🟢 Info
- Impact: User-facing impact description
- MTTR: Mean time to recovery

## Symptoms
How to detect this issue.

## Immediate Actions (< 2 minutes)
Critical first steps.

## Diagnosis Steps
Systematic troubleshooting.

## Resolution
Step-by-step fixes.

## Verification
How to confirm issue is resolved.

## Escalation
When and how to escalate.

## Prevention
How to prevent recurrence.

## Related Resources
Links to docs, dashboards, code.
````

---

## Alert → Runbook Mapping

| Alert Type              | Runbook                                           |
| ----------------------- | ------------------------------------------------- |
| 🚨 Circuit Breaker OPEN | [Circuit Breaker Open](./circuit-breaker-open.md) |
| ⚠️ High Error Rate      | [High Error Rate](./high-error-rate.md)           |
| ⚠️ Slow Query Detected  | [Slow Queries](./slow-queries.md)                 |

---

## On-Call Resources

### Dashboards

- **Observability:** [/admin/observability](/admin/observability)
- **Axiom Logs:** [https://app.axiom.co](https://app.axiom.co)
- **Supabase:** [https://app.supabase.com](https://app.supabase.com)
- **Vercel:** [https://vercel.com/dashboard](https://vercel.com/dashboard)

### Access Requirements

- Admin role in HelpBridge
- Axiom account access
- Supabase project collaborator
- Vercel team member
- Slack `#kingston-alerts` channel member

### Communication Channels

- **Slack:** `#kingston-alerts` (automated alerts)
- **Slack:** `#kingston-incidents` (incident coordination)
- **Email:** alerts@kingstoncare.example.com (backup)

---

## Incident Response Process

### Severity Levels

| Level           | Response Time | Examples                                            |
| --------------- | ------------- | --------------------------------------------------- |
| 🔴 **Critical** | <15 min       | Circuit breaker open, complete outage, data breach  |
| 🟡 **Warning**  | <1 hour       | High error rate, slow queries, degraded performance |
| 🟢 **Info**     | <4 hours      | Recovery notifications, maintenance windows         |

### Escalation Matrix

```
Level 1: On-Call Engineer (You)
   ↓ (if unresolved after 30 min OR severity escalates)
Level 2: Senior Engineer / Team Lead
   ↓ (if unresolved after 1 hour OR major incident)
Level 3: Incident Commander + CTO
   ↓ (if PR impact OR security incident)
Level 4: External Support (Supabase, Vercel)
```

---

## Post-Incident Process

After resolving an incident:

1. **Document Timeline:**
   - Detection time
   - Response time
   - Resolution time
   - Total downtime

2. **Write Post-Mortem:**
   - What happened?
   - Root cause analysis
   - What went well?
   - What could improve?
   - Action items

3. **Update Runbooks:**
   - Add missing steps
   - Clarify confusing sections
   - Add new prevention measures

4. **Share Learnings:**
   - Team meeting discussion
   - Update training materials
   - External status page update (if public impact)

---

## Continuous Improvement

### Monthly Review

- [ ] Review all incidents from past month
- [ ] Identify patterns (recurring issues)
- [ ] Measure MTTR trends (improving?)
- [ ] Update runbooks based on learnings
- [ ] Add new runbooks for new incident types

### Quarterly Audit

- [ ] Test runbooks in staging environment
- [ ] Verify all links and commands still work
- [ ] Update screenshots if UI changed
- [ ] Peer review by someone who hasn't used runbook before
- [ ] Conduct incident response drill

---

## Contributing

### Adding a New Runbook

1. Copy template from `docs/templates/runbook-template.md`
2. Fill in all sections
3. Test steps in staging environment
4. Peer review
5. Add to this index
6. Update alert mappings

### Updating Existing Runbook

1. Make changes based on incident learnings
2. Add "Last Updated" date
3. Increment review count
4. Notify team in `#kingston-ops`

---

## Related Documentation

- **Security:** [Breach Response Plan](../security/breach-response-plan.md)
- **Observability:** [Dashboard Usage](../observability/dashboard-usage.md)
- **Observability:** [Alerting Setup](../observability/alerting-setup.md)
- **Architecture:** [ADR-016 Performance Tracking](../adr/016-performance-tracking-and-circuit-breaker.md)

---

**Runbook Count:** 4
**Last Updated:** 2026-01-30
**Maintained By:** Platform Team
**Next Audit:** 2026-04-30

```

**Deliverables:**
- [ ] `docs/runbooks/README.md` created (250+ lines)
- [ ] Index of all runbooks
- [ ] Alert → Runbook mapping
- [ ] Incident response process
- [ ] Escalation matrix
- [ ] Contribution guidelines

---

## Timeline & Milestones

### Overall Timeline: 4 hours (0.5 days)

**Can be completed in single session** or split into two 2-hour blocks.

---

### Milestone 1: Alerting Functional (2 hours)

**End of Task 2.3**

```

[████████████████████] 50% complete (2 of 4 hours)

Success Criteria:
✅ Slack integration module created
✅ Alert throttling implemented
✅ Circuit breaker alerts integrated
✅ Unit tests passing
✅ Documentation complete
✅ Manual test: Alert sends to Slack

Validation:

- Trigger circuit breaker manually
- Verify Slack alert received within 30s
- Verify second alert within 10min is throttled
- All tests passing (npm test)

```

**Deliverables:**
- `lib/integrations/slack.ts` (200 lines)
- `lib/observability/alert-throttle.ts` (120 lines)
- Modified: `lib/resilience/telemetry.ts`
- `docs/observability/alerting-setup.md` (200 lines)
- Unit tests: `tests/lib/integrations/slack.test.ts`
- Unit tests: `tests/lib/observability/alert-throttle.test.ts`

---

### Milestone 2: Phase 2 Complete (4 hours total)

**End of Task 2.4**

```

[████████████████████] 100% complete (4 of 4 hours)

Success Criteria:
✅ 3 operational runbooks published
✅ Runbook index created
✅ All runbooks peer-reviewed
✅ Alert → Runbook mapping complete
✅ Incident response process documented
✅ Phase 2 retrospective complete

Validation:

- All runbooks accessible in docs/runbooks/
- README.md index complete
- Links verified (no 404s)
- Runbooks tested in staging

```

**Deliverables:**
- `docs/runbooks/circuit-breaker-open.md` (400 lines)
- `docs/runbooks/high-error-rate.md` (250 lines)
- `docs/runbooks/slow-queries.md` (300 lines)
- `docs/runbooks/README.md` (250 lines)
- **Total:** 1200+ lines of operational documentation

---

### Detailed Schedule

**Option A: Single 4-Hour Block (Recommended)**

```

Hour 1 (0:00-1:00): Task 2.3.1 + 2.3.2
├─ 0:00-0:45: Create Slack integration module
├─ 0:45-1:00: Integrate with circuit breaker
└─ Deliverable: lib/integrations/slack.ts

Hour 2 (1:00-2:00): Task 2.3.3 + 2.3.4
├─ 1:00-1:15: Implement alert throttling
├─ 1:15-1:45: Write unit tests
├─ 1:45-2:00: Write alerting documentation
└─ Deliverable: Alerting complete, tested

Hour 3 (2:00-3:00): Task 2.4.1 + 2.4.2
├─ 2:00-2:45: Circuit breaker runbook
├─ 2:45-3:00: High error rate runbook
└─ Deliverable: 2 runbooks published

Hour 4 (3:00-4:00): Task 2.4.3 + 2.4.4 + Validation
├─ 3:00-3:30: Slow queries runbook
├─ 3:30-3:45: Runbook index (README)
├─ 3:45-4:00: Final validation + documentation
└─ Deliverable: Phase 2 complete

```

**Option B: Two 2-Hour Blocks (If Time-Constrained)**

```

Block 1 (Day 1): Task 2.3 - Alerting
├─ Hour 1: Slack integration + circuit breaker alerts
├─ Hour 2: Alert throttling + testing + docs
└─ Checkpoint: Alerting functional

Block 2 (Day 2): Task 2.4 - Runbooks
├─ Hour 1: Write all 3 runbooks
├─ Hour 2: Create index + validate + final review
└─ Checkpoint: Phase 2 complete

````

---

## Rollout & Rollback Strategy

### Rollout Plan

**Phase 2 Completion uses Incremental Rollout:**

#### Stage 1: Development Testing (Local)

**Environment:** Local dev machine (`npm run dev`)

**Activities:**
1. Run all unit tests
2. Test Slack integration with test webhook
3. Trigger circuit breaker manually
4. Verify alerts send to test Slack channel
5. Verify throttling works

**Validation:**
```bash
npm run type-check  # 0 errors
npm test -- --run   # All tests passing
npm run build       # Build succeeds
````

**Duration:** 15 minutes

---

#### Stage 2: Staging Deployment (Preview)

**Environment:** Vercel preview deployment

**Activities:**

1. Deploy to preview environment
2. Configure test Slack webhook (separate channel)
3. Run integration tests
4. Manually trigger alerts
5. Verify Axiom event logging
6. Load test with k6 (trigger circuit breaker under load)

**Validation:**

```bash
# Deploy preview
vercel --prod=false

# Run integration tests against preview
NEXT_PUBLIC_API_URL=https://preview-url.vercel.app npm run test:e2e

# Load test
npm run test:load:spike  # Should trigger circuit breaker
```

**Duration:** 30 minutes

---

#### Stage 3: Production Deployment (Canary)

**Environment:** Vercel production

**Strategy:** Gradual rollout with monitoring.

**Steps:**

1. **Deploy to Production:**

   ```bash
   vercel --prod
   ```

2. **Monitor for 1 Hour (Canary Period):**
   - Watch observability dashboard
   - Check Slack for alerts
   - Review Axiom logs for errors
   - Monitor Vercel function logs

3. **Validation Checklist:**
   - [ ] No unexpected errors in logs
   - [ ] Circuit breaker still functioning
   - [ ] Dashboard loading correctly
   - [ ] No user-facing regressions
   - [ ] Slack webhook connectivity confirmed

4. **Announce Completion:**
   - Update team in Slack
   - Mark Phase 2 as complete in roadmap
   - Schedule Phase 3 kickoff

**Duration:** 1 hour monitoring + validation

---

### Rollback Strategy

**Rollback Triggers:**

- Production errors >5% after deployment
- Circuit breaker flapping (>3 open/close cycles in 10 min)
- Slack alerts spamming (>10 alerts in 1 min)
- Dashboard not loading
- Critical functionality broken

**Rollback Procedure:**

```bash
# Step 1: Identify last stable deployment
vercel deployments list --prod

# Step 2: Rollback to previous version
vercel rollback <PREVIOUS_DEPLOYMENT_URL>

# Step 3: Verify rollback successful
curl https://yourdomain.com/api/v1/health
# Should return 200 OK

# Step 4: Notify team
# Post in #kingston-ops: "Rolled back Phase 2 deployment due to [REASON]"

# Step 5: Investigate issue
# Review Vercel logs, Axiom events, error messages
```

**Rollback Time:** <5 minutes

**Post-Rollback:**

1. Investigate root cause
2. Fix issue locally
3. Re-test in staging
4. Re-deploy with fix

---

### Feature Flags (Optional Enhancement)

**For safer rollouts, consider adding feature flag:**

```typescript
// lib/features.ts
export const FEATURES = {
  SLACK_ALERTS_ENABLED: process.env.FEATURE_SLACK_ALERTS === "true",
  ALERT_THROTTLING_ENABLED: process.env.FEATURE_ALERT_THROTTLING === "true",
}

// Usage in lib/integrations/slack.ts
if (!FEATURES.SLACK_ALERTS_ENABLED) {
  logger.info("Slack alerts disabled by feature flag")
  return
}
```

**Benefits:**

- Can disable alerting without redeployment
- Gradual rollout to subset of users
- A/B testing alert strategies

**Implementation:** 15 minutes (optional)

---

## Validation & Testing

### Unit Testing Strategy

**Test Coverage Requirements:**

- `lib/integrations/slack.ts`: 90% coverage
- `lib/observability/alert-throttle.ts`: 95% coverage
- Modified telemetry: Existing coverage maintained

---

#### Test File 1: `tests/lib/integrations/slack.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { sendSlackMessage, sendCircuitBreakerAlert } from "@/lib/integrations/slack"
import { CircuitState } from "@/lib/resilience/circuit-breaker"

// Mock fetch
global.fetch = vi.fn()

describe("Slack Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sends message to webhook URL", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response)

    const result = await sendSlackMessage({
      text: "Test message",
    })

    expect(result).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("hooks.slack.com"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("Test message"),
      })
    )
  })

  it("handles network errors gracefully", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"))

    const result = await sendSlackMessage({ text: "Test" })

    expect(result).toBe(false)
    // Should not throw
  })

  it("formats circuit breaker OPEN alert", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response)

    await sendCircuitBreakerAlert({
      state: CircuitState.OPEN,
      previousState: CircuitState.CLOSED,
      failureCount: 5,
      failureRate: 0.75,
      timestamp: Date.now(),
    })

    const call = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(call[1]?.body as string)

    expect(body.text).toContain("Circuit Breaker OPEN")
    expect(body.blocks).toBeDefined()
    expect(body.blocks[0].type).toBe("header")
  })

  it("no-ops in development", async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "development"

    await sendSlackMessage({ text: "Test" })

    expect(fetch).not.toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
  })
})
```

---

#### Test File 2: `tests/lib/observability/alert-throttle.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest"
import { shouldSendAlert, resetThrottle } from "@/lib/observability/alert-throttle"

describe("Alert Throttling", () => {
  beforeEach(() => {
    // Reset all throttles before each test
    resetThrottle("circuit-open")
    resetThrottle("circuit-closed")
    resetThrottle("high-error-rate")
    vi.useFakeTimers()
  })

  it("allows first alert immediately", () => {
    const result = shouldSendAlert("circuit-open")
    expect(result).toBe(true)
  })

  it("blocks second alert within throttle window", () => {
    shouldSendAlert("circuit-open") // First alert

    const result = shouldSendAlert("circuit-open") // Second alert (blocked)
    expect(result).toBe(false)
  })

  it("allows alert after throttle window expires", () => {
    shouldSendAlert("circuit-open") // First alert

    // Advance time by 10 minutes (throttle window)
    vi.advanceTimersByTime(10 * 60 * 1000)

    const result = shouldSendAlert("circuit-open") // Should be allowed
    expect(result).toBe(true)
  })

  it("uses different windows for different alert types", () => {
    shouldSendAlert("circuit-open") // 10min window
    shouldSendAlert("high-error-rate") // 5min window

    // Advance 6 minutes
    vi.advanceTimersByTime(6 * 60 * 1000)

    // circuit-open still throttled (10min window)
    expect(shouldSendAlert("circuit-open")).toBe(false)

    // high-error-rate allowed (5min window expired)
    expect(shouldSendAlert("high-error-rate")).toBe(true)
  })

  it("tracks alert count", () => {
    shouldSendAlert("circuit-open")

    vi.advanceTimersByTime(11 * 60 * 1000)
    shouldSendAlert("circuit-open")

    vi.advanceTimersByTime(11 * 60 * 1000)
    shouldSendAlert("circuit-open")

    const status = getThrottleStatus()
    expect(status["circuit-open"]?.count).toBe(3)
  })
})
```

---

### Integration Testing

**Test File:** `tests/integration/alerting.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { CircuitBreaker, CircuitState } from "@/lib/resilience/circuit-breaker"
import { createCircuitBreakerTelemetry } from "@/lib/resilience/telemetry"

describe("Alerting Integration", () => {
  let breaker: CircuitBreaker

  beforeEach(() => {
    breaker = new CircuitBreaker({
      name: "test-breaker",
      failureThreshold: 3,
      timeout: 1000,
    })
    vi.clearAllMocks()
  })

  it("sends Slack alert when circuit opens", async () => {
    // Mock Slack webhook
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    global.fetch = mockFetch

    // Trigger circuit breaker open
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("Simulated failure")
        })
      } catch {
        // Expected
      }
    }

    // Wait for async Slack call
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Verify Slack webhook was called
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("hooks.slack.com"), expect.any(Object))

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.text).toContain("Circuit Breaker")
    expect(body.text).toContain("OPEN")
  })

  it("throttles duplicate alerts", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    global.fetch = mockFetch

    // Trigger circuit open twice
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("Fail")
        })
      } catch {}
    }

    // Reset and open again immediately
    breaker.reset()
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("Fail")
        })
      } catch {}
    }

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Should only send 1 alert (second is throttled)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
```

---

### Manual Testing Checklist

**Pre-Deployment (Local/Staging):**

- [ ] **Slack Integration:**
  - [ ] Create test Slack webhook
  - [ ] Send test alert manually
  - [ ] Verify message appears in Slack
  - [ ] Verify message formatting (blocks, attachments)
  - [ ] Verify dashboard link in alert works
  - [ ] Verify runbook link in alert works

- [ ] **Alert Throttling:**
  - [ ] Trigger circuit breaker open
  - [ ] Verify first alert sends immediately
  - [ ] Trigger circuit breaker again within 10 min
  - [ ] Verify second alert is blocked
  - [ ] Wait 10 minutes, trigger again
  - [ ] Verify third alert is allowed

- [ ] **Circuit Breaker Integration:**
  - [ ] Open circuit manually (force 3 failures)
  - [ ] Verify Slack alert received within 30s
  - [ ] Verify alert contains correct failure count
  - [ ] Verify alert contains correct failure rate
  - [ ] Wait for auto-recovery (30s)
  - [ ] Verify recovery alert (if enabled)

**Post-Deployment (Production):**

- [ ] **Health Check:**
  - [ ] Dashboard accessible at `/admin/observability`
  - [ ] No errors in browser console
  - [ ] All metrics loading correctly
  - [ ] No regressions in existing features

- [ ] **Monitoring (First 24 Hours):**
  - [ ] Check Axiom for alert events
  - [ ] Monitor Slack for alerts (should be none if healthy)
  - [ ] Review Vercel function logs for errors
  - [ ] Verify no performance degradation

---

## Dependencies & Risks

### Dependencies

**External Services:**

1. **Slack Webhook:**
   - **Required:** Yes (for alerting)
   - **Setup Time:** 5 minutes
   - **Cost:** Free (unlimited webhooks)
   - **Risk:** LOW (webhook creation is straightforward)

2. **Axiom:**
   - **Required:** Yes (already set up in Task 2.1)
   - **Status:** ✅ Configured
   - **Risk:** NONE (already integrated)

**Internal Dependencies:**

1. **Circuit Breaker System:**
   - **Required:** Yes
   - **Status:** ✅ Implemented (Phase 1)
   - **Risk:** NONE

2. **Telemetry System:**
   - **Required:** Yes
   - **Status:** ✅ Implemented (Phase 1)
   - **Risk:** NONE

3. **Observability Dashboard:**
   - **Required:** Yes (for alert context links)
   - **Status:** ✅ Implemented (Task 2.2)
   - **Risk:** NONE

**Code Dependencies:**

1. **No new npm packages required**
   - Slack integration uses native `fetch`
   - Alert throttling uses in-memory Map
   - Risk: NONE

---

### Risks & Mitigation

#### Risk 1: Alert Spam (Probability: MEDIUM, Impact: MEDIUM)

**Scenario:** Circuit breaker flaps (opens/closes rapidly), sending too many alerts.

**Impact:**

- Alert fatigue
- Important alerts missed
- Slack channel becomes noisy

**Mitigation:**

1. ✅ **Alert throttling:** 10-minute cooldown for circuit open alerts
2. ✅ **Threshold tuning:** Circuit requires 3 consecutive failures or 50% error rate
3. ✅ **Dashboard visibility:** Can check status without waiting for alerts
4. ⚠️ **Monitoring:** Track alert frequency in Axiom, adjust thresholds if needed

**Residual Risk:** LOW (throttling should prevent spam)

---

#### Risk 2: False Positives (Probability: LOW, Impact: MEDIUM)

**Scenario:** Circuit breaker opens due to transient network blip, triggers alert unnecessarily.

**Impact:**

- Unnecessary wake-ups
- Time wasted investigating non-issues
- Reduced trust in alerts

**Mitigation:**

1. ✅ **Auto-recovery:** Circuit automatically tests recovery after 30s
2. ✅ **Threshold tuning:** Requires 3 failures (not just 1)
3. ✅ **Fallback support:** Read operations gracefully degrade (JSON fallback)
4. ⚠️ **Runbook guidance:** Runbook explains how to distinguish false positives

**Residual Risk:** MEDIUM (acceptable trade-off for proactive alerting)

---

#### Risk 3: Slack Webhook Failure (Probability: LOW, Impact: LOW)

**Scenario:** Slack webhook is down or returns error.

**Impact:**

- Alerts not received
- Incident detection delayed
- User relies on dashboard polling

**Mitigation:**

1. ✅ **Non-blocking:** Failed Slack calls don't crash app
2. ✅ **Logging:** Failed alerts logged to console + Axiom
3. ✅ **Dashboard visibility:** Observability dashboard shows issues independently
4. ⚠️ **Future:** Add email alerting as backup channel (Phase 3)

**Residual Risk:** LOW (dashboard provides backup visibility)

---

#### Risk 4: Runbook Staleness (Probability: MEDIUM, Impact: MEDIUM)

**Scenario:** Code changes make runbook steps outdated.

**Impact:**

- Incorrect troubleshooting steps
- Longer MTTR
- Confusion during incidents

**Mitigation:**

1. ✅ **Version tracking:** Runbooks include "Last Updated" date
2. ✅ **Quarterly review:** Scheduled runbook audits
3. ✅ **Post-incident updates:** Runbooks updated after each incident
4. ⚠️ **CI automation:** (Future) Validate runbook links in CI

**Residual Risk:** MEDIUM (requires ongoing maintenance)

---

#### Risk 5: Incomplete Runbook Coverage (Probability: MEDIUM, Impact: MEDIUM)

**Scenario:** Production incident occurs that's not covered by existing runbooks.

**Impact:**

- Slower response (no guided steps)
- Inconsistent troubleshooting
- Knowledge gaps exposed

**Mitigation:**

1. ✅ **Core scenarios covered:** Circuit breaker, errors, slow queries
2. ✅ **Extensible structure:** Runbook template provided
3. ✅ **Post-incident documentation:** New runbooks created after novel incidents
4. ⚠️ **Continuous expansion:** Add runbooks based on production learnings

**Residual Risk:** MEDIUM (initial set covers 80% of expected issues)

---

### Critical Path Analysis

**Blocking Dependencies:**

```
Slack Webhook Creation (user action, 5 min)
        ↓
Task 2.3.1: Slack Integration (45 min)
        ↓
Task 2.3.2: Circuit Breaker Alerts (30 min)
        ↓
Task 2.3.3: Alert Throttling (15 min)
        ↓
Task 2.3.4: Testing & Docs (30 min)
        ↓
        ├─────────────────────┐
        ↓                     ↓
Task 2.4.1-2.4.4       Validation (30 min)
(Can run in parallel)         ↓
        ↓              Phase 2 Complete ✅
```

**Critical Path:** 2.5 hours (if Slack webhook already created)

**Full Path:** 2.5 hours (Task 2.3) + 2 hours (Task 2.4) = **4.5 hours**

**Slack in Timeline:** Tasks 2.3 and 2.4 can partially overlap (documentation is independent).

---

## Success Criteria

### Technical Criteria

**Code Quality:**

- [ ] ✅ All unit tests passing (540+ tests)
- [ ] ✅ Type-check passing (0 errors)
- [ ] ✅ Production build succeeds
- [ ] ✅ ESLint warnings ≤ existing baseline
- [ ] ✅ No new console errors in browser
- [ ] ✅ No performance regressions

**Functionality:**

- [ ] ✅ Slack alerts send within 30 seconds of circuit breaker open
- [ ] ✅ Alert throttling blocks duplicate alerts
- [ ] ✅ Alerts contain dashboard link + runbook link
- [ ] ✅ Alerts are well-formatted (Slack blocks)
- [ ] ✅ Circuit breaker recovery works (auto + manual)
- [ ] ✅ Observability dashboard still functional

**Documentation:**

- [ ] ✅ 3 runbooks published (circuit breaker, errors, slow queries)
- [ ] ✅ Runbook index (README.md) complete
- [ ] ✅ Alerting setup guide published
- [ ] ✅ `.env.example` updated
- [ ] ✅ CLAUDE.md updated with alerting info

---

### Operational Criteria

**Incident Response:**

- [ ] ✅ MTTR reduced by 50% (estimated baseline: 30 min → 15 min)
- [ ] ✅ Runbooks enable self-service troubleshooting
- [ ] ✅ Alert → diagnosis → resolution flow is clear
- [ ] ✅ Escalation paths defined
- [ ] ✅ On-call resources documented

**Monitoring:**

- [ ] ✅ Alert frequency <10 per day (normal operations)
- [ ] ✅ Alert accuracy >90% (true positives)
- [ ] ✅ Alert fatigue avoided (no complaints from team)
- [ ] ✅ Dashboard used proactively (before alerts)

**Knowledge Transfer:**

- [ ] ✅ Team trained on runbook usage
- [ ] ✅ Incident response process understood
- [ ] ✅ Post-mortem template created
- [ ] ✅ Continuous improvement process defined

---

### Business Criteria

**Reliability:**

- [ ] ✅ Circuit breaker incidents detected within 1 minute
- [ ] ✅ Incident response time <15 minutes
- [ ] ✅ User-facing downtime minimized
- [ ] ✅ Service degradation handled gracefully

**Maintainability:**

- [ ] ✅ Runbooks easy to follow (tested by non-author)
- [ ] ✅ Alerting system requires minimal maintenance
- [ ] ✅ Documentation stays up-to-date (review schedule defined)
- [ ] ✅ New team members can use runbooks effectively

**Scalability:**

- [ ] ✅ Alerting system supports expected traffic growth (10x)
- [ ] ✅ Runbook structure supports expansion (new runbooks easy to add)
- [ ] ✅ Alert throttling prevents spam at high traffic
- [ ] ✅ Slack webhook supports unlimited messages (free tier)

---

## Phase 2 Completion

Upon completion of Tasks 2.3 and 2.4:

**Phase 2 Status:** 100% ✅ COMPLETE

**Deliverables Summary:**

- ✅ Task 2.1: Axiom Integration (4h)
- ✅ Task 2.2: Observability Dashboard (4h)
- ✅ Task 2.3: Configure Alerting (2h)
- ✅ Task 2.4: Operational Runbooks (2h)

**Total Effort:** 12 hours over 3-5 days

**Code Changes:**

- 6 new files (alerting)
- 4 new documentation files (runbooks)
- 3 modified files (telemetry)
- ~1500 lines of code + documentation

**Testing:**

- All 540+ unit tests passing
- 3 new test suites added
- Integration tests passing
- Manual testing complete

---

## Next Phase Preview

### Phase 3: Service Level Objectives (4-6 hours)

**Goal:** Define and monitor SLOs for production.

**Tasks:**

- 3.1: Define SLOs (uptime, latency, error rate)
- 3.2: SLO monitoring dashboard (extend observability UI)
- 3.3: Public status page (Upptime or similar)
- 3.4: SLO alerting (alert when SLO budget burns)

**Dependencies:**

- Phase 2 complete (metrics + alerting infrastructure)
- Baseline metrics established (1 week of production data)

**Estimated Start:** 1-2 weeks after Phase 2 deployment

---

## Appendix

### A. Environment Variables Reference

```bash
# Alerting (Phase 2 - Task 2.3)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Axiom (Phase 2 - Task 2.1)
AXIOM_TOKEN=xait-your-api-token
AXIOM_ORG_ID=your-org-id
AXIOM_DATASET=kingston-care-production

# Cron (Phase 2 - Task 2.1)
CRON_SECRET=random-secret-string

# Circuit Breaker (Phase 1)
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=3
CIRCUIT_BREAKER_TIMEOUT=30000
```

---

### B. File Structure Summary

```
lib/
├── integrations/
│   └── slack.ts                          # NEW (Task 2.3.1)
├── observability/
│   ├── axiom.ts                          # Existing (Task 2.1)
│   └── alert-throttle.ts                 # NEW (Task 2.3.3)
├── resilience/
│   └── telemetry.ts                      # MODIFIED (Task 2.3.2)

docs/
├── observability/
│   ├── USER-SETUP-REQUIRED.md            # Existing (Task 2.1)
│   └── alerting-setup.md                 # NEW (Task 2.3.4)
└── runbooks/
    ├── README.md                         # NEW (Task 2.4.4)
    ├── circuit-breaker-open.md           # NEW (Task 2.4.1)
    ├── high-error-rate.md                # NEW (Task 2.4.2)
    ├── slow-queries.md                   # NEW (Task 2.4.3)
    └── pwa-testing.md                    # Existing

tests/
├── lib/
│   ├── integrations/
│   │   └── slack.test.ts                 # NEW (Task 2.3.4)
│   └── observability/
│       └── alert-throttle.test.ts        # NEW (Task 2.3.4)
└── integration/
    └── alerting.test.ts                  # NEW (Task 2.3.4)
```

---

### C. Useful Commands

```bash
# Development
npm run dev                                # Start dev server
npm test -- --watch                        # Run tests in watch mode
npm run type-check                         # TypeScript validation

# Testing Alerting
# (Create test Slack webhook first)
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/TEST/WEBHOOK"
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text": "Test alert"}'

# Deployment
vercel --prod                              # Deploy to production
vercel logs --prod                         # View production logs
vercel env pull                            # Pull environment variables

# Monitoring
open https://app.axiom.co                  # View Axiom logs
open https://yourdomain.com/admin/observability  # Dashboard
```

---

### D. Related Documentation

- **Implementation Plans:**
  - [v18.0 Phase 2 Full Plan](./v18-0-phase-2-implementation-plan.md)
  - [v18.0 Production Observability](./v18-0-production-observability.md)

- **Completion Summaries:**
  - [Task 2.1 Summary](./v18-0-task-2-1-completion-summary.md)
  - [Task 2.2 Summary](./v18-0-task-2-2-completion-summary.md)

- **Architecture Decisions:**
  - [ADR-016: Performance Tracking & Circuit Breaker](../adr/016-performance-tracking-and-circuit-breaker.md)

- **User Guides:**
  - [Observability Setup](../observability/USER-SETUP-REQUIRED.md)
  - [Dashboard Usage](../observability/dashboard-usage.md)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-30

**Next Review:** After Task 2.3 completion
