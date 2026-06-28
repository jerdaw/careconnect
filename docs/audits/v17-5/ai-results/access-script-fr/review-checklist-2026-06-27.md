---
status: reviewed
last_updated: 2026-06-28
owner: jer
tags: [audit, translation, bilingual, closeout-prep]
---

# Access Script French Translation Review Checklist - 2026-06-27

This checklist covers reviewed translations for `access_script_fr`. The review is translation-only and does not add, remove, or alter service facts.

## Summary

- Active input services exported: 195
- Supplemental closed/merged service translated: `pathways-for-children-youth`
- Total reviewed translation records: 196
- Output batches generated: 6
- Output directory: `docs/audits/v17-5/ai-results/access-script-fr/output`
- Prompt directory: `docs/audits/v17-5/ai-results/access-script-fr/prompts`

## Review Rules

- Confirm each translation preserves the English meaning exactly.
- Preserve service names, phone numbers, URLs, addresses, and eligibility facts.
- Do not add hours, fees, eligibility, crisis advice, or service claims.
- For crisis services, confirm emergency language matches the English source.
- Record reviewer and date before any merge into `data/services.json`.

## Batch Checklist

- [x] Review `batch-001.output.json` (40 items) against `batch-001.input.json`.
- [x] Review `batch-002.output.json` (40 items) against `batch-002.input.json`.
- [x] Review `batch-003.output.json` (40 items) against `batch-003.input.json`.
- [x] Review `batch-004.output.json` (40 items) against `batch-004.input.json`.
- [x] Review `batch-005.output.json` (35 items) against `batch-005.input.json`.
- [x] Review `supplemental-closed-services.output.json` (1 item) against `data/services.json`.

## Merge Gate

Before merging reviewed translations, run:

```bash
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-001.output.json
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-002.output.json
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-003.output.json
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-004.output.json
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-005.output.json
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/supplemental-closed-services.output.json
npx tsx scripts/merge-ai-enrichment.ts docs/audits/v17-5/ai-results/access-script-fr/output/*.output.json
npm run validate-data
npm run bilingual-check
npm run audit:access-scripts
npm run search:qa
```
