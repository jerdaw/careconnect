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

## ✨ Features

-   **🧠 Semantic Search:** Type "I feel unsafe" instead of guessing keywords like "Shelter Intake." We use local embeddings to understand intent.
-   **🔒 Privacy-First:** No cookies, no tracking, and no search logs. All inference happens in your browser or anonymously.
-   **📱 Installable App (PWA):** Works offline and can be installed on your home screen.
-   **🗣️ Community Governance:** Built-in feedback loops allow residents to flag incorrect data instantly.
-   **⚡ Zero-Latency:** optimized for instant loads even on poor data connections.

---

## 🛠️ Tech Stack

Built with modern web technologies for performance and maintainability:

-   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
-   **Language:** TypeScript
-   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
-   **UI Components:** [Radix UI](https://www.radix-ui.com/)
-   **AI/Embeddings:** [@xenova/transformers](https://huggingface.co/docs/transformers.js/) (Client-side execution)
-   **Testing:** Vitest

---

## 🚀 Getting Started

### Prerequisites

-   Node.js 20+
-   npm 10+

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

### Environment Variables

Copy `.env.example` to `.env.local` (if applicable) for standard setup.
Note: Client-side features work without API keys. Data generation scripts may require an `OPENAI_API_KEY`.

---

## 🤝 Contributing & Governance

This project is community-led. We prioritize safety and accuracy over quantity.

-   **[Documentation Guidelines](documentation-guidelines.md):** How we write and maintain docs.
-   **[Testing Guidelines](testing-guidelines.md):** Our testing standards.
-   **[Bilingual Guide](bilingual-dev-guide.md):** Our approach to English/French support.

### Adding a Service
To propose a new service, please ensure it meets our "High Impact" criteria:
-   Must physically serve the Kingston, ON area.
-   Must have a verifiable phone number or physical address.
-   Must be free or low-cost (subsidized).

---

*Built with ❤️ for Kingston.*
