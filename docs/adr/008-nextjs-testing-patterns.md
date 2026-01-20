# ADR 008: Next.js 15 and Web Worker Testing Patterns

**Date:** 2026-01-19  
**Status:** Accepted

## Context

The migration to Next.js 15 introduced significant changes to server-side rendering (SSR), particularly the asynchronous nature of `cookies()` and `headers()`. Our initial test suite failed because previous mocking strategies were incompatible with these new APIs.

Additionally, our AI system uses Web Workers (`webllm.worker.ts`) which are difficult to unit test directly in Vitest/JSDOM environments because `Worker` APIs are not fully supported or behave differently than in browsers.

## Decision

We have adopted specific standardized patterns for testing these architectural components.

### 1. Next.js 15 SSR Mocks

We standardize on a global mocking strategy for Next.js 15 server interfaces using `vi.hoisted` and Standard Mock Definitions.

**Pattern:**

- Use `tests/setup/next-mocks.ts` for consistent mock implementations.
- Mock `next/headers` to return synchronous-behaving mocks for `cookies()` and `headers()`.
- Mock `@supabase/ssr` to return a standardized "Builder Pattern" mock client that supports both Promise-based and method-chaining usage.

```typescript
// Example Standard Mock
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    /* ... */
  }),
  headers: vi.fn().mockReturnValue(new Map()),
}))
```

### 2. Web Worker Testing Strategy

We explicitly **do not** unit test `*.worker.ts` files directly. Instead, we extract the core business logic into a standalone, testable class/module.

**Pattern:**

- **Refactor:** Move logic from `webllm.worker.ts` to `webllm-engine.ts`.
- **Unit Test:** Test `webllm-engine.ts` with standard Vitest patterns.
- **Integration:** The worker file becomes a thin shell that imports the engine and handles message passing (tested via E2E only).

### 3. Centralized Test Fixtures

To avoid "mock drift" where different tests use slightly different versions of data structures, we use centralized fixtures.

**Pattern:**

- Place fixtures in `tests/fixtures/`.
- Export strongly-typed constant objects (e.g., `mockServiceL3`).
- Export factory functions for variations (e.g., `createMockService({ ... })`).
- Do not define ad-hoc mock data in test files unless specific to a unique edge case.

## Consequences

### Positive

- **Stability:** Tests are robust against Next.js internal changes.
- **Maintainability:** Fix mock logic in one place (`next-mocks.ts`) updates all tests.
- **Testability:** Complex AI logic is fully unit-testable without browser execution context.
- **Consistency:** All developers use the same valid data structures.

### Negative

- **Boilerplate:** Tests require standardized setup code at the top of files.
- **Indirection:** Worker logic is split across two files (worker shell + engine), which may be less intuitive for new contributors.

## Compliance

All new tests MUST follow these patterns. Existing tests have been migrated.
