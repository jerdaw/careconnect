# Circuit Breaker Integration Testing

## Overview
Integration tests validate the `CircuitBreaker` logic in `lib/resilience` by simulating real database failures. These tests ensure the system:
1. Fast-fails when the database is down
2. Automatically recovers when the database returns
3. Prevents cascading failures
4. Provides graceful fallbacks

## Running Tests

### Helper Script
The easiest way to run the integration tests is via `npm`:
```bash
npm test -- tests/integration/circuit-breaker-db.test.ts
```

### Manual Execution (Vitest)
```bash
npx vitest tests/integration/circuit-breaker-db.test.ts
```

## Test Logic

### Database Simulator
Tests utilize a `DatabaseSimulator` utility (`tests/integration/utils/db-simulator.ts`) that mocks database failures.

```typescript
// Example: Force next 3 DB calls to fail
dbSimulator.simulateFailure(3)
```

### Key Scenarios Tested
- **Circuit Open**: Verifies circuit opens after threshold failures (default: 3).
- **Auto Recovery**: Verifies circuit transitions to `HALF_OPEN` after timeout.
- **Persistent Failure**: Verifies circuit remains `OPEN` if recovery attempt fails.
- **Fallback**: Verifies `withCircuitBreaker` uses fallback function when circuit is `OPEN`.

## Troubleshooting

### Flaky Tests
- **Timing**: Tests use `vi.useFakeTimers()` to control time. If tests fail on timeouts, ensure `vi.advanceTimersByTime()` logic is correct.
- **State Leaks**: `resetSupabaseBreaker()` is called in `beforeEach` to ensure a clean state.

### Interpreting Results
- **OPEN**: Circuit is blocking requests.
- **HALF_OPEN**: Circuit is testing recovery.
- **CLOSED**: Normal operation.
