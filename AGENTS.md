# AGENTS.md – Kingston Care Connect

## Agent Role

You are a **governance-aware developer** working on a privacy-first social services search engine. Your priorities:

1. **Data integrity over speed** – Service data is manually curated and verified. Never auto-generate or fabricate service information.
2. **Privacy by design** – Search queries stay on-device by default. No tracking, no logging of user searches.
3. **Accessibility first** – WCAG 2.1 AA compliance. Every feature must work with keyboard navigation and screen readers.
4. **Verify before modifying** – Read existing code and understand patterns before making changes.

---

## Project Overview

**Mission**: "The Semantic Bridge" for Kingston Social Services – a verified, governance-first search engine for food, crisis, and housing support in Kingston, ON.

**Philosophy**: Manual Curation over Automatic Extraction. ~196 High-Impact Services. Verified, Accessible, Identity-Aware.

**Tech Stack**:
| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript (strict mode) | 5.x |
| Runtime | Node.js | 22+ |
| Styling | Tailwind CSS + Radix UI | v4 |
| Database | Supabase (PostgreSQL + pgvector) | — |
| Embeddings | @xenova/transformers (all-MiniLM-L6-v2) | — |
| On-device AI | WebLLM (Llama-3.2-1B) | — |

**Key Documentation**:

- `README.md` → Getting started
- `docs/architecture.md` → System design and data flow
- `docs/llms.txt` → Consolidated context for AI agents
- `docs/api/openapi.yaml` → OpenAPI 3.0 specification
- `/home/jer/repos/platform-ops` → Shared VPS inventory, roadmap, handoff, and cross-project runbooks

When in doubt, **read `README.md` and `docs/**` first\*\*.

**Cross-project ops note:** Kingston Care Connect/HelpBridge app behavior belongs in this repo. Shared VPS standards, live service inventory, and cross-project migration/operations state belong in `/home/jer/repos/platform-ops` (historical local alias: `/home/jer/repos/projects-merge`). Host-side paths under `/etc/projects-merge/...` remain intentionally unchanged.

