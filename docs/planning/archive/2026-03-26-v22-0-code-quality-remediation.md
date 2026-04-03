# v22.0: Code Quality & Organization Remediation

**Status:** Completed (2026-03-26)
**Priority:** HIGH (P0–P1 items), MEDIUM (P2–P3 items)
**Estimated Effort:** ~12–16 hours total
**Dependencies:** None — all items are independent and can be done in any order
**Created:** 2026-03-25

Residual follow-through from this archive was completed in
[`2026-03-29-v20-0-repo-audit-remediation.md`](2026-03-29-v20-0-repo-audit-remediation.md).

---

## Executive Summary

A systematic audit of the CareConnect codebase identified 30+ findings across 12 areas. This document provides concrete, step-by-step remediation for each finding, grouped into 6 phases by priority and dependency order.

**Baselines (2026-03-25):**

- `npm run lint` ✅ clean
- `npm run type-check` ✅ clean
- `npm run check:root` ✅ clean
- `npm audit` — 15 vulnerabilities (3 moderate, 12 high)

---

## Phase 1: Security & Dependency Health (P0 — 1 hour)

**Goal:** Eliminate all known vulnerabilities and remove unused dependencies.

### Task 1.1: Fix npm Audit Vulnerabilities (30 min)

**Current state:** 15 vulnerabilities — `tar <=7.5.10` (via `supabase` CLI, path traversal) and `undici 7.0.0–7.23.0` (HTTP smuggling, WebSocket DoS).

**Steps:**

```bash
# 1. Fix what can be fixed non-breaking
npm audit fix

# 2. Verify remaining issues
npm audit

# 3. If tar remains, update the override in package.json
#    (tar is already overridden — bump the version)

# 4. If undici remains, force-update and test
npm audit fix --force
npm run type-check
npm test
```

**Verification:**

- [ ] `npm audit` reports 0 high/critical vulnerabilities
- [ ] `npm test` passes
- [ ] `npm run build` succeeds

---

### Task 1.2: Remove Unused Dependencies (30 min)

**Findings from audit:**

| Dependency                      | Source imports | Action                                             |
| ------------------------------- | -------------- | -------------------------------------------------- |
| `openai`                        | 0              | Remove                                             |
| `@capacitor/push-notifications` | 0              | Verify with `@capacitor/` ecosystem, likely remove |
| `react-onesignal`               | 1 file         | Review — may be transitioning to Capacitor push    |

**Steps:**

```bash
# 1. Verify openai is truly unused (check scripts too)
grep -r 'openai' scripts/ --include='*.ts' -l
grep -r 'openai' app/ lib/ components/ hooks/ --include='*.ts' --include='*.tsx' -l

# 2. If confirmed unused, remove
npm uninstall openai

# 3. Check @capacitor/push-notifications
grep -r 'push-notifications' app/ lib/ components/ hooks/ scripts/ --include='*.ts' --include='*.tsx' -l

# 4. If confirmed unused, remove
npm uninstall @capacitor/push-notifications

# 5. Verify
npm run type-check
npm test
```

**Verification:**

- [ ] Removed deps no longer in `package.json`
- [ ] `npm run type-check` passes
- [ ] `npm test` passes

---

## Phase 2: ESLint & TypeScript Strictness (P0 — 3–5 hours)

**Goal:** Tighten type safety in production code and enforce logger usage.

### Task 2.1: Narrow `no-explicit-any` Override (2–4 hours)

**Current state:** `eslint.config.mjs` disables `@typescript-eslint/no-explicit-any` for `lib/**`, `types/**`, `scripts/**`, and `tests/**`. The `lib/**` override is too broad — production code should be typed.

**Steps:**

1. **Edit `eslint.config.mjs`** — remove `lib/**` from the override:

```diff
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "tests/**",
      "scripts/**",
      "types/**",
-     "lib/**",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
```

2. **Run lint to find all new errors:**

```bash
npm run lint 2>&1 | grep 'no-explicit-any' | wc -l
```

