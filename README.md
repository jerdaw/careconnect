# Kingston Care Connect

> A verified, governance-first search engine for social services in Kingston, Ontario—covering food security, crisis intervention, and housing support.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status: Pilot](https://img.shields.io/badge/Status-Pilot-orange.svg)
![Coverage](https://img.shields.io/badge/Coverage-65%25-yellow.svg)

## The Kingston 150

Large-scale scraping of municipal data produces noise, not value. Kingston Care Connect takes a different path: **manual curation over automated extraction**.

We maintain a hand-verified dataset of the **169 highest-impact services** available to Kingston residents. Every entry is:

- **Verified** — No broken links or disconnected phone numbers.
- **Accessible** — Clear eligibility requirements.
- **Identity-Aware** — Evidence-backed safety tags for vulnerable populations.

---

## Current Version

**v17.6** - Authorization Resilience & Tiered Security (2026-01-25)

## Current Features

### Authorization Resilience (v17.6)

- **Tiered Circuit Breaker Protection**: Authorization checks wrap database calls to prevent cascading failures.
- **Fail-Secure Mutations**: High-risk actions (edit/delete) fail closed during database outages to maintain security.
- **Safe Read fallbacks**: Low-risk permission checks fail open with safe defaults to maintain UI stability.
- **Resilience Audit**: Full coverage for all authorization assertions with dedicated unit test suite.

### Performance & Resilience (v17.5)

- **Performance Tracking**: Real-time metrics with p50/p95/p99 latency tracking
- **Circuit Breaker Pattern**: Automatic failover when database unavailable (fast-fail in <1ms)
- **Health Check API**: Public and authenticated endpoints for system status
- **Load Testing**: k6 infrastructure for baseline metrics and regression detection
- **Metrics Endpoint**: Development-only API for operational visibility

### Partner Portal & Dashboard (v17.4)

- **Organization Management**: Create orgs, manage members with role-based access
- **Service CRUD**: Partners can create, edit, and publish their listings
- **Analytics**: View search analytics and user feedback
- **Notifications**: Partner communication center
- **RBAC System**: 4 role tiers (Owner, Admin, Editor, Viewer) with 19 granular permissions

### Accessibility & Compliance (v17.3)

- **WCAG 2.1 AA Compliant**: High-contrast mode, skip-links, keyboard navigation
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

### Legal & Compliance Infrastructure

- **Enforceable Protections**: Robust Terms of Service and Privacy Policy (PIPEDA/PHIPA compliant).
- **Emergency Safeguards**: Prominent disclaimers and immediate 911/988 access on crisis pages.
- **AI Transparency**: Detailed disclaimers for browser-based AI features.
- **AODA Compliance**: Dedicated Accessibility Policy and multi-year compliance plan.
- **Governance Audit**: Public-facing Content Moderation Policy and Feedback Process.
- **Entity Preparedness**: Documented research for Non-Profit incorporation and liability insurance.

### Search Intelligence

- **Synonym Expansion**: "Hungry" returns food banks; "rent" surfaces eviction prevention resources.
- **Open Now Filter**: Real-time availability based on structured operating hours.
- **Privacy-First Analytics**: Tracks unmet needs through zero-result patterns without logging queries.
- **Crisis Detection**: Automatically boosts emergency services when high-risk language is detected.
- **Map Integration**: Embedded Google Maps on service detail pages for location context.

### Decentralized AI Assistant

- **On-Device Smart Search**: Uses a small local LLM (WebLLM + WebGPU) to rewrite/expand natural-language queries for better matching.
- **Deterministic Results**: The UI renders verified service links from the local directory (no free-form “chatbot answers” shown to users).
- **Zero-Knowledge Architecture**: Queries never leave the device.
- **Offline-Friendly**: The service directory and embeddings can be cached for offline search.
- **Measurable Impact (v14.0)**: Public dashboard showing aggregate outcomes and data quality metrics without tracking users.

### Librarian Model (v13.0)

- **Server-Side Search API**: Privacy-focused, rate-limited POST endpoint for enhanced security.
- **Zero-Logging**: Search queries are strictly `no-store` and never logged to the database.
- **Dynamic Bundle**: Falls back to lightweight server queries, saving ~300KB on initial load.

### Additional Capabilities

- **169 Verified Services** — Hand-curated Kingston services across 12 categories.
- **Semantic and Fuzzy Search** — Natural language queries ("I feel unsafe") and typo correction ("fod" → "food").
- **Privacy by Design** — No cookies, no tracking, no search logging. All inference runs in-browser or anonymously.
- **Service Detail Pages** — Rich metadata, contact information, and localized content for each listing.
- **Partner Claiming Workflow** — Organizations can claim, verify, and maintain their own listings.
- **Progressive Web App** — Installable, works offline.
- **WCAG 2.1 AA Compliant** — High-contrast, skip-links, and keyboard navigation.
- **Community Governance** — Residents can flag inaccurate data directly.
- **Performance Optimized** — Loads instantly, even on slow connections.
- **Structured Observability** — High-context logging system with timers for performance monitoring.
- **Multi-Lingual Support** — Full support for 7 languages: English, Canadian French, Arabic, Simplified Chinese, Spanish, Punjabi, and Portuguese.
- **Indigenous Health Services** — Dedicated filters and culturally safe tags.
- **Land Acknowledgment** — Respecting the traditional lands of Kingston (Katarokwi).
- **Provincial Crisis Lines** — 16 Ontario-wide crisis services (988, ConnexOntario, Kids Help Phone, etc.).
- **Printable Resource Cards** — High-contrast, one-page summaries for any service, designed for offline distribution.
- **Trust Signals** — Visible "Verified At" badges and provenance data for every listing.

---

## Tech Stack

| Layer           | Technology                                                            |
| :-------------- | :-------------------------------------------------------------------- |
| Framework       | [Next.js 15](https://nextjs.org/) (App Router)                        |
| Language        | [TypeScript](https://www.typescriptlang.org/)                         |
| Styling         | [Tailwind CSS v4](https://tailwindcss.com/)                           |
| UI Components   | [Radix UI](https://www.radix-ui.com/)                                 |
| AI / Embeddings | [@xenova/transformers](https://huggingface.co/docs/transformers.js/)  |
| Testing         | [Vitest](https://vitest.dev/) · [Playwright](https://playwright.dev/) |
| Database        | [Supabase](https://supabase.com/) (PostgreSQL + pgvector)             |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
git clone https://github.com/jerdaw/kingston-care-connect.git
cd kingston-care-connect
npm install  # Installs dependencies and automatically sets up Git hooks
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

> [!NOTE]
> Git hooks are managed by [Husky](https://typicode.github.io/husky/) and automatically configured during `npm install` via the `prepare` script. Hooks enforce code quality checks (linting, type-checking, i18n validation) before commits.

### Scripts

#### Development & Testing

| Command                  | Description                             |
| :----------------------- | :-------------------------------------- |
| `npm run dev`            | Start development server (Turbo)        |
| `npm run build`          | Build for production                    |
| `npm run start`          | Start production server                 |
| `npm test`               | Run unit and integration tests (Vitest) |
| `npm run test:watch`     | Vitest in watch mode                    |
| `npm run test:coverage`  | Generate coverage report                |
| `npm run test:e2e`       | Run E2E tests (all browsers)            |
| `npm run test:e2e:local` | Run E2E tests (Chromium only)           |
| `npm run test:a11y`      | Run accessibility audit (Axe-core)      |
| `npm run type-check`     | TypeScript compiler check               |
| `npm run lint`           | ESLint code quality check               |
| `npm run lint:fix`       | ESLint with auto-fix                    |
| `npm run format`         | Format code with Prettier               |
| `npm run format:check`   | Check code formatting                   |
| `npm run ci:check`       | Run CI validation checks                |
| `npm run check:root`     | Check project root hygiene              |

#### Load Testing (v17.5)

| Command                       | Description                           |
| :---------------------------- | :------------------------------------ |
| `npm run test:load`           | Run search API load test (realistic)  |
| `npm run test:load:smoke`     | Run smoke test (basic connectivity)   |
| `npm run test:load:sustained` | Run sustained load test (30min)       |
| `npm run test:load:spike`     | Run spike test (sudden traffic spike) |

#### Data Validation & Audits

| Command                        | Description                                  |
| :----------------------------- | :------------------------------------------- |
| `npm run validate-data`        | Validate data schema (Zod)                   |
| `npm run db:validate`          | Alias for validate-data                      |
| `npm run db:verify`            | Verify database integrity (row count, RLS)   |
| `npm run health-check`         | Validate all service URLs                    |
| `npm run phone-validate`       | Validate phone numbers (Twilio)              |
| `npm run check-staleness`      | Check for stale/unverified data              |
| `npm run audit:data`           | Comprehensive data completeness audit        |
| `npm run audit:qa`             | Data quality and integrity audit             |
| `npm run audit:coords`         | Export services with missing coordinates     |
| `npm run audit:hours`          | Export services with missing operating hours |
| `npm run audit:access-scripts` | Audit access_script quality                  |
| `npm run audit:l3`             | Export L3 verification candidates            |
| `npm run bilingual-check`      | Check bilingual content coverage             |
| `npm run i18n-audit`           | Audit i18n translation key coverage          |
| `npm run analyze`              | Analyze production bundle size               |

#### Data Enrichment & Translation

| Command                           | Description                                   |
| :-------------------------------- | :-------------------------------------------- |
| `npm run export:access-script-fr` | Export access_script fields for French        |
| `npm run translate:prompt`        | Generate AI translation prompts               |
| `npm run translate:parse`         | Parse AI response into structured JSON        |
| `npm run translate:validate`      | Validate translation batch                    |
| `npm run backfill:hours-text`     | Backfill hours_text from structured hours     |
| `npm run geocode`                 | Geocode addresses (requires OPENCAGE_API_KEY) |

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
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SECRET_KEY=your-secret-key
   ```

3. Run `supabase/schema.sql` in the Supabase SQL Editor.
4. Migrate local data:

   ```bash
   npx tsx scripts/migrate-data.ts
   ```

---

## Contributing

This project is community-led. Safety and accuracy take precedence over volume.

### Documentation

- [Roadmap](docs/planning/roadmap.md)
- [Documentation Guidelines](docs/documentation-guidelines.md)
- [Testing Standards](docs/development/testing-guidelines.md)
- [Multi-Lingual Development Guide](docs/bilingual-dev-guide.md)
- [Acknowledgments & Governance](docs/acknowledgments.md)

### Adding a Service

Proposed services must meet these criteria:

- Serves the Kingston, Ontario area.
- Has a verifiable phone number or physical address.
- Free or subsidized.

---

MIT License
