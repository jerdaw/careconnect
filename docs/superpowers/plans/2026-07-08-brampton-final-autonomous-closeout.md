# Brampton Final Autonomous Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete every remaining Brampton closeout item that can be handled autonomously, while keeping production writes, rollback execution, land acknowledgment wording, and official/partner relationship wording behind explicit approval gates.

**Architecture:** Treat the remaining work as eight bounded lanes: branch publication, read-only production baseline, broad-record correction readiness, approval-gated broad correction execution, rollback readiness, public-positioning governance, private restore-proof evidence tracking, and final roadmap/status closeout. Supabase work uses serial read-only preflight, exact-ID SQL, manifest verification, row-count assertions, and post-change smoke checks. Public repo docs record only boundary-safe evidence; private runtime and restore details stay in the private/shared operations source of truth.

**Tech Stack:** Next.js 16, TypeScript strict mode, Node 22.13.1, Vitest, Playwright Chromium where already available, Supabase CLI 2.84.1, PostgreSQL 17.6, pgvector embeddings, `data/services.json`, `data/embeddings.json`, production `public.services`, and production `public.services_public`.

## Global Constraints

- Use Node 22.13.1 for repo commands: `source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null`.
- Do not bypass git hooks with `--no-verify`.
- Do not commit secrets, raw `.env` files, private hostnames, webhook URLs, private release roots, private runbook contents, or private operations inventory details.
- Do not run production SQL writes without exact human approval in the current thread.
- Do not execute the seven-ID Brampton data rollback without exact human approval.
- Do not execute the broad-record correction rollback without exact human approval after a failed approved correction smoke.
- Do not publish land acknowledgment wording without exact human approval of the wording and source basis.
- Do not publish partner, endorsement, official, municipal, regional, provincial, Indigenous, or provider relationship wording without exact human approval.
- Do not promote deferred Brampton candidates into `data/services.json` without the same L1 workflow and explicit approval.
- Do not add raw search-query logging, tracking, analytics, or other privacy-changing behavior.
- Supabase CLI commands against production must run serially, with `npx supabase db query --help` confirming command shape before any write.
- Public documentation must stay boundary-safe. Shared runtime, ingress, release roots, environment locations, restore proof details, and private operations status belong in the private/shared operations source of truth.

---

## Current State

- Branch: `codex/brampton-production-data-closeout`.
- Base production app release: `d7cc6e4`.
- Brampton foundation PR #33 is merged to `main`.
- Production migration is applied.
- Production deploy is complete and health has returned `version: "d7cc6e4"`.
- Seven approved Brampton L1 records are live in production Supabase.
- Broad Ontario/Canada coverage correction is prepared as dry-run SQL and manifest, but not approved or applied.
- Seven-ID Brampton rollback SQL is documented for approval only, and current recommendation is not to execute it unless the desired outcome is removing Brampton public results.
- CareConnect restore/provider proof remains private-ops follow-up evidence, not proven complete in public repo evidence.
- Current branch push was blocked by full Vitest timeouts in two v22 evidence script test files during the pre-push hook.

## Definitions

**Autonomous work:** Work that can be done without another approval: local tests, local code/test fixes, read-only production checks, dry-run SQL generation, manifest verification, docs/status updates, source review, branch push/PR preparation, and private-source status recording that does not expose secrets.

**Approval-gated work:** Work that can be prepared but must not be executed until explicitly approved: production SQL writes, production rollback execution, deployment changes, official public wording changes, land acknowledgment wording changes, and live service data promotions.

**Definition of Done:** A task is done only when its commands have passed or its blocker is documented, the evidence is recorded in the correct repo or private/shared operations source, no unapproved production write has occurred, and all docs accurately distinguish completed work from pending approval gates.

## File Structure

