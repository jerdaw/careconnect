---
status: archived
last_updated: 2026-06-28
owner: jer
tags: [planning, autonomous, maintenance, governance]
---

# Autonomous Maintenance Work Plan - 2026-06-28

## Planning Artifact Location

Archived path: `docs/planning/archive/2026-06-28-autonomous-maintenance-plan.md`.

The plan started in the active planning area and was moved to `docs/planning/archive/` after completion, matching the
roadmap process for completed implementation plans.

## Repo Facts

### Stack And Components

- Framework: Next.js App Router, documented as Next.js 16 in `AGENTS.md`, `README.md`, and `docs/architecture.md`.
- Language/runtime: TypeScript strict mode with `noUncheckedIndexedAccess`; Node `>=22.0.0`.
- Styling: Tailwind CSS v4 and Radix UI.
- Database: Supabase PostgreSQL with pgvector, optional locally; JSON fallback remains supported.
- Search: privacy-first local hybrid search in `lib/search/**`; optional server search in `app/api/v1/search/services/route.ts`.
- AI: browser-side WebLLM and embeddings in `lib/ai/**`; failures should fall back to keyword-only behavior.
- Offline: PWA, IndexedDB, sync, and snapshot logic in `lib/offline/**`.
- Auth/governance: Supabase auth, RBAC in `lib/rbac.ts`, authorization helpers in `lib/auth/authorization.ts`.
- i18n: `next-intl` with 7 locale files under `messages/`.
- Main app areas: `app/**`, `components/**`, `hooks/**`, `lib/**`, `types/**`, `data/**`.
- Tests: Vitest under `tests/unit`, `tests/lib`, `tests/api`, `tests/components`, `tests/hooks`, `tests/integration`,
  and `tests/search`; Playwright under `tests/e2e`; DB lane under `tests/db`; k6 load tests under `tests/load`.

### Instructions And Conventions Inspected

- `AGENTS.md`: canonical repo instructions.
- `CLAUDE.md` and `GEMINI.md`: relative symlinks to `AGENTS.md`.
- `.agent/agent.md`: tracked same-scope agent context; currently stale in places because it says Next.js 15.
- `.agent/workflows/root-hygiene.md`: root-hygiene workflow for `npm run check:root`.
- `.agent/workflows/data-enrichment.md`: stale at planning time; it referenced generated access scripts and a missing
  hours-conversion helper.
- `README.md`, `CONTRIBUTING.md`, `docs/architecture.md`, `docs/planning/README.md`, `docs/planning/roadmap.md`,
  `docs/development/testing-guidelines.md`, `docs/development/git-workflow.md`,
  `docs/development/dependency-management.md`, and v22 Gate 0 implementation trackers.
- No `AGENTS.override.md` was found.

### Important Rules

- Never fabricate or auto-generate service information.
- Ask before modifying `data/services.json`, verification levels, scoring weights, RBAC, migrations, environment
  variables, or production/shared-runtime instructions.
- Do not read or commit `.env.local`, private maintainer notes, credentials, or private operations material.
- Public docs must not expose live host paths, release roots, alert channels, private dashboards, or shared-host details.
- Use `lib/logger.ts` instead of `console.log` in production code.
- Preserve accessibility and keyboard/screen-reader behavior.
- Do not weaken, delete, skip, or bypass tests/checks.

### Discovered Commands

Core:

```bash
npm run format:check
npm run lint
npm run type-check
npm run check:root
npm run check:refs
npm run validate-data
npm run search:qa
npm run i18n-audit
npm run validate:security-headers
npm run validate:security-headers:runtime
```

Governance:

```bash
npm run check:v22-evidence
npm run check:v22-threat-model
npm run check:v22-gate0
```

Tests and CI:

```bash
npm test -- --run
npm run test:coverage
npm run test:db
npm run test:db:smoke
npm run test:e2e
npm run test:e2e:local
npm run test:a11y
npm run ci:check
```

Security/dependencies:

