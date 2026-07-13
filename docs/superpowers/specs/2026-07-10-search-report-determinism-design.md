# Deterministic Search Quality Reporting Design

## Context

The tracked search-quality JSON and Markdown reports contradict each other because the runner writes only JSON while the Markdown report is manual. The runner also loads `.env.local`, can select Supabase data, uses wall-clock freshness, and records volatile run time/timestamps. Running it today therefore produces a large, misleading diff rather than reproducing the golden-set baseline.

The deterministic golden tests already freeze search evaluation at `2026-06-30T12:00:00.000Z`. That existing reference date is the correct source to centralize; this batch does not choose a new freshness policy.

## Decision

Create one deterministic reporting pipeline:

1. Store `evaluationAsOf` in `search-test-queries.json` metadata and make both the golden tests and report runner read it.
2. Force the report runner to use checked-in local data by clearing Supabase credentials before dynamically importing search code; never load `.env.local`.
3. Evaluate under a runner-local fixed clock for the fixture date, restoring the real clock afterward.
4. Generate stable JSON and Markdown from the same in-memory report through pure serialization/rendering functions.
5. Exclude wall-clock run timestamps and execution duration from tracked output; duration remains console-only.
6. Support `--write` (default), `--check`, and `--out-dir <path>`. Check mode compares both artifacts byte-for-byte and performs no writes.

The tracked artifacts remain detailed regression evidence, not current production-health claims. Their metadata states the fixed evaluation date and checked-in local-data source.

## Boundaries

- No service data, queries, expected services, scoring, synonyms, crisis logic, or freshness-window changes.
- No Supabase/network access during report generation.
- No production runtime behavior changes.
- Preserve the existing 70%/85% runner pass thresholds.

## Validation

Use synthetic unit tests for rendering and stable serialization; run the report twice into separate temporary output directories and compare bytes; run `--check`; run the golden set, full Vitest, format, lint, type-check, references, root hygiene, and inspect the generated artifact diff. Keep generator and generated artifacts in separate commits for reviewability.
