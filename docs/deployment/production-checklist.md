# Exception-Only Public Release Checklist

**Last Updated:** 2026-08-15

This checklist covers public-safe verification for a separately approved
post-retirement release. CareConnect has no standing release or manual
observation cadence; existing automation is the default. This checklist does
not authorize a deployment. Exact production deployment, rollback, host access,
release-root, environment-file, monitoring, and shared-infrastructure details
are intentionally excluded from public documentation.

## Public Documentation Boundary

This repository contains public project documentation and reproducible development information. Deployment details, credentials, monitoring configuration, private operational notes, and environment-specific production paths are intentionally excluded from public documentation.

## 1. Local Verification

- [ ] `git status` reviewed for unintended changes
- [ ] `npm run lint`
- [ ] `npm run type-check`
- [ ] `npm run build`
- [ ] relevant Vitest suites pass
- [ ] no secrets, private notes, env files, or host-specific paths were added to tracked files

## 2. Data And Schema Safety

Service-data, Supabase, schema, workflow, and shared-keepalive changes are
outside the current stewardship boundary and require separate approval. The
conditional checks below do not authorize those changes.

If the change touches service data:

- [ ] data edits are manually curated, not generated
- [ ] `npm run validate-data`
- [ ] embeddings regenerated where required
- [ ] search behavior spot-checked with representative queries

If the change touches database schema or policies:

- [ ] migration reviewed
- [ ] rollback or compensating step documented privately before live execution
- [ ] read-only schema preflight completed before any production write
- [ ] public/private Supabase boundaries verified

## 3. Environment Review

- [ ] `.env.local` remains untracked
- [ ] `.env.example` includes only non-secret placeholders
- [ ] optional integrations remain disabled unless intentionally configured
- [ ] production values are managed outside this public repository

## 4. Retirement Release Readiness

- [ ] localized public routes retain the non-directory retirement surface
- [ ] external emergency links and locale/RTL behavior remain intact
- [ ] preserved health endpoints retain their documented status contracts
- [ ] non-health APIs remain `410 Gone` with `no-store`
- [ ] service records, embeddings, and legacy directory caches are absent from public client output
- [ ] shared keepalive workflow and other excluded infrastructure have no diff
- [ ] the retirement transition and rollback packet's applicable contract passes

## 5. Post-Release Observation

Rely on the existing automated status contract after an approved live release.
Perform bounded manual verification only when the change or a genuine incident
requires it. Do not publish host-specific incident steps or monitoring
dashboards in this public repository.

## References

- [Deployment Architecture Notes](direct-vps-proof.md)
- [Supabase Free-Project Availability](supabase-project-availability.md)
- [Retirement Transition and Rollback Packet](../implementation/careconnect-retirement-transition-and-rollback-2026-08-12.md)
- [OpenAPI Specification](../api/openapi.yaml)
- [Testing Guidelines](../development/testing-guidelines.md)
