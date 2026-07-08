# Brampton Autonomous Closeout Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry out every remaining Brampton launch closeout item that can be done autonomously, safely, and reliably, while keeping production writes, rollbacks, official wording, and land acknowledgment publication behind explicit approval gates.

**Architecture:** Treat the closeout as a set of evidence-producing lanes: local guardrail tooling, read-only production verification, approval-ready SQL artifacts, launch documentation, roadmap/status cleanup, source-wording review, future curation planning, and private operations proof tracking. Each lane must end with recorded evidence, exact rerun commands, and a clear done/not-done state.

**Tech Stack:** Next.js 16, TypeScript strict mode, Node 22.13.1, Vitest, Supabase CLI, PostgreSQL, `public.services`, existing CareConnect launch docs, and private/shared operations material for non-public production evidence.

## Global Constraints

- Use Node 22.13.1 for repo commands: `source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null`.
- Do not commit `.env*`, credentials, tokens, raw database dumps, private hostnames, webhook URLs, private release roots, or private runbook contents.
- Do not run production SQL writes unless the current thread contains the exact approval text required by the relevant approval packet.
- Do not execute rollback SQL unless a separate rollback approval is present after a failed smoke check.
- Do not change `data/services.json` without explicit data approval.
- Do not infer or fabricate service facts. Draft service data must remain sourced and approval-gated.
- Do not publish final land acknowledgment wording without human approval of exact wording and source basis.
- Do not publish partner, official, endorsement, municipal, regional, provincial, Indigenous, or provider relationship claims without human approval of exact wording.
- Use Supabase CLI live-database commands serially.
- Before Supabase execution work, run `npx supabase --version`, `npx supabase db --help`, and the exact subcommand `--help` needed for that step.
- Keep public docs boundary-safe. Shared runtime, ingress, restore details, private release paths, and environment-file locations belong only in the private/shared operations source of truth.
- If any check fails twice for the same reason, stop retrying and record the blocker with the exact command and output summary.

---

## Operating Definitions

**Autonomous:** Safe to do without more user input because it is read-only, local-only, draft-only, or documentation-only.

**Conditionally autonomous:** Safe only after the exact approval text has already been provided in the current thread. Production SQL apply is in this category.

**Approval-gated:** Can be prepared autonomously, but execution/publication must wait for explicit human approval.

**Blocked:** Cannot be completed safely from this environment because required credentials, installed system dependencies, production access, or approval text are missing.

**Evidence:** A committed repo file, generated local artifact with hash recorded in docs, redacted private operations note, or command result summarized in a launch/readiness doc.

**Done:** The lane's definition of done is satisfied, evidence is recorded, verification passed or blockers are documented, and no approval-gated action is represented as complete.

## Current Known State

- Seven approved Brampton L1 records have already been synced to production.
- Production health and seven-row DB checks previously passed for deployed commit `d7cc6e4`.
- A broad Ontario/Canada coverage correction has been prepared as dry-run SQL and rollback SQL for 72 reviewed records.
- The broad correction has not been applied to production.
- A manifest verifier is in progress locally and must be finished before any future broad-correction apply.
- Land acknowledgment and partner/source wording are still approval-gated.
- L2/L3 verification and deferred Brampton candidates remain future curation work.
- Restore/provider proof belongs in private/shared operations material; only boundary-safe status may appear in public repo docs.

---

## File Structure

- Modify: `scripts/verify-broad-coverage-production-correction.ts`
  - Verification-only CLI for manifest, SQL hashes, and SQL guardrails.
- Modify: `tests/scripts/broad-coverage-production-correction.test.ts`
  - Unit tests for manifest verifier acceptance/rejection behavior.
- Modify: `package.json`
  - Add or keep `sync:broad-coverage:verify`; do not add a write/apply script.
- Modify: `docs/launch/brampton-broad-coverage-correction-approval.md`
  - Add the manifest verification command and done gate before any approved apply.
- Modify: `docs/launch/brampton-production-approval-packet.md`
  - Keep production decision state current and link to the broad correction packet.
