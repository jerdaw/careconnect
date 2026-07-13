# Search Scoring Contract Tests Design

## Context

`tests/lib/search/scoring.test.ts` still labels `calculateScore` as a placeholder and only proves that it returns a non-negative number. The implementation now delegates to the production keyword-scoring pipeline, so those assertions no longer describe or protect its behavior.

## Decision

Replace the placeholder assertions with focused contract tests that prove:

- a relevant query produces a positive score;
- an unrelated query produces no score; and
- opted-in matching identity context increases the score relative to the same query without context.

Use the existing fixture and public `calculateScore` API. Do not change ranking code, weights, service data, schemas, or production behavior.

## Validation

Run the focused scoring suites first, then the search golden set, lint, type-check, formatting, and repository reference/root checks. A passing test-only change demonstrates that the current implementation already satisfies the clarified contract.

## Boundaries

- No scoring-weight or search-behavior changes.
- No curated data changes.
- No browser, database, credential, or production dependency.
- Keep the batch independently reviewable from other roadmap work.
