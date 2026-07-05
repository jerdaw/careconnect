# Maintenance Audit

## Audit Metadata

- Audit date: 2026-07-05
- Target repository root: current Git repository root. Exact local filesystem path is intentionally omitted from this public report.
- Target git commit at start of v5 pass: `5df397f`
- Branch/status at start of v5 pass: `main...origin/main`, with an existing unstaged maintenance diff and no staged files.
- Repo-health prompt pack: user-supplied local prompt pack with an entrypoint file and ordered goal files. The machine-specific source path is intentionally omitted from public docs.
- Report location: `docs/maintenance-audit.md`, the repo's existing documentation tree.

## Instructions Read

Prompt-pack instructions read from the resolved v5 root:

- entrypoint and shared safety contract
- deep-evidence and coverage gates
- single-goal sequential repo-health suite
- general code quality, docs, and maintenance
- test coverage and regression confidence
- security, privacy, and secrets hygiene
- CI, automation, and developer workflow
- dependency and package hygiene
- documentation and onboarding
- architecture and maintainability
- performance and scalability
- database, data, and migration health
- release readiness
- public repo presentation

Repo-local instructions and conventions considered:

- `AGENTS.md`: privacy-first, no fabricated service data, accessibility-first, verify before modifying, keep shared runtime/live operations details in private/shared operations material.
- `README.md`: Next.js 16, Node 22+, npm workflows, pilot/non-official status, public/private documentation boundary.
- `CONTRIBUTING.md`: contributor workflow, test expectations, privacy/data curation requirements.
- `docs/architecture.md`: local/server search, Supabase public view boundary, WebLLM privacy model, RLS, observability, pilot endpoints.
- `docs/development/testing-guidelines.md`: lint/type-check/build/targeted Vitest as default local verification; Playwright and browser a11y are intentional/manual lanes unless browser-only behavior is under investigation.
- `docs/governance/documentation-guidelines.md`: canonical docs locations, public-safe docs boundary, MkDocs nav expectations, and roadmap/archive workflow.
- `docs/development/roadmap-process.md`: active roadmap, implementation-plan, and archive rules.
- `.github/workflows/ci.yml` and `scripts/validate-ci.sh`: current CI-equivalent command set and local DB/browser skip behavior.

## Repo Profile

CareConnect is a public, privacy-first, health-adjacent social-services search application for Kingston, Ontario. It is a Next.js 16 App Router / TypeScript strict application using Tailwind CSS v4, Radix UI, Supabase/PostgreSQL with pgvector, WebLLM/on-device AI, local JSON fallback data, Vitest, Playwright, k6, MkDocs, and GitHub Actions.

Risk level is elevated. Search privacy, service data integrity, crisis/resource routing, authentication/authorization, public documentation boundaries, and accessibility are safety-sensitive for vulnerable users. This pass therefore prioritized conservative correctness, privacy, docs/config accuracy, and verification over broad cleanup or speculative architecture work.

## Reviewable Inventory And Coverage Tier

Inventory commands:

- `git rev-parse --show-toplevel`
- `git status --short --branch`
- `git ls-files`
- tracked file classification via a Node script over `git ls-files`
- `git ls-files -z | xargs -0 wc -l | tail -n 1`

Tracked inventory at review time:

| Group                                    | Count |
| ---------------------------------------- | ----: |
| `app/` routes and API surfaces           |    80 |
| UI/components/hooks/i18n/messages/styles |   133 |
| `lib/`, `types/`, `utils/`               |   124 |
| tests and fixtures                       |   262 |
| docs/public docs/root docs               |   362 |
| scripts/tooling/Husky/agent workflows    |    94 |
| GitHub workflows/templates               |    20 |
| Supabase config/migrations/test support  |    61 |
| curated data and generated embeddings    |    81 |
| assets/public static files               |    35 |
| root config/metadata                     |    27 |
| other tracked files                      |     5 |
| total tracked files                      |  1284 |

Tracked line-count probe reported `358558 total` lines. This is a large repo by the v5 coverage gates, so the coverage tier is **large/risk-based**. Manual review focused on repo instructions, public docs, package scripts, CI, env/config, API/search/security boundaries, Supabase/data/migration surfaces, high-value tests, and the current maintenance diff. Generated/dependency/cache/build-output trees were excluded from manual review: `node_modules/`, `.git/`, `.next/`, `coverage/`, `tsconfig.tsbuildinfo`, and external prompt-pack files. Lockfiles were checked for presence/change status, not line-by-line review.

## Baseline And Current Worktree

Initial v5 `git status --short --branch` showed the previous maintenance diff already present:

- modified: `.env.example`, `README.md`, `app/api/v1/search/services/route.ts`, `components/services/ServiceCard.tsx`, `docs/index.md`, `lib/api-utils.ts`, `lib/search/search-mode.ts`, `mkdocs.yml`, `scripts/validate-env-config.ts`, and related tests
- untracked: `docs/maintenance-audit.md`, `tests/scripts/validate-env-config.test.ts`