- Modify: `docs/launch/brampton-readiness-report.md`
  - Record evidence, blockers, and current production-readiness status.
- Modify: `docs/launch/brampton-rollout-checklist.md`
  - Keep done/pending/approval-gated tasks accurate.
- Modify: `docs/planning/roadmap.md`
  - Reflect current multi-city/Brampton state without private operations details.
- Read/update if safe: private/shared operations source of truth
  - Record restore/provider proof status outside the public repo.

---

## Task 1: Finish The Manifest Verifier

**Autonomy:** Fully autonomous.

**Files:**

- Modify: `scripts/verify-broad-coverage-production-correction.ts`
- Modify: `tests/scripts/broad-coverage-production-correction.test.ts`
- Modify: `package.json`

**Steps:**

- [ ] Confirm current worktree:

```bash
git status --short --branch
```

Expected: only known closeout/verifier files are modified or untracked. Any unrelated user-owned change is left untouched.

- [ ] Run the focused verifier tests:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/broad-coverage-production-correction.test.ts --run
```

Expected before fixing: failing tests only if the verifier implementation is incomplete.

- [ ] Implement or finish `scripts/verify-broad-coverage-production-correction.ts` so it:
  - accepts only `--manifest <path>`,
  - reads manifest artifact paths from the manifest,
  - recomputes apply and rollback SQL SHA-256 hashes,
  - recomputes SQL guardrails,
  - requires `schemaVersion = careconnect-broad-coverage-correction-manifest-v1`,
  - requires `mode = dry-run-sql-prep`,
  - requires `writesEnabled = false`,
  - prints a JSON result,
  - exits non-zero if any check fails.

- [ ] Ensure `package.json` exposes only a verification command:

```json
"sync:broad-coverage:verify": "node --import tsx scripts/verify-broad-coverage-production-correction.ts"
```

- [ ] Rerun the focused tests:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/broad-coverage-production-correction.test.ts --run
```

Expected: all broad coverage planner, manifest, and verifier tests pass.

**Definition of Done:**

- Verifier rejects tampered SQL.
- Verifier rejects any manifest with `writesEnabled: true`.
- Verifier accepts the reviewed manifest and matching apply/rollback SQL.
- No command exists that applies broad correction SQL by default.
- Focused tests pass.

---

## Task 2: Verify The Prepared Broad Correction Artifacts

**Autonomy:** Fully autonomous if artifacts exist locally; otherwise regenerate from a read-only production snapshot.

**Files:**

- Read: `/tmp/careconnect-broad-coverage-correction-manifest.json`
- Read: `/tmp/careconnect-broad-coverage-correction.sql`
- Read: `/tmp/careconnect-broad-coverage-rollback.sql`
- Modify: `docs/launch/brampton-broad-coverage-correction-approval.md`

**Steps:**

- [ ] Run the verifier against the current manifest:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run sync:broad-coverage:verify -- \
  --manifest /tmp/careconnect-broad-coverage-correction-manifest.json
```

Expected:

```json
{
  "ok": true,
  "failures": [],
  "checked": {
    "ids": 72,
    "applySqlSha256Matches": true,
    "rollbackSqlSha256Matches": true,
    "applyGuardrailsMatch": true,
    "rollbackGuardrailsMatch": true,
    "writesEnabledFalse": true
  }
}
```

- [ ] If `/tmp` artifacts are missing, regenerate dry-run artifacts from a fresh read-only production snapshot:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json \
  "select id, scope, primary_place_id, coverage from public.services order by id;" \
  > /tmp/careconnect-production-services-coverage-snapshot.raw.json
```

Extract the result rows to:

```text
/tmp/careconnect-production-services-coverage-snapshot.rows.json
```

Then run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run sync:broad-coverage:prepare -- \
  --snapshot /tmp/careconnect-production-services-coverage-snapshot.rows.json \
  --sql-out /tmp/careconnect-broad-coverage-correction.sql \
  --rollback-out /tmp/careconnect-broad-coverage-rollback.sql \
  --manifest-out /tmp/careconnect-broad-coverage-correction-manifest.json
