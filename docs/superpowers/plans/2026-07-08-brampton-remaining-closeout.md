# Brampton Remaining Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining Brampton launch closeout work that can be done autonomously, while keeping production writes, public relationship wording, land acknowledgment wording, and rollback execution behind explicit human approval.

**Architecture:** Treat the remaining work as six bounded lanes: production broad-record correction prep, approval-gated production correction execution, rollback posture, public-positioning drafts, future verification planning, and final verification/branch integration. All production changes use read-only preflight first, exact-ID SQL, prepared rollback SQL, and post-change smoke checks. Public docs stay boundary-safe and do not expose private operations details.

**Tech Stack:** Next.js 16, TypeScript strict mode, Node 22.13.1, Vitest, Supabase CLI v2.84.1 or newer, PostgreSQL JSONB, existing `services` / `services_public` production schema, existing `data/services.json` and `data/embeddings.json`.

## Global Constraints

- Use Node 22.13.1 for repo commands: `source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null`.
- Do not commit secrets, raw environment files, private hostnames, webhook URLs, private deployment paths, or private runbook contents.
- Do not run production data writes without explicit human approval in the current thread.
- Do not execute the prepared seven-ID Brampton rollback without explicit human approval.
- Do not publish land acknowledgment wording without explicit approval of the exact wording and source basis.
- Do not publish partner, official, endorsement, municipal, regional, provincial, Indigenous, or provider relationship wording without explicit approval of the exact wording.
- Do not promote deferred Brampton candidates into `data/services.json` without the same L1 workflow and explicit approval.
- Do not add raw search-query logging, tracking, analytics, or other privacy-changing behavior.
- Use Supabase CLI commands serially for live database checks.
- Keep public docs boundary-safe. Shared runtime, release roots, ingress, environment-file locations, restore proof details, and private operations state belong in the private/shared operations source of truth.

---

## Definitions

**Autonomous work:** Work Codex can safely do without another approval: read-only production checks, local scripts/tests/docs, draft-only artifacts, SQL generation for review, rollout-status documentation, source-link review, and local verification.

**Approval-gated work:** Work Codex can prepare but must not execute until the owner explicitly approves it: production SQL writes, data rollback execution, deployment changes, public land acknowledgment wording, and public official/partner wording.

**Definition of Done:** A lane is done only when its evidence is recorded in repo docs or private/shared operations material as appropriate, verification commands have passed or blockers are documented, and no pending approval-gated action is represented as completed.

---

## File Structure

- Modify `docs/superpowers/plans/2026-07-08-brampton-remaining-closeout.md`: this execution plan.
- Keep/verify `scripts/lib/broad-coverage-production-correction.ts`: pure planner for broad Ontario/Canada production coverage correction SQL.
- Keep/verify `scripts/prepare-broad-coverage-production-correction.ts`: dry-run-only CLI that turns a read-only production snapshot into apply and rollback SQL files.
- Keep/verify `tests/scripts/broad-coverage-production-correction.test.ts`: unit coverage for selection rules, SQL guardrails, rollback SQL, and CLI argument safety.
- Modify `package.json`: retain only a dry-run preparation script for broad coverage correction; no default production apply command.
- Create `docs/launch/brampton-broad-coverage-correction-approval.md`: approval packet for the broad Ontario/Canada correction.
- Modify `docs/launch/brampton-production-approval-packet.md`: link to broad correction packet and record current decision state.
- Modify `docs/launch/brampton-readiness-report.md`: record dry-run evidence, residual risks, and post-approval evidence when available.
- Modify `docs/launch/brampton-rollout-checklist.md`: track broad correction prep, approval, application, smoke checks, rollback state, and post-launch tasks.
- Create `docs/launch/brampton-land-acknowledgment-review.md`: draft-only source basis and wording-review checklist.
- Create `docs/launch/brampton-partner-source-wording-review.md`: draft-only relationship/source wording review.
- Create `docs/launch/brampton-l2-l3-verification-workplan.md`: future verification queue and done criteria.
- Optionally modify `docs/launch/brampton-public-positioning-drafts.md`: link to the detailed review packets and keep live-public wording gated.
- Private/shared operations source of truth: update restore/provider proof evidence outside this public repository.

---

## Task 1: Baseline The Current Production And Repo State

**Files:**

