# Roadmap Process

This document outlines the workflow for managing the Kingston Care Connect roadmap, ensuring we maintain a high-level strategic view while tracking detailed implementation steps.

## Workflow Overview

1.  **Plan** (Broad)
2.  **Define** (Specific)
3.  **Implement** (Action)
4.  **Archive** (History)

## 1. Plan: `roadmap.md`

- **Purpose**: High-level strategic planning.
- **Location**: `docs/roadmaps/roadmap.md`
- **Action**: Update this file with new tiers, broad goals, and prioritized milestones.
- **Format**: High-level bullet points, tables for prioritization, and "Future Horizons".

## 2. Define: Tier Definition Documents

- **Purpose**: detailed implementation planning for a specific roadmap item or tier.
- **Location**: `docs/roadmaps/{description}.md` (initially)
- **Naming**: Use kebab-case for the description (e.g., `v9-0-multi-lingual.md` or `v7-0-user-feedback.md`).
- **Content**:
  - **Goal**: What are we building?
  - **Design Decisions**: Key technical or product choices.
  - **Implementation Checklists**: Detailed steps.
  - **Verification Plan**: How we know it's done.

## 3. Implement

- Execute the work defined in the Tier Definition Document.
- Check off items in the document as they are completed.
- Update `docs/roadmaps/roadmap.md` status if major milestones are reached.

## 4. Archive

- **Purpose**: Keep the active `roadmap.md` clean and preserve project history.
- **When**: When a Tier or major feature set is **Completed**.
- **Action**:
  1.  Move the definition document to `docs/roadmaps/archive/`.
  2.  **Rename** the file prepending the completion date: `YYYY-MM-DD-{original-name}.md`.
      - **Format**: `YYYY-MM-DD-vX-Y-kebab-cased-description.md`
      - **Example**: `2026-01-01-v9-0-multi-lingual.md`
      - **Note**: Keep archive files grouped by their original Roadmap Version. Do not split them into tiny per-feature files unless they are pure architectural references (which should go in `docs/architecture/`).
  3.  Update `docs/roadmaps/roadmap.md`:
      - Remove the detailed checklists for the completed item.
      - Add a brief summary line to "Current State" or a "Completed" section.
      - Ensure a link to the archives is present.

## Naming Convention Summary

| Type            | Path                                         | Example                              |
| :-------------- | :------------------------------------------- | :----------------------------------- |
| **Active Plan** | `docs/roadmaps/roadmap.md`                   | `roadmap.md`                         |
| **Active Tier** | `docs/roadmaps/{name}.md`                    | `v7-0-api-integration.md`            |
| **Archived**    | `docs/roadmaps/archive/YYYY-MM-DD-{name}.md` | `2026-02-15-v7-0-api-integration.md` |