```

- [ ] Rerun the verifier after regeneration.

- [ ] Update the broad correction approval packet with the verifier command and the rule:

```text
Do not apply production SQL unless `npm run sync:broad-coverage:verify -- --manifest /tmp/careconnect-broad-coverage-correction-manifest.json` returns `ok: true`.
```

**Definition of Done:**

- Manifest verifier returns `ok: true`.
- Approval packet records the verifier command.
- SQL hashes in the docs match the manifest.
- Dry-run evidence still says production write was not executed.
- No production data was changed.

---

## Task 3: Reconfirm Production State Read-Only

**Autonomy:** Fully autonomous if Supabase CLI authentication remains available.

**Files:**

- Modify: `docs/launch/brampton-readiness-report.md`
- Modify: `docs/launch/brampton-production-approval-packet.md`

**Steps:**

- [ ] Check Supabase CLI version/help before live use:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase --version
npx supabase db --help
npx supabase db query --help
```

Expected: CLI is available and `db query` help confirms the flags used below.

- [ ] Confirm public health:

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

- [ ] Confirm seven Brampton rows:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "with expected(id) as (values ('brampton-peel-centralized-shelter-intake'), ('brampton-wilkinson-road-shelter'), ('brampton-victim-services-of-peel'), ('brampton-safe-centre-of-peel'), ('brampton-peel-ontario-works-emergency-assistance'), ('brampton-regeneration-marketplace-food-bank'), ('brampton-knights-table-food-bank-meals')), rows as (select id, primary_place_id, scope, coverage, embedding from public.services where id in (select id from expected)) select count(*)::int as found, count(*) filter (where primary_place_id = 'brampton-on')::int as brampton_primary, count(*) filter (where scope is null)::int as null_scope, count(*) filter (where coverage is not null)::int as with_coverage, count(*) filter (where embedding is not null)::int as with_embedding from rows;"
```

Expected: `found = 7`, `brampton_primary = 7`, `null_scope = 7`, `with_coverage = 7`, `with_embedding = 7`.

- [ ] Confirm broad correction is still unapplied or record if it was applied by another operator:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select count(*)::int as reviewed_ids, count(*) filter (where scope in ('ontario','canada') and primary_place_id is null and coverage is not null)::int as broad_shaped from public.services where id = any(array['ontario-211-ontario','kids-help-phone','crisis-988','crisis-kids-help-phone','legal-aid-ontario']);"
```

Expected before broad correction: reviewed sample may not all be broad-shaped. If all are broad-shaped, inspect whether the correction was applied outside this session before proceeding.

**Definition of Done:**

- Health is confirmed.
- Seven Brampton rows are confirmed.
- Broad correction current state is understood.
- Docs reflect the check date and outcome.
- Any unexpected result is documented as a blocker before production write consideration.

---

## Task 4: Apply Broad Correction Only If Approval Exists

**Autonomy:** Conditionally autonomous. Execute only if the exact approval sentence from `docs/launch/brampton-broad-coverage-correction-approval.md` appears in the current thread.

**Files:**

- Read: `/tmp/careconnect-broad-coverage-correction.sql`
- Read: `/tmp/careconnect-broad-coverage-correction-manifest.json`
- Modify: `docs/launch/brampton-broad-coverage-correction-approval.md`
- Modify: `docs/launch/brampton-readiness-report.md`
- Modify: `docs/launch/brampton-rollout-checklist.md`

**Steps:**

- [ ] Confirm the exact approval sentence is present. If it is not present, stop this task and mark it `approval-gated`.

- [ ] Run the manifest verifier immediately before applying:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run sync:broad-coverage:verify -- \
  --manifest /tmp/careconnect-broad-coverage-correction-manifest.json