- Modify if needed: `tests/scripts/check-v22-gate0-exit.test.ts` to stabilize only reproduced script-test timeout behavior.
- Modify if needed: `tests/scripts/check-v22-evidence-intake.test.ts` to stabilize only reproduced script-test timeout behavior.
- Keep verified: `scripts/lib/broad-coverage-production-correction.ts`.
- Keep verified: `scripts/prepare-broad-coverage-production-correction.ts`.
- Keep verified: `scripts/verify-broad-coverage-production-correction.ts`.
- Keep verified: `tests/scripts/broad-coverage-production-correction.test.ts`.
- Update as evidence changes: `docs/launch/brampton-broad-coverage-correction-approval.md`.
- Update as evidence changes: `docs/launch/brampton-production-approval-packet.md`.
- Update as evidence changes: `docs/launch/brampton-readiness-report.md`.
- Update as evidence changes: `docs/launch/brampton-rollout-checklist.md`.
- Update as evidence changes: `docs/planning/roadmap.md`.
- Update if public-positioning review changes: `docs/launch/brampton-land-acknowledgment-review.md`.
- Update if public-positioning review changes: `docs/launch/brampton-partner-source-wording-review.md`.
- Update if future verification sequencing changes: `docs/launch/brampton-l2-l3-verification-workplan.md`.
- Private/shared operations source of truth: record restore/provider proof status there only, not in public docs.

---

### Task 1: Stabilize Branch Publication

**Files:**

- Read: `tests/scripts/check-v22-gate0-exit.test.ts`
- Read: `tests/scripts/check-v22-evidence-intake.test.ts`
- Modify if reproduced: `tests/scripts/check-v22-gate0-exit.test.ts`
- Modify if reproduced: `tests/scripts/check-v22-evidence-intake.test.ts`

**Autonomy:** Fully autonomous. This task changes only test timeout resilience if the timeout is reproduced and the assertions already pass.

**Interfaces:**

- Consumes: existing Vitest script-test files that call shell validation scripts with `spawnSync`.
- Produces: a branch that can pass the normal pre-push hook without bypassing hooks.

- [ ] **Step 1: Reproduce the pre-push failures with targeted tests**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts --run
```

Expected: either all tests pass, or the same four tests time out at the Vitest default 5000 ms.

- [ ] **Step 2: If targeted tests pass, run the full suite once**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- --run
```

Expected: all non-skipped tests pass. If full suite passes, skip Steps 3-5 and proceed to Step 6.

- [ ] **Step 3: If only the same timeout failure reproduces, add explicit timeouts to the slow script tests**

In `tests/scripts/check-v22-gate0-exit.test.ts`, add this constant after `const tempRoots: string[] = []`:

```typescript
const SCRIPT_CHECK_TIMEOUT_MS = 20_000
```

Then change exactly these two tests to include the third Vitest timeout argument:

```typescript
it(
  "blocks GO when any required check is still non-pass",
  () => {
    const root = createFixtureRoot()
    writeChecklist(root, { decision: "GO", g03: "pass", g08: "pending", blockingChecks: "G0-8" })
    writeTracker(root, { ua1: "complete", ua3: "pending", c1Result: "complete" })
    writeCompleteEvidence(root)

    const result = runGateCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("BLOCKED: Gate 0 decision is GO but required checks are not all pass.")
    expect(result.stdout).toContain("G0-8:PENDING")
  },
  SCRIPT_CHECK_TIMEOUT_MS
)
```

```typescript
it(
  "passes GO only when all required checks pass and evidence is structurally complete",
  () => {
    const root = createFixtureRoot()
    writeChecklist(root, { decision: "GO", g03: "pass", g08: "pass", blockingChecks: "" })
    writeTracker(root, { ua1: "complete", ua3: "complete", c1Result: "complete" })
    writeCompleteEvidence(root)

    const result = runGateCheck(root)

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toContain("OK: v22.0 Gate 0 decision is GO and all required checks are pass.")
  },
  SCRIPT_CHECK_TIMEOUT_MS
)
```

In `tests/scripts/check-v22-evidence-intake.test.ts`, add this constant after `const tempRoots: string[] = []`:

```typescript
const SCRIPT_CHECK_TIMEOUT_MS = 20_000
```

Then change exactly these two tests to include the third Vitest timeout argument:

```typescript
it(
  "passes when C1 and D4 are complete with non-prep closure evidence",
  () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)

    const result = runEvidenceCheck(root)

    expect(result.status, result.stdout + result.stderr).toBe(0)
  },
  SCRIPT_CHECK_TIMEOUT_MS
)
```

For the formatter-aligned test, preserve its existing body and add only the timeout argument:

```typescript
  }, SCRIPT_CHECK_TIMEOUT_MS)
```

