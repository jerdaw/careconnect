# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Kingston Care Connect is a verified, governance-first search engine for social services in Kingston, Ontario. The platform uses a **manual curation over automated extraction** approach, maintaining 169 hand-verified services with strict data quality standards.

## Key Commands

### Development

```bash
npm run dev              # Start dev server with Turbo (port 3000)
npm run build            # Production build (runs postbuild to generate embeddings)
npm run type-check       # TypeScript type checking
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
```

### Testing

```bash
npm test                 # Run all Vitest unit tests
npm run test:watch       # Vitest in watch mode
npm run test:coverage    # Generate coverage report (thresholds: lib/search 65%, lib/ai 85%, hooks 85%)
npm run test:e2e:local   # Playwright E2E tests (Chromium only, prefer CI)
npx playwright test tests/e2e/search.spec.ts  # Run specific E2E test
npm run test:a11y        # Run accessibility audit (Axe-core + Interactive)
```

### Data Validation & Health Checks

```bash
npm run validate-data    # Validate service schema with Zod
npm run health-check     # Validate all service URLs
npm run phone-validate   # Validate phone numbers via Twilio
npm run check-staleness  # Check for stale/unverified data
```

### Mobile Development

```bash
npm run mobile:sync      # Sync Capacitor config with build
npm run mobile:build     # Build web assets and sync to Capacitor
npm run mobile:open:android # Open Android project in Android Studio
npx cap sync ios         # Sync iOS (requires macOS)
```

### Utility Scripts

```bash
npx tsx scripts/search-cli.ts        # CLI search tool for testing
npx tsx scripts/bilingual-audit.ts   # Check bilingual content coverage
npx tsx scripts/i18n-key-audit.ts    # Audit i18n translation keys
npx tsx scripts/migrate-data.ts      # Migrate local JSON to Supabase
```

## Architecture

### Search Modes

The platform supports two search modes controlled by `NEXT_PUBLIC_SEARCH_MODE` env var:

1. **Local Mode** (default): Client-side hybrid search
   - Fast keyword search in `lib/search/index.ts`
   - Optional semantic search via WebLLM + WebGPU (browser-based)
   - Zero-knowledge architecture (queries never leave device)
   - Data loaded from `data/services.json` + `data/embeddings.json`

2. **Server Mode**: Privacy-focused API search
   - POST endpoint at `/api/v1/search/services/route.ts`
   - **Hybrid Scoring**: Fetches candidates from DB, then scores in-memory (Authority, Completeness, Proximity)
   - **Security**:
     - Zero-logging (no-store cache headers)
     - Rate-limited (60 req/min per IP)
     - **ILIKE Escaping**: Wildcards (`%`, `_`) are escaped to prevent query manipulation.
     - **CSP**: Content Security Policy active in `next.config.ts`.

### Search Flow (Local Mode)

```text
User Query
    ↓
lib/search/index.ts::searchServices()
    ↓
1. Tokenize + Synonym Expansion (lib/search/synonyms.ts)
2. Optional AI Expansion (lib/ai/query-expander.ts)
3. Category/OpenNow Filters
4. Keyword Scoring (lib/search/scoring.ts)
5. Vector Search if client provides embedding (lib/search/vector.ts)
6. Crisis Detection + Boosting (lib/search/crisis.ts)
7. Geo-Distance Sorting (lib/search/geo.ts)
```

**Key Files:**

- `lib/search/index.ts` - Main search orchestrator
- `lib/search/scoring.ts` - Keyword scoring with weights (WEIGHTS const)
- `lib/search/vector.ts` - Cosine similarity for semantic search
- `lib/search/data.ts` - Data loader (Supabase fallback to JSON)
- `lib/search/search-mode.ts` - Mode detection + server search client

### Offline Infrastructure (v15.0)

The platform is **Offline-Ready** via a multi-layer caching strategy:

1. **IndexedDB** (`lib/offline/db.ts`): Stores full service directory and embeddings.
2. **Synchronization** (`lib/offline/sync.ts`): Orchestrates background sync from `/api/v1/services/export`.
3. **Hybrid Search** (`lib/search/data.ts`): Automatically falls back to IndexedDB if network fails or `isOffline` is true.
4. **Offline Feedback**: Queueing logic ensures feedback is stored locally and synced when online.

### AI System (WebLLM)

The platform uses **on-device AI** via WebLLM for privacy-preserving smart search:

- **Engine**: `lib/ai/engine.ts` (singleton pattern, manages WebLLM lifecycle)
- **Model**: Llama-3.2-1B-Instruct-q4f16_1-MLC (1B params, quantized)
- **Worker**: `lib/ai/webllm.worker.ts` (runs in Web Worker for UI responsiveness)
- **Query Refinement**: `aiEngine.refineSearchQuery()` rewrites queries to JSON with extra search terms
- **Chat**: `components/ai/ChatAssistant.tsx` - Chatbot with streaming, idle unloading (5min timeout)
- **Hook**: `hooks/useAI.ts` - React hook for AI state management

**Important AI Constraints:**