```bash
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
```

Credential or service dependent:

- `npm run test:db` requires Docker and `psql`.
- `npm run test:load*` requires `k6`.
- `npm run phone-validate` requires Twilio credentials.
- `npm run geocode` requires `OPENCAGE_API_KEY`.
- Authenticated dashboard/admin visual QA requires Supabase config and a signed-in role-appropriate session.

## Baseline State

### Branch And Git State

- Branch: `main`.
- Initial WSL status before validation: `## main...origin/main`, clean.
- Recent commits:
  - `08819b0 chore: complete autonomous closeout prep`
  - `5aaa965 docs: document critical-only notification posture`
  - `a8713bd chore: add critical-only notification mode`
  - `2fa3abf chore: align search and translation maintenance`
  - `769f006 chore: normalize archived audit text line endings`
- PowerShell Git over the UNC path failed initially with Git dubious ownership protection. WSL-native Git was used
  for the authoritative baseline without changing global Git config.
- During discovery, two unrelated docs files appeared modified after the initial clean WSL status:
  - `docs/planning/roadmap.md`
  - `docs/workflows/french-translation-workflow.md`
- Those diffs looked like a separate roadmap/French translation closeout update. Do not overwrite them in a future
  unattended run.

### Environment Assumptions

- Repo path: `/home/jer/repos/vps/careconnect` in WSL, accessed from the desktop workspace through
  `\\wsl.localhost\Ubuntu\home\jer\repos\vps\careconnect`.
- Local runtime observed before WSL became unreliable: Node `v24.17.0`, npm `11.13.0`; CI pins Node 22.
- `.env.local` exists and was not read.
- `private/` exists and was not read.
- `.next/` exists and is ignored/generated.
- Private/shared operations material was not inspected because this plan does not touch shared runtime, release,
  ingress, environment-file, or production instructions. Inspect that source of truth first if future work touches
  those areas.

### Commands Run Before Writing This Plan

| Command                                     | Result                     | Notes                                                                                   |
| ------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| `node --version`                            | Pass                       | `v24.17.0`                                                                              |
| `npm --version`                             | Pass                       | `11.13.0`                                                                               |
| `npm run format:check`                      | Pass                       | All matched files formatted before the artifact was written                             |
| `npm run check:root`                        | Pass                       | Root directory clean                                                                    |
| `npm run lint`                              | Pass                       | ESLint passed                                                                           |
| `npm run type-check`                        | Pass                       | `tsc --noEmit` passed                                                                   |
| `npm run validate-data`                     | Pass                       | 196 services passed, 0 failed, 0 warnings                                               |
| `npm run check:refs`                        | Pass                       | 144 files checked                                                                       |
| `npm run i18n-audit`                        | Pass                       | 1211 keys per locale; 0 missing/extra; 326 potentially unused                           |
| `npm run check:v22-evidence`                | Pass                       | C1/D4 evidence intake internally consistent                                             |
| `npm run check:v22-threat-model`            | Pass                       | Threat-model Gate 0 outcome internally consistent                                       |
| `npm run validate:security-headers`         | Pass with warnings         | Warned on `unsafe-inline` and WebLLM-required `unsafe-eval`                             |
| `npm audit --omit=dev --audit-level=high`   | Pass                       | 0 vulnerabilities                                                                       |
| `npm audit --audit-level=high`              | Pass                       | 0 vulnerabilities                                                                       |
| `npm run search:qa`                         | Pass                       | 18/18 scenarios passed                                                                  |
| `npm run validate:security-headers:runtime` | Fail - environment blocker | No local server at `127.0.0.1:3000`; `/en` and `/api/v1/health` returned `fetch failed` |
| `npm test -- --run`                         | Pass                       | 199 files passed; 1614 passed, 24 skipped                                               |
| `npm run check:v22-gate0`                   | Expected fail              | Gate 0 remains `NO-GO`; blocking checks `G0-3`, `G0-8`                                  |

