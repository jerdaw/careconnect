# Documentation Guidelines (Internal)

Keep documentation accurate, minimal, and easy to maintain.

## Canonical sources

- **Architecture & Logic**: `docs/architecture.md`
- **UI Components**: `docs/components.md`
- **Localization**: `docs/bilingual-dev-guide.md` (Multi-lingual development guide)
- **Governance**: `docs/governance.md`
- **Hooks & Utilities**: `docs/hooks.md`
- **Roadmap**: `docs/roadmaps/roadmap.md` (Active Plan)
- **Historical Records**: `docs/roadmaps/archive/` (Completed work)
- **AI Context**: `docs/llms.txt` (Generated via `npx tsx scripts/generate-llms-txt.ts`)

## Advanced Features

- **Code Annotations**: Use `(1)` in code blocks and a numbered list below to create floating explanations.
- **Link Validation**: GitHub Actions run `Lychee` on every push. Verify external links before committing.
- **Visual Diagrams**: Use `mermaid` code blocks for architecture and sequence diagrams. Mermaid is supported natively via `pymdownx.superfences`.
- **API Documentation**: Use the `!openapi <path>` directive to render OpenAPI specs. The canonical reference is at `docs/api-reference.md`.
- **AI Readiness**: The `llms.txt` file is auto-generated in CI to provide a "single source of truth" for agents.

## When adding or changing docs

- **Prefer one canonical source**. Use pointers elsewhere instead of copying text.
- **Keep docs close to the code** they describe.
- **Update the index**: Update `mkdocs.yml` nav if you add new pages. `README.md` and `AGENTS.md` should point to the MkDocs site URL where appropriate.
- **English-Only**: Internal documentation should be English-only.
- **No Phase Labels**: Avoid "phase" labels in permanent docs. Documentation should describe **what exists and how to use it**, not the order it was implemented.
- **Public-Safe**: No secrets, private emails, or internal IPs in public repos.
- **Professional Emojis Only**: Use only professional symbols (e.g., ✅, ❌, ⚠️, ➡️, ⭐) for status and alerts. Avoid playful or conversational emojis.

## Roadmap workflow

This project separates **backlog** vs **implementation plans** vs **canonical docs** to reduce drift.

- `docs/roadmaps/roadmap.md` is the high-level strategic plan.
- See detailed workflow in [`docs/development/roadmap-process.md`](docs/development/roadmap-process.md).
- When you start work, create a focused implementation plan under `docs/roadmaps/` (e.g. `v10-0-feature-x.md`).
- When the work is done:
  1. Update canonical docs (`docs/architecture.md`, etc.) so the result is maintainable.
  2. Move the implementation plan into `docs/roadmaps/archive/` following the naming convention `YYYY-MM-DD-vX-Y-{description}.md`.

## Naming and organization

- **Descriptive Filenames**: Use `runbook`, `checklist`, `guidelines`. Avoid vague names.
- **Roadmaps**: Put active plans in `docs/roadmaps/`.
- **Archive**: Put completed plans in `docs/roadmaps/archive/`.
- **Deployment**: `DEPLOY.md` (Root) or `docs/deployment/` (Future).
- **Development**: `AGENTS.md` (Root), `bilingual-dev-guide.md` (Multi-lingual guide), or `docs/development/` (Future).
