# Kingston Care Connect: Roadmap (Refined)

> **Current Version**: v6.0.0  
> **Last Updated**: 2025-12-31  
> **Status**: Production-Ready / Active Development

---

## 📋 Table of Contents

- [Current State](#-current-state)
- [Immediate Action Items](#-immediate-action-items)
- [Priority Tiers Overview](#-priority-tiers-overview)
- [Tier 1: Quick Wins](#-tier-1-quick-wins-1-week)
- [Tier 2: High-ROI Product Features](#-tier-2-high-roi-product-features-v7)
- [Tier 3: OMSAS/Adcom Documentation](#-tier-3-omsasadcom-documentation)
- [Tier 4: Transformative Features](#-tier-4-transformative-features-v8)
- [Tier 5: Deep OMSAS Value](#-tier-5-deep-omsas-value-v9)
- [Tier 6: Future Horizons](#-tier-6-future-horizons-v10)

---

## 🛰️ Current State

Completed **Roadmap V6**: Fully bilingual, PWA-enabled service directory with AI-powered semantic search and automated data validation.

---

## 🛠️ Immediate Action Items

Execute before proceeding with new features:

### Database Migrations

- [ ] Execute [002_v6_prerequisites.sql](file:///home/jer/kingston-care-connect/supabase/migrations/002_v6_prerequisites.sql)
- [ ] Execute [003_org_members.sql](file:///home/jer/kingston-care-connect/supabase/migrations/003_org_members.sql)

### Environment Variables & Secrets

Ensure `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `TWILIO_ACCOUNT_SID`, and `SUPABASE_SERVICE_ROLE_KEY` are set in `.env.local` and GitHub Secrets.

---

## 📊 Priority Tiers Overview

| Tier  | Focus            | Total Effort | Key Benefit      |
| ----- | ---------------- | ------------ | ---------------- |
| **1** | Quick Wins       | ~5-8 hours   | Immediate polish |
| **2** | High-ROI Product | 2-3 weeks    | User experience  |
| **3** | OMSAS Docs       | ~5-6 hours   | Adcom appeal     |
| **4** | Transformative   | 3-4 weeks    | Mission impact   |
| **5** | Deep OMSAS       | 2-3 weeks    | Scholar/research |
| **6** | Future           | TBD          | Long-term vision |

---

## ⚡ Tier 1: Quick Wins (~1 Week)

Maximum impact, minimal effort. Complete these first.

### 1.1 High Contrast Mode

**Effort: 2-3 hours | Lens: Accessibility**

- [ ] Add `.high-contrast` class to `globals.css` (Black/White/Yellow)
- [ ] Add toggle in user settings

### 1.2 Print Stylesheet

**Effort: 1-2 hours | Lens: User Value**

- [ ] Add `@media print` styles (hide nav, simplify layout)
- [ ] Add "Print Results" button

### 1.3 CONTRIBUTING.md

**Effort: 30 minutes | Lens: Credibility**

- [ ] Create `CONTRIBUTING.md` (Setup, style guides, reporting issues)

### 1.4 Freshness Badge

**Effort: 2-3 hours | Lens: Trust**

- [ ] Create `components/ui/FreshnessBadge.tsx` (Green ≤30d, Red >90d)
- [ ] Add to ServiceCard

---

## 🚀 Tier 2: High-ROI Product Features (V7)

Core product improvements with best effort-to-value ratio.

### 2.1 Real User Feedback Loop (Phase 16)

**Effort: 1-2 days**

- [ ] **DB**: `feedback` table (issue_type, details)
- [ ] **UI**: `FeedbackModal` (replaces mailto)
- [ ] **Partner**: Feedback management dashboard

### 2.2 "Did You Mean?" & Fuzzy Search (Phase 18)

**Effort: 1 day**

- [ ] **Lib**: Levenshtein distance algorithm
- [ ] **UI**: `NoResultsSuggestions` component ("Did you mean 'Food'?")

### 2.3 PWA Offline Polish (Phase 19)

**Effort: 1-2 days**

- [ ] **SW**: Cache `services.json` in Service Worker
- [ ] **Data**: `localStorage` fallback for key searches
- [ ] **UI**: Enhanced `offline/page`

### 2.4 Partner Onboarding (Phase 20)

**Effort: 1-2 days**

- [ ] **Flow**: "Find Your Service" search on landing page
- [ ] **Auth**: Email domain auto-verification (e.g., `@kchc.ca`)

### 2.5 WCAG 2.1 AA Compliance

**Effort: 1 day**

- [ ] Audit color contrast, focus states, and aria-labels
- [ ] Add skip-to-content link

### 2.6 Kingston Source Expansion

**Effort: Ongoing**

- [ ] Prioritize: City of Kingston services, 211 Top 50, Faith-based food banks

---

## 🎓 Tier 3: OMSAS/Adcom Documentation

Quick documentation to make the project legible to admissions committes.

### 3.1 About/Impact Page

**Effort: 2-3 hours | Lens: Health Advocate**

- [ ] Create `app/[locale]/about/page.tsx`
- [ ] Highlight: "50+ verified services", "Privacy-first", "Bilingual"
- [ ] Add simple SDOH impact statement

### 3.2 Partners Page

**Effort: 2-3 hours | Lens: Collaborator**

- [ ] Create `app/[locale]/about/partners/page.tsx`
- [ ] Logo grid of verified sources (KCHC, United Way, etc.)
- [ ] Narrative: "Community-verified data"

### 3.3 Advisory Board Documentation

**Effort: 30 minutes | Lens: Collaborator**

- [ ] Create `docs/acknowledgments.md` listing technical and community advisors

---

## 🌟 Tier 4: Transformative Features (V8)

Feasible software features that significantly expand mission impact.

### 4.1 Conversational Intake AI (Phase 22)

**Effort: 1-2 weeks | Lens: Accessibility**

- [ ] **Local AI**: Phi-3 / WebGPU integration
- [ ] **Flow**: Conversational state machine ("What do you need?")
- [ ] **Matcher**: Map user narrative to intent categories

### 4.2 Multi-Service Trip Planner (Phase 23)

**Effort: 3-5 days | Lens: Efficiency**

- [ ] **UI**: "Plan My Day" mode (select multiple services)
- [ ] **Map**: Route optimization (Google/Mapbox API)
- [ ] **Output**: Printable itinerary with bus routes

### 4.3 Community Navigator Sharing (Phase 25)

**Effort: 2-3 days | Lens: Force Multiplier**

- [ ] **Feature**: "Navigator Mode" for social workers
- [ ] **Action**: Create named lists ("John's Housing")
- [ ] **Share**: Generate public read-only link

---

## 📚 Tier 5: Deep OMSAS Value (V9)

Substantive features aligned with medical education competencies.

### 5.1 Impact Analytics Dashboard (Phase 27)

**Effort: 3-5 days | Lens: Scholar**

- [ ] **Metrics**: Aggregate searches, unmet needs, category heatmaps
- [ ] **Privacy**: Zero-PII logging architecture
- [ ] **Output**: Quarterly PDF report generator

### 5.2 Indigenous Health Integration (Phase 29)

**Effort: 2-3 days | Lens: Professional**

- [ ] **Content**: Add land acknowledgment to About page (contextual)
- [ ] **Data**: "Indigenous" IntentCategory and specific search filter
- [ ] **UI**: Cultural safety tags ("Indigenous-led")
- [ ] **Partnership**: Verify data with local Friendship Centre

### 5.3 Health Literacy Audit (Phase 30)

**Effort: 2-3 days | Lens: Communicator**

- [ ] **Audit**: Script to flag high reading-level descriptions
- [ ] **Fix**: Rewrite to Grade 6 level
- [ ] **UI**: Text-to-speech support

### 5.4 Research Publication (Phase 31)

**Effort: 1-2 weeks | Lens: Scholar**

- [ ] **Artifact**: White paper on "Privacy-First Semantic Search for SDOH"
- [ ] **Output**: Conference poster abstract (CCME/ICES)

---

## 🔮 Tier 6: Future Horizons (V10+)

- [ ] **Multi-lingual**: Browser-based translation first
- [ ] **Provincial Services**: Crisis lines only (~20 items)
- [ ] **211 API**: Automated sync integration

---

_For historical details and discarded ideas (Real-time Capacity, Warm Handoff), see [Archived Roadmaps](file:///home/jer/kingston-care-connect/docs/roadmaps/archive/)._