3. **Fix each `any` in `lib/`** — prioritize by file:

| File                  | `any` count | Fix approach                 |
| --------------------- | ----------- | ---------------------------- |
| `lib/ai/engine.ts`    | ~5          | Type WebLLM API interfaces   |
| `lib/offline/sync.ts` | ~3          | Type sync response/error     |
| `lib/search/data.ts`  | ~3          | Type Supabase responses      |
| `lib/rate-limit.ts`   | ~3          | Type Upstash/Redis responses |
| `lib/rbac.ts`         | ~2          | Type permission objects      |
| Other `lib/` files    | ~13         | Incrementally type           |

4. **For genuinely untyped external APIs**, use `eslint-disable-next-line` with a justification comment:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- WebLLM ChatCompletionChunk lacks exported types
const chunk = event.data as any
```

**Verification:**

- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] No new `any` without a justification comment

---

### Task 2.2: Add `no-console` ESLint Rule (1 hour)

**Current state:** 45+ `console.*` calls across `lib/`, `components/`, `app/` — should use `lib/logger.ts`.

**Steps:**

1. **Add `no-console` rule to `eslint.config.mjs`:**

```javascript
{
  files: ["app/**", "components/**", "hooks/**", "lib/**"],
  rules: {
    "no-console": ["warn", { allow: [] }],
  },
},
// Override: allow console in scripts (they can't use server logger)
{
  files: ["scripts/**", "app/worker.ts", "app/global-error.tsx"],
  rules: {
    "no-console": "off",
  },
},
```

2. **Run lint to see all warnings:**

```bash
npm run lint 2>&1 | grep 'no-console' | wc -l
```

3. **Migrate each `console.*` call to `logger.*`:**

| Area                 | Files | Current                  | Migration                |
| -------------------- | ----- | ------------------------ | ------------------------ |
| `lib/ai/`            | 4     | `console.log/warn/error` | `logger.info/warn/error` |
| `lib/offline/`       | 2     | `console.log/error`      | `logger.info/error`      |
| `lib/search/`        | 2     | `console.warn`           | `logger.warn`            |
| `lib/notifications/` | 1     | `console.error`          | `logger.error`           |
| `lib/analytics/`     | 1     | `console.warn`           | `logger.warn`            |
| `lib/observability/` | 1     | `console.log`            | `logger.info`            |
| `components/ai/`     | 1     | `console.warn`           | `logger.warn`            |
| `app/` pages         | 2     | `console.error`          | `logger.error`           |

4. **Acceptable exceptions** (keep `no-console: off` override):
   - `app/worker.ts` — Web Worker can't import server-side logger
   - `app/global-error.tsx` — logger/providers may be unavailable (has comment explaining this)

**Verification:**

- [ ] `npm run lint` passes with 0 `no-console` warnings in production code
- [ ] `lib/logger.ts` is the only logging mechanism in `lib/`, `components/`, `hooks/`
- [ ] `npm test` passes

---

### Task 2.3: Review Inline `eslint-disable` Comments (30 min)

**Current state:** 13 inline `eslint-disable` comments across production code.

**Steps:**

Review each and either fix the underlying type issue or add a justification comment:

| Location                                              | Rule                          | Action                                            |
| ----------------------------------------------------- | ----------------------------- | ------------------------------------------------- |
| `app/worker.ts:1`                                     | File-wide `no-explicit-any`   | Keep — Worker `postMessage` API is untyped        |
| `app/api/feedback/route.ts:23`                        | `no-explicit-any`             | Fix — type the feedback payload                   |
| `app/api/v1/feedback/route.ts:47`                     | `no-explicit-any`             | Fix — type the Supabase response                  |
| `app/api/v1/notifications/subscribe/route.ts:43,58`   | `no-explicit-any` (×2)        | Fix — type web-push API                           |
| `app/[locale]/dashboard/settings/page.tsx:99,126`     | `no-explicit-any` (×2)        | Fix — type form state                             |
| `app/[locale]/dashboard/feedback/page.tsx:43`         | `no-explicit-any`             | Fix — type feedback array                         |
| `app/[locale]/dashboard/notifications/page.tsx:50,67` | `no-explicit-any` (×2)        | Fix — type subscription state                     |
| `app/[locale]/service/[id]/page.tsx:385`              | `no-explicit-any`             | Fix — type service field                          |
| `components/dashboard/MemberManagement.tsx:88`        | `react-hooks/exhaustive-deps` | ⚠️ Review carefully — potential stale closure bug |
| `components/dashboard/MemberManagement.tsx:148`       | `no-explicit-any`             | Fix — type member object                          |

**Verification:**

- [ ] All remaining `eslint-disable` comments have a `--` justification after them
- [ ] `MemberManagement.tsx:88` exhaustive-deps reviewed for correctness

---

## Phase 3: Scripts & File Cleanup (P1 — 2 hours)

**Goal:** Archive stale scripts, clean up dead code and root files.

### Task 3.1: Archive Orphan Scripts (1 hour)

**Current state:** 36 of 76 scripts have no `package.json` entry and no CI reference.

**Steps:**

1. **Create archive directory:**

```bash
mkdir -p scripts/archive
```

2. **Move v17.5-era Python scripts** (no longer needed post-v17.5):

```bash
mv scripts/evidence-spotcheck-v17-5.py scripts/archive/
mv scripts/generate-v17-5-ai-batches.py scripts/archive/
mv scripts/governance-qa-v17-5-ai-ingestion.py scripts/archive/
mv scripts/normalize-v17-5-ai-outputs.py scripts/archive/
mv scripts/validate-v17-5-ai-normalized.py scripts/archive/
```

3. **Move one-off i18n fix scripts:**

```bash
mv scripts/fix-all-impact-i18n.ts scripts/archive/
mv scripts/fix-impact-i18n.ts scripts/archive/
mv scripts/fix-missing-service-fr.ts scripts/archive/
mv scripts/patch-i18n.ts scripts/archive/
mv scripts/extract-missing-keys.ts scripts/archive/
```

4. **Move stale Vercel scripts** (if VPS migration is complete):

```bash
mv scripts/check-vercel-usage.sh scripts/archive/
mv scripts/copy-vercel-config.sh scripts/archive/
mv scripts/vercel-ignore-build.sh scripts/archive/
```

5. **Review remaining orphans** — keep or archive each:

| Script                      | Keep?       | Reason                               |
| --------------------------- | ----------- | ------------------------------------ |
| `assign-scopes.ts`          | ⚠️ Ask user | May be needed for RBAC setup         |
| `debug-rls.ts`              | Archive     | One-off debugging                    |
| `deploy-vps-proof.sh`       | Archive     | One-time deployment proof            |
| `release-vps-proof.sh`      | Archive     | One-time release proof               |
| `enable-plain-language.ts`  | Archive     | One-off data migration               |
| `enrich-authority-tiers.ts` | ⚠️ Ask user | May be needed for data enrichment    |
| `normalize-services.ts`     | ⚠️ Ask user | May still be useful                  |
| `audit-images.ts`           | Keep        | Useful audit                         |
| `audit-plain-language.ts`   | Keep        | Useful audit                         |
| `generate-changelog.ts`     | Keep        | Useful utility                       |
| `generate-llms-txt.ts`      | Keep        | Generates docs/llms.txt              |
| `generate-qi-report.ts`     | Keep        | Generates QI reports                 |
| `search-qa.ts`              | Keep        | Search quality testing               |
| `search-test-runner.ts`     | Keep        | Search testing                       |
| `verify-search-ranking.ts`  | Keep        | Ranking verification                 |
| `compare-bundle-size.js`    | Keep        | Bundle analysis                      |
| `report-bundle-size.js`     | Keep        | Bundle reporting                     |
| `check-env-host.ts`         | Archive     | One-off check                        |
| `migrate-data.ts`           | ⚠️ Ask user | May be needed for Supabase migration |
| `sync-211.ts`               | Keep        | Referenced by CI workflow            |
| `verify-rls.ts`             | Keep        | RLS verification                     |
| `verify-drafts.ts`          | ⚠️ Ask user | Draft verification                   |

6. **Add `scripts/archive/README.md`:**

```markdown
# Archived Scripts

