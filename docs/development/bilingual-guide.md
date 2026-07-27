---
status: stable
last_updated: 2026-07-26
owner: jer
tags: [development, localization, i18n]
---

# Multi-lingual Development Guide

**Goal:** Provide accessible services across CareConnect's supported Ontario communities. All public-facing interfaces support seven locales.

## 1. Supported Languages

| Locale    | Language               | Direction | Purpose                      |
| :-------- | :--------------------- | :-------- | :--------------------------- |
| `en`      | English                | LTR       | Official / Primary           |
| `fr`      | Français canadien (CA) | LTR       | Official / Secondary         |
| `ar`      | العربية                | RTL       | EDIA / SWANA Community       |
| `zh-Hans` | 中文                   | LTR       | EDIA / East Asian Community  |
| `es`      | Español                | LTR       | EDIA / Latinx Community      |
| `pa`      | ਪੰਜਾਬੀ                 | LTR       | EDIA / South Asian Community |
| `pt`      | Português              | LTR       | EDIA / Lusophone Community   |

> **Note:** The `fr` locale uses Canadian French (fr-CA), not France French. CareConnect serves Ontario communities and follows Canadian French spelling, vocabulary, and conventions.

## 2. Architecture

- **Separation of Content**: Hardcoded strings in `tsx` files are prohibited.
- **Library**: `next-intl` handles dictionary management via `messages/{locale}.json`.
- **Server message loading**: When loading dictionaries in Server Components (e.g. the root layout), pass the route locale into `next-intl` (`getMessages({ locale })`) so rewritten routes (e.g. `/offline` → `/{locale}/offline`) render the correct language.
- **Metadata and errors**: Generate route metadata with the route locale, and keep unknown localized routes inside `app/[locale]/` so the localized not-found page is used.
- **RTL Support**: Arabic triggers `dir="rtl"` in the layout. Use logical CSS properties (e.g., `ms-2` instead of `ml-2`) or Radix/Tailwind utilities that handle direction automatically.
- **Data Layer**:
  - Service records currently provide English/French pairs (`name`/`name_fr`, `fees`/`fees_fr`, `hours_text`/`hours_text_fr`, etc.).
  - French routes prefer the French field when present. Other locales use the English service-data fallback until the service schema supports additional localized fields.
  - Geographic coverage is independent of interface locale and is represented by place coverage plus broad `scope` values.

## 3. Implementation Rules

1. **Labels**: UI labels must be present in **all 7** message files. This includes labels for legal policies, translation notices, and partner interfaces. Use `npm run i18n-audit` to check for missing keys.
2. **Text Expansion**: Layouts must accommodate French and Spanish (often 20-30% longer than English) and Chinese (shorter but taller).
3. **Legal/Policy Pages**: While content may lead in English/French, the structural keys and headers for all policy pages (Privacy, Terms, Accessibility) MUST exist in all 7 languages to prevent UI crashes.
4. **RTL Hygiene**: Avoid absolute `left`/`right` positioning. Use `inset-inline-start`/`end`.
5. **Content Fallbacks**:

- French service fields fall back to English when the French value is missing.
- Add `lang="en"` to English service-data fallbacks on non-English routes and `lang="fr"` to French content so screen readers use the correct pronunciation rules.
- Translate category names, broad-coverage labels, metadata, and structured weekday names through messages or locale-aware formatters; do not display raw enum or weekday keys.

6. **Language Switching**: Use the `LanguageSwitcher` component in the `Header`. Do not use manual links.
7. **Date/Time**: Use `Intl.DateTimeFormat` or `next-intl` formatting utilities to ensure cultural correctness.

## 4. Maintenance

### Audit Scripts

| Script                    | Purpose                                              | Scope                |
| ------------------------- | ---------------------------------------------------- | -------------------- |
| `npm run i18n-audit`      | Checks all 7 message files for missing keys          | UI translations      |
| `npm run bilingual-check` | Checks EN/FR parity for service data                 | `data/services.json` |
| `npm run validate-data`   | Validates service schema, warns if `name_fr` missing | `data/services.json` |

### French Translation Workflow (Service Data)

For translating service data fields (especially `access_script`, `description`, and other content-rich fields), we use a semi-automated batch translation process with human review:

**Process Overview:**

1. Export fields needing translation: `npm run export:access-script-fr`
2. Generate translation prompts: `npm run translate:prompt <batch-file>`
3. Obtain translated output using the approved translation workflow
4. Parse the returned translations: `npm run translate:parse <batch-file> <response-file>`
5. Validate output: `npm run translate:validate <output-file>`
6. Review and commit the validated translations

**Full Documentation:** See `docs/workflows/french-translation-workflow.md` for the complete step-by-step guide, including quality guidelines and validation rules.

### Audit Details

The `i18n-audit` script (`scripts/i18n-key-audit.ts`) performs these checks:

1. **Key Parity**: Compares all locales against English (source of truth)
2. **Missing Keys**: Reports keys that exist in EN but not in other locales
3. **Extra Keys**: Warns about keys in locales that don't exist in EN
4. **Usage Check**: Scans code for `t()` calls to find potentially unused keys

**Expected Output:**

```text
✅ EN
✅ FR
✅ AR
✅ ZH-HANS
✅ ES
✅ PA
✅ PT
All locale key sets match English.
```

### Ongoing Work

- **Accessibility**: ARIA labels must be descriptive in all languages.
- **Human Review**: Periodic human review of every translated locale is required, with extra attention to preview locales.
- **Maintenance**: Ensure any new keys added to `en.json` are immediately propagated to all other 6 languages.

---

## Translation Review Policy

### Transparency Disclosures

CareConnect flags translated content that is still under review so users can make safer decisions:

1. **Preview Locale Notification** (`ar`, `zh-Hans`, `es`, `pa`, `pt`)
   - A dismissible floating pill appears at the bottom-right of every page
   - Informs users that the page includes translated content under review
   - Contains a "Got it" button for acknowledgment
   - Stored in localStorage to remember dismissal

2. **Footer Disclaimer** (all non-English locales)
   - A subtle note appears in the footer for every non-English locale
   - Text: "Some translations are under review. Report errors to feedback@careconnect.ing"

### Translation Quality Tiers

| Tier     | Locales                           | Quality Level                  | Review Status |
| :------- | :-------------------------------- | :----------------------------- | :------------ |
| Primary  | `en`                              | Source of truth                | N/A           |
| Official | `fr`                              | Reviewed translated content    | Reviewed      |
| Preview  | `ar`, `zh-Hans`, `es`, `pa`, `pt` | Best-effort translated content | Needs review  |

### Reporting Translation Errors

Users can report translation errors to `feedback@careconnect.ing`. Corrections should be prioritized based on:

1. Health/safety information (highest priority)
2. Legal/financial content
3. General UI strings (lowest priority)

## 5. Security Considerations

Localized content in the database (e.g., `name_fr`, `description_fr`) is often rendered using `dangerouslySetInnerHTML` for term highlighting.

1. **XSS Protection**: Always use `highlightMatches()` from `lib/search/highlight.ts` which escapes HTML entities before applying `<mark>` tags.
2. **Injection**: Ensure localized search fields are included in ILIKE escaping logic in API routes.
3. **Validation**: Zod schemas must validate that localized strings do not contain malicious script tags if they are to be rendered as HTML.
