# Brampton Production Data Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Safely close the remaining Brampton launch gap by syncing only the seven approved Brampton L1 service records to production, verifying live search behavior, and updating launch documentation.

**Architecture:** Add a bounded data-sync helper that selects exactly the approved Brampton service IDs from repo data, validates required coverage and embeddings, supports a read-only dry run by default, and requires an explicit approval token for production writes. Keep public-positioning changes approval-gated and document any remaining non-code follow-up separately.

**Tech Stack:** Next.js 16, TypeScript, Node 22.13.1, Supabase PostgreSQL, `@supabase/supabase-js`, Vitest, existing `mapServiceToDatabaseUpsert()`.

## Global Constraints

- Use Node 22.13.1: `source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null`.
- Do not use the broad `scripts/migrate-data.ts` production path for this closeout; it upserts every service and is wider than needed.
- Do not fabricate or infer service data; only use the seven already-approved records in `data/services.json`.
- Do not change land acknowledgment wording, official relationship wording, partner wording, or provider-endorsement language.
- Do not print secrets, service-role keys, database passwords, raw env files, or private host inventory.
- Production data writes require final explicit approval immediately before `--apply`.
- If production smoke fails after sync, do not roll back schema; prepare an exact seven-ID data rollback command and ask for approval before executing it.
- Keep privacy behavior unchanged: no search analytics, no raw search logging, no tracking.

---

## File Structure

- Create `scripts/lib/brampton-production-sync.ts`: pure, testable sync planner for the seven approved Brampton IDs.
- Create `scripts/sync-brampton-production-data.ts`: CLI wrapper for dry-run/apply against Supabase.
- Create `tests/scripts/brampton-production-sync.test.ts`: unit tests for selection, validation, and safety guardrails.
- Modify `package.json`: add narrow scripts for Brampton dry-run and apply.
- Modify `docs/launch/brampton-rollout-checklist.md`: mark deployed/smoked items only after evidence exists.
- Modify `docs/launch/brampton-readiness-report.md`: record production deploy and data-sync evidence.
- Modify `docs/launch/brampton-production-approval-packet.md`: update status from deploy pending to data-sync closeout.

---

### Task 1: Confirm The Exact Production Data Gap

**Files:**

- Read: `data/services.json`
- Read: `data/embeddings.json`
- Read: `docs/launch/brampton-rollout-checklist.md`
- Read: `docs/launch/brampton-readiness-report.md`

**Interfaces:**

- Consumes: live public API at `https://careconnect.ing/api/v1/search/services`.
- Produces: evidence for whether production has zero, partial, or all seven Brampton records.

- [ ] **Step 1: Count approved Brampton records in repo JSON**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
node - <<'NODE'
const fs = require("fs")
const services = JSON.parse(fs.readFileSync("data/services.json", "utf8"))
const brampton = services.filter(
  (service) =>
    service.primary_place_id === "brampton-on" ||
    JSON.stringify(service.coverage || []).includes("brampton-on"),
)
console.log(JSON.stringify({
  total: services.length,
  brampton: brampton.length,
  ids: brampton.map((service) => service.id),
}, null, 2))
NODE
```

Expected: `total` is `203`, `brampton` is `7`, and IDs match the approved first-launch set.

- [ ] **Step 2: Verify current live Brampton search state**

Run:

```bash
curl -fsS --max-time 20 \
  -X POST https://careconnect.ing/api/v1/search/services \
  -H 'Content-Type: application/json' \
  --data '{"query":"shelter","locale":"en","filters":{"placeId":"brampton-on"},"options":{"limit":10}}' \
  -o /tmp/careconnect-brampton-shelter-search.json

python3 -c 'import json; p=json.load(open("/tmp/careconnect-brampton-shelter-search.json")); print(json.dumps({"count": len(p.get("data", [])), "total": p.get("meta", {}).get("total"), "ids": [i.get("id") for i in p.get("data", [])]}, indent=2))'
```

Expected before sync: likely `count: 0`, `total: 0`.

- [ ] **Step 3: Verify Kingston still serves live results before any data write**

Run:

```bash
curl -fsS --max-time 20 \
  -X POST https://careconnect.ing/api/v1/search/services \
  -H 'Content-Type: application/json' \
  --data '{"query":"food","locale":"en","filters":{"placeId":"kingston-on"},"options":{"limit":3}}' \
  -o /tmp/careconnect-kingston-food-search-before.json

