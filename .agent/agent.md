# Kingston Care Connect - AI Context

This file provides context for AI agents working on the Kingston Care Connect project.

## Development Principles

1. **Separation of Content**: No hardcoded strings in UI. Use translation files.
2. **SSR Safety**: Always guard client-side APIs (localStorage, window) with `typeof window !== 'undefined'`.
3. **Privacy First**: Avoid adding tracking scripts or invasive cookies.
4. **Verified Data**: The "Kingston 150" dataset is manually curated. Update via `scripts/migrate-data.ts`.

## Tech Stack

- Next.js 15, Tailwind v4, Supabase.
- Mobile-first, PWA ready.

## Key Files

- `docs/planning/`: Roadmap, version planning, and project history.
- `lib/search/index.ts`: Core hybrid search logic.
- `docs/development/bilingual-guide.md`: Standardization of multi-lingual support.
- `docs/development/testing-guidelines.md`: Expectations for feature coverage.
- `docs/ACCESSIBILITY_GUIDE.md`: Accessibility standards and patterns.
- `docs/adr/008-nextjs-testing-patterns.md`: Next.js 15 SSR testing patterns and WebLLM testing strategy.
- `tests/setup/next-mocks.ts`: Centralized Next.js 15 mock definitions.
- `tests/fixtures/`: Centralized test fixtures for services, feedback, and users.
- `docs/llms.txt`: Consolidated context for LLMs.

## Testing Patterns

- **Next.js 15 SSR**: Use centralized mocks from `tests/setup/next-mocks.ts` for `cookies()`, `headers()`, and `createServerClient()`.
- **Web Workers**: Extract logic from worker files (e.g., `webllm.worker.ts` → `webllm-engine.ts`) for unit testing.
- **Coverage Target**: 75%+ overall, with higher thresholds (80-85%) for critical paths (search, AI, offline, auth).
- **Test Location**: Mirror production structure (e.g., `lib/search/data.ts` → `tests/lib/search/data.test.ts`).
