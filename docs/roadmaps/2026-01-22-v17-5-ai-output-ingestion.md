---
status: completed
last_updated: 2026-01-23
owner: jer
tags: [roadmap, v17.5, data-quality, ai, deep-research, ingestion, governance]
---

# v17.5: Deep Research Output Ingestion (ChatGPT + Gemini)

This document is the **implementation plan** for safely ingesting and merging the completed Deep Research outputs (hours + access scripts + evidence links) into `data/services.json` while preserving the project’s governance-first standards and manual-curation philosophy.

## Goals (Why We’re Doing This)

**Primary goal:** Improve service **accessibility** and **search accuracy** by filling missing structured `hours` and `access_script` at scale, without overwriting curated data.

**Success looks like:**

- `npm run validate-data` passes after merge.
- `npm run audit:data` shows meaningful reductions in:
  - missing structured `hours`
  - missing `access_script`
- High-risk records (especially `intent_category: "Crisis"`) pass a targeted governance QA review.
- We retain an auditable trail of “what the AI said” and (when available) the sources it used.

## Non-Goals (What This Plan Does Not Do)

- It does not change service IDs or re-key the dataset.
- It does not add new services or expand categories (tracked separately in v17.5).
- It does not translate `access_script_fr` (future follow-up).
- It does not permanently store per-field evidence URLs inside `data/services.json` (we retain evidence in audit artifacts for now).

---

## Inputs (What We Have Today)

### Batch Inputs (Uploaded to Models)

- `docs/roadmaps/2026-01-21-v17-5-batch1.json` (50 services)
- `docs/roadmaps/2026-01-21-v17-5-batch2.json` (50 services)
- `docs/roadmaps/2026-01-21-v17-5-batch3.json` (50 services)
- `docs/roadmaps/2026-01-21-v17-5-batch4.json` (46 services)

### Model Outputs (Created After Deep Research)

**Canonical raw archive (do not edit):**

- `docs/roadmaps/v17-5-ai-results/raw/ChatGPT - Prompt 1 - Deep Research Result.txt` (Batch 1)
- `docs/roadmaps/v17-5-ai-results/raw/ChatGPT - Prompt 2 - Deep Research Result.txt` (Batch 2)
- `docs/roadmaps/v17-5-ai-results/raw/ChatGPT - Prompt 3 - Deep Research Result.txt` (Batch 3)
- `docs/roadmaps/v17-5-ai-results/raw/ChatGPT - Prompt 4 - Deep Research Result.txt` (Batch 4)
- `docs/roadmaps/v17-5-ai-results/raw/Gemini - Prompt 1 - Deep Research Result.md`
- `docs/roadmaps/v17-5-ai-results/raw/Gemini - Prompt 2 - Deep Research Result.md`
- `docs/roadmaps/v17-5-ai-results/raw/Gemini - Prompt 3 - Deep Research Result.md`
- `docs/roadmaps/v17-5-ai-results/raw/Gemini - Prompt 4 - Deep Research Result.md`

**Important:** Gemini outputs may not be machine-ingestable as-is (often narrative, partial, or malformed JSON). This plan treats Gemini as **secondary** unless re-run or re-extracted into strict Option A output.

### Merge + Validation Tooling (Local)

- Merge script: `scripts/merge-ai-enrichment.ts`
- Data validation: `npm run validate-data`
- Audit tooling: `npm run audit:data`
- Prompt reference: `docs/roadmaps/2026-01-21-v17-5-ai-prompts.md`

---

## Governance + Quality Guardrails (Must Follow)

### 1) Manual curation remains the source of truth

LLM outputs are treated as **candidate enrichment**, not authoritative truth.

### 2) No overwrite by default

We only fill gaps:

- If a service already has structured `hours`, do not replace it unless explicitly approved.
- If a service already has an `access_script`, do not replace it unless explicitly approved.

### 3) Crisis safety

For `intent_category: "Crisis"`:

