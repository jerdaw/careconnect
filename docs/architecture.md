# Kingston Care Connect - Architecture Overview

## Tech Stack
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI (Primitives)
- **Database**: Supabase (PostgreSQL + Vector)
- **Internationalization**: `next-intl`
- **Testing**: Playwright (E2E), Vitest (Unit)

## Directory Structure
- `app/`: Next.js App Router pages and API routes.
  - `[locale]/`: Localized routes.
  - `api/v1/`: RESTful API endpoints.
- `components/`: UI components.
  - `ui/`: Standardized primitives (Button, etc.).
- `hooks/`: Custom React hooks (`useSearch`, `useServices`).
- `lib/`: Utility functions (API helpers, search logic).
- `types/`: TypeScript definitions.
- `docs/`: Project documentation.

## Core Concepts

### Search Architecture
The search system uses a hybrid approach:
1.  **Instant Keyword Search**: Filters results locally/via basic db queries for immediate feedback.
2.  **Lazy Semantic Search**: Loads a lightweight embedding model (TensorFlow.js) in the background. Once ready, it re-ranks results based on vector similarity.

### Data Flow
- **Services**: Fetched via `/api/v1/services`. Cached using SWR-like strategies in hooks.
- **Analytics**: Search events are logged to `/api/v1/analytics/search` asynchronously.

### Error Handling
- **Global Error Boundary**: Wraps the application root to catch runtime crashes.
- **API Errors**: Standardized JSON response format (`{ error: string, meta: ... }`).

## Development
- `npm run dev`: Start local server.
- `npm run test`: Run integration tests.
- `npx playwright test`: Run E2E tests.
