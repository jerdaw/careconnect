---
status: planned
last_updated: 2026-01-19
owner: jer
tags: [roadmap, v17.1, testing, quality, coverage, vitest]
---

# v17.1: Test Coverage & Quality Gates

**Priority:** HIGH
**Estimated Effort:** 3-4 weeks (single developer, ~290 tests)
**Dependencies:** v17.0 (RLS policies + authorization tests)
**Current Coverage:** 45.64% statements
**Target Coverage:** 75%+ statements

## Executive Summary

This release significantly increases test coverage from 45% to 75%+ by systematically addressing untested critical paths. The focus is on high-impact areas: search engine core, AI system, offline infrastructure, and critical UI components.

## Testing Philosophy

> **Quality over quantity**: A well-designed test that catches real bugs is worth more than 10 tests checking trivial behaviors.

**Guiding Principles:**
1. **Test behavior, not implementation** - Tests shouldn't break when refactoring
2. **Prioritize critical paths** - Search, offline sync, authorization
3. **Security tests first** - Authorization, input validation (aligns with v17.0)
4. **Integration over unit where possible** - User journeys catch more bugs
5. **No flaky tests** - If a test fails intermittently, fix or delete it

## Strategy (Priority Order)

- **Phase 0:** Security-critical tests (authorization, input validation) - from v17.0
- **Phase 1:** Critical library modules (search, AI, offline)
- **Phase 2:** Major UI components
- **Phase 3:** API routes and integration tests
- **Phase 4:** Edge cases and error scenarios

---

## Phase 0: Security-Critical Tests (from v17.0)

**Goal:** Ensure authorization and security features have comprehensive tests before other test coverage work.

> [!NOTE]
> These tests are defined in v17.0 but executed as part of v17.1 testing effort.

### 0.1 RLS Policy Tests

**New file:** `tests/api/rls-policies.test.ts`

```typescript
describe('RLS Policies', () => {
  describe('services table', () => {
    it('allows public read of verified services (L1+)')
    it('blocks read of unverified services (L0)')
    it('blocks read of soft-deleted services')
    it('allows org member to insert for own org')
    it('blocks insert for other org')
    it('allows editor/admin to update own org services')
    it('blocks viewer from updating')
    it('blocks update of other org services')
    it('allows admin/owner to delete own org services')
    it('blocks editor from deleting')
  })

  describe('organization_members table', () => {
    it('allows users to see own memberships')
    it('blocks viewing other users memberships')
    it('allows org admins to manage members')
  })
})
```

**Estimated test count:** 15-20 tests
**Priority:** P0 - Must pass before production

### 0.2 Authorization Utility Tests

**New file:** `tests/lib/auth/authorization.test.ts`

```typescript
describe('assertServiceOwnership', () => {
  it('passes for service owner')
  it('throws AuthorizationError for non-owner')
  it('throws for deleted service')
})

describe('assertOrganizationMembership', () => {
  it('passes for any org member')
  it('passes for required role')
  it('throws for insufficient role')
  it('throws for non-member')
})

describe('getEffectivePermissions', () => {
  it('returns correct permissions for owner')
  it('returns correct permissions for viewer')
})
```

**Estimated test count:** 10-12 tests

---

## Phase 0.5: Next.js 15 App Router Testing Patterns (CRITICAL)

**Goal:** Establish standardized mocking patterns for Next.js 15's async server component APIs to prevent test failures.

> [!IMPORTANT]
> **Lesson from v17.0:** All API route tests failed initially because `next/headers` and `@supabase/ssr` weren't mocked. This phase establishes the standard patterns to prevent similar issues.

### 0.5.1 Standard Mock Setup

**New file:** `tests/setup/next-mocks.ts`

```typescript
import { vi } from 'vitest'

/**
 * Standard Next.js 15 mocking setup for API route tests.
 * Import this at the top of EVERY API route test file.
 */

// Mock next/headers (required for all route handlers using cookies/headers)
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: vi.fn().mockReturnValue([]),
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: vi.fn().mockReturnValue(new Map()),
}))

// Mock @supabase/ssr (required for all auth-protected routes)
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}))
```

**Estimated setup time:** 2 hours

### 0.5.2 API Route Testing Template

**All API route tests MUST follow this pattern:**

```typescript
/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// CRITICAL: Import mocks BEFORE route handler
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  }),
}))

// Now import the route handler
import { GET } from '@/app/api/v1/services/route'

describe('GET /api/v1/services', () => {
  it('returns 200 with services', async () => {
    // CRITICAL: Set Content-Type header
    const request = new NextRequest('http://localhost:3000/api/v1/services', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const response = await GET(request)
    expect(response.status).toBe(200)
  })
})
```

**Key Requirements:**
- ✅ Use `/** @vitest-environment node */` comment
- ✅ Mock `next/headers` before importing route
- ✅ Mock `@supabase/ssr` for auth routes
- ✅ Set `Content-Type: application/json` header for POST/PUT/PATCH requests
- ✅ Use `NextRequest` constructor for request objects

