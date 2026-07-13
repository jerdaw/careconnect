# Search Scoring Contract Tests Implementation Plan

**Goal:** Replace stale placeholder coverage for `calculateScore` with meaningful behavioral assertions without changing production behavior.

**Architecture:** Exercise the exported `calculateScore` facade using the existing deterministic service fixture. Compare observable scores instead of duplicating internal calculations or coupling tests to incidental tokenization details.

**Tech Stack:** TypeScript, Vitest, Next.js repository validation scripts.

---

### Task 1: Clarify the scoring facade contract

**Files:**

- Modify: `tests/lib/search/scoring.test.ts`

**Steps:**

1. Remove the obsolete placeholder label and comments.
2. Assert that a relevant food query scores above zero.
3. Assert that an unrelated query scores zero.
4. Compare the same identity-tag query with and without opted-in matching user context; require the contextual score to be higher.
5. Run the focused scoring test suites.

### Task 2: Validate repository compatibility

**Steps:**

1. Run the search golden-set tests.
2. Run formatting, lint, type-check, reference, and root checks.
3. Inspect the diff for unintended production or data changes.

### Task 3: Review and deliver

**Steps:**

1. Obtain an independent code review against this design.
2. Address any findings and rerun affected validation.
3. Commit, push, and open a focused pull request if all required checks pass.
