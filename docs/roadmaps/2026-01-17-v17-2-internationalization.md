---
status: planned
last_updated: 2026-01-19
owner: jer
tags: [roadmap, v17.2, i18n, translations, edia-locales]
---

# v17.2: Internationalization Completion

**Priority:** HIGH (BLOCKING i18n audit)
**Estimated Effort:** 1-2 weeks (single developer, translation quality review required)
**Dependencies:** None (can run in parallel with v17.1-v17.3)
**Impact:** Multi-language support for 5 EDIA locales

> [!WARNING]
> **Translation API Costs**: DeepL API (~$10-15 for all translations) or Google Translate API required. User approval needed before incurring costs.

> [!NOTE]
> **Service Data Translations**: This plan covers UI translations only. Service names/descriptions are currently EN/FR only. Additional locale translations for service content would require separate data entry effort.

## Executive Summary

Complete translation gaps in 5 EDIA (Equity, Diversity, Inclusion, Accessibility) locales. Currently 126 keys missing in each of ZH-HANS, AR, PT, ES, PA. Must pass `npm run i18n-audit` before production launch.

---

## Phase 1: Translation Gap Analysis (1 day)

### 1.1 Run i18n Audit

```bash
npm run i18n-audit > i18n-gaps.txt
```

**Current Output:**

```
ZH-HANS (Simplified Chinese): 126 missing keys
AR (Arabic): 126 missing keys
PT (Portuguese): 126 missing keys
ES (Spanish): 126 missing keys
PA (Punjabi): 126 missing keys
```

### 1.2 Categorize Missing Keys

**New file:** `docs/audit/i18n-missing-keys.md`

```markdown
## Missing Key Categories

### VerificationLevels (4 keys × 5 locales = 20 translations needed)

- VerificationLevels.L0.label
- VerificationLevels.L1.label
- VerificationLevels.L2.label
- VerificationLevels.L3.label
- VerificationLevels.{level}.description (for each)

### Dashboard (15 keys × 5 = 75 translations)

- Dashboard.logout
- Dashboard.pending
- Dashboard.completeProfile
- Dashboard.getStarted
- Dashboard.manageServices
- Dashboard.viewAnalytics
- Dashboard.inviteMembers
- Dashboard.settings
- Dashboard.notifications
- ... (15 total)

### Freshness Badges (5 keys × 5 = 25 translations)

- ServiceFreshness.verified
- ServiceFreshness.unknown
- ServiceFreshness.verifiedOn
- ServiceFreshness.neverVerified
- ServiceFreshness.updateNeeded

### Feedback Form (10 keys × 5 = 50 translations)

- Feedback.description
- Feedback.types.wrong_phone
- Feedback.types.wrong_address
- Feedback.types.service_closed
- Feedback.types.other
- ... (10 total)

### Other UI (remaining 92 keys × 5 = 460 translations)

- Settings pages
- Partner forms
- Admin panel
- Error messages
```

### 1.3 Extra Keys Cleanup (10 keys × 5 locales)

**Identify extra keys not in English source:**

```
All EDIA locales have 10 extra keys:
- Feedback.description (EXTRA - also in base keys)
- Feedback.types.wrong_phone
- Feedback.types.wrong_address
- Feedback.types.service_closed
- Feedback.types.other
- ... (5 more)
```

**Action:** Delete from translation files or add to English source.

---

## Phase 2: Translation Execution (4-5 days)

### 2.1 Setup Professional Translation Workflow

**Options:**

| Tool                 | Cost         | Quality  | Workflow             |
| -------------------- | ------------ | -------- | -------------------- |
| Google Translate API | ~$15 for all | 70-80%   | Auto + manual review |
| DeepL API            | ~$10 for all | 85-90%   | Auto + manual review |
| Human translators    | $500-1000    | 100%     | 2-week turnaround    |
| Community (Crowdin)  | Free         | Variable | Slow, uneven         |

**Recommendation:** DeepL API for initial translations + community review

### 2.2 Automated Translation Script

**New file:** `scripts/translate-missing-keys.ts`