Scripts in this directory are no longer actively used but are preserved for
reference. They were moved here during the v22.0 code quality remediation.

If you need to resurrect a script, move it back to `scripts/` and add a
`package.json` entry if it should be user-invocable.
```

**Verification:**

- [ ] `npm run lint` still passes
- [ ] `npm run build` still succeeds
- [ ] No CI workflow references a moved script
- [ ] Preserved scripts still listed in `package.json` remain in `scripts/`

---

### Task 3.2: Remove Dead Component (15 min)

**Current state:** `components/AsyncErrorBoundary.tsx` has 0 importers.

**Steps:**

```bash
# 1. Verify it's truly unused
grep -r 'AsyncErrorBoundary' app/ components/ lib/ hooks/ --include='*.ts' --include='*.tsx' -l

# 2. If zero results, delete
rm components/AsyncErrorBoundary.tsx

# 3. Delete its test if one exists
find tests -name '*AsyncErrorBoundary*' -delete

# 4. Verify
npm run type-check
npm test
```

**Verification:**

- [ ] No import references to `AsyncErrorBoundary` exist
- [ ] Build and tests pass

---

### Task 3.3: Clean Up Root-Level Files (15 min)

**Steps:**

1. **Move stale Vercel docs:**

```bash
mv VERCEL-OPTIMIZATION.md docs/deployment/
mv VERCEL-SETUP-COMPLETE.md docs/deployment/
```

2. **Update root-hygiene allowlist** (if `check-root-hygiene.sh` needs updating):

```bash
# Check if the script explicitly allows these files
grep -n 'VERCEL' scripts/check-root-hygiene.sh
```

3. **Verify symlinks are correct** (should already be fine):

```bash
ls -la CLAUDE.md GEMINI.md
# Expected: CLAUDE.md -> AGENTS.md, GEMINI.md -> AGENTS.md
```

**Verification:**

- [ ] `npm run check:root` still passes
- [ ] No stale one-off docs at project root
- [ ] Symlinks intact

---

### Task 3.4: Delete Empty Test Directories (5 min)

**Steps:**

```bash
# 1. Confirm empty
find tests/e2e-prod tests/e2e-server -type f | wc -l
# Expected: 0

