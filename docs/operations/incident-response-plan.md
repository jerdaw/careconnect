# Incident Response Overview

**Last Updated:** 2026-08-15

This public page summarizes CareConnect's incident-response posture. It does not publish escalation contacts, alert channels, host access steps, rollback commands, dashboard URLs, or private infrastructure details.

## Post-Retirement Boundary

The actionable public directory is retired. Existing automation is the default
for status and infrastructure signals; there is no routine manual incident
watch. Human response is exception-only and limited to a genuine safety,
status, security, privacy, rollback, infrastructure, or data-loss incident.
Incident response does not authorize restoration of search, service records,
partner/admin operations, or another public directory.

## Principles

1. Protect visitors first, including preserving truthful retirement information and external emergency routing.
2. Preserve privacy: do not inspect, log, or reconstruct user search queries.
3. Preserve the retired data boundary and fail closed when stale listings could become reachable.
4. Communicate conservatively and avoid unsupported claims.
5. Keep a blameless post-incident review process for maintainers.

## Public Severity Model

- **Critical:** misleading or bypassable retirement status, missing emergency routing, a security/privacy event, or a verified data-loss or rollback/infrastructure failure.
- **High:** persistent retirement-surface or preserved health/status-contract failure.
- **Moderate:** localized degradation with a workaround.
- **Low:** cosmetic or non-urgent documentation issue.

## Public Workflow

1. Confirm an automated signal or reported issue without collecting sensitive user input.
2. Contain the impact.
3. Restore or preserve the localized retirement surface, external emergency links, and required health/status contract as applicable.
4. Do not restore search, service records, or legacy admin/partner surfaces; any such action requires the roadmap's reopening gate and separate approval.
5. Verify preserved rollback or infrastructure only to the extent required by the incident.
6. Publish only public-safe user communications.
7. Record private operational details in ignored maintainer notes.

## Automated Coverage

- The daily, manually dispatchable `Production Smoke` workflow verifies the
  exact approved public release, localized retirement pages, emergency links,
  fail-closed non-health APIs, retired discovery metadata, and runtime security
  headers. A failure opens or refreshes one persistent issue; a later successful
  run closes it automatically.
- The separate daily `Supabase Keepalive` workflow queries the CareConnect and
  VisitBrief Data APIs and maintains its own persistent failure issue. It does
  not call or verify the CareConnect frontend.
- Pull-request and main-branch CI verify the source, tests, production build,
  retirement client-artifact boundary, and container build when code changes.
- Legacy URL-health, staleness, crisis-verification, and general-verification
  workflows are manual-only with dry-run defaults. They are not standing
  maintenance signals and do not authorize listing refresh or corpus work.

These public checks cannot prove the continued availability of private rollback
artifacts, a current database export, host backups, or provider recovery. Verify
those private assets only during an approved release or a genuine incident by
following the shared operations source of truth.

## Related Docs

- [Runbooks Overview](../runbooks/README.md)
- [Production Checklist](../deployment/production-checklist.md)
- [Post-Mortem Template](../templates/post-mortem.md)