```typescript
import * as deepl from "deepl-node"

const translator = new deepl.Translator(process.env.DEEPL_API_KEY)

const LANGUAGE_MAP = {
  "zh-Hans": "ZH", // Simplified Chinese
  ar: "AR", // Arabic
  pt: "PT", // Portuguese
  es: "ES", // Spanish
  pa: "PA", // Punjabi (not supported by DeepL - use Google)
}

async function translateMissingKeys() {
  const enMessages = loadJson("messages/en.json")
  const missingKeys = [
    "VerificationLevels.L0.label",
    "VerificationLevels.L1.label",
    "VerificationLevels.L2.label",
    "VerificationLevels.L3.label",
    "Dashboard.logout",
    "Dashboard.pending",
    // ... all 126 keys
  ]

  const translations = {}

  for (const locale of ["zh-Hans", "ar", "pt", "es"]) {
    translations[locale] = {}
    const targetLang = LANGUAGE_MAP[locale]

    for (const key of missingKeys) {
      const englishText = getNestedValue(enMessages, key)

      try {
        const translated = await translator.translateText(englishText, "EN", targetLang)

        setNestedValue(translations[locale], key, translated.text)
        console.log(`✓ ${locale}/${key}`)
      } catch (error) {
        console.error(`✗ ${locale}/${key}: ${error.message}`)
      }
    }
  }

  // Save translations
  for (const [locale, msgs] of Object.entries(translations)) {
    const existing = loadJson(`messages/${locale}.json`)
    const merged = { ...existing, ...msgs }
    saveJson(`messages/${locale}.json`, merged)
  }

  console.log("Translation complete. Manual review required.")
}
```

**Run:**

```bash
DEEPL_API_KEY=xxx npx tsx scripts/translate-missing-keys.ts
```

### 2.3 Manual Review Workflow

**For each locale, review translations:**

1. **Create PR:** One PR per locale for review
2. **Check context:** Translations make sense in context
3. **Verify terminology:** Crisis, health terms consistent
4. **Test UI:** Ensure strings fit in UI constraints
5. **Approve:** Merge when confident

**Checklist for Reviewer:**

```markdown
## Review Checklist for {locale}

### Terminology

- [ ] Crisis/mental health terms correct
- [ ] Medical terms appropriate
- [ ] Culturally sensitive language used
- [ ] Abbreviations (Kingston/KGH) not translated

### Consistency

- [ ] Same English term always translates the same way
- [ ] UI labels consistent with site tone
- [ ] Formality level matches English

### Quality

- [ ] No English words left in translation
- [ ] Punctuation correct (esp. RTL languages)
- [ ] Character encoding valid (UTF-8)
- [ ] Line breaks preserved where needed

### Testing

- [ ] Ran locally in that locale
- [ ] Text doesn't overflow UI
- [ ] Numbers/currencies formatted correctly
- [ ] Links still work
```

### 2.4 Punjabi Special Handling

**Note:** DeepL doesn't support Punjabi. Options:

1. **Google Translate API** (~$10 for all)
2. **Community translation** (Crowdin or similar)
3. **Contract translator** ($100-200)

**Recommendation:** Use Google Translate API, then community review

```typescript
// For Punjabi, use Google Translate instead
const googleTranslate = require("@google-cloud/translate").v2
const translate = new googleTranslate.Translate({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE,
})

const [translationPa] = await translate.translate(
  englishText,
  { to: "pa" } // Punjab language code
)
```

---

## Phase 3: Offline Page Localization (1-2 days)

### 3.1 Make Offline Layout Locale-Aware

**Problem:** `/app/offline/layout.tsx` hardcoded to English

**Current:**

```typescript
export default function OfflineLayout({ children }) {
  return (
    <html lang="en">  // ❌ HARDCODED
      <body>{children}</body>
    </html>
  )
}
```

**Required:**

```typescript
import { ReactNode } from 'react'

export default function OfflineLayout({
  children,
  params: { locale },
}: {
  children: ReactNode
  params: { locale: string }
}) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir}>
      <body>{children}</body>
    </html>
  )
}
```

### 3.2 Translate Offline Page Content

**File:** `app/offline/page.tsx`

**Current (English only):**

```typescript
<h1>You are offline</h1>
<p>Please reconnect to the internet to search for services.</p>
```

**Required (i18n):**

```typescript
import { useTranslations } from 'next-intl'

export default function OfflinePage() {
  const t = useTranslations('Offline')

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button>{t('retryButton')}</button>
    </div>
  )
}
```

**New translation keys:** `messages/{locale}.json`