```

Expected: `"ok": true`.

- [ ] Print and inspect only the SQL header, update assignment, assertions, and commit boundary:

```bash
sed -n '1,80p' /tmp/careconnect-broad-coverage-correction.sql
rg -n "scope = updates.scope|primary_place_id = updates.primary_place_id|coverage = updates.coverage|Expected to update exactly 72|commit;" /tmp/careconnect-broad-coverage-correction.sql
```

Expected: SQL updates only `scope`, `primary_place_id`, and `coverage`, with exact 72-row assertion.

- [ ] Apply the approved SQL through the authenticated Supabase path:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --file /tmp/careconnect-broad-coverage-correction.sql
```

Expected: transaction commits. If the exact assertion fails, the transaction aborts.

**Definition of Done:**

- Exact approval was present before execution.
- Manifest verifier returned `ok: true` immediately before execution.
- SQL transaction updated exactly the reviewed 72-ID set.
- No schema changes were made.
- No Brampton launch rows were updated.
- Docs record execution time, command, and outcome.

---

## Task 5: Run Post-Correction Smokes

**Autonomy:** Fully autonomous after Task 4 executes. If Task 4 is approval-gated, this task is pending.

**Files:**

- Modify: `docs/launch/brampton-broad-coverage-correction-approval.md`
- Modify: `docs/launch/brampton-readiness-report.md`
- Modify: `docs/launch/brampton-rollout-checklist.md`

**Steps:**

- [ ] Public health smoke:

```bash
curl -fsS --max-time 20 https://careconnect.ing/api/v1/health \
  | python3 -c 'import json,sys; p=json.load(sys.stdin); print(json.dumps({"status": p.get("status"), "version": p.get("version")}, indent=2))'
```

Expected: `status = healthy`, `version = d7cc6e4`.

- [ ] DB broad correction confirmation:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select count(*)::int as corrected from public.services where id = any(array['aboriginal-legal-services-als-','advocacy-centre-for-the-elderly-ace-','arch-disability-law','arthritis-society-canada','assaulted-womens-helpline','bounceback-ontario','cancer-information-helpline','cleo-community-legal-education','consumer-protection-ontario','crisis-211-ontario','crisis-988','crisis-assaulted-womens-helpline','crisis-connex-ontario','crisis-eating-disorders','crisis-good2talk','crisis-hope-for-wellness','crisis-kids-help-phone','crisis-ontario-gambling','crisis-pflag-canada','crisis-poison-control','crisis-talk-suicide-canada','crisis-talk4healing','crisis-telehealth-ontario','crisis-text-line','crisis-trans-lifeline','diabetes-canada-information-support','employment-standards-information-centre','heart-and-stroke-foundation','hiv-aids-legal-clinic-ontario-halco-','hope-for-wellness-helpline','hospice-palliative-care-ontario-hpco-','human-rights-legal-support-centre-hrlsc-','injured-workers-community-legal-clinic-iwc-','jordan-s-principle-call-centre','justice-for-children-and-youth-jfcy-','justice-for-children-youth','kids-help-phone','landlord-and-tenant-board-contact-centre','landlord-s-self-help-centre','law-society-referral-service','legal-aid-ontario','lung-health-line','ms-knowledge-network-ms-canada-','nishnawbe-aski-legal-services-nalsc-','office-of-the-worker-adviser-owa-','ontario-211-ontario','ontario-black-youth-helpline','ontario-boots-on-the-ground','ontario-caregiver-helpline','ontario-farmer-wellness','ontario-femaide','ontario-irs-crisis-line','ontario-legal-information-centre','ontario-lgbt-youthline','ontario-male-survivors','ontario-metis-crisis-line','ontario-mmiwg-crisis-line','ontario-naseeha','ontario-nors','ontario-ontx-distress','ontario-sadv-navigation','ontario-seniors-safety-line','ontario-vac-assistance','ontario-victim-support-line','parkinson-canada','pro-bono-ontario','sexual-health-infoline-ontario-shilo-','steps-to-justice','talk-tobacco','trans-lifeline-canada','workers-health-safety-legal-clinic','wsib-workplace-safety-insurance-board-']) and scope in ('ontario','canada') and primary_place_id is null and coverage is not null;"
```

Expected: `corrected = 72`.

- [ ] API smoke Brampton selected-place broad reuse, Brampton local inclusion, Kingston-only exclusion, and invalid place filter behavior using the existing search API test shape. Prefer existing npm test coverage first:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/api/v1/search-api.test.ts tests/hooks/useServices.test.ts tests/lib/places/coverage.test.ts --run
```

