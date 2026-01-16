---
status: stable
last_updated: 2026-01-16
owner: jer
tags: [development, testing, guidelines, vitest, playwright, rtl]
---

# Testing Guidelines

## Overview

Kingston Care Connect uses a **pragmatic tiered testing strategy** that prioritizes developer velocity while maintaining confidence in critical features. We focus on fast, reliable feedback loops rather than exhaustive browser coverage.

## Pragmatic Testing Philosophy

> [!TIP]
> **Core Principle**: Tests should accelerate development, not slow it down. Flaky or slow tests are worse than no tests because they erode trust.

### Test Tiers

| Tier          | Scope                          | CI Behavior          | Examples                                  |
| ------------- | ------------------------------ | -------------------- | ----------------------------------------- |
| **Critical**  | Data integrity, API contracts  | **Block merge**      | `data-integrity.spec.ts`, unit tests      |
| **Core Flow** | Safety-critical user paths     | **Block merge**      | `crisis.spec.ts`, `accessibility.spec.ts` |
| **Polish**    | UI interactions, multi-browser | **Warn only / Skip** | `search.spec.ts`, `multi-lingual.spec.ts` |

### When to Skip Tests

Mark tests with `test.skip()` and a `TODO` comment when:

- Test relies on selectors that don't match current UI
- Test is flaky across environments (especially WSL)
- Test blocks CI without catching real bugs
- Fixing would take >30 min and isn't blocking a release

```typescript
// TODO: Fix - Mock data doesn't support proper navigation
test.skip("should navigate to service detail", async ({ page }) => {
  // Test code...
})
```

## Tech Stack

- **Unit & Integration**: [Vitest](https://vitest.dev/)
- **Component Testing**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **E2E Testing**: [Playwright](https://playwright.dev/) (Chromium-only in CI)
- **Coverage**: v8

## Directory Structure

- `tests/unit/`: Pure logic unit tests
- `tests/components/`: Component tests (React)
- `tests/hooks/`: Custom hook tests
- `tests/integration/`: Integration tests
- `tests/api/`: API route tests
- `tests/e2e/`: Playwright E2E scenarios
- `tests/e2e/pages/`: Page Object Models
- `tests/e2e/fixtures/`: Mock data for E2E tests
- `tests/utils/`: Shared test utilities and mocks

## Running Tests

```bash
# Unit and integration tests (fast, reliable)
npm test

# Tests with coverage
npm run test:coverage

# E2E tests - Chromium only (recommended)
npm run test:e2e:local

# E2E tests - All browsers (slow, for release validation only)
npx playwright test
```

## CI/CD Strategy

### Pull Requests (Fast Feedback)

- **Linting**, **Type Checking**, **Unit/Integration Tests**
- E2E tests **skipped** for rapid iteration

### Main Branch (Regression)

- All PR checks
- **Playwright E2E** on **Chromium only**
- GitHub reporter for inline annotations

### Why Chromium Only?

1. **Speed**: 5x faster than running all browsers
2. **Reliability**: Fewer timeout failures in constrained CI environments
3. **Coverage**: 95%+ of bugs caught by one modern browser
4. **Cost**: Reduced compute minutes

## Writing Tests

### Unit Tests

- Co-locate with logic or place in `tests/unit`
- Mock external dependencies with `vi.mock`
- Use `tests/utils/mocks.ts` for shared mock data

### Component Tests

- Use `TestWrapper` for components needing `next-intl` or Context
- Test for accessibility via `getByRole`, `getByLabelText`

### API Tests

- Place in `tests/api/v1/`
- Mock Supabase client to avoid network calls

### E2E Tests

- Focus on **critical user flows**: Crisis, Data Integrity
- Use Page Object Model for reusable selectors
- Prefer `getByRole`, `getByText` over `data-testid`
- Add `test.skip()` with TODO for known-flaky tests

## Mocks & Best Practices

- **Supabase**: Always mock `createClient`
- **AI Engine**: Mock `lib/ai/engine.ts`
- **Globals**: `vitest.setup.ts` provides global mocks

## Coverage Goals

- **80%** coverage on branches/functions for core logic
- UI components should cover interactive states
- Don't chase 100% - focus on critical paths
