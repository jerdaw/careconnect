# CLAUDE.md

This file provides guidance to the development agent when working with code in this repository.

## Overview

Kingston Care Connect is a verified, governance-first search engine for social services in Kingston, Ontario. The platform uses a **manual curation over automated extraction** approach, maintaining a hand-verified service directory with strict data quality standards.

> Note: Recompute the current service count any time via `npm run audit:data`.

## Key Commands

### Development

```bash
npm run dev              # Start dev server with Turbo (port 3000)
npm run build            # Production build (runs postbuild to generate embeddings)
npm run start            # Start production server
npm run type-check       # TypeScript type checking
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting without changes
npm run ci:check         # Run CI validation checks
npm run check:root       # Check project root for unexpected files
```

### Testing

```bash
npm test                 # Run all Vitest unit tests
npm run test:watch       # Vitest in watch mode
npm run test:coverage    # Generate coverage report (thresholds: lib/search 65%, lib/ai 85%, hooks 85%)
npm run test:e2e         # Playwright E2E tests (all browsers)
npm run test:e2e:local   # Playwright E2E tests (Chromium only; non-blocking in CI per ADR-015)
npx playwright test tests/e2e/search.spec.ts  # Run specific E2E test
npm run test:a11y        # Run accessibility audit (Axe-core + Interactive)
npm run test:load        # k6 load test: search API (10-50 VUs, realistic traffic)
npm run test:load:smoke  # k6 smoke test: basic connectivity (1 VU, 30s)
npm run test:load:sustained # k6 sustained load: stability test (20 VUs, 30min)
npm run test:load:spike  # k6 spike test: sudden traffic spike (0-100 VUs)
```

### Search Quality Testing

```bash
npm test -- tests/search/golden-set.test.ts  # Run 61 deterministic search quality tests
NODE_ENV=development npx tsx scripts/search-test-runner.ts  # Comprehensive 200-query analysis
```

**Search Testing Infrastructure (v17.7):**

- **Golden Set**: 50 hand-curated queries with expected services in top 10 results
- **Sampled Coverage**: 150 queries testing 95%+ result rate
- **Crisis Detection**: 9 safety-critical patterns (suicide, abuse, violence)
- **Test Fixtures**: `tests/fixtures/search-test-queries.json` (200 queries)
- **Quality Report**: `tests/fixtures/search-quality-report.md` (analysis + recommendations)
- **Pass Criteria**: At least one expected service appears in top 10 results

See [ADR-018](docs/adr/018-search-quality-testing-and-scoring-refinements.md) for scoring refinements and testing strategy.

### Data Validation & Health Checks

```bash
npm run validate-data    # Validate service schema with Zod
npm run db:validate      # Alias for validate-data (Zod schema validation)
npm run db:verify        # Verify database integrity (row count, embeddings, RLS)
npm run health-check     # Validate all service URLs
npm run phone-validate   # Validate phone numbers via Twilio
npm run check-staleness  # Check for stale/unverified data
npm run audit:data       # Comprehensive data completeness audit (missing fields, gaps by category)
npm run audit:qa         # Data quality and integrity audit
```

### Data Enrichment & Translation

```bash
# Data Enrichment Audits (export gaps for AI-assisted enrichment)
npm run audit:coords              # Export services with missing coordinates
npm run audit:hours               # Export services with missing operating hours
npm run audit:access-scripts      # Audit access_script quality and completeness
npm run audit:l3                  # Export L3 verification candidate suggestions

# French Translation Workflow (see docs/workflows/french-translation-workflow.md)
npm run export:access-script-fr   # Export access_script fields for French translation
npm run translate:prompt          # Generate AI translation prompts from batch file
npm run translate:parse           # Parse AI response into structured JSON batch
npm run translate:validate        # Validate translation batch structure and quality

# Data Backfill & Geocoding
npm run backfill:hours-text       # Backfill hours_text field from structured hours data
npm run geocode                   # Geocode service addresses using OpenCage API (requires OPENCAGE_API_KEY)
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
npm run tools:search                # CLI search tool for testing
npm run bilingual-check             # Check bilingual content coverage (alias: audit:bilingual)
npm run i18n-audit                  # Audit i18n translation keys
node --import tsx scripts/migrate-data.ts  # Migrate local JSON to Supabase
```