### Commands Not Run

- `npm run build`: skipped during planning because `postbuild` runs embedding generation and can touch generated data.
- `npm run ci:check`: skipped during planning because it includes coverage/build and optional DB checks.
- `npm run test:db`: skipped; Docker/`psql` prerequisites were not verified.
- Playwright and load tests: skipped per repo guidance unless explicitly needed.
- Credential-backed scripts: skipped; no Twilio, OpenCage, Supabase secret, or production credentials used.

Post-write note: after the artifact was first written, WSL command execution became unreliable and returned exit code 1
or timeouts for simple commands. Windows-side Node/npm are not on PATH. Re-run `npm run format:check` and
`npm run check:refs` after WSL is healthy.

## Candidate Work Inventory

| ID     | Objective                                                                                      | Likely Files/Areas                                                                                                                | Risk   | Acceptance Criteria                                                                                                                                              | Validation Commands                                                                                                                                | Rollback Plan                                                                                                                                                                        | Blocker If Not Safe                                                                                         |
| ------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------- | ---- |
| CCN-01 | Align tracked agent context with current Next.js 16 and canonical `AGENTS.md`.                 | `.agent/agent.md`, possibly comments in `tests/setup/next-mocks.ts`                                                               | Low    | Current-context files no longer describe the repo as Next.js 15; historical ADR/archive references stay untouched.                                               | `rg -n "Next.js 15                                                                                                                                 | Next\\.js 15" .agent tests/setup/next-mocks.ts`; `npm test -- --run tests/setup/verify-mocks.test.ts tests/unit/documentation-hygiene.test.ts`; `npm run lint`; `npm run type-check` | Revert changed context/comment files.                                                                       | None                                                                                            |
| CCN-02 | Replace stale `.agent` data-enrichment workflow instructions.                                  | `.agent/workflows/data-enrichment.md`                                                                                             | Low    | No generated access-script instructions, fabricated service facts, or missing script references remain; workflow points to current audit/manual-review commands. | `rg -n "convert-hours-to-structured                                                                                                                | assign-access-scripts                                                                                                                                                                | Generate Access Scripts" .agent/workflows/data-enrichment.md`; `npm run check:refs`; `npm run format:check` | Revert the workflow file.                                                                       | None              |
| CCN-03 | Extend reference validation to tracked `.agent` docs and active planning docs.                 | `scripts/check-references.ts`, `tests/unit` or `tests/scripts`                                                                    | Medium | `npm run check:refs` scans `.agent/**` and active `docs/planning` files while excluding archives/generated output.                                               | `npm run check:refs`; targeted tests; `npm run lint`; `npm run type-check`                                                                         | Revert validator/test edits.                                                                                                                                                         | Do after CCN-02 so newly scanned `.agent` files pass.                                                       |
| CCN-04 | Align dependency docs with actual workflow inventory.                                          | `docs/development/dependency-management.md`, possible docs hygiene test                                                           | Low    | Active docs no longer claim `.github/workflows/dependency-review.yml` exists unless the workflow exists.                                                         | `rg -n "dependency-review\\.yml" docs/development/dependency-management.md .github`; `npm run check:refs`; targeted docs test                      | Revert doc/test edits.                                                                                                                                                               | None                                                                                                        |
| CCN-05 | Remove stale active-doc test-count claims.                                                     | `docs/development/release-process.md`, `docs/development/dependency-management.md`                                                | Low    | Active docs avoid brittle counts like `895+ tests` or use a fresh dated baseline.                                                                                | `rg -n "895\\+                                                                                                                                     | 1599                                                                                                                                                                                 | 198 test                                                                                                    | 1614" docs/development README.md CONTRIBUTING.md`; `npm run format:check`; `npm run check:refs` | Revert doc edits. | None |
| CCN-06 | Preserve and reconcile the unrelated roadmap/French workflow diffs before editing those files. | `docs/planning/roadmap.md`, `docs/workflows/french-translation-workflow.md`                                                       | Medium | User-owned diffs are preserved; any additional edits are explicit and minimal.                                                                                   | `git diff -- docs/planning/roadmap.md docs/workflows/french-translation-workflow.md`; `npm run check:refs`                                         | Revert only future-run edits, not user diffs.                                                                                                                                        | Current uncommitted diffs must be reviewed first.                                                           |
| CCN-07 | Improve runtime security-header validator messaging when no server is running.                 | `scripts/validate-runtime-security-headers.ts`, `lib/security/security-headers.ts`, `tests/unit/runtime-security-headers.test.ts` | Low    | No-server failures clearly say the app is unreachable and suggest `npm run dev` or `SECURITY_HEADERS_BASE_URL`; exit remains nonzero.                            | `npm run validate:security-headers:runtime`; `npm test -- --run tests/unit/runtime-security-headers.test.ts`; `npm run lint`; `npm run type-check` | Revert script/lib/test edits.                                                                                                                                                        | None                                                                                                        |
| CCN-08 | Document runtime security-header validation prerequisites.                                     | `docs/development/security-headers.md` or nearby active security docs                                                             | Low    | Docs state the runtime validator requires a running app or `SECURITY_HEADERS_BASE_URL`.                                                                          | `npm run check:refs`; `npm run format:check`; `npm run validate:security-headers`                                                                  | Revert doc edits.                                                                                                                                                                    | None                                                                                                        |
| CCN-09 | Add `search:qa` to local CI helper for CI parity.                                              | `scripts/validate-ci.sh`, maybe testing docs                                                                                      | Low    | `scripts/validate-ci.sh` runs `npm run search:qa`, matching GitHub CI static analysis.                                                                           | `bash -n scripts/validate-ci.sh`; `npm run search:qa`; `npm run lint`; `npm run type-check`                                                        | Revert script/doc edits.                                                                                                                                                             | None                                                                                                        |
| CCN-10 | Align active git workflow docs with the no-hook-bypass rule.                                   | `docs/development/git-workflow.md`                                                                                                | Low    | Active docs no longer recommend `git commit --no-verify` or `git push --no-verify`.                                                                              | `rg -n -- "--no-verify                                                                                                                             | Emergency Override" docs/development/git-workflow.md AGENTS.md`; `npm run format:check`; `npm run check:refs`                                                                        | Revert doc edits.                                                                                           | None                                                                                            |
| CCN-11 | Add docs hygiene coverage for no-hook-bypass guidance.                                         | `tests/unit/documentation-hygiene.test.ts`                                                                                        | Low    | Test fails if active development docs recommend `--no-verify`.                                                                                                   | `npm test -- --run tests/unit/documentation-hygiene.test.ts`; `npm run lint`; `npm run type-check`                                                 | Revert test edit.                                                                                                                                                                    | Do after CCN-10.                                                                                            |
| CCN-12 | Add docs hygiene coverage for `.agent` drift.                                                  | `tests/unit/documentation-hygiene.test.ts`                                                                                        | Low    | Test covers `.agent/agent.md` and `.agent/workflows/*.md` for canonical guidance and absence of stale generated-content instructions.                            | `npm test -- --run tests/unit/documentation-hygiene.test.ts`; `npm run check:refs`; `npm run lint`                                                 | Revert test edit.                                                                                                                                                                    | Do after CCN-01 and CCN-02.                                                                                 |
| CCN-13 | Add active workflow-path reference guard.                                                      | `tests/unit/documentation-hygiene.test.ts` or `scripts/check-references.ts`                                                       | Low    | Active docs cannot reference missing `.github/workflows/*.yml` files.                                                                                            | `npm test -- --run tests/unit/documentation-hygiene.test.ts`; `npm run check:refs`                                                                 | Revert test/script edit.                                                                                                                                                             | Do after CCN-04.                                                                                            |
| CCN-14 | Document build/postbuild embedding mutation expectations.                                      | `docs/development/testing-guidelines.md`, `CONTRIBUTING.md`, or nearby active docs                                                | Low    | Docs state `npm run build` runs `postbuild` embedding generation and generated diffs must be reviewed.                                                           | `npm run format:check`; `npm run check:refs`; `rg -n "postbuild                                                                                    | generate-embeddings                                                                                                                                                                  | embeddings" docs/development CONTRIBUTING.md`                                                               | Revert doc edits.                                                                               | None              |
| CCN-15 | Add a read-only embeddings freshness check.                                                    | New script, `package.json`, targeted tests                                                                                        | Medium | Command reports missing/stale embeddings without writing files or regenerating embeddings.                                                                       | New command; targeted tests; `npm run lint`; `npm run type-check`                                                                                  | Revert script/package/test edits.                                                                                                                                                    | Requires schema inspection and strict read-only implementation.                                             |
| CCN-16 | Add a default E2E skip-free guard.                                                             | `tests/unit/documentation-hygiene.test.ts` or new hygiene test                                                                    | Low    | Test fails on `test.skip`, `describe.skip`, or `it.skip` in the default `tests/e2e` suite.                                                                       | `npm test -- --run tests/unit/documentation-hygiene.test.ts`; `rg -n "test\\.skip                                                                  | describe\\.skip                                                                                                                                                                      | it\\.skip" tests/e2e`                                                                                       | Revert test edit.                                                                               | None              |
| CCN-17 | Manual service verification follow-through.                                                    | `data/services.json`, evidence/provenance docs                                                                                    | High   | Facts change only after manual evidence is recorded; data/search validation passes.                                                                              | `npm run check-staleness`; `npm run validate-data`; `npm run audit:data`; `npm run search:qa`                                                      | Revert data/evidence changes lacking proof.                                                                                                                                          | Not safe unattended; requires manual evidence and explicit approval.                                        |
| CCN-18 | Gate 0 C1/D4 closure.                                                                          | `docs/implementation/v22-0-*`, `docs/planning/v22-0-approval-checklist.md`                                                        | High   | User-supplied legal/partner evidence exists and `npm run check:v22-gate0` passes.                                                                                | `npm run check:v22-evidence`; `npm run check:v22-threat-model`; `npm run check:v22-gate0`                                                          | Revert tracker/checklist edits if evidence incomplete.                                                                                                                               | Not safe unattended; required evidence is user-owned and missing.                                           |
| CCN-19 | Authenticated dashboard/admin visual QA.                                                       | `/dashboard/**`, `/admin/**`, Playwright notes/artifacts                                                                          | Medium | Signed-in owner/admin/partner session exists; desktop/mobile surfaces reviewed.                                                                                  | Targeted Playwright/manual QA with configured Supabase                                                                                             | Revert QA notes/artifacts.                                                                                                                                                           | Not safe here; credentials/session unavailable.                                                             |
| CCN-20 | Major dependency upgrades or framework migrations.                                             | `package.json`, lockfile, configs, broad source/tests                                                                             | High   | Migration guide reviewed; full CI and targeted browser checks pass.                                                                                              | Full CI, build, audit, targeted browser checks                                                                                                     | Revert dependency/lockfile changes.                                                                                                                                                  | Not safe overnight; broad breaking-change risk.                                                             |

