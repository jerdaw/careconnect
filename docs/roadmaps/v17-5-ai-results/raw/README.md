# v17.5 AI Outputs (Raw Archive)

This folder is an **immutable archive** of the original LLM “Deep Research” outputs used for v17.5 data enrichment.

**Do not edit files in this folder.** Any cleaning, extraction, normalization, or reformatting happens later under:

- `docs/roadmaps/v17-5-ai-results/normalized/` (merge-ready outputs)
- `docs/roadmaps/v17-5-ai-results/reports/` (audit + QA reports)

## Context

- **Generated:** 2026-01-22 (as provided in `docs/roadmaps/`)
- **Prompt template:** `docs/roadmaps/archive/2026-01-23-v17-5-ai-prompts.md`
- **Batch inputs:** `docs/roadmaps/2026-01-21-v17-5-batch{1..4}.json`

Notes:

- **ChatGPT outputs** are expected to be valid JSON (Option A: `processed_batch_output` + `research_sources`) and are the primary merge candidates.
- **Gemini outputs** may include narrative content and/or malformed JSON. Treat them as research notes unless re-run into strict Option A JSON.

## File Mapping (Provider → Batch)

| Provider | Prompt | Batch | Filename                                        | Size (bytes) | sha256                                                             |
| -------- | ------ | ----- | ----------------------------------------------- | -----------: | ------------------------------------------------------------------ |
| ChatGPT  | 1      | 1     | `ChatGPT - Prompt 1 - Deep Research Result.txt` |        23249 | `62a59580dfbec86c6c230434f7dee4814bc1dbf83bc3d83a6a9669ca40fe596d` |
| ChatGPT  | 2      | 2     | `ChatGPT - Prompt 2 - Deep Research Result.txt` |        22824 | `0f5f633fd0c65f34f0844797349e00fafb7c2f602c37e95b0a5b37370032ba29` |
| ChatGPT  | 3      | 3     | `ChatGPT - Prompt 3 - Deep Research Result.txt` |        36437 | `42fe8cbfa9cc38e1b576df43d7e7181fe6e548ac9c7a1945bd7c061e6cfd8d0d` |
| ChatGPT  | 4      | 4     | `ChatGPT - Prompt 4 - Deep Research Result.txt` |        17646 | `c0107b7cd0bcb73beeab28f8e25f13b909619793dea0765f9fc6e488da9a5d55` |
| Gemini   | 1      | 1     | `Gemini - Prompt 1 - Deep Research Result.md`   |        35629 | `836692cffd01225f008f78566b7e74a32f46078ef4863d101b70bfa8b9331a15` |
| Gemini   | 2      | 2     | `Gemini - Prompt 2 - Deep Research Result.md`   |        35359 | `88f378a78108535b541aa2795feae8954459619ce2e1d35eb61d0e497f95e2e2` |
| Gemini   | 3      | 3     | `Gemini - Prompt 3 - Deep Research Result.md`   |        37082 | `b3ad8911af975caa04c38a7a11d8b0bb8ab087641f6cb3d15c9f141a89920a9e` |
| Gemini   | 4      | 4     | `Gemini - Prompt 4 - Deep Research Result.md`   |        31025 | `91eb4e01e7ccfac3f50931b70b67f66aebdea631563d97b02febfb11b8feb8b6` |

To recompute hashes locally:

```bash
sha256sum docs/roadmaps/v17-5-ai-results/raw/*
```
