# ADR 001: Modular Search Architecture

## Status

Accepted

## Date

2025-12-30

## Context

The `lib/search.ts` file had grown to over 480 lines, handling multiple responsibilities including data loading, vector math, geo-math, keyword scoring, and fuzzy matching. This made it difficult to maintain, test in isolation, and caused linting/complexity issues.

## Decision

We decided to split `lib/search.ts` into a modular directory structure under `lib/search/`:

- `data.ts`: Data loading & caching
- `scoring.ts`: Keyword scoring logic
- `vector.ts`: Vector/Semantic math
- `geo.ts`: Geolocation math
- `fuzzy.ts`: Query suggestions
- `utils.ts`: Shared text utilities
- `types.ts`: Shared interfaces
- `index.ts`: Coordination logic (searchServices)

## Consequences

- **Positive:** Better separation of concerns, easier unit testing of individual components, improved readability.
- **Positive:** Easier to extend specific parts (e.g., adding new scoring weights) without touching unrelated logic.
- **Neutral:** Slightly more files to manage, but the directory grouping keeps them organized.