### Admin Setup

To grant admin privileges locally (requires running Supabase):

```sql
-- Run in Supabase SQL Editor
INSERT INTO app_admins (user_id) VALUES ('your-user-uuid');
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

#### Authorization Resilience (v17.6+)

**Overview**: Multi-layered protection for authorization checks to maintain security and stability during database outages.

**Core Components**:

- Integrated with `lib/resilience/supabase-breaker.ts` for database-aware failure handling.
- Tiered risk levels (`high`, `medium`, `low`) for all authorization assertions.

**Strategy**:

- **High Risk**: Fails closed (secure-by-default). Mutative actions like updating or deleting services are blocked if permissions cannot be verified.
- **Low Risk**: Fails open with safe defaults. Read-only checks like `getEffectivePermissions` return empty results rather than crashing, maintaining UI availability without leaking data.

**Usage Pattern**:

```typescript
import { assertServiceOwnership } from "@/lib/auth/authorization"

// Defaults to 'high' risk, fails closed if circuit is open
await assertServiceOwnership(supabase, userId, serviceId)

// Explicitly low risk, fails open with safe default
const perms = await getEffectivePermissions(supabase, userId, orgId, "low")
```

**Protected Functions**:

- `assertServiceOwnership`, `assertOrganizationMembership`, `assertPermission`, `assertAdminRole`
- `getEffectivePermissions`, `getUserOrganizationRole`

**Best Practices**:

- ✅ Use 'high' risk for any mutative server actions.
- ✅ Use 'low' risk only for non-sensitive UI-hinting operations.
- ✅ Always provide the necessary context (user ID, organization ID) to logging.

#### Offline Infrastructure (v15.0)

The platform is **Offline-Ready** via a multi-layer caching strategy:

1. **IndexedDB** (`lib/offline/db.ts`): Stores full service directory and embeddings.
2. **Synchronization** (`lib/offline/sync.ts`): Orchestrates background sync from `/api/v1/services/export`.
3. **Hybrid Search** (`lib/search/data.ts`): Automatically falls back to IndexedDB if network fails or `isOffline` is true.
4. **Offline Feedback**: Queueing logic ensures feedback is stored locally and synced when online.

### Performance Tracking & Resilience (v17.5+)

The platform includes **operational observability and resilience patterns** to monitor performance and handle database failures gracefully.

#### Performance Tracking System

**Overview**: Lightweight, opt-in instrumentation for tracking operation latencies.

**Core Components**:

- `lib/performance/tracker.ts` - Wrapper around logger for tracking operations
- `lib/performance/metrics.ts` - In-memory aggregation (p50, p95, p99 percentiles)
- Enabled via `NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING=true` (dev/staging only)

**Usage Pattern**:

```typescript
import { trackPerformance } from "@/lib/performance/tracker"

// Async operations
const result = await trackPerformance(
  "operation.name",
  async () => {
    return await someOperation()
  },
  { metadata: "optional" }
)