## Safe Overnight Work Queue

Every queued item is intended to be reviewable, reversible, and testable without credentials, production access,
deployment, destructive operations, migrations, large dependency changes, broad rewrites, or ambiguous product decisions.

Do not start queue work until the existing uncommitted diffs in `docs/planning/roadmap.md` and
`docs/workflows/french-translation-workflow.md` have been acknowledged or left untouched.

### A. Core Queue

1. `CCN-01`
2. `CCN-02`
3. `CCN-03`
4. `CCN-04`
5. `CCN-05`
6. `CCN-10`
7. `CCN-11`
8. `CCN-12`
9. `CCN-13`
10. `CCN-07`
11. `CCN-08`
12. `CCN-09`

### B. Extension Queue

13. `CCN-16`
14. `CCN-14`
15. `CCN-15`, only if it remains strictly read-only after schema inspection.
16. `CCN-06`, only after the current user-owned diffs are reviewed.

## Do Not Do Overnight

- Do not modify curated service data, service facts, contact details, verification metadata, or translations without
  explicit approval and recorded evidence.
- Do not close Gate 0, change C1/D4 status, or mark blockers complete without user-provided evidence.
- Do not run production migrations, SQL patches, backfills, live schema changes, deploys, or shared-host commands.
- Do not read `.env.local`, private plaintext notes, private operations inventory, credentials, webhook URLs, or secret values.
- Do not add tracking, search-query logging, or anything that changes public privacy posture.
- Do not change RBAC, RLS, database schema, authorization risk levels, or environment variables.
- Do not add major dependencies or perform Next/React/WebLLM/transformers major upgrades.
- Do not weaken, delete, skip, or bypass tests/checks.
- Do not run credential-backed geocoding, phone validation, production Supabase, or load-test workflows.
- Do not do broad UI redesigns, speculative product features, launch/beta work, or 211 breadth expansion.
- Do not touch shared runtime/release/ingress/environment-file/production instructions without first inspecting the
  private/shared operations source of truth.
