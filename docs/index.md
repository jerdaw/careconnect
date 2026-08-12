# CareConnect

> A governance-first social-services search project whose public records are controlled by publication and freshness rules.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status: Retirement transition](https://img.shields.io/badge/Status-Retirement%20transition-orange.svg)

## Manual Curation, Not Scraping

Large-scale scraping of municipal data produces noise, not value. CareConnect takes a different path: **manual curation over automated extraction**.

The governed inventory contains **204 manually curated records**. Public search applies publication, deletion, verification-level, and 180-day freshness rules before displaying a record, so inventory size is not the same as the currently visible service count. Every visible entry must be:

- **Published and active** — Published and not marked deleted.
- **Verification-eligible** — Assigned an L1-L3 verification level.
- **Within the visibility window** — Not older than the 180-day freshness cutoff.

Manual curation remains the data-governance model. The software can display evidence-backed safety and identity tags when a record contains them; those tags are an optional capability, not a universal property of visible records.

---

## Current Disposition

Controlled retirement of the public directory is approved in principle. The bounded evidence screen and any separately approved transition work remain pending.

CareConnect is still publicly available during this transition. This documentation change does not retire the service, alter service records, or authorize a deployment. No pilot, partner outreach, corpus restoration, coverage expansion, or research conversion is active. The repository continues to preserve the privacy, accessibility, governance, and offline-search implementation as a technical artifact.

See the [current roadmap](planning/roadmap.md) and [public-service retirement disposition](implementation/careconnect-public-service-retirement-disposition-2026-08-12.md). CareConnect is not a clinical decision support system, emergency service, or official government or 211 service.

Public documentation intentionally excludes deployment details, credentials, monitoring configuration, private operational notes, exact production paths, and shared-host inventory.

## Current Features

### Performance & Resilience (v17.5)

- **Performance Tracking**: Real-time operation metrics with p50/p95/p99 latency tracking
- **Circuit Breaker Pattern**: Prevents cascading failures when database is unavailable (fast-fail in <1ms)
- **Health Check API**: Public and authenticated endpoints for system monitoring
- **Metrics Endpoint**: Development-only API for operational visibility
- **Load Testing Infrastructure**: k6 tests for baseline metrics and regression detection

### Partner Portal & Dashboard (v17.4)

- **Organization Management**: Create organizations and manage members with role-based access
- **Service Management**: Partners can create, edit, publish, and delete their service listings
- **Analytics Dashboard**: View search analytics and user feedback patterns
- **RBAC System**: 4 role tiers (Owner, Admin, Editor, Viewer) with 19 granular permissions
- **Member Management**: Invite members, change roles, and manage access

### Accessibility (v17.3)

- **WCAG 2.1 AA-Oriented**: High-contrast mode, skip-links, keyboard navigation, and automated checks
- **Comprehensive Testing**: Automated accessibility audits with Axe-core
- **Voice Input**: Natural language voice search support

### Internationalization (v17.2)

- **7 Languages**: Full support for English, Canadian French, Arabic, Simplified Chinese, Spanish, Punjabi, Portuguese
- **RTL Support**: Full right-to-left layout for Arabic interface
- **Locale-Aware Search**: Language-specific synonyms and search results

### Security & Authorization (v17.0)

- **Row-Level Security**: Database-enforced access controls per organization
- **RBAC System**: Comprehensive permission matrix for authorization
- **Session Management**: Secure authentication with Supabase Auth
- **Audit Trails**: Detailed logging of user actions and changes

### Legacy Features (v12.0-v16.0)

#### Privacy, Safety, And Governance Infrastructure

- **Privacy-Conscious Legal Surfaces**: Terms of Service and Privacy Policy designed with Canadian privacy principles and PIPEDA/PHIPA considerations in mind. This project is not a formal legal compliance determination.
- **Emergency Safeguards**: Prominent disclaimers and immediate 911/988 access on crisis pages.
- **AI Transparency**: Detailed disclaimers for browser-based AI features.
- **Accessibility Planning**: Dedicated Accessibility Policy and multi-year improvement plan.
- **Governance Audit**: Public-facing Content Moderation Policy and Feedback Process.
- **Entity Preparedness**: Documented research for Non-Profit incorporation and liability insurance.

### Search Intelligence

- **Synonym Expansion**: "Hungry" returns food banks; "rent" surfaces eviction prevention resources.
- **Open Now Filter**: Real-time availability based on structured operating hours.
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

### Librarian Model (v13.0)

- **Server-Side Search API**: Privacy-focused, rate-limited POST endpoint for enhanced security.
- **Zero-Logging**: Query-, location-, and open-now-driven search responses are `no-store` and never logged to the database. Anonymous category-only browse responses may use short public caching.
- **Dynamic Bundle**: Falls back to lightweight server queries, saving ~300KB on initial load.

### Additional Capabilities

- **Place-Aware Filtering** — The software supports place-aware coverage metadata and filtering. Current public visibility is determined by publication, deletion, verification-level, and freshness rules; no regional expansion is active.
- **Semantic and Fuzzy Search** — Natural language queries ("I feel unsafe") and typo correction ("fod" → "food").
- **Privacy by Design** — No tracking cookies and no search logging. Only functional first-party cookies are used when needed for locale, auth, or short-lived share-target handoff. All inference runs in-browser or anonymously.
- **Service Detail Pages** — Rich metadata, contact information, and localized content for each listing.
- **Partner Claiming Workflow** — Organizations can claim, verify, and maintain their own listings.
- **Progressive Web App** — Installable, works offline.
- **WCAG 2.1 AA-Oriented** — High-contrast, skip-links, keyboard navigation, and automated checks.
- **Community Governance** — Residents can flag inaccurate data directly.
- **Performance-Oriented** — Designed for fast local search and low-bandwidth use, with regression checks for bundle size and load behavior.
- **Trust Signals** — Visible freshness badges, provenance data, and explicit stale-record warnings for direct links beyond the governance freshness window.
- **Multi-Lingual Support** — Full support for 7 languages: English, Canadian French, Arabic, Simplified Chinese, Spanish, Punjabi, and Portuguese.
- **Indigenous Health Services** — Dedicated filters and culturally safe tags.
- **Place-Specific Public Copy** — Local acknowledgments and place language are published only when verified for that place.
- **Provincial Crisis Lines** — 16 Ontario-wide crisis services (988, ConnexOntario, Kids Help Phone, etc.).

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
git clone https://github.com/jerdaw/careconnect.git # (1)
cd careconnect
npm install
npm run dev
```

1. This clones the main repository to your local machine.

Open `http://localhost:3000` to view the application.

### Scripts

**Development & Testing:**
| Command | Description |
| :------------------------ | :-------------------------------------- |
| `npm run dev` | Start development server (Turbo) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run the default Vitest suite |
| `npm run test:db` | Run real DB integration tests locally (Docker + `psql`) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e` | Run E2E tests (all browsers) |
| `npm run test:e2e:local` | Run E2E tests (Chromium only) |
| `npm run test:a11y` | Run accessibility audit (Axe-core) |
| `npm run type-check` | TypeScript compiler check |
| `npm run lint` | ESLint code quality check |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run ci:check` | Run CI validation checks (DB lane auto-skips locally if prerequisites are missing) |
| `npm run check:root` | Check project root hygiene |

**Load Testing (v17.5):**
| Command | Description |
| :------------------------ | :-------------------------------------- |
| `npm run test:load` | Run search API load test (realistic) |
| `npm run test:load:smoke` | Run smoke test (basic connectivity) |
| `npm run test:load:sustained` | Run sustained load test (30 minutes) |
| `npm run test:load:spike` | Run spike test (sudden traffic spike) |

**Data Validation & Audits:**
| Command | Description |
| :------------------------ | :----------------------------------------------- |
| `npm run validate-data` | Validate data schema (Zod) |
| `npm run db:validate` | Alias for validate-data |
| `npm run db:verify` | Verify database integrity (row count, RLS) |
| `npm run health-check` | Validate all service URLs |
| `npm run phone-validate` | Validate phone numbers (Twilio) |
| `npm run check-staleness` | Check stale data; add `-- --as-of YYYY-MM-DD --out-dir <dir>` to export a dated JSON/Markdown/CSV queue |
| `npm run audit:data` | Comprehensive data completeness audit |
| `npm run audit:qa` | Data quality and integrity audit |
| `npm run audit:coords` | Export services with missing coordinates |
| `npm run audit:hours` | Export services with missing operating hours |
| `npm run audit:access-scripts` | Audit access_script quality |
| `npm run audit:l3` | Export L3 verification candidates |
| `npm run bilingual-check` | Check bilingual content coverage |
| `npm run i18n-audit` | Audit i18n translation key coverage |
| `npm run analyze` | Analyze production bundle size |

**Data Enrichment & Translation:**
| Command | Description |
| :------------------------------ | :--------------------------------------------- |
| `npm run export:access-script-fr` | Export access_script fields for French |
| `npm run translate:prompt` | Generate AI translation prompts |
| `npm run translate:parse` | Parse AI response into structured JSON |
| `npm run translate:validate` | Validate translation batch |
| `npm run backfill:hours-text` | Backfill hours_text from structured hours |
| `npm run geocode` | Geocode addresses (requires OPENCAGE_API_KEY) |

See [French Translation Workflow](workflows/french-translation-workflow.md) for detailed translation process.

### Environment Variables

Copy `.env.example` to `.env.local`. Core search functionality works without API keys; database features require Supabase credentials.

For **Librarian Model** (Server-Side Search):

```env
NEXT_PUBLIC_SEARCH_MODE=server
```

(Defaults to `local` if unset).

Optional configuration:

- `APP_VERSION` sets the server-side version string returned by health endpoints.
- `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`, and `OPENCAGE_API_KEY` support maintainer-only enrichment workflows.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` enable distributed rate limiting; leave them unset to use the in-memory fallback.
- `ALLOW_211_SYNC=1` and `API_211_KEY` are required together for an explicitly approved manual 211 sync. Leave both unset for normal development.
- `npm run validate:env` checks `.env.local`; local placeholder values intentionally fail that production-readiness check.

### Partner Platform (Supabase)

To enable the Partner Portal, authentication, and analytics:

1. Create a project at [database.new](https://database.new).
2. Add your credentials to `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SECRET_KEY=your-secret-key
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

---

## Contributing

This project is community-led. Safety and accuracy take precedence over volume.

### Documentation

- [Roadmap](planning/roadmap.md)
- [Public-service retirement disposition](implementation/careconnect-public-service-retirement-disposition-2026-08-12.md)
- [Historical Planning Archive](planning/archive/README.md)
- [Documentation Guidelines](governance/documentation-guidelines.md)
- [Testing Standards](development/testing.md)
- [Multi-Lingual Development Guide](development/bilingual-guide.md)
- [Acknowledgments & Governance](community/acknowledgments.md)

### Adding a Service (Inactive)

New service intake is dormant during the retirement transition. The criteria
below are preserved as conditional history; they are not an invitation to
submit records and do not authorize ingestion.

- Serves a supported CareConnect place, or is clearly available province-wide or Canada-wide.
- Has a verifiable phone number or physical address.
- Free or subsidized.

---

MIT License
