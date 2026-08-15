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

## Related Docs

- [Runbooks Overview](../runbooks/README.md)
- [Production Checklist](../deployment/production-checklist.md)
- [Post-Mortem Template](../templates/post-mortem.md)