No staged files, commits, pushes, deployments, production migrations, production data writes, service-data edits, or prompt-pack edits were made.

## Pass Sequence

The suite order from `12-single-goal-sequential-repo-health-suite.md` was followed with no reordering:

1. General code quality, docs, maintenance
2. Test coverage and regression confidence
3. Security, privacy, secrets hygiene
4. CI, automation, developer workflow
5. Dependency and package hygiene
6. Documentation and onboarding
7. Architecture and maintainability
8. Performance and scalability
9. Database, data, migration health
10. Release readiness
11. Public repo presentation

## Pass Completion Table

| Pass                             | Status                        | Evidence summary                                                                                                                                                                    |
| -------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01 general code/docs/maintenance | Fixed                         | Reviewed search mode, API utilities, search route, service card, env validator, README/docs, MkDocs nav, scripts/config. Applied local fixes only.                                  |
| 04 test coverage/regression      | Fixed                         | Added/updated Vitest coverage for malformed JSON, generic error redaction, invalid search mode fallback, env parser/defaults, and MkDocs nav targets.                               |
| 03 security/privacy/secrets      | Fixed + documented limits     | Redacted generic 500s, preserved local search fallback for invalid config, handled JSON parse errors as 400, documented optional envs. Filename-only tracked secret scan performed. |
| 05 CI/workflow                   | Fixed + documented            | Reviewed npm scripts, CI workflow, `scripts/validate-ci.sh`, Husky, Dockerfile. Aligned docs/env validator; did not add process.                                                    |
| 06 dependency/package hygiene    | No package changes            | `npm audit --audit-level=high` passed. `npm outdated --long` found broad upgrade backlog; upgrades deferred to focused owner-reviewed branch.                                       |
| 07 documentation/onboarding      | Fixed                         | README/docs index env notes updated; MkDocs nav target drift fixed; docs build remains environment-blocked by missing MkDocs.                                                       |
| 02 architecture/maintainability  | Fixed + documented            | Kept changes within existing modules; documented architecture map; no broad restructuring.                                                                                          |
| 09 performance/scalability       | Low-risk cleanup + documented | Avoided repeated hook lookup in `ServiceCard`; documented that broader search/db scaling needs focused benchmarking/data-growth decisions.                                          |
| 10 database/data/migration       | No data/schema changes        | Reviewed Supabase config, migrations, data validation, RLS docs/tests. No production DB contact, migrations, seed, or service-data edits.                                           |
| 08 release readiness             | Documented                    | Verified release-adjacent local checks where feasible; production release details remain private/shared operations material.                                                        |
| 11 public repo presentation      | Fixed + documented            | Public docs/config examples made more accurate without adding public claims, badges, screenshots, or process.                                                                       |

## Command And Search Ledger