- Requires WebGPU support (check `navigator.gpu`)
- Model downloads ~500MB on first use (cached in browser)
- VRAM-intensive: auto-unloads after 5min idle
- Streaming APIs use KV cache for multi-turn chats
- Crisis queries bypass AI and surface emergency services directly

### Data Layer

**Source of Truth:**

- Development: `data/services.json` (169 services)
- Production: Supabase `services` table OR fallback to JSON

**Data Loading Strategy** (`lib/search/data.ts::loadServices()`):

1. Try Supabase if credentials present
2. Overlay AI metadata from `services.json` (synthetic_queries)
3. Fallback to local JSON if DB unavailable
4. In-memory cache on server

**Data Enrichment:**

For filling missing fields (scope, coordinates, hours, access scripts), see `docs/governance/data-enrichment-sop.md`. Use `/data-enrichment` workflow for step-by-step process.

**Key Types:**

- `types/service.ts::Service` - Full internal schema (with AI metadata)
- `types/service-public.ts::ServicePublic` - Public API view (no synthetic_queries)
- `lib/schemas/service.ts` - Zod validation schemas

**Embeddings:**

- Generated via `scripts/generate-embeddings.ts` (postbuild hook)
- Stored in `data/embeddings.json`
- 384-dimensional vectors via @xenova/transformers (all-MiniLM-L6-v2)
- Also stored in Supabase `services.embedding` column (pgvector)

### Multi-Language Support

The app uses **next-intl** for i18n with 7 locales: `en, fr, zh-Hans, ar, pt, es, pa`

**Routing:**

- All pages under `app/[locale]/` (dynamic locale segment)
- Middleware in `middleware.ts` handles locale detection + auth
- Routing config: `i18n/routing.ts`

**Translation Files:**

- `messages/{locale}.json` (e.g., `messages/en.json`)
- Service data has `_fr` suffixed fields (e.g., `name_fr`, `description_fr`)

**Search Behavior:**

- Local services (Kingston): EN/FR translations only
- Provincial services: All 7 languages for name/description

### Authentication & Authorization

- **Auth Provider**: Supabase Auth (optional, works without DB)
- **Middleware**: `middleware.ts` refreshes session, guards `/dashboard` and `/admin` routes
- **Protected Routes**: Redirect to `/[locale]/login?next={intended_path}` if unauthenticated
- **Client**: `lib/supabase.ts` (universal client, session persistence browser-only)

**RBAC System (v17.4):**

The platform implements a comprehensive Role-Based Access Control system with 4 tiers and 19 granular permissions:

**Role Hierarchy:**

- **Owner**: Full control (transfer ownership, delete org, manage all services/members)
- **Admin**: Organization management (manage services/members, no ownership powers)
- **Editor**: Content creation (create/edit own services only)
- **Viewer**: Read-only access (view services, analytics, feedback)

**Permission Categories:**

1. **Organization**: `canTransferOwnership`, `canDeleteOrganization`
2. **Services**: `canCreateServices`, `canEditOwnServices`, `canEditAllServices`, `canDeleteServices`, `canPublishServices`
3. **Members**: `canInviteMembers`, `canChangeRoles`, `canRemoveMembers`
4. **Read Access**: `canViewServices`, `canViewMembers`, `canViewAnalytics`, `canViewFeedback`
5. **Engagement**: `canRespondToFeedback`, `canSendNotifications`

**Key Files:**

- `lib/rbac.ts` - Core permission matrix and role utilities
- `lib/auth/authorization.ts` - Centralized authorization helpers
- `lib/actions/members.ts` - Member management with RBAC enforcement
- `hooks/useRBAC.ts` - React hook for permission checks in UI
- `components/dashboard/MemberManagement.tsx` - Member/role UI

**Authorization Pattern:**

All server actions use centralized authorization following ADR-007:

```typescript
import { assertPermission } from "@/lib/auth/authorization"

export async function myProtectedAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const membership = await getUserOrganizationMembership(user.id)

  // Throws AuthorizationError if permission denied
  await assertPermission(supabase, user.id, membership.organization_id, "canEditAllServices")

  // Perform authorized action...
}
```

**Defense in Depth:**

1. **UI Layer**: `useRBAC()` hook hides/disables unauthorized actions
2. **Server Actions**: `assertPermission()` validates before mutations
3. **Database RLS**: Row-level security enforces org_id boundaries

**Special Cases:**

- **Ownership Transfer**: Uses atomic Postgres function to prevent dual-owner state
- **Edit Own Services**: Editors can only modify services they created (checked via `created_by` field)
- **Self-Removal**: Users cannot remove themselves (use separate "Leave Organization" feature)

See `docs/implementation/v17-4-phase4-audit-fixes.md` for comprehensive RBAC implementation details.

### Partner Portal (Dashboard)

Located at `app/[locale]/dashboard/`:

- `page.tsx` - Dashboard home
- `services/` - Service CRUD (create, edit, delete own listings)
- `analytics/` - View search analytics (partner-specific)
- `feedback/` - View user feedback on services
- `notifications/` - Push notification management

**Server Actions:**

- `lib/actions/services.ts` - Service mutations (create, update, delete)

### Progressive Web App (PWA)