Expected: pass.

- [ ] If a live API smoke script exists, run it against production. If no script exists, document that live API behavior is covered by DB state plus local API regression tests.

**Definition of Done:**

- Production health remains healthy.
- DB confirms exactly 72 reviewed records have broad shape.
- Brampton selected-place logic is covered by passing regression tests.
- Any production smoke failure is documented, and rollback SQL is prepared for approval but not executed automatically.

---

## Task 6: Keep Rollback Posture Exact

**Autonomy:** Documentation is autonomous. Rollback execution is approval-gated.

**Files:**

- Modify: `docs/launch/brampton-seven-id-data-rollback-prep.md`
- Modify: `docs/launch/brampton-broad-coverage-correction-approval.md`
- Modify: `docs/launch/brampton-rollout-checklist.md`

**Steps:**

- [ ] Verify seven-ID rollback packet still lists exactly:
  - `brampton-peel-centralized-shelter-intake`
  - `brampton-wilkinson-road-shelter`
  - `brampton-victim-services-of-peel`
  - `brampton-safe-centre-of-peel`
  - `brampton-peel-ontario-works-emergency-assistance`
  - `brampton-regeneration-marketplace-food-bank`
  - `brampton-knights-table-food-bank-meals`

- [ ] Document that seven-ID rollback is not recommended unless the goal is to remove Brampton launch results.

- [ ] Document that seven-ID rollback does not fix broad Ontario/Canada canonical reuse.

- [ ] Confirm broad rollback SQL is only for the 72 broad IDs and remains approval-gated.

**Definition of Done:**

- Both rollback paths are documented with exact scope.
- Neither rollback path has been executed.
- Rollback documentation explains when each rollback would and would not be appropriate.
- Rollback execution requires fresh human approval.

---

## Task 7: Finish Roadmap And Launch Tracking Cleanup

**Autonomy:** Fully autonomous.

**Files:**

- Modify: `docs/planning/roadmap.md`
- Modify: `docs/launch/brampton-readiness-report.md`
- Modify: `docs/launch/brampton-rollout-checklist.md`

**Steps:**

- [ ] Locate active roadmap/status references:

```bash
rg -n "Brampton|multi-city|roadmap|post-launch|broad coverage|L2|L3" docs/planning docs/launch README.md
```

- [ ] Update roadmap categories:
  - `Done`: multi-city foundation, homepage supported-region animation, Brampton draft/review artifacts, seven L1 records, production deployment, seven-record production sync.
  - `Next approval`: broad Ontario/Canada production coverage correction, if still unapplied.
  - `Post-apply verification`: broad selected-place reuse smoke, if correction is applied.
  - `Draft/review`: land acknowledgment, partner/source wording.
  - `Curation`: L2/L3 follow-up and deferred Brampton candidates.
  - `Operations hardening`: restore/provider proof in private/shared operations source.

- [ ] Make checklist states match reality:
  - completed tasks checked,
  - approval-gated tasks unchecked,
  - blocked tasks include exact blocker and rerun command.

**Definition of Done:**

- Roadmap matches actual production state.
- No completed Brampton work remains inaccurately listed as pending.
- No approval-gated work is marked complete before approval/execution.
- No private operations details are added to public docs.

---

## Task 8: Prepare Public Wording Review For Human Approval

**Autonomy:** Draft/research/documentation is autonomous. Publication is approval-gated.

**Files:**

