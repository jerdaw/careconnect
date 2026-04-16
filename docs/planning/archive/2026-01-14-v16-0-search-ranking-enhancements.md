# v16.0: Search Ranking Enhancements

> **Status**: Completed
> **Roadmap Version**: v16.0  
> **Last Updated**: 2026-01-14
> **Target Completion**: Q1 2026  
> **Owner/Resourcing**: Single-maintainer
> **Scope Guardrail**: Improve search relevance through authority, completeness, and proximity scoring

This document is the **version definition and implementation plan** for v16.0, which enhances search result ranking to surface authoritative sources, complete service information, and geographically relevant results.

---

## 0) Executive Summary

### The Vision

CareConnect's search currently uses basic keyword matching with verification level and freshness multipliers. While functional, it doesn't adequately prioritize:

1. **Official Sources**: Government and healthcare services should rank higher than unverified community posts
2. **Complete Information**: Services with full contact details and hours should surface above sparse listings
3. **Geographic Relevance**: Users with location enabled should see nearby services prioritized
4. **Intent Matching**: Queries matching service-specific synthetic queries should rank higher

v16.0 addresses these gaps through **intelligent search ranking** that:

- Surfaces authoritative sources (government, healthcare, established nonprofits)
- Rewards data completeness (phone, address, hours, eligibility)
- Applies continuous proximity decay for location-aware searches
- Boosts exact intent matches between queries and synthetic queries

### Completed Work & This Roadmap

**✅ Completed: Client-Side Scoring Enhancements**

- Authority tier multipliers (1.25x government → 0.95x unverified)
- Completeness boost (+22 max points)
- Intent targeting boost (+100/+50/+25 points)
- Resource capacity indicators (+15/+8/+3 per indicator)
- Continuous proximity decay (replaces 50-point bucketing)
- 36 passing tests (31 unit + 5 integration)

**🎯 This Roadmap: Server-Side API & Data Enrichment**

- Apply scoring to `/api/v1/search/services` endpoint
- Enrich services.json with authority_tier classifications
- Database schema migration for new fields
- Server-side scoring module

### Strategic Alignment

This roadmap:

- **Improves Search Quality**: More relevant results for users in crisis
- **Surfaces Official Resources**: Government and healthcare services prioritized
- **Rewards Data Quality**: Incentivizes complete service information
- **Maintains Privacy**: No new tracking or data collection

---

## 1) Goals / Non-Goals

### Goals (Must-Have for v16.0 Phase 2)

**Database & Schema**

1. Add `authority_tier` column to services table
2. Add `resource_indicators` JSONB column
3. Update `services_public` view to expose new fields
4. Create indexes for authority-based sorting

**Server-Side API**

5. Implement in-memory scoring for `/api/v1/search/services`
6. Apply authority, verification, freshness, completeness multipliers
7. Support optional location parameter for proximity scoring
8. Maintain backward compatibility with existing clients

**Data Enrichment**

9. Auto-classify authority tiers for all 196 services
10. Generate SQL migration for database updates
11. Update services.json with authority_tier field
12. Document classification rules and manual override process

**Verification**

13. Unit tests for server-side scoring module
14. API integration tests for ranking behavior
15. Manual verification of search quality improvements
16. Staged rollout plan

### Non-Goals (Explicitly Out of Scope)

- Semantic search on server (vectors remain client-side)
- Real-time popularity tracking (requires analytics infrastructure)
- User behavior-based ranking (privacy concerns)
- Machine learning ranking models (complexity)
- Search result personalization beyond identity tags
- A/B testing framework (premature optimization)

---

## 2) Current State Snapshot

### What We Have (Client-Side Complete)

**Client-Side Scoring** (`lib/search/scoring.ts`):

- 11-step scoring pipeline with authority, completeness, intent targeting
- Verification level multipliers (L3=1.2x, L2=1.1x, L1=1.0x)
- Freshness multipliers (<30d=1.1x, 30-90d=1.0x, >90d=0.9x)
- Identity personalization (up to 30% boost)
- Resource capacity indicators

