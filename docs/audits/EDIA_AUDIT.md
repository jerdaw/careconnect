# EDIA Audit & Findings (Phase 19)

**Date:** December 29, 2025
**Scope:** Accessibility (WCAG AA) and Inclusivity (Content & Representation)

## 1. Technical Accessibility Audit

| Component         | Issue                                                         | WCAG Criteria            | Severity | Status    |
| ----------------- | ------------------------------------------------------------- | ------------------------ | -------- | --------- |
| `page.tsx`        | Search input missing explicit `<label>` or `aria-label`.      | 1.1.1 Non-text Content   | High     | **Fixed** |
| `page.tsx`        | `autoFocus` on search input can be disorienting for SR users. | 2.4.3 Focus Order        | Medium   | **Fixed** |
| `page.tsx`        | Search status update ("Neural Search Active") not announced.  | 4.1.3 Status Messages    | Medium   | **Fixed** |
| `ServiceCard.tsx` | "Details" link opens in new window without SR warning.        | 3.2.5 Change on Request  | Medium   | **Fixed** |
| `BetaBanner.tsx`  | Non-semantic container (`div` instead of `aside`/`header`).   | 1.3.1 Info and Relations | Low      | **Fixed** |

## 2. Content Inclusivity Review

| Item            | Observation                                                                                              | Recommendation                                                                                                     | Status          |
| --------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------- |
| `services.json` | "Homeless" used as noun/adjective in Eligibility Notes (e.g., "Homeless men", "Women who are homeless"). | Change to "People experiencing homelessness" in Notes/Descriptions. Keep "homeless" in synthetic queries (SEO).    | **Pending Fix** |
| `services.json` | "Disabled" used in synthetic queries.                                                                    | Acceptable for search matching, but descriptions should use "People with disabilities" (Verified: generally good). | **Pass**        |
| `services.json` | French translation of "people with disabilities" is "personnes handicapées".                             | Consider "personnes en situation de handicap" for higher formality/dignity, though "handicapées" is common.        | **Review**      |
| Identity Tags   | Covers: Youth, Trans-Led, Indigenous, Francophone. Missing: Seniors specific? (Existing tag: 'Seniors'). | seem adequate.                                                                                                     | **Pass**        |

## 3. Action Plan

- [ ] Run automated contrast check.
- [ ] Manual keyboard navigation test.
- [ ] Screen reader simulation.