### 0.5.3 Content-Type Validation Pattern

All mutation endpoints (POST/PUT/PATCH) now enforce `Content-Type: application/json` (from v17.0).

**Required pattern for POST/PUT/PATCH tests:**

```typescript
const request = new NextRequest('http://localhost:3000/api/v1/services', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',  // REQUIRED or you get 415
  },
  body: JSON.stringify({ name: 'Test Service' }),
})
```

**Common error if missing:**
```
expected 415 to be 201 // Object.is equality
```

### 0.5.4 Authorization Mock Patterns

**For routes using `assertServiceOwnership`:**

```typescript
vi.mock('@/lib/auth/authorization', () => ({
  assertServiceOwnership: vi.fn().mockResolvedValue(true),
  assertAdminRole: vi.fn().mockResolvedValue(true),
}))
```

**For testing authorization failures:**

```typescript
import { AuthorizationError } from '@/lib/api-utils'

vi.mock('@/lib/auth/authorization', () => ({
  assertServiceOwnership: vi.fn().mockRejectedValue(
    new AuthorizationError('Access denied')
  ),
}))
```

**Estimated test count:** 5-8 mock pattern tests
**Priority:** P0 - Must be established before any test writing

### 0.5.5 Verify Mock Setup

**New file:** `tests/setup/verify-mocks.test.ts`

```typescript
import { describe, it, expect } from 'vitest'

describe('Mock Setup Verification', () => {
  it('next/headers is mocked', () => {
    const { cookies } = require('next/headers')
    expect(cookies).toBeDefined()
    expect(typeof cookies).toBe('function')
  })

  it('@supabase/ssr is mocked', () => {
    const { createServerClient } = require('@supabase/ssr')
    expect(createServerClient).toBeDefined()
  })

  it('authorization utilities are mockable', () => {
    const { assertServiceOwnership } = require('@/lib/auth/authorization')
    expect(assertServiceOwnership).toBeDefined()
  })
})
```

**Success Criteria:**
- [ ] All mock verification tests pass
- [ ] Template pattern documented
- [ ] At least 2 API route tests refactored to use pattern successfully

---

## Phase 1: Library Core Coverage (1.5 weeks)

### 1.1 Search Engine Core (`lib/search/`)

**Current Status:** 72.61% (variable)
- `lib/search/data.ts`: 0% → 80%
- `lib/search/index.ts`: 34% → 65%
- `lib/search/vector.ts`: 7% → 50%
- `lib/search/lifecycle.ts`: 0% → 70%
- `lib/search/search-mode.ts`: 0% → 70%

#### 1.1.1 Data Loading (`lib/search/data.ts`)

**New file:** `tests/lib/search/data.test.ts`

Test coverage for data loading orchestration:

```typescript
describe('loadServices', () => {
  describe('with Supabase available', () => {
    it('loads services from Supabase')
    it('overlays AI metadata from JSON')
    it('caches result in memory')
    it('returns correct Service[] type')
  })

  describe('with Supabase unavailable', () => {
    it('falls back to local JSON')
    it('loads from IndexedDB on client')
    it('logs fallback event')
  })

  describe('data transformation', () => {
    it('converts VerificationLevel to multiplier')
    it('merges synthetic_queries from JSON')
    it('handles missing optional fields')
  })

  describe('error handling', () => {
    it('throws on malformed JSON')
    it('retries Supabase connection once')
    it('surfaces error with helpful message')
  })
})

describe('getServiceById', () => {
  it('returns service from cache')
  it('falls back to Supabase query')
  it('returns null for missing service')
})
```

**Estimated test count:** 12-15 tests

#### 1.1.2 Search Orchestrator (`lib/search/index.ts`)

**Modify:** `tests/lib/search/index.test.ts`

Expand from 34% to 65% coverage:

```typescript
describe('searchServices', () => {
  describe('happy path', () => {
    it('returns results for valid query')
    it('applies category filters')
    it('filters by openNow status')
    it('applies verification multipliers')
    it('sorts by score descending')
  })

  describe('keyword matching', () => {
    it('matches service name')
    it('matches description')
    it('matches category')
    it('handles synonym expansion')
    it('matches partial words')
  })

  describe('crisis detection', () => {
    it('detects suicide keywords')
    it('detects abuse keywords')
    it('boosts crisis services to top')
    it('returns crisis services regardless of score')
  })

  describe('scoring', () => {
    it('applies L3 multiplier (1.5x)')
    it('applies L2 multiplier (1.2x)')
    it('applies L1 multiplier (1.0x)')
    it('boosts recently verified services')
  })

  describe('vector search', () => {
    it('uses embeddings if provided')
    it('weights vector score (30%)')
    it('weights keyword score (70%)')
  })

  describe('geo-distance', () => {
    it('calculates distance correctly')
    it('applies proximity decay multiplier')
    it('handles missing coordinates gracefully')
  })

  describe('edge cases', () => {
    it('handles empty query string')
    it('handles very long query')
    it('returns empty array for no matches')
    it('handles null/undefined inputs')
  })
})
```

