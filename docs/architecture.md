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
  - `api/v1/`: RESTful API endpoints. (See [OpenAPI Spec](api/openapi.yaml))
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
2.  **Fuzzy Search ("Did you mean?")**: If results are low, the Levenshtein algorithm suggests alternative queries based on service names and tags.
3.  **Lazy Semantic Search**: Loads a lightweight embedding model (TensorFlow.js) in the background. Once ready, it re-ranks results based on vector similarity.

### AI Assistant Architecture

- **Engine**: `@mlc-ai/web-llm` running `Phi-3-mini` (2GB) via WebGPU.
- **Strategy**: RAG (Retrieval Augmented Generation).
- **Privacy**:
  - **Local-Only**: Inference runs entirely in the user's browser.
  - **No Data Egress**: Chat history and queries never leave the device.
  - **Zero-Knowledge**: Server knows _that_ a user is chatting, but not _what_ they are saying.
- **Lifecycle**:
  - **Opt-In**: Model download only triggered by explicit user action.
  - **Idle Cleanup**: VRAM released after 5 minutes of inactivity.

### Privacy-Preserving Personalization

- **Client-Side Profile**: User demographics (Age, Identities) stored in `localStorage` (`kcc_user_context`).
- **Zero PII**: No user accounts, login, or cookies required for basic personalization.
- **Local Eligibility**: "Likely Qualify" checks run locally by parsing cached service data against the local profile.
- **Identity Boosting**: Search ranking adjustments happen on the client-side `WebWorker`.

### Data Pipelines

- **Source of Truth**: 211 Ontario API (Raw Data) + Manual Verification (Golden Dataset).
- **Ingestion**:
  - `scripts/sync-211.ts`: Fetches, cleans, and maps external data to the `Service` schema.
  - `generate-embeddings.ts`: Generates logical-semantic embeddings at build time.
- **Versioning**: `generate-changelog.ts` tracks diffs between syncs.

### User Feedback Loop

- **Pipeline**: Client (`FeedbackModal`) -> Next.js API (`/api/feedback`) -> Supabase (`feedback` table).
- **Security**: Supabase RLS ensures partners only see feedback for their own services.
- **Validation**: Zod schema in API route enforces data integrity and prevents spam.

### Push Notifications

- **Technology**: Web Push API + Service Worker (`app/worker.ts`).
- **Flow**: User Opt-In -> Service Worker Subscribes -> Endpoint stored in `push_subscriptions` -> Server-side trigger via VAPID keys.
- **Privacy**: No PII linked to subscriptions. User can revoked at any time via browser settings.

### Automated Maintenance Bots

- **URL Health Bot**: Monthly check of all service URLs (`scripts/health-check-urls.ts`).
- **Phone Validator**: Connectivity checks using Twilio Lookup API (`scripts/validate-phones.ts`).
- **Automation**: GitHub Actions (`.github/workflows/health-check.yml`) create issues for human review upon detection of failures.

### Partner Dashboard & RBAC

- **Access Control**: Role-Based Access Control (RBAC) implemented via `organization_members` table.
- **Roles**: `owner`, `admin`, `editor`, `viewer`.
- **Functions**: CRUD operations for listings, member invites (invite/accept flow), and analytics viewing.
- **Bilingual Content**: Self-service editing for both English and French fields.

### Data Flow

- **Services**: Fetched via `/api/v1/services`. Cached using SWR-like strategies in hooks.
- **Analytics**: Search events are logged to `/api/v1/analytics/search` asynchronously.

### Routing & Discovery

- **Public Routes**:
  - `/service/[id]`: Rich detail page.
  - `/submit-service`: Public crowdsourcing form.
  - `/dashboard`: Partner portal.
  - `/about`: Project mission and impact metrics.
  - `/about/partners`: Data source transparency and verification process.
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

### User Interface & Accessibility

- **High Contrast Mode**: Global state managed via `useHighContrast` hook, applying `.high-contrast` class and CSS variable overrides.
- **Print Optimization**: Specific `@media print` styles in `globals.css` and `PrintButton` component for physical delivery of information.
- **Data Freshness**: `FreshnessBadge` provides visual cues on the reliability of data based on `last_verified` timestamps.

## Development

- `npm run dev`: Start local server.
- `npm run test`: Run integration tests.
- `npx playwright test`: Run E2E tests.
- `docs/CONTRIBUTING.md`: Detailed development guidelines.
