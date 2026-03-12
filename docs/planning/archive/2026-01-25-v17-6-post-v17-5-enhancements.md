# Roadmap: v17.6+ Post-v17.5 Enhancements

**Created:** 2026-01-25
**Status:** Complete (Audit/Recheck Finished)
**Dependencies:** v17.5 (Performance Tracking & Circuit Breaker)

## Overview

This roadmap covers follow-up work after the v17.5+ implementation. These enhancements build on the performance tracking, circuit breaker, and load testing infrastructure to improve resilience, observability, and data quality.

**Estimated Total Time:** 8-12 hours

---

## Phase 1: Load Testing Baseline Establishment

**Priority:** HIGH
**Estimated Time:** 2-3 hours
**Dependencies:** v17.5 load testing infrastructure

### Objective

Establish baseline performance metrics by running comprehensive load tests against the current implementation. These baselines will be used for:

- Regression detection in future releases
- Capacity planning
- SLA/SLO definition
- Infrastructure optimization decisions

### Tasks

#### Task 1.1: Run Smoke Test and Document Results

**Time:** 30 minutes

```bash
# Run smoke test
npm run test:load:smoke

# Document results in baseline report
```

**Expected Metrics:**

- Request success rate: >99%
- p95 latency: <1000ms
- p99 latency: <2000ms
- No errors or timeouts

**Deliverable:** `docs/testing/baseline-metrics.md` (initial section)

#### Task 1.2: Run Search API Load Test

**Time:** 1 hour

```bash
# Run realistic load test
npm run test:load

# Analyze results
k6 run --out json=results/search-api-baseline.json tests/load/search-api.k6.js
```

**Test Scenarios:**

1. Keyword search (no filters)
2. Category filtered search
3. Geo-proximity search
4. Combined filters
5. Crisis query handling

**Expected Metrics:**

- Throughput: 50+ req/sec sustained
- p95 latency: <500ms
- p99 latency: <1000ms
- Error rate: <5%

**Deliverable:** Baseline metrics documented with timestamps and environment details

#### Task 1.3: Run Sustained Load Test

**Time:** 45 minutes

```bash
# Run 30-minute sustained load test
npm run test:load:sustained
```

**Observe:**

- Memory usage over time (no leaks)
- CPU usage stability
- Database connection pool behavior
- Circuit breaker state (should remain CLOSED)
- IndexedDB performance degradation (if any)

**Expected Metrics:**

- Stable latency throughout duration
- No memory leaks (flat memory usage)
- Consistent error rate (<5%)

**Deliverable:** Long-duration stability report

#### Task 1.4: Run Spike Test

**Time:** 30 minutes

```bash
# Run spike test
npm run test:load:spike
```

**Observe:**

- Recovery time after spike
- Circuit breaker behavior under stress
- Error rate during spike
- Graceful degradation to JSON fallback

**Expected Metrics:**

- Circuit breaker opens during spike (expected)
- Recovers within 30s after spike ends
- No permanent degradation after recovery

**Deliverable:** Spike test report with circuit breaker telemetry

#### Task 1.5: Create Baseline Documentation

**Time:** 30 minutes

**File:** `docs/testing/baseline-metrics.md`

**Structure:**

```markdown
# Performance Baseline Metrics

## Test Environment

- Date: 2026-01-25
- Version: v17.5+
- Hardware: [CPU, RAM, Network]
- Database: Supabase [region, tier]

## Smoke Test Results

[Results...]

## Search API Load Test Results

[Detailed metrics by scenario...]

## Sustained Load Test Results

[Stability metrics over 30min...]

## Spike Test Results

[Resilience metrics...]

## Thresholds for Regression Detection

- p95 latency degradation: >20%
- p99 latency degradation: >30%
- Error rate increase: >2%
- Circuit breaker false-opens: >0

## Next Review: 2026-02-25
```

**Deliverable:** Complete baseline documentation

---

## Phase 2: Integration Tests for Circuit Breaker

**Priority:** MEDIUM
**Estimated Time:** 3-4 hours
**Dependencies:** v17.5 circuit breaker implementation

### Objective

Add integration tests that simulate real database failures to validate circuit breaker behavior in production-like scenarios. Current tests use mocked functions; integration tests will use test databases or simulated network failures.

### Tasks

#### Task 2.1: Create Test Infrastructure

**Time:** 1.5 hours

**File:** `tests/integration/circuit-breaker-db.test.ts`

**Setup:**

- Use Supabase local development setup (if available)
- OR use test database with controllable downtime
- OR use network interception (Playwright/MSW at network level)

