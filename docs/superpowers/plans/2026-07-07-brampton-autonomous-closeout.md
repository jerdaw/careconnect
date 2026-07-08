# Brampton Autonomous Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining Brampton launch work that can be done autonomously: remediate recorded accessibility/browser defects, complete viewport QA evidence, prepare approval packets, and queue future Brampton verification without touching production or unapproved service data.

**Architecture:** Treat this as a closeout layer on top of the existing multi-city foundation and approved seven-record Brampton launch set. Runtime changes are limited to accessibility and browser-error fixes with tests; rollout, public-positioning, and future-data work stays in approval-ready documents and draft-only queues.

**Tech Stack:** Next.js 16 App Router, TypeScript strict mode, React 19, Tailwind CSS v4, Radix UI, next-intl, Vitest, Playwright with Axe, Supabase CLI/PostgreSQL read-only checks, manually curated JSON service data.

## Global Constraints

- Do not apply production migrations, production SQL, production backfills, deploys, merges, or pushes without explicit human approval.
- Do not add unapproved Brampton or deferred candidate records to `data/services.json`.
- Do not edit `data/embeddings.json` unless `data/services.json` changes in an approved data task.
- Do not fabricate service names, phone numbers, addresses, eligibility, verification levels, service areas, partnerships, or land acknowledgment wording.
- Land acknowledgment wording and official/partner relationship wording remain approval-gated; autonomous work may prepare source checklists and draft options only.
- Search privacy must remain intact: no tracking, no analytics pixels, no user search logging, and no new query persistence.
- Public docs must not include private hostnames, project refs, credentials, webhook URLs, secret locations, or private deployment inventory.
- Use Node `22.13.1` through NVM for local verification.
- If WSL Chromium or `psql` system packages are absent, use the existing extracted dependency path under `/tmp/careconnect-local-deps` or recreate it from public Ubuntu packages.
- Run linked Supabase CLI reads serially only; do not run parallel live DB queries.

---

## Scope Check

This plan does not publish anything to production. It prepares and verifies the remaining work that is safe in the repository and local environment:

1. Strict accessibility regression coverage for the already recorded Axe issues.
2. Fixes for `aria-hidden-focus`, contrast failures, and the semantic-search worker unhandled rejection.
3. Desktop, tablet, and mobile screenshot review evidence.
4. A production migration approval packet that records exact read-only checks and gates, without executing production changes.
5. Public positioning drafts and source-review matrices, without final partner or land acknowledgment publication.
6. A draft-only Brampton future verification queue, without live data promotion.

## File Structure

Create:

- `tests/e2e/accessibility-regression.spec.ts`: strict Playwright/Axe regression suite for the routes that currently log serious violations.
- `tests/e2e/brampton-visual-qa.spec.ts`: deterministic screenshot capture and smoke checks for desktop, tablet, and mobile Brampton/Kingston views.
- `docs/launch/brampton-production-approval-packet.md`: approval-ready migration and deploy packet with read-only pre/post checks.
- `data/drafts/brampton-on/reviews/2026-07-07-next-verification-queue.md`: draft-only deferred candidate and L2/L3 queue.

Modify:

- `app/[locale]/page.tsx`: unmount the discovery layer while search is active and catch optional semantic-search initialization failures.
- `components/home/PlaceSelector.tsx`: strengthen city selector and location-control contrast.
- `components/home/SearchControls.tsx`: strengthen search-filter chip contrast.
- `components/services/ServiceActionBar.tsx`: add explicit accessible foreground colors to the plain-language link.
- `components/feedback/FeedbackWidget.tsx`: strengthen helpfulness/report button contrast.
- `components/services/ServiceMatchReasons.tsx`: strengthen match-reason heading/toggle/list contrast.
- `components/services/ServiceCard.tsx`: strengthen service meta/contact text contrast.
- `components/ui/button.tsx`: make shared `secondary`, `outline`, `ghost`, and `pill` variants meet contrast in dark and transparent-header contexts.
- `components/ui/select.tsx`: make the default select trigger value inherit explicit high-contrast foreground colors.
- `lib/search/highlight.ts`: make highlighted search terms contrast-safe in dark mode.
- `tests/hooks/useSemanticSearch.test.ts`: cover initialization failure cleanup/retry behavior.
- `tests/components/ServiceCard.test.tsx`, `tests/components/home/PlaceSelector.test.tsx`, `tests/components/layout/Header.test.tsx`: add focused class/behavior assertions where useful.
- `docs/launch/brampton-manual-qa.md`: record screenshot-review results and browser-console evidence.
- `docs/launch/brampton-readiness-report.md`: update residual-risk and verification status after remediation.
- `docs/launch/brampton-rollout-checklist.md`: mark remediated local QA items and keep production gates open.
- `docs/launch/brampton-public-positioning-drafts.md`: add approval-ready wording options and approval matrix.
- `docs/launch/brampton-pr-description.md`: add final closeout verification notes.

