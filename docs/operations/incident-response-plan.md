# Incident Response Overview

**Last Updated:** 2026-06-04

This public page summarizes CareConnect's incident-response posture. It does not publish escalation contacts, alert channels, host access steps, rollback commands, dashboard URLs, or private infrastructure details.

## Principles

1. Protect users first, especially people using the service during crisis or housing/food insecurity.
2. Preserve privacy: do not inspect, log, or reconstruct user search queries.
3. Prefer data integrity over speed when service listings may be affected.
4. Communicate conservatively and avoid unsupported claims.
5. Keep a blameless post-incident review process for maintainers.

## Public Severity Model

- **Critical:** public service unavailable, search unavailable, security/privacy event, or verified data integrity risk.
- **High:** major user workflow degraded, elevated errors, or partner/admin workflow unavailable.
- **Moderate:** localized degradation with a workaround.
- **Low:** cosmetic or non-urgent documentation issue.

## Public Workflow

1. Confirm the issue without collecting sensitive user input.
2. Contain the impact.
3. Restore critical public search and crisis-resource discovery first.
4. Verify service data integrity where relevant.
5. Publish only public-safe user communications.
6. Record private operational details in ignored maintainer notes.

## Related Docs

- [Runbooks Overview](../runbooks/README.md)
- [Production Checklist](../deployment/production-checklist.md)
- [Post-Mortem Template](../templates/post-mortem.md)
