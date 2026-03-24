# Alerting Setup Guide

## Overview

HelpBridge sends automated Slack alerts for critical system events, enabling proactive incident detection and rapid response.

**Alert Types:**

- 🚨 **Circuit Breaker OPEN** (Critical) - Database protection activated
- ✅ **Circuit Breaker CLOSED** (Info) - System recovered
- ⚠️ **High Error Rate** (Warning) - Early warning signal

**Key Features:**

- Real-time notifications (alerts sent within 30 seconds)
- Alert throttling to prevent spam
- Rich Slack formatting with dashboard + runbook links
- Production-only (no noise in development)

---

## Prerequisites

- Slack workspace with admin access
- 5 minutes for setup
- Vercel deployment (for production alerts)

---

## Setup Steps

### Step 1: Create Slack Incoming Webhook (3 minutes)

**1.1 Create Slack App**

1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. App Name: `Kingston Care Alerts`
4. Select your workspace
5. Click **"Create App"**

**1.2 Enable Incoming Webhooks**

1. In the left sidebar, click **"Incoming Webhooks"**
2. Toggle **"Activate Incoming Webhooks"** to **ON**
3. Scroll down and click **"Add New Webhook to Workspace"**
4. Select channel: **`#kingston-alerts`** (create channel first if needed)
   - Recommended: Create a dedicated channel for alerts
   - Alternative: Use `#general` or `#engineering`
5. Click **"Allow"**

**1.3 Copy Webhook URL**

1. After authorization, you'll see your webhook URL
2. It will look like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`
3. Click **"Copy"** button
4. Save this URL securely (you'll need it in the next step)

**Verification:**

```bash
# Test webhook manually
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "🧪 Test alert from HelpBridge"}'
```

If successful, you should see the message appear in your Slack channel within 5 seconds.

---

### Step 2: Configure Environment Variables (1 minute)

**For Local Development:**

Add to `.env.local`:

```bash
# Slack Alerting (v18.0 Phase 2)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Notes:**

- Alerts will NOT send in development (production-only by design)
- You can still test the integration with `NODE_ENV=production`

**For Production (Vercel):**

1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
2. Click **"Add New"**
3. Fill in:
   - **Name:** `SLACK_WEBHOOK_URL`
   - **Value:** Your webhook URL (paste from Step 1)
   - **Environment:** Select **"Production"** (and optionally "Preview" for staging)
4. Click **"Save"**

**Redeploy:**

```bash
# Trigger redeploy to apply new environment variable
vercel --prod
```

---

### Step 3: Verify Alerting Works (1 minute)

**Option A: Wait for Real Circuit Breaker Event**

Monitor your Slack channel. When the circuit breaker opens in production, you should receive an alert within 30 seconds.

**Option B: Manual Test (Advanced)**

If you want to test immediately, you can manually trigger the circuit breaker using the admin dashboard or by simulating database failures.

**Expected Result:**

When circuit breaker opens, you should see a Slack message like:

```
🚨 Circuit Breaker Alert

Status: OPEN
Previous: CLOSED
Failure Rate: 75.0%
Failures: 5

⚠️ Database operations are being protected. Check the dashboard for details and follow the runbook for troubleshooting steps.

Time: 2026-01-30, 2:45:30 PM

[📊 View Dashboard] [📖 View Runbook]
```

---

## Alert Configuration

### Alert Types & Throttling

| Alert Type             | Severity    | Throttle Window | Triggers When                 |
| ---------------------- | ----------- | --------------- | ----------------------------- |
| Circuit Breaker OPEN   | 🔴 Critical | 10 minutes      | Circuit opens due to failures |
| Circuit Breaker CLOSED | 🟢 Info     | 1 hour          | Circuit recovers (optional)   |
| High Error Rate        | 🟡 Warning  | 5 minutes       | Error rate >10%               |

**Throttling Example:**

```
2:00 PM - Circuit opens → Alert sent ✅
2:05 PM - Circuit opens again → Alert blocked ⛔ (within 10min window)
2:12 PM - Circuit opens again → Alert sent ✅ (window expired)
```

