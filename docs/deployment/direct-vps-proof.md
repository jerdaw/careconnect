---
status: active
last_updated: 2026-04-28
owner: jer
tags: [deployment, vps, docker, caddy, production, supabase, rls]
---

# Direct VPS Deployment

This document describes the **current active direct-VPS deployment path** for CareConnect.

Shared-VPS ownership note:

1. This document is canonical for the CareConnect direct-VPS runtime shape.
2. Shared host topology, ingress ownership, service inventory, and other cross-project VPS facts are canonical in `/home/jer/repos/vps/platform-ops`.
3. Use `/home/jer/repos/vps/platform-ops/docs/standards/PLAT-009-shared-vps-documentation-boundary.md` as the default boundary reference.

Current state:

1. the app is packaged as a Docker container,
2. the container is running successfully on the Hetzner VPS,
3. the public host is `https://careconnect.ing`,
4. `www.careconnect.ing` redirects to the apex,
5. the container binds privately at `127.0.0.1:3300`,
6. `GET /api/v1/health` returns healthy on the VPS and publicly,
7. the deployed health payload reports the staged release revision,
8. public boot degrades safely when optional Supabase or OneSignal browser config is absent.

Important naming note:

1. the public product/domain identity is `CareConnect` / `careconnect.ing`,
2. the live VPS runtime identifiers are `careconnect-web`.

This is the active production path. The historical Vercel path remains documented in [legacy-vercel.md](legacy-vercel.md) only.

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
3. [`scripts/archive/release-vps-proof.sh`](../../scripts/archive/release-vps-proof.sh)

The deploy script expects exactly one argument:

```bash
./scripts/deploy-vps-proof.sh /path/to/env-file
```

On the current shared VPS contract, the production env directory
`/etc/projects-merge/env` remains root-only. When deploying with
`/etc/projects-merge/env/careconnect-web.env`, run the helper from the staged
release with `sudo`:

```bash
sudo ./scripts/deploy-vps-proof.sh /etc/projects-merge/env/careconnect-web.env
```

It will:

1. build a tagged image,
2. prefer `docker buildx build` when available and fall back to legacy `docker build` only if `buildx` is missing,
3. replace the existing `careconnect-web` container if present,
4. run it with `--restart unless-stopped`,
5. publish `127.0.0.1:3300:3000`,
6. pass required `NEXT_PUBLIC_*` values into both the image build and container runtime,
7. set `APP_VERSION` so `/api/v1/health` reports the deployed revision,
8. print the expected health URL.

From a local workstation, stage a committed release first:

```bash
./scripts/archive/release-vps-proof.sh haadmin@your-vps
```

Then SSH to the VPS and run the deploy helper with `sudo` from the staged
release. The older one-step `--deploy` helper is not the current reliable
production path while `/etc/projects-merge/env` remains root-only.

## Verified Production State

As of 2026-03-11, the deployment has been verified with:

1. `docker ps` showing `careconnect-web` healthy on the VPS,
2. `curl -fsS http://127.0.0.1:3300/api/v1/health`,
3. `curl -sS -D - "http://127.0.0.1:3300/api/v1/services?limit=1"`.
4. `curl -fsS https://careconnect.ing/api/v1/health`,
5. `curl -fsS https://careconnect.ing/robots.txt`,
6. `curl -fsS https://careconnect.ing/sitemap.xml`.

Operational notes from the March 11, 2026 VPS stabilization work:

1. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must be present at image build time, not just container runtime.
2. The homepage should stay up even if those public Supabase values are absent from the browser bundle.
3. OneSignal must remain disabled unless `NEXT_PUBLIC_ONESIGNAL_APP_ID` is explicitly set.
4. A brief `degraded` or connection-reset health response can occur during container replacement; repeat health checks until they stabilize.

Public ingress now runs through host Caddy:

```caddy
www.careconnect.ing {
    redir https://careconnect.ing{uri} 308
}

careconnect.ing {
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
3. `version` matches the deployed git SHA or release revision,
4. no container crash loop.

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
2. any future status-page or subdomain policy.

For the current deploy/verify/rollback checklist, use:

1. [`docs/deployment/production-checklist.md`](production-checklist.md)
