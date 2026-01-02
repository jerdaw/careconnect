# Kingston Care Connect: Roadmap (Final)

> **Current Version**: v6.1.0  
> **Last Updated**: 2026-01-01  
> **Status**: Production-Ready / Active Development

---

## 📋 Table of Contents

- [Current State](#-current-state)
- [Immediate Action Items](#-immediate-action-items)
- [Priority Tiers Overview](#-priority-tiers-overview)
- [Tier 1: Quick Wins](#-tier-1-quick-wins)
- [Tier 2: High-ROI Product Features](#-tier-2-high-roi-product-features-v7)
- [Tier 3: OMSAS/Adcom Documentation](#-tier-3-omsasadcom-documentation)
- [Tier 4: Data & Accessibility](#-tier-4-data--accessibility-v8)
- [Tier 5: Future Horizons](#-tier-5-future-horizons)

---

## 🛰️ Current State

Completed **Roadmap V6**: Fully bilingual, PWA-enabled service directory with AI-powered semantic search and automated data validation.

---

## 🛠️ Immediate Action Items

### Database Migrations

- [ ] Execute [002_v6_prerequisites.sql](file:///home/jer/kingston-care-connect/supabase/migrations/002_v6_prerequisites.sql)
- [ ] Execute [003_org_members.sql](file:///home/jer/kingston-care-connect/supabase/migrations/003_org_members.sql)

### Environment Variables

Ensure `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `TWILIO_ACCOUNT_SID`, and `SUPABASE_SERVICE_ROLE_KEY` are configured.

---

## 📊 Priority Tiers Overview

| Tier  | Focus                | Effort     | Key Benefit      |
| ----- | -------------------- | ---------- | ---------------- |
| **1** | Quick Wins           | ~5-8 hours | Immediate polish |
| **2** | High-ROI Product     | 1-2 weeks  | User experience  |
| **3** | OMSAS Docs           | ~5-6 hours | Adcom appeal     |
| **4** | Data & Accessibility | Ongoing    | Mission depth    |
| **5** | Future               | TBD        | Long-term vision |

---

## ⚡ Tier 1: Quick Wins

### 1.1 High Contrast Mode

**Effort: 2-3 hours**

- [x] Add `.high-contrast` class to `globals.css`
- [x] Add toggle in user settings

### 1.2 Print Stylesheet

**Effort: 1-2 hours**

- [x] Add `@media print` styles
- [x] Add "Print Results" button

### 1.3 CONTRIBUTING.md

**Effort: 30 minutes**

- [x] Create `CONTRIBUTING.md`

### 1.4 Freshness Badge

**Effort: 2-3 hours**

- [x] Create `components/ui/FreshnessBadge.tsx`
- [x] Add to ServiceCard

---

## 🚀 Tier 2: High-ROI Product Features (V7)

### 2.1 Real User Feedback Loop

**Effort: 1-2 days**

- [x] **DB**: `feedback` table
- [x] **UI**: `FeedbackModal` (replaces mailto)
- [x] **Partner**: Feedback management dashboard

### 2.2 "Did You Mean?" & Fuzzy Search

**Effort: 1 day**

- [x] **Lib**: Levenshtein distance algorithm
- [x] **UI**: `NoResultsSuggestions` component

### 2.3 PWA Offline Polish

**Effort: 1-2 days**

- [x] **SW**: Cache `services.json`
- [x] **Data**: `localStorage` fallback
- [x] **UI**: Enhanced offline page

### 2.4 WCAG 2.1 AA Compliance

**Effort: 1 day**

- [x] Audit color contrast, focus states, aria-labels
- [x] Add skip-to-content link

---

## 🎓 Tier 3: OMSAS/Adcom Documentation

### 3.1 About/Impact Page

**Effort: 2-3 hours**

- [x] Create `app/[locale]/about/page.tsx`
- [x] Highlight: "50+ verified services", "Privacy-first", "Bilingual"

### 3.2 Partners Page

**Effort: 2-3 hours**

- [x] Create `app/[locale]/about/partners/page.tsx`
- [x] Logo grid of verified sources

### 3.3 Advisory Board Documentation

**Effort: 30 minutes**

- [x] Create `docs/acknowledgments.md`

---

## 🌟 Tier 4: Data & Accessibility (V8)

### 4.1 Kingston Source Expansion

**Effort: Ongoing (Phase 1 Complete)**

- [x] City of Kingston services (Imported key homelessness/food datasets)
- [x] 211 Top 50 services (Framework ready)
- [x] Faith-based food banks (Added St. Mary's, Salvation Army)

### 4.2 Indigenous Health Data

**Effort: Completed**

- [x] Add "Indigenous" IntentCategory
- [x] Create specific search filter
- [x] Add cultural safety tags to relevant services
- [x] Add contextual land acknowledgment to About page

---

## 🔮 Tier 5: Future Horizons

- [ ] **211 API Integration**: Automated data sync (when partnership available)

---

## 📋 Removed Items (Feasibility/Scope)

The following items were evaluated and removed:

| Item                                   | Reason                          |
| -------------------------------------- | ------------------------------- |
| Partner Onboarding (email auto-verify) | Security risk                   |
| Conversational Intake AI               | Complexity, browser support     |
| Navigator Sharing                      | Scope creep                     |
| Trip Planner                           | Paid API, scope creep           |
| Impact Analytics Dashboard             | Scope, privacy risk             |
| Health Literacy Rewrite                | Effort without review process   |
| Text-to-Speech                         | Nice-to-have, not core          |
| Research Publication                   | Personal activity, not software |

---

_For historical context, see [Archived Roadmaps](file:///home/jer/kingston-care-connect/docs/roadmaps/archive/)._