### Alert Contents

**Circuit Breaker OPEN Alert Includes:**

- Current state (OPEN)
- Previous state (CLOSED)
- Failure count (e.g., 5 failures)
- Failure rate percentage (e.g., 75%)
- Timestamp (Eastern Time)
- Dashboard link (real-time metrics)
- Runbook link (troubleshooting guide)

**Message Format:**

- **Fallback text:** Plain text for notifications
- **Rich blocks:** Formatted Slack message with sections and buttons
- **Color coding:** Red for critical, yellow for warning, green for info

---

## Troubleshooting

### No Alerts Received

**Check 1: Webhook URL Configured**

```bash
# Verify environment variable is set
vercel env ls --prod

# Should show SLACK_WEBHOOK_URL
```

**Check 2: Production Environment**

Alerts only send in production (`NODE_ENV=production`). Verify:

```bash
# Check deployment logs
vercel logs --prod | grep "Slack alert"
```

**Check 3: Slack Channel Membership**

Ensure you're a member of the `#kingston-alerts` channel where alerts are sent.

**Check 4: Circuit Breaker Actually Opened**

Check observability dashboard at `/admin/observability`:

- Circuit Breaker card should show state = OPEN (red)
- If state is CLOSED, no alert will be sent

**Check 5: Webhook URL Validity**

Test webhook manually:

```bash
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message"}'

# Should return: "ok"
```

---

### Alerts Are Duplicated

**Cause:** Multiple server instances or throttling not working.

**Expected Behavior:**

- In serverless (Vercel), each instance has its own throttle
- You may see 1-2 duplicate alerts on redeploy
- This is acceptable (Axiom logs show all events for deduplication)

**Not a concern unless:**

- > 3 duplicate alerts for single event
- Alerts spamming continuously (>10 per minute)

---

### Alerts Are Delayed

**Cause:** Serverless cold starts or network latency.

**Expected Latency:**

- Typical: 2-5 seconds
- Maximum: 30 seconds

**If delays >1 minute:**

1. Check Vercel function logs for errors
2. Check Slack API status: https://status.slack.com
3. Verify network connectivity from Vercel region

---

### Alert Format Is Broken

**Cause:** Slack API version mismatch or webhook configuration.

**Fix:**

1. Recreate webhook (Steps 1.1-1.3 above)
2. Ensure webhook URL starts with `https://hooks.slack.com/services/`
3. Check Slack app has correct permissions (Incoming Webhooks)

---

### Throttling Not Working

**Symptom:** Receiving >1 alert per 10 minutes for circuit-open.

**Cause:** Throttle is per-instance (serverless resets on redeploy).

**Expected:**

- First alert after deploy: Allowed
- Subsequent alerts within 10min: Blocked
- After server restart: Throttle resets

**Not a bug:** Serverless architecture means throttle resets occasionally.

---

## Best Practices

### Channel Setup

**Recommended:**

- Create dedicated channel: `#kingston-alerts`
- Add key team members
- Enable mobile push notifications
- Set channel topic: "Production alerts - HelpBridge"

**Don't:**

