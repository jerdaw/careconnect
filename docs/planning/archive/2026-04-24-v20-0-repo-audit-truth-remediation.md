---
status: archived
last_updated: 2026-04-24
owner: jer
tags: [planning, v20.0, maintenance, docs, privacy, direct-vps]
---

# v20.0 Repo Audit Truth Remediation

## Summary

This archive records the completed 2026-04-23 repo-audit follow-through for
CareConnect. The work closed production-truth drift in active operational docs,
aligned privacy wording for the feedback surface, and reconciled planning state
so the repo no longer treated the remediation wave as still pending.

## Completed Outcomes

1. Closed active direct-VPS documentation drift:
   - incident, alerting, rollback, and QA docs now describe the real shared-VPS
     runtime instead of the historical Vercel/serverless path
2. Aligned privacy and retention wording:
   - public feedback-retention copy no longer promises an automatic 90-day
     deletion workflow that the implementation does not evidence
3. Reconciled planning lifecycle:
   - the audit-only board and remediation sequence are now archived
   - the roadmap now treats this work as completed maintenance rather than
     active planning
4. Removed the last active provenance example that read like non-human
   contributor attribution:
   - `docs/development/data-schema-drafts.md` now uses tool-neutral research
     wording in its example `_meta.source` field

## Verification Snapshot

Validated on 2026-04-24:

1. `npm run check:refs`
2. `npm run type-check`

## Remaining Follow-Through

These items stay on the active roadmap because they are broader governance
decisions, not unfinished repo-audit cleanup:

1. v22 Gate 0 blocker closure (`C1`, `D4`)
2. future decision on whether higher-severity dependency findings become
   blocking
3. future decision on whether browser E2E stays non-blocking

## Canonical References

1. [Roadmap](../roadmap.md)
2. [Planning index](../README.md)
3. [v20.0 Quiet GitHub Automation and URL Health Hardening](2026-04-23-v20-0-quiet-github-automation-and-url-health-hardening.md)