Do not modify:

- `data/services.json`
- `data/embeddings.json`
- live Supabase schema or data
- environment files
- private/shared operations material, unless only reading it through approved local access for rollout context

## Task 1: Add Strict Accessibility Reproduction

**Files:**

- Create: `tests/e2e/accessibility-regression.spec.ts`
- Modify: none

**Interfaces:**

- Consumes: existing local app served by Playwright `webServer`.
- Produces: a strict Axe test that fails before remediation and passes after Tasks 2-4.

- [ ] **Step 1: Create the strict regression spec**

Add `tests/e2e/accessibility-regression.spec.ts`:

```ts
import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { mockSupabase } from "./utils"

const regressionRoutes = ["/en", "/en?q=health", "/en/dashboard", "/en/submit-service", "/en/service/kids-help-phone"]

test.describe("Brampton closeout accessibility regressions", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  for (const route of regressionRoutes) {
    test(`${route} has no serious WCAG A/AA Axe violations`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState("networkidle")
      await page.evaluate(() => document.documentElement.classList.add("dark"))

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
      const seriousViolations = results.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical"
      )

      expect(
        seriousViolations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.map((node) => node.html),
        }))
      ).toEqual([])
    })
  }
})
```

- [ ] **Step 2: Run it to verify the known failures**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu/nss:${LD_LIBRARY_PATH:-} \
  npx playwright test tests/e2e/accessibility-regression.spec.ts --project=chromium
```

Expected before remediation: failure on one or more routes with serious `color-contrast`; `/en?q=health` also fails `aria-hidden-focus`.

- [ ] **Step 3: Commit only if executing as a separate review step**

Run:

```bash
git add tests/e2e/accessibility-regression.spec.ts
git commit -m "test: add strict brampton accessibility regression"
```

Expected: commit succeeds. If executing the full plan in one session, keep this staged for a later grouped commit.

## Task 2: Fix Hidden Focus On Active Search

**Files:**

- Modify: `app/[locale]/page.tsx`
- Test: `tests/e2e/accessibility-regression.spec.ts`

**Interfaces:**

- Consumes: `hasActiveSearch` boolean in `app/[locale]/page.tsx`.
- Produces: discovery content that is not focusable or exposed to assistive tech while results/search controls are active.

- [ ] **Step 1: Replace the collapsed `aria-hidden` discovery layer**

In `app/[locale]/page.tsx`, replace the current discovery layer block:

```tsx
<div
  className={cn(
    "transition-all duration-500",
    hasActiveSearch ? "pointer-events-none mt-0 h-0 overflow-hidden opacity-0" : "mt-4 opacity-100"
  )}
  aria-hidden={hasActiveSearch || undefined}
>
  <HomeStats />
  <CategoryBrowseGrid onCategorySelect={handleCategorySelect} />
  <HowItWorks />
</div>
```

with:

```tsx
{
  !hasActiveSearch && (
    <div className="mt-4 transition-opacity duration-500">
      <HomeStats />
      <CategoryBrowseGrid onCategorySelect={handleCategorySelect} />
      <HowItWorks />
    </div>
  )
}
```

- [ ] **Step 2: Run the strict route that reproduced `aria-hidden-focus`**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu/nss:${LD_LIBRARY_PATH:-} \
  npx playwright test tests/e2e/accessibility-regression.spec.ts --project=chromium --grep "/en\\?q=health"
```

Expected after this task: no `aria-hidden-focus` violation remains. `color-contrast` may still fail until Task 3.

- [ ] **Step 3: Commit hidden-focus fix if executing independently**

Run:

```bash
git add 'app/[locale]/page.tsx' tests/e2e/accessibility-regression.spec.ts
git commit -m "fix: remove hidden focusable homepage discovery content"
```

Expected: commit succeeds.

## Task 3: Fix Recorded Contrast Failures

**Files:**

- Modify: `components/home/PlaceSelector.tsx`
- Modify: `components/home/SearchControls.tsx`
- Modify: `components/services/ServiceActionBar.tsx`
- Modify: `components/feedback/FeedbackWidget.tsx`
- Modify: `components/services/ServiceMatchReasons.tsx`
- Modify: `components/services/ServiceCard.tsx`
- Modify: `components/ui/button.tsx`
- Modify: `components/ui/select.tsx`
- Modify: `lib/search/highlight.ts`
- Test: `tests/e2e/accessibility-regression.spec.ts`

**Interfaces:**

- Consumes: existing Tailwind color tokens and shared UI components.
- Produces: WCAG AA contrast for the current Axe nodes on `/en`, `/en?q=health`, `/en/dashboard`, `/en/submit-service`, and `/en/service/kids-help-phone`.

- [ ] **Step 1: Strengthen shared button variants**