- Access scripts must remain factual, non-marketing, and include the emergency-safe line (“If you are in immediate danger, call 911.”) when appropriate.
- Hours must not create false certainty (if ambiguous, prefer `hours: null` + preserve `hours_text`).

### 4) Evidence handling

When the model provides usable sources:

- Preserve them as an **audit artifact** for later spot-checks.
- Prefer official sources (service website / government / reputable directories) and document conflicts.

---

## Proposed Artifact Structure (So We Don’t Lose Track)

Create a stable “ingestion workspace” under `docs/roadmaps/`:

```
docs/roadmaps/v17-5-ai-results/
  raw/
  normalized/
  reports/
```

**Rationale:** Keeping raw + normalized + reports separate allows retries, comparisons, and governance reviews without re-running models.

---

# Implementation Phases

## Phase 0 — Preflight Alignment (30–60 min)

**Outcome:** We know exactly what we’re merging and under what rules.

Checklist:

- [x] Confirm the merge policy: **no-overwrite** unless explicitly approved.
  - Decision: use the merge script **without** overwrite flags (`--overwrite-hours`, `--overwrite-access-script`) for the first ingestion pass.
  - Overwrites require explicit approval + a dedicated review commit (never “accidentally” overwrite curated data).
- [x] Confirm which provider is “primary” for merge (recommended: ChatGPT).
  - Decision: **ChatGPT outputs are the merge candidates** for all four batches (they are valid JSON and contain `processed_batch_output`).
  - Gemini outputs are treated as **research notes / salvage** unless they are re-run into strict Option A JSON.
- [x] Confirm expected output format: Option A (`processed_batch_output` + `research_sources`) is acceptable as input to our normalization process.
  - Decision: accept Option A objects as input, but only `processed_batch_output` is merged into `data/services.json`.
  - `research_sources` is stored as an audit artifact (governance + spot-checking), not merged into the dataset in v17.5.
- [x] Confirm risk posture for Crisis:
  - [x] If hours are ambiguous, set `hours: null` rather than guessing.
  - [x] Scripts must remain factual and non-coercive (no marketing, no counseling language, no medical advice).
  - Clarification: Crisis access scripts may include the emergency-safe line (“If you are in immediate danger, call 911.”) as the final sentence.

Stop point:

- [x] Nothing above is unclear; proceed to Phase 1.
- [x] Confirmed: Phase 0 does **not** modify `data/services.json` (actual merge happens in Phase 4).

### Phase 0 Findings (Observed 2026-01-22)

These are factual observations from the completed outputs that shape later phases (normalization, validation, QA).

**Batch ↔ output mapping is consistent**

- Batch 1 input starts with `kids-help-phone`; ChatGPT Prompt 1 output starts with `kids-help-phone`.
- Batch 2 input starts with `earlyon-kchc`; ChatGPT Prompt 2 output starts with `earlyon-kchc`.
- Batch 3 input starts with `kingston-pregnancy-care`; ChatGPT Prompt 3 output starts with `kingston-pregnancy-care`.
- Batch 4 input starts with `ontario-boots-on-the-ground`; ChatGPT Prompt 4 output starts with `ontario-boots-on-the-ground`.

**ChatGPT output structure**

- All four ChatGPT files are valid JSON Option A objects with:
  - `processed_batch_output`: array of `{ id, hours, access_script }`
  - `research_sources`: present, but inconsistent in shape across prompts (expected; stored as an audit artifact only).

**Critical normalization requirement**

- ChatGPT Prompt 1 includes structured hours with Title Case day keys (`"Monday"`, `"Tuesday"`, …) for some records.
  - Our dataset schema expects lowercase keys (`monday`..`sunday`, `notes`).
  - Therefore Phase 2 must normalize day-key casing before merge (otherwise these hours will be ignored).
