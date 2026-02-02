# ⚠️ USER SETUP REQUIRED: Axiom & Slack Configuration

**Status:** Task 2.1 (Axiom Integration) code is complete, but requires user configuration before it can function.

**Estimated Time:** 15 minutes

---

## What Was Implemented (Task 2.1)

✅ **Completed:**

- Axiom SDK installed (`@axiomhq/js`)
- Environment variable validation (`lib/env.ts`)
- Axiom integration module (`lib/observability/axiom.ts`)
- Performance metric export (`lib/performance/metrics.ts`)
- Circuit breaker event streaming (`lib/resilience/telemetry.ts`)
- Scheduled cron job (`app/api/cron/export-metrics/route.ts`)
- Vercel cron configuration (`vercel.json`)

✅ **Verification:**

- Type-check: PASSED (0 errors)
- Tests: 540/540 passing
- Build: Successful

---

## What YOU Need to Do (15 minutes)

### Step 1: Create Axiom Account (~5 minutes)

**Why:** Axiom stores performance metrics and circuit breaker events in production.

**Instructions:**

1. Go to https://axiom.co
2. Click "Sign Up" (choose free tier)
3. Create account with email/password or GitHub
4. Verify email if required

**After Sign Up:**

1. Create a new dataset:
   - Click "Datasets" in sidebar
   - Click "Create Dataset"
   - Name: `kingston-care-production`
   - Click "Create"

