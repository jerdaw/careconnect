# Bilingual Development Guide (English / French)

**Goal:** All public-facing interfaces must support English (`en`) and French (`fr`) to comply with Canadian accessibility standards.

## 1. Architecture
- **Strategy:** "Separation of Content". Hardcoded strings in `tsx` files are **prohibited**.
- **Library:** Use `next-intl` or React Context for dictionary management.
- **Data:** `services.json` text fields (name, description) will eventually need French counterparts (e.g., `name_fr`, `description_fr`).

## 2. Implementation Status (Pilot)
- **Current Mode:** English-First.
- **Requirement:** All new UI components must accept content as props or use a dictionary object, ensuring future translatability.
- **Progress:** `ServiceDetail` and `Search.didYouMean` namespaces added to locales.
- **Note:** The current codebase contains hardcoded English. Transition to full bilingual support is ongoing.

## 3. Rules
1. Do not hardcode "Click Here". Use variables.
2. Ensure layout supports text expansion (French is often 20% longer).
3. Dates/Currencies must be localized.
