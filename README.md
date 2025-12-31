# Kingston Care Connect 🇨🇦

> **The "Semantic Bridge" for Kingston Social Services.**
> A verified, governance-first search engine for food, crisis, and housing support in Kingston, ON.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status: Pilot](https://img.shields.io/badge/Status-Pilot-orange.svg)

## 🎯 The Mission: "The Kingston 150"

Scraping 60,000 messy records helps no one. **Kingston Care Connect** takes a different approach: **Manual Curation over Automatic Extraction.**

We maintain a strict, hand-verified dataset of the **Top 150 High-Impact Services** for Kingston residents, ensuring that every result is:

1.  **Verified** (No broken links or dead numbers).
2.  **Accessible** (Clear eligibility criteria).
3.  **Identity-Aware** (Evidence-backed safety tags).

---

## 🚀 New Features (v4.1)

- **Advanced Search Intelligence**:
  - **Synonym Expansion**: Searches for "hungry" find food banks; "rent" finds eviction prevention.
  - **"Open Now" Filter**: Real-time filtering based on structured operating hours.
  - **Privacy-First Analytics**: Anonymously tracks unmet needs (Zero-Result patterns) without logging queries.
  - **Crisis Detection**: Instant boosting of emergency services for high-risk queries.
- **Decentralized AI Assistant**:
  - **Client-Side RAG**: Runs a local LLM (Phi-3) directly in the browser via WebGPU.
  - **Zero-Knowledge**: Voice and text queries never leave the device.
  - **Offline Vector Store**: Instant semantic search even without internet.
- **Bilingual Ready**: Full support for English and French content switching.
- **Global Deployment**: Specialized Crisis Mode instantly boosts emergency services.

---

- **🧠 Semantic & Fuzzy Search:** Multi-layered search experience. Type natural language like "I feel unsafe" (Semantic) or fix typos like "fod" (Fuzzy).
- **🔒 Privacy-First:** No cookies, no tracking, and no search logs. All inference happens in your browser or anonymously.
- **📄 Internal Detail Pages:** High-resolution public service pages with rich metadata, contact info, and localized content.
- **💼 Partner Claiming:** Built-in workflow for local organizations to claim, verify, and maintain their listings.
- **📱 Installable App (PWA):** Works offline and can be installed on your home screen.
- **🗣️ Community Governance:** Built-in feedback loops allow residents to flag incorrect data instantly.
- **⚡ Zero-Latency:** Optimized for instant loads even on poor data connections.

---

## 🛠️ Tech Stack

Built with modern web technologies for performance and maintainability:

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/)
- **AI/Embeddings:** [@xenova/transformers](https://huggingface.co/docs/transformers.js/) (Client-side execution)
- **Testing:** [Vitest](https://vitest.dev/) (Unit/Integration), [Playwright](https://playwright.dev/) (E2E)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL + Vector)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/jerdaw/kingston-care-connect.git
    cd kingston-care-connect
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

| Command                  | Purpose                                  |
| :----------------------- | :--------------------------------------- |
| `npm run dev`            | Starts development server with Turbo     |
| `npm run build`          | Builds the production application        |
| `npm test`               | Runs unit and integration tests (Vitest) |
| `npx playwright test`    | Runs end-to-end tests                    |
| `npm run type-check`     | Runs TypeScript compiler check           |
| `npm run lint`           | Runs ESLint for code quality             |
| `npm run health-check`   | Validates all service URLs (automated)   |
| `npm run phone-validate` | Validates phone numbers (Twilio)         |
| `npm run analyze`        | Analyzes production bundle size          |

### Environment Variables

Copy `.env.example` to `.env.local` for standard setup.
Note: Search and core features work without API keys. Database features require Supabase keys.

### Partner Platform Setup (Supabase)

To enable the Partner Portal, Login, and Analytics:

1.  **Create a Supabase Project:** [database.new](https://database.new)
2.  **Add Credentials:** Update `.env.local` with:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
    SUPABASE_SECRET_KEY=your-secret-key # For migration scripts only
    ```
3.  **Run Schema:** Copy `supabase/schema.sql` and run it in the Supabase SQL Editor.
4.  **Migrate Data:** Run the migration script to populate the DB with local data:
    ```bash
    npx tsx scripts/migrate-data.ts
    ```

---

## 🤝 Contributing & Governance

This project is community-led. We prioritize safety and accuracy over quantity.

- **[Roadmap](docs/roadmaps/roadmap.md):** Current status and action items.
- **[Documentation Guidelines](docs/documentation-guidelines.md):** How we write and maintain docs.
- **[Testing Guidelines](docs/development/testing.md):** Our testing standards.
- **[Bilingual Guide](bilingual-dev-guide.md):** Our approach to English/French support.

### Adding a Service

To propose a new service, please ensure it meets our "High Impact" criteria:

- Must physically serve the Kingston, ON area.
- Must have a verifiable phone number or physical address.
- Must be free or low-cost (subsidized).

---

_Built with ❤️ for Kingston._
