# v17.5 AI Ingestion — Follow-Up Fix: `community-harvest-market` (2026-01-23)

## Why This Exists

The initial evidence spot-check for v17.5 AI ingestion found that the `community-harvest-market` provenance `evidence_url` returned `404`, which is a governance risk (dead source link + potential drift in service details).

Reference:

- `docs/roadmaps/v17-5-ai-results/reports/evidence-spotcheck-2026-01-22.md`

## What Changed

In `data/services.json`:

- Updated `url` + `provenance.evidence_url` away from the `kchc.ca/community-harvest` page that returned `404`.
- Updated `access_script` to direct users to the stable program page for details and to KCHC for current-season confirmation.
- Updated contact fields to KCHC contact info for the relevant site.
- Kept `hours` as **notes-only** because the market is seasonal (June–October), and the schema currently cannot represent seasonality safely without creating false “Open Now” signals.

## Source Notes (What We Used)

- Loving Spoonful Community Harvest Markets program page (schedule + locations):
  - https://www.lovingspoonful.org/programs/community-harvest-markets/
- Loving Spoonful home page notice indicating program transition to KCHC (context / governance risk):
  - https://www.lovingspoonful.org/
- KCHC 263 Weller Ave location contact info (phone/email for current-season confirmation):
  - https://kchc.ca/locations/263-weller-ave/

## Remaining Risk / Future Work

- Seasonal programs need a safe representation in the schema (e.g., explicit season ranges) if we want “Open Now” to work without false positives.
- Consider adding a lightweight “last verified” workflow for URLs that drift frequently.
