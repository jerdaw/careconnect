# French Translation Workflow

## Overview
This workflow describes the process for translating `access_script` content from English to French. Since automated translation APIs are not used in production, we use a semi-automated batch process assisted by developer scripts.

## Tools
We have added helper scripts to `package.json` to streamline this process:
*   `npm run translate:prompt <input-batch>`: Generates a prompt file for AI tools (Claude/ChatGPT).
*   `npm run translate:parse <input-batch> <response-file>`: Parses the AI's response into a JSON batch.
*   `npm run translate:validate <batch-path>`: Validates the structure and quality of the batch.

## Workflow Steps

### 1. Export Data to Batch
First, export the fields that need translation into a batch file.
```bash
npm run export:access-script-fr
```
This creates JSON files in `docs/audits/v17-5/ai-results/access-script-fr/input`.

### 2. Generate Prompt
Generate a formatted prompt for your AI tool of choice.
```bash
npm run translate:prompt docs/audits/v17-5/ai-results/access-script-fr/input/batch-001.json
```
This will output a `batch-001-prompt.md` file in the `prompts/` directory (adjacent to `input/`).

### 3. Get External Translation
1.  Open the generated prompt file.
2.  Copy the content into Claude or ChatGPT.
3.  Copy the AI's response into a new file, e.g., `response-001.txt`.

### 4. Parse Response
Convert the AI's text response back into structured JSON.
```bash
npm run translate:parse docs/audits/v17-5/ai-results/access-script-fr/input/batch-001.json response-001.txt
```
This creates a completed release batch in `docs/audits/v17-5/ai-results/access-script-fr/output/batch-001.json`.

### 5. Validate and Commit
Validate the output before committing.
```bash
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-001.json
```

Once validated, commit the `output/` batch file. It is now ready for ingestion by the `backfill` or `import` workflows.
