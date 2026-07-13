# ADR-017 Authorization Resilience Truth Implementation Plan

**Goal:** Make ADR-017 accurately describe the implemented authorization resilience policy without changing runtime behavior.

**Architecture:** Derive the documented matrix directly from `lib/auth/authorization.ts` defaults and fallback branches, then verify it against focused unit and source-policy tests.

**Tech Stack:** Markdown, TypeScript authorization helpers, Vitest documentation and policy tests.

---

### Task 1: Reconcile the ADR

**Files:**

- Modify: `docs/adr/017-authorization-resilience-strategy.md`

**Steps:**

1. Mark the accepted decision as implemented.
2. Document high-, medium-, and low-risk behavior.
3. Add the helper default/outcome matrix.
4. Record the low-risk assertion boundary and source-policy guard.
5. Replace future-tense implementation statements with current evidence and validation commands.

### Task 2: Validate documentation truth

**Steps:**

1. Run focused authorization and authorization-policy tests.
2. Run documentation hygiene, formatting, lint, type-check, references, and root checks.
3. Confirm the diff contains no runtime, RBAC, service-data, schema, or environment changes.

### Task 3: Review and deliver

**Steps:**

1. Obtain an independent evidence review of the ADR matrix and safety wording.
2. Address findings and rerun affected checks.
3. Commit, push, and open a focused pull request if validation is green.