In `components/ui/button.tsx`, replace only the `outline`, `secondary`, `ghost`, `link`, and `pill` variant strings with:

```ts
outline:
  "border border-neutral-300 bg-white text-neutral-950 shadow-sm hover:bg-neutral-50 hover:text-neutral-950 hover:shadow-md dark:border-neutral-600 dark:bg-slate-950 dark:text-white dark:hover:bg-neutral-900 dark:hover:text-white",
secondary:
  "bg-white text-neutral-950 shadow-sm border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 hover:text-neutral-950 dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-300 dark:hover:bg-white",
ghost:
  "text-neutral-800 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white",
link: "text-primary-700 underline-offset-4 hover:underline dark:text-primary-200",
pill:
  "rounded-full bg-white text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 hover:text-neutral-950 hover:ring-neutral-400 dark:bg-neutral-100 dark:text-neutral-950 dark:ring-neutral-300 dark:hover:bg-white",
```

- [ ] **Step 2: Strengthen shared select foreground**

In `components/ui/select.tsx`, add explicit foreground classes to `SelectTrigger`:

```tsx
"border-input data-[placeholder]:text-muted-foreground text-neutral-950 dark:text-white [&_svg:not([class*='text-'])]:text-neutral-700 dark:[&_svg:not([class*='text-'])]:text-neutral-200 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 *:data-[slot=select-value]:text-neutral-950 dark:*:data-[slot=select-value]:text-white [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
```

- [ ] **Step 3: Strengthen the place selector local classes**

In `components/home/PlaceSelector.tsx`, change the `SelectTrigger` and location button classes to:

```tsx
<SelectTrigger
  className="h-8 w-[150px] border-neutral-300 bg-white text-xs text-neutral-950 dark:border-white/20 dark:bg-slate-950 dark:text-white"
  aria-label={t("change")}
>
```

and:

```tsx
<Button
  type="button"
  variant="ghost"
  size="sm"
  className="h-8 px-2.5 text-xs text-neutral-900 hover:text-neutral-950 dark:text-neutral-100 dark:hover:text-white"
  onClick={onUseLocation}
>
```

- [ ] **Step 4: Strengthen search filter chip classes**

In `components/home/SearchControls.tsx`, replace the segment class constants with:

```ts
const inactiveSegmentClass =
  "border-transparent bg-white/80 text-neutral-950 shadow-none hover:translate-y-0 hover:bg-white hover:text-neutral-950 hover:shadow-none dark:bg-slate-950/80 dark:text-white dark:hover:bg-slate-900 dark:hover:text-white"
const activeSegmentClass =
  "border-transparent bg-neutral-950 text-white shadow-none hover:translate-y-0 hover:bg-neutral-900 hover:shadow-none dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
```

In the crisis inactive branch, use:

```ts
"bg-red-50 text-red-900 hover:bg-red-100 hover:text-red-950 dark:bg-red-950/80 dark:text-red-100 dark:hover:bg-red-900/80"
```

- [ ] **Step 5: Strengthen service-card text and match reasons**

In `components/services/ServiceCard.tsx`, update low-contrast meta/contact classes:

```tsx
<div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-neutral-700 dark:text-neutral-200">
```

```tsx
<span className="text-neutral-500 dark:text-neutral-400">•</span>
```

```tsx
className = "mt-1.5 line-clamp-1 text-[13px] text-neutral-700 dark:text-neutral-200"
```

```tsx
<div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-neutral-700 dark:text-neutral-200">
```

```tsx
<MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-600 dark:text-neutral-300" />
<Phone className="h-3.5 w-3.5 shrink-0 text-neutral-600 dark:text-neutral-300" />
```

In `components/services/ServiceMatchReasons.tsx`, update text classes:

```tsx
className = "text-[11px] font-medium tracking-[0.08em] text-neutral-700 uppercase dark:text-neutral-200"
```

```tsx
className =
  "max-w-full border-neutral-300 bg-white text-[11px] font-medium whitespace-normal text-neutral-800 dark:border-neutral-600 dark:bg-slate-950 dark:text-neutral-100"
```

```tsx
className =
  "text-primary-800 focus-visible:ring-primary-500/60 text-xs font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none dark:text-primary-100"
```

```tsx
className = "ml-4 list-disc space-y-1 text-xs text-neutral-800 dark:text-neutral-100"
```

- [ ] **Step 6: Strengthen highlighted text**

In `lib/search/highlight.ts`, replace the mark class string with:

```ts
'<mark class="rounded bg-yellow-200 px-0.5 text-neutral-950 dark:bg-yellow-300 dark:text-neutral-950">$1</mark>'
```

- [ ] **Step 7: Strengthen service-detail actions and feedback buttons**

In `components/services/ServiceActionBar.tsx`, update the simple-view link:

```tsx
className =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-950 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-950 dark:border-neutral-600 dark:bg-slate-950 dark:text-white dark:hover:bg-neutral-900"
```

