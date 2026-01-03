# v10.1: UI Polish & Data Expansion

**Status:** Completed
**Date:** 2026-01-02

## 1. Feature: Map Integration

A new map feature has been added to the **Service Details** page to improve spatial context for users.

**Implementation:**

- **Location:** `app/[locale]/service/[id]/page.tsx`
- **Details:** Embedded Google Maps `iframe` within the "Contact Information" card.
- **Behavior:** Conditionally renders only when an address is available.
- **Styling:** Custom grayscale filter (dark mode compatible) for a premium look.

## 2. Feature: UI Polish (Submit Service & Partners)

Major visual upgrades to align with the application's design system.

**Submit Service Page:**

- **Location:** `app/[locale]/submit-service/page.tsx`
- **Changes:** Refactored to use `Card`, `Section`, and styled `Input` components. Added proper loading states and success animations.

**Partners Page:**

- **Location:** `app/[locale]/about/partners/page.tsx`
- **Changes:** Replaced dynamic Tailwind classes with clean SVG logos. Added a "Become a Partner" CTA section.
- **Assets:** Added placeholder SVGs for key partners (City of Kingston, United Way, etc.).

## 3. Data Expansion (88 Services)

The core database has been expanded, covering critical gaps in mental health, housing, and social services.

**New Categories & Coverage:**

- **Crisis:** 23 services (Added: 988 Suicide Crisis Helpline, AMHS-KFLA Napanee Line)
- **Health:** 14 services
- **Housing:** 8 services
- **Food:** 11 services
- **Seniors:** 8 Services
- **Indigenous:** 3 Services
- **Legal:** 2 Services
- **Immigration:** 2 Services

**Data Governance:**

- **Provenance:** All new records include `verified_by`, `verified_at`, and `method` fields.
- **Audit:** Automated script (`scripts/qa-audit.ts`) confirms 0 errors and valid unique IDs.

## 4. Automated QA

A new Quality Assurance script has been added to ensure data integrity.

- **Script:** `scripts/qa-audit.ts`
- **Checks:**
  - Duplicate IDs
  - Missing required fields
  - Valid Enum values
  - Presence of contact info
