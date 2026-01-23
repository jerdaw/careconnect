---
status: in_progress
last_updated: 2026-01-23
owner: jer
tags: [roadmap, v17.5, data-quality, ai, translation, bilingual]
---

# v17.5 Access Script (FR) Translation Workspace

This workspace supports translating `access_script` → `access_script_fr` across `data/services.json` in a **governance-safe** way.

## Why this exists

- v17.5 used Deep Research to generate short access scripts.
- The dataset is multilingual, and we want French users to see a French access script when available.
- Translation must not introduce new factual claims (hours, eligibility, fees, etc.).

## Governance rules

- **Translation-only:** do not browse the web; do not “improve” meaning; do not add new details.
- Preserve service names, phone numbers, and URLs exactly as-is (only translate surrounding wording).
- If the English script includes emergency language (e.g., “call 911”), translate it; otherwise do not add it.

## Workflow

1. Generate translation input batches:

   ```bash
   npm run export:access-script-fr
   ```

   Outputs:
   - `docs/audits/v17-5/ai-results/access-script-fr/input/batch-*.input.json`

2. For each input batch, run the **Translation Prompt** in `docs/roadmaps/archive/2026-01-23-v17-5-ai-prompts.md` and save outputs as:
   - `docs/audits/v17-5/ai-results/access-script-fr/output/batch-001.output.json`
   - `docs/audits/v17-5/ai-results/access-script-fr/output/batch-002.output.json`
   - ...

3. Merge into `data/services.json` (safe by default: no overwrites):

   ```bash
   npx tsx scripts/merge-ai-enrichment.ts docs/audits/v17-5/ai-results/access-script-fr/output/batch-*.output.json
   ```

   If you are re-running translation and explicitly want to overwrite existing French scripts:

   ```bash
   npx tsx scripts/merge-ai-enrichment.ts --overwrite-access-script-fr docs/audits/v17-5/ai-results/access-script-fr/output/batch-*.output.json
   ```

4. Validate and re-audit:

   ```bash
   npm run validate-data
   npm run audit:data
   npm run audit:access-scripts
   ```
