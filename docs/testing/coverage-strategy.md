# Test Coverage Strategy

## Overview

Test coverage thresholds are **enforced in CI** to prevent code quality regression. Any pull request that reduces coverage below configured thresholds will fail the build.

## Current Status

**As of 2026-02-12:**

| Metric     | Current | Threshold | Target |
| ---------- | ------- | --------- | ------ |
| Statements | 53.97%  | 50%       | 75%    |
| Branches   | 82.21%  | 80%       | 80%    |
| Functions  | 82.12%  | 80%       | 80%    |
| Lines      | 53.97%  | 50%       | 75%    |

## Threshold Philosophy

### Global Thresholds

Global thresholds are set **slightly below current coverage** to:

1. **Prevent regression**: Block PRs that significantly reduce coverage
2. **Allow flexibility**: Permit minor variations (e.g., 82% → 80%)
3. **Enable progress**: Not block legitimate refactoring that may temporarily reduce coverage

### Per-File Thresholds

Critical code paths have **higher thresholds** reflecting their importance:

| Path                 | Statements | Branches | Rationale                           |
| -------------------- | ---------- | -------- | ----------------------------------- |
| `lib/search/**`      | 90%        | 85%      | Core search logic must be reliable  |
| `lib/eligibility/**` | 95%        | N/A      | Eligibility rules require certainty |
| `lib/ai/**`          | 65%        | N/A      | AI features harder to unit test     |
| `hooks/**`           | 75%        | N/A      | React hooks need good coverage      |

## Incremental Improvement Plan

As part of **v20.0 Technical Excellence**, we're working toward 75% statement coverage through:

- **B4**: Component tests for critical UI (8-12h)
- **B5**: Smoke tests for 40+ untested components (10-15h)
- **B6**: Fix/stabilize 7 skipped E2E tests (6-8h)
- **B7**: Error scenario / unhappy path tests (6-8h)
- **B8**: Feedback workflow integration test (3h)
- **B9**: Service update request integration test (3h)

### Threshold Increase Schedule

After each testing milestone, thresholds will be adjusted:

1. **After B4** (Component tests): Increase global statements to 60%
2. **After B5** (Smoke tests): Increase global statements to 65%
3. **After B7** (Error scenarios): Increase global statements to 70%
4. **After B8+B9** (Integration tests): Increase global statements to 75% ✅ TARGET

## How It Works

### CI Enforcement

The `.github/workflows/ci.yml` workflow runs:

```yaml
- name: Run Unit Tests with Coverage
  run: npm run test:coverage
```

This executes `vitest run --coverage`, which:

1. Runs all tests
2. Generates coverage report
3. **Checks thresholds** (fails if below configured values)
4. Uploads coverage report as artifact

### Configuration

Thresholds are defined in `vitest.config.mts`:

```typescript
coverage: {
  thresholds: {
    global: {
      statements: 50,
      branches: 80,
      functions: 80,
      lines: 50,
    },
    "lib/search/**": {
      statements: 90,
      branches: 85,
    },
    // ...
  }
}
```

### Excluded Paths

The following are **excluded from coverage** (not testable via unit tests):

- `scripts/**` - CLI scripts
- `app/**/page.tsx` - Next.js pages (covered by E2E)
- `app/**/layout.tsx` - Next.js layouts
- `middleware.ts` - Next.js middleware
- `*.config.*` - Configuration files
- `app/api/**` - API routes (covered by integration tests)
- `lib/external/**` - Mocked external dependencies

## Checking Coverage Locally

### Run with Coverage

```bash
npm run test:coverage
```

This will:

- Run all tests
- Generate HTML report at `coverage/index.html`
- Display coverage summary in terminal
- **Fail if thresholds not met**

### View Coverage Report

Open `coverage/index.html` in a browser to see:

- File-by-file coverage breakdown
- Line-by-line highlighting (covered/uncovered)
- Missing branch coverage

### Quick Check (No Thresholds)

```bash
npm test
```

Runs tests without coverage collection (faster, no threshold enforcement).

## Updating Thresholds

**When to increase thresholds:**

1. After completing a major testing milestone (B4, B5, etc.)
2. When coverage consistently exceeds current threshold by 5%+
3. Before a major release to lock in gains

**How to update:**

1. Edit `vitest.config.mts`
2. Update threshold values
3. Update this document with new baseline
4. Commit with message: `test: increase coverage thresholds to X%`

**Example:**

```typescript
global: {
  statements: 60, // Increased from 50% after B4 completion
  // ...
}
```

## Troubleshooting

### "Coverage threshold not met" in CI

**Cause**: Your changes reduced coverage below threshold.

**Solutions**:

1. **Add tests** for new/modified code
2. **Remove dead code** instead of leaving it untested
3. **Refactor** to make code more testable
4. If legitimate, **discuss with team** whether threshold should be adjusted

### Coverage seems too low despite tests

**Check:**

1. Are tests in `tests/**` directory? (Vitest auto-discovers these)
2. Are files excluded in `vitest.config.mts`?
3. Is code using dynamic imports that aren't triggered in tests?

### Per-file threshold failing

**Cause**: Critical path coverage dropped (e.g., `lib/search/**` below 90%).

**Solution**: These are **intentionally strict**. You must:

1. Add comprehensive tests for the modified code
2. Or, if refactoring reduces testability, discuss architectural changes

## Related Documentation

- [Testing Guidelines](../development/testing-guidelines.md) - When/how to write tests
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Developer guide
- [v20.0 Roadmap](../planning/roadmap.md#category-b-test-coverage-60h--largest-gap) - Testing milestones

## References

- Vitest Coverage: https://vitest.dev/guide/coverage.html
- Test Coverage Best Practices: https://martinfowler.com/bliki/TestCoverage.html