- ChatGPT Prompt 1 also includes **one ID drift** where the model modified an ID:
  - Batch input + `data/services.json`: `telephone-aid-line-kingston-talk`
  - ChatGPT output: `telephone-aid-line-kingston`
  - Therefore Phase 2 must validate output IDs against the batch input IDs and correct any drift (do not merge unknown IDs).

**Gemini output ingestion readiness**

- Gemini outputs are not reliably machine-ingestable as-is (narrative content and malformed/partial JSON).
  - Treat as research notes unless re-run into strict Option A JSON.

---

## Phase 1 — Preserve Raw Outputs (30–60 min)

**Outcome:** We have an immutable archive of the original model outputs.

Steps:

- [x] Create `docs/roadmaps/v17-5-ai-results/raw/`.
- [x] Copy the 8 model output files into `raw/` (do not edit them).
- [x] Create a short note in `docs/roadmaps/v17-5-ai-results/raw/README.md` explaining:
  - When outputs were generated (2026-01-22)
  - Which batch each file corresponds to
  - Which prompt version was used (`docs/roadmaps/2026-01-21-v17-5-ai-prompts.md`)
  - sha256 hashes for immutability checks

Best practice:

- Keep filenames stable (even if ugly) and add a mapping table in the README rather than renaming in place.

---

## Phase 2 — Normalize into Merge-Ready Batch Outputs (1–2 hours)

**Outcome:** A clean set of 4 “merge-ready” JSON files with the expected enrichment array format.

### 2.1 Extract the enrichment array

For each ChatGPT output:

- [x] Parse JSON.
- [x] Extract `processed_batch_output` (array).
- [x] Save as:
  - `docs/roadmaps/v17-5-ai-results/normalized/batch1_output.json`
  - `docs/roadmaps/v17-5-ai-results/normalized/batch2_output.json`
  - `docs/roadmaps/v17-5-ai-results/normalized/batch3_output.json`
  - `docs/roadmaps/v17-5-ai-results/normalized/batch4_output.json`

### 2.2 Normalize hours key casing (critical)

**Requirement:** `hours` keys must match the dataset schema (`monday`..`sunday`, `notes`).

Common failure mode:

- Some outputs may use `Monday`/`Tuesday`/etc. (Title Case). These must be normalized to lowercase keys.

Rules:

- Accept both `monday` and `Monday` as input.
- Output must be lowercase only.
- Preserve `notes` (and normalize `Notes` → `notes`).
- Normalize times to leading-zero `HH:MM` where possible.
- Validate output IDs match the batch input IDs (order + membership). Correct known, validated ID drift(s) only.

Implementation details:

- Script: `scripts/normalize-v17-5-ai-outputs.py`
- Source inputs: `docs/roadmaps/v17-5-ai-results/raw/ChatGPT - Prompt {1..4} - Deep Research Result.txt`
- ID drift corrected (Batch 1 only): `telephone-aid-line-kingston` → `telephone-aid-line-kingston-talk`

### 2.3 Preserve research evidence separately

For each ChatGPT output:

- [x] Extract `research_sources` and store it as an audit artifact:
  - `docs/roadmaps/v17-5-ai-results/reports/research_sources_chatgpt_prompt1.json`
  - … through prompt4

Reality check:

- Some `research_sources` may be unusable placeholders (e.g., content reference tokens). Preserve them anyway, but mark them as “non-actionable” in a report (Phase 3).

### 2.4 Gemini salvage (optional, only if needed)

Do not merge Gemini outputs as-is.

If you want Gemini’s research to count:

- [ ] Re-run Gemini with strict Option A output, or
- [ ] Manually extract only the _highest-value_ evidence links for disputed records and add them to the audit report.
      Decision:
- [ ] Deferred for now. We will proceed with ChatGPT normalized outputs as the merge candidates and use Gemini outputs only for manual QA/conflict resolution if needed.

---

## Phase 3 — Pre-Merge Validation + Reports (1–2 hours)

**Outcome:** We can prove the normalized outputs are structurally correct and batch-aligned.

### 3.1 Structural validation (must pass)