**Test Utilities:**

```typescript
// tests/integration/utils/db-simulator.ts

/**
 * Simulates database failures for integration testing
 */
export class DatabaseSimulator {
  private shouldFail = false
  private failureCount = 0

  /**
   * Make next N database calls fail
   */
  simulateFailure(count: number): void {
    this.shouldFail = true
    this.failureCount = count
  }

  /**
   * Restore normal database behavior
   */
  restore(): void {
    this.shouldFail = false
    this.failureCount = 0
  }

  /**
   * Check if should fail this call
   */
  shouldFailThisCall(): boolean {
    if (!this.shouldFail || this.failureCount <= 0) {
      return false
    }
    this.failureCount--
    return true
  }
}
```

**Deliverable:** Test infrastructure for simulating failures

#### Task 2.2: Write Integration Tests

**Time:** 1.5 hours

**Test Cases:**

1. **Circuit Opens on Repeated Failures**

   ```typescript
   it('should open circuit after threshold failures', async () => {
     // Simulate 3 database failures (threshold)
     dbSimulator.simulateFailure(3)

     // Make requests that will fail
     await searchServices(...) // Fail 1
     await searchServices(...) // Fail 2
     await searchServices(...) // Fail 3

     // Circuit should be open
     const stats = getSupabaseBreakerStats()
     expect(stats.state).toBe('OPEN')

     // Next request should fast-fail (<1ms)
     const start = performance.now()
     await searchServices(...)
     const duration = performance.now() - start
     expect(duration).toBeLessThan(1)
   })
   ```

2. **Automatic Recovery via HALF_OPEN**

   ```typescript
   it('should recover automatically after timeout', async () => {
     // Open circuit
     dbSimulator.simulateFailure(3)
     // ... make failing requests ...

     // Wait for timeout (30s default)
     await new Promise(resolve => setTimeout(resolve, 31000))

     // Restore database
     dbSimulator.restore()

     // Next request should attempt HALF_OPEN
     const stats1 = getSupabaseBreakerStats()
     expect(stats1.state).toBe('HALF_OPEN')

     // Successful request should close circuit
     await searchServices(...)

     const stats2 = getSupabaseBreakerStats()
     expect(stats2.state).toBe('CLOSED')
   })
   ```

3. **Fallback to JSON on Circuit Open**

   ```typescript
   it("should fallback to JSON when circuit is open", async () => {
     // Open circuit
     dbSimulator.simulateFailure(3)
     // ... make failing requests ...

     // Search should still work via JSON fallback
     const results = await searchServices({ query: "food bank" })
     expect(results).toBeTruthy()
     expect(results.length).toBeGreaterThan(0)

     // Verify data came from JSON, not database
     // (check logs or metadata)
   })
   ```

4. **Circuit Remains Open on Continued Failures**

   ```typescript
   it('should remain open if recovery fails', async () => {
     // Open circuit
     dbSimulator.simulateFailure(10)
     // ... open circuit ...

     // Wait for HALF_OPEN
     await new Promise(resolve => setTimeout(resolve, 31000))

     // Next request fails (database still down)
     await searchServices(...)

     // Circuit should reopen
     const stats = getSupabaseBreakerStats()
     expect(stats.state).toBe('OPEN')
   })
   ```

5. **Analytics Graceful Degradation**

   ```typescript
   it('should skip analytics when circuit is open', async () => {
     // Open circuit
     dbSimulator.simulateFailure(3)
     // ... open circuit ...

     // Analytics call should not throw
     expect(async () => {
       await trackEvent({...})
     }).not.toThrow()

     // Analytics should be queued or dropped (logged)
     // Verify via logs
   })
   ```

6. **Service Management Falls Back**

   ```typescript
   it("should return null for service lookups when circuit open", async () => {
     // Open circuit
     dbSimulator.simulateFailure(3)
     // ... open circuit ...

     // Service lookup should return null (graceful)
     const service = await getServiceById("some-id")
     expect(service).toBeNull()
   })
   ```

7. **Offline Sync Respects Circuit State**

   ```typescript
   it("should skip sync when circuit is open", async () => {
     // Open circuit
     dbSimulator.simulateFailure(3)
     // ... open circuit ...

     // Sync should skip immediately
     const result = await syncServices()
     expect(result.status).toBe("error")
     expect(result.error).toContain("Circuit breaker open")
   })
   ```

