---
status: in_progress
last_updated: 2026-01-23
owner: jer
tags: [roadmap, v17.5, data-quality, verification, l3]
---

# v17.5 Verification (L3) Workspace

This folder supports **Phase 6: Verification Level Upgrades** from `docs/roadmaps/archive/2026-01-23-v17-5-data-quality.md`.

## Goal

Move selected high-impact services from:

- `verification_level: "L2"` (vetted / contact made)
  to
- `verification_level: "L3"` (provider-confirmed)

## Governance rules

- **No implied affiliation**: L3 means “confirmed by the provider,” not “endorsed by government.”
- **No private communications in git**: do not commit email bodies, names, direct phone numbers of staff, or screenshots of private portals.
- Prefer confirmations that can be supported by:
  - a provider webpage that explicitly states hours/contact/eligibility, or
  - a short provider confirmation that can be summarized without PII (store only date + method + what was confirmed).

## Tracker

Primary tracker (manual):

- `data/verification/l3-candidates.csv`

This should record outreach status and which fields were confirmed (hours, address, phone, eligibility, etc.).

## Commands

- Generate a suggestion list for which L2 services to prioritize:

  ```bash
  npm run audit:l3
  ```

Outputs:

- `docs/roadmaps/v17-5-verification/outputs/l3-candidate-suggestions.json`
