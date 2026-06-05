---
status: public
last_updated: 2026-06-04
owner: maintainer
tags: [deployment, public-boundary, docker, production]
---

# Deployment Architecture Notes

This public document describes CareConnect's deployment approach at a high level. It intentionally does not publish hostnames, private bind addresses, environment-file paths, release roots, shared-host inventory, or live rollback commands.

## Public Documentation Boundary

This repository contains public project documentation and reproducible development information. Deployment details, credentials, monitoring configuration, private operational notes, and environment-specific production paths are intentionally excluded from public documentation.

## Runtime Shape

CareConnect is designed to run as a Next.js standalone application packaged with Docker. A production deployment normally has:

1. an application container built from the committed source tree,
2. managed ingress in front of the container,
3. environment variables supplied outside the repository,
4. health checks against `/api/v1/health`,
5. a verified service-data source, with local JSON fallback where configured.

Exact live topology is maintained in private operations material.

## Local Verification

Before a release candidate is considered ready, run the public-safe checks from the repository root:

```bash
npm run lint
npm run type-check
npm run build
npm test
```

If service data changes, also run:

```bash
npm run validate-data
npm run tools:search "food bank"
```

## Environment Boundary

Copy `.env.example` to `.env.local` for local development. Do not commit `.env.local`, credentials, webhook URLs, private keys, database passwords, or host-specific release paths.

Public docs may name supported environment variables, but live values and host-specific locations belong in private maintainer notes.

## Health Verification

The public health endpoint is:

```text
GET /api/v1/health
```

Expected behavior:

1. the endpoint returns JSON,
2. the status indicates whether the app is healthy or degraded,
3. no user search queries or private user data are logged by the health check.

## Related Public Docs

- [Production Checklist](production-checklist.md)
- [Legacy Vercel Guide](legacy-vercel.md)
- [OpenAPI Specification](../api/openapi.yaml)