**Estimated test count:** 25-30 tests
**Files to modify:**
- `tests/lib/search/index.test.ts` - Add missing test cases
- `tests/lib/search/scoring.test.ts` - Expand edge case coverage

#### 1.1.3 Vector Similarity (`lib/search/vector.ts`)

**New file:** `tests/lib/search/vector.test.ts`

Expand from 7% to 50% coverage:

```typescript
describe('cosineSimilarity', () => {
  it('returns 1.0 for identical vectors')
  it('returns 0.0 for orthogonal vectors')
  it('returns negative values for opposite vectors')
  it('handles zero vectors')
  it('normalizes high-dimensional vectors')
})

describe('searchByVector', () => {
  it('ranks services by similarity')
  it('filters by similarity threshold')
  it('handles empty embedding database')
  it('handles query with no embedding')
})

describe('vectorToQueryString', () => {
  it('converts vector to SQL format')
  it('escapes special characters')
})

describe('edge cases', () => {
  it('handles NaN values in vectors')
  it('handles Infinity values')
  it('handles very small floating point errors')
  it('performs well with 1000+ services')
})
```

**Estimated test count:** 12-15 tests

#### 1.1.4 Vector Store Lifecycle (`lib/search/lifecycle.ts`)

**New file:** `tests/lib/search/lifecycle.test.ts`

```typescript
describe('initializeVectorStore', () => {
  it('loads embeddings from file')
  it('creates in-memory index')
  it('returns vector count')
  it('handles missing embeddings file')
})

describe('vector persistence', () => {
  it('saves vectors to IndexedDB')
  it('loads vectors from IndexedDB cache')
  it('validates vector integrity')
  it('updates on new embeddings')
})

describe('error recovery', () => {
  it('recovers from corrupted IndexedDB')
  it('falls back to file-based embeddings')
  it('logs initialization errors')
})
```

**Estimated test count:** 10 tests

#### 1.1.5 Search Mode Detection (`lib/search/search-mode.ts`)

**New file:** `tests/lib/search/search-mode.test.ts`

```typescript
describe('getSearchMode', () => {
  it('returns "local" when NEXT_PUBLIC_SEARCH_MODE=local')
  it('returns "server" when NEXT_PUBLIC_SEARCH_MODE=server')
  it('defaults to "local"')
})

describe('searchServices', () => {
  describe('local mode', () => {
    it('uses client-side search')
    it('does not send query to server')
  })

  describe('server mode', () => {
    it('sends POST to /api/v1/search/services')
    it('passes query and filters')
    it('returns server results')
  })

  describe('error handling', () => {
    it('falls back to local on server error')
    it('logs server failures')
  })
})
```

**Estimated test count:** 8 tests

---

### 1.2 AI System (`lib/ai/`)

**Current Status:** 66.91%
- `lib/ai/engine.ts`: 57% → 85%
- `lib/ai/webllm.worker.ts`: 0% → 50%

#### 1.2.1 AI Engine (`lib/ai/engine.ts`)

**Modify:** `tests/lib/ai/engine.test.ts`

Expand from 57% to 85% coverage:

```typescript
describe('refineSearchQuery', () => {
  describe('input processing', () => {
    it('expands query with synonyms')
    it('detects implicit filters')
    it('extracts location context')
    it('identifies service type')
  })

  describe('JSON output', () => {
    it('returns valid JSON structure')
    it('includes expanded_query field')
    it('includes implicit_filters field')
    it('includes confidence scores')
  })

  describe('crisis handling', () => {
    it('bypasses AI for suicide keywords')
    it('returns crisis flag immediately')
  })

  describe('error handling', () => {
    it('handles WebGPU unavailable')
    it('handles model load failure')
    it('returns original query on error')
  })
})

describe('chat context management', () => {
  it('maintains conversation history')
  it('enforces max history length')
  it('includes relevant service data')
  it('truncates long messages')
})

describe('model lifecycle', () => {
  it('loads model on first use')
  it('caches model in memory')
  it('unloads after idle timeout')
  it('reloads after unload')
})

describe('streaming', () => {
  it('streams response tokens')
  it('yields partial results')
  it('completes stream normally')
  it('handles stream interruption')
})

describe('inference', () => {
  it('generates chat responses')
  it('respects system prompt')
  it('includes service context')
  it('stays on-topic for social services')
})
```

**Estimated test count:** 20-25 tests

#### 1.2.2 WebLLM Engine Logic (`lib/ai/webllm-engine.ts`)

> [!IMPORTANT]
> **Architectural Decision:** Vitest cannot reliably test Web Workers. Instead, extract testable logic from the worker into a separate module and test that module directly. E2E test the worker integration separately.

