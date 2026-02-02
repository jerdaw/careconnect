# Performance Baseline Metrics

## Test Environment

- **Date**: 2026-01-25
- **Version**: v17.5+
- **Hardware**: Linux / Local Development
- **Database**: Supabase (Local/Dev)
- **Environment**: Local Development Desktop

## Smoke Test Results

- **Request Success Rate**: 0% (Note: All requests failed with status code errors - likely environment setup related)
- **avg latency**: 500.88ms
- **p95 latency**: 620.94ms
- **p90 latency**: 611.54ms
- **Checks passed**: 50% (Basic JSON structure and response presence)

## Search API Load Test Results

_Blocked by environment/RLS recursion issues found in smoke test._

## Sustained Load Test Results

_Blocked by environment issues._

## Spike Test Results

_Blocked by environment issues._

## Thresholds for Regression Detection

- p95 latency degradation: >20%
- p99 latency degradation: >30%
- Error rate increase: >2%
- Circuit breaker false-opens: >0

## Constraints & Known Issues

- **RLS Recursion**: Complex RLS policies during high-concurrency requests are causing 100% failure rates in local testing.
- **k6 Binary**: Using local `./bin/k6` due to system path restrictions.

## Next Review

2026-02-25