| Command/probe                                                                                                    | Purpose                                                                                                             | Result                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `pwd`                                                                                                            | Confirm target working directory.                                                                                   | Confirmed current repository root; exact local path omitted.                                                                             |
| `git status --short --branch`                                                                                    | Preserve current user/worktree changes before editing.                                                              | Dirty worktree on `main...origin/main`; no staged files.                                                                                 |
| `find <prompt-pack> -maxdepth 3 -type f`                                                                         | Resolve v5 prompt-pack files.                                                                                       | Found one nested valid root under the user-supplied directory.                                                                           |
| `sed -n ... RUN_THIS_FIRST.md` and pass files                                                                    | Read v5 entrypoint, safety, evidence gates, suite, and pass prompts.                                                | Completed.                                                                                                                               |
| `git ls-files` and classification script                                                                         | Build reviewable inventory.                                                                                         | 1284 tracked files; large/risk-based tier.                                                                                               |
| `git ls-files -z \| xargs -0 wc -l \| tail -n 1`                                                                 | Estimate reviewable line scale.                                                                                     | `358558 total`.                                                                                                                          |
| `npm test -- --run tests/scripts/validate-env-config.test.ts` after adding quoted-comment test                   | TDD red for dotenv parser edge.                                                                                     | Failed as expected: received `"value"` instead of `value`.                                                                               |
| `npm test -- --run tests/integration/api-utils.test.ts` after adding SyntaxError test                            | TDD red for shared API invalid JSON classification.                                                                 | Failed as expected: returned 500 instead of 400.                                                                                         |
| `npm test -- --run tests/scripts/validate-env-config.test.ts` after adding Upstash optional vars                 | TDD red for env optional drift.                                                                                     | Failed as expected: Upstash vars were reported missing.                                                                                  |
| `npm test -- --run tests/scripts/validate-env-config.test.ts tests/integration/api-utils.test.ts`                | Focused regression verification for new fixes.                                                                      | Passed, 2 files / 6 tests.                                                                                                               |
| `rg` broad security/code probes over `app`, `components`, `hooks`, `lib`, `scripts`, `tests`, `supabase`, `docs` | Find TODOs, console usage, request JSON parsing, Supabase calls, env refs, redirects, storage, unsafe HTML markers. | Reviewed output; clear autonomous fixes limited to JSON/error/env/docs issues.                                                           |
| `rg "request.json"` in API routes                                                                                | Check malformed JSON handling surfaces.                                                                             | Many routes rely on `handleApiError`; shared `SyntaxError` handling added.                                                               |
| filename-only `git grep -Il` for secret/token/private-key markers                                                | Secrets hygiene without printing values.                                                                            | Returned files that mention config/secrets docs/code, not raw values. No actual secret value was printed in this report.                 |
| `git grep -n "NEXT_PUBLIC_...(SECRET\|KEY\|TOKEN...)"`                                                           | Check public env exposure.                                                                                          | Public Supabase publishable key and VAPID public key references; no server secret promoted to `NEXT_PUBLIC_`.                            |
| env coverage Node script comparing `process.env` refs to `.env.example`                                          | Find runtime env documentation drift.                                                                               | After fixes: `missingRuntimeEnvDocumentation: []` when CI/platform/test-only variables are excluded.                                     |
| `command -v docker; docker --version; command -v psql; command -v k6; python3 -m mkdocs --version`               | Check local tool availability.                                                                                      | Docker present; `psql` absent from default PATH but available from a local user-bin directory; `k6` absent; MkDocs Python module absent. |
| `npm audit --audit-level=high`                                                                                   | Dependency vulnerability audit.                                                                                     | Passed: `found 0 vulnerabilities`.                                                                                                       |
| `npm outdated --long`                                                                                            | Dependency hygiene inventory.                                                                                       | Exited 1 because updates are available; no package changes applied.                                                                      |
| Exhaustive security-scan preflight helper                                                                        | Determine whether an exhaustive delegated security scan can be claimed.                                             | Incomplete: delegated worker capability failed/unknown under current tool policy; repo-health security pass only.                        |

Final verification commands are recorded in the final verification section after the pass-specific sections.

## Changes Applied

- `lib/search/search-mode.ts`: invalid `NEXT_PUBLIC_SEARCH_MODE` values now fall back to `local`; only exact `server` selects server mode.
- `app/api/v1/search/services/route.ts`: malformed search JSON now returns `400 Invalid JSON` before schema validation or DB work.
- `lib/api-utils.ts`: generic `Error` instances no longer expose internal messages in 500 responses; `SyntaxError` now maps to `400 Invalid JSON`.
- `components/services/ServiceCard.tsx`: `useUserContext()` is called once at the top level and reused for eligibility rendering.
- `scripts/validate-env-config.ts`: exported parser/analyzer helpers for tests, fixed direct-run import behavior, handled inline comments and quoted values, classified optional/default vars including Upstash rate limiting and manual 211 sync.
- `.env.example`: added safe placeholders for optional Google AI enrichment, Upstash Redis rate limiting, and quarantined 211 sync variables; corrected health version config to `APP_VERSION`.
- `README.md` and `docs/index.md`: documented optional config, Upstash fallback behavior, manual 211 gating, and `validate:env` placeholder behavior.
- `mkdocs.yml`: fixed stale navigation targets for components and planning docs.
- Tests updated/added for the behavior above.
- This report was updated from the previous v4 report to the v5 deep-evidence report.

## Tests Added Or Updated

- `tests/scripts/validate-env-config.test.ts`: dotenv inline comments, quoted comments, optional/default vars, Upstash env optional classification.
- `tests/lib/search/search-mode.test.ts`: invalid search mode falls back to local.
- `tests/api/v1/search-api.test.ts`: malformed JSON returns 400 and does not hit the DB query mock.
- `tests/integration/api-utils.test.ts`: generic 500 error redaction and `SyntaxError` to invalid JSON behavior.
- `tests/unit/documentation-hygiene.test.ts`: MkDocs nav targets resolve under `docs/`.

## Candidate Findings Ledger

