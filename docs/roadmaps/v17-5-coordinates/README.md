---
status: in_progress
last_updated: 2026-01-23
owner: jer
tags: [roadmap, v17.5, data-quality, coordinates, geocoding]
---

# v17.5 Coordinates & Geocoding Workspace

This folder supports **Phase 3: Geocoding & Coordinates** from `docs/roadmaps/2026-01-17-v17-5-data-quality.md`.

## Policy (Governance-First)

- **Coordinates exist to support distance search** and map UX for services with a **real physical location**.
- Do **not** add coordinates to:
  - phone/online services (set `virtual_delivery: true`)
  - records with “Virtual / Confidential / Various Locations / Moved” placeholder addresses
  - services outside Kingston scope, unless there is a user-facing reason to show a physical location
- If a service has no stable physical location (pop-ups, rotating sites), prefer:
  - `address` as a clear location note (human-readable)
  - no `coordinates` (avoid false precision)

## Commands

- Baseline audit:

  ```bash
  npm run audit:data
  ```

- Export coordinate gaps (writes a JSON report here):

  ```bash
  npm run audit:coords
  ```

- Geocode (requires internet + OpenCage key):

  ```bash
  OPENCAGE_API_KEY=xxx npm run geocode
  # Or:
  OPENCAGE_API_KEY=xxx node --import tsx scripts/geocode-services.ts
  ```

## Workflow (Recommended)

1. Run `npm run audit:coords`.
2. Open `docs/roadmaps/v17-5-coordinates/outputs/coordinate-gaps.json` (already filtered to items with `issues`) and triage:
   - `issues` contains `missing_address` → add a verified physical `address`
   - `issues` contains `non_geocodable_address` → replace placeholder text with a real address OR mark `virtual_delivery: true` when appropriate
   - `issues` contains `missing_coordinates` → run the geocoder and/or add coordinates manually
3. Re-run `npm run audit:data` to confirm the “required” metrics improve.
