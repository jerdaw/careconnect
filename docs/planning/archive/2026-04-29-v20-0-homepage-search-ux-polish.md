---
status: archived
last_updated: 2026-04-29
owner: jer
tags: [planning, v20.0, maintenance, homepage, accessibility]
---

# v20.0 Homepage Search UX Polish

## Summary

This archive records the completed 2026-04-29 homepage search UX maintenance
pass while v22.0 Gate 0 remains blocked on external evidence.

The work tightened the homepage search area, made the active search filters
more compact, restored the high-level service/category/language stats banner,
and kept the resting homepage focused on private search and trust signals.
No curated service records or verification levels changed.

## Completed Outcomes

1. Moved utility and category filters out of the resting hero and into the
   active search/results state.
2. Reworked active filters into compact segmented controls with keyboard and
   screen-reader semantics preserved through button roles, `aria-pressed`, and
   `aria-expanded`.
3. Collapsed secondary categories behind a "More categories" control while
   keeping selected hidden categories visible.
4. Restored the `196` services, `12` categories, and `7` languages stats banner
   in the resting discovery flow.
5. Tuned spacing around the search bar, quick-search chips, active filters, and
   stats/trust sections across desktop and mobile layouts.
6. Improved contrast and mobile ergonomics on related homepage/search surfaces,
   including quick-search chips, scope filters, service card support text, and
   the chat launcher.
7. Added localized `moreCategories` and `fewerCategories` strings for all seven
   supported UI locales.
8. Updated `SearchControls` component coverage for the collapsed/expanded
   category state.

## Verification Snapshot

Validated on 2026-04-29:

1. `npx vitest run tests/components/home/SearchControls.test.tsx`
2. `npm run lint`
3. `npm run type-check`
4. Commit hook checks: ESLint, Prettier, related Vitest, type-check, and i18n
   audit
5. Pre-push `npm test`: `180` files passed, `1321` tests passed, `24` skipped

Local Playwright test suites were not run, per the free-tier CI testing posture.
The UI spacing was inspected through the running local app with desktop and
mobile viewport screenshots.

## Remaining Follow-Through

No new roadmap follow-up remains for this homepage UX pass. Existing v22.0 Gate
0 blockers are unchanged:

1. `UA-1 / G0-3`: attach candidate partner legal/API terms and complete
   clause-level C1 review.
2. `UA-3 / G0-8`: attach named pilot partner list, outreach owner assignment,
   and dated outreach execution evidence.

## Canonical References

1. [Roadmap](../roadmap.md)
2. [Planning index](../README.md)
3. [Testing guidelines](../../development/testing-guidelines.md)