# 2. Delete
rmdir tests/e2e-prod tests/e2e-server

# 3. If they contained .gitkeep or similar
rm -rf tests/e2e-prod tests/e2e-server
```

**Verification:**

- [ ] No empty placeholder test directories remain
- [ ] No CI workflow references these directories

---

## Phase 4: Component & Lib Organization (P2 — 2–3 hours)

**Goal:** Improve code discoverability through consistent directory structure.

### Task 4.1: Organize Root-Level Components (1–2 hours)

**Current state:** 12 `.tsx` files sit directly in `components/` root.

**Proposed moves:**

| File                      | Current Location | Target Location                              |
| ------------------------- | ---------------- | -------------------------------------------- |
| `AnalyticsCard.tsx`       | `components/`    | `components/dashboard/`                      |
| `AuthProvider.tsx`        | `components/`    | `components/layout/` (or `components/auth/`) |
| `BetaBanner.tsx`          | `components/`    | `components/layout/`                         |
| `ClientOnly.tsx`          | `components/`    | `components/ui/`                             |
| `DashboardSidebar.tsx`    | `components/`    | `components/dashboard/`                      |
| `EditServiceForm.tsx`     | `components/`    | `components/edit-service/`                   |
| `ErrorBoundary.tsx`       | `components/`    | `components/error/` (new)                    |
| `PageSection.tsx`         | `components/`    | `components/ui/`                             |
| `ServiceCard.tsx`         | `components/`    | `components/services/`                       |
| `ServiceCardSkeleton.tsx` | `components/`    | `components/services/`                       |
| `ThemeProvider.tsx`       | `components/`    | `components/layout/`                         |
| `Tooltip/` (dir)          | `components/`    | `components/ui/`                             |

**Steps for each file:**

```bash
# For each file, e.g. AnalyticsCard.tsx:

# 1. Move the file
mv components/AnalyticsCard.tsx components/dashboard/AnalyticsCard.tsx

# 2. Update all imports (find them first)
grep -rn 'from.*@/components/AnalyticsCard' app/ components/ --include='*.ts' --include='*.tsx'

# 3. Update each import path
# From: import { ... } from "@/components/AnalyticsCard"
# To:   import { ... } from "@/components/dashboard/AnalyticsCard"

# 4. Verify after each move
npm run type-check
```

> [!IMPORTANT]
> Move and update imports one file at a time. Run `type-check` after each to catch broken imports early.

**Verification:**

- [ ] `components/` root contains only subdirectories (no loose `.tsx`)
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes

---

### Task 4.2: Resolve `lib/schemas.ts` Naming Collision (15 min)

**Current state:** `lib/schemas.ts` (20-line standalone Zod form schema) coexists with `lib/schemas/` (8-file schema directory). The naming overlap is confusing.

**Steps:**

1. **Move and rename:**

```bash
mv lib/schemas.ts lib/schemas/form.ts
```

2. **Update imports** (7 files import from `@/lib/schemas`):

```bash
grep -rn 'from.*@/lib/schemas"' app/ components/ lib/ --include='*.ts' --include='*.tsx'
```

Change each from:

```typescript
import { serviceSchema } from "@/lib/schemas"
```

To:

```typescript
import { serviceSchema } from "@/lib/schemas/form"
```

> [!NOTE]
> The `lib/schemas/` directory contains domain-specific schemas (service, feedback, etc.). The form-level validation schema in `lib/schemas.ts` is a different concern and naming it `form.ts` makes the distinction clear.

**Verification:**

- [ ] No file named `lib/schemas.ts` exists
- [ ] `npm run type-check` passes
- [ ] `npm test` passes

---

## Phase 5: Documentation Housekeeping (P2 — 1–2 hours)

**Goal:** Archive completed implementation docs; reduce docs directory sprawl.

### Task 5.1: Archive Old Implementation Summaries (1 hour)

**Current state:** `docs/implementation/` has 52 files, mostly completed version summaries from v17.4–v19.0.

**Steps:**

1. **Create archive directory:**

```bash
mkdir -p docs/implementation/archive
```

2. **Move completed summaries older than v20.0:**

```bash
mv docs/implementation/v17-* docs/implementation/archive/
mv docs/implementation/v18-* docs/implementation/archive/
mv docs/implementation/v19-* docs/implementation/archive/
```

3. **Add `docs/implementation/archive/README.md`:**

```markdown
# Archived Implementation Summaries

