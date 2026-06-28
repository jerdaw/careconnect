---
status: draft
last_updated: 2026-06-27
owner: jer
tags: [audit, translation, bilingual, closeout-prep]
---

# Access Script French Translation Review Checklist - 2026-06-27

This checklist covers review-only draft translations for `access_script_fr`. These files are not authoritative service data and must not be merged into `data/services.json` until reviewed.

## Summary

- Active input services exported: 195
- Output batches generated: 5
- Closed/inactive service excluded from active export: `pathways-for-children-youth`
- Output directory: `docs/audits/v17-5/ai-results/access-script-fr/output`
- Prompt directory: `docs/audits/v17-5/ai-results/access-script-fr/prompts`

## Review Rules

- Confirm each translation preserves the English meaning exactly.
- Preserve service names, phone numbers, URLs, addresses, and eligibility facts.
- Do not add hours, fees, eligibility, crisis advice, or service claims.
- For crisis services, confirm emergency language matches the English source.
- Record reviewer and date before any merge into `data/services.json`.

## Batch Checklist

- [ ] Review `batch-001.output.json` (40 items) against `batch-001.input.json`.
- [ ] Review `batch-002.output.json` (40 items) against `batch-002.input.json`.
- [ ] Review `batch-003.output.json` (40 items) against `batch-003.input.json`.
- [ ] Review `batch-004.output.json` (40 items) against `batch-004.input.json`.
- [ ] Review `batch-005.output.json` (35 items) against `batch-005.input.json`.

## Merge Gate

Before merging reviewed translations, run:

```bash
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-001.output.json
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-002.output.json
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-003.output.json
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-004.output.json
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-005.output.json
npx tsx scripts/merge-ai-enrichment.ts docs/audits/v17-5/ai-results/access-script-fr/output/batch-*.output.json
npm run validate-data
npm run bilingual-check
npm run audit:access-scripts
npm run search:qa
```
