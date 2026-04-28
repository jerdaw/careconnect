# Production Deployment Checklist

**Version:** 2.0
**Last Updated:** 2026-04-28
**Maintained By:** Jeremy Dawson

---

## Overview

This is the active production checklist for CareConnect on the direct-VPS path.

- **Public host:** `https://careconnect.ing`
- **Redirect alias:** `https://www.careconnect.ing` -> apex
- **Runtime:** Docker on the Hetzner VPS
- **Ingress:** host Caddy
- **Private bind:** `127.0.0.1:3300`
- **Env file:** `/etc/projects-merge/env/careconnect-web.env`

Shared-VPS ownership note:

- This checklist is canonical for CareConnect production deploy, verify, and rollback steps.
- Shared host topology, ingress ownership, and other cross-project VPS facts are canonical in `/home/jer/repos/vps/platform-ops`.
- Boundary reference: `/home/jer/repos/vps/platform-ops/docs/standards/PLAT-009-shared-vps-documentation-boundary.md`
- If any shared runtime/env path, release root, host bind, or VPS deploy contract is unclear, inspect `/home/jer/repos/vps/platform-ops/inventory/services.yaml` and the relevant runbook/handoff there before assuming this repo alone is sufficient.

GitHub Actions posture:

- CI runs automatically on push/PR.
- The `Production Smoke` workflow is the manual GitHub-side public verification step.
- Production deploys remain manual on the VPS using `scripts/deploy-vps-proof.sh`.
- `scripts/archive/release-vps-proof.sh` is the recommended local helper for staging a committed release onto the VPS before deployment.

If you intentionally need the historical Vercel path, see
[`legacy-vercel.md`](legacy-vercel.md). Do not treat that file as the production
baseline.

## 1. Local Verification

- [ ] `git status` is clean
- [ ] `npm run lint`
- [ ] `npm run type-check`
- [ ] `npm run build`
- [ ] relevant Vitest suites pass
- [ ] no secrets were added to tracked files

Do not run Playwright locally for routine deployment verification. Leave E2E
coverage to CI.

## 2. Data And Schema Safety

If the deploy changes database structure, policies, or seed data:

- [ ] migration reviewed and committed
- [ ] rollback SQL or compensating step documented
- [ ] read-only live-schema preflight completed against production before any write step
  - [ ] affected `services` / other table columns checked via `information_schema.columns`
  - [ ] affected view columns checked via `information_schema.columns`
  - [ ] affected view definitions checked via `pg_get_viewdef(...)` when a view is being replaced or patched
  - [ ] any drift between prod and repo/local schema reconciled before migration/backfill execution
- [ ] `npm run validate-data`
- [ ] `npm run db:verify`
- [ ] any required embeddings regeneration completed

If the change touches Supabase RLS around `organization_members` or `services`,
preserve the helper-function-based recursion repair captured in:

- [`supabase/migrations/20260311032000_fix_rls_recursion_for_org_members_and_services.sql`](../../supabase/migrations/20260311032000_fix_rls_recursion_for_org_members_and_services.sql)

## 3. Environment Review

Verify the VPS env file contains the required runtime values:

```bash
sudo grep -E '^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY|NEXT_PUBLIC_APP_URL|NEXT_PUBLIC_BASE_URL|NEXT_PUBLIC_SEARCH_MODE|NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING)=' \
  /etc/projects-merge/env/careconnect-web.env | sed 's/=.*$/=<redacted>/'
```

Expected production host values:

- `NEXT_PUBLIC_APP_URL=https://careconnect.ing`
- `NEXT_PUBLIC_BASE_URL=https://careconnect.ing`

Important:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must be available at both image build time and container runtime.
- `scripts/deploy-vps-proof.sh` is the supported path because it passes the required public values into the Docker build before the container starts.
- `scripts/deploy-vps-proof.sh` also sets `APP_VERSION` so `/api/v1/health` can report the staged release revision even when `.git/` is not present on the VPS.
- `NEXT_PUBLIC_ONESIGNAL_APP_ID` should remain unset unless push notifications are intentionally enabled in production.

