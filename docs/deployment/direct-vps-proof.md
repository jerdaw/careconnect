---
status: active
last_updated: 2026-03-11
owner: jer
tags: [deployment, vps, docker, caddy, production, supabase, rls]
---

# Direct VPS Deployment

This document describes the **current active direct-VPS deployment path** for HelpBridge.

Current state:

1. the app is packaged as a Docker container,
2. the container is running successfully on the Hetzner VPS,
3. the public host is `https://helpbridge.ca`,
4. `www.helpbridge.ca` redirects to the apex,
5. the container binds privately at `127.0.0.1:3300`,
6. `GET /api/v1/health` returns healthy on the VPS and publicly.

Important naming note:

1. the public product/domain identity is `HelpBridge` / `helpbridge.ca`,
2. the live VPS runtime identifiers remain `kingston-care-connect-web` for stability,
3. no parallel `helpbridge-web` runtime currently exists on the VPS.

This is the active production path. The root [DEPLOY.md](../../DEPLOY.md) file remains a **legacy Vercel guide** only.

## Runtime Shape

The deployment uses:

1. Docker on the host VPS,
2. host-managed Caddy for public ingress,
3. loopback-only bind on the host (`127.0.0.1:3300 -> container:3000`),
4. the Next.js standalone production output from `npm run build`.

## Local Prerequisites

Before copying anything to the VPS:

1. `npm run lint`
2. `npm run type-check`
3. `npm run build`
4. ensure the env contract is known from `.env.example`

Do not use Playwright locally for this proof step.

## Packaging Files

The direct VPS proof uses:

1. [`Dockerfile`](../../Dockerfile)
2. [`scripts/deploy-vps-proof.sh`](../../scripts/deploy-vps-proof.sh)

The deploy script expects exactly one argument:

```bash
./scripts/deploy-vps-proof.sh /path/to/env-file
```

It will:

1. build a tagged image,
2. replace the existing `kingston-care-connect-web` container if present,
3. run it with `--restart unless-stopped`,
4. publish `127.0.0.1:3300:3000`,
5. print the expected health URL.

## Verified Production State

As of 2026-03-11, the deployment has been verified with:

1. `docker ps` showing `kingston-care-connect-web` healthy on the VPS,
2. `curl -fsS http://127.0.0.1:3300/api/v1/health`,
3. `curl -sS -D - "http://127.0.0.1:3300/api/v1/services?limit=1"`.
4. `curl -fsS https://helpbridge.ca/api/v1/health`,
5. `curl -fsS https://helpbridge.ca/robots.txt`,
6. `curl -fsS https://helpbridge.ca/sitemap.xml`.

Public ingress now runs through host Caddy:

```caddy
www.helpbridge.ca {
    redir https://helpbridge.ca{uri} 308
}

helpbridge.ca {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3300
}
```

## Expected Health Check

After the container starts, verify:

```bash
curl -fsS http://127.0.0.1:3300/api/v1/health
```

Expected outcome:

1. HTTP success,
2. JSON response,
3. no container crash loop.

## Supabase RLS Repair Note

The initial private proof exposed a live Supabase row-level security recursion bug:

1. `organization_members` policies queried `organization_members` directly,
2. `services` policies also queried `organization_members`,
3. live reads failed with `42P17 infinite recursion detected in policy for relation "organization_members"`.

The approved minimal repair was:

1. add helper functions:
   - `public.is_org_member(uuid)`
   - `public.is_org_admin(uuid)`
   - `public.can_manage_org_services(uuid)`
2. replace only the `organization_members` and `services` policies to use those helpers.

The repo-tracked SQL artifact for that repair is:

1. [`supabase/migrations/20260311032000_fix_rls_recursion_for_org_members_and_services.sql`](../../supabase/migrations/20260311032000_fix_rls_recursion_for_org_members_and_services.sql)

This repair should be treated as part of the private-proof source of truth because the app could not pass health checks without it.

## Current Limits

This document records the active deployment baseline.

Follow-up documentation still needed:

1. broader historical cleanup for legacy references that do not affect the live runtime,
2. any future status-page or subdomain policy,
3. a separate planned VPS runtime rename if you later want `kingston-care-connect-web` renamed to `helpbridge-web`.

For the current deploy/verify/rollback checklist, use:

1. [`docs/deployment/production-checklist.md`](production-checklist.md)
