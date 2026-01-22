---
description: Run data enrichment workflow to fill missing service fields
---

# Data Enrichment Workflow

This workflow runs the standardized data enrichment process to address gaps in scope, coordinates, hours, and access scripts.

## Prerequisites

- OpenCage API key (for geocoding) — set in `.env.local`
- Backup of current data

## Step 1: Create Backup

// turbo

```bash
cp data/services.json data/services.backup.json
```

## Step 2: Run Data Audit

// turbo

```bash
npm run audit:data
```

Review output to understand current gaps.

## Step 3: Assign Scopes

// turbo

```bash
npx tsx scripts/assign-scopes.ts
```

Spot-check 20 random services after running.

## Step 4: Geocode Addresses

Requires `OPENCAGE_API_KEY` in environment.

```bash
OPENCAGE_API_KEY=$OPENCAGE_API_KEY npx tsx scripts/geocode-services.ts
```

Review failures and manually add coordinates for 10-20 services if needed.

## Step 5: Parse Hours

// turbo

```bash
npx tsx scripts/convert-hours-to-structured.ts
```

For complex formats, use ChatGPT with the prompt from the SOP.

## Step 6: Generate Access Scripts

// turbo

```bash
npx tsx scripts/assign-access-scripts.ts
```

## Step 7: Run Plain Language Audit

// turbo

```bash
npx tsx scripts/audit-plain-language.ts
```

## Step 8: Validate Data

// turbo

```bash
npm run validate-data
```

All validations must pass.

## Step 9: Run Final Audit

// turbo

```bash
npm run audit:data
```

Compare with Step 2 output to verify improvement.

## Step 10: Commit Changes

```bash
git add data/services.json
git commit -m "data: enrich services with scope, coordinates, hours"
```

## Reference

- Full SOP: `docs/governance/data-enrichment-sop.md`
- Decision rationale: `docs/adr/009-data-enrichment-process.md`
