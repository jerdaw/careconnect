---
description: Audit data-enrichment gaps without fabricating service facts
---

# Data Enrichment Audit Workflow

This workflow identifies service-data gaps and prepares review artifacts. It does not authorize autonomous edits to
`data/services.json`.

## Governance Boundary

- Service data is manually curated and evidence-backed.
- Do not invent hours, locations, eligibility, phone scripts, translations, or verification metadata.
- Ask first before modifying `data/services.json`.
- Record source evidence and reviewer notes before any later data-change commit.
- Do not run credential-backed tools such as geocoding unless the maintainer explicitly provides the required setup.

## Step 1: Run Current Gap Audits

// turbo

```bash
npm run audit:data
npm run audit:coords
npm run audit:hours
npm run audit:access-scripts
npm run bilingual-check
```

Review the generated reports before proposing data changes.

## Step 2: Review Verification Queue

// turbo

```bash
npm run check-staleness
```

Use the current service verification workplan under `docs/audits/` when one exists. Update service facts only after
manual evidence is recorded.

## Step 3: Prepare Translation Review Batches

// turbo

```bash
npm run export:access-script-fr
```

For French access-script work, follow `docs/workflows/french-translation-workflow.md`. Translation review is
translation-only: preserve source meaning and do not add new service facts.

## Step 4: Optional Credential-Backed Geocoding

Run geocoding only after maintainer approval and with `OPENCAGE_API_KEY` configured outside git.

```bash
OPENCAGE_API_KEY=$OPENCAGE_API_KEY npm run geocode
```

Review every generated coordinate against evidence before committing any service-data change.

## Step 5: Validate After Any Approved Data Change

// turbo

```bash
npm run validate-data
npm run audit:data
npm run search:qa
```

If French fields changed, also run `npm run bilingual-check`.

## Reference

- Full SOP: `docs/governance/data-enrichment-sop.md`
- Decision rationale: `docs/adr/009-data-enrichment-process.md`
