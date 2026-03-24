---
status: stable
last_updated: 2026-03-24
owner: jer
tags: [development, testing, guidelines, vitest, playwright, rtl]
---

# Testing Guidelines

## Overview

HelpBridge uses a **pragmatic tiered testing strategy** that prioritizes developer velocity while maintaining confidence in critical features. We focus on fast, reliable feedback loops rather than exhaustive browser coverage.

## Pragmatic Testing Philosophy

> [!TIP]
> **Core Principle**: Tests should accelerate development, not slow it down. Flaky or slow tests are worse than no tests because they erode trust.

### Test Tiers

| Tier          | Scope                             | CI Behavior       | Examples                                            |
| ------------- | --------------------------------- | ----------------- | --------------------------------------------------- |
| **Critical**  | Data integrity, API contracts     | **Block merge**   | Unit tests, type-check, lint, build                 |
| **Core Flow** | Safety-critical logic             | **Block merge**   | Integration tests, API tests                        |
| **E2E**       | Full user flows (Chromium only)   | **Warn only**     | `crisis.spec.ts`, `accessibility.spec.ts` (ADR-015) |
| **Polish**    | UI polish, multi-browser coverage | **Skip / Manual** | Cross-browser testing, visual regression            |

### Default-Suite Discipline

The default `tests/e2e/**` Chromium suite should stay **skip-free**.

- Do not leave permanent inline `test.skip()` cases in the default suite.
- If a browser test is environment-dependent, move it into an explicit opt-in suite such as `tests/e2e/prod/` or `tests/e2e/server/`.
- If a flow is better covered below the browser layer, replace the skipped case with deterministic API/component/hook coverage instead of carrying drift forward.
- If you must land a temporary gap, document it in the roadmap/baseline docs and remove it quickly.

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

# Real DB integration tests against local Supabase
npm run test:db

# Tests with coverage
npm run test:coverage

# Default local verification
npm run lint
npm run type-check
npm run build
```

> [!TIP]
> While GitHub Actions is running in free-tier budget mode, leave Playwright execution to CI/manual dispatch by default. Run local Playwright only when a user explicitly requests it or when debugging a browser-only regression that cannot be reproduced another way.

## CI/CD Strategy

### Pull Requests (Fast Feedback)

- **Linting**, **Type Checking**, **Unit/Integration Tests**
- E2E tests **skipped** for rapid iteration

### Main Branch (Regression)

- All PR checks (blocking)
- **Playwright E2E** on **Chromium only** (non-blocking, see below)
- GitHub reporter for inline annotations

### E2E Tests: Non-Blocking Status

> [!IMPORTANT]
> As of ADR-015, E2E tests are **non-blocking** in CI (`continue-on-error: true`). They run for visibility but won't fail the build.

**Why Non-Blocking?**

E2E tests have been consistently timing out in CI due to infrastructure issues (networkidle waits, API timeouts), not code quality problems. Making them non-blocking allows:

- Development to proceed without flaky test interference
- E2E results remain visible for manual review
- Core quality gates (lint, type-check, unit tests, build) remain strict

**What You Should Do:**

1. **Before Releases**: Manually review E2E test results in Playwright artifacts
2. **Check CI Logs**: Even when CI passes, check for E2E failures
3. **Report Issues**: If E2E tests fail on your changes, investigate (but don't block merge)

See [ADR-015](../adr/015-non-blocking-e2e-tests.md) for full context.

### Temporary CI Budget Mode (GitHub Free Tier)

To conserve CI minutes while on GitHub free tier:

1. `test-e2e` runs on `workflow_dispatch` by default.
2. To run E2E on a `main` push, include `[run-e2e]` in the commit message.
3. Use manual dispatch for intentional E2E validation windows.
4. Use the separate manual `Production Smoke` workflow for public-host checks
   (`helpbridge.ca`) instead of trying to turn deploys into an automatic CI step.

Local helper behavior:

1. `npm run ci:check` skips Playwright tests by default.
2. Set `RUN_PLAYWRIGHT_LOCAL=true` only for intentional local browser-debug windows.

### Deploy posture

- CI is automatic on push/PR.
- Production deploys remain manual and script-driven on the VPS.
- GitHub Actions is used for validation and public smoke verification, not for
  automatic production deploys.

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

### DB Integration Tests

- Place real Supabase-backed retrieval and policy tests in `tests/db/`
- Run them via `npm run test:db` only; the default Vitest suite excludes `tests/db/**`
- Use the local Supabase runner to boot a disposable minimal Supabase stack and apply the deterministic test bootstrap + synthetic seed
- Cover public retrieval boundaries first: `services`, `services_public`, search, export, and service detail
- Treat the DB lane as the source of truth for runtime retrieval contracts, not as proof that the historical migration chain can rebuild the full app schema from scratch

### Free-Tier CI Discipline

- Keep the DB test lane on the minimal local Supabase profile only (`db`, `auth`, `api`, `gateway`)
- Do not add Studio, Storage, Realtime, or other nonessential containers unless the tests actually require them
- Prefer deterministic SQL bootstrap + synthetic fixtures over pulling in production-like operational dependencies

### E2E Tests

- Focus on **critical user flows**: crisis, offline readiness, production/browser-only regressions
- Use Page Object Model for reusable selectors
- Prefer `getByRole`, `getByText` over `data-testid`
- Keep the default suite skip-free; move environment-dependent cases into explicit opt-in suites

## Mocks & Best Practices

### Next.js 15 SSR Mocks (CRITICAL)

Next.js 15 `cookies()` and `headers()` are async. Use the standardized mock setup:

- Import `tests/setup/next-mocks.ts` mocking logic (or copy the pattern)
- Mock `@supabase/ssr` using the Builder Pattern to support method chaining (`.from().select().eq()`)

### Web Workers

- **Do not test `*.worker.ts` files directly.**
- Extract logic into a class (e.g., `webllm-engine.ts`) and unit test that class.
- The worker file should only handle message passing.

### Test Data

- **Do not define ad-hoc mock data.**
- Use centralized fixtures from `tests/fixtures/`
- Use factory functions (e.g., `createMockService()`) to override specific fields.

- **Supabase**: Always mock `createClient`
- **AI Engine**: Mock `lib/ai/engine.ts`
- **Globals**: `vitest.setup.ts` provides global mocks

## Coverage Goals

- **80%** coverage on branches/functions for core logic
- UI components should cover interactive states
- Don't chase 100% - focus on critical paths