---

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
npm run analyze          # Bundle analysis
```

### Testing

```bash
npm test                 # Run all Vitest unit tests
npm run test:watch       # Vitest in watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Playwright E2E tests (all browsers)
npm run test:e2e:local   # Playwright E2E tests (Chromium only; non-blocking in CI per ADR-015)
npx playwright test tests/e2e/search.spec.ts  # Run specific E2E test
npm run test:a11y        # Run accessibility audit (Axe-core + Interactive)
npm run test:load        # k6 load test: search API (10-50 VUs, realistic traffic)
npm run test:load:smoke  # k6 smoke test: basic connectivity (1 VU, 30s)
npm run test:load:sustained # k6 sustained load: stability test (20 VUs, 30min)
npm run test:load:spike  # k6 spike test: sudden traffic spike (0-100 VUs)
```

### Data Validation & Health Checks

```bash
npm run validate-data    # Validate service schema with Zod
npm run db:validate      # Alias for validate-data
npm run db:verify        # Verify database integrity (row count, embeddings, RLS)
npm run health-check     # Validate all service URLs
npm run phone-validate   # Validate phone numbers via Twilio
npm run check-staleness  # Check for stale/unverified data
npm run audit:data       # Comprehensive data completeness audit
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
npm run geocode                   # Geocode service addresses (requires OPENCAGE_API_KEY)
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
npm run bilingual-check             # Check bilingual content coverage
npm run i18n-audit                  # Audit i18n translation keys
node --import tsx scripts/migrate-data.ts  # Migrate local JSON to Supabase
```

---

## Environment Variables

Defined in `.env.local` (copy from `.env.example`). Schema validation via `@t3-oss/env-nextjs` in `lib/env.ts`.

**Core:**

- `NEXT_PUBLIC_SEARCH_MODE`: `local` (default) or `server`
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Public key for client-side auth/reads
- `SUPABASE_SECRET_KEY`: Service role key (backend tools only)

**Optional:**

- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`: Phone validation scripts
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`: Push notifications
- `OPENCAGE_API_KEY`: Geocoding
- `OPENAI_API_KEY`: Optional AI features

**Do not commit `.env.local` or any secrets.** If accidentally committed, rotate immediately.

---

## Architecture

### Search Modes

The platform supports two search modes controlled by `NEXT_PUBLIC_SEARCH_MODE`:

**1. Local Mode** (default): Client-side hybrid search

- Fast keyword search in `lib/search/index.ts`
- Optional semantic search via WebLLM + WebGPU (browser-based)
- Zero-knowledge architecture (queries never leave device)
- Data loaded from `data/services.json` + `data/embeddings.json`

**2. Server Mode**: Privacy-focused API search

- POST endpoint at `/api/v1/search/services/route.ts`
- Hybrid Scoring: Fetches candidates from DB, scores in-memory (Authority, Completeness, Proximity)
- Security: Zero-logging, rate-limited (60 req/min), ILIKE escaping, CSP headers

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

### AI System (WebLLM)

On-device AI via WebLLM for privacy-preserving smart search:

- **Engine**: `lib/ai/engine.ts` (singleton pattern)
- **Model**: Llama-3.2-1B-Instruct-q4f16_1-MLC (~500MB, cached in browser)
- **Worker**: `lib/ai/webllm.worker.ts` (Web Worker for UI responsiveness)
- **Chat**: `components/ai/ChatAssistant.tsx` (streaming, 5min idle unload)
- **Hook**: `hooks/useAI.ts`

**Constraints:**

- Requires WebGPU support (`navigator.gpu`)
- VRAM-intensive: auto-unloads after 5min idle
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

**Key Types:**

- `types/service.ts::Service` – Full internal schema (with AI metadata)
- `types/service-public.ts::ServicePublic` – Public API view
- `lib/schemas/service.ts` – Zod validation schemas

**Modifying Service Data** (requires care):

```bash
# 1. Edit data/services.json (manual curation only)
# 2. Validate the schema
npm run validate-data
# 3. Rebuild to regenerate embeddings
npm run build
# 4. Verify search still works
npm run tools:search "food bank"
```

**Embeddings:**

- Generated via `scripts/generate-embeddings.ts` (postbuild hook)
- 384-dimensional vectors via @xenova/transformers (all-MiniLM-L6-v2)
- Also stored in Supabase `services.embedding` column (pgvector)

### Offline Infrastructure (v15.0)

The platform is **Offline-Ready** via:

1. **IndexedDB** (`lib/offline/db.ts`): Full service directory and embeddings
2. **Synchronization** (`lib/offline/sync.ts`): Background sync from `/api/v1/services/export`
3. **Hybrid Search** (`lib/search/data.ts`): Auto-fallback to IndexedDB if offline
4. **Offline Feedback**: Queue locally, sync when online

### Resilience Patterns

**Circuit Breaker** (`lib/resilience/supabase-breaker.ts`):

- Prevents cascading failures by fast-failing when DB unavailable
- States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing)
- Config via `CIRCUIT_BREAKER_*` env vars

```typescript
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"

// With fallback for read operations
const services = await withCircuitBreaker(
  async () => supabase.from("services").select("*"),
  async () => loadFromJSON() // Fallback when circuit open
)