```json
{
  "Offline": {
    "title": "You are offline",
    "description": "Please reconnect to the internet to search for services.",
    "retryButton": "Retry Connection",
    "recentlyViewed": "Recently Viewed Services",
    "cachedData": "Cached data is available below",
    "emergencyContacts": "Emergency Contacts Always Available",
    "crisisLine": "Crisis Line",
    "emergency": "Emergency"
  }
}
```

### 3.3 Move Offline Page Under Locale Router

**Current structure:**

```
app/offline/page.tsx
app/offline/layout.tsx
```

**Required structure:**

```
app/[locale]/offline/page.tsx
app/[locale]/offline/layout.tsx
```

**Changes:**

- [ ] Move `app/offline/` to `app/[locale]/offline/`
- [ ] Update middleware to route `/offline` → `/{locale}/offline`
- [ ] Update all links to offline page: `href="/offline"` → `href="/en/offline"`

---

## Phase 4: Extra Keys Cleanup (1 day)

### 4.1 Identify & Remove Duplicates

**New file:** `scripts/cleanup-extra-i18n-keys.ts`

```typescript
import { diffKeySets } from "./i18n-audit"

async function cleanupExtraKeys() {
  const enMessages = loadJson("messages/en.json")
  const locales = ["zh-Hans", "ar", "pt", "es", "pa"]

  for (const locale of locales) {
    const localeMessages = loadJson(`messages/${locale}.json`)

    const extraKeys = diffKeySets(Object.keys(flattenObject(localeMessages)), Object.keys(flattenObject(enMessages)))

    console.log(`${locale}: ${extraKeys.length} extra keys`)

    const cleaned = removeKeys(localeMessages, extraKeys)
    saveJson(`messages/${locale}.json`, cleaned)
  }
}
```

**Review decisions:**

Option 1: Delete from EDIA locales (if not needed)

```json
// Remove from ar.json, zh-Hans.json, etc.
"Feedback": {
  "description": "...",  // DELETE
  "types": { ... }
}
```

Option 2: Add to English source (if needed)

```json
// Add to messages/en.json if core functionality
"Feedback": {
  "description": "Tell us what went wrong",  // ADD
  "types": {
    "wrong_phone": "Phone number is incorrect",  // ADD
    "wrong_address": "Address is incorrect",
    "service_closed": "Service is closed",
    "other": "Something else"
  }
}
```

---

## Phase 5: Testing & Validation (1 day)

### 5.1 Run Audit Script

```bash
npm run i18n-audit
```

**Expected output (PASS):**

```
✓ en.json: 569 keys
✓ fr.json: 569 keys (100%)
✓ zh-Hans.json: 569 keys (100%)
✓ ar.json: 569 keys (100%)
✓ pt.json: 569 keys (100%)
✓ es.json: 569 keys (100%)
✓ pa.json: 569 keys (100%)

All locales complete!
```

### 5.2 Visual Testing (Manual)

For each locale, check:

**English (`/en`):**

- [ ] All text displays correctly
- [ ] Links work
- [ ] Buttons responsive

**French (`/fr`):**

- [ ] French text displays
- [ ] Accented characters (é, ç, etc.) render correctly

**Chinese (`/zh-Hans`):**

- [ ] Characters display correctly (not boxes)
- [ ] Text wraps properly
- [ ] Glyphs render

**Arabic (`/ar`):**

- [ ] Right-to-left layout active
- [ ] Arabic text renders correctly
- [ ] Numbers stay left-to-right
- [ ] Special chars (ء, ة, etc.) display
- [ ] Offline page respects RTL

**Portuguese (`/pt`):**

- [ ] Portuguese-specific characters (ã, õ, ç)
- [ ] Brazilian vs European Portuguese noted

**Spanish (`/es`):**

- [ ] Spanish characters (á, é, í, ó, ú, ñ, ¿, ¡)
- [ ] Regional variations handled (México vs España)

**Punjabi (`/pa`):**

- [ ] Punjabi script (Gurmukhi) displays
- [ ] Character combinations render
- [ ] Ligatures work correctly

### 5.3 RTL Testing (Arabic Specifically)

```typescript
// Test in app/[locale]/layout.tsx
export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: ReactNode
  params: { locale: string }
}) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir}>
      <body>
        {children}
      </body>
    </html>
  )
}
```

**Checklist for Arabic (RTL):**