| Finding                                                                                                             | Status                   | Change gate decision                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid `NEXT_PUBLIC_SEARCH_MODE` values could select neither documented mode and bypass the privacy-first default. | Fixed                    | Evidence-backed, tiny local change, tested, aligns with README default.                                                                                                                |
| Malformed search JSON reached generic error behavior instead of a clean 400.                                        | Fixed                    | Public API correctness issue, no API contract break, regression tested.                                                                                                                |
| API generic 500 responses reflected internal exception messages.                                                    | Fixed                    | Privacy/security improvement, preserves typed auth/not-found/validation errors, tested.                                                                                                |
| Shared API routes relying on `handleApiError` returned 500 for JSON parse `SyntaxError`.                            | Fixed                    | Shared local behavior, tested red/green, avoids touching every route.                                                                                                                  |
| `ServiceCard` called `useUserContext()` inline during render in addition to top-level hooks.                        | Fixed                    | Maintains hook ordering and avoids repeated context lookup, covered by existing component tests.                                                                                       |
| Env validator parsed quoted values with trailing comments incorrectly.                                              | Fixed                    | Reproduced with failing test; parser updated narrowly.                                                                                                                                 |
| Env validator treated optional/default vars as required.                                                            | Fixed                    | Aligned with `.env.example`, README, runtime defaults; tested.                                                                                                                         |
| Upstash rate-limit env vars were used by code but absent from `.env.example`/validator/docs.                        | Fixed                    | Existing runtime config only; documented safe optional placeholders and fallback.                                                                                                      |
| MkDocs nav referenced stale paths.                                                                                  | Fixed                    | `mkdocs.yml` and docs hygiene test updated.                                                                                                                                            |
| `npm outdated --long` reports many updates.                                                                         | Deferred                 | Broad dependency upgrades include major ecosystem changes and require a focused branch plus full verification.                                                                         |
| Exhaustive delegated security scan.                                                                                 | Not claimed              | Preflight was incomplete because delegated worker capability was unavailable/unknown under current delegation rules; this report covers the repo-health security pass only.            |
| DB integration lane.                                                                                                | Passed after PATH repair | Initial wrapper failed because `psql` was not on the default PATH; rerun with the local user-bin directory on PATH passed 4 DB test files / 11 tests against the local Supabase stack. |
| MkDocs build.                                                                                                       | Blocked locally          | `python3 -m mkdocs --version` failed because MkDocs is not installed in the current Python environment.                                                                                |
| k6 load tests.                                                                                                      | Blocked locally          | `k6` is not on PATH.                                                                                                                                                                   |
| Playwright/a11y browser checks.                                                                                     | Deferred                 | Repo testing guidance leaves Playwright to CI/manual dispatch unless debugging browser-only behavior.                                                                                  |
| CSP warnings for inline script/style and WebLLM `unsafe-eval`.                                                      | Deferred                 | Existing compatibility tradeoff; hardening requires focused design, not a drive-by change.                                                                                             |

## Per-Pass Evidence

### 01 General Code Quality, Docs, Maintenance

Scope: applicable across runtime code, docs, config, scripts, tests, and CI. Service data itself was out of scope without explicit curation approval.

