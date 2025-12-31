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

- `docs/roadmaps/`: History of project growth.
- `lib/search.ts`: Core hybrid search logic.
- `bilingual-dev-guide.md`: Standardization of English/French support.
- `testing-guidelines.md`: Expectations for feature coverage.