python3 -c 'import json; p=json.load(open("/tmp/careconnect-kingston-food-search-before.json")); print(json.dumps({"count": len(p.get("data", [])), "total": p.get("meta", {}).get("total"), "ids": [i.get("id") for i in p.get("data", [])]}, indent=2))'
```

Expected: `count` greater than `0`.

---

### Task 2: Build The Bounded Brampton Sync Planner

**Files:**

- Create: `scripts/lib/brampton-production-sync.ts`
- Test: `tests/scripts/brampton-production-sync.test.ts`

**Interfaces:**

- Consumes: `Service[]`, `Record<string, number[]>`, and `mapServiceToDatabaseUpsert()`.
- Produces:
  - `APPROVED_BRAMPTON_SERVICE_IDS: readonly string[]`
  - `BRAMPTON_SYNC_APPROVAL_TOKEN: string`
  - `buildBramptonProductionSyncPlan(input): BramptonProductionSyncPlan`

- [ ] **Step 1: Add failing tests for exact-ID selection**

Create `tests/scripts/brampton-production-sync.test.ts` with tests that assert:

- The approved ID list contains exactly seven IDs.
- The helper selects those seven IDs from `data/services.json`.
- No Kingston-only record is selected.
- Every selected record has `primary_place_id: "brampton-on"` or coverage that includes `brampton-on`.
- Every selected record has a 384-dimensional embedding.

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/brampton-production-sync.test.ts --run
```

Expected before implementation: fail because `scripts/lib/brampton-production-sync.ts` does not exist.

- [ ] **Step 2: Implement `scripts/lib/brampton-production-sync.ts`**

Implement these exports:

```ts
import { mapServiceToDatabaseUpsert } from "../../lib/service-db"
import { Service } from "../../types/service"

export const APPROVED_BRAMPTON_SERVICE_IDS = [
  "brampton-peel-centralized-shelter-intake",
  "brampton-wilkinson-road-shelter",
  "brampton-victim-services-of-peel",
  "brampton-safe-centre-of-peel",
  "brampton-peel-ontario-works-emergency-assistance",
  "brampton-regeneration-marketplace-food-bank",
  "brampton-knights-table-food-bank-meals",
] as const

export const BRAMPTON_SYNC_APPROVAL_TOKEN = "I_APPROVE_SYNCING_SEVEN_BRAMPTON_L1_RECORDS"

export type BramptonProductionSyncPlan = {
  ids: string[]
  rows: ReturnType<typeof mapServiceToDatabaseUpsert>[]
  summary: {
    expectedIds: number
    selectedServices: number
    rowsWithBramptonCoverage: number
    rowsWithEmbeddings: number
  }
}

export function buildBramptonProductionSyncPlan(input: {
  services: Service[]
  embeddings: Record<string, number[]>
}): BramptonProductionSyncPlan
```

Validation rules:

- Throw if any approved ID is missing from `services`.
- Throw if any selected service lacks Brampton coverage.
- Throw if any selected service lacks a 384-dimensional embedding.
- Throw if selected count is not exactly seven.
- Return upsert rows generated through `mapServiceToDatabaseUpsert({ ...service, embedding })`.

- [ ] **Step 3: Run the new unit test**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/brampton-production-sync.test.ts --run
```

Expected: pass.

---

### Task 3: Build A Dry-Run-First Supabase Sync CLI

**Files:**

- Create: `scripts/sync-brampton-production-data.ts`
- Modify: `package.json`
- Test: `tests/scripts/brampton-production-sync.test.ts`

**Interfaces:**

- Consumes:
  - `buildBramptonProductionSyncPlan()`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SECRET_KEY`
  - optional `CARECONNECT_ENV_FILE`
  - optional `BRAMPTON_SYNC_APPROVAL`
- Produces:
  - Dry-run JSON summary without writes.
  - Apply mode that upserts exactly seven rows.

- [ ] **Step 1: Add CLI safety tests**

Extend `tests/scripts/brampton-production-sync.test.ts` with pure tests for:

- `BRAMPTON_SYNC_APPROVAL_TOKEN` is exact and non-empty.
- The apply mode should require `BRAMPTON_SYNC_APPROVAL === BRAMPTON_SYNC_APPROVAL_TOKEN`.
- The script should reject unknown positional arguments.

