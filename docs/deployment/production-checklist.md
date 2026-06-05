# Public Release Checklist

**Last Updated:** 2026-06-04

This checklist covers public-safe release verification for CareConnect. Exact production deployment, rollback, host access, release-root, environment-file, monitoring, and shared-infrastructure details are intentionally excluded from public documentation.

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

## 4. Release Readiness

- [ ] public routes still render without search logging
- [ ] `/api/v1/health` returns JSON
- [ ] privacy, terms, accessibility, and crisis-safety pages still load
- [ ] local/server search modes remain aligned for changed behavior
- [ ] admin-only routes remain protected

## 5. Post-Release Observation

Maintainers should observe health, errors, and search availability after a live release using private operations procedures. Do not publish host-specific incident steps or monitoring dashboards in this public repository.

## References

- [Deployment Architecture Notes](direct-vps-proof.md)
- [OpenAPI Specification](../api/openapi.yaml)
- [Testing Guidelines](../development/testing-guidelines.md)
