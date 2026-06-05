# Public Final QA Procedures

**Last Updated:** 2026-06-04

This public QA checklist covers reproducible checks that are safe to publish. Production host checks, private dashboards, and exact release procedures are excluded.

## Core Checks

- [ ] `npm run lint`
- [ ] `npm run type-check`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm run validate-data`
- [ ] representative local search queries pass
- [ ] privacy and crisis copy reviewed
- [ ] no secrets, private paths, or private notes are tracked

## Manual Review

- homepage search,
- service detail page,
- crisis query behavior,
- feedback form,
- language switcher,
- keyboard navigation,
- high-contrast mode.
