# Tier 5 Implementation Plan: Multi-Lingual & Provincial Services

## Goal

Extend the Kingston Care Connect platform to:

1.  **Multi-Lingual Translation**: UI support for Arabic, Chinese (Simplified), and Spanish in addition to EN/FR.
2.  **Provincial Crisis Lines**: 16 Ontario-wide crisis services.

**Status**: Completed
**Date**: 2026-01-01

---

## Design Decisions

### Language Selection (EDIA Focus)

- English (`en`) - Official
- French (`fr`) - Official
- Arabic (`ar`) - SWANA community
- Simplified Chinese (`zh-Hans`) - East Asian community
- Spanish (`es`) - Latinx community

### Translation Strategy

- **Static files** for privacy and reliability
- **UI Chrome only** (labels, buttons, ARIA) for non-EN/FR languages
- **Provincial crisis lines** have full multi-lingual content

---

## Implementation Summary

1. Created `messages/ar.json`, `messages/zh-Hans.json`, `messages/es.json`
2. Added `LanguageSelector` component to Header
3. Updated `i18n/request.ts` for 5 locales
4. Imported 16 provincial crisis lines via `scripts/import/provincial-crisis.ts`
5. Added `is_provincial` flag to schema

## Verification

- All 80 services validated
- 201 unit tests passed
- TypeScript type-check passed
- Committed with 22 files changed