- [ ] **Step 4: Verify the targeted timeout fix**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts --run
```

Expected: both files pass, and no assertion is loosened.

- [ ] **Step 5: Commit only the stabilization if code changed**

Run:

```bash
git diff -- tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts
git add tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts
git commit -m "test: stabilize v22 evidence script timeouts"
```

Expected: commit succeeds through hooks. Do not commit if no file changed.

- [ ] **Step 6: Push the closeout branch through normal hooks**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
git push -u origin codex/brampton-production-data-closeout
```

Expected: pre-push hook completes without bypass, full Vitest passes, and the remote branch is created or updated.

**Definition of Done:**

- The pre-push hook passes without `--no-verify`.
- The branch is pushed to `origin/codex/brampton-production-data-closeout`.
- Any test timeout change is limited to four known slow script-integration tests and does not change assertions or production code.
- If tests fail for any reason other than reproduced timeout, the failure is diagnosed and documented before changing code.

---

### Task 2: Refresh Read-Only Production Baseline

**Files:**

- Read: `docs/launch/brampton-production-approval-packet.md`
- Read: `docs/launch/brampton-readiness-report.md`
- Modify if evidence changes: `docs/launch/brampton-readiness-report.md`
- Modify if evidence changes: `docs/launch/brampton-rollout-checklist.md`

**Autonomy:** Fully autonomous. All commands are read-only.

**Interfaces:**

- Consumes: authenticated linked Supabase CLI session.
- Produces: current evidence for health, migration state, seven Brampton rows, and broad correction unapplied/applied state.

- [ ] **Step 1: Confirm Supabase CLI command shape**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase --version
npx supabase db query --help
```

Expected: CLI version prints, and help confirms `supabase db query [sql]`, `--linked`, `--output`, and `--file`.

- [ ] **Step 2: Confirm production health**

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

- [ ] **Step 3: Confirm the seven Brampton rows remain live**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "with expected(id) as (values ('brampton-peel-centralized-shelter-intake'), ('brampton-wilkinson-road-shelter'), ('brampton-victim-services-of-peel'), ('brampton-safe-centre-of-peel'), ('brampton-peel-ontario-works-emergency-assistance'), ('brampton-regeneration-marketplace-food-bank'), ('brampton-knights-table-food-bank-meals')), rows as (select id, primary_place_id, scope, coverage, embedding from public.services where id in (select id from expected)) select count(*)::int as found, count(*) filter (where primary_place_id = 'brampton-on')::int as brampton_primary, count(*) filter (where scope is null)::int as null_scope, count(*) filter (where coverage is not null)::int as with_coverage, count(*) filter (where embedding is not null)::int as with_embedding from rows;"
```

Expected: `found = 7`, `brampton_primary = 7`, `null_scope = 7`, `with_coverage = 7`, and `with_embedding = 7`.

- [ ] **Step 4: Confirm broad-record correction state**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select id, scope, primary_place_id, coverage from public.services where id in ('ontario-211-ontario', 'kids-help-phone', 'ontario-naseeha', 'crisis-988', 'ontario-victim-support-line') order by id;"
```

Expected before approved correction: at least one reviewed broad record still has local `kingston-on` coverage. Expected after approved correction: all reviewed broad records match their repo broad shape.

**Definition of Done:**

- Health, seven-row state, and broad correction state are captured.
- No production writes occurred.
- If any expected value changed, docs record the exact observed state and later write tasks stop until the correction plan is recalculated.

---

### Task 3: Regenerate And Verify Broad Correction Artifacts

**Files:**

- Read: `scripts/lib/broad-coverage-production-correction.ts`
- Read: `scripts/prepare-broad-coverage-production-correction.ts`
- Read: `scripts/verify-broad-coverage-production-correction.ts`
- Test: `tests/scripts/broad-coverage-production-correction.test.ts`
- Modify if evidence changes: `docs/launch/brampton-broad-coverage-correction-approval.md`
- Modify if evidence changes: `docs/launch/brampton-production-approval-packet.md`

**Autonomy:** Fully autonomous. This task generates local SQL artifacts only.

**Interfaces:**

- Consumes: read-only production coverage snapshot.
- Produces: fresh apply SQL, rollback SQL, manifest, hashes, row-count assertions, and approval evidence.

- [ ] **Step 1: Run broad correction planner tests**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/broad-coverage-production-correction.test.ts --run
```

