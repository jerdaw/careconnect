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
more compact, restored and refined the high-level service/category/language
metrics rail, and kept the resting homepage focused on private search and trust
signals. Follow-up polish folded the trust-strip content into a clearer
`How It Works` section, refined the category-to-process spacing, improved the
hero and footer copy/layout, and kept all user-facing copy localized across the
seven supported UI locales. No curated service records or verification levels
changed.

## Completed Outcomes

1. Moved utility and category filters out of the resting hero and into the
   active search/results state.
2. Reworked active filters into compact segmented controls with keyboard and
   screen-reader semantics preserved through button roles, `aria-pressed`, and
   `aria-expanded`.
3. Collapsed secondary categories behind a "More categories" control while
   keeping selected hidden categories visible.
4. Restored the `196` services, `12` categories, and `7` languages metrics rail
   in the resting discovery flow.
5. Tuned spacing around the search bar, quick-search chips, active filters,
   stats/trust sections, how-it-works section, and footer across desktop and
   mobile layouts.
6. Reworked the restored stats surface into a restrained semantic `dl` metrics
   rail with a subtle brand accent line, gradient number treatment, and clean
   dividers.
7. Improved contrast and mobile ergonomics on related homepage/search surfaces,
   including quick-search chips, scope filters, service card support text, and
   the chat launcher.
8. Added localized `moreCategories` and `fewerCategories` strings for all seven
   supported UI locales.
9. Updated `SearchControls` component coverage for the collapsed/expanded
   category state.
10. Replaced the separate homepage trust-strip row with concise, step-specific
    `How It Works` detail cards that reinforce privacy, filtering, and direct
    provider contact without adding a longer marketing section.
11. Refined the category shortcut rail spacing and kept the shortcuts tied to
    the existing search/category selection flow.
12. Updated the homepage hero subtitle and `How It Works` copy to be clearer
    and less repetitive while preserving the privacy-first message.
13. Polished the `How It Works` heading, connector row, and cards with restrained
    visual hierarchy, accessible headings, and no extra decorative icon layer.
14. Improved the footer medium-width layout so the brand block and Community,
    Resources, and Legal columns remain balanced.
15. Localized the final homepage credibility copy for all seven supported UI
    locales and refreshed component smoke coverage.

## Verification Snapshot

Validated on 2026-04-29:

1. `npx vitest run tests/components/home/SearchControls.test.tsx`
2. `npx vitest run tests/components/home/HomeSurfaces.test.tsx`
3. `npm run lint`
4. `npm run type-check`
5. `npm run format:check`
6. Commit hook checks: ESLint, Prettier, related Vitest, type-check, and i18n
   audit
7. Pre-push `npm test`: `180` files passed, `1321` tests passed, `24` skipped
8. Closeout verification for the follow-up polish:
   `npm test -- tests/components/home/HomeSurfaces.test.tsx`,
   `npm run lint`, `npm run type-check`, `npm run i18n-audit`,
   `npm run format:check`, and `git diff --check`

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