// Manual timing
import { createPerformanceTimer } from "@/lib/performance/tracker"
const stopTimer = createPerformanceTimer("operation.name")
// ... do work ...
stopTimer()
```

**Instrumented Operations**:

- Search: `search.total`, `search.dataLoad`, `search.keywordScoring`, `search.vectorScoring`
- API: `api.search.total`, `api.search.dbQuery`, `api.search.scoring`
- Data Loading: `dataLoad.indexedDB`, `dataLoad.supabase`, `dataLoad.jsonFallback`

**Metrics Endpoints**:

- `GET /api/v1/health` - Public health check with optional detailed metrics
  - Basic status: Always public (for load balancers)
  - Detailed metrics: Requires authentication or development mode
  - Rate limit: 10 req/min per IP
- `GET /api/v1/metrics` - Dedicated metrics endpoint (development/staging only)
  - Query params: `?operation=search.total&raw=true&limit=100`
  - Returns: Aggregated metrics (p50, p95, p99) and optional raw data points
  - Requires: Authentication, only available in non-production
  - Rate limit: 30 req/min per IP
- `DELETE /api/v1/metrics` - Reset metrics (development only)
  - Requires: Authentication

**Best Practices**:

- ✅ Enable in development and staging for visibility
- ✅ Disable in production (uses in-memory storage, not scalable)
- ✅ Use structured metadata for context (query length, service count, etc.)
- ✅ Keep operation names hierarchical with dot-notation (`module.operation`)
- ❌ Don't track trivial operations (<5ms typical duration)
- ❌ Don't include sensitive data in metadata

#### Circuit Breaker Pattern

**Overview**: Resilience pattern that prevents cascading failures by fast-failing when database is unavailable.

**Core Components**:

- `lib/resilience/circuit-breaker.ts` - Generic circuit breaker implementation
- `lib/resilience/supabase-breaker.ts` - Supabase-specific wrapper with fallback support
- `lib/resilience/telemetry.ts` - Event logging for state transitions

**States**:

1. **CLOSED** (normal): Requests pass through to database
2. **OPEN** (failing): Requests fast-fail (<1ms) without hitting database
3. **HALF_OPEN** (testing): Allow limited requests to test recovery

**Configuration** (environment variables):

```bash
CIRCUIT_BREAKER_ENABLED=true                    # Enable/disable circuit breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=3             # Failures before opening
CIRCUIT_BREAKER_TIMEOUT=30000                   # ms before retry (OPEN → HALF_OPEN)
```

**Usage Pattern**:

```typescript
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"

// With fallback (recommended for read operations)
const result = await withCircuitBreaker(
  async () => await supabase.from("services").select("*"),
  async () => loadFromJSONFallback() // Optional fallback when circuit is open
)

