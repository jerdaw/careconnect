# Public Launch Observation Checklist

**Last Updated:** 2026-06-04

This checklist describes public-safe launch observation. Exact monitoring dashboards, alert routing, host commands, and rollback procedures are private maintainer material.

## Before Launch

- [ ] Data validation completed.
- [ ] Critical search and crisis flows tested.
- [ ] Accessibility smoke checks completed.
- [ ] Privacy and terms pages reviewed for conservative claims.
- [ ] No secrets or private paths are present in tracked files.

## During Launch

- [ ] Public homepage loads.
- [ ] Search returns relevant verified services.
- [ ] Crisis resources are surfaced for high-risk language.
- [ ] Service detail pages render contact and eligibility data correctly.
- [ ] Health endpoint returns a public-safe JSON status.

## After Launch

- [ ] Aggregate health remains stable.
- [ ] Feedback intake remains available.
- [ ] Any user-facing issue is triaged without collecting sensitive search text.
- [ ] Private operational notes are updated outside public git.
