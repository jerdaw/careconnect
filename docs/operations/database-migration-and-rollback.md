# Database Migration And Rollback Guide

**Last Updated:** 2026-03-12
**Audience:** Operators executing Supabase or schema-affecting changes

## Overview

This guide covers migration execution and rollback planning for CareConnect database changes. Use it alongside:

- [Launch Rollback Procedures](launch-rollback-procedures.md)
- [Production Checklist](../deployment/production-checklist.md)
- [v22.0 DB Migration Readiness Audit](../implementation/v22-0-db-migration-readiness-audit.md)

## Before Running A Migration

- identify the exact migration set and expected schema delta
- confirm a recent backup or recovery path exists in the deployment environment
- verify whether the migration is:
  - additive only
  - destructive
  - backfill/data-rewrite
  - policy/security-sensitive
- confirm any app code that depends on the migration is deploy-synchronized
- record the current deployed revision and the current database state snapshot

## Migration Execution Order

1. Read the migration and rollback notes before execution.
2. Run the migration in the intended environment.
3. Verify the expected objects now exist:
   - tables/views/functions
   - indexes
   - policies
   - seed/reference data if applicable
4. Run repo-local validation appropriate to the change:
   - `npm run type-check`
   - targeted route or integration tests
   - any migration-specific verification query
5. Verify the live app path that depends on the migration.

## Verification Checklist

After the migration:

- confirm affected routes/pages return expected results
- confirm RLS/policy-sensitive reads and writes still behave correctly
- confirm observability does not show elevated error rates
- confirm background/admin operations still work if the migration touched their tables
- document the completion timestamp and operator

## Rollback Strategy By Migration Type

### Additive Schema Changes

Preferred response:

- roll application code back first if the app is the failing layer
- leave additive schema in place if it is harmless and unused after rollback

### Destructive Or Breaking Changes

Preferred response:

- restore from a known-safe schema/data backup if data loss risk exists
- do not improvise reverse migrations during an active incident unless they were prepared and tested in advance

### Backfills And Data Rewrites

Preferred response:

- stop the backfill job or rollback the application path using the rewritten data
- restore data from backup or from a captured pre-backfill export if correctness is compromised

### Policy / RLS Changes

Preferred response:

- verify access behavior immediately after deployment
- if authorization behavior is wrong, revert the policy change before continuing feature debugging

## Incident Escalation

Escalate to rollback immediately when:

- the app cannot read critical data correctly
- unauthorized access becomes possible
- writes fail on core operational paths
- the root cause is unclear and user impact is active

Use:

- [Launch Rollback Procedures](launch-rollback-procedures.md)
- [Incident Response Plan](incident-response-plan.md)

## Required Migration Notes

Every future migration should carry:

- purpose
- affected objects
- expected application dependency
- verification queries or UI checks
- rollback approach
- any irreversible risk
