---
status: in_progress
last_updated: 2026-01-23
owner: jer
tags: [roadmap, v17.5, data-quality, hours, structured-data]
---

# v17.5 Hours & Structured Data Workspace

This folder supports **Phase 5: Hours & Structured Data** from `docs/roadmaps/archive/2026-01-23-v17-5-data-quality.md`.

## Policy (Governance-First)

- Do **not** fabricate hours.
- Prefer structured `hours` only when it can be supported by:
  - an official provider webpage, government directory listing, or direct confirmation
  - or an already-verified `hours_text` that is unambiguous
- If hours are seasonal/variable, prefer:
  - `hours_text` for human clarity
  - and only add structured `hours` when it will not create false “Open Now” signals

## Commands

- Baseline audit:

  ```bash
  npm run audit:data
  ```

- Export hours gaps (writes a JSON report here):

  ```bash
  npm run audit:hours
  ```

Output:

- `docs/audits/v17-5/hours/outputs/hours-gaps.json`

## Safe automation (No new facts)

If a service already has structured `hours` but is missing `hours_text`, you can backfill the human-readable text automatically:

```bash
npm run backfill:hours-text
```

## Workflow (Recommended)

1. Run `npm run audit:hours`.
2. Triage `docs/audits/v17-5/hours/outputs/hours-gaps.json`:
   - `missing_structured_hours` → add structured `hours` only with strong evidence
   - `missing_hours_text` → add a human-readable `hours_text` (can be sourced from the same evidence)
3. Validate and re-audit:

   ```bash
   npm run validate-data
   npm run audit:data
   npm run audit:hours
   ```
