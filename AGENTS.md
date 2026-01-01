# AGENTS.md – kingston-care-connect

## Project Overview

- **Mission**: "The Semantic Bridge" for Kingston Social Services. A verified, governance-first search engine for food, crisis, and housing support in Kingston, ON.
- **Key Philosophy**: Manual Curation over Automatic Extraction. Top 150 High-Impact Services. Verified, Accessible, Identity-Aware.
- **Stack**:
  - **Framework**: Next.js 15 (App Router)
  - **Language**: TypeScript
  - **Styling**: Tailwind CSS v4 + Radix UI
    - Custom design system in `app/globals.css` (Glassmorphism, Semantic Surfaces).
    - Reusable primitives in `components/ui/**`.
  - **Database**: Supabase (PostgreSQL + Vector)
  - **AI/Embeddings**: @xenova/transformers (Client-side execution)
- **Primary Documentation**:
  - `README.md` → High-level overview and getting started.
  - `docs/architecture.md` → Detailed system architecture and data flow.
  - `docs/components.md` → Guide to reusable UI components.
  - `docs/acknowledgments.md` → Advisory board and governance.
  - `docs/roadmaps/archive/tier-1-implementation.md` → Tier 1 detail.
  - `docs/roadmaps/archive/tier-2-implementation.md` → Tier 2 detail.
  - `docs/roadmaps/archive/tier-3-implementation.md` → Tier 3 detail.

When in doubt about architecture or design design, **read `README.md` and `docs/**` first\*\*.

---

## Dev Environment & Commands

From the repo root:

- **Install deps**: `npm install`
- **Run dev server**: `npm run dev` (starts with Turbo; search & core features work without API keys)
- **Build**: `npm run build`
- **Lint/Check**: `npm run lint` and `npm run type-check`
- **Test**:
  - Unit/Integration: `npm test` (Vitest)
  - E2E: `npx playwright test`
- **Database**:
  - Validate verified data: `npm run validate-data` (checks `data/services.json`)
  - Migrate local data: `npx tsx scripts/migrate-data.ts`
  - Verify DB integrity: `npm run db:verify`
- **Maintenance & Quality**:
  - Bilingual Content Audit: `npm run bilingual-check`
  - i18n Key Audit: `npm run i18n-audit`
  - URL Health Check: `npm run health-check`
  - Phone Validation: `npm run phone-validate`

**Environment Variables** (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Public key for client-side auth/reads.
- `SUPABASE_SECRET_KEY`: Service role key (used **only** in migration scripts/backend tools).
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`: For phone validation scripts.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`: For push notifications.
- `OPENAI_API_KEY`: Optional, for AI features if enabled.

**Expectations when you change code:**

- For non-trivial changes, run `npm run lint` and `npm run type-check`.
- If you add new behavior, add/update tests (Vitest for logic/components, Playwright for critical flows).

---

## Git Workflow (Commits & Pushes)

When you have full access (and `origin` is configured), **make regular best-practice commits and pushes as you go**.

- **Commits**: Small, logically grouped. Use conventional commits (e.g., `fix: ...`, `feat: ...`, `docs: ...`).
- **Safety**: Never commit secrets, `.env` files, or machine-specific artifacts.
- **Hygiene**: Update `.gitignore` if you introduce new generated files.

---

## Architecture & Data Flow

- **Frontend-First Search**: Core search and filtering often happen client-side or via optimized vector search.
- **Supabase Integration**:
  - Used for Partner Portal, Login, Analytics, and Vector Search.
  - Local development uses `.env.local` keys.
  - Migration scripts (`scripts/migrate-data.ts`) handle data population.
- **Push Notifications**:
  - Web Push API integrated via `lib/notifications/push-manager.ts`.
  - Subscriptions stored in `push_subscriptions` table.
- **Partner Portal**:
  - Self-service dashboard at `/dashboard`.
  - Organization-based RBAC via `organization_members`.
- **Local Data**:
  - The "Top 150" verified records are mastered in `data/services.json`.
  - **Manual Curation** means data quality is paramount.
- **Validation**:
  - Use `scripts/validate-data.ts` to ensure JSON integrity.

---

## Code Style & Conventions

- **Modern Web Design**:
  - Use "Glassmorphism" utilities from `globals.css` (`.glass`, `.glass-card`, `.glass-panel`).
  - Use semantic colors (`--color-primary-*`, `--surface-*`).
  - Typography: `heading-display`, `heading-1`, `heading-2` (from `globals.css`).
- **Tailwind v4**:
  - Use the new v4 engine.
  - Prefer standard utilities for layout (`flex`, `grid`, `gap-*`).
- **Components**:
  - **Layout**: Use `components/layout/Header.tsx`, `Footer.tsx` for shell consistency.
  - **UI Primitives**: Use `components/ui/**` (e.g., `button.tsx`, `card.tsx`, `badge.tsx`) instead of raw HTML.
  - **Complex Components**: Reference `ServiceCard.tsx` and `AnalyticsCard.tsx` as examples of data-rich components.
- **React/Next.js**:
  - Use Server Components by default. Add `"use client"` only when interactivity is needed.
  - Use `lucide-react` for icons.

---

## Localization (Bilingual)

- **Policy**: English-First, but **design for bilingual support**.
- **Rules** (see `bilingual-dev-guide.md`):
  - No hardcoded strings for user-facing text (use props or dictionaries).
  - Ensure layouts accommodate text expansion (French is often 20% longer).
  - Dates and currencies must be localized.

---

## Testing Expectations

- **Vitest**: Use for utility functions, hooks, and component logic.
- **Playwright**: Use for critical user flows (Search, Navigation, Partner Login).
- **CI**: GitHub Actions will run checks. Keep them passing.

---

## Safety Rails / Governance

- **Independence**: Do not imply official government affiliation.
- **Privacy**: No cookies using `localStorage`, no tracking for public search.
- **Emergency**: Explicit "Call 911" badges for crisis services.
- **Governance**: Refer to `docs/governance.md` for decision-making protocols.

---
