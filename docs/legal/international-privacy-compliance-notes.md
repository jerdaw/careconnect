# International Privacy And Compliance Notes

**Last Updated:** 2026-03-12
**Status:** Governance reference, not legal sign-off

## Purpose

This note describes the current CareConnect privacy and compliance posture for international/privacy-adjacent review. It does not claim formal certification or legal approval.

Use this note with:

- [Privacy Architecture Whitepaper](../whitepapers/privacy_architecture.md)
- [AI Compliance Audit](ai_compliance_audit.md)
- [Privacy Impact Assessment](../audits/2026-01-03-privacy-impact-assessment.md)

## Current Privacy Posture

### Search Privacy

- public search is privacy-first by design
- the architecture avoids tracking end-user search queries by default
- local mode keeps query processing on-device where supported
- server-mode search must preserve the repo policy of zero query logging

### Local Storage And Device Data

- offline support uses IndexedDB and local browser storage for cached service data and queued feedback
- this means data can exist on the user’s device even when CareConnect does not retain it server-side
- users need a clear local clearing path for device-stored history and cached data

### Feedback And Update Requests

- issue reports and partner update requests are explicit user submissions, not passive tracking
- these submissions are rate-limited and processed through authenticated or structured endpoints
- review and retention practice still depends on the broader v22 governance decisions

## GDPR / International Framing

### What CareConnect Can Reasonably Claim Today

- data minimization is a design goal
- search telemetry is intentionally constrained
- local-first/offline patterns reduce central collection risk
- security headers, rate limiting, and documented incident procedures are part of the technical control set

### What CareConnect Should Not Claim Today

- formal GDPR compliance certification
- completed cross-border transfer analysis for every deployment path
- completed retention/legal-basis approval for all future pilot integrations
- legal sufficiency of this document by itself

## Operational Expectations

- avoid introducing new server-side search logging without a documented governance review
- document any new browser storage or background sync behavior before shipping it
- when adding third-party integrations, update the privacy impact assessment and retention documentation together
- if future deployments store new categories of personal data, re-evaluate legal scope before launch

## Known Gaps

- v22 Gate 0 retention and deletion sign-off is still externally blocked
- partner/legal evidence for conditional integrations is still not complete
- this note does not replace region-specific counsel for PHIPA, GDPR, or other jurisdictional obligations