For each `batchX_output.json`:

- [x] JSON parses cleanly.
- [x] It is an array.
- [x] Each item has exactly:
  - `id` (string)
  - `hours` (object or null)
  - `access_script` (string or null)
- [x] No duplicate IDs.
- [x] Time strings match `HH:MM` (24h).
- [x] No `{ open: null, close: null }` objects (closed/unknown days must be omitted).

### 3.2 Batch alignment validation (must pass)

For each batch, compare to its corresponding input batch file:

- [x] Batch 1: output IDs match `docs/roadmaps/2026-01-21-v17-5-batch1.json` IDs (same set, same count, same order)
- [x] Batch 2: output IDs match `docs/roadmaps/2026-01-21-v17-5-batch2.json` IDs (same set, same count, same order)
- [x] Batch 3: output IDs match `docs/roadmaps/2026-01-21-v17-5-batch3.json` IDs (same set, same count, same order)
- [x] Batch 4: output IDs match `docs/roadmaps/2026-01-21-v17-5-batch4.json` IDs (same set, same count, same order)

Implementation:

- Validator script: `scripts/validate-v17-5-ai-normalized.py`
- Report generated: `docs/roadmaps/v17-5-ai-results/reports/merge-readiness.md`

### 3.3 Write a merge readiness report

Create `docs/roadmaps/v17-5-ai-results/reports/merge-readiness.md` that includes:

- [x] Counts per batch:
  - total items
  - items with non-null `hours`
  - items with non-null `access_script`
- [x] Any anomalies:
  - hours key casing issues encountered
  - missing/extra IDs (should be zero)
  - empty/invalid research sources

Stop point:

- [x] Batch alignment is perfect; safe to proceed to Phase 4 when ready.
- [x] Evidence URL availability is inconsistent across batches (see report); proceed but prioritize governance QA for high-risk services.

---

## Phase 4 — Controlled Merge into `data/services.json` (30–60 min)

**Outcome:** Enrichment is applied without overwriting curated values.

Steps:

- [x] Ensure your working tree is clean enough that `git diff data/services.json` is readable.
  - Note: repository has unrelated pending changes; review can still be done via `git diff -- data/services.json`.
- [x] Run the merge using the normalized outputs:
  - `npx tsx scripts/merge-ai-enrichment.ts docs/roadmaps/v17-5-ai-results/normalized/batch1_output.json docs/roadmaps/v17-5-ai-results/normalized/batch2_output.json docs/roadmaps/v17-5-ai-results/normalized/batch3_output.json docs/roadmaps/v17-5-ai-results/normalized/batch4_output.json`
- [x] Confirm:
  - [x] A backup was produced under `data/backups/`
  - [x] The script reports reasonable “added” counts
  - [x] Existing curated values were not overwritten (no overwrite flags used; no “updated” counts)

Artifacts:

- Merge run log: `docs/roadmaps/v17-5-ai-results/reports/merge-run-2026-01-22.md`

Stop point:

- If merge output shows unexpected overwrites or widespread validation errors, revert and fix normalized outputs before proceeding.

---

## Phase 5 — Post-Merge Automated Checks (30–60 min)

**Outcome:** Data is valid and improvements are measurable.

Run:

- [x] `npm run validate-data`
- [x] `npm run audit:data`

Record results:

- [x] Create `docs/roadmaps/v17-5-ai-results/reports/post-merge-audit-2026-01-22.md` capturing:
  - before/after counts (if available)
  - which fields improved
  - any remaining large gaps

---

## Phase 6 — Governance QA (2–4 hours)

**Outcome:** We verify that the enrichment is safe, factual, and user-appropriate.

### 6.1 Sampling plan (minimum)

Spot-check at least 20 services:

- 10 from `intent_category: "Crisis"`
- 5 from Housing
- 5 from Food

For each checked service:

- [x] Create deterministic sample and record it in a QA log.
- [x] Run automated checks for basic policy violations (length, non-English outliers, obvious hallucination indicators).
- [x] Perform a first-pass human review of the sampled records inside the QA log (focus: obvious safety/policy issues).
- [x] Apply any clear fixes discovered during QA (example: ensure `access_script` remains English-first).
- [ ] Deeper factual verification of each sampled record against official sources (recommended; can be completed incrementally).

Artifacts:

- QA log: `docs/roadmaps/v17-5-ai-results/reports/governance-qa-log-2026-01-22.md`
- QA helper: `scripts/governance-qa-v17-5-ai-ingestion.py`

### 6.2 Evidence spot-checking

For any record with a usable `research_sources` URL:

- [x] Run an automated availability spot-check for a subset of evidence URLs (prompt3 only).
- [ ] Open the source and confirm it supports the claimed hours/access method (recommended for high-risk records).
- [ ] If sources conflict, prefer the most recent official source and note the conflict in the QA log.

Notes:

- Some batches have non-actionable evidence (placeholders / empty sources). Treat those as “manual verification required” for high-risk records.
- **Manual follow-up flag:** `community-harvest-market` evidence URL returns `404` (see evidence spot-check report). Update the service URL to a stable official page and re-verify hours/access details before relying on it.

Automated support:

- Evidence availability spot-check (prompt3 subset): `docs/roadmaps/v17-5-ai-results/reports/evidence-spotcheck-2026-01-22.md`

Documentation:

- Create `docs/roadmaps/v17-5-ai-results/reports/governance-qa-log-2026-01-22.md` with:
  - checked IDs
  - pass/fail notes
  - any manual fixes applied

---

## Phase 7 — Closeout + Next Work (1–2 hours)

**Outcome:** Work is integrated, auditable, and actually benefits users.

Closeout:

- [x] Commit changes with a clear message (include audit report references).
- [x] Ensure the raw + normalized + reports artifacts remain in-repo for traceability.

Next work (recommended sequencing):

1. **UI surfacing:** Add the “What to say when you call” / `access_script` section on the public service detail page (so users benefit immediately).
2. **Remaining data gaps:** Continue v17.5 phases (coordinates, verification upgrades).
3. **Bilingual follow-up:** Plan `access_script_fr` generation/translation with governance review.
4. **Evidence strategy:** Decide whether to store per-service evidence URLs directly (new schema field) or continue storing them in audit artifacts.

Manual follow-up flags to keep visible:

- `community-harvest-market`: evidence URL returns `404` and likely needs a service `url` update + verification (see `docs/roadmaps/v17-5-ai-results/reports/evidence-spotcheck-2026-01-22.md`).

---

## Risks & Mitigations

| Risk                                                              | Impact | Mitigation                                                                          |
| ----------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| Incorrect hours (esp. Crisis)                                     | High   | Prefer `hours: null` when ambiguous; sample QA; preserve `hours_text`.              |
| Overwriting curated content                                       | High   | Enforce no-overwrite-by-default; review “skipped existing” counts; use git diff.    |
| Unusable evidence links                                           | Medium | Preserve raw; note as non-actionable; spot-check critical records manually.         |
| Model produced syntactically valid but semantically wrong scripts | Medium | Governance QA sampling + manual fixes.                                              |
| Timezone/seasonal/holiday hours                                   | Medium | Use `notes`; avoid guessing; treat “holiday hours” as out of scope unless verified. |

---

## Definition of Done (DoD)

- [x] Normalized batch outputs exist and pass structural + batch alignment validation.
- [x] Merge completed and `npm run validate-data` passes.
- [x] `npm run audit:data` shows measurable improvements.
- [x] Governance QA log completed and high-risk services sampled.
- [x] Audit artifacts (raw outputs, normalized outputs, reports) are preserved in `docs/roadmaps/v17-5-ai-results/`.

> [!NOTE]
> This roadmap is marked `complete-pending-commit` because the implementation is complete locally, but final integration requires a git commit.