- Modify: `docs/launch/brampton-land-acknowledgment-review.md`
- Modify: `docs/launch/brampton-partner-source-wording-review.md`
- Modify: `docs/launch/brampton-public-positioning-drafts.md`

**Steps:**

- [ ] For land acknowledgment review, verify source links and record:
  - source name,
  - URL,
  - date checked,
  - what the source supports,
  - what it does not support,
  - whether wording is final, draft, under revision, or unsuitable.

- [ ] Keep final wording out of public UI until approval.

- [ ] For partner/source wording review, classify copy:
  - safe: source reference, public-source review, manual curation, no endorsement,
  - unsafe: partner, official, endorsed, affiliated, approved by provider, approved by municipality, unless explicitly approved.

- [ ] Update public-positioning drafts so `CareConnect` remains the umbrella name and Kingston/Brampton are supported communities.

**Definition of Done:**

- Source review is complete enough for human approval.
- Draft wording does not imply official affiliation or endorsement.
- Land acknowledgment wording remains unpublished.
- Partner/official wording remains unpublished.
- Public repo contains no private outreach or relationship claims.

---

## Task 9: Prepare L2/L3 And Deferred-Candidate Curation Queue

**Autonomy:** Fully autonomous as draft planning. Live service changes are approval-gated.

**Files:**

- Modify: `docs/launch/brampton-l2-l3-verification-workplan.md`
- Modify: `data/drafts/brampton-on/reviews/2026-07-07-next-verification-queue.md`

**Steps:**

- [ ] Confirm each of the seven live Brampton records has:
  - current level,
  - target next level,
  - unresolved fields,
  - exact L2 question,
  - evidence needed,
  - duplicate/canonical decision needed.

- [ ] Confirm deferred candidates remain draft-only:
  - Ste. Louise,
  - Brampton Multicultural Community Centre,
  - Catholic Crosscultural Services,
  - Punjabi Community Health Services.

- [ ] Confirm broad canonical services are not duplicated as local Brampton records.

**Definition of Done:**

- A reviewer can continue L2/L3 work without reading the full launch thread.
- Deferred records are not promoted.
- Knights Table address/source conflict remains explicitly flagged for L2.
- Duplicate policy is clear for broad/regional services.
- No live service data changes are made.

---

## Task 10: Complete Safe Restore/Provider Proof Tracking

**Autonomy:** Autonomous only for read-only/private evidence review. Destructive restore tests, production mutation, or secret exposure are approval-gated.

**Files:**

- Read/update: private/shared operations source of truth.
- Modify if needed: `docs/launch/brampton-production-approval-packet.md` with boundary-safe status only.

**Steps:**

- [ ] Inspect the private/shared operations source of truth for the current CareConnect restore/provider proof state.

- [ ] Run only checks that:
  - are read-only,
  - do not print secrets,
  - do not dump production data,
  - do not alter production,
  - produce redacted status evidence.

- [ ] Record detailed evidence privately.

- [ ] In public docs, record only one of:
  - `complete in private/shared operations evidence`,
  - `planned, not yet complete`,
  - `blocked: <boundary-safe blocker>`.

**Definition of Done:**

- Restore/provider proof status is no longer ambiguous.
- Private details stay out of the public repo.
- If proof cannot be completed autonomously, the exact safe next human action is documented.
- No production state is changed.

---

## Task 11: Run Final Verification

**Autonomy:** Fully autonomous, except environment-only blockers must be documented.

**Files:**

- All changed files.

**Steps:**

- [ ] Run focused tests:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/scripts/broad-coverage-production-correction.test.ts tests/api/v1/search-api.test.ts tests/hooks/useServices.test.ts tests/lib/places/coverage.test.ts --run
```

- [ ] Run quality gates:

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
```

- [ ] Run full Vitest:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- --run
```

- [ ] Attempt environment-dependent checks only if dependencies are available:

```bash
npm run test:a11y -- --project=chromium
npm run test:db:smoke
```

Expected known blockers if unchanged:

- Playwright/a11y may fail if Chromium system libraries are missing.
- DB smoke may fail if `psql` or local DB prerequisites are missing.

- [ ] Run final hygiene:

```bash
git diff --check
git status --short
python3 - <<'PY'
import pathlib
import re
import subprocess