Expected before CLI implementation: fail for missing parser/helper if parser is exported, or skip direct parser tests and cover the guard through a small exported `assertApplyApproval()` helper from `scripts/lib/brampton-production-sync.ts`.

- [ ] **Step 2: Implement CLI behavior**

Create `scripts/sync-brampton-production-data.ts` with this behavior:

- Default mode is `--dry-run`.
- `--apply` is the only write mode.
- `--apply` requires `BRAMPTON_SYNC_APPROVAL=I_APPROVE_SYNCING_SEVEN_BRAMPTON_L1_RECORDS`.
- Load env from `CARECONNECT_ENV_FILE` if set, otherwise `.env.local`.
- Require `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
- Never print env values.
- Read `data/services.json` and `data/embeddings.json`.
- Build the seven-row plan.
- Before apply, query production for existing rows with those seven IDs.
- In dry-run, print only:
  - mode
  - target URL host, not full secret-bearing config
  - selected IDs
  - existing IDs
  - missing IDs
  - row count
- In apply, upsert the seven rows with `onConflict: "id"`.
- After apply, requery those seven IDs and print the final found count and IDs.

- [ ] **Step 3: Add package scripts**

Modify `package.json` scripts:

```json
{
  "sync:brampton:dry-run": "node --import tsx scripts/sync-brampton-production-data.ts --dry-run",
  "sync:brampton:apply": "node --import tsx scripts/sync-brampton-production-data.ts --apply"
}
```

- [ ] **Step 4: Verify CLI refuses apply without approval**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run sync:brampton:apply
```

Expected: exits non-zero with a message saying `BRAMPTON_SYNC_APPROVAL` must match the approval token. It must not attempt a Supabase write.

---

### Task 4: Local Verification Before Any Production Write

**Files:**

- Read: `package.json`
- Read: `data/services.json`
- Read: `data/embeddings.json`

**Interfaces:**

- Consumes: local test/build/data scripts.
- Produces: verification evidence that the sync helper is safe to run.

- [ ] **Step 1: Run targeted tests**

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/brampton-production-sync.test.ts tests/api/v1/search-api.test.ts tests/hooks/useServices.test.ts --run
```

Expected: pass.

- [ ] **Step 2: Run data integrity checks**

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run validate-data
npm run check:embeddings
```

Expected: 203 services, 203 embeddings, 384 dimensions.

- [ ] **Step 3: Run static checks**

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run lint
npm run type-check
npm run format:check
```

Expected: pass.

---

### Task 5: Production Dry Run

**Files:**

- Read: the approved production release directory if using the operator path.
- Read: the approved production environment file without printing it if using the operator path.

**Interfaces:**

- Consumes: Supabase production credentials from an approved local env or the VPS env file.
- Produces: read-only evidence of which of the seven records are missing in production.

- [ ] **Step 1: Prefer local dry-run if credentials are already present**

Run locally only if `.env.local` already contains the required production Supabase values:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run sync:brampton:dry-run
```

Expected: dry-run prints the seven selected IDs and current existing/missing status.
If `.env.local` still contains a placeholder `SUPABASE_SECRET_KEY`, this command must fail before network access and the operator/Supabase CLI read-only path below should be used.

- [ ] **Step 2: Use approved operator dry-run if local credentials are unavailable**

Run from the approved production operator shell, substituting only the approved private env-file path from the private/shared operations source of truth:

```bash
cd <approved-careconnect-release-current>
sudo env CARECONNECT_ENV_FILE=<approved-careconnect-env-file> \
  /usr/bin/env bash -lc 'source ~/.nvm/nvm.sh 2>/dev/null || true; npm run sync:brampton:dry-run'
```

Expected: dry-run prints seven selected IDs and no secret values. If Node/NPM is not available on the host outside Docker, stop and use the local Supabase-authenticated path instead.

---

### Task 6: Human Approval Gate For Production Data Write

**Files:**

- Read: dry-run output from Task 5.

**Interfaces:**

- Consumes: owner approval.
- Produces: explicit authorization to write exactly seven public service records.

- [ ] **Step 1: Present exact write scope**

Report:

- Seven IDs to upsert.
- Whether each ID is currently missing or already present.
- Confirmation that no other IDs will be written.
- Confirmation that schema will not change.
- Confirmation that land acknowledgment and partner wording will not change.

- [ ] **Step 2: Ask for the exact approval**

