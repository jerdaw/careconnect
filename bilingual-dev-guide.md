# Multi-lingual Development Guide

**Goal:** Provide accessible services to Kingston's diverse population. All public-facing interfaces now support 5 languages for Tier 5 EDIA (Equity, Diversity, Inclusion, Accessibility) goals.

## 1. Supported Languages

| Locale    | Language | Direction | Purpose                     |
| :-------- | :------- | :-------- | :-------------------------- |
| `en`      | English  | LTR       | Official / Primary          |
| `fr`      | Français | LTR       | Official / Secondary        |
| `ar`      | العربية  | RTL       | EDIA / SWANA Community      |
| `zh-Hans` | 中文     | LTR       | EDIA / East Asian Community |
| `es`      | Español  | LTR       | EDIA / Latinx Community     |

## 2. Architecture

- **Separation of Content**: Hardcoded strings in `tsx` files are prohibited.
- **Library**: `next-intl` handles dictionary management via `messages/{locale}.json`.
- **RTL Support**: Arabic triggers `dir="rtl"` in the layout. Use logical CSS properties (e.g., `ms-2` instead of `ml-2`) or Radix/Tailwind utilities that handle direction automatically.
- **Data Layer**:
  - **Local Services**: English/French only (`name`, `name_fr`).
  - **Provincial Services**: All 5 languages for name/description/eligibility fields.
  - **Schema**: `is_provincial: true` flag distinguishes provincial services.

## 3. Implementation Rules

1. **Labels**: UI labels must be present in **all 5** message files. Use `npm run i18n-audit` to check for missing keys.
2. **Text Expansion**: Layouts must accommodate French and Spanish (often 20-30% longer than English) and Chinese (shorter but taller).
3. **RTL Hygiene**: Avoid absolute `left`/`right` positioning. Use `inset-inline-start`/`end`.
4. **Content Fallbacks**:

- For local services, the UI defaults to `name` if `name_fr` is missing.
- For provincial services, specific localization logic exists to handle expanded content.

5. **Language Switching**: Use the `LanguageSelector` component in the `Header`. Do not use manual links.
6. **Date/Time**: Use `Intl.DateTimeFormat` or `next-intl` formatting utilities to ensure cultural correctness.

## 4. Maintenance

- **Bilingual Audit**: `npm run bilingual-check` identifies missing French content.
- **Multi-lingual Review**: Periodic human review of static JSON files is required for `ar`, `zh-Hans`, and `es`.
- **Accessibility**: ARIA labels must be descriptive in all languages.
