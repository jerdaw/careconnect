# Testing Guidelines

## 1. Stack

- **Runner:** Vitest
- **E2E/Integration:** Scripts in `scripts/` (e.g., `search-qa.ts`).

## 2. Requirements

- All new features must have a corresponding test case.
- Critical paths (Search, Admin Save) must be smoke-tested before deploy.
- Search Quality must maintain >90% pass rate on `scripts/search-qa.ts`.

## 3. CI/CD

- `npm test` should run unit tests.
- `npm run validate-data` should run before build.
