---
status: accepted
date: 2026-02-03
tags: [search, testing, quality, scoring, regression]
---

# ADR-018: Search Quality Testing and Scoring Refinements

## Status

**ACCEPTED** - Implemented 2026-02-03

## Context

The search system had no systematic regression testing for search result quality. Users could receive poor results without detection, and scoring improvements were difficult to validate. Three specific scoring issues emerged:

1. **Intent Targeting Too Permissive**: Short queries like "clinic" matching any synthetic query containing "clinic" received +100 points (Exact Intent Match), causing hospitals to dominate unrelated searches
2. **Authority Boost Always Applied**: Healthcare services received 1.2x multiplier on all searches, even for "free food" queries where food banks should rank higher
3. **Single-Token Description Matches**: Common words like "free" caused false positives (e.g., "Pro Bono Ontario" appearing for "free hot meal")

## Decision

### 1. Search Quality Testing Framework

Implemented a **Golden Set + Sampling** testing strategy:

**Components:**

- **Golden Set**: 50 hand-curated queries with expected services (`tests/fixtures/search-test-queries.json`)
- **Sampled Coverage**: 150 additional queries testing 95%+ result rate
- **Crisis Detection Tests**: 9 safety-critical query patterns
- **Deterministic CI Tests**: `tests/search/golden-set.test.ts` with 61 Vitest tests
- **Test Runner**: `scripts/search-test-runner.ts` for comprehensive analysis (200 queries)
- **Quality Report**: `tests/fixtures/search-quality-report.md` documenting issues and recommendations

**Pass Criteria:**

```typescript
// Pass when at least one expected service appears in top 10 results
const pass = mustIncludeAtLeastOne.some((id) => top10Ids.includes(id))
```

### 2. Scoring Refinements (Systemic Improvements)

**Intent Targeting Precision (`lib/search/scoring.ts`):**

Before: `isSubstringMatch(query, syntheticQuery)` gave +100 for any substring match

After: Bidirectional token overlap scoring

- **Single long tokens** (6+ chars): Medium boost only (+25 points)
- **Multi-token queries**: Require mutual overlap
  - Exact Match (+100): 90%+ query tokens AND 50%+ synthetic tokens match
  - High Overlap (+50): 75%+ query AND 40%+ synthetic overlap
  - Medium Overlap (+25): 50%+ query AND 30%+ synthetic overlap

**Authority Boost Relevance Threshold:**

Before: Healthcare 1.2x multiplier applied to all searches

After: Authority multiplier only applies when base score ≥ 30 points (service is actually relevant)

**Description Matching Quality:**

Before: Single token match scored points

After: Requires either 2+ token matches OR a specific token (4+ characters)

### 3. Test Infrastructure

**Files Added:**

- `tests/fixtures/care-taxonomy.json` - Comprehensive 17-category hierarchy (98 sub-categories)
- `tests/fixtures/search-test-queries.json` - 200 test queries with expectations
- `tests/fixtures/search-quality-report.md` - Analysis and recommendations
- `tests/search/golden-set.test.ts` - Deterministic regression tests

**Existing Enhancements:**

- `lib/search/crisis.ts` - Enhanced crisis keywords ("suicidal", "hits me", "beating me")
- `lib/search/synonyms.ts` - Added OW, ODSP abbreviations
- `lib/search/utils.ts` - Allowlist for important short terms (OW, ER, AA, NA, HIV, STD, STI)

## Consequences

### Positive

1. **Regression Protection**: 61 automated tests prevent search quality degradation
2. **Improved Ranking**: Hospitals no longer dominate unrelated queries
3. **Better Precision**: False positives from weak token matches eliminated
4. **Systematic Fixes**: Scoring improvements are general-purpose, not ad-hoc patches
5. **Crisis Safety**: Enhanced detection covers more patterns ("suicidal thoughts", "hits me")
6. **Maintainability**: Clear process for adding new golden queries when issues arise

### Negative

1. **Test Maintenance**: Golden set requires updates when service IDs change
2. **Reduced Boost for Single Tokens**: Short queries like "clinic" get lower boosts (acceptable trade-off)
3. **Threshold Tuning**: Authority relevance threshold (30 points) may need adjustment over time

### Neutral

1. **Test Coverage**: 100% pass rate on golden set (50/50 queries), 98.7% on sampled coverage
2. **Performance**: All 200 queries complete in <2 seconds
3. **CI Integration**: Tests run on every commit, preventing regressions

## Alternatives Considered

### A. LLM-Assisted Evaluation

Use Claude to judge result quality instead of deterministic tests.

**Rejected**: Non-deterministic, expensive API calls, slower feedback loop

### B. Full Coverage Testing

Test all possible queries exhaustively.

**Rejected**: Unmaintainable (thousands of tests), diminishing returns

### C. Ad-Hoc Fixes Only

Fix specific poor results by tweaking service data.

**Rejected**: Doesn't prevent future regressions, creates technical debt

## Implementation Notes

### Testing Workflow

When a user reports a bad search result:

1. Add query to `search-test-queries.json` with expected services
2. Run tests to confirm failure: `npm test -- tests/search/golden-set.test.ts`
3. Fix via synonyms, keywords, or scoring adjustments
4. Tests pass → regression protected

### Scoring Weight Configuration

All scoring weights centralized in `lib/search/scoring.ts::WEIGHTS`:

```typescript
export const WEIGHTS = {
  vector: 100, // Semantic match
  syntheticQuery: 50, // Intent match (per token)
  name: 30, // Service name match
  identityTag: 20, // Identity-specific service
  description: 10, // Description match
  intentExactMatch: 100, // Exact intent targeting
  intentHighOverlap: 50, // High intent overlap
  intentMediumOverlap: 25, // Medium intent overlap
  // ... authority, completeness, resource boosts
}
```

### Future Enhancements

- Add more golden queries as issues are discovered (target: 100 queries)
- A/B testing framework for scoring weight changes
- User feedback integration to identify poor results
- Periodic re-runs of `search-test-runner.ts` to generate updated reports

## References

- Implementation: `lib/search/scoring.ts` (v17.7 scoring refinements)
- Tests: `tests/search/golden-set.test.ts` (61 deterministic tests)
- Fixtures: `tests/fixtures/search-test-queries.json` (200 test queries)
- Runner: `scripts/search-test-runner.ts` (comprehensive analysis tool)
- Report: `tests/fixtures/search-quality-report.md` (analysis and recommendations)

## Related ADRs

- [ADR-016: Performance Tracking and Circuit Breaker](016-performance-tracking-and-circuit-breaker.md) - Observability infrastructure
- [ADR-015: Non-Blocking E2E Tests](015-non-blocking-e2e-tests.md) - Testing philosophy