// Without fallback for writes (fail-fast)
await withCircuitBreaker(async () => supabase.from("services").insert(newService))
```

**Performance Tracking** (`lib/performance/tracker.ts`):

- Opt-in instrumentation for operation latencies
- Enabled via `NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING=true`

**Authorization Resilience** (v17.6+):

- Tiered risk levels (`high`, `medium`, `low`) for auth checks
- High risk: Fails closed (secure-by-default)
- Low risk: Fails open with safe defaults for read-only operations

**Production Observability & Alerting** (v18.0+):

Proactive monitoring and alerting system for production incidents.

**Core Components:**

- `lib/integrations/slack.ts` - Slack webhook integration for alerts
- `lib/observability/alert-throttle.ts` - Alert rate limiting (10min throttle window)
- `lib/observability/axiom.ts` - Persistent metrics storage (Axiom integration)
- `lib/resilience/telemetry.ts` - Circuit breaker event telemetry with Slack alerts

**Alert Types:**

1. **Circuit Breaker OPEN** (Critical 🚨) - Database protection activated, max 1 per 10min
2. **Circuit Breaker CLOSED** (Info ✅) - System recovered, max 1 per hour
3. **High Error Rate** (Warning ⚠️) - Error rate >10%, max 1 per 5min
4. **SLO Uptime Violation** (Critical 🚨) - Uptime below 99.5% target, max 1 per 30min
5. **SLO Error Budget Exhausted** (Critical 🚨) - Error budget consumed, max 1 per hour
6. **SLO Latency Violation** (Critical 🚨) - p95 latency >800ms, max 1 per 15min

**SLO Monitoring (v18.0 Phase 3):**

Service Level Objectives (SLOs) track service reliability targets:

- **Configuration:** `lib/config/slo-targets.ts` (PROVISIONAL targets)
- **Tracker:** `lib/observability/slo-tracker.ts` (in-memory 30-day window)
- **Dashboard:** `/admin/observability` (SLO Compliance Card)
- **Alerts:** Integrated with Slack alerting via `lib/integrations/slack.ts`

**SLO Targets (PROVISIONAL - Review Required):**

```typescript
{
  uptime: 0.995,           // 99.5% (3h 36m downtime/month)
  latencyP95Ms: 800,       // p95 < 800ms
  errorBudget: 0.005,      // 0.5%
  windowDays: 30           // 30-day rolling window
}
```

**Key Metrics:**

- **Uptime:** Percentage of successful health checks (99.5% target)
- **Error Budget:** Remaining downtime allowance (0.5% target)
- **Latency:** p95 response time (<800ms target)

**Compliance Checks:**

- Uptime tracked via `/api/v1/health` endpoint (records success/failure)
- Error budget calculated from uptime vs. target
- Latency measured via performance metrics
- Violations trigger Slack alerts (throttled)

**Important Notes:**

- Targets are **PROVISIONAL** - adjust based on production data
- In-memory tracking resets on server restart (rebuilds quickly)
- 30-day sliding window (not calendar month)
- Alert throttling prevents spam during incidents

**Related Files:**

- `lib/config/slo-targets.ts` - Target configuration (update to confirm)
- `lib/observability/slo-tracker.ts` - Tracking logic
- `components/observability/SLOComplianceCard.tsx` - Dashboard widget
- `docs/runbooks/slo-violation.md` - Incident response procedures
- `docs/planning/v18-0-phase-3-slo-decision-guide.md` - Decision guide

**Required Environment Variables:**

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../XXX
AXIOM_TOKEN=xait-your-api-token
AXIOM_ORG_ID=your-organization-id
AXIOM_DATASET=kingston-care-production
```

**Operational Runbooks:**

- `docs/runbooks/circuit-breaker-open.md` - Critical database failures
- `docs/runbooks/high-error-rate.md` - Elevated error rates
- `docs/runbooks/slow-queries.md` - Performance degradation
- `docs/runbooks/slo-violation.md` - SLO target violations (uptime, latency, error budget)
- `docs/runbooks/README.md` - Runbook index

**Observability Dashboard:**

- Location: `/admin/observability` (admin-only)
- Features: SLO compliance, real-time metrics, circuit breaker state, p50/p95/p99 latencies
- Data Source: Axiom (persistent) + in-memory (dev mode)
- SLO Widgets: Uptime percentage, error budget remaining, latency p95 compliance

**Metrics Endpoints:**

- `GET /api/v1/health` - Health check with circuit breaker status
- `GET /api/v1/metrics` - Performance metrics (dev/staging only, requires auth)

See `docs/observability/alerting-setup.md` for setup guide.

### Authentication & Authorization

**Auth Provider**: Supabase Auth (optional, works without DB)

**RBAC System (v17.4)** – 4 tiers, 19 granular permissions:

- **Owner**: Full control (transfer ownership, delete org)
- **Admin**: Organization management (manage services/members)
- **Editor**: Content creation (create/edit own services)
- **Viewer**: Read-only access

**Key Files:**

- `lib/rbac.ts` – Core permission matrix
- `lib/auth/authorization.ts` – Centralized authorization helpers
- `hooks/useRBAC.ts` – React hook for UI permission checks

**Authorization Pattern:**

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

### Multi-Language Support

**Framework**: next-intl with 7 locales: `en, fr, zh-Hans, ar, pt, es, pa`

**Routing:**

- All pages under `app/[locale]/`
- Middleware in `middleware.ts` handles locale detection + auth
- Routing config: `i18n/routing.ts`

**Translation Files:** `messages/{locale}.json`

**Rules** (see `docs/development/bilingual-guide.md`):

- No hardcoded strings for user-facing text
- Support RTL (Arabic) via `dir="rtl"` in layouts
- Localized data fields: `name_fr`, `description_fr`, etc.
- UI labels must be present in all 7 message files

---

## Code Style & Conventions

### TypeScript

- Strict mode enabled (`noUncheckedIndexedAccess: true`)
- Avoid `any` – especially in tests
- Use `@/` path alias (maps to project root)

### Linting & Formatting

- ESLint with Next.js + Prettier configs (zero-warning policy)
- Prettier with Tailwind plugin
- Run: `npm run lint` and `npm run format`

### Logging

- Use `lib/logger.ts` instead of `console.log`
- Structure logs with metadata: `logger.info("Action", { context })`

### React/Next.js

- Use Server Components by default
- Add `"use client"` only when interactivity is needed
- Use `lucide-react` for icons
- Functional components with TypeScript, hooks over classes

### Design System (Tailwind v4)

- **Glassmorphism**: Use utilities from `globals.css` (`.glass`, `.glass-card`, `.glass-panel`)
- **Semantic Colors**: `--color-primary-*`, `--surface-*`
- **Typography**: `heading-display`, `heading-1`, `heading-2`
- **Conditional Classes**: Use `cn()` helper from `lib/utils.ts`

### Components

- **Layout**: Use `components/layout/Header.tsx`, `Footer.tsx` for shell consistency
- **UI Primitives**: Use `components/ui/**` (button, card, badge) instead of raw HTML
- **Complex Components**: Reference `ServiceCard.tsx` and `AnalyticsCard.tsx` as examples

---

## Testing Strategy

We use a **pragmatic tiered testing strategy** that prioritizes dev velocity:

| Tier          | Scope                         | CI Behavior                          |
| ------------- | ----------------------------- | ------------------------------------ |
| **Critical**  | Data integrity, API contracts | Block merge                          |
| **Core Flow** | Crisis, Accessibility         | Block merge                          |
| **Polish**    | UI interactions               | Skip (flaky tests use `test.skip()`) |

**Coverage Requirements:**

- `lib/search/**`: 65% statements/branches
- `lib/ai/**`: 85% statements
- `lib/eligibility/**`: 95% statements
- `hooks/**`: 85% statements

**Expectations when you change code:**

- For non-trivial changes, run `npm run lint` and `npm run type-check`
- If you add new behavior, add/update tests (Vitest for logic, Playwright for critical flows)

Full details: `docs/development/testing-guidelines.md`

---

## Git Workflow

**Commits**: Small, logically grouped. Use conventional commits (e.g., `fix:`, `feat:`, `docs:`).

**Safety**:

- Never commit secrets, `.env` files, or machine-specific artifacts
- Update `.gitignore` if you introduce new generated files
- Keep commit author metadata human-owned (`user.name`/`user.email` must be a real contributor)
- Do not add AI tool attribution in commits, docs, or code comments (no `Co-authored-by` AI identities, no generated-by-agent signatures)
- Ensure contributor/authorship mentions in docs and changelogs list only human contributors
- Keep `CLAUDE.md` and `GEMINI.md` as relative symlinks to `AGENTS.md`

**Commit Message Format** (via HEREDOC):

