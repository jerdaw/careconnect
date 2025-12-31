# ADR 002: Strict Environment Validation

## Status

Accepted

## Date

2025-12-30

## Context

Next.js applications often suffer from "silent failures" where environment variables (like Supabase URLs or API keys) are missing or misconfigured. Non-null assertions (`!`) are commonly used but provide poor error messages.

## Decision

We implemented strict environment validation using `@t3-oss/env-nextjs` and `zod`:

- Created `lib/env.ts` to define the schema for both server-side and client-side (public) environment variables.
- Required `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to be present and properly formatted.
- Updated `middleware.ts` and other key services to import `env` from `@/lib/env` instead of using `process.env` directly.

## Consequences

- **Positive:** Fail-fast behavior: the app will throw a clear error at startup if variables are missing.
- **Positive:** Fully typed environment variables (Integreated into IDE intellisense).
- **Negative:** Build will fail if environment variables are not present (unless marked as optional).
