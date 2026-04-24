# ⚠️ USER SETUP REQUIRED: Axiom & Slack Configuration

**Status:** observability code is in the repo, but production still depends on human-managed credentials and a scheduler calling the export route.

**Estimated Time:** 15-20 minutes

---

## Current Production Baseline

CareConnect is live on the direct-VPS path at `https://careconnect.ing`.

- The app runs as `careconnect-web` on the VPS.
- Production env lives in `/etc/projects-merge/env/careconnect-web.env`.
- Metric export is handled by `GET /api/cron/export-metrics` with `Authorization: Bearer $CRON_SECRET`.
- Do not follow historical Vercel-only setup steps for the active production path.

---

## What Is Already Implemented

- Axiom SDK integration in `lib/observability/axiom.ts`
- performance metric export in `lib/performance/metrics.ts`
- Slack alert delivery in `lib/integrations/slack.ts`
- alert throttling in `lib/observability/alert-throttle.ts`
- scheduled export endpoint at `app/api/cron/export-metrics/route.ts`

---

## Required Setup

### 1. Create the Axiom dataset and token

1. Create or sign in to your Axiom account.
2. Create the production dataset (currently `kingston-care-production` unless you intentionally rename it).
3. Generate an API token with ingest permissions.
4. Record the organization ID.

### 2. Create the Slack incoming webhook

1. Create or reuse a webhook for the production alerts channel.
2. Copy the webhook URL.
3. Test it once:

```bash
curl -X POST "YOUR_WEBHOOK_URL_HERE" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test alert from CareConnect setup"}'
```

### 3. Generate the scheduler secret

```bash
openssl rand -base64 32
```

This value becomes `CRON_SECRET`.

### 4. Set local development values

Update `.env.local`:

```bash
AXIOM_TOKEN=...
AXIOM_ORG_ID=...
AXIOM_DATASET=kingston-care-production
SLACK_WEBHOOK_URL=...
CRON_SECRET=...
```

### 5. Set production values on the VPS

Update `/etc/projects-merge/env/careconnect-web.env` with the same keys:

```bash
AXIOM_TOKEN=...
AXIOM_ORG_ID=...
AXIOM_DATASET=kingston-care-production
SLACK_WEBHOOK_URL=...
CRON_SECRET=...
```

After updating the env file, redeploy the current staged release:

```bash
cd /srv/apps/careconnect-web/current
sudo ./scripts/deploy-vps-proof.sh /etc/projects-merge/env/careconnect-web.env
```

### 6. Ensure the production scheduler is calling the export route

The scheduler mechanism is environment-owned and may change over time. The requirement is stable:

- invoke `GET https://careconnect.ing/api/cron/export-metrics`
- send `Authorization: Bearer $CRON_SECRET`
- run on the agreed production cadence (historically hourly)

If you change the scheduler mechanism, keep this repo and the shared VPS docs aligned.

---

## Verification

### Local

1. Start the app:

```bash
npm run dev
```

2. Confirm you do not see the `Axiom credentials missing` warning.
3. Manually hit the export endpoint:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/export-metrics
```

Expected response:

```json
{
  "success": true,
  "timestamp": "..."
}
```

### Production

1. Verify the env file contains the configured keys:

```bash
sudo grep -E '^(AXIOM_TOKEN|AXIOM_ORG_ID|AXIOM_DATASET|SLACK_WEBHOOK_URL|CRON_SECRET)=' \
  /etc/projects-merge/env/careconnect-web.env | sed 's/=.*$/=<redacted>/'
```

2. Manually exercise the endpoint once from a secure shell:

```bash
curl -fsS \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://careconnect.ing/api/cron/export-metrics
```

3. Confirm recent events appear in Axiom.
4. Check recent container logs:

```bash
docker logs --tail 200 careconnect-web
```

---

## Troubleshooting

### `Axiom credentials missing`

- verify the local or production env file contains all three Axiom variables
- restart the app after env changes
- check for typos in variable names

### Slack webhook returns `404` or `401`

- regenerate or re-copy the webhook URL
- update `SLACK_WEBHOOK_URL`
- redeploy the VPS release after changing production env

### Export route returns `401 Unauthorized`

- confirm the request is sending `Authorization: Bearer $CRON_SECRET`
- confirm production `CRON_SECRET` matches the caller secret
- redeploy after updating the env file

### No production metrics appear in Axiom

- confirm the scheduler is actually calling `/api/cron/export-metrics`
- check `docker logs --tail 200 careconnect-web`
- verify `AXIOM_DATASET` matches the real dataset name
- verify the Axiom token still has ingest permission