- **Config**: `next.config.ts` (via `@ducanh2912/next-pwa`)
- **Service Worker**: Auto-generated + custom logic in `public/custom-sw.js`
- **Offline Fallback**: `/offline/page.tsx`
- **Cache Strategy**:
  - Services API: StaleWhileRevalidate (24h)
  - JSON files: CacheFirst (7d)

### Testing Strategy

**Unit/Integration** (Vitest):

- `tests/unit/**/*` and `tests/api/**/*`
- Run: `npm test`
- Coverage thresholds enforced per path (see `vitest.config.mts`)

**E2E** (Playwright):

- `tests/e2e/**/*`
- Run: `npm run test:e2e:local` (Chromium only, prefer CI)
- Critical paths: Search, Partner Login, Service Editing

**Coverage Requirements:**

- `lib/search/**`: 65% statements/branches
- `lib/ai/**`: 85% statements
- `lib/eligibility/**`: 95% statements
- `hooks/**`: 85% statements

## Important Patterns & Conventions

### Path Aliases

- `@/*` maps to project root (configured in `tsconfig.json`)
- Example: `import { Service } from "@/types/service"`

### Environment Variables

- Defined in `.env.local` (copy from `.env.example`)
- Schema validation via `@t3-oss/env-nextjs` in `lib/env.ts`
- Search mode: `NEXT_PUBLIC_SEARCH_MODE=local|server`
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`

### Data Verification Levels

Services have governance tiers (see `types/service.ts::VerificationLevel`):

- **L0**: Unverified (filtered out of search)
- **L1**: Basic verification (existence confirmed)
- **L2**: Vetted (contact made)
- **L3**: Provider confirmed (official partnership)

Search scoring applies multipliers: L3 = 1.5x, L2 = 1.2x, L1 = 1.0x

### Crisis Detection

- `lib/search/crisis.ts::detectCrisis()` - Pattern matching for urgent queries
- Crisis services automatically boosted to top of results
- Emergency modal shown in UI when crisis detected (`components/ui/EmergencyModal.tsx`)

### Accessibility

- WCAG 2.1 AA compliant
- High-contrast mode: `hooks/useHighContrast.ts`
- Skip links, keyboard navigation, ARIA labels throughout
- Voice input: `hooks/useVoiceInput.ts`

## Critical Files to Understand

1. **Search Engine**: `lib/search/index.ts`, `lib/search/scoring.ts`
2. **AI System**: `lib/ai/engine.ts`, `components/ai/ChatAssistant.tsx`
3. **Data Loading**: `lib/search/data.ts`
4. **API Routes**: `app/api/v1/search/services/route.ts` - All mutations MUST use `lib/auth/authorization.ts` and Zod schemas.
5. **Authorization**: `lib/auth/authorization.ts` - Centralized ownership/role checks.
6. **Main Search UI**: `components/search/SearchInterface.tsx` (likely)
7. **Service Schema**: `types/service.ts`
8. **Middleware**: `middleware.ts`

## Development Notes

- **Node Version**: 20+ required
- **Bundle Analyzer**: `npm run analyze` to check production bundle
- **Turbo Mode**: Dev server uses `--turbo` flag for fast refresh
- **Commit Hooks**: Husky runs lint + related tests on pre-commit
- **Commit Convention**: Conventional commits enforced (see `commitlint.config.js`)
- **Security Audit**: CI runs `npm audit --audit-level=high` on every push.
- **XSS Prevention**: `highlightMatches` escapes HTML entities before applying `<mark>` tags.
- **Supabase Auth**: Strong password policies (8+ chars, Alphanumeric) are enforced in `config.toml`.

## Deployment

- Platform: Vercel (inferred from Next.js config)
- Build command: `npm run build`
- Postbuild: Automatically generates embeddings
- Edge cases: WebLLM requires COOP/COEP headers for SharedArrayBuffer (see deployment docs)

## Common Pitfalls

1. **WebLLM Breaking**: Ensure WebGPU is available. Model fails gracefully if unavailable.
2. **Embeddings Out of Sync**: Run `npm run build` after editing `data/services.json` to regenerate embeddings.
3. **Search Returns Nothing**: Check verification_level (L0 services are filtered out).
4. **Supabase Errors**: App works without Supabase. Check fallback to local JSON is working.
5. **i18n Missing Keys**: Run `npm run i18n-audit` to find untranslated strings.
6. **Stale Data**: Run `npm run check-staleness` to find services needing re-verification.

## Code Style

- **TypeScript**: Strict mode enabled (`noUncheckedIndexedAccess: true`). Avoid `any` - especially in tests!
- **Linting**: ESLint with Next.js + Prettier configs (zero-warning policy enforced)
- **Formatting**: Prettier with Tailwind plugin
- **Import Style**: Prefer named imports, use `@/` alias
- **Logging**: Use `lib/logger.ts` instead of `console.log`. Structure logs with metadata: `logger.info("Action", { context })`
- **Components**: Functional components with TypeScript, hooks over classes
- **Styling**: Tailwind CSS v4, use `cn()` helper from `lib/utils.ts` for conditional classes