**Step 1: Extract Worker Logic** (Refactor)

Create **new file:** `lib/ai/webllm-engine.ts`

```typescript
/**
 * Extracted WebLLM logic for unit testing.
 * This logic will be called by the worker in lib/ai/webllm.worker.ts
 */

export class WebLLMEngine {
  private model: any = null
  private isInitialized = false

  async loadModel(modelId: string) {
    // Extract current worker logic here
    // Return status
  }

  async runInference(prompt: string, options: any) {
    if (!this.isInitialized) {
      throw new Error('Model not loaded')
    }
    // Extract inference logic
  }

  unload() {
    this.model = null
    this.isInitialized = false
  }

  get ready() {
    return this.isInitialized
  }
}
```

**Step 2: Refactor Worker to Use Engine**

**Modify:** `lib/ai/webllm.worker.ts`

```typescript
import { WebLLMEngine } from './webllm-engine'

const engine = new WebLLMEngine()

self.onmessage = async (e) => {
  if (e.data.type === 'load') {
    try {
      await engine.loadModel(e.data.modelId)
      self.postMessage({ type: 'ready' })
    } catch (error) {
      self.postMessage({ type: 'error', error })
    }
  }

  if (e.data.type === 'infer') {
    try {
      const result = await engine.runInference(e.data.prompt, e.data.options)
      self.postMessage({ type: 'result', data: result })
    } catch (error) {
      self.postMessage({ type: 'error', error })
    }
  }
}
```

**Step 3: Test the Extracted Engine**

**New file:** `tests/lib/ai/webllm-engine.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebLLMEngine } from '@/lib/ai/webllm-engine'

describe('WebLLMEngine', () => {
  let engine: WebLLMEngine

  beforeEach(() => {
    engine = new WebLLMEngine()
  })

  describe('loadModel', () => {
    it('initializes engine', async () => {
      await engine.loadModel('test-model-id')
      expect(engine.ready).toBe(true)
    })

    it('throws on invalid modelId', async () => {
      await expect(engine.loadModel('')).rejects.toThrow()
    })
  })

  describe('runInference', () => {
    it('runs inference when ready', async () => {
      await engine.loadModel('test-model')
      const result = await engine.runInference('test prompt', {})
      expect(result).toBeDefined()
    })

    it('throws if model not loaded', async () => {
      await expect(engine.runInference('test', {})).rejects.toThrow('Model not loaded')
    })
  })

  describe('unload', () => {
    it('resets engine state', async () => {
      await engine.loadModel('test-model')
      engine.unload()
      expect(engine.ready).toBe(false)
    })
  })
})
```

**Step 4: E2E Test Worker Integration (Playwright)**

Worker integration should be tested via E2E:

```typescript
// tests/e2e/ai-worker.spec.ts (Playwright)
test('AI worker loads and responds', async ({ page }) => {
  await page.goto('/chat')
  await page.click('[data-testid="enable-ai"]')
  await page.waitForSelector('[data-testid="ai-ready"]')
  // Verify worker loaded successfully
})
```

**Estimated test count:** 10-12 tests (engine logic only)
**Note:** Worker integration verified via E2E, not unit tests

---

### 1.3 Offline Infrastructure (`lib/offline/`)

**Current Status:** 53.71% (CRITICAL GAPS)

#### 1.3.1 Offline Feedback Sync (`lib/offline/feedback.ts`)

**Current:** 2.17% (CRITICAL - only 1 line tested)

**New file:** `tests/lib/offline/feedback.test.ts`

```typescript
describe('queueFeedback', () => {
  it('stores feedback in pending queue')
  it('assigns pending UUID')
  it('sets created timestamp')
  it('marks as unsync on offline')
})

describe('syncFeedback', () => {
  describe('with network available', () => {
    it('sends all pending feedback')
    it('removes feedback on success')
    it('updates sync status')
    it('returns successful count')
  })

  describe('with network unavailable', () => {
    it('returns queued without sending')
    it('keeps feedback in queue')
  })
})

describe('retry logic', () => {
  it('retries failed feedback (max 5 times)')
  it('exponential backoff (1s, 2s, 4s, 8s, 16s)')
  it('clears feedback after max retries')
  it('logs retry attempts')
})

describe('cleanup', () => {
  it('deletes sent feedback from IndexedDB')
  it('handles deletion errors gracefully')
  it('maintains data integrity')
})

describe('edge cases', () => {
  it('handles network interruption mid-sync')
  it('recovers from corrupted queue data')
  it('handles IndexedDB quota exceeded')
  it('deduplicates identical feedback')
})

describe('offline state transitions', () => {
  it('queues feedback when going offline')
  it('syncs when coming back online')
  it('handles rapid online/offline cycles')
})
```

**Estimated test count:** 25-30 tests

#### 1.3.2 Offline Cache (`lib/offline/cache.ts`)