```bash
git commit -m "feat: add new search filter"
```

---

## Data Verification Levels

Services have governance tiers (see `types/service.ts::VerificationLevel`):

- **L0**: Unverified (filtered out of search)
- **L1**: Basic verification (existence confirmed)
- **L2**: Vetted (contact made)
- **L3**: Provider confirmed (official partnership)

Search scoring applies multipliers: L3 = 1.5x, L2 = 1.2x, L1 = 1.0x

---

## Boundaries

### ✅ Always

- Run `npm run lint` and `npm run type-check` before committing
- Use `lib/logger.ts` instead of `console.log`
- Wrap Supabase calls with `withCircuitBreaker()` for resilience
- Use `assertPermission()` for protected server actions
- Escape user input in search queries (ILIKE wildcards)
- Validate data changes with `npm run validate-data`
- Regenerate embeddings after modifying `data/services.json` (`npm run build`)

### ⚠️ Ask First

- Modifying `data/services.json` – service data is hand-curated
- Adding new verification levels or changing scoring weights
- Database schema changes (migrations)
- Changes to RBAC permissions or role definitions
- Adding new environment variables
- Removing or skipping tests

### 🚫 Never

- Commit secrets, `.env` files, or API keys
- Auto-generate fake service data or contact information
- Imply official government affiliation in UI copy
- Add user tracking or analytics to public search
- Modify `node_modules/` or `vendor/` directories
- Force push to main branch
- Skip pre-commit hooks (`--no-verify`)

---

## Security & Governance

- **CSP/Headers**: Configured in `next.config.ts`
- **Auth**: Supabase with strong password policy (8+ chars)
- **CI**: `npm audit` runs on every push
- **Governance**: See `docs/governance/standards.md` for decision protocols

---

## Critical Files to Understand

1. **Search Engine**: `lib/search/index.ts`, `lib/search/scoring.ts`
2. **AI System**: `lib/ai/engine.ts`, `components/ai/ChatAssistant.tsx`
3. **Data Loading**: `lib/search/data.ts`
4. **API Routes**: `app/api/v1/search/services/route.ts`
5. **Authorization**: `lib/auth/authorization.ts`
6. **Main Search UI**: `components/search/SearchInterface.tsx`
7. **Service Schema**: `types/service.ts`
8. **Middleware**: `middleware.ts`
9. **Resilience**: `lib/resilience/supabase-breaker.ts`, `lib/performance/tracker.ts`

---

## Common Pitfalls

| Symptom                   | Likely Cause          | Fix                                        |
| ------------------------- | --------------------- | ------------------------------------------ |
| WebLLM fails to load      | No WebGPU support     | Check `navigator.gpu`; fails gracefully    |
| Search returns nothing    | L0 services filtered  | Check `verification_level` ≥ L1            |
| Embeddings don't match    | Stale after data edit | Run `npm run build`                        |
| Supabase connection fails | Missing credentials   | App falls back to JSON; check `.env.local` |
| Missing translations      | New strings added     | Run `npm run i18n-audit`                   |
| Type errors on service    | Schema mismatch       | Run `npm run validate-data`                |

---

## Development Notes

- **Node Version**: 22+ required
- **Turbo Mode**: Dev server uses `--turbo` flag for fast refresh
- **Commit Hooks**: Husky runs lint + related tests on pre-commit
- **Commit Convention**: Conventional commits enforced (see `commitlint.config.js`)
- **XSS Prevention**: `highlightMatches` escapes HTML entities before applying `<mark>` tags
- **Site Generation**: MkDocs Material for docs. Run `mkdocs serve` to view locally.

---

## Admin Setup

To grant admin privileges locally (requires running Supabase):

```sql
-- Run in Supabase SQL Editor
INSERT INTO app_admins (user_id) VALUES ('your-user-uuid');
```

---

## Maintaining This File

When updating AGENTS.md, reference [`docs/agents-md-guidelines.md`](docs/agents-md-guidelines.md) for best practices on structure, boundaries, and anti-patterns to avoid.
