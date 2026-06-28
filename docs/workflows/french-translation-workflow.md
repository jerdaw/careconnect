---
status: stable
last_updated: 2026-06-28
owner: jer
tags: [workflow, translation, bilingual, data-quality]
---

# French Translation Workflow

## Overview

This workflow describes the process for translating `access_script` content from English to French. Since automated translation APIs are not used in production, CareConnect uses a semi-automated batch process assisted by developer scripts, review, and data validation.

The workflow is translation-only. Do not add service facts, eligibility, fees, hours, crisis advice, URLs, phone numbers, or verification metadata during translation review.

## Tools

We have added helper scripts to `package.json` to streamline this process:

- `npm run translate:prompt <input-batch>`: Generates a prompt file for the translation workflow.
- `npm run translate:parse <input-batch> <response-file>`: Parses the returned translation output into a JSON batch.
- `npm run translate:validate <batch-path>`: Validates the structure and quality of the batch.
- `npx tsx scripts/merge-ai-enrichment.ts <output-batches...>`: Merges reviewed `access_script_fr` values into `data/services.json`.

## Workflow Steps

### 1. Export Data to Batch

First, export the fields that need translation into a batch file.

```bash
npm run export:access-script-fr
```

This creates JSON files in `docs/audits/v17-5/ai-results/access-script-fr/input`.

### 2. Generate Prompt

Generate a formatted prompt for your translation workflow.

```bash
npm run translate:prompt docs/audits/v17-5/ai-results/access-script-fr/input/batch-001.input.json
```

This will output a `batch-001.prompt.md` file in the `prompts/` directory (adjacent to `input/`).

### 3. Get External Translation

1.  Open the generated prompt file.
2.  Submit the prompt to your approved translation workflow.
3.  Copy the returned translation output into a new file, e.g., `response-001.txt`.

### 4. Parse Response

Convert the returned text response back into structured JSON.

```bash
npm run translate:parse docs/audits/v17-5/ai-results/access-script-fr/input/batch-001.input.json response-001.txt
```

This creates a completed release batch in `docs/audits/v17-5/ai-results/access-script-fr/output/batch-001.output.json`.

### 5. Validate Reviewed Output

Validate every reviewed output batch before merging.

```bash
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-001.output.json
```

Repeat validation for each output batch. If a permanently closed or otherwise excluded record requires translation, place the reviewed record in a clearly named supplemental output batch and validate it the same way.

### 6. Merge Reviewed Translations

Merge only after review confirms meaning preservation and token preservation for phone numbers, URLs, email addresses, emergency numbers, addresses, fees, and eligibility wording.

```bash
npx tsx scripts/merge-ai-enrichment.ts docs/audits/v17-5/ai-results/access-script-fr/output/*.output.json
```

After merging, confirm the service-data diff is limited to `access_script_fr`, then run:

```bash
npm run validate-data
npm run bilingual-check
npm run audit:access-scripts
npm run search:qa
```

Commit the reviewed output batches, review checklist or summary, refreshed audit report, and `data/services.json` together so the audit trail matches the data merge.
