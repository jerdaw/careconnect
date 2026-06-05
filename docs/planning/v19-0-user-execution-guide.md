# v19.0 Public Launch-Readiness Guide

**Status:** On hold while v22 Gate 0 remains decision-gated.
**Last Updated:** 2026-06-04

This public guide preserves launch-readiness methodology without publishing private host access, monitoring, rollback, alerting, or production environment procedures.

## Public Documentation Boundary

This repository contains public project documentation and reproducible development information. Deployment details, credentials, monitoring configuration, private operational notes, and environment-specific production paths are intentionally excluded from public documentation.

## Launch-Readiness Areas

1. **Data integrity:** confirm manually curated service data remains valid and fresh.
2. **Search quality:** test food, crisis, housing, and high-risk queries.
3. **Accessibility:** verify keyboard navigation, screen reader basics, focus states, and contrast.
4. **Privacy:** confirm search queries are not logged and no tracking cookies are introduced.
5. **Crisis safety:** confirm emergency resources are surfaced and AI does not provide crisis counselling.
6. **Partner workflows:** test organization, listing, and feedback workflows in a controlled environment.
7. **Public communication:** use conservative, factual messaging and avoid official-affiliation or clinical claims.

## Public-Safe Validation Commands

```bash
npm run lint
npm run type-check
npm run build
npm test
npm run validate-data
npm run search:qa
```

## On-Hold Rule

Do not resume public launch execution until v22 Gate 0 permits it and private maintainer procedures are ready.
