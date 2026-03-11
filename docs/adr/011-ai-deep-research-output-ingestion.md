---
status: stable
last_updated: 2026-01-23
owner: jer
tags: [data, governance, ai, deep-research, ingestion, auditability]
---

# ADR 011: AI Deep Research Output Ingestion (Audit-First)

## Status

Accepted

## Date

2026-01-23

## Context

HelpBridge uses **manual curation over automatic extraction**. We sometimes use “Deep Research” LLM workflows (ChatGPT / Gemini) to accelerate enrichment of missing structured fields in `data/services.json`, especially:

- `hours` (structured; used by the “Open Now” filter)
- `access_script` (phone-anxiety support; “what to say when you call”)

Deep Research outputs are not authoritative by default, can be inconsistent in format, and may include brittle or missing evidence links. We need an ingestion process that:

- Preserves **auditability** (“what the model said”)
- Avoids accidental overwrites of curated fields (governance-first)
- Produces deterministic, merge-ready artifacts
- Supports targeted QA on high-risk services (especially Crisis)

## Decision

We adopt an **audit-first ingestion workflow** for AI Deep Research outputs:

1. **Immutable raw archive**
   - Store original model outputs under `docs/audits/v17-5/ai-results/raw/`.

2. **Normalize separately**
   - Extract and normalize model outputs into merge-ready JSON arrays under `docs/audits/v17-5/ai-results/normalized/`.
   - Store any model-provided evidence (e.g., `research_sources`) separately under `docs/audits/v17-5/ai-results/reports/`.

3. **Validate before merge**
   - Enforce batch ID alignment (no unknown IDs; correct known, validated drifts only).
   - Normalize schema shape (e.g., `hours` day keys, time formats).

4. **No-overwrite-by-default merge**
   - Merge via a dedicated tool (`scripts/merge-ai-enrichment.ts`) that fills missing fields but does not overwrite existing curated values unless explicitly requested.
   - Always write a pre-merge backup to `data/backups/` (gitignored).

5. **Governance QA**
   - Perform deterministic sampling and record a QA log (Crisis-focused).
   - Evidence links are availability-checked only; factual verification is completed incrementally for high-risk items.

6. **Evidence strategy**
   - Do not embed per-field evidence URLs into `data/services.json` by default.
   - Preserve evidence in the ingestion workspace to avoid schema creep and reduce data drift risk.

## Consequences

### Positive

- Strong audit trail and reproducibility (raw vs normalized vs reports).
- Lower risk of governance regression (no silent overwrites).
- Enables future re-processing as schema evolves.

### Negative / Trade-offs

- More files (raw + normalized + reports) to manage in-repo.
- Evidence may still be missing or non-actionable for some batches; manual verification remains required for high-risk services.

## Related

- Data enrichment SOP: `docs/governance/data-enrichment-sop.md`
- v17.5 worked example (archived plan): `docs/planning/archive/2026-01-23-v17-5-ai-output-ingestion.md`
- Ingestion workspace: `docs/audits/v17-5/ai-results/README.md`
- Merge tool: `scripts/merge-ai-enrichment.ts`