**Modify:** `tests/lib/offline/cache.test.ts`

Expand from 56% to 80% coverage:

```typescript
describe('cacheServices', () => {
  it('stores services in IndexedDB')
  it('updates existing services')
  it('prunes old entries')
  it('handles quota exceeded')
})

describe('cache invalidation', () => {
  it('invalidates by timestamp')
  it('invalidates by service ID')
  it('invalidates all on refresh')
  it('logs invalidation events')
})

describe('time-based expiration', () => {
  it('marks stale after 24 hours')
  it('removes expired entries')
  it('respects custom TTL')
})

describe('error scenarios', () => {
  it('handles IndexedDB errors')
  it('falls back to memory if DB fails')
  it('recovers from corrupted cache')
})
```

**Estimated test count:** 15-18 tests

#### 1.3.3 Offline Database (`lib/offline/db.ts`)

**Modify:** `tests/lib/offline/db.test.ts`

Expand from 56% to 80% coverage:

```typescript
describe('database operations', () => {
  describe('CRUD', () => {
    it('creates service record')
    it('reads service by ID')
    it('updates service')
    it('deletes service')
  })

  describe('bulk operations', () => {
    it('loads all services')
    it('bulk inserts (196 services)')
    it('bulk updates')
    it('clears all records')
  })
})

describe('schema', () => {
  it('creates stores on first init')
  it('validates schema version')
  it('handles schema migration')
  it('indexes by ID')
})

describe('performance', () => {
  it('handles 1000+ records efficiently')
  it('indexes optimize queries')
  it('cursor operations work')
})

describe('error handling', () => {
  it('handles IndexedDB not available')
  it('recovers from quota exceeded')
  it('handles corrupted records')
  it('logs database errors')
})
```

**Estimated test count:** 18-20 tests

---

### 1.4 Analytics (`lib/analytics/`)

**Current Status:** 26.31%

#### 1.4.1 Search Analytics (`lib/analytics/search-analytics.ts`)

**New file:** `tests/lib/analytics/search-analytics.test.ts`

```typescript
describe('recordSearchEvent', () => {
  describe('privacy', () => {
    it('does NOT log query text')
    it('does NOT log user IP')
    it('logs only result count')
    it('logs search timestamp')
  })

  describe('result bucketing', () => {
    it('buckets 0 results as "0"')
    it('buckets 1-5 as "1-5"')
    it('buckets 5+ as "5+"')
  })

  describe('submission', () => {
    it('submits to Supabase analytics table')
    it('retries on network error')
    it('handles Supabase unavailable')
  })

  describe('error scenarios', () => {
    it('continues if analytics fails')
    it('does not block search')
    it('logs errors')
  })
})

describe('compliance', () => {
  it('complies with PIPEDA (no PII)')
  it('complies with GDPR (no tracking)')
})
```

**Estimated test count:** 12-15 tests

---

## Phase 2: Component Testing (1 week)

### 2.1 Critical Components

#### 2.1.1 ChatAssistant (`components/ai/ChatAssistant.tsx`)

**New file:** `tests/components/ai/ChatAssistant.test.tsx`

449 lines, currently 0% coverage.

```typescript
describe('ChatAssistant', () => {
  describe('rendering', () => {
    it('displays chat interface')
    it('shows message history')
    it('shows input field')
    it('shows send button')
  })

  describe('user interactions', () => {
    it('sends message on button click')
    it('sends message on Enter key')
    it('clears input after send')
    it('disables input while loading')
  })

  describe('AI responses', () => {
    it('receives and displays AI response')
    it('streams response token-by-token')
    it('shows loading indicator while streaming')
  })

  describe('conversation context', () => {
    it('maintains message history')
    it('includes recent messages in context')
    it('truncates old messages')
  })

  describe('error handling', () => {
    it('shows error on AI failure')
    it('allows retry after error')
    it('continues chat after error')
  })

  describe('accessibility', () => {
    it('has proper ARIA labels')
    it('is keyboard navigable')
    it('announces new messages')
  })
})
```

**Estimated test count:** 18-22 tests

#### 2.1.2 SearchBar (`components/home/SearchBar.tsx`)

**New file:** `tests/components/home/SearchBar.test.tsx`

99 lines, currently 0% coverage.

```typescript
describe('SearchBar', () => {
  describe('rendering', () => {
    it('displays search input')
    it('displays search button')
    it('displays voice input button')
  })

  describe('search submission', () => {
    it('submits search on button click')
    it('submits search on Enter key')
    it('calls onSearch callback')
    it('passes query value')
  })

  describe('voice input', () => {
    it('starts recording on voice button click')
    it('stops recording on second click')
    it('shows recording indicator')
    it('transcribes audio')
  })

  describe('input handling', () => {
    it('updates value on input change')
    it('trims whitespace')
    it('handles special characters')
  })

  describe('saved searches', () => {
    it('shows save search button')
    it('saves search on click')
    it('shows saved searches dropdown')
  })

  describe('accessibility', () => {
    it('has proper labels')
    it('is keyboard navigable')
    it('works with screen readers')
  })
})
```

