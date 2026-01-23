# v17.5 AI Output Ingestion — Merge Readiness Report

- Generated: `2026-01-22T23:46:50.430142+00:00`
- Scope: normalized ChatGPT outputs only (Batches 1–4)

## Summary

- Total records: **196**
- Records with non-null `hours`: **110**
- Records with non-null `access_script`: **143**
- Evidence URLs (actionable, de-duped per batch): **39**

## Per-Batch Stats

| Batch | Records | hours non-null | access_script non-null | evidence URLs | Normalized output                                              | Evidence report                                                                |
| ----: | ------: | -------------: | ---------------------: | ------------: | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
|     1 |      50 |             48 |                      0 |             0 | `docs/roadmaps/v17-5-ai-results/normalized/batch1_output.json` | `docs/roadmaps/v17-5-ai-results/reports/research_sources_chatgpt_prompt1.json` |
|     2 |      50 |             26 |                     47 |             0 | `docs/roadmaps/v17-5-ai-results/normalized/batch2_output.json` | `docs/roadmaps/v17-5-ai-results/reports/research_sources_chatgpt_prompt2.json` |
|     3 |      50 |             36 |                     50 |            28 | `docs/roadmaps/v17-5-ai-results/normalized/batch3_output.json` | `docs/roadmaps/v17-5-ai-results/reports/research_sources_chatgpt_prompt3.json` |
|     4 |      46 |              0 |                     46 |            11 | `docs/roadmaps/v17-5-ai-results/normalized/batch4_output.json` | `docs/roadmaps/v17-5-ai-results/reports/research_sources_chatgpt_prompt4.json` |

## Preconditions (Phase 3)

- ✅ Normalized outputs parse as JSON arrays
- ✅ Output IDs match batch inputs (order + membership)
- ✅ All IDs exist in `data/services.json` (post-normalization)
- ✅ Hours keys are lowercase and times are `HH:MM` where present

## Anomalies / Follow-ups

- ⚠️ Batch 1: research_sources contains no actionable URLs
- ⚠️ Batch 2: research_sources contains no actionable URLs

## Stop Point

- This ingestion is **merge-ready**, but anomalies should be reviewed during Phase 6 governance QA.