**Proximity Scoring** (`lib/search/geo.ts`):

- Continuous decay: `1 / (1 + k * distance)`
- Virtual services exempt from proximity penalty
- Provincial/national services use reduced decay (k=0.005 vs k=0.02)

**Type System** (`types/service.ts`):

- `AuthorityTier` type defined
- `ResourceIndicators` interface defined
- Service interface extended with optional fields

**Test Coverage**:

- 31 unit tests for scoring functions
- 5 integration tests for search behavior
- All tests passing

### What's Missing (This Roadmap Will Add)

**Server-Side API** (`app/api/v1/search/services/route.ts`):

- Currently uses basic ILIKE substring matching
- Sort order: verification_status (desc) → last_verified (desc)
- No authority, completeness, or proximity scoring
- Crisis detection applied post-fetch only

**Database Schema**:

- Missing `authority_tier` column
- Missing `resource_indicators` column
- `services_public` view doesn't expose new fields

**Service Data** (`data/services.json`):

- ~196 services, none have `authority_tier` populated
- No resource indicators populated
- Manual classification needed for accurate authority tiers

---

## 3) Target Architecture

### Hybrid Scoring Approach

```
Request → Validate → DB Query (filters only) → Score in Memory → Sort → Paginate → Response
```

**Rationale**: PostgREST doesn't support complex scoring expressions. Moving all scoring to SQL would be fragile and hard to maintain. The hybrid approach:

- Keeps scoring logic in TypeScript (single source of truth)
- Allows code reuse between client and server
- Enables rapid iteration on ranking algorithms
- Maintains SQL simplicity (filters only)

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Search Request                            │
│  { query: "mental health", location: {lat, lng}, limit: 20 }│
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Query (Filters Only)                   │
│  SELECT * FROM services_public                               │
│  WHERE (name ILIKE '%mental health%'                         │
│     OR description ILIKE '%mental health%')                  │
│  LIMIT 100  -- Fetch candidates for scoring                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Server-Side Scoring (TypeScript)                   │
│  - Authority multiplier (government = 1.25x)                 │
│  - Verification multiplier (L3 = 1.2x)                       │
│  - Freshness multiplier (<30d = 1.1x)                        │
│  - Completeness boost (+22 max)                              │
│  - Proximity decay (if location provided)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Sort by Score (Descending)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Apply Pagination (limit, offset)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Return Results                            │
│  { data: ServicePublic[], meta: { total, limit, offset } }  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4) Key Design Decisions

| Decision                     | Recommendation                        | Rationale                          | Alternatives Considered                                               |
| :--------------------------- | :------------------------------------ | :--------------------------------- | :-------------------------------------------------------------------- |
| **Scoring location**         | Hybrid: DB filters, in-memory scoring | PostgREST limitations, code reuse  | Pure SQL (fragile), pure client (latency)                             |
| **Authority classification** | Auto-detect + manual overrides        | 90% automation, 10% human review   | Fully manual (slow), fully auto (inaccurate)                          |
| **Data storage**             | Both JSON and DB                      | Offline-first + server consistency | JSON only (no server ranking), DB only (offline breaks)               |
| **Enrichment approach**      | Generate both SQL and JSON updates    | User choice of deployment method   | SQL only, JSON only                                                   |
| **Proximity scoring**        | Optional location parameter           | Privacy-preserving, opt-in         | Always require location (privacy), never use location (less relevant) |

---

## 5) Technical Specifications

### 5.1 Database Schema Migration

**File**: `supabase/migrations/YYYYMMDDHHMMSS_add_authority_tier.sql`

