# Kingston Care Connect - Architecture Overview

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Radix UI
- **Database**: Supabase (PostgreSQL + Vector)
- **Internationalization**: `next-intl`
- **Testing**: Playwright (E2E), Vitest (Unit)

## Directory Structure

- `app/`: Next.js App Router pages and API routes.
  - `[locale]/`: Localized routes.
  - `api/v1/`: RESTful API endpoints.
  - `offline/`: PWA offline fallback page.
  - `worker.ts`: Semantic search Web Worker.
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

### 7. AI Assistant Architecture (Phase 4)
- **Engine**: `@mlc-ai/web-llm` running `Phi-3-mini` (2GB) via WebGPU.
- **Strategy**: RAG (Retrieval Augmented Generation).
- **Privacy**: 
  - **Local-Only**: Inference runs entirely in the user's browser.
  - **No Data Egress**: Chat history and queries never leave the device.
  - **Zero-Knowledge**: Server knows *that* a user is chatting, but not *what* they are saying.
- **Lifecycle**:
  - **Opt-In**: Model download only triggered by explicit user action.
  - **Idle Cleanup**: VRAM released after 5 minutes of inactivity.

### 8. Privacy-Preserving Personalization (Phase 5)
- **Client-Side Profile**: User demographics (Age, Identities) stored in `localStorage` (`kcc_user_context`).
- **Zero PII**: No user accounts, login, or cookies required for basic personalization.
- **Local Eligibility**: "Likely Qualify" checks run locally by parsing cached service data against the local profile.
- **Identity Boosting**: Search ranking adjustments happen on the client-side `WebWorker`.

### Data Flow

- **Services**: Fetched via `/api/v1/services`. Cached using SWR-like strategies in hooks.
- **Analytics**: Search events are logged to `/api/v1/analytics/search` asynchronously.

### Routing & Discovery

- **Public Routes**: `/service/[id]` provides a rich detail page with contact info and eligibility.
- **Internal Links**: `ServiceCard` now links to internal detail pages instead of external URLs.

### Partner Claim Workflow

- **Claim Logic**: Unclaimed services can be claimed by authenticated organizations.
- **Verification**: Claiming a service automatically elevates its status to `L1`.
- **Atomic Operations**: `lib/services.ts` handles the claim logic with database consistency checks.

### Hooks Architecture

We use a modular hook system to separate concerns:

- **Search Hooks**: `useSearch` coordindates state, `useServices` handles logic, and `useSemanticSearch` manages the worker.
- **Utility Hooks**: Generic hooks for `localStorage` and `Geolocation` ensure SSR safety and consistency.

### Logging & Monitoring

- **Logger Utility**: Located in `lib/logger.ts`. Use instead of `console.log`.
- **Error IDs**: The Error Boundary generates unique IDs (e.g., `ERR-K9X2J1`) for cross-referencing logs with user reports.

## Development

- `npm run dev`: Start local server.
- `npm run test`: Run integration tests.
- `npx playwright test`: Run E2E tests.
- `docs/CONTRIBUTING.md`: Detailed development guidelines.