- Read: `docs/launch/brampton-readiness-report.md`
- Read: `docs/launch/brampton-production-approval-packet.md`
- Read: `docs/launch/brampton-rollout-checklist.md`
- Read: `docs/launch/brampton-seven-id-data-rollback-prep.md`

**Autonomy:** Fully autonomous, read-only.

- [ ] **Step 1: Verify working tree state**

Run:

```bash
git status --short --branch
```

Expected: current branch and all uncommitted files are understood. Do not discard unrelated user changes.

- [ ] **Step 2: Verify production health**

Run:

```bash
curl -fsS --max-time 20 https://careconnect.ing/api/v1/health \
  | python3 -c 'import json,sys; p=json.load(sys.stdin); print(json.dumps({"status": p.get("status"), "version": p.get("version")}, indent=2))'
```

Expected:

```json
{
  "status": "healthy",
  "version": "d7cc6e4"
}
```

- [ ] **Step 3: Verify seven Brampton rows are still present**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "with expected(id) as (values ('brampton-peel-centralized-shelter-intake'), ('brampton-wilkinson-road-shelter'), ('brampton-victim-services-of-peel'), ('brampton-safe-centre-of-peel'), ('brampton-peel-ontario-works-emergency-assistance'), ('brampton-regeneration-marketplace-food-bank'), ('brampton-knights-table-food-bank-meals')), rows as (select id, primary_place_id, scope, coverage, embedding from public.services where id in (select id from expected)) select count(*)::int as found, count(*) filter (where primary_place_id = 'brampton-on')::int as brampton_primary, count(*) filter (where scope is null)::int as null_scope, count(*) filter (where coverage is not null)::int as with_coverage, count(*) filter (where embedding is not null)::int as with_embedding from rows;"
```

Expected: one result row with `found = 7`, `brampton_primary = 7`, `null_scope = 7`, `with_coverage = 7`, and `with_embedding = 7`.

**Definition of Done:**

- Production health is healthy at the expected deployed version.
- Seven Brampton rows are confirmed live with Brampton-local coverage and embeddings.
- No production writes were run.
- Any unexpected result is recorded as a blocker before later tasks proceed.

---

## Task 2: Finish Broad Ontario/Canada Correction Prep

**Files:**

- Verify: `scripts/lib/broad-coverage-production-correction.ts`
- Verify: `scripts/prepare-broad-coverage-production-correction.ts`
- Verify: `tests/scripts/broad-coverage-production-correction.test.ts`
- Verify: `package.json`

**Autonomy:** Fully autonomous until SQL application. SQL generation is local only.

- [ ] **Step 1: Run planner tests**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/broad-coverage-production-correction.test.ts --run
```

Expected: all tests pass.

- [ ] **Step 2: Capture a read-only production snapshot**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select id, scope, primary_place_id, coverage from public.services order by id;" > /tmp/careconnect-production-services-coverage-snapshot.raw.json
```

Then extract the result rows into:

```text
/tmp/careconnect-production-services-coverage-snapshot.rows.json
```

Expected: row count matches current production service count.

- [ ] **Step 3: Generate apply and rollback SQL locally**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run sync:broad-coverage:prepare -- \
  --snapshot /tmp/careconnect-production-services-coverage-snapshot.rows.json \
  --sql-out /tmp/careconnect-broad-coverage-correction.sql \
  --rollback-out /tmp/careconnect-broad-coverage-rollback.sql
```

Expected:

- `mode` is `dry-run-sql-prep`.
- `writesEnabled` is `false`.
- The generated apply SQL updates only `scope`, `primary_place_id`, and `coverage`.
- The generated rollback SQL restores only the same fields.

- [ ] **Step 4: Guardrail-check generated SQL**

Run local checks that confirm:

- Apply SQL contains `begin;` and `commit;`.
- Rollback SQL contains `begin;` and `commit;`.
- Both SQL files target `public.services`.
- Neither SQL file references Brampton launch IDs.
- Neither SQL file updates service names, phones, addresses, URLs, descriptions, categories, verification fields, embeddings, provenance, or timestamps unless those are explicitly part of the generated assertion text.

**Definition of Done:**

- Planner tests pass.
- Read-only snapshot was captured from the linked production project.
- Apply and rollback SQL files exist under `/tmp`.
- Approval packet records row count, correction count, provincial/national split, exact corrected IDs, SQL artifact paths, and guardrail results.
- No production write was run.

---

## Task 3: Create The Broad Correction Approval Packet

**Files:**