- [ ] Layout flips: sidebar moves to right
- [ ] Text aligns right
- [ ] Numbers still read left-to-right
- [ ] Form inputs align right
- [ ] Margins/padding flipped (ml becomes mr)
- [ ] Offline page displays RTL

### 5.4 Test Offline Page in All Locales

1. Open `/en/offline` - English offline page
2. Open `/fr/offline` - French offline page
3. Open `/ar/offline` - Arabic offline page (RTL)
4. Open `/zh-Hans/offline` - Chinese offline page
5. Open `/pt/offline` - Portuguese offline page
6. Open `/es/offline` - Spanish offline page
7. Open `/pa/offline` - Punjabi offline page

Verify all display correctly in their respective languages.

---

## Phase 6: Translation Provider Setup (1 day)

### 6.1 Crowdin Integration (Optional, for ongoing translations)

If planning continued i18n work:

**New file:** `crowdin.yml`

```yaml
project_id: YOUR_PROJECT_ID
api_token: YOUR_API_TOKEN

files:
  - source: /messages/en.json
    translation: /messages/%two_letters_code%.json
```

Benefits:

- Community translations
- Translation memory
- In-context preview
- Easy contributor management

### 6.2 Translation Partner Guidelines

**For future translators:**

**New file:** `docs/TRANSLATION_GUIDE.md`

```markdown
# Translation Guidelines

## General

- Translate meaning, not word-for-word
- Keep tone: friendly, accessible, direct
- No marketing hype
- Plain language (Flesch Reading Ease > 60)

## Medical/Health Terms

- Use official terminology in your language
- If no official term, explain in parentheses
- Example: "mental health" (not "brain health")

## Abbreviations

- Keep Kingston/KGH abbreviations
- Don't translate proper nouns
- Explain local acronyms

## Punctuation

- Follow locale conventions
- Arabic: Use Arabic quotation marks
- Chinese: Use CJK punctuation
- RTL: Don't reverse punctuation direction

## Testing

- Test in actual app before submitting
- Check text wrapping in UI
- Verify mobile display

## Examples to Match

[Links to existing translated strings that set the tone]
```

---

## Success Criteria

- [ ] `npm run i18n-audit` passes (0 missing keys)
- [ ] All 7 locales have 569+ identical keys
- [ ] No extra keys (cleanup complete)
- [ ] Offline page locale-aware and translated
- [ ] Arabic offline page displays RTL correctly
- [ ] All locales tested visually
- [ ] Special characters render correctly
- [ ] Zero encoding issues (UTF-8 valid)

---

## File Changes Summary

| Action  | File                                   | Impact                    |
| ------- | -------------------------------------- | ------------------------- |
| UPDATE  | `messages/zh-Hans.json`                | +126 keys                 |
| UPDATE  | `messages/ar.json`                     | +126 keys, RTL tested     |
| UPDATE  | `messages/pt.json`                     | +126 keys                 |
| UPDATE  | `messages/es.json`                     | +126 keys                 |
| UPDATE  | `messages/pa.json`                     | +126 keys                 |
| CLEANUP | All EDIA locale files                  | -10 duplicate keys        |
| MOVE    | `app/offline/`                         | → `app/[locale]/offline/` |
| UPDATE  | `app/[locale]/offline/layout.tsx`      | Dynamic locale/dir        |
| NEW     | `messages/*/Offline.json`              | Offline page i18n         |
| UPDATE  | `middleware.ts`                        | Route offline to locale   |
| NEW     | `docs/adr/008-internationalization.md` | Document i18n strategy    |

---

## Deployment Notes

### Pre-deployment Checks

1. Run full audit: `npm run i18n-audit`
2. Test all 7 locales in dev: `npm run dev`
3. Test offline in all locales
4. Lighthouse audit (multi-lang score)
5. Performance: No slowdown from translations

### Deployment

1. Merge translation PRs (one per locale + offline page)
2. Deploy to staging
3. Verify all locales on staging
4. Deploy to production
5. Monitor for i18n-related errors

### Rollback

- If translation issues discovered: revert to previous version
- All translation changes are non-breaking (only additions)
- Can mark individual translations as "TODO" if needed

---

## Post-v17.2 Maintenance

- Monthly audit: Check for new keys in code
- Quarterly review: Verify translations still relevant
- Annual: Professional review from native speakers
- Community: Enable Crowdin for ongoing contributions