In `components/feedback/FeedbackWidget.tsx`, add explicit high-contrast classes to the Yes/No and Report buttons:

```tsx
className =
  "bg-white text-neutral-950 hover:bg-neutral-50 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-white"
```

for each outline vote button, and:

```tsx
className = "text-neutral-800 hover:text-neutral-950 dark:text-neutral-100 dark:hover:text-white"
```

for the report button.

- [ ] **Step 8: Run strict contrast regression**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu/nss:${LD_LIBRARY_PATH:-} \
  npx playwright test tests/e2e/accessibility-regression.spec.ts --project=chromium
```

Expected after this task: all five routes pass the strict serious/critical Axe check.

- [ ] **Step 9: Run focused component tests**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/components/ServiceCard.test.tsx tests/components/home/PlaceSelector.test.tsx tests/components/layout/Header.test.tsx --run
```

Expected: all tests pass.

- [ ] **Step 10: Commit contrast fixes if executing independently**

Run:

```bash
git add components/home/PlaceSelector.tsx components/home/SearchControls.tsx components/services/ServiceActionBar.tsx components/feedback/FeedbackWidget.tsx components/services/ServiceMatchReasons.tsx components/services/ServiceCard.tsx components/ui/button.tsx components/ui/select.tsx lib/search/highlight.ts tests/e2e/accessibility-regression.spec.ts
git commit -m "fix: improve brampton launch accessibility contrast"
```

Expected: commit succeeds.

## Task 4: Fix Semantic Worker Unhandled Rejection

**Files:**

- Modify: `app/[locale]/page.tsx`
- Modify: `hooks/useSemanticSearch.ts`
- Modify: `tests/hooks/useSemanticSearch.test.ts`
- Test: `tests/hooks/useSemanticSearch.test.ts`

**Interfaces:**

- Consumes: `initSemanticSearch(): Promise<void>` from `useSemanticSearch`.
- Produces: optional semantic-search initialization failure that does not produce an unhandled rejection and keeps keyword search usable.

- [ ] **Step 1: Catch optional semantic init failure from the homepage**

In `app/[locale]/page.tsx`, replace:

```tsx
void initSemanticSearch()
```

with:

```tsx
void initSemanticSearch().catch(() => {
  // Semantic search is optional; keyword search remains available through useServices.
})
```

- [ ] **Step 2: Make worker construction failure settle cleanly**

In `hooks/useSemanticSearch.ts`, wrap worker construction in `ensureWorker`:

```ts
let nextWorker: Worker
try {
  nextWorker = new Worker(new URL("../app/worker.ts", import.meta.url))
} catch {
  handleWorkerFailure("Failed to load semantic search worker", { rejectInit: true })
  throw new Error("Failed to load semantic search worker")
}
```

Keep the existing `error` event handling for script fetch failures. If the browser still logs through `logger.error` for optional initialization failure after the homepage catch is in place, downgrade only the initialization-path log to `logger.warn`; keep embedding-request failures as errors because those happen after the feature claimed readiness.

- [ ] **Step 3: Add retry/cleanup coverage**

Append this test to `tests/hooks/useSemanticSearch.test.ts`:

```ts
it("clears failed init promises so semantic search can be retried without unhandled state", async () => {
  mockWorker.postMessage.mockImplementationOnce(({ action }: { action: string }) => {
    if (action === "init") {
      for (const handler of messageHandlers) {
        handler({ data: { status: "error", error: "Failed to fetch" } } as any)
      }
    }
  })

  const { result } = renderHook(() => useSemanticSearch())

  await act(async () => {
    await expect(result.current.initSemanticSearch()).rejects.toThrow("Failed to fetch")
  })

  mockWorker.postMessage.mockImplementationOnce(({ action }: { action: string }) => {
    if (action === "init") {
      for (const handler of messageHandlers) {
        handler({ data: { status: "ready" } } as any)
      }
    }
  })

  await act(async () => {
    await result.current.initSemanticSearch()
  })

  await waitFor(() => expect(result.current.isReady).toBe(true))
})
```

- [ ] **Step 4: Run hook tests**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/hooks/useSemanticSearch.test.ts --run
```

Expected: all `useSemanticSearch` tests pass.

- [ ] **Step 5: Rerun browser a11y and confirm no unhandled rejection**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu/nss:${LD_LIBRARY_PATH:-} \
  npm run test:a11y -- --project=chromium
```

Expected: 10 Chromium tests pass. Output must not include `unhandledRejection: Error: Failed to fetch` from `useSemanticSearch`.

- [ ] **Step 6: Commit semantic-worker fix if executing independently**

Run:

```bash
git add 'app/[locale]/page.tsx' hooks/useSemanticSearch.ts tests/hooks/useSemanticSearch.test.ts
git commit -m "fix: handle optional semantic worker init failure"
```

Expected: commit succeeds.

