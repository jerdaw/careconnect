# Deterministic Search Quality Reporting Implementation Plan

**Goal:** Make both tracked search-quality artifacts reproducible from one local-only, fixed-date report.

**Architecture:** Separate pure report serialization/rendering from search execution. Share the fixture's evaluation date with Vitest, isolate the runner from environment credentials, and expose explicit write/check/output modes.

**Tech Stack:** TypeScript, tsx, Vitest, local JSON fixtures.

**Status:** Completed locally on 2026-07-10. The tracked artifacts now reproduce byte-for-byte from two isolated runs. Full validation passed with 1,737 tests, 24 skips, lint, type-check, format, reference checks, root hygiene, production build, and report freshness check.

---

### Task 1: Build pure deterministic output functions

**Files:**

- Create: `scripts/search-test-report.ts`
- Create: `tests/scripts/search-test-report.test.ts`

**Steps:**

1. Define/export report types with stable `evaluationAsOf` and `dataSource` metadata.
2. Add stable JSON serialization without run time or duration fields.
3. Render Markdown summary, quality/category tables, and failures from the report.
4. Prove synthetic metrics and byte stability with unit tests.

### Task 2: Share the evaluation date

**Files:**

- Modify: `tests/fixtures/search-test-queries.json`
- Modify: `tests/search/golden-set.test.ts`

**Steps:**

1. Add the existing golden reference date as `metadata.evaluationAsOf`.
2. Make golden tests validate and use that metadata value.
3. Run the golden set unchanged.

### Task 3: Refactor the runner

**Files:**

- Modify: `scripts/search-test-runner.ts`
- Modify: `package.json`

**Steps:**

1. Remove `.env.local` loading and clear Supabase credentials before search imports.
2. Run search under a fixed fixture clock and restore the native `Date` afterward.
3. Use the pure output module for both files.
4. Add `--write`, `--check`, and `--out-dir` handling.
5. Add `search:report` and `search:report:check` scripts.
6. Preserve pass-threshold exit behavior.

### Task 4: Regenerate and document

**Files:**

- Modify: `tests/fixtures/search-test-results.json`
- Modify: `tests/fixtures/search-quality-report.md`
- Modify: `docs/adr/018-search-quality-testing-and-scoring-refinements.md`

**Steps:**

1. Generate both artifacts together.
2. Run two isolated output generations and compare bytes.
3. Run check mode against tracked artifacts.
4. Update ADR-018 with deterministic local-data/fixed-date semantics.

### Task 5: Validate and deliver

**Steps:**

1. Run focused report tests, golden tests, full Vitest, format, lint, type-check, references, and root hygiene.
2. Inspect the full generated diff; confirm no curated data or search behavior changed.
3. Commit generator/tests first and generated artifacts second.
4. Obtain independent review, address findings, push, and open a focused PR.
