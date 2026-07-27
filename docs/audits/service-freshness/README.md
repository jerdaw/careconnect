---
status: stable
last_updated: 2026-07-26
owner: jer
tags: [audit, data-quality, verification, freshness]
---

# Service Freshness Audits

This directory stores dated snapshots from `npm run check-staleness`. These
snapshots are operational queues only; they do not update service facts,
verification dates, or provenance.

## Generate A Snapshot

```bash
npm run check-staleness -- --as-of YYYY-MM-DD --out-dir docs/audits/service-freshness/YYYY-MM-DD
```

Each run writes:

1. `staleness-report.json` - machine-readable counts and row-level freshness state.
2. `staleness-summary.md` - human-readable summary and immediate queue.
3. `verification-worksheet.csv` - spreadsheet-safe worksheet for manual reverification.

## Current Snapshot

The [2026-07-26 snapshot](2026-07-26/staleness-summary.md) records:

- Total services: 204
- Fresh: 8
- Visible within the 180-day window but due for reverification: 0
- Hidden pending reverification: 196
- Unknown verification date: 0

Use the worksheet to drive manual verification. Update `data/services.json` only
after evidence is recorded.
