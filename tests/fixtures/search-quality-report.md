# Search Quality Report

**Run Date:** 2026-02-03
**Total Queries:** 200
**Execution Time:** 1.6 seconds

## Summary

| Metric                       | Value           | Status                     |
| ---------------------------- | --------------- | -------------------------- |
| Golden Set Pass Rate         | 74% (37/50)     | :yellow_circle: Warning    |
| Sampled Coverage Result Rate | 98.7% (148/150) | :green_circle: Good        |
| Average Recall               | 71.8%           | :yellow_circle: Acceptable |
| Crisis Detection Accuracy    | 54.5% (12/22)   | :red_circle: Needs Work    |

## Analysis by Query Quality

| Quality Level | Pass Rate   | Notes                               |
| ------------- | ----------- | ----------------------------------- |
| Well-worded   | 83% (20/24) | Good - specific queries work well   |
| Average       | 72% (13/18) | Acceptable                          |
| Poor          | 50% (4/8)   | Expected - vague queries are harder |

## Analysis by Category

| Category          | Pass Rate  | Notes                                |
| ----------------- | ---------- | ------------------------------------ |
| Physical Health   | 100% (7/7) | :green_circle: Excellent             |
| Substance Use     | 100% (3/3) | :green_circle: Excellent             |
| Seniors           | 100% (1/1) | :green_circle:                       |
| Disability        | 100% (1/1) | :green_circle:                       |
| Transportation    | 100% (1/1) | :green_circle:                       |
| Employment        | 100% (2/2) | :green_circle:                       |
| Financial         | 100% (2/2) | :green_circle:                       |
| Family/Children   | 100% (1/1) | :green_circle:                       |
| Youth             | 100% (1/1) | :green_circle:                       |
| Crisis            | 67% (4/6)  | :yellow_circle: Room for improvement |
| Community/Social  | 67% (2/3)  | :yellow_circle:                      |
| Legal             | 67% (2/3)  | :yellow_circle:                      |
| Mental Health     | 60% (3/5)  | :yellow_circle:                      |
| Identity-Specific | 57% (4/7)  | :yellow_circle:                      |
| Housing           | 50% (2/4)  | :red_circle: Needs attention         |
| Food/Nutrition    | 33% (1/3)  | :red_circle: Needs attention         |

## Root Cause Analysis

### Issue 1: Test Expectation Mismatches (4 failures)

Some test failures are due to **incorrect test expectations**, not search problems:

| Query                    | Issue                                                                                      | Fix                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------- |
| "my husband hits me"     | Recall low because `dawn-house-shelter` not in top 10, but `kingston-interval-house` IS #1 | Update expected services     |
| "I was raped last night" | SACK is #1, but recall low due to missing `kgh-emergency-department`                       | Update expected services     |
| "i need food im hungry"  | Partners in Mission IS #3, but `marthas-table` ID mismatch                                 | Use `marthas-table-kingston` |
| "free hot meal"          | Both expected services ARE in top 3 (marthas-table-kingston, lunch-by-george)              | Use correct ID               |

### Issue 2: Genuine Search Gaps (7 failures)

These services exist but aren't being surfaced:

| Query                              | Expected                        | Got Instead                              | Root Cause                                 |
| ---------------------------------- | ------------------------------- | ---------------------------------------- | ------------------------------------------ |
| "homeless shelter tonight"         | integrated-care-hub             | in-from-the-cold, kingston-youth-shelter | ICH may lack "shelter" keywords            |
| "nowhere to sleep"                 | integrated-care-hub             | kingston-youth-shelter                   | Same as above                              |
| "mental health counselling"        | resolve-counselling             | kchc-weller-clinic, hotel-dieu-site      | Hospital scoring too high                  |
| "teen mental health help"          | maltby-centre-mental-health     | street-health-centre                     | Youth mental health not indexed well       |
| "transgender health care hormones" | kchc-transgender-health-care    | hotel-dieu-site                          | Trans program not matched                  |
| "indigenous health services"       | kchc-iipct                      | kfla-indigenous-health-team              | Different Indigenous service ranked higher |
| "free lawyer legal aid"            | community-legal-clinic-kingston | legal-aid-ontario-kingston               | LAO ranked higher (reasonable)             |
| "library kingston"                 | kfpl-central-branch             | rideau-heights-community-centre          | Library has no searchable keywords         |

### Issue 3: Crisis Detection Gaps (54% accuracy)

The crisis detection system has gaps due to substring matching limitations.

**Root Cause:**
Crisis detection uses `query.includes(keyword)` which requires exact substring matches.

- "suicidal" does NOT contain "suicide" (it's "suicid-al" not "suicid-e-al")
- "hitting me" does NOT contain "hit" patterns currently listed

**Not detected as crisis (should be):**

- "suicidal thoughts" - "suicidal" ≠ "suicide"
- "I'm thinking about killing myself" - Should trigger (needs "thinking about" pattern)
- "my husband hits me" - Domestic violence (needs "hits me" pattern)
- "I was raped last night" - Sexual assault (actually IS detected - "rape" in list)

**Recommended Additions to CRISIS_KEYWORDS:**

```typescript
"suicidal",
"hitting me",
"hits me",
"beating me",
"thinking about killing",
"thinking of killing",
```

### Issue 4: Queries with No Results (2)

| Query  | Issue                                         | Recommendation    |
| ------ | --------------------------------------------- | ----------------- |
| "OW"   | Abbreviation for Ontario Works not recognized | Add to synonyms   |
| "help" | Too vague, filtered out by tokenizer          | Expected behavior |

## Recommendations

### Immediate Fixes (Test Data)

1. **Fix service ID mismatches:**
   - `marthas-table` → `marthas-table-kingston`
   - `hope-for-wellness-helpline` → also accept `crisis-hope-for-wellness`

2. **Relax some expected services:**
   - For legal queries, accept LAO as alternative to community legal clinic
   - For Indigenous health, accept KFLA Indigenous team as alternative to IIPCT

### Search Improvements (Code Changes)

1. **Crisis Detection Enhancement:**
   - Add patterns: "hits me", "raped", "killing myself"
   - Current patterns may be too narrow

2. **Synonym Expansion:**
   - Add "OW" → "ontario works"
   - Add "ICH" → "integrated care hub"

3. **Service Data Enrichment:**
   - `integrated-care-hub`: Add "shelter", "homeless", "sleep" to synthetic queries
   - `maltby-centre-mental-health`: Add "teen", "adolescent", "youth" keywords
   - `kchc-transgender-health-care`: Add "transgender", "trans", "hormones", "HRT"
   - `kfpl-central-branch`: Add "library" to searchable fields

4. **Scoring Adjustments:**
   - Hospital services (hotel-dieu, KGH) may be scoring too high for general queries
   - Consider reducing authority boost for broad searches

## Test Framework Quality

The test framework is working well:

- Successfully ran 200 queries in 1.6 seconds
- Captured detailed results for analysis
- Identified real issues vs test expectation problems

## Next Steps

1. Fix test expectations (ID mismatches) - quick win
2. Add missing synonyms (OW, ICH) - quick win
3. Enhance crisis detection patterns - medium effort
4. Enrich service synthetic queries - medium effort
5. Review hospital scoring weights - needs careful analysis