Expected: all broad correction tests pass.

- [ ] **Step 2: Capture a fresh read-only production snapshot**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select id, scope, primary_place_id, coverage from public.services order by id;" > /tmp/careconnect-production-services-coverage-snapshot.raw.json
```

Then normalize the CLI output into rows:

```bash
node <<'NODE'
const fs = require("node:fs")
const raw = JSON.parse(fs.readFileSync("/tmp/careconnect-production-services-coverage-snapshot.raw.json", "utf8"))
const rows =
  Array.isArray(raw) ? raw :
  Array.isArray(raw.data) ? raw.data :
  Array.isArray(raw.result) ? raw.result :
  Array.isArray(raw.rows) ? raw.rows :
  Array.isArray(raw[0]?.result) ? raw[0].result :
  null
if (!rows) {
  throw new Error("Could not find result rows in Supabase CLI JSON output")
}
fs.writeFileSync("/tmp/careconnect-production-services-coverage-snapshot.rows.json", JSON.stringify(rows, null, 2))
console.log(`wrote ${rows.length} rows`)
NODE
```

Expected: `wrote 203 rows` unless production service count has intentionally changed.

- [ ] **Step 3: Generate dry-run apply SQL, rollback SQL, and manifest**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run sync:broad-coverage:prepare -- \
  --snapshot /tmp/careconnect-production-services-coverage-snapshot.rows.json \
  --sql-out /tmp/careconnect-broad-coverage-correction.sql \
  --rollback-out /tmp/careconnect-broad-coverage-rollback.sql \
  --manifest-out /tmp/careconnect-broad-coverage-correction-manifest.json
```

Expected:

- `mode` is `dry-run-sql-prep`.
- `writesEnabled` is `false`.
- Existing expected state is 72 reviewed corrections, 49 provincial and 23 national, unless the fresh read-only snapshot proves production already changed.

- [ ] **Step 4: Verify the generated manifest**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run sync:broad-coverage:verify -- \
  --manifest /tmp/careconnect-broad-coverage-correction-manifest.json
```

Expected: `ok: true`; reviewed-ID set, apply SQL ID set, rollback SQL ID set, byte counts, SHA-256 values, and guardrails all match.

- [ ] **Step 5: Update approval evidence if the regenerated manifest differs**

Run:

```bash
sha256sum /tmp/careconnect-broad-coverage-correction.sql /tmp/careconnect-broad-coverage-rollback.sql
```

Expected: if hashes, row counts, or ID sets differ from `docs/launch/brampton-broad-coverage-correction-approval.md`, update the packet before asking for or using approval.

**Definition of Done:**

- Fresh SQL artifacts exist under `/tmp`.
- Manifest verifier returns `ok: true`.
- Approval packet reflects the exact current artifact hashes, byte counts, counts, ID set, and dry-run-only status.
- No production write occurred.

---

### Task 4: Apply Broad Correction Only After Exact Approval

**Files:**

- Read: `/tmp/careconnect-broad-coverage-correction.sql`
- Read: `/tmp/careconnect-broad-coverage-rollback.sql`
- Read: `/tmp/careconnect-broad-coverage-correction-manifest.json`
- Modify after execution: `docs/launch/brampton-broad-coverage-correction-approval.md`
- Modify after execution: `docs/launch/brampton-production-approval-packet.md`
- Modify after execution: `docs/launch/brampton-readiness-report.md`
- Modify after execution: `docs/launch/brampton-rollout-checklist.md`

**Autonomy:** Conditionally autonomous. Execute only after this exact approval appears in the current thread:

```text
I approve applying the broad Ontario/Canada coverage correction to production Supabase. The write must update only scope, primary_place_id, and coverage for the reviewed broad-record ID set, run post-correction smoke checks, and prepare rollback SQL for approval before executing any rollback.
```

**Interfaces:**

- Consumes: exact approval text, verified manifest, and fresh read-only baseline.
- Produces: corrected broad production coverage and post-correction smoke evidence.

- [ ] **Step 1: Confirm exact approval exists**

Expected: the current thread contains the exact approval text above. If not present, stop this task and report that the correction remains prepared but not applied.

- [ ] **Step 2: Re-run the manifest verifier immediately before the write**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run sync:broad-coverage:verify -- \
  --manifest /tmp/careconnect-broad-coverage-correction-manifest.json
```

