# ADR 014: Structured Logging System

**Date**: 2026-01-15
**Status**: Accepted

## Context

The application previously relied on ad-hoc `console.log`, `console.warn`, and `console.error` calls scattered throughout the codebase. This approach had several drawbacks:

- Lack of consistent timestamps and structure.
- Inability to attach global context (e.g., User ID, Session ID) automatically.
- No separation between development logs and production logs (everything went to stdout).
- Difficulty in parsing logs for monitoring and debugging in production environments.

## Decision

We have decided to implement a centralized, class-based `Logger` utility (`lib/logger.ts`) to manage all application logging.

### Key Features

1. **Structured Output**: Logs are formatted as JSON objects in production, containing distinct fields for `level`, `message`, `timestamp`, and `metadata`.
2. **Context Awareness**: The logger supports setting global context (e.g., `logger.setContext({ userId: '...' })`) which is automatically included in all subsequent logs.
3. **Performance Monitoring**: Built-in `startTimer` and `endTimer` methods allow for easy performance tracking of operations.
4. **Environment Handling**:
   - **Development**: Pretty-printed, colorized output for readability.
   - **Production**: Compact, single-line JSON for ingestion by log aggregators.

## Consequences

### Positive

- **Observability**: Much easier to trace issues across components using Session IDs.
- **Consistency**: All logs follow a strict schema.
- **Performance**: Ability to measure and log duration of critical paths (e.g., AI inference).

### Negative

- **Learning Curve**: Developers must remember to use `logger.info()` instead of `console.log()`.
- **Refactoring**: Existing code needs to be migrated to the new system (completed for high-traffic components).

## Implementation

The logger is a singleton instance exported from `lib/logger.ts`.

```typescript
import { logger } from "@/lib/logger"

// Usage
logger.info("Operation started", { component: "Auth" })
logger.error("Login failed", error, { attempt: 3 })
```
