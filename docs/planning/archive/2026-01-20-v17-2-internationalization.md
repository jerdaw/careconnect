---
status: Completed
last_updated: 2026-01-20
owner: jer
tags: [roadmap, v17.2, i18n, translations, edia-locales]
---

# v17.2: Internationalization Completion

**Priority:** HIGH (BLOCKING i18n audit)
**Estimated Effort:** 1-2 weeks (single developer, translation quality review required)
**Dependencies:** None (can run in parallel with v17.1-v17.3)
**Impact:** Multi-language support for 5 EDIA locales

> [!NOTE]
> **AI-Powered Translation**: All UI translations are performed by the AI coding assistant (Antigravity/Claude) rather than external translation APIs. This approach avoids API costs and provides contextually-aware translations. The infrastructure for external API translation (DeepL, Google Translate) has been documented but is not currently in use.

> [!IMPORTANT]
> **External Translation APIs (Future)**: The infrastructure to use DeepL or Google Translate APIs is documented in Phase 2.2 below. **Do not pursue external translation services or incur costs without explicit user request.**

> [!NOTE]
> **Service Data Translations**: This plan covers UI translations only. Service names/descriptions are currently EN/FR only. Additional locale translations for service content would require separate data entry effort.

---

## ✅ Implementation Status

All phases have been completed:

- **Phase 1**: Gap analysis complete - identified and addressed 126 missing keys
- **Phase 2**: AI-translated all EDIA locales (zh-Hans, ar, pt, es, pa)
- **Phase 3**: Offline page moved to `app/[locale]/offline/` and localized
- **Phase 4**: Extra keys cleanup pending (5 harmless extra keys remain in EDIA locales)
- **Phase 5**: i18n audit passes (`npm run i18n-audit` shows 0 missing keys)

---

## Phase 1: Translation Gap Analysis ✅

### 1.1 Run i18n Audit

```bash
npm run i18n-audit > i18n-gaps.txt
```

**Current Output (Post-Completion):**

```text
✅ EN - 577 keys
✅ FR - 577 keys
✅ ZH-HANS - 582 keys (5 extra)
✅ AR - 582 keys (5 extra)
✅ PT - 582 keys (5 extra)
✅ ES - 582 keys (5 extra)
✅ PA - 582 keys (5 extra)

All locales have required keys
```

### 1.2 Missing Key Categories (Addressed)

The following key categories were identified and translated:

- **VerificationLevels** (L0-L3 labels and descriptions)
- **Dashboard** (logout, pending, partner stats, etc.)
- **Freshness Badges** (verified, unknown, verifiedOn, etc.)
- **Feedback Form** (types, categories, status keys)
- **Settings** (title, description, connectionStatus, notifications)
- **ServiceDetail** (claimButton, plainLanguage, whatIsIt, etc.)
- **Offline page** (title, description, retryButton, etc.)

### 1.3 Extra Keys (Low Priority)

5 extra keys exist in EDIA locales (harmless legacy keys):

- `Feedback.messageLabel`
- `Feedback.messagePlaceholder`
- `Feedback.submit`
- `Feedback.successTitle`
- `Feedback.successMessage`

**Decision**: Leave as-is. These keys don't affect functionality and may be used in future features.

---

## Phase 2: Translation Execution ✅

### 2.1 AI-Powered Translation Workflow (Current Approach)

Translations are performed by the AI coding assistant using contextual understanding of:

- The application's purpose (social services directory)
- Existing translation patterns in the codebase
- Cultural and linguistic nuances for each target language

**Benefits:**

- No API costs
- Contextually-aware translations
- Consistent terminology across keys
- Immediate availability

**Process:**

1. AI identifies missing keys from `npm run i18n-audit`
2. AI translates using English source as reference
3. Translations are added directly to locale files
4. JSON validity is verified with `jq`

### 2.2 External Translation API Setup (Future Reference)

> [!IMPORTANT]
> **Do not implement external translation without explicit user approval and budget discussion.**

**Documented for future use when scale requires it:**

| Tool                 | Cost         | Quality  | Workflow             |
| -------------------- | ------------ | -------- | -------------------- |
| Google Translate API | ~$15 for all | 70-80%   | Auto + manual review |
| DeepL API            | ~$10 for all | 85-90%   | Auto + manual review |
| Human translators    | $500-1000    | 100%     | 2-week turnaround    |
| Community (Crowdin)  | Free         | Variable | Slow, uneven         |

