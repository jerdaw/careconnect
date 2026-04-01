# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Gate 0 evidence workspace scaffolding for C1 legal review, C2 retention sign-off, and D4 partner-ops execution bundles
- Draft C2 retention policy proposal, deletion verification runbook, and typed retention-policy config with tests
- Dated C2 evidence submission capturing approval, privacy sign-off, and read-only verification output

### Changed

- Updated active contributor docs to treat `AGENTS.md` as canonical with `CLAUDE.md` and `GEMINI.md` as compatibility symlinks
- Refreshed roadmap language to reflect completed autonomous Gate 0 prep work and current CI free-tier testing posture
- Approved the C2 retention policy, updated the code-backed retention status to `APPROVED`, and synced Gate 0 trackers so only C1 and D4 remain blocking
- Hardened service creation, provenance handling, Slack links, CSV import parsing, and trust rendering based on the March audit findings
- Deferred global AI and semantic search startup until user intent, cutting the localized home-route first-load bundle down to roughly 315 kB
- Repaired the noisy scheduled workflow drift in `Sync 211 Ontario Data` and `Production Smoke`, and made local `ci:check` degrade gracefully when DB prerequisites are unavailable
- Quarantined the 211 sync path to explicit manual runs, removed mock fallback ingestion, and removed placeholder synced records from `data/services.json`
- Updated the remaining docs/release workflow actions for Node 24 readiness and replaced the archived release action with `gh release create`
- Fixed local `ci:check` so the DB lane now skips cleanly when Docker exists but the daemon is unreachable
- Pinned `@xmldom/xmldom` to a safe transitive version to clear the Capacitor CLI audit advisory

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
- Updated the contributor guide (`AGENTS.md` via compatibility symlink) with v17.5 performance tracking and resilience patterns
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
