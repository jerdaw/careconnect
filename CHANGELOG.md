# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-12-30

### Added

- GitHub Actions CI/CD workflow with Playwright E2E tests.
- Strict environment validation using `@t3-oss/env-nextjs`.
- Vitest coverage thresholds (80% minimum).
- Protected route redirects in Middleware for `/dashboard` and `/admin`.
- Architecture Decision Records (ADR) system.
- Security Policy (`SECURITY.md`).

### Changed

- Modularized `lib/search.ts` into multiple sub-modules for better maintainability.
- Standardized documentation: README and Architecture guide now refer to Next.js 15 and Tailwind v4 consistently.
- Improved search data loading with fallback embeddings overlay.

### Fixed

- Fixed documentation version inconsistencies.
- Fixed missing env validation in production middleware.
