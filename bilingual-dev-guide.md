# Bilingual Development Guide (English / French)

**Goal:** All public-facing interfaces must support English (`en`) and French (`fr`) to comply with Canadian accessibility standards.

## 1. Architecture

- **Strategy:** "Separation of Content". Hardcoded strings in `tsx` files are **prohibited**.
- **Library:** Use `next-intl` or React Context for dictionary management.
- **Data:** `services.json` text fields (name, description) will eventually need French counterparts (e.g., `name_fr`, `description_fr`).

## 2. Implementation Status

- **Current Mode:** Hybrid (English/French).
- **Data Layer:** Schema successfully updated. `Service` objects now support `name_fr`, `description_fr`, and `address_fr` overrides.
- **Search:** "Open Now" and "Crisis" filters are localized in `messages/*.json`.
- **UI Components:** Major components (`ServiceCard`, `SearchControls`) use `next-intl` hooks.
- **Hours:** Timestamps are stored as data (`09:00`); formatting (AM/PM vs 24h) is handled by the UI based on locale.
- **AI Assistant**: System prompts must be localized dynamically (e.g., passing a French prompt to the AI if locale is `fr`). Use `useTranslations('AI')` for all chat UI.

## 3. Rules

1. Do not hardcode "Click Here". Use variables.
2. Ensure layout supports text expansion (French is often 20% longer).
3. Dates/Currencies must be localized.