// Without fallback (write operations)
const { data, error } = await withCircuitBreaker(async () => await supabase.from("services").insert(newService))
// Handle CircuitOpenError in catch block if needed
```

**Protected Operations**:

- ✅ Search data loading (`lib/search/data.ts`)
- ✅ Service management (`lib/services.ts`: claimService, getServiceById, updateService)
- ✅ Analytics tracking (`lib/analytics.ts`: trackEvent, getAnalyticsForServices)
- ✅ API routes (`app/api/v1/services/**`)
- ✅ Offline sync (`lib/offline/sync.ts` checks circuit state)

**Best Practices**:

- ✅ Always wrap Supabase calls with `withCircuitBreaker()`
- ✅ Provide fallback functions for read operations when possible
- ✅ Handle `CircuitOpenError` gracefully (don't retry, it's intentional)
- ✅ Use circuit breaker for **all** database operations, not just critical paths
- ✅ Log circuit breaker events for operational visibility
- ❌ Don't retry when circuit is open (defeats the purpose)
- ❌ Don't use circuit breaker for client-side operations (browser already has timeout handling)
- ❌ Don't share circuit breaker instances across different services/databases

**Monitoring**:

- Health check endpoint: `GET /api/v1/health` shows circuit breaker state and stats
- Log events: Circuit state transitions are logged with structured data
- Stats available: failure count, success count, failure rate, next attempt time

**Example: Complete API Route Protection**:

```typescript
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { trackPerformance } from "@/lib/performance/tracker"

export async function GET(request: NextRequest) {
  return trackPerformance(
    "api.myEndpoint.total",
    async () => {
      // ... rate limiting, auth, etc. ...

      const { data, error } = await trackPerformance("api.myEndpoint.dbQuery", async () =>
        withCircuitBreaker(async () => supabase.from("my_table").select("*"))
      )

      if (error) {
        logger.error("Database query failed", { error })
        return createApiError("Query failed", 500)
      }

      return createApiResponse(data)
    },
    { endpoint: "/api/myEndpoint" }
  )
}
```

**Recovery Behavior**:

- Circuit opens after 3 consecutive failures OR 50% error rate in 60s window
- Circuit remains open for 30s (configurable)
- Circuit transitions to HALF_OPEN after timeout, allows 1 test request
- If test succeeds → Circuit closes (normal operation resumes)
- If test fails → Circuit reopens for another 30s

**Fallback Strategy** (Read Operations):

- Search: Falls back to local JSON files (`data/services.json`)
- IndexedDB: Client-side operations use offline cache
- Analytics: Gracefully degrades (non-critical)
- Write Operations: No fallback (fail-fast, user sees error)

**When Circuit Opens**:

1. User requests are fast-failed (<1ms instead of 30s timeout)
2. Fallback data sources are used when available (JSON, IndexedDB)
3. Circuit breaker logs OPEN state transition
4. Health check endpoint reports `unhealthy` status
5. After timeout, circuit tests recovery automatically

**ADR Reference**: See `docs/adr/016-performance-tracking-and-circuit-breaker.md` for full architectural decisions and trade-offs.

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

- Development: `data/services.json` (run `npm run audit:data` for current count)
- Production: Supabase `services` table OR fallback to JSON

**Data Loading Strategy** (`lib/search/data.ts::loadServices()`):

1. Try Supabase if credentials present
2. Overlay AI metadata from `services.json` (synthetic_queries)
3. Fallback to local JSON if DB unavailable
4. In-memory cache on server

**Data Enrichment:**

For filling missing fields (scope, coordinates, hours, access scripts):

- **Comprehensive Guide**: See `docs/governance/data-enrichment-sop.md` for the full SOP
- **Quick Audit**: Run `npm run audit:data` to identify all data gaps
- **Export Gaps**: Use audit scripts to export specific gaps for AI-assisted enrichment:
  - `npm run audit:coords` - Missing coordinates
  - `npm run audit:hours` - Missing operating hours
  - `npm run audit:access-scripts` - Access script quality
  - `npm run audit:l3` - L3 verification candidates
- **French Translation**: See `docs/workflows/french-translation-workflow.md` for the batch translation process using `translate:prompt`, `translate:parse`, and `translate:validate` commands
- **Geocoding**: Use `npm run geocode` with OpenCage API to add coordinates (requires `OPENCAGE_API_KEY` in `.env.local`)

**Database Optimization:**

The database schema has been optimized for performance (see `docs/adr/014-database-index-optimization.md`):

- **Audit Fields**: Foreign keys like `deleted_by`, `reviewed_by`, `performed_by` are intentionally unindexed (write-only provenance tracking).
- **Index Strategy**: 18 unused indexes removed, 1 critical index added for dashboard queries.
- **Supabase Warnings**: Remaining INFO-level warnings for unindexed audit fields and "unused" indexes are expected and safe to ignore.

## Secrets & Environment Files

- Do not commit `.env.local` or any secrets. Use `.env.example` as the template and keep local values untracked.
- If secrets are accidentally committed, rotate/revoke them immediately and remove them from git history.

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

**Translation Workflow:**

For translating service data (especially `access_script` and other content fields):

- **Process**: See `docs/workflows/french-translation-workflow.md` for the complete batch translation workflow
- **Tools**: Use `translate:prompt`, `translate:parse`, and `translate:validate` npm scripts
- **Quality Checks**: Run `npm run bilingual-check` to audit EN/FR coverage

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
3. **Database RLS**: Strict Row-level security enforces org_id boundaries using "Unified Policy Per Action" strategy (ADR-013) to prevent policy overlap and performance issues.

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
- Run: `npm run test:e2e:local` (Chromium only)
- Critical paths: Search, Partner Login, Service Editing
- **CI Status**: Non-blocking (ADR-015) - runs for visibility but doesn't fail builds due to environmental timeout issues

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
