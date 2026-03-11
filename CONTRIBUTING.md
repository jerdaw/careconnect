# Contributing to HelpBridge

Welcome! This guide will help you get up and running with the HelpBridge codebase.

## Quick Start Checklist

- [ ] **Prerequisites**: Node.js 22+, npm 10+
- [ ] **Clone & Install**: `git clone` → `cd helpbridge-ca` → `npm install`
- [ ] **Environment Setup**: Copy `.env.example` to `.env.local` (core features work without Supabase)
- [ ] **Start Dev Server**: `npm run dev` → Open [http://localhost:3000](http://localhost:3000)
- [ ] **Run Tests**: `npm test` (should see 895+ passing tests)
- [ ] **Type Check**: `npm run type-check` (should pass with zero errors)
- [ ] **Read CLAUDE.md**: Understand project goals, architecture, and boundaries

## Project Philosophy

HelpBridge is a **governance-first, manually curated** social services search engine. Key principles:

1. **Data Integrity Over Speed** – No auto-scraping. Every service is manually verified.
2. **Privacy by Design** – Search queries stay on-device by default. Zero tracking.
3. **Accessibility First** – WCAG 2.1 AA compliance. Keyboard nav + screen reader support.
4. **Verify Before Modifying** – Read existing code patterns before making changes.

See [CLAUDE.md](CLAUDE.md) for complete development guidelines.

## Architecture Overview

### Tech Stack

| Layer        | Technology                          | Version |
| ------------ | ----------------------------------- | ------- |
| Framework    | Next.js (App Router)                | 15.x    |
| Language     | TypeScript (strict mode)            | 5.x     |
| Runtime      | Node.js                             | 22+     |
| Styling      | Tailwind CSS v4 + Radix UI          | —       |
| Database     | Supabase (PostgreSQL + pgvector)    | —       |
| Embeddings   | @xenova/transformers (MiniLM-L6-v2) | —       |
| On-device AI | WebLLM (Llama-3.2-1B)               | —       |
| Testing      | Vitest + Playwright                 | —       |

### Key Directories

```
helpbridge-ca/
├── app/                    # Next.js 15 App Router
│   ├── [locale]/          # Multi-language routes (7 locales)
│   ├── api/               # API routes (search, feedback, admin)
│   └── worker.ts          # Service Worker for offline support
├── components/            # React components
│   ├── ui/               # Radix UI primitives (button, card, etc.)
│   ├── search/           # Search interface components
│   ├── layout/           # Header, Footer, LanguageSwitcher
│   └── ai/               # WebLLM chat assistant
├── lib/                  # Core business logic
│   ├── search/          # Search engine (scoring, synonyms, geo, crisis)
│   ├── ai/              # WebLLM engine + query expander
│   ├── auth/            # Authorization helpers (RBAC, assertions)
│   ├── eligibility/     # Identity-aware eligibility matching
│   ├── resilience/      # Circuit breaker, telemetry
│   └── offline/         # IndexedDB, sync, status
├── hooks/                # React hooks (useRBAC, useServices, useAI)
├── data/                 # Service directory (services.json, embeddings.json)
├── tests/                # Vitest unit/integration tests
├── tests/e2e/            # Playwright end-to-end tests
├── public/               # Static assets
├── i18n/                 # Translation files (7 locales)
├── docs/                 # Documentation (guides, ADRs, runbooks)
└── scripts/              # Utility scripts (validation, migration, geocoding)
```

### Critical Files to Understand

| File                                              | Purpose                                      |
| ------------------------------------------------- | -------------------------------------------- |
| **CLAUDE.md**                                     | AI agent instructions (read first!)          |
| **lib/search/index.ts**                           | Main search engine entry point               |
| **lib/search/scoring.ts**                         | Search result ranking algorithm              |
| **app/api/v1/search/services/route.ts**           | Server-side search API                       |
| **components/search/SearchInterface.tsx**         | Primary search UI                            |
| **lib/auth/authorization.ts**                     | Centralized authorization helpers            |
| **lib/rbac.ts**                                   | Role-based access control matrix             |
| **types/service.ts**                              | Service data schema                          |
| **middleware.ts**                                 | Next.js middleware (auth, locale, CSP)       |
| **lib/resilience/supabase-breaker.ts**            | Circuit breaker for database failures        |
| **vitest.config.mts**                             | Test configuration + coverage thresholds     |
| **docs/architecture.md**                          | System architecture deep-dive                |
| **docs/implementation/v20-0-\*.md**               | Current implementation plan                  |
| **docs/planning/roadmap.md**                      | Product roadmap (15/38 v20.0 items complete) |
| **docs/development/testing-guidelines.md**        | Testing strategy and expectations            |
| **docs/workflows/french-translation-workflow.md** | i18n translation process                     |

## Development Workflow

### 1. Making Changes

```bash
# Create a feature branch (optional)
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Run quality checks locally
npm run type-check      # TypeScript validation
npm run lint            # ESLint
npm test                # Unit tests
npm run test:e2e:local  # E2E tests (Chromium only)
```

### 2. Pre-Commit Hooks

Husky automatically runs these checks before commits:

- **Linting**: ESLint with auto-fix
- **Type Checking**: TypeScript compiler
- **Related Tests**: Vitest runs tests for changed files
- **Formatting**: Prettier validation

If hooks fail, fix the issues and try again. **Never use `--no-verify`** unless absolutely necessary.

### 3. Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

<body>
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`

**Examples**:

```
feat(search): add proximity scoring for location-based results

test: add comprehensive tests for update-request API route

docs: update roadmap and plan for B2 completion
```

### 4. Pull Requests

1. Ensure all tests pass: `npm run ci:check`
2. Update documentation if needed
3. Create PR with clear description
4. Link related issues/tasks

## Testing Expectations

### Coverage Requirements

| Path                     | Threshold | Current |
| ------------------------ | --------- | ------- |
| **lib/search/\*\***      | 65%       | ~75%    |
| **lib/eligibility/\*\*** | 95%       | ~95%    |
| **lib/ai/\*\***          | 65%       | ~85%    |
| **hooks/\*\***           | 75%       | ~85%    |
| **Global**               | 75%       | ~53%    |

**Note**: Global coverage will reach 75% after v20.0 Phase 2 (component tests) is complete.

### Testing Strategy

We use a **pragmatic tiered testing strategy**:

| Tier          | Scope                         | CI Behavior   |
| ------------- | ----------------------------- | ------------- |
| **Critical**  | Data integrity, API contracts | Block merge   |
| **Core Flow** | Crisis, Accessibility         | Block merge   |
| **Polish**    | UI interactions               | Skip if flaky |

See [docs/development/testing-guidelines.md](docs/development/testing-guidelines.md) for details.

### Running Tests

```bash
# Unit tests
npm test                    # All tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report

# E2E tests
npm run test:e2e:local      # Chromium only (fast)
npm run test:e2e            # All browsers

# Accessibility
npm run test:a11y           # Axe-core audit

# Load testing
npm run test:load           # k6 load test (realistic traffic)
npm run test:load:smoke     # Basic connectivity
```

### Writing Tests

**Unit tests** (Vitest):

- Location: `tests/` directory, mirroring source structure
- File naming: `*.test.ts` or `*.spec.ts`
- Focus: Business logic, utilities, hooks

**API tests** (Vitest):

- Location: `tests/api/`
- Mock Supabase SSR client via `@supabase/ssr`
- Test auth, validation, error handling

**E2E tests** (Playwright):

- Location: `tests/e2e/`
- Test critical user journeys
- Non-blocking in CI (see ADR-015)

**Example unit test**:

```typescript
import { describe, it, expect } from "vitest"
import { calculateProximity } from "@/lib/search/geo"

describe("calculateProximity", () => {
  it("calculates distance between two coordinates", () => {
    const result = calculateProximity(
      { lat: 44.2312, lng: -76.486 }, // Kingston City Hall
      { lat: 44.2605, lng: -76.5319 } // Queen's University
    )
    expect(result.distance).toBeCloseTo(5.2, 1) // ~5.2 km
  })
})
```

## Data Management

### Service Directory

Services are stored in `data/services.json` (~196 services). **This is manually curated data** – never auto-generate or fabricate service information.

### Data Validation

```bash
npm run validate-data      # Zod schema validation
npm run db:verify          # Database integrity check
npm run audit:data         # Completeness audit
npm run health-check       # URL validation
npm run phone-validate     # Phone number validation (requires Twilio)
```

### Modifying Service Data

```bash
# 1. Edit data/services.json (manual curation only!)

# 2. Validate the schema
npm run validate-data

# 3. Rebuild to regenerate embeddings
npm run build

# 4. Verify search still works
npm run tools:search "food bank"
```

### Verification Levels

Services have governance tiers:

- **L0**: Unverified (filtered out of search)
- **L1**: Basic verification (existence confirmed)
- **L2**: Vetted (contact made)
- **L3**: Provider confirmed (official partnership)

Search scoring applies multipliers: L3 = 1.5x, L2 = 1.2x, L1 = 1.0x

## Code Style & Conventions

### TypeScript

- **Strict mode enabled** (`noUncheckedIndexedAccess: true`)
- Avoid `any` – use proper types or `unknown`
- Use `@/` path alias (maps to project root)

### React

- **Server Components by default**
- Add `"use client"` only when interactivity needed
- Functional components with hooks (no classes)
- Use `lucide-react` for icons

### Logging

```typescript
import { logger } from "@/lib/logger"

// ❌ Don't use console.log
console.log("User searched for food banks")

// ✅ Use structured logging
logger.info("Search performed", {
  query: "food banks",
  resultCount: 12,
  component: "SearchInterface",
})
```

### Design System

- **Glassmorphism utilities**: `.glass`, `.glass-card`, `.glass-panel` (see `globals.css`)
- **Semantic colors**: `--color-primary-*`, `--surface-*`
- **Typography**: `heading-display`, `heading-1`, `heading-2`
- **Conditional classes**: Use `cn()` helper from `lib/utils.ts`

### Linting & Formatting

- **ESLint**: Zero-warning policy
- **Prettier**: With Tailwind plugin
- Run: `npm run lint` and `npm run format`

## Common Pitfalls

| Symptom                     | Likely Cause          | Fix                                        |
| --------------------------- | --------------------- | ------------------------------------------ |
| WebLLM fails to load        | No WebGPU support     | Check `navigator.gpu`; fails gracefully    |
| Search returns nothing      | L0 services filtered  | Check `verification_level` ≥ L1            |
| Embeddings don't match data | Stale after data edit | Run `npm run build`                        |
| Supabase connection fails   | Missing credentials   | App falls back to JSON; check `.env.local` |
| Missing translations        | New strings added     | Run `npm run i18n-audit`                   |
| Type errors on service data | Schema mismatch       | Run `npm run validate-data`                |

## Important Boundaries

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
- Skip pre-commit hooks (`--no-verify`) without good reason

## Adding Search Synonyms

The search system uses synonym expansion to improve query matching. To add new synonyms:

### 1. Edit the Synonyms Dictionary

Location: `lib/search/synonyms.ts`

```typescript
export const SYNONYMS: Record<string, string[]> = {
  // Add your new root word with its synonyms
  newterm: ["synonym1", "synonym2", "french_équivalent"],
}
```

### 2. Guidelines

- **Include French terms** for all entries where applicable
- **Add common misspellings** (e.g., "fod" for "food")
- **Include abbreviations** (e.g., "er" for "emergency")
- **Test before committing**: `npm run tools:search "your query"`

### 3. When to Add Synonyms

- When analytics show zero-result queries
- When user feedback indicates search gaps
- When adding new service categories

## Documentation

### Key Documentation Locations

- **[docs/architecture.md](docs/architecture.md)**: System architecture and design decisions
- **[docs/development/](docs/development/)**: Development guides (bilingual, components, hooks, testing)
- **[docs/api/openapi.yaml](docs/api/openapi.yaml)**: OpenAPI 3.0 specification
- **[docs/adr/](docs/adr/)**: Architecture Decision Records
- **[docs/runbooks/](docs/runbooks/)**: Operational runbooks (circuit breaker, high error rate, slow queries)
- **[docs/planning/roadmap.md](docs/planning/roadmap.md)**: Product roadmap
- **[docs/implementation/](docs/implementation/)**: Implementation plans
- **[docs/workflows/](docs/workflows/)**: Process workflows (French translation, etc.)

### Contributing to Documentation

- **Documentation lives in `docs/`**: Use Markdown format
- **Keep CLAUDE.md updated**: When adding new patterns or boundaries
- **Update roadmap.md**: When completing tasks
- **Add ADRs**: For significant architectural decisions
- **Write runbooks**: For operational procedures

## Getting Help

- **Questions about codebase?** Check [docs/architecture.md](docs/architecture.md) or ask in project chat
- **Found a bug?** Create an issue with reproduction steps
- **Need clarification?** Comment on the relevant PR or issue
- **Want feedback?** Create a draft PR early and request review

## Additional Resources

- **[CLAUDE.md](CLAUDE.md)**: Complete AI agent development guidelines
- **[README.md](README.md)**: Project overview and features
- **[docs/llms.txt](docs/llms.txt)**: Consolidated context for AI agents
- **[docs/development/testing-guidelines.md](docs/development/testing-guidelines.md)**: Testing strategy deep-dive
- **[docs/workflows/french-translation-workflow.md](docs/workflows/french-translation-workflow.md)**: i18n translation process
- **[docs/governance/standards.md](docs/governance/standards.md)**: Decision protocols

---

## Current Development Status

**v20.0: Technical Excellence & Testing** (IN PROGRESS)

- **Completion**: 15/38 items done
- **Focus**: Achieving 75% test coverage, reducing technical debt, improving documentation
- **See**: [docs/planning/roadmap.md](docs/planning/roadmap.md) and [docs/implementation/v20-0-phase-1-implementation-plan.md](docs/implementation/v20-0-phase-1-implementation-plan.md)

Recent completions:

- ✅ A1-A6: Code quality improvements (console.log → logger, ESLint reduction, validation hardening)
- ✅ B1-B3: Core test coverage (search utilities, hooks, API routes)
- ✅ C1, C3-C4: i18n and search enrichment
- ✅ D1: Documentation templates
- ✅ E1: Git tags for milestones

---

**Welcome to the team! 🎉**

If you have questions or suggestions for improving this guide, please open an issue or submit a PR.