- Do not overwrite current uncommitted changes in `docs/planning/roadmap.md` or
  `docs/workflows/french-translation-workflow.md`.

## Final Completion Checklist

### Status And Diff Review

```bash
git status --short --branch
git diff --stat
git diff --check
git diff
```

Confirm every changed file maps to a queued item, no generated/private/secret/vendor/build files are included, no
curated service data changed without approval, symlinks still point to `AGENTS.md`, and user-owned diffs were preserved.

### Secret And Privacy Check

Run on the diff only:

```bash
git diff -- . ':!package-lock.json' | rg -n "API_KEY|SECRET|TOKEN|PASSWORD|PRIVATE KEY|BEGIN RSA|SUPABASE_SECRET_KEY|WEBHOOK|SLACK|AXIOM"
```

Expected result: no secret values. If matches are only documented variable names, record that explicitly.

### Targeted Validation

```bash
npm run format:check
npm run check:refs
npm test -- --run tests/unit/documentation-hygiene.test.ts
npm test -- --run tests/unit/runtime-security-headers.test.ts
npm test -- --run tests/setup/verify-mocks.test.ts
npm run validate:security-headers
npm run search:qa
```

If runtime header behavior changed:

```bash
npm run validate:security-headers:runtime
SECURITY_HEADERS_BASE_URL=http://127.0.0.1:3000 npm run validate:security-headers:runtime
```

The first command should fail clearly if no app is running; the second requires a running local app.

### Full Local Validation

```bash
npm run lint
npm run type-check
npm run validate-data
npm run i18n-audit
npm audit --audit-level=high
npm test -- --run
```

Run if time allows and generated outputs can be reviewed:

```bash
npm run ci:check
```

Notes:

- `npm run ci:check` may auto-skip DB tests if Docker or `psql` is unavailable; record the exact message.
- `npm run build` is inside `ci:check` and triggers `postbuild` embedding generation. Review any
  `data/embeddings.json` diff carefully, especially if `data/services.json` did not change.
- Do not enable local Playwright or load tests unless the future run explicitly needs them and prerequisites exist.

### Regression And Dead-Code Review

```bash
rg -n "Next.js 15|dependency-review\\.yml|895\\+|--no-verify|convert-hours-to-structured|assign-access-scripts" .agent docs README.md CONTRIBUTING.md tests scripts
rg -n "console\\.(log|debug|info|warn|error)" app components hooks lib
```

Remaining matches must be historical, archived, or intentionally allowed.

### Final Handoff Inventory

Record completed item IDs, files changed, commands run, pass/fail results, commands not run with blockers, remaining
risks, and final `git status --short --branch`.