## Task 5: Complete Viewport Visual QA Evidence

**Files:**

- Create: `tests/e2e/brampton-visual-qa.spec.ts`
- Modify: `docs/launch/brampton-manual-qa.md`

**Interfaces:**

- Consumes: Playwright Chromium and current local UI.
- Produces: screenshot artifacts under `test-results/brampton-visual-qa/` and a public-safe QA summary.

- [ ] **Step 1: Add a deterministic screenshot QA spec**

Create `tests/e2e/brampton-visual-qa.spec.ts`:

```ts
import { expect, test } from "@playwright/test"
import { mockSupabase } from "./utils"

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const

test.describe("Brampton visual QA capture", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  for (const viewport of viewports) {
    test(`homepage ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto("/en")
      await page.waitForLoadState("networkidle")

      await expect(page.getByRole("heading", { name: /CareConnect/i })).toBeVisible()
      await expect(page.getByRole("combobox", { name: /Change city/i })).toBeVisible()
      await expect(page.getByText(/Kingston|Brampton/).first()).toBeVisible()

      await page.screenshot({
        path: `test-results/brampton-visual-qa/home-${viewport.name}.png`,
        fullPage: true,
      })
    })

    test(`active search ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto("/en?q=health")
      await page.waitForLoadState("networkidle")

      await expect(page.getByRole("searchbox")).toBeVisible()
      await expect(page.getByRole("group", { name: /Category filters/i })).toBeVisible()

      await page.screenshot({
        path: `test-results/brampton-visual-qa/search-health-${viewport.name}.png`,
        fullPage: true,
      })
    })
  }
})
```

- [ ] **Step 2: Run screenshot capture**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu/nss:${LD_LIBRARY_PATH:-} \
  npx playwright test tests/e2e/brampton-visual-qa.spec.ts --project=chromium
```

Expected: 6 tests pass and 6 screenshots are written under `test-results/brampton-visual-qa/`.

- [ ] **Step 3: Review screenshots locally**

Open each screenshot and check:

- No text overlap or clipped buttons.
- Region animation area does not shift layout.
- City selector is visible and readable.
- Search filter chips wrap cleanly.
- Results cards remain scannable on mobile.
- Header CTA and service-detail controls remain readable in dark mode.

- [ ] **Step 4: Update manual QA notes**

In `docs/launch/brampton-manual-qa.md`, update the `Viewports`, `Accessibility`, and `Open Issues` sections:

```markdown
## Viewports

- Desktop 1440 x 900: record whether `test-results/brampton-visual-qa/home-desktop.png` and `search-health-desktop.png` show readable text, visible city controls, and no overlap.
- Tablet 768 x 1024: record whether `test-results/brampton-visual-qa/home-tablet.png` and `search-health-tablet.png` show readable text, visible city controls, and no overlap.
- Mobile 390 x 844: record whether `test-results/brampton-visual-qa/home-mobile.png` and `search-health-mobile.png` show readable text, visible city controls, and no overlap.

## Accessibility

- Strict Axe regression: pass after remediation, `tests/e2e/accessibility-regression.spec.ts`.
- Browser console: no unhandled semantic-search rejection observed after remediation.
```

Write concrete observations, such as `no overlap found in hero/search controls` or `category filters wrap into two readable rows`.

- [ ] **Step 5: Keep generated screenshots out of git**

Run:

```bash
git status --short test-results/brampton-visual-qa
```

Expected: screenshots are untracked or ignored. Do not commit PNG artifacts unless the repo already tracks comparable QA screenshots.

- [ ] **Step 6: Commit visual QA spec and docs if executing independently**

Run:

```bash
git add tests/e2e/brampton-visual-qa.spec.ts docs/launch/brampton-manual-qa.md
git commit -m "test: add brampton viewport visual qa"
```

Expected: commit succeeds.

## Task 6: Prepare Production Approval Packet

**Files:**

- Create: `docs/launch/brampton-production-approval-packet.md`
- Modify: `docs/launch/brampton-rollout-checklist.md`
- Modify: `docs/launch/brampton-readiness-report.md`

**Interfaces:**

- Consumes: completed live schema preflight, pending migration `supabase/migrations/20260706120000_add_service_coverage_place_fields.sql`, and approved private operations context if needed.
- Produces: an approval-ready packet without executing production SQL.

- [ ] **Step 1: Create the approval packet**

Create `docs/launch/brampton-production-approval-packet.md`:

````markdown
# Brampton Production Approval Packet

Date: 2026-07-07
Status: approval required before any production write, migration, deploy, merge, or rollback

## Decision Needed

Approve or reject applying the Brampton coverage migration and deploying the multi-city application release.

## What Is Already Confirmed

- The linked production database was inspected read-only through the Supabase CLI.
- `services.primary_place_id` and `services.coverage` are absent before migration.
- `services_public.primary_place_id` and `services_public.coverage` are absent before migration.
- The previous provenance-sanitizing public-view migration is applied.
- `services_public` uses `security_invoker=true`.
- `services` has RLS enabled.
- Existing live grants are broader than the repo baseline, so the pending migration now explicitly revokes `services_public` privileges before granting expected read access.
- The Brampton coverage migration has not been applied.

## Must Not Proceed Until

- Backup/restore posture is confirmed through the approved private operations source of truth.
- The exact target environment is confirmed.
- The approving human explicitly authorizes the migration and deployment.
- A rollback owner and decision path are identified.

## Read-Only Pre-Approval Commands

Run serially:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase migration list --linked
```
````

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' and table_name in ('services', 'services_public') and column_name in ('primary_place_id', 'coverage') order by table_name, column_name;"
```

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select relname, relrowsecurity from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace where nspname = 'public' and relname in ('services', 'services_public') order by relname;"
```

## Migration Command

Do not run this command without explicit approval:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db push --linked
```

## Post-Migration Read-Only Checks

Run serially after approval and migration:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' and table_name in ('services', 'services_public') and column_name in ('primary_place_id', 'coverage') order by table_name, column_name;"
```

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npx supabase db query --linked --output json "select count(*)::int as services_with_coverage from public.services where coverage is not null;"
```

## Application Smoke Checks After Deploy Approval

- Kingston selected-place search returns Kingston-local records and broad Ontario/Canada records.
- Brampton selected-place search returns the approved Brampton first launch set and broad Ontario/Canada records.
- Brampton selected-place search does not return Kingston-only local services.
- `/api/v1/search/services` rejects invalid `filters.placeId` with `400`.
- Public search introduces no user query logging or tracking.

## Rollback Boundaries

- Application rollback can revert to the previous release after deploy approval.
- Data correction must use a follow-up reviewed data commit.
- Schema rollback requires separate database rollback approval.

````

- [ ] **Step 2: Update rollout checklist**

In `docs/launch/brampton-rollout-checklist.md`, mark `Confirm backup or rollback posture` as still open but point it to the approval packet:

```markdown
- [ ] Confirm backup or rollback posture using `docs/launch/brampton-production-approval-packet.md` and the approved private/shared operations source of truth.
````

- [ ] **Step 3: Update readiness report**

In `docs/launch/brampton-readiness-report.md`, add:

```markdown
- Production approval packet: prepared; migration and deploy remain unapplied and approval-gated.
```

- [ ] **Step 4: Commit approval packet if executing independently**

Run:

```bash
git add docs/launch/brampton-production-approval-packet.md docs/launch/brampton-rollout-checklist.md docs/launch/brampton-readiness-report.md
git commit -m "docs: prepare brampton production approval packet"
```

Expected: commit succeeds.

## Task 7: Expand Public Positioning Drafts Without Publishing Gated Copy

**Files:**

- Modify: `docs/launch/brampton-public-positioning-drafts.md`
- Modify: `docs/launch/brampton-pr-description.md`

**Interfaces:**

- Consumes: current public-positioning draft document and existing public pages.
- Produces: approval-ready wording options and a clear distinction between source references and partnerships.

- [ ] **Step 1: Add an approval matrix**

Append this section to `docs/launch/brampton-public-positioning-drafts.md`:

```markdown
## Approval Matrix

| Surface                    | Safe Autonomous State                                                      | Human Approval Required Before                                                 |
| -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Homepage supported regions | `CareConnect` umbrella with Kingston and Brampton as supported communities | Claims that coverage is complete or officially endorsed                        |
| Brampton live copy         | Small reviewed launch set for urgent/core supports                         | Copy describing a full Brampton directory                                      |
| Partner/source pages       | Public sources support manual review                                       | Any provider, municipal, regional, provincial, or Indigenous partnership claim |
| Land acknowledgment        | Source checklist and draft-only options                                    | Final wording in public UI or docs                                             |
| Project name               | `CareConnect` public umbrella                                              | Rebranding into a city-specific or region-specific product name                |
```

- [ ] **Step 2: Add safe copy options**

Add:

```markdown
## Approval-Ready Copy Options

### Homepage Region Line

Option A:

> Search reviewed food, housing, crisis, and community supports across Kingston and Brampton, with broader Ontario resources included where they apply.

Option B:

> CareConnect supports Kingston and Brampton with reviewed local records and broader Ontario services where coverage applies.

### Brampton First Launch Set

Option A:

> Brampton coverage begins with a small reviewed set of urgent and core supports. More records will be added through the same manual review process used for Kingston.

Option B:

> Brampton is live with an initial reviewed launch set for shelter, crisis, emergency assistance, and food support.

### Source Reference

> CareConnect uses public provider, directory, and government sources as inputs for manual review. A source link does not mean the source endorses, operates, or partners with CareConnect.
```

- [ ] **Step 3: Keep land acknowledgment draft-only**

Add:

```markdown
## Land Acknowledgment Publication Gate

Do not move Brampton-specific land acknowledgment wording into public UI until:

- A human reviewer confirms the preferred source basis.
- The wording avoids implying endorsement by any Nation, municipality, or community organization.
- The wording is reviewed in the context where it will appear.
- The Kingston/Katarokwi wording is reviewed for consistency with the multi-city framing.
```

- [ ] **Step 4: Update PR description**

In `docs/launch/brampton-pr-description.md`, add a verification note:

```markdown
- Public-positioning closeout: approval-ready wording options prepared; no final land acknowledgment, official relationship wording, or partnership claims published.
```

- [ ] **Step 5: Commit public-positioning drafts if executing independently**

Run:

```bash
git add docs/launch/brampton-public-positioning-drafts.md docs/launch/brampton-pr-description.md
git commit -m "docs: expand brampton public positioning approval drafts"
```

Expected: commit succeeds.

## Task 8: Queue Future Brampton Verification Without Live Data Changes

**Files:**

- Create: `data/drafts/brampton-on/reviews/2026-07-07-next-verification-queue.md`
- Modify: `docs/launch/brampton-rollout-checklist.md`
- Modify: `docs/launch/brampton-readiness-report.md`

**Interfaces:**

- Consumes: existing Brampton candidate, duplicate, and L1 review artifacts.
- Produces: a future curation queue that does not alter live search data.

- [ ] **Step 1: Create the future verification queue**

Create `data/drafts/brampton-on/reviews/2026-07-07-next-verification-queue.md`:

```markdown
# Brampton Next Verification Queue

Date: 2026-07-07
Status: draft-only; no live data changes

## Guardrails

- Do not promote any record from this queue to `data/services.json` without L1 approval.
- Do not infer missing phone, address, hours, eligibility, or service area facts.
- Prefer program-level records over broad organization records when the public source supports a specific program.
- Reuse existing broad Ontario/Canada canonical records instead of duplicating them for Brampton.

## L2 Follow-Up For Promoted Records

| Record                                                | Current L1 Status | L2 Question                                                                                          |
| ----------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| Peel Centralized Shelter Intake                       | promoted L1       | Confirm current intake flow and whether any Brampton-specific access notes should be added.          |
| Wilkinson Road Shelter                                | promoted L1       | Confirm current intake/referral path and any population restrictions.                                |
| Victim Services of Peel                               | promoted L1       | Confirm current crisis contact path and regional coverage wording.                                   |
| Safe Centre of Peel                                   | promoted L1       | Confirm current intake path and whether Brampton should use site-level or regional coverage wording. |
| Region of Peel Ontario Works and Emergency Assistance | promoted L1       | Confirm emergency assistance intake steps and whether office-specific details should be added.       |
| Regeneration Marketplace Food Bank                    | promoted L1       | Confirm current food-bank intake, hours, and eligibility.                                            |
| Knights Table Food Bank and Meal Programs             | promoted L1       | Recheck official address against older 211 pantry address before L2.                                 |

## Deferred Candidates

| Candidate                                       | Reason Deferred                                                                        | Next Safe Action                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Ste. Louise Outreach Centre of Peel             | needs stronger program/source clarity before live record                               | Verify current program scope, intake, address, and duplicate risk.                                 |
| Brampton Multicultural Community Centre         | broad organization candidate; may need narrower program records                        | Identify specific emergency/core programs before creating draft service records.                   |
| Catholic Crosscultural Services Brampton Office | newcomer support is useful but outside first emergency/core launch set                 | Verify office details, program scope, intake path, and language-access notes.                      |
| Punjabi Community Health Services               | useful community health/wellness candidate but outside first emergency/core launch set | Verify Brampton location/program details and decide whether the record should be program-specific. |

## Canonical Reuse Watchlist

- Keep using existing 988, ConnexOntario, Kids Help Phone, Health811, 211 Ontario, and Ontario Victim Support Line records as broad services.
- Do not create Brampton-local duplicates for broad phone lines unless there is a distinct Brampton program with a separate intake path.

## Approval Checklist For Any Future Promotion

- [ ] Official source reviewed.
- [ ] Secondary source reviewed when available.
- [ ] Phone or intake path verified.
- [ ] Address omitted unless sourced.
- [ ] Coverage decision documented.
- [ ] Duplicate/canonical decision documented.
- [ ] Unresolved fields explicitly listed.
- [ ] Human L1 approval recorded.
```

- [ ] **Step 2: Update rollout checklist post-launch queue**

In `docs/launch/brampton-rollout-checklist.md`, under `Post-Launch`, add:

```markdown
- [ ] Use `data/drafts/brampton-on/reviews/2026-07-07-next-verification-queue.md` for L2/L3 and deferred-candidate sequencing.
```

- [ ] **Step 3: Update readiness report**

In `docs/launch/brampton-readiness-report.md`, add:

```markdown
- Future verification queue: prepared as draft-only; no additional Brampton records promoted.
```

- [ ] **Step 4: Confirm live data was not changed**

Run:

```bash
git diff -- data/services.json data/embeddings.json
```

Expected: no output.

- [ ] **Step 5: Commit future queue if executing independently**

Run:

```bash
git add data/drafts/brampton-on/reviews/2026-07-07-next-verification-queue.md docs/launch/brampton-rollout-checklist.md docs/launch/brampton-readiness-report.md
git commit -m "docs: queue brampton future verification"
```

Expected: commit succeeds.

## Task 9: Final Verification And Closeout

**Files:**

- Modify: `docs/launch/brampton-manual-qa.md`
- Modify: `docs/launch/brampton-readiness-report.md`
- Modify: `docs/launch/brampton-rollout-checklist.md`
- Modify: `docs/launch/brampton-pr-description.md`

**Interfaces:**

- Consumes: all prior task outputs.
- Produces: final verification evidence and a clean branch state ready for human review.

- [ ] **Step 1: Run targeted unit/component tests**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- tests/hooks/useSemanticSearch.test.ts tests/components/ServiceCard.test.tsx tests/components/home/PlaceSelector.test.tsx tests/components/home/SearchResultsList.test.tsx tests/components/layout/Header.test.tsx --run
```

Expected: all targeted tests pass.

- [ ] **Step 2: Run strict and existing browser accessibility suites**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu/nss:${LD_LIBRARY_PATH:-} \
  npx playwright test tests/e2e/accessibility-regression.spec.ts --project=chromium
```

Expected: all strict regression tests pass.

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu/nss:${LD_LIBRARY_PATH:-} \
  npm run test:a11y -- --project=chromium
```

Expected: 10 Chromium tests pass; no `unhandledRejection: Error: Failed to fetch` appears.

- [ ] **Step 3: Run full repository checks**

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
```

Expected:

- lint passes with zero errors.
- type-check passes.
- format check passes.
- reference check passes.
- data validation reports 203 services unless approved service data changed later.
- DB validation alias passes.
- embedding check reports 203 services and 203 embeddings unless approved service data changed later.
- build passes.

- [ ] **Step 4: Run DB smoke if local dependencies are available**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
PATH=/tmp/careconnect-local-deps/usr/lib/postgresql/16/bin:/tmp/careconnect-local-deps/usr/bin:$PATH \
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-} \
  npm run test:db:smoke
