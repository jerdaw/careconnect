# Ingestion Pipeline Scripts

Tools for adding Ontario-wide services using AI via **web interfaces** (no API keys needed).

## Workflow

```
1. Generate Prompt → 2. Copy to Gemini/ChatGPT → 3. Paste Response → 4. Human Review
```

## Scripts

### 1. Discovery: `prospector.ts`

Generates a prompt for discovering services.

```bash
npx tsx scripts/ingest/prospector.ts --vertical=crisis --count=5
```

Copy the output, paste into gemini.google.com or chatgpt.com.

### 2. Import Response: `import-response.ts`

Parses the AI response and saves draft files.

```bash
npx tsx scripts/ingest/import-response.ts --vertical=crisis
# Then paste the JSON response and press Ctrl+D
```

### 3. Enrichment Prompts: `enrich-prompt.ts`

Generates prompts to enrich existing drafts with hours, translations, etc.

```bash
npx tsx scripts/ingest/enrich-prompt.ts --vertical=crisis
```

### 4. Human Review: `../verify-drafts.ts`

Interactive CLI to approve/reject drafts.

```bash
npx tsx scripts/verify-drafts.ts
```

## Folder Structure

```
data/drafts/ontario/
├── crisis/     # Crisis services drafts
├── health/     # Health services drafts
└── legal/      # Legal services drafts
```
