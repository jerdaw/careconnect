---
status: stable
last_updated: 2026-01-15
owner: jer
tags: [governance, documentation, guidelines]
---

# Documentation Guidelines (Internal)

Keep documentation accurate, minimal, and easy to maintain.

## Canonical sources

- **Architecture & Logic**: `docs/architecture.md`
- **UI Components**: `docs/components.md`
- **Localization**: `docs/development/bilingual-guide.md` (Multi-lingual development guide)
- **Governance**: `docs/governance.md`
- **Data Enrichment**: `docs/governance/data-enrichment-sop.md` (Enrichment process)
- **Hooks & Utilities**: `docs/hooks.md`
- **Roadmap**: `docs/planning/roadmap.md` (Active Plan)
- **Historical Records**: `docs/planning/archive/` (Completed work)
- **AI Context**: `docs/llms.txt` (Generated via `npx tsx scripts/generate-llms-txt.ts`)

## Document Metadata (Frontmatter)

Formal documentation (ADRs, roadmaps, guides) should include YAML frontmatter to improve discoverability and status tracking.

- **Standard Fields**:
  - `status`: `draft` | `stable` | `deprecated` | `archived`
  - `last_updated`: `YYYY-MM-DD` (ISO 8601)
  - `owner`: Primary maintainer (GitHub username or team)
  - `tags`: Array of searchable keywords
- **Example**:

  ```yaml
  ---
  status: stable
  last_updated: 2026-01-15
  owner: jer
  tags: [search, backend, api]
  ---
  ```

## Advanced Features

- **Code Annotations**: Use `(1)` in code blocks and a numbered list below to create floating explanations.
- **Link Validation**: GitHub Actions run `Lychee` on every push. Verify external links before committing.
- **Visual Diagrams**: Use `mermaid` code blocks for architecture and sequence diagrams. Mermaid is supported natively via `pymdownx.superfences`.
- **API Documentation**: Use the `!openapi <path>` directive to render OpenAPI specs. The canonical reference is at `docs/api-reference.md`.
- **AI Readiness**: The `llms.txt` file is auto-generated in CI to provide a "single source of truth" for agents.

> [!IMPORTANT]
> [Highlight breaking changes, deployment requirements, or decisions needing approval]
>
> [!WARNING]
> [Call out compatibility issues or migration complexity]

## Writing for AI Consumption

To ensure documentation is effectively used by AI agents and LLMs:

- **Context-Rich Headings**: Use specific, descriptive titles (e.g., `## Supabase RLS Configuration` instead of `## Security`).
- **Explicit Cross-Links**: Use descriptive text for links and relative paths (e.g., `See [Bilingual Guide](../development/bilingual-guide.md)`).
- **Structured Code Blocks**: Always specify the language for syntax highlighting.
- **Decision Context**: Document the "why" behind technical choices, especially in ADRs.
- **Avoid Ambiguity**: Use explicit nouns instead of pronouns (this/it/that) when describing architecture or logic.

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

- `docs/planning/roadmap.md` is the high-level strategic plan.
- See detailed workflow in [`docs/development/roadmap-process.md`](docs/development/roadmap-process.md).
- When you start work, create a focused implementation plan under `docs/planning/` (e.g. `v10-0-feature-x.md`).
- When the work is done:
  1. Update canonical docs (`docs/architecture.md`, etc.) so the result is maintainable.
  2. Move the implementation plan into `docs/planning/archive/` following the naming convention `YYYY-MM-DD-vX-Y-{description}.md`.

## File Naming Conventions

- **Dates**: Always use ISO 8601 format (`YYYY-MM-DD`) for files containing dates (e.g., `2026-01-15-meeting-notes.md`).
- **Separators**: Use hyphens (`-`) rather than underscores or spaces.
- **Case**: Use lowercase for general documentation.
- **Templates**: Suffix template files with `-template.md` (e.g., `adr-template.md`).

## Naming and organization

- **Descriptive Filenames**: Use `runbook`, `checklist`, `guidelines`. Avoid vague names.
- **Roadmaps**: Put active plans in `docs/planning/`.
- **Archive**: Put completed plans in `docs/planning/archive/`.
- **Deployment**: `DEPLOY.md` (Root) or `docs/deployment/` (Future).
- **Development**: `AGENTS.md` (Root), `docs/development/bilingual-guide.md` (Multi-lingual guide), or `docs/development/` (Future).