8. **Circuit Telemetry Logs State Transitions**

   ```typescript
   it('should log all state transitions', async () => {
     const logs: string[] = []
     // Mock logger to capture logs

     // CLOSED → OPEN
     dbSimulator.simulateFailure(3)
     // ... open circuit ...
     expect(logs).toContain('CLOSED → OPEN')

     // OPEN → HALF_OPEN
     await new Promise(resolve => setTimeout(resolve, 31000))
     await searchServices(...)
     expect(logs).toContain('OPEN → HALF_OPEN')

     // HALF_OPEN → CLOSED
     dbSimulator.restore()
     await searchServices(...)
     expect(logs).toContain('HALF_OPEN → CLOSED')
   })
   ```

**Deliverable:** 8 comprehensive integration tests

#### Task 2.3: Add CI Integration

**Time:** 30 minutes

**File:** `.github/workflows/circuit-breaker-integration.yml`

```yaml
name: Circuit Breaker Integration Tests

on:
  pull_request:
    paths:
      - "lib/resilience/**"
      - "lib/search/data.ts"
      - "lib/services.ts"
      - "lib/analytics.ts"
      - "tests/integration/circuit-breaker-db.test.ts"
  workflow_dispatch:

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm test -- tests/integration/circuit-breaker-db.test.ts
        env:
          CIRCUIT_BREAKER_ENABLED: true
          CIRCUIT_BREAKER_FAILURE_THRESHOLD: 3
          CIRCUIT_BREAKER_TIMEOUT: 5000 # Shorter for CI

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: integration-test-results
          path: test-results/
```

**Deliverable:** CI workflow for integration tests

#### Task 2.4: Documentation

**Time:** 30 minutes

**File:** `docs/testing/circuit-breaker-integration-testing.md`

**Content:**

- How to run integration tests locally
- How to simulate database failures
- Expected test duration (including 30s+ timeouts)
- Interpreting test results
- Troubleshooting flaky tests

**Deliverable:** Integration testing documentation

---

## Phase 3: French Translation Workflow

**Priority:** LOW (Manual Work Required)
**Estimated Time:** 2-3 hours (automation) + User Time (translation)
**Dependencies:** None

### Objective

Create helper tools to streamline the manual French translation workflow. The workflow still requires external translation handling and human review, but we can make it more efficient.

### Tasks

#### Task 3.1: Create Translation Helper Script

**Time:** 1.5 hours

**File:** `scripts/batch-translate-helper.ts`

```typescript
/**
 * Translation Helper Script
 *
 * Assists with manual French translation workflow:
 * 1. Reads input batches
 * 2. Generates translation prompts
 * 3. Validates output format
 * 4. Helps merge results
 */

import fs from "fs"
import path from "path"

interface TranslationBatch {
  services: Array<{
    id: string
    access_script: string
    access_script_fr?: string
  }>
}

/**
 * Generate translation prompts for AI services
 */
export function generateTranslationPrompts(batchPath: string): string {
  const batch: TranslationBatch = JSON.parse(fs.readFileSync(batchPath, "utf-8"))

  let prompt = `# French Translation Request\n\n`
  prompt += `Please translate the following English "access_script" fields to French.\n\n`
  prompt += `**Guidelines:**\n`
  prompt += `- Maintain the same level of detail\n`
  prompt += `- Preserve meaning, no new claims\n`
  prompt += `- Use natural, conversational Canadian French\n`
  prompt += `- Keep technical terms appropriate (e.g., "email" → "courriel")\n\n`
  prompt += `**Format:** For each service, provide the French translation.\n\n`
  prompt += `---\n\n`

  batch.services.forEach((service, idx) => {
    prompt += `## Service ${idx + 1} (ID: ${service.id})\n\n`
    prompt += `**English:**\n${service.access_script}\n\n`
    prompt += `**French Translation:**\n[YOUR TRANSLATION HERE]\n\n`
    prompt += `---\n\n`
  })

  return prompt
}

/**
 * Parse AI response and create output batch
 */
export function parseTranslationResponse(inputBatchPath: string, translationText: string): TranslationBatch {
  const inputBatch: TranslationBatch = JSON.parse(fs.readFileSync(inputBatchPath, "utf-8"))

  // Parse translation text (expects service IDs as markers)
  // Simple regex-based parsing
  const translations = new Map<string, string>()

  const servicePattern =
    /## Service \d+ \(ID: (.+?)\)[\s\S]*?\*\*French Translation:\*\*\s*\n([\s\S]*?)(?=\n---|\n##|$)/g

  let match
  while ((match = servicePattern.exec(translationText)) !== null) {
    const [, id, translation] = match
    translations.set(id.trim(), translation.trim())
  }

  // Merge translations into output batch
  const outputBatch: TranslationBatch = {
    services: inputBatch.services.map((service) => ({
      ...service,
      access_script_fr: translations.get(service.id) || "",
    })),
  }

  return outputBatch
}

