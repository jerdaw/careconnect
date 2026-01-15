# ADR 001: Enhanced Type Safety and API Security

## Status
Accepted

## Date
2026-01-14

## Context
The application faced several technical debt issues related to type safety and consistency:
1. Implicit `any` types in API handlers and test mocks, leading to fragile code and potential runtime errors.
2. Inconsistent validation of API payloads (e.g. `POST /api/v1/services`), relying on manual checks or implicit casting.
3. Test files were excluded from linting, allowing code quality to degrade in the test suite (unused imports, broken mocks).
4. Potential SSR issues with `localStorage` usage.

## Decision
We have decided to enforce strict type safety and validation patterns across the application:

1.  **Zod for API Validation**: All API write endpoints (POST, PUT, PATCH) must use Zod schemas to validate request bodies before processing.
    *   **Rationale**: Zod provides runtime validation that infers static TypeScript types, ensuring the runtime data matches our compile-time expectations.
2.  **Linting in Tests**: The `tests/` directory is no longer excluded from ESLint.
    *   **Rationale**: Tests are first-class code. Ensuring they are linted prevents bit-rot (unused variables, imports) and ensures they remain maintainable.
    *   **Consequence**: We established a baseline of existing lint errors (mostly `any` in mocks) to be resolved incrementally, but new tests must be lint-free.
3.  **Removal of Global Polyfills**: We removed the global SSR `localStorage` polyfill in favor of explicit checks (`typeof window !== 'undefined'`).
    *   **Rationale**: Global polyfills can mask real SSR issues. Explicit checks are safer and more transparent.

## Consequences
-   **Positive**: API changes are safer; invalid payloads are rejected with clear errors. Tests are cleaner and more reliable.
-   **Negative**: Slight boilerplate increase for defining Zod schemas. Mocks in tests require more precise typing than `any`.