- Create: `docs/launch/brampton-broad-coverage-correction-approval.md`
- Modify: `docs/launch/brampton-production-approval-packet.md`
- Modify: `docs/launch/brampton-readiness-report.md`
- Modify: `docs/launch/brampton-rollout-checklist.md`

**Autonomy:** Fully autonomous. This task documents the prepared correction; it does not execute it.

- [ ] **Step 1: Create the broad correction packet**

The packet must include:

- Date: `2026-07-08`.
- Status: `dry-run prepared; production write not executed`.
- Problem statement: existing production broad Ontario/Canada records were backfilled as Kingston-local coverage, preventing intended broad canonical reuse in Brampton selected-place searches.
- Scope: existing broad records only; no Brampton launch row changes.
- Generated SQL paths:
  - `/tmp/careconnect-broad-coverage-correction.sql`
  - `/tmp/careconnect-broad-coverage-rollback.sql`
- Correction summary from the dry run.
- Exact ID list from the dry run.
- Guardrails: only `scope`, `primary_place_id`, and `coverage`; no schema changes; no service fact changes; no embeddings; no Brampton IDs.
- Post-approval smoke checks.
- Exact approval text required before production write.

Required approval text:

```text
I approve applying the broad Ontario/Canada coverage correction to production Supabase. The write must update only scope, primary_place_id, and coverage for the reviewed broad-record ID set, run post-correction smoke checks, and prepare rollback SQL for approval before executing any rollback.
```

- [ ] **Step 2: Update existing launch docs**

Update:

- `docs/launch/brampton-production-approval-packet.md` to point at the broad correction packet.
- `docs/launch/brampton-readiness-report.md` to record dry-run prep under evidence and residual risks.
- `docs/launch/brampton-rollout-checklist.md` to mark dry-run prep complete and keep apply/smoke items unchecked until approval and execution.

**Definition of Done:**

- A reviewer can understand exactly what will change before approving.
- The docs make clear the production write has not happened.
- The exact approval sentence is present.
- Rollback SQL is prepared but not executable without separate approval if post-correction smoke fails.
- Public docs include no private operations details or secrets.

---

## Task 4: Apply Broad Correction After Explicit Approval

**Files:**

- Read: `/tmp/careconnect-broad-coverage-correction.sql`
- Read: `/tmp/careconnect-broad-coverage-rollback.sql`
- Modify after execution: `docs/launch/brampton-broad-coverage-correction-approval.md`
- Modify after execution: `docs/launch/brampton-production-approval-packet.md`
- Modify after execution: `docs/launch/brampton-readiness-report.md`
- Modify after execution: `docs/launch/brampton-rollout-checklist.md`

**Autonomy:** Conditionally autonomous only after the exact approval text in Task 3 is received.

- [ ] **Step 1: Confirm approval and target state**

Proceed only if the current thread contains the exact approval text from Task 3.