Expected: `ok: true`.

- [ ] **Step 3: Visually inspect the apply SQL one final time**

Run:

```bash
sed -n '1,260p' /tmp/careconnect-broad-coverage-correction.sql
```

Expected:

- Transaction uses `begin;` and `commit;`.
- Updates target `public.services`.
- Assignment list is limited to `scope`, `primary_place_id`, and `coverage`.
- There is an exact 72-row post-update assertion if the refreshed manifest still has 72 corrections.
- There are no `brampton-` IDs.

- [ ] **Step 4: Execute the approved apply SQL**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --file /tmp/careconnect-broad-coverage-correction.sql --output json
```

Expected: command exits 0. If the SQL row-count assertion fails, the transaction aborts and no correction is applied.

**Definition of Done:**

- Exact approval was present before execution.
- Manifest verifier passed immediately before execution.
- Apply SQL command exited 0.
- The SQL transaction itself asserted the exact reviewed-row count.
- Docs are not marked complete until Task 5 post-correction smokes pass.

---

### Task 5: Run Post-Correction Smokes And Prepare Rollback If Needed

**Files:**

- Modify after success or failure: `docs/launch/brampton-readiness-report.md`
- Modify after success or failure: `docs/launch/brampton-rollout-checklist.md`
- Modify after failure only: `docs/launch/brampton-broad-coverage-correction-approval.md`

**Autonomy:** Fully autonomous for smoke checks. Rollback execution is approval-gated.

**Interfaces:**

- Consumes: approved broad correction write result.
- Produces: public API evidence, read-only database evidence, and rollback recommendation.

- [ ] **Step 1: Confirm public health**

Run:

```bash
curl -fsS --max-time 20 https://careconnect.ing/api/v1/health \
  | python3 -c 'import json,sys; p=json.load(sys.stdin); print(json.dumps({"status": p.get("status"), "version": p.get("version")}, indent=2))'
```

Expected: healthy and `version = "d7cc6e4"`.

- [ ] **Step 2: Confirm invalid place filter still fails closed**

Run:

```bash
curl -sS -o /tmp/careconnect-invalid-place.json -w "%{http_code}\n" \
  -H "content-type: application/json" \
  -X POST https://careconnect.ing/api/v1/search/services \
  --data '{"query":"food","filters":{"placeId":"not-a-place"}}'
cat /tmp/careconnect-invalid-place.json
```

Expected: HTTP `400` and an invalid request response.

- [ ] **Step 3: Confirm Kingston local results still work**

Run:

```bash
curl -fsS --max-time 30 \
  -H "content-type: application/json" \
  -X POST https://careconnect.ing/api/v1/search/services \
  --data '{"query":"food","filters":{"placeId":"kingston-on"},"limit":10}' \
  > /tmp/careconnect-kingston-food-smoke.json
node -e 'const p=require("/tmp/careconnect-kingston-food-smoke.json"); const ids=(p.data||p.results||[]).map(x=>x.id); console.log(ids.join("\n")); if (!ids.length) process.exit(1)'
```

Expected: non-empty Kingston food results.

- [ ] **Step 4: Confirm Brampton first-launch results still work**

Run:

```bash
curl -fsS --max-time 30 \
  -H "content-type: application/json" \
  -X POST https://careconnect.ing/api/v1/search/services \
  --data '{"query":"food","filters":{"placeId":"brampton-on"},"limit":50}' \
  > /tmp/careconnect-brampton-food-smoke.json
node -e 'const p=require("/tmp/careconnect-brampton-food-smoke.json"); const ids=(p.data||p.results||[]).map(x=>x.id); console.log(ids.join("\n")); if (!ids.some(id=>id.startsWith("brampton-"))) process.exit(1)'
```

Expected: Brampton food search includes one or more approved `brampton-` IDs.

- [ ] **Step 5: Confirm Brampton selected-place search includes intended broad records**

Run:

```bash
curl -fsS --max-time 30 \
  -H "content-type: application/json" \
  -X POST https://careconnect.ing/api/v1/search/services \
  --data '{"query":"211 help crisis phone","filters":{"placeId":"brampton-on"},"limit":50}' \
  > /tmp/careconnect-brampton-broad-smoke.json
