---
status: draft
last_updated: 2026-06-04
owner: maintainer
tags: [ai, privacy, risk-review]
---

# AI Risk And Privacy Review

**Status:** Draft technical risk note. This is not legal advice, not a formal compliance certification, and not a substitute for privacy/legal review.

## Scope

CareConnect uses browser-based AI features only for query refinement and search assistance. User-facing results are rendered from the verified service directory rather than free-form model answers.

This review covers:

- privacy-conscious AI architecture,
- crisis-safety boundaries,
- hallucination and overreliance risks,
- accessibility considerations,
- documentation and governance controls.

## Current Safeguards

1. **Local-first processing:** AI query assistance is designed to run in the browser where supported.
2. **Deterministic rendering:** Service links and details come from curated directory data.
3. **Crisis routing:** High-risk language should bypass open-ended AI behavior and surface emergency resources.
4. **No search logging:** Public search should not store raw query text.
5. **Clear disclaimers:** The tool is not a doctor, lawyer, social worker, crisis counselor, or emergency service.

## Privacy Posture

The architecture is informed by Canadian privacy principles and PIPEDA/PHIPA considerations, especially data minimization and limiting unnecessary data egress. This document does not claim formal PIPEDA, PHIPA, GDPR, AODA, or AI Act compliance.

Risk controls should be re-reviewed if future changes introduce:

- server-side AI processing,
- chat transcript storage,
- search-query logging,
- third-party analytics,
- new partner data-sharing workflows,
- clinical or eligibility decision support.

## Safety Risks

The main AI risks are:

- users over-trusting generated wording,
- hallucinated service availability,
- inappropriate crisis guidance,
- inaccessible dynamic UI updates,
- privacy leakage through logs or third-party integrations.

CareConnect reduces these risks by limiting model output, rendering verified service data, and keeping crisis flows deterministic.

## Review Checklist

- [ ] AI output is not used as the source of truth for service details.
- [ ] Crisis flows are deterministic and keyboard-accessible.
- [ ] No raw search query or chat transcript storage is introduced.
- [ ] Accessibility checks cover dynamic AI/search states.
- [ ] Public claims remain evidence-bound and avoid formal compliance overclaims.
- [ ] Legal/privacy review is obtained before any clinical, partner-data-sharing, or server-side AI expansion.

## Related Docs

- [Privacy Architecture](../whitepapers/privacy_architecture.md)
- [Architecture](../architecture.md)
- [Governance Standards](../governance/standards.md)
