---
status: stable
last_updated: 2026-03-11
owner: jer
tags: [deployment, vps, docker, caddy, proof, supabase, rls]
---

# Direct VPS Private Proof

This document describes the **current active deployment proof path** for Kingston Care Connect.

Current state:

1. the app is packaged as a Docker container,
2. the private VPS proof is running successfully on the Hetzner VPS,
3. the container binds to `127.0.0.1:3300`,
4. `GET /api/v1/health` returns healthy on the VPS,
5. no public ingress or DNS cutover has been applied yet.

This is the active path for migration work. The root [DEPLOY.md](../../DEPLOY.md) file remains a **legacy Vercel guide** only.

## Runtime Shape

The private proof uses:

1. Docker on the host VPS,
2. host-managed Caddy for eventual ingress,
3. loopback-only bind during proof (`127.0.0.1:3300 -> container:3000`),
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

## Verified Private-Proof State

As of 2026-03-11, the private proof has been verified with:

1. `docker ps` showing `kingston-care-connect-web` healthy on the VPS,
2. `curl -fsS http://127.0.0.1:3300/api/v1/health`,
3. `curl -sS -D - "http://127.0.0.1:3300/api/v1/services?limit=1"`.

The proof should remain private until public ingress, DNS, and rollback steps are documented separately.

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

This document only covers the **private proof**.

It does not yet cover:

1. public DNS,
2. public Caddy site blocks,
3. apex vs `www` policy,
4. cutover or rollback sequencing.

Those should be documented only after the private proof is confirmed healthy on the VPS.