node -e 'const p=require("/tmp/careconnect-brampton-broad-smoke.json"); const ids=(p.data||p.results||[]).map(x=>x.id); console.log(ids.join("\n")); const expected=["ontario-211-ontario","kids-help-phone","crisis-988"]; if (!expected.some(id=>ids.includes(id))) process.exit(1)'
```

Expected: at least one intended broad Ontario/Canada canonical record appears.

- [ ] **Step 6: Confirm broad DB rows are corrected read-only**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select count(*)::int as reviewed_rows, count(*) filter (where coverage is not null and jsonb_path_exists(coverage, '$[*] ? (@.kind == \"provincial\" || @.kind == \"national\")'))::int as broad_shaped from public.services where id in ('ontario-211-ontario', 'kids-help-phone', 'crisis-988', 'ontario-naseeha', 'ontario-victim-support-line');"
```

Expected: `reviewed_rows = 5` and `broad_shaped = 5`.

- [ ] **Step 7: If any smoke fails, prepare rollback for approval only**

Run:

```bash
sed -n '1,260p' /tmp/careconnect-broad-coverage-rollback.sql
sha256sum /tmp/careconnect-broad-coverage-rollback.sql
```

Expected: rollback SQL is ready for owner review, but not executed. Report the exact smoke failure and request approval before any rollback.

**Definition of Done:**

- If smokes pass: docs record the broad correction as applied, smoke commands and results are summarized, and rollout checklist marks correction and smoke complete.
- If smokes fail: docs record the failure, rollback SQL path and hash are presented, and no rollback is executed without approval.
- No raw search-query logging or privacy-changing behavior was added.

---

### Task 6: Close Public-Positioning Governance Artifacts Without Publishing Gated Wording

**Files:**

- Read/modify: `docs/launch/brampton-public-positioning-drafts.md`
- Read/modify: `docs/launch/brampton-land-acknowledgment-review.md`
- Read/modify: `docs/launch/brampton-partner-source-wording-review.md`
- Modify if needed: `docs/launch/brampton-readiness-report.md`
- Modify if needed: `docs/launch/brampton-rollout-checklist.md`

**Autonomy:** Fully autonomous for source checklists and draft packets. Publishing final wording is approval-gated.

**Interfaces:**

- Consumes: existing public-positioning draft files.
- Produces: approval-ready draft packets that do not imply official partnership, endorsement, or final land acknowledgment wording.

- [ ] **Step 1: Verify no final land acknowledgment wording is published accidentally**

Run:

```bash
rg -n "land acknowledgment|traditional territory|treaty|Indigenous|Mississaugas|Haudenosaunee|Anishinaabe" app components messages docs/launch
```

Expected: any land-related wording in public app/messages is already approved or neutral; Brampton-specific wording remains draft/checklist only.

- [ ] **Step 2: Verify source-reference wording does not imply endorsement**

Run:

```bash
rg -n "official partner|endorsed by|partnership with|in partnership with|approved by|affiliated with|sponsored by" app components messages docs/launch README.md
```

Expected: no public copy implies official affiliation unless already explicitly approved. Draft docs may discuss wording to avoid.

- [ ] **Step 3: Update draft packets only if gaps are found**

Required wording boundary in draft docs:

```markdown
Draft only. Do not publish final land acknowledgment, endorsement, official relationship, or partner wording without explicit approval of the exact text and source basis.
```

Expected: draft docs contain this boundary if they discuss gated copy.

**Definition of Done:**

- Draft docs are approval-ready.
- Public app copy remains neutral and umbrella-brand oriented.
- No unapproved land acknowledgment or official/partner wording is published.

---

### Task 7: Record Restore/Provider Proof Status In The Right Place

**Files:**

- Public repo read/update only if boundary-safe: `docs/launch/brampton-production-approval-packet.md`
- Public repo read/update only if boundary-safe: `docs/launch/brampton-readiness-report.md`
- Private/shared operations source of truth: update detailed restore/provider proof status there.

**Autonomy:** Partially autonomous. Codex may inspect and record status through approved private/shared operations material. Running an actual restore/provider proof is autonomous only if a documented safe runner exists and does not expose secrets or mutate production.

**Interfaces:**