Run read-only checks first:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select count(*)::int as total, count(*) filter (where coverage is not null)::int as with_coverage from public.services;"
```

Expected: total production services and coverage count are plausible and match the current readiness docs.

- [ ] **Step 2: Apply the reviewed SQL**

Run the prepared SQL through the authenticated Supabase CLI only after visually confirming it matches the approval packet.

Expected:

- Transaction commits.
- Exact row-count assertion passes.
- No schema changes are applied.

- [ ] **Step 3: Run post-correction smokes**

Run:

- Public health check.
- Kingston selected-place food search.
- Brampton selected-place food and shelter searches.
- Brampton selected-place search that should include broad Ontario/Canada canonical records.
- Invalid `filters.placeId` request expecting `400`.
- Read-only production query confirming corrected IDs now have broad coverage.

**Definition of Done:**

- Exact approval was present before the write.
- Production SQL updated exactly the reviewed broad-record set.
- Post-correction DB checks confirm broad records have provincial/national coverage and null inappropriate local primary place values.
- Brampton selected-place search includes expected broad Ontario/Canada services where applicable.
- Kingston-only local records are still excluded from Brampton selected-place search.
- If any smoke fails, rollback SQL is prepared for approval and not executed automatically.

---

## Task 5: Close The Seven-ID Rollback Decision

**Files:**

- Modify: `docs/launch/brampton-seven-id-data-rollback-prep.md`
- Modify: `docs/launch/brampton-production-approval-packet.md`
- Modify: `docs/launch/brampton-rollout-checklist.md`

**Autonomy:** Documentation is autonomous. Rollback execution is approval-gated.

- [ ] **Step 1: Record current recommendation**

Document that rolling back the seven Brampton rows is not recommended unless the desired outcome is to remove Brampton public results. The seven rows did not cause the broad-record coverage gap.

- [ ] **Step 2: Keep exact rollback path available**

Confirm the rollback packet still identifies exactly these seven IDs:

- `brampton-peel-centralized-shelter-intake`
- `brampton-wilkinson-road-shelter`
- `brampton-victim-services-of-peel`
- `brampton-safe-centre-of-peel`
- `brampton-peel-ontario-works-emergency-assistance`
- `brampton-regeneration-marketplace-food-bank`
- `brampton-knights-table-food-bank-meals`

**Definition of Done:**

- Docs say rollback is prepared but not executed.
- Docs explain why rollback does not fix broad canonical reuse.
- No production data is deleted.
- Rollback remains available for explicit approval if the owner chooses to remove Brampton public results.

---

## Task 6: Prepare Public-Positioning Approval Packets

**Files:**

- Create: `docs/launch/brampton-land-acknowledgment-review.md`
- Create: `docs/launch/brampton-partner-source-wording-review.md`
- Modify: `docs/launch/brampton-public-positioning-drafts.md`

**Autonomy:** Draft/research work is autonomous. Publication is approval-gated.

- [ ] **Step 1: Create land acknowledgment review packet**

Include:

- Source list with official/public links already identified in `docs/launch/brampton-public-positioning-drafts.md`.
- Link status and date checked.
- Source-risk notes, including that Peel Region wording is under revision.
- Options for product-context framing.
- Explicit warning that final wording requires human approval and must not imply Indigenous endorsement.
- A consistency check against the Kingston/Katarokwi framing.

- [ ] **Step 2: Create partner/source wording review packet**

Include:

- Safe source-reference language.
- Unsafe language to avoid.
- Copy options for partner/source pages.
- Rules for provider logos, municipal names, source links, and endorsement claims.
- Approval gate for any official relationship claim.

- [ ] **Step 3: Link packets from public-positioning drafts**

Update the existing public-positioning draft doc so it references the detailed review packets instead of carrying all detail inline.

**Definition of Done:**

- Draft docs are complete enough for human review.
- No final land acknowledgment wording is published in public UI.
- No partner, official, or endorsement claim is published.
- Homepage/project naming remains `CareConnect` with Kingston and Brampton as supported communities.
- Public docs remain boundary-safe.

---

## Task 7: Build The Brampton L2/L3 And Deferred-Candidate Workplan

**Files:**

- Create: `docs/launch/brampton-l2-l3-verification-workplan.md`
- Modify: `data/drafts/brampton-on/reviews/2026-07-07-next-verification-queue.md`

**Autonomy:** Fully autonomous as a draft workplan. Live data promotion remains approval-gated.

- [ ] **Step 1: Define verification levels**

Record operational definitions:

- L1: basic public-source existence and service details confirmed.
- L2: reviewer/provider contact or stronger cross-source verification completed.
- L3: provider-confirmed or official partnership/provider review completed.

- [ ] **Step 2: Prioritize follow-up records**

Separate:

- Existing seven Brampton launch rows that need L2/L3 follow-up.
- Deferred Brampton candidates that need L1 before promotion.
- Broad Ontario/Canada canonical records that should not be duplicated locally.

- [ ] **Step 3: Add per-record done criteria**

For each record/candidate, include:

- Required source check.
- Contact or review action.
- Duplicate/canonical decision.
- Address/phone/intake conflict resolution if applicable.
- Promotion gate.

**Definition of Done:**

- Future reviewers can pick up the queue without re-reading the whole launch thread.
- Deferred candidates remain draft-only.
- No new live data is added.
- Knights Table address/source conflict remains explicitly flagged for L2.
- Broad canonical services are treated as reusable broad records, not duplicated Brampton local records.

---

## Task 8: Complete Restore/Provider Proof Hardening

**Files:**

- Read/update: private/shared operations source of truth only.
- Public repo update, if needed: boundary-safe status note in `docs/launch/brampton-production-approval-packet.md`.

**Autonomy:** Autonomous only if the private/shared operations workflow can be run without exposing secrets and without changing production. Any destructive restore test or production-affecting action is approval-gated.

- [ ] **Step 1: Inspect private/shared operations runbooks**

Confirm the current CareConnect restore/provider proof procedure and expected evidence location from the private/shared operations source of truth.

- [ ] **Step 2: Run safe proof checks**

Only run checks that:

- Do not expose secret values.
- Do not dump production data.
- Do not alter production state.
- Produce redacted or summary evidence.

- [ ] **Step 3: Record evidence in the correct place**

Private details stay in private/shared operations material. Public repo docs may record only a boundary-safe status such as `completed`, `planned`, or `blocked`, with no private paths or secrets.

**Definition of Done:**

- CareConnect-specific restore/provider proof status is no longer ambiguous in the private/source-of-truth material.
- Any public repo mention is boundary-safe.
- No secrets, raw database dumps, or private infrastructure details are committed.
- If proof cannot be safely completed autonomously, the blocker and required human action are documented.

---

## Task 9: Update Roadmap And Closeout Tracking

**Files:**

- Modify: active roadmap file discovered with `rg -n "Brampton|multi-city|roadmap|next" docs README.md`
- Modify: `docs/launch/brampton-readiness-report.md`
- Modify: `docs/launch/brampton-rollout-checklist.md`

**Autonomy:** Fully autonomous for status cleanup and roadmap organization.

- [ ] **Step 1: Find active roadmap locations**

Run:

```bash
rg -n "Brampton|multi-city|roadmap|next|post-launch" docs README.md
```

Expected: identify active roadmap/status files and ignore archive-only historical files unless they are the current roadmap.

- [ ] **Step 2: Update roadmap state**

Classify remaining work as:

- Done: foundation, migration, deployment, seven-record sync, Brampton first launch set.
- Next approval: broad Ontario/Canada production coverage correction.
- Draft/review: land acknowledgment, partner/source wording, L2/L3 verification.
- Hardening: restore/provider proof.
- Future expansion: deferred Brampton candidates and regional growth.

**Definition of Done:**

- Roadmap reflects current production reality.
- Completed work is not left as pending.
- Approval-gated work is not marked done early.
- The roadmap has no private deployment details.

---

## Task 10: Run Verification And Commit

**Files:**

- All changed files.

**Autonomy:** Fully autonomous.

- [ ] **Step 1: Run focused tests**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/broad-coverage-production-correction.test.ts tests/scripts/brampton-production-sync.test.ts tests/api/v1/search-api.test.ts tests/hooks/useServices.test.ts tests/lib/places/coverage.test.ts --run
```

