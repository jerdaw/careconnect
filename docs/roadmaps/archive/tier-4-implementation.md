# Tier 4 Implementation Plan: Data & Accessibility (V8)

## Goal

Expand the "Kingston 150" dataset with verified sources from municipal, 211, and faith-based organizations. Add culturally safe Indigenous health filters and a contextual land acknowledgment.

**Status**: Completed
**Date**: 2026-01-01

---

## 1. Data Acquisition

Successfully imported and verified data from:

- **City of Kingston**: Homelessness Services & Food Resources (e.g., Integrated Care Hub, Martha's Table) via Open Data/Manual Curation.
- **Indigenous Services**: Added key organizations like Kingston Indigenous Languages Nest (KILN), IIPCT, and Métis Nation of Ontario.
- **Faith-Based**: Added St. Mary's Cathedral Drop-In and Salvation Army CFS.
- **211 Ontario**: Framework established for manual curation/sync.

**Artifacts**:

- `data/seeds/city-of-kingston.geojson`
- `data/seeds/indigenous.geojson`
- `data/seeds/faith-food.geojson`
- `scripts/import/geojson-import.ts`

## 2. Schema Expansion

Updated `types/service.ts`:

- Added `Indigenous` to `IntentCategory`.
- Added `cultural_safety` boolean flag.

## 3. UI & Content Updates

- **Search**: Added "Indigenous" category to search filters.
- **Land Acknowledgment**: Added to the About page below the Governance section.
- **Translations**: Full bilingual support (EN/FR) added for all categories and new content.

## 4. Verification

- [x] `npm run db:validate`: Passed (64 verified records).
- [x] `npm run bilingual-check`: Passed (All records have French translations).
- [x] Unit/E2E: Indigenous filter logic implemented and tested.

## Next Steps

- Proceed to Tier 5 (Future Horizons) or maintenance mode.
- Establish formal data partnership with 211 Ontario for automated sync.