```sql
-- Add authority_tier column for ranking
ALTER TABLE services ADD COLUMN IF NOT EXISTS
  authority_tier TEXT CHECK (authority_tier IN (
    'government', 'healthcare', 'established_nonprofit', 'community', 'unverified'
  ));

-- Add resource indicators as JSONB
ALTER TABLE services ADD COLUMN IF NOT EXISTS
  resource_indicators JSONB DEFAULT NULL;

-- Add index for authority-based sorting
CREATE INDEX IF NOT EXISTS idx_services_authority_tier
  ON services(authority_tier);

-- Update the services_public view to include new columns
CREATE OR REPLACE VIEW services_public AS
SELECT
  id, name, name_fr, description, description_fr,
  address, address_fr, phone, url, email,
  hours, fees, eligibility, application_process,
  languages, bus_routes, accessibility,
  last_verified, verification_status, category, tags,
  scope, virtual_delivery, primary_phone_label, created_at,
  -- NEW: v16.0 ranking fields
  authority_tier,
  resource_indicators
FROM services
WHERE published = true;
```

### 5.2 Server-Side Scoring Module

**File**: `lib/search/server-scoring.ts`

```typescript
/**
 * Server-side scoring wrapper.
 * Applies the same scoring logic as client-side but for ServicePublic objects.
 * v16.0: Search ranking enhancements.
 */
import { ServicePublic } from "@/types/service-public"
import {
  getAuthorityMultiplier,
  getCompletenessBoost,
  getVerificationMultiplier,
  getFreshnessMultiplier,
  WEIGHTS,
} from "./scoring"
import { getProximityMultiplier, calculateDistanceKm } from "./geo"

export interface ServerScoredResult {
  service: ServicePublic
  score: number
  matchReasons: string[]
}

export interface ServerScoringOptions {
  location?: { lat: number; lng: number }
  locale?: string
}

/**
 * Score services for server-side API.
 * Simplified vs client: no semantic matching (no vectors), no intent targeting.
 * Focus: authority, verification, freshness, completeness, proximity.
 */
export function scoreServicesServer(
  services: ServicePublic[],
  query: string,
  options: ServerScoringOptions = {}
): ServerScoredResult[] {
  const results: ServerScoredResult[] = []

  for (const service of services) {
    let score = 100 // Base score for keyword match (already filtered by DB)
    const matchReasons: string[] = ["Keyword Match"]

    // 1. Verification Level Multiplier
    const verificationMultiplier = getVerificationMultiplier(service.verification_status as any)
    if (verificationMultiplier !== 1.0) {
      score *= verificationMultiplier
      const boostPercent = Math.round((verificationMultiplier - 1) * 100)
      if (boostPercent > 0) {
        matchReasons.push(`Verification Boost (+${boostPercent}%)`)
      }
    }

    // 2. Freshness Multiplier
    const freshnessMultiplier = getFreshnessMultiplier(service.last_verified)
    if (freshnessMultiplier !== 1.0) {
      score *= freshnessMultiplier
      const boostPercent = Math.round((freshnessMultiplier - 1) * 100)
      if (boostPercent > 0) {
        matchReasons.push(`Fresh Data Boost (+${boostPercent}%)`)
      } else if (boostPercent < 0) {
        matchReasons.push(`Stale Data Penalty (${boostPercent}%)`)
      }
    }

    // 3. Authority Tier Multiplier
    const authorityMultiplier = getAuthorityMultiplier(service.authority_tier as any)
    if (authorityMultiplier !== 1.0) {
      score *= authorityMultiplier
      const boostPercent = Math.round((authorityMultiplier - 1) * 100)
      if (boostPercent > 0) {
        matchReasons.push(`Authority Boost (+${boostPercent}%)`)
      } else if (boostPercent < 0) {
        matchReasons.push(`Authority Penalty (${boostPercent}%)`)
      }
    }

    // 4. Completeness Boost (only if base match exists)
    const completenessResult = getCompletenessBoost(service as any)
    if (completenessResult.boost > 0) {
      score += completenessResult.boost
      matchReasons.push(...completenessResult.reasons)
    }

    // 5. Proximity Decay (if location provided)
    if (options.location && service.coordinates) {
      const distance = calculateDistanceKm(
        options.location.lat,
        options.location.lng,
        service.coordinates.lat,
        service.coordinates.lng
      )

      const isVirtual = service.virtual_delivery === true
      const isWideArea = service.scope === "ontario" || service.scope === "canada"

      const proximityMultiplier = getProximityMultiplier(distance, isVirtual, isWideArea)

      score *= proximityMultiplier

      if (!isVirtual && proximityMultiplier < 0.95) {
        const proximityPercent = Math.round(proximityMultiplier * 100)
        matchReasons.push(`Distance Adjusted (${Math.round(distance)}km, ${proximityPercent}%)`)
      }
    }

    results.push({ service, score, matchReasons })
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score)
}
```

