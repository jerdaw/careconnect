# Admin Operations Guide

**Last Updated:** 2026-03-12
**Audience:** CareConnect operators and admins

## Overview

This guide documents the current repo-backed admin and partner operations that already exist in CareConnect. It is not a roadmap for future admin tooling.

Use this guide with:

- [Launch Monitoring Checklist](launch-monitoring-checklist.md)
- [Launch Rollback Procedures](launch-rollback-procedures.md)
- [Incident Response Plan](incident-response-plan.md)
- [Database Migration and Rollback Guide](database-migration-and-rollback.md)

## Admin Surfaces

### `/[locale]/admin`

Use the admin editor for:

- reviewing the current service list loaded from `/api/admin/data`
- editing core service fields and saving through `/api/admin/save`
- starting a reindex run through `/api/admin/reindex`
- watching live reindex progress through the embedded progress panel

Operational notes:

- reindexing is a write-heavy operation; avoid starting multiple runs concurrently
- confirm the service save completed before leaving the page
- treat admin edits as governance-controlled content changes, not bulk data entry

### `/[locale]/dashboard/feedback`

Use the feedback dashboard for partner-owned service feedback triage.

- open feedback details
- review the issue type and free-text message
- move status through `pending`, `reviewed`, `resolved`, or `dismissed`
- confirm the destructive/error toast path if an update fails

Operational notes:

- partner visibility is filtered through RLS-backed ownership rules
- status updates call `PATCH /api/v1/feedback/[id]`
- frequent triage activity is rate-limited but tuned for normal review use

### `/[locale]/admin/observability`

Use the observability dashboard for:

- circuit breaker state
- health summary
- performance metrics
- provisional SLO compliance

Operational notes:

- unauthenticated users redirect to `/login?next=/admin/observability`
- non-admin authenticated users redirect to `/dashboard`
- use this page during incidents and after rollbacks to confirm recovery

## Common Operations

### Reindex Embeddings

1. Open `/[locale]/admin`.
2. Trigger `Reindex AI`.
3. Keep the tab open until the progress state reaches `complete` or `error`.
4. If the run errors, capture the error text and move to:
   - [Launch Rollback Procedures](launch-rollback-procedures.md)
   - [Incident Response Plan](incident-response-plan.md)

### Triage Service Feedback

1. Open `/[locale]/dashboard/feedback`.
2. Sort mentally by severity first:
   - wrong contact information
   - closures/availability issues
   - eligibility errors
3. Open the feedback detail dialog.
4. Update status and confirm the success toast.
5. If feedback implies a real service-data correction, route the fix through the normal service editing or provider verification path.

### Monitor Platform Health

1. Open `/[locale]/admin/observability`.
2. Verify:
   - circuit breaker is not unexpectedly `OPEN`
   - latency panels are within normal range
   - no active alert pattern is emerging
3. Cross-reference:
   - [High Error Rate Runbook](../runbooks/high-error-rate.md)
   - [Slow Queries Runbook](../runbooks/slow-queries.md)
   - [SLO Violation Runbook](../runbooks/slo-violation.md)

## Pre-Change Checklist

Before admin changes in production:

- confirm the current deployment is healthy via `/api/v1/health`
- confirm no incident is in progress
- confirm rollback steps are understood for the change being made
- avoid stacking content edits, reindexing, and infrastructure changes at the same time

## Post-Change Checklist

After admin changes:

- verify the affected service or page in the public UI
- verify observability remains healthy
- verify no unexpected feedback or error-rate spike follows the change
- document anything operationally surprising in the relevant runbook or implementation summary
