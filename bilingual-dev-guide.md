# Multi-lingual Development Guide

**Goal:** Provide accessible services to Kingston's diverse population. All public-facing interfaces now support 5 languages for Tier 5 EDIA (Equity, Diversity, Inclusion, Accessibility) goals.

## 1. Supported Languages

| Locale    | Language               | Direction | Purpose                     |
| :-------- | :--------------------- | :-------- | :-------------------------- |
| `en`      | English                | LTR       | Official / Primary          |
| `fr`      | Français canadien (CA) | LTR       | Official / Secondary        |
| `ar`      | العربية                | RTL       | EDIA / SWANA Community      |
| `zh-Hans` | 中文                   | LTR       | EDIA / East Asian Community |
| `es`      | Español                | LTR       | EDIA / Latinx Community     |

> **Note:** The `fr` locale uses Canadian French (fr-CA), not France French. This is a Kingston, Ontario project and follows Canadian French spelling, vocabulary, and conventions.

## 2. Architecture

- **Separation of Content**: Hardcoded strings in `tsx` files are prohibited.
- **Library**: `next-intl` handles dictionary management via `messages/{locale}.json`.
- **RTL Support**: Arabic triggers `dir="rtl"` in the layout. Use logical CSS properties (e.g., `ms-2` instead of `ml-2`) or Radix/Tailwind utilities that handle direction automatically.
- **Data Layer**:
  - **Local Services (scope: 'kingston')**: English/French only (`name`/`name_fr`, `fees`/`fees_fr`, `hours_text`/`hours_text_fr`, etc.).
  - **Provincial Services (scope: 'ontario' or 'canada')**: All 5 languages for name/description/eligibility fields.
  - **Schema**: The `scope` field (enum: `'kingston'`, `'ontario'`, `'canada'`) indicates geographic availability. The legacy `is_provincial` field is deprecated.

## 3. Implementation Rules

1. **Labels**: UI labels must be present in **all 5** message files. This includes labels for legal policies, AI disclaimers, and partner interfaces. Use `npm run i18n-audit` to check for missing keys.
2. **Text Expansion**: Layouts must accommodate French and Spanish (often 20-30% longer than English) and Chinese (shorter but taller).
3. **Legal/Policy Pages**: While content may lead in English/French, the structural keys and headers for all policy pages (Privacy, Terms, Accessibility) MUST exist in all 5 languages to prevent UI crashes.
4. **RTL Hygiene**: Avoid absolute `left`/`right` positioning. Use `inset-inline-start`/`end`.
5. **Content Fallbacks**:

- For local services, the UI defaults to `name` if `name_fr` is missing.
- For provincial services, specific localization logic exists to handle expanded content.

5. **Language Switching**: Use the `LanguageSelector` component in the `Header`. Do not use manual links.
6. **Date/Time**: Use `Intl.DateTimeFormat` or `next-intl` formatting utilities to ensure cultural correctness.

## 4. Maintenance

### Audit Scripts

| Script                    | Purpose                                              | Scope                |
| ------------------------- | ---------------------------------------------------- | -------------------- |
| `npm run i18n-audit`      | Checks all 5 message files for missing keys          | UI translations      |
| `npm run bilingual-check` | Checks EN/FR parity for service data                 | `data/services.json` |
| `npm run validate-data`   | Validates service schema, warns if `name_fr` missing | `data/services.json` |

### i18n Audit Details

The `i18n-audit` script (`scripts/i18n-key-audit.ts`) performs these checks:

1. **Key Parity**: Compares all locales against English (source of truth)
2. **Missing Keys**: Reports keys that exist in EN but not in other locales
3. **Extra Keys**: Warns about keys in locales that don't exist in EN
4. **Usage Check**: Scans code for `t()` calls to find potentially unused keys

**Sample Output:**

```
📊 AUDIT RESULTS
═══════════════════════════════════════════════════════════════
✅ EN - 360 keys
✅ FR - 360 keys
❌ AR - 256 keys (32 missing)
❌ ZH-HANS - 256 keys (32 missing)
❌ ES - 256 keys (32 missing)
```

### Ongoing Work

- **EDIA Locales (ar, zh-Hans, es)**: Some legal content (Terms, Privacy sections) may only be available in EN/FR initially. The audit allows certain keys to be optional for EDIA locales.
- **Accessibility**: ARIA labels must be descriptive in all languages.
- **Human Review**: Periodic human review of static JSON files is required for `ar`, `zh-Hans`, and `es`.

---

## AI Translation Policy

### Transparency Disclosures

Kingston Care Connect uses AI-assisted translations for some content. To ensure users are informed:

1. **EDIA Locale Banner** (`ar`, `zh-Hans`, `es`)

   - A dismissible banner appears at the top of every page
   - Informs users that the page uses AI-assisted translations
   - Recommends referring to the English version for critical information
   - Stored in localStorage to remember dismissal

2. **Footer Disclaimer** (all non-English locales)
   - A subtle note appears in the footer for fr/ar/zh-Hans/es
   - Text: "Some translations are AI-assisted. Report errors to feedback@kingstoncare.ca"

### Translation Quality Tiers

| Tier     | Locales               | Quality Level              | Review Status |
| -------- | --------------------- | -------------------------- | ------------- |
| Primary  | `en`                  | Source of truth            | N/A           |
| Official | `fr`                  | AI-assisted + human review | Reviewed      |
| Preview  | `ar`, `zh-Hans`, `es` | AI-assisted, best effort   | Needs review  |

### Reporting Translation Errors

Users can report translation errors to `feedback@kingstoncare.ca`. Corrections should be prioritized based on:

1. Health/safety information (highest priority)
2. Legal/financial content
3. General UI strings (lowest priority)