**Script template (not currently used):**

```typescript
// scripts/translate-missing-keys.ts (template for future use)
import * as deepl from "deepl-node"

const translator = new deepl.Translator(process.env.DEEPL_API_KEY)

const LANGUAGE_MAP = {
  "zh-Hans": "ZH", // Simplified Chinese
  ar: "AR", // Arabic
  pt: "PT", // Portuguese
  es: "ES", // Spanish
  pa: "PA", // Punjabi (requires Google Translate)
}

// Implementation details documented in original roadmap
```

### 2.3 Quality Assurance Checklist

For each locale, verify:

- [ ] Crisis/mental health terms are appropriate
- [ ] Medical terms are accurate
- [ ] Abbreviations (Kingston/KGH) are not translated
- [ ] Same English term translates consistently
- [ ] No English words left in translation
- [ ] UTF-8 encoding is valid
- [ ] Text fits in UI constraints

---

## Phase 3: Offline Page Localization ✅

### 3.1 Page Relocated

**Completed:**

- Moved `app/offline/` → `app/[locale]/offline/`
- Offline page uses `useTranslations('Offline')`
- RTL support for Arabic locale

### 3.2 Translation Keys Added

All locales now include `Offline` section:

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

---

## Phase 4: Extra Keys Cleanup ✅

### 4.1 Status

5 extra keys identified in EDIA locales. Decision: **Leave as-is** (harmless, may be useful for future features).

---

## Phase 5: Testing & Validation ✅

### 5.1 Audit Results

```bash
npm run i18n-audit
# ✅ All locales have required keys
```

### 5.2 JSON Validation

```bash
for f in messages/*.json; do jq . "$f" > /dev/null && echo "$f valid"; done
# All 7 files valid
```

### 5.3 Visual Testing Checklist

| Locale     | Test URL   | RTL | Status |
| ---------- | ---------- | --- | ------ |
| English    | `/en`      | No  | ✅     |
| French     | `/fr`      | No  | ✅     |
| Chinese    | `/zh-Hans` | No  | ✅     |
| Arabic     | `/ar`      | Yes | ✅     |
| Portuguese | `/pt`      | No  | ✅     |
| Spanish    | `/es`      | No  | ✅     |
| Punjabi    | `/pa`      | No  | ✅     |

---

## Phase 6: Translation Provider Setup (Future)

### 6.1 Crowdin Integration (Not Implemented)

> [!NOTE]
> Crowdin integration is documented for future community translation efforts. **Do not pursue without explicit user request.**

### 6.2 Translation Guidelines

See `docs/development/bilingual-guide.md` for translation guidelines.

---

## Success Criteria ✅

- [x] `npm run i18n-audit` passes (0 missing keys)
- [x] All 7 locales have 577+ keys
- [x] Extra keys documented (5 harmless extras in EDIA locales)
- [x] Offline page locale-aware and translated
- [x] Arabic offline page displays RTL correctly
- [x] All locales tested visually
- [x] Zero encoding issues (UTF-8 valid)

---

## File Changes Summary

| Action | File                            | Impact                      |
| ------ | ------------------------------- | --------------------------- |
| UPDATE | `messages/zh-Hans.json`         | +126 keys, parity           |
| UPDATE | `messages/ar.json`              | +126 keys, RTL tested       |
| UPDATE | `messages/pt.json`              | +126 keys, parity           |
| UPDATE | `messages/es.json`              | +126 keys, parity           |
| UPDATE | `messages/pa.json`              | +126 keys, parity           |
| MOVE   | `app/offline/`                  | → `app/[locale]/offline/`   |
| UPDATE | `app/[locale]/offline/page.tsx` | i18n with `useTranslations` |

---

## Post-v17.2 Maintenance

- **Ongoing**: AI assistant handles new translation needs
- **Monthly audit**: `npm run i18n-audit` to check for new keys
- **Quarterly review**: Verify translations still relevant
- **Future**: Professional review from native speakers (user-initiated)
- **Future**: Crowdin for community contributions (user-initiated)
