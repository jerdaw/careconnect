# CareConnect

> A verified, governance-first search engine for social services in Kingston, Ontario—covering food security, crisis intervention, and housing support.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status: Pilot](https://img.shields.io/badge/Status-Pilot-orange.svg)
![Coverage](https://img.shields.io/badge/Coverage-65%25-yellow.svg)

## Manual Curation, Not Scraping

Large-scale scraping of municipal data produces noise, not value. CareConnect takes a different path: **manual curation over automated extraction**.

We maintain a hand-verified dataset of the **196 highest-impact services** available to Kingston residents. Every entry is:

- **Verified** — No broken links or disconnected phone numbers.
- **Accessible** — Clear eligibility requirements.
- **Identity-Aware** — Evidence-backed safety tags for vulnerable populations.

---

## Project Status

**v22.0** - decision-gated pilot / public-interest prototype.

CareConnect is an active, health-adjacent community resource discovery project. It is not a clinical decision support system, not an emergency service, and not an official government or 211 service. Current work is focused on governance, verification, privacy-conscious design, and evidence for whether the project creates non-duplicate value relative to existing referral pathways.

## Public Documentation Boundary

This repository contains public project documentation and reproducible development information. Deployment details, credentials, monitoring configuration, private operational notes, exact production paths, and shared-host inventory are intentionally excluded from public documentation.

Production deployment details, shared-host ownership notes, private
inventories, and environment-specific operations are intentionally excluded
from this public repository.

Push notifications and external integrations are optional and disabled unless explicitly configured by a maintainer.

## Current Features

### Production Readiness And Observability (v18.0)

- **Operational Instrumentation**: Aggregate system-health metrics for maintainers.
- **Alert-Ready Architecture**: Optional alerting hooks for critical service degradation.
- **SLO Tracking**: Provisional service objectives for uptime and latency review.
- **Observability Dashboard**: Admin-only system health views for authorized maintainers.
- **Circuit Breaker Telemetry**: API route coverage for database degradation and recovery signals.

### Authorization Resilience (v17.6)

- **Tiered Circuit Breaker Protection**: Authorization checks wrap database calls to prevent cascading failures.
- **Fail-Secure Mutations**: High-risk actions (edit/delete) fail closed during database outages to maintain security.
- **Safe Read fallbacks**: Low-risk permission checks fail open with safe defaults to maintain UI stability.
- **Resilience Audit**: Full coverage for all authorization assertions with dedicated unit test suite.

### Performance & Resilience (v17.5)

- **Performance Tracking**: Real-time metrics with p50/p95/p99 latency tracking
- **Circuit Breaker Pattern**: Automatic failover when database unavailable (fast-fail in <1ms)
- **Health Check API**: Public basic status plus admin-only detailed checks in production
- **Load Testing**: k6 infrastructure for baseline metrics and regression detection
- **Metrics Endpoint**: Development-only API for operational visibility

### Partner Portal & Dashboard (v17.4)

- **Organization Management**: Create orgs, manage members with role-based access
- **Service CRUD**: Partners can create, edit, and publish their listings
- **Analytics**: View aggregate search analytics and user feedback
- **Notifications**: Partner communication center
- **RBAC System**: 4 role tiers (Owner, Admin, Editor, Viewer) with 19 granular permissions

### Accessibility (v17.3)

- **WCAG 2.1 AA-Oriented**: High-contrast mode, skip-links, and keyboard navigation, with automated accessibility checks.
- **Comprehensive Testing**: Automated accessibility audits with Axe-core
- **Voice Input**: Natural language voice search support

### Internationalization (v17.2)

- **7 Languages**: English, Canadian French, Arabic, Simplified Chinese, Spanish, Punjabi, Portuguese
- **RTL Support**: Full right-to-left layout for Arabic interface
- **Locale-Aware Search**: Language-specific synonyms and results

### Security & Authorization (v17.0)

- **Row-Level Security**: Database-enforced access controls
- **RBAC System**: Comprehensive permission matrix
- **Session Management**: Secure authentication with Supabase
- **Audit Trails**: Detailed logging of user actions

### Core Search Features (v12.0-v16.0)

### Privacy, Safety, And Governance Infrastructure

- **Privacy-Conscious Legal Surfaces**: Terms of Service and Privacy Policy designed with Canadian privacy principles and PIPEDA/PHIPA considerations in mind. This project is not a formal legal compliance determination.
- **Emergency Safeguards**: Prominent disclaimers and immediate 911/988 access on crisis pages.
- **AI Transparency**: Detailed disclaimers for browser-based AI features.
- **Accessibility Planning**: Dedicated Accessibility Policy and multi-year improvement plan.
- **Governance Audit**: Public-facing Content Moderation Policy and Feedback Process.
- **Entity Preparedness**: Documented research for Non-Profit incorporation and liability insurance.

### Search Intelligence

- **Synonym Expansion**: "Hungry" returns food banks; "rent" surfaces eviction prevention resources.
- **Open Now Filter**: Real-time availability based on structured operating hours, aligned across local and server search.
- **Privacy-First Analytics**: Tracks aggregate locale/result-count patterns without logging queries or filter details.
- **Crisis Detection**: Automatically boosts emergency services when high-risk language is detected.
- **Search Explainability**: Public result cards and linked detail pages can show deduplicated match reasons for why a service ranked.
- **Stale-Data Governance**: Records beyond the 180-day freshness window are hidden from search instead of lingering with only a soft score penalty.
- **Map Integration**: External map previews stay off by default; users can explicitly open directions or load a map preview on service detail pages.

### Decentralized AI Assistant

- **On-Device Smart Search**: Uses a small local LLM (WebLLM + WebGPU) to rewrite/expand natural-language queries for better matching.
- **Deterministic Results**: The UI renders verified service links from the local directory (no free-form “chatbot answers” shown to users).
- **Zero-Knowledge Architecture**: Queries never leave the device.
- **Offline-Friendly**: The service directory and embeddings can be cached for offline search.
- **Measurable Impact (v14.0)**: Public dashboard showing aggregate outcomes and data quality metrics without tracking users.

### Librarian Model (v13.0)

- **Server-Side Search API**: Privacy-focused, rate-limited POST endpoint for enhanced security.
- **Zero-Logging**: Query-, location-, and open-now-driven search responses are `no-store` and never logged to the database. Anonymous category-only browse responses may use short public edge caching.
- **Shared Ranking Logic**: Local and server search now use the same in-memory ranking pipeline for authority, freshness, completeness, intent, proximity, and crisis handling.
- **Dynamic Bundle**: Falls back to lightweight server queries, saving ~300KB on initial load.

### Additional Capabilities

- **196 Verified Services** — Hand-curated Kingston services across 12 categories.
- **Semantic and Fuzzy Search** — Natural language queries ("I feel unsafe") and typo correction ("fod" → "food").
- **Privacy by Design** — No tracking cookies and no search logging. Only functional first-party cookies are used when needed for locale, auth, or short-lived share-target handoff. All inference runs in-browser or anonymously.
- **Service Detail Pages** — Rich metadata, contact information, and localized content for each listing.
- **Partner Claiming Workflow** — Organizations can claim, verify, and maintain their own listings.
- **Progressive Web App** — Installable, works offline.
- **WCAG 2.1 AA-Oriented** — High-contrast, skip-links, keyboard navigation, and automated checks.
- **Community Governance** — Residents can flag inaccurate data directly.
- **Performance Optimized** — Loads instantly, even on slow connections.
- **Structured Observability** — High-context logging system with timers for performance monitoring.
- **Multi-Lingual Support** — Full support for 7 languages: English, Canadian French, Arabic, Simplified Chinese, Spanish, Punjabi, and Portuguese.
- **Indigenous Health Services** — Dedicated filters and culturally safe tags.
- **Land Acknowledgment** — Respecting the traditional lands of Kingston (Katarokwi).
- **Provincial Crisis Lines** — 16 Ontario-wide crisis services (988, ConnexOntario, Kids Help Phone, etc.).
- **Printable Resource Cards** — High-contrast, one-page summaries for any service, designed for offline distribution with locally generated inline QR codes.
- **Trust Signals** — Visible freshness badges, provenance data, and explicit stale-record warnings for direct links beyond the governance freshness window.

---

## Tech Stack

| Layer           | Technology                                                                |
| :-------------- | :------------------------------------------------------------------------ |
| Framework       | [Next.js 16](https://nextjs.org/) (App Router)                            |
| Language        | [TypeScript](https://www.typescriptlang.org/)                             |
| Styling         | [Tailwind CSS v4](https://tailwindcss.com/)                               |
| UI Components   | [Radix UI](https://www.radix-ui.com/)                                     |
| AI / Embeddings | [@huggingface/transformers](https://huggingface.co/docs/transformers.js/) |
| Testing         | [Vitest](https://vitest.dev/) · [Playwright](https://playwright.dev/)     |
| Database        | [Supabase](https://supabase.com/) (PostgreSQL + pgvector)                 |

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+

### Installation

```bash
git clone https://github.com/jerdaw/careconnect.git
cd careconnect
npm install  # Installs dependencies and automatically sets up Git hooks
npm run dev
```

Open `http://localhost:3000` to view the application.

> [!NOTE]
> Git hooks are managed by [Husky](https://typicode.github.io/husky/) and automatically configured during `npm install` via the `prepare` script. Hooks enforce code quality checks (linting, type-checking, i18n validation) before commits.

### Scripts

#### Development & Testing

| Command                       | Description                                                                        |
| :---------------------------- | :--------------------------------------------------------------------------------- |
| `npm run dev`                 | Start development server (Turbo)                                                   |
| `npm run build`               | Build for production                                                               |
| `npm run generate-embeddings` | Regenerate local embeddings without a full build                                   |
| `npm run start`               | Start production server                                                            |
| `npm test`                    | Run the default Vitest suite                                                       |
| `npm run test:db`             | Run real DB integration tests locally (Docker + `psql`)                            |
| `npm run db:types`            | Generate Supabase TS types from a local ephemeral stack                            |
| `npm run test:watch`          | Vitest in watch mode                                                               |
| `npm run test:coverage`       | Generate coverage report                                                           |
| `npm run test:e2e`            | Run E2E tests (all browsers)                                                       |
| `npm run test:e2e:local`      | Run E2E tests (Chromium only)                                                      |
| `npm run test:a11y`           | Run accessibility audit (Axe-core)                                                 |
| `npm run type-check`          | TypeScript compiler check                                                          |
| `npm run lint`                | ESLint code quality check                                                          |
| `npm run lint:fix`            | ESLint with auto-fix                                                               |
| `npm run format`              | Format code with Prettier                                                          |
| `npm run format:check`        | Check code formatting                                                              |
| `npm run ci:check`            | Run CI validation checks (DB lane auto-skips locally if prerequisites are missing) |
| `npm run check:refs`          | Validate repo-local docs/script/path references                                    |
| `npm run check:root`          | Check project root hygiene                                                         |

#### Release Helpers

Public documentation does not include production host paths or release commands. Maintainers should use the private deployment notes and shared operations inventory for live releases.

#### Load Testing (v17.5)

| Command                       | Description                           |
| :---------------------------- | :------------------------------------ |
| `npm run test:load`           | Run search API load test (realistic)  |
| `npm run test:load:smoke`     | Run smoke test (basic connectivity)   |
| `npm run test:load:sustained` | Run sustained load test (30min)       |
| `npm run test:load:spike`     | Run spike test (sudden traffic spike) |

These commands require `k6` to be installed locally and available on your `PATH`. The repo does not vendor the binary.

#### Data Validation & Audits

| Command                        | Description                                                                      |
| :----------------------------- | :------------------------------------------------------------------------------- |
| `npm run validate-data`        | Validate data schema (Zod)                                                       |
| `npm run db:validate`          | Alias for validate-data                                                          |
| `npm run db:verify`            | Verify database integrity (row count, RLS)                                       |
| `npm run check:embeddings`     | Validate local service IDs and embedding vector shape without regenerating files |
| `npm run health-check`         | Validate all service URLs                                                        |
| `npm run phone-validate`       | Validate phone numbers (Twilio)                                                  |
| `npm run check-staleness`      | Check for stale/unverified data                                                  |
| `npm run audit:data`           | Comprehensive data completeness audit                                            |
| `npm run audit:qa`             | Data quality and integrity audit                                                 |
| `npm run audit:coords`         | Export services with missing coordinates                                         |
| `npm run audit:hours`          | Export services with missing operating hours                                     |
| `npm run audit:access-scripts` | Audit access_script quality                                                      |
| `npm run audit:l3`             | Export L3 verification candidates                                                |
| `npm run bilingual-check`      | Check bilingual content coverage                                                 |
| `npm run i18n-audit`           | Audit i18n translation key coverage                                              |
| `npm run analyze`              | Analyze production bundle size                                                   |

#### Utility Scripts

| Command                                                | Description                                               |
| :----------------------------------------------------- | :-------------------------------------------------------- |
| `npm run tools:search "food bank"`                     | Run the local CLI search tool                             |
| `npm run search:qa`                                    | Run curated local search QA scenarios                     |
| `npm run verify:search-ranking`                        | Verify API ranking against a running local app            |
| `npm run verify:rls`                                   | Check public/private Supabase access boundaries           |
| `npm run audit:pilot-readiness -- --scope-file <path>` | Export scoped pilot readiness JSON/Markdown/CSV artifacts |
| `npm run check:v22-evidence`                           | Validate C1/D4 Gate 0 evidence-intake consistency         |
| `npm run check:v22-threat-model`                       | Validate v22 threat-model Gate 0 consistency              |
| `npm run check:v22-gate0`                              | Enforce the current v22 Gate 0 decision from docs         |
| `npm run normalize:services -- --dry-run`              | Preview legacy schema normalization without writing data  |
| `npm run ingest:import-response -- --help`             | Show draft-import CLI usage                               |

`npm run db:types` requires a Docker-capable local environment because it boots the minimal local Supabase profile before generating `types/supabase.ts`.

#### Data Enrichment & Translation

| Command                              | Description                                      |
| :----------------------------------- | :----------------------------------------------- |
| `npm run export:access-script-fr`    | Export access_script fields for French           |
| `npm run translate:prompt`           | Generate AI translation prompts                  |
| `npm run translate:parse`            | Parse AI response into structured JSON           |
| `npm run translate:validate`         | Validate translation batch                       |
| `npm run backfill:hours-text`        | Backfill hours_text from structured hours        |
| `npm run backfill:db-runtime-fields` | Fill missing DB runtime fields from curated JSON |
| `npm run geocode`                    | Geocode addresses (requires OPENCAGE_API_KEY)    |

See [French Translation Workflow](docs/workflows/french-translation-workflow.md) for detailed translation process.

### Environment Variables

Copy `.env.example` to `.env.local`. Core search functionality works without API keys; database features require Supabase credentials.

For **Librarian Model** (Server-Side Search):

```env
NEXT_PUBLIC_SEARCH_MODE=server
```

(Defaults to `local` if unset).

### Partner Platform (Supabase)

To enable the Partner Portal, authentication, and analytics:

1. Create a project at [database.new](https://database.new).
2. Add your credentials to `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=example-publishable-key
   SUPABASE_SECRET_KEY=
   ```

3. Apply the schema via Supabase CLI migrations:

   ```bash
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

4. Migrate local data:

   ```bash
   npx tsx scripts/migrate-data.ts
   ```

5. For existing Supabase environments that previously relied on the old DB-plus-JSON runtime overlay, run the rollout-safe DB backfill once:

   ```bash
   npm run backfill:db-runtime-fields
   ```

   This fills missing DB-authoritative runtime fields such as `synthetic_queries`, `coordinates`, `hours_text`, and `access_script` from the curated snapshot without overwriting non-empty live values.

6. For authenticated uptime probes, set:

   ```env
   HEALTH_PROBE_TOKEN=
   ```

   `GET /api/v1/health` remains a public, read-only status endpoint. `GET /api/v1/health/probe` is the authenticated probe path that records uptime samples and evaluates alerting.

---

## Contributing

This project is community-led. Safety and accuracy take precedence over volume.

### Documentation

- [Roadmap](docs/planning/roadmap.md)
- [Documentation Guidelines](docs/documentation-guidelines.md)
- [Testing Standards](docs/development/testing-guidelines.md)
- [Multi-Lingual Development Guide](docs/development/bilingual-guide.md)
- [Acknowledgments & Governance](docs/community/acknowledgments.md)

### Adding a Service

Proposed services must meet these criteria:

- Serves the Kingston, Ontario area.
- Has a verifiable phone number or physical address.
- Free or subsidized.

---

MIT License
