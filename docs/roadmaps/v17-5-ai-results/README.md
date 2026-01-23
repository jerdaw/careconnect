# v17.5 AI Deep Research Results (Ingestion Workspace)

This folder is the **audit + ingestion workspace** for v17.5 “Deep Research” enrichment (ChatGPT + Gemini).

## What’s Here

- `raw/` — **Immutable** copies of the original model outputs (do not edit).
- `normalized/` — Merge-ready JSON arrays (one file per batch) produced from the raw outputs.
- `reports/` — Validation summaries, merge logs, governance QA logs, and extracted evidence/source artifacts.

## How To Re-Run (Deterministic)

1. Normalize ChatGPT outputs into merge-ready batches:

```bash
python scripts/normalize-v17-5-ai-outputs.py
```

2. Validate normalized outputs (alignment + schema sanity):

```bash
python scripts/validate-v17-5-ai-normalized.py
```

3. Merge into `data/services.json` (backs up the file first):

```bash
npx tsx scripts/merge-ai-enrichment.ts \
  docs/roadmaps/v17-5-ai-results/normalized/batch1_output.json \
  docs/roadmaps/v17-5-ai-results/normalized/batch2_output.json \
  docs/roadmaps/v17-5-ai-results/normalized/batch3_output.json \
  docs/roadmaps/v17-5-ai-results/normalized/batch4_output.json
```

## Notes

- `reports/evidence-spotcheck-*.md` may require network access to re-run (availability checks only; not a substitute for governance verification).
- `data/backups/` is intentionally ignored by git and stores pre-merge snapshots of `data/services.json`.