### 5.3 Updated API Route

**File**: `app/api/v1/search/services/route.ts`

**Changes**:

1. Remove DB-side ordering (we'll re-sort in memory)
2. Fetch more candidates (100) for in-memory scoring
3. Apply `scoreServicesServer()`
4. Sort by score descending
5. Apply limit/offset after scoring
6. Support optional location parameter

**Updated Flow**:

```typescript
// 1. Parse request (add location support)
const { query, locale, filters, options, location } = parsed.data

// 2. Build DB query (filters only, no ORDER BY)
let dbQuery = supabase.from("services_public").select("*", { count: "exact" }).limit(100) // Fetch candidates for scoring

// 3. Apply filters (category, text search)
if (query.trim()) {
  const nameField = locale === "fr" ? "name_fr" : "name"
  const descField = locale === "fr" ? "description_fr" : "description"
  dbQuery = dbQuery.or(`${nameField}.ilike.%${query}%,${descField}.ilike.%${query}%`)
}

if (filters.category) {
  dbQuery = dbQuery.eq("category", filters.category)
}

// 4. Execute query
const { data, count, error } = await dbQuery

// 5. Score in memory
const scoredResults = scoreServicesServer(data, query, { location, locale })

// 6. Apply pagination
const paginatedResults = scoredResults.slice(offset, offset + limit)

// 7. Return
return createApiResponse(
  paginatedResults.map((r) => r.service),
  { meta: { total: count, limit, offset } }
)
```

### 5.4 Authority Tier Classification Rules

| Authority Tier          | Detection Rules                                                                                       | Examples                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `government`            | URL contains: `.gc.ca`, `.gov.on.ca`, `.canada.ca`, `ontario.ca`                                      | (None currently in data)                    |
| `healthcare`            | URL contains: `hospital`, `kingstonhsc`, `lhin` OR (intent_category=Health AND verification_level=L3) | KGH, Hotel Dieu, KCHC                       |
| `established_nonprofit` | Verification L2+ AND (has physical address OR is national organization)                               | Kids Help Phone, United Way, Salvation Army |
| `community`             | Local Kingston services with L1 verification                                                          | Most local services                         |
| `unverified`            | L0 verification OR no evidence_url                                                                    | (None currently)                            |

### 5.5 Enrichment Script

**File**: `scripts/enrich-authority-tiers.ts`

```typescript
/**
 * Enrichment script to auto-classify authority_tier for services.
 *
 * Usage:
 *   npx tsx scripts/enrich-authority-tiers.ts [--dry-run] [--format=json|sql|both]
 *
 * Outputs:
 *   --format=json: Updates data/services.json
 *   --format=sql: Generates migration SQL
 *   --format=both: Both of the above (default)
 */

import services from "../data/services.json"
import { Service, AuthorityTier } from "@/types/service"

interface ClassificationResult {
  id: string
  name: string
  url: string
  currentTier: AuthorityTier | undefined
  suggestedTier: AuthorityTier
  reason: string
  confidence: "high" | "medium" | "low"
}

function classifyService(service: Service): {
  tier: AuthorityTier
  reason: string
  confidence: "high" | "medium" | "low"
} {
  const url = service.url?.toLowerCase() || ""
  const name = service.name.toLowerCase()

  // Government detection (high confidence)
  if (
    url.includes(".gc.ca") ||
    url.includes(".gov.on.ca") ||
    url.includes(".canada.ca") ||
    url.includes("ontario.ca")
  ) {
    return {
      tier: "government",
      reason: "Government domain detected",
      confidence: "high",
    }
  }

  // Healthcare detection (high confidence)
  if (
    url.includes("kingstonhsc") ||
    url.includes("hospital") ||
    name.includes("hospital") ||
    name.includes("health centre")
  ) {
    return {
      tier: "healthcare",
      reason: "Healthcare organization detected",
      confidence: "high",
    }
  }

  // Known established nonprofits (medium confidence - manual list)
  const establishedNonprofits = [
    "kids-help-phone",
    "united-way",
    "salvation-army",
    "red-cross",
    "cmha",
    "canadian-mental-health",
    "hope-for-wellness",
    "trans-lifeline",
    "assaulted-womens-helpline",
    "victim-services",
  ]
  if (establishedNonprofits.some((id) => service.id.includes(id))) {
    return {
      tier: "established_nonprofit",
      reason: "Known national/provincial nonprofit",
      confidence: "medium",
    }
  }

  // High verification = established (medium confidence)
  if (service.verification_level === "L3" || service.verification_level === "L2") {
    if (service.address || service.scope === "canada" || service.scope === "ontario") {
      return {
        tier: "established_nonprofit",
        reason: "High verification level with physical presence",
        confidence: "medium",
      }
    }
  }

  // Default (low confidence - needs review)
  return {
    tier: "community",
    reason: "Default community classification",
    confidence: "low",
  }
}

// Main execution
const results: ClassificationResult[] = services.map((service) => {
  const { tier, reason, confidence } = classifyService(service)
  return {
    id: service.id,
    name: service.name,
    url: service.url,
    currentTier: service.authority_tier,
    suggestedTier: tier,
    reason,
    confidence,
  }
})

// Output results
console.log(`\nClassification Results:\n`)
console.log(`Total services: ${results.length}`)
console.log(`Government: ${results.filter((r) => r.suggestedTier === "government").length}`)
console.log(`Healthcare: ${results.filter((r) => r.suggestedTier === "healthcare").length}`)
console.log(`Established Nonprofit: ${results.filter((r) => r.suggestedTier === "established_nonprofit").length}`)
console.log(`Community: ${results.filter((r) => r.suggestedTier === "community").length}`)
console.log(`Unverified: ${results.filter((r) => r.suggestedTier === "unverified").length}`)

// Services needing manual review (low confidence)
const needsReview = results.filter((r) => r.confidence === "low")
console.log(`\n⚠️  Services needing manual review: ${needsReview.length}`)
needsReview.forEach((r) => {
  console.log(`  - ${r.name} (${r.id}): ${r.reason}`)
})
```

---

## 6) Implementation Phases

The following 4 phases should be executed sequentially:

### Phase 1: Database Schema Update (~1 hour)

**Objective**: Add authority_tier and resource_indicators columns

**Tasks**:

- [ ] Create migration file `supabase/migrations/YYYYMMDDHHMMSS_add_authority_tier.sql`
- [ ] Add `authority_tier` column with CHECK constraint
- [ ] Add `resource_indicators` JSONB column
- [ ] Create index on `authority_tier`
- [ ] Update `services_public` view to include new columns
- [ ] Run migration in development environment
- [ ] Verify view includes new columns: `SELECT * FROM services_public LIMIT 1`
- [ ] Run existing API tests to ensure no breakage

**Exit Criteria**:

- Migration runs successfully
- View exposes `authority_tier` and `resource_indicators`
- No existing tests broken

---

### Phase 2: Server API Scoring Enhancement (~2-3 hours)

**Objective**: Apply client-side scoring logic to server-side search

#### 2.1 Create Server-Side Scoring Module

**Tasks**:

- [ ] Create `lib/search/server-scoring.ts`
- [ ] Implement `scoreServicesServer()` function
- [ ] Apply authority, verification, freshness, completeness multipliers
- [ ] Add proximity decay for location-aware searches
- [ ] Unit test scoring function with mock services

#### 2.2 Update API Route

**Tasks**:

- [ ] Modify `app/api/v1/search/services/route.ts`
- [ ] Remove DB-side `ORDER BY` clauses
- [ ] Increase candidate fetch limit to 100
- [ ] Integrate `scoreServicesServer()`
- [ ] Sort results by score descending
- [ ] Apply pagination after scoring
- [ ] Handle crisis detection boost

#### 2.3 Update Request Schema

**Tasks**:

- [ ] Modify `lib/schemas/search.ts`
- [ ] Add optional `location` parameter: `{ lat: number, lng: number }`
- [ ] Validate latitude (-90 to 90) and longitude (-180 to 180)
- [ ] Update API documentation

#### 2.4 Tests

**Tasks**:

- [ ] Create `tests/unit/server-scoring.test.ts`
- [ ] Test authority tier ranking (government > community)
- [ ] Test completeness boost (full data > sparse data)
- [ ] Test proximity decay (near > far)
- [ ] Update `tests/api/v1/search-api.test.ts` with ranking tests

**Exit Criteria**:

- Server API applies all scoring factors
- Tests verify ranking behavior
- Backward compatibility maintained

---

### Phase 3: Authority Tier Data Enrichment (~1-2 hours)

**Objective**: Populate authority_tier for all existing services

#### 3.1 Create Enrichment Script

**Tasks**:

- [ ] Create `scripts/enrich-authority-tiers.ts`
- [ ] Implement classification rules (government, healthcare, nonprofit, community)
- [ ] Add confidence scoring (high/medium/low)
- [ ] Generate classification report
- [ ] Identify services needing manual review

#### 3.2 Generate Outputs

**Tasks**:

- [ ] Run script with `--dry-run` to preview classifications
- [ ] Generate updated `data/services.json` with authority_tier field
- [ ] Generate SQL migration with UPDATE statements
- [ ] Create manual review list for low-confidence classifications

#### 3.3 Manual Review

**Tasks**:

- [ ] Review low-confidence classifications
- [ ] Override auto-classifications where needed
- [ ] Document manual overrides in script comments
- [ ] Finalize authority tier assignments

**Exit Criteria**:

- All services have authority_tier assigned
- High-confidence classifications validated
- Manual overrides documented

---

### Phase 4: Verification & Rollout (~1 hour)

**Objective**: Verify search quality improvements and deploy

#### 4.1 Test Suite

**Tasks**:

- [ ] Run unit tests: `npm run test -- --run tests/unit/server-scoring.test.ts`
- [ ] Run API tests: `npm run test -- --run tests/api/v1/search-api.test.ts`
- [ ] Run integration tests: `npm run test -- --run tests/integration/search.test.ts`
- [ ] Verify all 36+ tests pass

#### 4.2 Manual Verification

**Test Cases**:

| Query                  | Expected Behavior                                                             |
| ---------------------- | ----------------------------------------------------------------------------- |
| "mental health"        | CMHA, official health services ranked above community groups                  |
| "food bank"            | Established food banks (Salvation Army, Partners in Mission) above newer orgs |
| "crisis"               | 24/7 crisis lines at top, all Crisis category boosted                         |
| "help" (with location) | Nearby services prioritized among similar scores                              |
| "hospital"             | KGH, Hotel Dieu at top (healthcare authority tier)                            |

**Tasks**:

- [ ] Test each query in development
- [ ] Verify ranking matches expectations
- [ ] Check match reasons for transparency
- [ ] Test with and without location parameter

#### 4.3 Deployment

**Tasks**:

- [ ] Deploy database migration to staging
- [ ] Deploy updated API code to staging
- [ ] Update services.json in staging
- [ ] Smoke test staging search
- [ ] Deploy to production
- [ ] Monitor error rates and search quality

**Exit Criteria**:

- All tests pass
- Manual verification confirms improved ranking
- Production deployment successful
- No regressions in search functionality

---

## 7) Success Metrics

### Quantitative

- **Test Coverage**: 40+ tests passing (36 existing + 4+ new server tests)
- **API Response Time**: <200ms for typical search (100 candidates scored)
- **Classification Accuracy**: >90% auto-classification confidence
- **Zero Regressions**: All existing search tests continue passing

### Qualitative

- **Authority Ranking**: Government/healthcare services consistently rank above community services for generic queries
- **Completeness Reward**: Services with full contact info rank higher than sparse listings
- **Proximity Relevance**: Location-aware searches prioritize nearby services
- **User Feedback**: Improved search relevance reported by users (future metric)

---

## 8) Risks & Mitigations

| Risk                                | Impact | Probability | Mitigation                                                                  |
| :---------------------------------- | :----- | :---------- | :-------------------------------------------------------------------------- |
| **Auto-classification errors**      | Medium | Medium      | Manual review of low-confidence classifications, override mechanism         |
| **API performance degradation**     | High   | Low         | Limit candidate fetch to 100, monitor response times, add caching if needed |
| **Database migration failure**      | High   | Low         | Test in development first, backup before production migration               |
| **Backward compatibility break**    | Medium | Low         | Maintain existing API contract, make location optional                      |
| **Incorrect authority assignments** | Medium | Medium      | Document classification rules, provide manual override process              |

---

## 9) Future Enhancements (Post-v16.0)

- **Popularity Signals**: Integrate view/click analytics for ranking (requires analytics infrastructure)
- **User Feedback Loop**: Allow users to report incorrect rankings
- **Machine Learning Ranking**: Train model on user behavior (long-term)
- **Real-time Updates**: Invalidate cache when service data changes
- **Advanced Proximity**: Factor in transit routes, not just straight-line distance
- **Semantic Search on Server**: Migrate vector search to server (requires vector DB)

---

## 10) User Review Required

> [!CAUTION]
> Before proceeding with implementation, confirm:

1. **Database Access**: Do you have access to run migrations in Supabase?
   - [ ] Yes, I can run migrations
   - [ ] No, need to set up access

2. **Enrichment Approach Preference**:
   - [ ] (A) Update `services.json` only (offline-first)
   - [ ] (B) SQL migration to update DB directly
   - [ ] (C) Both (recommended for full-stack consistency)

3. **Deploy Timeline**:
   - [ ] (A) Implement immediately after approval
   - [ ] (B) Schedule for future sprint/version

4. **Manual Authority Tier Overrides**: Any services that should be classified differently than auto-detection would suggest?
   - [ ] No, auto-classification looks good
   - [ ] Yes, I'll provide override list

---

## Appendix A: Implementation Checklist

### Implementation Phase 1: Database Schema

- [ ] Create migration file
- [ ] Add authority_tier column
- [ ] Add resource_indicators column
- [ ] Create index
- [ ] Update services_public view
- [ ] Test migration

### Phase 2: Server API

- [ ] Create server-scoring.ts
- [ ] Update API route
- [ ] Update request schema
- [ ] Write unit tests
- [ ] Write API tests

### Implementation Phase 3: Data Enrichment

- [ ] Create enrichment script
- [ ] Run dry-run classification
- [ ] Generate JSON updates
- [ ] Generate SQL migration
- [ ] Manual review
- [ ] Finalize classifications

### Phase 4: Verification

- [ ] Run all tests
- [ ] Manual verification
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor

---

## Appendix B: Estimated Effort

| Implementation Phase     | Tasks        | Estimated Time |
| :----------------------- | :----------- | :------------- |
| Phase 1: DB Schema       | 8 tasks      | 1 hour         |
| Phase 2: Server API      | 14 tasks     | 2-3 hours      |
| Phase 3: Data Enrichment | 9 tasks      | 1-2 hours      |
| Phase 4: Verification    | 10 tasks     | 1 hour         |
| **Total**                | **41 tasks** | **5-7 hours**  |

---

## Appendix C: Related Documents

- v16.0 Client-Side Walkthrough (local reference removed) - Completed client-side implementation summary
- Search Architecture ADR: `docs/adr/001-modular-search-architecture.md` - Modular search design decisions
- Librarian Model ADR: `docs/adr/003-librarian-model-public-search.md` - Privacy-preserving search architecture