Surfaces inspected: `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `docs/architecture.md`, `package.json`, `.env.example`, `mkdocs.yml`, `scripts/validate-env-config.ts`, `lib/search/search-mode.ts`, `app/api/v1/search/services/route.ts`, `lib/api-utils.ts`, `components/services/ServiceCard.tsx`, `.github/workflows/ci.yml`, `scripts/validate-ci.sh`.

Probes/searches: inventory commands, package script extraction, broad `rg` over code/docs/tests for TODO/debug/env/API patterns, focused `request.json` route search, env coverage script.

Candidates: invalid search mode, malformed JSON, error-message leakage, env validator drift, stale MkDocs nav, repeated hook call. All were fixed because they were local, repo-native, testable, and reviewable. Broad API body helper extraction was deferred to avoid expanding scope beyond this coherent diff.

Verification: focused Vitest tests passed. Full final verification is recorded below.

### 04 Test Coverage And Regression Confidence

Scope: applicable. Existing repo-native strategy uses Vitest for unit/integration/API/component tests, with Playwright and k6 as separate heavier lanes.

Surfaces inspected: `tests/api/v1/search-api.test.ts`, `tests/integration/api-utils.test.ts`, `tests/lib/search/search-mode.test.ts`, `tests/unit/documentation-hygiene.test.ts`, new `tests/scripts/validate-env-config.test.ts`, `vitest.config.mts`, `docs/development/testing-guidelines.md`, `package.json` test scripts.

Probes/searches: targeted failing-test runs for parser, optional env vars, and `handleApiError` SyntaxError behavior; focused green runs after fixes.

Candidates: add regression tests for every behavior-changing fix; avoid Playwright/browser tests because no browser-only behavior changed. Tests were added/updated using existing Vitest patterns.

Verification: red/green evidence recorded in the command ledger; focused tests passed after implementation.

### 03 Security, Privacy, Secrets Hygiene

Scope: applicable because this repo has auth/RBAC, Supabase, public APIs, local-first search, optional telemetry, secrets, and public docs.

Surfaces inspected: `lib/api-utils.ts`, `app/api/v1/search/services/route.ts`, `lib/search/search-mode.ts`, `lib/rate-limit.ts`, `.env.example`, `lib/env.ts`, `next.config.ts`, `proxy.ts`, Supabase migrations/config, GitHub workflows, README/docs public operations boundary.

Probes/searches: filename-only tracked secret marker search; `NEXT_PUBLIC_` secret-like env search; broad searches for `request.json`, env refs, redirects, unsafe HTML markers, Supabase data calls, storage usage; exhaustive security-scan preflight.

Candidates: generic API error leakage fixed; malformed JSON classification fixed; invalid search mode default fixed; Upstash secret placeholders documented; actual secret rotation not attempted. No actual secret values were printed in this report.

Security-scan note: the exhaustive delegated scan preflight returned incomplete because delegated worker availability was false/unknown under current explicit-delegation policy. Therefore this report does not claim an exhaustive delegated security scan, only the repo-health security/privacy pass.

Verification: focused tests, `npm audit --audit-level=high`, and final security-header validation below.

### 05 CI, Automation, Developer Workflow

Scope: applicable. The repo has npm scripts, Husky hooks, GitHub Actions, local CI helper script, Dockerfile, docs deploy, release, health/staleness/reminder workflows.

Surfaces inspected: `package.json`, `.github/workflows/ci.yml`, `.github/workflows/deploy-docs.yml`, `.github/workflows/release.yml`, `.github/workflows/production-smoke.yml`, `scripts/validate-ci.sh`, `.husky/pre-commit`, `.husky/pre-push`, `Dockerfile`, `.npmrc`, `.pre-commit-config.yaml`.

Probes/searches: script extraction from `package.json`, CI workflow read, local tool availability (`docker`, `psql`, `k6`, `mkdocs`), env coverage script.

Candidates: align docs/env validator with existing scripts and runtime config; do not add new CI or hooks. DB/Playwright/k6/docs blockers documented instead of forcing installs or broad process changes.

Verification: final local command set below mirrors the strongest feasible CI-equivalent checks without production/deploy actions.

### 06 Dependency And Package Hygiene

Scope: applicable. The repo has `package.json`, `package-lock.json`, `.npmrc`, Node engine metadata, Docker/CI Node versions, and many runtime/dev packages.

Surfaces inspected: `package.json`, `package-lock.json` presence, `.npmrc`, `Dockerfile`, `.github/workflows/ci.yml`, `requirements.txt`, `mkdocs.yml`, npm scripts, env-related dependency usage.

Probes/searches: `npm audit --audit-level=high`, `npm outdated --long`, package metadata extraction.

Candidates: no lockfile/package upgrades applied. The outdated list includes Next/React/Radix/Supabase/Vitest/Playwright/Tailwind/etc. updates, many with major-version or cross-tool implications. This fails the repo-native change gate for unattended broad upgrades.

Dependency/config change table:

| Package/config                   | Change  | Reason                                                         | Risk            | Verification                                                    |
| -------------------------------- | ------- | -------------------------------------------------------------- | --------------- | --------------------------------------------------------------- |
| Package versions                 | None    | Audit clean; updates are broad owner-reviewed work.            | None introduced | `npm audit --audit-level=high`, `npm outdated --long` reviewed. |
| `.env.example`                   | Updated | Align safe placeholders with existing code-supported env vars. | Low             | Env validator tests and final checks.                           |
| `scripts/validate-env-config.ts` | Updated | Make validation accurate/testable for optional/default vars.   | Low             | Red/green tests, type-check.                                    |

### 07 Documentation And Onboarding

Scope: applicable. The repo uses README plus a MkDocs documentation tree.

Surfaces inspected: `README.md`, `docs/index.md`, `docs/architecture.md`, `docs/README.md`, `docs/development/testing-guidelines.md`, `docs/development/security-headers.md`, `docs/testing/BASELINE-WALKTHROUGH.md`, `docs/runbooks/pwa-testing.md`, `mkdocs.yml`, docs deploy workflow.

Probes/searches: docs command cross-check against `package.json`; MkDocs nav target test; `check:refs`; env usage comparison.

Candidates: update optional config docs and `mkdocs.yml`; avoid adding a new docs system or public deployment details. `mkdocs build` remains blocked locally by missing Python docs dependencies.

Verification: docs hygiene test and final `check:refs`.

### 02 Architecture And Maintainability

Scope: applicable, but only local maintainability fixes were appropriate.

Architecture map as inspected:

- `app/`: localized pages, app routes, API routes, metadata, proxy-visible surfaces.
- `components/` and `hooks/`: UI, accessibility, service cards, search UI, dashboards, offline/push, observability views.
- `lib/search/`: local/server shared search, scoring, crisis, freshness, embeddings, match reasons, data loading.
- `lib/ai/`: WebLLM/browser AI, vector cache, query expansion, worker support.
- `lib/auth/`, `lib/rbac.ts`, `lib/actions/`: Supabase auth, RBAC, partner/admin actions.
- `lib/resilience/`, `lib/observability/`, `lib/performance/`: circuit breaker, SLOs, alerts, metrics, health.
- `lib/offline/`: offline snapshots, IndexedDB/local storage, sync.
- `supabase/`: migrations/config/test support.
- `data/`: manually curated services and generated embeddings.
- `tests/`: Vitest, Playwright, DB, load, fixtures.

Probes/searches: import/API/env searches, current diff review, architecture docs review.

Candidates: local helper extraction for env parsing and hook cleanup accepted; broad API JSON helper refactor, service-layer restructuring, and search/data architecture changes deferred. The existing architecture is mature and domain-specific; no template architecture was imposed.

Verification: type-check/tests/final build.

### 09 Performance And Scalability

Scope: applicable in hot paths such as search, API request handling, rate limiting, offline export, build embeddings, and result rendering.

Surfaces inspected: `app/api/v1/search/services/route.ts`, `lib/search/search-mode.ts`, `lib/search/server-scoring.ts`, `lib/search/data.ts`, `lib/rate-limit.ts`, `components/services/ServiceCard.tsx`, `scripts/generate-embeddings.ts`, `tests/load/*`, load testing docs.

Probes/searches: searches for unbounded queries/loops and rate-limit docs; load-test tooling availability; static review of server search's in-memory scoring design.

Candidates: `ServiceCard` repeated context lookup fixed. Server search still intentionally fetches the filtered candidate set then scores in memory because the curated dataset is 196 services and local/server ranking parity relies on TypeScript scoring paths. Changing this requires focused benchmark and data-growth decisions.

Verification: component test, full test/build final set. k6 blocked locally because `k6` is absent.

### 10 Database, Data, Migration Health

Scope: applicable. Data stack is Supabase/PostgreSQL/pgvector plus local JSON fallback and manually curated service data.

Surfaces inspected: `supabase/config.toml`, active and archived migrations under `supabase/migrations/`, `supabase/test-support/bootstrap.sql`, `scripts/run-db-tests.sh`, `scripts/lib/local-supabase.sh`, `lib/search/data.ts`, `types/supabase.ts`, `lib/supabase.ts`, `utils/supabase/*`, data validation scripts, RLS/security docs and tests.

Probes/searches: migration/config read, Supabase tests/docs review, `validate-data`, `check:embeddings`, local tool availability for Docker/psql.

Candidates: no migrations, constraints, indexes, RLS policies, seeds, or service records changed. Production or remote database access was not attempted. Local DB tests passed after adding the local `psql` binary directory to `PATH`.

Data safety notes: no service data was fabricated, generated, modified, imported, or backfilled. `npm run build` may regenerate embeddings, but the final diff check should confirm whether `data/embeddings.json` changed.

### 08 Release Readiness

Scope: applicable for app/container deployment and public documentation. This repo is private package metadata (`private: true`), not an npm package release target.

Surfaces inspected: `package.json`, `Dockerfile`, `.dockerignore`, `vercel.json`, `.vercelignore`, `.github/workflows/release.yml`, `.github/workflows/production-smoke.yml`, `.github/workflows/deploy-docs.yml`, `CHANGELOG.md`, `LICENSE`, `SECURITY.md`, README release notes, private/shared ops boundary docs.

Probes/searches: build/test/lint/type/data/doc-reference checks, dependency audit, docs build availability, DB/browser/load blocker checks.

Checklist:

| Area                                             | Status            | Notes                                                                            |
| ------------------------------------------------ | ----------------- | -------------------------------------------------------------------------------- |
| Formatting/lint/type/data/search/i18n/ref checks | Passed            | Final commands listed below passed.                                              |
| Unit/coverage                                    | Passed            | Full coverage suite passed.                                                      |
| Build                                            | Passed            | Build passed and postbuild generated embeddings; no embeddings diff remained.    |
| DB lane                                          | Passed            | `npm run test:db` passed with the local user-bin directory on `PATH` for `psql`. |
| Docs build                                       | Blocked locally   | MkDocs not installed in current Python env.                                      |
| Playwright/a11y                                  | Deferred          | Repo guidance leaves browser checks for CI/manual windows.                       |
| Production release                               | Owner/private ops | Public repo intentionally excludes live release roots and host instructions.     |

No tags, version bumps, releases, deploys, or artifacts were published.

### 11 Public Repo Presentation

Scope: applicable because the repository has public-facing README, docs, license, security policy, GitHub templates, and public project status language.

Surfaces inspected: `README.md`, `docs/index.md`, `docs/architecture.md`, `LICENSE`, `SECURITY.md`, `CHANGELOG.md`, `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md`, public/private documentation boundary ADR and docs.

Probes/searches: docs/config command cross-check, env examples, public secret marker search, claims cross-check against package scripts and architecture docs.

Audience/status inferred: public-interest pilot/prototype for external review, not an official government, 211, or clinical service. Changes kept claims factual and did not add badges, screenshots, support promises, public deployment details, contributor identities, or marketing language.

Verification: docs/reference checks and final formatting.

## Security And Privacy Notes

- No `.env.local` values are included in this report.
- No secret rotation, cloud changes, or production operations were attempted.
- No raw query logging, tracking, or analytics expansion was added.
- Generic API 500 responses now redact internal exception messages.
- JSON parse errors now return client-error responses instead of generic 500s in shared API handling.
- Invalid search mode config preserves the privacy-first local default.
- Optional Upstash Redis config is documented as rate-limit infrastructure; leaving it unset preserves the existing in-memory fallback.
- Existing CSP warnings are not treated as newly introduced failures; WebLLM/Next.js compatibility hardening requires a separate focused pass.

## Documentation Updated

- `.env.example`
- `README.md`
- `docs/README.md`
- `docs/index.md`
- `mkdocs.yml`
- `docs/maintenance-audit.md`
- `docs/planning/README.md`
- `docs/planning/roadmap.md`

## Closeout Maintenance Pass

Additional closeout inspection on 2026-07-05 reviewed `AGENTS.md`, `docs/governance/documentation-guidelines.md`, `docs/development/testing-guidelines.md`, `docs/development/roadmap-process.md`, `docs/planning/roadmap.md`, `docs/planning/README.md`, `.gitignore`, `mkdocs.yml`, symlink state, git status, remote branches, open PR state, and recent GitHub Actions runs.

Closeout findings:

- `CLAUDE.md` and `GEMINI.md` are relative symlinks to `AGENTS.md`.
- `git fetch --all --prune` left `main` aligned with `origin/main`; remote heads were limited to `main` and `gh-pages`.
- Native Linux `gh` is not installed in this shell, so open PR and Actions status were inspected with the installed Windows GitHub CLI executable.
- Open PR count was `0`.
- Recent `main` workflow runs were successful, including `Production Smoke` on 2026-07-05 and `CI`, `Deploy Documentation`, and `Platform Ops Integration` on 2026-07-04.
- One `gh-pages` Pages deployment failed on 2026-07-04, but a later `gh-pages` Pages deployment succeeded on 2026-07-04.
- Ambient `node`/`npm` were not on `PATH`; fresh CI-equivalent verification uses the local Node 22/npm runtime at `/home/jer/.nvm/versions/node/v22.13.1/bin`, matching GitHub Actions and Docker configuration.
- `git clean -ndX` showed ignored local state that must not be removed (`.env.local`, `private/`, `node_modules/`) alongside generated build/test artifacts; broad ignored-file cleanup was intentionally not used.
- `.gitignore` already covers generated build/test artifacts such as `.next/`, `coverage/`, and `*.tsbuildinfo`; no ignore-rule change was needed.
- After final verification, generated `.next/`, `coverage/`, and `tsconfig.tsbuildinfo` outputs were removed; intentional local state was left untouched.
- Roadmap maintenance followed `docs/development/roadmap-process.md`: no active implementation plan existed to archive, so completed work was recorded as a maintenance checkpoint and remaining nonessential work stayed as follow-up recommendations.

## Final Verification

Strongest feasible local verification set for this diff:

| Check                                   | Result                                                                                                                                                                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                  | Passed; Prettier reported all matched files use configured style.                                                                                                                                                                      |
| `npm run lint`                          | Passed.                                                                                                                                                                                                                                |
| `npm run type-check`                    | Passed.                                                                                                                                                                                                                                |
| Focused Vitest regression command       | Passed; 6 files, 52 tests.                                                                                                                                                                                                             |
| `npm run validate-data`                 | Passed; 196 services passed, 0 failed, 0 warnings.                                                                                                                                                                                     |
| `npm run search:qa`                     | Passed; 18/18 curated scenarios.                                                                                                                                                                                                       |
| `npm run i18n-audit`                    | Passed; 1211 keys in each of 7 locales, no missing/extra keys.                                                                                                                                                                         |
| `npm run check:root`                    | Passed.                                                                                                                                                                                                                                |
| `npm run check:refs`                    | Passed across 150 files.                                                                                                                                                                                                               |
| `npm run check:v22-evidence`            | Passed.                                                                                                                                                                                                                                |
| `npm run check:v22-threat-model`        | Passed.                                                                                                                                                                                                                                |
| `npm run check:embeddings`              | Passed; 196 services, 196 embeddings, 384 dimensions.                                                                                                                                                                                  |
| `npm run validate:security-headers`     | Passed with 2 existing warnings: `unsafe-inline` and WebLLM-required `unsafe-eval`.                                                                                                                                                    |
| Redacted `npm run validate:env` wrapper | Exited 1 because `.env.local` contains 11 placeholder values; required vars were present and optional/default vars were no longer reported missing.                                                                                    |
| `npm audit --audit-level=high`          | Passed; `found 0 vulnerabilities`.                                                                                                                                                                                                     |
| `npm outdated --long`                   | Exited 1 because updates are available; no package changes applied.                                                                                                                                                                    |
| `npm run test:coverage`                 | Initial local Node 24 attempt failed in V8 coverage temp output; clean rerun under project/CI Node 22 passed with 208 files, 1662 tests passed, 24 skipped, and 74.14% statements / 78.85% branches / 84.26% functions / 74.14% lines. |
| `npm run build`                         | Passed inside `npm run ci:check`; Next.js 16.2.9 Turbopack build completed, 36/36 static pages generated, postbuild generated embeddings for 196 services.                                                                             |
| `npm run test:db`                       | Passed with the local user-bin directory on `PATH`; 4 DB test files passed, 11 tests passed against the local Supabase stack.                                                                                                          |
| `git diff --check`                      | Passed.                                                                                                                                                                                                                                |

Checks not run locally:

- `mkdocs build`: blocked because `python3 -m mkdocs --version` reports `No module named mkdocs`.
- `npm run test:load*`: blocked because `k6` is not on PATH.
- `npm run test:e2e` and `npm run test:a11y`: deferred per repo testing guidance unless debugging browser-only behavior; no browser-only behavior changed.

## Final Git Diff Summary

Final `git status --short --branch`:

```text
## main...origin/main
 M .env.example
 M README.md
 M app/api/v1/search/services/route.ts
 M components/services/ServiceCard.tsx
 M docs/README.md
 M docs/index.md
 M docs/planning/README.md
 M docs/planning/roadmap.md
 M lib/api-utils.ts
 M lib/search/search-mode.ts
 M mkdocs.yml
 M scripts/validate-env-config.ts
 M tests/api/v1/search-api.test.ts
 M tests/integration/api-utils.test.ts
 M tests/lib/search/search-mode.test.ts
 M tests/unit/documentation-hygiene.test.ts
?? docs/maintenance-audit.md
?? tests/scripts/validate-env-config.test.ts
```

Tracked diff stat:

```text
 .env.example                             | 11 ++++-
 README.md                                |  8 ++++
 app/api/v1/search/services/route.ts      |  8 +++-
 components/services/ServiceCard.tsx      |  3 +-
 docs/README.md                           |  4 +-
 docs/index.md                            |  8 ++++
 docs/planning/README.md                  |  9 +++-
 docs/planning/roadmap.md                 | 11 ++---
 lib/api-utils.ts                         |  8 ++--
 lib/search/search-mode.ts                |  2 +-
 mkdocs.yml                               |  5 ++-
 scripts/validate-env-config.ts           | 76 +++++++++++++++++++++++++-------
 tests/api/v1/search-api.test.ts          | 15 +++++++
 tests/integration/api-utils.test.ts      | 33 +++++++++++++-
 tests/lib/search/search-mode.test.ts     |  5 +++
 tests/unit/documentation-hygiene.test.ts | 19 ++++++++
 16 files changed, 188 insertions(+), 37 deletions(-)
```

New untracked files to review:

- `docs/maintenance-audit.md` (this report, 493 lines after final formatting)
- `tests/scripts/validate-env-config.test.ts` (37 lines after final formatting)

Generated files: `npm run build` regenerated embeddings during postbuild, but `data/embeddings.json` remained unchanged in `git diff --stat`.

## Remaining Recommendations

- Install Python docs dependencies from `requirements.txt` and run `mkdocs build`.
- Run Playwright/accessibility checks during an intentional browser validation window or via CI/manual dispatch.
- Review `npm outdated --long` through Dependabot or a focused dependency-upgrade branch with migration notes and full verification.
- Consider a focused API ergonomics pass to add a shared safe JSON parsing helper to routes with custom response shapes.
- Consider a focused CSP hardening pass for nonce/inline-script reduction while preserving WebLLM support.

## Risks, Assumptions, And Intentionally Unchanged Areas

- Introduced risk is low: changes are local, typed, test-covered, and preserve documented public APIs.
- `handleApiError` now treats `SyntaxError` as invalid JSON. This is intended for API JSON parse failures; unusual business-code `SyntaxError` exceptions would also return 400.
- `handleApiError` now intentionally redacts generic 500 messages. Clients should not depend on internal error text.
- `NEXT_PUBLIC_SEARCH_MODE` now treats invalid values as `local`, matching the documented privacy-first default.
- `validate:env` may still fail in local workspaces with placeholder values; that is a production-readiness signal, not a regression.
- Service data, embeddings source records, Supabase schema semantics, RLS policies, release process, production deployment instructions, dependency versions, and public posture decisions were intentionally left unchanged.