Expected: pass.

- [ ] **Step 2: Run quality gates**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run lint
npm run type-check
npm run format:check
npm run check:refs
npm run validate-data
npm run check:embeddings
SKIP_EMBEDDINGS=1 npm run build
```

Expected: pass.

- [ ] **Step 3: Run broad test suite if time permits**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- --run
```

Expected: pass. If it fails, triage and fix regressions introduced by this branch. Do not mark done with unexplained failures.

- [ ] **Step 4: Commit**

Run:

```bash
git diff --check
git status --short
git add package.json scripts/lib/broad-coverage-production-correction.ts scripts/prepare-broad-coverage-production-correction.ts tests/scripts/broad-coverage-production-correction.test.ts docs/launch docs/superpowers/plans/2026-07-08-brampton-remaining-closeout.md
git commit -m "chore: prepare brampton production closeout"
```

**Definition of Done:**

- Tests and quality gates pass, or any non-repo/environment blocker is documented with exact rerun command.
- Commit contains only intended files.
- `git status --short` is clean after commit, except for unrelated user-owned changes if any are deliberately left untouched.
- Final status clearly separates completed autonomous prep from approval-gated production/public actions.

---

## Overall Definition Of Done

The autonomous closeout is complete when:

- Broad Ontario/Canada correction SQL and rollback SQL are generated from a fresh read-only production snapshot.
- The broad correction approval packet lists exact IDs, exact column scope, guardrails, and approval text.
- Launch docs and roadmap reflect current production truth.
- Seven-record rollback remains prepared but unexecuted unless explicitly approved.
- Land acknowledgment and partner/source wording packets are draft-only and approval-gated.
- L2/L3 and deferred-candidate workplan is ready for future curation.
- Private restore/provider proof status is checked and recorded in the correct private/shared source of truth, or a clear blocker is recorded.
- Verification commands pass or environment-only blockers are documented.
- Changes are committed without secrets or private operational details.

The production broad correction itself is complete only after the separate approval-gated Task 4 is executed and smoke checks pass.