**Estimated test count:** 15-18 tests

#### 2.1.3 SearchResultsList (`components/home/SearchResultsList.tsx`)

**New file:** `tests/components/home/SearchResultsList.test.tsx`

125 lines, currently 0% coverage.

```typescript
describe('SearchResultsList', () => {
  describe('rendering', () => {
    it('displays result items')
    it('shows service name')
    it('shows service address')
    it('shows distance')
  })

  describe('result interactions', () => {
    it('navigates to service detail on click')
    it('shows match reason highlights')
    it('displays contact button')
  })

  describe('verification badges', () => {
    it('shows L3 badge for verified services')
    it('shows L2 badge')
    it('shows L1 badge')
    it('hides L0 services')
  })

  describe('empty state', () => {
    it('shows "no results" message')
    it('suggests alternative searches')
  })

  describe('crisis results', () => {
    it('prioritizes crisis services')
    it('shows crisis indicator')
    it('displays emergency contact prominently')
  })

  describe('accessibility', () => {
    it('results are semantically linked')
    it('keyboard navigable')
  })
})
```

**Estimated test count:** 15-18 tests

#### 2.1.4 EmergencyModal (`components/ui/EmergencyModal.tsx`)

**New file:** `tests/components/ui/EmergencyModal.test.tsx`

157 lines, currently 0% coverage.

```typescript
describe('EmergencyModal', () => {
  describe('rendering', () => {
    it('displays when crisis detected')
    it('hidden when not crisis')
    it('shows crisis message')
    it('shows emergency contacts')
  })

  describe('emergency contacts', () => {
    it('displays crisis line phone')
    it('displays 911 option')
    it('shows hospital finder link')
  })

  describe('interactions', () => {
    it('calls phone on contact click')
    it('navigates to hospital finder')
    it('closes on dismiss')
  })

  describe('accessibility', () => {
    it('has role="alertdialog"')
    it('is keyboard accessible')
    it('announces message to screen readers')
  })
})
```

**Estimated test count:** 12-15 tests

#### 2.1.5 ClaimFlow (`components/partner/ClaimFlow.tsx`)

**New file:** `tests/components/partner/ClaimFlow.test.tsx`

134 lines, currently 0% coverage.

```typescript
describe('ClaimFlow', () => {
  describe('step 1: verification', () => {
    it('displays claim instructions')
    it('shows verification code input')
    it('validates code format')
  })

  describe('step 2: ownership', () => {
    it('displays identity verification form')
    it('collects contact info')
    it('validates required fields')
  })

  describe('step 3: review', () => {
    it('displays claim summary')
    it('shows next steps')
  })

  describe('flow navigation', () => {
    it('moves forward on next')
    it('moves backward on back')
    it('submits on final step')
  })

  describe('error handling', () => {
    it('shows error on invalid code')
    it('allows retry')
    it('displays server errors')
  })

  describe('accessibility', () => {
    it('announces step number')
    it('proper form labels')
    it('keyboard navigable')
  })
})
```

**Estimated test count:** 15-18 tests

---

### 2.2 Untested Hooks (1 priority)

#### 2.2.1 useNetworkStatus (`hooks/useNetworkStatus.ts`)

**New file:** `tests/hooks/useNetworkStatus.test.ts`

78 lines, currently 0% coverage.

```typescript
describe('useNetworkStatus', () => {
  describe('initial state', () => {
    it('returns initial online status')
    it('checks navigator.onLine')
  })

  describe('online event', () => {
    it('updates to online on "online" event')
    it('triggers callback')
  })

  describe('offline event', () => {
    it('updates to offline on "offline" event')
    it('triggers callback')
  })

  describe('cleanup', () => {
    it('removes event listeners on unmount')
  })

  describe('edge cases', () => {
    it('handles rapid online/offline changes')
    it('handles missing navigator.onLine')
  })
})
```

**Estimated test count:** 10 tests

#### 2.2.2 useShare (`hooks/useShare.ts`)

**New file:** `tests/hooks/useShare.test.ts`

52 lines, currently 0% coverage.

```typescript
describe('useShare', () => {
  describe('native share', () => {
    it('uses Web Share API if available')
    it('passes correct share data')
    it('returns success')
  })

  describe('fallback', () => {
    it('falls back to clipboard on error')
    it('copies URL to clipboard')
    it('shows success message')
  })

  describe('mobile detection', () => {
    it('detects mobile devices')
    it('uses Capacitor Share on mobile')
  })

  describe('error handling', () => {
    it('handles share cancellation')
    it('handles clipboard error')
  })
})
```

**Estimated test count:** 10 tests

---

## Phase 3: API Routes & Integration Tests (3-4 days)

### 3.1 Undertested API Routes

#### 3.1.1 Admin Routes

