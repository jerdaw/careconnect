# Testing Guidelines

## Overview

Kingston Care Connect uses a comprehensive testing strategy involving Unit, Integration, and End-to-End (E2E) tests. We aim for high confidence in our core features, especially crisis support and service directory functionality.

## Tech Stack

- **Unit & Integration**: [Vitest](https://vitest.dev/)
- **Component Testing**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **E2E Testing**: [Playwright](https://playwright.dev/)
- **Coverage**: v8

## Directory Structure

- `tests/unit/`: Pure logic unit tests.
- `tests/components/`: Component tests (React).
- `tests/hooks/`: Custom hook tests.
- `tests/integration/`: Integration tests involving multiple units or mocked services.
- `tests/api/`: API route tests.
- `tests/e2e/`: Playwright E2E scenarios.
- `tests/utils/`: Shared test utilities and mocks.

## Running Tests

```bash
# Run unit and integration tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (requires dev server or build)
npm run test:e2e
```

## Writing Tests

### Unit Tests

- Co-locate with logic where possible or place in `tests/unit`.
- Mock external dependencies (Supabase, AI Engine) using `vi.mock`.
- Use `tests/utils/mocks.ts` for shared mock data.

### Component Tests

- Use `TestWrapper` (`tests/utils/test-wrapper.tsx`) for components requiring `next-intl` or Context providers.
- Test for accessibility (aria-labels, roles) implicitly via `getByRole`.

### API Tests

- Place in `tests/api/v1/`.
- Use `tests/utils/api-test-utils.ts` to create mock requests.
- Mock Supabase client deeply to avoid network calls.

### E2E Tests

- Focus on critical user flows: Crisis support, Search, Language switching, Offline usage.
- Use `data-testid` only when semantic queries (`getByRole`, `getByText`) fail.

## Mocks & Best Practices

- **Supabase**: Always mock `createClient`. Use `vi.hoisted` if mocking properties referenced in the factory.
- **AI Engine**: Mock `lib/ai/engine.ts`.
- **Globals**: `vitest.setup.ts` provides global mocks for `fetch`, `ResizeObserver`, etc.

## Coverage Goals

- We aim for **80%** coverage on branches and functions for core logic.
- UI components should cover all interactive states.
