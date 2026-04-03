# Performance Baseline Metrics

**Last Updated:** 2026-03-12
**Status:** Measured

## Overview

These are the current local baseline numbers captured on **2026-03-12** during the autonomous backlog closeout. The previous blocked placeholder state has been replaced with real measurements from a local standalone production build.

Interpretation matters:

- The app was served from `http://localhost:3000` via `node .next/standalone/server.js`.
- The heavier search tests are dominated by the existing per-IP search rate limit (`60/min`) because k6 drives all traffic from a single local IP. Those runs therefore measure current throttling behavior more than raw backend capacity.

## Measured Environment

- Host: `Linux x86_64`
- Node.js: `v24.12.0`
- Next.js: `15.5.12`
- k6: `v1.5.0` installed locally on `PATH` (`k6 version`)
- Build mode: standalone production server
- Search dataset: 196 services
- Base URL: `http://localhost:3000`

## Results

| Test       | Command                       | Requests | Success | Failed | Avg req/s |     p50 |     p95 |       p99 |       Max | Status |
| ---------- | ----------------------------- | -------: | ------: | -----: | --------: | ------: | ------: | --------: | --------: | ------ |
| Smoke      | `npm run test:load:smoke`     |       30 |      30 |      0 |      0.88 | 62.45ms | 98.61ms |  334.64ms |  334.64ms | PASS   |
| Search API | `npm run test:load`           |    9,565 |     626 |  8,939 |     15.23 |  3.81ms | 56.21ms | 1489.46ms | 1489.46ms | FAIL   |
| Sustained  | `npm run test:load:sustained` |    2,242 |     529 |  1,713 |      4.43 |  4.55ms | 70.50ms | 1701.12ms | 1701.12ms | FAIL   |
| Spike      | `npm run test:load:spike`     |   19,587 |     120 | 19,467 |    230.39 |  4.42ms | 12.85ms | 1651.53ms | 1651.53ms | FAIL   |

## Interpretation

### Smoke test

- The smoke profile now passes cleanly with `0%` failed requests.
- During this refresh, two harness issues were fixed before the final measurement:
  - the smoke script now accepts the public health response shape instead of assuming authenticated-only `checks`;
  - the shared rate limiter now uses route-scoped buckets so unrelated endpoints no longer consume each other’s quota.

### Search, sustained, and spike profiles

- The failure rates are consistent with the current per-IP search throttle, not with broad server collapse.
- This is an inference from the measured success counts:
  - Search API run: 626 successes over about 10.5 minutes, close to the `60/min` limiter ceiling.
  - Sustained run: 529 successes over about 8.4 minutes, again near the same ceiling.
  - Spike run: 120 successes over about 1.4 minutes, with `19,467` recorded `rate_limit_hits`.
- No circuit-breaker activations were recorded during the spike run.
- Latency on successful requests stayed low, but the suite is not a valid capacity benchmark until either:
  - the load tests use route-appropriate distributed client identities, or
  - a dedicated non-production benchmark mode relaxes the search limiter for controlled measurements.

## Artifacts

Latest machine-readable summaries:

- [smoke-test-latest.json](../../tests/load/results/smoke-test-latest.json)
- [search-api-latest.json](../../tests/load/results/search-api-latest.json)
- [sustained-load-latest.json](../../tests/load/results/sustained-load-latest.json)
- [spike-test-latest.json](../../tests/load/results/spike-test-latest.json)

Raw k6 outputs:

- [smoke-test-raw.json](../../tests/load/results/smoke-test-raw.json)
- [search-api-raw.json](../../tests/load/results/search-api-raw.json)
- [sustained-load-raw.json](../../tests/load/results/sustained-load-raw.json)
- [spike-test-raw.json](../../tests/load/results/spike-test-raw.json)

## Follow-Up

- For launch-readiness, these runs confirm that throttling is active and that the basic smoke path succeeds.
- For capacity planning, the k6 profiles need a second pass that does not immediately saturate the shared per-IP search limiter.