Historical implementation records from v17.4–v19.0.
Preserved for reference and audit trail.
```

4. **Update any cross-references** that point to moved files:

```bash
grep -rn 'implementation/v17\|implementation/v18\|implementation/v19' docs/ --include='*.md' | head -20
```

**Verification:**

- [ ] `docs/implementation/` contains only active (v20.0+) summaries
- [ ] No broken cross-references in active docs
- [ ] MkDocs build succeeds (if applicable): `mkdocs build`

---

### Task 5.2: Review `docs/planning/archive/` (30 min)

**Current state:** 43 files in `docs/planning/archive/` — already properly archived. This task is a quick sanity check.

**Steps:**

1. **Verify nothing in `docs/planning/` should also be archived:**

```bash
ls docs/planning/*.md
# Review: are any of these completed/obsolete?
```

2. **Check for broken links in active planning docs:**

```bash
grep -rn '\](/' docs/planning/*.md | head -20
```

**Verification:**

- [ ] Active planning docs are genuinely active
- [ ] No broken internal links

---

## Phase 6: CI & Operational Tuning (P3 — 30 min)

**Goal:** Optimize CI for free-tier budget; verify workflow relevance.

### Task 6.1: Review CI Workflow Frequency (15 min)

**Current scheduled workflows:**

| Workflow                              | Schedule         | Question                                                |
| ------------------------------------- | ---------------- | ------------------------------------------------------- |
| `sync-211.yml`                        | Daily (4 AM UTC) | Is daily sync still needed? Could be weekly.            |
| `supabase-keepalive.yml`              | Every 12h        | Supabase pauses after 7 days — every 24h is sufficient. |
| `health-check.yml`                    | Monthly          | ✅ Fine                                                 |
| `staleness-check.yml`                 | Monthly          | ✅ Fine                                                 |
| `crisis-verification-reminder.yml`    | Monthly          | ✅ Fine                                                 |
| `quarterly-verification-reminder.yml` | Quarterly        | ✅ Fine                                                 |

**Steps:**

1. **Evaluate `sync-211.yml`** — if 211 data doesn't change daily, switch to weekly:

```yaml
# In sync-211.yml, change:
- cron: "0 4 * * *" # daily
# To:
- cron: "0 4 * * 1" # weekly (Monday)
```

2. **Reduce `supabase-keepalive.yml`** from every 12h to every 24h:

```yaml
# Change:
- cron: "17 */12 * * *"
# To:
- cron: "17 8 * * *" # once daily at 8:17 UTC
```

**Verification:**

- [ ] Workflows still trigger correctly (test via `workflow_dispatch`)
- [ ] CI minutes usage decreases

---

### Task 6.2: Verify `package.json` Overrides (15 min)

**Current overrides:**

```json
"overrides": {
  "react": "$react",
  "react-dom": "$react-dom",
  "tar": "^7.5.7"
}
```

**Steps:**

1. Check if `react`/`react-dom` overrides are still needed (they force React 19 for sub-deps):

```bash
npm ls react 2>/dev/null | grep -v 'deduped' | head -20
```

2. After fixing `tar` in Phase 1, check if the override is still necessary:

```bash
npm ls tar 2>/dev/null | head -10
```

3. Remove overrides that are no longer needed.

**Verification:**

- [ ] `npm install` succeeds without peer dep conflicts
- [ ] `npm audit` remains clean

---

## Effort Summary

| Phase                     | Tasks   | Effort           | Priority |
| ------------------------- | ------- | ---------------- | -------- |
| 1: Security & Deps        | 1.1–1.2 | 1 hour           | P0       |
| 2: ESLint & TS Strictness | 2.1–2.3 | 3–5 hours        | P0       |
| 3: Scripts & File Cleanup | 3.1–3.4 | 2 hours          | P1       |
| 4: Component & Lib Org    | 4.1–4.2 | 2–3 hours        | P2       |
| 5: Docs Housekeeping      | 5.1–5.2 | 1–2 hours        | P2       |
| 6: CI & Ops Tuning        | 6.1–6.2 | 30 min           | P3       |
| **Total**                 |         | **~12–16 hours** |          |

---

## Out of Scope

- Major architectural changes (module system, build pipeline)
- CSS splitting (not needed at 694 lines — revisit at ~1000)
- Adding `tsconfig.scripts.json` for scripts type-checking (minor improvement, defer)
- Test coverage improvements (separate effort)
- Upgrading major framework versions

---

## Acceptance Criteria (All Phases Complete)

- [ ] `npm audit` reports 0 high/critical vulnerabilities
- [ ] `npm run lint` passes (with `no-console` and stricter `no-explicit-any`)
- [ ] `npm run type-check` passes
- [ ] `npm run check:root` passes
- [ ] `npm test` passes
- [ ] No orphan scripts without `package.json` entry or documentation
- [ ] No loose component files in `components/` root
- [ ] Documentation directory is organized with archived historical docs
- [ ] CI minutes usage is optimized

---

## Related Documentation

- [Roadmap](roadmap.md)
- [Testing Guidelines](../development/testing-guidelines.md)
- [Architecture](../architecture.md)
- [AGENTS.md](../../AGENTS.md)