**Modify:** `tests/api/admin-*.test.ts`

```typescript
describe('POST /api/admin/save', () => {
  it('requires admin role')
  it('saves data to Supabase')
  it('validates request body')
  it('returns error on validation failure')
})

describe('POST /api/admin/push', () => {
  it('requires admin role')
  it('sends push notification')
  it('validates OneSignal payload')
  it('returns notification ID')
})

describe('POST /api/admin/reindex', () => {
  it('requires admin role')
  it('triggers embedding generation')
  it('returns progress tracking')
})

describe('GET /api/admin/data', () => {
  it('requires admin role')
  it('exports all services')
  it('includes embeddings')
})
```

**Estimated test count:** 12-15 tests

#### 3.1.2 Notification Routes

**Modify:** `tests/api/notifications-*.test.ts`

```typescript
describe('POST /api/v1/notifications/subscribe', () => {
  it('requires authentication')
  it('accepts push subscription')
  it('stores in database')
  it('returns success')
})

describe('POST /api/v1/notifications/unsubscribe', () => {
  it('requires authentication')
  it('removes subscription')
  it('confirms removal')
})
```

**Estimated test count:** 6-8 tests

#### 3.1.3 Analytics Routes

**Modify:** `tests/api/analytics-*.test.ts`

```typescript
describe('POST /api/v1/analytics/search', () => {
  it('records search event')
  it('does not log query text')
  it('buckets results')
  it('returns acknowledgment')
})
```

**Estimated test count:** 4-6 tests

### 3.2 Integration Tests

**New file:** `tests/integration/user-journeys.test.ts`

Cross-component workflows:

```typescript
describe('Search & View Service Journey', () => {
  it('searches for services')
  it('filters by category')
  it('navigates to service detail')
  it('displays complete service info')
})

describe('Offline Sync Journey', () => {
  it('caches services while online')
  it('searches while offline')
  it('queues feedback while offline')
  it('syncs when back online')
})

describe('Partner Claim Journey', () => {
  it('views service as partner')
  it('starts claim process')
  it('completes all steps')
  it('sees claimed service in dashboard')
})

describe('Crisis Response Journey', () => {
  it('detects crisis keywords')
  it('shows emergency modal')
  it('provides immediate resources')
})
```

**Estimated test count:** 12-15 tests

---

## Phase 4: Edge Cases & Error Scenarios (3-4 days)

### 4.1 Error Scenario Coverage

**Modify:** Multiple test files to add error cases:

```typescript
describe('error handling', () => {
  // Database errors
  it('handles Supabase connection timeout')
  it('handles database constraint violation')
  it('handles IndexedDB quota exceeded')

  // Network errors
  it('handles offline during search')
  it('handles network interrupted mid-request')
  it('handles 429 rate limit')
  it('handles 500 server error')

  // Validation errors
  it('rejects invalid email')
  it('rejects empty query')
  it('rejects oversized input')

  // Authorization errors
  it('rejects unauthorized API access')
  it('rejects expired token')
  it('rejects insufficient permissions')

  // Data errors
  it('handles malformed JSON')
  it('handles corrupted cache')
  it('handles stale embeddings')

  // Resource limits
  it('handles rate limit (60 req/min)')
  it('handles max history length')
  it('handles file upload size limit')
})
```

**Estimated test count:** 20-25 tests

### 4.2 Boundary Condition Tests

```typescript
describe('boundary conditions', () => {
  it('handles empty string query')
  it('handles very long query (10k chars)')
  it('handles unicode in query')
  it('handles emoji in input')
  it('handles 0 results')
  it('handles 1000+ results')
  it('handles service with no address')
  it('handles service with 0 verification level')
  it('handles distance 0 (exact location)')
  it('handles distance 1000km (province-wide)')
})
```

**Estimated test count:** 10 tests

---

## Test Infrastructure Improvements

### 4.1 Mocking & Fixtures

**New file:** `tests/fixtures/services.ts`

```typescript
export const mockService: Service = { /* complete service object */ }
export const mockServices: Service[] = [ /* 5-10 varied services */ ]
export const createMockService = (overrides: Partial<Service>) => ({ ... })
```

**New file:** `tests/fixtures/feedback.ts`

Feedback mock data for consistent testing.

**New file:** `tests/fixtures/users.ts`

User and organization mocks.

### 4.2 Test Helpers

**Modify:** `tests/setup.ts`

Add helpers:
- Database cleanup between tests
- Mock Supabase responses
- Mock WebLLM engine
- Network mock utilities

### 4.3 CI/CD Configuration

**Modify:** `.github/workflows/ci.yml`

Add coverage reporting:
```yaml
- name: Generate Coverage Report
  run: npm run test:coverage

- name: Upload to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
    flags: unittests

- name: Enforce Coverage
  run: |
    # Fail if coverage drops below 75%
    COVERAGE=$(grep statements coverage/coverage-summary.json | grep -o '"pct": [0-9.]*' | grep -o '[0-9.]*')
    if (( $(echo "$COVERAGE < 75" | bc -l) )); then
      exit 1
    fi
```