2. Generate API token:
   - Click "Settings" (gear icon)
   - Go to "API Tokens" tab
   - Click "Create API Token"
   - Name: `kingston-care-production-token`
   - Permissions: Select "Ingest" and "Query"
   - Click "Create Token"
   - **IMPORTANT:** Copy the token immediately (starts with `xait-`)
   - Save it securely (you won't be able to see it again)

3. Note your Organization ID:
   - Still in Settings
   - Look for "Organization ID" near the top
   - Copy this value (it's a short alphanumeric string)

---

### Step 2: Create Slack Webhook (~5 minutes)

**Why:** Slack receives critical alerts (circuit breaker opens, high error rates).

**Instructions:**

1. Go to https://slack.com/apps/A0F7XDUAZ-incoming-webhooks
2. Click "Add to Slack" (or "Add Configuration" if already installed)
3. Select the channel for alerts:
   - Recommended: Create a new channel called `#kingston-care-alerts`
   - Alternative: Use existing channel like `#alerts` or `#monitoring`
4. Click "Add Incoming WebHooks integration"
5. **Copy the Webhook URL** (starts with `https://hooks.slack.com/services/`)
   - Example: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`
6. (Optional) Customize the webhook:
   - Name: `Kingston Care Connect`
   - Icon: Choose an icon or emoji
   - Click "Save Settings"

**Test the Webhook (Optional):**

```bash
curl -X POST "YOUR_WEBHOOK_URL_HERE" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test alert from Kingston Care Connect setup"}'
```

You should see a message appear in your Slack channel immediately.

---

### Step 3: Generate Cron Secret (~1 minute)

**Why:** Secures the cron endpoint so only Vercel can trigger metric exports.

**Instructions:**

```bash
openssl rand -base64 32
```

**Copy the output** (long random string, ~44 characters)

---

### Step 4: Add Environment Variables (~4 minutes)

**Local Development (.env.local):**

Create or update `.env.local` with these values:

```bash
# Axiom Observability (v18.0 Phase 2)
AXIOM_TOKEN=xait-xxxx-xxxx-xxxx-xxxx-xxxx
AXIOM_ORG_ID=your-org-id-here
AXIOM_DATASET=kingston-care-production

# Slack Integration (v18.0 Phase 2)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

# Cron Job Authentication (v18.0 Phase 2)
CRON_SECRET=your-random-secret-from-step-3
```

**Replace:**

- `xait-xxxx...` with your actual Axiom API token from Step 1
- `your-org-id-here` with your Axiom Organization ID from Step 1
- `https://hooks.slack.com/...` with your Slack webhook URL from Step 2
- `your-random-secret...` with the output from Step 3

---

### Step 5: Add to Vercel (Production)

**When deploying to production:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable:
   - `AXIOM_TOKEN` = `xait-xxxx...` (Production)
   - `AXIOM_ORG_ID` = `your-org-id` (Production)
   - `AXIOM_DATASET` = `kingston-care-production` (Production)
   - `SLACK_WEBHOOK_URL` = `https://hooks.slack.com/...` (Production)
   - `CRON_SECRET` = `your-random-secret` (Production)

3. Redeploy the application for changes to take effect

---

## Verification

### Test Local Setup (Development)

**Note:** Axiom integration is production-only, so local testing is limited.

**1. Verify environment variables are loaded:**

```bash
npm run dev
# Check console - should not see "Axiom credentials missing" warning
```

**2. Test Slack webhook manually:**

```bash
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"🧪 Test from Kingston Care Connect local dev"}'
```

Expected: Message appears in Slack channel

**3. Test cron endpoint:**

```bash
# Start dev server in one terminal
npm run dev

# In another terminal:
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/export-metrics
```

Expected response:

```json
{
  "success": true,
  "timestamp": "2026-01-30T21:30:00.000Z"
}
```

---

### Test Production Setup (After Deployment)

**1. Verify Axiom is receiving events:**

1. Deploy to Vercel with environment variables
2. Wait for cron job to run (every hour at :00)
3. Go to Axiom dashboard → Datasets → `kingston-care-production`
4. Check for recent events (type: `performance`, `health_check`)

**2. Verify Slack alerts:**

1. Trigger a circuit breaker open (simulate database failure)
2. Check Slack channel for alert
3. Should receive message within 30 seconds

**3. Check Vercel cron logs:**

1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by `/api/cron/export-metrics`
3. Verify executions every hour
4. Check for errors

---

## Troubleshooting

### Issue: "Axiom credentials missing" warning

**Cause:** Environment variables not set or incorrect

**Fix:**

1. Check `.env.local` has all three Axiom variables
2. Restart dev server after adding env vars
3. Verify no typos in variable names (must match exactly)

---

### Issue: Slack webhook returns 404 or 401

**Cause:** Webhook URL incorrect or webhook deleted

**Fix:**

1. Go back to Slack incoming webhooks page
2. Verify webhook is still active
3. Copy URL again (may have changed)
4. Update `SLACK_WEBHOOK_URL` in env vars

---

### Issue: Cron job returns 401 Unauthorized

**Cause:** `CRON_SECRET` mismatch or not set

**Fix:**

1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Regenerate secret: `openssl rand -base64 32`
3. Update both local and Vercel env vars
4. Redeploy

---

### Issue: No metrics appearing in Axiom

**Possible Causes:**

1. **Production guard:** Axiom only sends in production (`NODE_ENV=production`)
2. **Cron not running:** Check Vercel cron logs
3. **API token expired:** Regenerate in Axiom settings
4. **Dataset name mismatch:** Verify `AXIOM_DATASET` matches dataset in Axiom

**Fix:**

1. Check Vercel logs for errors
2. Verify `NODE_ENV=production` in Vercel
3. Check Axiom API token is valid
4. Test cron endpoint manually with correct auth header

---

## Next Steps

**After completing setup:**

✅ **You're ready for Task 2.2: Observability Dashboard**

The dashboard will display:

- Circuit breaker status (current state, failure count)
- Performance metrics (p50/p95/p99 latency)
- System health summary

**When ready to continue:**

- Confirm environment variables are set
- Verify Axiom account is active
- Verify Slack webhook works
- Proceed to Task 2.2 implementation

---

## Summary

**What You Did:**

1. ✅ Created Axiom account and dataset
2. ✅ Generated Axiom API token
3. ✅ Created Slack webhook
4. ✅ Generated cron secret
5. ✅ Added environment variables to `.env.local`
6. ✅ (Optional) Added environment variables to Vercel

**What's Working:**

- Axiom SDK integrated and ready to send metrics
- Slack webhook ready to receive alerts
- Cron job ready to export metrics hourly
- Circuit breaker events will stream to Axiom in production

**What's Next:**

- Task 2.2: Build observability dashboard UI
- Task 2.3: Configure alerting logic
- Task 2.4: Write operational runbooks

---

**Setup Time:** ~15 minutes
**Completion:** When all 5 steps done and verified
**Status:** ⏸️ WAITING FOR USER SETUP
