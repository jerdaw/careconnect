# Kingston Care Connect

> A verified, governance-first search engine for social services in Kingston, Ontario—covering food security, crisis intervention, and housing support.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status: Pilot](https://img.shields.io/badge/Status-Pilot-orange.svg)
![Coverage](https://img.shields.io/badge/Coverage-65%25-yellow.svg)

## The Kingston 150

Large-scale scraping of municipal data produces noise, not value. Kingston Care Connect takes a different path: **manual curation over automated extraction**.

We maintain a hand-verified dataset of the **150 highest-impact services** available to Kingston residents. Every entry is:

- **Verified** — No broken links or disconnected phone numbers.
- **Accessible** — Clear eligibility requirements.
- **Identity-Aware** — Evidence-backed safety tags for vulnerable populations.

---

## Current Features (v10.1)

### Search Intelligence

- **Synonym Expansion**: "Hungry" returns food banks; "rent" surfaces eviction prevention resources.
- **Open Now Filter**: Real-time availability based on structured operating hours.
- **Privacy-First Analytics**: Tracks unmet needs through zero-result patterns without logging queries.
- **Crisis Detection**: Automatically boosts emergency services when high-risk language is detected.
- **Map Integration**: Embedded Google Maps on service detail pages for location context.

### Decentralized AI Assistant

- **Client-Side RAG**: Runs a local LLM (Phi-3) directly in the browser via WebGPU.
- **Zero-Knowledge Architecture**: Voice and text queries never leave the device.
- **Offline Vector Store**: Semantic search works without an internet connection.

### Additional Capabilities

- **89 Verified Services** — Hand-curated Kingston services across 12 categories.
- **Semantic and Fuzzy Search** — Natural language queries ("I feel unsafe") and typo correction ("fod" → "food").
- **Privacy by Design** — No cookies, no tracking, no search logging. All inference runs in-browser or anonymously.
- **Service Detail Pages** — Rich metadata, contact information, and localized content for each listing.
- **Partner Claiming Workflow** — Organizations can claim, verify, and maintain their own listings.
- **Progressive Web App** — Installable, works offline.
- **WCAG 2.1 AA Compliant** — High-contrast, skip-links, and keyboard navigation.
- **Community Governance** — Residents can flag inaccurate data directly.
- **Performance Optimized** — Loads instantly, even on slow connections.
- **Bilingual Support** — Full English and French content switching.
- **Multi-Lingual UI** — Arabic, Simplified Chinese, and Spanish interface translations.
- **Indigenous Health Services** — Dedicated filters and culturally safe tags.
- **Land Acknowledgment** — Respecting the traditional lands of Kingston (Katarokwi).
- **Provincial Crisis Lines** — 16 Ontario-wide crisis services (988, ConnexOntario, Kids Help Phone, etc.).

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
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Scripts

| Command                   | Description                             |
| :------------------------ | :-------------------------------------- |
| `npm run dev`             | Start development server (Turbo)        |
| `npm run build`           | Build for production                    |
| `npm test`                | Run unit and integration tests (Vitest) |
| `npx playwright test`     | Run end-to-end tests                    |
| `npm run type-check`      | TypeScript compiler check               |
| `npm run lint`            | ESLint code quality check               |
| `npm run health-check`    | Validate all service URLs               |
| `npm run phone-validate`  | Validate phone numbers (Twilio)         |
| `npm run validate-data`   | Validate data schema (Zod)              |
| `npm run check-staleness` | Check for stale/unverified data         |
| `npm run analyze`         | Analyze production bundle size          |

### Environment Variables

Copy `.env.example` to `.env.local`. Core search functionality works without API keys; database features require Supabase credentials.

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

- [Roadmap](docs/roadmaps/roadmap.md)
- [Documentation Guidelines](docs/documentation-guidelines.md)
- [Testing Standards](docs/development/testing.md)
- [Bilingual Development Guide](bilingual-dev-guide.md)
- [Acknowledgments & Governance](docs/acknowledgments.md)

### Adding a Service

Proposed services must meet these criteria:

- Serves the Kingston, Ontario area.
- Has a verifiable phone number or physical address.
- Free or subsidized.

---

MIT License