- Consumes: private/shared operations inventory and runbooks.
- Produces: boundary-safe public status plus private detailed evidence.

- [ ] **Step 1: Inspect private/shared operations source of truth**

Run from the private operations workspace, not this public repo:

```bash
python3 scripts/validate/validate-workspace.py /home/jer/repos/vps/platform-ops
python3 scripts/validate/validate-live-checkouts.py inventory/live-checkouts.yaml --inventory inventory/services.yaml
```

Expected: private workspace validation passes.

- [ ] **Step 2: Search for a CareConnect-specific restore/provider proof runner**

Run from the private operations workspace:

```bash
rg -n "CareConnect|careconnect|restore|provider proof|restore proof|backup" projects docs scripts inventory
```

Expected: if a safe runner exists, it is clearly documented and does not require exposing secrets in the public repo or current chat. If no safe runner exists, record the gap as planned/not complete.

- [ ] **Step 3: Update public docs only with boundary-safe status**

Allowed public wording:

```markdown
CareConnect-specific restore/provider proof remains tracked in the private/shared operations source of truth. Public-safe status: planned/not complete, unless private evidence records a completed proof.
```

Disallowed public content:

- hostnames,
- private IPs,
- release roots,
- backup provider names if private,
- credentials,
- exact restore commands if private,
- private inventory paths beyond already public-safe repo references.

**Definition of Done:**

- Private operations status is validated and current.
- Public repo states only the safe summary.
- A real restore proof is not claimed complete unless private evidence proves it.

---

### Task 8: Maintain Future Brampton Verification Queue

**Files:**

- Read/modify: `docs/launch/brampton-l2-l3-verification-workplan.md`
- Read/modify: `data/drafts/brampton-on/reviews/2026-07-07-next-verification-queue.md`
- Read-only: `data/services.json`

**Autonomy:** Fully autonomous for queue organization, source-link checking, and status docs. Not autonomous for live data promotion.

**Interfaces:**

- Consumes: draft queue and promoted Brampton records.
- Produces: prioritized next verification plan for L2/L3 and deferred L1 candidates.

- [ ] **Step 1: Verify deferred candidates remain draft-only**

Run:

```bash
node <<'NODE'
const fs = require("node:fs")
const services = JSON.parse(fs.readFileSync("data/services.json", "utf8"))
const deferred = [
  "ste-louise",
  "brampton-multicultural-community-centre",
  "catholic-crosscultural-services",
  "punjabi-community-health-services",
]
const ids = new Set(services.map((service) => service.id))
const liveDeferred = deferred.filter((id) => ids.has(id))
if (liveDeferred.length) {
  console.error(`Deferred IDs are live: ${liveDeferred.join(", ")}`)
  process.exit(1)
}
console.log("Deferred candidates remain draft-only")
NODE
```

Expected: deferred candidates remain draft-only.

- [ ] **Step 2: Verify seven promoted records remain the only Brampton live additions**

Run:

```bash
node <<'NODE'
const fs = require("node:fs")
const services = JSON.parse(fs.readFileSync("data/services.json", "utf8"))
const brampton = services.filter((service) => service.primary_place_id === "brampton-on")
console.log(brampton.map((service) => service.id).sort().join("\n"))
if (brampton.length !== 7) {
  process.exit(1)
}
NODE
```

Expected: exactly seven Brampton-primary records.

- [ ] **Step 3: Keep future queue framed as workplan, not approval**

Required queue statuses:

- promoted records: L2/L3 follow-up candidates only,
- deferred candidates: L1 review required before promotion,
- Knights Table: recheck 211 pantry address before L2,
- all official/provider outreach: human/manual verification required where source conflicts remain.

**Definition of Done:**

- Future queue is current and prioritized.
- No deferred candidate is promoted.
- No verification level is raised without required evidence.

---

### Task 9: Final Verification And Roadmap Closeout

**Files:**

- Modify: `docs/planning/roadmap.md`
- Modify: `docs/planning/README.md` if active planning status changed.
- Modify: `docs/launch/brampton-readiness-report.md`
- Modify: `docs/launch/brampton-rollout-checklist.md`
- Modify: `docs/superpowers/plans/2026-07-08-brampton-final-autonomous-closeout.md` only if execution evidence is appended.

**Autonomy:** Fully autonomous.

**Interfaces:**

