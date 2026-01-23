---
status: stable
last_updated: 2026-01-23
owner: jer
tags: [audit, v17.5, data-quality, enrichment]
---

# v17.5 Data Quality Summary (Close-out Snapshot)

This note captures the v17.5 data-quality improvements and the remaining follow-ups.

## How to recompute

```bash
npm run validate-data
npm run audit:data
npm run audit:coords
npm run audit:hours
npm run audit:access-scripts
npm run audit:l3
```

## Baseline (Snapshot: 2026-01-21)

From `docs/roadmaps/archive/2026-01-23-v17-5-data-quality.md` (historical baseline section):

- Total services: 196
- Missing `scope`: 0
- Missing `coordinates` (any): 58
- Missing `coordinates` (required): 18
- Kingston missing `address`: 17
- Missing `access_script`: 143
- Missing `plain_language_available`: 0
- Missing structured `hours`: 122
- Verification distribution: L1: 121 / L2: 75 / L3: 0

## Current (Close-out Snapshot: 2026-01-23)

From `npm run audit:data` (run on 2026-01-23):

- Total services: 196
- Missing `scope`: 0
- Missing `coordinates` (any): 58
- Missing `coordinates` (required): 18
- Kingston missing `address`: 17
- Missing `access_script`: 0
- Missing `plain_language_available`: 0
- Missing structured `hours` (any): 11 (10 active)
- Missing `hours_text` (any): 10 (10 active)
- Verification distribution: L1: 121 / L2: 75 / L3: 0

## What was implemented in v17.5 (Code + Tooling)

- AI Deep Research ingestion workflow + traceability artifacts:
  - `docs/adr/011-ai-deep-research-output-ingestion.md`
  - `docs/roadmaps/archive/2026-01-23-v17-5-ai-output-ingestion.md`
  - `docs/audits/v17-5/ai-results/`
- Public UI now surfaces `access_script` on service detail pages (multi-lingual via `next-intl`).
- Hours tooling and safe backfill from structured `hours` → `hours_text`:
  - `npm run audit:hours`
  - `npm run backfill:hours-text`
- Coordinate gap tooling and reports:
  - `npm run audit:coords`
  - `docs/audits/v17-5/coordinates/`
- L3 candidate suggestions tooling + governance-safe tracker:
  - `npm run audit:l3`
  - `data/verification/l3-candidates.csv` (PII-free only)
- Added regression coverage for “Open Now” overnight logic and printable hours rendering.

## Remaining Follow-ups (Operational Confirmations)

These are intentionally tracked in `docs/roadmaps/roadmap.md` under v17.5:

- Non-IRL (web verification): remaining missing Kingston addresses and missing structured hours/hours_text.
- IRL (provider outreach): L3 verification upgrades.
- Bilingual follow-up: populate `access_script_fr` (translation-only; no new facts) using the workflow in:
  - `docs/audits/v17-5/ai-results/access-script-fr/README.md`
