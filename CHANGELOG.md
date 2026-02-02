# Changelog

All notable changes to this project will be documented in this file.

## [0.17.5] - 2026-01-25

### Added

#### Performance Tracking System

- New `lib/performance/tracker.ts` for lightweight operation timing
- New `lib/performance/metrics.ts` with in-memory metrics aggregation
- Support for p50, p95, p99 latency percentiles
- Auto-pruning of metrics (10min retention window, 1000 samples per operation)
- Configurable via `NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING` environment variable

#### Circuit Breaker Pattern

- New `lib/resilience/circuit-breaker.ts` with state machine (CLOSED → OPEN → HALF_OPEN)
- New `lib/resilience/supabase-breaker.ts` for Supabase-specific protection
- New `lib/resilience/telemetry.ts` for state transition logging
- Fast-fail behavior (<1ms when circuit is open)
- Automatic recovery after configurable timeout

#### Health Check & Metrics Endpoints

- `GET /api/v1/health` - Public health check with optional detailed metrics
- `GET /api/v1/metrics` - Development-only metrics API (requires authentication)
- `DELETE /api/v1/metrics` - Reset metrics endpoint
- Rate limiting on health and metrics endpoints

#### Load Testing Infrastructure

- Four k6 load test scripts: smoke, search-api, sustained-load, spike-test
- Load testing documentation with usage guide and threshold definitions
- NPM scripts: `test:load`, `test:load:smoke`, `test:load:sustained`, `test:load:spike`

#### Documentation

- ADR-016: Performance Tracking & Circuit Breaker architectural decision record
- v17.5 archive documentation with implementation details
- v17.6 roadmap with follow-up work (baselines, integration tests, translation helper)
- Load testing guide with scenario descriptions and thresholds
- French translation workflow documentation

### Changed

- Protected all critical Supabase operations with circuit breaker
- Updated `CLAUDE.md` with v17.5 performance tracking and resilience patterns
- Updated `lib/search/data.ts` to use circuit breaker for database fallback
- Enhanced `lib/offline/sync.ts` to respect circuit breaker state
- Updated `lib/env.ts` with Zod validation for circuit breaker configuration

### Performance

- Circuit breaker overhead: <0.5ms per operation in CLOSED state, <1ms in OPEN state
- Performance tracking overhead: <1ms per async operation, <0.1ms per sync operation
- Memory usage: <1KB for circuit breaker state, ~1KB per 1000 metrics samples

### Testing

- Added 34 new tests:
  - 16 performance tracker tests
  - 18 circuit breaker tests
- All tests passing with no regressions

---

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