files = subprocess.check_output(["git", "diff", "--name-only", "--diff-filter=ACM"], text=True).splitlines()
patterns = [
    re.compile(r"SUPABASE_(SECRET|DB_PASSWORD)\s*=", re.I),
    re.compile(r"service_role[_a-z0-9-]*\s*[:=]\s*['\"][^'\"]{16,}", re.I),
    re.compile(r"BEGIN [A-Z ]*PRIVATE KEY"),
    re.compile(r"(password|token|secret)\s*[:=]\s*['\"][^'\"]{16,}", re.I),
]
hits = []
for file_name in files:
    path = pathlib.Path(file_name)
    if not path.is_file():
        continue
    text = path.read_text(errors="ignore")
    for line_number, line in enumerate(text.splitlines(), 1):
        if any(pattern.search(line) for pattern in patterns):
            hits.append(f"{file_name}:{line_number}:{line[:160]}")
if hits:
    print("\n".join(hits))
    raise SystemExit(1)
PY
```

Expected: no diff whitespace errors; no likely secret assignments in changed files; only expected status.

**Definition of Done:**

- Focused tests pass.
- Lint, type-check, format, reference, data, embeddings, and build checks pass.
- Full Vitest passes, or introduced failures are fixed.
- Environment-only blockers are recorded with exact rerun commands.
- Secret scan shows no secret values.

---

## Task 12: Commit The Autonomous Closeout Work

**Autonomy:** Fully autonomous once verification passes.

**Files:**

- All intended changed files.

**Steps:**

- [ ] Review diff:

```bash
git diff --stat
git diff -- docs scripts tests package.json
```

- [ ] Stage only intended files:

```bash
git add \
  package.json \
  scripts/verify-broad-coverage-production-correction.ts \
  tests/scripts/broad-coverage-production-correction.test.ts \
  docs/launch/brampton-broad-coverage-correction-approval.md \
  docs/launch/brampton-production-approval-packet.md \
  docs/launch/brampton-readiness-report.md \
  docs/launch/brampton-rollout-checklist.md \
  docs/planning/roadmap.md \
  docs/superpowers/plans/2026-07-08-brampton-autonomous-closeout-execution.md
```

- [ ] Commit:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
git commit -m "chore: close brampton autonomous launch prep"
```

- [ ] Confirm clean state:

```bash
git status --short --branch
```

**Definition of Done:**

- Commit succeeds without bypassing hooks.
- Commit contains only intended autonomous closeout work.
- Working tree is clean or only unrelated user-owned files remain.
- Final response identifies completed work, verification run, known blockers, and approval-gated remaining items.

---

## Overall Definition Of Done

The autonomous closeout is done when all of the following are true:

- Manifest verifier exists, is tested, and can prove SQL/manifest identity before any broad correction apply.
- Broad correction artifacts are verified with `ok: true`, or missing artifacts are regenerated from a fresh read-only snapshot and then verified.
- Production state has been reconfirmed read-only.
- If exact broad-correction approval exists, the correction is applied and post-correction smokes pass.
- If exact broad-correction approval does not exist, the correction remains unapplied and the approval packet is complete.
- Rollback paths remain exact, scoped, and unexecuted without separate approval.
- Roadmap, readiness report, approval packet, and rollout checklist match current truth.
- Land acknowledgment and partner/source wording are ready for review but not published.
- L2/L3 and deferred-candidate curation queue is actionable but draft-only.
- Restore/provider proof status is recorded in the correct private/shared source or publicly documented as boundary-safe blocked/planned.
- Verification commands pass, except environment-only blockers that are documented with exact rerun commands.
- The work is committed without secrets or private operations details.

The project is not fully done while any approval-gated item remains unapplied or unpublished. In that case, the correct final state is `autonomous closeout complete; approval-gated items remain`.
