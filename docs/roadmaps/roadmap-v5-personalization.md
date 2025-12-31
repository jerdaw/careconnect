# Roadmap V5: Personalization & Data Pipelines

> **Status**: Planning  
> **Owner**: TBD  
> **Start Date**: TBD

---

## Executive Summary

Roadmap V5 builds on the completed **Privacy-First Intelligent Assistant** (Phase 4) and focuses on:
1.  **Personalized User Experience**: Allowing users to optionally store preferences locally for tailored results.
2.  **Automated Data Pipelines**: Reducing manual effort in keeping services up-to-date.
3.  **Community & Partner Features**: Enabling organizations to self-manage their listings.

All features continue to adhere to **strict privacy principles** (no user data egress unless explicitly opted-in by partner organizations).

---

## Phase 5: Personalization (Est. 1-2 Weeks)

### 5.1 Smart Eligibility Checker
**Goal**: Show users visual indicators ("✅ You likely qualify") on service cards based on a local, opt-in profile.

| Component | Description |
|-----------|-------------|
| **User Profile Hook** | `hooks/useUserContext.ts` - Store `{ ageGroup, identities }` in `localStorage`. |
| **Eligibility Logic** | Parse `eligibility_notes` from `services.json` and match against profile. |
| **UI** | Badge on `ServiceCard` showing eligibility status. |
| **Privacy** | Profile NEVER leaves the device. Opt-in modal required. |

**Files to Create/Modify**:
-   `[NEW] hooks/useUserContext.ts`
-   `[NEW] lib/eligibility/checker.ts`
-   `[MODIFY] components/ServiceCard.tsx` (add eligibility badge)
-   `[MODIFY] data/services.json` (structure `eligibility_notes` into parseable format)

---

### 5.2 Identity-Aware Ranking
**Goal**: Boost services that match user identities (e.g., a user who identifies as "Indigenous" sees Indigenous-serving organizations first).

| Component | Description |
|-----------|-------------|
| **Ranking Boost** | Add `identityBoost` multiplier to `calculateScore` in `scoring.ts`. |
| **Tags** | Leverage existing `identity_tags` field in services. |

**Files to Modify**:
-   `[MODIFY] lib/search/scoring.ts`
-   `[MODIFY] lib/search/index.ts`

---

### 5.3 Opt-In Profile UI
**Goal**: A settings page or modal where users can optionally set their profile.

| Component | Description |
|-----------|-------------|
| **Modal/Page** | Simple UI to select age group, identity tags. |
| **Clear Data** | Button to reset all preferences. |

**Files to Create**:
-   `[NEW] components/settings/ProfileSettings.tsx`
-   `[MODIFY] components/layout/Header.tsx` (add settings link)

---

## Phase 6: Data Pipelines (Est. 2-4 Weeks)

### 6.1 211 Ontario API Integration
**Goal**: Automate nightly sync with the official 211 Ontario database for Kingston services.

| Component | Description |
|-----------|-------------|
| **Sync Client** | `lib/external/211-client.ts` - Server-side function to fetch and transform 211 data. |
| **Mapper** | Transform 211 schema to our `Service` type. |
| **Verification** | Auto-imported services marked `verification_level: "L2"`. |
| **Cron Job** | GitHub Action or Vercel Cron to run nightly. |

> [!WARNING]
> 211 API may have rate limits and require a data-sharing agreement.

**Files to Create**:
-   `[NEW] lib/external/211-client.ts`
-   `[NEW] scripts/sync-211.ts`
-   `[NEW] .github/workflows/sync-211.yml` (Cron Action)

---

### 6.2 Service Data Versioning
**Goal**: Track changes to `services.json` over time for auditing and rollback.

| Component | Description |
|-----------|-------------|
| **Changelog** | Auto-generate diff of services on each commit. |
| **Migration Script** | Script to validate schema changes. |

**Files to Create**:
-   `[NEW] scripts/generate-changelog.ts`
-   `[NEW] data/changelog.md`

---

### 6.3 Embedding Pre-computation Pipeline
**Goal**: Pre-compute and cache vector embeddings for all services to eliminate cold-start latency.

| Component | Description |
|-----------|-------------|
| **Build Script** | Run embedding model at build time via `postbuild` script. |
| **Output** | `data/embeddings.json` committed to repo. |
| **Runtime** | Load pre-computed embeddings instead of generating on load. |

**Files to Create/Modify**:
-   `[NEW] scripts/generate-embeddings.ts`
-   `[MODIFY] package.json` (add `postbuild` script)
-   `[MODIFY] lib/search/vector.ts` (load from `embeddings.json`)

---

## Phase 7: Community & Partner Features (Est. 1-2 Months)

### 7.1 Partner Organization Dashboard
**Goal**: Allow claimed organizations to update their own service information.

| Component | Description |
|-----------|-------------|
| **Claim Flow** | Existing claim workflow → require email verification. |
| **Edit Form** | CRUD interface for service details, hours, eligibility. |
| **Approval Queue** | (Optional) Admin approval before changes go live. |

**Files to Create**:
-   `[NEW] app/[locale]/dashboard/services/edit/[id]/page.tsx`
-   `[MODIFY] app/api/v1/services/[id]/route.ts` (add PATCH)

---

### 7.2 Service Submission Form (Public)
**Goal**: Allow community members to suggest new services.

| Component | Description |
|-----------|-------------|
| **Form** | Public form with reCAPTCHA protection. |
| **Review Queue** | Submissions go to admin for verification. |

**Files to Create**:
-   `[NEW] app/[locale]/submit-service/page.tsx`
-   `[NEW] app/api/v1/submissions/route.ts`

---

### 7.3 Analytics Dashboard for Partners
**Goal**: Show claimed organizations how often their service is viewed/clicked.

| Component | Description |
|-----------|-------------|
| **Metrics** | Views, clicks, category trends. |
| **Privacy** | No personal user data shown. |

**Files to Create**:
-   `[NEW] app/[locale]/dashboard/analytics/page.tsx`

---

## Phase 8: Advanced AI (Future Vision)

### 8.1 LLM-Powered Query Expansion
Use a local T5 or Gemma model to semantically expand user queries before search.
-   E.g., "kicked out" → ["emergency shelter", "youth housing", "crisis"].

### 8.2 Multi-Turn Conversational Memory
Store conversation history within the session to enable follow-up questions.
-   "What about something closer to downtown?"

### 8.3 Voice Input
Integrate Web Speech API for accessibility.

---

## Verification Plan

| Phase | Tests |
|-------|-------|
| 5 | Unit tests for eligibility logic; E2E for profile settings. |
| 6 | Integration tests for 211 sync; Verify embeddings.json is valid. |
| 7 | E2E for partner edit flow; Form submission validation. |
| 8 | Manual testing for conversational quality. |

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 5 | 1-2 weeks | Eligibility checker, identity ranking, profile UI |
| Phase 6 | 2-4 weeks | 211 sync, versioning, embedding pipeline |
| Phase 7 | 1-2 months | Partner dashboard, submission form, analytics |
| Phase 8 | Ongoing | Advanced AI features |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| 211 API unavailable | Fall back to manual JSON; never depend on real-time |
| LLM hallucinations | Use for query expansion only, not direct answers |
| Profile data abuse | Profile is local-only, opt-in, clearable anytime |
| Partner data quality | Admin approval queue for all edits |
