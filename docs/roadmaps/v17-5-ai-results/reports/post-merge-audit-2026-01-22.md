# v17.5 AI Output Ingestion — Post-Merge Audit (2026-01-22)

This report captures Phase 5 automated verification after merging normalized AI enrichment outputs into `data/services.json`.

## Validation

Command:

```bash
npm run validate-data
```

Result:

- Total services: 196
- Passed: 196
- Failed: 0
- Warnings: 0

## Data Completeness Audit

Command:

```bash
npm run audit:data
```

Results (snapshot):

- Total services: 196
- Missing `scope`: 0 (0%)
- Missing `coordinates`: 58 (30%)
- Missing `access_script`: 0 (0%)
- Missing `plain_language_available`: 0 (0%)
- Missing structured `hours`: 12 (6%)
- Missing `hours_text`: 67 (34%)

Verification level distribution:

- L1: 121
- L2: 75

## Notes / Implications

- `access_script` gap is now fully closed (0 missing).
- Structured `hours` gap is reduced substantially (only 12 services remain without structured `hours`).
- The largest remaining gaps are still `coordinates` and `hours_text`.

## Next Steps

- Proceed to Phase 6 (Governance QA sampling) focusing on:
  - Crisis services (safety + hours accuracy)
  - Services with newly added hours/access scripts
- Continue v17.5 work for coordinates (Phase 3 of `archive/2026-01-23-v17-5-data-quality.md`).