Required approval text:

```text
I approve syncing the seven approved Brampton L1 records to production Supabase and running post-sync smoke checks. If post-sync smoke checks fail, prepare the exact seven-ID data rollback for approval before executing it.
```

Do not run Task 7 until this approval is received in the thread.

---

### Task 7: Apply The Seven-Record Production Data Sync

**Files:**

- Read: `data/services.json`
- Read: `data/embeddings.json`
- Write: production Supabase `services` table, seven approved IDs only.

**Interfaces:**

- Consumes: `BRAMPTON_SYNC_APPROVAL`.
- Produces: seven production service rows with coverage and embeddings.

- [ ] **Step 1: Apply using local credentials if available**

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
BRAMPTON_SYNC_APPROVAL=I_APPROVE_SYNCING_SEVEN_BRAMPTON_L1_RECORDS \
  npm run sync:brampton:apply
```

Expected: output reports exactly seven selected IDs and seven found IDs after apply.

- [ ] **Step 2: Apply using approved operator path if local credentials are unavailable**

Run from the approved production operator shell, substituting only the approved private release and env-file paths from the private/shared operations source of truth:

```bash
cd <approved-careconnect-release-current>
sudo env \
  CARECONNECT_ENV_FILE=<approved-careconnect-env-file> \
  BRAMPTON_SYNC_APPROVAL=I_APPROVE_SYNCING_SEVEN_BRAMPTON_L1_RECORDS \
  /usr/bin/env bash -lc 'source ~/.nvm/nvm.sh 2>/dev/null || true; npm run sync:brampton:apply'
```

Expected: output reports exactly seven selected IDs and seven found IDs after apply.

---

### Task 8: Post-Sync Production Smoke

**Files:**

- Read: public API responses only.

**Interfaces:**

- Consumes: live production API.
- Produces: evidence that Brampton is live and Kingston remains intact.

- [ ] **Step 1: Health smoke**

```bash
curl -fsS --max-time 20 https://careconnect.ing/api/v1/health | python3 -m json.tool
```

Expected: `status` is `healthy`, `version` is `d7cc6e4` or the current deployed release.

- [ ] **Step 2: Brampton shelter smoke**

```bash
curl -fsS --max-time 20 \
  -X POST https://careconnect.ing/api/v1/search/services \
  -H 'Content-Type: application/json' \
  --data '{"query":"shelter","locale":"en","filters":{"placeId":"brampton-on"},"options":{"limit":10}}' \
  -o /tmp/careconnect-brampton-shelter-search-after.json

python3 -c 'import json; p=json.load(open("/tmp/careconnect-brampton-shelter-search-after.json")); print(json.dumps({"count": len(p.get("data", [])), "total": p.get("meta", {}).get("total"), "ids": [i.get("id") for i in p.get("data", [])]}, indent=2))'
```

Expected: includes Brampton shelter/intake records and no Kingston-only local records.

- [ ] **Step 3: Brampton food smoke**

```bash
curl -fsS --max-time 20 \
  -X POST https://careconnect.ing/api/v1/search/services \
  -H 'Content-Type: application/json' \
  --data '{"query":"food","locale":"en","filters":{"placeId":"brampton-on"},"options":{"limit":10}}' \
  -o /tmp/careconnect-brampton-food-search-after.json

python3 -c 'import json; p=json.load(open("/tmp/careconnect-brampton-food-search-after.json")); print(json.dumps({"count": len(p.get("data", [])), "total": p.get("meta", {}).get("total"), "ids": [i.get("id") for i in p.get("data", [])]}, indent=2))'
```

Expected: includes `brampton-regeneration-marketplace-food-bank` and/or `brampton-knights-table-food-bank-meals`.

- [ ] **Step 4: Kingston smoke**

```bash
curl -fsS --max-time 20 \
  -X POST https://careconnect.ing/api/v1/search/services \
  -H 'Content-Type: application/json' \
  --data '{"query":"food","locale":"en","filters":{"placeId":"kingston-on"},"options":{"limit":5}}' \
  -o /tmp/careconnect-kingston-food-search-after.json