- Consumes: completed task evidence.
- Produces: current roadmap and launch status.

- [ ] **Step 1: Run focused Brampton and broad-correction tests**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/broad-coverage-production-correction.test.ts tests/api/v1/search-api.test.ts tests/hooks/useServices.test.ts tests/lib/places/coverage.test.ts tests/unit/brampton-live-launch-data.test.ts --run
```

Expected: all targeted tests pass.

- [ ] **Step 2: Run repo quality gates**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run lint
npm run type-check
npm run format:check
npm run check:refs
npm run validate-data
npm run db:validate
npm run check:embeddings
SKIP_EMBEDDINGS=1 npm run build
npm test -- --run
```

Expected: all commands pass. If full Vitest fails only with reproduced v22 script timeouts, return to Task 1.

- [ ] **Step 3: Run optional environment-dependent smokes when local dependencies are available**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu/nss:${LD_LIBRARY_PATH:-} \
  npm run test:a11y -- --project=chromium
```

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
PATH=/tmp/careconnect-local-deps/usr/lib/postgresql/16/bin:/tmp/careconnect-local-deps/usr/bin:$PATH \
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-} \
  npm run test:db:smoke
```

Expected: both pass if the extracted local dependencies are still present. If the `/tmp` dependencies were cleaned, record the environment blocker instead of changing app behavior.

- [ ] **Step 4: Check docs for boundary safety**

Run:

```bash
rg -n "SUPABASE_SECRET|service_role|password|webhook|/srv/|/etc/projects-|100\\.[0-9]+\\.[0-9]+\\.[0-9]+|ssh .*@" docs README.md AGENTS.md
```

Expected: no newly added private operations details or secrets. Existing intentionally public-safe references must be reviewed before committing.

- [ ] **Step 5: Commit final docs/test changes**

Run:

```bash
git status --short
git diff --check
git add docs tests scripts package.json
git commit -m "chore: finalize brampton autonomous closeout"
```

Expected: commit succeeds through hooks. Only stage files that actually changed and belong to the closeout.

- [ ] **Step 6: Push branch and prepare PR**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
git push -u origin codex/brampton-production-data-closeout
```

If GitHub CLI is authenticated:

```bash
gh pr create \
  --base main \
  --head codex/brampton-production-data-closeout \
  --title "chore: close Brampton production data follow-ups" \
  --body-file docs/launch/brampton-pr-description.md
```

Expected: branch is pushed. PR is created only if `gh auth status` is healthy; otherwise report the pushed branch and PR-ready docs.

**Definition of Done:**

- Roadmap and launch docs match actual state.
- Required tests and quality gates pass or environment-only blockers are documented.
- Branch is pushed through normal hooks.
- PR is created if GitHub CLI auth is available, or branch is ready for user-created PR.

---

## Overall Definition Of Done

The autonomous closeout is complete when all of these are true:

- Branch publication is no longer blocked by local hook failures.
- Production health is healthy at the expected release.
- Seven Brampton L1 rows are confirmed live, scoped to Brampton, and embedded.
- Broad Ontario/Canada correction is either:
  - still unapproved and documented as prepared only, or
  - explicitly approved, applied, and smoke-tested successfully.
- Any failed approved broad correction has rollback SQL prepared for approval, with no rollback executed automatically.
- Public docs clearly show which items are complete and which remain approval-gated.
- Land acknowledgment and official/partner wording remain draft-only unless exact wording was approved.
- Restore/provider proof status is recorded in the private/shared operations source of truth and summarized publicly only in boundary-safe terms.
- Deferred Brampton candidates remain draft-only.
- No service data, verification level, or public relationship claim was fabricated.
- Full repo verification passes, or environment-only failures are documented with exact rerun commands.
- `git status --short` is clean except for intentional user-owned changes outside this task.

## Remaining Human Decisions After Autonomous Closeout

- Approve or reject the broad Ontario/Canada production coverage correction if it has not already been approved.
- Approve or reject rollback execution only if a failed approved correction creates a rollback decision.
- Approve any final land acknowledgment wording.
- Approve any official/partner relationship wording.
- Provide or approve evidence for L2/L3 verification upgrades and deferred Brampton candidate promotions.
- Complete or approve CareConnect restore/provider proof through the private/shared operations workflow if a safe autonomous runner is not available.
