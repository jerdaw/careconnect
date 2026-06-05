# v19.0 Launch Preparation

**Status:** On hold while v22 Gate 0 remains decision-gated.
**Last Updated:** 2026-06-04

This public plan records launch-preparation categories without publishing private deployment, monitoring, rollback, or incident procedures.

## Public Boundary

CareConnect public docs include reproducible local checks, methodology, limitations, and governance principles. Exact live launch execution belongs in private maintainer notes.

## Preparation Areas

1. **Critical workflows:** search, service details, crisis-resource routing, feedback, and partner workflows.
2. **Data readiness:** freshness, contact accuracy, eligibility clarity, and bilingual/plain-language gaps.
3. **Accessibility:** automated checks plus manual keyboard and assistive-technology review.
4. **Privacy:** no search logging, no tracking cookies, minimized analytics, and clear user notices.
5. **Safety:** emergency disclaimers, deterministic crisis routing, and AI limitation copy.
6. **Communications:** factual public messaging with no official-affiliation, clinical, or legal compliance overclaims.
7. **Operations:** private release, monitoring, rollback, and incident procedures prepared before any live launch.

## Public Validation Commands

```bash
npm run lint
npm run type-check
npm run build
npm test
npm run validate-data
npm run test:a11y
```

## Resume Condition

Resume launch execution only when v22 governance gates allow it and private operational readiness is complete.