```

Expected: 2 DB smoke tests pass. If `/tmp/careconnect-local-deps` was cleared, recreate it from the existing commands in `docs/launch/brampton-manual-qa.md` and rerun.

- [ ] **Step 5: Run full Vitest if time allows**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm test -- --run
```

Expected: full Vitest suite passes. Record exact file/test counts in the readiness report.

- [ ] **Step 6: Update closeout docs with exact evidence**

Update:

- `docs/launch/brampton-manual-qa.md`: strict Axe, existing a11y, visual QA, semantic-worker console status.
- `docs/launch/brampton-readiness-report.md`: verification commands, observed status, residual human gates.
- `docs/launch/brampton-rollout-checklist.md`: mark local QA remediations complete; leave production migration, deploy/merge, land acknowledgment, and partner wording unchecked.
- `docs/launch/brampton-pr-description.md`: add closeout verification summary.

- [ ] **Step 7: Check for accidental data or generated-artifact changes**

Run:

```bash
git diff -- data/services.json data/embeddings.json
git status --short
```

Expected: no changes to `data/services.json` or `data/embeddings.json`; only planned code, test, and docs files are changed.

- [ ] **Step 8: Commit final closeout**

Run:

```bash
git add app components hooks lib tests docs data/drafts/brampton-on/reviews
git diff --cached --check
git commit -m "fix: close brampton launch qa follow-ups"
```

Expected: whitespace check passes and commit succeeds.

## Self-Review Checklist

- [ ] Strict Axe regression exists and fails on the previously logged issue classes before remediation.
- [ ] `/en?q=health` no longer has focusable content inside `aria-hidden`.
- [ ] Recorded contrast failures are fixed across homepage, search results, dashboard, submit-service, and service-detail routes.
- [ ] Semantic worker failure no longer creates an unhandled rejection; keyword search remains available.
- [ ] Desktop, tablet, and mobile visual QA evidence is recorded.
- [ ] Production approval packet exists and does not execute production changes.
- [ ] Public-positioning drafts distinguish sources from partnerships.
- [ ] Land acknowledgment wording remains draft-only and approval-gated.
- [ ] Future Brampton candidate queue is draft-only.
- [ ] `data/services.json` and `data/embeddings.json` are unchanged by this closeout unless a later human approval explicitly changes that scope.
- [ ] Production migration, deploy/merge, final land acknowledgment, and official/partner wording remain human approval gates.