Optional integrations such as `SLACK_WEBHOOK_URL`, `AXIOM_*`, `OPENAI_API_KEY`,
and `NEXT_PUBLIC_ONESIGNAL_APP_ID` may be unset if they are not in active use.

## 4. Release Staging

- [ ] create or update a release directory under `/srv/apps/careconnect-web/releases/`
- [ ] point `/srv/apps/careconnect-web/current` at the intended release
- [ ] confirm `scripts/deploy-vps-proof.sh` exists in the staged release

Example:

```bash
readlink -f /srv/apps/careconnect-web/current
ls /srv/apps/careconnect-web/current/scripts/deploy-vps-proof.sh
```

From a local workstation, stage the current committed tree:

```bash
./scripts/archive/release-vps-proof.sh haadmin@your-vps
```

Observed live note:

- If the host still keeps `/etc/projects-merge/env` as `root:root 0700`, the
  deploy helper must run with `sudo` because `haadmin` cannot read the env file
  directly. Use `release-vps-proof.sh` for staging only, then SSH to the VPS
  and run the deploy helper with `sudo`.

## 5. Deploy

From the staged release on the VPS:

```bash
cd /srv/apps/careconnect-web/current
docker buildx version
sudo ./scripts/deploy-vps-proof.sh /etc/projects-merge/env/careconnect-web.env
```

- [ ] `docker buildx version` succeeds or the fallback warning is understood
- [ ] a new image tag is produced
- [ ] the `careconnect-web` container is replaced cleanly
- [ ] the bind remains `127.0.0.1:3300->3000`

## 6. Private Verification

Run on the VPS:

```bash
docker ps --filter name=careconnect-web
curl -fsS http://127.0.0.1:3300/api/v1/health
curl -sS -D - "http://127.0.0.1:3300/api/v1/services?limit=1"
docker logs --tail 50 careconnect-web
```

- [ ] health returns JSON
- [ ] health `version` matches the intended release revision
- [ ] services endpoint returns `200`
- [ ] logs do not show a crash loop

## 7. Public Verification

Run from a workstation:

```bash
curl -I https://careconnect.ing
curl -I https://www.careconnect.ing
curl -fsS https://careconnect.ing/api/v1/health
curl -fsS https://careconnect.ing/robots.txt
curl -fsS https://careconnect.ing/sitemap.xml | sed -n '1,12p'
```

- [ ] apex returns a normal app response
- [ ] `www` returns `308` to apex
- [ ] public health returns healthy JSON
- [ ] `robots.txt` points at `https://careconnect.ing/sitemap.xml`
- [ ] sitemap URLs use `https://careconnect.ing/...`
- [ ] a hard refresh of `https://careconnect.ing` does not trip the global error boundary

## 8. Caddy Verification

Run on the VPS:

```bash
sudo systemctl status caddy --no-pager --lines=20
sudo journalctl -u caddy --since "10 minutes ago" --no-pager
```

- [ ] Caddy is active
- [ ] no repeated TLS or proxy failures for `careconnect.ing`

## 9. Short Observation Window

After cutover, keep the service under short observation:

```bash
docker ps --filter name=careconnect-web
curl -fsS http://127.0.0.1:3300/api/v1/health
curl -fsS https://careconnect.ing/api/v1/health
free -h
```

- [ ] private health remains healthy
- [ ] public health remains healthy
- [ ] memory remains within expected host capacity

## 10. Rollback

If the new release is bad:

1. repoint `/srv/apps/careconnect-web/current` to the last known good release
2. redeploy using the same env file
3. re-run the private and public verification steps

Example:

```bash
ln -sfn /srv/apps/careconnect-web/releases/<previous-release> \
  /srv/apps/careconnect-web/current
cd /srv/apps/careconnect-web/current
sudo ./scripts/deploy-vps-proof.sh /etc/projects-merge/env/careconnect-web.env
```

## References

- [`docs/deployment/direct-vps-proof.md`](direct-vps-proof.md)
- [`legacy-vercel.md`](legacy-vercel.md)
- [`docs/api/openapi.yaml`](../api/openapi.yaml)