/**
 * Validate output batch
 */
export function validateTranslationBatch(batch: TranslationBatch): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  batch.services.forEach((service, idx) => {
    if (!service.access_script_fr) {
      errors.push(`Service ${idx + 1} (${service.id}): Missing French translation`)
    }

    if (service.access_script_fr && service.access_script_fr.length < 10) {
      errors.push(`Service ${idx + 1} (${service.id}): French translation too short`)
    }

    // Check for obvious copy-paste errors (EN text in FR field)
    const enWords = ["email", "phone", "website", "click", "online"]
    const hasEnglishWords = enWords.some((word) => service.access_script_fr?.toLowerCase().includes(word))

    if (hasEnglishWords) {
      errors.push(`Service ${idx + 1} (${service.id}): WARNING - May contain untranslated English words`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]

  switch (command) {
    case "generate-prompt": {
      const batchPath = process.argv[3]
      if (!batchPath) {
        console.error("Usage: tsx scripts/batch-translate-helper.ts generate-prompt <batch-path>")
        process.exit(1)
      }
      const prompt = generateTranslationPrompts(batchPath)
      console.log(prompt)

      // Save to file
      const outputPath = batchPath.replace("/input/", "/prompts/").replace(".json", "-prompt.md")
      fs.mkdirSync(path.dirname(outputPath), { recursive: true })
      fs.writeFileSync(outputPath, prompt)
      console.error(`\n✅ Prompt saved to: ${outputPath}`)
      break
    }

    case "parse-response": {
      const inputBatchPath = process.argv[3]
      const responseFile = process.argv[4]

      if (!inputBatchPath || !responseFile) {
        console.error("Usage: tsx scripts/batch-translate-helper.ts parse-response <input-batch> <response-file>")
        process.exit(1)
      }

      const translationText = fs.readFileSync(responseFile, "utf-8")
      const outputBatch = parseTranslationResponse(inputBatchPath, translationText)

      // Validate
      const validation = validateTranslationBatch(outputBatch)
      if (!validation.valid) {
        console.error("❌ Validation errors:")
        validation.errors.forEach((err) => console.error(`  - ${err}`))
      }

      // Save output
      const outputPath = inputBatchPath.replace("/input/", "/output/")
      fs.mkdirSync(path.dirname(outputPath), { recursive: true })
      fs.writeFileSync(outputPath, JSON.stringify(outputBatch, null, 2))

      console.log(`✅ Output saved to: ${outputPath}`)
      if (validation.valid) {
        console.log("✅ Validation passed")
      }
      break
    }

    case "validate": {
      const batchPath = process.argv[3]
      if (!batchPath) {
        console.error("Usage: tsx scripts/batch-translate-helper.ts validate <batch-path>")
        process.exit(1)
      }

      const batch: TranslationBatch = JSON.parse(fs.readFileSync(batchPath, "utf-8"))
      const validation = validateTranslationBatch(batch)

      if (validation.valid) {
        console.log("✅ Validation passed")
      } else {
        console.error("❌ Validation errors:")
        validation.errors.forEach((err) => console.error(`  - ${err}`))
        process.exit(1)
      }
      break
    }

    default:
      console.error("Unknown command. Available commands:")
      console.error("  - generate-prompt <batch-path>")
      console.error("  - parse-response <input-batch> <response-file>")
      console.error("  - validate <batch-path>")
      process.exit(1)
  }
}
```

**NPM Scripts to Add:**

```json
{
  "scripts": {
    "translate:prompt": "tsx scripts/batch-translate-helper.ts generate-prompt",
    "translate:parse": "tsx scripts/batch-translate-helper.ts parse-response",
    "translate:validate": "tsx scripts/batch-translate-helper.ts validate"
  }
}
```

**Deliverable:** Translation helper script with CLI

#### Task 3.2: Update Workflow Documentation

**Time:** 30 minutes

**File:** `docs/workflows/french-translation-workflow.md` (update)

**Add Section:**

````markdown
## Using the Translation Helper

### Step 1: Generate Prompts

For each batch, generate a translation prompt:

```bash
npm run translate:prompt docs/audits/v17-5/ai-results/access-script-fr/input/batch-001.json
```
````

This creates a markdown file at:
`docs/audits/v17-5/ai-results/access-script-fr/prompts/batch-001-prompt.md`

### Step 2: Translate Using Your Preferred AI Service

1. Open the prompt file
2. Copy the entire content
3. Paste into Claude, ChatGPT, or DeepL
4. Copy the AI's response
5. Save to a text file: `batch-001-response.txt`

### Step 3: Parse and Validate

Parse the AI response back into JSON format:

```bash
npm run translate:parse \
  docs/audits/v17-5/ai-results/access-script-fr/input/batch-001.json \
  batch-001-response.txt
```

This will:

- Parse the AI response
- Validate translations
- Save output to `output/batch-001.json`

### Step 4: Review and Correct

If validation fails, manually review and correct the output JSON file.

Then validate again:

```bash
npm run translate:validate docs/audits/v17-5/ai-results/access-script-fr/output/batch-001.json
```

### Step 5: Merge All Batches

Once all batches are validated:

```bash
npm run merge-ai-enrichment -- \
  docs/audits/v17-5/ai-results/access-script-fr/output/batch-*.json
```

### Step 6: Rebuild

```bash
npm run build  # Regenerates embeddings
```

````

**Deliverable:** Updated workflow documentation

#### Task 3.3: Add Tests for Helper Script

**Time:** 1 hour

**File:** `tests/unit/batch-translate-helper.test.ts`

**Test Cases:**
- Generate prompt with correct format
- Parse AI response correctly
- Validate complete translations
- Detect missing translations
- Warn on potential English words in French
- Handle malformed AI responses

**Deliverable:** Test suite for translation helper

---

## Phase 4: Authorization Protection Discussion

**Priority:** MEDIUM (Requires Decision)
**Estimated Time:** 1-2 hours (investigation) + Implementation TBD
**Dependencies:** v17.5 circuit breaker

### Objective

Investigate and decide whether to add circuit breaker protection to authorization checks in `lib/auth/authorization.ts`. This is a security vs. resilience trade-off that requires careful consideration.

### Tasks

#### Task 4.1: Security Analysis

**Time:** 30 minutes

**Questions to Answer:**

1. **What happens if authorization checks fail-open?**
   - Could users access resources they shouldn't?
   - Could service owners edit services they don't own?
   - Could non-admins access admin functions?

2. **What happens if authorization checks fail-closed?**
   - Users cannot access their own resources during outage
   - Service owners cannot manage their listings
   - All authenticated actions fail

3. **Current fallback behavior:**
   - Review `assertServiceOwnership()` - throws on failure
   - Review `assertOrganizationMembership()` - throws on failure
   - Review `assertPermission()` - throws on failure
   - All use `createServerClient()` which requires database

**Deliverable:** Security analysis document

#### Task 4.2: Examine Usage Patterns

**Time:** 30 minutes

**Analyze All Call Sites:**

```bash
# Find all authorization function calls
grep -r "assertServiceOwnership\|assertOrganizationMembership\|assertPermission" app/ lib/
````

**Categorize by Risk:**

- **High Risk:** Ownership transfers, deletions, role changes
- **Medium Risk:** Service edits, member invites
- **Low Risk:** Read operations, analytics viewing

**Deliverable:** Usage pattern analysis with risk categorization

#### Task 4.3: Propose Solution Options

**Time:** 30 minutes

**Option 1: Fail-Closed (Current Behavior)**

- ✅ Secure by default
- ❌ Total service outage during DB failure
- ❌ No graceful degradation

**Option 2: Fail-Open with Audit Logging**

- ✅ Service remains available
- ⚠️ Security risk during outage
- ✅ Audit logs for review after recovery
- Implementation: Skip authorization checks when circuit open, log all actions

**Option 3: Cached Authorization**

- ✅ Secure
- ✅ Resilient (if cache hit)
- ⚠️ Complex invalidation logic
- Implementation: Cache membership/ownership in Redis/memory for 5-10 minutes

**Option 4: Tiered Approach**

- ✅ Balanced security and resilience
- ✅ Low-risk operations remain available
- ❌ High-risk operations fail-closed
- Implementation:
  ```typescript
  export async function assertServiceOwnership(
    supabase: SupabaseClient,
    userId: string,
    serviceId: string,
    allowedRoles: Role[] = [],
    riskLevel: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    try {
      const { data, error } = await withCircuitBreaker(
        async () => supabase.from('organization_members')...
      )
      // ... existing logic ...
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        if (riskLevel === 'high') {
          // Fail-closed for high-risk operations
          throw new AuthorizationError('Service temporarily unavailable')
        } else {
          // Allow with audit log for low/medium risk
          logger.warn('Authorization bypassed: Circuit breaker open', {
            userId,
            serviceId,
            riskLevel,
          })
          return // Allow
        }
      }
      throw error
    }
  }
  ```

**Option 5: Read-Only Mode**

- ✅ Secure (no writes)
- ✅ Users can still browse/search
- ⚠️ Cannot make changes during outage
- Implementation: Allow read operations, fail-closed for write operations

**Deliverable:** Solution options with pros/cons

#### Task 4.4: Decision Document

**Time:** 30 minutes (if decision is made)

**File:** `docs/adr/017-authorization-resilience-strategy.md`

**Content:**

- Context: Circuit breaker vs. authorization trade-offs
- Decision: [Chosen option]
- Consequences: Security implications, user experience impact
- Alternatives Considered: [Other options]
- Rollout Plan: Phased implementation, monitoring

**Deliverable:** ADR for authorization resilience strategy

---

## Success Criteria

### Phase 1: Load Testing

- ✅ All 4 load tests executed successfully
- ✅ Baseline metrics documented
- ✅ Regression detection thresholds defined
- ✅ No performance regressions detected from v17.5 changes

### Phase 2: Integration Tests

- ✅ 8 integration tests passing
- ✅ CI pipeline includes integration tests
- ✅ Documentation complete

### Phase 3: French Translation

- ✅ Translation helper script functional
- ✅ Workflow documented with examples
- ✅ Validation catches common errors
- ⏳ User completes manual translation (external to this roadmap)

### Phase 4: Authorization

- ✅ Security analysis complete
- ✅ Decision documented in ADR
- ✅ Implementation complete with tiered protection and full test coverage.

---

## Timeline

**Week 1:**

- Phase 1: Load testing baseline (2-3 hours)
- Phase 4: Authorization analysis (1-2 hours)

**Week 2:**

- Phase 2: Integration tests (3-4 hours)
- Phase 3: Translation helper (2-3 hours)

**Total:** 8-12 hours of implementation time

---

## Dependencies and Blockers

### Required

- ✅ v17.5 implementation complete
- ✅ Load testing infrastructure available
- ✅ Circuit breaker functional

### Optional

- ⏳ Supabase local development setup (for Task 2.1)
- ⏳ User availability for French translation (Phase 3)
- ⏳ Security team input on authorization trade-offs (Phase 4)

---

## Risk Assessment

### Low Risk

- Phase 1 (Load testing) - Read-only, no code changes
- Phase 3 (Translation helper) - Tooling only, no production impact

### Medium Risk

- Phase 2 (Integration tests) - Test code only, but long-running tests in CI

### High Risk

- Phase 4 (Authorization) - Security-critical changes, requires careful review

---

## Rollout Plan

### Phase 1 & 2: Testing Enhancements

1. Run load tests locally
2. Document baselines
3. Add integration tests
4. Enable in CI (non-blocking initially)
5. Monitor for flakiness over 1 week
6. Make blocking if stable

### Phase 3: Translation Helper

1. Implement and test helper script
2. Update documentation
3. Run on one batch as proof-of-concept
4. User completes remaining batches at their pace

### Phase 4: Authorization (If Approved)

1. Create ADR and get stakeholder approval
2. Implement chosen strategy in feature branch
3. Comprehensive security testing
4. Gradual rollout: staging → 10% → 50% → 100%
5. Monitor audit logs closely for 2 weeks
6. Roll back if any security concerns detected

---

## Future Considerations

### Performance Monitoring Dashboard

- Real-time circuit breaker status visualization
- Performance metrics graphs (p50/p95/p99 over time)
- Alerting on threshold violations
- Integration with Axiom/Sentry for production

### Automated Load Testing in CI

- Scheduled weekly load tests
- Automatic baseline comparison
- Regression alerts on pull requests

### Enhanced Circuit Breaker

- Per-operation circuit breakers (separate for auth, analytics, services)
- Dynamic threshold adjustment based on historical failure rates
- Predictive circuit opening based on latency trends

### Multi-Region Resilience

- Database replica failover
- Cross-region circuit breaker coordination
- Geo-distributed load balancing

---

## Notes

- Load tests should be run during off-peak hours to avoid impacting real users
- Integration tests with 30s+ timeouts should be clearly marked in CI
- Authorization changes require security team approval before implementation
- Translation workflow is inherently manual due to quality requirements