- Mix with other app alerts (creates noise)
- Use DMs (hard to track who's on-call)
- Disable notifications (defeats purpose)

### Alert Hygiene

**Do:**

- ✅ Acknowledge alerts in thread (shows you're investigating)
- ✅ Post resolution in thread (creates incident log)
- ✅ Use emoji reactions to show status (👀 investigating, ✅ resolved)
- ✅ Review weekly: Are alerts actionable? Tune thresholds if needed

**Don't:**

- ❌ Ignore alerts (creates alert fatigue)
- ❌ Archive without investigating
- ❌ Silence alerts permanently (if too noisy, tune thresholds instead)

### Runbook Integration

Every alert includes a runbook link. Use it!

**Workflow:**

1. Alert arrives in Slack
2. Click **"View Dashboard"** → See current system state
3. Click **"View Runbook"** → Follow troubleshooting steps
4. Post resolution in Slack thread

### Threshold Tuning

If alerts are too frequent or too rare, you can adjust thresholds:

**Circuit Breaker Thresholds** (in code):

```typescript
// lib/resilience/supabase-breaker.ts
const config = {
  failureThreshold: 3, // Number of failures before opening
  failureRateThreshold: 0.5, // 50% error rate threshold
  timeout: 30000, // Recovery timeout (30s)
}
```

**Alert Throttle Windows** (in code):

```typescript
// lib/observability/alert-throttle.ts
const THROTTLE_WINDOWS = {
  "circuit-open": 10 * 60 * 1000, // 10 minutes
  "circuit-closed": 60 * 60 * 1000, // 1 hour
  "high-error-rate": 5 * 60 * 1000, // 5 minutes
}
```

**Tuning Guidelines:**

- Start conservative (current defaults are good)
- Collect 1 week of production data
- If >10 false positives per day: Increase thresholds
- If missing real incidents: Decrease thresholds

---

## Monitoring Alerts

### Axiom Logs

All alert events are logged to Axiom for analysis:

```sql
-- View all Slack alerts sent (last 24h)
SELECT * FROM kingston-care-production
WHERE component = 'slack'
  AND _time > now() - interval '24 hours'
ORDER BY _time DESC

-- Count alerts by type
SELECT
  alertType,
  count(*) as alert_count
FROM kingston-care-production
WHERE component = 'alert-throttle'
  AND message LIKE '%Alert allowed%'
GROUP BY alertType
```

### Health Check

Verify alerting system is working:

```bash
# Check environment variable
echo $SLACK_WEBHOOK_URL

# Check production deployment
vercel env pull
grep SLACK_WEBHOOK_URL .env.production.local

# Check logs for recent alerts
vercel logs --prod | grep -i "slack"
```

---

## Advanced Configuration

### Custom Alert Channels

To send different alerts to different channels:

1. Create multiple webhooks in Slack (one per channel)
2. Add environment variables:
   ```bash
   SLACK_WEBHOOK_CRITICAL=https://hooks.slack.com/services/...
   SLACK_WEBHOOK_WARNING=https://hooks.slack.com/services/...
   ```
3. Modify `lib/integrations/slack.ts` to route by severity

### Alert Escalation

To add PagerDuty or email escalation:

1. Install `@pagerduty/pdjs` or use email API
2. Create `lib/integrations/pagerduty.ts`
3. Add escalation logic in `lib/resilience/telemetry.ts`:
   ```typescript
   if (failureRate > 0.9) {
     // Critical - page on-call
     void sendPagerDutyAlert(...)
   }
   ```

### Slack App Enhancements

**Future Enhancements:**

- Interactive buttons ("Acknowledge", "Silence for 1h")
- Slash commands ("/kingston status")
- Alert statistics in channel topic
- Daily summary thread

---

## Related Documentation

- **Observability Access & Setup:** [User Setup Required](./USER-SETUP-REQUIRED.md)
- **Circuit Breaker Runbook:** [Circuit Breaker Open](../runbooks/circuit-breaker-open.md)
- **Axiom Setup:** [User Setup Required](./USER-SETUP-REQUIRED.md)
- **Architecture:** [ADR-016 Performance Tracking](../adr/016-performance-tracking-and-circuit-breaker.md)

---

## FAQ

**Q: Can I send alerts to multiple channels?**
A: Yes, create multiple webhooks and modify the Slack integration to send to both.

**Q: Can I test alerts in development?**
A: Alerts are production-only by design. You can temporarily set `NODE_ENV=production` locally to test.

**Q: How do I silence alerts temporarily?**
A: Temporarily remove `SLACK_WEBHOOK_URL` from environment variables and redeploy. Restore after maintenance.

**Q: Are alerts free?**
A: Yes, Slack webhooks are free with unlimited messages.

**Q: Can I customize the message format?**
A: Yes, edit `formatCircuitBreakerMessage()` in `lib/integrations/slack.ts`.

**Q: What if Slack is down?**
A: Alerts will fail gracefully (logged but not sent). Dashboard and Axiom are independent backups.

---

**Last Updated:** 2026-01-30
**Version:** 1.0
**Maintained By:** Platform Team
