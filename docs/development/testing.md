# Testing Guidelines

## 1. Stack

- **Unit/Integration**: [Vitest](https://vitest.dev/)
  - Fast, headless testing for components, hooks, and utility logic.
  - Config: `vitest.config.mts`
- **End-to-End (E2E)**: [Playwright](https://playwright.dev/)
  - Browser-based testing for critical user flows (Search, Navigation, Login).
  - Config: `playwright.config.ts`

## 2. File Structure

- `tests/unit/**/*`: Vitest unit tests (colocated with code is also acceptable for utils).
- `tests/api/**/*`: API route tests (e.g., `tests/api/v1/search-api.test.ts`).
- `tests/e2e/**/*`: Playwright E2E scenarios.
- `scripts/search-qa.ts`: Specialized script for evaluating search relevance quality.

## 3. Requirements

- **New Features**: Must have corresponding unit tests.
- **Critical Paths**: Search, Partner Login, and Service Editing must be covered by E2E tests.
- **Coverage**: Maintain minimum **80%** code coverage for critical modules (lib/search, lib/ai, hooks). General logic should target 65%+. Use `npm run test:coverage` to verify against per-path thresholds.

## 4. Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run in watch mode (dev)
npm run test:watch

# Check coverage
npm run coverage
```

### E2E Tests (Playwright)

```bash
# E2E Tests (Playwright)
# ⚠️ Run primarily in GitHub CI to ensure consistent environment
npm run test:e2e:local # Optional: Try locally (Chromium) if debugging


# Run with UI mode (interactive debugging)
npx playwright test --ui

# specific file
npx playwright test tests/e2e/search.spec.ts
```

## 5. CI/CD

GitHub Actions (`.github/workflows/`) automatically run:

1. Linting & Type Checking
2. Unit Tests
3. E2E Tests (on deployment)
4. Data Integrity Checks (`npm run validate-data`)
