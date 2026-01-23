---
status: stable
last_updated: 2026-01-23
owner: jer
tags: [roadmap, v17.5, data-quality, coordinates, geocoding, report]
---

# Coordinate Gap Analysis (2026-01-23)

This report reflects the current coordinate/address gaps **after** v17.5 AI ingestion work and the initial coordinate-policy tightening.

## Summary

Generated from:

- `npm run audit:data`
- `npm run audit:coords` → `docs/audits/v17-5/coordinates/outputs/coordinate-gaps.json`

Totals (2026-01-23):

- Missing `coordinates` (any reason): **58**
- Kingston physical services missing a verified `address`: **17**
- Kingston physical services with a non-geocodable/placeholder `address`: **3**
- Kingston services requiring coordinates (geocodable address) but missing coordinates: **0**

## Why coordinates are not the immediate blocker

The current blockers are primarily **missing or placeholder addresses** for Kingston-scope services. Once a real physical address is present, the geocoding pipeline can add `coordinates` automatically.

## Kingston services needing address verification (17)

These currently have `address_required: true` and `issues: ["missing_address"]` in `coordinate-gaps.json`:

- `kfpl-rideau-heights` (KFPL - Rideau Heights Branch)
- `kingston-pregnancy-care` (Kingston Pregnancy Care Centre)
- `alzheimer-society-kfla` (Alzheimer Society KFL&A)
- `autism-ontario-east` (Autism Ontario (East Region))
- `cnib-kingston` (CNIB Foundation Kingston)
- `kfla-children-services` (KFL&A Children's Services)
- `kingston-east-community-centre` (Kingston East Community Centre)
- `kingston-humane-society` (Kingston Humane Society)
- `st-john-ambulance-kingston` (St. John Ambulance)
- `red-cross-kingston` (Canadian Red Cross - Kingston)
- `habitat-for-humanity-kingston` (Habitat for Humanity Kingston)
- `odsp-kingston` (ODSP Kingston Office)
- `service-canada-kingston` (Service Canada Centre)
- `service-ontario-kingston` (ServiceOntario)
- `kingston-police-non-emerg` (Kingston Police (Non-Emergency))
- `opp-frontenac` (OPP Frontenac Detachment)
- `coast-mental-health` (COAST (Crisis Outreach))

## Kingston services with intentional non-geocodable address notes (3)

These currently have `issues: ["non_geocodable_address"]` and should remain non-geocoded unless the governance decision changes:

- `kingston-interval-house` (mailing-only address / confidentiality)
- `lionhearts-fresh-food-market` (pop-up / rotating locations)
- `tnet-kingston` (privacy-protecting “contact for location”)

## Next actions (Phase 3)

1. For the 17 missing-address services:
   - verify a stable physical location from a trusted source (official site, municipal directory, government listing)
   - update `data/services.json` `address` accordingly
2. Run `OPENCAGE_API_KEY=... node --import tsx scripts/geocode-services.ts` to backfill `coordinates` once addresses exist.
3. Re-run `npm run audit:data` and confirm:
   - `Coordinates (geocodable)` stays near 0
   - `Kingston missing address` decreases to 0