---

## Test Execution Plan

### Week 1: Libraries
```bash
# Phase 1 tests
npm test -- tests/lib/search
npm test -- tests/lib/ai
npm test -- tests/lib/offline
npm test -- tests/lib/analytics
npm test -- tests/lib/rate-limit
```

### Week 2: Components & Hooks
```bash
# Phase 2 tests
npm test -- tests/components
npm test -- tests/hooks
npm test -- tests/integration
```

### Week 3: Final Coverage & Edge Cases
```bash
npm test:coverage
npm test -- tests/api
# Manual verification of coverage gaps
```

---

## Coverage Target Breakdown

| Module | Current | Target | Est. Tests |
|--------|---------|--------|-----------|
| lib/search | 72% | 75%+ | 50 |
| lib/ai | 66% | 85% | 35 |
| lib/offline | 53% | 75% | 65 |
| lib/analytics | 26% | 70% | 15 |
| components | 40% | 70% | 80 |
| hooks | 77% | 85% | 20 |
| API routes | 65% | 80% | 25 |
| **TOTAL** | **45%** | **75%** | **~290 tests** |

---

## Success Criteria

### Coverage Metrics
- [ ] Overall coverage: 45% → 75%+ statements
- [ ] Security modules: 90%+ (`lib/auth/`, `lib/rate-limit/`)
- [ ] Critical paths: 80%+ (`lib/search/`, `lib/offline/`)
- [ ] All files have ≥50% coverage (no dark spots)

### Quality Metrics
- [ ] Zero CRITICAL test failures in CI
- [ ] Zero flaky tests (0% retry rate acceptable)
- [ ] All test execution: <5min local, <10min CI
- [ ] Test naming follows convention: `it('should [behavior] when [condition]')`

### Automation
- [ ] Coverage report auto-generated on PR
- [ ] Coverage gate blocks PRs dropping below 70%
- [ ] Test failure notifications in Slack/Discord (optional)

---

## Dependencies & Assumptions

- **Vitest 3.x** already installed with workspace support
- **@testing-library/react** available for component tests
- **JSDOM** for component testing (browser-less)
- **Playwright** for E2E (separate from this plan, see E2E roadmap)
- **MSW (Mock Service Worker)** for API mocking (recommended addition)

---

## Test Data Management Strategy

### 1. Fixtures (Static Test Data)

```typescript
// tests/fixtures/services.ts
export const mockServiceL3: Service = {
  id: 'test-service-1',
  name: 'Test Mental Health Service',
  verification_level: 3,
  // ... complete fixture
}

export const mockServices = [mockServiceL3, mockServiceL2, mockServiceL1]

// Factory function for variations
export const createMockService = (overrides: Partial<Service>): Service => ({
  ...mockServiceL3,
  id: `test-${Date.now()}`,
  ...overrides,
})
```

### 2. Test Database (Integration Tests)

For tests that need real database:
```typescript
// tests/setup/db.ts
import { createClient } from '@supabase/supabase-js'

export const testSupabase = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_KEY!
)

// Clean up after each test
afterEach(async () => {
  await testSupabase.from('services').delete().eq('id', 'test-%')
})
```

### 3. Mocking External Services

```typescript
// tests/mocks/supabase.ts
export const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockResolvedValue({ data: mockServices, error: null }),
}

// tests/mocks/webllm.ts
export const mockAIEngine = {
  refineSearchQuery: vi.fn().mockResolvedValue({
    expanded_query: 'mental health counseling therapy',
    confidence: 0.9,
  }),
}
```

---

## Vitest Configuration Improvements

### Per-Path Coverage Thresholds

**Modify:** `vitest.config.mts`

```typescript
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        // Global minimum
        statements: 75,
        branches: 70,
        functions: 75,
        lines: 75,

        // Per-path overrides
        'lib/auth/**': { statements: 90, branches: 85 },
        'lib/search/**': { statements: 80, branches: 75 },
        'lib/offline/**': { statements: 75, branches: 70 },
        'lib/ai/**': { statements: 85, branches: 80 },
      },
    },
  },
})
```

---

## Rollback Plan

If coverage goals slip:
1. **Keep Phase 0** (security tests) - non-negotiable for production
2. **Focus on Phase 1** (libraries) - most value per test
3. Defer Phase 2 component tests to v17.1.1
4. Use E2E tests as partial coverage for UI components
5. Document untested paths in `TESTING_GAPS.md` for future work

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Flaky tests block CI | Medium | High | Quarantine + investigate immediately |
| Coverage drops on new features | High | Medium | Coverage gates on PRs |
| Test execution too slow | Low | Medium | Parallelize, use `--changed` flag |
| Mocking complexity | Medium | Low | Document patterns, use MSW |