python3 -c 'import json; p=json.load(open("/tmp/careconnect-kingston-food-search-after.json")); print(json.dumps({"count": len(p.get("data", [])), "total": p.get("meta", {}).get("total"), "ids": [i.get("id") for i in p.get("data", [])]}, indent=2))'
```

Expected: Kingston still returns live results.

- [ ] **Step 5: Invalid place smoke**

```bash
curl -sS --max-time 20 \
  -o /tmp/careconnect-invalid-place-after.json \
  -w '%{http_code}\n' \
  -X POST https://careconnect.ing/api/v1/search/services \
  -H 'Content-Type: application/json' \
  --data '{"query":"food","locale":"en","filters":{"placeId":"mississauga-on"},"options":{"limit":1}}'
python3 -c 'import json; print(json.load(open("/tmp/careconnect-invalid-place-after.json")).get("error",{}).get("message"))'
```

Expected: HTTP `400`, message `Invalid request`.

---

### Task 9: Documentation Closeout

**Files:**

- Modify: `docs/launch/brampton-rollout-checklist.md`
- Modify: `docs/launch/brampton-readiness-report.md`
- Modify: `docs/launch/brampton-production-approval-packet.md`

**Interfaces:**

- Consumes: evidence from Tasks 1, 5, 7, and 8.
- Produces: public-safe launch docs reflecting actual production state.

- [ ] **Step 1: Update rollout checklist**

Change:

- `Approve deployment` to checked only if approval/deploy evidence exists.
- `Deploy application` to checked because `d7cc6e4` is live.
- `Smoke test Kingston search` to checked after Task 8.
- `Smoke test Brampton selected-place behavior` to checked after Task 8.
- `Smoke test broad Ontario/Canada services` to checked after Task 8 confirms broad records appear where expected.
- `Run post-deploy search API checks after deployment approval` to checked after Task 8.

- [ ] **Step 2: Update readiness report**

Record:

- Deployment completed with release `d7cc6e4`.
- Production schema migration remains applied.
- Production data sync applied exactly seven approved Brampton L1 records, if Task 7 ran.
- Post-sync smoke results.
- Remaining approval-gated items: land acknowledgment, official/partner wording, future L2/L3 verification, deferred candidates.

- [ ] **Step 3: Update production approval packet**

Change status to reflect:

- Migration applied.
- Deployment applied.
- Data sync pending or complete, depending on Task 7.
- Normal `db push` still blocked by historical migration drift.
- Rollback boundaries remain: app rollback is separate from data correction and schema rollback.

---

### Task 10: Final Verification And Commit

**Files:**

- All modified files from Tasks 2, 3, and 9.

**Interfaces:**

- Consumes: final working tree.
- Produces: committed closeout changes.

- [ ] **Step 1: Run final local checks**

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/brampton-production-sync.test.ts tests/api/v1/search-api.test.ts tests/hooks/useServices.test.ts --run
npm run lint
npm run type-check
npm run format:check
npm run check:refs
npm run validate-data
npm run check:embeddings
SKIP_EMBEDDINGS=1 npm run build
```

Expected: all pass.

- [ ] **Step 2: Review diff**

```bash
git diff --check
git diff --stat
git diff -- scripts/lib/brampton-production-sync.ts scripts/sync-brampton-production-data.ts tests/scripts/brampton-production-sync.test.ts package.json docs/launch/brampton-rollout-checklist.md docs/launch/brampton-readiness-report.md docs/launch/brampton-production-approval-packet.md
```

Expected: scoped diff only.

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/brampton-production-sync.ts scripts/sync-brampton-production-data.ts tests/scripts/brampton-production-sync.test.ts package.json docs/launch/brampton-rollout-checklist.md docs/launch/brampton-readiness-report.md docs/launch/brampton-production-approval-packet.md
git commit -m "chore: add brampton production data closeout"
```

Expected: commit succeeds without bypassing hooks.

---

## Explicitly Not Autonomous

- Final production data write without approval.
- Deleting, disabling, or rolling back production service rows without approval.
- Schema rollback.
- Land acknowledgment wording.
- Official/partner relationship wording.
- Additional Brampton records beyond the seven approved L1 launch records.
- L2/L3 verification claims.

## Self-Review

- Spec coverage: plan covers production data sync, post-sync smoke, docs closeout, public wording boundaries, future deferred candidates, and ops hardening boundaries.
- Placeholder scan: no `TBD` or undefined follow-up steps; each task has exact files and commands.
- Type consistency: helper exports in Task 2 are consumed by Task 3; package scripts in Task 3 are consumed by Tasks 5 and 7.
